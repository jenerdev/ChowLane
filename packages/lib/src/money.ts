import type { Centavos } from "@chowlane/types";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** Format integer centavos as Philippine pesos, e.g. 123450 → "₱1,234.50". */
export function formatPeso(amount: Centavos): string {
  return peso.format(amount / 100);
}

/** Convert pesos to centavos, e.g. pesos(49.5) → 4950. */
export function pesos(amount: number): Centavos {
  return Math.round(amount * 100);
}

/** Round centavos UP to the next whole peso (BL-7.8 delivery fee rounding). */
export function roundUpToPeso(amount: Centavos): Centavos {
  return Math.ceil(amount / 100) * 100;
}
