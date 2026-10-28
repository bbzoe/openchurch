"use client";

import { useEffect, useRef, useState } from "react";

export type CrewPerson = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  image: string | null;
};

type Item =
  | { key: string; kind: "person"; person: CrewPerson }
  | { key: "gap"; kind: "gap" };

const washes = [
  ["#0f3d2e", "#86efac"],
  ["#116b4e", "#bbf7d0"],
  ["#14532d", "#6ee7b7"],
  ["#1e3a34", "#fde68a"],
  ["#134e4a", "#a7f3d0"],
  ["#3f6212", "#d9f99d"],
];

function wash(name: string) {
  let index = 0;
  for (const char of name) index = (index + char.charCodeAt(0)) % washes.length;
  return washes[index];
}

function initials(person: CrewPerson) {
  return `${person.firstName.slice(0, 1)}${person.lastName.slice(0, 1)}`.toUpperCase() || "?";
}

function line(people: CrewPerson[], ids: string[], leaderCount: number): Item[] {
  const ordered = ids.map((id) => people.find((person) => person.id === id)).filter((person): person is CrewPerson => Boolean(person));
  if (ordered.length < 2) return ordered.map((person) => ({ key: person.id, kind: "person", person }));
  const leaders = Math.max(0, Math.min(leaderCount, ordered.length));
  return [
    ...ordered.slice(0, leaders).map((person) => ({ key: person.id, kind: "person" as const, person })),
    { key: "gap", kind: "gap" },
    ...ordered.slice(leaders).map((person) => ({ key: person.id, kind: "person" as const, person })),
  ];
}

export function readCrew(items: Item[]) {
  const personIds = items.filter((item) => item.kind === "person").map((item) => item.person.id);
  const gap = items.findIndex((item) => item.kind === "gap");
  return { personIds, leaderCount: gap < 0 ? Math.min(1, personIds.length) : gap };
}

function move(items: Item[], key: string, to: number) {
  const from = items.findIndex((item) => item.key === key);
  if (from < 0 || from === to) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function SlotCrew({
  people,
  ids,
  leaderCount,
  disabled,
  onChange,
}: {
  people: CrewPerson[];
  ids: string[];
  leaderCount: number;
  disabled?: boolean;
  onChange: (next: { personIds: string[]; leaderCount: number }) => void;
}) {
  const [items, setItems] = useState(() => line(people, ids, leaderCount));
  const [dragKey, setDragKey] = useState<string | null>(null);
  const drag = useRef<{ key: string; x: number; y: number; active: boolean } | null>(null);
  const itemsRef = useRef(items);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    itemsRef.current = items;
  });
  const signature = `${ids.join("|")}:${leaderCount}`;
  const [seen, setSeen] = useState(signature);
  if (seen !== signature && dragKey === null) {
    setSeen(signature);
    setItems(line(people, ids, leaderCount));
  }

  if (ids.length === 0) return null;

  function indexAt(clientX: number, key: string) {
    const nodes = [...(row.current?.querySelectorAll<HTMLElement>("[data-crew]") ?? [])];
    const current = nodes.findIndex((node) => node.dataset.crew === key);
    let target = current;
    for (let index = 0; index < nodes.length; index += 1) {
      const box = nodes[index].getBoundingClientRect();
      const mid = box.left + box.width / 2;
      if (index < current && clientX < mid) return index;
      if (index > current && clientX > mid) target = index;
    }
    return target;
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>, key: string) {
    if (disabled || event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { key, x: event.clientX, y: event.clientY, active: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
    current.active = true;
    setDragKey(current.key);
    const target = indexAt(event.clientX, current.key);
    setItems((list) => {
      const next = move(list, current.key, target);
      itemsRef.current = next;
      return next;
    });
  }

  function onPointerUp() {
    const current = drag.current;
    drag.current = null;
    setDragKey(null);
    if (!current?.active) return;
    onChange(readCrew(itemsRef.current));
  }

  return (
    <div ref={row} className="flex items-center" onPointerDown={(event) => event.stopPropagation()}>
      {items.map((item) =>
        item.kind === "gap" ? (
          <div
            key="gap"
            data-crew="gap"
            aria-label="Leaders and team"
            role="separator"
            onPointerDown={(event) => onPointerDown(event, "gap")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`mx-1 grid h-7 w-4 shrink-0 place-items-center ${disabled ? "" : dragKey === "gap" ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <span className="h-4 w-px rounded-full bg-foreground/25" />
          </div>
        ) : (
          <div
            key={item.person.id}
            data-crew={item.person.id}
            onPointerDown={(event) => onPointerDown(event, item.person.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`group/avatar relative -ml-1 first:ml-0 ${dragKey === item.person.id ? "z-10 scale-110" : ""}`}
          >
            <Face person={item.person} dragging={dragKey === item.person.id} disabled={disabled} />
            {dragKey ? null : <Tip person={item.person} />}
          </div>
        ),
      )}
    </div>
  );
}

function Face({ person, dragging, disabled }: { person: CrewPerson; dragging?: boolean; disabled?: boolean }) {
  const [from, to] = wash(person.name);
  return (
    <span
      className={`grid size-7 place-items-center overflow-hidden rounded-full text-[10px] font-medium text-white ring-2 ring-card ${disabled ? "" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={person.image ? undefined : { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {person.image ? <img src={person.image} alt="" className="size-full object-cover" /> : initials(person)}
    </span>
  );
}

function Tip({ person }: { person: CrewPerson }) {
  return (
    <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-40 hidden -translate-x-1/2 group-hover/avatar:block">
      <span className="block min-w-max rounded-xl bg-ink px-2.5 py-1.5 text-center shadow-lg">
        <span className="block text-xs font-semibold text-ivory">{person.name}</span>
        <span className="mt-0.5 block text-[10px] text-ivory/70">{person.role}</span>
      </span>
      <span className="mx-auto -mt-1 block size-2 rotate-45 bg-ink" />
    </span>
  );
}
