"use client";

import { RequirePermission } from "@/components/require-permission";
import { MerchantForm } from "../merchant-form";

export default function NewMerchantPage() {
  return (
    <RequirePermission perm="merchants.manage">
      <MerchantForm />
    </RequirePermission>
  );
}
