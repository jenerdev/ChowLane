import type { ReactNode } from "react";
import type { Order } from "@chowlane/types";
import type { OrderPricing } from "@chowlane/lib";
import { formatPeso } from "@chowlane/lib";

function Line({
  label,
  value,
  muted,
  strong,
}: {
  label: ReactNode;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-0.5 text-sm ${muted ? "text-muted-foreground" : ""} ${strong ? "pt-2 text-base font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

type Prices = Pick<
  OrderPricing,
  | "subtotal"
  | "deliveryFee"
  | "couponDiscount"
  | "freeDeliveryDiscount"
  | "pointsRedeemed"
  | "pointsDiscount"
  | "total"
>;

/** Price breakdown shared by checkout and order tracking. */
export function PriceLines({
  p,
  distanceKm,
  couponCode,
  changeFor,
}: {
  p: Prices | Order;
  distanceKm?: number;
  couponCode?: string;
  changeFor?: number;
}) {
  return (
    <div>
      <Line label="Food" value={formatPeso(p.subtotal)} />
      <Line
        label={`Delivery${distanceKm ? ` (${distanceKm} km)` : ""}`}
        value={formatPeso(p.deliveryFee)}
      />
      {p.couponDiscount ? (
        <Line
          label={`Coupon${couponCode ? ` ${couponCode}` : ""}`}
          value={`−${formatPeso(p.couponDiscount)}`}
          muted
        />
      ) : null}
      {p.freeDeliveryDiscount ? (
        <Line label="Free delivery reward" value={`−${formatPeso(p.freeDeliveryDiscount)}`} muted />
      ) : null}
      {p.pointsDiscount ? (
        <Line
          label={`${p.pointsRedeemed} points`}
          value={`−${formatPeso(p.pointsDiscount)}`}
          muted
        />
      ) : null}
      <Line label="Pay in cash" value={formatPeso(p.total)} strong />
      {changeFor ? <Line label="Change for" value={formatPeso(changeFor)} muted /> : null}
    </div>
  );
}
