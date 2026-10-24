"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/server/actions";
import { Button } from "@/components/ui/button";

type Church = {
  organizationId: string;
  name: string;
  city: string;
  role: string;
};

export function AppSidebar({
  orgId,
  churchName,
  city,
  churches,
  userName,
  userImage,
  children,
}: {
  orgId: string;
  churchName: string;
  city: string;
  churches: Church[];
  userName: string;
  userImage?: string | null;
  children: ReactNode;
}) {
  const path = usePathname();
  if (path.endsWith("/live")) return children;

  const home = `/churches/${orgId}`;
  const item = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-white text-ink" : "text-body hover:bg-white/70"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-line bg-canvas px-3 py-3 md:sticky md:top-0 md:h-svh md:w-60 md:border-r md:border-b-0 md:py-4">
        <Link href={home} className="flex items-center gap-2 px-2">
          <Image src="/mark.svg" alt="" width={28} height={28} />
          <span className="font-semibold tracking-tight">OpenChurch</span>
        </Link>
        <nav className="flex gap-1 md:grid">
          {item(home, "Events", path === home || path.includes("/events/"))}
          {item(`${home}/people`, "People", path.endsWith("/people") || path.endsWith("/setup"))}
          {item(`${home}/songs`, "Songs", path.endsWith("/songs"))}
          {item(`${home}/account`, "Profile", path.endsWith("/account"))}
        </nav>
        <div className="mt-auto border-t border-line pt-3">
          <Link href={`${home}/account`} className="mb-2 flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/80">
            {userImage ? (
              <Image src={userImage} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-semibold">{userName.slice(0, 1)}</span>
            )}
            <span className="truncate text-sm font-medium">{userName}</span>
          </Link>
          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-xl px-2 py-2 hover:bg-white/80 [&::-webkit-details-marker]:hidden">
              <span className="block truncate text-sm font-semibold">{churchName}</span>
              <span className="block truncate text-xs text-body">{city}</span>
            </summary>
            <div className="absolute top-full right-0 left-0 z-20 mt-2 w-full min-w-56 rounded-2xl border border-line bg-white p-2 shadow-lg md:top-auto md:bottom-full md:mt-0 md:mb-2">
              {churches.map((church) => (
                <Link
                  key={church.organizationId}
                  href={`/churches/${church.organizationId}`}
                  className={`block rounded-xl px-3 py-2 text-sm ${church.organizationId === orgId ? "bg-canvas font-semibold" : "hover:bg-canvas"}`}
                >
                  <span className="block truncate">{church.name}</span>
                  <span className="block truncate text-xs text-body">{church.city}</span>
                </Link>
              ))}
              <Link href="/churches/new" className="mt-1 block rounded-xl px-3 py-2 text-sm font-semibold text-action hover:bg-canvas">
                Register a church
              </Link>
            </div>
          </details>
          <form action={signOut} className="mt-1">
            <Button variant="ghost" className="h-9 w-full justify-start px-2 text-body">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
