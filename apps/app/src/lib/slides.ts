import {
  buildSlides,
  jumpToLabel,
  makeArrangement,
  parseSongText,
  sectionButtons,
  sectionTypes,
  type LyricSlide,
  type SectionType,
  type SongDocument,
} from "@/lib/song-text";

export const slideFonts = [
  { id: "sans", label: "Sans", family: "var(--font-sans), system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Mono", family: "ui-monospace, monospace" },
] as const;

export const slideBackgrounds = [
  { id: "forest", label: "Forest", value: "#0f3d2e", ink: "#fffdf8" },
  { id: "ink", label: "Ink", value: "#101f1b", ink: "#fffdf8" },
  { id: "ivory", label: "Ivory", value: "#fffdf8", ink: "#101f1b" },
  { id: "leaf", label: "Leaf", value: "#e7f8ee", ink: "#0f3d2e" },
] as const;

export const slideInkChoices = [
  { id: "", label: "Auto" },
  { id: "#fffdf8", label: "Ivory" },
  { id: "#101f1b", label: "Ink" },
  { id: "#86efac", label: "Leaf" },
] as const;

export type SlideFontId = (typeof slideFonts)[number]["id"];
export type SlideBackgroundId = (typeof slideBackgrounds)[number]["id"];

export type DeckSlide = {
  id: string;
  label: string;
  sectionType: SectionType | null;
  sectionId: string;
  occurrence: number;
  lines: string[];
  backgroundId: SlideBackgroundId;
  fontId: SlideFontId;
  color: string;
};

export type DeckGroup = {
  id: string;
  kind: "group";
  title: string;
  songId: string | null;
  arrangementId: string | null;
  slides: DeckSlide[];
};

export type DeckLoose = {
  id: string;
  kind: "slide";
  slide: DeckSlide;
};

export type DeckItem = DeckGroup | DeckLoose;
export type Deck = DeckItem[];

export type Playhead = {
  itemIndex: number;
  slideIndex: number;
};

const fontIds = new Set<string>(slideFonts.map((font) => font.id));
const backgroundIds = new Set<string>(slideBackgrounds.map((background) => background.id));

function id() {
  return crypto.randomUUID();
}

export function blankSlide(label = "Slide"): DeckSlide {
  const slideId = id();
  return {
    id: slideId,
    label,
    sectionType: null,
    sectionId: slideId,
    occurrence: 0,
    lines: [""],
    backgroundId: "forest",
    fontId: "sans",
    color: "",
  };
}

export function looseSlide(): DeckLoose {
  return { id: id(), kind: "slide", slide: blankSlide() };
}

function fromLyric(slide: LyricSlide): DeckSlide {
  const lines = slide.lines.map((line) => line.text).filter((text) => text.trim());
  return {
    id: id(),
    label: slide.label,
    sectionType: slide.type,
    sectionId: slide.sectionId,
    occurrence: slide.occurrence,
    lines: lines.length ? lines : [""],
    backgroundId: "forest",
    fontId: "sans",
    color: "",
  };
}

export function groupFromSong(song: SongDocument, songId: string | null = null): DeckGroup | null {
  const arrangement = song.arrangements[0] ?? (song.sections.length ? makeArrangement(song.sections, song.defaultKey) : null);
  if (!arrangement) return null;
  const slides = buildSlides(song.sections, arrangement).map(fromLyric);
  if (!slides.length) return null;
  return {
    id: id(),
    kind: "group",
    title: song.title.trim() || "Song",
    songId,
    arrangementId: arrangement.id,
    slides,
  };
}

export function groupFromLyrics(title: string, source: string): DeckGroup | null {
  const sections = parseSongText(source);
  if (!sections.some((section) => section.lines.some((line) => line.text.trim()))) return null;
  return groupFromSong({
    title,
    songbookNumber: "",
    defaultKey: "",
    sections,
    arrangements: [makeArrangement(sections, "")],
  });
}

export function resplitGroup(group: DeckGroup, song: SongDocument): DeckGroup | null {
  const next = groupFromSong(song, group.songId);
  if (!next) return null;
  const style = group.slides[0];
  return {
    ...group,
    title: song.title.trim() || group.title,
    arrangementId: next.arrangementId,
    slides: next.slides.map((slide) =>
      style
        ? { ...slide, backgroundId: style.backgroundId, fontId: style.fontId, color: style.color }
        : slide,
    ),
  };
}

export function itemSlides(item: DeckItem): DeckSlide[] {
  return item.kind === "group" ? item.slides : [item.slide];
}

export function readSlide(deck: Deck, head: Playhead): DeckSlide | null {
  const item = deck[head.itemIndex];
  if (!item) return null;
  return itemSlides(item)[head.slideIndex] ?? null;
}

export function writeSlide(deck: Deck, head: Playhead, patch: Partial<DeckSlide>): Deck {
  return deck.map((item, itemIndex) => {
    if (itemIndex !== head.itemIndex) return item;
    if (item.kind === "slide") {
      if (head.slideIndex !== 0) return item;
      return { ...item, slide: { ...item.slide, ...patch, id: item.slide.id } };
    }
    return {
      ...item,
      slides: item.slides.map((slide, slideIndex) =>
        slideIndex === head.slideIndex ? { ...slide, ...patch, id: slide.id } : slide,
      ),
    };
  });
}

export function step(deck: Deck, head: Playhead, delta: -1 | 1): Playhead {
  const flat: Playhead[] = [];
  deck.forEach((item, itemIndex) => {
    itemSlides(item).forEach((_, slideIndex) => flat.push({ itemIndex, slideIndex }));
  });
  if (!flat.length) return { itemIndex: 0, slideIndex: 0 };
  const current = flat.findIndex(
    (point) => point.itemIndex === head.itemIndex && point.slideIndex === head.slideIndex,
  );
  const index = Math.min(flat.length - 1, Math.max(0, (current < 0 ? 0 : current) + delta));
  return flat[index] ?? flat[0];
}

export function slideAsLyric(slide: DeckSlide): LyricSlide {
  return {
    sectionId: slide.sectionId,
    label: slide.label,
    type: slide.sectionType ?? "other",
    occurrence: slide.occurrence,
    lines: slide.lines.map((text, index) => ({ id: `${slide.id}:${index}`, text, chords: [] })),
  };
}

export function sectionJump(slides: DeckSlide[], current: number, label: string) {
  return jumpToLabel(slides.map(slideAsLyric), current, label);
}

export function sectionLabels(slides: DeckSlide[]) {
  return sectionButtons(slides.map(slideAsLyric));
}

export function isFontId(value: string): value is SlideFontId {
  return fontIds.has(value);
}

export function isBackgroundId(value: string): value is SlideBackgroundId {
  return backgroundIds.has(value);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const inkIds = new Set<string>(slideInkChoices.map((ink) => ink.id));
const sectionIds = new Set<string>(sectionTypes);

export function backgroundFor(id: string) {
  return slideBackgrounds.find((item) => item.id === id) ?? slideBackgrounds[0];
}

export function clampHead(deck: Deck, head: Playhead): Playhead {
  if (!deck.length) return { itemIndex: 0, slideIndex: 0 };
  const itemIndex = Math.min(Math.max(head.itemIndex, 0), deck.length - 1);
  const total = Math.max(itemSlides(deck[itemIndex]).length, 1);
  return { itemIndex, slideIndex: Math.min(Math.max(head.slideIndex, 0), total - 1) };
}

export function moveItem(deck: Deck, from: number, to: number): Deck {
  if (from === to || from < 0 || to < 0 || from >= deck.length || to >= deck.length) return deck;
  const next = deck.slice();
  const [item] = next.splice(from, 1);
  if (!item) return deck;
  next.splice(to, 0, item);
  return next;
}

export function removeItem(deck: Deck, index: number): Deck {
  return deck.filter((_, itemIndex) => itemIndex !== index);
}

export function slideFromRow(row: {
  id: string;
  label: string;
  sectionType: SectionType | null;
  sectionId: string;
  occurrence: number;
  lines: string[];
  background: string;
  font: string;
  color: string;
}): DeckSlide {
  const lines = row.lines.map((line) => line.slice(0, 180)).slice(0, 8);
  return {
    id: row.id,
    label: row.label.slice(0, 24),
    sectionType: row.sectionType && sectionIds.has(row.sectionType) ? row.sectionType : null,
    sectionId: uuidPattern.test(row.sectionId) ? row.sectionId : row.id,
    occurrence: Number.isInteger(row.occurrence) ? Math.min(99, Math.max(0, row.occurrence)) : 0,
    lines: lines.length ? lines : [""],
    backgroundId: isBackgroundId(row.background) ? row.background : "forest",
    fontId: isFontId(row.font) ? row.font : "sans",
    color: inkIds.has(row.color) ? row.color : "",
  };
}

function cleanLines(value: unknown) {
  if (!Array.isArray(value)) return [""];
  const lines = value
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.slice(0, 180))
    .slice(0, 8);
  return lines.length ? lines : [""];
}

function cleanSlide(value: unknown, seen: Set<string>): DeckSlide | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<DeckSlide>;
  if (typeof row.id !== "string" || !uuidPattern.test(row.id) || seen.has(row.id)) return null;
  seen.add(row.id);
  const sectionType =
    typeof row.sectionType === "string" && sectionIds.has(row.sectionType) ? (row.sectionType as SectionType) : null;
  return slideFromRow({
    id: row.id,
    label: typeof row.label === "string" ? row.label : "",
    sectionType,
    sectionId: typeof row.sectionId === "string" ? row.sectionId : row.id,
    occurrence: typeof row.occurrence === "number" ? row.occurrence : 0,
    lines: cleanLines(row.lines),
    background: typeof row.backgroundId === "string" ? row.backgroundId : "forest",
    font: typeof row.fontId === "string" ? row.fontId : "sans",
    color: typeof row.color === "string" ? row.color : "",
  });
}

export function prepareDeck(input: unknown): { deck: Deck } | { error: string } {
  if (!Array.isArray(input) || input.length > 24) return { error: "Could not save these slides" };
  const seen = new Set<string>();
  const deck: Deck = [];
  for (const value of input) {
    if (!value || typeof value !== "object" || !("kind" in value)) return { error: "Could not save these slides" };
    const row = value as { id?: unknown; kind?: unknown };
    if (typeof row.id !== "string" || !uuidPattern.test(row.id) || seen.has(row.id)) {
      return { error: "Could not save these slides" };
    }
    seen.add(row.id);
    if (row.kind === "slide" && "slide" in value) {
      const slide = cleanSlide(value.slide, seen);
      if (!slide) return { error: "Could not save these slides" };
      deck.push({ id: row.id, kind: "slide", slide });
      continue;
    }
    if (row.kind !== "group" || !("slides" in value) || !Array.isArray(value.slides) || value.slides.length > 40) {
      return { error: "Could not save these slides" };
    }
    const slides = value.slides.flatMap((item: unknown) => {
      const slide = cleanSlide(item, seen);
      return slide ? [slide] : [];
    });
    if (slides.length !== value.slides.length || slides.length === 0) return { error: "Could not save these slides" };
    const songId = "songId" in value && typeof value.songId === "string" && uuidPattern.test(value.songId) ? value.songId : null;
    const arrangementId =
      "arrangementId" in value && typeof value.arrangementId === "string" && uuidPattern.test(value.arrangementId)
        ? value.arrangementId
        : null;
    const title = "title" in value && typeof value.title === "string" ? value.title.trim().slice(0, 120) : "";
    deck.push({ id: row.id, kind: "group", title: title || "Song", songId, arrangementId, slides });
  }
  return { deck };
}

export function lyricScale(lineCount: number) {
  if (lineCount <= 1) return "text-5xl leading-tight sm:text-7xl";
  if (lineCount === 2) return "text-4xl leading-tight sm:text-6xl";
  if (lineCount <= 4) return "text-3xl leading-tight sm:text-5xl";
  return "text-2xl leading-tight sm:text-4xl";
}

export function itemLabel(item: DeckItem) {
  if (item.kind === "group") return item.title || "Song";
  const line = item.slide.lines.find((entry) => entry.trim())?.trim() ?? "";
  return line ? line.slice(0, 28) : "Slide";
}

export function isMissingSlidesTable(error: unknown) {
  const parts: unknown[] = [];
  let current: unknown = error;
  while (current && parts.length < 5) {
    parts.push(current);
    current = typeof current === "object" && "cause" in current ? current.cause : null;
  }
  return parts.some((item) => {
    if (!item || typeof item !== "object") return false;
    if ("code" in item && item.code === "42P01") return true;
    return "message" in item && typeof item.message === "string" && item.message.includes("deck_item");
  });
}

export function fontFor(id: string) {
  return slideFonts.find((item) => item.id === id) ?? slideFonts[0];
}
