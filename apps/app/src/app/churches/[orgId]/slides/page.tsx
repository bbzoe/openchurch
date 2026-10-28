import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { parseSlotNotes } from "@/lib/slot-notes";
import { canReadPlan } from "@/server/access";
import { getChurch, getMembership, listEventPlans } from "@/server/queries";

const when = new Intl.DateTimeFormat("en", {
  timeZone: "Europe/Warsaw",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function ChurchSlidesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  if (!membership || !church) notFound();
  if (!canReadPlan(membership.role)) redirect(`/churches/${orgId}`);

  const events = await listEventPlans(orgId);
  const rows = events
    .map((event) => ({
      ...event,
      slots: event.blocks.filter((block) => !parseSlotNotes(block.description).break),
    }))
    .filter((event) => event.slots.length > 0)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Slides</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open a section to edit its slides. Songs come from the song library.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          <Link href={`/churches/${orgId}`} className="font-medium text-primary">
            Add a service
          </Link>{" "}
          and give it a section first.
        </p>
      ) : (
        <ul className="grid gap-4">
          {rows.map((event) => (
            <li key={event.id} className="rounded-2xl bg-card px-4 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">{event.title}</h2>
                <p className="shrink-0 text-sm text-muted-foreground">{when.format(new Date(event.startsAt))}</p>
              </div>
              <ul className="mt-3 grid gap-1">
                {event.slots.map((slot) => (
                  <li key={slot.id}>
                    <Link
                      href={`/churches/${orgId}/events/${event.id}/slides?slot=${slot.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-accent"
                    >
                      <span>{slot.title}</span>
                      <span className="text-muted-foreground">{slot.durationMinutes ? `${slot.durationMinutes} min` : "Slides"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
