"use client";

import type { IdType } from "@chowlane/types";
import type { VerificationUpload } from "@chowlane/db/mappers";
import type { AppSupabase } from "@chowlane/db/react";

/**
 * Uploads the ID photo and the selfie (resized data URLs from the ID form) to the private id-documents bucket under
 * <tenant id>/<customer id>/ — the only folder this customer may write (BL-3.7). Returns the storage paths.
 */
export async function uploadIdPhotos(
  supabase: AppSupabase,
  tenantId: string,
  customerId: string,
  v: { idType: IdType; idFrontUrl: string; selfieWithIdUrl: string },
): Promise<VerificationUpload> {
  const stamp = Date.now();
  const put = async (dataUrl: string, kind: "id" | "selfie") => {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${tenantId}/${customerId}/${kind}-${stamp}.${ext}`;
    const { error } = await supabase.storage
      .from("id-documents")
      .upload(path, blob, { contentType: blob.type || "image/jpeg" });
    if (error)
      throw new Error(`Couldn't upload your ${kind === "id" ? "ID" : "selfie"}: ${error.message}`);
    return path;
  };
  const [idFrontUrl, selfieWithIdUrl] = await Promise.all([
    put(v.idFrontUrl, "id"),
    put(v.selfieWithIdUrl, "selfie"),
  ]);
  return { idType: v.idType, idFrontUrl, selfieWithIdUrl };
}
