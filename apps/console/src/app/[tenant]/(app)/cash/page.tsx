"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import type { Centavos, Shift } from "@chowlane/types";
import { formatDateTime, formatPeso, remitStatusFor } from "@chowlane/lib";
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  Input,
  MoneyInput,
  PageHeader,
  RemitBadge,
  Sheet,
  SheetContent,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

type Tab = "todo" | "done" | "open";

/** S-124 — record the cash riders hand over after each shift (ADM-012, BL-12). */
export default function CashPage() {
  return (
    <RequirePermission perm="cash.manage">
      <Cash />
    </RequirePermission>
  );
}

function Cash() {
  const { db, tenant, me } = useConsole();
  const patch = useMockStore((s) => s.patch);
  const [tab, setTab] = useState<Tab>("todo");
  const [recording, setRecording] = useState<Shift | null>(null);
  const [amount, setAmount] = useState<Centavos | undefined>();
  const [note, setNote] = useState("");

  const shifts = db.shifts
    .filter((s) => s.tenantId === tenant.id)
    .sort((a, b) => Date.parse(b.timeIn) - Date.parse(a.timeIn));
  const groups: Record<Tab, Shift[]> = {
    todo: shifts.filter((s) => s.remitStatus === "PENDING"),
    done: shifts.filter((s) => ["RECEIVED", "SHORT", "OVER"].includes(s.remitStatus)),
    open: shifts.filter((s) => s.remitStatus === "OPEN"),
  };
  const rider = (id: string) => db.riders.find((r) => r.id === id);
  const mismatch = recording && amount !== undefined && amount !== recording.expectedRemit;

  return (
    <>
      <PageHeader
        title="Cash"
        description="Riders hand over the cash they collected, minus what they paid at stores, after every shift."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList className="w-auto">
          <TabsTrigger value="todo">To record ({groups.todo.length})</TabsTrigger>
          <TabsTrigger value="done">Recorded ({groups.done.length})</TabsTrigger>
          <TabsTrigger value="open">On shift ({groups.open.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {groups[tab].length === 0 ? (
        <EmptyState
          icon={<Banknote />}
          title={tab === "todo" ? "Nothing to record" : "Nothing here"}
          description={tab === "todo" ? "Shifts appear here when riders time out." : undefined}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {groups[tab].map((s) => {
            const r = rider(s.riderId);
            return (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={r?.name ?? "Rider"} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r?.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {formatDateTime(s.timeIn)} – {s.timeOut ? formatDateTime(s.timeOut) : "now"}
                    {s.remittedAmount !== undefined
                      ? ` · received ${formatPeso(s.remittedAmount)}`
                      : ""}
                    {s.remitNote ? ` · ${s.remitNote}` : ""}
                  </span>
                </span>
                <span className="text-right text-sm tabular-nums">
                  {s.remitStatus === "OPEN" ? "—" : formatPeso(s.expectedRemit)}
                  <span className="block text-[11px] text-muted-foreground">expected</span>
                </span>
                {s.remitStatus === "PENDING" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setRecording(s);
                      setAmount(s.expectedRemit);
                      setNote("");
                    }}
                  >
                    Record
                  </Button>
                ) : (
                  <RemitBadge status={s.remitStatus} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={recording !== null} onOpenChange={(o) => !o && setRecording(null)}>
        {recording ? (
          <SheetContent
            title={`Cash from ${rider(recording.riderId)?.name}`}
            description={`${formatDateTime(recording.timeIn)} – ${formatDateTime(recording.timeOut!)}`}
          >
            <dl className="rounded-control bg-subtle px-4 py-3 text-sm">
              <div className="flex justify-between py-0.5">
                <dt>Collected from customers</dt>
                <dd className="tabular-nums">{formatPeso(recording.cashCollected)}</dd>
              </div>
              <div className="flex justify-between py-0.5 text-muted-foreground">
                <dt>Paid at stores</dt>
                <dd className="tabular-nums">−{formatPeso(recording.storePaid)}</dd>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <dt>Should hand over</dt>
                <dd className="tabular-nums">{formatPeso(recording.expectedRemit)}</dd>
              </div>
            </dl>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (amount === undefined || (mismatch && !note.trim())) return;
                const status = remitStatusFor(recording.expectedRemit, amount);
                patch("shifts", recording.id, {
                  remittedAmount: amount,
                  remitStatus: status,
                  remitReceivedBy: me!.id,
                  remitReceivedAt: new Date().toISOString(),
                  remitNote: note.trim() || undefined,
                });
                toast(
                  status === "RECEIVED"
                    ? "Cash recorded"
                    : `Recorded — ${status === "SHORT" ? "short" : "over"} by ${formatPeso(Math.abs(amount - recording.expectedRemit))}`,
                );
                setRecording(null);
              }}
            >
              <Field
                label="Amount received"
                htmlFor="cash-amt"
                hint={
                  mismatch
                    ? `${amount! < recording.expectedRemit ? "Short" : "Over"} by ${formatPeso(Math.abs(amount! - recording.expectedRemit))}`
                    : "Count the cash, then confirm."
                }
              >
                <MoneyInput id="cash-amt" value={amount} onChange={setAmount} />
              </Field>
              {mismatch ? (
                <Field
                  label="What happened?"
                  htmlFor="cash-note"
                  hint="Required when the amount doesn't match."
                >
                  <Input id="cash-note" value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              ) : null}
              <Button
                type="submit"
                disabled={amount === undefined || Boolean(mismatch && !note.trim())}
              >
                Confirm amount
              </Button>
            </form>
          </SheetContent>
        ) : null}
      </Sheet>
    </>
  );
}
