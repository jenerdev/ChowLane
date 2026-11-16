"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { customers as mockCustomers, findTenantBySlug, forTenant } from "@chowlane/mocks";
import { isLocalSupabase, supabaseEnv } from "@chowlane/db";
import { Avatar, Button, Sheet, SheetContent, TenantLogo, toast } from "@chowlane/ui";
import { useCustomer } from "@/lib/use-customer";

/** Local demo logins (seed.sql, D-058/D-060): customers sign in as <facebookId>@demo.chowlane.local. */
const DEMO_PASSWORD = "demo1234";
const NEW_NAMES = ["Joy Bautista", "Carlo Mendoza", "Ella Ramos", "Nico Garcia", "Bianca Torres"];

/**
 * S-300 — branded splash + "Continue with Facebook" (CUS-001). Hosted Supabase: real Facebook login (OAuth →
 * /auth/callback). Local Supabase: pick a seeded demo customer or create a new one (D-060).
 */
export default function CustomerLogin() {
  const router = useRouter();
  const { tenant, me, ready, base, supabase, refresh } = useCustomer();
  const slug = tenant?.slug ?? base.slice(1);
  const local = isLocalSupabase(supabaseEnv().url);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mockTenant = findTenantBySlug(slug);
  const demo = mockTenant ? forTenant(mockCustomers, mockTenant.id) : [];

  // Already logged in → continue.
  useEffect(() => {
    if (ready && me)
      router.replace(me.locationPermission === "GRANTED" ? base : `${base}/location`);
  }, [ready, me, router, base]);

  async function facebook() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: `${window.location.origin}${base}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      toast(`Facebook login didn't start: ${error.message}`, "error");
    }
  }

  async function demoLogin(email: string, name?: string) {
    setBusy(true);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error && name) {
        // a new local demo customer: create the login (local Supabase confirms emails automatically)
        ({ error } = await supabase.auth.signUp({
          email,
          password: DEMO_PASSWORD,
          options: { data: { full_name: name } },
        }));
      }
      if (error) return void toast(error.message, "error");
      await refresh();
      setOpen(false);
      if (name) toast(`Welcome, ${name.split(" ")[0]}!`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-20 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <TenantLogo
          name={tenant?.businessName ?? ""}
          logoUrl={tenant?.logoUrl ?? ""}
          className="inline-flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-brand-foreground"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{tenant?.businessName}</h1>
        <p className="max-w-xs text-muted-foreground">
          Food from your favorite local spots, delivered. Pay cash when it arrives.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
          disabled={busy}
          onClick={() => (local ? setOpen(true) : void facebook())}
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
          title="Choose a demo account"
          description="Local Supabase: Facebook login works on the hosted project. These are demo customers."
        >
          <ul className="-mx-2 flex max-h-[50dvh] flex-col overflow-y-auto">
            {demo.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void demoLogin(`${c.facebookId}@demo.chowlane.local`)}
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
            disabled={busy}
            onClick={() => {
              const name = NEW_NAMES[Math.floor(Math.random() * NEW_NAMES.length)]!;
              const tag = Math.random().toString(36).slice(2, 8);
              void demoLogin(`new-${tag}@demo.chowlane.local`, name);
            }}
          >
            Someone new
          </Button>
        </SheetContent>
      </Sheet>
    </main>
  );
}
