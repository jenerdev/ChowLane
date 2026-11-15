"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { StaffUser } from "@chowlane/types";
import { isValidEmail } from "@chowlane/lib";
import {
  Avatar,
  Badge,
  Button,
  ConfirmSheet,
  Field,
  Input,
  PageHeader,
  Select,
  Sheet,
  SheetContent,
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { newId, useConsole } from "@/lib/use-console";

/** S-118 — admin users: invite, change role, turn off, remove (OWN-007). */
export default function AdminsPage() {
  return (
    <RequirePermission perm="admins.manage">
      <Admins />
    </RequirePermission>
  );
}

function Admins() {
  const { db, tenant, base, me } = useConsole();
  const insert = useMockStore((s) => s.insert);
  const patch = useMockStore((s) => s.patch);
  const remove = useMockStore((s) => s.remove);
  const roles = db.roles.filter((r) => r.tenantId === tenant.id);
  const staff = db.staff
    .filter((s) => s.tenantId === tenant.id)
    .sort((a, b) =>
      a.type === "OWNER" ? -1 : b.type === "OWNER" ? 1 : a.name.localeCompare(b.name),
    );

  const [editing, setEditing] = useState<StaffUser | "new" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  const open = (s: StaffUser | "new") => {
    setEditing(s);
    setErrors({});
    setName(s === "new" ? "" : s.name);
    setEmail(s === "new" ? "" : s.email);
    setRoleId(
      s === "new" ? (roles.find((r) => r.isDefault)?.id ?? roles[0]?.id ?? "") : (s.roleId ?? ""),
    );
    setActive(s === "new" ? true : s.status !== "INACTIVE");
  };

  function save() {
    if (editing === "new") {
      const e: typeof errors = {};
      if (name.trim().length < 2) e.name = "Enter their name.";
      if (!isValidEmail(email)) e.email = "Enter a valid email.";
      else if (staff.some((s) => s.email.toLowerCase() === email.trim().toLowerCase()))
        e.email = "This person is already on your team.";
      setErrors(e);
      if (Object.keys(e).length) return;
      insert("staff", {
        id: newId("s"),
        tenantId: tenant.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        type: "ADMIN",
        roleId,
        status: "INVITED",
        createdAt: new Date().toISOString(),
      });
      toast(`Invite sent to ${email.trim()}`);
    } else if (editing) {
      const status = active
        ? editing.status === "INACTIVE"
          ? "ACTIVE"
          : editing.status
        : "INACTIVE";
      patch("staff", editing.id, { roleId, status });
      toast("Admin updated");
    }
    setEditing(null);
  }

  const roleName = (id?: string) => roles.find((r) => r.id === id)?.name ?? "No role";

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings`, label: "Settings" }}
        title="Admins"
        description="People who help run your business. What they can do depends on their role."
        actions={
          <Button onClick={() => open("new")}>
            <Plus /> Invite
          </Button>
        }
      />
      <ul className="divide-y rounded-card border">
        {staff.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={s.type === "OWNER" || s.id === me?.id}
              onClick={() => open(s)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-subtle"
            >
              <Avatar name={s.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {s.name}
                  {s.id === me?.id ? (
                    <span className="font-normal text-muted-foreground"> (you)</span>
                  ) : null}
                </span>
                <span className="block truncate text-[13px] text-muted-foreground">{s.email}</span>
              </span>
              <span className="hidden text-[13px] text-muted-foreground sm:block">
                {s.type === "OWNER" ? "Owner" : roleName(s.roleId)}
              </span>
              {s.status === "INVITED" ? (
                <Badge tone="warning">Invited</Badge>
              ) : s.status === "INACTIVE" ? (
                <Badge>Off</Badge>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Change what each role can do in{" "}
        <Link
          href={`${base}/settings/roles`}
          className="underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          Roles & permissions
        </Link>
        .
      </p>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent
          title={editing === "new" ? "Invite an admin" : (editing?.name ?? "")}
          description={
            editing === "new" ? "They'll get an email to set a password." : editing?.email
          }
        >
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {editing === "new" ? (
              <>
                <Field label="Name" htmlFor="ad-name" error={errors.name}>
                  <Input
                    id="ad-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={Boolean(errors.name)}
                  />
                </Field>
                <Field label="Email" htmlFor="ad-email" error={errors.email}>
                  <Input
                    id="ad-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                  />
                </Field>
              </>
            ) : null}
            <Field label="Role" htmlFor="ad-role">
              <Select id="ad-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.permissions.length} permissions
                  </option>
                ))}
              </Select>
            </Field>
            {editing && editing !== "new" ? (
              <SwitchRow
                title="Can log in"
                description="Turn off to block access without removing them."
                control={
                  <Switch checked={active} onCheckedChange={setActive} aria-label="Can log in" />
                }
              />
            ) : null}
            <div className="flex gap-2 pt-2">
              {editing && editing !== "new" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove
                </Button>
              ) : null}
              {editing && editing !== "new" && editing.status === "INVITED" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast(`Invite sent again to ${editing.email}`)}
                >
                  Resend invite
                </Button>
              ) : null}
              <Button type="submit" className="ml-auto">
                {editing === "new" ? "Send invite" : "Save"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmSheet
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove this admin?"
        description="They lose access right away. Their past actions stay in the order history."
        confirmLabel="Remove admin"
        destructive
        onConfirm={() => {
          if (editing && editing !== "new") {
            remove("staff", editing.id);
            toast(`${editing.name} removed`);
          }
          setEditing(null);
        }}
      />
    </>
  );
}
