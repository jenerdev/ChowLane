"use client";

import { RequirePermission } from "@/components/require-permission";
import { CouponForm } from "../coupon-form";

export default function NewCouponPage() {
  return (
    <RequirePermission perm="coupons.manage">
      <CouponForm />
    </RequirePermission>
  );
}
