export function currentSlotId(
  slots: { id: string; durationMinutes: number | null }[],
  startsAt: Date,
  now: Date,
) {
  if (now.getTime() < startsAt.getTime()) return null;
  let cursor = startsAt.getTime();
  for (const slot of slots) {
    if (!slot.durationMinutes) return slot.id;
    const end = cursor + slot.durationMinutes * 60_000;
    if (now.getTime() < end) return slot.id;
    cursor = end;
  }
  return null;
}
