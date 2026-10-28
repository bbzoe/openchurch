"""Consensus silhouette from every board instance, traced with potrace.

1. Soft mask per instance (anti-aliased edges kept as fractional coverage).
2. Register each instance to the current master (scale + translation).
3. Resample all instances into one 24u frame and average them.
4. Optionally enforce the mark's symmetries (180 deg rotation, mirror across arm diagonal).
5. Threshold at 0.5, trace heaven with potrace, derive earth by exact 180 deg rotation.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage, optimize

WORK = Path(__file__).resolve().parent
V2 = WORK.parent
board = np.asarray(Image.open(WORK / "board.jpg").convert("RGB")).astype(float)
MIRROR = "--no-mirror" not in sys.argv
TAG = "mirror" if MIRROR else "rot"

INSTANCES = {
    "wersja-jasna": ((40, 25, 210, 200), 1.0),
    "wersja-ciemna": ((545, 25, 205, 200), 1.0),
    "podstawowy": ((15, 245, 100, 75), 1.0),
    "na-jasnym": ((120, 245, 100, 75), 1.0),
    "mono": ((262, 248, 110, 75), 1.0),
    "negatyw": ((390, 252, 90, 69), 1.0),
    "app-1024": ((537, 262, 69, 65), 0.5),
    "pole-ochronne": ((878, 262, 80, 72), 1.0),
}


def soft_mask(box):
    x0, y0, w, h = box
    crop = board[y0 : y0 + h, x0 : x0 + w]
    border = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(crop - bg, axis=2)
    dark_bg = bg.sum() < 150
    core = dist > (24 if dark_bg else max(24, 0.35 * np.percentile(dist, 99)))
    lab, n = ndimage.label(core)
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    core = ndimage.binary_fill_holes(np.isin(lab, np.argsort(sizes)[::-1][:2] + 1))
    fg = ndimage.grey_dilation(np.where(core, dist, 0), size=5)
    fg = np.where(fg > 0, fg, dist.max())
    alpha = np.clip(dist / np.maximum(fg, 1), 0, 1)
    alpha[ndimage.binary_erosion(core, iterations=2)] = 1
    alpha[~ndimage.binary_dilation(core, iterations=2)] = 0
    return alpha


def render_master(svg: Path, px_per_u: int):
    out = WORK / f"_master_{px_per_u}.png"
    size = 24 * px_per_u
    subprocess.check_call(["rsvg-convert", "-w", str(size), "-h", str(size), str(svg), "-o", str(out)])
    return np.asarray(Image.open(out).convert("RGBA"))[:, :, 3] / 255.0


def iou(alpha, master, reg, ppu):
    s, tx, ty = reg
    h, w = alpha.shape
    gy, gx = np.mgrid[0:h, 0:w]
    ux = (gx + 0.5 - tx) / s + 12
    uy = (gy + 0.5 - ty) / s + 12
    pred = ndimage.map_coordinates(master, [uy * ppu - 0.5, ux * ppu - 0.5], order=1, cval=0)
    a, p = alpha > 0.5, pred > 0.5
    return (a & p).sum() / (a | p).sum()


def register(alpha, master, ppu, start):
    res = optimize.minimize(lambda r: -iou(alpha, master, r, ppu), start, method="Nelder-Mead",
                            options={"xatol": 0.003, "fatol": 1e-6, "maxiter": 400})
    return res.x, -res.fun


masks = {name: soft_mask(box) for name, (box, _) in INSTANCES.items()}
master_svg = V2 / "mark-mono.svg"
regs = {}
for name, a in masks.items():
    ys, xs = np.nonzero(a > 0.5)
    regs[name] = np.array([np.sqrt((a > 0.5).sum() / 345.0), xs.mean(), ys.mean()])

PPU = 40
for rnd in range(3):
    master = render_master(master_svg, PPU)
    scores = {}
    for name, a in masks.items():
        regs[name], scores[name] = register(a, master, PPU, regs[name])
    print(f"round {rnd} vs current master:", {k: round(v, 4) for k, v in scores.items()})

    size = 24 * PPU
    vy, vx = np.mgrid[0:size, 0:size]
    ux, uy = (vx + 0.5) / PPU, (vy + 0.5) / PPU
    acc = np.zeros((size, size))
    wsum = 0.0
    for name, a in masks.items():
        s, tx, ty = regs[name]
        px = (ux - 12) * s + tx - 0.5
        py = (uy - 12) * s + ty - 0.5
        acc += INSTANCES[name][1] * ndimage.map_coordinates(a, [py, px], order=1, cval=0)
        wsum += INSTANCES[name][1]
    field = acc / wsum
    field = (field + field[::-1, ::-1]) / 2
    if MIRROR:
        field = (field + field[::-1, ::-1].T) / 2

    hi = ndimage.zoom(field, 4, order=3) > 0.5
    lab, n = ndimage.label(hi)
    h, w = hi.shape
    yy, xx = np.mgrid[0:h, 0:w]
    heaven = None
    for k in range(1, n + 1):
        comp = lab == k
        if comp.sum() < 1000:
            continue
        if (xx[comp].mean() + (h - yy[comp].mean())) > w:
            heaven = comp
    pbm = WORK / f"_heaven_{TAG}.pbm"
    Image.fromarray((~heaven).astype(np.uint8) * 255).convert("1").save(pbm)
    svg_trace = WORK / f"_heaven_{TAG}.svg"
    subprocess.check_call(["potrace", str(pbm), "-s", "-o", str(svg_trace), "--turdsize", "50",
                           "--alphamax", "1.1", "--opttolerance", "0.5", "-u", "1"])
    txt = svg_trace.read_text()
    d = " ".join(re.findall(r'd="([^"]+)"', txt))
    tr = re.search(r'transform="([^"]+)"', txt).group(1)
    hs = h
    scale = 960 / hs
    mono = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960">'
        f'<g transform="scale({scale})"><g id="heaven" transform="{tr}"><path d="{d}"/></g>'
        f'<g id="earth" transform="rotate(180 {hs / 2} {hs / 2})"><g transform="{tr}"><path d="{d}"/></g></g></g></svg>'
    )
    master_svg = WORK / f"consensus_{TAG}.svg"
    master_svg.write_text(mono)

master = render_master(master_svg, PPU)
final = {}
for name, a in masks.items():
    regs[name], final[name] = register(a, master, PPU, regs[name])
print("FINAL", TAG, {k: round(v, 4) for k, v in final.items()}, "mean", round(float(np.mean(list(final.values()))), 4))
(WORK / f"consensus_{TAG}.json").write_text(json.dumps({"iou": final, "regs": {k: v.tolist() for k, v in regs.items()}}, indent=2))
