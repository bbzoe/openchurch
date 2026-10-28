"""Local polish: top heaven lobe + soft earth fold. Keep the rest of v3."""
import json, re, subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.optimize import minimize
from sp import unpack, spl, both_s, raster_iou_s
from common import masks, NAMES

WORK = Path(__file__).resolve().parent
OUT = WORK.parent
M = masks()
N = 12
fin = json.load(open(WORK / "final_H2.json"))
regs = {n: np.array(fin["regs"][n], float) for n in NAMES}
z0 = np.r_[np.array(fin["A"], float).ravel(), np.array(fin["th"], float),
           np.array(fin["hi"], float), np.array(fin["ho"], float)]

# Anchor indices on the top lobe (see final_H2 A):
# 5 left top, 6 top apex, 7 right top, 8 under right of top
TOP = [5, 6, 7, 8]


def pack_free(base, free):
    z = base.copy()
    # free: dy for A5,A6,A7,A8 (4) + small dth for those (4) + dhi/dho for segs 5,6,7 (6)
    for i, idx in enumerate(TOP):
        z[2 * idx + 1] += free[i]  # y nudge
    for i, idx in enumerate(TOP):
        z[2 * N + idx] += free[4 + i] * 0.03
    for i, s in enumerate((5, 6, 7)):
        z[3 * N + s] = max(4.0, z[3 * N + s] + free[8 + i])
        z[4 * N + s] = max(4.0, z[4 * N + s] + free[11 + i])
    return z


def top_band_iou(z, name):
    """IoU only on the top third of the crop, where the top lobe lives."""
    s, tx, ty = regs[name]
    mask = M[name]
    H, W = mask.shape
    pred = np.zeros((H, W), np.uint8)
    for q in both_s(z, N, 36):
        pp = ((q - 480) * s + np.array([tx, ty]))
        cv2.fillPoly(pred, [np.round(pp).astype(np.int32)], 1)
    y1 = int(H * 0.42)
    a = mask[:y1] > 0.5
    b = pred[:y1].astype(bool)
    return (a & b).sum() / max((a | b).sum(), 1)


def full_iou(z, name):
    return float(raster_iou_s(z, N, regs[name], M[name], S=4))


def objective(free):
    z = pack_free(z0, free)
    # keep full silhouette from collapsing while prioritizing the top band
    top = 0.7 * top_band_iou(z, "wersja-jasna") + 0.3 * top_band_iou(z, "wersja-ciemna")
    full = 0.7 * full_iou(z, "wersja-jasna") + 0.3 * full_iou(z, "wersja-ciemna")
    # soft stay-near-zero on free vars
    return -(0.55 * top + 0.45 * full) + 0.0008 * float(np.dot(free, free))


def path_d(z, rot=False):
    A, th, hi, ho = unpack(z, N)
    u = np.c_[np.cos(th), np.sin(th)]
    f = lambda v: ("%.2f" % v).rstrip("0").rstrip(".") if abs(v) >= 0.005 else "0"
    T = (lambda a: 960 - a) if rot else (lambda a: a)
    pt = lambda a: f(T(a)[0]) + " " + f(T(a)[1])
    s = "M" + pt(A[0])
    for i in range(N):
        j = (i + 1) % N
        s += "C" + pt(A[i] + u[i] * ho[i]) + " " + pt(A[j] - u[j] * hi[j]) + " " + pt(A[j])
    return s + "Z"


def soft_earth_fold(svg):
    """Replace the hard earth front edge with a soft radial fold, like heaven."""
    # Remove hard front path; add soft mask + crease mirroring heaven, rotated in place via coords.
    # Heaven crease center is around (862, 390). Earth = 180 rot around (480,480) => (98, 570).
    old = (
        '<rect id="e-shadow-layer" x="0" y="0" width="313" height="960" fill="url(#e-shadow)"/>'
        '<path id="e-front-layer" d="M303 1500V542.62C303 516.2 326.7 447.83 350.29 419.8L1315.98 -728V1500Z" fill="url(#e-front)"/>'
    )
    # Soft front: dark earth colors fading across a curved boundary toward the left/bottom.
    # Keep e-shadow, replace e-front with a soft-masked rect + light crease.
    new = (
        '<rect id="e-shadow-layer" x="0" y="0" width="360" height="960" fill="url(#e-shadow)"/>'
        '<rect id="e-front-layer" x="0" y="0" width="430" height="960" fill="url(#e-front)" mask="url(#e-front-mask)"/>'
        '<rect id="e-crease-layer" x="0" y="0" width="360" height="960" fill="url(#e-crease)"/>'
    )
    if old not in svg:
        raise SystemExit("earth fold pattern missing")
    extra = (
        '<radialGradient id="e-soft" gradientUnits="userSpaceOnUse" cx="98" cy="570" r="340">'
        '<stop offset="0.42" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>'
        '<mask id="e-front-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="960">'
        '<circle cx="98" cy="570" r="340" fill="url(#e-soft)"/>'
        '<rect x="0" y="0" width="98" height="960" fill="#fff"/></mask>'
        '<radialGradient id="e-crease" gradientUnits="userSpaceOnUse" cx="98" cy="570" r="320">'
        '<stop offset="0.48" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="0.82" stop-color="#000" stop-opacity="0.14"/>'
        '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
    )
    # soften e-front gradient stops a bit toward board samples
    svg2 = svg.replace(old, new).replace("</defs>", extra + "</defs>")
    # soften the harsh e-front end stop
    svg2 = svg2.replace(
        '<linearGradient id="e-front" gradientUnits="userSpaceOnUse" x1="338.76" y1="1039.57" x2="65.18" y2="618.38">'
        '<stop offset="0" stop-color="#013A2C"/><stop offset="0.95" stop-color="#036B49"/><stop offset="1" stop-color="#031C14"/></linearGradient>',
        '<linearGradient id="e-front" gradientUnits="userSpaceOnUse" x1="420" y1="900" x2="80" y2="520">'
        '<stop offset="0" stop-color="#024A35"/><stop offset="0.55" stop-color="#036B49"/><stop offset="1" stop-color="#023326"/></linearGradient>',
    )
    return svg2


def write_mark(z, soft_fold=True):
    heaven = path_d(z, False)
    earth = path_d(z, True)
    base = (OUT / "mark.svg").read_text()
    base = re.sub(r'id="heaven" d="[^"]*"', f'id="heaven" d="{heaven}"', base, count=1)
    base = re.sub(r'id="earth" d="[^"]*"', f'id="earth" d="{earth}"', base, count=1)
    if soft_fold:
        base = soft_earth_fold(base)
    (OUT / "mark.svg").write_text(base)
    # dark: same paths, keep its own gradients, only soft-fold if present
    dark = (OUT / "mark-dark.svg").read_text()
    dark = re.sub(r'id="heaven" d="[^"]*"', f'id="heaven" d="{heaven}"', dark, count=1)
    dark = re.sub(r'id="earth" d="[^"]*"', f'id="earth" d="{earth}"', dark, count=1)
    # dark earth fold pattern may differ slightly
    dark_old = (
        '<rect id="e-shadow-layer" x="0" y="0" width="313.14" height="960" fill="url(#e-shadow)"/>'
        '<path id="e-front-layer" d="M303.14 1500V559.19C303.14 501.27 314.33 449.24 395.4 429.57L1853.12 75.92V1500Z" fill="url(#e-front)"/>'
    )
    dark_new = (
        '<rect id="e-shadow-layer" x="0" y="0" width="360" height="960" fill="url(#e-shadow)"/>'
        '<rect id="e-front-layer" x="0" y="0" width="430" height="960" fill="url(#e-front)" mask="url(#e-front-mask)"/>'
        '<rect id="e-crease-layer" x="0" y="0" width="360" height="960" fill="url(#e-crease)"/>'
    )
    extra = (
        '<radialGradient id="e-soft" gradientUnits="userSpaceOnUse" cx="98" cy="570" r="340">'
        '<stop offset="0.42" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>'
        '<mask id="e-front-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="960">'
        '<circle cx="98" cy="570" r="340" fill="url(#e-soft)"/>'
        '<rect x="0" y="0" width="98" height="960" fill="#fff"/></mask>'
        '<radialGradient id="e-crease" gradientUnits="userSpaceOnUse" cx="98" cy="570" r="320">'
        '<stop offset="0.48" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="0.82" stop-color="#000" stop-opacity="0.10"/>'
        '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'
    )
    if dark_old in dark and soft_fold:
        dark = dark.replace(dark_old, dark_new).replace("</defs>", extra + "</defs>")
    (OUT / "mark-dark.svg").write_text(dark)
    # mono solids
    both = heaven + earth
    for name, col in (
        ("mark-mono.svg", "#0F3D2E"),
        ("mark-forest.svg", "#0F3D2E"),
        ("mark-growth.svg", "#22C55E"),
        ("mark-leaf.svg", "#86EFAC"),
        ("mark-white.svg", "#FFFFFF"),
    ):
        (OUT / name).write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" role="img" aria-label="OpenChurch">'
            f'<title>OpenChurch</title><path fill="{col}" d="{both}"/></svg>\n'
        )
    return heaven, earth


def compare(tag):
    s, tx, ty = regs["wersja-jasna"]
    x0, y0, W, H = 40, 25, 210, 200
    board = np.asarray(Image.open(WORK / "board.jpg").convert("RGB"))
    crop = board[y0 : y0 + H, x0 : x0 + W]
    bg = np.array([249.0, 250.0, 245.0])
    pw = int(round(960 * s * 4))
    subprocess.check_call(["rsvg-convert", "-w", str(pw), "-h", str(pw), str(OUT / "mark.svg"), "-o", str(WORK / "_pol.png")])
    rend = np.asarray(Image.open(WORK / "_pol.png").convert("RGBA")).astype(float)
    a = rend[:, :, 3:4] / 255
    rgb = rend[:, :, :3] * a + bg * (1 - a)
    scale = pw / 960
    yy, xx = np.mgrid[0:H, 0:W]
    vx = (xx + 0.5 - tx) / s + 480
    vy = (yy + 0.5 - ty) / s + 480
    canvas = np.zeros_like(crop, float)
    for c in range(3):
        canvas[:, :, c] = ndimage.map_coordinates(rgb[:, :, c], [vy * scale - 0.5, vx * scale - 0.5], order=1, cval=bg[c])
    canvas = np.clip(canvas, 0, 255).astype(np.uint8)
    diff = np.abs(crop.astype(int) - canvas.astype(int)).mean(2)
    heat = np.zeros_like(crop)
    heat[:, :, 0] = np.clip(diff * 5, 0, 255)
    pair = np.concatenate([crop, canvas, heat], 1)
    Image.fromarray(pair).resize((pair.shape[1] * 3, pair.shape[0] * 3), Image.Resampling.NEAREST).save(OUT / f"porownanie-{tag}.png")
    print(tag, "mean abs", round(float(diff.mean()), 3), "p95", round(float(np.percentile(diff, 95)), 2))
    # zooms
    for box, name in (((70, 5, 90, 80), "top"), ((55, 70, 70, 70), "fold")):
        x, y, w, h = box
        z = np.concatenate([pair[y : y + h, k * W + x : k * W + x + w] for k in range(3)], 1)
        Image.fromarray(z).resize((z.shape[1] * 6, z.shape[0] * 6), Image.Resampling.NEAREST).save(WORK / f"zoom_{tag}_{name}.png")


def main():
    print("start full", {n: round(full_iou(z0, n), 4) for n in ("wersja-jasna", "wersja-ciemna")})
    print("start top ", {n: round(top_band_iou(z0, n), 4) for n in ("wersja-jasna", "wersja-ciemna")})
    free0 = np.zeros(14)
    r = minimize(objective, free0, method="Nelder-Mead", options=dict(maxiter=120, xatol=0.15, fatol=1e-5))
    z = pack_free(z0, r.x)
    print("free", np.round(r.x, 3))
    print("after full", {n: round(full_iou(z, n), 4) for n in ("wersja-jasna", "wersja-ciemna")})
    print("after top ", {n: round(top_band_iou(z, n), 4) for n in ("wersja-jasna", "wersja-ciemna")})
    # only accept if top improves and full does not drop more than 0.002
    ok = top_band_iou(z, "wersja-jasna") >= top_band_iou(z0, "wersja-jasna") - 0.0005
    ok = ok and full_iou(z, "wersja-jasna") >= full_iou(z0, "wersja-jasna") - 0.003
    if not ok:
        print("reject geometry nudge; keep original paths")
        z = z0
    heaven, earth = write_mark(z, soft_fold=True)
    # update final json paths
    out = dict(fin)
    A, th, hi, ho = unpack(z, N)
    out["A"] = A.tolist()
    out["th"] = th.tolist()
    out["hi"] = hi.tolist()
    out["ho"] = ho.tolist()
    out["heaven"] = heaven
    out["earth"] = earth
    out["iou"] = {n: full_iou(z, n) for n in NAMES}
    json.dump(out, open(WORK / "final_polish.json", "w"), indent=2)
    compare("polish")
    print("wrote", OUT / "mark.svg")


if __name__ == "__main__":
    main()
