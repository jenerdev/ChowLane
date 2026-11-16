-- ChowLane Phase 2 · Milestone 2.2 — Row Level Security (PHASE-2-PLAN "Security — RLS model", BL-1.2, BL-2.4).
--
-- Who is the caller? auth.uid() is matched against platform_admins / staff_users / riders / customers.auth_user_id.
-- Helpers live in the non-exposed `private` schema as SECURITY DEFINER (they read the identity tables without
-- recursing into RLS) and are wrapped in (select …) inside policies so Postgres evaluates them once per query.
--
-- Reads: per role and per permission key (BL-2). Platform admin reads everything (BL-10.2).
-- Direct writes are allowed only for simple CRUD tables and only for ACTIVE tenants (BL-10.8: a suspended tenant's
-- console is read-only). Orders, shifts, verifications, coupon redemptions and loyalty changes have NO write
-- policies: they change only through Postgres functions (Milestones 2.3–2.7) so multi-row rules stay atomic.
-- Column-level GRANTs stop users from writing fields that functions own (status, balances, counters …).

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ------------------------------------------------------------------ identity helpers
create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins
    where auth_user_id = (select auth.uid()) and status = 'ACTIVE'
  )
$$;

-- Tenants where the caller is ACTIVE staff (owner or admin).
create function private.staff_tenant_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(tenant_id), '{}') from public.staff_users
  where auth_user_id = (select auth.uid()) and status = 'ACTIVE'
$$;

-- BL-2.1: the owner holds every permission; an admin holds the permissions of their role.
create function private.has_perm(p_tenant uuid, p_perm public.permission_key) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_users s
    left join public.roles r on r.id = s.role_id
    where s.tenant_id = p_tenant and s.auth_user_id = (select auth.uid()) and s.status = 'ACTIVE'
      and (s.type = 'OWNER' or p_perm = any (r.permissions))
  )
$$;

create function private.has_any_perm(p_tenant uuid, p_perms public.permission_key[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_users s
    left join public.roles r on r.id = s.role_id
    where s.tenant_id = p_tenant and s.auth_user_id = (select auth.uid()) and s.status = 'ACTIVE'
      and (s.type = 'OWNER' or r.permissions && p_perms)
  )
$$;

create function private.is_owner(p_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_users
    where tenant_id = p_tenant and auth_user_id = (select auth.uid()) and status = 'ACTIVE' and type = 'OWNER'
  )
$$;

-- Rider / customer rows that belong to the caller (one per tenant).
create function private.my_rider_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(id), '{}') from public.riders
  where auth_user_id = (select auth.uid()) and status = 'ACTIVE'
$$;

create function private.my_customer_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(id), '{}') from public.customers where auth_user_id = (select auth.uid())
$$;

create function private.rider_tenant_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(tenant_id), '{}') from public.riders
  where auth_user_id = (select auth.uid()) and status = 'ACTIVE'
$$;

create function private.customer_tenant_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(tenant_id), '{}') from public.customers where auth_user_id = (select auth.uid())
$$;

create function private.tenant_is_active(p_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tenants where id = p_tenant and status = 'ACTIVE')
$$;

-- Orders a customer may see the rider of / a rider may see the customer of.
create function private.order_is_live(p_status public.order_status) returns boolean
language sql immutable set search_path = '' as $$
  select p_status in ('ASSIGNED', 'AT_MERCHANT', 'PICKED_UP')
$$;

grant execute on all functions in schema private to anon, authenticated;

-- ------------------------------------------------------------------ enable RLS everywhere
alter table public.platform_admins enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.barangay_fees enable row level security;
alter table public.tenant_billing enable row level security;
alter table public.billing_statements enable row level security;
alter table public.roles enable row level security;
alter table public.staff_users enable row level security;
alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.riders enable row level security;
alter table public.shifts enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.verifications enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.assignment_attempts enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.loyalty_transactions enable row level security;

-- ------------------------------------------------------------------ table privileges
-- Start from nothing and grant only what the policies below need. anon never writes; reads go through the public
-- policies/views. service_role (server-side admin tasks) keeps full access and bypasses RLS.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;

-- ================================================================== platform
create policy platform_admins_read on public.platform_admins for select to authenticated
  using (auth_user_id = (select auth.uid()) or (select private.is_platform_admin()));

-- BL-10.3/10.6: billing is read by the owner, written only by the platform admin.
create policy tenant_billing_read on public.tenant_billing for select to authenticated
  using ((select private.is_platform_admin()) or (select private.is_owner(tenant_id)));
create policy tenant_billing_platform_insert on public.tenant_billing for insert to authenticated
  with check ((select private.is_platform_admin()));
create policy tenant_billing_platform_update on public.tenant_billing for update to authenticated
  using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
grant insert, update on public.tenant_billing to authenticated;

create policy billing_statements_read on public.billing_statements for select to authenticated
  using ((select private.is_platform_admin()) or (select private.is_owner(tenant_id)));
create policy billing_statements_platform_insert on public.billing_statements for insert to authenticated
  with check ((select private.is_platform_admin()));
create policy billing_statements_platform_update on public.billing_statements for update to authenticated
  using ((select private.is_platform_admin()) and status = 'UNPAID')   -- BL-10.12: PAID / WAIVED are final
  with check ((select private.is_platform_admin()));
grant insert on public.billing_statements to authenticated;
grant update (status, paid_at, note) on public.billing_statements to authenticated;

-- ================================================================== tenants & settings
-- Anyone signed in to a tenant (staff, rider, customer) reads its row; the public reads branding via tenants_public.
create policy tenants_read on public.tenants for select to authenticated
  using (
    (select private.is_platform_admin())
    or id = any ((select private.staff_tenant_ids())::uuid[])
    or id = any ((select private.rider_tenant_ids())::uuid[])
    or id = any ((select private.customer_tenant_ids())::uuid[])
  );
-- settings.business edits branding; status / suspend_reason only via the platform function (2.7).
create policy tenants_branding_update on public.tenants for update to authenticated
  using ((select private.has_perm(id, 'settings.business')) and status = 'ACTIVE')
  with check ((select private.has_perm(id, 'settings.business')) and status = 'ACTIVE');
grant update (business_name, short_name, logo_url, primary_color, background_color, pwa_icons)
  on public.tenants to authenticated;

-- Settings incl. rider pay: staff and riders of the tenant. Customers read tenant_settings_public (no rider pay).
create policy tenant_settings_read on public.tenant_settings for select to authenticated
  using (
    (select private.is_platform_admin())
    or tenant_id = any ((select private.staff_tenant_ids())::uuid[])
    or tenant_id = any ((select private.rider_tenant_ids())::uuid[])
  );
-- Row-level: any settings permission. Column-level per permission: trigger tenant_settings_guard (guards migration).
create policy tenant_settings_update on public.tenant_settings for update to authenticated
  using (
    (select private.has_any_perm(tenant_id, '{settings.business,settings.pricing,settings.riderPay,settings.dispatch,settings.loyalty}'))
    and (select private.tenant_is_active(tenant_id))
  )
  with check ((select private.tenant_is_active(tenant_id)));
grant update (service_area_lat, service_area_lng, service_area_radius_km, delivery_fee, rider_pay,
  auto_approve_verified_customers, dispatch_mode, rider_response_timeout_sec, accepted_id_types,
  max_order_subtotal, pin_adjust_radius_m, loyalty) on public.tenant_settings to authenticated;

-- Barangay price list: public for ACTIVE rows of ACTIVE tenants (checkout), staff see all, settings.pricing edits.
create policy barangay_fees_public_read on public.barangay_fees for select to anon, authenticated
  using (is_active and (select private.tenant_is_active(tenant_id)));
create policy barangay_fees_staff_read on public.barangay_fees for select to authenticated
  using ((select private.is_platform_admin()) or tenant_id = any ((select private.staff_tenant_ids())::uuid[]));
create policy barangay_fees_write on public.barangay_fees for all to authenticated
  using ((select private.has_perm(tenant_id, 'settings.pricing')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'settings.pricing')) and (select private.tenant_is_active(tenant_id)));
grant select on public.barangay_fees to anon;
grant insert, update, delete on public.barangay_fees to authenticated;

-- ================================================================== staff & roles
create policy roles_read on public.roles for select to authenticated
  using ((select private.is_platform_admin()) or tenant_id = any ((select private.staff_tenant_ids())::uuid[]));
create policy roles_insert on public.roles for insert to authenticated
  with check ((select private.has_perm(tenant_id, 'admins.manage')) and (select private.tenant_is_active(tenant_id)));
create policy roles_update on public.roles for update to authenticated
  using ((select private.has_perm(tenant_id, 'admins.manage')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'admins.manage')));
-- BL-2.5: the default Admin role can't be deleted; a role with admins is protected by the FK (on delete restrict).
create policy roles_delete on public.roles for delete to authenticated
  using (not is_default and (select private.has_perm(tenant_id, 'admins.manage'))
    and (select private.tenant_is_active(tenant_id)));
grant insert (tenant_id, name, permissions), update (name, permissions), delete on public.roles to authenticated;

create policy staff_users_read on public.staff_users for select to authenticated
  using (
    (select private.is_platform_admin())
    or tenant_id = any ((select private.staff_tenant_ids())::uuid[])
    or auth_user_id = (select auth.uid())          -- an INVITED / INACTIVE user can still see their own row
  );
-- BL-2.6: admins.manage adds and edits ADMIN rows; the owner row can't be edited here; no deletes (turn off instead).
create policy staff_users_insert on public.staff_users for insert to authenticated
  with check (type = 'ADMIN' and auth_user_id is null
    and (select private.has_perm(tenant_id, 'admins.manage')) and (select private.tenant_is_active(tenant_id)));
create policy staff_users_update on public.staff_users for update to authenticated
  using (type = 'ADMIN' and (select private.has_perm(tenant_id, 'admins.manage'))
    and (select private.tenant_is_active(tenant_id)))
  with check (type = 'ADMIN');
grant insert (tenant_id, name, email, avatar_url, type, role_id, status),
  update (name, email, avatar_url, role_id, status) on public.staff_users to authenticated;

-- ================================================================== catalog
create policy merchants_public_read on public.merchants for select to anon, authenticated
  using (status = 'ACTIVE' and (select private.tenant_is_active(tenant_id)));
create policy merchants_tenant_read on public.merchants for select to authenticated
  using (
    (select private.is_platform_admin())
    or tenant_id = any ((select private.staff_tenant_ids())::uuid[])
    or tenant_id = any ((select private.rider_tenant_ids())::uuid[])
  );
create policy merchants_write on public.merchants for all to authenticated
  using ((select private.has_perm(tenant_id, 'merchants.manage')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'merchants.manage')) and (select private.tenant_is_active(tenant_id)));
grant select on public.merchants to anon;
grant insert, update, delete on public.merchants to authenticated;

-- Products hold store_price (the business's cost), so the public menu is the products_public view.
create policy products_tenant_read on public.products for select to authenticated
  using ((select private.is_platform_admin()) or tenant_id = any ((select private.staff_tenant_ids())::uuid[]));
create policy products_write on public.products for all to authenticated
  using ((select private.has_perm(tenant_id, 'products.manage')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'products.manage')) and (select private.tenant_is_active(tenant_id)));
grant insert, update, delete on public.products to authenticated;

-- ================================================================== riders & shifts
create policy riders_read on public.riders for select to authenticated
  using (
    (select private.is_platform_admin())
    or (select private.has_any_perm(tenant_id,
      '{riders.view,riders.manage,orders.view,orders.assign,cash.manage,reports.view}'))
    or id = any ((select private.my_rider_ids())::uuid[])
    or auth_user_id = (select auth.uid())
    -- a customer sees the rider of their order while it is on the way
    or exists (
      select 1 from public.orders o
      where o.rider_id = riders.id and o.customer_id = any ((select private.my_customer_ids())::uuid[])
        and private.order_is_live(o.status)
    )
  );
create policy riders_insert on public.riders for insert to authenticated
  with check (auth_user_id is null and (select private.has_perm(tenant_id, 'riders.manage'))
    and (select private.tenant_is_active(tenant_id)));
create policy riders_update on public.riders for update to authenticated
  using ((select private.has_perm(tenant_id, 'riders.manage')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'riders.manage')));
create policy riders_delete on public.riders for delete to authenticated
  using ((select private.has_perm(tenant_id, 'riders.manage')) and (select private.tenant_is_active(tenant_id)));
-- Shift/location/active-order fields are owned by the rider functions (2.6); pay_override also needs
-- settings.riderPay (trigger riders_guard).
grant insert (tenant_id, name, phone, email, photo_url, vehicle_type, plate_number, pay_override, status),
  update (name, phone, email, photo_url, vehicle_type, plate_number, pay_override, status),
  delete on public.riders to authenticated;

create policy shifts_read on public.shifts for select to authenticated
  using (
    (select private.is_platform_admin())
    or (select private.has_any_perm(tenant_id, '{riders.view,riders.manage,cash.manage,reports.view}'))
    or rider_id = any ((select private.my_rider_ids())::uuid[])
  );

-- ================================================================== customers
create policy customers_read on public.customers for select to authenticated
  using (
    (select private.is_platform_admin())
    or auth_user_id = (select auth.uid())
    or (select private.has_any_perm(tenant_id,
      '{customers.view,customers.verify,orders.view,orders.approve,orders.assign,orders.cancel,loyalty.manage,reports.view}'))
    -- a rider sees the customer of the order they are delivering (BL-5.15: only after accepting)
    or exists (
      select 1 from public.orders o
      where o.customer_id = customers.id and o.rider_id = any ((select private.my_rider_ids())::uuid[])
        and private.order_is_live(o.status)
    )
  );
-- A customer edits their own profile fields; verification status and loyalty balances change via functions.
create policy customers_update_own on public.customers for update to authenticated
  using (auth_user_id = (select auth.uid())) with check (auth_user_id = (select auth.uid()));
grant update (name, email, phone, avatar_url, location_permission) on public.customers to authenticated;

create policy customer_addresses_read on public.customer_addresses for select to authenticated
  using (
    (select private.is_platform_admin())
    or customer_id = any ((select private.my_customer_ids())::uuid[])
    or (select private.has_any_perm(tenant_id, '{customers.view,customers.verify}'))
  );
create policy customer_addresses_own_write on public.customer_addresses for all to authenticated
  using (customer_id = any ((select private.my_customer_ids())::uuid[]))
  with check (customer_id = any ((select private.my_customer_ids())::uuid[]));
grant insert, update, delete on public.customer_addresses to authenticated;

-- BL-3.7: ID images are visible only to customers.verify (and the owner, who has every permission).
create policy verifications_read on public.verifications for select to authenticated
  using (
    (select private.is_platform_admin())
    or customer_id = any ((select private.my_customer_ids())::uuid[])
    or (select private.has_perm(tenant_id, 'customers.verify'))
  );

-- ================================================================== coupons (customers check codes via a function — 2.5)
create policy coupons_read on public.coupons for select to authenticated
  using (
    (select private.is_platform_admin())
    or (select private.has_any_perm(tenant_id, '{coupons.manage,orders.view,reports.view}'))
  );
create policy coupons_insert on public.coupons for insert to authenticated
  with check ((select private.has_perm(tenant_id, 'coupons.manage')) and (select private.tenant_is_active(tenant_id)));
create policy coupons_update on public.coupons for update to authenticated
  using ((select private.has_perm(tenant_id, 'coupons.manage')) and (select private.tenant_is_active(tenant_id)))
  with check ((select private.has_perm(tenant_id, 'coupons.manage')));
-- BL-13.10: a used coupon can't be deleted, only turned off.
create policy coupons_delete on public.coupons for delete to authenticated
  using (used_count = 0 and (select private.has_perm(tenant_id, 'coupons.manage'))
    and (select private.tenant_is_active(tenant_id)));
grant insert (tenant_id, code, description, type, percent_off, max_discount, min_order_subtotal, max_uses,
    per_customer_limit, valid_from, valid_until, is_active, created_by),
  update (code, description, type, percent_off, max_discount, min_order_subtotal, max_uses, per_customer_limit,
    valid_from, valid_until, is_active),
  delete on public.coupons to authenticated;

-- ================================================================== orders (writes only via functions)
create policy orders_read on public.orders for select to authenticated
  using (
    (select private.is_platform_admin())
    or customer_id = any ((select private.my_customer_ids())::uuid[])
    or rider_id = any ((select private.my_rider_ids())::uuid[])   -- open offers: limited offer view function (2.6, BL-5.15)
    or (select private.has_any_perm(tenant_id,
      '{orders.view,orders.approve,orders.assign,orders.cancel,customers.verify,cash.manage,reports.view}'))
  );

create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id));   -- = orders_read
create policy order_events_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_events.order_id));  -- = orders_read

create policy assignment_attempts_read on public.assignment_attempts for select to authenticated
  using (
    (select private.is_platform_admin())
    or rider_id = any ((select private.my_rider_ids())::uuid[])
    or (select private.has_any_perm(tenant_id, '{orders.view,orders.approve,orders.assign,orders.cancel,reports.view}'))
  );

create policy coupon_redemptions_read on public.coupon_redemptions for select to authenticated
  using (
    (select private.is_platform_admin())
    or customer_id = any ((select private.my_customer_ids())::uuid[])
    or (select private.has_any_perm(tenant_id, '{coupons.manage,orders.view,reports.view}'))
  );

create policy loyalty_transactions_read on public.loyalty_transactions for select to authenticated
  using (
    (select private.is_platform_admin())
    or customer_id = any ((select private.my_customer_ids())::uuid[])
    or (select private.has_any_perm(tenant_id, '{customers.view,loyalty.manage}'))
  );
