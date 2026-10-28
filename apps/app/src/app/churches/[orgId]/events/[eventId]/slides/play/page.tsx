import { notFound, redirect } from "next/navigation";
import { SlideShow } from "@/components/slide-show";
import { getSessionUser } from "@/lib/session";
import { parseSlotNotes } from "@/lib/slot-notes";
import { canReadPlan } from "@/server/access";
import { getChurch, getDeck, getEvent, getMembership, listBlocks } from "@/server/queries";

export default async function SlidePlayPage({
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
  if (!active) notFound();
  const deck = await getDeck(active.id);

  return (
    <SlideShow
      key={active.id}
      deck={deck}
      eyebrow={active.title}
      editHref={`/churches/${orgId}/events/${eventId}/slides?slot=${active.id}`}
    />
  );
}
