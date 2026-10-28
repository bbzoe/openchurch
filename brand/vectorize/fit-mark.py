#!/usr/bin/env python3
"""Fit a 180-degree-symmetric pair of metaballs to the header-logo mask.

The raster mark is two separate peanuts (top+right, left+bottom) with an
empty cross between them. Parameters are searched against the binary mask
extracted from the brand sheet, then the winning field is traced with potrace.
"""

import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MASK_W, MASK_H = 77, 75

raw = (ROOT / "refs/mark-header-mask.pbm").read_text().split()
# P1 header
assert raw[0] == "P1"
mw, mh = int(raw[1]), int(raw[2])
bits = [int(v) for v in raw[3:]]
assert mw == MASK_W and mh == MASK_H and len(bits) == mw * mh
MASK = bits


def render(cx, cy, d, r, power, thresh, w=MASK_W, h=MASK_H):
    """Return a flat 0/1 mask. Centers sit on a plus around (cx, cy)."""
    centers_a = ((cx, cy - d), (cx + d, cy))  # N, E
    centers_b = ((cx - d, cy), (cx, cy + d))  # W, S
    out = [0] * (w * h)
    # sample pixel centers
    for y in range(h):
        py = y + 0.5
        for x in range(w):
            px = x + 0.5
            fa = 0.0
            for cxi, cyi in centers_a:
                dist = math.hypot(px - cxi, py - cyi)
                fa += (r / max(dist, 0.15)) ** power
            fb = 0.0
            for cxi, cyi in centers_b:
                dist = math.hypot(px - cxi, py - cyi)
                fb += (r / max(dist, 0.15)) ** power
            if fa >= thresh or fb >= thresh:
                out[y * w + x] = 1
    return out


def iou(pred):
    inter = union = 0
    for a, b in zip(MASK, pred):
        if a or b:
            union += 1
            if a and b:
                inter += 1
    return inter / union if union else 0.0


def search():
    best = (0.0, None)
    # coarse
    for cx in (37.5, 38.0, 38.5, 39.0):
        for cy in (36.5, 37.0, 37.5, 38.0):
            for d in (22.0, 23.0, 24.0, 24.5, 25.0, 26.0):
                for r in (11.5, 12.0, 12.5, 13.0, 13.5, 14.0):
                    for power in (2.2, 2.6, 3.0, 3.4, 4.0):
                        for thresh in (1.05, 1.15, 1.25, 1.4):
                            score = iou(render(cx, cy, d, r, power, thresh))
                            if score > best[0]:
                                best = (score, (cx, cy, d, r, power, thresh))
                                print(f"iou {score:.4f} {best[1]}", flush=True)
    return best


if __name__ == "__main__":
    score, params = search()
    print("BEST", score, params)
    (ROOT / "refs/best-params.txt").write_text(f"{score}\n{params}\n")
