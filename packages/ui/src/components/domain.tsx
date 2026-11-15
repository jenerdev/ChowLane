import type { Centavos, OrderStatus, RemitStatus, VerificationStatus } from "@chowlane/types";
import { formatPeso, ORDER_STATUS_LABELS } from "@chowlane/lib";
import { Badge, type BadgeProps } from "./badge";
import { cn } from "../lib/cn";

/** Peso amount from centavos, tabular digits. */
export function Money({ value, className }: { value: Centavos; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatPeso(value)}</span>;
}

const ORDER_TONE: Record<OrderStatus, BadgeProps["tone"]> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  ASSIGNED: "brand",
  AT_MERCHANT: "brand",
  PICKED_UP: "brand",
  DELIVERED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

const VERIFY: Record<VerificationStatus, [string, BadgeProps["tone"]]> = {
  UNVERIFIED: ["Not verified", "neutral"],
  PENDING: ["Verification pending", "warning"],
  VERIFIED: ["Verified", "success"],
  REJECTED: ["Verification rejected", "danger"],
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const [label, tone] = VERIFY[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const REMIT: Record<RemitStatus, [string, BadgeProps["tone"]]> = {
  OPEN: ["On shift", "info"],
  PENDING: ["Cash to remit", "warning"],
  RECEIVED: ["Received", "success"],
  SHORT: ["Short", "danger"],
  OVER: ["Over", "warning"],
};

export function RemitBadge({ status }: { status: RemitStatus }) {
  const [label, tone] = REMIT[status];
  return <Badge tone={tone}>{label}</Badge>;
}
