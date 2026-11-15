import { ArrowRight, Bike, Palette, ShieldCheck } from "lucide-react";
import { Button, ChowLaneLogo } from "@chowlane/ui";
import { DevToolbar } from "@chowlane/mocks/react";

/** Placeholder — the real landing page + Owner signup is Milestone 1.2 (S-001, S-002). */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-10">
      <ChowLaneLogo tagline />
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl leading-tight font-extrabold tracking-tight">
          Launch your own <span className="text-chowlane">food delivery</span> business.
        </h1>
        <p className="text-muted-foreground">
          Your brand, your riders, your merchants — no coding needed.
        </p>
        <Button size="lg" disabled>
          Start your delivery business <ArrowRight />
        </Button>
        <p className="text-xs text-muted-foreground">
          Landing page & signup arrive in Milestone 1.2.
        </p>
      </section>
      <ul className="flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <Palette className="size-5 text-chowlane" /> Your own branded customer & rider apps
        </li>
        <li className="flex gap-3">
          <Bike className="size-5 text-chowlane" /> Add riders, set pay & delivery fees
        </li>
        <li className="flex gap-3">
          <ShieldCheck className="size-5 text-chowlane" /> Verified customers, cash on delivery
        </li>
      </ul>
      <DevToolbar app="landing" />
    </main>
  );
}
