"use client";

import { use } from "react";
import { Bike } from "lucide-react";
import { toRider, toTenantSettings } from "@chowlane/db/mappers";
import { EmptyState } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";
import { RiderForm } from "../../rider-form";

export default function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { live } = useConsole();
  const data = useLive(`rider-edit:${id}`, async (sb) => {
    const [rider, settings] = await Promise.all([
      sb.from("riders").select("*").eq("id", id).eq("tenant_id", live.id).maybeSingle(),
      sb.from("tenant_settings").select("*").eq("tenant_id", live.id).single(),
    ]);
    const r = must(rider);
    return r ? { rider: toRider(r), settings: toTenantSettings(must(settings)) } : null;
  });
  return (
    <RequirePermission perm="riders.manage">
      {data.loading ? null : data.data ? (
        <RiderForm
          key={data.data.rider.id}
          rider={data.data.rider}
          tenantRule={data.data.settings.riderPay}
        />
      ) : (
        <EmptyState icon={<Bike />} title="Rider not found" description={data.error} />
      )}
    </RequirePermission>
  );
}
