import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ChurchForm } from "@/components/church-form";
import { getSessionUser } from "@/lib/session";
import { listMyChurches } from "@/server/queries";

export default async function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const churches = await listMyChurches(user.id);
  const { error } = await searchParams;

  return (
    <>
      <AppHeader />
      <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your churches</h1>
          <p className="mt-2 text-sm text-body">A church is the home for services, songs, and people.</p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {churches.length === 0 ? (
          <p className="rounded-[22px] border border-line bg-white p-6 text-sm text-body">
            You are not in a church yet. Start one, or ask an administrator to add your email.
          </p>
        ) : (
          <ul className="grid gap-3">
            {churches.map((church) => (
              <li key={church.organizationId}>
                <a
                  href={`/churches/${church.organizationId}`}
                  className="flex items-center justify-between rounded-[22px] border border-line bg-white px-5 py-4"
                >
                  <span className="font-semibold">{church.name}</span>
                  <span className="text-xs font-semibold tracking-wide text-action uppercase">{church.role}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <ChurchForm />
      </main>
    </>
  );
}
