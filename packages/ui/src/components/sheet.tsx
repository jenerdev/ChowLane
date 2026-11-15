"use client";

import type { ComponentProps, ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  /** "bottom" = mobile bottom sheet (default); "center" = dialog. */
  side?: "bottom" | "center";
  children: ReactNode;
};

/** Bottom sheet on phones, centered dialog on larger screens. */
export function SheetContent({
  title,
  description,
  side = "bottom",
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex max-h-[90dvh] flex-col gap-4 overflow-y-auto bg-background p-5 shadow-xl outline-none",
          side === "bottom"
            ? "inset-x-0 bottom-0 rounded-t-3xl pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-1/2 sm:rounded-3xl"
            : "top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-1/2 rounded-3xl",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-m-2 rounded-full p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
