import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChurchForm } from "@/components/church-form";
import { getSessionUser } from "@/lib/session";

export default async function NewChurchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid max-w-xl gap-8 px-4 py-10">
      <Link href="/" className="flex w-fit items-center gap-2">
        <Image src="/mark.svg" alt="" width={28} height={28} />
        <span className="font-semibold tracking-tight">OpenChurch</span>
      </Link>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ChurchForm />
    </main>
  );
}
