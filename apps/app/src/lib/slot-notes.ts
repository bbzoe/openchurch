export const COLOR_MARK = "openchurch:color:";
export const BREAK_MARK = "openchurch:break";

const slotColors = new Set(["#e7f8ee", "#e7f6f3", "#fff4e5", "#e7f1fb", "#f3eefb", "#fdecec", "#f4f1ea"]);

export function parseSlotNotes(description: string) {
  const normalized = description.replace(/\r\n/g, "\n");
  if (normalized === BREAK_MARK || normalized.startsWith(`${BREAK_MARK}\n`)) {
    return { notes: BREAK_MARK, color: "", break: true };
  }
  const colors: string[] = [];
  const notes: string[] = [];
  for (const line of normalized.split("\n")) {
    if (line.startsWith(COLOR_MARK)) colors.push(line.slice(COLOR_MARK.length).trim());
    else if (line.trim()) notes.push(line);
  }
  const color = [...colors].reverse().find((item) => slotColors.has(item)) ?? "";
  return { notes: notes.join("\n").trim(), color, break: false };
}

export function writeSlotNotes(notes: string, color: string) {
  const clean = parseSlotNotes(notes).notes;
  if (!color || !slotColors.has(color)) return clean;
  return clean ? `${clean}\n${COLOR_MARK}${color}` : `${COLOR_MARK}${color}`;
}
