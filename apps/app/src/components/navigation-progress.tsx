"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setPhase((current) => (current === "run" ? "done" : "idle"));
  }

  useEffect(() => {
    if (phase !== "done") return;
    const timer = window.setTimeout(() => setPhase("idle"), 220);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPhase("run");
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (phase === "idle") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-primary/15">
      <div className={`h-full w-full bg-primary ${phase === "run" ? "nav-progress-run" : "nav-progress-done"}`} />
    </div>
  );
}
