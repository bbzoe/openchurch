import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
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
    <>
      <AppHeader churchName={church.name} orgId={orgId} />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="mt-2 text-sm text-body">One list for the room. The live moment is the same for everyone.</p>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {visible.length === 0 ? (
            <p className="mt-6 rounded-[22px] border border-line bg-white p-6 text-sm text-body">
              {canReadPlan(membership.role)
                ? "No services yet."
                : "When a service is live, it will show up here."}
            </p>
          ) : (
            <ul className="mt-6 grid gap-3">
              {visible.map((item) => (
                <li key={item.id}>
                  <a
                    href={
                      membership.role === "sympathizer"
                        ? `/churches/${orgId}/events/${item.id}/live`
                        : `/churches/${orgId}/events/${item.id}`
                    }
                    className="block rounded-[22px] border border-line bg-white px-5 py-4"
                  >
                    <span className="text-xs font-semibold tracking-wide text-action uppercase">
                      {item.status} · {item.kind}
                    </span>
                    <span className="mt-1 block text-lg font-semibold">{item.title}</span>
                    <span className="text-sm text-body">
                      {item.startsAt.toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        {canPlan ? (
          <form action={createEvent.bind(null, orgId)} className="h-fit rounded-[22px] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">New service or gathering</h2>
            <label className="mt-4 grid gap-1 text-sm font-medium">
              Title
              <input name="title" required className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Starts
              <input name="startsAt" type="datetime-local" required className="h-11 rounded-xl border border-line px-3" />
            </label>
            <label className="mt-3 grid gap-1 text-sm font-medium">
              Kind
              <select name="kind" className="h-11 rounded-xl border border-line bg-white px-3">
                <option value="service">Service</option>
                <option value="gathering">Gathering</option>
              </select>
            </label>
            <Button className="mt-4 h-11 rounded-full px-5 font-semibold">Create</Button>
          </form>
        ) : null}
      </main>
    </>
  );
}
