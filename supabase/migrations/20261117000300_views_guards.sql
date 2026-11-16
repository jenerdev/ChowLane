-- ChowLane Phase 2 · Milestone 2.2 — public views and permission guards.

-- ------------------------------------------------------------------ public views
-- These run with the view owner's rights (security_invoker = false) on purpose: they expose only public columns,
-- so the login screen, the customer menu and the PWA manifest can read them without seeing private fields.

-- Branding by slug (login screens, manifests, "temporarily unavailable" page — BL-10.8 needs the status).
create view public.tenants_public with (security_invoker = false) as
  select id, slug, business_name, short_name, logo_url, primary_color, background_color, currency, timezone,
         pwa_icons, status
  from public.tenants;

-- Checkout rules without rider pay (BL-8 is internal).
create view public.tenant_settings_public with (security_invoker = false) as
  select s.tenant_id, s.service_area_lat, s.service_area_lng, s.service_area_radius_km, s.delivery_fee,
         s.auto_approve_verified_customers, s.accepted_id_types, s.max_order_subtotal, s.pin_adjust_radius_m,
         s.loyalty
  from public.tenant_settings s
  join public.tenants t on t.id = s.tenant_id
  where t.status = 'ACTIVE';

-- Customer menu: products of ACTIVE merchants of ACTIVE tenants, without store_price (the business's cost).
create view public.products_public with (security_invoker = false) as
  select p.id, p.tenant_id, p.merchant_id, p.name, p.category, p.description, p.price, p.image_url,
         p.is_available, p.sort_order
  from public.products p
  join public.merchants m on m.id = p.merchant_id and m.status = 'ACTIVE'
  join public.tenants t on t.id = p.tenant_id and t.status = 'ACTIVE';

revoke all on public.tenants_public, public.tenant_settings_public, public.products_public from anon, authenticated;
grant select on public.tenants_public, public.tenant_settings_public, public.products_public to anon, authenticated;

-- ------------------------------------------------------------------ guards (column-level permissions)
-- Apply to signed-in users only. Postgres functions (SECURITY DEFINER, run as the owner) and service_role skip them.
create function private.acting_as_user() returns boolean
language sql stable set search_path = '' as $$
  select current_user = 'authenticated'
$$;

create function private.require_perm(p_tenant uuid, p_perm public.permission_key) returns void
language plpgsql stable set search_path = '' as $$
begin
  if not private.has_perm(p_tenant, p_perm) then
    raise exception 'permission denied: % is required', p_perm using errcode = '42501';
  end if;
end
$$;

-- Each settings group needs its own permission — same split as the console settings screens.
create function private.tenant_settings_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not private.acting_as_user() then
    return new;
  end if;
  if (new.service_area_lat, new.service_area_lng, new.service_area_radius_km, new.accepted_id_types,
      new.pin_adjust_radius_m)
     is distinct from
     (old.service_area_lat, old.service_area_lng, old.service_area_radius_km, old.accepted_id_types,
      old.pin_adjust_radius_m) then
    perform private.require_perm(new.tenant_id, 'settings.business');
  end if;
  if (new.delivery_fee, new.max_order_subtotal, new.auto_approve_verified_customers)
     is distinct from (old.delivery_fee, old.max_order_subtotal, old.auto_approve_verified_customers) then
    perform private.require_perm(new.tenant_id, 'settings.pricing');
  end if;
  if new.rider_pay is distinct from old.rider_pay then
    perform private.require_perm(new.tenant_id, 'settings.riderPay');
  end if;
  if (new.dispatch_mode, new.rider_response_timeout_sec)
     is distinct from (old.dispatch_mode, old.rider_response_timeout_sec) then
    perform private.require_perm(new.tenant_id, 'settings.dispatch');
  end if;
  if new.loyalty is distinct from old.loyalty then
    perform private.require_perm(new.tenant_id, 'settings.loyalty');
  end if;
  return new;
end
$$;
create trigger tenant_settings_guard before update on public.tenant_settings
  for each row execute function private.tenant_settings_guard();

-- A rider's personal pay rule is rider income → settings.riderPay (BL-8.2; rider form gates it the same way).
create function private.riders_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.acting_as_user()
     and new.pay_override is distinct from (case when tg_op = 'UPDATE' then old.pay_override end) then
    perform private.require_perm(new.tenant_id, 'settings.riderPay');
  end if;
  return new;
end
$$;
create trigger riders_guard before insert or update on public.riders
  for each row execute function private.riders_guard();

-- Coupons: code stored uppercase (BL-13.5); code and discount can't change after first use (BL-13.10).
create function private.coupons_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.code := upper(new.code);
  if tg_op = 'UPDATE' and old.used_count > 0
     and (new.code, new.type, new.percent_off, new.max_discount)
         is distinct from (old.code, old.type, old.percent_off, old.max_discount) then
    raise exception 'coupon % has been used: code and discount can no longer change', old.code
      using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger coupons_guard before insert or update on public.coupons
  for each row execute function private.coupons_guard();
