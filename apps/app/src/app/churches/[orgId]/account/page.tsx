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
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
      <p className="mt-2 text-sm text-body">Name, photo, and password for this account.</p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {saved === "password" ? <p className="mt-4 text-sm text-action">Password saved.</p> : null}
      <form action={updateProfile.bind(null, orgId)} className="mt-8 grid gap-4">
        <AvatarField current={person.image} />
        <label className="grid gap-1 text-sm font-medium">
          Name
          <Input name="name" required defaultValue={person.name} className="h-11" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <Input name="email" type="email" required defaultValue={person.email} className="h-11" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save profile</Button>
      </form>
      <form action={changePassword.bind(null, orgId)} className="mt-12 grid gap-3">
        <h2 className="text-lg font-semibold">Change password</h2>
        <label className="grid gap-1 text-sm font-medium">
          Current password
          <Input name="current" type="password" required autoComplete="current-password" className="h-11" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          New password
          <Input name="next" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Confirm new password
          <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save password</Button>
      </form>
    </main>
  );
}
