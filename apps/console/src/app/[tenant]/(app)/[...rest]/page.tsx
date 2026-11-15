import { Construction } from "lucide-react";
import { EmptyState } from "@chowlane/ui";

/** Placeholder for screens not built yet (see docs/SCREENS.md). */
export default function ComingSoon() {
  return (
    <EmptyState
      icon={<Construction />}
      title="Coming soon"
      description="This screen is planned in a later Phase 1 milestone (see docs/SCREENS.md)."
    />
  );
}
