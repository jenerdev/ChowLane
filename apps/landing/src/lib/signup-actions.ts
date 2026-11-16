"use server";

import {
  brandTint,
  checkPassword,
  checkSlug,
  DEFAULT_ADMIN_PERMISSIONS,
  isHexColor,
  isValidEmail,
  NEW_TENANT_LOYALTY,
  normalizePhMobile,
  SLUG_MESSAGES,
  shortNameFor,
} from "@chowlane/lib";
import { createAdminSupabase } from "@chowlane/db/admin";
import { createPublicSupabase } from "@chowlane/db/server";
import { CITIES } from "./presets";

export type SignupInput = {
  ownerName: string;
  email: string;
  mobile: string;
  password: string;
  businessName: string;
  slug: string;
  color: string;
  city: string;
  radiusKm: number;
};

export type SignupResult =
  { ok: true; slug: string } | { ok: false; field?: keyof SignupInput; error: string };

/** Is this business link already used? (tenants_public; the signup form checks while typing). */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const supabase = await createPublicSupabase();
  const { data } = await supabase
    .from("tenants_public")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Owner signup (BL-1.1, BL-15, F-01): creates the owner's login and the business in one go. Rules are checked
 * again here with packages/lib; the business, owner row, default Admin role, settings and FREE plan are created by
 * the `create_tenant` function. If that fails, the new login is removed again so the email can be reused.
 */
export async function createBusiness(input: SignupInput): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const ownerName = input.ownerName.trim();
  const businessName = input.businessName.trim();
  const mobile = normalizePhMobile(input.mobile);
  if (ownerName.length < 2)
    return { ok: false, field: "ownerName", error: "Enter your full name." };
  if (!isValidEmail(email)) return { ok: false, field: "email", error: "Enter a valid email." };
  if (!mobile)
    return { ok: false, field: "mobile", error: "Enter a PH mobile number, like 0917 123 4567." };
  const pw = checkPassword(input.password);
  if (pw) return { ok: false, field: "password", error: pw };
  if (businessName.length < 2)
    return { ok: false, field: "businessName", error: "Enter your business name." };
  if (!isHexColor(input.color)) return { ok: false, field: "color", error: "Pick a brand color." };
  const city = CITIES.find((c) => c.name === input.city);
  if (!city) return { ok: false, field: "city", error: "Pick your city." };
  if (!(input.radiusKm >= 1 && input.radiusKm <= 15))
    return { ok: false, field: "radiusKm", error: "Choose 1–15 km." };

  const slugProblem = checkSlug(input.slug, (await isSlugTaken(input.slug)) ? [input.slug] : []);
  if (slugProblem) return { ok: false, field: "slug", error: SLUG_MESSAGES[slugProblem] };

  const admin = createAdminSupabase();
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true, // Q-36 (open): no email verification step in the MVP
    user_metadata: { name: ownerName, mobile },
  });
  if (userError || !created.user)
    return /already been registered|email_exists/i.test(userError?.message ?? "")
      ? {
          ok: false,
          field: "email",
          error: "This email already has a ChowLane login. Log in to your console instead.",
        }
      : { ok: false, error: `Couldn't create your login: ${userError?.message}` };

  const { error: tenantError } = await admin.rpc("create_tenant", {
    p_owner_auth_id: created.user.id,
    p_owner_name: ownerName,
    p_owner_email: email,
    p_business_name: businessName,
    p_short_name: shortNameFor(businessName),
    p_slug: input.slug,
    p_primary_color: input.color.toUpperCase(),
    p_background_color: brandTint(input.color),
    p_center_lat: city.center.lat,
    p_center_lng: city.center.lng,
    p_radius_km: input.radiusKm,
    p_admin_permissions: DEFAULT_ADMIN_PERMISSIONS,
    p_loyalty: NEW_TENANT_LOYALTY,
  });
  if (tenantError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return tenantError.code === "23505"
      ? { ok: false, field: "slug", error: SLUG_MESSAGES.TAKEN }
      : { ok: false, error: `Couldn't create your business: ${tenantError.message}` };
  }
  return { ok: true, slug: input.slug };
}
