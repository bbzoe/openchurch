"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildSlides,
  makeArrangement,
  parseChordField,
  parseSongText,
  sectionTypes,
  type SectionType,
  type SongDocument,
  type SongLine,
  type SongSection,
} from "@/lib/song-text";
import { saveSong } from "@/server/actions";

const typeLabels: Record<SectionType, string> = {
  verse: "Verse",
  chorus: "Chorus",
  bridge: "Bridge",
  tag: "Tag",
  intro: "Intro",
  ending: "Ending",
  other: "Other",
};

function labelForType(type: SectionType, current: string) {
  if (type === "verse" || !/^\d+$/.test(current)) return current;
  if (type === "chorus") return "Ref";
  if (type === "ending") return "Koniec";
  return typeLabels[type];
}

function nextVerseLabel(sections: SongSection[]) {
  const numbers = sections
    .filter((section) => section.type === "verse")
    .map((section) => Number(section.label))
    .filter((number) => Number.isInteger(number));
  return String(Math.max(0, ...numbers) + 1);
}

function ChordField({
  chords,
  disabled,
  onChange,
}: {
  chords: string[];
  disabled: boolean;
  onChange: (chords: string[]) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      value={draft ?? chords.join(" ")}
      disabled={disabled}
      aria-label="Chords"
      placeholder="a G F"
      className="h-10 bg-ivory font-mono"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== null) onChange(parseChordField(draft));
        setDraft(null);
      }}
    />
  );
}

export function SongEditor({
  orgId,
  songId,
  canEdit,
  initial,
}: {
  orgId: string;
  songId: string | null;
  canEdit: boolean;
  initial: SongDocument;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState(initial);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [error, setError] = useState("");
  const [arrangementIndex, setArrangementIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const arrangement = doc.arrangements[arrangementIndex] ?? doc.arrangements[0] ?? null;
  const slides = useMemo(
    () => (arrangement ? buildSlides(doc.sections, arrangement) : []),
    [arrangement, doc.sections],
  );

  function updateArrangement(id: string, patch: Partial<(typeof doc.arrangements)[number]>) {
    setDoc((prev) => ({
      ...prev,
      arrangements: prev.arrangements.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function applyPaste() {
    const sections = parseSongText(paste);
    if (!sections.length) {
      setPasteError("No lyrics in that text.");
      return;
    }
    setPasteError("");
    setPaste("");
    setArrangementIndex(0);
    setDoc((prev) => ({
      ...prev,
      sections,
      arrangements: prev.arrangements.length
        ? prev.arrangements.map((item) => ({
            ...item,
            sequence: sections.map((section) => section.id),
            breaks: [],
          }))
        : [makeArrangement(sections, prev.defaultKey)],
    }));
  }

  function addSection() {
    const section: SongSection = {
      id: crypto.randomUUID(),
      type: "verse",
      label: nextVerseLabel(doc.sections),
      lines: [],
    };
    setDoc((prev) => {
      const sections = [...prev.sections, section];
      return {
        ...prev,
        sections,
        arrangements: prev.arrangements.length
          ? prev.arrangements.map((item) => ({ ...item, sequence: [...item.sequence, section.id] }))
          : [makeArrangement(sections, prev.defaultKey)],
      };
    });
  }

  function updateSection(sectionId: string, patch: Partial<SongSection>) {
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setDoc((prev) => {
      const next = index + direction;
      if (next < 0 || next >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      const [item] = sections.splice(index, 1);
      if (!item) return prev;
      sections.splice(next, 0, item);
      return { ...prev, sections };
    });
  }

  function removeSection(sectionId: string) {
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
      arrangements: prev.arrangements.map((item) => ({
        ...item,
        sequence: item.sequence.filter((id) => id !== sectionId),
        breaks: item.breaks.filter((itemBreak) => itemBreak.sectionId !== sectionId),
      })),
    }));
  }

  function updateLine(sectionId: string, lineId: string, patch: Partial<SongLine>) {
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
            }
          : section,
      ),
    }));
  }

  function addLine(sectionId: string) {
    const line: SongLine = { id: crypto.randomUUID(), text: "", chords: [] };
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, lines: [...section.lines, line] } : section,
      ),
    }));
  }

  function removeLine(sectionId: string, lineIndex: number) {
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: section.lines.filter((_, index) => index !== lineIndex) }
          : section,
      ),
      arrangements: prev.arrangements.map((item) => ({
        ...item,
        breaks: item.breaks.flatMap((itemBreak) => {
          if (itemBreak.sectionId !== sectionId) return [itemBreak];
          if (itemBreak.afterLine === lineIndex) return [];
          if (itemBreak.afterLine > lineIndex) return [{ ...itemBreak, afterLine: itemBreak.afterLine - 1 }];
          return [itemBreak];
        }),
      })),
    }));
  }

  function toggleBreak(sectionId: string, afterLine: number) {
    if (!arrangement) return;
    const exists = arrangement.breaks.some((item) => item.sectionId === sectionId && item.afterLine === afterLine);
    updateArrangement(arrangement.id, {
      breaks: exists
        ? arrangement.breaks.filter((item) => !(item.sectionId === sectionId && item.afterLine === afterLine))
        : [...arrangement.breaks, { sectionId, afterLine }],
    });
  }

  function moveSequence(index: number, direction: -1 | 1) {
    if (!arrangement) return;
    const next = index + direction;
    if (next < 0 || next >= arrangement.sequence.length) return;
    const sequence = [...arrangement.sequence];
    const [item] = sequence.splice(index, 1);
    if (!item) return;
    sequence.splice(next, 0, item);
    updateArrangement(arrangement.id, { sequence });
  }

  function save() {
    setError("");
    startTransition(async () => {
      const result = await saveSong(orgId, songId, doc);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (!songId) router.push(`/churches/${orgId}/songs/${result.id}`);
      else router.refresh();
    });
  }

  const pasteBox = (
    <div className="grid gap-2 rounded-2xl bg-card p-4">
      <label className="grid gap-1 text-sm font-medium">
        Paste lyrics
        <Textarea
          value={paste}
          disabled={!canEdit}
          rows={8}
          placeholder={"1.\nFirst line of the verse C\nNext line a G\n\nRef:\nRefrain line F C"}
          className="bg-ivory font-mono"
          onChange={(event) => setPaste(event.target.value)}
        />
      </label>
      <p className="text-sm text-body">
        A line like Ref: or 1. starts a section. Chords at the end of a line, such as aGF or F C, stay with that line and stay off the screen.
      </p>
      {pasteError ? <p className="text-sm text-destructive">{pasteError}</p> : null}
      {canEdit ? (
        <Button type="button" className="h-10 w-fit px-4" onClick={applyPaste}>
          {doc.sections.length ? "Replace sections" : "Read sections"}
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-6">
      <Link href={`/churches/${orgId}/songs`} className="text-sm text-body">
        Songs
      </Link>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-2xl bg-card p-4">
            <label className="grid gap-1 text-sm font-medium">
              Title
              <Input
                value={doc.title}
                disabled={!canEdit}
                required
                className="h-10 bg-ivory"
                onChange={(event) => setDoc((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Songbook no.
                <Input
                  value={doc.songbookNumber}
                  disabled={!canEdit}
                  className="h-10 bg-ivory"
                  onChange={(event) => setDoc((prev) => ({ ...prev, songbookNumber: event.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Default key
                <Input
                  value={doc.defaultKey}
                  disabled={!canEdit}
                  placeholder="G"
                  className="h-10 bg-ivory"
                  onChange={(event) => setDoc((prev) => ({ ...prev, defaultKey: event.target.value }))}
                />
              </label>
            </div>
          </div>
          {doc.sections.length === 0 ? (
            pasteBox
          ) : (
            <details className="rounded-2xl bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">Replace from paste</summary>
              <div className="mt-3 grid gap-2">
                <Textarea
                  value={paste}
                  disabled={!canEdit}
                  rows={8}
                  placeholder={"1.\nFirst line of the verse C\nNext line a G\n\nRef:\nRefrain line F C"}
                  className="bg-ivory font-mono"
                  onChange={(event) => setPaste(event.target.value)}
                />
                {pasteError ? <p className="text-sm text-destructive">{pasteError}</p> : null}
                {canEdit ? (
                  <Button type="button" className="h-10 w-fit px-4" onClick={applyPaste}>
                    Replace sections
                  </Button>
                ) : null}
              </div>
            </details>
          )}
          <div className="grid gap-3">
            {doc.sections.map((section, sectionIndex) => (
              <section key={section.id} className="grid gap-3 rounded-2xl bg-card p-4">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="grid gap-1 text-sm font-medium">
                    Label
                    <Input
                      value={section.label}
                      disabled={!canEdit}
                      className="h-10 w-24 bg-ivory"
                      onChange={(event) => updateSection(section.id, { label: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Part
                    <select
                      value={section.type}
                      disabled={!canEdit}
                      className="h-10 rounded-lg border border-input bg-ivory px-2.5 text-sm"
                      onChange={(event) => {
                        const type = event.target.value as SectionType;
                        updateSection(section.id, { type, label: labelForType(type, section.label) });
                      }}
                    >
                      {sectionTypes.map((type) => (
                        <option key={type} value={type}>
                          {typeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {canEdit ? (
                    <div className="ml-auto flex gap-2">
                      <Button type="button" variant="outline" className="h-10" onClick={() => moveSection(sectionIndex, -1)}>
                        Up
                      </Button>
                      <Button type="button" variant="outline" className="h-10" onClick={() => moveSection(sectionIndex, 1)}>
                        Down
                      </Button>
                      <Button type="button" variant="outline" className="h-10" onClick={() => removeSection(section.id)}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  {section.lines.map((line, lineIndex) => {
                    const broken = arrangement?.breaks.some(
                      (item) => item.sectionId === section.id && item.afterLine === lineIndex,
                    );
                    return (
                      <div key={line.id} className="grid gap-2">
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                          <Input
                            value={line.text}
                            disabled={!canEdit}
                            aria-label="Lyric line"
                            className="h-10 bg-ivory"
                            onChange={(event) => updateLine(section.id, line.id, { text: event.target.value })}
                          />
                          <ChordField
                            chords={line.chords}
                            disabled={!canEdit}
                            onChange={(chords) => updateLine(section.id, line.id, { chords })}
                          />
                          {canEdit ? (
                            <Button type="button" variant="outline" className="h-10" onClick={() => removeLine(section.id, lineIndex)}>
                              Remove
                            </Button>
                          ) : null}
                        </div>
                        {canEdit && lineIndex < section.lines.length - 1 ? (
                          <button
                            type="button"
                            className={`text-left text-xs font-medium ${broken ? "text-action" : "text-body"}`}
                            onClick={() => toggleBreak(section.id, lineIndex)}
                          >
                            {broken ? "Slide break" : "Break here"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {canEdit ? (
                  <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => addLine(section.id)}>
                    Add line
                  </Button>
                ) : null}
              </section>
            ))}
            {canEdit ? (
              <Button type="button" variant="outline" className="h-10 w-fit" onClick={addSection}>
                Add section
              </Button>
            ) : null}
            {canEdit && doc.sections.length ? (
              <p className="text-sm text-body">Break here applies only to the arrangement selected on the right.</p>
            ) : null}
          </div>
          {canEdit ? (
            <Button type="button" className="h-10 w-fit px-4" disabled={pending || !doc.title.trim()} onClick={save}>
              {pending ? "Saving" : "Save song"}
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 lg:sticky lg:top-4">
          <div className="grid gap-3 rounded-2xl bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {doc.arrangements.map((item, index) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={item.id === arrangement?.id ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setArrangementIndex(index)}
                >
                  {item.name || "Arrangement"}
                </Button>
              ))}
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    const name = doc.arrangements.length === 1 ? "Short" : `Arrangement ${doc.arrangements.length + 1}`;
                    const created = arrangement
                      ? { ...arrangement, id: crypto.randomUUID(), name, breaks: [...arrangement.breaks] }
                      : makeArrangement(doc.sections, doc.defaultKey, name);
                    setDoc((prev) => ({ ...prev, arrangements: [...prev.arrangements, created] }));
                    setArrangementIndex(doc.arrangements.length);
                  }}
                >
                  Add arrangement
                </Button>
              ) : null}
            </div>
            {arrangement ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-medium">
                    Arrangement
                    <Input
                      value={arrangement.name}
                      disabled={!canEdit}
                      className="h-10 bg-ivory"
                      onChange={(event) => updateArrangement(arrangement.id, { name: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Key
                    <Input
                      value={arrangement.key}
                      disabled={!canEdit}
                      placeholder={doc.defaultKey || "G"}
                      className="h-10 bg-ivory"
                      onChange={(event) => updateArrangement(arrangement.id, { key: event.target.value })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={arrangement.slideMode === "section" ? "default" : "outline"}
                    className="h-10"
                    disabled={!canEdit}
                    onClick={() => updateArrangement(arrangement.id, { slideMode: "section" })}
                  >
                    Whole section
                  </Button>
                  <Button
                    type="button"
                    variant={arrangement.slideMode === "lines" && arrangement.linesPerSlide === 4 ? "default" : "outline"}
                    className="h-10"
                    disabled={!canEdit}
                    onClick={() => updateArrangement(arrangement.id, { slideMode: "lines", linesPerSlide: 4 })}
                  >
                    4 lines
                  </Button>
                  <Button
                    type="button"
                    variant={arrangement.slideMode === "lines" && arrangement.linesPerSlide === 2 ? "default" : "outline"}
                    className="h-10"
                    disabled={!canEdit}
                    onClick={() => updateArrangement(arrangement.id, { slideMode: "lines", linesPerSlide: 2 })}
                  >
                    2 lines
                  </Button>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Order</p>
                  <div className="flex flex-wrap gap-2">
                    {arrangement.sequence.map((sectionId, index) => {
                      const section = doc.sections.find((item) => item.id === sectionId);
                      return (
                        <span key={`${sectionId}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-sm">
                          {section?.label ?? "?"}
                          {canEdit ? (
                            <>
                              <button type="button" className="px-1" onClick={() => moveSequence(index, -1)} aria-label="Move earlier">
                                ↑
                              </button>
                              <button type="button" className="px-1" onClick={() => moveSequence(index, 1)} aria-label="Move later">
                                ↓
                              </button>
                              <button
                                type="button"
                                className="px-1"
                                aria-label="Remove from order"
                                onClick={() =>
                                  updateArrangement(arrangement.id, {
                                    sequence: arrangement.sequence.filter((_, itemIndex) => itemIndex !== index),
                                  })
                                }
                              >
                                ×
                              </button>
                            </>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      {doc.sections.map((section) => (
                        <Button
                          key={section.id}
                          type="button"
                          variant="outline"
                          className="h-8"
                          onClick={() =>
                            updateArrangement(arrangement.id, { sequence: [...arrangement.sequence, section.id] })
                          }
                        >
                          + {section.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {canEdit && doc.arrangements.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-fit"
                    onClick={() => {
                      setDoc((prev) => ({
                        ...prev,
                        arrangements: prev.arrangements.filter((item) => item.id !== arrangement.id),
                      }));
                      setArrangementIndex(0);
                    }}
                  >
                    Remove arrangement
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-body">Add a section to start an arrangement.</p>
            )}
          </div>
          <SlideStack title="Audience" slides={slides} showChords={false} />
          <SlideStack title="Band" slides={slides} showChords />
        </div>
      </div>
    </div>
  );
}

function SlideStack({
  title,
  slides,
  showChords,
}: {
  title: string;
  slides: ReturnType<typeof buildSlides>;
  showChords: boolean;
}) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {slides.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-sm text-body">No slides yet.</p>
      ) : (
        slides.map((slide, index) => (
          <article key={`${slide.sectionId}-${slide.occurrence}-${index}`} className="rounded-2xl bg-card px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-body uppercase">{slide.label}</p>
            <div className="mt-2 grid gap-1">
              {slide.lines.map((line, lineIndex) =>
                !showChords && !line.text.trim() ? null : (
                  <p key={lineIndex} className="flex items-baseline justify-between gap-4 text-lg leading-snug">
                    <span>{line.text}</span>
                    {showChords && line.chords.length ? (
                      <span className="shrink-0 font-mono text-sm text-action">{line.chords.join(" ")}</span>
                    ) : null}
                  </p>
                ),
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
