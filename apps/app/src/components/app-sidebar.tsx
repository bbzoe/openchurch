"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronUp, CircleUser, Music, Users } from "lucide-react";
import { signOut } from "@/server/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const links = [
    { href: home, label: "Events", icon: CalendarDays, active: path === home || path.includes("/events/") },
    { href: `${home}/people`, label: "People", icon: Users, active: path.endsWith("/people") || path.endsWith("/setup") },
    { href: `${home}/songs`, label: "Songs", icon: Music, active: path.endsWith("/songs") },
    { href: `${home}/account`, label: "Profile", icon: CircleUser, active: path.endsWith("/account") },
  ];

  return (
    <div className="flex min-h-svh bg-ivory md:flex-row flex-col">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-canvas px-3 py-4 md:sticky md:top-0 md:h-svh md:w-60 md:border-r md:border-b-0">
        <Link href={home} className="flex items-center gap-2 px-2">
          <Image src="/mark.svg" alt="" width={28} height={28} />
          <span className="font-semibold tracking-tight">OpenChurch</span>
        </Link>
        <nav className="grid gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${link.active ? "bg-white font-semibold text-ink shadow-sm" : "text-body hover:bg-white/70"}`}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/80">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{churchName}</span>
                <span className="block truncate text-xs text-body">{city}</span>
              </span>
              <ChevronUp className="size-4 text-body" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              {churches.map((church) => (
                <DropdownMenuItem key={church.organizationId} className="p-0">
                  <Link href={`/churches/${church.organizationId}`} className="block w-full px-2 py-1.5">
                    <span className="block truncate font-medium">{church.name}</span>
                    <span className="block truncate text-xs text-body">{church.city}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0">
                <Link href="/churches/new" className="block w-full px-2 py-1.5 font-medium text-action">
                  Register a church
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`${home}/account`} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/80">
            {userImage ? (
              <Image src={userImage} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-semibold">{userName.slice(0, 1)}</span>
            )}
            <span className="truncate text-sm">{userName}</span>
          </Link>
          <form action={signOut}>
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
