import type { PermissionKey, Role, StaffUser } from "@chowlane/types";
import { PERMISSION_KEYS } from "@chowlane/types";

/** Permissions of the pre-created default "Admin" role (BL-2 table). */
export const DEFAULT_ADMIN_PERMISSIONS: PermissionKey[] = [
  "customers.view",
  "customers.verify",
  "orders.view",
  "orders.approve",
  "orders.assign",
  "riders.view",
  "riders.manage",
  "merchants.manage",
  "products.manage",
  "settings.pricing",
  "settings.dispatch",
  "cash.manage",
  "coupons.manage",
  "loyalty.manage",
];

/** Permissions only the Owner holds by default (never in the default Admin role). */
export const OWNER_ONLY_PERMISSIONS: PermissionKey[] = ["admins.manage", "settings.riderPay"];

/** Owner has every permission (BL-2.1); admins have what their role grants. Inactive staff have none. */
export function permissionsOf(staff: StaffUser, role?: Role): PermissionKey[] {
  if (staff.status !== "ACTIVE") return [];
  if (staff.type === "OWNER") return [...PERMISSION_KEYS];
  return role && role.id === staff.roleId ? role.permissions : [];
}

export function hasPermission(
  staff: StaffUser,
  role: Role | undefined,
  key: PermissionKey,
): boolean {
  return permissionsOf(staff, role).includes(key);
}
