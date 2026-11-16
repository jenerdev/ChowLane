"use client";

import { useState } from "react";
import {
  Button,
  Field,
  FormSection,
  MapPicker,
  NumberInput,
  PageHeader,
  SaveBar,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

/** S-115 — service area: center pin + radius (OWN-010, BL-7.6). */
export default function AreaSettings() {
  return (
    <RequirePermission perm="settings.business">
      <Area />
    </RequirePermission>
  );
}

function Area() {
  const { settings, tenant, base } = useConsole();
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  const [center, setCenter] = useState(settings.serviceArea.center);
  const [radius, setRadius] = useState<number | undefined>(settings.serviceArea.radiusKm);
  const valid = radius !== undefined && radius >= 1 && radius <= 30;

  return (
    <>
      <PageHeader back={{ href: `${base}/settings`, label: "Settings" }} title="Delivery area" />
      <FormSection
        title="Area"
        description={
          settings.deliveryFee?.mode === "PER_BARANGAY"
            ? "You charge per barangay, so only listed barangays can order. This area is still used for the map and rider search."
            : "Customers outside this circle can't order. Tap the map to move the center."
        }
      >
        <MapPicker
          center={center}
          radiusKm={valid ? radius : undefined}
          onPick={setCenter}
          color={tenant.primaryColor}
          className="h-80"
        />
        <Field label="Radius" htmlFor="a-radius" error={valid ? undefined : "Use 1 to 30 km."}>
          <NumberInput
            id="a-radius"
            value={radius}
            onChange={setRadius}
            suffix="km"
            min={1}
            max={30}
            className="max-w-40"
          />
        </Field>
      </FormSection>
      <SaveBar>
        <Button
          disabled={!valid}
          onClick={() => {
            setTenantRow("tenantSettings", {
              ...settings,
              serviceArea: { center, radiusKm: radius! },
            });
            toast("Delivery area saved");
          }}
        >
          Save changes
        </Button>
      </SaveBar>
    </>
  );
}
