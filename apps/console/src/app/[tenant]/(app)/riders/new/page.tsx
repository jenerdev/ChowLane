"use client";

import { toTenantSettings } from "@chowlane/db/mappers";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";
import { RiderForm } from "../rider-form";

export default function NewRiderPage() {
  const { live } = useConsole();
  const settings = useLive(`settings:${live.id}`, async (sb) =>
    toTenantSettings(
      must(await sb.from("tenant_settings").select("*").eq("tenant_id", live.id).single()),
    ),
  );
  return (
    <RequirePermission perm="riders.manage">
      {settings.loading ? null : <RiderForm tenantRule={settings.data?.riderPay} />}
    </RequirePermission>
  );
}
