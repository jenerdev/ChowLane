"use server";

import { headers } from "next/headers";
import type { PermissionKey } from "@chowlane/types";
import { checkPassword, isValidEmail, normalizePhMobile } from "@chowlane/lib";
import { riderLoginEmail } from "@chowlane/db";
import { createAdminSupabase } from "@chowlane/db/admin";
import { createServerSupabase } from "@chowlane/db/server";

/**
 * Console server actions that need the Supabase Auth admin API (service role): admin invites (BL-2.6) and rider
 * logins (Q-30, D-062). Every action first checks the caller's permission with their own session
 * (`has_permission`), and plain row changes still go through the caller's session so RLS applies.
 */

export type ActionResult = { ok: true; note?: string } | { ok: false; error: string };

async function requirePermission(tenantId: string, perm: PermissionKey) {
  const supabase = await createServerSupabase("console");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, error: "Your session ended. Log in again." };
  const { data: allowed } = await supabase.rpc("has_permission", {
    p_tenant: tenantId,
    p_perm: perm,
  });
  if (!allowed) return { supabase, error: "You don't have permission to do this." };
  return { supabase, error: null };
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/**
 * Sends the Supabase invite email. If the email already has a login: an earlier invite that was never accepted is
 * replaced by a fresh one; a login that is in use is simply linked at its next console login (accept_staff_invite).
 */
async function sendInvite(email: string, name: string, slug: string): Promise<ActionResult> {
  const admin = createAdminSupabase();
  const redirectTo = `${await siteOrigin()}/${slug}/invite`;
  const invite = () => admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { name } });
  let { error } = await invite();
  if (error && (error.code === "email_exists" || /already been registered/i.test(error.message))) {
    const { data: logins } = await admin.rpc("auth_login_status", { p_email: email });
    const existing = logins?.[0];
    if (existing?.in_use)
      return { ok: true, note: `${email} already has a login — they can log in with it now` };
    if (existing) await admin.auth.admin.deleteUser(existing.user_id); // leftover invite login → replace it
    ({ error } = await invite());
  }
  if (!error) return { ok: true, note: `Invite sent to ${email}` };
  return { ok: false, error: `Couldn't send the invite: ${error.message}` };
}

export async function inviteAdmin(input: {
  tenantId: string;
  slug: string;
  name: string;
  email: string;
  roleId: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Enter their name." };
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email." };
  const { supabase, error } = await requirePermission(input.tenantId, "admins.manage");
  if (error) return { ok: false, error };

  const { error: insertError } = await supabase.from("staff_users").insert({
    tenant_id: input.tenantId,
    name,
    email,
    type: "ADMIN",
    role_id: input.roleId,
    status: "INVITED",
  });
  if (insertError)
    return {
      ok: false,
      error:
        insertError.code === "23505" ? "This person is already on your team." : insertError.message,
    };
  return sendInvite(email, name, input.slug);
}

export async function resendInvite(input: {
  tenantId: string;
  slug: string;
  staffId: string;
}): Promise<ActionResult> {
  const { supabase, error } = await requirePermission(input.tenantId, "admins.manage");
  if (error) return { ok: false, error };
  const { data: row } = await supabase
    .from("staff_users")
    .select("email, name, status")
    .eq("id", input.staffId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (!row || row.status !== "INVITED")
    return { ok: false, error: "This invite was already accepted." };
  return sendInvite(row.email, row.name, input.slug);
}

/**
 * Creates or updates a rider's login: mobile number + password set by the admin (Q-30). The rider row itself is
 * saved first by the form (RLS); this links it to a Supabase login whose email is derived from the number (D-062).
 */
export async function saveRiderLogin(input: {
  tenantId: string;
  slug: string;
  riderId: string;
  /** required for a rider without a login yet; optional otherwise (keeps the old password) */
  password?: string;
}): Promise<ActionResult> {
  const { supabase, error } = await requirePermission(input.tenantId, "riders.manage");
  if (error) return { ok: false, error };
  if (input.password) {
    const pwProblem = checkPassword(input.password);
    if (pwProblem) return { ok: false, error: pwProblem };
  }

  const { data: rider } = await supabase
    .from("riders")
    .select("id, name, phone, auth_user_id")
    .eq("id", input.riderId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (!rider) return { ok: false, error: "Rider not found." };
  const phone = normalizePhMobile(rider.phone);
  if (!phone) return { ok: false, error: "The rider's mobile number isn't valid." };
  const email = riderLoginEmail(input.slug, phone);
  const admin = createAdminSupabase();

  if (!rider.auth_user_id) {
    if (!input.password) return { ok: false, error: "Set a password so the rider can log in." };
    let userId: string;
    let created = false;
    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: rider.name },
    });
    if (data.user) {
      userId = data.user.id;
      created = true;
    } else if (/already been registered|email_exists/i.test(createError?.message ?? "")) {
      // A login for this number exists. Reuse it only if nobody is linked to it (e.g. an earlier save that
      // didn't finish); otherwise another rider of this business already uses the number.
      const { data: logins } = await admin.rpc("auth_login_status", { p_email: email });
      const existing = logins?.[0];
      if (!existing || existing.in_use)
        return { ok: false, error: "Another rider of your business already uses this number." };
      const { error: pwError } = await admin.auth.admin.updateUserById(existing.user_id, {
        password: input.password,
        email_confirm: true,
      });
      if (pwError) return { ok: false, error: `Couldn't update the login: ${pwError.message}` };
      userId = existing.user_id;
    } else {
      return { ok: false, error: `Couldn't create the login: ${createError?.message}` };
    }
    const { error: linkError } = await admin
      .from("riders")
      .update({ auth_user_id: userId })
      .eq("id", rider.id);
    if (linkError) {
      if (created) await admin.auth.admin.deleteUser(userId); // don't leave an unlinked login behind
      return { ok: false, error: `Couldn't link the login: ${linkError.message}` };
    }
    return { ok: true };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(rider.auth_user_id, {
    email,
    email_confirm: true,
    ...(input.password ? { password: input.password } : {}),
  });
  if (updateError) return { ok: false, error: `Couldn't update the login: ${updateError.message}` };
  return { ok: true };
}
