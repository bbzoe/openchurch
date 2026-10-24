"use client";

const links = [
  { href: "#features", label: "Platform" },
  { href: "#roles", label: "For churches" },
  { href: "#open-source", label: "Open source" },
  { href: "#hosting", label: "Hosting" },
  { href: "#roadmap", label: "Roadmap" },
];

export function MobileNav() {
  return (
    <details className="relative lg:hidden">
      <summary className="cursor-pointer list-none rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-forest [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <nav
        aria-label="Mobile"
        className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-line bg-white p-2 shadow-lg"
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
