"use client";

import { useParams } from "next/navigation";
import { useCustomerData, type CustomerData } from "./customer-data";
import { useCustomerIdentity } from "./identity";

const EMPTY: Omit<CustomerData, "settings"> = {
  merchants: [],
  products: [],
  barangayFees: [],
  orders: [],
  riders: [],
  loyaltyTransactions: [],
};

/**
 * Everything a customer screen needs (Supabase since 2.5): the business (`tenant`, from the server), its checkout
 * settings, the menu, and the signed-in customer (`me`) with their orders and rewards. `db` holds the lists, already
 * limited to this business and this customer by RLS. Call `reload()` after a change.
 */
export function useCustomer() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const auth = useCustomerIdentity();
  const { data, loaded, reload, error } = useCustomerData();
  const signedIn = Boolean(auth.identity);
  return {
    slug,
    base: `/${slug}`,
    tenant: auth.tenant,
    db: data ?? { ...EMPTY, settings: undefined },
    settings: data?.settings as CustomerData["settings"],
    me: data?.me,
    live: auth.identity,
    signedIn,
    /** session checked and this business's data loaded */
    ready: auth.ready && (loaded || Boolean(error)),
    error,
    supabase: auth.supabase,
    reload,
    refresh: auth.refresh,
    signOut: auth.signOut,
  };
}

export { useNow } from "@chowlane/ui";
