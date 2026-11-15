import type { Centavos, ID, ISODateTime, LatLng, TenantSlug } from "./common";
import type { IdType } from "./customer";
import type { LoyaltySettings } from "./loyalty";

export type TenantStatus = "ACTIVE" | "SUSPENDED";

export type TenantPwaIcons = {
  icon192Url: string;
  icon512Url: string;
  maskableUrl: string;
  appleTouchUrl: string;
};

export type Tenant = {
  id: ID;
  slug: TenantSlug;
  businessName: string;
  /** PWA home-screen label, max 12 chars. */
  shortName: string;
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
  currency: "PHP";
  timezone: "Asia/Manila";
  pwaIcons: TenantPwaIcons;
  status: TenantStatus;
  suspendReason?: string;
  ownerId: ID;
  createdAt: ISODateTime;
};

/** Delivery fee rule (BL-7.2). */
export type DeliveryFeeRule =
  | {
      mode: "PER_KM";
      baseFee: Centavos;
      ratePerKm: Centavos;
      includedKm: number;
      minFee: Centavos;
    }
  | { mode: "FIXED"; amount: Centavos }
  | { mode: "PER_BARANGAY" };

export type DeliveryFeeMode = DeliveryFeeRule["mode"];

/** Rider income rule (BL-8.1). */
export type RiderPayRule =
  | { mode: "DAILY"; dailyRate: Centavos }
  | { mode: "COMMISSION"; percent: number }
  | { mode: "PER_DELIVERY"; ratePerDelivery: Centavos };

export type RiderPayMode = RiderPayRule["mode"];

export type DispatchMode = "AUTO" | "MANUAL";

export type TenantSettings = {
  tenantId: ID;
  serviceArea: { center: LatLng; radiusKm: number };
  deliveryFee: DeliveryFeeRule;
  riderPay: RiderPayRule;
  autoApproveVerifiedCustomers: boolean;
  dispatchMode: DispatchMode;
  riderResponseTimeoutSec: number;
  acceptedIdTypes: IdType[];
  maxOrderSubtotal: Centavos;
  pinAdjustRadiusM: number;
  /** Loyalty program — tenant decides which rules to enable (BL-14). */
  loyalty: LoyaltySettings;
};

/** PER_BARANGAY price list entry (BL-7.2). */
export type BarangayFee = {
  id: ID;
  tenantId: ID;
  barangay: string;
  cityMunicipality: string;
  province: string;
  fee: Centavos;
  isActive: boolean;
};
