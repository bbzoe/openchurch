import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/button";
import { getSessionUser } from "@/lib/session";
import { signOut } from "@/server/actions";
import { adminOverview, isPlatformAdmin } from "@/server/queries";

export default async function AdminHome() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const allowed = await isPlatformAdmin(user.id);
  if (!allowed) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl font-bold">No access</h1>
        <p className="mt-3 text-sm text-body">This account is not an OpenChurch operator.</p>
        <form action={signOut} className="mt-6">
          <Button variant="outline" className="h-10 bg-white">
            Sign out
          </Button>
        </form>
      </main>
    );
  }

  const data = await adminOverview();

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/mark.svg" alt="" width={28} height={28} />
            <span className="font-semibold">OpenChurch admin</span>
          </div>
          <form action={signOut}>
            <Button variant="outline" className="h-9 bg-white">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-[22px] border border-line bg-white p-5">
            <span className="text-sm text-body">Churches</span>
            <span className="mt-1 block text-3xl font-bold">{data.churchCount}</span>
          </p>
          <p className="rounded-[22px] border border-line bg-white p-5">
            <span className="text-sm text-body">Accounts</span>
            <span className="mt-1 block text-3xl font-bold">{data.userCount}</span>
          </p>
        </div>
        <section>
          <h1 className="text-2xl font-bold">Churches</h1>
          {data.churches.length === 0 ? (
            <p className="mt-3 text-sm text-body">No churches yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {data.churches.map((church) => (
                <li key={church.id} className="rounded-[22px] border border-line bg-white p-5">
                  <p className="font-semibold">{church.name}</p>
                  <p className="text-sm text-body">
                    {church.city}, {church.countryCode} · {church.denominationName}
                  </p>
                  <p className="mt-1 text-xs font-semibold tracking-wide text-action uppercase">
                    {church.members} {church.members === 1 ? "person" : "people"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-2xl font-bold">Accounts</h2>
          <ul className="mt-4 grid gap-3">
            {data.people.map((person) => (
              <li key={person.id} className="rounded-[22px] border border-line bg-white px-5 py-4">
                <p className="font-semibold">{person.name}</p>
                <p className="text-sm text-body">
                  {person.email} · {person.churches} {person.churches === 1 ? "church" : "churches"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
