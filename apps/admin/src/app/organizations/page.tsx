import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/button";
import { createOrganization } from "@/server/actions";
import { requireOperator } from "@/server/guard";
import { adminOverview } from "@/server/queries";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperator();
  const data = await adminOverview();
  const { error } = await searchParams;

  return (
    <AdminShell title="Organizations">
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {data.churches.length === 0 ? (
        <p className="text-sm text-body">No organizations yet.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {data.churches.map((church) => (
            <li key={church.id}>
              <Link href={`/organizations/${church.id}`} className="block py-4">
                <span className="block font-semibold">{church.name}</span>
                <span className="text-sm text-body">
                  {church.city}, {church.countryCode}. {church.denominationName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form action={createOrganization} className="mt-10 grid gap-3">
        <h2 className="text-lg font-semibold">Add an organization</h2>
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          City
          <input name="city" required className="h-11 rounded-xl border border-line px-3" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Country code
          <input name="countryCode" required maxLength={2} minLength={2} placeholder="PL" className="h-11 rounded-xl border border-line px-3 uppercase" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Denomination
          <input name="denominationName" required className="h-11 rounded-xl border border-line px-3" />
        </label>
        <Button className="h-11 w-fit rounded-full px-5 font-semibold">Create organization</Button>
      </form>
    </AdminShell>
  );
}
