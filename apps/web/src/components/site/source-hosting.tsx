import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GithubMark, Icon } from "@/components/site/icon";
import { site } from "@/lib/site";

const files = ["src", "components", "services", "mobile", "docs"];

function Caret() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5 shrink-0 text-white/45" aria-hidden="true">
      <path d="M4 2.5 8 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Branch() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <circle cx="4" cy="3.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="12.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="6.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 4.9v6.2M4 8.2c0-2 8-2.8 8-1.7" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Kw({ children }: { children: ReactNode }) {
  return <span className="text-[#7EE2A8]">{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="text-[#F0A0C8]">{children}</span>;
}

function Str({ children }: { children: ReactNode }) {
  return <span className="text-[#F2C4DE]">{children}</span>;
}

function CodeLine({ n, children }: { n: number; children?: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.6rem_1fr] gap-2 whitespace-pre">
      <span className="text-right text-white/30">{n}</span>
      <span>{children || " "}</span>
    </li>
  );
}

function HostingArt() {
  return (
    <div className="relative min-h-[280px] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_50%,#d7f8e8_0%,#f7fdf9_72%)]" />
      <svg viewBox="70 50 400 360" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMaxYMid meet">
        <ellipse cx="150" cy="310" rx="100" ry="72" fill="#E7FBF2" />
        <ellipse cx="390" cy="340" rx="120" ry="84" fill="#D5F6E7" />
        <ellipse cx="430" cy="200" rx="70" ry="48" fill="#EAFBF4" />
        <ellipse cx="250" cy="118" rx="78" ry="52" fill="#0E4A38" />
        <ellipse cx="196" cy="136" rx="52" ry="40" fill="#14624A" />
        <ellipse cx="312" cy="132" rx="58" ry="42" fill="#0C3D2E" />
        <g>
          <rect x="132" y="292" width="230" height="54" rx="12" fill="#0A3A2C" />
          <rect x="132" y="292" width="230" height="18" rx="12" fill="#157A58" />
          <circle cx="156" cy="326" r="3.2" fill="#BBF7D0" />
          <circle cx="170" cy="326" r="3.2" fill="#86EFAC" opacity="0.55" />
          <rect x="118" y="230" width="258" height="58" rx="14" fill="#0C4534" />
          <rect x="118" y="230" width="258" height="20" rx="14" fill="#1A8A62" />
          <circle cx="144" cy="268" r="3.4" fill="#D1FAE5" />
          <circle cx="158" cy="268" r="3.4" fill="#86EFAC" opacity="0.6" />
          <rect x="104" y="164" width="286" height="64" rx="16" fill="#0E4F3C" />
          <rect x="104" y="164" width="286" height="22" rx="16" fill="#1C9A6C" />
          <circle cx="132" cy="206" r="3.6" fill="#ECFDF5" />
          <circle cx="148" cy="206" r="3.6" fill="#86EFAC" opacity="0.7" />
        </g>
        <image href="/brand/mark.svg" x="198" y="70" width="110" height="110" />
      </svg>
    </div>
  );
}

export function SourceAndHosting() {
  return (
    <section className="oc-section bg-canvas" aria-labelledby="source-heading">
      <div className="oc-wrap grid items-stretch gap-5 lg:grid-cols-2">
        <article
          id="open-source"
          className="relative flex items-center overflow-hidden rounded-[28px] bg-[#0B3A2C] p-7 text-canvas sm:p-9 lg:p-11"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url('/landing/footer-botanical-dark.svg')] bg-cover opacity-30"
          />
          <div className="relative grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(280px,1.18fr)]">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">Open source</p>
              <h2
                id="source-heading"
                className="mt-3 max-w-[10ch] text-[clamp(2.1rem,3.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.035em]"
              >
                Free &amp; open source for everyone.
              </h2>
              <p className="mt-4 max-w-[32ch] text-[15px] leading-relaxed text-white/78">
                Own your tools. Host them yourself. Contribute, customize and help build a
                better church tech ecosystem.
              </p>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-white"
              >
                <span className="grid size-11 place-items-center rounded-full bg-white text-[#0B3A2C]">
                  <GithubMark className="size-5" />
                </span>
                Available on GitHub
                <Icon name="arrow" className="size-4" />
              </a>
            </div>

            <div
              aria-hidden="true"
              className="overflow-hidden rounded-[18px] border border-white/10 bg-[#071510] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.85)]"
            >
              <div className="flex items-center gap-4 border-b border-white/10 px-3.5 py-2.5 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1.5 border-b-2 border-[#7EE2A8] pb-1 font-semibold text-[#7EE2A8]">
                  <Icon name="code" className="size-3.5" />
                  Code
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded-full border border-current" />
                  Issues
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Branch />
                  Pull requests
                </span>
              </div>
              <div className="grid min-w-0 grid-cols-[104px_minmax(0,1fr)] text-[11px] leading-[1.55]">
                <ul className="border-r border-white/10 px-2.5 py-3 text-white/70">
                  <li className="flex items-center gap-1 font-semibold text-white">
                    <Caret />
                    openchurch/
                  </li>
                  {files.map((file) => (
                    <li key={file} className="flex items-center gap-1 pl-3">
                      <Caret />
                      {file}
                    </li>
                  ))}
                  <li className="pl-5 text-white/40">...</li>
                </ul>
                <ol className="min-w-0 overflow-hidden py-3 pr-3 font-mono text-[10px] text-[#E7FFF1] sm:text-[11px]">
                  <CodeLine n={1}>
                    <Kw>import</Kw>
                    {" { Service }"}
                  </CodeLine>
                  <CodeLine n={2}>
                    <Kw>from</Kw>
                    <Str>{' "./services"'}</Str>
                  </CodeLine>
                  <CodeLine n={3} />
                  <CodeLine n={4}>
                    <Kw>export function</Kw>
                    {" Run() {"}
                  </CodeLine>
                  <CodeLine n={5}>
                    {"  "}
                    <Kw>return</Kw>
                    {" ("}
                  </CodeLine>
                  <CodeLine n={6}>
                    {"    "}
                    <Tag>{"<div>"}</Tag>
                  </CodeLine>
                  <CodeLine n={7}>
                    {"      "}
                    <Tag>{"<h1>"}</Tag>
                    Service
                    <Tag>{"</h1>"}</Tag>
                  </CodeLine>
                  <CodeLine n={8}>
                    {"      "}
                    <Tag>{"<Timeline />"}</Tag>
                  </CodeLine>
                  <CodeLine n={9}>
                    {"    "}
                    <Tag>{"</div>"}</Tag>
                  </CodeLine>
                  <CodeLine n={10}>{"  )"}</CodeLine>
                  <CodeLine n={11}>{"}"}</CodeLine>
                </ol>
              </div>
            </div>
          </div>
        </article>

        <article
          id="hosting"
          className="grid overflow-hidden rounded-[28px] border border-line bg-white lg:grid-cols-[minmax(0,0.95fr)_minmax(200px,1.05fr)]"
        >
          <div className="flex flex-col p-7 sm:p-9 lg:py-10 lg:pr-0 lg:pl-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-action uppercase">Managed hosting</p>
            <h2 className="mt-3 text-[clamp(1.85rem,2.5vw,2.55rem)] leading-[1.05] font-bold tracking-[-0.035em] text-ink">
              Focus on ministry.
              <br />
              We handle the infrastructure.
            </h2>
            <p className="mt-4 max-w-[32ch] text-[15px] leading-relaxed text-body">
              Prefer not to self-host? Use our managed hosting and let us take care of updates, backups and security.
            </p>
            <div className="mt-auto pt-8">
              <Button asChild className="h-11 rounded-full px-5 text-sm font-semibold hover:bg-forest">
                <a href={site.hostingWaitlist}>
                  Join hosting waitlist
                  <Icon name="arrow" className="size-4" />
                </a>
              </Button>
            </div>
          </div>
          <HostingArt />
        </article>
      </div>
    </section>
  );
}
