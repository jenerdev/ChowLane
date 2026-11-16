import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@chowlane/db/proxy";

/** Keeps the console's Supabase session cookie fresh on every page request. */
export function proxy(request: NextRequest) {
  return updateSupabaseSession(request, "console");
}

export const config = {
  // Skip static files, the service worker and icons.
  matcher: [
    "/((?!_next/static|_next/image|serwist|favicon.ico|.*\.(?:png|svg|jpg|jpeg|webp|ico)$).*)",
  ],
};
