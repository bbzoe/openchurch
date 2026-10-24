import { earthStops, heavenStops } from "../brand/tokens";
import { AppIcon } from "./AppIcon";
import { Mark } from "./Mark";

const points = [
  { dot: "#0F3D2E", title: "Top + right", text: "God, heaven, righteous paths" },
  { dot: "#22C55E", title: "Bottom + left", text: "Humanity, earth, human ways" },
  { dot: "#9AA8A2", title: "Open center", text: "Empty cross, invitation, entry" },
  { dot: "#0F3D2E", title: "Four directions", text: "Four corners of the world, one mission" },
];

const swatches = [
  { name: "Forest", hex: "#0F3D2E", role: "Foundation, trust", fg: "#F6FBF7" },
  { name: "Growth", hex: "#22C55E", role: "Growth, action", fg: "#0F3D2E" },
  { name: "Leaf", hex: "#86EFAC", role: "Renewal, community", fg: "#0F3D2E" },
  { name: "Canvas", hex: "#F6FBF7", role: "Space, openness", fg: "#0F3D2E" },
];

export function Overview() {
  return (
    <article className="oc-sheet">
      <header className="oc-top">
        <span>OpenChurch</span>
        <span>Brand identity / Forest 06</span>
      </header>

      <div className="oc-grid">
        <section className="oc-card">
          <p className="oc-kicker">01 / Identity</p>
          <div className="oc-id">
            <div className="mark">
              <Mark size={108} />
            </div>
            <h1 className="oc-word">
              <span className="oc-word-open">Open</span>Church
            </h1>
            <p className="oc-tag">Open tools for the Church</p>
            <div className="oc-rule" />
            <p className="oc-lead">
              The Church is not a tool.
              <br />
              <strong>Tools are meant to serve the Church.</strong>
            </p>
          </div>
        </section>

        <section className="oc-card oc-card-dark">
          <p className="oc-kicker">openchurch.dev</p>
          <h2 className="oc-quote">
            Order creates
            <br />
            space
            <br />
            <em>for growth.</em>
          </h2>
          <p className="oc-fine">
            Tools that support the people, structure, and mission of the Church.
          </p>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">02 / Symbol &amp; meaning</p>
          <div className="oc-symbol">
            <Mark size={140} />
            <ul className="oc-points">
              {points.map((point) => (
                <li key={point.title}>
                  <i className="oc-dot" style={{ background: point.dot }} />
                  <div>
                    <strong>{point.title.toUpperCase()}</strong>
                    <span>{point.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="oc-card oc-card-dark">
          <p className="oc-kicker">Essence of the mark</p>
          <h2 className="oc-h">Separate. Yet together.</h2>
          <p className="oc-body">
            The two elements do not touch, yet they form one clear cross.
            The gap does not mean absence. It means openness.
          </p>
          <div className="oc-pair">
            <div>
              HEAVEN × EARTH
              <div style={{ fontWeight: 500, letterSpacing: "0.04em", marginTop: 4 }}>
                Collaboration + community
              </div>
            </div>
          </div>
        </section>

        <section className="oc-card oc-span oc-colors">
          <p className="oc-kicker">03 / Forest: color system</p>
          <p>Organic growth. Calm order. Living community.</p>
          <div className="oc-swatches">
            {swatches.map((swatch) => (
              <div key={swatch.hex} className="oc-swatch" style={{ background: swatch.hex, color: swatch.fg }}>
                <strong>{swatch.name.toUpperCase()}</strong>
                <em>{swatch.hex}</em>
                <span>{swatch.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">04 / Typography</p>
          <h2 className="oc-type-name">Manrope</h2>
          <p className="oc-weights">Light / Regular / SemiBold / Bold</p>
          <p className="oc-specimen">
            <span>Aa </span>
            <span className="m">Bb </span>
            <span className="s">Cc </span>
            <span className="b">Dd Ee Ff Gg Hh</span>
          </p>
          <p className="oc-lead" style={{ marginTop: 18 }}>
            Clarity in every ministry.
          </p>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">05 / Digital first</p>
          <h2 className="oc-h" style={{ fontSize: 26, color: "#0F3D2E" }}>
            App, favicon, mobile
          </h2>
          <div className="oc-icons">
            <div>
              <AppIcon size={96} />
              <p className="oc-icon-label">APP 512</p>
            </div>
            <div>
              <AppIcon size={64} />
              <p className="oc-icon-label">PWA 192</p>
            </div>
            <div>
              <AppIcon size={32} flat />
              <p className="oc-icon-label">32 PX</p>
            </div>
            <div>
              <AppIcon size={16} flat />
              <p className="oc-icon-label">16 PX</p>
            </div>
          </div>
          <p className="oc-note">
            At small sizes: flat colors, no glow, shadows, or unnecessary detail.
          </p>
        </section>

        <section className="oc-card oc-card-dark">
          <p className="oc-kicker">06 / Mission &amp; order</p>
          <h2 className="oc-h">We are therefore Christ&apos;s ambassadors.</h2>
          <p className="oc-fine">2 Cor 5:20 · 1 Cor 14:33,40 · Eph 4:16</p>
          <p className="oc-fine">Working together creates space for growth.</p>
        </section>

        <section className="oc-card oc-span">
          <p className="oc-kicker">Symbol gradients</p>
          <div className="oc-gradients">
            <div>
              <p className="oc-weights">Top + right arm: God, heaven, righteous paths</p>
              <div className="oc-bar oc-bar-heaven" />
              <p className="oc-stops">
                {heavenStops.map((stop) => (
                  <span key={stop.offset}>
                    {stop.color} {stop.offset}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <p className="oc-weights">Bottom + left arm: humanity, earth, human ways</p>
              <div className="oc-bar oc-bar-earth" />
              <p className="oc-stops">
                {earthStops.map((stop) => (
                  <span key={stop.offset}>
                    {stop.color} {stop.offset}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">24 × 24 construction</p>
          <p className="oc-note" style={{ marginTop: 0 }}>
            The mark fits within a 24 × 24 grid. Each arm consists of two radius-4 circles
            connected by a narrower neck. The second arm is the first rotated by 180°.
            The gradient is linear, without blur. The center gap remains open.
          </p>
          <div className="oc-clear" style={{ marginTop: 16 }}>
            <Mark size={140} />
          </div>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">Variants</p>
          <div className="oc-icons">
            <div>
              <Mark size={72} />
              <p className="oc-icon-label">Primary</p>
            </div>
            <div>
              <Mark size={72} variant="forest" />
              <p className="oc-icon-label">Monochrome</p>
            </div>
            <div style={{ background: "#011B12", borderRadius: 16, padding: 8 }}>
              <Mark size={72} variant="dark" />
              <p className="oc-icon-label" style={{ color: "#86EFAC" }}>
                On dark
              </p>
            </div>
            <div style={{ background: "#0F3D2E", borderRadius: 16, padding: 8 }}>
              <Mark size={72} variant="white" />
              <p className="oc-icon-label" style={{ color: "#86EFAC" }}>
                Negative
              </p>
            </div>
          </div>
        </section>

        <section className="oc-card">
          <p className="oc-kicker">07 / Motion</p>
          <div className="oc-motion">
            <div>
              <Mark size={72} />
              <p className="oc-icon-label">PLUS</p>
            </div>
            <span className="oc-arrow" aria-hidden>
              →
            </span>
            <div>
              <div className="oc-ring" />
              <p className="oc-icon-label">CIRCLE</p>
            </div>
            <span className="oc-arrow" aria-hidden>
              →
            </span>
            <div>
              <Mark size={72} />
              <p className="oc-icon-label">PLUS</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="oc-foot">
        <span>OpenChurch / Forest 06 / Brand manual / 2026</span>
      </footer>
    </article>
  );
}
