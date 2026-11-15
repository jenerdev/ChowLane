"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartItems, computeSubtotal, exceedsMaxOrder, formatPeso } from "@chowlane/lib";
import { Badge, Button, EmptyState, PageHeader } from "@chowlane/ui";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/use-customer";

/** S-304 — cart (CUS-004): one restaurant, qty edit, subtotal, max order (BL-11.5). */
export default function CartPage() {
  const { db, tenant, settings, base, slug } = useCustomer();
  const cart = useCart(slug);
  const merchant = db.merchants.find((m) => m.id === cart.cart.merchantId);
  const products = db.products.filter((p) => p.tenantId === tenant.id);
  const items = cartItems(cart.cart.lines, products);

  if (!merchant || items.length === 0) {
    return (
      <>
        <PageHeader back={{ href: base, label: "Home" }} title="Cart" />
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Pick a restaurant and add something tasty."
          action={
            <Button asChild>
              <Link href={base}>Browse restaurants</Link>
            </Button>
          }
        />
      </>
    );
  }

  const subtotal = computeSubtotal(items);
  const tooBig = exceedsMaxOrder(subtotal, settings.maxOrderSubtotal);
  const soldOut = cart.cart.lines.filter(
    (l) => products.find((p) => p.id === l.productId)?.isAvailable === false,
  );
  const blocked = tooBig || soldOut.length > 0 || !merchant.isOpen;

  return (
    <>
      <PageHeader back={{ href: `${base}/m/${merchant.id}`, label: merchant.name }} title="Cart" />
      <ul className="divide-y">
        {items.map((i) => {
          const p = products.find((x) => x.id === i.productId)!;
          return (
            <li key={i.productId} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{i.name}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {formatPeso(i.lineTotal)}
                </span>
                {!p.isAvailable ? <Badge className="mt-1">Sold out — remove it</Badge> : null}
              </span>
              <QtyStepper
                value={i.qty}
                onChange={(q) => cart.setQty(i.productId, q)}
                label={`${i.name} quantity`}
              />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-between border-t pt-4 font-medium">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatPeso(subtotal)}</span>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Delivery fee and discounts are shown at checkout.
      </p>
      {tooBig ? (
        <p className="mt-4 rounded-control bg-warning-soft px-4 py-3 text-sm text-warning">
          The maximum per order is {formatPeso(settings.maxOrderSubtotal)}. Remove some items to
          continue.
        </p>
      ) : null}
      {!merchant.isOpen ? (
        <p className="mt-4 rounded-control bg-subtle px-4 py-3 text-sm">
          {merchant.name} is closed right now.
        </p>
      ) : null}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-6 flex flex-col gap-2 bg-background pt-2">
        {blocked ? (
          <Button size="lg" block disabled>
            Checkout
          </Button>
        ) : (
          <Button asChild size="lg" block>
            <Link href={`${base}/checkout`}>Checkout · {formatPeso(subtotal)}</Link>
          </Button>
        )}
        <Button variant="ghost" onClick={() => cart.clear()}>
          Clear cart
        </Button>
      </div>
    </>
  );
}
