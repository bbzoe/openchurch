"""OpenChurch mark as two thick round strokes. Earth is heaven rotated 180 degrees.

The centerline is one cubic. Its tangent is vertical at the top cap and horizontal
at the right cap, so each end is a round lobe and the neck is the curve between them.
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.optimize import differential_evolution, minimize

ROOT = Path(__file__).resolve().parent
BOARD = Path("/Users/bartoszbilicki/.cursor/openchurch/brand/vectorize/v3/work/board.jpg")
VB = 1000.0
CENTER = VB / 2

board = np.asarray(Image.open(BOARD).convert("RGB")).astype(np.float32)
INST = {
    "wersja-jasna": (40, 25, 210, 200),
    "wersja-ciemna": (545, 25, 205, 200),
}


def soft_mask(box):
    x0, y0, w, h = box
    crop = board[y0 : y0 + h, x0 : x0 + w]
    border = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(crop - bg, axis=2)
    dark = float(bg.sum()) < 150
    core = dist > (24 if dark else max(24, 0.35 * np.percentile(dist, 99)))
    lab, n = ndimage.label(core)
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    keep = np.argsort(sizes)[::-1][:2] + 1
    core = ndimage.binary_fill_holes(np.isin(lab, keep))
    return core, crop, bg


MASKS = {}
CROPS = {}
BGS = {}
for name, box in INST.items():
    m, c, b = soft_mask(box)
    MASKS[name] = m
    CROPS[name] = c
    BGS[name] = b


def cubic(p0, p1, p2, p3, n):
    t = np.linspace(0, 1, n)[:, None]
    omt = 1 - t
    return omt**3 * p0 + 3 * omt**2 * t * p1 + 3 * omt * t**2 * p2 + t**3 * p3


def dcubic(p0, p1, p2, p3, n):
    t = np.linspace(0, 1, n)[:, None]
    omt = 1 - t
    return 3 * omt**2 * (p1 - p0) + 6 * omt * t * (p2 - p1) + 3 * t**2 * (p3 - p2)


def arc(center, radius, a0, a1, n=16):
    ang = np.linspace(a0, a1, n, endpoint=False)
    return np.c_[center[0] + radius * np.cos(ang), center[1] + radius * np.sin(ang)]


def stroke_outline(p0, c1, c2, p3, width, n=72):
    pts = cubic(p0, c1, c2, p3, n)
    der = dcubic(p0, c1, c2, p3, n)
    length = np.hypot(der[:, 0], der[:, 1])
    length[length < 1e-6] = 1e-6
    tang = der / length[:, None]
    norm = np.c_[-tang[:, 1], tang[:, 0]]
    r = width / 2
    left = pts + norm * r
    right = pts - norm * r

    def cap(center, tangent, normal, sign):
        # sign +1 walks from +normal to -normal through -tangent (start)
        # sign -1 walks from +normal to -normal through +tangent (end), reversed below
        a_left = np.arctan2(normal[1], normal[0])
        a_right = np.arctan2(-normal[1], -normal[0])
        a_out = np.arctan2(-sign * tangent[1], -sign * tangent[0])
        cw = (a_right - a_left) % (2 * np.pi)
        ccw = cw - 2 * np.pi

        def hits(delta):
            rel = (a_out - a_left) % (2 * np.pi)
            if delta >= 0:
                return rel <= delta + 1e-4
            return (rel - 2 * np.pi) >= delta - 1e-4

        delta = cw if hits(cw) and (not hits(ccw) or abs(cw - np.pi) <= abs(ccw - np.pi)) else ccw
        return arc(center, r, a_left, a_left + delta, 14)

    start = cap(pts[0], tang[0], norm[0], +1)
    end = cap(pts[-1], tang[-1], norm[-1], -1)
    # start cap currently goes +normal (left) toward -normal (right). We want the
    # outline to arrive from the right side, cross the cap, and leave along the left.
    start = start[::-1]
    return np.vstack([right, end, left[::-1], start])


def unpack(z):
    """Top cap, two free controls, right cap, cap radius, body width."""
    x0, y0, c1x, c1y, c2x, c2y, x3, y3, cap, body = z
    p0 = np.array([x0, y0], float)
    c1 = np.array([c1x, c1y], float)
    c2 = np.array([c2x, c2y], float)
    p3 = np.array([x3, y3], float)
    return p0, c1, c2, p3, float(cap), float(body)


def arm_outline(z, rot=False):
    """Filled silhouette of one arm, traced from the mathematical stroke."""
    reg = (1.0, CENTER, CENTER)
    mask = arm_mask(z, reg, (int(VB), int(VB)), rot).astype(np.uint8)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    contour = max(contours, key=cv2.contourArea)
    simple = cv2.approxPolyDP(contour, 1.6, True).reshape(-1, 2)
    parts = [f"M {fmt(simple[0, 0])} {fmt(simple[0, 1])}"]
    for x, y in simple[1:]:
        parts.append(f"L {fmt(x)} {fmt(y)}")
    return "".join(parts) + "Z"


def centerlines(z, n=160):
    p0, c1, c2, p3, cap, body = unpack(z)
    heaven = cubic(p0, c1, c2, p3, n)
    return heaven, VB - heaven, cap, body


def _cover(pix_line, ends, cap, body, shape):
    from scipy.spatial import cKDTree

    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    pts = np.c_[xx.ravel() + 0.5, yy.ravel() + 0.5]
    dist, _ = cKDTree(pix_line).query(pts)
    inside = dist <= body * 0.5
    for end in ends:
        inside |= np.hypot(pts[:, 0] - end[0], pts[:, 1] - end[1]) <= cap
    return inside.reshape(h, w)


def raster(z, reg, shape):
    """Body stroke plus a larger circle on each cap. Earth is the 180 degree copy."""
    s, tx, ty = reg
    heaven, earth, cap, body = centerlines(z, 140)

    def place(line):
        return (line - CENTER) * s + np.array([tx, ty])

    hp, ep = place(heaven), place(earth)
    a = _cover(hp, (hp[0], hp[-1]), cap * s, body * s, shape)
    b = _cover(ep, (ep[0], ep[-1]), cap * s, body * s, shape)
    return a | b


def arm_mask(z, reg, shape, rot):
    s, tx, ty = reg
    p0, c1, c2, p3, cap, body = unpack(z)
    if rot:
        p0, c1, c2, p3 = VB - p0, VB - c1, VB - c2, VB - p3
    pix = (cubic(p0, c1, c2, p3, 160) - CENTER) * s + np.array([tx, ty])
    return _cover(pix, (pix[0], pix[-1]), cap * s, body * s, shape)


def iou(pred, mask):
    a = mask
    b = pred.astype(bool)
    inter = np.count_nonzero(a & b)
    union = np.count_nonzero(a | b)
    return inter / max(union, 1)


def contour_term(pred, mask):
    a = mask
    b = pred.astype(bool)
    if not a.any() or not b.any():
        return 1.0
    ea = a ^ ndimage.binary_erosion(a)
    eb = b ^ ndimage.binary_erosion(b)
    dt_a = ndimage.distance_transform_edt(~a)
    dt_b = ndimage.distance_transform_edt(~b)
    diag = np.hypot(*mask.shape)
    return 0.5 * (dt_a[eb].mean() + dt_b[ea].mean()) / diag


def align(z, name):
    mask = MASKS[name]
    ys, xs = np.nonzero(mask)
    target_c = np.array([xs.mean(), ys.mean()])
    target_h = ys.max() - ys.min() + 1
    heaven, earth, cap, body = centerlines(z, 80)
    pts = np.vstack([heaven, earth])
    bb_h = pts[:, 1].max() - pts[:, 1].min() + 2 * cap
    s = target_h / max(bb_h, 1)
    model_c = pts.mean(0)
    t = target_c - (model_c - CENTER) * s
    return np.array([s, t[0], t[1]])


def loss_one(z, name, reg=None):
    if reg is None:
        reg = align(z, name)
    pred = raster(z, reg, MASKS[name].shape)
    return 0.7 * (1 - iou(pred, MASKS[name])) + 0.3 * contour_term(pred, MASKS[name]), reg, pred


def complexity(z):
    x0, y0, c1x, c1y, c2x, c2y, x3, y3, cap, body = z
    reach_v = CENTER - y0
    reach_h = x3 - CENTER
    scale = 280
    # body cannot be wider than the caps; a hard penalty keeps the lobes bulbous
    pinch = max(0.0, body * 0.5 - cap) / 40
    return abs(reach_v - reach_h) / scale + pinch


def objective(z):
    # shared geometry, each hero gets its own placement
    parts = []
    for name, wt in (("wersja-jasna", 0.65), ("wersja-ciemna", 0.35)):
        val, _, _ = loss_one(z, name)
        parts.append(wt * val)
    return float(sum(parts) + 0.04 * complexity(z))


def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def path_d(p0, c1, c2, p3, rot=False):
    pts = [p0, c1, c2, p3]
    if rot:
        pts = [VB - p for p in pts]
    p0, c1, c2, p3 = pts
    return (
        f"M {fmt(p0[0])} {fmt(p0[1])} "
        f"C {fmt(c1[0])} {fmt(c1[1])} {fmt(c2[0])} {fmt(c2[1])} {fmt(p3[0])} {fmt(p3[1])}"
    )


def fit_gradient(z, reg, name, rot):
    """Three stops along the cap-to-cap axis, solved from interior pixels."""
    p0, c1, c2, p3, cap, body = unpack(z)
    if rot:
        p0, c1, c2, p3 = VB - p0, VB - c1, VB - c2, VB - p3
    s, tx, ty = reg
    crop = CROPS[name]
    h, w = MASKS[name].shape
    arm = arm_mask(z, reg, (h, w), rot)
    inner = ndimage.binary_erosion(arm, iterations=2)
    ys, xs = np.nonzero(inner)
    if len(xs) < 30:
        ys, xs = np.nonzero(arm)
    cols = crop[ys, xs]
    # parameter along the straight axis from the first cap to the second
    a = (p0 - CENTER) * s + np.array([tx, ty])
    b = (p3 - CENTER) * s + np.array([tx, ty])
    v = b - a
    denom = float(v @ v) or 1
    t = ((np.c_[xs, ys] - a) @ v) / denom
    t = np.clip(t, 0, 1)
    # design matrix for stops at 0, 0.5, 1
    m = np.zeros((len(t), 3))
    left = t <= 0.5
    m[left, 0] = 1 - 2 * t[left]
    m[left, 1] = 2 * t[left]
    right = ~left
    m[right, 1] = 2 - 2 * t[right]
    m[right, 2] = 2 * t[right] - 1
    stops = []
    for ch in range(3):
        coef, _, _, _ = np.linalg.lstsq(m, cols[:, ch], rcond=None)
        stops.append(np.clip(coef, 0, 255))
    rgb = np.stack(stops, axis=1)
    return p0, p3, rgb


def svg(z, heaven_grad, earth_grad, title):
    p0, c1, c2, p3, cap, body = unpack(z)
    h0, h1, hcols = heaven_grad
    e0, e1, ecols = earth_grad

    def grad(gid, a, b, cols):
        stops = ""
        for off, col in zip((0, 0.5, 1), cols):
            hexcol = "#%02X%02X%02X" % tuple(int(round(v)) for v in col)
            stops += f'<stop offset="{fmt(off)}" stop-color="{hexcol}"/>'
        return (
            f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" '
            f'x1="{fmt(a[0])}" y1="{fmt(a[1])}" x2="{fmt(b[0])}" y2="{fmt(b[1])}">{stops}</linearGradient>'
        )

    earth_d = arm_outline(z, True)
    heaven_d = arm_outline(z, False)
    defs = grad("earth", e0, e1, ecols) + grad("heaven", h0, h1, hcols)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="OpenChurch">'
        f"<title>{title}</title><defs>{defs}</defs>"
        f'<path id="earth" d="{earth_d}" fill="url(#earth)"/>'
        f'<path id="heaven" d="{heaven_d}" fill="url(#heaven)"/>'
        "</svg>\n"
    )


def mono_svg(z, color="#0F3D2E"):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="OpenChurch">'
        "<title>OpenChurch</title>"
        f'<path id="earth" d="{arm_outline(z, True)}" fill="{color}"/>'
        f'<path id="heaven" d="{arm_outline(z, False)}" fill="{color}"/>'
        "</svg>\n"
    )


def save_compare(z, regs):
    x0, y0, w, h = INST["wersja-jasna"]
    crop = board[y0 : y0 + h, x0 : x0 + w].astype(np.uint8)
    pred = raster(z, regs["wersja-jasna"], (h, w))
    vis = crop.copy()
    edge = pred.astype(bool) ^ ndimage.binary_erosion(pred.astype(bool))
    vis[edge] = (220, 40, 50)
    pair = np.concatenate([crop, vis], axis=1)
    Image.fromarray(pair).resize((pair.shape[1] * 3, pair.shape[0] * 3), Image.Resampling.NEAREST).save(ROOT / "porownanie.png")


def report(z, tag):
    regs = {}
    scores = {}
    for name in INST:
        val, reg, pred = loss_one(z, name)
        regs[name] = reg
        scores[name] = iou(pred, MASKS[name])
    print(tag, {k: round(v, 4) for k, v in scores.items()}, "z", np.round(z, 2), flush=True)
    return regs, scores


def main():
    # Previous constant-width fit, plus a fatter cap than the neck.
    z0 = np.array([516, 260, 516, 393, 618, 498, 752, 498, 155, 175], float)
    report(z0, "init")
    bounds = [
        (400, 640),   # x0
        (60, 360),    # y0
        (300, 750),   # c1x
        (120, 700),   # c1y
        (350, 900),   # c2x
        (250, 750),   # c2y
        (660, 980),   # x3
        (320, 700),   # y3
        (90, 210),    # cap radius
        (70, 260),    # body width
    ]
    result = differential_evolution(
        objective,
        bounds,
        seed=7,
        popsize=12,
        mutation=0.55,
        recombination=0.8,
        maxiter=22,
        atol=0,
        tol=0.0015,
        polish=False,
        workers=1,
        updating="immediate",
        disp=False,
    )
    z = result.x
    report(z, "de")
    local = minimize(objective, z, method="Nelder-Mead", options={"maxiter": 80, "xatol": 0.4, "fatol": 1e-4})
    z = local.x
    # keep the vertical / horizontal tangents: c1x stays x0, c2y stays y3
    regs, scores = report(z, "local")
    # one more placement polish does not change geometry
    heaven = fit_gradient(z, regs["wersja-jasna"], "wersja-jasna", False)
    earth = fit_gradient(z, regs["wersja-jasna"], "wersja-jasna", True)
    dark_h = fit_gradient(z, regs["wersja-ciemna"], "wersja-ciemna", False)
    dark_e = fit_gradient(z, regs["wersja-ciemna"], "wersja-ciemna", True)
    (ROOT / "mark.svg").write_text(svg(z, heaven, earth, "OpenChurch"))
    (ROOT / "mark-dark.svg").write_text(svg(z, dark_h, dark_e, "OpenChurch"))
    (ROOT / "mark-mono.svg").write_text(mono_svg(z))
    save_compare(z, regs)
    payload = {
        "z": z.tolist(),
        "cap": float(z[8]),
        "body": float(z[9]),
        "heaven": path_d(*unpack(z)[:4]),
        "earth": path_d(*unpack(z)[:4], True),
        "iou": scores,
        "regs": {k: v.tolist() for k, v in regs.items()},
    }
    (ROOT / "params.json").write_text(json.dumps(payload, indent=2))
    print("wrote", ROOT)


if __name__ == "__main__":
    main()
