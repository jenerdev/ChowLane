"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import type { Product } from "@chowlane/types";
import { formatPeso } from "@chowlane/lib";
import {
  Badge,
  Button,
  ConfirmSheet,
  EmptyState,
  PageHeader,
  Sheet,
  SheetContent,
  toast,
} from "@chowlane/ui";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/use-customer";

/** S-303 — a restaurant's menu; add to cart (CUS-004). One restaurant per cart (BL-6). */
export default function MerchantPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = use(params);
  const router = useRouter();
  const { db, tenant, base, slug } = useCustomer();
  const cart = useCart(slug);
  const [picked, setPicked] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [conflict, setConflict] = useState(false);
  const merchant = db.merchants.find(
    (m) => m.id === merchantId && m.tenantId === tenant.id && m.status === "ACTIVE",
  );
  if (!merchant) return <EmptyState icon={<UtensilsCrossed />} title="Restaurant not found" />;

  const products = db.products
    .filter((p) => p.merchantId === merchant.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = [...new Set(products.map((p) => p.category))];
  const cartMerchant = db.merchants.find((m) => m.id === cart.cart.merchantId);
  const inCartHere = cart.cart.merchantId === merchant.id ? cart.count : 0;

  const add = () => {
    if (!picked) return;
    if (!cart.add(merchant.id, picked.id, qty)) {
      setConflict(true);
      return;
    }
    toast(`${qty} × ${picked.name} added`);
    setPicked(null);
  };

  return (
    <>
      <PageHeader
        back={{ href: base, label: "Home" }}
        title={merchant.name}
        description={merchant.category}
        actions={merchant.isOpen ? undefined : <Badge>Closed</Badge>}
      />
      {!merchant.isOpen ? (
        <p className="mb-6 rounded-control bg-subtle px-4 py-3 text-sm">
          This restaurant is closed right now. You can look at the menu, but not order.
        </p>
      ) : null}
      {products.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed />} title="No menu yet" />
      ) : (
        <div className="flex flex-col gap-7">
          {categories.map((c) => (
            <section key={c}>
              <h2 className="mb-1 text-[13px] font-medium text-muted-foreground">{c}</h2>
              <ul className="divide-y">
                {products
                  .filter((p) => p.category === c)
                  .map((p) => {
                    const can = p.isAvailable && merchant.isOpen;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={!can}
                          onClick={() => {
                            setPicked(p);
                            setQty(1);
                          }}
                          className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{p.name}</span>
                            {p.description ? (
                              <span className="line-clamp-2 block text-[13px] text-muted-foreground">
                                {p.description}
                              </span>
                            ) : null}
                            <span className="mt-0.5 block text-sm tabular-nums">
                              {formatPeso(p.price)}
                            </span>
                          </span>
                          {!p.isAvailable ? (
                            <Badge>Sold out</Badge>
                          ) : cart.qtyOf(p.id) && cart.cart.merchantId === merchant.id ? (
                            <Badge tone="brand">{cart.qtyOf(p.id)} in cart</Badge>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {inCartHere ? (
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-6">
          <Button asChild size="lg" block>
            <Link href={`${base}/cart`}>View cart ({inCartHere})</Link>
          </Button>
        </div>
      ) : null}

      <Sheet open={picked !== null} onOpenChange={(o) => !o && setPicked(null)}>
        {picked ? (
          <SheetContent title={picked.name} description={picked.description || undefined}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tabular-nums">
                {formatPeso(picked.price * qty)}
              </span>
              <QtyStepper value={qty} onChange={setQty} min={1} label="Quantity" />
            </div>
            <Button size="lg" onClick={add}>
              Add to cart
            </Button>
          </SheetContent>
        ) : null}
      </Sheet>

      <ConfirmSheet
        open={conflict}
        onOpenChange={setConflict}
        title="Start a new cart?"
        description={`Your cart has food from ${cartMerchant?.name ?? "another restaurant"}. One order can only be from one restaurant.`}
        confirmLabel="Clear cart and add"
        onConfirm={() => {
          if (!picked) return;
          cart.replace(merchant.id, [{ productId: picked.id, qty }]);
          toast(`${qty} × ${picked.name} added`);
          setPicked(null);
          router.refresh();
        }}
      />
    </>
  );
}
