import { AppIcon } from "./AppIcon";

const sizes = [
  { size: 160, label: "APP 512", flat: false },
  { size: 96, label: "PWA 192", flat: false },
  { size: 32, label: "32 PX", flat: true },
  { size: 16, label: "16 PX", flat: true },
] as const;

export function App() {
  return (
    <div>
      <div className="oc-icons">
        {sizes.map((item) => (
          <div key={item.label}>
            <AppIcon size={item.size} flat={item.flat} />
            <p className="oc-icon-label">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="oc-note">
        At small sizes: flat colors, no glow, shadows, or unnecessary detail.
      </p>
    </div>
  );
}
