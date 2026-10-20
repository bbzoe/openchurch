const modules = [
  {
    title: "Plan nabożeństwa",
    description:
      "Przejrzysta kolejność elementów: powitanie, uwielbienie, kazanie, pieśni, ogłoszenia. Liderzy widzą, co jest teraz i co następne.",
    status: "W przygotowaniu",
  },
  {
    title: "Odprawa i synchronizacja",
    description:
      "Jedna wspólna „tablica” dla zespołu prowadzącego, żeby nic nie umknęło w trakcie spotkania.",
    status: "W przygotowaniu",
  },
  {
    title: "Moduły na przyszłość",
    description:
      "Teksty pieśni, slajdy, tłumaczenia fragmentów biblijnych, ankiety i więcej pod marką openchurch.dev.",
    status: "Wizja",
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
              Open source · darmowe dla kościołów
            </p>
            <h1
              className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
            >
              Porządek w nabożeństwie, bez chaosu w zespole
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
              Budujemy narzędzia dla lokalnych wspólnot: na start plan i
              podgląd dla liderów, potem moduły web i mobile pod jednym
              brandem. Projekt utrzymujemy z darowizn, bez opłat za użycie
              kościelne.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <span
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white"
              >
                Wkrótce pierwsza wersja
              </span>
              <a
                href="mailto:hello@openchurch.dev"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:border-accent"
              >
              Napisz do nas
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2
              className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Od czego zaczynamy
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Punkt wyjścia: konta dla liderów i przejrzysty przebieg
              nabożeństwa. Reszta modułów dojdzie wraz z potrzebami
              wspólnot.
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
              Dla kościoła, nie dla zysku
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Kod na licencji open source. Korzystanie dla wspólnot
              kościelnych bez abonamentu. Jeśli projekt Ci pomaga, w
              przyszłości będzie można wesprzeć go darowizną na rozwój
              infrastruktury i nowych modułów.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <p>© 2026 OpenChurch</p>
          <p>
            Landing na{" "}
            <a href="https://openchurch.dev" className="text-accent">
              openchurch.dev
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
