import numpy as np, sys
import colmodel_e as cm
from colmodel_e import *
P,C=pixels('light','earth',erode=3,step=2)
mask=overlay_mask(P)
print(len(P),mask.sum())
lo=np.array([-600,-600,-600,-600,0.2, -600,-600,-600,-600,0.2]);hi=np.array([1600,1600,1600,1600,0.9]*2)
def run(free):
    def m(p,P):
        c=p[10:19].reshape(3,3) if free else cm.cols
        return cm.model(p[:10],P,mask,c)
    L=np.r_[lo,np.zeros(9)] if free else lo; U=np.r_[hi,np.full(9,255)] if free else hi
    base=np.array([700,700,300,300,0.5, 700,900,400,400,0.5])
    base=np.r_[base,cm.cols.ravel()] if free else base
    rng=np.random.default_rng(3);best=None
    for k in range(25):
        p0=np.clip(base*(1+0.2*rng.standard_normal(len(base))*(k>0)),L+1e-3,U-1e-3)
        r=least_squares(lambda p:(m(p,P)-C).ravel(),p0,bounds=(L,U),method='trf',max_nfev=200)
        if best is None or r.cost<best.cost: best=r
    e=np.linalg.norm(m(best.x,P)-C,axis=1)
    print('free' if free else 'official',np.round(best.x,2),'mean',e.mean(),'p90',np.percentile(e,90))
    return best.x
run(False);run(True)
