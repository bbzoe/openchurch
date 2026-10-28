import { notFound, redirect } from "next/navigation";
import { EventsBoard } from "@/components/events-board";
import { getSessionUser } from "@/lib/session";
import { canReadPlan, hasCapability } from "@/server/access";
import { getChurch, getMembership, listEventPlans } from "@/server/queries";

export default async function ChurchHome({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string; view?: string; scale?: string; date?: string }>;
}) {
  const { orgId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  if (!membership || !church) notFound();
  const events = await listEventPlans(orgId);
  const visible = canReadPlan(membership.role) ? events : events.filter((item) => item.status === "live");
  const query = await searchParams;
  const scale = query.scale === "week" || query.scale === "day" ? query.scale : "month";
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : "";

  return (
    <EventsBoard
      orgId={orgId}
      events={visible}
      canPlan={hasCapability(membership.role, membership.capabilities, "plan")}
      sympathizer={membership.role === "sympathizer"}
      error={query.error}
      view={query.view === "calendar" ? "calendar" : "list"}
      scale={scale}
      date={date}
    />
  );
}
