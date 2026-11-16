"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailWarning } from "lucide-react";
import { checkPassword } from "@chowlane/lib";
import { Button, EmptyState, Field, Input, TenantLogo } from "@chowlane/ui";
import { useConsoleIdentity } from "@/lib/identity";

type Stage = "checking" | "no-link" | "set-password" | "invalid";

/**
 * Invite link landing (BL-2.6): the Supabase invite email signs the admin in (tokens in the URL fragment), they
 * choose a password, and their INVITED row becomes ACTIVE (accept_staff_invite, run by the identity provider).
 */
export default function AcceptInvite() {
  const { tenant, supabase, refresh, user, ready, identity } = useConsoleIdentity();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [problem, setProblem] = useState<string>();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // The URL fragment, read once (the effect below can run twice in dev StrictMode; the tokens must survive).
  const link = useRef<URLSearchParams | null>(null);

  // The PKCE client ignores invite tokens in the fragment, so read them here and start the session.
  useEffect(() => {
    if (!link.current) {
      link.current = new URLSearchParams(window.location.hash.slice(1));
      window.history.replaceState(null, "", window.location.pathname); // don't leave tokens in the address bar
    }
    const hash = link.current;
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const linkError = hash.get("error_description");
    const t = setTimeout(async () => {
      if (linkError) {
        setProblem(linkError.replaceAll("+", " "));
        return setStage("invalid");
      }
      if (!accessToken || !refreshToken) return setStage("no-link");
      const { error: e } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (e) {
        setProblem(e.message);
        setStage("invalid");
      } else {
        await refresh(); // the invited login replaced any earlier session in this browser
        setStage("set-password");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [supabase, refresh]);

  // Opened without tokens: already a member → console; signed in from the invite → set password; else used link.
  useEffect(() => {
    if (stage !== "no-link" || !ready) return;
    const t = setTimeout(() => {
      if (identity?.staff.status === "ACTIVE") router.replace(`/${tenant.slug}`);
      else if (user) setStage("set-password");
      else {
        setProblem("This invite link was already used or has expired.");
        setStage("invalid");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [stage, ready, user, identity, router, tenant.slug]);

  async function submit() {
    const p = checkPassword(password);
    if (p) return setError(p);
    setBusy(true);
    try {
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e) return setError(e.message);
      const me = await refresh();
      if (!me || me.staff.status !== "ACTIVE")
        return setError(
          `This login isn't invited to ${tenant.businessName}. Ask the owner to invite you again.`,
        );
      router.replace(`/${tenant.slug}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-start gap-4">
        <TenantLogo
          name={tenant.businessName}
          logoUrl={tenant.logoUrl}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand text-xl font-semibold text-brand-foreground"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Join {tenant.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.email ? `${user.email} · ` : ""}Choose a password for the admin console.
          </p>
        </div>
      </div>

      {stage === "invalid" ? (
        <EmptyState
          icon={<MailWarning />}
          title="This invite can't be used"
          description={`${problem ?? ""} Ask the owner to resend your invite, or log in if you already set a password.`}
          action={
            <Button variant="outline" onClick={() => router.replace(`/${tenant.slug}/login`)}>
              Go to log in
            </Button>
          }
        />
      ) : stage === "checking" || stage === "no-link" ? null : (
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label="New password" htmlFor="invite-password" error={error}>
            <div className="relative">
              <Input
                id="invite-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(undefined);
                }}
                aria-invalid={Boolean(error)}
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
          <p className="-mt-2 text-[13px] text-muted-foreground">
            At least 8 characters, with letters and a number.
          </p>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Saving…" : "Set password and continue"}
          </Button>
        </form>
      )}
    </main>
  );
}
