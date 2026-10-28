import type { ReactNode } from "react";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { Button } from "@/components/ui/button";
import { GithubMark, Icon } from "@/components/site/icon";
import { BotanicalScatter } from "@/components/brand/leaves";
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
    <div
      aria-hidden="true"
      className="relative h-72 overflow-hidden bg-[#f3fbf6] lg:absolute lg:inset-y-0 lg:right-0 lg:left-[22.5rem] lg:h-auto"
    >
      <img
        src="/landing/managed-hosting-stack.svg"
        alt=""
        className="absolute inset-0 h-full w-full origin-center scale-110 object-contain object-center"
      />
    </div>
  );
}

export function SourceAndHosting() {
  return (
    <section className="oc-section bg-canvas" aria-labelledby="source-heading">
      <div className="oc-wrap grid items-stretch gap-5 lg:grid-cols-2">
        <article
          id="open-source"
          className="@container relative overflow-hidden rounded-[28px] bg-[#0B3A2C] text-canvas @[32rem]:min-h-[31.5rem]"
        >
          <BotanicalScatter compact />
          <div className="relative z-10 flex min-h-0 flex-col justify-start px-7 py-8 sm:px-9 sm:py-10 @[32rem]:absolute @[32rem]:top-5 @[32rem]:bottom-5 @[32rem]:left-0 @[32rem]:w-[19.5rem] @[32rem]:px-0 @[32rem]:py-0 @[32rem]:pl-10 @[32rem]:pr-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">Open source</p>
            <h2
              id="source-heading"
              className="mt-3 text-[clamp(1.9rem,2.3vw,2.3rem)] leading-[1.12] font-bold tracking-[-0.04em] @[32rem]:text-[1.85rem]"
            >
              <span className="block whitespace-nowrap">Free &amp; open source</span>
              <span className="block">for everyone.</span>
            </h2>
            <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-white/78">
              Own your tools. Host them yourself. Contribute, customize and help build a
              better church tech ecosystem.
            </p>
            <div className="mt-7 @[32rem]:mt-auto @[32rem]:pt-0">
              <Button
                asChild
                className="h-11 w-fit gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0B3A2C] hover:bg-[#e7f8ee]"
              >
                <a href={site.github} target="_blank" rel="noopener noreferrer">
                  <GithubMark className="size-4" />
                  Available on GitHub
                  <Icon name="arrow" className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative z-0 mt-6 ml-7 h-[18.5rem] w-[calc(100%+2.5rem)] sm:ml-9 @[32rem]:absolute @[32rem]:top-5 @[32rem]:bottom-5 @[32rem]:left-[19.5rem] @[32rem]:ml-0 @[32rem]:mt-0 @[32rem]:h-auto @[32rem]:w-auto @[32rem]:right-[-14%]"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-l-[20px] border border-white/10 bg-[#071510] shadow-[-32px_24px_50px_-28px_rgba(0,0,0,0.75)]">
              <div className="flex items-center gap-5 border-b border-white/10 px-4 py-3 text-[12.5px] whitespace-nowrap text-white/45">
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
              <div className="grid min-h-0 flex-1 grid-cols-[128px_minmax(0,1fr)] text-[13px] leading-[1.65]">
                <ul className="border-r border-white/10 px-3 py-4 text-white/70">
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
                <ol className="min-w-0 overflow-hidden py-4 pr-8 font-mono text-[12.5px] text-[#E7FFF1]">
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
          className="relative overflow-hidden rounded-[28px] border border-line bg-white"
        >
          <div className="relative z-10 flex min-w-0 flex-col p-7 sm:p-9 lg:min-h-[31.5rem] lg:w-[22.5rem] lg:py-10 lg:pr-8 lg:pl-10">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-action uppercase">Managed hosting</p>
            <h2 className="mt-3 text-[clamp(1.75rem,2.1vw,2.15rem)] leading-[1.08] font-bold tracking-[-0.035em] text-ink">
              Focus on ministry.
              <br />
              We handle the infrastructure.
            </h2>
            <p className="mt-4 max-w-[32ch] text-[15px] leading-relaxed text-body">
              Prefer not to self-host? Use our managed hosting and let us take care of updates, backups and security.
            </p>
            <div className="mt-auto pt-8">
              <Button asChild className="h-11 rounded-full px-5 text-sm font-semibold hover:bg-forest">
                <TrackedLink href={site.hostingWaitlist} leadType="hosting_waitlist" location="hosting">
                  Join hosting waitlist
                  <Icon name="arrow" className="size-4" />
                </TrackedLink>
              </Button>
            </div>
          </div>
          <HostingArt />
        </article>
      </div>
    </section>
  );
}
