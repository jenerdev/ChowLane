"use client";

import { useState } from "react";
import Link from "next/link";
import { findTenantBySlug } from "@chowlane/mocks";
import { appUrl } from "@chowlane/mocks/react";
import { Button, ChowLaneLogo, Field } from "@chowlane/ui";

/** Owners/admins sign in on their own console link. This page finds it from the business link. */
export default function FindConsole() {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <Link href="/" aria-label="ChowLane home">
        <ChowLaneLogo />
      </Link>
      <div>
        <h1 className="display text-2xl md:text-3xl">Log in to your console</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your business link. We&apos;ll take you to your console&apos;s log-in page.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = slug.trim().toLowerCase();
          if (!findTenantBySlug(clean)) {
            setError("No business uses this link. Check the spelling, or sign up.");
            return;
          }
          // Console is a separate app (another origin in Phase 1), so this is a full cross-app navigation.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`${appUrl("console")}/${clean}/login`);
        }}
      >
        <Field
          label="Business link"
          htmlFor="slug"
          error={error}
          hint="Demo businesses: fastbite, kainexpress"
        >
          <div className="flex h-11 items-center rounded-control border border-input bg-white focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-3 text-muted-foreground">chowlane.app/</span>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setError(undefined);
              }}
              autoCapitalize="none"
              autoCorrect="off"
              className="h-full min-w-0 flex-1 rounded-r-[0.625rem] bg-transparent pr-3 text-base outline-none"
              placeholder="your-business"
              aria-invalid={Boolean(error)}
            />
          </div>
        </Field>
        <Button type="submit" size="lg" className="">
          Continue
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        New to ChowLane?{" "}
        <Link
          href="/signup"
          className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          Start your business
        </Link>
      </p>
    </main>
  );
}
