"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, ReceiptText } from "lucide-react";
import { AppShell, ChowLaneLogo, TopBar, type NavItem } from "@chowlane/ui";
import { usePlatform } from "@/lib/use-platform";

const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: <LayoutDashboard />, exact: true },
  { href: "/tenants", label: "Tenants", icon: <Building2 /> },
  { href: "/billing", label: "Billing", icon: <ReceiptText /> },
];

/** ChowLane-branded shell for signed-in platform pages; redirects to /login when signed out (PLT-001). */
export function PlatformFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { me, ready, loaded, signOut } = usePlatform();
  const signedIn = ready && Boolean(me) && loaded;

  useEffect(() => {
    if (ready && !me) router.replace("/login");
  }, [ready, me, router]);

  const out = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <AppShell
      nav={NAV}
      sideHeader={
        <div className="flex flex-col gap-3">
          <ChowLaneLogo />
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{me?.name ?? "Platform admin"}</p>
              <p className="truncate text-xs text-muted-foreground">Platform admin</p>
            </div>
            <SignOut onClick={out} />
          </div>
        </div>
      }
      topBar={
        <TopBar
          className="md:hidden"
          title={<ChowLaneLogo />}
          actions={<SignOut onClick={out} />}
        />
      }
    >
      {signedIn ? children : null}
    </AppShell>
  );
}

function SignOut({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Log out"
      title="Log out"
      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4" />
    </button>
  );
}
