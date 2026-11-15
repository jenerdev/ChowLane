import type { PhoneE164 } from "@chowlane/types";

/**
 * Normalise a Philippine mobile number to E.164 (+639XXXXXXXXX).
 * Accepts "09171234567", "9171234567", "+639171234567", "639171234567" (spaces/dashes ok).
 * Returns null when it is not a valid PH mobile number.
 */
export function normalizePhMobile(input: string): PhoneE164 | null {
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  let national: string | null = null;
  if (/^09\d{9}$/.test(digits)) national = digits.slice(1);
  else if (/^9\d{9}$/.test(digits)) national = digits;
  else if (/^639\d{9}$/.test(digits)) national = digits.slice(2);
  return national ? `+63${national}` : null;
}

/** Display format: "+639171234567" → "0917 123 4567". */
export function formatPhMobile(phone: PhoneE164): string {
  const national = `0${phone.replace(/^\+63/, "")}`;
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}
