import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { canReadPlan, hasCapability } from "@/server/access";
import { createEvent } from "@/server/actions";
import { getChurch, getMembership, listEvents } from "@/server/queries";

export default async function ChurchHome({
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
  const events = await listEvents(orgId);
  const visible = canReadPlan(membership.role) ? events : events.filter((item) => item.status === "live");
  const { error } = await searchParams;
  const canPlan = hasCapability(membership.role, membership.capabilities, "plan");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Events</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-body">
        A new event opens with Welcome, Worship, Message, and Prayer. Change the sections after.
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {canPlan ? (
        <form action={createEvent.bind(null, orgId)} className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Title
            <input name="title" required placeholder="Sunday service" className="h-11 rounded-xl border border-line px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Starts
            <input name="startsAt" type="datetime-local" required className="h-11 rounded-xl border border-line px-3" />
          </label>
          <input type="hidden" name="kind" value="service" />
          <Button className="h-11 rounded-full px-5 font-semibold">Create</Button>
        </form>
      ) : null}
      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-body">
          {canReadPlan(membership.role) ? "No events yet." : "When a service is live, it will show up here."}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {visible.map((item) => (
            <li key={item.id}>
              <a
                href={
                  membership.role === "sympathizer"
                    ? `/churches/${orgId}/events/${item.id}/live`
                    : `/churches/${orgId}/events/${item.id}`
                }
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="text-sm text-body">
                    {item.startsAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </span>
                <span className="text-sm text-body capitalize">{item.status}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
