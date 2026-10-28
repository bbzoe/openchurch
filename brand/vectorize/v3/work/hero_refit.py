"""Nudge the 12-anchor master toward the two large board marks."""
import json, time
import numpy as np
from scipy.optimize import least_squares
from sp import SInst, raster_iou_s
from common import NAMES, masks

M = masks()
N = 12
SInst.N = N

def pack(fin):
    return np.r_[np.array(fin["A"], float).ravel(), np.array(fin["th"], float),
                 np.array(fin["hi"], float), np.array(fin["ho"], float)]

def report(z, regs, tag):
    v = {n: float(raster_iou_s(z, N, regs[n], M[n], S=4)) for n in NAMES}
    print(tag, {k[:8]: round(x, 4) for k, x in v.items()},
          "mean", round(float(np.mean(list(v.values()))), 4),
          "heroes", round(v["wersja-jasna"], 4), round(v["wersja-ciemna"], 4), flush=True)
    return v

def main():
    fin = json.load(open("final_H2.json"))
    regs = {n: np.array(fin["regs"][n], float) for n in NAMES}
    z = pack(fin)
    I = {n: SInst(n) for n in NAMES}
    wt = {n: 1.0 for n in NAMES}
    wt["wersja-jasna"] = 8.0
    wt["wersja-ciemna"] = 8.0
    wt["app-1024"] = 0.25
    lo = np.full(len(z), -np.inf)
    hi = np.full(len(z), np.inf)
    lo[3 * N:] = 4  # handle lengths
    xs = np.r_[np.full(2 * N, 6.0), np.full(N, 0.12), np.full(2 * N, 10.0)]
    t = time.time()
    base = report(z, regs, "start")
    base_mean = float(np.mean(list(base.values())))
    best = z.copy()
    best_score = base["wersja-jasna"] + base["wersja-ciemna"]
    for rd in range(4):
        def res(zz):
            return np.concatenate([wt[n] * I[n].res(zz, regs[n]) for n in NAMES])
        r = least_squares(res, z, bounds=(lo, hi), method="trf", x_scale=xs, max_nfev=10, diff_step=1e-3)
        z = r.x
        for n in NAMES:
            rr = least_squares(lambda q, n=n: I[n].res(z, q), regs[n], method="lm",
                               x_scale=[0.008, 0.6, 0.6], max_nfev=8)
            regs[n] = rr.x
        v = report(z, regs, "rd%d" % rd)
        print("  %.0fs" % (time.time() - t), flush=True)
        score = v["wersja-jasna"] + v["wersja-ciemna"]
        # keep only if heroes rise and the mean does not fall apart
        if score > best_score and np.mean(list(v.values())) >= base_mean - 0.004:
            best, best_score = z.copy(), score
            np.save("zhero.npy", best)
            json.dump({n: regs[n].tolist() for n in NAMES}, open("Rhero.json", "w"))
    # base_mean used above; set it before loop... fixed below if NameError
    print("best heroes sum", round(best_score, 4))

if __name__ == "__main__":
    main()
