export const color = {
  forest: "#0F3D2E",
  growth: "#22C55E",
  leaf: "#86EFAC",
  canvas: "#F6FBF7",
  white: "#FFFFFF",
  ink: "#0F3D2E",
  muted: "rgba(15, 61, 46, 0.64)",
  line: "rgba(15, 61, 46, 0.12)",
  tile: "#071910",
} as const;

export const heavenStops = [
  { offset: "0%", color: "#0F3D2E" },
  { offset: "50%", color: "#22C55E" },
  { offset: "100%", color: "#86EFAC" },
] as const;

export const earthStops = [
  { offset: "0%", color: "#0A3A2B" },
  { offset: "50%", color: "#16A34A" },
  { offset: "100%", color: "#A7F3D0" },
] as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  card: 22,
  icon: "22%",
} as const;
