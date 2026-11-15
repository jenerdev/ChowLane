import type { Centavos, ID, ISODateTime } from "./common";

/**
 * Tenant loyalty program (BL-14). The tenant turns the program on/off and chooses which rules to use.
 */
export type LoyaltySettings = {
  /** Master switch for the whole program. */
  enabled: boolean;
  /** Rule 1 — every N delivered orders earns one free-delivery reward. */
  freeDelivery: { enabled: boolean; ordersRequired: number };
  /**
   * Rule 2 — every N delivered orders earns one free gift (e.g. "Free Halo-Halo").
   * Optional productId links the gift to a menu item the rider buys at the store.
   */
  freeGift: { enabled: boolean; ordersRequired: number; giftName: string; productId?: ID };
  /** Rule 3 — earn points on delivered orders, spend them on food. */
  points: {
    enabled: boolean;
    earnMode: "PER_ORDER" | "PER_PESO";
    /** PER_ORDER: points per delivered order. */
    pointsPerOrder: number;
    /** PER_PESO: 1 point for every this many centavos of food paid (e.g. 5000 = 1 pt per ₱50). */
    centavosPerPoint: number;
    /** Value of 1 point when redeeming (e.g. 100 = ₱1). */
    pointValue: Centavos;
    /** Minimum points per redemption. */
    minRedeemPoints: number;
    /** Max % of the food subtotal that can be paid with points. */
    maxRedeemPercent: number;
  };
};

/** A customer's loyalty balances in one tenant. */
export type CustomerLoyalty = {
  deliveredOrders: number;
  /** Progress toward the next free-delivery reward (0 … ordersRequired-1). */
  ordersTowardFreeDelivery: number;
  /** Unused free-delivery rewards. */
  freeDeliveryRewards: number;
  /** Progress toward the next free gift (0 … ordersRequired-1). */
  ordersTowardFreeGift: number;
  /** Unclaimed free gifts. */
  freeGiftRewards: number;
  points: number;
};

export type LoyaltyTransactionKind =
  | "POINTS_EARNED"
  | "POINTS_REDEEMED"
  | "POINTS_REFUNDED"
  | "POINTS_ADJUSTED"
  | "FREE_DELIVERY_EARNED"
  | "FREE_DELIVERY_USED"
  | "FREE_DELIVERY_REFUNDED"
  | "FREE_GIFT_EARNED"
  | "FREE_GIFT_USED"
  | "FREE_GIFT_REFUNDED";

/** Ledger entry — balances can always be rebuilt from these. */
export type LoyaltyTransaction = {
  id: ID;
  tenantId: ID;
  customerId: ID;
  orderId?: ID;
  kind: LoyaltyTransactionKind;
  /** Signed points change. */
  points: number;
  /** Signed reward change (free delivery or free gift — see kind). */
  rewards: number;
  at: ISODateTime;
  /** Staff who made a manual adjustment. */
  staffId?: ID;
  note?: string;
};
