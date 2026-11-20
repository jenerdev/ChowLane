-- ChowLane Phase 2 · Milestone 2.6 — dispatch & delivery: offers (AUTO + manual), rider responses, offer expiry
-- (pg_cron), shifts with cash summary, delivery steps, loyalty on delivery, cash remittance, delivery photos, Realtime.
--
-- Rules: BL-4 (lifecycle), BL-5 (assigning riders), BL-6 (shifts), BL-11 (rider buys at the store), BL-12 (cash),
-- BL-14.12 (loyalty on delivery). Riders and staff call these functions with their own session; the two steps that
-- change money (items unavailable, delivered) are priced by packages/lib in the rider app's server actions and saved
-- with the service role, like place_order (D-067).

create extension if not exists pg_cron;

-- ------------------------------------------------------------------ helpers
-- Straight-line distance in km — same formula as packages/lib haversineKm (BL-5.5, BL-7.3).
create function private.distance_km(
  p_lat1 double precision, p_lng1 double precision, p_lat2 double precision, p_lng2 double precision
) returns double precision
language sql immutable set search_path = '' as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(p_lat2 - p_lat1) / 2), 2)
    + cos(radians(p_lat1)) * cos(radians(p_lat2)) * power(sin(radians(p_lng2 - p_lng1) / 2), 2)))
$$;

-- The signed-in ACTIVE rider of an ACTIVE business (locked for the caller's transaction), or an error.
create function private.my_rider(p_tenant uuid) returns public.riders
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders;
begin
  select * into r from public.riders
   where tenant_id = p_tenant and auth_user_id = (select auth.uid()) for update;
  if r.id is null or r.status <> 'ACTIVE' or not private.tenant_is_active(p_tenant) then
    raise exception 'not an active rider of this business' using errcode = '42501';
  end if;
  return r;
end
$$;

-- An order the signed-in rider is delivering (locked), or an error.
create function private.my_delivery(p_order uuid) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  r public.riders;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  r := private.my_rider(o.tenant_id);
  if o.rider_id is distinct from r.id then
    raise exception 'This isn''t your order.' using errcode = '42501';
  end if;
  return o;
end
$$;

-- Free = ACTIVE, on shift, no active order and no open offer on another order (BL-5.2, BL-5.10, BL-5.12).
create function private.rider_is_free(p_rider uuid, p_order uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.riders r
                  where r.id = p_rider and r.status = 'ACTIVE' and r.is_on_shift and r.active_order_id is null)
     and not exists (select 1 from public.orders o where o.offer_rider_id = p_rider and o.id <> p_order)
$$;

create function private.clear_offer(p_order uuid) returns void
language sql security definer set search_path = '' as $$
  update public.orders
     set offer_rider_id = null, offer_offered_at = null, offer_expires_at = null, offer_by = null,
         offer_staff_id = null
   where id = p_order
$$;

-- Offer the order to a rider (BL-5). An open offer is withdrawn (BL-5.12); an ASSIGNED / AT_MERCHANT order goes back
-- to APPROVED until the new rider accepts and the previous rider is freed (BL-5.13).
create function private.make_offer(
  p_order uuid, p_rider uuid, p_by public.assigned_by, p_staff uuid, p_actor public.actor_type
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  v_timeout integer;
begin
  select * into o from public.orders where id = p_order;
  select rider_response_timeout_sec into v_timeout from public.tenant_settings where tenant_id = o.tenant_id;
  update public.assignment_attempts set response = 'WITHDRAWN', responded_at = now()
   where order_id = p_order and response is null;
  if o.status in ('ASSIGNED', 'AT_MERCHANT') then
    update public.riders set active_order_id = null where active_order_id = p_order;
    update public.orders set status = 'APPROVED', rider_id = null where id = p_order;
    perform private.add_order_event(p_order, 'APPROVED', p_actor, p_staff, 'Rider reassigned');
  end if;
  update public.orders
     set offer_rider_id = p_rider, offer_offered_at = now(),
         offer_expires_at = now() + make_interval(secs => v_timeout), offer_by = p_by, offer_staff_id = p_staff
   where id = p_order;
  insert into public.assignment_attempts (tenant_id, order_id, rider_id, by, staff_id)
  values (o.tenant_id, p_order, p_rider, p_by, p_staff);
end
$$;

-- AUTO mode (BL-5.5): offer an APPROVED order without an offer to the nearest free rider who hasn't declined it.
-- Riders without a known location are tried last. Returns the rider, or null → "Needs rider" (BL-5.8).
create function private.auto_offer(p_order uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  m public.merchants;
  v_rider uuid;
begin
  select * into o from public.orders where id = p_order;
  if o.id is null or o.status <> 'APPROVED' or o.offer_rider_id is not null
     or not private.tenant_is_active(o.tenant_id)
     or (select dispatch_mode from public.tenant_settings where tenant_id = o.tenant_id) <> 'AUTO' then
    return null;
  end if;
  select * into m from public.merchants where id = o.merchant_id;
  select r.id into v_rider from public.riders r
   where r.tenant_id = o.tenant_id and r.status = 'ACTIVE' and r.is_on_shift and r.active_order_id is null
     and not exists (select 1 from public.orders x where x.offer_rider_id = r.id)
     and not exists (select 1 from public.assignment_attempts a
                      where a.order_id = p_order and a.rider_id = r.id and a.response in ('REJECTED', 'TIMED_OUT'))
   order by (r.last_location_lat is null),
            private.distance_km(r.last_location_lat, r.last_location_lng, m.location_lat, m.location_lng),
            r.created_at, r.id
   limit 1
   for update of r skip locked;
  if v_rider is null then
    return null;
  end if;
  perform private.make_offer(p_order, v_rider, 'AUTO', null, 'SYSTEM');
  return v_rider;
end
$$;

-- A rider became free (timed in, delivered, order cancelled): AUTO retries the orders that need a rider (BL-5.8).
create function private.auto_offer_waiting(p_tenant uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order uuid;
begin
  for v_order in
    select id from public.orders
     where tenant_id = p_tenant and status = 'APPROVED' and offer_rider_id is null
     order by created_at
     for update skip locked
  loop
    perform private.auto_offer(v_order);
  end loop;
end
$$;

-- No answer in time = rejected with "No response" (BL-5.6); AUTO offers the next rider.
create function private.time_out_offer(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = p_order;
  if o.offer_rider_id is null then
    return;
  end if;
  update public.assignment_attempts
     set response = 'TIMED_OUT', responded_at = now(), reject_reason = 'NO_RESPONSE'
   where order_id = p_order and rider_id = o.offer_rider_id and response is null;
  perform private.clear_offer(p_order);
  perform private.auto_offer(p_order);
end
$$;

-- "<uuid>/<uuid>/file" storage paths: both parts must name this tenant and this order.
create function private.is_order_photo(p_path text, p_tenant uuid, p_order uuid) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(private.path_uuid(p_path, 1) = p_tenant and private.path_uuid(p_path, 2) = p_order, false)
$$;

grant execute on all functions in schema private to anon, authenticated;

-- ------------------------------------------------------------------ approve now also offers (BL-4.5, BL-5.5)
create or replace function public.approve_order(p_order uuid) returns void
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
  perform private.auto_offer(p_order);
end
$$;

-- Auto-approved orders (BL-4.5) are offered right away in AUTO mode: place_order (2.5) becomes private.place_order_core
-- (same body and rights) and the public function wraps it.
alter function public.place_order(jsonb) rename to place_order_core;
alter function public.place_order_core(jsonb) set schema private;
create function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  v_result := private.place_order_core(p);
  if v_result ->> 'status' = 'APPROVED' then
    perform private.auto_offer((v_result ->> 'id')::uuid);
  end if;
  return v_result;
end
$$;
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- Staff cancel: as in 2.5, and a rider who was freed can get the next waiting order (BL-5.8).
create or replace function public.cancel_order(p_order uuid, p_reason text) returns void
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
  if o.rider_id is not null then
    perform private.auto_offer_waiting(o.tenant_id);
  end if;
end
$$;

-- ------------------------------------------------------------------ manual assign / reassign (ADM-004, BL-5.9)
create function public.assign_order(p_order uuid, p_rider uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  st record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(o.tenant_id, 'orders.assign');
  if o.status not in ('APPROVED', 'ASSIGNED', 'AT_MERCHANT') then
    raise exception 'This order can''t be assigned now.' using errcode = 'P0001';
  end if;
  perform 1 from public.riders where id = p_rider and tenant_id = o.tenant_id for update;
  if not found then
    raise exception 'rider not found' using errcode = 'P0001';
  end if;
  if p_rider = o.rider_id or p_rider = o.offer_rider_id then
    raise exception 'This rider already has the order.' using errcode = 'P0001';
  end if;
  if not private.rider_is_free(p_rider, p_order) then
    raise exception 'This rider isn''t free — only riders on shift with no order or offer can get one.'
      using errcode = 'P0001';
  end if;
  perform private.make_offer(p_order, p_rider, 'ADMIN', st.staff_id, st.actor);
end
$$;

-- ------------------------------------------------------------------ rider answers an offer (RID-003, BL-5.3…5.7)
-- Returns ASSIGNED, DECLINED or EXPIRED (the time ran out before the answer arrived).
create function public.respond_to_offer(
  p_order uuid, p_accept boolean, p_reason public.rider_reject_reason default null, p_note text default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  r public.riders;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception 'order not found' using errcode = '42501';
  end if;
  r := private.my_rider(o.tenant_id);
  if o.offer_rider_id is distinct from r.id or o.status <> 'APPROVED' then
    raise exception 'This offer is no longer yours.' using errcode = 'P0001';
  end if;
  if o.offer_expires_at <= now() then
    perform private.time_out_offer(p_order);
    return 'EXPIRED';
  end if;

  if p_accept then
    if not r.is_on_shift then
      raise exception 'Time in first.' using errcode = 'P0001';
    end if;
    if r.active_order_id is not null then
      raise exception 'Finish your current delivery first.' using errcode = 'P0001';
    end if;
    update public.assignment_attempts set response = 'ACCEPTED', responded_at = now()
     where order_id = p_order and rider_id = r.id and response is null;
    perform private.clear_offer(p_order);
    update public.orders set status = 'ASSIGNED', rider_id = r.id where id = p_order;
    update public.riders set active_order_id = p_order where id = r.id;
    perform private.add_order_event(p_order, 'ASSIGNED', 'RIDER', r.id, null);
    return 'ASSIGNED';
  end if;

  if p_reason is null or p_reason = 'NO_RESPONSE' then
    raise exception 'Choose a reason.' using errcode = '22023';
  end if;
  if p_reason = 'OTHER' and nullif(btrim(p_note), '') is null then
    raise exception 'Tell your admin why.' using errcode = '22023';
  end if;
  update public.assignment_attempts
     set response = 'REJECTED', responded_at = now(), reject_reason = p_reason, reject_note = nullif(btrim(p_note), '')
   where order_id = p_order and rider_id = r.id and response is null;
  perform private.clear_offer(p_order);
  perform private.auto_offer(p_order);  -- AUTO: next rider; MANUAL: back to "Needs rider" (BL-5.4)
  return 'DECLINED';
end
$$;

-- Offers past their time (BL-5.6, BL-5.14) — run by pg_cron every 15 s; apps may call it too (it only does what the
-- job would). Returns how many offers timed out.
create function public.expire_offers() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_order uuid;
  n integer := 0;
begin
  for v_order in
    select id from public.orders where offer_expires_at <= now() for update skip locked
  loop
    perform private.time_out_offer(v_order);
    n := n + 1;
  end loop;
  return n;
end
$$;

-- What the rider sees before accepting (BL-5.15, BL-11.4): the store, items and cash needed, the drop-off AREA only —
-- no street address, notes or customer. orders_read doesn't show offered orders to riders; this does. The address is
-- free text, so the area comes only from the order's barangay price entry (PER_BARANGAY); otherwise it is null.
create function public.my_offer(p_tenant uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_rider uuid;
begin
  select id into v_rider from public.riders
   where tenant_id = p_tenant and auth_user_id = (select auth.uid()) and status = 'ACTIVE';
  if v_rider is null then
    raise exception 'not an active rider of this business' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'id', o.id, 'tenant_id', o.tenant_id, 'order_number', o.order_number, 'merchant_id', o.merchant_id,
      'status', o.status, 'distance_km', o.distance_km,
      'drop_off_area', (select b.barangay || ', ' || b.city_municipality from public.barangay_fees b
                         where b.id = o.delivery_barangay_fee_id),
      'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'discount_total', o.discount_total,
      'total', o.total, 'change_for', o.change_for, 'created_at', o.created_at,
      'offer_offered_at', o.offer_offered_at, 'offer_expires_at', o.offer_expires_at, 'offer_by', o.offer_by,
      'items', (select coalesce(jsonb_agg(jsonb_build_object(
                  'line_no', i.line_no, 'name', i.name, 'qty', i.qty, 'unit_price', i.unit_price,
                  'store_unit_price', i.store_unit_price, 'line_total', i.line_total,
                  'is_free_gift', i.is_free_gift) order by i.line_no), '[]'::jsonb)
                from public.order_items i where i.order_id = o.id))
    from public.orders o
    where o.offer_rider_id = v_rider and o.status = 'APPROVED'
    order by o.offer_offered_at desc
    limit 1);
end
$$;

-- ------------------------------------------------------------------ shifts (RID-002, RID-008, BL-6, BL-12.3)
create function public.rider_time_in(
  p_tenant uuid, p_lat double precision default null, p_lng double precision default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders;
  v_shift uuid;
begin
  r := private.my_rider(p_tenant);
  if r.is_on_shift then
    raise exception 'You''re already on shift.' using errcode = 'P0001';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'location needs both lat and lng' using errcode = '22023';
  end if;
  insert into public.shifts (tenant_id, rider_id, time_in_lat, time_in_lng)
  values (p_tenant, r.id, p_lat, p_lng) returning id into v_shift;
  update public.riders
     set is_on_shift = true, current_shift_id = v_shift,
         last_location_lat = coalesce(p_lat, last_location_lat), last_location_lng = coalesce(p_lng, last_location_lng)
   where id = r.id;
  perform private.auto_offer_waiting(p_tenant);
  return v_shift;
end
$$;

-- Cash summary = cash collected − paid at stores, DELIVERED orders of this shift (BL-12.2, BL-12.7) → PENDING.
create function public.rider_time_out(
  p_tenant uuid, p_lat double precision default null, p_lng double precision default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.riders;
  sh public.shifts;
  v_order uuid;
  v_n integer;
  v_cash integer;
  v_store integer;
begin
  r := private.my_rider(p_tenant);
  if not r.is_on_shift then
    raise exception 'You''re not on shift.' using errcode = 'P0001';
  end if;
  if r.active_order_id is not null then
    raise exception 'Finish your current delivery before timing out.' using errcode = 'P0001';
  end if;
  for v_order in select id from public.orders where offer_rider_id = r.id and offer_expires_at <= now() for update
  loop
    perform private.time_out_offer(v_order);
  end loop;
  if exists (select 1 from public.orders where offer_rider_id = r.id) then
    raise exception 'Accept or reject the order offer before timing out.' using errcode = 'P0001';
  end if;
  select * into sh from public.shifts where id = r.current_shift_id for update;
  select count(*), coalesce(sum(total), 0), coalesce(sum(store_amount_paid), 0) into v_n, v_cash, v_store
    from public.orders
   where rider_id = r.id and status = 'DELIVERED' and cash_collected_at between sh.time_in and now();
  update public.shifts
     set time_out = now(), time_out_lat = p_lat, time_out_lng = p_lng, cash_collected = v_cash,
         store_paid = v_store, expected_remit = v_cash - v_store, remit_status = 'PENDING'
   where id = sh.id;
  update public.riders
     set is_on_shift = false, current_shift_id = null,
         last_location_lat = coalesce(p_lat, last_location_lat), last_location_lng = coalesce(p_lng, last_location_lng)
   where id = r.id;
  return jsonb_build_object('shift_id', sh.id, 'deliveries', v_n, 'cash_collected', v_cash, 'store_paid', v_store,
    'expected_remit', v_cash - v_store);
end
$$;

-- ------------------------------------------------------------------ delivery steps (RID-004…007, BL-4.4, BL-11)
create function public.arrive_at_store(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  o := private.my_delivery(p_order);
  if o.status <> 'ASSIGNED' then
    raise exception 'This order isn''t waiting for you at the store.' using errcode = 'P0001';
  end if;
  update public.orders set status = 'AT_MERCHANT' where id = p_order;
  perform private.add_order_event(p_order, 'AT_MERCHANT', 'RIDER', o.rider_id, null);
end
$$;

-- Items marked unavailable (BL-11.7, BL-11.11, BL-13.9): new money computed by packages/lib in the server action.
create function public.set_items_unavailable(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  v_lines integer[] := array(select jsonb_array_elements_text(coalesce(p -> 'unavailable_lines', '[]'))::integer);
  v_sub integer;
  v_left integer;
  v_coupon integer := (p ->> 'coupon_discount')::integer;
  v_points integer := (p ->> 'points_discount')::integer;
begin
  select * into o from public.orders where id = (p ->> 'order_id')::uuid for update;
  if o.id is null or o.rider_id is distinct from (p ->> 'rider_id')::uuid then
    raise exception 'This isn''t your order.' using errcode = '42501';
  end if;
  if o.status <> 'AT_MERCHANT' then
    raise exception 'Mark that you''ve arrived at the store first.' using errcode = 'P0001';
  end if;
  update public.order_items set is_unavailable = (line_no = any (v_lines)) where order_id = o.id;
  select coalesce(sum(line_total) filter (where not is_unavailable), 0), count(*) filter (where not is_unavailable)
    into v_sub, v_left from public.order_items where order_id = o.id;
  if v_left = 0 then
    raise exception 'Nothing is left — cancel the order instead.' using errcode = 'P0001';
  end if;
  if v_sub <> (p ->> 'subtotal')::integer or v_coupon < 0 or v_points < 0 or v_points > o.points_discount
     or v_coupon + o.free_delivery_discount + v_points <> (p ->> 'discount_total')::integer then
    raise exception 'order totals don''t add up' using errcode = 'P0001';
  end if;
  update public.orders
     set subtotal = v_sub, coupon_discount = v_coupon, points_discount = v_points,
         discount_total = (p ->> 'discount_total')::integer, total = (p ->> 'total')::integer
   where id = o.id;
  update public.coupon_redemptions set discount = v_coupon where order_id = o.id and not released;
end
$$;

-- Every item unavailable → CANCELLED "Items unavailable" (BL-11.7); promos given back, rider freed.
create function public.cancel_unavailable(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  o := private.my_delivery(p_order);
  if o.status not in ('ASSIGNED', 'AT_MERCHANT') then
    raise exception 'This order can''t be cancelled now.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.order_items where order_id = p_order and not is_unavailable) then
    raise exception 'Some items are still available.' using errcode = 'P0001';
  end if;
  perform private.close_order(p_order, 'CANCELLED', 'RIDER', o.rider_id, 'Items unavailable');
  perform private.auto_offer_waiting(o.tenant_id);
end
$$;

-- Paid the store and has the food → PICKED_UP; amount + receipt photo required (BL-11.6, BL-11.10).
create function public.pick_up_order(p_order uuid, p_store_amount integer, p_receipt_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  o := private.my_delivery(p_order);
  if o.status <> 'AT_MERCHANT' then
    raise exception 'Mark that you''ve arrived and ordered first.' using errcode = 'P0001';
  end if;
  if p_store_amount is null or p_store_amount <= 0 then
    raise exception 'Enter the amount you paid at the store.' using errcode = '22023';
  end if;
  if not private.is_order_photo(p_receipt_path, o.tenant_id, o.id) then
    raise exception 'Add a photo of the receipt.' using errcode = '22023';
  end if;
  update public.orders
     set status = 'PICKED_UP', store_amount_paid = p_store_amount, store_receipt_photo_url = p_receipt_path
   where id = p_order;
  perform private.add_order_event(p_order, 'PICKED_UP', 'RIDER', o.rider_id, null);
end
$$;

-- Cash collected + proof → DELIVERED (RID-007, BL-11.12); rider earning and loyalty computed by packages/lib in the
-- server action (BL-8, BL-13.6, BL-14.3, BL-14.4, BL-14.12). The loyalty counters were read at
-- `base_delivered_orders`; if another delivery changed them meanwhile this fails with 40001 and the action retries.
create function public.complete_delivery(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  c public.customers;
  l jsonb := p -> 'loyalty';
  v_photo text := nullif(p ->> 'proof_photo_url', '');
  v_note text := nullif(btrim(p ->> 'proof_note'), '');
  v_points integer := coalesce((l ->> 'points_earned')::integer, 0);
  v_fd boolean := coalesce((l ->> 'free_delivery_earned')::boolean, false);
  v_fg boolean := coalesce((l ->> 'free_gift_earned')::boolean, false);
begin
  select * into o from public.orders where id = (p ->> 'order_id')::uuid for update;
  if o.id is null or o.rider_id is distinct from (p ->> 'rider_id')::uuid then
    raise exception 'This isn''t your order.' using errcode = '42501';
  end if;
  if o.status <> 'PICKED_UP' then
    raise exception 'Pick up the order first.' using errcode = 'P0001';
  end if;
  if not coalesce((p ->> 'cash_collected')::boolean, false) then
    raise exception 'Confirm you collected the cash.' using errcode = '22023';
  end if;
  if v_photo is null and v_note is null then
    raise exception 'Add a photo or a note as proof of delivery.' using errcode = '22023';
  end if;
  if v_photo is not null and not private.is_order_photo(v_photo, o.tenant_id, o.id) then
    raise exception 'proof photo must belong to this order' using errcode = '22023';
  end if;
  if l is null then
    raise exception 'loyalty result missing' using errcode = '22023';
  end if;

  select * into c from public.customers where id = o.customer_id for update;
  if c.loyalty_delivered_orders <> (l ->> 'base_delivered_orders')::integer then
    raise exception 'loyalty changed meanwhile — try again' using errcode = '40001';
  end if;

  update public.orders
     set status = 'DELIVERED', payment_status = 'COLLECTED', cash_collected_at = now(),
         rider_earning = (p ->> 'rider_earning')::integer, points_earned = nullif(v_points, 0),
         proof_photo_url = v_photo, proof_note = v_note
   where id = o.id;
  update public.riders set active_order_id = null where id = o.rider_id and active_order_id = o.id;

  update public.customers
     set loyalty_delivered_orders = loyalty_delivered_orders + 1,
         loyalty_orders_toward_free_delivery = (l ->> 'orders_toward_free_delivery')::integer,
         loyalty_free_delivery_rewards = loyalty_free_delivery_rewards + (case when v_fd then 1 else 0 end),
         loyalty_orders_toward_free_gift = (l ->> 'orders_toward_free_gift')::integer,
         loyalty_free_gift_rewards = loyalty_free_gift_rewards + (case when v_fg then 1 else 0 end),
         loyalty_points = loyalty_points + v_points
   where id = c.id;
  if v_points > 0 then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, c.id, o.id, 'POINTS_EARNED', v_points, 0);
  end if;
  if v_fd then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, c.id, o.id, 'FREE_DELIVERY_EARNED', 0, 1);
  end if;
  if v_fg then
    insert into public.loyalty_transactions (tenant_id, customer_id, order_id, kind, points, rewards)
    values (o.tenant_id, c.id, o.id, 'FREE_GIFT_EARNED', 0, 1);
  end if;

  perform private.add_order_event(o.id, 'DELIVERED', 'RIDER', o.rider_id, null);
  perform private.auto_offer_waiting(o.tenant_id);
end
$$;

-- ------------------------------------------------------------------ cash remittance (ADM-009, BL-12.4)
create function public.record_remittance(p_shift uuid, p_amount integer, p_note text default null)
returns public.remit_status
language plpgsql security definer set search_path = '' as $$
declare
  sh public.shifts;
  st record;
  v_status public.remit_status;
begin
  select * into sh from public.shifts where id = p_shift for update;
  if sh.id is null then
    raise exception 'shift not found' using errcode = '42501';
  end if;
  select * into st from private.staff_with_perm(sh.tenant_id, 'cash.manage');
  if sh.remit_status = 'OPEN' then
    raise exception 'The rider hasn''t timed out yet.' using errcode = 'P0001';
  elsif sh.remit_status <> 'PENDING' then
    raise exception 'This shift''s cash was already recorded.' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'Enter the amount received.' using errcode = '22023';
  end if;
  v_status := case when p_amount = sh.expected_remit then 'RECEIVED'
                   when p_amount < sh.expected_remit then 'SHORT' else 'OVER' end;
  if v_status <> 'RECEIVED' and nullif(btrim(p_note), '') is null then
    raise exception 'Add a note about the difference.' using errcode = '22023';
  end if;
  update public.shifts
     set remitted_amount = p_amount, remit_status = v_status, remit_received_by = st.staff_id,
         remit_received_at = now(), remit_note = nullif(btrim(p_note), '')
   where id = p_shift;
  return v_status;
end
$$;

-- ------------------------------------------------------------------ grants
revoke execute on function
  public.assign_order(uuid, uuid), public.respond_to_offer(uuid, boolean, public.rider_reject_reason, text),
  public.expire_offers(), public.my_offer(uuid), public.rider_time_in(uuid, double precision, double precision),
  public.rider_time_out(uuid, double precision, double precision), public.arrive_at_store(uuid),
  public.cancel_unavailable(uuid), public.pick_up_order(uuid, integer, text), public.record_remittance(uuid, integer, text)
  from public, anon;
grant execute on function
  public.assign_order(uuid, uuid), public.respond_to_offer(uuid, boolean, public.rider_reject_reason, text),
  public.expire_offers(), public.my_offer(uuid), public.rider_time_in(uuid, double precision, double precision),
  public.rider_time_out(uuid, double precision, double precision), public.arrive_at_store(uuid),
  public.cancel_unavailable(uuid), public.pick_up_order(uuid, integer, text), public.record_remittance(uuid, integer, text)
  to authenticated;
revoke execute on function public.set_items_unavailable(jsonb), public.complete_delivery(jsonb)
  from public, anon, authenticated;
grant execute on function public.set_items_unavailable(jsonb), public.complete_delivery(jsonb) to service_role;

-- ------------------------------------------------------------------ delivery photos (PHASE-2-PLAN "Storage")
-- Private. The rider of the order uploads the receipt / proof into <tenant id>/<order id>/… while delivering it;
-- the rider and staff who see orders or cash read them through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('delivery-photos', 'delivery-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy delivery_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'delivery-photos'
    and exists (select 1 from public.orders o
                where o.id = private.path_uuid(objects.name, 2) and o.tenant_id = private.path_uuid(objects.name, 1)
                  and o.rider_id = any ((select private.my_rider_ids())::uuid[])
                  and o.status in ('AT_MERCHANT', 'PICKED_UP'))
    and (select private.tenant_is_active(private.path_uuid(name, 1))));
create policy delivery_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'delivery-photos'
    and exists (select 1 from public.orders o
                where o.id = private.path_uuid(objects.name, 2) and o.tenant_id = private.path_uuid(objects.name, 1)
                  and (o.rider_id = any ((select private.my_rider_ids())::uuid[])
                    or (select private.has_any_perm(o.tenant_id, '{orders.view,cash.manage}')))));

-- ------------------------------------------------------------------ Realtime (PHASE-2-PLAN "Realtime")
-- Changes reach only subscribers who may read the row (RLS). Apps reload their data when one arrives.
alter publication supabase_realtime add table
  public.orders, public.assignment_attempts, public.shifts, public.riders, public.customers;

-- ------------------------------------------------------------------ offer expiry job (BL-5.6, BL-5.14)
select cron.schedule('expire-rider-offers', '15 seconds', $$select public.expire_offers()$$);
