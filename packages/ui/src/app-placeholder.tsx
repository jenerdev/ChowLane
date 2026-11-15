import type { ReactNode } from "react";

type AppPlaceholderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Temporary scaffold screen used until real screens are built (Phase 1). */
export function AppPlaceholder({ title, subtitle, children }: AppPlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-3 px-4 py-10">
      <h1 className="text-2xl font-bold text-brand">{title}</h1>
      {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
      {children}
    </main>
  );
}
