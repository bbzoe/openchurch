import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { hasCapability } from "@/server/access";
import { createSong } from "@/server/actions";
import { getChurch, getMembership, listSongs } from "@/server/queries";

export default async function SongsPage({
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
  const songs = await listSongs(orgId);
  const canEdit = hasCapability(membership.role, membership.capabilities, "songs");
  const { error } = await searchParams;

  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Songs</h1>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {songs.length === 0 ? (
            <p className="mt-6 rounded-[22px] border border-line bg-white p-6 text-sm text-body">No songs yet.</p>
          ) : (
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {songs.map((item) => (
                <li key={item.id} className="py-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-body">
                    {item.arrangement?.name ?? "No arrangement"}
                    {item.arrangement?.key ? `, key of ${item.arrangement.key}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        {canEdit ? (
          <form action={createSong.bind(null, orgId)} className="mt-10 grid gap-3">
            <h2 className="text-lg font-semibold">Add a song</h2>
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input name="title" required className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Arrangement
              <input name="arrangement" placeholder="Default" className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Key
              <input name="key" placeholder="G" className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Lyrics
              <textarea name="lyrics" rows={5} className="rounded-xl border border-line px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Chords
              <textarea name="chords" rows={4} className="rounded-xl border border-line px-3 py-2 font-mono text-sm" />
            </label>
            <Button className="h-11 w-fit rounded-full px-5 font-semibold">Save song</Button>
          </form>
        ) : (
          <p className="text-sm text-body">You can read the library. Adding songs needs the songs permission.</p>
        )}
      </main>
    </>
  );
}
