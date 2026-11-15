"use client";

import { Bike, Coins, Share2, Store } from "lucide-react";
import { appUrl } from "@chowlane/mocks/react";
import { buttonVariants, ChowLaneLogo } from "@chowlane/ui";
import { PhonePreview } from "../phone-preview";
import type { SignupDraft } from "./signup-wizard";

const NEXT = [
  { icon: Store, text: "Add your first restaurant and its menu" },
  { icon: Bike, text: "Invite your first rider" },
  { icon: Coins, text: "Set your delivery fee and rider pay" },
  { icon: Share2, text: "Share your link on your Facebook page" },
];

/** After "Create my business" — what happens next (ONB checklist lives in the console, OWN-001). */
export function SignupDone({ draft, logoUrl }: { draft: SignupDraft; logoUrl?: string }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-[1fr_auto] md:gap-16">
      <div className="flex max-w-md flex-col gap-6">
        <ChowLaneLogo />
        <div>
          <h1 className="display text-3xl md:text-4xl">{draft.businessName} is ready</h1>
          <p className="mt-3 text-muted-foreground">
            Your apps live at{" "}
            <span className="font-semibold text-ink">chowlane.app/{draft.slug}</span>. Next, set up
            your console — it walks you through these:
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {NEXT.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <a href={`${appUrl("console")}/fastbite/login`} className={buttonVariants({ size: "lg" })}>
          Open my console
        </a>
        <p className="text-xs text-muted-foreground">
          Prototype: nothing is saved yet, so the console opens with the FastBite demo business.
        </p>
      </div>
      <div className="flex justify-center">
        <PhonePreview name={draft.businessName} color={draft.color} logoUrl={logoUrl} />
      </div>
    </main>
  );
}
