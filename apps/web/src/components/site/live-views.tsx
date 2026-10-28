"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const views = ["slides", "camera", "stream"] as const;
type View = (typeof views)[number];

const labels: Record<View, string> = {
  camera: "Camera",
  slides: "Slides",
  stream: "Stream",
};

const stagePhoto = {
  src: "/landing/live-stage-1600.webp",
  width: 1024,
  height: 682,
} as const;

export function LiveViews() {
  const [active, setActive] = useState<View>("camera");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function move(from: number, direction: 1 | -1) {
    const next = (from + direction + views.length) % views.length;
    setActive(views[next]);
    tabs.current[next]?.focus();
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-forest-950">
      <div
        role="tabpanel"
        id="live-views-panel"
        aria-labelledby={`live-view-${active}`}
        className="absolute inset-0"
      >
        <div className={layerClass(active === "camera")} aria-hidden={active !== "camera"}>
          <StagePhoto alt="Congregation facing a lit worship stage. Illustrative preview, not an OpenChurch event." />
          <Scrim />
        </div>

        <div className={layerClass(active === "slides")} aria-hidden={active !== "slides"}>
          <StagePhoto alt="" />
          <div className="absolute inset-0 bg-[#062A21]/78" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,42,33,0.72)_78%)]" />
          <div className="relative flex h-full flex-col items-center justify-center px-5 pb-11 text-center">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-leaf uppercase">Psalm 23:1</p>
            <p className="mt-2 max-w-[18ch] text-[15px] leading-snug font-semibold tracking-tight text-white sm:text-base">
              The Lord is my shepherd; I shall not want.
            </p>
            <p className="mt-2.5 text-[10px] font-semibold tracking-[0.14em] text-white/55 uppercase">Slide 4 of 8</p>
          </div>
        </div>

        <div className={layerClass(active === "stream")} aria-hidden={active !== "stream"}>
          <StagePhoto alt="" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,24,18,0.55)_0%,transparent_32%,transparent_68%,rgba(4,24,18,0.45)_100%)]" />
          <div className="absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-2">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                <span className="size-1.5 rounded-full bg-[#ff5a5a]" aria-hidden="true" />
                Live
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-white drop-shadow-sm">Sunday service</p>
              <p className="text-[10px] text-white/75">Worship, in the room and online</p>
            </div>
            <div className="w-[42%] max-w-[9.5rem] rounded-lg bg-[#062A21]/88 px-2 py-1.5 text-left ring-1 ring-white/25">
              <p className="text-[8px] font-semibold tracking-[0.14em] text-leaf uppercase">On screen</p>
              <p className="mt-0.5 text-[10px] leading-tight font-semibold text-white">The Lord is my shepherd</p>
            </div>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Service preview"
        className="absolute bottom-2.5 left-2.5 z-20 flex gap-1.5"
      >
        {views.map((view, index) => {
          const selected = active === view;
          return (
            <button
              key={view}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              id={`live-view-${view}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="live-views-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(view)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  move(index, 1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(index, -1);
                }
              }}
              className={`touch-manipulation cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] active:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${
                selected ? "bg-white text-ink" : "bg-black/45 text-white hover:bg-black/60"
              }`}
            >
              {labels[view]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function layerClass(on: boolean) {
  return [
    "absolute inset-0 origin-center transition-[opacity,scale,filter] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:blur-0 motion-reduce:scale-100 motion-reduce:transition-none",
    on ? "z-10 opacity-100 blur-0 scale-100" : "pointer-events-none z-0 scale-[1.045] opacity-0 blur-[6px]",
  ].join(" ");
}

function StagePhoto({ alt }: { alt: string }) {
  return (
    <Image
      src={stagePhoto.src}
      alt={alt}
      width={stagePhoto.width}
      height={stagePhoto.height}
      sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 90vw"
      unoptimized
      className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
    />
  );
}

function Scrim() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent"
    />
  );
}
