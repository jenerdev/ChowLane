-- ChowLane Phase 2 · Milestone 2.2 — schema built from docs/DATA-MODEL.md v1 (frozen).
-- Conventions (PHASE-2-PLAN): snake_case, uuid ids, tenant_id on every tenant table, money = integer centavos,
-- timestamptz, enums as Postgres enums. Nested model fields become child tables (order_items, order_events,
-- assignment_attempts, verifications, customer_addresses); small rule objects stay JSONB with the same camelCase
-- keys as packages/types and are validated by check functions. LatLng = <name>_lat / <name>_lng columns.
-- Composite foreign keys (id, tenant_id) stop rows from pointing at another tenant's rows.

-- ------------------------------------------------------------------ enums
create type public.active_status as enum ('ACTIVE', 'INACTIVE');
create type public.tenant_status as enum ('ACTIVE', 'SUSPENDED');
create type public.staff_type as enum ('OWNER', 'ADMIN');
create type public.staff_status as enum ('INVITED', 'ACTIVE', 'INACTIVE');
create type public.permission_key as enum (
  'customers.view', 'customers.verify', 'orders.view', 'orders.approve', 'orders.assign', 'orders.cancel',
  'riders.view', 'riders.manage', 'merchants.manage', 'products.manage', 'settings.pricing',
  'settings.riderPay', 'settings.dispatch', 'settings.business', 'admins.manage', 'reports.view',
  'cash.manage', 'coupons.manage', 'loyalty.manage', 'settings.loyalty'
);
create type public.dispatch_mode as enum ('AUTO', 'MANUAL');
create type public.id_type as enum (
  'PHILSYS', 'DRIVERS_LICENSE', 'PASSPORT', 'UMID', 'SSS', 'GSIS', 'PRC', 'POSTAL', 'VOTERS', 'PHILHEALTH',
  'TIN', 'SENIOR_CITIZEN', 'PWD', 'SCHOOL', 'OTHER_GOV'
);
create type public.vehicle_type as enum ('BICYCLE', 'MOTORCYCLE', 'CAR');
create type public.remit_status as enum ('OPEN', 'PENDING', 'RECEIVED', 'SHORT', 'OVER');
create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
create type public.verification_result as enum ('APPROVED', 'REJECTED');
create type public.location_permission as enum ('GRANTED', 'DENIED', 'UNKNOWN');
create type public.coupon_type as enum ('PERCENT_OFF', 'FREE_DELIVERY');
create type public.loyalty_kind as enum (
  'POINTS_EARNED', 'POINTS_REDEEMED', 'POINTS_REFUNDED', 'POINTS_ADJUSTED',
  'FREE_DELIVERY_EARNED', 'FREE_DELIVERY_USED', 'FREE_DELIVERY_REFUNDED',
  'FREE_GIFT_EARNED', 'FREE_GIFT_USED', 'FREE_GIFT_REFUNDED'
);
create type public.order_status as enum (
  'PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'AT_MERCHANT', 'PICKED_UP', 'DELIVERED', 'REJECTED', 'CANCELLED'
);
create type public.actor_type as enum ('CUSTOMER', 'OWNER', 'ADMIN', 'RIDER', 'SYSTEM');
create type public.assigned_by as enum ('AUTO', 'ADMIN');
create type public.attempt_response as enum ('ACCEPTED', 'REJECTED', 'TIMED_OUT', 'WITHDRAWN');
create type public.rider_reject_reason as enum ('NOT_ENOUGH_CASH', 'TOO_FAR', 'VEHICLE_PROBLEM', 'NO_RESPONSE', 'OTHER');
create type public.payment_status as enum ('UNPAID', 'COLLECTED');
create type public.billing_model as enum ('FREE', 'MONTHLY', 'PER_ORDER', 'MONTHLY_PLUS_PER_ORDER');
create type public.statement_status as enum ('UNPAID', 'PAID', 'WAIVED');

-- ------------------------------------------------------------------ JSONB rule validators (shapes = packages/types)
create function public.is_nonneg_int(v jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(v) = 'number' and (v)::numeric >= 0 and (v)::numeric = trunc((v)::numeric), false)
$$;

create function public.is_valid_delivery_fee(r jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(case r ->> 'mode'
    when 'PER_KM' then public.is_nonneg_int(r -> 'baseFee') and public.is_nonneg_int(r -> 'ratePerKm')
      and jsonb_typeof(r -> 'includedKm') = 'number' and (r ->> 'includedKm')::numeric >= 0
      and public.is_nonneg_int(r -> 'minFee')
    when 'FIXED' then public.is_nonneg_int(r -> 'amount')
    when 'PER_BARANGAY' then true
    else false
  end, false)
$$;

create function public.is_valid_rider_pay(r jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(case r ->> 'mode'
    when 'COMMISSION' then jsonb_typeof(r -> 'percent') = 'number'
      and (r ->> 'percent')::numeric between 0 and 100
    when 'DAILY' then public.is_nonneg_int(r -> 'dailyRate')
    when 'PER_DELIVERY' then public.is_nonneg_int(r -> 'ratePerDelivery')
    else false
  end, false)
$$;

create function public.is_valid_loyalty(l jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(l -> 'enabled') = 'boolean'
    and jsonb_typeof(l -> 'freeDelivery' -> 'enabled') = 'boolean'
    and public.is_nonneg_int(l -> 'freeDelivery' -> 'ordersRequired')
    and jsonb_typeof(l -> 'freeGift' -> 'enabled') = 'boolean'
    and public.is_nonneg_int(l -> 'freeGift' -> 'ordersRequired')
    and jsonb_typeof(l -> 'freeGift' -> 'giftName') = 'string'
    and jsonb_typeof(l -> 'points' -> 'enabled') = 'boolean'
    and (l -> 'points' ->> 'earnMode') in ('PER_ORDER', 'PER_PESO')
    and public.is_nonneg_int(l -> 'points' -> 'pointsPerOrder')
    and public.is_nonneg_int(l -> 'points' -> 'centavosPerPoint')
    and public.is_nonneg_int(l -> 'points' -> 'pointValue')
    and public.is_nonneg_int(l -> 'points' -> 'minRedeemPoints')
    and jsonb_typeof(l -> 'points' -> 'maxRedeemPercent') = 'number'
    and (l -> 'points' ->> 'maxRedeemPercent')::numeric between 0 and 100, false)
$$;

-- ------------------------------------------------------------------ platform
create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null unique,
  status public.active_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ tenants
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  -- BL-15.1: 3–30 chars, lowercase letters/digits, single dashes, not at start/end (reserved words: create_tenant)
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 30),
  business_name text not null check (char_length(business_name) > 0),
  short_name text not null check (char_length(short_name) between 1 and 12),
  logo_url text not null default '',
  primary_color text not null check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  currency text not null default 'PHP' check (currency = 'PHP'),
  timezone text not null default 'Asia/Manila' check (timezone = 'Asia/Manila'),
  pwa_icons jsonb not null default '{}'::jsonb check (jsonb_typeof(pwa_icons) = 'object'),
  status public.tenant_status not null default 'ACTIVE',
  suspend_reason text,
  owner_id uuid, -- FK to staff_users added below (deferrable: tenant and owner are created together)
  created_at timestamptz not null default now()
);

create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  service_area_lat double precision not null check (service_area_lat between -90 and 90),
  service_area_lng double precision not null check (service_area_lng between -180 and 180),
  service_area_radius_km numeric(6, 2) not null check (service_area_radius_km > 0),
  delivery_fee jsonb not null check (public.is_valid_delivery_fee(delivery_fee)),
  rider_pay jsonb not null check (public.is_valid_rider_pay(rider_pay)),
  auto_approve_verified_customers boolean not null default false,
  dispatch_mode public.dispatch_mode not null,
  rider_response_timeout_sec integer not null default 60 check (rider_response_timeout_sec > 0),
  accepted_id_types public.id_type[] not null default enum_range(null::public.id_type),
  max_order_subtotal integer not null default 200000 check (max_order_subtotal > 0),
  pin_adjust_radius_m integer not null default 200 check (pin_adjust_radius_m >= 0),
  loyalty jsonb not null check (public.is_valid_loyalty(loyalty))
);

create table public.barangay_fees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  barangay text not null,
  city_municipality text not null,
  province text not null,
  fee integer not null check (fee >= 0),
  is_active boolean not null default true,
  unique (id, tenant_id),
  unique (tenant_id, barangay, city_municipality, province)
);

create table public.tenant_billing (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  model public.billing_model not null default 'FREE',
  monthly_fee integer check (monthly_fee >= 0),
  per_order_fee integer check (per_order_fee >= 0),
  trial_ends_at timestamptz,
  effective_from timestamptz not null default now(),
  updated_by uuid references public.platform_admins (id) on delete set null
);

create table public.billing_statements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null check (period_end > period_start),
  model public.billing_model not null,
  delivered_orders integer not null default 0 check (delivered_orders >= 0),
  amount_due integer not null default 0 check (amount_due >= 0),
  status public.statement_status not null default 'UNPAID',
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (tenant_id, period_start) -- BL-10.10: one statement per tenant per month
);

-- ------------------------------------------------------------------ staff
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (char_length(name) > 0),
  permissions public.permission_key[] not null default '{}',
  is_default boolean not null default false,
  unique (id, tenant_id),
  unique (tenant_id, name),                                         -- BL-2.5
  check (not ('admins.manage' = any (permissions)))                  -- BL-2.5: owner-only
);

create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  auth_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  avatar_url text,
  type public.staff_type not null,
  role_id uuid,
  status public.staff_status not null default 'INVITED',
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, auth_user_id),
  foreign key (role_id, tenant_id) references public.roles (id, tenant_id) on delete restrict, -- BL-2.5
  check ((type = 'OWNER') = (role_id is null))
);
create unique index staff_users_email_per_tenant on public.staff_users (tenant_id, lower(email)); -- BL-2.6
create unique index staff_users_one_owner on public.staff_users (tenant_id) where type = 'OWNER'; -- BL-1.3

alter table public.tenants
  add constraint tenants_owner_fk foreign key (owner_id, id) references public.staff_users (id, tenant_id)
  deferrable initially deferred;

-- ------------------------------------------------------------------ catalog
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  category text not null,
  phone text not null,
  address text not null,
  location_lat double precision not null check (location_lat between -90 and 90),
  location_lng double precision not null check (location_lng between -180 and 180),
  photo_url text not null default '',
  is_open boolean not null default true,
  status public.active_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (id, tenant_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  merchant_id uuid not null,
  name text not null,
  category text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  store_price integer check (store_price >= 0),
  image_url text not null default '',
  is_available boolean not null default true,
  sort_order integer not null default 0,
  unique (id, tenant_id),
  foreign key (merchant_id, tenant_id) references public.merchants (id, tenant_id) on delete cascade
);

-- ------------------------------------------------------------------ riders
create table public.riders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  auth_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null check (phone ~ '^\+639[0-9]{9}$'),
  email text,
  photo_url text not null default '',
  vehicle_type public.vehicle_type not null,
  plate_number text,
  pay_override jsonb check (pay_override is null or public.is_valid_rider_pay(pay_override)),
  is_on_shift boolean not null default false,
  current_shift_id uuid,  -- FK added after shifts
  active_order_id uuid,   -- FK added after orders
  last_location_lat double precision,
  last_location_lng double precision,
  status public.active_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, auth_user_id),
  unique (tenant_id, phone) -- rider logs in with phone + password (Q-30)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  rider_id uuid not null,
  time_in timestamptz not null default now(),
  time_out timestamptz check (time_out is null or time_out >= time_in),
  time_in_lat double precision,
  time_in_lng double precision,
  time_out_lat double precision,
  time_out_lng double precision,
  cash_collected integer not null default 0,
  store_paid integer not null default 0,
  expected_remit integer not null default 0,
  remitted_amount integer check (remitted_amount >= 0),
  remit_status public.remit_status not null default 'OPEN',
  remit_received_by uuid,
  remit_received_at timestamptz,
  remit_note text,
  unique (id, tenant_id),
  foreign key (rider_id, tenant_id) references public.riders (id, tenant_id) on delete cascade,
  foreign key (remit_received_by, tenant_id) references public.staff_users (id, tenant_id)
);

alter table public.riders
  add constraint riders_current_shift_fk foreign key (current_shift_id, tenant_id)
  references public.shifts (id, tenant_id) on delete set null (current_shift_id);

-- ------------------------------------------------------------------ customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  auth_user_id uuid references auth.users (id) on delete set null, -- one login, one customer row per tenant (Q-31)
  facebook_id text not null,
  name text not null,
  email text,
  phone text check (phone is null or phone ~ '^\+639[0-9]{9}$'),
  avatar_url text not null default '',
  verification_status public.verification_status not null default 'UNVERIFIED',
  location_permission public.location_permission not null default 'UNKNOWN',
  -- CustomerLoyalty balances (rebuildable from loyalty_transactions)
  loyalty_delivered_orders integer not null default 0 check (loyalty_delivered_orders >= 0),
  loyalty_orders_toward_free_delivery integer not null default 0 check (loyalty_orders_toward_free_delivery >= 0),
  loyalty_free_delivery_rewards integer not null default 0 check (loyalty_free_delivery_rewards >= 0),
  loyalty_orders_toward_free_gift integer not null default 0 check (loyalty_orders_toward_free_gift >= 0),
  loyalty_free_gift_rewards integer not null default 0 check (loyalty_free_gift_rewards >= 0),
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, auth_user_id),
  unique (tenant_id, facebook_id)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  customer_id uuid not null,
  label text not null,
  line1 text not null,
  barangay text not null,
  city_municipality text not null,
  province text not null,
  barangay_fee_id uuid,
  location_lat double precision not null check (location_lat between -90 and 90),
  location_lng double precision not null check (location_lng between -180 and 180),
  notes text,
  created_at timestamptz not null default now(),
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete cascade,
  foreign key (barangay_fee_id, tenant_id) references public.barangay_fees (id, tenant_id)
    on delete set null (barangay_fee_id)
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  customer_id uuid not null,
  id_type public.id_type not null,
  id_front_url text not null,          -- storage path in the private id-documents bucket (signed URLs)
  id_back_url text,
  selfie_with_id_url text not null,
  submitted_at timestamptz not null default now(),
  order_id uuid,                        -- FK added after orders
  result public.verification_result,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reject_reason text,
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete cascade,
  foreign key (reviewed_by, tenant_id) references public.staff_users (id, tenant_id),
  check (result is null or reviewed_at is not null),
  check (result is distinct from 'REJECTED' or reject_reason is not null)
);

-- ------------------------------------------------------------------ coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]{3,20}$'),            -- BL-13.5 (stored uppercase)
  description text,
  type public.coupon_type not null,
  percent_off integer check (percent_off between 1 and 100),
  max_discount integer check (max_discount >= 0),
  min_order_subtotal integer check (min_order_subtotal >= 0),
  max_uses integer not null check (max_uses >= 1),
  used_count integer not null default 0 check (used_count >= 0),
  per_customer_limit integer not null default 1 check (per_customer_limit >= 1),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, code),
  foreign key (created_by, tenant_id) references public.staff_users (id, tenant_id),
  check (valid_until > valid_from),
  check ((type = 'PERCENT_OFF') = (percent_off is not null)),
  check (type = 'PERCENT_OFF' or max_discount is null)
);

-- ------------------------------------------------------------------ orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_number text not null,
  customer_id uuid not null,
  merchant_id uuid not null,
  rider_id uuid,
  status public.order_status not null default 'PENDING_APPROVAL',
  delivery_location_lat double precision not null,
  delivery_location_lng double precision not null,
  delivery_address_text text not null,
  notes text,
  distance_km numeric(6, 1) not null check (distance_km >= 0),
  delivery_barangay_fee_id uuid,
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  coupon_id uuid,
  coupon_code text,
  coupon_discount integer not null default 0 check (coupon_discount >= 0),
  used_free_delivery_reward boolean not null default false,
  free_delivery_discount integer not null default 0 check (free_delivery_discount >= 0),
  used_free_gift_reward boolean not null default false,
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  points_discount integer not null default 0 check (points_discount >= 0),
  discount_total integer not null default 0 check (discount_total >= 0),
  total integer not null check (total >= 0),
  points_earned integer check (points_earned >= 0),
  delivery_fee_snapshot jsonb not null check (public.is_valid_delivery_fee(delivery_fee_snapshot)),
  rider_earning integer check (rider_earning >= 0),
  payment_method text not null default 'COD' check (payment_method = 'COD'),          -- D-019
  payment_status public.payment_status not null default 'UNPAID',
  change_for integer check (change_for >= 0),
  cash_collected_at timestamptz,
  store_amount_paid integer check (store_amount_paid >= 0),
  store_receipt_photo_url text,
  approved_by uuid,
  -- pendingOffer (BL-5.11)
  offer_rider_id uuid,
  offer_offered_at timestamptz,
  offer_expires_at timestamptz,
  offer_by public.assigned_by,
  offer_staff_id uuid,
  reject_reason text,
  cancel_reason text,
  proof_photo_url text,
  proof_note text,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  unique (tenant_id, order_number),
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id),
  foreign key (merchant_id, tenant_id) references public.merchants (id, tenant_id),
  foreign key (rider_id, tenant_id) references public.riders (id, tenant_id),
  foreign key (offer_rider_id, tenant_id) references public.riders (id, tenant_id),
  foreign key (approved_by, tenant_id) references public.staff_users (id, tenant_id),
  foreign key (offer_staff_id, tenant_id) references public.staff_users (id, tenant_id),
  foreign key (coupon_id, tenant_id) references public.coupons (id, tenant_id),
  foreign key (delivery_barangay_fee_id, tenant_id) references public.barangay_fees (id, tenant_id),
  check (total = subtotal + delivery_fee - discount_total),                           -- BL-7.4
  check (num_nonnulls(offer_rider_id, offer_offered_at, offer_expires_at, offer_by) in (0, 4)),
  check (not (coupon_id is not null and used_free_delivery_reward))                   -- BL-14.6
);
create index orders_tenant_status_created on public.orders (tenant_id, status, created_at desc);
create index orders_customer on public.orders (customer_id, created_at desc);
create index orders_rider on public.orders (rider_id) where rider_id is not null;
create index orders_offer_rider on public.orders (offer_rider_id) where offer_rider_id is not null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  line_no integer not null,
  product_id uuid,
  name text not null,
  unit_price integer not null check (unit_price >= 0),
  store_unit_price integer check (store_unit_price >= 0),
  qty integer not null check (qty > 0),
  line_total integer not null check (line_total = unit_price * qty),
  is_unavailable boolean not null default false,
  is_free_gift boolean not null default false,
  unique (order_id, line_no),
  foreign key (order_id, tenant_id) references public.orders (id, tenant_id) on delete cascade,
  foreign key (product_id, tenant_id) references public.products (id, tenant_id) on delete set null (product_id),
  check (not is_free_gift or unit_price = 0)
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  status public.order_status not null,
  actor_type public.actor_type not null,
  actor_id uuid,
  at timestamptz not null default now(),
  note text,
  foreign key (order_id, tenant_id) references public.orders (id, tenant_id) on delete cascade
);
create index order_events_order on public.order_events (order_id, at);

create table public.assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  rider_id uuid not null,
  by public.assigned_by not null,
  staff_id uuid,
  offered_at timestamptz not null default now(),
  responded_at timestamptz,
  response public.attempt_response,
  reject_reason public.rider_reject_reason,
  reject_note text,
  foreign key (order_id, tenant_id) references public.orders (id, tenant_id) on delete cascade,
  foreign key (rider_id, tenant_id) references public.riders (id, tenant_id),
  foreign key (staff_id, tenant_id) references public.staff_users (id, tenant_id),
  check ((response is null) = (responded_at is null))
);
create index assignment_attempts_order on public.assignment_attempts (order_id, offered_at);
create index assignment_attempts_rider on public.assignment_attempts (rider_id);

alter table public.riders
  add constraint riders_active_order_fk foreign key (active_order_id, tenant_id)
  references public.orders (id, tenant_id) on delete set null (active_order_id);
alter table public.verifications
  add constraint verifications_order_fk foreign key (order_id, tenant_id)
  references public.orders (id, tenant_id) on delete set null (order_id);

-- ------------------------------------------------------------------ coupon & loyalty ledgers
create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  coupon_id uuid not null,
  order_id uuid not null,
  customer_id uuid not null,
  discount integer not null check (discount >= 0),
  redeemed_at timestamptz not null default now(),
  released boolean not null default false,
  unique (order_id),
  foreign key (coupon_id, tenant_id) references public.coupons (id, tenant_id),
  foreign key (order_id, tenant_id) references public.orders (id, tenant_id) on delete cascade,
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id)
);
create index coupon_redemptions_coupon_customer on public.coupon_redemptions (coupon_id, customer_id);

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  customer_id uuid not null,
  order_id uuid,
  kind public.loyalty_kind not null,
  points integer not null default 0,
  rewards integer not null default 0,
  at timestamptz not null default now(),
  staff_id uuid,
  note text,
  foreign key (customer_id, tenant_id) references public.customers (id, tenant_id) on delete cascade,
  foreign key (order_id, tenant_id) references public.orders (id, tenant_id) on delete set null (order_id),
  foreign key (staff_id, tenant_id) references public.staff_users (id, tenant_id),
  check (kind <> 'POINTS_ADJUSTED' or (staff_id is not null and note is not null)) -- BL-14.8: reason required
);
create index loyalty_transactions_customer on public.loyalty_transactions (customer_id, at desc);

-- ------------------------------------------------------------------ lookup indexes
create index on public.barangay_fees (tenant_id);
create index on public.billing_statements (tenant_id, period_start desc);
create index on public.roles (tenant_id);
create index on public.staff_users (auth_user_id);
create index on public.merchants (tenant_id);
create index on public.products (tenant_id, merchant_id, sort_order);
create index on public.riders (auth_user_id);
create index on public.shifts (tenant_id, rider_id, time_in desc);
create index on public.customers (auth_user_id);
create index on public.customer_addresses (customer_id);
create index on public.verifications (customer_id, submitted_at desc);
create index on public.coupons (tenant_id);
create index on public.order_items (order_id);
