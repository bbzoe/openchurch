import { useId } from "react";
import {
  EARTH_PATH,
  EARTH_SEAM_PATH,
  earthBottomGradient,
  earthDarkBottomGradient,
  earthDarkLeftGradient,
  earthLeftGradient,
  HEAVEN_PATH,
  HEAVEN_SEAM_PATH,
  heavenRightGradient,
  heavenTopGradient,
  MARK_VIEWBOX,
} from "../brand/mark-data";

export type MarkVariant = "color" | "dark" | "forest" | "growth" | "leaf" | "white";

const solid: Record<Exclude<MarkVariant, "color" | "dark">, string> = {
  forest: "#0F3D2E",
  growth: "#22C55E",
  leaf: "#86EFAC",
  white: "#FFFFFF",
};

export type MarkProps = {
  variant?: MarkVariant;
  size?: number;
};

export function Mark({ variant = "color", size = 160 }: MarkProps) {
  const uid = useId().replace(/:/g, "");
  const painted = variant === "color" || variant === "dark";
  const flat = solid[variant as Exclude<MarkVariant, "color" | "dark">];
  const eLeft = variant === "dark" ? earthDarkLeftGradient : earthLeftGradient;
  const eBot = variant === "dark" ? earthDarkBottomGradient : earthBottomGradient;

  const hTopId = `h-top-${uid}`;
  const hRightId = `h-right-${uid}`;
  const eLeftId = `e-left-${uid}`;
  const eBotId = `e-bot-${uid}`;
  const clipHId = `clip-h-${uid}`;
  const clipEId = `clip-e-${uid}`;

  return (
    <svg viewBox={MARK_VIEWBOX} width={size} height={size} role="img" aria-label="OpenChurch">
      {painted ? (
        <>
          <defs>
            <linearGradient
              id={hTopId}
              gradientUnits="userSpaceOnUse"
              x1={heavenTopGradient.x1}
              y1={heavenTopGradient.y1}
              x2={heavenTopGradient.x2}
              y2={heavenTopGradient.y2}
            >
              {heavenTopGradient.stops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <linearGradient
              id={hRightId}
              gradientUnits="userSpaceOnUse"
              x1={heavenRightGradient.x1}
              y1={heavenRightGradient.y1}
              x2={heavenRightGradient.x2}
              y2={heavenRightGradient.y2}
            >
              {heavenRightGradient.stops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <linearGradient
              id={eLeftId}
              gradientUnits="userSpaceOnUse"
              x1={eLeft.x1}
              y1={eLeft.y1}
              x2={eLeft.x2}
              y2={eLeft.y2}
            >
              {eLeft.stops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <linearGradient
              id={eBotId}
              gradientUnits="userSpaceOnUse"
              x1={eBot.x1}
              y1={eBot.y1}
              x2={eBot.x2}
              y2={eBot.y2}
            >
              {eBot.stops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <clipPath id={clipHId}>
              <path d={HEAVEN_PATH} />
            </clipPath>
            <clipPath id={clipEId}>
              <path d={EARTH_PATH} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipHId})`}>
            <rect x="0" y="0" width="24" height="24" fill={`url(#${hTopId})`} />
            <path d={HEAVEN_SEAM_PATH} fill={`url(#${hRightId})`} />
          </g>
          <g clipPath={`url(#${clipEId})`}>
            <rect x="0" y="0" width="24" height="24" fill={`url(#${eBotId})`} />
            <path d={EARTH_SEAM_PATH} fill={`url(#${eLeftId})`} />
          </g>
        </>
      ) : (
        <>
          <path d={HEAVEN_PATH} fill={flat} />
          <path d={EARTH_PATH} fill={flat} />
        </>
      )}
    </svg>
  );
}
