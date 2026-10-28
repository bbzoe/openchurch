"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseSlotNotes } from "@/lib/slot-notes";
import { createEvent } from "@/server/actions";

type PlanBlock = {
  id: string;
  title: string;
  durationMinutes: number | null;
  description: string;
};

type PlanEvent = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  blocks: PlanBlock[];
};

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function ymd(date: Date) {
  return dayFormat.format(date);
}

function addDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + amount));
  return next.toISOString().slice(0, 10);
}

function mondayOf(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
  const fromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(day, -fromMonday);
}

function monthLabel(day: string) {
  const [year, month] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, date)),
  );
}

function minutesOf(iso: string) {
  const parts = clockFormat.formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function clock(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isBreak(description: string) {
  return parseSlotNotes(description).break;
}

function segments(item: PlanEvent) {
  if (item.blocks.length === 0) {
    return [{ id: item.id, title: item.title, start: minutesOf(item.startsAt), minutes: 30, break: false, color: "", timed: true, placeholder: true }];
  }
  let cursor = minutesOf(item.startsAt);
  return item.blocks.map((block) => {
    const minutes = block.durationMinutes ?? 15;
    const segment = {
      ...block,
      start: cursor,
      minutes,
      break: isBreak(block.description),
      color: parseSlotNotes(block.description).color,
      timed: block.durationMinutes != null,
      placeholder: false,
    };
    cursor += minutes;
    return segment;
  });
}

function eventEnd(item: PlanEvent) {
  return minutesOf(item.startsAt) + item.blocks.reduce((sum, block) => sum + (block.durationMinutes ?? 15), 0);
}

type BoardView = "list" | "calendar";
type BoardScale = "month" | "week" | "day";

export function EventsBoard({
  orgId,
  events,
  canPlan,
  sympathizer,
  error,
  view: initialView,
  scale: initialScale,
  date: initialDate,
}: {
  orgId: string;
  events: PlanEvent[];
  canPlan: boolean;
  sympathizer: boolean;
  error?: string;
  view: BoardView;
  scale: BoardScale;
  date: string;
}) {
  const today = ymd(new Date());
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<BoardView>(initialView);
  const [scale, setScale] = useState<BoardScale>(initialScale);
  const [cursor, setCursor] = useState(initialDate || today);
  const [synced, setSynced] = useState({ initialView, initialScale, initialDate, today });
  if (
    synced.initialView !== initialView ||
    synced.initialScale !== initialScale ||
    synced.initialDate !== initialDate ||
    synced.today !== today
  ) {
    setSynced({ initialView, initialScale, initialDate, today });
    setView(initialView);
    setScale(initialScale);
    setCursor(initialDate || today);
  }

  const upcoming = events.filter((item) => ymd(new Date(item.startsAt)) >= today);

  function href(item: PlanEvent) {
    return sympathizer
      ? `/churches/${orgId}/events/${item.id}/live`
      : `/churches/${orgId}/events/${item.id}`;
  }

  function slotHref(item: PlanEvent, slotId: string) {
    if (sympathizer) return `/churches/${orgId}/events/${item.id}/live`;
    return `/churches/${orgId}/events/${item.id}?slot=${slotId}`;
  }

  function commit(next: { view?: BoardView; scale?: BoardScale; date?: string }) {
    const viewNext = next.view ?? view;
    const scaleNext = next.scale ?? scale;
    const dateNext = next.date ?? cursor;
    setView(viewNext);
    setScale(scaleNext);
    setCursor(dateNext);
    const params = new URLSearchParams();
    if (error) params.set("error", error);
    if (viewNext === "calendar") params.set("view", "calendar");
    if (scaleNext !== "month") params.set("scale", scaleNext);
    if (dateNext !== today) params.set("date", dateNext);
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (`${pathname}${window.location.search}` !== url) router.replace(url, { scroll: false });
  }

  function shift(direction: -1 | 1) {
    if (scale === "month") {
      const [year, month] = cursor.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1 + direction, 1));
      commit({ date: next.toISOString().slice(0, 10) });
      return;
    }
    commit({ date: addDays(cursor, direction * (scale === "week" ? 7 : 1)) });
  }

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            A new event opens with Welcome, Worship, Message, and Prayer. Change the sections after.
          </p>
        </div>
        <div className="flex rounded-full bg-card p-1">
          <button
            type="button"
            aria-label="Upcoming"
            aria-pressed={view === "list"}
            onClick={() => commit({ view: "list" })}
            className={`cursor-pointer rounded-full p-2 ${view === "list" ? "bg-ivory text-foreground" : "text-muted-foreground"}`}
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Calendar"
            aria-pressed={view === "calendar"}
            onClick={() => commit({ view: "calendar" })}
            className={`cursor-pointer rounded-full p-2 ${view === "calendar" ? "bg-ivory text-foreground" : "text-muted-foreground"}`}
          >
            <CalendarDays className="size-4" />
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {canPlan ? (
        <form action={createEvent.bind(null, orgId)} className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Title
            <Input name="title" required placeholder="Sunday service" className="h-10 bg-ivory" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Starts
            <Input name="startsAt" type="datetime-local" required className="h-10 bg-ivory" />
          </label>
          <input type="hidden" name="kind" value="service" />
          <Button className="h-10 cursor-pointer px-4">Create</Button>
        </form>
      ) : null}
      {view === "list" ? (
        upcoming.length === 0 ? (
          <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <ul className="grid gap-2">
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link href={href(item)} className="flex items-center justify-between gap-4 rounded-2xl bg-card px-4 py-3 hover:bg-accent">
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{dayLabel(ymd(new Date(item.startsAt)))}</span>
                  </span>
                  <Badge variant={item.status === "live" ? "default" : "secondary"} className="capitalize">
                    {item.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <Calendar
          events={events}
          cursor={cursor}
          today={today}
          scale={scale}
          href={href}
          slotHref={slotHref}
          onScale={(next) => commit({ scale: next })}
          onShift={shift}
          onToday={() => commit({ date: today })}
          onPickDay={(day) => commit({ date: day, scale: "day" })}
        />
      )}
    </main>
  );
}

function Calendar({
  events,
  cursor,
  today,
  scale,
  href,
  slotHref,
  onScale,
  onShift,
  onToday,
  onPickDay,
}: {
  events: PlanEvent[];
  cursor: string;
  today: string;
  scale: "month" | "week" | "day";
  href: (item: PlanEvent) => string;
  slotHref: (item: PlanEvent, slotId: string) => string;
  onScale: (scale: "month" | "week" | "day") => void;
  onShift: (direction: -1 | 1) => void;
  onToday: () => void;
  onPickDay: (day: string) => void;
}) {
  const title =
    scale === "month" ? monthLabel(cursor) : scale === "week" ? `Week of ${dayLabel(mondayOf(cursor))}` : dayLabel(cursor);

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 cursor-pointer bg-card px-3" onClick={onToday}>
            Today
          </Button>
          <Button type="button" variant="outline" className="h-9 cursor-pointer bg-card px-3" onClick={() => onShift(-1)} aria-label="Previous">
            ‹
          </Button>
          <Button type="button" variant="outline" className="h-9 cursor-pointer bg-card px-3" onClick={() => onShift(1)} aria-label="Next">
            ›
          </Button>
          <p className="text-sm font-medium">{title}</p>
        </div>
        <div className="flex rounded-full bg-card p-1 text-sm">
          {(["month", "week", "day"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={scale === item}
              onClick={() => onScale(item)}
              className={`cursor-pointer rounded-full px-3 py-1 capitalize ${scale === item ? "bg-ivory font-medium" : "text-muted-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {scale === "month" ? (
        <MonthGrid events={events} cursor={cursor} today={today} href={href} onPickDay={onPickDay} />
      ) : (
        <HourGrid events={events} cursor={cursor} today={today} scale={scale} href={href} slotHref={slotHref} />
      )}
    </section>
  );
}

function MonthGrid({
  events,
  cursor,
  today,
  href,
  onPickDay,
}: {
  events: PlanEvent[];
  cursor: string;
  today: string;
  href: (item: PlanEvent) => string;
  onPickDay: (day: string) => void;
}) {
  const [year, month] = cursor.split("-").map(Number);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const start = mondayOf(first);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => (
          <div key={name} className="px-2 py-2">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-border">
        {days.map((day) => {
          const inMonth = Number(day.slice(5, 7)) === month;
          const items = events.filter((item) => ymd(new Date(item.startsAt)) === day);
          return (
            <div key={day} className={`min-h-24 border-r border-b border-border p-1.5 ${inMonth ? "" : "bg-canvas/60"}`}>
              <button type="button" onClick={() => onPickDay(day)} className={`mb-1 cursor-pointer text-xs ${day === today ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {Number(day.slice(8))}
              </button>
              <div className="grid gap-1">
                {items.slice(0, 3).map((item) => (
                  <Link key={item.id} href={href(item)} className="truncate rounded-md bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                    {item.title}
                  </Link>
                ))}
                {items.length > 3 ? <p className="text-xs text-muted-foreground">+{items.length - 3}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HourGrid({
  events,
  cursor,
  today,
  scale,
  href,
  slotHref,
}: {
  events: PlanEvent[];
  cursor: string;
  today: string;
  scale: "week" | "day";
  href: (item: PlanEvent) => string;
  slotHref: (item: PlanEvent, slotId: string) => string;
}) {
  const days = scale === "week" ? Array.from({ length: 7 }, (_, index) => addDays(mondayOf(cursor), index)) : [cursor];
  const visible = events.filter((item) => days.includes(ymd(new Date(item.startsAt))));
  const bounds = useMemo(() => {
    let min = 8 * 60;
    let max = 20 * 60;
    for (const item of visible) {
      min = Math.min(min, Math.floor(minutesOf(item.startsAt) / 60) * 60);
      max = Math.max(max, Math.ceil(eventEnd(item) / 60) * 60);
    }
    return { min: Math.max(0, min), max: Math.min(24 * 60, Math.max(max, min + 60)) };
  }, [visible]);
  const hours = Array.from({ length: (bounds.max - bounds.min) / 60 }, (_, index) => bounds.min / 60 + index);
  const now = new Date();
  const nowDay = ymd(now);
  const nowMinutes = minutesOf(now.toISOString());
  const [hourHeight, setHourHeight] = useState(120);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const pad = 32;
  const tail = 10;

  function onHourPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The gesture still tracks pointermove on this column.
    }
    drag.current = { y: event.clientY, height: hourHeight };
  }

  function onHourPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || hours.length === 0) return;
    const next = drag.current.height + (event.clientY - drag.current.y) / hours.length;
    setHourHeight(Math.min(280, Math.max(48, next)));
  }

  function onHourPointerUp() {
    drag.current = null;
  }

  return (
    <div className="overflow-auto rounded-2xl bg-card">
      <div className="grid" style={{ gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(8rem, 1fr))` }}>
        <div />
        {days.map((day) => (
          <div key={day} className={`border-b border-border px-2 py-2 text-sm ${day === today ? "font-semibold text-primary" : ""}`}>
            {dayLabel(day)}
          </div>
        ))}
        <div
          className="relative cursor-ns-resize touch-none select-none"
          style={{ height: hours.length * hourHeight + pad + tail }}
          onPointerDown={onHourPointerDown}
          onPointerMove={onHourPointerMove}
          onPointerUp={onHourPointerUp}
          onPointerCancel={onHourPointerUp}
          title="Drag to resize hours"
          role="slider"
          aria-label="Hour height"
          aria-valuemin={48}
          aria-valuemax={280}
          aria-valuenow={Math.round(hourHeight)}
        >
          {hours.map((hour, index) => (
            <div key={hour} className="pointer-events-none absolute right-2 text-xs text-muted-foreground" style={{ top: index * hourHeight + pad - 6 }}>
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day) => {
          const onDay = visible.filter((item) => ymd(new Date(item.startsAt)) === day);
          const lanes = laneOf(onDay);
          return (
            <div key={day} className="relative border-l border-border" style={{ height: hours.length * hourHeight + pad + tail }}>
              {hours.map((hour, index) => (
                <div key={hour} className="absolute inset-x-0 border-t border-border/70" style={{ top: index * hourHeight + pad }} />
              ))}
              {days.includes(nowDay) && day === nowDay && nowMinutes >= bounds.min && nowMinutes <= bounds.max ? (
                <div className="absolute inset-x-0 z-10 h-px bg-primary" style={{ top: pad + ((nowMinutes - bounds.min) / 60) * hourHeight }} />
              ) : null}
              {onDay.map((item) => {
                const lane = lanes.get(item.id) ?? 0;
                const width = 100 / Math.max(maxLane(lanes) + 1, 1);
                const start = minutesOf(item.startsAt);
                const timeHeight = Math.max(((eventEnd(item) - start) / 60) * hourHeight, 24);
                const boxTop = pad + ((start - bounds.min) / 60) * hourHeight;
                return (
                  <div
                    key={item.id}
                    className="absolute rounded-xl border border-border bg-card shadow-sm"
                    style={{
                      top: boxTop,
                      height: timeHeight + tail,
                      left: `calc(${lane * width}% + 4px)`,
                      width: `calc(${width}% - 8px)`,
                    }}
                  >
                    <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary" />
                    <PlanLink
                      href={href(item)}
                      title={item.title}
                      className="absolute bottom-full left-3 z-20 max-w-[min(11rem,calc(100%-1.5rem))] -mb-px cursor-pointer truncate rounded-t-lg border border-b-0 border-border bg-card px-2.5 pt-1 pb-1 text-[11px] font-semibold hover:bg-accent"
                    >
                      {item.title}
                    </PlanLink>
                    {segments(item).map((segment) => {
                      const rel = ((segment.start - start) / 60) * hourHeight;
                      const blockHeight = (segment.minutes / 60) * hourHeight;
                      const label = segment.break ? "Break" : segment.title;
                      const gap = 3;
                      return (
                        <PlanLink
                          key={segment.id}
                          href={segment.placeholder ? href(item) : slotHref(item, segment.id)}
                          title={segment.timed ? `${item.title}: ${label}, ${clock(segment.start)} · ${segment.minutes} min` : `${item.title}: ${label}, no time set`}
                          className={`absolute right-1 left-2 cursor-pointer overflow-hidden rounded-md px-1.5 text-[11px] leading-tight transition hover:z-10 hover:brightness-95 ${segment.break ? "text-muted-foreground" : "text-foreground"} ${segment.color || segment.break ? "" : "bg-ivory"}`}
                          style={{
                            top: rel + gap,
                            height: Math.max(blockHeight - gap * 2, 2),
                            backgroundColor: segment.break ? undefined : segment.color || undefined,
                            backgroundImage: segment.break
                              ? "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(16,31,27,0.08) 3px, rgba(16,31,27,0.08) 4px)"
                              : undefined,
                          }}
                        >
                          {blockHeight >= 18 ? (
                            <span className="block truncate pt-0.5 font-medium">
                              {label}
                              {segment.timed ? <span className="ml-1 font-normal text-muted-foreground">{clock(segment.start)}</span> : null}
                            </span>
                          ) : null}
                        </PlanLink>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanLink({
  href,
  className,
  style,
  title,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  return (
    <Link
      href={href}
      prefetch={false}
      draggable={false}
      title={title}
      className={className}
      style={style}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        origin.current = { x: event.clientX, y: event.clientY };
        moved.current = false;
      }}
      onPointerMove={(event) => {
        const start = origin.current;
        if (!start) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) moved.current = true;
      }}
      onClick={(event) => {
        const dragged = moved.current || origin.current === null;
        origin.current = null;
        moved.current = false;
        if (event.detail === 0) return;
        if (dragged) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </Link>
  );
}

function laneOf(items: PlanEvent[]) {
  const sorted = [...items].sort((a, b) => minutesOf(a.startsAt) - minutesOf(b.startsAt));
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const item of sorted) {
    const start = minutesOf(item.startsAt);
    const end = eventEnd(item);
    let lane = laneEnds.findIndex((value) => value <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    lanes.set(item.id, lane);
  }
  return lanes;
}

function maxLane(lanes: Map<string, number>) {
  return Math.max(0, ...lanes.values());
}
