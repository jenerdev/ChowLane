import { findMockTenant } from "@chowlane/mocks";
import { AppPlaceholder } from "@chowlane/ui";

export default async function TenantHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const config = findMockTenant(tenant);
  return (
    <AppPlaceholder
      title={config?.businessName ?? tenant}
      subtitle="Order food — scaffold placeholder (Phase 1, Milestone 1.1 next)"
    />
  );
}
