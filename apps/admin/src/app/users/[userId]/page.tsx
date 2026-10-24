import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, user } from "@openchurch/db";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/button";
import { deleteUser, updateUser } from "@/server/actions";
import { requireOperator } from "@/server/guard";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const operator = await requireOperator();
  const { userId } = await params;
  const { error } = await searchParams;
  const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const person = rows[0];
  if (!person) notFound();

  return (
    <AdminShell title={person.name}>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <form action={updateUser.bind(null, userId)} className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required defaultValue={person.name} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required defaultValue={person.email} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          New password
          <input name="password" type="password" minLength={8} placeholder="Leave empty to keep the current one" className="h-11 rounded-xl border border-line px-3" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save user</Button>
      </form>
      {operator.id !== person.id ? (
        <form action={deleteUser.bind(null, userId)} className="mt-8">
          <Button variant="outline" className="h-11 rounded-full border-destructive px-5 text-destructive">
            Delete user
          </Button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-body">This is the account you are signed in with.</p>
      )}
    </AdminShell>
  );
}
