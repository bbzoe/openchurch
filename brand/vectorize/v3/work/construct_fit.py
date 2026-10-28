"""OpenChurch arm as the board draws it: two circles, straight outer tangent, tangent waist."""
import json, sys, time
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from matplotlib.path import Path as MPath
from common import masks, NAMES, raster_iou

M = masks()
CENTER = np.array([480.0, 480.0])

def outer_frame(c1, c2, R1, R2):
    d = c2 - c1
    L = np.hypot(d[0], d[1])
    u = d / L
    n = np.array([-u[1], u[0]])
    mid = (c1 + c2) / 2
    if np.hypot(*(mid + n - CENTER)) < np.hypot(*(mid - n - CENTER)):
        n = -n
    # external tangent: radii to the tangent points are parallel
    # sin(beta) = (R1-R2)/L, beta tilts the radius off the perpendicular
    s = np.clip((R1 - R2) / L, -0.95, 0.95)
    beta = np.arcsin(s)
    # n is +90 deg from u. Tilting toward the smaller circle:
    ct, st = np.cos(beta), np.sin(beta)
    # radius direction = rotate n by -beta in the (u, n) frame
    rad = n * ct - u * st
    T1 = c1 + rad * R1
    T2 = c2 + rad * R2
    return u, n, rad, T1, T2, L

def point_on(c, R, n, u, phi):
    # phi=0 at the inner pole (-n), positive phi toward +u
    v = -n * np.cos(phi) + u * np.sin(phi)
    return c + R * v, v

def cubic(p0, p1, p2, p3, n):
    t = np.linspace(0, 1, n, endpoint=False)[:, None]
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * (t ** 2) * p2 + (t ** 3) * p3

def arc_delta(c, R, start, end, other):
    """Sweep whose midpoint lies farther from the other lobe: the outer cap."""
    a0 = np.arctan2(start[1] - c[1], start[0] - c[0])
    a1 = np.arctan2(end[1] - c[1], end[0] - c[0])
    cw = (a1 - a0) % (2 * np.pi)
    def mid(delta):
        ang = a0 + delta / 2
        return np.array([c[0] + R * np.cos(ang), c[1] + R * np.sin(ang)])
    dcw = np.hypot(*(mid(cw) - other))
    dccw = np.hypot(*(mid(cw - 2 * np.pi) - other))
    return cw if dcw >= dccw else cw - 2 * np.pi

def arc_through_outer(c, R, start, end, other, n=48):
    a0 = np.arctan2(start[1] - c[1], start[0] - c[0])
    delta = arc_delta(c, R, start, end, other)
    ts = np.linspace(0, 1, n, endpoint=False)
    ang = a0 + delta * ts
    return np.c_[c[0] + R * np.cos(ang), c[1] + R * np.sin(ang)]

def outline_arm(z, n_arc=36, n_bez=24):
    c1 = z[0:2]
    c2 = z[2:4]
    R1, R2 = z[4], z[5]
    phi1, phi2, h1, h2 = z[6], z[7], z[8], z[9]
    u, n, rad, T1, T2, L = outer_frame(c1, c2, R1, R2)
    P1, v1 = point_on(c1, R1, n, u, phi1)
    P2, v2 = point_on(c2, R2, n, u, phi2)
    # tangent of the circle, outgoing along the waist (toward the other point)
    t1 = np.array([-v1[1], v1[0]])
    t2 = np.array([-v2[1], v2[0]])
    if np.dot(t1, P2 - P1) < 0:
        t1 = -t1
    if np.dot(t2, P2 - P1) < 0:
        t2 = -t2
    bez = cubic(P1, P1 + t1 * h1, P2 - t2 * h2, P2, n_bez)
    arc1 = arc_through_outer(c1, R1, T1, P1, c2, n_arc)
    arc2 = arc_through_outer(c2, R2, P2, T2, c1, n_arc)
    line = np.linspace(T2, T1, 8, endpoint=False)
    return np.vstack([arc1, bez, arc2, line])

def both(z, **k):
    o = outline_arm(z, **k)
    return o, 960 - o

def path_d(z, rot=False):
    c1, c2 = z[0:2], z[2:4]
    R1, R2 = float(z[4]), float(z[5])
    phi1, phi2, h1, h2 = z[6], z[7], z[8], z[9]
    u, n, rad, T1, T2, L = outer_frame(c1, c2, R1, R2)
    P1, v1 = point_on(c1, R1, n, u, phi1)
    P2, v2 = point_on(c2, R2, n, u, phi2)
    t1 = np.array([-v1[1], v1[0]])
    t2 = np.array([-v2[1], v2[0]])
    if np.dot(t1, P2 - P1) < 0:
        t1 = -t1
    if np.dot(t2, P2 - P1) < 0:
        t2 = -t2
    C1h = P1 + t1 * h1
    C2h = P2 - t2 * h2
    f = lambda v: ("%.2f" % v).rstrip("0").rstrip(".") if abs(v) >= 0.005 else "0"
    T = (lambda a: np.array([960 - a[0], 960 - a[1]])) if rot else (lambda a: np.asarray(a, float))
    pt = lambda a: f(T(a)[0]) + " " + f(T(a)[1])
    def arc_cmd(c, R, start, end, other):
        delta = arc_delta(c, R, start, end, other)
        large = 1 if abs(delta) > np.pi else 0
        sweep = 1 if delta > 0 else 0
        return "A%s %s 0 %d %d %s" % (f(R), f(R), large, sweep, pt(end))
    d = "M" + pt(T1) + arc_cmd(c1, R1, T1, P1, c2)
    d += "C" + pt(C1h) + " " + pt(C2h) + " " + pt(P2)
    d += arc_cmd(c2, R2, P2, T2, c1)
    d += "L" + pt(T1) + "Z"
    return d

class Inst:
    def __init__(self, name, band=5):
        from scipy import ndimage as ndi
        a = M[name]
        self.name = name
        self.a = a
        self.shape = a.shape
        inner = ndi.binary_erosion(a > 0.85, iterations=band)
        outer = ndi.binary_dilation(a > 0.12, iterations=band)
        sel = outer & ~inner
        ys, xs = np.nonzero(sel)
        self.G = np.c_[xs + 0.5, ys + 0.5]
        self.av = a[ys, xs]
    def res(self, z, reg):
        sc, tx, ty = reg
        o, o2 = both(z, n_arc=28, n_bez=16)
        O = np.vstack([o, o2])
        Op = (O - 480) * sc + np.array([tx, ty])
        d, _ = cKDTree(Op).query(self.G)
        ins = np.zeros(len(self.G), bool)
        for q in (o, o2):
            ins |= MPath((q - 480) * sc + np.array([tx, ty])).contains_points(self.G)
        sd = np.where(ins, -d, d)
        return np.clip(0.5 - sd, 0, 1) - self.av

def ious(z, regs):
    return {n: float(raster_iou_z(z, regs[n], M[n])) for n in NAMES}

def raster_iou_z(z, reg, mask, S=4):
    import cv2
    s, tx, ty = reg
    H, W = mask.shape
    m = np.zeros((H * S, W * S), np.uint8)
    for q in both(z, n_arc=48, n_bez=24):
        pp = ((q - 480) * s + np.array([tx, ty])) * S
        cv2.fillPoly(m, [np.round(pp * 16).astype(np.int32)], 1, shift=4)
    cov = m.reshape(H, S, W, S).mean((1, 3))
    a = mask > 0.5
    b = cov > 0.5
    return (a & b).sum() / max((a | b).sum(), 1)

def fit_regs(z, regs, rounds=1):
    from scipy.optimize import minimize
    out = {}
    for n in NAMES:
        def fun(r, n=n):
            return -raster_iou_z(z, r, M[n], S=3)
        r = minimize(fun, regs[n], method="Nelder-Mead", options=dict(maxiter=80, xatol=1e-3, fatol=1e-5))
        out[n] = r.x
    return out

if __name__ == "__main__":
    fin = json.load(open("final_H2.json"))
    regs = {n: np.array(fin["regs"][n], float) for n in NAMES}
    # init from the arc seed, equal radius forced to the top lobe (4u)
    z = np.array([493.8, 174.4, 807.1, 474.5, 160.7, 160.7, 0.55, -0.15, 90.0, 110.0])
    I = {n: Inst(n) for n in NAMES}
    wt = {n: 1.0 for n in NAMES}
    wt["wersja-jasna"] = 3.0
    wt["wersja-ciemna"] = 3.0
    wt["app-1024"] = 0.35
    print("start", {k[:8]: round(raster_iou_z(z, regs[k], M[k]), 4) for k in NAMES}, flush=True)
    lo = np.array([420, 90, 700, 360, 140, 140, -1.3, -1.3, 15, 15])
    hi = np.array([580, 280, 920, 600, 185, 185, 1.5, 1.5, 280, 280])
    t = time.time()
    for rd in range(4):
        def res(zz):
            parts = []
            for n in NAMES:
                parts.append(wt[n] * I[n].res(zz, regs[n]))
            return np.concatenate(parts)
        r = least_squares(res, z, bounds=(lo, hi), method="trf", max_nfev=25,
                          x_scale=np.array([8, 8, 8, 8, 4, 4, 0.15, 0.15, 20, 20]))
        z = r.x
        regs = fit_regs(z, regs)
        v = {n: raster_iou_z(z, regs[n], M[n]) for n in NAMES}
        print("rd", rd, {k[:8]: round(x, 4) for k, x in v.items()},
              "mean", round(float(np.mean(list(v.values()))), 4),
              "heroes", round(v["wersja-jasna"], 4), round(v["wersja-ciemna"], 4),
              "%.0fs" % (time.time() - t), flush=True)
        print("z", np.round(z, 3), flush=True)
        np.save("zcons.npy", z)
        json.dump({n: regs[n].tolist() for n in NAMES}, open("Rcons.json", "w"))
        json.dump({"heaven": path_d(z), "earth": path_d(z, rot=True), "z": z.tolist()}, open("cons_paths.json", "w"))
