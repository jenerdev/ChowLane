import type { ReactNode } from "react";
import { PlatformFrame } from "./platform-frame";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <PlatformFrame>{children}</PlatformFrame>;
}
