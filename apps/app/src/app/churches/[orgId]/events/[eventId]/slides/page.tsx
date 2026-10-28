import { notFound, redirect } from "next/navigation";
import { SlideDeck } from "@/components/slide-deck";
import { getSessionUser } from "@/lib/session";
import { parseSlotNotes } from "@/lib/slot-notes";
import { canReadPlan, hasCapability } from "@/server/access";
import { getChurch, getDeck, getEvent, getMembership, listBlocks, listSongs } from "@/server/queries";

export default async function SlidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { orgId, eventId } = await params;
  const { slot } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  const current = await getEvent(eventId);
  if (!membership || !church || !current || current.organizationId !== orgId) notFound();
  if (!canReadPlan(membership.role)) redirect(`/churches/${orgId}/events/${eventId}/live`);

  const blocks = await listBlocks(eventId);
  const slots = blocks.filter((item) => !parseSlotNotes(item.description).break);
  const active = slots.find((item) => item.id === slot) ?? slots[0];
  if (!slots.length || !active) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Add a section on the plan first.</p>
      </main>
    );
  }

  const [deck, songs] = await Promise.all([getDeck(active.id), listSongs(orgId)]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-6">
      <SlideDeck
        key={active.id}
        orgId={orgId}
        eventId={eventId}
        blockId={active.id}
        slotTitle={active.title}
        planHref={`/churches/${orgId}/events/${eventId}?slot=${active.id}`}
        playHref={`/churches/${orgId}/events/${eventId}/slides/play?slot=${active.id}`}
        songsHref={`/churches/${orgId}/songs`}
        canEdit={hasCapability(membership.role, membership.capabilities, "plan")}
        initialDeck={deck}
        songs={songs}
        slots={slots.map((item) => ({ id: item.id, title: item.title }))}
      />
    </main>
  );
}
