"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@chowlane/ui";

/** Underline sub-navigation for tenant detail pages (links, not client tabs). */
export function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Tenant sections"
      className="mb-6 flex gap-5 overflow-x-auto border-b [scrollbar-width:none]"
    >
      {items.map((i) => {
        const active = i.exact
          ? pathname === i.href
          : pathname === i.href || pathname.startsWith(`${i.href}/`);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px h-10 shrink-0 border-b-2 pt-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
