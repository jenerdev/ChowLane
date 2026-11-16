/**
 * Generates supabase/tests/database/rls.test.sql — the Row Level Security test matrix (PHASE-2-PLAN "Security").
 * Run: `pnpm db:test:gen`, then `pnpm db:test` (pgTAP via `supabase test db`, needs `pnpm db:reset` first).
 *
 * READ matrix: for every persona × table, the rows the persona can SELECT must equal the rows the expected
 * predicate selects (computed as superuser on the seeded data). `null` = the table is not readable at all
 * (permission denied). Every persona also gets a "no rows of another tenant" check where it applies.
 * WRITE checks: a set of allowed / blocked writes per permission, tenant status and column grants.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { authIdFor, uuidFor } from "./ids";

const OUT = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "supabase",
  "tests",
  "database",
  "rls.test.sql",
);

const FB = `'${uuidFor("t-fastbite")}'`;
const KE = `'${uuidFor("t-kainexpress")}'`;
const PQ = `'${uuidFor("t-pasabuy")}'`;
const R1 = `'${uuidFor("rd-fb-1")}'`;
const R3 = `'${uuidFor("rd-fb-3")}'`;
const C1 = `'${uuidFor("c-fb-1")}'`;
const C2 = `'${uuidFor("c-fb-2")}'`;

type Persona = { key: string; label: string; auth: string | null };
const P = {
  anon: { key: "anon", label: "anonymous", auth: null },
  platform: { key: "platform", label: "platform admin", auth: authIdFor("pa-1") },
  fbOwner: { key: "fbOwner", label: "FastBite owner", auth: authIdFor("s-fb-owner") },
  fbDispatch: { key: "fbDispatch", label: "FastBite dispatcher", auth: authIdFor("s-fb-dispatch") },
  keAdmin: { key: "keAdmin", label: "Kain Express admin", auth: authIdFor("s-ke-admin") },
  pqOwner: { key: "pqOwner", label: "Pasabuy (suspended) owner", auth: authIdFor("s-pq-owner") },
  rider1: { key: "rider1", label: "FastBite rider with a live order", auth: authIdFor("rd-fb-1") },
  rider3: { key: "rider3", label: "FastBite rider without orders", auth: authIdFor("rd-fb-3") },
  cust1: { key: "cust1", label: "FastBite customer with a live order", auth: authIdFor("c-fb-1") },
  cust2: {
    key: "cust2",
    label: "FastBite customer with a pending order",
    auth: authIdFor("c-fb-2"),
  },
  // A login with no business role (created by this test): the invited admin carla@fastbite.ph before accepting.
  invitee: {
    key: "invitee",
    label: "signed-in stranger (invited, not accepted)",
    auth: uuidFor("auth:test-invitee"),
  },
} satisfies Record<string, Persona>;
type Key = keyof typeof P;

// ------------------------------------------------------------------ shared predicates
const LIVE = `('ASSIGNED','AT_MERCHANT','PICKED_UP')`;
const publicMerchant = `(status = 'ACTIVE' and tenant_id in (select id from public.tenants where status = 'ACTIVE'))`;
const publicBarangay = `(is_active and tenant_id in (select id from public.tenants where status = 'ACTIVE'))`;
const ordersOfRider = (r: string) => `(select id from public.orders where rider_id = ${r})`;
const ordersOfCustomer = (c: string) => `(select id from public.orders where customer_id = ${c})`;

/** Staff with every permission of tenant T (owner, or default Admin for most tables). */
const fullStaff = (T: string, opts: { billing: boolean }) => ({
  platform_admins: "false",
  tenants: `id = ${T}`,
  tenant_settings: `tenant_id = ${T}`,
  tenant_billing: opts.billing ? `tenant_id = ${T}` : "false",
  billing_statements: opts.billing ? `tenant_id = ${T}` : "false",
  barangay_fees: `tenant_id = ${T} or ${publicBarangay}`,
  roles: `tenant_id = ${T}`,
  staff_users: `tenant_id = ${T}`,
  merchants: `tenant_id = ${T} or ${publicMerchant}`,
  products: `tenant_id = ${T}`,
  riders: `tenant_id = ${T}`,
  shifts: `tenant_id = ${T}`,
  customers: `tenant_id = ${T}`,
  customer_addresses: `tenant_id = ${T}`,
  verifications: `tenant_id = ${T}`,
  coupons: `tenant_id = ${T}`,
  orders: `tenant_id = ${T}`,
  order_items: `tenant_id = ${T}`,
  order_events: `tenant_id = ${T}`,
  assignment_attempts: `tenant_id = ${T}`,
  coupon_redemptions: `tenant_id = ${T}`,
  loyalty_transactions: `tenant_id = ${T}`,
});

const rider = (R: string) => ({
  platform_admins: "false",
  tenants: `id = ${FB}`,
  tenant_settings: `tenant_id = ${FB}`,
  tenant_billing: "false",
  billing_statements: "false",
  barangay_fees: publicBarangay,
  roles: "false",
  staff_users: "false",
  merchants: `tenant_id = ${FB} or ${publicMerchant}`,
  products: "false",
  riders: `id = ${R}`,
  shifts: `rider_id = ${R}`,
  customers: `id in (select customer_id from public.orders where rider_id = ${R} and status in ${LIVE})`,
  customer_addresses: "false",
  verifications: "false",
  coupons: "false",
  orders: `rider_id = ${R}`,
  order_items: `order_id in ${ordersOfRider(R)}`,
  order_events: `order_id in ${ordersOfRider(R)}`,
  assignment_attempts: `rider_id = ${R}`,
  coupon_redemptions: "false",
  loyalty_transactions: "false",
});

const customer = (C: string) => ({
  platform_admins: "false",
  tenants: `id = ${FB}`,
  tenant_settings: "false",
  tenant_billing: "false",
  billing_statements: "false",
  barangay_fees: publicBarangay,
  roles: "false",
  staff_users: "false",
  merchants: publicMerchant,
  products: "false",
  riders: `id in (select rider_id from public.orders where customer_id = ${C} and status in ${LIVE})`,
  shifts: "false",
  customers: `id = ${C}`,
  customer_addresses: `customer_id = ${C}`,
  verifications: `customer_id = ${C}`,
  coupons: "false",
  orders: `customer_id = ${C}`,
  order_items: `order_id in ${ordersOfCustomer(C)}`,
  order_events: `order_id in ${ordersOfCustomer(C)}`,
  assignment_attempts: "false",
  coupon_redemptions: `customer_id = ${C}`,
  loyalty_transactions: `customer_id = ${C}`,
});

type Table = keyof ReturnType<typeof customer>;
const TABLES = Object.keys(customer(C1)) as Table[];
const anonReadable: Partial<Record<Table, string>> = {
  merchants: publicMerchant,
  barangay_fees: publicBarangay,
};

const READ: Record<Key, Record<Table, string | null>> = {
  anon: Object.fromEntries(TABLES.map((t) => [t, anonReadable[t] ?? null])) as Record<
    Table,
    string | null
  >,
  platform: Object.fromEntries(TABLES.map((t) => [t, "true"])) as Record<Table, string>,
  fbOwner: fullStaff(FB, { billing: true }),
  keAdmin: fullStaff(KE, { billing: false }),
  pqOwner: fullStaff(PQ, { billing: true }),
  // Dispatcher role: orders.view, orders.assign, riders.view, settings.dispatch
  fbDispatch: {
    ...fullStaff(FB, { billing: false }),
    customer_addresses: "false",
    verifications: "false",
    loyalty_transactions: "false",
  },
  rider1: rider(R1),
  rider3: rider(R3),
  cust1: customer(C1),
  cust2: customer(C2),
  // signed in, but no business role anywhere: only what anonymous visitors see
  invitee: Object.fromEntries(TABLES.map((t) => [t, anonReadable[t] ?? "false"])) as Record<
    Table,
    string
  >,
};

const publicProducts = `merchant_id in (select id from public.merchants where status = 'ACTIVE')
      and tenant_id in (select id from public.tenants where status = 'ACTIVE')`;
const VIEWS: { view: string; base: string; where: string }[] = [
  { view: "tenants_public", base: "public.tenants", where: "true" },
  {
    view: "tenant_settings_public",
    base: "public.tenant_settings",
    where: "tenant_id in (select id from public.tenants where status = 'ACTIVE')",
  },
  { view: "products_public", base: "public.products", where: publicProducts },
];

// ------------------------------------------------------------------ writes
type Write = { who: Key; sql: string; expect: string; label: string };
const WRITES: Write[] = [
  // settings: column groups need their own permission (trigger tenant_settings_guard)
  {
    who: "fbDispatch",
    label: "dispatcher switches dispatch mode",
    expect: "ok:1",
    sql: `update public.tenant_settings set dispatch_mode = 'MANUAL' where tenant_id = ${FB}`,
  },
  {
    who: "fbDispatch",
    label: "dispatcher can't change the delivery fee",
    expect: "42501",
    sql: `update public.tenant_settings set delivery_fee = '{"mode":"FIXED","amount":5000}' where tenant_id = ${FB}`,
  },
  {
    who: "keAdmin",
    label: "admin can't change rider pay (settings.riderPay is owner-only)",
    expect: "42501",
    sql: `update public.tenant_settings set rider_pay = '{"mode":"DAILY","dailyRate":50000}' where tenant_id = ${KE}`,
  },
  {
    who: "fbOwner",
    label: "owner changes rider pay",
    expect: "ok:1",
    sql: `update public.tenant_settings set rider_pay = '{"mode":"DAILY","dailyRate":50000}' where tenant_id = ${FB}`,
  },
  {
    who: "keAdmin",
    label: "admin of another tenant can't touch FastBite settings",
    expect: "ok:0",
    sql: `update public.tenant_settings set dispatch_mode = 'MANUAL' where tenant_id = ${FB}`,
  },
  // catalog
  {
    who: "fbOwner",
    label: "owner adds a merchant",
    expect: "ok:1",
    sql: `insert into public.merchants (tenant_id, name, category, phone, address, location_lat, location_lng)
          values (${FB}, 'Test Grill', 'Grill', '+639170000000', 'Makati', 14.55, 121.02)`,
  },
  {
    who: "fbOwner",
    label: "owner can't add a merchant to another tenant",
    expect: "42501",
    sql: `insert into public.merchants (tenant_id, name, category, phone, address, location_lat, location_lng)
          values (${KE}, 'Sneaky', 'Grill', '+639170000000', 'Cebu', 10.3, 123.9)`,
  },
  {
    who: "fbDispatch",
    label: "dispatcher can't add a merchant (no merchants.manage)",
    expect: "42501",
    sql: `insert into public.merchants (tenant_id, name, category, phone, address, location_lat, location_lng)
          values (${FB}, 'Nope', 'Grill', '+639170000000', 'Makati', 14.55, 121.02)`,
  },
  {
    who: "keAdmin",
    label: "admin edits own tenant's products",
    expect: "ok:>0",
    sql: `update public.products set is_available = true where tenant_id = ${KE}`,
  },
  {
    who: "keAdmin",
    label: "admin can't edit another tenant's products",
    expect: "ok:0",
    sql: `update public.products set price = 1 where tenant_id = ${FB}`,
  },
  {
    who: "pqOwner",
    label: "suspended tenant's console is read-only (BL-10.8)",
    expect: "ok:0",
    sql: `update public.merchants set is_open = false where tenant_id = ${PQ}`,
  },
  // roles & staff
  {
    who: "fbOwner",
    label: "admins.manage can't be put in a role (BL-2.5)",
    expect: "23514",
    sql: `insert into public.roles (tenant_id, name, permissions) values (${FB}, 'Boss', '{admins.manage}')`,
  },
  {
    who: "fbOwner",
    label: "default Admin role can't be deleted (BL-2.5)",
    expect: "ok:0",
    sql: `delete from public.roles where tenant_id = ${FB} and is_default`,
  },
  {
    who: "keAdmin",
    label: "admin without admins.manage can't add admins",
    expect: "42501",
    sql: `insert into public.staff_users (tenant_id, name, email, type, role_id)
          select ${KE}, 'X', 'x@ke.ph', 'ADMIN', id from public.roles where tenant_id = ${KE} limit 1`,
  },
  {
    who: "fbOwner",
    label: "owner row can't be edited from the admins screen (BL-2.6)",
    expect: "ok:0",
    sql: `update public.staff_users set name = 'Renamed' where tenant_id = ${FB} and type = 'OWNER'`,
  },
  // riders
  {
    who: "keAdmin",
    label: "riders.manage without settings.riderPay can't set a pay override",
    expect: "42501",
    sql: `update public.riders set pay_override = '{"mode":"PER_DELIVERY","ratePerDelivery":1}' where tenant_id = ${KE}`,
  },
  {
    who: "keAdmin",
    label: "riders.manage edits a rider's vehicle",
    expect: "ok:>0",
    sql: `update public.riders set plate_number = 'TEST 1' where tenant_id = ${KE}`,
  },
  {
    who: "fbOwner",
    label: "rider shift fields are function-only (column grant)",
    expect: "42501",
    sql: `update public.riders set is_on_shift = false where id = ${R1}`,
  },
  // coupons
  {
    who: "fbOwner",
    label: "a used coupon's code can't change (BL-13.10)",
    expect: "23514",
    sql: `update public.coupons set code = 'NEWCODE' where tenant_id = ${FB} and used_count > 0`,
  },
  {
    who: "fbOwner",
    label: "a used coupon can't be deleted (BL-13.10)",
    expect: "ok:0",
    sql: `delete from public.coupons where tenant_id = ${FB} and used_count > 0`,
  },
  {
    who: "fbOwner",
    label: "coupon codes are stored uppercase (BL-13.5)",
    expect: "ok:1",
    sql: `insert into public.coupons (tenant_id, code, type, max_uses, valid_from, valid_until)
          values (${FB}, 'lower10', 'FREE_DELIVERY', 5, now(), now() + interval '1 day')`,
  },
  // customers
  {
    who: "cust1",
    label: "customer edits own name",
    expect: "ok:1",
    sql: `update public.customers set name = 'Andrea L.' where id = ${C1}`,
  },
  {
    who: "cust1",
    label: "customer can't verify themselves (column grant)",
    expect: "42501",
    sql: `update public.customers set verification_status = 'VERIFIED' where id = ${C2}`,
  },
  {
    who: "cust1",
    label: "customer can't edit another customer",
    expect: "ok:0",
    sql: `update public.customers set name = 'Hacked' where id = ${C2}`,
  },
  {
    who: "cust1",
    label: "customer adds own address",
    expect: "ok:1",
    sql: `insert into public.customer_addresses (tenant_id, customer_id, label, line1, barangay, city_municipality,
          province, location_lat, location_lng) values (${FB}, ${C1}, 'Office', '1 Ayala', 'Bel-Air', 'Makati',
          'Metro Manila', 14.55, 121.02)`,
  },
  {
    who: "cust1",
    label: "customer can't add an address for someone else",
    expect: "42501",
    sql: `insert into public.customer_addresses (tenant_id, customer_id, label, line1, barangay, city_municipality,
          province, location_lat, location_lng) values (${FB}, ${C2}, 'X', 'X', 'X', 'X', 'X', 14.55, 121.02)`,
  },
  // orders & ledgers: functions only
  {
    who: "cust1",
    label: "customer can't write orders directly (place_order function)",
    expect: "42501",
    sql: `update public.orders set total = 0 where customer_id = ${C1}`,
  },
  {
    who: "rider1",
    label: "rider can't change order status directly",
    expect: "42501",
    sql: `update public.orders set status = 'DELIVERED' where rider_id = ${R1}`,
  },
  {
    who: "fbOwner",
    label: "staff can't write the loyalty ledger directly",
    expect: "42501",
    sql: `insert into public.loyalty_transactions (tenant_id, customer_id, kind, points) values (${FB}, ${C1}, 'POINTS_EARNED', 999)`,
  },
  {
    who: "anon",
    label: "anonymous can't write anything",
    expect: "42501",
    sql: `insert into public.merchants (tenant_id, name, category, phone, address, location_lat, location_lng)
          values (${FB}, 'Anon', 'X', '+639170000000', 'X', 14.5, 121.0)`,
  },
  // platform
  {
    who: "fbOwner",
    label: "owner can't change their own billing plan (BL-10.3)",
    expect: "ok:0",
    sql: `update public.tenant_billing set model = 'FREE' where tenant_id = ${FB}`,
  },
  {
    who: "platform",
    label: "platform admin changes a tenant's billing",
    expect: "ok:1",
    sql: `update public.tenant_billing set model = 'FREE', monthly_fee = null, per_order_fee = null where tenant_id = ${KE}`,
  },
  {
    who: "platform",
    label: "platform admin can't edit tenant records (read-only, BL-10.3)",
    expect: "42501",
    sql: `insert into public.merchants (tenant_id, name, category, phone, address, location_lat, location_lng)
          values (${FB}, 'Platform', 'X', '+639170000000', 'X', 14.5, 121.0)`,
  },
  // auth functions (2.3)
  {
    who: "fbDispatch",
    label: "has_permission says no to a missing permission",
    expect: "ok:0",
    sql: `select 1 where public.has_permission(${FB}, 'admins.manage')`,
  },
  {
    who: "fbOwner",
    label: "has_permission says yes to the owner",
    expect: "ok:1",
    sql: `select 1 where public.has_permission(${FB}, 'admins.manage')`,
  },
  {
    who: "fbOwner",
    label: "create_tenant is server-only (service role)",
    expect: "42501",
    sql: `select public.create_tenant(null, null, null, null, null, null, null, null, null, null, null, null, null)`,
  },
  {
    who: "invitee",
    label: "an invited admin's first login links the invite (BL-2.6)",
    expect: "ok:1",
    sql: `select public.accept_staff_invite(${FB})`,
  },
  {
    who: "invitee",
    label: "after accepting, the role's permissions apply",
    expect: "ok:1",
    sql: `select 1 where public.has_permission(${FB}, 'orders.view')`,
  },
  {
    who: "cust2",
    label: "first visit to another business creates a customer row there (Q-31)",
    expect: "ok:1",
    sql: `select public.ensure_customer(${KE})`,
  },
  {
    who: "cust2",
    label: "a suspended business doesn't take new customers (BL-10.8)",
    expect: "42501",
    sql: `select public.ensure_customer(${PQ})`,
  },
  {
    who: "rider1",
    label: "a rider's login can't become a customer of the same business",
    expect: "42501",
    sql: `select public.ensure_customer(${FB})`,
  },
  {
    who: "anon",
    label: "anonymous can't create customers",
    expect: "42501",
    sql: `select public.ensure_customer(${FB})`,
  },
  {
    who: "fbOwner",
    label: "the owner can't be removed from the admins screen",
    expect: "ok:0",
    sql: `delete from public.staff_users where tenant_id = ${FB} and type = 'OWNER'`,
  },
  {
    who: "keAdmin",
    label: "admin of another tenant can't remove FastBite admins",
    expect: "ok:0",
    sql: `delete from public.staff_users where tenant_id = ${FB} and type = 'ADMIN'`,
  },
  {
    who: "fbOwner",
    label: "owner removes an admin; their history stays (BL-2.6)",
    expect: "ok:1",
    sql: `delete from public.staff_users where id = '${uuidFor("s-fb-dispatch")}'`,
  },
];

// ------------------------------------------------------------------ render
const lit = (s: string) => `$q$${s}$q$`;
const as = (p: Persona) => (p.auth ? `'${p.auth}'::uuid` : "null::uuid");
const lines: string[] = [];
let count = 0;

for (const key of Object.keys(P) as Key[]) {
  const p = P[key];
  for (const table of TABLES) {
    const where = READ[key][table];
    count++;
    if (where === null) {
      lines.push(`select is(tests.rls_count(${as(p)}, 'public.${table}'), -1::bigint,
  ${lit(`${p.label}: public.${table} is not readable`)});`);
    } else {
      lines.push(`select is(tests.rls_count(${as(p)}, 'public.${table}'),
  (select count(*) from public.${table} where ${where}),
  ${lit(`${p.label}: public.${table} rows`)});`);
    }
  }
}
for (const key of ["anon", "cust1"] as Key[]) {
  for (const v of VIEWS) {
    count++;
    lines.push(`select is(tests.rls_count(${as(P[key])}, 'public.${v.view}'),
  (select count(*) from ${v.base} where ${v.where}),
  ${lit(`${P[key].label}: public.${v.view} rows`)});`);
  }
}
// sanity: the matrix must not pass vacuously — personas really see their own data
const nonEmpty: [Key, Table][] = [
  ["fbOwner", "orders"],
  ["fbDispatch", "orders"],
  ["keAdmin", "customers"],
  ["rider1", "orders"],
  ["rider1", "customers"],
  ["cust1", "orders"],
  ["cust1", "riders"],
  ["cust2", "orders"],
  ["platform", "orders"],
];
for (const [key, table] of nonEmpty) {
  count++;
  lines.push(`select cmp_ok(tests.rls_count(${as(P[key])}, 'public.${table}'), '>', 0::bigint,
  ${lit(`${P[key].label}: sees some ${table}`)});`);
}

lines.push("", "-- ---------------------------------------------------------------- writes");
for (const w of WRITES) {
  count++;
  const result = `tests.rls_exec(${as(P[w.who])}, ${lit(w.sql)})`;
  if (w.expect === "ok:>0") {
    lines.push(`select matches(${result}, '^ok:[1-9]', ${lit(`${P[w.who].label}: ${w.label}`)});`);
  } else {
    lines.push(`select is(${result}, '${w.expect}', ${lit(`${P[w.who].label}: ${w.label}`)});`);
  }
}
count++;
lines.push(
  `select is((select code from public.coupons where code = 'LOWER10'), 'LOWER10', 'coupon code was uppercased');`,
);
count++;
lines.push(
  `select is((select status::text from public.staff_users where email = 'carla@fastbite.ph'), 'ACTIVE', 'accepted invite is ACTIVE');`,
);
count++;
lines.push(
  `select is((select count(*) from public.customers where tenant_id = ${KE} and auth_user_id = '${P.cust2.auth}'), 1::bigint, 'one customer row in the new business');`,
);

const sql = `-- GENERATED by packages/db/scripts/gen-rls-tests.ts — do not edit by hand. Regenerate: pnpm db:test:gen
-- Run: pnpm db:test (local Supabase with the seed loaded: pnpm db:reset).
begin;
create extension if not exists pgtap with schema extensions;
select plan(${count});

create schema if not exists tests;

-- A login with no business role: carla@fastbite.ph has an INVITED staff row in the seed.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000', '${P.invitee.auth}', 'authenticated', 'authenticated',
  'carla@fastbite.ph', '{}', '{}');

-- Rows visible to a user (auth uid, or null = anonymous); -1 when the table is not readable at all.
create or replace function tests.rls_count(p_auth uuid, p_table text) returns bigint
language plpgsql as $fn$
declare c bigint;
begin
  perform set_config('request.jwt.claims',
    case when p_auth is null then '{"role":"anon"}'
         else json_build_object('sub', p_auth, 'role', 'authenticated')::text end, true);
  perform set_config('role', case when p_auth is null then 'anon' else 'authenticated' end, true);
  begin
    execute format('select count(*) from %s', p_table) into c;
  exception when insufficient_privilege then
    c := -1;
  end;
  reset role;
  return c;
end
$fn$;

-- Runs a write as a user: 'ok:<rows affected>' or the SQLSTATE of the error. Changes stay in this transaction.
create or replace function tests.rls_exec(p_auth uuid, p_sql text) returns text
language plpgsql as $fn$
declare n bigint; r text;
begin
  perform set_config('request.jwt.claims',
    case when p_auth is null then '{"role":"anon"}'
         else json_build_object('sub', p_auth, 'role', 'authenticated')::text end, true);
  perform set_config('role', case when p_auth is null then 'anon' else 'authenticated' end, true);
  begin
    execute p_sql;
    get diagnostics n = row_count;
    r := 'ok:' || n;
  exception when others then
    r := sqlstate;
  end;
  reset role;
  return r;
end
$fn$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------- reads (persona × table)
${lines.join("\n")}

select * from finish();
rollback;
`;
writeFileSync(OUT, sql);
console.log(`wrote ${OUT} (${count} tests)`);
