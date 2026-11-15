"use client";

import { use } from "react";
import { Store } from "lucide-react";
import { EmptyState } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { MerchantForm } from "../merchant-form";

export default function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, tenant } = useConsole();
  const merchant = db.merchants.find((m) => m.id === id && m.tenantId === tenant.id);
  return (
    <RequirePermission perm="merchants.manage">
      {merchant ? (
        <MerchantForm key={merchant.id} merchant={merchant} />
      ) : (
        <EmptyState icon={<Store />} title="Merchant not found" />
      )}
    </RequirePermission>
  );
}
