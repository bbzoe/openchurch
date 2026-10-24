import { color } from "../brand/tokens";

const swatches = [
  { name: "Forest", hex: color.forest, role: "Foundation, trust", fg: color.canvas },
  { name: "Growth", hex: color.growth, role: "Growth, action", fg: color.forest },
  { name: "Leaf", hex: color.leaf, role: "Renewal, community", fg: color.forest },
  { name: "Canvas", hex: color.canvas, role: "Space, openness", fg: color.forest },
];

export function Color() {
  return (
    <div className="oc-swatches" style={{ width: "min(880px, 92vw)" }}>
      {swatches.map((swatch) => (
        <div key={swatch.hex} className="oc-swatch" style={{ background: swatch.hex, color: swatch.fg }}>
          <strong>{swatch.name.toUpperCase()}</strong>
          <em>{swatch.hex}</em>
          <span>{swatch.role}</span>
        </div>
      ))}
    </div>
  );
}
