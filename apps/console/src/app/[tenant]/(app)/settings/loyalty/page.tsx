"use client";

import { useState } from "react";
import type { LoyaltySettings, Merchant, Product, TenantSettings } from "@chowlane/types";
import { toMerchant, toProduct } from "@chowlane/db/mappers";
import { formatPeso } from "@chowlane/lib";
import {
  Button,
  Card,
  CardContent,
  Field,
  FormSection,
  Input,
  MoneyInput,
  NumberInput,
  PageHeader,
  RadioCards,
  SaveBar,
  Select,
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { LiveGate } from "@/components/live-gate";
import { RequirePermission } from "@/components/require-permission";
import { useSaveSettings, useSettings } from "@/lib/settings";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-127 — loyalty program: master switch + rules (OWN-019, BL-14). */
export default function LoyaltySettingsPage() {
  return (
    <RequirePermission perm="settings.loyalty">
      <Loyalty />
    </RequirePermission>
  );
}

function Loyalty() {
  const { live } = useConsole();
  const state = useSettings();
  const menu = useLive(`loyalty-menu:${live.id}`, async (sb) => {
    const [merchants, products] = await Promise.all([
      sb
        .from("merchants")
        .select("*")
        .eq("tenant_id", live.id)
        .eq("status", "ACTIVE")
        .order("name"),
      sb.from("products").select("*").eq("tenant_id", live.id).order("sort_order"),
    ]);
    return { merchants: must(merchants).map(toMerchant), products: must(products).map(toProduct) };
  });
  return (
    <LiveGate state={state}>
      {(s) => (
        <LoyaltyForm
          settings={s}
          merchants={menu.data?.merchants ?? []}
          products={menu.data?.products ?? []}
        />
      )}
    </LiveGate>
  );
}

function LoyaltyForm({
  settings,
  merchants,
  products,
}: {
  settings: TenantSettings;
  merchants: Merchant[];
  products: Product[];
}) {
  const { base } = useConsole();
  const saveSettings = useSaveSettings();
  const [busy, setBusy] = useState(false);
  const [l, setL] = useState<LoyaltySettings>(settings.loyalty);
  const p = l.points;

  const errors: string[] = [];
  if (l.freeDelivery.enabled && !(l.freeDelivery.ordersRequired >= 2))
    errors.push("Free delivery needs at least 2 orders.");
  if (l.freeGift.enabled && !(l.freeGift.ordersRequired >= 2))
    errors.push("Free gift needs at least 2 orders.");
  if (l.freeGift.enabled && !l.freeGift.giftName.trim()) errors.push("Name the free gift.");
  if (
    p.enabled &&
    (p.earnMode === "PER_ORDER" ? !(p.pointsPerOrder >= 1) : !(p.centavosPerPoint >= 100))
  )
    errors.push("Set how points are earned.");
  if (p.enabled && !(p.pointValue >= 1)) errors.push("Set what a point is worth.");
  if (p.enabled && !(p.maxRedeemPercent >= 1 && p.maxRedeemPercent <= 100))
    errors.push("Max % must be 1–100.");

  const summary = !l.enabled
    ? "Rewards are off. Customers don't see a rewards page."
    : [
        l.freeDelivery.enabled
          ? `free delivery every ${l.freeDelivery.ordersRequired} orders`
          : null,
        l.freeGift.enabled
          ? `${l.freeGift.giftName || "a free gift"} every ${l.freeGift.ordersRequired} orders`
          : null,
        p.enabled
          ? p.earnMode === "PER_ORDER"
            ? `${p.pointsPerOrder} points per order (1 point = ${formatPeso(p.pointValue)})`
            : `1 point for every ${formatPeso(p.centavosPerPoint)} spent (1 point = ${formatPeso(p.pointValue)})`
          : null,
      ]
        .filter(Boolean)
        .join(", ") || "Turn on at least one reward below.";

  return (
    <>
      <PageHeader back={{ href: `${base}/settings`, label: "Settings" }} title="Loyalty program" />
      <FormSection
        title="Program"
        description="Only successful (delivered) orders count. Turning a reward off keeps customers' progress."
      >
        <SwitchRow
          title="Rewards for customers"
          description={l.enabled ? `Customers get: ${summary}` : summary}
          control={
            <Switch
              checked={l.enabled}
              onCheckedChange={(v) => setL({ ...l, enabled: v })}
              aria-label="Rewards on"
            />
          }
        />
      </FormSection>

      <div className={l.enabled ? "" : "pointer-events-none opacity-50"} aria-disabled={!l.enabled}>
        <FormSection title="Rewards" description="Choose any combination.">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-5">
              <SwitchRow
                title="Free delivery"
                description="After a number of successful orders, the next delivery is free."
                control={
                  <Switch
                    checked={l.freeDelivery.enabled}
                    onCheckedChange={(v) =>
                      setL({ ...l, freeDelivery: { ...l.freeDelivery, enabled: v } })
                    }
                    aria-label="Free delivery reward"
                  />
                }
              />
              {l.freeDelivery.enabled ? (
                <Field label="Every" htmlFor="ly-fd">
                  <NumberInput
                    id="ly-fd"
                    value={l.freeDelivery.ordersRequired}
                    onChange={(v) =>
                      setL({ ...l, freeDelivery: { ...l.freeDelivery, ordersRequired: v ?? 0 } })
                    }
                    suffix="orders"
                    min={2}
                    className="max-w-40"
                  />
                </Field>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-5">
              <SwitchRow
                title="Free gift"
                description="After a number of successful orders, customers can claim a gift on their next order."
                control={
                  <Switch
                    checked={l.freeGift.enabled}
                    onCheckedChange={(v) => setL({ ...l, freeGift: { ...l.freeGift, enabled: v } })}
                    aria-label="Free gift reward"
                  />
                }
              />
              {l.freeGift.enabled ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Every" htmlFor="ly-fg">
                      <NumberInput
                        id="ly-fg"
                        value={l.freeGift.ordersRequired}
                        onChange={(v) =>
                          setL({ ...l, freeGift: { ...l.freeGift, ordersRequired: v ?? 0 } })
                        }
                        suffix="orders"
                        min={2}
                      />
                    </Field>
                    <Field label="Gift name" htmlFor="ly-gn">
                      <Input
                        id="ly-gn"
                        value={l.freeGift.giftName}
                        placeholder="Free Halo-Halo"
                        onChange={(e) =>
                          setL({ ...l, freeGift: { ...l.freeGift, giftName: e.target.value } })
                        }
                      />
                    </Field>
                  </div>
                  <Field
                    label="Menu item"
                    htmlFor="ly-gp"
                    hint="If linked, customers can only claim it on orders from that restaurant. The rider buys it; you cover the cost."
                  >
                    <Select
                      id="ly-gp"
                      value={l.freeGift.productId ?? ""}
                      onChange={(e) =>
                        setL({
                          ...l,
                          freeGift: { ...l.freeGift, productId: e.target.value || undefined },
                        })
                      }
                    >
                      <option value="">Not linked to a menu item</option>
                      {merchants.map((m) => (
                        <optgroup key={m.id} label={m.name}>
                          {products
                            .filter((x) => x.merchantId === m.id)
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-5">
              <SwitchRow
                title="Points"
                description="Customers earn points on each successful order and use them to pay for food."
                control={
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={(v) => setL({ ...l, points: { ...p, enabled: v } })}
                    aria-label="Points reward"
                  />
                }
              />
              {p.enabled ? (
                <>
                  <RadioCards
                    name="earn-mode"
                    columns={2}
                    value={p.earnMode}
                    onChange={(v) => setL({ ...l, points: { ...p, earnMode: v } })}
                    options={[
                      {
                        value: "PER_PESO",
                        label: "Per peso spent",
                        description: "More points for bigger orders.",
                      },
                      {
                        value: "PER_ORDER",
                        label: "Per order",
                        description: "Same points for every order.",
                      },
                    ]}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {p.earnMode === "PER_ORDER" ? (
                      <Field label="Points per order" htmlFor="ly-ppo">
                        <NumberInput
                          id="ly-ppo"
                          value={p.pointsPerOrder}
                          onChange={(v) => setL({ ...l, points: { ...p, pointsPerOrder: v ?? 0 } })}
                          suffix="pts"
                          min={1}
                        />
                      </Field>
                    ) : (
                      <Field label="1 point for every" htmlFor="ly-cpp" hint="Food amount paid">
                        <MoneyInput
                          id="ly-cpp"
                          value={p.centavosPerPoint}
                          onChange={(v) =>
                            setL({ ...l, points: { ...p, centavosPerPoint: v ?? 0 } })
                          }
                        />
                      </Field>
                    )}
                    <Field label="1 point is worth" htmlFor="ly-pv">
                      <MoneyInput
                        id="ly-pv"
                        value={p.pointValue}
                        onChange={(v) => setL({ ...l, points: { ...p, pointValue: v ?? 0 } })}
                      />
                    </Field>
                    <Field label="Minimum to use" htmlFor="ly-min">
                      <NumberInput
                        id="ly-min"
                        value={p.minRedeemPoints}
                        onChange={(v) => setL({ ...l, points: { ...p, minRedeemPoints: v ?? 0 } })}
                        suffix="pts"
                        min={0}
                      />
                    </Field>
                    <Field label="Max of food paid with points" htmlFor="ly-max">
                      <NumberInput
                        id="ly-max"
                        value={p.maxRedeemPercent}
                        onChange={(v) => setL({ ...l, points: { ...p, maxRedeemPercent: v ?? 0 } })}
                        suffix="%"
                        min={1}
                        max={100}
                      />
                    </Field>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    Points never pay the delivery fee and don&apos;t expire.
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>
        </FormSection>
      </div>

      <SaveBar note={errors[0]}>
        <Button
          disabled={errors.length > 0 || busy}
          onClick={async () => {
            setBusy(true);
            const error = await saveSettings({
              loyalty: { ...l, freeGift: { ...l.freeGift, giftName: l.freeGift.giftName.trim() } },
            });
            setBusy(false);
            toast(error ? `Couldn't save: ${error}` : "Loyalty program saved");
          }}
        >
          Save changes
        </Button>
      </SaveBar>
    </>
  );
}
