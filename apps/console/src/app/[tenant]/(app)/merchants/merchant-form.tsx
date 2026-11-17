"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LatLng, Merchant } from "@chowlane/types";
import { toMerchant } from "@chowlane/db/mappers";
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
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

type Draft = Pick<Merchant, "name" | "category" | "address" | "location" | "isOpen" | "status"> & {
  phone: string;
};

/** Loads what the merchant form needs: the merchant (when editing), the area center and used categories. */
export function useMerchantFormData(id?: string) {
  const { live } = useConsole();
  return useLive(`merchant-form:${id ?? "new"}`, async (sb) => {
    const [merchant, settings, all] = await Promise.all([
      id
        ? sb.from("merchants").select("*").eq("id", id).eq("tenant_id", live.id).maybeSingle()
        : { data: null, error: null },
      sb
        .from("tenant_settings")
        .select("service_area_lat, service_area_lng")
        .eq("tenant_id", live.id)
        .single(),
      sb.from("merchants").select("category").eq("tenant_id", live.id),
    ]);
    const m = must(merchant);
    if (id && !m) return null;
    const s = must(settings);
    return {
      merchant: m ? toMerchant(m) : undefined,
      center: { lat: s.service_area_lat, lng: s.service_area_lng },
      categories: [...new Set(must(all).map((x) => x.category))],
    };
  });
}

/** S-112 — add or edit a merchant (OWN-003). Live since 2.4. */
export function MerchantForm({
  merchant,
  center,
  categories,
}: {
  merchant?: Merchant;
  center: LatLng;
  categories: string[];
}) {
  const router = useRouter();
  const { live: tenant, base, supabase } = useConsole();
  const [busy, setBusy] = useState(false);
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
          location: center,
          isOpen: true,
          status: "ACTIVE",
        },
  );
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  async function save() {
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
      location_lat: d.location.lat,
      location_lng: d.location.lng,
      is_open: d.isOpen,
      status: d.status,
    };
    setBusy(true);
    try {
      if (merchant) {
        const { error } = await supabase.from("merchants").update(row).eq("id", merchant.id);
        if (error) return toast(`Couldn't save: ${error.message}`);
        toast("Merchant saved");
        router.push(`${base}/merchants`);
      } else {
        const { data, error } = await supabase
          .from("merchants")
          .insert({ ...row, tenant_id: tenant.id })
          .select("id")
          .single();
        if (error) return toast(`Couldn't add the merchant: ${error.message}`);
        toast("Merchant added — now add its menu");
        router.push(`${base}/merchants/${data.id}/products`);
      }
    } finally {
      setBusy(false);
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
          void save();
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
          <Button type="submit" disabled={busy}>
            {merchant ? "Save changes" : "Add merchant"}
          </Button>
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
