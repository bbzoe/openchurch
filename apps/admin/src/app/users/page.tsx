import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/button";
import { createUser } from "@/server/actions";
import { requireOperator } from "@/server/guard";
import { adminOverview } from "@/server/queries";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperator();
  const data = await adminOverview();
  const { error } = await searchParams;

  return (
    <AdminShell title="Users">
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {data.people.length === 0 ? (
        <p className="text-sm text-body">No users yet.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {data.people.map((person) => (
            <li key={person.id}>
              <Link href={`/users/${person.id}`} className="flex items-baseline justify-between gap-4 py-4">
                <span>
                  <span className="block font-semibold">{person.name}</span>
                  <span className="text-sm text-body">{person.email}</span>
                </span>
                <span className="text-sm text-body">
                  {person.churches} {person.churches === 1 ? "church" : "churches"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form action={createUser} className="mt-10 grid gap-3">
        <h2 className="text-lg font-semibold">Add a user</h2>
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Password
          <input name="password" type="password" required minLength={8} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Create user</Button>
      </form>
    </AdminShell>
  );
}
