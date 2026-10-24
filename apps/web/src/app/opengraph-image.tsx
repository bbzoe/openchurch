import { ImageResponse } from "next/og";

export const alt = "OpenChurch: open source tools for local churches";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #062A21 0%, #0F3D2E 58%, #116B4E 100%)",
          color: "#F6FBF7",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 4, color: "#86EFAC" }}>
          OPEN SOURCE TOOLS FOR THE CHURCH
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>
            One service. Everyone in sync.
          </div>
          <div style={{ fontSize: 28, color: "#DBF9E7" }}>openchurch.dev</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
