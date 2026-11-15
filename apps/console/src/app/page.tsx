import Link from "next/link";
import { tenants } from "@chowlane/mocks";
import { ChowLaneLogo } from "@chowlane/ui";

/** Dev index: tenant apps are always opened per tenant (/[tenant]). */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <ChowLaneLogo />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Console app</h1>
        <p className="text-sm text-muted-foreground">
          Pick a tenant (dev only — real users open their tenant link).
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {tenants.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${t.slug}`}
              className="flex items-center justify-between rounded-card border p-4 hover:bg-muted"
            >
              <span className="font-medium">{t.businessName}</span>
              <span className="text-xs text-muted-foreground">
                /{t.slug}
                {t.status === "SUSPENDED" ? " · suspended" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
