import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/site/icon";
import { site } from "@/lib/site";

const nav = ["Services", "Songs", "Media", "People", "Events", "Settings"];

const rows = [
  { time: "10:00", title: "Welcome", meta: "Opening", owner: "Host" },
  { time: "10:05", title: "Announcements", meta: "Updates", owner: "Host" },
  { time: "10:12", title: "Worship", meta: "Lyrics and chords", owner: "Team", live: true },
  { time: "10:26", title: "Scripture", meta: "Psalm 23:1-6", owner: "Speaker" },
  { time: "10:32", title: "Message", meta: "Teaching", owner: "Speaker" },
  { time: "11:12", title: "Response", meta: "Prayer", owner: "Team" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/landing/hero-soft-mint.svg')] bg-cover bg-[position:right_center]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-0 size-[26rem] rounded-full bg-[#c9f6de] opacity-70 blur-3xl"
      />
      <div className="oc-wrap relative grid items-center gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:gap-8 lg:pt-16 lg:pb-24">
        <div className="max-w-[34rem]">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#128A4A] uppercase">
            Open source tools for the church
          </p>
          <h1 className="mt-3 text-[clamp(2.45rem,4.6vw,3.65rem)] leading-[1.02] font-bold tracking-[-0.04em] text-ink">
            One service.
            <br />
            Everyone <span className="text-[#128A4A]">in sync.</span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-[1.0625rem] leading-snug font-medium text-ink">
            Plan, lead, and experience church services together, in real time.
          </p>
          <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-body">
            OpenChurch is an open-source platform that helps churches plan services,
            manage content, and stay connected on site and online.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild className="h-11 rounded-full px-5 text-sm font-semibold hover:bg-forest">
              <a href={site.earlyAccess}>
                Join early access
                <Icon name="arrow" className="size-4" />
              </a>
            </Button>
            <a href="#features" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
              Explore the platform
              <Icon name="arrow" className="size-4" />
            </a>
          </div>
          <p className="mt-5 text-[13px] text-body">
            Built for churches. Open to everyone. First release in progress.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] pb-16 sm:pb-20 lg:pb-10">
          <p className="sr-only">
            Concept preview of a Sunday service plan on a laptop and a live scripture view on a
            phone. The product is not released yet.
          </p>
          <Laptop />
          <Phone />
        </div>
      </div>
    </section>
  );
}

function Laptop() {
  return (
    <div aria-hidden="true" className="relative aspect-[1208/700] w-full drop-shadow-[0_28px_40px_rgba(6,42,33,0.28)]">
      <Image
        src="/landing/devices/macbook-pro.png"
        alt=""
        width={1208}
        height={700}
        unoptimized
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="absolute top-[6.71%] right-[11.75%] bottom-[10.86%] left-[11.84%] overflow-hidden rounded-[4px] bg-[#f3f7f4]">
        <div className="grid h-full grid-cols-[72px_1fr] sm:grid-cols-[118px_1fr]">
            <div className="bg-[#073B2D] px-2 py-2.5 text-canvas sm:py-3">
              <div className="flex items-center gap-1.5">
                <Image src="/brand/mark.svg" alt="" width={16} height={16} unoptimized className="size-4 shrink-0" />
                <p className="hidden text-[11px] font-bold tracking-tight whitespace-nowrap sm:block">OpenChurch</p>
              </div>
              <p className="mt-4 text-[8px] font-semibold tracking-[0.16em] text-leaf/70 uppercase sm:text-[9px]">
                Workspace
              </p>
              <ul className="mt-2 space-y-0.5">
                {nav.map((item, index) => (
                  <li
                    key={item}
                    className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] sm:text-[11px] ${
                      index === 0 ? "bg-[#128A4A] font-semibold text-white" : "text-white/70"
                    }`}
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${index === 0 ? "bg-white" : "bg-leaf/70"}`} />
                    <span className="truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col p-2.5 sm:p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-ink sm:text-lg">Sunday Service</p>
                  <p className="mt-0.5 text-[10px] text-body sm:text-[11px]">Sun, 24 Nov, 10:00-11:30, Main hall</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E7F8EE] px-2 py-1 text-[9px] font-bold tracking-wide text-[#0F7A42] uppercase">
                  <span className="size-1.5 rounded-full bg-[#12A34A]" />
                  Live
                </span>
              </div>
              <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-white px-2 py-1.5 ring-1 ring-black/5 sm:mr-[18%] sm:px-2.5 sm:py-2">
                <p className="text-[11px] font-bold text-ink sm:text-xs">Run of show</p>
                <div className="mt-1.5 hidden grid-cols-[42px_1fr_4.25rem] gap-2 border-b border-line px-1 pb-1 text-[8px] font-semibold tracking-[0.14em] text-body/80 uppercase sm:grid">
                  <span>Time</span>
                  <span>Part</span>
                  <span>Owner</span>
                </div>
                <ul>
                  {rows.map((row) => (
                    <li
                      key={row.time}
                      className={`grid grid-cols-[32px_1fr] items-center gap-1.5 rounded-md px-1 py-0.5 sm:grid-cols-[38px_1fr_3.6rem] sm:py-1 ${
                        row.live ? "bg-[#E7F8EE]" : ""
                      }`}
                    >
                      <span className="text-[10px] text-body sm:text-[11px]">{row.time}</span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="hidden h-4 w-6 shrink-0 rounded-[4px] bg-gradient-to-br from-[#d8f8e8] to-[#147a4e] sm:block" />
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-semibold text-ink sm:text-[12px]">{row.title}</span>
                          <span className="block truncate text-[9px] text-body sm:text-[10px]">{row.meta}</span>
                        </span>
                      </span>
                      <span className="hidden truncate text-right text-[10px] text-body sm:block">{row.owner}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function Phone() {
  return (
    <div
      aria-hidden="true"
      className="absolute right-[1%] bottom-[6%] aspect-[726/1444] w-[34%] max-w-[210px] min-w-[118px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)] sm:w-[30%]"
    >
      <div className="absolute top-[3.19%] right-[6.89%] bottom-[3.19%] left-[6.89%] overflow-hidden bg-gradient-to-b from-[#0E4A36] to-[#062A21] px-2.5 pt-5 pb-2 text-canvas">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-semibold sm:text-[11px]">Sunday Service</p>
            <span className="rounded-full bg-[#128A4A] px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white">
              LIVE
            </span>
          </div>
          <p className="mt-3 text-[8px] font-semibold tracking-[0.16em] text-leaf/80 uppercase">Right now</p>
          <p className="mt-1 text-[15px] leading-none font-bold sm:text-base">Scripture</p>
          <p className="mt-1 text-[10px] text-white/75">Psalm 23:1-6</p>
          <div className="mt-2.5 rounded-xl bg-[#135C44] px-2.5 py-3">
            <p className="text-[8px] font-semibold tracking-[0.14em] text-[#9EF3C1] uppercase">Slide 04 / 08</p>
            <p className="mt-2 text-[12px] leading-tight font-semibold">Scripture reading</p>
            <p className="mt-1 text-[10px] leading-snug text-white/80">The current slide appears here live.</p>
          </div>
          <p className="mt-3 hidden text-[8px] font-semibold tracking-[0.14em] text-white/60 uppercase sm:block">
            Choose your view
          </p>
          <div className="mt-1.5 hidden grid-cols-3 gap-1 sm:grid">
            {["Slides", "Camera", "Stream"].map((view, index) => (
              <span
                key={view}
                className={`rounded-lg py-1 text-center text-[9px] font-semibold ${
                  index === 0 ? "bg-[#DBFDE9] text-[#07533C]" : "bg-white/10 text-white/80"
                }`}
              >
                {view}
              </span>
            ))}
          </div>
          <p className="mt-2.5 hidden text-[8px] font-semibold tracking-[0.14em] text-white/60 uppercase sm:block">
            Language
          </p>
          <div className="mt-1.5 hidden items-center gap-1.5 text-[9px] font-semibold sm:flex">
            <span className="rounded-md bg-[#DBFDE9] px-1.5 py-1 text-[#07533C]">EN</span>
            <span className="px-1 text-white/55">PL</span>
            <span className="px-1 text-white/55">ES</span>
            <span className="px-1 text-white/55">DE</span>
          </div>
      </div>
      <Image
        src="/landing/devices/iphone-x.png"
        alt=""
        width={726}
        height={1444}
        unoptimized
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}
