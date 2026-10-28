"""Earth fold = disk (lobe overlap), not a vertical cut. Fit to the board pixels."""
import json, re, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.optimize import least_squares

WORK = Path(__file__).resolve().parent
V3 = WORK.parent
board = np.asarray(Image.open(WORK / "board.jpg").convert("RGB")).astype(float)
fin = json.load(open(WORK / "final_H2.json"))
INST = {
    "wersja-jasna": (40, 25, 210, 200),
    "wersja-ciemna": (545, 25, 205, 200),
}

def f2(v):
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

def hx(c):
    return "#%02X%02X%02X" % tuple(int(round(min(255, max(0, v)))) for v in c)

def earth_d():
    txt = (V3 / "mark.svg").read_text()
    m = re.search(r'id="earth" d="([^"]+)"', txt)
    return m.group(1)

def raster_earth():
    d = earth_d()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960">'
        '<path d="%s" fill="#fff"/></svg>' % d
    )
    p = WORK / "_earth_mask.svg"
    p.write_text(svg)
    subprocess.check_call(["rsvg-convert", str(p), "-o", str(WORK / "_earth_mask.png")])
    a = np.asarray(Image.open(WORK / "_earth_mask.png").convert("L")).astype(float) / 255.0
    return a

def samples(name, alpha, erode=3.0):
    x0, y0, w, h = INST[name]
    s, tx, ty = fin["regs"][name]
    gy, gx = np.mgrid[0:h, 0:w]
    vb = np.stack([(gx + 0.5 - tx) / s + 480, (gy + 0.5 - ty) / s + 480], -1)
    inside = ndimage.map_coordinates(alpha, [vb[..., 1] - 0.5, vb[..., 0] - 0.5], order=1, cval=0)
    dist = ndimage.distance_transform_edt(alpha > 0.5)
    din = ndimage.map_coordinates(dist, [vb[..., 1] - 0.5, vb[..., 0] - 0.5], order=1, cval=0)
    sel = (inside > 0.6) & (din > erode)
    col = board[y0 : y0 + h, x0 : x0 + w]
    return vb[sel], col[sel]

def lin(P, A, B):
    v = B - A
    return ((P - A) @ v) / (v @ v + 1e-9)

def stops(t, m, cols):
    return np.stack([np.interp(t, [0, m, 1], cols[:, k]) for k in range(3)], -1)

def color(P, th):
    A1, B1 = th[0:2], th[2:4]
    base = stops(lin(P, A1, B1), th[4], th[5:14].reshape(3, 3))
    C, r, w = th[14:16], th[16], max(th[17], 1.0)
    A2, B2 = th[18:20], th[20:22]
    front = stops(lin(P, A2, B2), th[22], th[23:32].reshape(3, 3))
    d = np.hypot(*(P - C).T)
    msk = np.clip((r + w * 0.5 - d) / w, 0, 1)
    return base * (1 - msk[:, None]) + front * msk[:, None]

def pack_init():
    # 180° of heaven's fitted disk. Colors: dark cap over a green body.
    th = np.zeros(32)
    th[0:5] = [420, 520, 40, 700, 0.65]
    th[5:14] = [2, 50, 38, 5, 180, 120, 20, 40, 30]
    th[14:18] = [98, 570, 230, 28]
    th[18:23] = [80, 480, 220, 640, 0.55]
    th[23:32] = [1, 40, 30, 2, 70, 50, 3, 30, 24]
    return th

def bounds():
    lo = np.array(
        [-400, -400, -400, -400, 0.05, *([0] * 9), -80, 250, 80, 6, -400, -200, -200, 200, 0.05, *([0] * 9)],
        float,
    )
    hi = np.array(
        [1400, 1400, 1400, 1400, 0.95, *([255] * 9), 420, 900, 420, 160, 900, 1100, 900, 1200, 0.95, *([255] * 9)],
        float,
    )
    return lo, hi

def fit(P, C, th0, restarts=5, nfev=250, seed=1):
    lo, hi = bounds()
    rng = np.random.default_rng(seed)
    if len(P) > 4500:
        idx = rng.choice(len(P), 4500, replace=False)
        P, C = P[idx], C[idx]

    def fun(th):
        err = (color(P, th) - C).ravel()
        # keep both ramps long enough to be real gradients
        short = np.array(
            [
                max(0, 180 - np.hypot(*(th[2:4] - th[0:2]))),
                max(0, 120 - np.hypot(*(th[20:22] - th[18:20]))),
            ]
        )
        return np.r_[err, short * 0.15]

    best = None
    for k in range(restarts):
        t0 = th0.copy()
        if k:
            t0 = t0 * (1 + 0.08 * rng.standard_normal(len(t0)))
            t0[14:18] += rng.normal(0, [25, 25, 18, 6])
        t0 = np.clip(t0, lo + 1e-4, hi - 1e-4)
        r = least_squares(fun, t0, bounds=(lo, hi), method="trf", max_nfev=nfev, x_scale="jac")
        if best is None or r.cost < best.cost:
            best = r
            print(" restart", k, "cost", round(r.cost, 1), "nfev", r.nfev)
    e = np.linalg.norm(color(P, best.x) - C, axis=1)
    print("mean", round(e.mean(), 2), "p90", round(np.percentile(e, 90), 2))
    print("disk", np.round(best.x[14:18], 2), "w", round(best.x[17], 2))
    return best.x

def lg(id_, A, B, m, cols):
    st = ""
    for o, c in zip((0, m, 1), cols):
        st += '<stop offset="%s" stop-color="%s"/>' % (f2(o), hx(c))
    return (
        '<linearGradient id="%s" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s">%s</linearGradient>'
        % (id_, f2(A[0]), f2(A[1]), f2(B[0]), f2(B[1]), st)
    )

def earth_defs_and_layers(th, prefix="e"):
    A1, B1, m1 = th[0:2], th[2:4], th[4]
    cols = th[5:14].reshape(3, 3)
    cx, cy, r, w = th[14], th[15], th[16], max(th[17], 1)
    A2, B2, m2 = th[18:20], th[20:22], th[22]
    cols2 = th[23:32].reshape(3, 3)
    R = r + w
    defs = [
        lg(prefix + "-base", A1, B1, m1, cols),
        lg(prefix + "-front", A2, B2, m2, cols2),
        (
            '<radialGradient id="%s-disk" gradientUnits="userSpaceOnUse" cx="%s" cy="%s" r="%s">'
            '<stop offset="%s" stop-color="#fff"/>'
            '<stop offset="1" stop-color="#000"/></radialGradient>'
        )
        % (prefix, f2(cx), f2(cy), f2(R), f2(r / R)),
        (
            '<mask id="%s-disk-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="960">'
            '<circle cx="%s" cy="%s" r="%s" fill="url(#%s-disk)"/></mask>'
        )
        % (prefix, f2(cx), f2(cy), f2(R), prefix),
    ]
    layers = (
        '<circle id="%s-front-layer" cx="%s" cy="%s" r="%s" fill="url(#%s-front)" mask="url(#%s-disk-mask)"/>'
        % (prefix, f2(cx), f2(cy), f2(R), prefix, prefix)
    )
    return "".join(defs), layers, "url(#%s-base)" % prefix

def write_mark(src, dst, th):
    txt = Path(src).read_text()
    defs, layers, fill = earth_defs_and_layers(th)
    txt = re.sub(r'<linearGradient id="e-base".*?</linearGradient>', "", txt, count=1)
    txt = re.sub(r'<linearGradient id="e-front".*?</linearGradient>', "", txt, count=1)
    txt = re.sub(r'<linearGradient id="e-shadow".*?</linearGradient>', "", txt, count=1)
    txt = txt.replace("</defs>", defs + "</defs>", 1)
    txt = re.sub(
        r'(<path id="earth" d="[^"]+" )fill="[^"]+"',
        r'\1fill="%s"' % fill,
        txt,
        count=1,
    )
    txt = re.sub(
        r'<g clip-path="url\(#clip-earth\)">.*?</g>',
        '<g clip-path="url(#clip-earth)">%s</g>' % layers,
        txt,
        count=1,
    )
    Path(dst).write_text(txt)

def render_window(svg, out, wx0=20, wy0=55, wx1=145, wy1=185, Z=8, bg="#F7F6F1"):
    s, tx, ty = fin["regs"]["wersja-jasna"]
    def vb(px, py):
        return (px - tx) / s + 480, (py - ty) / s + 480
    vx0, vy0 = vb(wx0, wy0)
    vx1, vy1 = vb(wx1, wy1)
    txt = Path(svg).read_text()
    W, H = (wx1 - wx0) * Z, (wy1 - wy0) * Z
    txt = re.sub(
        r'viewBox="[^"]*" width="[^"]*" height="[^"]*"',
        'viewBox="%f %f %f %f" width="%d" height="%d"' % (vx0, vy0, vx1 - vx0, vy1 - vy0, W, H),
        txt,
        count=1,
    )
    tmp = WORK / "_foldwin.svg"
    tmp.write_text(txt)
    subprocess.check_call(["rsvg-convert", str(tmp), "-o", str(out), "--background-color", bg])

def board_window(out, wx0=20, wy0=55, wx1=145, wy1=185, Z=8):
    x0, y0, w, h = INST["wersja-jasna"]
    crop = board[y0 : y0 + h, x0 : x0 + w].astype(np.uint8)
    win = crop[wy0:wy1, wx0:wx1]
    Image.fromarray(win).resize(((wx1 - wx0) * Z, (wy1 - wy0) * Z), Image.Resampling.NEAREST).save(out)

if __name__ == "__main__":
    alpha = raster_earth()
    P, C = samples("wersja-jasna", alpha)
    print("samples", len(P))
    th = fit(P, C, pack_init())
    np.save(WORK / "th_earth_disk.npy", th)
    write_mark(V3 / "mark.svg", WORK / "mark-fold.svg", th)
    board_window("/tmp/fold-board.png")
    render_window(V3 / "mark.svg", "/tmp/fold-old.png")
    render_window(WORK / "mark-fold.svg", "/tmp/fold-new.png")
    # full mark
    subprocess.check_call(
        ["rsvg-convert", "-w", "640", "-h", "640", str(WORK / "mark-fold.svg"), "-o", "/tmp/mark-fold-full.png", "--background-color", "#F7F6F1"]
    )
    b = Image.open("/tmp/fold-board.png")
    o = Image.open("/tmp/fold-old.png").resize(b.size)
    n = Image.open("/tmp/fold-new.png").resize(b.size)
    sheet = Image.new("RGB", (b.width * 3 + 16, b.height), (255, 255, 255))
    sheet.paste(b.convert("RGB"), (0, 0))
    sheet.paste(o.convert("RGB"), (b.width + 8, 0))
    sheet.paste(n.convert("RGB"), (b.width * 2 + 16, 0))
    sheet.save(WORK / "fold-circle-compare.png")
    print("wrote", WORK / "fold-circle-compare.png")
