"use client";

import { Store } from "lucide-react";
import { formatPeso } from "@chowlane/lib";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-507 — merchants and their menus (read-only, PLT-006). */
export default function TenantMerchants() {
  const r = useTenantRecords();
  if (!r.tenant) return null;
  const list = [...r.merchants].sort(
    (a, b) =>
      Number(a.status === "INACTIVE") - Number(b.status === "INACTIVE") ||
      a.name.localeCompare(b.name),
  );
  return (
    <>
      <ReadOnlyNote />
      {list.length === 0 ? (
        <EmptyState icon={<Store />} title="No merchants yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((m) => {
            const items = r.products.filter((p) => p.merchantId === m.id);
            return (
              <Card key={m.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{m.name}</CardTitle>
                    {m.status === "INACTIVE" ? (
                      <Badge>Inactive</Badge>
                    ) : m.isOpen ? (
                      <Badge tone="success">Open</Badge>
                    ) : (
                      <Badge>Closed</Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {m.category} · {m.address}
                  </p>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No menu items.</p>
                  ) : (
                    <ul className="divide-y">
                      {items.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                          <span className={p.isAvailable ? "" : "text-muted-foreground"}>
                            {p.name}
                            <span className="text-[13px] text-muted-foreground">
                              {" "}
                              · {p.category}
                            </span>
                            {p.isAvailable ? null : <Badge className="ml-2">Sold out</Badge>}
                          </span>
                          <span className="tabular-nums">{formatPeso(p.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
