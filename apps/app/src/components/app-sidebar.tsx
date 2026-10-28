"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronsUpDown, Music, Users } from "lucide-react";
import { churchFavicon } from "@/lib/church-icon";
import { signOut } from "@/server/actions";
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
  website: string | null;
};

export function AppSidebar({
  orgId,
  churchName,
  city,
  website,
  churches,
  userName,
  userImage,
  children,
}: {
  orgId: string;
  churchName: string;
  city: string;
  website: string | null;
  churches: Church[];
  userName: string;
  userImage?: string | null;
  children: ReactNode;
}) {
  const path = usePathname();
  if (path.endsWith("/live") || path.endsWith("/play")) return children;

  const home = `/churches/${orgId}`;
  const links = [
    { href: home, label: "Events", icon: CalendarDays, active: path === home || path.includes("/events/") },
    { href: `${home}/people`, label: "People", icon: Users, active: path.endsWith("/people") || path.endsWith("/setup") },
    { href: `${home}/songs`, label: "Songs", icon: Music, active: path.includes("/songs") },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-canvas md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-sidebar px-3 py-4 text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-60">
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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${link.active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"}`}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent">
              {userImage ? (
                <Image src={userImage} alt="" width={32} height={32} unoptimized className="size-8 rounded-full object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  {userName.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{userName}</span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem className="p-0">
                <Link href={`${home}/account`} className="block w-full px-2 py-1.5">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0">
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full cursor-pointer px-2 py-1.5 text-left">
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end px-6 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex max-w-xs cursor-pointer items-center gap-2 rounded-full bg-card px-3 py-1.5 text-left">
              <ChurchMark name={churchName} website={website} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{churchName}</span>
                <span className="block truncate text-xs text-muted-foreground">{city}</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {churches.map((church) => (
                <DropdownMenuItem key={church.organizationId} className="p-0">
                  <Link href={`/churches/${church.organizationId}`} className="flex w-full items-center gap-2 px-2 py-1.5">
                    <ChurchMark name={church.name} website={church.website} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{church.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{church.city}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0">
                <Link href={`${home}/settings`} className="block w-full px-2 py-1.5">
                  Church settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0">
                <Link href="/churches/new" className="block w-full px-2 py-1.5">
                  Register a church
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function ChurchMark({ name, website }: { name: string; website: string | null }) {
  const src = churchFavicon(website);
  if (!src) {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
        {name.slice(0, 1)}
      </span>
    );
  }
  return <img src={src} alt="" className="size-8 shrink-0 rounded-lg bg-ivory object-contain p-1" />;
}
