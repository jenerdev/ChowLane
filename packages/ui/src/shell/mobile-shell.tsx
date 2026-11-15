"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  exact?: boolean;
};

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Fixed bottom tab bar for phones (≤5 items), respects the iOS home indicator. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium [&_svg]:size-5",
                  active ? "text-foreground [&_svg]:text-brand" : "text-zinc-400",
                )}
              >
                {item.icon}
                {item.label}
                {item.badge ? (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] leading-4 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Sidebar for tablet/desktop (md+). */
export function SideNav({ items, header }: { items: NavItem[]; header?: ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 border-r bg-subtle px-3 py-5 md:flex">
      {header ? <div className="mb-5 px-2">{header}</div> : null}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm [&_svg]:size-4",
                  active
                    ? "bg-white font-medium text-foreground shadow-[0_0_0_1px_var(--color-border)] [&_svg]:text-brand"
                    : "text-zinc-600 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-danger px-1.5 text-[10px] leading-4 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

type TopBarProps = {
  title: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Sticky top bar with safe-area padding (installed PWA, notch). */
export function TopBar({ title, leading, actions, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur",
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</div>
      {actions}
    </header>
  );
}

type AppShellProps = {
  nav: NavItem[];
  topBar?: ReactNode;
  sideHeader?: ReactNode;
  /** "app" = bottom nav on phone + sidebar on desktop; "phone" = always phone-width (rider/customer). */
  layout?: "app" | "phone";
  children: ReactNode;
};

/** Mobile-first app frame used by console, rider, customer and platform. */
export function AppShell({ nav, topBar, sideHeader, layout = "app", children }: AppShellProps) {
  if (layout === "phone") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:border-x">
        {topBar}
        <main className="flex-1 px-5 pt-4 pb-28">{children}</main>
        <div className="md:[&>nav]:block">
          <BottomNav items={nav} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh">
      <SideNav items={nav} header={sideHeader} />
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav items={nav.slice(0, 5)} />
    </div>
  );
}

/** Page heading row: title + optional actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
