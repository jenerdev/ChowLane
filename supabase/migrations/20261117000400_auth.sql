-- ChowLane Phase 2 · Milestone 2.3 — auth: new-tenant settings, signup, invites, customer first visit.

-- ------------------------------------------------------------------ D-061: a new business starts "not set"
-- Delivery fee and rider pay stay empty until the owner sets them (setup checklist); checkout is closed until the
-- delivery fee is set. Dispatch starts MANUAL.
alter table public.tenant_settings
  alter column delivery_fee drop not null,
  alter column rider_pay drop not null,
  alter column dispatch_mode set default 'MANUAL',
  drop constraint tenant_settings_delivery_fee_check,
  drop constraint tenant_settings_rider_pay_check,
  add constraint tenant_settings_delivery_fee_check
    check (delivery_fee is null or public.is_valid_delivery_fee(delivery_fee)),
  add constraint tenant_settings_rider_pay_check
    check (rider_pay is null or public.is_valid_rider_pay(rider_pay));

-- ------------------------------------------------------------------ permission check for server actions
-- Lets a server action ask "may the signed-in user do X in tenant T?" before using the admin API (e.g. setting a
-- rider's password). Same rule as the RLS policies (BL-2).
create function public.has_permission(p_tenant uuid, p_perm public.permission_key) returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.has_perm(p_tenant, p_perm) and private.tenant_is_active(p_tenant)
$$;
revoke execute on function public.has_permission(uuid, public.permission_key) from public, anon;
grant execute on function public.has_permission(uuid, public.permission_key) to authenticated;

-- ------------------------------------------------------------------ owner signup (BL-1.1, BL-15)
-- Called by the landing signup server action with the service role, right after it created the owner's login.
-- Inputs are validated there with packages/lib (slug rules, password, PH mobile); defaults that are business rules
-- (default Admin role permissions, loyalty settings) are passed in from packages/lib too.
create function public.create_tenant(
  p_owner_auth_id uuid,
  p_owner_name text,
  p_owner_email text,
  p_business_name text,
  p_short_name text,
  p_slug text,
  p_primary_color text,
  p_background_color text,
  p_center_lat double precision,
  p_center_lng double precision,
  p_radius_km numeric,
  p_admin_permissions public.permission_key[],
  p_loyalty jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
begin
  -- BL-15.3: radius 1–15 km
  if p_radius_km < 1 or p_radius_km > 15 then
    raise exception 'delivery radius must be 1–15 km' using errcode = '22023';
  end if;

  insert into public.tenants (id, slug, business_name, short_name, primary_color, background_color, owner_id)
  values (v_tenant, p_slug, p_business_name, p_short_name, p_primary_color, p_background_color, v_owner);

  insert into public.staff_users (id, tenant_id, auth_user_id, name, email, type, status)
  values (v_owner, v_tenant, p_owner_auth_id, p_owner_name, p_owner_email, 'OWNER', 'ACTIVE');

  insert into public.tenant_settings (tenant_id, service_area_lat, service_area_lng, service_area_radius_km, loyalty)
  values (v_tenant, p_center_lat, p_center_lng, p_radius_km, p_loyalty);

  -- BL-2.3: default "Admin" role
  insert into public.roles (tenant_id, name, permissions, is_default)
  values (v_tenant, 'Admin', p_admin_permissions, true);

  -- BL-15.4 / BL-10.7: new tenants start on the FREE plan
  insert into public.tenant_billing (tenant_id, model) values (v_tenant, 'FREE');

  return v_tenant;
end
$$;
revoke execute on function public.create_tenant from public, anon, authenticated;
grant execute on function public.create_tenant to service_role;

-- ------------------------------------------------------------------ staff invite → first login (BL-2.6)
-- An admin row is created INVITED by someone with admins.manage. On first login the signed-in user whose email
-- matches is linked to it and becomes ACTIVE. Returns the staff id, or null when there is no invite.
create function public.accept_staff_invite(p_tenant uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  v_staff uuid;
begin
  select email into v_email from auth.users where id = (select auth.uid());
  if v_email is null then
    return null;
  end if;

  update public.staff_users
     set auth_user_id = (select auth.uid()), status = 'ACTIVE'
   where tenant_id = p_tenant and lower(email) = lower(v_email) and status = 'INVITED' and auth_user_id is null
  returning id into v_staff;

  return v_staff;
end
$$;
revoke execute on function public.accept_staff_invite(uuid) from public, anon;
grant execute on function public.accept_staff_invite(uuid) to authenticated;

-- ------------------------------------------------------------------ customer first visit (Q-31, BL-3.1)
-- One login, one customer row per tenant. Creates the row on the first visit to a tenant's customer app, using
-- the Facebook profile (name, picture, Facebook id) from the login. Returns the customer id.
create function public.ensure_customer(p_tenant uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_customer uuid;
  v_meta jsonb;
  v_email text;
  v_facebook text;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select id into v_customer from public.customers where tenant_id = p_tenant and auth_user_id = v_uid;
  if v_customer is not null then
    return v_customer;
  end if;

  if not private.tenant_is_active(p_tenant) then
    raise exception 'this business is not taking orders right now' using errcode = '42501';
  end if;
  -- staff and riders of a business are not its customers through this path
  if exists (select 1 from public.staff_users where tenant_id = p_tenant and auth_user_id = v_uid)
     or exists (select 1 from public.riders where tenant_id = p_tenant and auth_user_id = v_uid) then
    raise exception 'this login belongs to the business team' using errcode = '42501';
  end if;

  select raw_user_meta_data, email into v_meta, v_email from auth.users where id = v_uid;
  select provider_id into v_facebook from auth.identities where user_id = v_uid and provider = 'facebook' limit 1;

  insert into public.customers (tenant_id, auth_user_id, facebook_id, name, email, avatar_url)
  values (
    p_tenant,
    v_uid,
    coalesce(v_facebook, 'auth:' || v_uid::text),
    coalesce(nullif(v_meta ->> 'full_name', ''), nullif(v_meta ->> 'name', ''), split_part(v_email, '@', 1), 'Customer'),
    v_email,
    coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture', '')
  )
  returning id into v_customer;

  return v_customer;
end
$$;
revoke execute on function public.ensure_customer(uuid) from public, anon;
grant execute on function public.ensure_customer(uuid) to authenticated;

-- ------------------------------------------------------------------ removing an admin (Admins screen, BL-2.6)
-- "They lose access right away. Their past actions stay in the order history": the row goes, history rows stay and
-- only lose the link to the removed admin. The owner can't be removed and nobody removes themselves.
alter table public.orders
  drop constraint orders_approved_by_tenant_id_fkey,
  add constraint orders_approved_by_tenant_id_fkey foreign key (approved_by, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (approved_by),
  drop constraint orders_offer_staff_id_tenant_id_fkey,
  add constraint orders_offer_staff_id_tenant_id_fkey foreign key (offer_staff_id, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (offer_staff_id);
alter table public.assignment_attempts
  drop constraint assignment_attempts_staff_id_tenant_id_fkey,
  add constraint assignment_attempts_staff_id_tenant_id_fkey foreign key (staff_id, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (staff_id);
alter table public.verifications
  drop constraint verifications_reviewed_by_tenant_id_fkey,
  add constraint verifications_reviewed_by_tenant_id_fkey foreign key (reviewed_by, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (reviewed_by);
alter table public.coupons
  drop constraint coupons_created_by_tenant_id_fkey,
  add constraint coupons_created_by_tenant_id_fkey foreign key (created_by, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (created_by);
alter table public.shifts
  drop constraint shifts_remit_received_by_tenant_id_fkey,
  add constraint shifts_remit_received_by_tenant_id_fkey foreign key (remit_received_by, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (remit_received_by);
-- Manual point adjustments (BL-14.8) keep their reason; the staff link may become null after the admin is removed.
alter table public.loyalty_transactions
  drop constraint loyalty_transactions_staff_id_tenant_id_fkey,
  add constraint loyalty_transactions_staff_id_tenant_id_fkey foreign key (staff_id, tenant_id)
    references public.staff_users (id, tenant_id) on delete set null (staff_id),
  drop constraint loyalty_transactions_check,
  add constraint loyalty_transactions_check check (kind <> 'POINTS_ADJUSTED' or note is not null);

create policy staff_users_delete on public.staff_users for delete to authenticated
  using (type = 'ADMIN' and auth_user_id is distinct from (select auth.uid())
    and (select private.has_perm(tenant_id, 'admins.manage')) and (select private.tenant_is_active(tenant_id)));
grant delete on public.staff_users to authenticated;

-- ------------------------------------------------------------------ invite resend helper (server only)
-- Is there a login for this email, and is it linked to anyone (staff, rider, customer, platform admin)? An
-- unlinked login is a leftover invite that "Resend invite" may replace; a linked one is never touched.
create function public.auth_login_status(p_email text)
returns table (user_id uuid, in_use boolean)
language sql stable security definer set search_path = '' as $$
  select u.id,
         exists (select 1 from public.staff_users s where s.auth_user_id = u.id)
      or exists (select 1 from public.riders r where r.auth_user_id = u.id)
      or exists (select 1 from public.customers c where c.auth_user_id = u.id)
      or exists (select 1 from public.platform_admins p where p.auth_user_id = u.id)
  from auth.users u where lower(u.email) = lower(p_email)
$$;
revoke execute on function public.auth_login_status(text) from public, anon, authenticated;
grant execute on function public.auth_login_status(text) to service_role;
