"use client";

import { useRouter } from "next/navigation";
import type { Order, RiderRejectReason } from "@chowlane/types";
import { formatPeso, type DeliveryProof } from "@chowlane/lib";
import { toast } from "@chowlane/ui";
import { completeDeliveryAction, setItemsUnavailableAction } from "./delivery-actions";
import { getLocation } from "./device";
import { useRider } from "./use-rider";

/**
 * Rider actions on Supabase (2.6): each is one Postgres function that checks who the rider is, the order's status
 * and the rules (BL-5, BL-6, BL-11, BL-12). The two money steps go through server actions priced by packages/lib.
 * After each action the data reloads (Realtime also pushes the change).
 */
export function useRiderActions() {
  const router = useRouter();
  const { me, base, rule, supabase, reload, tenant } = useRider();

  /** Runs a call; shows its error. Returns true when it worked. */
  const run = async (
    fn: () => PromiseLike<{ error: { message: string } | null }>,
    message?: string,
  ): Promise<boolean> => {
    const { error } = await fn();
    await reload();
    if (error) {
      toast(error.message, "error");
      return false;
    }
    if (message) toast(message);
    return true;
  };

  /** Receipt / proof photo (resized data URL) → private delivery-photos bucket, <tenant>/<order>/… */
  const uploadPhoto = async (order: Order, dataUrl: string, kind: "receipt" | "proof") => {
    if (!dataUrl.startsWith("data:")) return dataUrl; // already uploaded (a storage path)
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${order.tenantId}/${order.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("delivery-photos")
      .upload(path, blob, { contentType: blob.type || "image/jpeg" });
    if (error) throw new Error(`Couldn't upload the photo: ${error.message}`);
    return path;
  };

  return {
    async timeIn() {
      if (!me) return;
      const location = await getLocation();
      await run(
        () =>
          supabase.rpc("rider_time_in", {
            p_tenant: tenant.id,
            p_lat: location?.lat,
            p_lng: location?.lng,
          }),
        location ? "You're on shift" : "You're on shift — turn on location so dispatch can see you",
      );
    },

    async timeOut() {
      if (!me) return;
      const location = await getLocation();
      const { data, error } = await supabase.rpc("rider_time_out", {
        p_tenant: tenant.id,
        p_lat: location?.lat,
        p_lng: location?.lng,
      });
      await reload();
      if (error) return void toast(error.message, "error");
      const sum = data as { expected_remit: number };
      toast(`Shift ended — hand over ${formatPeso(sum.expected_remit)} to your admin`);
      router.replace(base);
    },

    async accept(order: Order) {
      const { data, error } = await supabase.rpc("respond_to_offer", {
        p_order: order.id,
        p_accept: true,
      });
      await reload();
      if (error) return void toast(error.message, "error");
      if (data === "EXPIRED") return void toast("Too late — the offer expired", "error");
      toast("Order accepted — head to the store");
      router.push(`${base}/active`);
    },

    async reject(order: Order, reason: RiderRejectReason, note?: string) {
      await run(
        () =>
          supabase.rpc("respond_to_offer", {
            p_order: order.id,
            p_accept: false,
            p_reason: reason,
            p_note: note,
          }),
        "Offer declined",
      );
    },

    /** Countdown reached 0 (BL-5.6): the server times it out (the job also does every 15 s). */
    async expire() {
      await supabase.rpc("expire_offers");
      await reload();
      toast("The offer expired", "error");
    },

    async arrive(order: Order) {
      await run(() => supabase.rpc("arrive_at_store", { p_order: order.id }));
    },

    async setUnavailable(order: Order, idx: number[]) {
      const r = await setItemsUnavailableAction(order.id, idx);
      await reload();
      if (!r.ok) toast(r.error, "error");
    },

    async cancelUnavailable(order: Order) {
      const ok = await run(
        () => supabase.rpc("cancel_unavailable", { p_order: order.id }),
        "Order cancelled — nothing was available",
      );
      if (ok) router.replace(base);
    },

    async pickUp(order: Order, amount: number | undefined, receipt: string | undefined) {
      if (!amount || amount <= 0) {
        toast("Enter the amount you paid at the store.", "error");
        return false;
      }
      if (!receipt) {
        toast("Add a photo of the receipt.", "error");
        return false;
      }
      try {
        const path = await uploadPhoto(order, receipt, "receipt");
        return await run(
          () =>
            supabase.rpc("pick_up_order", {
              p_order: order.id,
              p_store_amount: amount,
              p_receipt_path: path,
            }),
          "Picked up — head to the customer",
        );
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
        return false;
      }
    },

    async deliver(order: Order, proof: DeliveryProof, cashCollected: boolean) {
      try {
        const photoPath = proof.photoUrl
          ? await uploadPhoto(order, proof.photoUrl, "proof")
          : undefined;
        const r = await completeDeliveryAction(
          order.id,
          { photoPath, note: proof.note },
          cashCollected,
        );
        await reload();
        if (!r.ok) return void toast(r.error, "error");
        toast(
          !rule || rule.mode === "DAILY"
            ? "Delivered — nice work!"
            : `Delivered — you earned ${formatPeso(r.riderEarning ?? 0)}`,
        );
        router.replace(base);
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      }
    },
  };
}
