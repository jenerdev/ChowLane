/**
 * @chowlane/lib — pure business logic shared by all apps (and later Supabase functions).
 * Rules: docs/BUSINESS-LOGIC.md. Calculators are added in Milestone 1.1.
 */
import type { Centavos } from "@chowlane/types";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** Format integer centavos as Philippine pesos, e.g. 123450 → "₱1,234.50". */
export function formatPeso(amount: Centavos): string {
  return peso.format(amount / 100);
}
