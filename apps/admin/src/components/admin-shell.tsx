import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/server/actions";
import { Button } from "@/components/button";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-line bg-canvas px-3 py-3 md:sticky md:top-0 md:h-svh md:w-56 md:border-r md:border-b-0 md:py-4">
        <Link href="/users" className="flex items-center gap-2 px-2">
          <Image src="/mark.svg" alt="" width={28} height={28} />
          <span className="font-semibold tracking-tight">Admin</span>
        </Link>
        <nav className="flex gap-1 md:grid">
          <Link href="/users" className="rounded-xl px-3 py-2 text-sm font-medium text-body hover:bg-white">
            Users
          </Link>
          <Link href="/organizations" className="rounded-xl px-3 py-2 text-sm font-medium text-body hover:bg-white">
            Organizations
          </Link>
        </nav>
        <form action={signOut} className="mt-auto">
          <Button variant="ghost" className="h-9 w-full justify-start px-2 text-body">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
