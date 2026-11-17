-- ChowLane Phase 2 · Milestone 2.5 — ordering: place / cancel orders, ID submissions and review, approve / reject.
--
-- place_order is called by the customer app's server action with the service role, after it priced the order with
-- packages/lib on data read server-side (menu incl. store prices, coupon, settings). The function re-checks the
-- invariants that must hold under concurrency (coupon limits, balances, verification, totals) inside one transaction.
-- Every other function here is called with the user's own session and checks who they are itself.

-- ------------------------------------------------------------------ helpers
create function private.add_order_event(
  p_order uuid, p_status public.order_status, p_actor public.actor_type, p_actor_id uuid, p_note text
) returns void
language sql security definer set search_path = '' as $$
  insert into public.order_events (tenant_id, order_id, status, actor_type, actor_id, note)
  select tenant_id, id, p_status, p_actor, p_actor_id, nullif(btrim(p_note), '')
  from public.orders where id = p_order
$$;

-- The signed-in staff member of a tenant who holds a permission (BL-2), or an error.
create function private.staff_with_perm(p_tenant uuid, p_perm public.permission_key)
returns table (staff_id uuid, actor public.actor_type)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_perm(p_tenant, p_perm) or not private.tenant_is_active(p_tenant) then
    raise exception 'permission denied: % is required', p_perm using errcode = '42501';
  end if;
  return query
    select s.id, (case when s.type = 'OWNER' then 'OWNER' else 'ADMIN' end)::public.actor_type
    from public.staff_users s
    where s.tenant_id = p_tenant and s.auth_user_id = (select auth.uid()) and s.status = 'ACTIVE';
end
$$;

-- Give back what a rejected / cancelled order used: the coupon use (BL-13.7) and points / rewards (BL-14.7).
create function private.release_promos(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order;
  if o.coupon_id is not null then
    update public.coupon_redemptions set released = true where order_id = o.id and not released;
    update public.coupons set used_count = greatest(used_count - 1, 0) where id = o.coupon_id;
  end if;
  if o.points_redeemed > 0 then
    update public.customers set loyalty_points = loyalty_points + o.points_redeemed where id = o.customer_id;
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, o.customer_id, o.id, 'POINTS_REFUNDED', o.points_redeemed, 0);
  end if;
  if o.used_free_delivery_reward then
    update public.customers set loyalty_free_delivery_rewards = loyalty_free_delivery_rewards + 1
     where id = o.customer_id;
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, o.customer_id, o.id, 'FREE_DELIVERY_REFUNDED', 0, 1);
  end if;
  if o.used_free_gift_reward then
    update public.customers set loyalty_free_gift_rewards = loyalty_free_gift_rewards + 1 where id = o.customer_id;
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, o.customer_id, o.id, 'FREE_GIFT_REFUNDED', 0, 1);
  end if;
end
$$;

-- Reject or cancel: status + reason, withdraw an open rider offer, free the rider, give promos back, timeline.
create function private.close_order(
  p_order uuid, p_status public.order_status, p_actor public.actor_type, p_actor_id uuid, p_reason text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
     set status = p_status,
         reject_reason = case when p_status = 'REJECTED' then p_reason else reject_reason end,
         cancel_reason = case when p_status = 'CANCELLED' then p_reason else cancel_reason end,
         offer_rider_id = null, offer_offered_at = null, offer_expires_at = null, offer_by = null,
         offer_staff_id = null
   where id = p_order;
  update public.assignment_attempts set response = 'WITHDRAWN', responded_at = now()
   where order_id = p_order and response is null;
  update public.riders set active_order_id = null where active_order_id = p_order;
  perform private.release_promos(p_order);
  perform private.add_order_event(p_order, p_status, p_actor, p_actor_id, p_reason);
end
$$;

-- "<uuid>" at position p_index of a storage path ("<tenant>/<customer>/file.jpg"), or null.
create function private.path_uuid(p_name text, p_index integer) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return (storage.foldername(p_name))[p_index]::uuid;
exception when invalid_text_representation then
  return null;
end
$$;
grant execute on function private.path_uuid(text, integer) to anon, authenticated;

-- ------------------------------------------------------------------ place order (CUS-005, BL-4.1, BL-4.6, BL-13, BL-14)
create function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid := (p ->> 'tenant_id')::uuid;
  v_customer uuid := (p ->> 'customer_id')::uuid;
  v_order uuid := gen_random_uuid();
  t public.tenants;
  s public.tenant_settings;
  m public.merchants;
  c public.customers;
  cp public.coupons;
  v_ver jsonb := nullif(p -> 'verification', 'null'::jsonb);
  v_status public.order_status;
  v_prefix text;
  v_number text;
  v_items_total integer;
  v_my_uses integer;
  v_points integer := coalesce((p ->> 'points_redeemed')::integer, 0);
  v_free_delivery boolean := coalesce((p ->> 'used_free_delivery_reward')::boolean, false);
  v_free_gift boolean := coalesce((p ->> 'used_free_gift_reward')::boolean, false);
  v_item jsonb;
  v_line integer := 0;
begin
  select * into t from public.tenants where id = v_tenant;
  if t.id is null or t.status <> 'ACTIVE' then
    raise exception 'This business isn''t taking orders right now.' using errcode = 'P0001';
  end if;
  select * into s from public.tenant_settings where tenant_id = v_tenant;
  if s.delivery_fee is null then
    raise exception 'This business isn''t taking orders yet.' using errcode = 'P0001';  -- D-061
  end if;
  select * into m from public.merchants where id = (p ->> 'merchant_id')::uuid and tenant_id = v_tenant;
  if m.id is null or m.status <> 'ACTIVE' or not m.is_open then
    raise exception 'This restaurant is closed right now.' using errcode = 'P0001';
  end if;
  select * into c from public.customers where id = v_customer and tenant_id = v_tenant for update;
  if c.id is null then
    raise exception 'customer not found' using errcode = 'P0001';
  end if;

  -- BL-3.3 / D-024: the first order (or the next one after a rejected ID) is placed together with an ID.
  if c.verification_status in ('UNVERIFIED', 'REJECTED') then
    if v_ver is null then
      raise exception 'Send your ID first.' using errcode = 'P0001';
    end if;
    if not ((v_ver ->> 'id_type')::public.id_type = any (s.accepted_id_types)) then
      raise exception 'This ID type isn''t accepted.' using errcode = 'P0001';
    end if;
    if private.path_uuid(v_ver ->> 'id_front_url', 1) is distinct from v_tenant
       or private.path_uuid(v_ver ->> 'id_front_url', 2) is distinct from v_customer
       or private.path_uuid(v_ver ->> 'selfie_with_id_url', 1) is distinct from v_tenant
       or private.path_uuid(v_ver ->> 'selfie_with_id_url', 2) is distinct from v_customer then
      raise exception 'ID photos must be uploaded by this customer.' using errcode = 'P0001';
    end if;
  else
    v_ver := null;
  end if;

  -- Totals: items add up (gift lines are free), food within the max order amount (BL-11.5).
  select coalesce(sum((i ->> 'line_total')::integer), 0) into v_items_total
    from jsonb_array_elements(p -> 'items') i;
  if v_items_total <> (p ->> 'subtotal')::integer or v_items_total = 0 then
    raise exception 'order items don''t match the subtotal' using errcode = 'P0001';
  end if;
  if v_items_total > s.max_order_subtotal then
    raise exception 'Your order is above the maximum amount.' using errcode = 'P0001';
  end if;

  -- Coupon limits under a row lock (BL-13.3, BL-13.4).
  if p ->> 'coupon_id' is not null then
    select * into cp from public.coupons
     where id = (p ->> 'coupon_id')::uuid and tenant_id = v_tenant for update;
    select count(*) into v_my_uses from public.coupon_redemptions
     where coupon_id = cp.id and customer_id = v_customer and not released;
    if cp.id is null or not cp.is_active or now() < cp.valid_from or now() > cp.valid_until then
      raise exception 'This coupon can''t be used right now.' using errcode = 'P0001';
    elsif cp.used_count >= cp.max_uses then
      raise exception 'This coupon has been fully used.' using errcode = 'P0001';
    elsif v_my_uses >= cp.per_customer_limit then
      raise exception 'You''ve already used this coupon.' using errcode = 'P0001';
    elsif cp.min_order_subtotal is not null and v_items_total < cp.min_order_subtotal then
      raise exception 'Your order doesn''t reach this coupon''s minimum amount.' using errcode = 'P0001';
    end if;
  end if;

  -- Balances (BL-14): the customer must still have what the order spends.
  if v_points > c.loyalty_points
     or (v_free_delivery and c.loyalty_free_delivery_rewards < 1)
     or (v_free_gift and c.loyalty_free_gift_rewards < 1) then
    raise exception 'Your rewards changed — check your order again.' using errcode = 'P0001';
  end if;

  -- BL-4.6: order numbers continue the tenant's sequence; the first uses two letters of the link + 1001.
  perform pg_advisory_xact_lock(hashtext('order_number:' || v_tenant::text));
  select substring(order_number from '^([A-Z]+)-\d+$') into v_prefix from public.orders
   where tenant_id = v_tenant order by created_at desc limit 1;
  v_prefix := coalesce(v_prefix, upper(left(regexp_replace(t.slug, '[^a-zA-Z]', '', 'g'), 2)));
  select v_prefix || '-' || (coalesce(max(substring(order_number from '^[A-Z]+-(\d+)$')::integer), 1000) + 1)
    into v_number from public.orders
   where tenant_id = v_tenant and order_number like v_prefix || '-%';

  -- ID first, so the order status below sees the customer's new status.
  if v_ver is not null then
    update public.customers set verification_status = 'PENDING' where id = v_customer;
    c.verification_status := 'PENDING';
  end if;
  -- BL-4.1 / BL-4.5: verified customer + auto-approve → APPROVED right away.
  v_status := case when c.verification_status = 'VERIFIED' and s.auto_approve_verified_customers
                   then 'APPROVED' else 'PENDING_APPROVAL' end;

  insert into public.orders (
    id, tenant_id, order_number, customer_id, merchant_id, status,
    delivery_location_lat, delivery_location_lng, delivery_address_text, notes, distance_km,
    delivery_barangay_fee_id, subtotal, delivery_fee, coupon_id, coupon_code, coupon_discount,
    used_free_delivery_reward, free_delivery_discount, used_free_gift_reward, points_redeemed, points_discount,
    discount_total, total, delivery_fee_snapshot, change_for
  ) values (
    v_order, v_tenant, v_number, v_customer, m.id, v_status,
    (p ->> 'delivery_location_lat')::double precision, (p ->> 'delivery_location_lng')::double precision,
    p ->> 'delivery_address_text', nullif(btrim(p ->> 'notes'), ''), (p ->> 'distance_km')::numeric,
    (p ->> 'delivery_barangay_fee_id')::uuid, v_items_total, (p ->> 'delivery_fee')::integer,
    cp.id, cp.code, coalesce((p ->> 'coupon_discount')::integer, 0),
    v_free_delivery, coalesce((p ->> 'free_delivery_discount')::integer, 0), v_free_gift, v_points,
    coalesce((p ->> 'points_discount')::integer, 0), coalesce((p ->> 'discount_total')::integer, 0),
    (p ->> 'total')::integer, s.delivery_fee, (p ->> 'change_for')::integer
  );

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    v_line := v_line + 1;
    insert into public.order_items (tenant_id, order_id, line_no, product_id, name, unit_price, store_unit_price,
      qty, line_total, is_free_gift)
    values (v_tenant, v_order, v_line, (v_item ->> 'product_id')::uuid, v_item ->> 'name',
      (v_item ->> 'unit_price')::integer, (v_item ->> 'store_unit_price')::integer, (v_item ->> 'qty')::integer,
      (v_item ->> 'line_total')::integer, coalesce((v_item ->> 'is_free_gift')::boolean, false));
  end loop;

  perform private.add_order_event(v_order, 'PENDING_APPROVAL', 'CUSTOMER', v_customer, null);
  if v_status = 'APPROVED' then
    perform private.add_order_event(v_order, 'APPROVED', 'SYSTEM', null, 'Verified customer — auto-approved');
  end if;

  if v_ver is not null then
    insert into public.verifications (tenant_id, customer_id, id_type, id_front_url, selfie_with_id_url, order_id)
    values (v_tenant, v_customer, (v_ver ->> 'id_type')::public.id_type, v_ver ->> 'id_front_url',
      v_ver ->> 'selfie_with_id_url', v_order);
  end if;

  if cp.id is not null then
    insert into public.coupon_redemptions (tenant_id, coupon_id, order_id, customer_id, discount)
    values (v_tenant, cp.id, v_order, v_customer, coalesce((p ->> 'coupon_discount')::integer, 0));
    update public.coupons set used_count = used_count + 1 where id = cp.id;
  end if;

  update public.customers
     set loyalty_points = loyalty_points - v_points,
         loyalty_free_delivery_rewards = loyalty_free_delivery_rewards - (case when v_free_delivery then 1 else 0 end),
         loyalty_free_gift_rewards = loyalty_free_gift_rewards - (case when v_free_gift then 1 else 0 end)
   where id = v_customer;
  if v_points > 0 then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (v_tenant, v_customer, v_order, 'POINTS_REDEEMED', -v_points, 0);
  end if;
  if v_free_delivery then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (v_tenant, v_customer, v_order, 'FREE_DELIVERY_USED', 0, -1);
  end if;
  if v_free_gift then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (v_tenant, v_customer, v_order, 'FREE_GIFT_USED', 0, -1);
  end if;

  return jsonb_build_object('id', v_order, 'order_number', v_number, 'status', v_status);
end
$$;
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- ------------------------------------------------------------------ coupon lookup at checkout (BL-13.5)
-- Customers can't read the coupons table; they look one up by code. Returns nothing for an unknown code.
create function public.check_coupon(p_tenant uuid, p_code text)
returns table (
  id uuid, code text, description text, type public.coupon_type, percent_off integer, max_discount integer,
  min_order_subtotal integer, max_uses integer, used_count integer, per_customer_limit integer,
  valid_from timestamptz, valid_until timestamptz, is_active boolean, my_uses integer
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_customer uuid;
begin
  select cu.id into v_customer from public.customers cu
   where cu.tenant_id = p_tenant and cu.auth_user_id = (select auth.uid());
  if v_customer is null then
    raise exception 'not a customer of this business' using errcode = '42501';
  end if;
  return query
    select k.id, k.code, k.description, k.type, k.percent_off, k.max_discount, k.min_order_subtotal, k.max_uses,
           k.used_count, k.per_customer_limit, k.valid_from, k.valid_until, k.is_active,
           (select count(*)::integer from public.coupon_redemptions r
             where r.coupon_id = k.id and r.customer_id = v_customer and not r.released)
    from public.coupons k
    where k.tenant_id = p_tenant and k.code = upper(regexp_replace(p_code, '\s', '', 'g'));
end
$$;
revoke execute on function public.check_coupon(uuid, text) from public, anon;
grant execute on function public.check_coupon(uuid, text) to authenticated;

-- ------------------------------------------------------------------ customer cancels (BL-4.2, BL-13.7, BL-14.7)
create function public.cancel_order_by_customer(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null or not (o.customer_id = any (private.my_customer_ids())) then
    raise exception 'order not found' using errcode = '42501';
  end if;
  if o.status <> 'PENDING_APPROVAL' then
    raise exception 'This order can''t be cancelled anymore.' using errcode = 'P0001';
  end if;
  perform private.close_order(p_order, 'CANCELLED', 'CUSTOMER', o.customer_id, 'Cancelled by customer');
end
$$;
revoke execute on function public.cancel_order_by_customer(uuid) from public, anon;
grant execute on function public.cancel_order_by_customer(uuid) to authenticated;

-- ------------------------------------------------------------------ new ID after a rejection (BL-3.6, CUS-012)
create function public.submit_verification(
  p_tenant uuid, p_id_type public.id_type, p_id_front_url text, p_selfie_with_id_url text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c public.customers;
  v_id uuid;
begin
  select * into c from public.customers
   where tenant_id = p_tenant and auth_user_id = (select auth.uid()) for update;
  if c.id is null or not private.tenant_is_active(p_tenant) then
    raise exception 'not a customer of this business' using errcode = '42501';
  end if;
  if c.verification_status <> 'REJECTED' then
    raise exception 'Your ID is already verified or being checked.' using errcode = 'P0001';
  end if;
  if not (p_id_type = any ((select accepted_id_types from public.tenant_settings where tenant_id = p_tenant))) then
    raise exception 'This ID type isn''t accepted.' using errcode = 'P0001';
  end if;
  if private.path_uuid(p_id_front_url, 1) is distinct from p_tenant
     or private.path_uuid(p_id_front_url, 2) is distinct from c.id
     or private.path_uuid(p_selfie_with_id_url, 1) is distinct from p_tenant
     or private.path_uuid(p_selfie_with_id_url, 2) is distinct from c.id then
    raise exception 'ID photos must be uploaded by this customer.' using errcode = 'P0001';
  end if;
  insert into public.verifications (tenant_id, customer_id, id_type, id_front_url, selfie_with_id_url)
  values (p_tenant, c.id, p_id_type, p_id_front_url, p_selfie_with_id_url)
  returning id into v_id;
  update public.customers set verification_status = 'PENDING' where id = c.id;
  return v_id;
end
$$;
revoke execute on function public.submit_verification(uuid, public.id_type, text, text) from public, anon;
grant execute on function public.submit_verification(uuid, public.id_type, text, text) to authenticated;

-- ------------------------------------------------------------------ ID review (ADM-001, BL-3.4, BL-3.5)
create function public.verify_customer(p_customer uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.customers;
  st record;
begin
  select * into c from public.customers where id = p_customer for update;
  if c.id is null then
    raise exception 'customer not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(c.tenant_id, 'customers.verify');
  if c.verification_status <> 'PENDING' then
    raise exception 'There is no ID waiting for review.' using errcode = 'P0001';
  end if;
  update public.verifications set result = 'APPROVED', reviewed_by = st.staff_id, reviewed_at = now()
   where customer_id = p_customer and result is null;
  update public.customers set verification_status = 'VERIFIED' where id = p_customer;
end
$$;

-- Rejecting the ID auto-rejects the order that waits for it (BL-3.5) and gives its promos back.
create function public.reject_customer(p_customer uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.customers;
  st record;
  v_order uuid;
begin
  select * into c from public.customers where id = p_customer for update;
  if c.id is null then
    raise exception 'customer not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(c.tenant_id, 'customers.verify');
  if c.verification_status <> 'PENDING' then
    raise exception 'There is no ID waiting for review.' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Give a reason.' using errcode = '22023';
  end if;
  update public.verifications
     set result = 'REJECTED', reviewed_by = st.staff_id, reviewed_at = now(), reject_reason = btrim(p_reason)
   where customer_id = p_customer and result is null;
  update public.customers set verification_status = 'REJECTED' where id = p_customer;
  for v_order in
    select id from public.orders where customer_id = p_customer and status = 'PENDING_APPROVAL' for update
  loop
    perform private.close_order(v_order, 'REJECTED', st.actor, st.staff_id, 'Customer verification rejected');
  end loop;
end
$$;
revoke execute on function public.verify_customer(uuid), public.reject_customer(uuid, text) from public, anon;
grant execute on function public.verify_customer(uuid), public.reject_customer(uuid, text) to authenticated;

-- ------------------------------------------------------------------ staff order actions (ADM-002, ADM-007, BL-4)
-- Approve: only a VERIFIED customer's order (BL-3.5). Offering it to a rider comes with dispatch (2.6).
create function public.approve_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  st record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(o.tenant_id, 'orders.approve');
  if o.status <> 'PENDING_APPROVAL' then
    raise exception 'This order can''t be approved now.' using errcode = 'P0001';
  end if;
  if (select verification_status from public.customers where id = o.customer_id) <> 'VERIFIED' then
    raise exception 'Verify the customer''s ID first.' using errcode = 'P0001';
  end if;
  update public.orders set status = 'APPROVED', approved_by = st.staff_id where id = p_order;
  perform private.add_order_event(p_order, 'APPROVED', st.actor, st.staff_id, null);
end
$$;

create function public.reject_order(p_order uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  st record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(o.tenant_id, 'orders.approve');
  if o.status <> 'PENDING_APPROVAL' then
    raise exception 'Only orders waiting for approval can be rejected.' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Give a reason.' using errcode = '22023';
  end if;
  perform private.close_order(p_order, 'REJECTED', st.actor, st.staff_id, btrim(p_reason));
end
$$;

-- Staff cancel any time before pickup (BL-4): the rider is freed and promos are given back.
create function public.cancel_order(p_order uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  st record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(o.tenant_id, 'orders.cancel');
  if o.status not in ('PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'AT_MERCHANT') then
    raise exception 'This order can''t be cancelled anymore.' using errcode = 'P0001';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Give a reason.' using errcode = '22023';
  end if;
  perform private.close_order(p_order, 'CANCELLED', st.actor, st.staff_id, btrim(p_reason));
end
$$;
revoke execute on function public.approve_order(uuid), public.reject_order(uuid, text), public.cancel_order(uuid, text)
  from public, anon;
grant execute on function public.approve_order(uuid), public.reject_order(uuid, text), public.cancel_order(uuid, text)
  to authenticated;

-- ------------------------------------------------------------------ ID photos (PHASE-2-PLAN "Storage", BL-3.7)
-- Private. The customer uploads into <tenant id>/<customer id>/…; staff with customers.verify read them through
-- signed URLs. No updates or deletes from the apps (the review keeps its evidence; Q-35 retention job later).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-documents', 'id-documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy id_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents'
    and private.path_uuid(name, 2) = any ((select private.my_customer_ids())::uuid[])
    -- objects.name, not name: inside this subquery a bare `name` would be the customer's name column
    and exists (select 1 from public.customers cu
                where cu.id = private.path_uuid(objects.name, 2)
                  and cu.tenant_id = private.path_uuid(objects.name, 1))
    and (select private.tenant_is_active(private.path_uuid(name, 1))));
create policy id_documents_read on storage.objects for select to authenticated
  using (bucket_id = 'id-documents'
    and (private.path_uuid(name, 2) = any ((select private.my_customer_ids())::uuid[])
      or (select private.has_perm(private.path_uuid(name, 1), 'customers.verify'))));
