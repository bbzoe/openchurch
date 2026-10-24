const github = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/bbzoe/openchurch";

export const site = {
  name: "OpenChurch",
  url: "https://openchurch.dev",
  email: "hello@openchurch.dev",
  description:
    "Open-source tools that help churches plan a service, keep the team in sync, and stay connected on site and online. Free for churches. Join early access.",
  github,
  earlyAccess:
    process.env.NEXT_PUBLIC_EARLY_ACCESS_URL ??
    "mailto:hello@openchurch.dev?subject=Early%20access",
  hostingWaitlist:
    process.env.NEXT_PUBLIC_HOSTING_WAITLIST_URL ??
    "mailto:hello@openchurch.dev?subject=Hosting%20waitlist",
  license: `${github}/blob/HEAD/LICENSE`,
} as const;
