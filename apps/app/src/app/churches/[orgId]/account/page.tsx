import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db, user } from "@openchurch/db";
import { AvatarField } from "@/components/avatar-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionUser } from "@/lib/session";
import { changePassword, updateProfile } from "@/server/account";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { orgId } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/sign-in");
  const rows = await db.select().from(user).where(eq(user.id, sessionUser.id)).limit(1);
  const person = rows[0];
  if (!person) notFound();
  const { error, saved } = await searchParams;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Name, photo, and password for this account.</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved === "password" ? <p className="text-sm text-primary">Password saved.</p> : null}
      <form action={updateProfile.bind(null, orgId)} className="grid gap-4 rounded-2xl bg-card p-4">
        <AvatarField current={person.image} />
        <label className="grid gap-1 text-sm font-medium">
          Name
          <Input name="name" required defaultValue={person.name} className="h-10 bg-ivory" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <Input name="email" type="email" required defaultValue={person.email} className="h-10 bg-ivory" />
        </label>
        <Button className="h-10 w-fit px-4">Save profile</Button>
      </form>
      <form action={changePassword.bind(null, orgId)} className="grid gap-3 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-semibold">Change password</h2>
        <label className="grid gap-1 text-sm font-medium">
          Current password
          <Input name="current" type="password" required autoComplete="current-password" className="h-10 bg-ivory" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          New password
          <Input name="next" type="password" required minLength={8} autoComplete="new-password" className="h-10 bg-ivory" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Confirm new password
          <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="h-10 bg-ivory" />
        </label>
        <Button className="h-10 w-fit px-4">Save password</Button>
      </form>
    </main>
  );
}
