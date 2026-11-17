import { toCustomer } from "@chowlane/db/mappers";
import type { AppSupabase } from "@chowlane/db/react";
import type { Customer } from "@chowlane/types";
import { must } from "./use-live";

/**
 * Customers of a business from Supabase with their addresses and ID submissions (RLS: customers.view sees the rows,
 * only customers.verify sees ID submissions — BL-3.7). `ids` narrows to some customers.
 */
export async function loadCustomers(
  sb: AppSupabase,
  tenantId: string,
  opts: { ids?: string[]; status?: Customer["verificationStatus"] } = {},
): Promise<Customer[]> {
  let q = sb.from("customers").select("*").eq("tenant_id", tenantId);
  if (opts.ids) q = q.in("id", opts.ids);
  if (opts.status) q = q.eq("verification_status", opts.status);
  const rows = must(await q.order("name"));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [addresses, verifications] = await Promise.all([
    sb.from("customer_addresses").select("*").in("customer_id", ids),
    sb.from("verifications").select("*").in("customer_id", ids),
  ]);
  return rows.map((r) => toCustomer(r, must(addresses), must(verifications)));
}
