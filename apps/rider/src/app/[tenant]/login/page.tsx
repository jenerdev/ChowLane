"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { findTenantBySlug } from "@chowlane/mocks";
import { useSession } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { formatPhMobile, normalizePhMobile } from "@chowlane/lib";
import { Button, Field, Input, TenantLogo } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/**
 * S-200 — rider login (RID-001): mobile number + one-time code. Phase 1 mock: any 6 digits.
 * Only ACTIVE riders of this tenant can log in. Phase 2: Supabase phone OTP.
 */
export default function RiderLogin({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = use(params);
  const tenant = findTenantBySlug(slug)!;
  const router = useRouter();
  const { signIn } = useSession(`rider:${slug}`);
  const riders = useMockStore((s) => s.riders).filter((r) => r.tenantId === tenant.id);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  const sendCode = () => {
    const e164 = normalizePhMobile(phone);
    if (!e164) return setError("Enter a PH mobile number, like 0917 123 4567.");
    const rider = riders.find((r) => r.phone === e164);
    if (!rider)
      return setError(
        `No ${tenant.businessName} rider uses this number. Ask your admin to add you.`,
      );
    if (rider.status !== "ACTIVE")
      return setError("Your rider account is turned off. Ask your admin.");
    setError(undefined);
    setStep("code");
  };

  const verify = () => {
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    const rider = riders.find((r) => r.phone === normalizePhMobile(phone));
    if (!rider) return;
    signIn(rider.id);
    router.replace(`/${slug}`);
  };

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
            {step === "phone"
              ? "Log in with the mobile number your admin registered."
              : `We sent a code to ${formatPhMobile(normalizePhMobile(phone)!)}.`}
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "phone") sendCode();
          else verify();
        }}
      >
        {step === "phone" ? (
          <Field label="Mobile number" htmlFor="rl-phone" error={error}>
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
              aria-invalid={Boolean(error)}
            />
          </Field>
        ) : (
          <Field
            label="6-digit code"
            htmlFor="rl-code"
            error={error}
            hint="Prototype: any 6 digits work."
          >
            <Input
              id="rl-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError(undefined);
              }}
              className="tracking-[0.4em]"
              aria-invalid={Boolean(error)}
              autoFocus
            />
          </Field>
        )}
        <Button type="submit" size="lg">
          {step === "phone" ? "Send code" : "Log in"}
        </Button>
        {step === "code" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => (setStep("phone"), setCode(""), setError(undefined))}
          >
            Use another number
          </Button>
        ) : null}
      </form>

      {step === "phone" && riders.length > 0 ? (
        <div className="rounded-card border border-dashed p-4 text-sm">
          <p className="font-medium">Demo riders</p>
          <ul className="mt-2 flex flex-col gap-1">
            {riders.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="text-left underline decoration-border underline-offset-4 hover:decoration-foreground"
                  onClick={() => (setPhone(formatPhMobile(r.phone)), setError(undefined))}
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
