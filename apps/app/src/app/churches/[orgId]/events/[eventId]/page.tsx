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
      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-2 text-sm text-body">
            {current.startsAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
            <span className="capitalize">, {current.status}</span>
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
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {blocks.map((item) => {
              const open = selected?.id === item.id;
              const names = item.people.map((person) => `${person.firstName} ${person.lastName}`).join(", ");
              return (
                <li key={item.id} className={`border-l-2 ${open ? "border-action bg-white" : "border-transparent"}`}>
                  <a href={`?section=${item.id}`} className="block px-4 py-3">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-sm text-body">{item.durationMinutes ? `${item.durationMinutes} min` : ""}</span>
                    </span>
                    <span className="mt-1 block text-sm text-body">{names || "No one yet"}</span>
                  </a>
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
          <form action={updateSection.bind(null, orgId, eventId, selected.id)} className="h-fit lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold">{selected.title}</h2>
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
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {canPlan ? <Button className="h-11 rounded-full px-5 font-semibold">Save section</Button> : null}
              {canLive ? (
                <button formAction={setLiveBlock.bind(null, orgId, eventId, selected.id)} className="text-sm font-semibold text-action">
                  Set as now
                </button>
              ) : null}
              {canPlan ? (
                <>
                  <button formAction={moveBlock.bind(null, orgId, eventId, selected.id, "up")} className="text-sm text-body">
                    Move up
                  </button>
                  <button formAction={moveBlock.bind(null, orgId, eventId, selected.id, "down")} className="text-sm text-body">
                    Move down
                  </button>
                </>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="text-sm text-body">This event has no sections yet.</p>
        )}
      </main>
    </>
  );
}
