import type { ID, ISODateTime } from "./common";

/** Every permission an Admin role can hold (BL-2). The Owner always has all of them. */
export const PERMISSION_KEYS = [
  "customers.view",
  "customers.verify",
  "orders.view",
  "orders.approve",
  "orders.assign",
  "orders.cancel",
  "riders.view",
  "riders.manage",
  "merchants.manage",
  "products.manage",
  "settings.pricing",
  "settings.riderPay",
  "settings.dispatch",
  "settings.business",
  "admins.manage",
  "reports.view",
  "cash.manage",
  "coupons.manage",
  "loyalty.manage",
  "settings.loyalty",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type StaffType = "OWNER" | "ADMIN";

export type StaffUser = {
  id: ID;
  tenantId: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  type: StaffType;
  /** Undefined for the OWNER (has all permissions). */
  roleId?: ID;
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  createdAt: ISODateTime;
};

export type Role = {
  id: ID;
  tenantId: ID;
  name: string;
  permissions: PermissionKey[];
  isDefault: boolean;
};
