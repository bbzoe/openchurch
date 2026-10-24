import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { capabilities, hasCapability } from "@/server/access";
import { addMember } from "@/server/actions";
import { getChurch, getMembership, listMembers } from "@/server/queries";

export default async function PeoplePage({
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
  const people = await listMembers(orgId);
  const canEdit = hasCapability(membership.role, membership.capabilities, "people");
  const { error } = await searchParams;

  return (
    <>
      <AppHeader churchName={church.name} orgId={orgId} />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <ul className="mt-6 grid gap-3">
            {people.map((person) => (
              <li key={person.membershipId} className="rounded-[22px] border border-line bg-white p-5">
                <p className="font-semibold">{person.name}</p>
                <p className="text-sm text-body">{person.email}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-action uppercase">
                  {person.role}
                  {person.capabilities.length ? ` · ${person.capabilities.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
        {canEdit ? (
          <form action={addMember.bind(null, orgId)} className="grid h-fit gap-3 rounded-[22px] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Add or update someone</h2>
            <p className="text-sm text-body">They need an OpenChurch account first. Use the same email.</p>
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input name="email" type="email" required className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Role
              <select name="role" className="h-11 rounded-xl border border-line bg-white px-3">
                <option value="sympathizer">Sympathizer</option>
                <option value="member">Member</option>
                <option value="ministry">Ministry</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <fieldset className="grid gap-2 text-sm">
              <legend className="font-medium">Ministry permissions</legend>
              {capabilities.map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input type="checkbox" name={item} />
                  {item}
                </label>
              ))}
            </fieldset>
            <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save person</Button>
          </form>
        ) : (
          <p className="text-sm text-body">Only people with the people permission can change roles.</p>
        )}
      </main>
    </>
  );
}
