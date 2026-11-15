import type { ActorType, OrderStatus } from "@chowlane/types";

/** Allowed status transitions (BL-4). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["AT_MERCHANT", "APPROVED", "CANCELLED"], // → APPROVED when rider is unassigned for reassignment
  AT_MERCHANT: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: "Waiting for approval",
  APPROVED: "Approved — finding a rider",
  ASSIGNED: "Rider on the way to the store",
  AT_MERCHANT: "Rider is at the store",
  PICKED_UP: "On the way to you",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Customer may cancel only while PENDING_APPROVAL; staff any time before PICKED_UP (BL-4.2, BL-4). */
export function canCancel(status: OrderStatus, actor: ActorType): boolean {
  if (actor === "CUSTOMER") return status === "PENDING_APPROVAL";
  if (actor === "OWNER" || actor === "ADMIN") return canTransition(status, "CANCELLED");
  return false;
}

/** Admin can (re)assign a rider until the food is picked up (BL-5.9). */
export function canReassign(status: OrderStatus): boolean {
  return status === "APPROVED" || status === "ASSIGNED" || status === "AT_MERCHANT";
}
