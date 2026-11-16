/**
 * Database rows (snake_case, null) → @chowlane/types shapes (camelCase, undefined), per DATA-MODEL "Phase 2 —
 * database mapping". Screens keep using the domain types; only data loading changes.
 */
import type {
  DeliveryFeeRule,
  LoyaltySettings,
  PermissionKey,
  Rider,
  RiderPayRule,
  Role,
  Shift,
  StaffUser,
  TenantSettings,
} from "@chowlane/types";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
export type StaffRow = Tables["staff_users"]["Row"];
export type RoleRow = Tables["roles"]["Row"];
export type RiderRow = Tables["riders"]["Row"];
export type ShiftRow = Tables["shifts"]["Row"];
export type SettingsRow = Tables["tenant_settings"]["Row"];

const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const latLng = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? undefined : { lat, lng };

export function toStaffUser(r: StaffRow): StaffUser {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.email,
    avatarUrl: u(r.avatar_url),
    type: r.type,
    roleId: u(r.role_id),
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toRole(r: RoleRow): Role {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    permissions: r.permissions as PermissionKey[],
    isDefault: r.is_default,
  };
}

export function toRider(r: RiderRow): Rider {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    phone: r.phone,
    email: u(r.email),
    photoUrl: r.photo_url,
    vehicleType: r.vehicle_type,
    plateNumber: u(r.plate_number),
    payOverride: (r.pay_override ?? undefined) as RiderPayRule | undefined,
    isOnShift: r.is_on_shift,
    currentShiftId: u(r.current_shift_id),
    activeOrderId: u(r.active_order_id),
    lastLocation: latLng(r.last_location_lat, r.last_location_lng),
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toShift(r: ShiftRow): Shift {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    riderId: r.rider_id,
    timeIn: r.time_in,
    timeOut: u(r.time_out),
    timeInLocation: latLng(r.time_in_lat, r.time_in_lng),
    timeOutLocation: latLng(r.time_out_lat, r.time_out_lng),
    cashCollected: r.cash_collected,
    storePaid: r.store_paid,
    expectedRemit: r.expected_remit,
    remittedAmount: u(r.remitted_amount),
    remitStatus: r.remit_status,
    remitReceivedBy: u(r.remit_received_by),
    remitReceivedAt: u(r.remit_received_at),
    remitNote: u(r.remit_note),
  };
}

export function toTenantSettings(r: SettingsRow): TenantSettings {
  return {
    tenantId: r.tenant_id,
    serviceArea: {
      center: { lat: r.service_area_lat, lng: r.service_area_lng },
      radiusKm: Number(r.service_area_radius_km),
    },
    deliveryFee: (r.delivery_fee ?? undefined) as DeliveryFeeRule | undefined,
    riderPay: (r.rider_pay ?? undefined) as RiderPayRule | undefined,
    autoApproveVerifiedCustomers: r.auto_approve_verified_customers,
    dispatchMode: r.dispatch_mode,
    riderResponseTimeoutSec: r.rider_response_timeout_sec,
    acceptedIdTypes: r.accepted_id_types,
    maxOrderSubtotal: r.max_order_subtotal,
    pinAdjustRadiusM: r.pin_adjust_radius_m,
    loyalty: r.loyalty as LoyaltySettings,
  };
}
