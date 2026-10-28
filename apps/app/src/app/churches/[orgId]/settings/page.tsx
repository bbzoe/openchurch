import { notFound, redirect } from "next/navigation";
import { addRole, ensureStarterRoles, renameRole, updateChurchWebsite } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionUser } from "@/lib/session";
import { getChurch, getMembership, listRoles } from "@/server/queries";

export default async function ChurchSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  if (!membership || !church) notFound();
  await ensureStarterRoles(orgId);
  const roles = await listRoles(orgId);
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Church settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{church.name}. Roles are used when you add people.</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Website</h2>
        <form action={updateChurchWebsite.bind(null, orgId)} className="flex gap-2">
          <Input
            name="website"
            defaultValue={church.website ?? ""}
            placeholder="https://kosciol.pl"
            aria-label="Website"
            className="h-10 flex-1 bg-card"
          />
          <Button className="h-10 cursor-pointer px-4">Save</Button>
        </form>
        <p className="text-sm text-muted-foreground">The church menu uses the website icon until you have a logo.</p>
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Roles</h2>
        {roles.map((role) => (
          <form key={role.id} action={renameRole.bind(null, orgId, role.id)} className="flex gap-2">
            <Input name="name" required defaultValue={role.name} aria-label="Role name" className="h-10 flex-1 bg-card" />
            <Button variant="outline" className="h-10 cursor-pointer bg-card px-3">
              Rename
            </Button>
          </form>
        ))}
        <form action={addRole.bind(null, orgId)} className="flex gap-2">
          <Input name="name" required placeholder="New role" aria-label="New role" className="h-10 flex-1 bg-card" />
          <Button className="h-10 cursor-pointer px-4">Add role</Button>
        </form>
      </section>
    </main>
  );
}
