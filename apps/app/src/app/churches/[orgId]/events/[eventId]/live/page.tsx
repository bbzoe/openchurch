import { notFound, redirect } from "next/navigation";
import { LiveRefresh } from "@/components/live-refresh";
import { SlideShow } from "@/components/slide-show";
import { SongSlides } from "@/components/song-slides";
import { buildSlides } from "@/lib/song-text";
import { currentSlotId } from "@/lib/run-of-show";
import { getSessionUser } from "@/lib/session";
import { getChurch, getDeck, getEvent, getLivePayload, getMembership } from "@/server/queries";

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
  const timed =
    current.status === "live" && current.advance === "auto" && payload
      ? currentSlotId(payload.blocks, current.startsAt, new Date())
      : undefined;
  const live = timed === undefined ? (payload?.live ?? null) : (payload?.blocks.find((item) => item.id === timed) ?? null);
  const deck = current.status === "live" && live ? await getDeck(live.id) : [];
  if (current.status === "live" && live && deck.length) {
    return (
      <>
        <LiveRefresh />
        <SlideShow key={live.id} deck={deck} eyebrow={live.title} />
      </>
    );
  }

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
          {live.description && live.description !== "openchurch:break" ? <p className="mt-6 text-2xl leading-relaxed">{live.description}</p> : null}
          <div className="mt-8 grid gap-8">
            {live.materials.map((material) => {
              const linked = payload?.songs.find((song) => song.id === material.songId);
              if (material.kind === "song") {
                const chosen =
                  linked?.arrangements.find((item) => item.id === material.arrangementId) ?? linked?.arrangements[0];
                const slides = linked && chosen ? buildSlides(linked.sections, chosen) : [];
                const firstSong = live.materials.find((item) => item.kind === "song");
                return (
                  <SongSlides
                    key={material.id}
                    title={linked?.title ?? "Song"}
                    songKey={chosen?.key || linked?.defaultKey || ""}
                    slides={slides}
                    autoFocus={material.id === firstSong?.id}
                  />
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
