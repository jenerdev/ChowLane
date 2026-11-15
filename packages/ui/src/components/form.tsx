"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";
import type { Centavos } from "@chowlane/types";
import { cn } from "../lib/cn";

/** Square checkbox with label + optional description. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label
      htmlFor={cid}
      className={cn(
        "flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={cid}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-5 appearance-none rounded-md border border-zinc-300 bg-white transition-colors checked:border-brand checked:bg-brand focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed"
        />
        <Check className="pointer-events-none absolute size-3.5 text-brand-foreground opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {description ? (
          <span className="block text-[13px] text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export type RadioCardOption<T extends string> = { value: T; label: string; description?: string };

/** Mutually exclusive choice shown as stacked cards (e.g. delivery fee mode). */
export function RadioCards<T extends string>({
  name,
  value,
  onChange,
  options,
  columns = 1,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: RadioCardOption<T>[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-control border p-3.5 transition-colors",
              selected ? "border-zinc-900 bg-subtle" : "hover:border-zinc-300",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="mt-0.5 size-4 shrink-0 accent-zinc-900"
            />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              {o.description ? (
                <span className="block text-[13px] text-muted-foreground">{o.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

const toText = (v: Centavos | undefined) =>
  v === undefined ? "" : (v / 100).toFixed(2).replace(/\.00$/, "");

/** Peso amount input. Value is integer centavos (undefined = empty). */
export function MoneyInput({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: Centavos | undefined;
  onChange: (value: Centavos | undefined) => void;
}) {
  const [text, setText] = useState(toText(value));
  // keep in sync when the value changes from outside (e.g. reset)
  useEffect(() => {
    setText((t) => (Math.round(Number(t) * 100) === value ? t : toText(value)));
  }, [value]);
  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-control border border-input bg-background transition-colors focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-ring/50 hover:border-zinc-300",
        className,
      )}
    >
      <span className="pl-3 text-muted-foreground">₱</span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, "");
          setText(t);
          onChange(t === "" || Number.isNaN(Number(t)) ? undefined : Math.round(Number(t) * 100));
        }}
        onBlur={() => setText(toText(value))}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-base tabular-nums outline-none"
      />
    </div>
  );
}

/** Number input with a unit suffix (km, %, min, sec…). */
export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-control border border-input bg-background transition-colors focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-ring/50 hover:border-zinc-300",
        className,
      )}
    >
      <input
        {...props}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix ? <span className="pr-3 text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}

/** A titled group of form fields. Two columns on desktop: title left, fields right. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-10",
        className,
      )}
    >
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

/** Row with label/description on the left and a control (switch) on the right. */
export function SwitchRow({
  title,
  description,
  control,
}: {
  title: ReactNode;
  description?: ReactNode;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

/** Sticky save bar shown at the bottom of edit pages. */
export function SaveBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-5 mt-8 flex items-center justify-end gap-3 border-t bg-background/95 px-5 py-3 backdrop-blur md:bottom-0 md:-mx-10 md:px-10">
      {note ? <p className="mr-auto text-[13px] text-muted-foreground">{note}</p> : null}
      {children}
    </div>
  );
}
