"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, MapPinOff } from "lucide-react";
import { Button } from "@chowlane/ui";
import { requestPosition, saveCurrentLocation } from "@/lib/location";
import { useMockStore } from "@/lib/store";
import { useCustomer } from "@/lib/use-customer";

type State = "ask" | "asking" | "denied" | "unavailable";

/** S-301 — customers can only order with location allowed (CUS-002, BL-3.2). */
export default function LocationGate() {
  const router = useRouter();
  const { me, ready, base, slug, settings } = useCustomer();
  const patch = useMockStore((s) => s.patch);
  const [state, setState] = useState<State>("ask");

  useEffect(() => {
    if (ready && !me) router.replace(`${base}/login`);
  }, [ready, me, router, base]);

  const done = (p: { lat: number; lng: number }) => {
    saveCurrentLocation(slug, p);
    if (me) patch("customers", me.id, { locationPermission: "GRANTED" });
    router.replace(base);
  };

  async function ask() {
    setState("asking");
    try {
      done(await requestPosition());
    } catch (e) {
      const denied =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as GeolocationPositionError).code === 1;
      if (denied && me) patch("customers", me.id, { locationPermission: "DENIED" });
      setState(denied ? "denied" : "unavailable");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-20 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          {state === "denied" ? <MapPinOff className="size-7" /> : <MapPin className="size-7" />}
        </span>
        {state === "denied" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Location is blocked</h1>
            <p className="text-muted-foreground">
              You need to allow location to order. Turn it on, then try again:
            </p>
            <ul className="w-full rounded-card border p-4 text-left text-sm">
              <li className="py-1">
                <span className="font-medium">Android (Chrome):</span> tap the icon left of the
                address bar → Permissions → Location → Allow.
              </li>
              <li className="py-1">
                <span className="font-medium">iPhone:</span> Settings → Privacy &amp; Security →
                Location Services → Safari Websites → While Using.
              </li>
              <li className="py-1">
                <span className="font-medium">Installed app:</span> open your phone&apos;s Settings
                → Apps → this app → Location.
              </li>
            </ul>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Allow your location</h1>
            <p className="text-muted-foreground">
              We use it to deliver to the right place and to show your rider where you are. You
              can&apos;t order without it.
            </p>
          </>
        )}
        {state === "unavailable" ? (
          <p className="text-sm text-danger">
            We couldn&apos;t get your location. Check that location is on and try again.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={ask} disabled={state === "asking"}>
          {state === "asking"
            ? "Getting your location…"
            : state === "ask"
              ? "Allow location"
              : "Try again"}
        </Button>
        {state === "denied" || state === "unavailable" ? (
          <Button
            variant="ghost"
            onClick={() => done(me?.addresses[0]?.location ?? settings.serviceArea.center)}
          >
            Prototype: use a sample location
          </Button>
        ) : null}
      </div>
    </main>
  );
}
