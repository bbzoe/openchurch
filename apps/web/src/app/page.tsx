const modules = [
  {
    title: "Service run-of-show",
    description:
      "A clear order of elements: welcome, worship, message, songs, announcements. Leaders see what is live now and what comes next.",
    status: "In progress",
  },
  {
    title: "Team sync",
    description:
      "One shared board for the service team so nothing slips during the gathering.",
    status: "In progress",
  },
  {
    title: "Future modules",
    description:
      "Song lyrics, slides, Bible passage translations, polls, and more under the openchurch.dev brand.",
    status: "Vision",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white"
              aria-hidden
            >
              OC
            </span>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                OpenChurch
              </p>
              <p className="text-xs text-muted">openchurch.dev</p>
            </div>
          </div>
          <a
            href="https://github.com/bbzoe/openchurch"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-16 pt-14 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-accent-soft),transparent)]"
            aria-hidden
          />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              Open source · free for churches
            </p>
            <h1
              className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
            >
              Clarity for your service, calm for your team
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
              Tools for local congregations: starting with a run-of-show and a
              leader view, then web and mobile modules under one brand. Sustained
              by donations, with no fees for church use.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <span
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white"
              >
                First release coming soon
              </span>
              <a
                href="mailto:hello@openchurch.dev"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:border-accent"
              >
                Get in touch
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2
              className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Where we start
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Leader accounts and a transparent service flow. Additional modules
              will follow as communities need them. The product will support
              multiple languages; this site is English-only for now.
            </p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {modules.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    {item.status}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-accent-soft/50 p-8 text-center sm:p-10">
            <h2
              className="font-[family-name:var(--font-display)] text-2xl font-semibold"
            >
              For the church, not for profit
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Open source code. Free for church communities to use. If OpenChurch
              helps you, you will be able to support hosting and new modules with
              voluntary donations later on.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <p>© 2026 OpenChurch</p>
          <p>
            <a href="https://openchurch.dev" className="text-accent">
              openchurch.dev
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
