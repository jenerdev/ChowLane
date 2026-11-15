/**
 * Mock orders — one or more in every status, built with @chowlane/lib so totals, fees and
 * rider earnings always follow docs/BUSINESS-LOGIC.md.
 */
import type {
  ActorType,
  CouponRedemption,
  LoyaltyTransaction,
  AssignmentAttempt,
  ID,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PendingOffer,
} from "@chowlane/types";
import {
  computeDeliveryFee,
  computeOrderPricing,
  foodPaid,
  pointsEarnedForOrder,
  computeSubtotal,
  effectiveRiderPayRule,
  haversineKm,
  riderEarningForOrder,
  roundUpKm,
} from "@chowlane/lib";
import {
  ago,
  barangayFees,
  coupons,
  customers,
  merchants,
  products,
  riders,
  tenantSettings,
} from "./data";

const HAPPY_PATH: OrderStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "ASSIGNED",
  "AT_MERCHANT",
  "PICKED_UP",
  "DELIVERED",
];

type Spec = {
  id: ID;
  orderNumber: string;
  customerId: ID;
  merchantId: ID;
  lines: [productId: ID, qty: number, unavailable?: boolean][];
  status: OrderStatus;
  minutesAgo: number;
  riderId?: ID;
  approvedBy?: ID;
  /** Auto-approved (verified customer + tenant setting on). */
  autoApproved?: boolean;
  assignmentAttempts?: AssignmentAttempt[];
  pendingOffer?: PendingOffer;
  changeFor?: number;
  couponCode?: string;
  useFreeDeliveryReward?: boolean;
  claimFreeGift?: boolean;
  pointsToRedeem?: number;
  notes?: string;
  rejectReason?: string;
  cancelReason?: string;
  cancelledBy?: ActorType;
};

function buildTimeline(spec: Spec, createdAt: number): OrderEvent[] {
  const at = (step: number) => new Date(createdAt + step * 6 * 60_000).toISOString();
  const events: OrderEvent[] = [
    { status: "PENDING_APPROVAL", actorType: "CUSTOMER", actorId: spec.customerId, at: at(0) },
  ];
  if (spec.status === "REJECTED") {
    events.push({
      status: "REJECTED",
      actorType: "ADMIN",
      actorId: spec.approvedBy,
      at: at(1),
      note: spec.rejectReason,
    });
    return events;
  }
  if (spec.status === "CANCELLED" && spec.cancelledBy === "CUSTOMER") {
    events.push({
      status: "CANCELLED",
      actorType: "CUSTOMER",
      actorId: spec.customerId,
      at: at(1),
      note: spec.cancelReason,
    });
    return events;
  }
  const last = HAPPY_PATH.indexOf(spec.status);
  for (let i = 1; i <= last; i++) {
    const status = HAPPY_PATH[i]!;
    const actor: ActorType =
      status === "APPROVED" ? (spec.autoApproved ? "SYSTEM" : "ADMIN") : "RIDER";
    const actorId = status === "APPROVED" ? spec.approvedBy : spec.riderId;
    events.push({ status, actorType: actor, actorId, at: at(i) });
  }
  return events;
}

function buildOrder(spec: Spec): Order {
  const customer = customers.find((c) => c.id === spec.customerId)!;
  const merchant = merchants.find((m) => m.id === spec.merchantId)!;
  const settings = tenantSettings.find((s) => s.tenantId === customer.tenantId)!;
  const address = customer.addresses[0]!;

  const items: OrderItem[] = spec.lines.map(([productId, qty, unavailable]) => {
    const p = products.find((x) => x.id === productId)!;
    return {
      productId,
      name: p.name,
      unitPrice: p.price,
      storeUnitPrice: p.storePrice,
      qty,
      lineTotal: p.price * qty,
      isUnavailable: unavailable,
    };
  });

  const distanceKm = roundUpKm(haversineKm(merchant.location, address.location));
  const barangayFee = barangayFees.find((b) => b.id === address.barangayFeeId);
  const feeResult = computeDeliveryFee({ rule: settings.deliveryFee, distanceKm, barangayFee });
  const deliveryFee = feeResult.ok ? feeResult.fee : 0;
  const subtotal = computeSubtotal(items);
  if (spec.claimFreeGift) {
    const gift = settings.loyalty.freeGift;
    const gp = products.find((x) => x.id === gift.productId);
    items.push({
      productId: gp?.id ?? "gift",
      name: gift.giftName,
      unitPrice: 0,
      storeUnitPrice: gp ? (gp.storePrice ?? gp.price) : 0,
      qty: 1,
      lineTotal: 0,
      isFreeGift: true,
    });
  }
  const coupon = spec.couponCode
    ? coupons.find((c) => c.tenantId === customer.tenantId && c.code === spec.couponCode)
    : undefined;
  const priced = computeOrderPricing({
    subtotal,
    deliveryFee,
    coupon,
    useFreeDeliveryReward: spec.useFreeDeliveryReward,
    pointsToRedeem: spec.pointsToRedeem,
    pointsBalance: customer.loyalty.points + (spec.pointsToRedeem ?? 0),
    loyalty: settings.loyalty,
  });
  if (!priced.ok) throw new Error(`Mock order ${spec.id}: ${priced.reason}`);
  const pricing = priced.pricing;

  const createdAt = Date.parse(ago(spec.minutesAgo));
  const reached = (s: OrderStatus) => HAPPY_PATH.indexOf(spec.status) >= HAPPY_PATH.indexOf(s);
  const rider = riders.find((r) => r.id === spec.riderId);
  const pickedUp = reached("PICKED_UP") && HAPPY_PATH.includes(spec.status);
  const delivered = spec.status === "DELIVERED";
  const timeline = buildTimeline(spec, createdAt);

  return {
    id: spec.id,
    tenantId: customer.tenantId,
    orderNumber: spec.orderNumber,
    customerId: customer.id,
    merchantId: merchant.id,
    riderId: spec.riderId,
    status: spec.status,
    items,
    deliveryLocation: address.location,
    deliveryAddressText: `${address.line1}, ${address.barangay}, ${address.cityMunicipality}`,
    notes: spec.notes,
    distanceKm,
    deliveryBarangayFeeId: barangayFee?.id,
    subtotal,
    deliveryFee,
    couponId: coupon?.id,
    couponCode: coupon?.code,
    couponDiscount: pricing.couponDiscount,
    usedFreeDeliveryReward: spec.useFreeDeliveryReward ?? false,
    usedFreeGiftReward: spec.claimFreeGift ?? false,
    freeDeliveryDiscount: pricing.freeDeliveryDiscount,
    pointsRedeemed: pricing.pointsRedeemed,
    pointsDiscount: pricing.pointsDiscount,
    discountTotal: pricing.discountTotal,
    total: pricing.total,
    pointsEarned: delivered ? pointsEarnedForOrder(settings.loyalty, foodPaid(pricing)) : undefined,
    deliveryFeeSnapshot: settings.deliveryFee,
    riderEarning:
      delivered && rider
        ? riderEarningForOrder(
            effectiveRiderPayRule(settings.riderPay, rider.payOverride),
            deliveryFee,
          )
        : undefined,
    paymentMethod: "COD",
    paymentStatus: delivered ? "COLLECTED" : "UNPAID",
    changeFor: spec.changeFor,
    cashCollectedAt: delivered ? timeline[timeline.length - 1]!.at : undefined,
    storeAmountPaid: pickedUp
      ? items
          .filter((i) => !i.isUnavailable)
          .reduce((s, i) => s + (i.storeUnitPrice ?? i.unitPrice) * i.qty, 0)
      : undefined,
    storeReceiptPhotoUrl: pickedUp ? "" : undefined,
    approvedBy:
      reached("APPROVED") && HAPPY_PATH.includes(spec.status) ? spec.approvedBy : undefined,
    pendingOffer: spec.pendingOffer,
    assignmentAttempts: spec.assignmentAttempts ?? [],
    rejectReason: spec.rejectReason,
    cancelReason: spec.cancelReason,
    proofOfDelivery: delivered ? { photoUrl: "", note: "Handed to customer at lobby" } : undefined,
    timeline,
    createdAt: new Date(createdAt).toISOString(),
  };
}

const SPECS: Spec[] = [
  // ------------------------------------------------ FastBite (AUTO dispatch, PER_KM)
  {
    id: "o-fb-1",
    orderNumber: "FB-10231",
    customerId: "c-fb-2",
    merchantId: "m-fb-1",
    lines: [
      ["p-1", 2],
      ["p-5", 1],
    ],
    status: "PENDING_APPROVAL",
    minutesAgo: 12,
    changeFor: 50000,
    notes: "First order — ID submitted",
  },
  {
    id: "o-fb-2",
    orderNumber: "FB-10232",
    customerId: "c-fb-1",
    merchantId: "m-fb-2",
    lines: [
      ["p-6", 1],
      ["p-8", 1],
    ],
    couponCode: "WELCOME20",
    status: "PENDING_APPROVAL",
    minutesAgo: 4,
  },
  {
    id: "o-fb-3",
    orderNumber: "FB-10229",
    customerId: "c-fb-5",
    merchantId: "m-fb-1",
    lines: [
      ["p-3", 1],
      ["p-2", 1],
    ],
    status: "APPROVED",
    minutesAgo: 25,
    approvedBy: "s-fb-admin",
    assignmentAttempts: [
      {
        riderId: "rd-fb-1",
        by: "AUTO",
        offeredAt: ago(14),
        respondedAt: ago(13),
        response: "REJECTED",
        rejectReason: "NOT_ENOUGH_CASH",
      },
      { riderId: "rd-fb-3", by: "AUTO", offeredAt: ago(1) },
    ],
    pendingOffer: {
      riderId: "rd-fb-3",
      offeredAt: ago(1),
      expiresAt: new Date(Date.parse(ago(1)) + 60_000).toISOString(),
      by: "AUTO",
    },
  },
  {
    id: "o-fb-9",
    orderNumber: "FB-10228",
    customerId: "c-fb-1",
    merchantId: "m-fb-2",
    lines: [
      ["p-7", 2],
      ["p-9", 2],
    ],
    status: "APPROVED",
    minutesAgo: 40,
    approvedBy: "s-fb-admin",
    notes: "Needs rider — nobody accepted",
    assignmentAttempts: [
      {
        riderId: "rd-fb-3",
        by: "AUTO",
        offeredAt: ago(30),
        respondedAt: ago(29),
        response: "TIMED_OUT",
        rejectReason: "NO_RESPONSE",
      },
      {
        riderId: "rd-fb-2",
        by: "AUTO",
        offeredAt: ago(29),
        respondedAt: ago(28),
        response: "REJECTED",
        rejectReason: "TOO_FAR",
      },
    ],
  },
  {
    id: "o-fb-4",
    orderNumber: "FB-10226",
    customerId: "c-fb-1",
    merchantId: "m-fb-2",
    lines: [
      ["p-6", 2],
      ["p-8", 1, true],
      ["p-9", 1],
    ],
    status: "AT_MERCHANT",
    minutesAgo: 35,
    riderId: "rd-fb-1",
    approvedBy: "s-fb-admin",
    changeFor: 100000,
    assignmentAttempts: [
      {
        riderId: "rd-fb-1",
        by: "AUTO",
        offeredAt: ago(28),
        respondedAt: ago(27),
        response: "ACCEPTED",
      },
    ],
  },
  {
    id: "o-fb-5",
    orderNumber: "FB-10224",
    customerId: "c-fb-5",
    merchantId: "m-fb-1",
    lines: [
      ["p-1", 1],
      ["p-2", 1],
    ],
    pointsToRedeem: 60,
    status: "PICKED_UP",
    minutesAgo: 50,
    riderId: "rd-fb-2",
    approvedBy: "s-fb-owner",
    assignmentAttempts: [
      {
        riderId: "rd-fb-2",
        by: "ADMIN",
        staffId: "s-fb-dispatch",
        offeredAt: ago(44),
        respondedAt: ago(43),
        response: "ACCEPTED",
      },
    ],
  },
  {
    id: "o-fb-6",
    orderNumber: "FB-10219",
    customerId: "c-fb-1",
    merchantId: "m-fb-2",
    lines: [
      ["p-7", 1],
      ["p-9", 1],
    ],
    useFreeDeliveryReward: true,
    status: "DELIVERED",
    minutesAgo: 150,
    riderId: "rd-fb-1",
    approvedBy: "s-fb-admin",
    assignmentAttempts: [
      {
        riderId: "rd-fb-1",
        by: "AUTO",
        offeredAt: ago(143),
        respondedAt: ago(142),
        response: "ACCEPTED",
      },
    ],
  },
  {
    id: "o-fb-7",
    orderNumber: "FB-10220",
    customerId: "c-fb-5",
    merchantId: "m-fb-1",
    lines: [["p-3", 1]],
    status: "CANCELLED",
    minutesAgo: 120,
    cancelledBy: "CUSTOMER",
    cancelReason: "Changed my mind",
  },
  {
    id: "o-fb-8",
    orderNumber: "FB-10215",
    customerId: "c-fb-3",
    merchantId: "m-fb-2",
    lines: [["p-6", 1]],
    status: "REJECTED",
    minutesAgo: 300,
    approvedBy: "s-fb-admin",
    rejectReason: "Customer verification rejected",
  },

  // ------------------------------------------------ Kain Express (MANUAL dispatch, PER_BARANGAY, auto-approve verified)
  {
    id: "o-ke-1",
    orderNumber: "KE-5031",
    customerId: "c-ke-2",
    merchantId: "m-ke-2",
    lines: [
      ["p-17", 2],
      ["p-19", 1],
    ],
    status: "PENDING_APPROVAL",
    minutesAgo: 28,
  },
  {
    id: "o-ke-3",
    orderNumber: "KE-5030",
    customerId: "c-ke-1",
    merchantId: "m-ke-2",
    lines: [
      ["p-17", 1],
      ["p-18", 1],
    ],
    status: "APPROVED",
    minutesAgo: 9,
    autoApproved: true,
    notes: "Needs rider (MANUAL mode)",
  },
  {
    id: "o-ke-2",
    orderNumber: "KE-5028",
    customerId: "c-ke-1",
    merchantId: "m-ke-1",
    lines: [
      ["p-14", 1],
      ["p-15", 1],
    ],
    claimFreeGift: true,
    status: "ASSIGNED",
    minutesAgo: 20,
    riderId: "rd-ke-1",
    autoApproved: true,
    assignmentAttempts: [
      {
        riderId: "rd-ke-1",
        by: "ADMIN",
        staffId: "s-ke-admin",
        offeredAt: ago(10),
        respondedAt: ago(9),
        response: "ACCEPTED",
      },
    ],
  },
  {
    id: "o-ke-4",
    orderNumber: "KE-5022",
    customerId: "c-ke-1",
    merchantId: "m-ke-3",
    lines: [
      ["p-20", 2],
      ["p-21", 2],
    ],
    couponCode: "SUGBO10",
    pointsToRedeem: 20,
    status: "DELIVERED",
    minutesAgo: 140,
    riderId: "rd-ke-2",
    autoApproved: true,
    assignmentAttempts: [
      {
        riderId: "rd-ke-2",
        by: "ADMIN",
        staffId: "s-ke-admin",
        offeredAt: ago(133),
        respondedAt: ago(132),
        response: "ACCEPTED",
      },
    ],
  },
];

export const orders: Order[] = SPECS.map(buildOrder);

/** Coupon uses, derived from orders (released when the order was rejected / cancelled). */
export const couponRedemptions: CouponRedemption[] = orders
  .filter((o) => o.couponId)
  .map((o, i) => ({
    id: `cr-${i + 1}`,
    tenantId: o.tenantId,
    couponId: o.couponId!,
    orderId: o.id,
    customerId: o.customerId,
    discount: o.couponDiscount,
    redeemedAt: o.createdAt,
    released: o.status === "REJECTED" || o.status === "CANCELLED",
  }));

/** Loyalty ledger entries for the mock orders (BL-14.7). */
export const loyaltyTransactions: LoyaltyTransaction[] = orders.flatMap((o) => {
  const rows: Omit<LoyaltyTransaction, "id">[] = [];
  const base = { tenantId: o.tenantId, customerId: o.customerId, orderId: o.id };
  if (o.pointsRedeemed > 0)
    rows.push({
      ...base,
      kind: "POINTS_REDEEMED",
      points: -o.pointsRedeemed,
      rewards: 0,
      at: o.createdAt,
    });
  if (o.usedFreeGiftReward)
    rows.push({ ...base, kind: "FREE_GIFT_USED", points: 0, rewards: -1, at: o.createdAt });
  if (o.usedFreeDeliveryReward)
    rows.push({ ...base, kind: "FREE_DELIVERY_USED", points: 0, rewards: -1, at: o.createdAt });
  if (o.pointsEarned)
    rows.push({
      ...base,
      kind: "POINTS_EARNED",
      points: o.pointsEarned,
      rewards: 0,
      at: o.timeline.at(-1)!.at,
    });
  return rows.map((r, i) => ({ ...r, id: `lt-${o.id}-${i}` }));
});
