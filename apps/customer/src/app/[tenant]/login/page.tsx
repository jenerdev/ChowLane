"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_LOYALTY } from "@chowlane/lib";
import { Avatar, Button, Sheet, SheetContent, TenantLogo, toast } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";
import { newId, useCustomer } from "@/lib/use-customer";

const NEW_NAMES = [
  "Joy Bautista",
  "Carlo Mendoza",
  "Ella Ramos",
  "Nico Garcia",
  "Bianca Torres",
  "Paolo Cruz",
];

/** S-300 — branded splash + "Continue with Facebook" (CUS-001). Prototype: pick a demo Facebook account. */
export default function CustomerLogin() {
  const router = useRouter();
  const { tenant, db, me, ready, signIn, base } = useCustomer();
  const insert = useMockStore((s) => s.insert);
  const [open, setOpen] = useState(false);
  const accounts = db.customers.filter((c) => c.tenantId === tenant.id);

  // Already logged in → continue.
  useEffect(() => {
    if (ready && me)
      router.replace(me.locationPermission === "GRANTED" ? base : `${base}/location`);
  }, [ready, me, router, base]);

  const go = (id: string, granted: boolean) => {
    signIn(id);
    setOpen(false);
    router.replace(granted ? base : `${base}/location`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-20 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <TenantLogo
          name={tenant.businessName}
          logoUrl={tenant.logoUrl}
          className="inline-flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-brand-foreground"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{tenant.businessName}</h1>
        <p className="max-w-xs text-muted-foreground">
          Food from your favorite local spots, delivered. Pay cash when it arrives.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
          onClick={() => setOpen(true)}
        >
          Continue with Facebook
        </Button>
        <p className="text-center text-[13px] text-muted-foreground">
          We use your Facebook name and photo. Next, we&apos;ll ask for your location so riders can
          find you.
        </p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title="Choose a Facebook account"
          description="Prototype: no real Facebook login yet."
        >
          <ul className="-mx-2 flex max-h-[50dvh] flex-col overflow-y-auto">
            {accounts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => go(c.id, c.locationPermission === "GRANTED")}
                  className="flex w-full items-center gap-3 rounded-control px-2 py-2.5 text-left hover:bg-muted"
                >
                  <Avatar name={c.name} size="sm" />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {c.verificationStatus.toLowerCase()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            onClick={() => {
              const id = newId("c");
              const name = NEW_NAMES[accounts.length % NEW_NAMES.length]!;
              insert("customers", {
                id,
                tenantId: tenant.id,
                facebookId: `fb_${id}`,
                name,
                avatarUrl: "",
                verificationStatus: "UNVERIFIED",
                verificationHistory: [],
                locationPermission: "UNKNOWN",
                addresses: [],
                loyalty: EMPTY_LOYALTY,
                createdAt: new Date().toISOString(),
              });
              toast(`Welcome, ${name.split(" ")[0]}!`);
              go(id, false);
            }}
          >
            Someone new
          </Button>
        </SheetContent>
      </Sheet>
    </main>
  );
}
