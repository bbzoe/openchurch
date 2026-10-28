import { notFound, redirect } from "next/navigation";
import { SongEditor } from "@/components/song-editor";
import { emptySong } from "@/lib/song-text";
import { getSessionUser } from "@/lib/session";
import { hasCapability } from "@/server/access";
import { getChurch, getMembership } from "@/server/queries";

export default async function NewSongPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  if (!membership || !church) notFound();
  if (!hasCapability(membership.role, membership.capabilities, "songs")) redirect(`/churches/${orgId}/songs`);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add a song</h1>
      <SongEditor orgId={orgId} songId={null} canEdit initial={emptySong()} />
    </main>
  );
}
