"use client";

import { use } from "react";
import { findTenantBySlug } from "@chowlane/mocks";
import { usePersona } from "@chowlane/mocks/react";
import { permissionsOf } from "@chowlane/lib";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Stat } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** Foundation preview — the real console home (S-101) is built in Milestones 1.3/1.4. */
export default function ConsoleHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = use(params);
  const tenant = findTenantBySlug(slug)!;
  const db = useMockStore();
  const staff = db.staff.filter((s) => s.tenantId === tenant.id && s.status === "ACTIVE");
  const [personaId] = usePersona(`console:${slug}`, staff[0]?.id ?? "");
  const me = staff.find((s) => s.id === personaId) ?? staff[0];
  const role = db.roles.find((r) => r.id === me?.roleId);
  const perms = me ? permissionsOf(me, role) : [];

  const orders = db.orders.filter((o) => o.tenantId === tenant.id);
  const pendingApproval = orders.filter((o) => o.status === "PENDING_APPROVAL").length;
  const active = orders.filter((o) =>
    ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(o.status),
  ).length;
  const toVerify = db.customers.filter(
    (c) => c.tenantId === tenant.id && c.verificationStatus === "PENDING",
  ).length;
  const onShift = db.riders.filter((r) => r.tenantId === tenant.id && r.isOnShift).length;
  const cashPending = db.shifts.filter(
    (s) => s.tenantId === tenant.id && s.remitStatus === "PENDING",
  ).length;

  return (
    <>
      <PageHeader
        title={`Good day${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        description={tenant.businessName}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Orders to approve" value={pendingApproval} />
        <Stat label="Customers to verify" value={toVerify} />
        <Stat label="Active orders" value={active} />
        <Stat label="Riders on shift" value={onShift} />
        <Stat label="Cash to record" value={cashPending} />
      </div>
      {me ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Acting as {me.name} · {me.type === "OWNER" ? "Owner" : role?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {perms.map((p) => (
              <Badge key={p} tone="brand">
                {p}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
