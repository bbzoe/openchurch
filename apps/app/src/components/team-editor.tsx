"use client";

import { useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Plus, X } from "lucide-react";
import { addPerson, updatePerson } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = { id: string; name: string };
type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  image: string | null;
  roleId: string;
  roleName: string;
};

const pageSize = 10;

const washes = [
  ["#0f3d2e", "#86efac"],
  ["#116b4e", "#bbf7d0"],
  ["#14532d", "#6ee7b7"],
  ["#1e3a34", "#fde68a"],
  ["#134e4a", "#a7f3d0"],
  ["#3f6212", "#d9f99d"],
];

function wash(name: string) {
  let index = 0;
  for (const char of name) index = (index + char.charCodeAt(0)) % washes.length;
  return washes[index];
}

function initials(firstName: string, lastName: string) {
  return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() || "?";
}

async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not read the photo");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function PersonPhoto({
  firstName,
  lastName,
  image,
  onChange,
  size = "size-10",
}: {
  firstName: string;
  lastName: string;
  image: string;
  onChange?: (value: string) => void;
  size?: string;
}) {
  const [from, to] = wash(`${firstName}${lastName}`);
  const [error, setError] = useState<string | null>(null);
  const face = (
    <span
      className={`grid ${size} place-items-center overflow-hidden rounded-full text-sm font-medium text-white`}
      style={image ? undefined : { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {image ? <img src={image} alt="" className="size-full object-cover" /> : initials(firstName, lastName)}
    </span>
  );
  if (!onChange) return face;
  return (
    <div>
      <label className="cursor-pointer">
        {face}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            setError(null);
            try {
              const data = await shrink(file);
              if (data.length > 180000) {
                setError("Too large");
                return;
              }
              onChange(data);
            } catch {
              setError("Could not use that photo");
            }
          }}
        />
      </label>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function TeamEditor({
  orgId,
  roles,
  people,
  error,
  mode,
}: {
  orgId: string;
  roles: Role[];
  people: Person[];
  error?: string;
  mode: "setup" | "people";
}) {
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("all");
  const [emailFilter, setEmailFilter] = useState("any");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [image, setImage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      const name = `${person.firstName} ${person.lastName}`.toLowerCase();
      const matchesQuery =
        !needle ||
        name.includes(needle) ||
        (person.email ?? "").toLowerCase().includes(needle) ||
        person.roleName.toLowerCase().includes(needle);
      const matchesRole = roleId === "all" || person.roleId === roleId;
      const matchesEmail =
        emailFilter === "any" || (emailFilter === "yes" ? Boolean(person.email) : !person.email);
      return matchesQuery && matchesRole && matchesEmail;
    });
  }, [people, query, roleId, emailFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const from = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(filtered.length, safePage * pageSize + pageSize);

  function openAdd() {
    setEditing(null);
    setImage("");
    setOpen(true);
  }

  function openEdit(person: Person) {
    setEditing(person);
    setImage(person.image ?? "");
    setOpen(true);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{mode === "setup" ? "Add your team" : "People"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Name and role are enough. Email and a photo can wait.</p>
        </div>
        <Button type="button" className="h-10 cursor-pointer px-4" onClick={openAdd}>
          <Plus className="size-4" />
          Add person
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search name, email, or role"
          aria-label="Search people"
          className="h-10 max-w-sm bg-card"
        />
        <select
          value={roleId}
          aria-label="Filter by role"
          onChange={(event) => {
            setRoleId(event.target.value);
            setPage(0);
          }}
          className="h-10 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          value={emailFilter}
          aria-label="Filter by email"
          onChange={(event) => {
            setEmailFilter(event.target.value);
            setPage(0);
          }}
          className="h-10 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="any">Any email</option>
          <option value="yes">Has email</option>
          <option value="no">No email</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {people.length === 0 ? "No one yet." : "No people match."}
                </td>
              </tr>
            ) : (
              rows.map((person) => (
                <tr key={person.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <PersonPhoto firstName={person.firstName} lastName={person.lastName} image={person.image ?? ""} />
                      <span className="font-medium">
                        {person.firstName} {person.lastName}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">{person.roleName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{person.email || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="cursor-pointer text-sm font-medium text-primary" onClick={() => openEdit(person)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {from}-{to} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 cursor-pointer bg-card px-3" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Previous
          </Button>
          <span>
            {safePage + 1} / {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9 cursor-pointer bg-card px-3"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      {mode === "setup" && people.length > 0 ? (
        <a href={`/churches/${orgId}`} className="inline-flex h-10 w-fit items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Continue
        </a>
      ) : null}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {editing ? "Edit person" : "Add person"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="grid size-8 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent" aria-label="Close">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <form
              key={editing?.id ?? "new"}
              className="mt-4 grid gap-3"
              action={async (formData) => {
                if (editing) await updatePerson(orgId, editing.id, formData);
                else {
                  formData.set("next", mode);
                  await addPerson(orgId, formData);
                }
                setOpen(false);
              }}
            >
              <PersonPhoto
                firstName={editing?.firstName ?? ""}
                lastName={editing?.lastName ?? ""}
                image={image}
                onChange={setImage}
                size="size-16"
              />
              <input type="hidden" name="image" value={image} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="firstName" required defaultValue={editing?.firstName ?? ""} aria-label="First name" placeholder="First name" className="h-10 bg-ivory" />
                <Input name="lastName" required defaultValue={editing?.lastName ?? ""} aria-label="Last name" placeholder="Last name" className="h-10 bg-ivory" />
              </div>
              <select name="roleId" defaultValue={editing?.roleId ?? roles[0]?.id ?? ""} aria-label="Role" className="h-10 cursor-pointer rounded-lg border border-input bg-ivory px-3 text-sm">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Input name="email" type="email" defaultValue={editing?.email ?? ""} aria-label="Email" placeholder="Email, optional" className="h-10 bg-ivory" />
              <Button className="h-10 w-fit cursor-pointer px-4">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
