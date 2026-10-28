import Image from "next/image";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/site/icon";
import { MobileNav } from "@/components/site/mobile-nav";
import { site } from "@/lib/site";

const links = [
  { href: "#features", label: "Platform" },
  { href: "#roles", label: "For churches" },
  { href: "#open-source", label: "Open source" },
  { href: "#hosting", label: "Hosting" },
  { href: "#roadmap", label: "Roadmap" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/90 backdrop-blur-md">
      <div className="oc-wrap flex h-16 items-center justify-between gap-4">
        <a href="#top" className="shrink-0 rounded-sm">
          <Image
            src="/brand/lockup.svg"
            alt="OpenChurch"
            width={225}
            height={34}
            priority
            unoptimized
            className="h-8 w-auto"
          />
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-body hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <MobileNav />
          <Button
            asChild
            className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-forest"
          >
            <TrackedLink href={site.earlyAccess} leadType="early_access" location="header">
              Join early access
              <Icon name="arrow" className="size-4" />
            </TrackedLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
