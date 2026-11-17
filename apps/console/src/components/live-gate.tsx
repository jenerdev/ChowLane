"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { EmptyState } from "@chowlane/ui";

/**
 * Renders `children(data)` once a `useLive` query has loaded; nothing while loading; an error or "not found" state
 * otherwise. Forms render inside it so their initial state comes from the loaded row.
 */
export function LiveGate<T>({
  state,
  notFound = "Not found",
  icon = <CircleAlert />,
  children,
}: {
  state: { data?: T | null; error?: string; loading: boolean };
  notFound?: string;
  icon?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) return null;
  if (state.error)
    return <EmptyState icon={icon} title="Couldn't load this" description={state.error} />;
  if (state.data === undefined || state.data === null)
    return <EmptyState icon={icon} title={notFound} />;
  return <>{children(state.data)}</>;
}
