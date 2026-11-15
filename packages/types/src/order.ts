import type { Centavos, ID, ISODateTime, LatLng } from "./common";
import type { DeliveryFeeRule } from "./tenant";

export const ORDER_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "ASSIGNED",
  "AT_MERCHANT",
  "PICKED_UP",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ActorType = "CUSTOMER" | "OWNER" | "ADMIN" | "RIDER" | "SYSTEM";

export type OrderItem = {
  productId: ID;
  name: string;
  unitPrice: Centavos;
  /** Expected store price per unit (used for "cash needed at store", BL-11.4). */
  storeUnitPrice?: Centavos;
  qty: number;
  lineTotal: Centavos;
  /** Marked by the rider at the store (BL-11.7). */
  isUnavailable?: boolean;
  /** Loyalty free gift (unitPrice 0; the business pays the store — BL-14.3b). */
  isFreeGift?: boolean;
};

export type AssignedBy = "AUTO" | "ADMIN";

export type RiderRejectReason =
  "NOT_ENOUGH_CASH" | "TOO_FAR" | "VEHICLE_PROBLEM" | "NO_RESPONSE" | "OTHER";

export type AssignmentAttempt = {
  riderId: ID;
  by: AssignedBy;
  staffId?: ID;
  offeredAt: ISODateTime;
  respondedAt?: ISODateTime;
  response?: "ACCEPTED" | "REJECTED" | "TIMED_OUT" | "WITHDRAWN";
  rejectReason?: RiderRejectReason;
  rejectNote?: string;
};

export type PendingOffer = {
  riderId: ID;
  offeredAt: ISODateTime;
  expiresAt: ISODateTime;
  by: AssignedBy;
  staffId?: ID;
};

export type OrderEvent = {
  status: OrderStatus;
  actorType: ActorType;
  actorId?: ID;
  at: ISODateTime;
  note?: string;
};

export type Order = {
  id: ID;
  tenantId: ID;
  orderNumber: string;
  customerId: ID;
  merchantId: ID;
  riderId?: ID;
  status: OrderStatus;
  items: OrderItem[];
  deliveryLocation: LatLng;
  deliveryAddressText: string;
  notes?: string;
  distanceKm: number;
  deliveryBarangayFeeId?: ID;
  subtotal: Centavos;
  deliveryFee: Centavos;
  /** Coupon used (one promo per order: a coupon OR a loyalty free-delivery reward — BL-14.6). */
  couponId?: ID;
  couponCode?: string;
  couponDiscount: Centavos;
  usedFreeDeliveryReward: boolean;
  /** A loyalty free gift was claimed on this order. */
  usedFreeGiftReward: boolean;
  freeDeliveryDiscount: Centavos;
  pointsRedeemed: number;
  pointsDiscount: Centavos;
  discountTotal: Centavos;
  /** subtotal + deliveryFee − discountTotal — what the customer pays in cash. */
  total: Centavos;
  /** Loyalty points earned when DELIVERED. */
  pointsEarned?: number;
  /** Fee rule in force at checkout (fee is frozen on the order — BL-7.5). */
  deliveryFeeSnapshot: DeliveryFeeRule;
  /** Computed when DELIVERED. */
  riderEarning?: Centavos;
  paymentMethod: "COD";
  paymentStatus: "UNPAID" | "COLLECTED";
  changeFor?: Centavos;
  cashCollectedAt?: ISODateTime;
  storeAmountPaid?: Centavos;
  storeReceiptPhotoUrl?: string;
  approvedBy?: ID;
  pendingOffer?: PendingOffer;
  assignmentAttempts: AssignmentAttempt[];
  rejectReason?: string;
  cancelReason?: string;
  proofOfDelivery?: { photoUrl?: string; note?: string };
  timeline: OrderEvent[];
  createdAt: ISODateTime;
};
