"use client";

import { useEffect, useRef, useState } from "react";
import { jumpToLabel, sectionButtons, type LyricSlide } from "@/lib/song-text";

export function SongSlides({
  title,
  songKey,
  slides,
  autoFocus = false,
}: {
  title: string;
  songKey: string;
  slides: LyricSlide[];
  autoFocus?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const safe = slides.length ? Math.min(index, slides.length - 1) : 0;
  const slide = slides[safe];
  const buttons = sectionButtons(slides);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const target = event.target;
      const inside = target instanceof Node && Boolean(rootRef.current?.contains(target));
      const idle = autoFocus && (target === document.body || target === document.documentElement);
      if (!inside && !idle) return;
      event.preventDefault();
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(slides.length - 1, Math.min(current, slides.length - 1) + 1));
      } else {
        setIndex((current) => Math.max(0, Math.min(current, slides.length - 1) - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocus, slides.length]);

  if (!slide) {
    return (
      <section>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-4 text-xl text-leaf">No lyrics yet.</p>
      </section>
    );
  }

  const lines = slide.lines.filter((line) => line.text.trim());

  return (
    <section
      ref={rootRef}
      data-song-slides
      tabIndex={0}
      autoFocus={autoFocus}
      className="outline-none focus-visible:ring-2 focus-visible:ring-leaf"
    >
      <p className="text-sm font-semibold tracking-wide text-leaf uppercase">
        {title}
        {songKey ? ` · ${songKey}` : ""}
      </p>
      <div className="mt-6 grid gap-4">
        {lines.length ? (
          lines.map((line, lineIndex) => (
            <p key={lineIndex} className="text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
              {line.text}
            </p>
          ))
        ) : (
          <p className="text-4xl font-semibold">No lyrics yet.</p>
        )}
      </div>
      <div className="sticky bottom-0 mt-10 flex flex-wrap items-center gap-2 bg-forest/95 py-3">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={`h-10 rounded-full px-4 text-sm font-semibold ${
              slide.label === button.label ? "bg-leaf text-forest" : "bg-white/10 text-ivory"
            }`}
            onClick={() => setIndex(jumpToLabel(slides, safe, button.label))}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          className="h-10 rounded-full bg-white/10 px-4 text-sm font-semibold text-ivory"
          onClick={() => setIndex(Math.max(0, safe - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-10 rounded-full bg-white/10 px-4 text-sm font-semibold text-ivory"
          onClick={() => setIndex(Math.min(slides.length - 1, safe + 1))}
        >
          Next
        </button>
        <span className="text-sm text-leaf">
          {slide.label} · {safe + 1}/{slides.length}
        </span>
      </div>
    </section>
  );
}
