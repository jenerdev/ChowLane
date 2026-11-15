import Link from "next/link";
import { mockTenants } from "@chowlane/mocks";
import { AppPlaceholder } from "@chowlane/ui";

/** Dev index: tenant apps are always opened per tenant (/[tenant]). */
export default function Home() {
  return (
    <AppPlaceholder title="Customer" subtitle="Pick a tenant (dev only)">
      <ul className="flex flex-col gap-2">
        {mockTenants.map((t) => (
          <li key={t.slug}>
            <Link className="text-brand underline" href={`/${t.slug}`}>
              {t.businessName}
            </Link>
          </li>
        ))}
      </ul>
    </AppPlaceholder>
  );
}
