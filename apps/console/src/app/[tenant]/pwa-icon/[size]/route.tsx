import { readableTextColor } from "@chowlane/lib";
import { tenantIconResponse } from "@chowlane/pwa/icon";
import { resolveTenant } from "@/lib/tenant";

const SIZES = new Set([180, 192, 512]);

/** Placeholder app icon generated from the tenant's name + color. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenant: string; size: string }> },
) {
  const { size: raw } = await params;
  const size = Number(raw);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const t = await resolveTenant(params);
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  return tenantIconResponse({
    name: t.businessName,
    color: t.primaryColor,
    textColor: readableTextColor(t.primaryColor),
    size,
    maskable,
  });
}
