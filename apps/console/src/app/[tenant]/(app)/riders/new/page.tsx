"use client";

import { RequirePermission } from "@/components/require-permission";
import { RiderForm } from "../rider-form";

export default function NewRiderPage() {
  return (
    <RequirePermission perm="riders.manage">
      <RiderForm />
    </RequirePermission>
  );
}
