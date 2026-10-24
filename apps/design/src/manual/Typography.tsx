const weights = [
  { label: "Light 300: captions, metadata", weight: 300 },
  { label: "Regular 400: body copy", weight: 400 },
  { label: "SemiBold 600: subheadings, accents", weight: 600 },
  { label: "Bold 700: wordmark, headings", weight: 700 },
] as const;

export function Typography() {
  return (
    <div className="oc-stack" style={{ width: "min(720px, 92vw)" }}>
      <div>
        <p className="oc-kicker">Manrope</p>
        <p className="oc-type-name">OpenChurch</p>
        <p className="oc-tag">Clarity in every ministry.</p>
      </div>
      {weights.map((item) => (
        <p key={item.weight} style={{ margin: 0, fontSize: 32, fontWeight: item.weight, letterSpacing: "-0.03em" }}>
          {item.label}
          <span style={{ display: "block", fontSize: 18, marginTop: 4 }}>
            Aa Bb Cc Dd Ee Ff Gg Hh
          </span>
        </p>
      ))}
    </div>
  );
}
