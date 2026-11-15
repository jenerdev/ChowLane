import { Construction } from "lucide-react";
import { EmptyState } from "@chowlane/ui";

export default function ComingSoon() {
  return (
    <EmptyState
      icon={<Construction />}
      title="Coming soon"
      description="Planned in Milestone 1.7 (see docs/SCREENS.md)."
    />
  );
}
