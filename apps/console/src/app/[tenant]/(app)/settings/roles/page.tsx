"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { PermissionKey, Role } from "@chowlane/types";
import { PERMISSION_GROUPS } from "@chowlane/lib";
import { toRole } from "@chowlane/db/mappers";
import {
  Badge,
  Button,
  Checkbox,
  ConfirmSheet,
  Field,
  Input,
  PageHeader,
  Sheet,
  SheetContent,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

const OWNER_ONLY: PermissionKey[] = ["admins.manage"];

/** S-119 — roles: named sets of permissions the Owner assigns to admins (OWN-008, BL-2.3). Live since 2.3. */
export default function RolesPage() {
  return (
    <RequirePermission perm="admins.manage">
      <Roles />
    </RequirePermission>
  );
}

function Roles() {
  const { live, base, supabase } = useConsole();
  const data = useLive(`roles:${live.id}`, async (sb) => {
    const [roles, staff] = await Promise.all([
      sb.from("roles").select("*").eq("tenant_id", live.id).order("name"),
      sb.from("staff_users").select("role_id").eq("tenant_id", live.id),
    ]);
    return { roles: must(roles).map(toRole), roleIds: must(staff).map((x) => x.role_id) };
  });
  const roles = data.data?.roles ?? [];
  const membersOf = (id: string) => (data.data?.roleIds ?? []).filter((r) => r === id).length;

  const [editing, setEditing] = useState<Role | "new" | null>(null);
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<PermissionKey[]>([]);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const open = (r: Role | "new") => {
    setEditing(r);
    setError(undefined);
    setName(r === "new" ? "" : r.name);
    setPerms(r === "new" ? ["orders.view"] : r.permissions);
  };

  async function save() {
    const n = name.trim();
    if (n.length < 2) return setError("Enter a role name.");
    if (
      roles.some(
        (r) =>
          r.name.toLowerCase() === n.toLowerCase() && (editing === "new" || r.id !== editing?.id),
      )
    )
      return setError("Another role has this name.");
    const { error } =
      editing === "new"
        ? await supabase.from("roles").insert({ tenant_id: live.id, name: n, permissions: perms })
        : await supabase
            .from("roles")
            .update({ name: n, permissions: perms })
            .eq("id", editing!.id);
    if (error)
      return setError(error.code === "23505" ? "Another role has this name." : error.message);
    toast("Role saved");
    setEditing(null);
    await data.reload();
  }

  const canDelete =
    editing && editing !== "new" && !editing.isDefault && membersOf(editing.id) === 0;

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings`, label: "Settings" }}
        title="Roles & permissions"
        description="You, the owner, can always do everything. Admins can only do what their role allows."
        actions={
          <Button onClick={() => open("new")}>
            <Plus /> New role
          </Button>
        }
      />
      <ul className="divide-y rounded-card border">
        {roles.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => open(r)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {r.name} {r.isDefault ? <Badge className="ml-1">Default</Badge> : null}
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  {r.permissions.length} permissions · {membersOf(r.id)}{" "}
                  {membersOf(r.id) === 1 ? "admin" : "admins"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent title={editing === "new" ? "New role" : "Edit role"} className="sm:max-w-lg">
          <form
            noValidate
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Field
              label="Role name"
              htmlFor="role-name"
              error={error}
              hint="E.g. Dispatcher, Verifier, Menu manager"
            >
              <Input
                id="role-name"
                value={name}
                onChange={(e) => (setName(e.target.value), setError(undefined))}
                aria-invalid={Boolean(error)}
              />
            </Field>
            {PERMISSION_GROUPS.map((g) => {
              const items = g.items.filter((i) => !OWNER_ONLY.includes(i.key));
              return items.length ? (
                <fieldset key={g.title} className="flex flex-col gap-3">
                  <legend className="mb-2 text-[13px] font-medium text-muted-foreground">
                    {g.title}
                  </legend>
                  {items.map((i) => (
                    <Checkbox
                      key={i.key}
                      label={i.label}
                      description={i.description}
                      checked={perms.includes(i.key)}
                      onChange={(on) =>
                        setPerms((p) => (on ? [...p, i.key] : p.filter((x) => x !== i.key)))
                      }
                    />
                  ))}
                </fieldset>
              ) : null;
            })}
            <p className="text-[13px] text-muted-foreground">
              Managing admins and roles is always owner-only.
            </p>
            <div className="flex gap-2">
              {editing && editing !== "new" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  disabled={!canDelete}
                  title={
                    canDelete ? undefined : "Default roles and roles with admins can't be deleted"
                  }
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              ) : null}
              <Button type="submit" className="ml-auto">
                {editing === "new" ? "Create role" : "Save"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this role?"
        confirmLabel="Delete role"
        destructive
        onConfirm={async () => {
          if (editing && editing !== "new") {
            const { error } = await supabase.from("roles").delete().eq("id", editing.id);
            toast(error ? error.message : "Role deleted");
            await data.reload();
          }
          setEditing(null);
        }}
      />
    </>
  );
}
