import { notFound, redirect } from "next/navigation";
import { TeamEditor } from "@/components/team-editor";
import { getSessionUser } from "@/lib/session";
import { ensureStarterRoles } from "@/server/actions";
import { getChurch, getMembership, listPeople, listRoles } from "@/server/queries";

export default async function SetupPage({
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
  const people = await listPeople(orgId);
  const { error } = await searchParams;

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <TeamEditor orgId={orgId} roles={roles} people={people} error={error} mode="setup" />
      </main>
    </>
  );
}
