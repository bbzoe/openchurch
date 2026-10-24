import { notFound, redirect } from "next/navigation";
import { LiveRefresh } from "@/components/live-refresh";
import { getSessionUser } from "@/lib/session";
import { getChurch, getEvent, getLivePayload, getMembership } from "@/server/queries";

export default async function LivePage({
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
  if (membership.role === "sympathizer" && current.status !== "live") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Not live yet</h1>
        <p className="mt-3 text-body">This service is not open to the room.</p>
      </main>
    );
  }

  const payload = await getLivePayload(eventId);
  const live = payload?.live ?? null;

  return (
    <main className="min-h-full bg-forest px-6 py-10 text-ivory">
      <LiveRefresh />
      <p className="text-sm font-semibold tracking-wide text-leaf uppercase">{church.name}</p>
      <p className="mt-2 text-sm text-leaf">{current.title}</p>
      {current.status !== "live" || !live ? (
        <h1 className="mt-10 text-4xl font-bold tracking-tight sm:text-6xl">Waiting for the next moment.</h1>
      ) : (
        <article className="mt-10">
          <p className="text-sm font-semibold tracking-wide text-leaf uppercase">{live.kind}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">{live.title}</h1>
          {live.durationMinutes ? <p className="mt-3 text-leaf">{live.durationMinutes} min</p> : null}
          {live.people.length ? (
            <p className="mt-2 text-lg text-leaf">{live.people.map((person) => `${person.firstName} ${person.lastName}`).join(", ")}</p>
          ) : null}
          {live.description ? <p className="mt-6 text-2xl leading-relaxed">{live.description}</p> : null}
          <div className="mt-8 grid gap-8">
            {live.materials.map((material) => {
              const linked = payload?.songs.find((song) => song.id === material.songId);
              if (material.kind === "song") {
                return (
                  <section key={material.id}>
                    <h2 className="text-2xl font-semibold">{linked?.title ?? "Song"}</h2>
                    {linked?.arrangement?.key ? <p className="mt-1 text-leaf">Key of {linked.arrangement.key}</p> : null}
                    <pre className="mt-4 font-sans text-xl leading-relaxed whitespace-pre-wrap">
                      {linked?.arrangement?.lyrics || "No lyrics yet."}
                    </pre>
                    {linked?.arrangement?.chords ? (
                      <pre className="mt-4 font-mono text-base leading-relaxed whitespace-pre-wrap text-leaf">
                        {linked.arrangement.chords}
                      </pre>
                    ) : null}
                  </section>
                );
              }
              if (material.kind === "scripture") {
                return (
                  <section key={material.id}>
                    <h2 className="text-2xl font-semibold">{material.reference || "Scripture"}</h2>
                    <p className="mt-4 text-2xl leading-relaxed">{material.body}</p>
                  </section>
                );
              }
              return (
                <p key={material.id} className="text-2xl leading-relaxed">
                  {material.body}
                </p>
              );
            })}
          </div>
        </article>
      )}
    </main>
  );
}
