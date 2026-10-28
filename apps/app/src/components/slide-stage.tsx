import { backgroundFor, fontFor, lyricScale, type DeckSlide } from "@/lib/slides";

export function SlideStage({
  slide,
  className = "",
  size = "thumb",
}: {
  slide: DeckSlide;
  className?: string;
  size?: "thumb" | "stage";
}) {
  const background = backgroundFor(slide.backgroundId);
  const font = fontFor(slide.fontId);
  const lines = slide.lines.map((line) => line.trim()).filter(Boolean);
  const type = size === "stage" ? lyricScale(lines.length || 1) : "text-[10px] leading-tight";

  return (
    <div
      data-slide-preview={slide.id}
      className={`flex aspect-video w-full flex-col items-center justify-center overflow-hidden text-center ring-1 ring-black/10 ${size === "thumb" ? "gap-0.5 rounded-lg px-1.5" : "gap-2 rounded-xl px-6"} ${className}`}
      style={{ background: background.value, color: slide.color || background.ink, fontFamily: font.family }}
    >
      {lines.length ? (
        lines.map((line, index) => (
          <p key={`${slide.id}-${index}`} className={`font-semibold ${size === "thumb" ? "max-w-full" : "max-w-[18ch]"} ${type}`}>
            {line}
          </p>
        ))
      ) : (
        <p className="text-sm opacity-70">Empty slide</p>
      )}
    </div>
  );
}
