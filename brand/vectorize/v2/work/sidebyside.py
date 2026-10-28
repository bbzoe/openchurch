"""Board crop vs our render at identical registration, plus contour overlay."""

import json
import re
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

WORK = Path(__file__).resolve().parent
V2 = WORK.parent
BOARD = WORK / "board.jpg"
REG = json.loads((WORK / "reg2.json").read_text())
SCALE = 5


def render_region(svg_path: Path, a: float, t, box, out: Path, bg: str) -> None:
    x0, y0, w, h = box
    vx = (x0 - t[0]) / a + 480
    vy = (y0 - t[1]) / a + 480
    vw, vh = w / a, h / a
    body = re.search(r"<svg[^>]*>(.*)</svg>", svg_path.read_text(), re.S).group(1)
    wrap = (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="{vx:.3f} {vy:.3f} {vw:.3f} {vh:.3f}"><rect x="{vx}" y="{vy}" width="{vw}" height="{vh}" fill="{bg}"/>{body}</svg>'
    )
    tmp = out.with_suffix(".svg")
    tmp.write_text(wrap)
    subprocess.check_call(["rsvg-convert", "-w", str(w * SCALE), "-h", str(h * SCALE), str(tmp), "-o", str(out)])


def crop_board(box, out: Path) -> None:
    x0, y0, w, h = box
    img = Image.open(BOARD).convert("RGB").crop((x0, y0, x0 + w, y0 + h))
    img.resize((w * SCALE, h * SCALE), Image.LANCZOS).save(out)


def mask_of(img: np.ndarray, bg) -> np.ndarray:
    d = np.linalg.norm(img.astype(float) - np.array(bg, float), axis=2)
    return (d > 40).astype(np.uint8)


def sheet(name: str, svg: Path, bg_hex: str, bg_rgb, box, reg) -> None:
    ref = WORK / f"sb_{name}_ref.png"
    ours = WORK / f"sb_{name}_ours.png"
    crop_board(box, ref)
    render_region(svg, reg["a"], reg["t"], box, ours, bg_hex)
    r = cv2.cvtColor(cv2.imread(str(ref)), cv2.COLOR_BGR2RGB)
    o = cv2.cvtColor(cv2.imread(str(ours)), cv2.COLOR_BGR2RGB)
    over = r.copy()
    for m, col in ((mask_of(o, bg_rgb), (255, 0, 80)),):
        cs, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(over, cs, -1, col, 2)
    diff = np.abs(r.astype(int) - o.astype(int)).sum(axis=2)
    diff = np.clip(diff * 2, 0, 255).astype(np.uint8)
    diff = cv2.applyColorMap(diff, cv2.COLORMAP_INFERNO)[:, :, ::-1]
    row = np.concatenate([r, o, over, diff], axis=1)
    Image.fromarray(row).save(V2 / f"sbs-{name}.png")
    print(name, "saved", row.shape)


sheet("light", V2 / "mark-sampled.svg", "#F8FAF4", (248, 250, 244), (55, 33, 182, 182), REG["light"])
sheet("dark", V2 / "mark-on-dark.svg", "#011B12", (1, 27, 18), (557, 33, 182, 182), REG["dark"])
