#!/usr/bin/env python3
"""Build public/brand SVGs from the rebuilt mark (v2) and Manrope Bold outlines."""

import re
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

V2 = Path(__file__).resolve().parent
BRAND = V2.parents[2] / "apps/design/public/brand"
FONT_BOLD = "/tmp/Manrope-Bold.ttf"
FONT_REGULAR = "/tmp/Manrope-Regular.ttf"

LIGHT = (V2 / "mark-sampled.svg").read_text()
DARK = (V2 / "mark-on-dark.svg").read_text()
HEAVEN = re.search(r'id="heaven" d="([^"]+)"', LIGHT).group(1)
EARTH = re.search(r'id="earth" d="([^"]+)"', LIGHT).group(1)


def inner(svg: str, prefix: str) -> str:
    body = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    body = re.sub(r"<title>.*?</title>", "", body)
    ids = re.findall(r'id="([^"]+)"', body)
    for name in sorted(set(ids), key=len, reverse=True):
        body = body.replace(f'id="{name}"', f'id="{prefix}-{name}"')
        body = body.replace(f"url(#{name})", f"url(#{prefix}-{name})")
        body = body.replace(f'href="#{name}"', f'href="#{prefix}-{name}"')
    return body


def solid(color: str) -> str:
    return f'<path fill="{color}" d="{HEAVEN}{EARTH}"/>'


def doc(view_box: str, body: str, label: str = "OpenChurch") -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="{label}">\n'
        f"  <title>{label}</title>\n  {body}\n</svg>\n"
    )


def write(name: str, svg: str) -> None:
    (BRAND / name).write_text(svg)


write("mark.svg", doc("0 0 960 960", inner(LIGHT, "oc")))
write("mark-dark.svg", doc("0 0 960 960", inner(DARK, "ocd")))
for name, color in [("forest", "#0F3D2E"), ("growth", "#22C55E"), ("leaf", "#86EFAC"), ("white", "#FFFFFF")]:
    write(f"mark-{name}.svg", doc("0 0 960 960", solid(color)))

write(
    "app-icon.svg",
    doc(
        "0 0 512 512",
        '<rect width="512" height="512" rx="114" fill="#071910"/>'
        f'<svg x="76" y="76" width="360" height="360" viewBox="0 0 960 960">{inner(DARK, "ic")}</svg>',
    ),
)
write(
    "app-icon-32.svg",
    doc(
        "0 0 32 32",
        '<rect width="32" height="32" rx="7" fill="#071910"/>'
        f'<svg x="4" y="4" width="24" height="24" viewBox="0 0 960 960">{solid("#22C55E")}</svg>',
    ),
)

def outline(font_path: str, text: str, start: float) -> tuple[list[str], float, int]:
    tt = TTFont(font_path)
    glyphs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    upem = tt["head"].unitsPerEm
    font = hb.Font(hb.Face(hb.Blob.from_file_path(font_path)))
    font.scale = (upem, upem)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf)
    parts, advance = [], start
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs)
        glyphs[order[info.codepoint]].draw(pen)
        if pen.getCommands():
            parts.append(f'<path transform="translate({advance + pos.x_offset} {pos.y_offset})" d="{pen.getCommands()}"/>')
        advance += pos.x_advance
    return parts, advance, upem


open_parts, advance, upem = outline(FONT_REGULAR, "Open", 0)
church_parts, advance, _ = outline(FONT_BOLD, "Church", advance)
word = "".join(open_parts + church_parts)

cap = upem * 0.73
mark_size = cap * 1.42
gap = upem * 0.2
height = max(mark_size, upem)
width = mark_size + gap + advance
baseline = height / 2 + cap / 2
pad = upem * 0.04
view = f"{-pad:.0f} {-pad:.0f} {width + 2 * pad:.0f} {height + 2 * pad:.0f}"


def lockup(mark_body: str, text_fill: str) -> str:
    y = (height - mark_size) / 2
    return doc(
        view,
        f'<svg x="0" y="{y:.1f}" width="{mark_size:.1f}" height="{mark_size:.1f}" viewBox="0 0 960 960">{mark_body}</svg>'
        f'<g fill="{text_fill}" transform="translate({mark_size + gap:.1f} {baseline:.1f}) scale(1 -1)">{word}</g>',
    )


write("lockup.svg", lockup(inner(LIGHT, "lk"), "#0F3D2E"))
write("lockup-sidebar.svg", lockup(inner(LIGHT, "sb"), "#0F3D2E"))
write("lockup-dark.svg", lockup(inner(DARK, "lkd"), "#FFFFFF"))
write("lockup-forest.svg", lockup(solid("#0F3D2E"), "#0F3D2E"))
write("lockup-white.svg", lockup(solid("#FFFFFF"), "#FFFFFF"))
print("written to", BRAND)
