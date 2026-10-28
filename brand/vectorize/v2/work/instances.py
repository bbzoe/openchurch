"""Register our silhouette to every mark instance on the board and report IoU."""

import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage, optimize

WORK = Path(__file__).resolve().parent
V2 = WORK.parent
board = np.asarray(Image.open(WORK / "board.jpg").convert("RGB")).astype(float)

subprocess.check_call(["rsvg-convert", "-w", "1920", "-h", "1920", str(V2 / "mark-mono.svg"), "-o", str(WORK / "ours-1920.png")])
ours = np.asarray(Image.open(WORK / "ours-1920.png").convert("RGBA"))[:, :, 3] > 127
OS = 2.0  # px per viewBox unit


def target_mask(box, mode):
    x0, y0, w, h = box
    crop = board[y0 : y0 + h, x0 : x0 + w]
    border = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(crop - bg, axis=2)
    m = dist > 60 if mode == "any" else dist > 90
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.argsort(sizes)[::-1][:2] + 1
    m = np.isin(lab, keep)
    return ndimage.binary_fill_holes(m), crop


def sample_ours(px, py):
    ix = np.clip((px * OS).astype(int), 0, ours.shape[1] - 1)
    iy = np.clip((py * OS).astype(int), 0, ours.shape[0] - 1)
    inside = (px >= 0) & (px < 960) & (py >= 0) & (py < 960)
    return ours[iy, ix] & inside


def iou_for(params, m, ss=3):
    s, tx, ty = params
    h, w = m.shape
    off = (np.arange(ss) + 0.5) / ss
    gy, gx = np.mgrid[0:h, 0:w]
    acc = np.zeros((h, w))
    for oy in off:
        for ox in off:
            vx = (gx + ox - tx) / s + 480
            vy = (gy + oy - ty) / s + 480
            acc += sample_ours(vx, vy)
    pred = acc / (ss * ss) > 0.5
    inter = (pred & m).sum()
    union = (pred | m).sum()
    return inter / union, pred


def register(m):
    ys, xs = np.nonzero(m)
    cy, cx = ys.mean(), xs.mean()
    s0 = np.sqrt(m.sum() / ours.sum()) * OS
    res = optimize.minimize(lambda p: -iou_for(p, m, 2)[0], [s0, cx, cy], method="Nelder-Mead",
                            options={"xatol": 0.01, "fatol": 1e-5, "maxiter": 400})
    best, pred = iou_for(res.x, m, 4)
    return best, res.x, pred


instances = {
    "wersja-jasna": ((40, 25, 210, 200), "any"),
    "wersja-ciemna": ((542, 25, 210, 200), "any"),
    "podstawowy": ((15, 245, 100, 75), "any"),
    "na-jasnym": ((120, 245, 100, 75), "any"),
    "mono": ((262, 248, 110, 75), "any"),
    "negatyw": ((395, 255, 90, 70), "any"),
    "app-1024": ((536, 258, 74, 70), "any"),
    "pole-ochronne": ((878, 262, 80, 72), "any"),
}
report = {}
for name, (box, mode) in instances.items():
    m, crop = target_mask(box, mode)
    iou, params, pred = register(m)
    report[name] = {"iou": round(float(iou), 4), "scale": round(float(params[0]), 4), "mask_px": int(m.sum())}
    scale = 8
    vis = np.zeros(m.shape + (3,), np.uint8) + 255
    vis[m & pred] = (40, 40, 40)
    vis[m & ~pred] = (0, 140, 255)
    vis[~m & pred] = (255, 40, 80)
    Image.fromarray(vis).resize((m.shape[1] * scale, m.shape[0] * scale), Image.NEAREST).save(WORK / f"inst_{name}.png")
    Image.fromarray(crop.astype(np.uint8)).resize((m.shape[1] * scale, m.shape[0] * scale), Image.LANCZOS).save(WORK / f"inst_{name}_src.png")
    print(f"{name:14s} IoU {iou:.4f}  mark {m.sum()} px")
(WORK / "instances.json").write_text(json.dumps(report, indent=2))
