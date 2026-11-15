import type { ReactNode } from "react";
import { resolveTenant } from "@/lib/tenant";
import { AppFrame } from "./app-frame";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await resolveTenant(params);
  return <AppFrame tenant={tenant}>{children}</AppFrame>;
}
