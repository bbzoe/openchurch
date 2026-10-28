"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseSlotNotes, writeSlotNotes } from "@/lib/slot-notes";
import { addBlock, endEvent, removeBlock, reorderBlocks, setAdvance, setLiveBlock, startEvent, updateEventStart, updateSection } from "@/server/actions";
import { SlotCrew } from "@/components/slot-crew";
import { currentSlotId } from "@/lib/run-of-show";

type Kind = "welcome" | "worship" | "announcement" | "message" | "prayer" | "other";

const BREAK = "openchurch:break";

type Slot = {
  id: string;
  title: string;
  kind: Kind;
  durationMinutes: number | null;
  description: string;
  personIds: string[];
  leaderCount: number;
  break?: boolean;
  emoji?: string;
  color?: string;
};

const kindEmoji: Record<Kind, string> = {
  welcome: "👋",
  worship: "🎵",
  announcement: "📣",
  message: "📖",
  prayer: "🙏",
  other: "✨",
};

const emojiChoices = ["👋", "🙏", "🎵", "📖", "📣", "✨", "🕊️", "✝️", "💡", "❤️", "👥", "🎤", "🕯️", "🌿", "☀️", "🎉", "☕", "📝", "⏰", "🏠"];

const slotColors = [
  { value: "", label: "Default" },
  { value: "#e7f8ee", label: "Green" },
  { value: "#e7f6f3", label: "Mint" },
  { value: "#fff4e5", label: "Sand" },
  { value: "#e7f1fb", label: "Sky" },
  { value: "#f3eefb", label: "Lilac" },
  { value: "#fdecec", label: "Rose" },
  { value: "#f4f1ea", label: "Cream" },
];

function splitNotes(description: string) {
  const parsed = parseSlotNotes(description);
  return { notes: parsed.notes, color: parsed.color };
}

function storedNotes(slot: Slot) {
  return writeSlotNotes(slot.description, slot.color ?? "");
}

function withEmoji(slot: Slot): Slot {
  if (isBreak(slot)) return { ...slot, break: true, description: BREAK, color: "" };
  const parsed = splitNotes(slot.description);
  const color = slot.color !== undefined ? slot.color : parsed.color;
  const base = { ...slot, description: parsed.notes, color };
  if (base.emoji) return base;
  const match = base.title.match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}\uFE0F?)*)\s+([\s\S]+)$/u);
  if (match) return { ...base, emoji: match[1], title: match[2].trim() };
  return { ...base, emoji: kindEmoji[base.kind] ?? "✨" };
}

function DropMark() {
  return (
    <li aria-hidden className="pointer-events-none list-none px-10 py-1">
      <div className="h-0.5 rounded-full bg-primary/70" />
    </li>
  );
}

function storedTitle(slot: Slot) {
  const name = slot.title.trim();
  const emoji = slot.emoji ?? kindEmoji[slot.kind] ?? "✨";
  if (emoji === (kindEmoji[slot.kind] ?? "✨")) return name;
  return `${emoji} ${name}`;
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function EmojiPicker({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const className = compact
    ? "grid size-8 shrink-0 place-items-center rounded-md text-lg hover:bg-foreground/5 disabled:opacity-50"
    : "grid size-10 shrink-0 place-items-center rounded-lg bg-ivory text-lg disabled:opacity-50";
  if (!mounted) {
    return (
      <button type="button" disabled={disabled} aria-label="Choose an emoji" className={className}>
        {value}
      </button>
    );
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        aria-label="Choose an emoji"
        className={className}
      >
        {value}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {emojiChoices.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Use ${emoji}`}
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className={`grid size-9 place-items-center rounded-md text-lg hover:bg-accent ${emoji === value ? "bg-accent" : ""}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const className = "grid size-10 shrink-0 place-items-center rounded-lg bg-ivory disabled:opacity-50";
  const swatch = (
    <span className="size-5 rounded-full ring-1 ring-primary/25" style={{ backgroundColor: value || "#ffffff" }} />
  );
  if (!mounted) {
    return (
      <button type="button" disabled={disabled} aria-label="Choose a color" className={className}>
        {swatch}
      </button>
    );
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        aria-label="Choose a color"
        className={className}
      >
        {swatch}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-4 gap-1">
          {slotColors.map((color) => (
            <button
              key={color.label}
              type="button"
              aria-label={color.label}
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
              className={`grid size-9 place-items-center rounded-md hover:bg-accent ${color.value === value ? "bg-accent" : ""}`}
            >
              <span
                className="size-5 rounded-full ring-1 ring-primary/25"
                style={{ backgroundColor: color.value || "#ffffff" }}
              />
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isBreak(slot: Slot) {
  return slot.break === true || slot.description === BREAK;
}

type PersonOption = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  image: string | null;
};

const presets: { title: string; kind: Kind; minutes: number }[] = [
  { title: "Welcome", kind: "welcome", minutes: 5 },
  { title: "Worship", kind: "worship", minutes: 25 },
  { title: "Announcement", kind: "announcement", minutes: 5 },
  { title: "Message", kind: "message", minutes: 30 },
  { title: "Prayer", kind: "prayer", minutes: 10 },
];

function fingerprint(slot: Slot) {
  return JSON.stringify({
    title: slot.title,
    emoji: slot.emoji ?? "",
    color: slot.color ?? "",
    durationMinutes: slot.durationMinutes,
    description: slot.description,
    personIds: slot.personIds,
    leaderCount: slot.leaderCount,
  });
}

function formatTotal(minutes: number) {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} h ${rest} min`;
}

const warsawTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h12",
});

function warsawParts(date: Date) {
  const parts = warsawTime.formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("month")} ${read("day")}, ${read("year")}`,
    time: `${read("hour")}:${read("minute")} ${read("dayPeriod")}`,
  };
}

function clock(start: Date, offsetMinutes: number) {
  return warsawParts(new Date(start.getTime() + offsetMinutes * 60_000)).time;
}

export function ServicePlan({
  orgId,
  eventId,
  title,
  startsAt,
  status: initialStatus,
  liveBlockId: initialLiveBlockId,
  advance: initialAdvance,
  canPlan,
  canLive,
  blocks,
  people,
  focusSlotId,
}: {
  orgId: string;
  eventId: string;
  title: string;
  startsAt: string;
  status: "draft" | "scheduled" | "live" | "ended";
  liveBlockId: string | null;
  advance: "manual" | "auto";
  canPlan: boolean;
  canLive: boolean;
  blocks: Slot[];
  people: PersonOption[];
  focusSlotId?: string | null;
}) {
  const [slots, setSlots] = useState(() => blocks.map(withEmoji));
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const match = blocks.find((block) => block.id === focusSlotId);
    if (!match) return blocks[0]?.id ?? null;
    if (match.description === BREAK || match.description.startsWith(`${BREAK}\n`)) return null;
    return match.id;
  });
  const [draft, setDraft] = useState("");
  const [draftEmoji, setDraftEmoji] = useState(kindEmoji.other);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [liveBlockId, setLiveId] = useState(initialLiveBlockId);
  const [advance, setAdvanceMode] = useState(initialAdvance);
  const [start, setStart] = useState(() => new Date(startsAt));
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; place: "before" | "after" } | null>(null);
  const saved = useRef<Record<string, string>>({});
  const slotsRef = useRef(slots);
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    slotsRef.current = slots;
  });

  useEffect(() => {
    if (!focusSlotId || !listRef.current) return;
    const row = listRef.current.querySelector(`[data-row="${CSS.escape(focusSlotId)}"]`);
    if (!(row instanceof HTMLElement)) return;
    const frame = window.requestAnimationFrame(() => {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusSlotId]);

  useEffect(() => {
    if (advance !== "auto" || status !== "live" || !canLive) return;
    const tick = () => {
      const id = currentSlotId(
        slotsRef.current.map((slot) => ({ id: slot.id, durationMinutes: slot.durationMinutes })),
        start,
        new Date(),
      );
      if (!id || id === liveBlockId) return;
      setLiveId(id);
      void setLiveBlock(orgId, eventId, id);
    };
    tick();
    const timer = window.setInterval(tick, 5000);
    return () => window.clearInterval(timer);
  }, [advance, status, canLive, start, liveBlockId, orgId, eventId]);

  const total = slots.reduce((sum, slot) => sum + (slot.durationMinutes ?? 0), 0);
  const missing = slots.filter((slot) => !isBreak(slot) && !slot.durationMinutes).length;
  const selected = slots.find((slot) => slot.id === selectedId) ?? null;

  const persist = useCallback(async (slot: Slot) => {
    if (slot.id.startsWith("temp-") || !slot.title.trim()) return;
    const body = new FormData();
    body.set("title", storedTitle(slot));
    body.set("description", storedNotes(slot));
    body.set("durationMinutes", slot.durationMinutes ? String(slot.durationMinutes) : "");
    body.set("leaderCount", String(slot.leaderCount));
    for (const personId of slot.personIds) body.append("personId", personId);
    setNotice("Saving");
    await updateSection(orgId, eventId, slot.id, body);
    saved.current[slot.id] = fingerprint(slot);
    setNotice("Saved");
  }, [orgId, eventId]);

  useEffect(() => {
    for (const slot of blocks.map(withEmoji)) {
      if (saved.current[slot.id] === undefined) saved.current[slot.id] = fingerprint(slot);
    }
  }, [blocks]);

  useEffect(() => {
    if (!selected || isBreak(selected) || selected.id.startsWith("temp-") || !canPlan || !selected.title.trim()) return;
    const current = fingerprint(selected);
    if (saved.current[selected.id] === undefined) {
      saved.current[selected.id] = current;
      return;
    }
    if (saved.current[selected.id] === current) return;
    const handle = window.setTimeout(() => {
      void persist(selected);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [selected, canPlan, persist]);

  function patch(id: string, next: Partial<Slot>) {
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, ...next } : slot)));
  }

  async function commitOrder(next: Slot[]) {
    setSlots(next);
    if (next.some((slot) => slot.id.startsWith("temp-"))) return;
    await reorderBlocks(orgId, eventId, next.map((slot) => slot.id));
  }

  async function add(next: { title: string; kind: Kind; minutes: number | null; emoji?: string; color?: string }) {
    const name = next.title.trim();
    if (!name || adding) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    const slot: Slot = {
      id: tempId,
      title: name,
      kind: next.kind,
      emoji: next.emoji ?? kindEmoji[next.kind],
      color: next.color ?? "",
      durationMinutes: next.minutes,
      description: "",
      personIds: [],
      leaderCount: 1,
    };
    setSlots((current) => [...current, slot]);
    setSelectedId(tempId);
    if (next.kind === "other") {
      setDraft("");
      setDraftEmoji(kindEmoji.other);
    }
    setAdding(true);
    setNotice(null);
    const body = new FormData();
    body.set("title", storedTitle(slot));
    body.set("kind", next.kind);
    body.set("description", storedNotes(slot));
    if (next.minutes) body.set("durationMinutes", String(next.minutes));
    const created = await addBlock(orgId, eventId, body);
    setAdding(false);
    if (!created) {
      setSlots((current) => current.filter((item) => item.id !== tempId));
      setNotice("Could not add that section");
      return;
    }
    saved.current[created.id] = fingerprint({ ...slot, id: created.id });
    let replaced: Slot[] = [];
    setSlots((current) => {
      replaced = current.map((item) => (item.id === tempId ? { ...item, id: created.id } : item));
      return replaced;
    });
    setSelectedId(created.id);
    if (replaced.length > 0 && replaced.every((item) => !item.id.startsWith("temp-"))) {
      void reorderBlocks(orgId, eventId, replaced.map((item) => item.id));
    }
  }

  function rowAt(y: number) {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
    for (const row of rows) {
      const box = row.getBoundingClientRect();
      const id = row.dataset.row;
      if (!id) continue;
      if (y < box.top + box.height / 2) return { id, place: "before" as const };
    }
    const last = rows.at(-1)?.dataset.row;
    return last ? { id: last, place: "after" as const } : null;
  }

  function placeOrder(items: Slot[], fromId: string, mark: { id: string; place: "before" | "after" }) {
    if (mark.id === fromId) return items;
    const from = items.findIndex((slot) => slot.id === fromId);
    const target = items.findIndex((slot) => slot.id === mark.id);
    if (from < 0 || target < 0) return items;
    let to = mark.place === "after" ? target + 1 : target;
    if (from < to) to -= 1;
    if (from === to) return items;
    const next = items.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function onHeaderPointerDown(event: React.PointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0) return;
    if (!canPlan) {
      setSelectedId((current) => (current === id ? null : id));
      return;
    }
    const originX = event.clientX;
    const originY = event.clientY;
    let moved = false;
    let hover: { id: string; place: "before" | "after" } | null = null;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - originX, ev.clientY - originY) < 6) return;
      if (id.startsWith("temp-")) return;
      moved = true;
      setDragId(id);
      hover = rowAt(ev.clientY);
      setOver(hover);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragId(null);
      setOver(null);
      if (!moved) {
        setSelectedId((current) => (current === id ? null : id));
        return;
      }
      if (!hover) return;
      const items = slotsRef.current;
      const next = placeOrder(items, id, hover);
      if (next === items) return;
      void commitOrder(next);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onBreakPointerDown(event: React.PointerEvent<HTMLDivElement>, slot: Slot) {
    if (event.button !== 0 || !canPlan) return;
    if ((event.target as HTMLElement).closest("[data-remove-break]")) return;
    event.stopPropagation();
    const originX = event.clientX;
    const originY = event.clientY;
    const origin = slot.durationMinutes ?? 1;
    const id = slot.id;
    let mode: "undecided" | "time" | "move" = "undecided";
    let hover: { id: string; place: "before" | "after" } | null = null;
    const minutesFrom = (clientX: number) => Math.min(45, Math.max(1, origin + Math.round((clientX - originX) / 14)));
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - originX;
      const dy = ev.clientY - originY;
      if (mode === "undecided") {
        if (Math.hypot(dx, dy) < 6) return;
        mode = Math.abs(dy) > Math.abs(dx) ? "move" : "time";
      }
      if (mode === "time") {
        patch(id, { durationMinutes: minutesFrom(ev.clientX) });
        return;
      }
      if (id.startsWith("temp-")) return;
      setDragId(id);
      hover = rowAt(ev.clientY);
      setOver(hover);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (mode === "move") {
        setDragId(null);
        setOver(null);
        if (!hover) return;
        const items = slotsRef.current;
        const next = placeOrder(items, id, hover);
        if (next === items) return;
        void commitOrder(next);
        return;
      }
      if (mode !== "time") return;
      const minutes = minutesFrom(ev.clientX);
      patch(id, { durationMinutes: minutes });
      if (id.startsWith("temp-") || minutes === origin) return;
      const body = new FormData();
      body.set("title", "Break");
      body.set("description", BREAK);
      body.set("durationMinutes", String(minutes));
      void updateSection(orgId, eventId, id, body);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function insertBreak(index: number) {
    if (adding) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    const slot: Slot = {
      id: tempId,
      title: "Break",
      kind: "other",
      durationMinutes: 1,
      description: BREAK,
      personIds: [],
      leaderCount: 1,
      break: true,
    };
    setSlots((current) => {
      const next = current.slice();
      next.splice(index, 0, slot);
      return next;
    });
    setAdding(true);
    const body = new FormData();
    body.set("title", "Break");
    body.set("kind", "other");
    body.set("durationMinutes", "1");
    body.set("description", BREAK);
    const created = await addBlock(orgId, eventId, body);
    setAdding(false);
    if (!created) {
      setSlots((current) => current.filter((item) => item.id !== tempId));
      return;
    }
    let replaced: Slot[] = [];
    setSlots((current) => {
      replaced = current.map((item) =>
        item.id === tempId ? { ...item, id: created.id, break: true, description: BREAK } : item,
      );
      return replaced;
    });
    if (replaced.length > 0 && replaced.every((item) => !item.id.startsWith("temp-"))) {
      void reorderBlocks(orgId, eventId, replaced.map((item) => item.id));
    }
  }

  const offsets: number[] = [];
  {
    let minutes = 0;
    for (const slot of slots) {
      offsets.push(minutes);
      minutes += slot.durationMinutes ?? 0;
    }
  }
  const dropLands = Boolean(dragId && over && placeOrder(slots, dragId, over) !== slots);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {editingTime ? (
              <input
                autoFocus
                type="datetime-local"
                value={timeDraft}
                aria-label="Start time"
                onChange={(event) => setTimeDraft(event.target.value)}
                onBlur={() => {
                  const next = new Date(timeDraft);
                  if (!Number.isNaN(next.getTime())) {
                    setStart(next);
                    void updateEventStart(orgId, eventId, next.toISOString());
                  }
                  setEditingTime(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className="mt-1 h-9 rounded-lg bg-card px-2 text-sm"
              />
            ) : (
              <button
                type="button"
                disabled={!canPlan}
                onClick={() => {
                  const pad = (value: number) => String(value).padStart(2, "0");
                  setTimeDraft(
                    `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`,
                  );
                  setEditingTime(true);
                }}
                className="mt-1 text-left text-sm text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
              >
                {warsawParts(start).date}, {warsawParts(start).time}
              </button>
            )}
          </div>
          <div className="rounded-2xl bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold tracking-tight text-forest tabular-nums">{formatTotal(total)}</p>
          {missing > 0 ? (
            <p className="text-xs text-muted-foreground">
              {missing === 1 ? "1 section has no time" : `${missing} sections have no time`}
            </p>
          ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-3 py-2">
          <div className="flex rounded-full bg-canvas p-1 text-sm">
            <span className="rounded-full bg-ivory px-3 py-1 font-medium">Studio</span>
            <Link href={`/churches/${orgId}/events/${eventId}/live`} className="rounded-full px-3 py-1 text-muted-foreground">
              Live
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status === "live" ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="size-2 rounded-full bg-primary" />
                Live
              </span>
            ) : status === "ended" ? (
              <span className="rounded-full bg-canvas px-3 py-1 text-sm text-muted-foreground">Ended</span>
            ) : (
              <span className="rounded-full bg-canvas px-3 py-1 text-sm text-muted-foreground">Ready</span>
            )}
            {canLive && status !== "live" ? (
              <Button
                type="button"
                onClick={() => {
                  const first = slots.find((slot) => !isBreak(slot)) ?? slots[0];
                  setStatus("live");
                  if (first) setLiveId(first.id);
                  void startEvent(orgId, eventId);
                }}
              >
                Go live
              </Button>
            ) : null}
            {canLive && status === "live" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStatus("ended");
                  setLiveId(null);
                  void endEvent(orgId, eventId);
                }}
              >
                End
              </Button>
            ) : null}
          </div>
        </div>
        {canLive ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-full bg-card p-1 text-sm">
              <button
                type="button"
                aria-pressed={advance === "manual"}
                onClick={() => {
                  setAdvanceMode("manual");
                  void setAdvance(orgId, eventId, "manual");
                }}
                className={`cursor-pointer rounded-full px-3 py-1 ${advance === "manual" ? "bg-ivory font-medium" : "text-muted-foreground"}`}
              >
                Manual
              </button>
              <button
                type="button"
                aria-pressed={advance === "auto"}
                onClick={() => {
                  setAdvanceMode("auto");
                  void setAdvance(orgId, eventId, "auto");
                }}
                className={`cursor-pointer rounded-full px-3 py-1 ${advance === "auto" ? "bg-ivory font-medium" : "text-muted-foreground"}`}
              >
                Auto
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {advance === "auto" ? "Slots follow the start time." : "Studio chooses the current slot."}
            </p>
          </div>
        ) : null}
      </header>

      {slots.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          This service has no sections yet.
        </p>
      ) : (
        <ol ref={listRef} className="flex flex-col gap-1">
          {slots.map((slot, index) => {
            const begins = clock(start, offsets[index] ?? 0);
            const previous = index > 0 ? slots[index - 1] : null;
            const showInserter = canPlan && previous && !isBreak(previous) && !isBreak(slot);
            if (isBreak(slot)) {
              const lineBefore = dropLands && over?.id === slot.id && over.place === "before";
              const lineAfter = dropLands && over?.id === slot.id && over.place === "after";
              return (
                <Fragment key={slot.id}>
                  {lineBefore ? <DropMark /> : null}
                  <li data-row={slot.id} className="relative list-none scroll-mt-24">
                  <div
                    className={`group relative flex h-7 items-center select-none ${dragId === slot.id ? "cursor-grabbing opacity-60" : canPlan ? "cursor-grab active:cursor-grabbing" : ""}`}
                    onPointerDown={(event) => onBreakPointerDown(event, slot)}
                  >
                    <span className="h-px flex-1 bg-primary/25" />
                    <span className="px-2 text-xs font-medium text-muted-foreground tabular-nums">
                      {slot.durationMinutes ?? 1} min
                    </span>
                    <span className="h-px flex-1 bg-primary/25" />
                    {canPlan ? (
                      <button
                        type="button"
                        data-remove-break
                        aria-label="Remove break"
                        className="ml-2 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-primary/20 hover:text-foreground"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => {
                          setSlots((current) => current.filter((item) => item.id !== slot.id));
                          if (!slot.id.startsWith("temp-")) void removeBlock(orgId, eventId, slot.id);
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    ) : null}
                  </div>
                  </li>
                  {lineAfter ? <DropMark /> : null}
                </Fragment>
              );
            }
            const open = slot.id === selectedId;
            const now = slot.id === liveBlockId;
            const dragging = dragId === slot.id;
            const lineBefore = dropLands && over?.id === slot.id && over.place === "before";
            const lineAfter = dropLands && over?.id === slot.id && over.place === "after";
            return (
              <Fragment key={slot.id}>
                {showInserter ? (
                  <li className="list-none">
                    <button
                      type="button"
                      aria-label="Add a break"
                      onClick={() => void insertBreak(index)}
                      className="group flex h-3 w-full cursor-row-resize items-center"
                    >
                      <span className="h-px flex-1 bg-transparent group-hover:bg-primary/30" />
                      <Plus className="mx-1 size-3 text-primary opacity-0 group-hover:opacity-100" />
                      <span className="h-px flex-1 bg-transparent group-hover:bg-primary/30" />
                    </button>
                  </li>
                ) : null}
                {lineBefore ? <DropMark /> : null}
                <li
                  data-row={slot.id}
                  style={slot.color ? { backgroundColor: slot.color } : undefined}
                  className={`relative scroll-mt-24 rounded-2xl ${slot.color ? "" : "bg-card"} ${dragging ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-1 px-3 py-3">
                    <div onPointerDown={(event) => event.stopPropagation()} className="mt-0.5">
                      <EmojiPicker
                        compact
                        value={slot.emoji ?? kindEmoji[slot.kind]}
                        disabled={!canPlan}
                        onChange={(emoji) => patch(slot.id, { emoji })}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <div onPointerDown={(event) => event.stopPropagation()} className="min-w-0 max-w-[70%]">
                          {editingTitleId === slot.id ? (
                            <input
                              autoFocus
                              value={slot.title}
                              aria-label="Title"
                              onChange={(event) => patch(slot.id, { title: event.target.value })}
                              onBlur={() => setEditingTitleId(null)}
                              onKeyDown={(event) => {
                                event.stopPropagation();
                                if (event.key === "Enter") event.currentTarget.blur();
                              }}
                              className="w-full min-w-24 cursor-text bg-transparent font-medium outline-none select-text"
                            />
                          ) : (
                            <button
                              type="button"
                              disabled={!canPlan}
                              onClick={() => setEditingTitleId(slot.id)}
                              onKeyDown={(event) => event.stopPropagation()}
                              className="block max-w-full cursor-text truncate text-left font-medium hover:underline disabled:no-underline"
                            >
                              {slot.title}
                            </button>
                          )}
                          {now ? <span className="ml-2 text-xs font-medium text-primary">Now</span> : null}
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={open}
                          onPointerDown={(event) => onHeaderPointerDown(event, slot.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedId(open ? null : slot.id);
                            }
                          }}
                          className={`flex min-w-8 flex-1 touch-none items-baseline justify-end select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                        >
                          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                            {slot.durationMinutes ? `${slot.durationMinutes} min` : "No time"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div onPointerDown={(event) => event.stopPropagation()}>
                          <SlotCrew
                            people={people}
                            ids={slot.personIds}
                            leaderCount={slot.leaderCount}
                            disabled={!canPlan}
                            onChange={(next) => patch(slot.id, next)}
                          />
                        </div>
                        <div
                          role="button"
                          tabIndex={-1}
                          onPointerDown={(event) => onHeaderPointerDown(event, slot.id)}
                          className={`shrink-0 touch-none text-sm text-muted-foreground tabular-nums select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                        >
                          {begins}
                        </div>
                      </div>
                    </div>
                  </div>
                  {open ? (
                    <div className="grid gap-3 px-4 pb-4" onPointerDown={(event) => event.stopPropagation()}>
                      <div className="flex items-end gap-3">
                        <div className="grid gap-1">
                          <span className="text-sm font-medium">Color</span>
                          <ColorPicker
                            value={slot.color ?? ""}
                            disabled={!canPlan}
                            onChange={(color) => patch(slot.id, { color })}
                          />
                        </div>
                        <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium">
                          Minutes
                          <Input
                            type="number"
                            min={1}
                            value={slot.durationMinutes ?? ""}
                            disabled={!canPlan}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              patch(slot.id, {
                                durationMinutes: Number.isFinite(value) && value > 0 ? Math.round(value) : null,
                              });
                            }}
                            className="h-10 bg-ivory"
                          />
                        </label>
                      </div>
                      <label className="grid gap-1 text-sm font-medium">
                        Notes
                        <Textarea
                          rows={3}
                          value={slot.description}
                          disabled={!canPlan}
                          placeholder="Optional"
                          onChange={(event) => patch(slot.id, { description: event.target.value })}
                          className="bg-ivory"
                        />
                      </label>
                      {slot.id.startsWith("temp-") ? null : (
                        <Link
                          href={`/churches/${orgId}/events/${eventId}/slides?slot=${slot.id}`}
                          className="w-fit text-sm font-medium text-primary"
                        >
                          Slides
                        </Link>
                      )}
                      <div className="grid gap-2">
                        <p className="text-sm font-medium">People</p>
                        {people.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            <Link href={`/churches/${orgId}/people`} className="font-medium text-primary">
                              Add people
                            </Link>{" "}
                            before assigning them here.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {people.map((person) => {
                              const on = slot.personIds.includes(person.id);
                              return (
                                <button
                                  key={person.id}
                                  type="button"
                                  disabled={!canPlan}
                                  aria-pressed={on}
                                  onClick={() => {
                                    const index = slot.personIds.indexOf(person.id);
                                    const personIds = on
                                      ? slot.personIds.filter((personId) => personId !== person.id)
                                      : [...slot.personIds, person.id];
                                    const leaderCount =
                                      on && index >= 0 && index < slot.leaderCount
                                        ? Math.max(0, slot.leaderCount - 1)
                                        : Math.min(slot.leaderCount, personIds.length);
                                    patch(slot.id, { personIds, leaderCount });
                                  }}
                                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
                                >
                                  {person.name}
                                  <span className={on ? "text-primary-foreground/80" : "text-muted-foreground"}>
                                    {" "}
                                    {person.role}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {canLive ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={slot.id.startsWith("temp-")}
                            onClick={() => {
                              setAdvanceMode("manual");
                              setStatus("live");
                              setLiveId(slot.id);
                              void setAdvance(orgId, eventId, "manual");
                              void setLiveBlock(orgId, eventId, slot.id);
                            }}
                          >
                            Set as now
                          </Button>
                        ) : null}
                        {canPlan ? (
                          <button
                            type="button"
                            className="text-sm text-muted-foreground"
                            disabled={slot.id.startsWith("temp-")}
                            onClick={() => {
                              setSlots((current) => current.filter((item) => item.id !== slot.id));
                              setSelectedId(null);
                              if (!slot.id.startsWith("temp-")) void removeBlock(orgId, eventId, slot.id);
                            }}
                          >
                            Remove
                          </button>
                        ) : null}
                        {notice ? <span className="text-sm text-muted-foreground">{notice}</span> : null}
                      </div>
                    </div>
                  ) : null}
                </li>
                {lineAfter ? <DropMark /> : null}
              </Fragment>
            );
          })}
        </ol>
      )}

      {canPlan ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.kind}
                type="button"
                disabled={adding}
                onClick={() => void add({ ...preset, emoji: kindEmoji[preset.kind] })}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent"
              >
                <span aria-hidden>{kindEmoji[preset.kind]}</span>
                {preset.title}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void add({ title: draft, kind: "other", minutes: null, emoji: draftEmoji });
            }}
          >
            <EmojiPicker value={draftEmoji} onChange={setDraftEmoji} />
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="New slot"
              className="h-10 bg-card"
            />
            <Button type="submit" disabled={adding || !draft.trim()} className="h-10 px-4">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
