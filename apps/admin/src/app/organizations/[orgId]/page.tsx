import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, organization } from "@openchurch/db";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/button";
import { deleteOrganization, updateOrganization } from "@/server/actions";
import { requireOperator } from "@/server/guard";

export default async function EditOrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperator();
  const { orgId } = await params;
  const { error } = await searchParams;
  const rows = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  const church = rows[0];
  if (!church) notFound();

  return (
    <AdminShell title={church.name}>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <form action={updateOrganization.bind(null, orgId)} className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required defaultValue={church.name} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          City
          <input name="city" required defaultValue={church.city} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Country code
          <input name="countryCode" required maxLength={2} minLength={2} defaultValue={church.countryCode} className="h-11 rounded-xl border border-line px-3 uppercase" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Denomination
          <input name="denominationName" required defaultValue={church.denominationName} className="h-11 rounded-xl border border-line px-3" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save organization</Button>
      </form>
      <form action={deleteOrganization.bind(null, orgId)} className="mt-8">
        <Button variant="outline" className="h-11 rounded-full border-destructive px-5 text-destructive">
          Delete organization
        </Button>
      </form>
    </AdminShell>
  );
}
