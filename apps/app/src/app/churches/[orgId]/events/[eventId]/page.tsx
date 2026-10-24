import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { canReadPlan, hasCapability } from "@/server/access";
import { addBlock, addMaterial, endEvent, moveBlock, setLiveBlock } from "@/server/actions";
import { getChurch, getEvent, getMembership, listBlocks, listMembers, listSongs } from "@/server/queries";

const kinds = ["welcome", "worship", "announcement", "message", "prayer", "other"] as const;

export default async function EventPlanPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  const current = await getEvent(eventId);
  if (!membership || !church || !current || current.organizationId !== orgId) notFound();
  if (!canReadPlan(membership.role)) redirect(`/churches/${orgId}/events/${eventId}/live`);

  const blocks = await listBlocks(eventId);
  const people = await listMembers(orgId);
  const songs = await listSongs(orgId);
  const canPlan = hasCapability(membership.role, membership.capabilities, "plan");
  const canLive = hasCapability(membership.role, membership.capabilities, "live");

  return (
    <>
      <AppHeader churchName={church.name} orgId={orgId} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <p className="text-xs font-semibold tracking-wide text-action uppercase">{current.status}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-2 text-sm text-body">
            {current.startsAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/churches/${orgId}/events/${eventId}/live`} className="text-sm font-semibold text-action">
              Open live view
            </Link>
            {canLive && current.status === "live" ? (
              <form action={endEvent.bind(null, orgId, eventId)}>
                <Button variant="outline" className="h-9 rounded-full bg-white px-3">
                  End service
                </Button>
              </form>
            ) : null}
          </div>
          {blocks.length === 0 ? (
            <p className="mt-6 rounded-[22px] border border-line bg-white p-6 text-sm text-body">
              The run of show is empty. Add the first moment.
            </p>
          ) : (
            <ol className="mt-6 grid gap-3">
              {blocks.map((item, index) => (
                <li
                  key={item.id}
                  className={`rounded-[22px] border bg-white p-5 ${item.id === current.liveBlockId ? "border-action" : "border-line"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-action uppercase">{item.kind}</p>
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      <p className="text-sm text-body">{item.assigneeName ?? "No one assigned"}</p>
                    </div>
                    {canPlan ? (
                      <div className="flex gap-2">
                        <form action={moveBlock.bind(null, orgId, eventId, item.id, "up")}>
                          <Button variant="outline" disabled={index === 0} className="h-8 rounded-full bg-white px-3">
                            Up
                          </Button>
                        </form>
                        <form action={moveBlock.bind(null, orgId, eventId, item.id, "down")}>
                          <Button
                            variant="outline"
                            disabled={index === blocks.length - 1}
                            className="h-8 rounded-full bg-white px-3"
                          >
                            Down
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {item.materials.map((material) => {
                      const linked = songs.find((song) => song.id === material.songId);
                      return (
                        <li key={material.id} className="rounded-xl bg-canvas px-3 py-2 text-sm">
                          {material.kind === "song"
                            ? `${linked?.title ?? "Song"}${linked?.arrangement?.key ? `, key of ${linked.arrangement.key}` : ""}`
                            : material.kind === "scripture"
                              ? `${material.reference || "Scripture"}: ${material.body}`
                              : material.body || "Note"}
                        </li>
                      );
                    })}
                  </ul>
                  {canLive ? (
                    <form action={setLiveBlock.bind(null, orgId, eventId, item.id)} className="mt-3">
                      <Button className="h-9 rounded-full px-4 font-semibold">Set as now</Button>
                    </form>
                  ) : null}
                  {canPlan ? (
                    <form action={addMaterial.bind(null, orgId, eventId, item.id)} className="mt-3 grid gap-2">
                      <select name="kind" className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
                        <option value="note">Note</option>
                        <option value="scripture">Scripture</option>
                        <option value="song">Song</option>
                      </select>
                      <input name="reference" placeholder="John 3:16" className="h-10 rounded-xl border border-line px-3 text-sm" />
                      <textarea name="body" rows={2} placeholder="Note or passage" className="rounded-xl border border-line px-3 py-2 text-sm" />
                      <select name="songId" className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
                        <option value="">Song</option>
                        {songs.map((song) => (
                          <option key={song.id} value={song.id}>
                            {song.title}
                          </option>
                        ))}
                      </select>
                      <select name="arrangementId" className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
                        <option value="">Arrangement</option>
                        {songs.map((song) =>
                          song.arrangement ? (
                            <option key={song.arrangement.id} value={song.arrangement.id}>
                              {song.title}
                            </option>
                          ) : null,
                        )}
                      </select>
                      <Button variant="outline" className="h-9 w-fit rounded-full bg-white px-3">
                        Add material
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
        {canPlan ? (
          <form action={addBlock.bind(null, orgId, eventId)} className="h-fit rounded-[22px] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Add a moment</h2>
            <label className="mt-4 grid gap-1 text-sm font-medium">
              Title
              <input name="title" required className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Kind
              <select name="kind" className="h-11 rounded-xl border border-line bg-white px-3">
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Person
              <select name="assignee" className="h-11 rounded-xl border border-line bg-white px-3">
                <option value="">Unassigned</option>
                {people.map((person) => (
                  <option key={person.membershipId} value={person.membershipId}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <Button className="mt-4 h-11 rounded-full px-5 font-semibold">Add</Button>
          </form>
        ) : (
          <p className="text-sm text-body">You can read the plan. Changing it needs the plan permission.</p>
        )}
      </main>
    </>
  );
}
