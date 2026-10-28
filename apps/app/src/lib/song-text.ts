export const sectionTypes = ["verse", "chorus", "bridge", "tag", "intro", "ending", "other"] as const;

export type SectionType = (typeof sectionTypes)[number];

export type SongLine = {
  id: string;
  text: string;
  chords: string[];
};

export type SongSection = {
  id: string;
  type: SectionType;
  label: string;
  lines: SongLine[];
};

export type SlideBreak = {
  sectionId: string;
  afterLine: number;
};

export type SongArrangement = {
  id: string;
  name: string;
  key: string;
  sequence: string[];
  slideMode: "section" | "lines";
  linesPerSlide: number;
  breaks: SlideBreak[];
};

export type SongDocument = {
  title: string;
  songbookNumber: string;
  defaultKey: string;
  sections: SongSection[];
  arrangements: SongArrangement[];
};

export type LyricSlide = {
  sectionId: string;
  label: string;
  type: SectionType;
  occurrence: number;
  lines: SongLine[];
};

const CHORD =
  /^([A-Ha-h])(#|b)?(maj7|maj9|min|dim|aug|sus4|sus2|sus|add|m)?(\d+)?(\/[A-Ha-h](#|b)?)?/;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const separator = "[:.\\-\\u2013\\u2014]";

type Header = { type: SectionType; label: string; rest: string };

const headerRules: { re: RegExp; build: (match: RegExpMatchArray) => Header }[] = [
  {
    re: new RegExp(`^(?:ref(?:ren)?|chorus)\\s*(\\d{1,2})?\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({ type: "chorus", label: match[1] ? `Ref ${match[1]}` : "Ref", rest: match[2] ?? "" }),
  },
  {
    re: new RegExp(`^(?:bridge|most)\\s*(\\d{1,2})?\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({
      type: "bridge",
      label: match[1] ? `Bridge ${match[1]}` : "Bridge",
      rest: match[2] ?? "",
    }),
  },
  {
    re: new RegExp(`^tag\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({ type: "tag", label: "Tag", rest: match[1] ?? "" }),
  },
  {
    re: new RegExp(`^intro\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({ type: "intro", label: "Intro", rest: match[1] ?? "" }),
  },
  {
    re: new RegExp(
      `^(?:zakończenie|zakonczenie|ending|outro)\\s*(?:${separator}\\s*([\\s\\S]*))?$`,
      "i",
    ),
    build: (match) => ({ type: "ending", label: "Koniec", rest: match[1] ?? "" }),
  },
  {
    re: new RegExp(`^(?:pre-?chorus|przedrefren)\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({ type: "other", label: "Pre", rest: match[1] ?? "" }),
  },
  {
    re: new RegExp(`^(?:zwrotka|verse)\\s*(\\d{1,2})?\\s*(?:${separator}\\s*([\\s\\S]*))?$`, "i"),
    build: (match) => ({ type: "verse", label: match[1] ?? "", rest: match[2] ?? "" }),
  },
  {
    re: /^(\d{1,2})\s*[.)]\s*([\s\S]*)$/,
    build: (match) => ({ type: "verse", label: match[1] ?? "", rest: match[2] ?? "" }),
  },
  {
    re: /^(\d{1,2})$/,
    build: (match) => ({ type: "verse", label: match[1] ?? "", rest: "" }),
  },
];

export function parseChordToken(token: string): string[] | null {
  const cleaned = token
    .replace(/[.,;:]+$/g, "")
    .replace(/♯/g, "#")
    .replace(/♭/g, "b");
  if (!cleaned) return null;
  const chords: string[] = [];
  let rest = cleaned;
  while (rest.length) {
    const match = CHORD.exec(rest);
    if (!match || match.index !== 0 || match[0].length === 0) return null;
    chords.push(match[0]);
    rest = rest.slice(match[0].length);
  }
  if (chords.length === 1) return chords;
  if (chords.length > 3) return null;
  if (!chords.every((chord) => /^[A-Ha-h](#|b)?$/.test(chord))) return null;
  if (/^[A-H][a-h]+$/.test(cleaned) && cleaned.length > 2) return null;
  return chords;
}

export function parseChordField(value: string): string[] {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  const chords: string[] = [];
  for (const token of tokens) {
    const parsed = parseChordToken(token);
    chords.push(...(parsed ?? [token]));
  }
  return chords;
}

function matchHeader(line: string): Header | null {
  for (const rule of headerRules) {
    const match = line.match(rule.re);
    if (match) return rule.build(match);
  }
  return null;
}

function splitLyricAndChords(line: string): { text: string; chords: string[] } {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  const chords: string[] = [];
  while (parts.length) {
    const parsed = parseChordToken(parts[parts.length - 1] ?? "");
    if (!parsed) break;
    chords.unshift(...parsed);
    parts.pop();
  }
  return { text: parts.join(" "), chords };
}

function makeSection(type: SectionType, label: string): SongSection {
  return { id: crypto.randomUUID(), type, label, lines: [] };
}

export function parseSongText(source: string): SongSection[] {
  const sections: SongSection[] = [];
  let current: SongSection | null = null;
  let verseCount = 0;

  function verseLabel(explicit: string) {
    if (explicit) {
      const number = Number(explicit);
      if (Number.isInteger(number)) verseCount = Math.max(verseCount, number);
      return explicit;
    }
    verseCount += 1;
    return String(verseCount);
  }

  function open(header: Header) {
    const label = header.type === "verse" ? verseLabel(header.label) : header.label;
    current = makeSection(header.type, label);
    sections.push(current);
    return current;
  }

  function ensure(): SongSection {
    if (current) return current;
    verseCount += 1;
    current = makeSection("verse", String(verseCount));
    sections.push(current);
    return current;
  }

  for (const raw of source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line || /^[-=_\u2013\u2014]{3,}$/.test(line)) continue;
    const header = matchHeader(line);
    if (header) {
      const section = open(header);
      const rest = header.rest.trim();
      if (rest) section.lines.push({ id: crypto.randomUUID(), ...splitLyricAndChords(rest) });
      continue;
    }
    ensure().lines.push({ id: crypto.randomUUID(), ...splitLyricAndChords(line) });
  }

  return sections;
}

export function emptySong(): SongDocument {
  return { title: "", songbookNumber: "", defaultKey: "", sections: [], arrangements: [] };
}

export function makeArrangement(sections: SongSection[], key: string, name = "Full"): SongArrangement {
  return {
    id: crypto.randomUUID(),
    name,
    key,
    sequence: sections.map((section) => section.id),
    slideMode: "lines",
    linesPerSlide: 2,
    breaks: [],
  };
}

export function buildSlides(sections: SongSection[], arrangement: SongArrangement): LyricSlide[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const seen = new Map<string, number>();
  const slides: LyricSlide[] = [];
  for (const sectionId of arrangement.sequence) {
    const section = byId.get(sectionId);
    if (!section) continue;
    const occurrence = seen.get(sectionId) ?? 0;
    seen.set(sectionId, occurrence + 1);
    const breaks = new Set(
      arrangement.breaks.filter((item) => item.sectionId === sectionId).map((item) => item.afterLine),
    );
    const size = arrangement.slideMode === "lines" ? Math.max(1, arrangement.linesPerSlide) : Number.POSITIVE_INFINITY;
    let current: SongLine[] = [];
    const flush = () => {
      if (!current.length) return;
      slides.push({
        sectionId,
        label: section.label,
        type: section.type,
        occurrence,
        lines: current,
      });
      current = [];
    };
    section.lines.forEach((line, index) => {
      if (!line.text.trim() && line.chords.length === 0) {
        if (breaks.has(index)) flush();
        return;
      }
      current.push(line);
      if (breaks.has(index) || current.length >= size) flush();
    });
    flush();
  }
  return slides;
}

export function sectionButtons(slides: LyricSlide[]): { label: string; type: SectionType }[] {
  const seen = new Set<string>();
  const buttons: { label: string; type: SectionType }[] = [];
  for (const slide of slides) {
    if (seen.has(slide.label)) continue;
    seen.add(slide.label);
    buttons.push({ label: slide.label, type: slide.type });
  }
  return buttons;
}

export function jumpToLabel(slides: LyricSlide[], current: number, label: string): number {
  const starts: number[] = [];
  slides.forEach((slide, index) => {
    const previous = slides[index - 1];
    const startsHere =
      !previous || previous.sectionId !== slide.sectionId || previous.occurrence !== slide.occurrence;
    if (startsHere && slide.label === label) starts.push(index);
  });
  if (!starts.length) return current;
  const here = slides[current];
  const forward = starts.find((index) => {
    if (!here || here.label !== label) return index >= current;
    const slide = slides[index];
    return index > current && (slide?.sectionId !== here.sectionId || slide.occurrence !== here.occurrence);
  });
  return forward ?? starts[0] ?? current;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asStringArrayValue(value: unknown): string[] {
  return asStringArray(value);
}

export function asBreaks(value: unknown): SlideBreak[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const sectionId = "sectionId" in item ? String(item.sectionId) : "";
    const afterLine = "afterLine" in item ? Number(item.afterLine) : Number.NaN;
    if (!sectionId || !Number.isInteger(afterLine) || afterLine < 0) return [];
    return [{ sectionId, afterLine }];
  });
}

function defaultLabel(type: SectionType): string {
  if (type === "chorus") return "Ref";
  if (type === "bridge") return "Bridge";
  if (type === "tag") return "Tag";
  if (type === "intro") return "Intro";
  if (type === "ending") return "Koniec";
  if (type === "verse") return "1";
  return "Part";
}

export function prepareSong(input: SongDocument): { error: string } | { song: SongDocument } {
  const title = input.title.trim();
  if (!title) return { error: "Title is required" };
  if (title.length > 200) return { error: "Title is too long" };
  const seen = new Set<string>();
  const sections: SongSection[] = [];
  for (const section of input.sections.slice(0, 40)) {
    if (!UUID.test(section.id) || seen.has(section.id)) return { error: "Could not save this song" };
    seen.add(section.id);
    const type = sectionTypes.includes(section.type) ? section.type : "other";
    const lines: SongLine[] = [];
    for (const line of section.lines.slice(0, 80)) {
      if (!UUID.test(line.id) || seen.has(line.id)) return { error: "Could not save this song" };
      seen.add(line.id);
      lines.push({
        id: line.id,
        text: line.text.slice(0, 400),
        chords: asStringArray(line.chords)
          .map((chord) => chord.trim())
          .filter(Boolean)
          .slice(0, 8)
          .map((chord) => chord.slice(0, 16)),
      });
    }
    sections.push({
      id: section.id,
      type,
      label: section.label.trim().slice(0, 24) || defaultLabel(type),
      lines,
    });
  }
  const known = new Set(sections.map((section) => section.id));
  const arrangements: SongArrangement[] = [];
  for (const [index, item] of input.arrangements.slice(0, 12).entries()) {
    if (!UUID.test(item.id) || seen.has(item.id)) return { error: "Could not save this song" };
    seen.add(item.id);
    const slideMode = item.slideMode === "section" ? "section" : "lines";
    arrangements.push({
      id: item.id,
      name: item.name.trim().slice(0, 80) || `Arrangement ${index + 1}`,
      key: item.key.trim().slice(0, 16),
      sequence: item.sequence.filter((id) => known.has(id)).slice(0, 80),
      slideMode,
      linesPerSlide: item.linesPerSlide === 4 ? 4 : 2,
      breaks: asBreaks(item.breaks).filter((itemBreak) => {
        const section = sections.find((section) => section.id === itemBreak.sectionId);
        return Boolean(section && itemBreak.afterLine < section.lines.length);
      }),
    });
  }
  return {
    song: {
      title,
      songbookNumber: input.songbookNumber.trim().slice(0, 40),
      defaultKey: input.defaultKey.trim().slice(0, 16),
      sections,
      arrangements:
        arrangements.length || sections.length === 0
          ? arrangements
          : [makeArrangement(sections, input.defaultKey.trim().slice(0, 16))],
    },
  };
}
