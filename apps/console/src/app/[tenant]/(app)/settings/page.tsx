"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PermissionKey } from "@chowlane/types";
import { Settings } from "lucide-react";
import { EmptyState, PageHeader } from "@chowlane/ui";
import { useSettings } from "@/lib/settings";
import { useConsole } from "@/lib/use-console";

type Entry = { href: string; title: string; description: string; perm: PermissionKey | "owner" };

export default function SettingsIndex() {
  const { base, can, isOwner } = useConsole();
  const settings = useSettings().data;
  const groups: { title: string; items: Entry[] }[] = [
    {
      title: "Business",
      items: [
        {
          href: "business",
          title: "Business & branding",
          description: "Name, logo, color and accepted IDs",
          perm: "settings.business",
        },
        {
          href: "area",
          title: "Delivery area",
          description: "Where your riders deliver",
          perm: "settings.business",
        },
      ],
    },
    {
      title: "Money",
      items: [
        {
          href: "pricing",
          title: "Delivery fee & order rules",
          description: "Per km, fixed or per barangay",
          perm: "settings.pricing",
        },
        ...(settings?.deliveryFee?.mode === "PER_BARANGAY"
          ? [
              {
                href: "pricing/barangays",
                title: "Barangay prices",
                description: "Fee for each barangay you serve",
                perm: "settings.pricing" as const,
              },
            ]
          : []),
        {
          href: "rider-pay",
          title: "Rider income",
          description: "Daily, per delivery or % of delivery fee",
          perm: "settings.riderPay",
        },
        {
          href: "loyalty",
          title: "Loyalty program",
          description: "Free delivery, free gifts and points",
          perm: "settings.loyalty",
        },
      ],
    },
    {
      title: "Team",
      items: [
        {
          href: "admins",
          title: "Admins",
          description: "Invite people to help run the business",
          perm: "admins.manage",
        },
        {
          href: "roles",
          title: "Roles & permissions",
          description: "Decide what each admin can do",
          perm: "admins.manage",
        },
      ],
    },
    {
      title: "ChowLane",
      items: [
        {
          href: "billing",
          title: "Plan & billing",
          description: "Your ChowLane plan and statements",
          perm: "owner",
        },
      ],
    },
  ];
  const allowed = (e: Entry) => (e.perm === "owner" ? isOwner : can(e.perm));

  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter(allowed) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader title="Settings" />
      {visible.length === 0 ? (
        <EmptyState
          icon={<Settings />}
          title="No settings for your role"
          description="Ask the owner if you need to change business settings."
        />
      ) : null}
      <div className="flex flex-col gap-8">
        {visible.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">{g.title}</h2>
            <ul className="divide-y rounded-card border">
              {g.items.map((e) => (
                <li key={e.href}>
                  <Link
                    href={`${base}/settings/${e.href}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-subtle"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{e.title}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {e.description}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
