import numpy as np
import colmodel_h as cm
from colmodel_h import *
P,C=pixels('light','heaven',erode=3,step=2)
def model2(q,P):
    cm.cols=np.array(q[15:24]).reshape(3,3)
    return cm.model(q[:15],P)
lo=np.r_[[-300,-300,100,100,0.3, 300,200,500,200,0.0,0.05, 0,0.0,0.05,0.1],np.zeros(9)]
hi=np.r_[[960,960,1300,1300,0.9, 960,960,1200,960,0.9,1.0, 0.5,1.0,1.0,1.5],np.full(9,255)]
base=np.r_[[400,60, 640,420,0.62, 520,450,700,450,0.28,0.45, 0.12,0.2,0.28,0.4],cm.cols.ravel()]
rng=np.random.default_rng(2);best=None
for k in range(15):
    p0=np.clip(base*(1+0.15*rng.standard_normal(24)*(k>0)),lo+1e-3,hi-1e-3)
    r=least_squares(lambda p:(model2(p,P)-C).ravel(),p0,bounds=(lo,hi),method='trf',max_nfev=200)
    if best is None or r.cost<best.cost: best=r
e=np.linalg.norm(model2(best.x,P)-C,axis=1)
print(np.round(best.x[:15],3));print(np.round(best.x[15:].reshape(3,3)));print('mean',e.mean(),'p90',np.percentile(e,90))
