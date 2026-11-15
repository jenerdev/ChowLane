"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { findTenantBySlug } from "@chowlane/mocks";
import { useSession } from "@chowlane/mocks/react";
import { Button, Field, Input, TenantLogo } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/**
 * S-100 Owner / Admin login (LND-004). Phase 1 mock: email must belong to an active staff member of this
 * tenant; any password is accepted. Phase 2: Supabase Auth.
 */
export default function ConsoleLogin({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = use(params);
  const tenant = findTenantBySlug(slug)!;
  const router = useRouter();
  const { signIn } = useSession(`console:${slug}`);
  const staff = useMockStore((s) => s.staff).filter((x) => x.tenantId === tenant.id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ field: "email" | "password"; message: string }>();

  function submit() {
    const user = staff.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!email.trim()) return setError({ field: "email", message: "Enter your email." });
    if (!password) return setError({ field: "password", message: "Enter your password." });
    if (!user)
      return setError({
        field: "email",
        message: `No ${tenant.businessName} account uses this email.`,
      });
    if (user.status === "INVITED")
      return setError({ field: "email", message: "Accept the invite sent to your email first." });
    if (user.status === "INACTIVE")
      return setError({
        field: "email",
        message: "This account is turned off. Ask the business owner.",
      });
    signIn(user.id);
    router.replace(`/${slug}`);
  }

  const demo = staff.filter((s) => s.status === "ACTIVE");

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
          submit();
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
        <Button type="submit" size="lg">
          Log in
        </Button>
        <p className="text-sm text-muted-foreground">
          Forgot your password? Ask the business owner to reset it.
        </p>
      </form>

      {demo.length > 0 ? (
        <div className="rounded-2xl border border-dashed p-4 text-sm">
          <p className="font-medium">Demo accounts (any password)</p>
          <ul className="mt-2 flex flex-col gap-1">
            {demo.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="text-left text-brand underline-offset-4 hover:underline"
                  onClick={() => {
                    setEmail(s.email);
                    setPassword("demo-1234");
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
