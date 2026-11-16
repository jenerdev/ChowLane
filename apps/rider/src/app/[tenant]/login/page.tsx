"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { findTenantBySlug, forTenant, riders as mockRiders } from "@chowlane/mocks";
import { isLocalSupabase, riderLoginEmail, supabaseEnv } from "@chowlane/db";
import { tenantAppName } from "@chowlane/pwa";
import { formatPhMobile, normalizePhMobile } from "@chowlane/lib";
import { Button, Field, Input, TenantLogo } from "@chowlane/ui";
import { useRiderIdentity } from "@/lib/identity";

/** Local demo logins (seed.sql) — shown only against the local Supabase (D-058). */
const DEMO_PASSWORD = "demo1234";

/**
 * S-200 — rider login (RID-001): mobile number + the password the admin set (Q-30, no SMS in the MVP). Only
 * ACTIVE riders of this business get in. The login email behind the number is derived (D-062).
 */
export default function RiderLogin() {
  const { tenant, supabase, refresh, signOut } = useRiderIdentity();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ field: "phone" | "password"; message: string }>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    const e164 = normalizePhMobile(phone);
    if (!e164)
      return setError({ field: "phone", message: "Enter a PH mobile number, like 0917 123 4567." });
    if (!password) return setError({ field: "password", message: "Enter your password." });
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: riderLoginEmail(tenant.slug, e164),
        password,
      });
      if (authError)
        return setError({
          field: "password",
          message: "Wrong number or password. Your admin can reset your password.",
        });
      const me = await refresh();
      if (!me || me.rider.status !== "ACTIVE") {
        await signOut();
        return setError({
          field: "phone",
          message: !me
            ? `No ${tenant.businessName} rider uses this number. Ask your admin to add you.`
            : "Your rider account is turned off. Ask your admin.",
        });
      }
      router.replace(`/${tenant.slug}`);
    } finally {
      setBusy(false);
    }
  }

  const mockTenant = findTenantBySlug(tenant.slug);
  const demo =
    mockTenant && isLocalSupabase(supabaseEnv().url) ? forTenant(mockRiders, mockTenant.id) : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-start gap-4">
        <TenantLogo
          name={tenant.businessName}
          logoUrl={tenant.logoUrl}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand text-xl font-semibold text-brand-foreground"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenantAppName("rider", tenant.businessName)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in with the mobile number and password from your admin.
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field
          label="Mobile number"
          htmlFor="rl-phone"
          error={error?.field === "phone" ? error.message : undefined}
        >
          <Input
            id="rl-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0917 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error?.field === "phone"}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="rl-password"
          error={error?.field === "password" ? error.message : undefined}
        >
          <div className="relative">
            <Input
              id="rl-password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(undefined);
              }}
              aria-invalid={error?.field === "password"}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Forgot your password? Ask your admin to set a new one.
        </p>
      </form>

      {demo.length > 0 ? (
        <div className="rounded-card border border-dashed p-4 text-sm">
          <p className="font-medium">Local demo riders (password {DEMO_PASSWORD})</p>
          <ul className="mt-2 flex flex-col gap-1">
            {demo.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="text-left underline decoration-border underline-offset-4 hover:decoration-foreground"
                  onClick={() => {
                    setPhone(formatPhMobile(r.phone));
                    setPassword(DEMO_PASSWORD);
                    setError(undefined);
                  }}
                >
                  {formatPhMobile(r.phone)}
                </button>
                <span className="text-muted-foreground">
                  {" "}
                  — {r.name}
                  {r.status === "INACTIVE" ? " (turned off)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
