"use client";

import { use } from "react";
import { Ticket } from "lucide-react";
import { LiveGate } from "@/components/live-gate";
import { RequirePermission } from "@/components/require-permission";
import { CouponForm, useCouponFormData } from "../coupon-form";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="coupons.manage">
      <Edit id={id} />
    </RequirePermission>
  );
}

function Edit({ id }: { id: string }) {
  const state = useCouponFormData(id);
  return (
    <LiveGate state={state} icon={<Ticket />} notFound="Coupon not found">
      {(d) => <CouponForm key={id} coupon={d.coupon} taken={d.taken} uses={d.uses} />}
    </LiveGate>
  );
}
