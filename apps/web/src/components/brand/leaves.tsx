export function BotanicalScatter({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={compact ? "/brand/leaves/leaves-card.jpg" : "/brand/leaves/leaves-banner.jpg"}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={
          compact
            ? "absolute inset-0 bg-[linear-gradient(90deg,rgba(6,42,33,0.72)_0%,rgba(6,42,33,0.42)_38%,rgba(6,42,33,0.12)_100%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,25,16,0.55)_0%,rgba(4,25,16,0.2)_52%,rgba(4,25,16,0.05)_100%)]"
        }
      />
    </div>
  );
}
