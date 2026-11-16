"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { formatPhMobile } from "@chowlane/lib";
import { Avatar, Button, Card, CardContent, PageHeader, toast } from "@chowlane/ui";
import { payRuleLabel, useRider } from "@/lib/use-rider";

const VEHICLE = { BICYCLE: "Bicycle", MOTORCYCLE: "Motorcycle", CAR: "Car" } as const;

/** S-206 — rider profile (read-only; admins edit it in the console) + log out (RID-009). */
export default function RiderProfile() {
  const router = useRouter();
  const { me, rule, session, base, tenant } = useRider();
  if (!me) return null;
  const rows: [string, string][] = [
    ["Mobile", formatPhMobile(me.phone)],
    ...(me.email ? ([["Email", me.email]] as [string, string][]) : []),
    ["Vehicle", VEHICLE[me.vehicleType]],
    ...(me.plateNumber ? ([["Plate", me.plateNumber]] as [string, string][]) : []),
    ["Pay", `${payRuleLabel(rule)}${me.payOverride ? " (your own rate)" : ""}`],
  ];
  return (
    <>
      <PageHeader title="Profile" />
      <div className="mb-6 flex items-center gap-3">
        <Avatar name={me.name} src={me.photoUrl || undefined} size="lg" />
        <div>
          <p className="text-[15px] font-semibold">{me.name}</p>
          <p className="text-sm text-muted-foreground">{tenant.businessName} rider</p>
        </div>
      </div>
      <Card className="mb-6">
        <CardContent className="pt-2 pb-2">
          <dl className="divide-y text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <p className="mb-6 text-[13px] text-muted-foreground">
        To change your details or vehicle, ask your admin.
      </p>
      <Button
        variant="outline"
        size="lg"
        block
        onClick={async () => {
          if (me.isOnShift) return void toast("Time out before logging out.", "error");
          await session.signOut();
          router.replace(`${base}/login`);
        }}
      >
        <LogOut /> Log out
      </Button>
    </>
  );
}
