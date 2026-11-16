import type {
  ActorType,
  AssignedBy,
  CouponType,
  DispatchMode,
  LoyaltyTransactionKind,
  RemitStatus,
  RiderRejectReason,
  StaffType,
  TenantStatus,
  VehicleType,
  VerificationStatus,
} from "@chowlane/types";
import { BILLING_MODELS, ID_TYPES, ORDER_STATUSES, PERMISSION_KEYS } from "@chowlane/types";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Constants, type Database } from "./database.types";

type Enums = Database["public"]["Enums"];
const E = Constants.public.Enums;

/** The database (DATA-MODEL v1 → migrations) and packages/types must list the same values. */
describe("database enums match @chowlane/types", () => {
  it("runtime lists", () => {
    expect([...E.permission_key].sort()).toEqual([...PERMISSION_KEYS].sort());
    expect([...E.id_type].sort()).toEqual([...ID_TYPES].sort());
    expect([...E.order_status].sort()).toEqual([...ORDER_STATUSES].sort());
    expect([...E.billing_model].sort()).toEqual([...BILLING_MODELS].sort());
  });

  it("type-only unions", () => {
    expectTypeOf<Enums["tenant_status"]>().toEqualTypeOf<TenantStatus>();
    expectTypeOf<Enums["staff_type"]>().toEqualTypeOf<StaffType>();
    expectTypeOf<Enums["dispatch_mode"]>().toEqualTypeOf<DispatchMode>();
    expectTypeOf<Enums["vehicle_type"]>().toEqualTypeOf<VehicleType>();
    expectTypeOf<Enums["remit_status"]>().toEqualTypeOf<RemitStatus>();
    expectTypeOf<Enums["verification_status"]>().toEqualTypeOf<VerificationStatus>();
    expectTypeOf<Enums["coupon_type"]>().toEqualTypeOf<CouponType>();
    expectTypeOf<Enums["loyalty_kind"]>().toEqualTypeOf<LoyaltyTransactionKind>();
    expectTypeOf<Enums["actor_type"]>().toEqualTypeOf<ActorType>();
    expectTypeOf<Enums["assigned_by"]>().toEqualTypeOf<AssignedBy>();
    expectTypeOf<Enums["rider_reject_reason"]>().toEqualTypeOf<RiderRejectReason>();
  });
});
