import { notFound, redirect } from "next/navigation";
import { ServicePlan } from "@/components/service-plan";
import { getSessionUser } from "@/lib/session";
import { canReadPlan, hasCapability } from "@/server/access";
import { getChurch, getEvent, getMembership, listBlocks, listPeople } from "@/server/queries";

export default async function EventPlanPage({
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
  const people = await listPeople(orgId);

  return (
    <ServicePlan
      orgId={orgId}
      eventId={eventId}
      title={current.title}
      startsAt={current.startsAt.toISOString()}
      status={current.status}
      liveBlockId={current.liveBlockId}
      advance={current.advance === "auto" ? "auto" : "manual"}
      canPlan={hasCapability(membership.role, membership.capabilities, "plan")}
      canLive={hasCapability(membership.role, membership.capabilities, "live")}
      blocks={blocks.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        durationMinutes: item.durationMinutes,
        description: item.description,
        personIds: item.people.map((person) => person.personId),
        leaderCount: item.leaderCount,
      }))}
      people={people.map((person) => ({
        id: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(" "),
        firstName: person.firstName,
        lastName: person.lastName,
        role: person.roleName,
        image: person.image,
      }))}
      focusSlotId={slot ?? null}
    />
  );
}
