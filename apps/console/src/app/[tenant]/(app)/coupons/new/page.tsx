"use client";

import { LiveGate } from "@/components/live-gate";
import { RequirePermission } from "@/components/require-permission";
import { CouponForm, useCouponFormData } from "../coupon-form";

export default function NewCouponPage() {
  return (
    <RequirePermission perm="coupons.manage">
      <New />
    </RequirePermission>
  );
}

function New() {
  const state = useCouponFormData();
  return <LiveGate state={state}>{(d) => <CouponForm taken={d.taken} uses={[]} />}</LiveGate>;
}
