"use client";

import { use, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import type { Product } from "@chowlane/types";
import { formatPeso } from "@chowlane/lib";
import { toMerchant, toProduct } from "@chowlane/db/mappers";
import {
  Button,
  ConfirmSheet,
  EmptyState,
  Field,
  Input,
  MoneyInput,
  PageHeader,
  Sheet,
  SheetContent,
  Switch,
  SwitchRow,
  Textarea,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-113 — menu items and prices of one merchant (OWN-004). */
export default function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="products.manage">
      <Products merchantId={id} />
    </RequirePermission>
  );
}

type Draft = {
  name: string;
  category: string;
  description: string;
  price?: number;
  storePrice?: number;
  isAvailable: boolean;
};
const empty: Draft = { name: "", category: "", description: "", isAvailable: true };

function Products({ merchantId }: { merchantId: string }) {
  const { live, base, supabase } = useConsole();
  const data = useLive(`products:${merchantId}`, async (sb) => {
    const [merchant, products] = await Promise.all([
      sb.from("merchants").select("*").eq("id", merchantId).eq("tenant_id", live.id).maybeSingle(),
      sb
        .from("products")
        .select("*")
        .eq("merchant_id", merchantId)
        .eq("tenant_id", live.id)
        .order("sort_order"),
    ]);
    const m = must(merchant);
    return m ? { merchant: toMerchant(m), products: must(products).map(toProduct) } : null;
  });
  const merchant = data.data?.merchant;
  const products = data.data?.products ?? [];

  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [d, setD] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (data.loading) return null;
  if (!merchant)
    return (
      <EmptyState icon={<UtensilsCrossed />} title="Merchant not found" description={data.error} />
    );

  async function setAvailable(p: Product, v: boolean) {
    const { error } = await supabase.from("products").update({ is_available: v }).eq("id", p.id);
    toast(
      error
        ? `Couldn't save: ${error.message}`
        : v
          ? `${p.name} is available`
          : `${p.name} marked sold out`,
    );
    await data.reload();
  }

  const categories = [...new Set(products.map((p) => p.category))];
  const open = (p: Product | "new") => {
    setEditing(p);
    setErrors({});
    setD(p === "new" ? { ...empty, category: categories[0] ?? "" } : { ...p });
  };

  async function save() {
    const e: typeof errors = {};
    if (d.name.trim().length < 2) e.name = "Enter the item name.";
    if (!d.category.trim()) e.category = "Enter a menu category.";
    if (!d.price || d.price <= 0) e.price = "Enter the price customers pay.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = {
      name: d.name.trim(),
      category: d.category.trim(),
      description: d.description.trim(),
      price: d.price!,
      store_price: d.storePrice ?? null,
      is_available: d.isAvailable,
    };
    setBusy(true);
    const { error } =
      editing === "new"
        ? await supabase.from("products").insert({
            ...row,
            tenant_id: live.id,
            merchant_id: merchantId,
            sort_order: products.reduce((n, p) => Math.max(n, p.sortOrder + 1), 0),
          })
        : await supabase
            .from("products")
            .update(row)
            .eq("id", (editing as Product).id);
    setBusy(false);
    if (error) return setErrors({ name: error.message });
    toast(editing === "new" ? "Item added" : "Item saved");
    setEditing(null);
    await data.reload();
  }

  return (
    <>
      <PageHeader
        back={{ href: `${base}/merchants/${merchant.id}`, label: merchant.name }}
        title="Menu"
        description="Prices here are what customers pay. Store price is optional — it tracks your markup."
        actions={
          <Button onClick={() => open("new")}>
            <Plus /> Add item
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed />}
          title="No menu items yet"
          description="Add the dishes customers can order from this restaurant."
          action={<Button onClick={() => open("new")}>Add item</Button>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">{cat}</h2>
              <ul className="divide-y rounded-card border">
                {products
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => open(p)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block text-[13px] text-muted-foreground tabular-nums">
                          {formatPeso(p.price)}
                          {p.storePrice ? ` · store ${formatPeso(p.storePrice)}` : ""}
                        </span>
                      </button>
                      <label className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
                        <span className="hidden sm:inline">
                          {p.isAvailable ? "Available" : "Sold out"}
                        </span>
                        <Switch
                          checked={p.isAvailable}
                          aria-label={`${p.name} available`}
                          onCheckedChange={(v) => void setAvailable(p, v)}
                        />
                      </label>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title={editing === "new" ? "Add item" : "Edit item"}>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field label="Name" htmlFor="p-name" error={errors.name}>
              <Input
                id="p-name"
                value={d.name}
                onChange={(e) => setD({ ...d, name: e.target.value })}
                aria-invalid={Boolean(errors.name)}
              />
            </Field>
            <Field
              label="Menu category"
              htmlFor="p-cat"
              error={errors.category}
              hint="E.g. Rice Meals, Drinks, Desserts"
            >
              <Input
                id="p-cat"
                list="p-cats"
                value={d.category}
                onChange={(e) => setD({ ...d, category: e.target.value })}
                aria-invalid={Boolean(errors.category)}
              />
              <datalist id="p-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" htmlFor="p-price" error={errors.price}>
                <MoneyInput
                  id="p-price"
                  value={d.price}
                  onChange={(v) => setD({ ...d, price: v })}
                  aria-invalid={Boolean(errors.price)}
                />
              </Field>
              <Field label="Store price" htmlFor="p-store" hint="Optional">
                <MoneyInput
                  id="p-store"
                  value={d.storePrice}
                  onChange={(v) => setD({ ...d, storePrice: v })}
                />
              </Field>
            </div>
            <Field label="Description" htmlFor="p-desc" hint="Optional">
              <Textarea
                id="p-desc"
                value={d.description}
                onChange={(e) => setD({ ...d, description: e.target.value })}
              />
            </Field>
            <SwitchRow
              title="Available"
              description="Turn off when it's sold out."
              control={
                <Switch
                  checked={d.isAvailable}
                  onCheckedChange={(v) => setD({ ...d, isAvailable: v })}
                  aria-label="Available"
                />
              }
            />
            <div className="flex gap-2 pt-2">
              {editing && editing !== "new" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              ) : null}
              <Button type="submit" className="ml-auto" disabled={busy}>
                {editing === "new" ? "Add item" : "Save"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this item?"
        description="It's removed from the menu. Past orders keep their details."
        confirmLabel="Delete item"
        destructive
        onConfirm={async () => {
          if (editing && editing !== "new") {
            const { error } = await supabase.from("products").delete().eq("id", editing.id);
            toast(error ? `Couldn't delete: ${error.message}` : "Item deleted");
            await data.reload();
          }
          setEditing(null);
        }}
      />
    </>
  );
}
