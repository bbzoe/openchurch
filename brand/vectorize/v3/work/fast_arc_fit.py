"""Fit the two-circle arm (arcmodel) against every board instance. Fast boundary residual."""
import json, time
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from scipy import ndimage as ndi
from matplotlib.path import Path as MPath
import arcmodel as am
from common import masks, NAMES

M = masks()

def both(z):
    o = am.outline(z, 28)
    return o, 960.0 - o

class Inst:
    def __init__(self, name, band=5):
        a = M[name]
        self.name = name
        self.a = a
        inner = ndi.binary_erosion(a > 0.85, iterations=band)
        outer = ndi.binary_dilation(a > 0.12, iterations=band)
        ys, xs = np.nonzero(outer & ~inner)
        self.G = np.c_[xs + 0.5, ys + 0.5]
        self.av = a[ys, xs]
    def res(self, z, reg):
        sc, tx, ty = reg
        o, o2 = both(z)
        O = np.vstack([o, o2])
        Op = (O - 480) * sc + np.array([tx, ty])
        d, _ = cKDTree(Op).query(self.G)
        ins = np.zeros(len(self.G), bool)
        for q in (o, o2):
            ins |= MPath((q - 480) * sc + np.array([tx, ty])).contains_points(self.G)
        sd = np.where(ins, -d, d)
        return np.clip(0.5 - sd, 0, 1) - self.av

def raster_iou(z, reg, mask, S=4):
    import cv2
    s, tx, ty = reg
    H, W = mask.shape
    m = np.zeros((H * S, W * S), np.uint8)
    o = am.outline(z, 48)
    for q in (o, 960 - o):
        pp = ((q - 480) * s + np.array([tx, ty])) * S
        cv2.fillPoly(m, [np.round(pp * 16).astype(np.int32)], 1, shift=4)
    cov = m.reshape(H, S, W, S).mean((1, 3))
    a, b = mask > 0.5, cov > 0.5
    return float((a & b).sum() / max((a | b).sum(), 1))

def report(z, regs, tag):
    v = {n: raster_iou(z, regs[n], M[n]) for n in NAMES}
    print(tag, {k[:8]: round(x, 4) for k, x in v.items()},
          "mean", round(float(np.mean(list(v.values()))), 4),
          "heroes", round(v["wersja-jasna"], 4), round(v["wersja-ciemna"], 4), flush=True)
    return v

def main():
    fin = json.load(open("final_H2.json"))
    regs = {n: np.array(fin["regs"][n], float) for n in NAMES}
    z = np.load("zarc0.npy").astype(float)
    I = {n: Inst(n) for n in NAMES}
    wt = {n: 1.0 for n in NAMES}
    wt["wersja-jasna"] = 4.0
    wt["wersja-ciemna"] = 4.0
    wt["app-1024"] = 0.3
    # bounds: keep each arc a single increasing sweep
    lo = np.full(24, -np.inf)
    hi = np.full(24, np.inf)
    lo[2], hi[2] = 130, 185
    lo[7], hi[7] = 130, 185
    lo[10:17:1] = [-np.inf, -np.inf, -np.pi, 8, 8, 8, 8]
    hi[13:17] = 400
    lo[17:24] = [-np.inf, -np.inf, -np.pi, 8, 8, 8, 8]
    hi[20:24] = 400
    xs = np.array([6, 6, 3, 0.12, 0.12, 6, 6, 3, 0.12, 0.12,
                   8, 8, 0.15, 12, 12, 12, 12, 8, 8, 0.15, 15, 15, 15, 15])
    t = time.time()
    report(z, regs, "start")
    for rd in range(5):
        def res(zz):
            # keep sweeps from flipping
            if not (0.9 < (zz[4] - zz[3]) < 5.2 and 0.9 < (zz[9] - zz[8]) < 5.2):
                return np.ones(sum(len(I[n].av) for n in NAMES)) * 5
            return np.concatenate([wt[n] * I[n].res(zz, regs[n]) for n in NAMES])
        r = least_squares(res, z, bounds=(lo, hi), method="trf", x_scale=xs, max_nfev=18, diff_step=1e-3)
        z = r.x
        for n in NAMES:
            rr = least_squares(lambda q, n=n: I[n].res(z, q), regs[n], method="lm",
                               x_scale=[0.008, 0.6, 0.6], max_nfev=12)
            regs[n] = rr.x
        v = report(z, regs, "rd%d" % rd)
        print("  %.0fs" % (time.time() - t), "R", np.round(z[2], 2), np.round(z[7], 2), flush=True)
        np.save("zarc_fast.npy", z)
        json.dump({n: regs[n].tolist() for n in NAMES}, open("Rarc_fast.json", "w"))
        json.dump({"heaven": am.path_d(z), "earth": am.path_d(z, True), "z": z.tolist(), "iou": v,
                   "regs": {n: regs[n].tolist() for n in NAMES}}, open("arc_fast.json", "w"))
        if v["wersja-jasna"] > 0.972 and v["wersja-ciemna"] > 0.970:
            break

if __name__ == "__main__":
    main()
