"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { ID_TYPE_LABELS, ID_TYPES, type IdType } from "@chowlane/types";
import { readableTextColor } from "@chowlane/lib";
import { tenantShortName } from "@chowlane/pwa";
import {
  Button,
  Checkbox,
  ColorPicker,
  Field,
  FormSection,
  Input,
  PageHeader,
  SaveBar,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

/** Resize an image file to a small square data URL so it survives reloads in localStorage. */
async function toSmallDataUrl(file: File, size = 256): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

/** S-114 — business name, logo, color, accepted IDs (OWN-002, OWN-015). */
export default function BusinessSettings() {
  return (
    <RequirePermission perm="settings.business">
      <Business />
    </RequirePermission>
  );
}

function Business() {
  const { tenant, settings, base } = useConsole();
  const patch = useMockStore((s) => s.patch);
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  const [name, setName] = useState(tenant.businessName);
  const [shortName, setShortName] = useState(tenant.shortName);
  const [color, setColor] = useState(tenant.primaryColor);
  const [logo, setLogo] = useState(tenant.logoUrl);
  const [ids, setIds] = useState<IdType[]>(settings.acceptedIdTypes);
  const [errors, setErrors] = useState<{ name?: string; shortName?: string; ids?: string }>({});

  function save() {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = "Enter your business name.";
    if (!shortName.trim() || shortName.trim().length > 12) e.shortName = "Use 1–12 characters.";
    if (ids.length === 0) e.ids = "Accept at least one ID type.";
    setErrors(e);
    if (Object.keys(e).length) return;
    patch("tenants", tenant.id, {
      businessName: name.trim(),
      shortName: shortName.trim(),
      primaryColor: color,
      logoUrl: logo,
    });
    setTenantRow("tenantSettings", { ...settings, acceptedIdTypes: ids });
    toast("Business settings saved");
  }

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings`, label: "Settings" }}
        title="Business & branding"
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <FormSection title="Name" description="Shown on your apps and on customers' home screens.">
          <Field label="Business name" htmlFor="b-name" error={errors.name}>
            <Input
              id="b-name"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field
            label="Short name"
            htmlFor="b-short"
            error={errors.shortName}
            hint={`Home-screen label, up to 12 characters. Rider app: “${tenantShortName("rider", shortName || "…")}”.`}
          >
            <Input
              id="b-short"
              maxLength={12}
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              aria-invalid={Boolean(errors.shortName)}
            />
          </Field>
          <Field label="Your link" htmlFor="b-link" hint="Can't be changed after signup.">
            <Input id="b-link" value={`chowlane.app/${tenant.slug}`} readOnly disabled />
          </Field>
        </FormSection>

        <FormSection
          title="Brand"
          description="Your color is used on buttons and highlights in all your apps."
        >
          <div className="flex items-center gap-4">
            <label
              htmlFor="b-logo"
              className="flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-card border border-dashed text-muted-foreground focus-within:ring-3 focus-within:ring-ring hover:border-zinc-400"
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL preview
                <img src={logo} alt="Logo" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              <input
                id="b-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setLogo(await toSmallDataUrl(f));
                }}
              />
            </label>
            <div className="text-sm">
              <p className="font-medium">Logo</p>
              <p className="text-[13px] text-muted-foreground">Square PNG or JPG.</p>
              {logo ? (
                <button
                  type="button"
                  onClick={() => setLogo("")}
                  className="text-[13px] underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <ColorPicker value={color} onChange={setColor} idPrefix="b" />
          <div className="flex items-center gap-3">
            <span
              className="rounded-control px-4 py-2 text-sm font-medium"
              style={{ background: color, color: readableTextColor(color) }}
            >
              Order now
            </span>
            <span className="text-[13px] text-muted-foreground">Button preview</span>
          </div>
        </FormSection>

        <FormSection
          title="Accepted IDs"
          description="What first-time customers can use to verify (BL-3.3a). A selfie holding the ID is always required."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {ID_TYPES.map((t) => (
              <Checkbox
                key={t}
                label={ID_TYPE_LABELS[t]}
                checked={ids.includes(t)}
                onChange={(on) => setIds((x) => (on ? [...x, t] : x.filter((i) => i !== t)))}
              />
            ))}
          </div>
          {errors.ids ? <p className="text-[13px] text-danger">{errors.ids}</p> : null}
        </FormSection>

        <SaveBar>
          <Button type="submit">Save changes</Button>
        </SaveBar>
      </form>
    </>
  );
}
