"use client";

import { use } from "react";
import { Bike } from "lucide-react";
import { findTenantBySlug } from "@chowlane/mocks";
import { usePersona } from "@chowlane/mocks/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  OrderStatusBadge,
  PageHeader,
} from "@chowlane/ui";
import { cashNeededAtStore } from "@chowlane/lib";
import { useMockStore } from "@/lib/store";

/** Foundation preview — the real rider home (S-201) is built in Milestone 1.6. */
export default function RiderHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = use(params);
  const tenant = findTenantBySlug(slug)!;
  const riders = useMockStore((s) => s.riders).filter(
    (r) => r.tenantId === tenant.id && r.status === "ACTIVE",
  );
  const orders = useMockStore((s) => s.orders);
  const [personaId] = usePersona(`rider:${slug}`, riders[0]?.id ?? "");
  const me = riders.find((r) => r.id === personaId) ?? riders[0];
  const active = me?.activeOrderId ? orders.find((o) => o.id === me.activeOrderId) : undefined;

  if (!me) return <EmptyState icon={<Bike />} title="No riders yet" />;

  return (
    <>
      <PageHeader
        title={me.name}
        description={me.vehicleType.toLowerCase()}
        actions={
          <Badge tone={me.isOnShift ? "success" : "neutral"}>
            {me.isOnShift ? "On shift" : "Off shift"}
          </Badge>
        }
      />
      <Button
        block
        size="lg"
        variant={me.isOnShift ? "outline" : "default"}
        className="mb-4"
        disabled
      >
        {me.isOnShift ? "Time out" : "Time in"} (Milestone 1.6)
      </Button>
      {active ? (
        <Card>
          <CardHeader>
            <CardTitle>Active order {active.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <OrderStatusBadge status={active.status} />
            <p>
              Cash needed at store:{" "}
              <Money value={cashNeededAtStore(active.items)} className="font-semibold" />
            </p>
            <p>
              Collect from customer: <Money value={active.total} className="font-semibold" />
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Bike />}
          title="No active order"
          description="New order offers will appear here."
        />
      )}
    </>
  );
}
