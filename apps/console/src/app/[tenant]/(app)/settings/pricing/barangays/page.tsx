"use client";

import { useState } from "react";
import { MapPinned, Plus } from "lucide-react";
import type { BarangayFee, Centavos } from "@chowlane/types";
import { formatPeso } from "@chowlane/lib";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  MoneyInput,
  PageHeader,
  Sheet,
  SheetContent,
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { newId, useConsole } from "@/lib/use-console";

/** S-122 — price list for PER_BARANGAY delivery fees (OWN-014). */
export default function BarangaysPage() {
  return (
    <RequirePermission perm="settings.pricing">
      <Barangays />
    </RequirePermission>
  );
}

type Draft = {
  barangay: string;
  cityMunicipality: string;
  province: string;
  fee?: Centavos;
  isActive: boolean;
};

function Barangays() {
  const { db, tenant, settings, base } = useConsole();
  const insert = useMockStore((s) => s.insert);
  const patch = useMockStore((s) => s.patch);
  const list = db.barangayFees
    .filter((b) => b.tenantId === tenant.id)
    .sort(
      (a, b) => Number(b.isActive) - Number(a.isActive) || a.barangay.localeCompare(b.barangay),
    );
  const [editing, setEditing] = useState<BarangayFee | "new" | null>(null);
  const [d, setD] = useState<Draft>({
    barangay: "",
    cityMunicipality: "",
    province: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const open = (b: BarangayFee | "new") => {
    setEditing(b);
    setErrors({});
    const last = list[0];
    setD(
      b === "new"
        ? {
            barangay: "",
            cityMunicipality: last?.cityMunicipality ?? "",
            province: last?.province ?? "",
            isActive: true,
          }
        : { ...b },
    );
  };

  function save() {
    const e: typeof errors = {};
    if (!d.barangay.trim()) e.barangay = "Enter the barangay.";
    if (!d.cityMunicipality.trim()) e.cityMunicipality = "Enter the city or municipality.";
    if (!d.fee || d.fee <= 0) e.fee = "Enter the delivery fee.";
    const dup = list.find(
      (b) =>
        b.barangay.toLowerCase() === d.barangay.trim().toLowerCase() &&
        b.cityMunicipality.toLowerCase() === d.cityMunicipality.trim().toLowerCase() &&
        (editing === "new" || b.id !== editing?.id),
    );
    if (dup) e.barangay = "This barangay is already listed.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = {
      barangay: d.barangay.trim(),
      cityMunicipality: d.cityMunicipality.trim(),
      province: d.province.trim(),
      fee: d.fee!,
      isActive: d.isActive,
    };
    if (editing === "new") insert("barangayFees", { id: newId("bf"), tenantId: tenant.id, ...row });
    else if (editing) patch("barangayFees", editing.id, row);
    toast(editing === "new" ? "Barangay added" : "Barangay saved");
    setEditing(null);
  }

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings/pricing`, label: "Delivery fee" }}
        title="Barangay prices"
        description={
          settings.deliveryFee.mode === "PER_BARANGAY"
            ? "Customers pick their barangay at checkout. Only active barangays can order."
            : "Not in use — your delivery fee is set to per kilometer or fixed."
        }
        actions={
          <Button onClick={() => open("new")}>
            <Plus /> Add
          </Button>
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<MapPinned />}
          title="No barangays yet"
          description="Add each barangay you deliver to with its fee."
          action={<Button onClick={() => open("new")}>Add barangay</Button>}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => open(b)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.barangay}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {b.cityMunicipality}
                  </span>
                </span>
                {b.isActive ? null : <Badge>Inactive</Badge>}
                <span className="text-sm tabular-nums">{formatPeso(b.fee)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title={editing === "new" ? "Add barangay" : "Edit barangay"}>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <Field label="Barangay" htmlFor="bg-name" error={errors.barangay}>
              <Input
                id="bg-name"
                value={d.barangay}
                onChange={(e) => setD({ ...d, barangay: e.target.value })}
                aria-invalid={Boolean(errors.barangay)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City / municipality" htmlFor="bg-city" error={errors.cityMunicipality}>
                <Input
                  id="bg-city"
                  value={d.cityMunicipality}
                  onChange={(e) => setD({ ...d, cityMunicipality: e.target.value })}
                  aria-invalid={Boolean(errors.cityMunicipality)}
                />
              </Field>
              <Field label="Province" htmlFor="bg-prov">
                <Input
                  id="bg-prov"
                  value={d.province}
                  onChange={(e) => setD({ ...d, province: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Delivery fee" htmlFor="bg-fee" error={errors.fee}>
              <MoneyInput
                id="bg-fee"
                value={d.fee}
                onChange={(v) => setD({ ...d, fee: v })}
                aria-invalid={Boolean(errors.fee)}
              />
            </Field>
            <SwitchRow
              title="Active"
              description="Inactive barangays can't order."
              control={
                <Switch
                  checked={d.isActive}
                  onCheckedChange={(v) => setD({ ...d, isActive: v })}
                  aria-label="Active"
                />
              }
            />
            <Button type="submit">{editing === "new" ? "Add barangay" : "Save"}</Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
