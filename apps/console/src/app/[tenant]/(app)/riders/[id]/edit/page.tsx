"use client";

import { use } from "react";
import { Bike } from "lucide-react";
import { EmptyState } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { RiderForm } from "../../rider-form";

export default function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, tenant } = useConsole();
  const rider = db.riders.find((r) => r.id === id && r.tenantId === tenant.id);
  return (
    <RequirePermission perm="riders.manage">
      {rider ? (
        <RiderForm key={rider.id} rider={rider} />
      ) : (
        <EmptyState icon={<Bike />} title="Rider not found" />
      )}
    </RequirePermission>
  );
}
