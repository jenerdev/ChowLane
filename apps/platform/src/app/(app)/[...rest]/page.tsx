import { Construction } from "lucide-react";
import { EmptyState } from "@chowlane/ui";

export default function NotFoundHere() {
  return (
    <EmptyState
      icon={<Construction />}
      title="Page not found"
      description="Use the menu to go to Overview, Tenants or Billing."
    />
  );
}
