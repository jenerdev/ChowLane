-- ChowLane Phase 2 · Milestone 2.4 — console on real data.
-- Most console screens write through the RLS policies of 2.2 (settings, catalog, barangay fees, coupons). This adds
-- the one multi-row console change (manual points adjustment) and the public logo bucket.

-- ------------------------------------------------------------------ manual points adjustment (BL-14.8, ADM-013)
-- loyalty.manage adds or removes points with a reason. The ledger row and the balance change together; the balance
-- never goes below 0. Returns the new balance.
create function public.adjust_points(p_customer uuid, p_points integer, p_note text) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_balance integer;
  v_staff uuid;
  v_note text := nullif(btrim(p_note), '');
begin
  select tenant_id, loyalty_points into v_tenant, v_balance
    from public.customers where id = p_customer for update;
  if v_tenant is null or not private.has_perm(v_tenant, 'loyalty.manage')
     or not private.tenant_is_active(v_tenant) then
    raise exception 'permission denied: loyalty.manage is required' using errcode = '42501';
  end if;
  if p_points is null or p_points = 0 then
    raise exception 'enter the points to add or remove' using errcode = '22023';
  end if;
  if v_note is null then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  if v_balance + p_points < 0 then
    raise exception 'the balance can''t go below 0' using errcode = '23514';
  end if;

  select id into v_staff from public.staff_users
   where tenant_id = v_tenant and auth_user_id = (select auth.uid()) and status = 'ACTIVE';

  insert into public.loyalty_transactions (tenant_id, customer_id, kind, points, rewards, staff_id, note)
  values (v_tenant, p_customer, 'POINTS_ADJUSTED', p_points, 0, v_staff, v_note);

  update public.customers set loyalty_points = v_balance + p_points where id = p_customer;
  return v_balance + p_points;
end
$$;
revoke execute on function public.adjust_points(uuid, integer, text) from public, anon;
grant execute on function public.adjust_points(uuid, integer, text) to authenticated;

-- ------------------------------------------------------------------ tenant logos (PHASE-2-PLAN "Storage")
-- Public read (apps, manifests); upload / replace / delete with settings.business. Files live under
-- <tenant id>/… so the policy can tell which business a file belongs to.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tenant-logos', 'tenant-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']);

-- The tenant id from a storage path ("<uuid>/logo.png"), or null when the first folder isn't a uuid.
create function private.path_tenant(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception when invalid_text_representation then
  return null;
end
$$;
grant execute on function private.path_tenant(text) to anon, authenticated;

-- Public files are served by URL without a policy; listing / reading object rows stays with the business.
create policy tenant_logos_read on storage.objects for select to authenticated
  using (bucket_id = 'tenant-logos'
    and (select private.has_perm(private.path_tenant(name), 'settings.business')));
create policy tenant_logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tenant-logos'
    and (select private.has_perm(private.path_tenant(name), 'settings.business'))
    and (select private.tenant_is_active(private.path_tenant(name))));
create policy tenant_logos_update on storage.objects for update to authenticated
  using (bucket_id = 'tenant-logos'
    and (select private.has_perm(private.path_tenant(name), 'settings.business'))
    and (select private.tenant_is_active(private.path_tenant(name))));
create policy tenant_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tenant-logos'
    and (select private.has_perm(private.path_tenant(name), 'settings.business'))
    and (select private.tenant_is_active(private.path_tenant(name))));
