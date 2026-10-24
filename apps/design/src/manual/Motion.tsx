import { Mark } from "./Mark";

export function Motion() {
  return (
    <div className="oc-stack">
      <div className="oc-motion">
        <div>
          <Mark size={88} />
          <p className="oc-icon-label">Plus</p>
        </div>
        <span className="oc-arrow">→</span>
        <div>
          <div className="oc-ring" style={{ width: 88, height: 88 }} />
          <p className="oc-icon-label">Circle</p>
        </div>
        <span className="oc-arrow">→</span>
        <div>
          <Mark size={88} />
          <p className="oc-icon-label">Plus</p>
        </div>
      </div>
      <div className="oc-play" aria-label="Plus, circle, plus">
        <div className="frame">
          <Mark size={120} />
        </div>
        <div className="ring-frame" />
      </div>
    </div>
  );
}
