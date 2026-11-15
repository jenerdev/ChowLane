"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Merchant } from "@chowlane/types";
import { formatPhMobile, normalizePhMobile } from "@chowlane/lib";
import {
  Button,
  ConfirmSheet,
  Field,
  FormSection,
  Input,
  MapPicker,
  PageHeader,
  SaveBar,
  SwitchRow,
  Switch,
  toast,
} from "@chowlane/ui";
import { useMockStore } from "@/lib/store";
import { newId, useConsole } from "@/lib/use-console";

type Draft = Pick<Merchant, "name" | "category" | "address" | "location" | "isOpen" | "status"> & {
  phone: string;
};

/** S-112 — add or edit a merchant (OWN-003). */
export function MerchantForm({ merchant }: { merchant?: Merchant }) {
  const router = useRouter();
  const { tenant, settings, base, db } = useConsole();
  const insert = useMockStore((s) => s.insert);
  const patch = useMockStore((s) => s.patch);
  const [confirmOff, setConfirmOff] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [d, setD] = useState<Draft>(
    merchant
      ? { ...merchant, phone: formatPhMobile(merchant.phone) }
      : {
          name: "",
          category: "",
          address: "",
          phone: "",
          location: settings.serviceArea.center,
          isOpen: true,
          status: "ACTIVE",
        },
  );
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const categories = [
    ...new Set(db.merchants.filter((m) => m.tenantId === tenant.id).map((m) => m.category)),
  ];

  function save() {
    const e: typeof errors = {};
    if (d.name.trim().length < 2) e.name = "Enter the restaurant name.";
    if (!d.category.trim()) e.category = "Enter a category, like Filipino or Burgers.";
    if (!d.address.trim()) e.address = "Enter the address riders go to.";
    const phone = normalizePhMobile(d.phone);
    if (!phone) e.phone = "Enter a PH mobile number, like 0917 123 4567.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = {
      name: d.name.trim(),
      category: d.category.trim(),
      address: d.address.trim(),
      phone: phone!,
      location: d.location,
      isOpen: d.isOpen,
      status: d.status,
    };
    if (merchant) {
      patch("merchants", merchant.id, row);
      toast("Merchant saved");
      router.push(`${base}/merchants`);
    } else {
      const id = newId("m");
      insert("merchants", {
        id,
        tenantId: tenant.id,
        photoUrl: "",
        createdAt: new Date().toISOString(),
        ...row,
      });
      toast("Merchant added — now add its menu");
      router.push(`${base}/merchants/${id}/products`);
    }
  }

  return (
    <>
      <PageHeader
        back={{ href: `${base}/merchants`, label: "Merchants" }}
        title={merchant ? merchant.name : "Add merchant"}
        actions={
          merchant ? (
            <Button variant="outline" asChild>
              <Link href={`${base}/merchants/${merchant.id}/products`}>Menu</Link>
            </Button>
          ) : undefined
        }
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <FormSection title="Details" description="Customers see the name and category.">
          <Field label="Restaurant name" htmlFor="m-name" error={errors.name}>
            <Input
              id="m-name"
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field
            label="Category"
            htmlFor="m-category"
            error={errors.category}
            hint="E.g. Filipino, Burgers, Café, Lechon"
          >
            <Input
              id="m-category"
              list="m-categories"
              value={d.category}
              onChange={(e) => set("category", e.target.value)}
              aria-invalid={Boolean(errors.category)}
            />
            <datalist id="m-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field
            label="Contact number"
            htmlFor="m-phone"
            error={errors.phone}
            hint="Riders call this if there's a problem with an order."
          >
            <Input
              id="m-phone"
              type="tel"
              inputMode="tel"
              value={d.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0917 123 4567"
              aria-invalid={Boolean(errors.phone)}
            />
          </Field>
        </FormSection>

        <FormSection
          title="Location"
          description="Used to work out delivery distance and fees. Tap the map to move the pin."
        >
          <Field label="Address" htmlFor="m-address" error={errors.address}>
            <Input
              id="m-address"
              value={d.address}
              onChange={(e) => set("address", e.target.value)}
              aria-invalid={Boolean(errors.address)}
            />
          </Field>
          <MapPicker
            center={d.location}
            onPick={(p) => set("location", p)}
            color={tenant.primaryColor}
            zoom={15}
          />
          <p className="text-[13px] text-muted-foreground tabular-nums">
            {d.location.lat.toFixed(5)}, {d.location.lng.toFixed(5)}
          </p>
        </FormSection>

        <FormSection title="Status">
          <SwitchRow
            title="Open for orders"
            description="Turn off when the store is closed. Customers can't order from closed stores."
            control={
              <Switch
                checked={d.isOpen}
                onCheckedChange={(v) => set("isOpen", v)}
                aria-label="Open for orders"
              />
            }
          />
          {merchant ? (
            <SwitchRow
              title="Active"
              description="Inactive merchants are hidden from customers. Order history is kept."
              control={
                <Switch
                  checked={d.status === "ACTIVE"}
                  aria-label="Active"
                  onCheckedChange={(v) => (v ? set("status", "ACTIVE") : setConfirmOff(true))}
                />
              }
            />
          ) : null}
        </FormSection>

        <SaveBar>
          <Button variant="ghost" type="button" onClick={() => router.push(`${base}/merchants`)}>
            Cancel
          </Button>
          <Button type="submit">{merchant ? "Save changes" : "Add merchant"}</Button>
        </SaveBar>
      </form>
      <ConfirmSheet
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title="Make this merchant inactive?"
        description="Customers won't see it anymore. You can make it active again later."
        confirmLabel="Make inactive"
        destructive
        onConfirm={() => set("status", "INACTIVE")}
      />
    </>
  );
}
