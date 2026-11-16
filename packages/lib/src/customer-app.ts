/**
 * Customer app business logic (Milestone 1.5): checkout quote, order building, cancel refunds.
 * Pure functions only — the customer app applies the results to its store (Phase 2: server functions).
 * Rules: BL-3 (location, verification), BL-6 (cart), BL-7 (fees, service area), BL-11.5 (max order),
 * BL-13 (coupons), BL-14 (loyalty).
 */
import type {
  BarangayFee,
  Centavos,
  Coupon,
  CouponRedemption,
  Customer,
  CustomerLoyalty,
  ID,
  IdType,
  LatLng,
  LoyaltyTransaction,
  Merchant,
  Order,
  OrderItem,
  Product,
  TenantSettings,
  Verification,
} from "@chowlane/types";
import { checkCoupon, COUPON_ERROR_MESSAGES } from "./coupons";
import { computeDeliveryFee } from "./delivery-fee";
import { haversineKm, isWithinRadius, roundUpKm } from "./geo";
import { canClaimFreeGift, canUseFreeDeliveryReward, maxRedeemablePoints } from "./loyalty";
import { computeOrderPricing, type OrderPricing } from "./pricing";
import { computeSubtotal, exceedsMaxOrder } from "./order-totals";
import { formatPeso } from "./money";

export type CartLine = { productId: ID; qty: number };

export type CheckoutProblem =
  | "DELIVERY_NOT_SET"
  | "EMPTY_CART"
  | "MERCHANT_CLOSED"
  | "ITEM_UNAVAILABLE"
  | "OUTSIDE_AREA"
  | "BARANGAY_NOT_LISTED"
  | "OVER_MAX_ORDER"
  | "BAD_CHANGE";

export const CHECKOUT_MESSAGES: Record<CheckoutProblem, string> = {
  DELIVERY_NOT_SET: "This business isn't taking orders yet.",
  EMPTY_CART: "Your cart is empty.",
  MERCHANT_CLOSED: "This restaurant is closed right now.",
  ITEM_UNAVAILABLE: "Some items just sold out. Remove them to continue.",
  OUTSIDE_AREA: "Sorry, this address is outside our delivery area.",
  BARANGAY_NOT_LISTED: "Choose your barangay. We only deliver to the barangays listed.",
  OVER_MAX_ORDER: "Your order is above the maximum amount.",
  BAD_CHANGE: "“Change for” must be at least your total.",
};

export type CheckoutInput = {
  lines: CartLine[];
  products: Product[];
  merchant: Merchant;
  settings: TenantSettings;
  customer: Customer;
  pin: LatLng;
  /** Required in PER_BARANGAY mode. */
  barangayFee?: BarangayFee;
  /** Coupon looked up by code (undefined when the code doesn't exist). */
  couponCode?: string;
  coupon?: Coupon;
  /** Non-released uses of this coupon by this customer. */
  customerCouponUses?: number;
  useFreeDeliveryReward?: boolean;
  claimFreeGift?: boolean;
  pointsToRedeem?: number;
  changeFor?: Centavos;
  now: string;
};

export type CheckoutQuote = {
  items: OrderItem[];
  distanceKm: number;
  pricing: OrderPricing | null;
  problems: CheckoutProblem[];
  couponError?: string;
  /** Promo choices that are allowed for this customer + order (drive the checkout UI). */
  canUseFreeDelivery: boolean;
  canClaimGift: boolean;
  /** Gift is linked to another merchant's menu item → not claimable here (BL-14.3b). */
  giftOtherMerchant: boolean;
  maxPoints: number;
};

/** Order items from cart lines (+ the free gift line when claimed). */
export function cartItems(lines: CartLine[], products: Product[]): OrderItem[] {
  return lines.flatMap((l) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p || l.qty < 1) return [];
    return [
      {
        productId: p.id,
        name: p.name,
        unitPrice: p.price,
        storeUnitPrice: p.storePrice,
        qty: l.qty,
        lineTotal: p.price * l.qty,
      },
    ];
  });
}

function giftItem(settings: TenantSettings, products: Product[]): OrderItem {
  const g = settings.loyalty.freeGift;
  const p = products.find((x) => x.id === g.productId);
  return {
    productId: p?.id ?? "gift",
    name: g.giftName,
    unitPrice: 0,
    storeUnitPrice: p ? (p.storePrice ?? p.price) : 0,
    qty: 1,
    lineTotal: 0,
    isFreeGift: true,
  };
}

/** Everything the checkout screen shows: fee, discounts, total and what blocks "Place order". */
export function checkoutQuote(i: CheckoutInput): CheckoutQuote {
  const problems: CheckoutProblem[] = [];
  const { settings, merchant, customer } = i;
  const loyalty = settings.loyalty;
  let items = cartItems(i.lines, i.products);

  if (items.length === 0) problems.push("EMPTY_CART");
  if (!merchant.isOpen || merchant.status !== "ACTIVE") problems.push("MERCHANT_CLOSED");
  if (i.lines.some((l) => i.products.find((p) => p.id === l.productId)?.isAvailable === false))
    problems.push("ITEM_UNAVAILABLE");

  const distanceKm = roundUpKm(haversineKm(merchant.location, i.pin));
  const feeRule = settings.deliveryFee;
  // D-061: a new business has no delivery fee yet — checkout stays closed until the owner sets it.
  if (!feeRule) problems.push("DELIVERY_NOT_SET");
  else if (feeRule.mode === "PER_BARANGAY") {
    if (!i.barangayFee || !i.barangayFee.isActive) problems.push("BARANGAY_NOT_LISTED");
  } else if (!isWithinRadius(settings.serviceArea.center, i.pin, settings.serviceArea.radiusKm)) {
    problems.push("OUTSIDE_AREA");
  }

  const subtotal = computeSubtotal(items);
  if (exceedsMaxOrder(subtotal, settings.maxOrderSubtotal)) problems.push("OVER_MAX_ORDER");

  const giftProduct = i.products.find((p) => p.id === loyalty.freeGift.productId);
  const giftOtherMerchant = Boolean(giftProduct && giftProduct.merchantId !== merchant.id);
  const canClaimGift = canClaimFreeGift(loyalty, customer.loyalty) && !giftOtherMerchant;
  const canUseFreeDelivery = canUseFreeDeliveryReward(loyalty, customer.loyalty);

  let couponError: string | undefined;
  let coupon: Coupon | undefined;
  if (i.couponCode) {
    const c = checkCoupon({
      coupon: i.coupon,
      now: i.now,
      subtotal,
      customerUses: i.customerCouponUses ?? 0,
    });
    if (c.ok) coupon = c.coupon;
    else couponError = COUPON_ERROR_MESSAGES[c.reason];
  }
  const useFreeDelivery = Boolean(i.useFreeDeliveryReward && canUseFreeDelivery && !coupon);
  if (i.claimFreeGift && canClaimGift && items.length)
    items = [...items, giftItem(settings, i.products)];

  const fee = feeRule
    ? computeDeliveryFee({ rule: feeRule, distanceKm, barangayFee: i.barangayFee })
    : ({ ok: false } as const);
  const maxPoints = maxRedeemablePoints(loyalty, customer.loyalty.points, subtotal);
  let pricing: OrderPricing | null = null;
  if (fee.ok) {
    const r = computeOrderPricing({
      subtotal,
      deliveryFee: fee.fee,
      coupon,
      useFreeDeliveryReward: useFreeDelivery,
      pointsToRedeem: Math.min(i.pointsToRedeem ?? 0, maxPoints),
      pointsBalance: customer.loyalty.points,
      loyalty,
    });
    if (r.ok) pricing = r.pricing;
  }
  if (pricing && i.changeFor !== undefined && i.changeFor < pricing.total)
    problems.push("BAD_CHANGE");

  return {
    items,
    distanceKm,
    pricing,
    problems,
    couponError,
    canUseFreeDelivery,
    canClaimGift,
    giftOtherMerchant,
    maxPoints,
  };
}

/** Order number continuing the tenant's sequence: "FB-10233". */
export function nextOrderNumber(existing: string[], slug: string): string {
  const parsed = existing
    .map((n) => n.match(/^([A-Z]+)-(\d+)$/))
    .filter(Boolean) as RegExpMatchArray[];
  const prefix =
    parsed[0]?.[1] ??
    slug
      .replace(/[^a-z]/gi, "")
      .slice(0, 2)
      .toUpperCase();
  const max = parsed
    .filter((m) => m[1] === prefix)
    .reduce((n, m) => Math.max(n, Number(m[2])), 1000);
  return `${prefix}-${max + 1}`;
}

export type NewVerification = { idType: IdType; idFrontUrl: string; selfieWithIdUrl: string };

export type PlaceOrderInput = CheckoutInput & {
  tenantId: ID;
  orderId: ID;
  orderNumber: string;
  addressText: string;
  notes?: string;
  /** Required when the customer is UNVERIFIED or REJECTED (BL-3.3, D-024). */
  verification?: NewVerification & { id: ID };
};

export type PlaceOrderResult =
  | { ok: false; problems: CheckoutProblem[]; reason?: string }
  | {
      ok: true;
      order: Order;
      customer: Customer;
      redemption?: Omit<CouponRedemption, "id">;
      couponUsedCount?: number;
      transactions: Omit<LoyaltyTransaction, "id">[];
      autoApproved: boolean;
    };

/** Whether this customer must send an ID with the order (first order or after a rejection). */
export function needsIdForOrder(customer: Customer): boolean {
  return customer.verificationStatus === "UNVERIFIED" || customer.verificationStatus === "REJECTED";
}

/**
 * Build the new order + all bookkeeping (coupon use, points/rewards spent, verification submitted).
 * Verified customer + tenant auto-approve → APPROVED right away (BL-4.1); otherwise PENDING_APPROVAL.
 */
export function placeOrder(i: PlaceOrderInput): PlaceOrderResult {
  const q = checkoutQuote(i);
  if (q.problems.length || !q.pricing) return { ok: false, problems: q.problems };
  if (i.couponCode && q.couponError) return { ok: false, problems: [], reason: q.couponError };
  if (needsIdForOrder(i.customer) && !i.verification)
    return { ok: false, problems: [], reason: "Send your ID first." };

  const p = q.pricing;
  const now = i.now;
  const coupon = i.couponCode && !q.couponError ? i.coupon : undefined;
  const usedFreeDelivery = p.freeDeliveryDiscount > 0;
  const usedGift = q.items.some((x) => x.isFreeGift);

  let customer: Customer = i.customer;
  if (i.verification) {
    const v: Verification = { ...i.verification, submittedAt: now, orderId: i.orderId };
    customer = {
      ...customer,
      verificationStatus: "PENDING",
      verification: v,
      verificationHistory: [...customer.verificationHistory, v],
    };
  }
  const loyalty: CustomerLoyalty = {
    ...customer.loyalty,
    points: customer.loyalty.points - p.pointsRedeemed,
    freeDeliveryRewards: customer.loyalty.freeDeliveryRewards - (usedFreeDelivery ? 1 : 0),
    freeGiftRewards: customer.loyalty.freeGiftRewards - (usedGift ? 1 : 0),
  };
  customer = { ...customer, loyalty };

  const autoApproved =
    customer.verificationStatus === "VERIFIED" && i.settings.autoApproveVerifiedCustomers;
  const timeline: Order["timeline"] = [
    { status: "PENDING_APPROVAL", actorType: "CUSTOMER", actorId: customer.id, at: now },
  ];
  if (autoApproved)
    timeline.push({
      status: "APPROVED",
      actorType: "SYSTEM",
      at: now,
      note: "Verified customer — auto-approved",
    });

  const order: Order = {
    id: i.orderId,
    tenantId: i.tenantId,
    orderNumber: i.orderNumber,
    customerId: customer.id,
    merchantId: i.merchant.id,
    status: autoApproved ? "APPROVED" : "PENDING_APPROVAL",
    items: q.items,
    deliveryLocation: i.pin,
    deliveryAddressText: i.addressText,
    notes: i.notes?.trim() || undefined,
    distanceKm: q.distanceKm,
    deliveryBarangayFeeId: i.barangayFee?.id,
    subtotal: p.subtotal,
    deliveryFee: p.deliveryFee,
    couponId: coupon?.id,
    couponCode: coupon?.code,
    couponDiscount: p.couponDiscount,
    usedFreeDeliveryReward: usedFreeDelivery,
    usedFreeGiftReward: usedGift,
    freeDeliveryDiscount: p.freeDeliveryDiscount,
    pointsRedeemed: p.pointsRedeemed,
    pointsDiscount: p.pointsDiscount,
    discountTotal: p.discountTotal,
    total: p.total,
    deliveryFeeSnapshot: i.settings.deliveryFee!, // checkoutQuote blocks DELIVERY_NOT_SET above
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    changeFor: i.changeFor,
    assignmentAttempts: [],
    timeline,
    createdAt: now,
  };

  const transactions: Omit<LoyaltyTransaction, "id">[] = [];
  const base = { tenantId: i.tenantId, customerId: customer.id, orderId: order.id, at: now };
  if (p.pointsRedeemed)
    transactions.push({ ...base, kind: "POINTS_REDEEMED", points: -p.pointsRedeemed, rewards: 0 });
  if (usedFreeDelivery)
    transactions.push({ ...base, kind: "FREE_DELIVERY_USED", points: 0, rewards: -1 });
  if (usedGift) transactions.push({ ...base, kind: "FREE_GIFT_USED", points: 0, rewards: -1 });

  return {
    ok: true,
    order,
    customer,
    redemption: coupon
      ? {
          tenantId: i.tenantId,
          couponId: coupon.id,
          orderId: order.id,
          customerId: customer.id,
          discount: p.couponDiscount,
          redeemedAt: now,
          released: false,
        }
      : undefined,
    couponUsedCount: coupon ? coupon.usedCount + 1 : undefined,
    transactions,
    autoApproved,
  };
}

/** What to give back when an order is cancelled / rejected (BL-13.7, BL-14.7). */
export function promoRefunds(
  order: Order,
  customer: Customer,
  now: string,
): { loyalty: CustomerLoyalty; transactions: Omit<LoyaltyTransaction, "id">[] } {
  const l = { ...customer.loyalty };
  const tx: Omit<LoyaltyTransaction, "id">[] = [];
  const base = { tenantId: order.tenantId, customerId: customer.id, orderId: order.id, at: now };
  if (order.pointsRedeemed > 0) {
    l.points += order.pointsRedeemed;
    tx.push({ ...base, kind: "POINTS_REFUNDED", points: order.pointsRedeemed, rewards: 0 });
  }
  if (order.usedFreeDeliveryReward) {
    l.freeDeliveryRewards += 1;
    tx.push({ ...base, kind: "FREE_DELIVERY_REFUNDED", points: 0, rewards: 1 });
  }
  if (order.usedFreeGiftReward) {
    l.freeGiftRewards += 1;
    tx.push({ ...base, kind: "FREE_GIFT_REFUNDED", points: 0, rewards: 1 });
  }
  return { loyalty: l, transactions: tx };
}

// ------------------------------------------------------------------ tracking
export type TrackingStep = { key: string; label: string; state: "done" | "current" | "todo" };

const FLOW = [
  { key: "PENDING_APPROVAL", label: "Order placed" },
  { key: "APPROVED", label: "Order confirmed" },
  { key: "ASSIGNED", label: "Rider on the way to the store" },
  { key: "AT_MERCHANT", label: "Rider is buying your food" },
  { key: "PICKED_UP", label: "On the way to you" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

/** Progress steps for the tracking screen (S-307). Rejected / cancelled orders return []. */
export function trackingSteps(order: Order): TrackingStep[] {
  const idx = FLOW.findIndex((f) => f.key === order.status);
  if (idx < 0) return [];
  return FLOW.map((f, i) => ({
    key: f.key,
    label: f.label,
    state: i < idx || order.status === "DELIVERED" ? "done" : i === idx ? "current" : "todo",
  }));
}

/** One-line status message for the customer. */
export function customerStatusMessage(order: Order, customer: Customer): string {
  switch (order.status) {
    case "PENDING_APPROVAL":
      return customer.verificationStatus === "PENDING"
        ? "We're checking your ID. Your order is confirmed right after."
        : "Waiting for the store team to confirm your order.";
    case "APPROVED":
      return "Confirmed! We're finding a rider for you.";
    case "ASSIGNED":
      return "Your rider is heading to the store.";
    case "AT_MERCHANT":
      return "Your rider is at the store buying your food.";
    case "PICKED_UP":
      return `Your food is on the way. Prepare ${formatPeso(order.total)} in cash.`;
    case "DELIVERED":
      return "Delivered. Enjoy your meal!";
    case "REJECTED":
      return order.rejectReason
        ? `Sorry, your order was declined: ${order.rejectReason}.`
        : "Sorry, your order was declined.";
    case "CANCELLED":
      return order.cancelReason ? `Cancelled: ${order.cancelReason}.` : "This order was cancelled.";
  }
}

export const ACTIVE_ORDER_STATUSES: Order["status"][] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "ASSIGNED",
  "AT_MERCHANT",
  "PICKED_UP",
];
