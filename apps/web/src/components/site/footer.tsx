import Image from "next/image";
import { CookieSettingsButton } from "@/components/analytics/cookie-settings";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#roadmap", label: "Roadmap" },
      { href: "#open-source", label: "Open source" },
      { href: "#hosting", label: "Hosting" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: site.github, label: "GitHub" },
      { href: site.earlyAccess, label: "Early access", leadType: "early_access" as const, location: "footer" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: site.license, label: "MIT license" },
    ],
  },
  {
    title: "Stay updated",
    links: [{ href: `mailto:${site.email}`, label: site.email }],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest-950 text-canvas">
      <div className="oc-wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
        <div>
          <Image
            src="/brand/lockup-white.svg"
            alt="OpenChurch"
            width={210}
            height={32}
            unoptimized
            className="h-8 w-auto"
          />
          <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-white/70">
            Open-source tools for local churches. Free for church use.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-xs font-semibold tracking-[0.14em] text-leaf uppercase">{column.title}</p>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {"leadType" in link && link.leadType ? (
                    <TrackedLink
                      href={link.href}
                      leadType={link.leadType}
                      location={link.location}
                      className="text-sm text-white/75 hover:text-white"
                    >
                      {link.label}
                    </TrackedLink>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-white/75 hover:text-white"
                      {...(link.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
              {column.title === "Legal" ? (
                <li>
                  <CookieSettingsButton className="text-sm text-white/75 hover:text-white" />
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
      </div>
      <div className="oc-wrap border-t border-white/10 py-5 text-xs text-white/55">
        <p>© 2026 OpenChurch</p>
      </div>
    </footer>
  );
}
