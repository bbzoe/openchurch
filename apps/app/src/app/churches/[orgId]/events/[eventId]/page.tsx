import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { canReadPlan, hasCapability } from "@/server/access";
import { addBlock, endEvent, moveBlock, setLiveBlock, updateSection } from "@/server/actions";
import { getChurch, getEvent, getMembership, listBlocks, listPeople } from "@/server/queries";

export default async function EventPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { orgId, eventId } = await params;
  const { section } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const membership = await getMembership(user.id, orgId);
  const church = await getChurch(orgId);
  const current = await getEvent(eventId);
  if (!membership || !church || !current || current.organizationId !== orgId) notFound();
  if (!canReadPlan(membership.role)) redirect(`/churches/${orgId}/events/${eventId}/live`);

  const blocks = await listBlocks(eventId);
  const people = await listPeople(orgId);
  const selected = blocks.find((item) => item.id === section) ?? blocks[0] ?? null;
  const canPlan = hasCapability(membership.role, membership.capabilities, "plan");
  const canLive = hasCapability(membership.role, membership.capabilities, "live");

  return (
    <>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-xs font-semibold tracking-wide text-action uppercase">{current.status}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-2 text-sm text-body">
            {current.startsAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            <Link href={`/churches/${orgId}/events/${eventId}/live`} className="font-semibold text-action">
              Open live view
            </Link>
            {canLive && current.status === "live" ? (
              <form action={endEvent.bind(null, orgId, eventId)}>
                <button className="font-semibold text-body">End service</button>
              </form>
            ) : null}
          </div>
          <ol className="mt-6 grid gap-2">
            {blocks.map((item, index) => {
              const open = selected?.id === item.id;
              const names = item.people.map((person) => `${person.firstName} ${person.lastName}`).join(", ");
              return (
                <li key={item.id} className={`rounded-[22px] border bg-white ${open ? "border-action" : "border-line"}`}>
                  <a href={`?section=${item.id}`} className="block px-4 py-3">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-xs text-body">{item.durationMinutes ? `${item.durationMinutes} min` : "No time"}</span>
                    </span>
                    <span className="mt-1 block text-sm text-body">{names || "No one assigned"}</span>
                  </a>
                  {open && canPlan ? (
                    <div className="flex gap-2 px-4 pb-3">
                      <form action={moveBlock.bind(null, orgId, eventId, item.id, "up")}>
                        <Button variant="outline" disabled={index === 0} className="h-8 rounded-full bg-white px-3">
                          Up
                        </Button>
                      </form>
                      <form action={moveBlock.bind(null, orgId, eventId, item.id, "down")}>
                        <Button variant="outline" disabled={index === blocks.length - 1} className="h-8 rounded-full bg-white px-3">
                          Down
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {canPlan ? (
            <form action={addBlock.bind(null, orgId, eventId)} className="mt-4 flex gap-2">
              <input name="title" required placeholder="New section" className="h-11 flex-1 rounded-xl border border-line bg-white px-3" />
              <input type="hidden" name="kind" value="other" />
              <Button className="h-11 rounded-full px-4 font-semibold">Add</Button>
            </form>
          ) : null}
        </section>
        {selected ? (
          <form action={updateSection.bind(null, orgId, eventId, selected.id)} className="h-fit rounded-[22px] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Section</h2>
            <label className="mt-4 grid gap-1 text-sm font-medium">
              Title
              <input name="title" required defaultValue={selected.title} className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Planned time (minutes)
              <input
                name="durationMinutes"
                type="number"
                min={1}
                defaultValue={selected.durationMinutes ?? ""}
                className="h-11 rounded-xl border border-line px-3"
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Description
              <textarea
                name="description"
                rows={4}
                defaultValue={selected.description}
                placeholder="Optional"
                className="rounded-xl border border-line px-3 py-2"
              />
            </label>
            <fieldset className="mt-4 grid gap-2">
              <legend className="text-sm font-medium">People</legend>
              {people.length === 0 ? (
                <p className="text-sm text-body">
                  <Link href={`/churches/${orgId}/people`} className="font-semibold text-action">
                    Add people
                  </Link>{" "}
                  before assigning them here.
                </p>
              ) : (
                people.map((person) => (
                  <label key={person.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="personId"
                      value={person.id}
                      defaultChecked={selected.people.some((item) => item.personId === person.id)}
                    />
                    {person.firstName} {person.lastName}
                    <span className="text-body">{person.roleName}</span>
                  </label>
                ))
              )}
            </fieldset>
            {canPlan ? <Button className="mt-5 h-11 rounded-full px-5 font-semibold">Save section</Button> : null}
            {canLive ? (
              <div className="mt-3">
                <button formAction={setLiveBlock.bind(null, orgId, eventId, selected.id)} className="text-sm font-semibold text-action">
                  Set as now
                </button>
              </div>
            ) : null}
          </form>
        ) : (
          <p className="text-sm text-body">This event has no sections yet.</p>
        )}
      </main>
    </>
  );
}
