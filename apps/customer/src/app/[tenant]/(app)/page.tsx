"use client";

import { use } from "react";
import { Store } from "lucide-react";
import { findTenantBySlug } from "@chowlane/mocks";
import { usePersona } from "@chowlane/mocks/react";
import { Badge, Card, CardContent, EmptyState, PageHeader, VerificationBadge } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** Foundation preview — the real customer home (S-302) is built in Milestone 1.5. */
export default function CustomerHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = use(params);
  const tenant = findTenantBySlug(slug)!;
  const customers = useMockStore((s) => s.customers).filter((c) => c.tenantId === tenant.id);
  const merchants = useMockStore((s) => s.merchants).filter(
    (m) => m.tenantId === tenant.id && m.status === "ACTIVE",
  );
  const [personaId] = usePersona(`customer:${slug}`, customers[0]?.id ?? "");
  const me = customers.find((c) => c.id === personaId) ?? customers[0];

  return (
    <>
      <PageHeader
        title={`Hi${me ? `, ${me.name.split(" ")[0]}` : ""}!`}
        description="What are you craving today?"
      />
      {me ? (
        <div className="mb-4">
          <VerificationBadge status={me.verificationStatus} />
        </div>
      ) : null}
      {merchants.length === 0 ? (
        <EmptyState icon={<Store />} title="No restaurants yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {merchants.map((m) => (
            <li key={m.id}>
              <Card>
                <CardContent className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.category}</p>
                  </div>
                  <Badge tone={m.isOpen ? "success" : "neutral"}>
                    {m.isOpen ? "Open" : "Closed"}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
