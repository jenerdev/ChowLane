"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { platformAdmins } from "@chowlane/mocks";
import { isLocalSupabase, supabaseEnv } from "@chowlane/db";
import { Button, ChowLaneLogo, Field, Input } from "@chowlane/ui";
import { usePlatformIdentity } from "@/lib/identity";

/** Local demo logins (seed.sql) — shown only against the local Supabase (D-058). */
const DEMO_PASSWORD = "demo1234";

/** S-500 — Platform Admin login (PLT-001): Supabase email + password; only ACTIVE platform admins get in. */
export default function PlatformLogin() {
  const router = useRouter();
  const { supabase, refresh, signOut } = usePlatformIdentity();
  const admins = isLocalSupabase(supabaseEnv().url) ? platformAdmins : [];
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
      if (!me || me.admin.status !== "ACTIVE") {
        await signOut();
        return setError({
          field: "email",
          message: !me
            ? "No ChowLane admin account uses this email."
            : "This account is turned off.",
        });
      }
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-col gap-4">
        <ChowLaneLogo />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage every business on ChowLane.</p>
        </div>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field
          label="Email"
          htmlFor="pl-email"
          error={error?.field === "email" ? error.message : undefined}
        >
          <Input
            id="pl-email"
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
          htmlFor="pl-password"
          error={error?.field === "password" ? error.message : undefined}
        >
          <div className="relative">
            <Input
              id="pl-password"
              type={show ? "text" : "password"}
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
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
      {admins.length > 0 ? (
        <div className="rounded-card border border-dashed p-4 text-sm">
          <p className="font-medium">Local demo account (password {DEMO_PASSWORD})</p>
          <ul className="mt-2 flex flex-col gap-1">
            {admins.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="text-left underline decoration-border underline-offset-4 hover:decoration-foreground"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                    setError(undefined);
                  }}
                >
                  {a.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
