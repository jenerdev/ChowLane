"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { formatPhMobile, normalizePhMobile } from "@chowlane/lib";
import {
  Avatar,
  Button,
  Field,
  Input,
  Sheet,
  SheetContent,
  VerificationBadge,
  toast,
} from "@chowlane/ui";
import { useCurrentLocation } from "@/lib/location";
import { useMockStore } from "@/lib/store";
import { newId, useCustomer } from "@/lib/use-customer";

/** S-309 — profile: Facebook name/photo, phone, addresses, ID status, log out (CUS-010, CUS-012). */
export default function ProfilePage() {
  const router = useRouter();
  const { me, base, slug, signOut, settings } = useCustomer();
  const patch = useMockStore((s) => s.patch);
  const here = useCurrentLocation(slug);
  const [phone, setPhone] = useState(me?.phone ? formatPhMobile(me.phone) : "");
  const [phoneError, setPhoneError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [addr, setAddr] = useState({
    label: "Home",
    line1: "",
    barangay: "",
    cityMunicipality: "",
  });
  if (!me) return null;

  const v = me.verification;

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={me.name} src={me.avatarUrl || undefined} size="lg" />
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{me.name}</h1>
          <p className="text-[13px] text-muted-foreground">Logged in with Facebook</p>
        </div>
      </div>

      <section className="flex flex-col gap-3 border-t py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">ID verification</h2>
          <VerificationBadge status={me.verificationStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          {me.verificationStatus === "VERIFIED"
            ? `Verified with your ${v ? ID_TYPE_LABELS[v.idType] : "ID"}.`
            : me.verificationStatus === "PENDING"
              ? "We're checking your ID. We'll confirm your order right after."
              : me.verificationStatus === "REJECTED"
                ? `Your ID wasn't accepted${v?.rejectReason ? `: ${v.rejectReason}` : ""}. Send a new one to order again.`
                : "We'll ask for a valid ID and a selfie on your first order."}
        </p>
        {me.verificationStatus === "REJECTED" ? (
          <Button asChild className="self-start">
            <Link href={`${base}/checkout/verify-id?resubmit=1`}>Upload new ID</Link>
          </Button>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 border-t py-6">
        <h2 className="text-[15px] font-semibold">Mobile number</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = normalizePhMobile(phone);
            if (!n) return setPhoneError("Enter a PH mobile number, like 0917 123 4567.");
            patch("customers", me.id, { phone: n });
            setPhone(formatPhMobile(n));
            setPhoneError(undefined);
            toast("Number saved");
          }}
        >
          <div className="flex-1">
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => (setPhone(e.target.value), setPhoneError(undefined))}
              placeholder="0917 123 4567"
              aria-label="Mobile number"
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError ? (
              <p className="mt-1 text-[13px] text-danger">{phoneError}</p>
            ) : (
              <p className="mt-1 text-[13px] text-muted-foreground">
                Riders call this number when they arrive.
              </p>
            )}
          </div>
          <Button type="submit" variant="outline">
            Save
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3 border-t py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Saved addresses</h2>
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add
          </Button>
        </div>
        {me.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
        ) : (
          <ul className="divide-y">
            {me.addresses.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{a.label}</span>
                  <span className="block truncate text-muted-foreground">
                    {a.line1}, {a.barangay}, {a.cityMunicipality}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${a.label}`}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() =>
                    patch("customers", me.id, {
                      addresses: me.addresses.filter((x) => x.id !== a.id),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t py-6">
        <Button
          variant="outline"
          block
          onClick={() => {
            signOut();
            router.replace(`${base}/login`);
          }}
        >
          Log out
        </Button>
      </section>

      <Sheet open={adding} onOpenChange={setAdding}>
        <SheetContent title="Add an address" description="Saved at your current location.">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!addr.line1.trim() || !addr.barangay.trim() || !addr.cityMunicipality.trim())
                return;
              patch("customers", me.id, {
                addresses: [
                  ...me.addresses,
                  {
                    id: newId("a"),
                    label: addr.label.trim() || "Home",
                    line1: addr.line1.trim(),
                    barangay: addr.barangay.trim(),
                    cityMunicipality: addr.cityMunicipality.trim(),
                    province: "",
                    location: here ?? settings.serviceArea.center,
                  },
                ],
              });
              toast("Address saved");
              setAdding(false);
              setAddr({ label: "Home", line1: "", barangay: "", cityMunicipality: "" });
            }}
          >
            <Field label="Label" htmlFor="ad-label" hint="E.g. Home, Office">
              <Input
                id="ad-label"
                value={addr.label}
                onChange={(e) => setAddr({ ...addr, label: e.target.value })}
              />
            </Field>
            <Field label="House / unit, street" htmlFor="ad-line">
              <Input
                id="ad-line"
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Barangay" htmlFor="ad-brgy">
                <Input
                  id="ad-brgy"
                  value={addr.barangay}
                  onChange={(e) => setAddr({ ...addr, barangay: e.target.value })}
                />
              </Field>
              <Field label="City" htmlFor="ad-city">
                <Input
                  id="ad-city"
                  value={addr.cityMunicipality}
                  onChange={(e) => setAddr({ ...addr, cityMunicipality: e.target.value })}
                />
              </Field>
            </div>
            <Button
              type="submit"
              disabled={
                !addr.line1.trim() || !addr.barangay.trim() || !addr.cityMunicipality.trim()
              }
            >
              Save address
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
