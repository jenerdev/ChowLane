"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import type { PermissionKey } from "@chowlane/types";
import { PERMISSION_LABELS } from "@chowlane/lib";
import { EmptyState } from "@chowlane/ui";
import { useConsole } from "@/lib/use-console";

/** Shows the page only when the signed-in staff member has the permission (BL-2.4). */
export function RequirePermission({
  perm,
  children,
}: {
  perm: PermissionKey | "owner";
  children: ReactNode;
}) {
  const { can, isOwner, me } = useConsole();
  if (!me) return null;
  const allowed = perm === "owner" ? isOwner : can(perm);
  if (allowed) return <>{children}</>;
  return (
    <EmptyState
      icon={<Lock />}
      title="You don't have access to this page"
      description={
        perm === "owner"
          ? "Only the business owner can open this."
          : `It needs the "${PERMISSION_LABELS[perm]}" permission. Ask the owner to add it to your role.`
      }
    />
  );
}
