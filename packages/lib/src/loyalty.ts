import type { Centavos, CustomerLoyalty, LoyaltySettings } from "@chowlane/types";

export const EMPTY_LOYALTY: CustomerLoyalty = {
  deliveredOrders: 0,
  ordersTowardFreeDelivery: 0,
  freeDeliveryRewards: 0,
  ordersTowardFreeGift: 0,
  freeGiftRewards: 0,
  points: 0,
};

const pointsOn = (s: LoyaltySettings) => s.enabled && s.points.enabled;
const freeDeliveryOn = (s: LoyaltySettings) => s.enabled && s.freeDelivery.enabled;
const freeGiftOn = (s: LoyaltySettings) => s.enabled && s.freeGift.enabled;

/** Points earned by one DELIVERED order (BL-14.4). `foodPaid` = subtotal after coupon & points discounts. */
export function pointsEarnedForOrder(settings: LoyaltySettings, foodPaid: Centavos): number {
  if (!pointsOn(settings)) return 0;
  const p = settings.points;
  return p.earnMode === "PER_ORDER" ? p.pointsPerOrder : Math.floor(foodPaid / p.centavosPerPoint);
}

/** New balances after an order is DELIVERED (BL-14.3, BL-14.4). */
export function applyDeliveredOrder(
  current: CustomerLoyalty,
  settings: LoyaltySettings,
  foodPaid: Centavos,
): {
  loyalty: CustomerLoyalty;
  pointsEarned: number;
  freeDeliveryEarned: boolean;
  freeGiftEarned: boolean;
} {
  const pointsEarned = pointsEarnedForOrder(settings, foodPaid);
  let toward = current.ordersTowardFreeDelivery;
  let rewards = current.freeDeliveryRewards;
  let freeDeliveryEarned = false;
  if (freeDeliveryOn(settings)) {
    toward += 1;
    if (toward >= settings.freeDelivery.ordersRequired) {
      toward = 0;
      rewards += 1;
      freeDeliveryEarned = true;
    }
  }
  let giftToward = current.ordersTowardFreeGift;
  let gifts = current.freeGiftRewards;
  let freeGiftEarned = false;
  if (freeGiftOn(settings)) {
    giftToward += 1;
    if (giftToward >= settings.freeGift.ordersRequired) {
      giftToward = 0;
      gifts += 1;
      freeGiftEarned = true;
    }
  }
  return {
    loyalty: {
      deliveredOrders: current.deliveredOrders + 1,
      ordersTowardFreeDelivery: toward,
      freeDeliveryRewards: rewards,
      ordersTowardFreeGift: giftToward,
      freeGiftRewards: gifts,
      points: current.points + pointsEarned,
    },
    pointsEarned,
    freeDeliveryEarned,
    freeGiftEarned,
  };
}

/** Most points usable on an order: limited by balance and by maxRedeemPercent of the food subtotal (BL-14.5). */
export function maxRedeemablePoints(
  settings: LoyaltySettings,
  balance: number,
  foodSubtotal: Centavos,
): number {
  if (!pointsOn(settings) || balance < settings.points.minRedeemPoints) return 0;
  const capCentavos = Math.floor((foodSubtotal * settings.points.maxRedeemPercent) / 100);
  return Math.min(balance, Math.floor(capCentavos / settings.points.pointValue));
}

export function canUseFreeDeliveryReward(
  settings: LoyaltySettings,
  loyalty: CustomerLoyalty,
): boolean {
  return freeDeliveryOn(settings) && loyalty.freeDeliveryRewards > 0;
}

export function canClaimFreeGift(settings: LoyaltySettings, loyalty: CustomerLoyalty): boolean {
  return freeGiftOn(settings) && loyalty.freeGiftRewards > 0;
}
