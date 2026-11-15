"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike } from "lucide-react";
import { changeToGive, formatPeso } from "@chowlane/lib";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  Field,
  PageHeader,
  Textarea,
} from "@chowlane/ui";
import { PhotoInput } from "@/components/photo-input";
import { useRider } from "@/lib/use-rider";
import { useRiderActions } from "@/lib/use-rider-actions";

/** S-204 — collect cash and add proof of delivery (RID-007, RID-010). */
export default function CompleteDelivery() {
  const { active: order, base, db } = useRider();
  const actions = useRiderActions();
  const [cash, setCash] = useState(false);
  const [photo, setPhoto] = useState<string>();
  const [note, setNote] = useState("");

  if (!order || order.status !== "PICKED_UP") {
    return (
      <EmptyState
        icon={<Bike />}
        title="Nothing to deliver yet"
        action={
          <Button asChild variant="outline">
            <Link href={`${base}/active`}>Back to delivery</Link>
          </Button>
        }
      />
    );
  }
  const change = changeToGive(order);
  const customer = db.customers.find((c) => c.id === order.customerId);
  const ready = cash && (photo || note.trim());

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={{ href: `${base}/active`, label: order.orderNumber }}
        title="Hand over the order"
        description={customer?.name}
      />
      <Card>
        <CardContent className="flex flex-col gap-1 pt-5 text-center">
          <p className="text-sm text-muted-foreground">Collect cash</p>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatPeso(order.total)}
          </p>
          {order.changeFor ? (
            <p className="text-sm text-muted-foreground">
              Customer pays with {formatPeso(order.changeFor)} → give {formatPeso(change)} change
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Checkbox
        checked={cash}
        onChange={setCash}
        label={`I collected ${formatPeso(order.total)} in cash`}
      />
      <PhotoInput id="proof" label="Proof photo" value={photo} onChange={setPhoto} />
      <Field
        label="Note"
        htmlFor="proof-note"
        hint="Optional if you added a photo — e.g. “Handed to guard at lobby”."
      >
        <Textarea id="proof-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Button
        size="lg"
        disabled={!ready}
        onClick={() => actions.deliver(order, { photoUrl: photo, note }, cash)}
      >
        Mark as delivered
      </Button>
    </div>
  );
}
