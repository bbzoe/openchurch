import { notFound, redirect } from "next/navigation";
import { SongEditor } from "@/components/song-editor";
import { getSessionUser } from "@/lib/session";
import { hasCapability } from "@/server/access";
import { getChurch, getMembership, getSong } from "@/server/queries";

export default async function SongPage({ params }: { params: Promise<{ orgId: string; songId: string }> }) {
  const { orgId, songId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  if (!membership || !church) notFound();
  const current = await getSong(orgId, songId);
  if (!current) notFound();
  const canEdit = hasCapability(membership.role, membership.capabilities, "songs");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SongEditor orgId={orgId} songId={current.id} canEdit={canEdit} initial={current} />
    </main>
  );
}
