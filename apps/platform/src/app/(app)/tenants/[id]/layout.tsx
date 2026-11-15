import type { ReactNode } from "react";
import { TenantHeader } from "./tenant-header";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <TenantHeader id={id} />
      {children}
    </>
  );
}
