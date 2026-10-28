"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  backgroundFor,
  clampHead,
  fontFor,
  itemLabel,
  itemSlides,
  lyricScale,
  readSlide,
  sectionJump,
  sectionLabels,
  step,
  type Deck,
  type Playhead,
} from "@/lib/slides";

export function SlideShow({
  deck,
  eyebrow,
  editHref,
}: {
  deck: Deck;
  eyebrow?: string;
  editHref?: string;
}) {
  const [head, setHead] = useState<Playhead>({ itemIndex: 0, slideIndex: 0 });
  const safe = clampHead(deck, head);
  const item = deck[safe.itemIndex] ?? null;
  const slides = item ? itemSlides(item) : [];
  const slide = readSlide(deck, safe);
  const sections = item?.kind === "group" ? sectionLabels(slides) : [];
  const background = backgroundFor(slide?.backgroundId ?? "forest");
  const font = fontFor(slide?.fontId ?? "sans");
  const lines = slide?.lines.map((line) => line.trim()).filter(Boolean) ?? [];
  const total = deck.reduce((sum, entry) => sum + itemSlides(entry).length, 0);
  const place =
    deck.slice(0, safe.itemIndex).reduce((sum, entry) => sum + itemSlides(entry).length, 0) + safe.slideIndex + 1;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea")) return;
      event.preventDefault();
      setHead((current) => step(deck, clampHead(deck, current), event.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck]);

  return (
    <div className="relative min-h-svh" style={{ background: background.value, color: slide?.color || background.ink, fontFamily: font.family }}>
      <div className="flex min-h-svh flex-col items-center justify-center px-8 pb-28">
        {eyebrow ? <p className="mb-8 text-sm font-medium tracking-wide opacity-70">{eyebrow}</p> : null}
        {slide && lines.length ? (
          <div className="flex max-h-[70svh] flex-col items-center justify-center gap-3 overflow-hidden">
            {lines.map((line, index) => (
              <p key={`${index}-${line}`} className={`max-w-[16ch] text-center font-semibold ${lyricScale(lines.length)}`}>
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-center text-3xl font-semibold opacity-70">
            {slide ? "Empty slide" : "This slot has no slides yet."}
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-black/55 px-4 py-3 font-sans text-white backdrop-blur-md">
        {deck.map((entry, itemIndex) => (
          <button
            key={entry.id}
            type="button"
            className={`h-10 max-w-48 truncate rounded-full px-4 text-sm font-semibold ${itemIndex === safe.itemIndex ? "bg-white text-ink" : "bg-white/15"}`}
            onClick={() => setHead({ itemIndex, slideIndex: 0 })}
          >
            {itemLabel(entry)}
          </button>
        ))}
        {sections.map((section) => (
          <button
            key={section.label}
            type="button"
            className={`h-10 rounded-full px-4 text-sm font-semibold ${slide?.label === section.label ? "bg-white text-ink" : "bg-white/15"}`}
            onClick={() => setHead({ itemIndex: safe.itemIndex, slideIndex: sectionJump(slides, safe.slideIndex, section.label) })}
          >
            {section.label}
          </button>
        ))}
        <button
          type="button"
          className="h-10 rounded-full bg-white/15 px-4 text-sm font-semibold"
          onClick={() => setHead(step(deck, safe, -1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-10 rounded-full bg-white/15 px-4 text-sm font-semibold"
          onClick={() => setHead(step(deck, safe, 1))}
        >
          Next
        </button>
        {total ? <span className="text-sm text-white/80">{place}/{total}</span> : null}
        {editHref ? (
          <Link href={editHref} className="ml-auto text-sm font-medium text-white">
            Edit
          </Link>
        ) : null}
      </div>
    </div>
  );
}
