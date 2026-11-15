"use client";

import { use } from "react";
import { Ticket } from "lucide-react";
import { EmptyState } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { CouponForm } from "../coupon-form";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, tenant } = useConsole();
  const coupon = db.coupons.find((c) => c.id === id && c.tenantId === tenant.id);
  return (
    <RequirePermission perm="coupons.manage">
      {coupon ? (
        <CouponForm key={coupon.id} coupon={coupon} />
      ) : (
        <EmptyState icon={<Ticket />} title="Coupon not found" />
      )}
    </RequirePermission>
  );
}
