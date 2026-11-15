import type { TenantStatus } from "@chowlane/types";
import { Badge } from "@chowlane/ui";

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return status === "ACTIVE" ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="danger">Suspended</Badge>
  );
}
