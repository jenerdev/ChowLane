-- ChowLane Phase 2 · Milestone 2.7 — platform admin: tenant status, billing config, monthly statements (BL-10).
--
-- The platform admin reads every tenant through RLS (2.2) and changes only billing and tenant status (BL-10.3, D-028).
-- Statements are made in the database so the monthly pg_cron job and the "Create statement" button use the same
-- rule: BL-10.4 amounts (= packages/lib computeBillingAmount), BL-10.9 delivered orders only (= lib deliveredInPeriod:
-- orders created in the month that are DELIVERED), BL-10.10 one per tenant per Manila month, BL-10.11 ₱0 → WAIVED.

-- ------------------------------------------------------------------ helpers
create function private.require_platform_admin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select id into v_id from public.platform_admins
   where auth_user_id = (select auth.uid()) and status = 'ACTIVE';
  if v_id is null then
    raise exception 'permission denied: platform admin only' using errcode = '42501';
  end if;
  return v_id;
end
$$;

-- The Asia/Manila calendar month containing p_at: [start, next start − 1 s] (= lib manilaMonthRange).
create function private.manila_month(p_at timestamptz, out period_start timestamptz, out period_end timestamptz)
language sql immutable set search_path = '' as $$
  select date_trunc('month', p_at at time zone 'Asia/Manila') at time zone 'Asia/Manila',
         (date_trunc('month', p_at at time zone 'Asia/Manila') + interval '1 month') at time zone 'Asia/Manila'
           - interval '1 second'
$$;

-- Creates the statement of one tenant for the Manila month containing p_at, or returns the existing one's id.
create function private.create_statement(p_tenant uuid, p_at timestamptz) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  b public.tenant_billing;
  m record;
  v_id uuid;
  v_delivered integer;
  v_amount integer;
begin
  select * into m from private.manila_month(p_at);
  select id into v_id from public.billing_statements where tenant_id = p_tenant and period_start = m.period_start;
  if v_id is not null then
    return v_id;
  end if;
  select * into b from public.tenant_billing where tenant_id = p_tenant;
  if b.tenant_id is null then
    raise exception 'tenant has no billing config' using errcode = 'P0001';
  end if;
  select count(*) into v_delivered from public.orders
   where tenant_id = p_tenant and status = 'DELIVERED' and created_at between m.period_start and m.period_end;
  v_amount := case
    when b.trial_ends_at is not null and m.period_start < b.trial_ends_at then 0
    when b.model = 'FREE' then 0
    when b.model = 'MONTHLY' then coalesce(b.monthly_fee, 0)
    when b.model = 'PER_ORDER' then coalesce(b.per_order_fee, 0) * v_delivered
    else coalesce(b.monthly_fee, 0) + coalesce(b.per_order_fee, 0) * v_delivered
  end;
  insert into public.billing_statements (tenant_id, period_start, period_end, model, delivered_orders, amount_due,
    status, note)
  values (p_tenant, m.period_start, m.period_end, b.model, v_delivered, v_amount,
    (case when v_amount = 0 then 'WAIVED' else 'UNPAID' end)::public.statement_status,
    case when v_amount = 0 then (case when b.model = 'FREE' then 'Free plan' else 'Free trial' end) end)
  returning id into v_id;
  return v_id;
end
$$;

-- ------------------------------------------------------------------ suspend / reactivate (PLT-009, BL-10.8)
create function public.set_tenant_status(p_tenant uuid, p_status public.tenant_status, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_platform_admin();
  if p_status = 'SUSPENDED' and nullif(btrim(p_reason), '') is null then
    raise exception 'Give a reason.' using errcode = '22023';
  end if;
  update public.tenants
     set status = p_status, suspend_reason = case when p_status = 'SUSPENDED' then btrim(p_reason) end
   where id = p_tenant;
  if not found then
    raise exception 'tenant not found' using errcode = 'P0001';
  end if;
end
$$;

-- ------------------------------------------------------------------ billing config (PLT-007, BL-10.13)
-- Applies from now; never touches existing statements; clears fields the model doesn't use; FREE has no trial.
create function public.set_tenant_billing(
  p_tenant uuid, p_model public.billing_model, p_monthly_fee integer default null,
  p_per_order_fee integer default null, p_trial_ends_at timestamptz default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := private.require_platform_admin();
  v_monthly boolean := p_model in ('MONTHLY', 'MONTHLY_PLUS_PER_ORDER');
  v_per_order boolean := p_model in ('PER_ORDER', 'MONTHLY_PLUS_PER_ORDER');
begin
  if (v_monthly and coalesce(p_monthly_fee, 0) <= 0) or (v_per_order and coalesce(p_per_order_fee, 0) <= 0) then
    raise exception 'Enter the fees this plan uses.' using errcode = '22023';
  end if;
  update public.tenant_billing
     set model = p_model,
         monthly_fee = case when v_monthly then p_monthly_fee end,
         per_order_fee = case when v_per_order then p_per_order_fee end,
         trial_ends_at = case when p_model <> 'FREE' then p_trial_ends_at end,
         effective_from = now(), updated_by = v_admin
   where tenant_id = p_tenant;
  if not found then
    raise exception 'tenant not found' using errcode = 'P0001';
  end if;
end
$$;

-- ------------------------------------------------------------------ statements (PLT-008, BL-10.5, BL-10.10…10.12)
-- "Create statement" for the month containing p_at (this month counts delivered orders up to now — BL-10.10).
create function public.generate_billing_statement(p_tenant uuid, p_at timestamptz default now()) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_platform_admin();
  if exists (select 1 from public.billing_statements
              where tenant_id = p_tenant and period_start = (select period_start from private.manila_month(p_at))) then
    raise exception 'This month already has a statement.' using errcode = 'P0001';
  end if;
  return private.create_statement(p_tenant, p_at);
end
$$;

-- An UNPAID statement becomes PAID (optional note) or WAIVED (reason required); PAID / WAIVED are final.
create function public.settle_statement(
  p_statement uuid, p_status public.statement_status, p_note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.billing_statements;
begin
  perform private.require_platform_admin();
  select * into s from public.billing_statements where id = p_statement for update;
  if s.id is null then
    raise exception 'statement not found' using errcode = 'P0001';
  end if;
  if s.status <> 'UNPAID' then
    raise exception 'This statement is already settled.' using errcode = 'P0001';
  end if;
  if p_status = 'UNPAID' then
    raise exception 'Mark it paid or waived.' using errcode = '22023';
  end if;
  if p_status = 'WAIVED' and nullif(btrim(p_note), '') is null then
    raise exception 'Give a reason for waiving.' using errcode = '22023';
  end if;
  update public.billing_statements
     set status = p_status, paid_at = case when p_status = 'PAID' then now() end, note = nullif(btrim(p_note), '')
   where id = p_statement;
end
$$;

-- Monthly job: last month's statement for every tenant that doesn't have one yet. Runs daily (idempotent), so a
-- missed day catches up. Returns how many statements it created.
create function private.generate_monthly_statements() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_last_month timestamptz := (select period_start from private.manila_month(now())) - interval '1 second';
  v_start timestamptz := (select period_start from private.manila_month(v_last_month));
  v_tenant uuid;
  n integer := 0;
begin
  for v_tenant in
    select t.id from public.tenants t
     where t.created_at <= (select period_end from private.manila_month(v_last_month))
       and not exists (select 1 from public.billing_statements s where s.tenant_id = t.id and s.period_start = v_start)
  loop
    perform private.create_statement(v_tenant, v_last_month);
    n := n + 1;
  end loop;
  return n;
end
$$;

revoke execute on function
  public.set_tenant_status(uuid, public.tenant_status, text),
  public.set_tenant_billing(uuid, public.billing_model, integer, integer, timestamptz),
  public.generate_billing_statement(uuid, timestamptz), public.settle_statement(uuid, public.statement_status, text)
  from public, anon;
grant execute on function
  public.set_tenant_status(uuid, public.tenant_status, text),
  public.set_tenant_billing(uuid, public.billing_model, integer, integer, timestamptz),
  public.generate_billing_statement(uuid, timestamptz), public.settle_statement(uuid, public.statement_status, text)
  to authenticated;
revoke execute on function private.create_statement(uuid, timestamptz), private.generate_monthly_statements()
  from public, anon, authenticated;

-- Billing rows change only through the functions above (BL-10.13 effective date, BL-10.12 final states).
drop policy tenant_billing_platform_insert on public.tenant_billing;
drop policy tenant_billing_platform_update on public.tenant_billing;
revoke insert, update on public.tenant_billing from authenticated;
drop policy billing_statements_platform_insert on public.billing_statements;
drop policy billing_statements_platform_update on public.billing_statements;
revoke insert, update on public.billing_statements from authenticated;

-- 00:05 Asia/Manila every day (16:05 UTC): last month's statements, if missing.
select cron.schedule('monthly-billing-statements', '5 16 * * *', $$select private.generate_monthly_statements()$$);
