import type { BillingStatementStatus } from "@chowlane/types";
import { STATEMENT_STATUS_LABELS } from "@chowlane/lib";
import { Badge, type BadgeProps } from "@chowlane/ui";

const TONE: Record<BillingStatementStatus, BadgeProps["tone"]> = {
  UNPAID: "warning",
  PAID: "success",
  WAIVED: "neutral",
};

export function StatementStatusBadge({ status }: { status: BillingStatementStatus }) {
  return <Badge tone={TONE[status]}>{STATEMENT_STATUS_LABELS[status]}</Badge>;
}
