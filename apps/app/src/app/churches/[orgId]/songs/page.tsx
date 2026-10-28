import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { hasCapability } from "@/server/access";
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
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
        {canEdit ? (
          <Button asChild className="h-10 px-4">
            <Link href={`/churches/${orgId}/songs/new`}>Add a song</Link>
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {songs.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">No songs yet.</p>
      ) : (
        <ul className="grid gap-2">
          {songs.map((item) => {
            const key = item.defaultKey || item.arrangements.find((arrangement) => arrangement.key)?.key;
            return (
              <li key={item.id}>
                <Link href={`/churches/${orgId}/songs/${item.id}`} className="block rounded-2xl bg-card px-4 py-3">
                  <p className="font-medium">
                    {item.songbookNumber ? `${item.songbookNumber}. ` : ""}
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.sections.map((section) => section.label).join(" · ") || "No sections"}
                    {key ? (
                      <Badge variant="secondary" className="ml-2">
                        {key}
                      </Badge>
                    ) : null}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {canEdit ? null : (
        <p className="text-sm text-body">You can read the library. Adding songs needs the songs permission.</p>
      )}
    </main>
  );
}
