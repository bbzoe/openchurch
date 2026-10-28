import type { ReactNode } from "react";
import { AudioLines, BookOpen, Calendar, HandHeart, Languages, Video, type LucideIcon } from "lucide-react";
import { LiveViews } from "@/components/site/live-views";

const plan = [
  ["10:00", "Welcome", "Host"],
  ["10:05", "Announcements", "Host"],
  ["10:10", "Worship", "Team"],
];

const languages = [
  ["English", "🇬🇧", true],
  ["Polski", "🇵🇱", false],
  ["Español", "🇪🇸", false],
  ["Deutsch", "🇩🇪", false],
] as const;

const poll = [
  ["Opening song", "68%"],
  ["Response", "22%"],
  ["Instrumental", "10%"],
];

function Card({
  icon: Glyph,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <li className="flex h-full flex-col rounded-[22px] border border-line bg-white p-6">
      <span className="grid size-11 place-items-center rounded-2xl bg-accent text-action">
        <Glyph className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg leading-snug font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{text}</p>
      <div className="mt-5">{children}</div>
    </li>
  );
}

export function Features() {
  return (
    <section id="features" className="oc-section" aria-labelledby="features-heading">
      <div className="oc-wrap">
        <div className="grid items-end gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-action uppercase">Key features</p>
            <h2
              id="features-heading"
              className="mt-3 max-w-[16ch] text-[clamp(2rem,4vw,3.15rem)] leading-[1.05] font-bold tracking-[-0.03em]"
            >
              Everything you need for modern church services.
            </h2>
          </div>
          <p className="max-w-[38ch] text-base leading-relaxed text-body lg:justify-self-end lg:pb-1">
            The first release is a service run of show. The cards below are the direction, shown as concept previews.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card
            icon={Calendar}
            title="Plan services effortlessly"
            text="Create a timeline, assign people, and keep slides, notes and media on one order of service."
          >
            <ul className="space-y-2">
              {plan.map(([time, title, who]) => (
                <li key={time} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 rounded-xl bg-canvas px-3 py-2">
                  <span className="text-[11px] text-body">{time}</span>
                  <AudioLines className="size-3.5 text-action" strokeWidth={1.75} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{title}</span>
                    <span className="block text-[11px] text-body">{who}</span>
                  </span>
                  <span className="size-8 rounded-lg bg-gradient-to-br from-[#d8f8e8] to-[#147a4e]" />
                </li>
              ))}
            </ul>
          </Card>

          <Card
            icon={AudioLines}
            title="Songs and lyrics with chords"
            text="A chart for the team: lyrics, chords and notes stay attached to the moment in the service."
          >
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-sm font-semibold text-ink">Opening song</p>
              <div className="mt-3 flex gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-white px-2.5 py-1 text-action ring-1 ring-line">Lyrics</span>
                <span className="rounded-full px-2.5 py-1 text-body">Chords</span>
                <span className="rounded-full px-2.5 py-1 text-body">Notes</span>
              </div>
              <p className="mt-3 font-mono text-[11px] tracking-wide text-action">C &nbsp; G &nbsp; Am &nbsp; F</p>
              <div className="mt-2 space-y-2" aria-hidden="true">
                <div className="h-2 w-4/5 rounded-full bg-[#cfe8db]" />
                <div className="h-2 w-[92%] rounded-full bg-[#cfe8db]" />
                <div className="h-2 w-3/5 rounded-full bg-[#cfe8db]" />
              </div>
              <p className="mt-3 text-[11px] font-semibold text-body">Verse 1, key of G</p>
            </div>
          </Card>

          <Card
            icon={Languages}
            title="Real-time translations"
            text="The same moment, in the language people actually speak. Slides, the room, or the live stream."
          >
            <div className="rounded-2xl bg-canvas p-3">
              <p className="px-1 text-xs font-semibold text-ink">Language</p>
              <ul className="mt-2 space-y-1">
                {languages.map(([name, flag, on]) => (
                  <li
                    key={name}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-sm ${
                      on ? "bg-white font-semibold text-ink ring-1 ring-line" : "text-body"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{flag}</span>
                      {name}
                    </span>
                    {on ? <span className="text-action">✓</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card
            icon={Video}
            title="Live stream and multiple views"
            text="Switch between slides, camera and stream. One timeline for the room and for people online."
          >
            <LiveViews />
          </Card>

          <Card
            icon={HandHeart}
            title="Prayer, polls and participation"
            text="Collect prayer requests and run a short poll, on site or online, without a second app."
          >
            <div className="space-y-3 rounded-2xl bg-canvas p-3">
              <div className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-sm font-semibold text-ink">Prayer request</p>
                <p className="mt-1 text-xs text-body">Share a request with the prayer team.</p>
                <span className="mt-3 inline-flex rounded-full bg-action px-3 py-1 text-[11px] font-semibold text-white">
                  Send
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Which moment is next?</p>
                <ul className="mt-2 space-y-2">
                  {poll.map(([label, value]) => (
                    <li key={label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
                      <span className="text-body">{label}</span>
                      <span className="font-semibold text-ink">{value}</span>
                      <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white">
                        <span className="block h-full rounded-full bg-[#16B879]" style={{ width: value }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card
            icon={BookOpen}
            title="Sermons, media and calendar"
            text="Talks, recordings and the church calendar in one place, ready for the next Sunday."
          >
            <div className="rounded-2xl bg-canvas p-3">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-line">
                <span className="size-10 shrink-0 rounded-lg bg-gradient-to-br from-[#0F3D2E] to-[#86EFAC]" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">This Sunday</span>
                  <span className="block text-[11px] text-body">Message, with the speaker</span>
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-white px-2.5 py-1 text-action ring-1 ring-line">Summary</span>
                <span className="px-2 py-1 text-body">Transcript</span>
                <span className="px-2 py-1 text-body">Notes</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-body">
                A short summary sits with the recording, so the team can find it later.
              </p>
            </div>
          </Card>
        </ul>
      </div>
    </section>
  );
}
