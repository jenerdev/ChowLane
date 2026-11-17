"use client";

import { use } from "react";
import { Store } from "lucide-react";
import { LiveGate } from "@/components/live-gate";
import { RequirePermission } from "@/components/require-permission";
import { MerchantForm, useMerchantFormData } from "../merchant-form";

export default function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="merchants.manage">
      <Edit id={id} />
    </RequirePermission>
  );
}

function Edit({ id }: { id: string }) {
  const state = useMerchantFormData(id);
  return (
    <LiveGate state={state} icon={<Store />} notFound="Merchant not found">
      {(d) => (
        <MerchantForm key={id} merchant={d.merchant} center={d.center} categories={d.categories} />
      )}
    </LiveGate>
  );
}
