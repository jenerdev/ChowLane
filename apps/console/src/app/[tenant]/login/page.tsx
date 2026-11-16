"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { findTenantBySlug, forTenant, staff as mockStaff } from "@chowlane/mocks";
import { isLocalSupabase, supabaseEnv } from "@chowlane/db";
import { Button, Field, Input, TenantLogo } from "@chowlane/ui";
import { useConsoleIdentity } from "@/lib/identity";

/** Local demo logins (seed.sql) — shown only against the local Supabase (D-058). */
const DEMO_PASSWORD = "demo1234";

/**
 * S-100 Owner / Admin login (LND-004): Supabase email + password. Only ACTIVE staff of this business get in;
 * an invited admin is linked to their invite on first login (BL-2.6, BL-15.5).
 */
export default function ConsoleLogin() {
  const { tenant, supabase, refresh, signOut } = useConsoleIdentity();
  const slug = tenant.slug;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ field: "email" | "password"; message: string }>();

  async function submit() {
    if (!email.trim()) return setError({ field: "email", message: "Enter your email." });
    if (!password) return setError({ field: "password", message: "Enter your password." });
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) return setError({ field: "password", message: "Wrong email or password." });
      const me = await refresh();
      if (!me || me.staff.status !== "ACTIVE") {
        await signOut();
        return setError({
          field: "email",
          message: !me
            ? `No ${tenant.businessName} account uses this email.`
            : "This account is turned off. Ask the business owner.",
        });
      }
      router.replace(`/${slug}`);
    } finally {
      setBusy(false);
    }
  }

  const mockTenant = findTenantBySlug(slug);
  const demo =
    mockTenant && isLocalSupabase(supabaseEnv().url)
      ? forTenant(mockStaff, mockTenant.id).filter((s) => s.status === "ACTIVE")
      : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-start gap-4">
        <TenantLogo
          name={tenant.businessName}
          logoUrl={tenant.logoUrl}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand text-xl font-semibold text-brand-foreground"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Log in to {tenant.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin console for owners and admins.</p>
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
          label="Email"
          htmlFor="login-email"
          error={error?.field === "email" ? error.message : undefined}
        >
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error?.field === "email"}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="login-password"
          error={error?.field === "password" ? error.message : undefined}
        >
          <div className="relative">
            <Input
              id="login-password"
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
          Forgot your password? Ask the business owner to reset it.
        </p>
      </form>

      {demo.length > 0 ? (
        <div className="rounded-2xl border border-dashed p-4 text-sm">
          <p className="font-medium">Local demo accounts (password {DEMO_PASSWORD})</p>
          <ul className="mt-2 flex flex-col gap-1">
            {demo.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="text-left text-brand underline-offset-4 hover:underline"
                  onClick={() => {
                    setEmail(s.email);
                    setPassword(DEMO_PASSWORD);
                    setError(undefined);
                  }}
                >
                  {s.email}
                </button>
                <span className="text-muted-foreground">
                  {" "}
                  — {s.type === "OWNER" ? "Owner" : "Admin"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
