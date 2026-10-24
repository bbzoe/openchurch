import type { ReactNode } from "react";

const glyphs = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v12" />
      <ellipse cx="6" cy="18" rx="3" ry="2" />
      <ellipse cx="17" cy="15" rx="3" ry="2" />
    </>
  ),
  languages: <path d="M3 6h13M9 3v3M5 10l3 3 5-5M7 16l5-4M14 21l4-11 4 11M16 17h4" />,
  stream: (
    <>
      <path d="M5 7a10 10 0 0 0 0 10M19 7a10 10 0 0 1 0 10M8 10a5 5 0 0 0 0 4M16 10a5 5 0 0 1 0 4" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  prayer: <path d="M10 3c-1 5-3 7-3 11l-4 6M14 3c1 5 3 7 3 11l4 6M10 10l2-2 2 2M7 14l5 4 5-4" />,
  book: <path d="M12 6C9 4 5 4 3 5v14c3-2 7-2 9 0m0-13c3-2 7-2 9-1v14c-3-2-7-2-9 0m0-13v13" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5v1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v7c0 5 3 8 8 10 5-2 8-5 8-10V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v12H9l-5 4V5Z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  kids: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M3 20v-3a5 5 0 0 1 10 0v3M12 20v-3a5 5 0 0 1 9 0v3" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M12 17v4M8 21h8" />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 12a7 7 0 0 0 14 0M12 19v3M8 22h8" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  lyrics: (
    <>
      <path d="M5 6h14M5 10h14M5 14h9M5 18h7" />
      <circle cx="18" cy="17" r="2" />
      <path d="M20 17v-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {glyphs[name]}
    </svg>
  );
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}
