"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SlideStage } from "@/components/slide-stage";
import { saveDeck } from "@/server/actions";
import type { SongDocument } from "@/lib/song-text";
import {
  backgroundFor,
  clampHead,
  fontFor,
  groupFromLyrics,
  groupFromSong,
  isBackgroundId,
  isFontId,
  itemSlides,
  looseSlide,
  lyricScale,
  moveItem,
  readSlide,
  removeItem,
  resplitGroup,
  sectionJump,
  sectionLabels,
  slideBackgrounds,
  slideFonts,
  slideInkChoices,
  step,
  writeSlide,
  type Deck,
  type DeckSlide,
  type Playhead,
} from "@/lib/slides";

type LibrarySong = SongDocument & { id: string };

function LineStage({
  slide,
  onChange,
}: {
  slide: DeckSlide;
  onChange: (lines: string[]) => void;
}) {
  const background = backgroundFor(slide.backgroundId);
  const font = fontFor(slide.fontId);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const pending = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pending.current == null) return;
    const index = pending.current;
    pending.current = null;
    refs.current[index]?.focus();
  });

  return (
    <div
      className="mx-auto flex aspect-video h-[min(42vh,26rem)] w-auto max-w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 ring-1 ring-black/10"
      style={{ background: background.value, color: slide.color || background.ink, fontFamily: font.family }}
    >
      {slide.sectionType ? <p className="text-xs font-medium tracking-wide opacity-70">{slide.label}</p> : null}
      <div className="flex w-full max-w-3xl flex-col items-center gap-1">
        {slide.lines.map((line, index) => (
          <input
            key={`${slide.id}-${index}`}
            ref={(node) => {
              refs.current[index] = node;
            }}
            aria-label={`Line ${index + 1}`}
            value={line}
            placeholder={index === 0 ? "Type a line" : ""}
            onChange={(event) => {
              const next = slide.lines.slice();
              next[index] = event.target.value;
              onChange(next);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const next = slide.lines.slice();
                next.splice(index + 1, 0, "");
                onChange(next.slice(0, 8));
                pending.current = Math.min(index + 1, 7);
              }
              if (event.key === "Backspace" && line === "" && slide.lines.length > 1) {
                event.preventDefault();
                onChange(slide.lines.filter((_, lineIndex) => lineIndex !== index));
                pending.current = Math.max(0, index - 1);
              }
            }}
            style={{ backgroundColor: "transparent", color: "inherit", caretColor: "currentcolor" }}
            className={`w-full max-w-[18ch] border-0 text-center font-semibold shadow-none outline-none placeholder:text-current placeholder:opacity-40 ${lyricScale(Math.max(slide.lines.length, 1))}`}
          />
        ))}
      </div>
    </div>
  );
}

export function SlideDeck({
  orgId,
  eventId,
  blockId,
  slotTitle,
  planHref,
  playHref,
  songsHref,
  canEdit,
  initialDeck,
  songs,
  slots,
  persist = true,
}: {
  orgId: string;
  eventId: string;
  blockId: string;
  slotTitle: string;
  planHref: string;
  playHref: string;
  songsHref: string;
  canEdit: boolean;
  initialDeck: Deck;
  songs: LibrarySong[];
  slots: { id: string; title: string }[];
  persist?: boolean;
}) {
  const [deck, setDeck] = useState<Deck>(initialDeck);
  const [head, setHead] = useState<Playhead>({ itemIndex: 0, slideIndex: 0 });
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [statusText, setStatusText] = useState("Saved");
  const [picker, setPicker] = useState(false);
  const [songQuery, setSongQuery] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songSource, setSongSource] = useState("");
  const [songError, setSongError] = useState("");
  const [armed, setArmed] = useState<null | "remove" | "update">(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef(deck);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  const savedJson = useRef(JSON.stringify(initialDeck));

  const safe = clampHead(deck, head);
  const item = deck[safe.itemIndex] ?? null;
  const slides = item ? itemSlides(item) : [];
  const slide = readSlide(deck, safe);
  const sections = item?.kind === "group" ? sectionLabels(slides) : [];
  const query = songQuery.trim().toLowerCase();
  const matches = songs.filter((song) => song.title.toLowerCase().includes(query)).slice(0, 12);

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  function focus(next: Playhead) {
    setArmed(null);
    setHead(next);
  }

  useEffect(() => {
    if (!picker) return;
    function onPointer(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPicker(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPicker(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [picker]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.key !== "ArrowRight" && event.key !== "ArrowLeft") || event.altKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea")) return;
      event.preventDefault();
      setArmed(null);
      setHead((current) => step(deckRef.current, clampHead(deckRef.current, current), event.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!canEdit || !persist) return;
    const snapshot = deckRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === savedJson.current) return;
    dirty.current = true;
    setStatus("saving");
    setStatusText("Saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void saveDeck(orgId, eventId, blockId, snapshot)
        .then((result) => {
          if (JSON.stringify(deckRef.current) !== serialized) return;
          if (result && "ok" in result) {
            savedJson.current = serialized;
            dirty.current = false;
            setStatus("saved");
            setStatusText("Saved");
          } else {
            setStatus("error");
            setStatusText(result && "error" in result ? result.error : "Not saved");
          }
        })
        .catch(() => {
          setStatus("error");
          setStatusText("Not saved");
        });
    }, 450);
  }, [deck, canEdit, persist, orgId, eventId, blockId]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (persist && dirty.current) void saveDeck(orgId, eventId, blockId, deckRef.current);
    };
  }, [persist, orgId, eventId, blockId]);

  function addSong(song: LibrarySong) {
    const group = groupFromSong(song, song.id);
    if (!group) {
      setSongError("This song has no lyrics yet.");
      return;
    }
    setSongError("");
    setPicker(false);
    setSongQuery("");
    focus({ itemIndex: deck.length, slideIndex: 0 });
    setDeck((current) => [...current, group]);
  }

  function addPasted() {
    const group = groupFromLyrics(songTitle, songSource);
    if (!group) {
      setSongError("Paste at least one lyric line.");
      return;
    }
    setSongError("");
    setSongTitle("");
    setSongSource("");
    setPicker(false);
    focus({ itemIndex: deck.length, slideIndex: 0 });
    setDeck((current) => [...current, group]);
  }

  function addLoose() {
    focus({ itemIndex: deck.length, slideIndex: 0 });
    setDeck((current) => [...current, looseSlide()]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <Link href={planHref} className="text-sm font-medium text-primary">
            Back to plan
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{slotTitle}</h1>
        </div>
        <p className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} role="status">
          {canEdit && persist ? statusText : ""}
        </p>
        <Button asChild className="h-10 px-4">
          <Link href={playHref}>Present</Link>
        </Button>
      </div>

      {slots.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Slots">
          {slots.map((slot) => (
            <Link
              key={slot.id}
              href={`/churches/${orgId}/events/${eventId}/slides?slot=${slot.id}`}
              aria-current={slot.id === blockId ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${slot.id === blockId ? "bg-accent font-medium" : "bg-card text-muted-foreground"}`}
            >
              {slot.title}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {deck.map((entry, itemIndex) => {
          const selected = itemIndex === safe.itemIndex;
          const label = entry.kind === "group" ? entry.title : "Slide";
          return (
            <button
              key={entry.id}
              type="button"
              aria-current={selected ? "true" : undefined}
              className={`h-10 rounded-full px-4 text-sm ${selected ? "bg-accent font-medium" : "bg-card text-muted-foreground"}`}
              onClick={() => focus({ itemIndex, slideIndex: 0 })}
            >
              {label}
              {entry.kind === "group" ? <span className="ml-2 text-xs opacity-70">{entry.slides.length}</span> : null}
            </button>
          );
        })}
        {canEdit ? (
          <>
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                aria-expanded={picker}
                className="h-10 rounded-full px-3 text-sm font-medium text-primary"
                onClick={() => setPicker((open) => !open)}
              >
                Add a song
              </button>
              {picker ? (
                <div className="absolute top-12 left-0 z-20 w-80 rounded-2xl border border-border bg-card p-3 shadow-lg">
                  {songs.length ? (
                    <>
                      <Input
                        autoFocus
                        value={songQuery}
                        placeholder="Search songs"
                        aria-label="Search songs"
                        onChange={(event) => setSongQuery(event.target.value)}
                      />
                      <ul className="mt-2 max-h-64 overflow-auto">
                        {matches.length ? (
                          matches.map((song) => (
                            <li key={song.id}>
                              <button
                                type="button"
                                className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => addSong(song)}
                              >
                                {song.title}
                                {song.defaultKey ? <span className="ml-2 text-muted-foreground">{song.defaultKey}</span> : null}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="px-2 py-3 text-sm text-muted-foreground">No matching songs.</li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <Link href={songsHref} className="font-medium text-primary">
                        Add a song
                      </Link>{" "}
                      to the library, or paste lyrics here.
                    </p>
                  )}
                  <details className="mt-3 border-t border-border pt-3">
                    <summary className="cursor-pointer text-sm font-medium">Paste lyrics</summary>
                    <div className="mt-2 grid gap-2">
                      <Input
                        value={songTitle}
                        placeholder="Song title"
                        aria-label="Song title"
                        onChange={(event) => setSongTitle(event.target.value)}
                      />
                      <Textarea
                        rows={5}
                        value={songSource}
                        aria-label="Song lyrics"
                        placeholder={"1\nFirst line\nSecond line\n\nRef\nChorus line"}
                        onChange={(event) => setSongSource(event.target.value)}
                      />
                      <Button type="button" onClick={addPasted}>
                        Add group
                      </Button>
                    </div>
                  </details>
                  {songError ? <p className="mt-2 text-sm text-destructive">{songError}</p> : null}
                </div>
              ) : null}
            </div>
            <button type="button" className="h-10 rounded-full px-3 text-sm font-medium text-primary" onClick={addLoose}>
              Add a slide
            </button>
          </>
        ) : null}
      </div>

      {slide ? (
        <>
          {canEdit ? (
            <LineStage slide={slide} onChange={(lines) => setDeck((current) => writeSlide(current, safe, { lines }))} />
          ) : (
            <SlideStage slide={slide} size="stage" className="mx-auto h-[min(42vh,26rem)] w-auto max-w-full rounded-2xl" />
          )}
          {slides.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((thumb, slideIndex) => {
                const selected = slideIndex === safe.slideIndex;
                return (
                  <button
                    key={thumb.id}
                    type="button"
                    aria-label={`Preview ${thumb.label || "slide"} ${slideIndex + 1}`}
                    aria-pressed={selected}
                    className={`w-28 shrink-0 rounded-xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${selected ? "ring-2 ring-primary" : ""}`}
                    onClick={() => focus({ itemIndex: safe.itemIndex, slideIndex })}
                  >
                    <SlideStage slide={thumb} />
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {sections.map((section) => (
              <button
                key={section.label}
                type="button"
                className={`h-10 rounded-full px-4 text-sm font-semibold ${slide.label === section.label ? "bg-accent" : "bg-card"}`}
                onClick={() => focus({ itemIndex: safe.itemIndex, slideIndex: sectionJump(slides, safe.slideIndex, section.label) })}
              >
                {section.label}
              </button>
            ))}
            <button type="button" className="h-10 rounded-full bg-card px-4 text-sm font-semibold" onClick={() => focus(step(deck, safe, -1))}>
              Previous
            </button>
            <button type="button" className="h-10 rounded-full bg-card px-4 text-sm font-semibold" onClick={() => focus(step(deck, safe, 1))}>
              Next
            </button>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2" role="group" aria-label="Background">
                {slideBackgrounds.map((background) => (
                  <button
                    key={background.id}
                    type="button"
                    aria-label={background.label}
                    aria-pressed={slide.backgroundId === background.id}
                    className={`size-8 rounded-full ring-offset-2 ${slide.backgroundId === background.id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                    style={{ background: background.value }}
                    onClick={() => {
                      if (isBackgroundId(background.id)) setDeck((current) => writeSlide(current, safe, { backgroundId: background.id }));
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="Font">
                {slideFonts.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    aria-pressed={slide.fontId === font.id}
                    className={`h-8 rounded-full px-3 text-sm ${slide.fontId === font.id ? "bg-accent font-medium" : ""}`}
                    onClick={() => {
                      if (isFontId(font.id)) setDeck((current) => writeSlide(current, safe, { fontId: font.id }));
                    }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2" role="group" aria-label="Text color">
                {slideInkChoices.map((ink) => (
                  <button
                    key={ink.label}
                    type="button"
                    aria-label={ink.label}
                    aria-pressed={slide.color === ink.id}
                    className={`grid size-8 place-items-center rounded-full text-xs ring-offset-2 ${slide.color === ink.id ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                    style={{ background: ink.id || "#fffdf8", color: ink.id === "#101f1b" ? "#fffdf8" : "#101f1b" }}
                    onClick={() => setDeck((current) => writeSlide(current, safe, { color: ink.id }))}
                  >
                    {ink.id ? "" : "A"}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                {deck.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="text-sm font-medium text-muted-foreground disabled:opacity-40"
                      disabled={safe.itemIndex === 0}
                      onClick={() => {
                        const to = safe.itemIndex - 1;
                        setDeck((current) => moveItem(current, safe.itemIndex, to));
                        focus({ itemIndex: to, slideIndex: safe.slideIndex });
                      }}
                    >
                      Move left
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-muted-foreground disabled:opacity-40"
                      disabled={safe.itemIndex === deck.length - 1}
                      onClick={() => {
                        const to = safe.itemIndex + 1;
                        setDeck((current) => moveItem(current, safe.itemIndex, to));
                        focus({ itemIndex: to, slideIndex: safe.slideIndex });
                      }}
                    >
                      Move right
                    </button>
                  </>
                ) : null}
                {item?.kind === "group" && item.songId ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground"
                    onClick={() => {
                      if (armed !== "update") {
                        setArmed("update");
                        return;
                      }
                      const song = songs.find((entry) => entry.id === item.songId);
                      if (!song) return;
                      const nextGroup = resplitGroup(item, song);
                      if (!nextGroup) return;
                      setDeck((current) => current.map((entry, index) => (index === safe.itemIndex ? nextGroup : entry)));
                      focus({ itemIndex: safe.itemIndex, slideIndex: 0 });
                      setArmed(null);
                    }}
                  >
                    {armed === "update" ? "Replace slides" : "Update from song"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-sm font-medium text-destructive"
                  onClick={() => {
                    if (armed !== "remove") {
                      setArmed("remove");
                      return;
                    }
                    const next = removeItem(deck, safe.itemIndex);
                    setDeck(next);
                    focus({ itemIndex: Math.max(0, Math.min(safe.itemIndex, next.length - 1)), slideIndex: 0 });
                    setArmed(null);
                  }}
                >
                  {armed === "remove" ? "Remove this" : "Remove"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid aspect-video place-items-center rounded-2xl bg-forest px-6 text-center text-ivory">
          <div>
            <p className="text-3xl font-semibold">Nothing on this slot yet.</p>
            <p className="mt-2 text-sm text-leaf">Add a song, or a single slide.</p>
          </div>
        </div>
      )}
    </div>
  );
}
