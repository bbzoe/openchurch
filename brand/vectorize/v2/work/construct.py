"""Fit one clean circle construction to every mark instance on the board.

Heaven arm: lobe A (top) and lobe B (right), equal radius r, mirror-symmetric across the
arm diagonal. The waist is bounded by an outer and an inner carving circle, each tangent
to both lobes. Earth arm is heaven rotated 180 degrees about the mark centre (12, 12).
Units: u (24u grid).
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage, optimize

WORK = Path(__file__).resolve().parent
board = np.asarray(Image.open(WORK / "board.jpg").convert("RGB")).astype(float)

INSTANCES = {
    "wersja-jasna": ((40, 25, 210, 200), 60, 2.0),
    "wersja-ciemna": ((545, 25, 205, 200), 24, 2.0),
    "podstawowy": ((15, 245, 100, 75), 60, 1.0),
    "na-jasnym": ((120, 245, 100, 75), 60, 1.0),
    "mono": ((262, 248, 110, 75), 60, 1.0),
    "negatyw": ((390, 252, 90, 69), 60, 1.0),
    "app-1024": ((537, 262, 69, 65), 24, 1.0),
    "pole-ochronne": ((878, 262, 80, 72), 60, 1.0),
}


def mask_for(box, thr):
    x0, y0, w, h = box
    crop = board[y0 : y0 + h, x0 : x0 + w]
    border = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(border, axis=0)
    m = np.linalg.norm(crop - bg, axis=2) > thr
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, np.argsort(sizes)[::-1][:2] + 1)
    return ndimage.binary_fill_holes(m)


def geometry(shape):
    r, d, e, ro, ri = shape
    a = np.array([12 + e, 12 - d])
    b = np.array([12 + d, 12 - e])
    mid = (a + b) / 2
    half = np.linalg.norm(b - a) / 2
    n = np.array([1.0, -1.0]) / np.sqrt(2)
    ho = np.sqrt(max((r + ro) ** 2 - half**2, 1e-9))
    hi = np.sqrt(max((r + ri) ** 2 - half**2, 1e-9))
    co = mid + n * ho
    ci = mid - n * hi

    def tangent(center, c):
        v = c - center
        return center + r * v / np.linalg.norm(v)

    return {
        "A": a, "B": b, "r": r, "Co": co, "Ci": ci, "Ro": ro, "Ri": ri,
        "ToA": tangent(a, co), "ToB": tangent(b, co), "TiA": tangent(a, ci), "TiB": tangent(b, ci),
    }


def inside_quad(px, py, quad):
    sign = None
    ok = np.ones_like(px, dtype=bool)
    for i in range(4):
        x1, y1 = quad[i]
        x2, y2 = quad[(i + 1) % 4]
        cross = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)
        s = cross >= 0
        if sign is None:
            sign = s
        ok &= s == sign
    return ok


def inside_heaven(px, py, g):
    def disk(c, rad):
        return (px - c[0]) ** 2 + (py - c[1]) ** 2 <= rad**2

    bridge = inside_quad(px, py, [g["ToA"], g["ToB"], g["TiB"], g["TiA"]])
    bridge &= ~disk(g["Co"], g["Ro"]) & ~disk(g["Ci"], g["Ri"])
    return disk(g["A"], g["r"]) | disk(g["B"], g["r"]) | bridge


def inside_mark(px, py, g):
    return inside_heaven(px, py, g) | inside_heaven(24 - px, 24 - py, g)


class Target:
    def __init__(self, name, box, thr, weight):
        self.name = name
        self.weight = weight
        self.m = mask_for(box, thr)
        h, w = self.m.shape
        ss = 3
        off = (np.arange(ss) + 0.5) / ss
        gy, gx = np.mgrid[0:h, 0:w]
        self.px = np.stack([gx + ox for oy in off for ox in off])
        self.py = np.stack([gy + oy for oy in off for ox in off])
        ys, xs = np.nonzero(self.m)
        self.reg = np.array([w / 24 * 0.8 if False else np.sqrt(self.m.sum() / 330.0), xs.mean(), ys.mean()])

    def iou(self, g, reg=None):
        s, tx, ty = self.reg if reg is None else reg
        ux = (self.px - tx) / s + 12
        uy = (self.py - ty) / s + 12
        pred = inside_mark(ux, uy, g).mean(axis=0) > 0.5
        return (pred & self.m).sum() / (pred | self.m).sum(), pred

    def register(self, g):
        res = optimize.minimize(lambda p: -self.iou(g, p)[0], self.reg, method="Nelder-Mead",
                                options={"xatol": 0.005, "fatol": 1e-6, "maxiter": 300})
        self.reg = res.x


targets = [Target(n, *v) for n, v in INSTANCES.items()]
shape = np.array([4.0, 8.0, 0.4, 3.0, 2.0])


def total(sh):
    r, d, e, ro, ri = sh
    if r <= 2 or ro <= 0.05 or ri <= 0.05:
        return 1e3
    g = geometry(sh)
    if np.linalg.norm(g["B"] - g["A"]) / 2 >= r + min(ro, ri):
        return 1e3
    return -sum(t.weight * t.iou(g)[0] for t in targets) / sum(t.weight for t in targets)


for it in range(4):
    g = geometry(shape)
    for t in targets:
        t.register(g)
    res = optimize.minimize(total, shape, method="Nelder-Mead",
                            options={"xatol": 1e-3, "fatol": 1e-6, "maxiter": 600})
    shape = res.x
    print(f"iter {it}: mean IoU {-res.fun:.4f} shape r={shape[0]:.3f} d={shape[1]:.3f} e={shape[2]:.3f} Ro={shape[3]:.3f} Ri={shape[4]:.3f}")

g = geometry(shape)
report = {"shape": dict(zip(["r", "d", "e", "Ro", "Ri"], map(float, shape))), "instances": {}}
for t in targets:
    t.register(g)
    iou, pred = t.iou(g)
    report["instances"][t.name] = round(float(iou), 4)
    vis = np.full(t.m.shape + (3,), 255, np.uint8)
    vis[t.m & pred] = (40, 40, 40)
    vis[t.m & ~pred] = (0, 140, 255)
    vis[~t.m & pred] = (255, 40, 80)
    Image.fromarray(vis).resize((t.m.shape[1] * 6, t.m.shape[0] * 6), Image.NEAREST).save(WORK / f"cons_{t.name}.png")
    print(f"  {t.name:14s} IoU {iou:.4f}")
xs = [g["A"][0] - g["r"], 24 - (g["B"][0] + g["r"])]
report["bbox_u"] = [float(24 - 2 * min(g["A"][0] - g["r"], 24 - g["B"][0] - g["r"]))]
report["geometry"] = {k: (v.tolist() if isinstance(v, np.ndarray) else float(v)) for k, v in g.items()}
(WORK / "construct.json").write_text(json.dumps(report, indent=2))
