import { Mark, type MarkVariant } from "./Mark";

export type AppIconProps = {
  size?: number;
  flat?: boolean;
};

export function AppIcon({ size = 128, flat = false }: AppIconProps) {
  const variant: MarkVariant = flat ? "growth" : "dark";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: "#0F3D2E",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Mark variant={variant} size={size * 0.62} />
    </div>
  );
}
