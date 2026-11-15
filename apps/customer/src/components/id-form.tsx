"use client";

import { useState } from "react";
import { Camera, IdCard } from "lucide-react";
import { ID_TYPE_LABELS, type IdType } from "@chowlane/types";
import { Button, Field, Select } from "@chowlane/ui";
import { photoToDataUrl } from "@/lib/images";

type Props = {
  accepted: IdType[];
  submitLabel: string;
  busy?: boolean;
  onSubmit: (v: { idType: IdType; idFrontUrl: string; selfieWithIdUrl: string }) => void;
};

function PhotoPick({
  id,
  label,
  hint,
  value,
  onChange,
  capture,
  icon,
}: {
  id: string;
  label: string;
  hint: string;
  value?: string;
  onChange: (v: string) => void;
  capture: "user" | "environment";
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <label
        htmlFor={id}
        className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-card border border-dashed bg-subtle text-muted-foreground focus-within:ring-3 focus-within:ring-ring hover:border-zinc-400"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview
          <img src={value} alt={label} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm">
            {icon}
            Tap to take a photo
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          capture={capture}
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onChange(await photoToDataUrl(f));
          }}
        />
      </label>
      <span className="text-[13px] text-muted-foreground">{hint}</span>
    </div>
  );
}

/** ID type + photo of the ID + selfie holding the ID (BL-3.3a–c, D-025). */
export function IdForm({ accepted, submitLabel, busy, onSubmit }: Props) {
  const [idType, setIdType] = useState<IdType | "">("");
  const [front, setFront] = useState<string>();
  const [selfie, setSelfie] = useState<string>();
  const ready = Boolean(idType && front && selfie);
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready)
          onSubmit({ idType: idType as IdType, idFrontUrl: front!, selfieWithIdUrl: selfie! });
      }}
    >
      <Field label="Type of ID" htmlFor="id-type">
        <Select id="id-type" value={idType} onChange={(e) => setIdType(e.target.value as IdType)}>
          <option value="">Choose a valid ID</option>
          {accepted.map((t) => (
            <option key={t} value={t}>
              {ID_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoPick
          id="id-front"
          label="Photo of your ID"
          hint="Front side, all corners visible, name readable."
          value={front}
          onChange={setFront}
          capture="environment"
          icon={<IdCard className="size-7" />}
        />
        <PhotoPick
          id="id-selfie"
          label="Selfie holding your ID"
          hint="Your face and the ID both clearly visible."
          value={selfie}
          onChange={setSelfie}
          capture="user"
          icon={<Camera className="size-7" />}
        />
      </div>
      <p className="text-[13px] text-muted-foreground">
        Only the store team sees these photos, just to confirm it&apos;s really you.
      </p>
      <Button type="submit" size="lg" disabled={!ready || busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
