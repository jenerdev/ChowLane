/**
 * Console helpers for Owner setup (Milestone 1.3): permission labels, coupon status, setup checklist.
 */
import type {
  Coupon,
  DeliveryFeeMode,
  Merchant,
  PermissionKey,
  Product,
  Rider,
  RiderPayMode,
  StaffUser,
} from "@chowlane/types";

// ------------------------------------------------------------------ permissions (BL-2)
export const PERMISSION_GROUPS: {
  title: string;
  items: { key: PermissionKey; label: string; description: string }[];
}[] = [
  {
    title: "Orders",
    items: [
      {
        key: "orders.view",
        label: "View orders",
        description: "See all orders and their timeline.",
      },
      {
        key: "orders.approve",
        label: "Approve orders",
        description: "Approve or reject new orders.",
      },
      {
        key: "orders.assign",
        label: "Assign riders",
        description: "Assign and reassign riders to orders.",
      },
      {
        key: "orders.cancel",
        label: "Cancel orders",
        description: "Cancel an order before pickup.",
      },
    ],
  },
  {
    title: "Customers",
    items: [
      {
        key: "customers.view",
        label: "View customers",
        description: "See the customer list and details.",
      },
      {
        key: "customers.verify",
        label: "Verify customers",
        description: "Approve or reject first-time customers' IDs.",
      },
      {
        key: "loyalty.manage",
        label: "Manage customer points",
        description: "Adjust a customer's loyalty points.",
      },
    ],
  },
  {
    title: "Riders & cash",
    items: [
      {
        key: "riders.view",
        label: "View riders",
        description: "See riders, shifts and live locations.",
      },
      { key: "riders.manage", label: "Manage riders", description: "Add, edit and remove riders." },
      {
        key: "cash.manage",
        label: "Record cash",
        description: "Record the cash riders hand over after a shift.",
      },
    ],
  },
  {
    title: "Menu & promos",
    items: [
      {
        key: "merchants.manage",
        label: "Manage merchants",
        description: "Add and edit restaurants.",
      },
      {
        key: "products.manage",
        label: "Manage products",
        description: "Add and edit menu items and prices.",
      },
      {
        key: "coupons.manage",
        label: "Manage coupons",
        description: "Create, edit and turn off coupons.",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        key: "settings.business",
        label: "Business settings",
        description: "Name, logo, color, service area, IDs.",
      },
      {
        key: "settings.pricing",
        label: "Delivery fees",
        description: "Delivery fee rules and barangay prices.",
      },
      {
        key: "settings.dispatch",
        label: "Dispatch mode",
        description: "Switch between auto and manual assign.",
      },
      { key: "settings.riderPay", label: "Rider income", description: "How riders are paid." },
      {
        key: "settings.loyalty",
        label: "Loyalty program",
        description: "Turn rewards on or off and set rules.",
      },
      { key: "reports.view", label: "Reports", description: "Sales, rider pay and other reports." },
      {
        key: "admins.manage",
        label: "Admins & roles",
        description: "Invite admins and decide what they can do.",
      },
    ],
  },
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label])),
) as Record<PermissionKey, string>;

// ------------------------------------------------------------------ coupons (BL-13)
export type CouponStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "USED_UP" | "INACTIVE";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  EXPIRED: "Expired",
  USED_UP: "Used up",
  INACTIVE: "Turned off",
};

export function couponStatus(coupon: Coupon, now: string): CouponStatus {
  if (!coupon.isActive) return "INACTIVE";
  const t = Date.parse(now);
  if (t > Date.parse(coupon.validUntil)) return "EXPIRED";
  if (coupon.usedCount >= coupon.maxUses) return "USED_UP";
  if (t < Date.parse(coupon.validFrom)) return "SCHEDULED";
  return "ACTIVE";
}

export type CouponDraftProblem = Partial<
  Record<"code" | "percentOff" | "maxUses" | "perCustomerLimit" | "validUntil", string>
>;

/** Validate a coupon form (BL-13.5). `takenCodes` = other coupons of the tenant. */
export function checkCouponDraft(c: Partial<Coupon>, takenCodes: string[]): CouponDraftProblem {
  const e: CouponDraftProblem = {};
  const code = c.code ?? "";
  if (!/^[A-Z0-9]{3,20}$/.test(code)) e.code = "Use 3–20 letters or numbers, no spaces.";
  else if (takenCodes.includes(code)) e.code = "Another coupon already uses this code.";
  if (c.type === "PERCENT_OFF" && !(c.percentOff && c.percentOff >= 1 && c.percentOff <= 100))
    e.percentOff = "Enter a percentage from 1 to 100.";
  if (!c.maxUses || c.maxUses < 1) e.maxUses = "Allow at least 1 use.";
  if (!c.perCustomerLimit || c.perCustomerLimit < 1)
    e.perCustomerLimit = "Allow at least 1 use per customer.";
  if (!c.validFrom || !c.validUntil || Date.parse(c.validUntil) <= Date.parse(c.validFrom))
    e.validUntil = "End must be after the start.";
  return e;
}

// ------------------------------------------------------------------ setup checklist (OWN-001, F-02)
export type SetupStepKey =
  | "branding"
  | "serviceArea"
  | "deliveryFee"
  | "riderPay"
  | "merchant"
  | "products"
  | "rider"
  | "admin";

export type SetupStep = {
  key: SetupStepKey;
  title: string;
  done: boolean;
  href: string;
  optional?: boolean;
};

export type SetupInput = {
  slug: string;
  logoUrl: string;
  serviceAreaConfirmed: boolean;
  deliveryFeeMode?: DeliveryFeeMode;
  barangayCount: number;
  riderPayMode?: RiderPayMode;
  merchants: Merchant[];
  products: Product[];
  riders: Rider[];
  staff: StaffUser[];
};

/** Getting-started checklist shown on the console home until everything required is done. */
export function setupChecklist(i: SetupInput): SetupStep[] {
  const base = `/${i.slug}`;
  const activeMerchants = i.merchants.filter((m) => m.status === "ACTIVE");
  return [
    {
      key: "branding",
      title: "Add your logo",
      done: Boolean(i.logoUrl),
      href: `${base}/settings/business`,
      optional: true,
    },
    {
      key: "serviceArea",
      title: "Set your delivery area",
      done: i.serviceAreaConfirmed,
      href: `${base}/settings/area`,
    },
    {
      key: "deliveryFee",
      title: "Set your delivery fee",
      done:
        Boolean(i.deliveryFeeMode) && (i.deliveryFeeMode !== "PER_BARANGAY" || i.barangayCount > 0),
      href: `${base}/settings/pricing`,
    },
    {
      key: "riderPay",
      title: "Choose how riders are paid",
      done: Boolean(i.riderPayMode),
      href: `${base}/settings/rider-pay`,
    },
    {
      key: "merchant",
      title: "Add your first restaurant",
      done: activeMerchants.length > 0,
      href: `${base}/merchants/new`,
    },
    {
      key: "products",
      title: "Add menu items",
      done: i.products.some((p) => activeMerchants.some((m) => m.id === p.merchantId)),
      href: `${base}/merchants`,
    },
    {
      key: "rider",
      title: "Add your first rider",
      done: i.riders.length > 0,
      href: `${base}/riders/new`,
    },
    {
      key: "admin",
      title: "Invite an admin",
      done: i.staff.some((s) => s.type === "ADMIN"),
      href: `${base}/settings/admins`,
      optional: true,
    },
  ];
}

export function checklistProgress(steps: SetupStep[]): {
  done: number;
  total: number;
  complete: boolean;
} {
  const required = steps.filter((s) => !s.optional);
  const done = required.filter((s) => s.done).length;
  return { done, total: required.length, complete: done === required.length };
}
