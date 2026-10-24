import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function AppHeader({
  churchName,
  orgId,
}: {
  churchName?: string;
  orgId?: string;
}) {
  return (
    <header className="border-b border-line bg-ivory/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/churches" className="flex items-center gap-2">
          <Image src="/mark.svg" alt="" width={28} height={28} />
          <span className="font-semibold tracking-tight">OpenChurch</span>
        </Link>
        {orgId ? (
          <nav className="flex items-center gap-4 text-sm font-medium text-body">
            <Link href={`/churches/${orgId}`}>{churchName ?? "Services"}</Link>
            <Link href={`/churches/${orgId}/songs`}>Songs</Link>
            <Link href={`/churches/${orgId}/people`}>People</Link>
          </nav>
        ) : null}
        <form action={signOut}>
          <Button variant="outline" className="h-9 rounded-full bg-white px-3">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
