import type { Centavos, OrderItem } from "@chowlane/types";

const available = (items: OrderItem[]) => items.filter((i) => !i.isUnavailable);

/** Sum of available item lines (unavailable items are excluded — BL-11.7). */
export function computeSubtotal(items: OrderItem[]): Centavos {
  return available(items).reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

/** Cash the rider needs at the store, using store prices when known (BL-11.4). */
export function cashNeededAtStore(items: OrderItem[]): Centavos {
  return available(items).reduce((sum, i) => sum + (i.storeUnitPrice ?? i.unitPrice) * i.qty, 0);
}

export function computeTotal(subtotal: Centavos, deliveryFee: Centavos): Centavos {
  return subtotal + deliveryFee;
}

/** True when every item was marked unavailable → order is cancelled (BL-11.7). */
export function allItemsUnavailable(items: OrderItem[]): boolean {
  return items.length > 0 && items.every((i) => i.isUnavailable);
}

/** Checkout is blocked above the tenant's max order subtotal (BL-11.5). */
export function exceedsMaxOrder(subtotal: Centavos, maxOrderSubtotal: Centavos): boolean {
  return subtotal > maxOrderSubtotal;
}
