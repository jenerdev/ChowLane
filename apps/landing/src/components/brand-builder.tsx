"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants, cn } from "@chowlane/ui";
import { DEFAULT_BRAND } from "@/lib/presets";
import { ColorPicker } from "./color-picker";
import { PhonePreview } from "./phone-preview";

/** Hero: type your business name, pick a color, watch your app re-brand. Carries both into signup. */
export function BrandBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_BRAND.color);
  const shown = name.trim() || DEFAULT_BRAND.name;
  const href = `/signup?${new URLSearchParams({ name: name.trim(), color }).toString()}`;

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-16">
      <div className="flex max-w-xl flex-col gap-6">
        <h1 className="display text-[2.5rem] sm:text-6xl">
          Your own food delivery app, under your own name.
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          ChowLane gives you a branded ordering app for your customers, a rider app for your team,
          and one console to run it. Customers order from your business, not from a marketplace.
        </p>
        <form
          className="flex flex-col gap-5 border-t pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hero-name" className="text-sm font-medium">
              Try it with your business name
            </label>
            <input
              id="hero-name"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder={DEFAULT_BRAND.name}
              className="h-12 rounded-control border border-input bg-white px-4 text-base outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Pick your color</span>
            <ColorPicker value={color} onChange={setColor} idPrefix="hero" />
          </div>
          <Link href={href} className={cn(buttonVariants({ size: "lg" }), "self-start")}>
            Start {name.trim() ? `“${name.trim()}”` : "your business"} for free
          </Link>
        </form>
      </div>
      <div className="flex justify-center">
        <PhonePreview name={shown} color={color} />
      </div>
    </div>
  );
}
