"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, ImagePlus, Loader2, X } from "lucide-react";
import {
  checkPassword,
  checkSlug,
  isValidEmail,
  normalizePhMobile,
  SLUG_MESSAGES,
  slugify,
  suggestSlugs,
} from "@chowlane/lib";
import { tenants } from "@chowlane/mocks";
import { Button, ChowLaneLogo, Field, Input, Select, cn } from "@chowlane/ui";
import { CITIES, DEFAULT_BRAND } from "@/lib/presets";
import { ColorPicker } from "../color-picker";
import { PhonePreview } from "../phone-preview";
import { SignupDone } from "./signup-done";

export type SignupDraft = {
  ownerName: string;
  email: string;
  mobile: string;
  businessName: string;
  slug: string;
  slugEdited: boolean;
  color: string;
  city: string;
  radiusKm: number;
};

const STEPS = [
  "Your account",
  "Business name",
  "Your link",
  "Your brand",
  "Delivery area",
  "Review",
] as const;
const DRAFT_KEY = "chowlane-signup-draft";
const TAKEN = tenants.map((t) => t.slug);

type Errors = Partial<Record<keyof SignupDraft | "password", string>>;

function loadDraft(): Partial<SignupDraft> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") as Partial<SignupDraft>;
  } catch {
    return {};
  }
}

/** S-002 — 5-step Owner signup + review (LND-002, LND-003, F-01). Password and logo are never saved to storage. */
export function SignupWizard({
  initialName,
  initialColor,
}: {
  initialName: string;
  initialColor?: string;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  const [checking, setChecking] = useState(false);
  const [draft, setDraft] = useState<SignupDraft>({
    ownerName: "",
    email: "",
    mobile: "",
    businessName: initialName,
    slug: slugify(initialName),
    slugEdited: false,
    color: initialColor ?? DEFAULT_BRAND.color,
    city: CITIES[0]!.name,
    radiusKm: 5,
  });
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore a draft from this browser session (values from the landing page win).
  useEffect(() => {
    const saved = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage after mount
    setDraft((d) => ({
      ...d,
      ...saved,
      businessName: initialName || saved.businessName || d.businessName,
      slug: initialName ? slugify(initialName) : (saved.slug ?? d.slug),
      color: initialColor ?? saved.color ?? d.color,
    }));
  }, [initialName, initialColor]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage blocked — the form still works */
    }
  }, [draft]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = <K extends keyof SignupDraft>(key: K, value: SignupDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const slugProblem = useMemo(() => checkSlug(draft.slug, TAKEN), [draft.slug]);
  const suggestions = useMemo(
    () =>
      slugProblem === "TAKEN" || slugProblem === "RESERVED" ? suggestSlugs(draft.slug, TAKEN) : [],
    [slugProblem, draft.slug],
  );

  // Simulated availability check (Phase 2: Supabase query).
  useEffect(() => {
    if (step !== 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows a short "checking" state while typing
    setChecking(true);
    const t = window.setTimeout(() => setChecking(false), 350);
    return () => window.clearTimeout(t);
  }, [draft.slug, step]);

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (draft.ownerName.trim().length < 2) e.ownerName = "Enter your full name.";
      if (!isValidEmail(draft.email)) e.email = "Enter a valid email, like you@business.ph.";
      if (!normalizePhMobile(draft.mobile))
        e.mobile = "Enter a PH mobile number, like 0917 123 4567.";
      const pw = checkPassword(password);
      if (pw) e.password = pw;
    }
    if (s === 1 && draft.businessName.trim().length < 2)
      e.businessName = "Enter your business name.";
    if (s === 2 && slugProblem) e.slug = SLUG_MESSAGES[slugProblem];
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`su-${first}`)?.focus();
      return;
    }
    if (step === STEPS.length - 1) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
  }

  if (done) return <SignupDone draft={draft} logoUrl={logoUrl} />;

  const city = CITIES.find((c) => c.name === draft.city) ?? CITIES[0]!;
  const showPreview = step >= 1;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="ChowLane home">
          <ChowLaneLogo />
        </Link>
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-ink">
          Log in
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="font-medium text-ink">{STEPS[step]}</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label="Signup progress"
        >
          <div
            className="h-full rounded-full bg-chowlane transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 pt-8 pb-32 md:grid-cols-[1fr_auto] md:gap-16">
        <form
          className="flex max-w-md flex-col gap-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          id="signup-form"
        >
          {step === 0 ? (
            <StepIntro
              refEl={headingRef}
              title="Create your owner account"
              body="You'll use this to log in to your console. You can add admins later."
            />
          ) : null}
          {step === 0 ? (
            <>
              <Field label="Full name" htmlFor="su-ownerName" error={errors.ownerName}>
                <Input
                  id="su-ownerName"
                  autoComplete="name"
                  value={draft.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  aria-invalid={Boolean(errors.ownerName)}
                />
              </Field>
              <Field label="Email" htmlFor="su-email" error={errors.email}>
                <Input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
              <Field
                label="Mobile number"
                htmlFor="su-mobile"
                error={errors.mobile}
                hint="For account and order alerts."
              >
                <Input
                  id="su-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0917 123 4567"
                  value={draft.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                  aria-invalid={Boolean(errors.mobile)}
                />
              </Field>
              <Field
                label="Password"
                htmlFor="su-password"
                error={errors.password}
                hint="At least 8 characters, with a number."
              >
                <div className="relative">
                  <Input
                    id="su-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((x) => ({ ...x, password: undefined }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-ink"
                  >
                    {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <StepIntro
                refEl={headingRef}
                title="What's your business called?"
                body="This is the name customers see on your app and on their home screen."
              />
              <Field label="Business name" htmlFor="su-businessName" error={errors.businessName}>
                <Input
                  id="su-businessName"
                  maxLength={40}
                  value={draft.businessName}
                  placeholder={DEFAULT_BRAND.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      businessName: v,
                      slug: d.slugEdited ? d.slug : slugify(v),
                    }));
                    setErrors((x) => ({ ...x, businessName: undefined }));
                  }}
                  aria-invalid={Boolean(errors.businessName)}
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <StepIntro
                refEl={headingRef}
                title="Choose your link"
                body="Customers, riders and admins open your apps from this link. You can share it on Facebook."
              />
              <Field label="Business link" htmlFor="su-slug" error={errors.slug}>
                <div
                  className={cn(
                    "flex h-11 items-center rounded-control border bg-white focus-within:ring-3",
                    errors.slug
                      ? "border-danger focus-within:ring-danger/20"
                      : "border-input focus-within:border-zinc-400 focus-within:ring-ring/50",
                  )}
                >
                  <span className="pl-3 text-muted-foreground">chowlane.app/</span>
                  <input
                    id="su-slug"
                    value={draft.slug}
                    maxLength={30}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      setDraft((d) => ({ ...d, slug: v, slugEdited: true }));
                      setErrors((x) => ({ ...x, slug: undefined }));
                    }}
                    aria-invalid={Boolean(errors.slug)}
                    aria-describedby="su-slug-status"
                    className="h-full min-w-0 flex-1 rounded-r-[0.625rem] bg-transparent pr-3 text-base outline-none"
                  />
                </div>
              </Field>
              <p
                id="su-slug-status"
                aria-live="polite"
                className="-mt-2 flex items-center gap-1.5 text-sm"
              >
                {checking ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-muted-foreground" /> Checking…
                  </>
                ) : slugProblem ? (
                  <>
                    <X className="size-4 text-danger" />{" "}
                    <span className="text-danger">{SLUG_MESSAGES[slugProblem]}</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4 text-success" />{" "}
                    <span className="text-success">chowlane.app/{draft.slug} is available</span>
                  </>
                )}
              </p>
              {!checking && suggestions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("slug", s)}
                      className="rounded-full border px-3 py-1 hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepIntro
                refEl={headingRef}
                title="Make it look like you"
                body="Your color is used on buttons and headers in all your apps. You can change it any time."
              />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Logo (optional)</span>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="su-logo"
                    className="flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-white text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50 hover:border-zinc-400"
                  >
                    {logoUrl ? (
                      // Local blob preview — next/image can't optimise object URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Your logo" className="size-full object-cover" />
                    ) : (
                      <ImagePlus className="size-6" />
                    )}
                    <input
                      id="su-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setLogoUrl(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Square PNG or JPG works best.
                    {logoUrl ? (
                      <button
                        type="button"
                        className="ml-2 font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                        onClick={() => setLogoUrl(undefined)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Brand color</span>
                <ColorPicker value={draft.color} onChange={(c) => set("color", c)} idPrefix="su" />
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <StepIntro
                refEl={headingRef}
                title="Where do you deliver?"
                body="Pick your main city and how far your riders go. You'll fine-tune it on a map, and set delivery fees, in your console."
              />
              <Field label="City" htmlFor="su-city">
                <Select
                  id="su-city"
                  value={draft.city}
                  onChange={(e) => set("city", e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}, {c.province}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="su-radius"
                  className="flex items-baseline justify-between text-sm font-medium"
                >
                  Delivery radius{" "}
                  <span className="text-lg font-semibold tabular-nums">{draft.radiusKm} km</span>
                </label>
                <input
                  id="su-radius"
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={draft.radiusKm}
                  onChange={(e) => set("radiusKm", Number(e.target.value))}
                  className="accent-zinc-900"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 km</span>
                  <span>15 km</span>
                </div>
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <StepIntro
                refEl={headingRef}
                title="Check your details"
                body="You can change all of this later in your console."
              />
              <dl className="flex flex-col divide-y rounded-card border bg-white">
                <ReviewRow label="Owner" onEdit={() => setStep(0)}>
                  {draft.ownerName}
                  <span className="block font-normal text-muted-foreground">{draft.email}</span>
                </ReviewRow>
                <ReviewRow label="Business name" onEdit={() => setStep(1)}>
                  {draft.businessName}
                </ReviewRow>
                <ReviewRow label="Link" onEdit={() => setStep(2)}>
                  chowlane.app/{draft.slug}
                </ReviewRow>
                <ReviewRow label="Brand" onEdit={() => setStep(3)}>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded-full" style={{ background: draft.color }} />{" "}
                    {draft.color}
                  </span>
                  <span className="block font-normal text-muted-foreground">
                    {logoUrl ? "Logo added" : "No logo yet"}
                  </span>
                </ReviewRow>
                <ReviewRow label="Delivery area" onEdit={() => setStep(4)}>
                  {draft.radiusKm} km around {city.name}
                </ReviewRow>
              </dl>
              <p className="text-sm text-muted-foreground">
                By creating your business you agree to ChowLane&apos;s terms. You start on a free
                plan.
              </p>
            </>
          ) : null}
        </form>

        {showPreview ? (
          <aside
            className="flex justify-center md:sticky md:top-8 md:self-start"
            aria-label="Live preview"
          >
            <PhonePreview
              name={draft.businessName || DEFAULT_BRAND.name}
              color={draft.color}
              logoUrl={logoUrl}
              className="scale-90 md:scale-100"
            />
          </aside>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3 px-4 py-3">
          {step > 0 ? (
            <Button type="button" variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft /> Back
            </Button>
          ) : null}
          <Button
            type="submit"
            form="signup-form"
            size="lg"
            className="flex-1 md:flex-none md:px-10"
          >
            {step === STEPS.length - 1 ? "Create my business" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepIntro({
  title,
  body,
  refEl,
}: {
  title: string;
  body: string;
  refEl: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="mb-1">
      <h1 ref={refEl} tabIndex={-1} className="display text-2xl outline-none md:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
    </div>
  );
}

function ReviewRow({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium break-words">{children}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
      >
        Edit
      </button>
    </div>
  );
}
