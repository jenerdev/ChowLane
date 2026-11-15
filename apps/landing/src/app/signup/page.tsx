import type { Metadata } from "next";
import { isHexColor } from "@chowlane/lib";
import { SignupWizard } from "@/components/signup/signup-wizard";

export const metadata: Metadata = { title: "Start your delivery business" };

/** S-002 Owner signup. `?name=&color=` come from the landing-page brand builder. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; color?: string }>;
}) {
  const { name, color } = await searchParams;
  return (
    <SignupWizard
      initialName={name?.slice(0, 40) ?? ""}
      initialColor={color && isHexColor(color) ? color.toUpperCase() : undefined}
    />
  );
}
