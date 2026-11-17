"use client";

import { LiveGate } from "@/components/live-gate";
import { RequirePermission } from "@/components/require-permission";
import { MerchantForm, useMerchantFormData } from "../merchant-form";

export default function NewMerchantPage() {
  return (
    <RequirePermission perm="merchants.manage">
      <New />
    </RequirePermission>
  );
}

function New() {
  const state = useMerchantFormData();
  return (
    <LiveGate state={state}>
      {(d) => <MerchantForm center={d.center} categories={d.categories} />}
    </LiveGate>
  );
}
