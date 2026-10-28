import numpy as np
from colmodel_h import *
P,C=pixels('light','heaven',erode=3,step=2)
lo=np.array([-300,-300,100,100,0.3, 300,200,500,200,0.0,0.05, 0,0.0,0.05,0.1])
hi=np.array([960,960,1300,1300,0.9, 960,960,1200,960,0.9,1.0, 0.5,1.0,1.0,1.5])
base=np.array([400,60, 640,420,0.62, 520,450,700,450,0.28,0.45, 0.12,0.2,0.28,0.4])
rng=np.random.default_rng(1);best=None
for k in range(40):
    p0=np.clip(base*(1+0.2*rng.standard_normal(15)*(k>0)),lo+1e-3,hi-1e-3)
    r=least_squares(lambda p:(model(p,P)-C).ravel(),p0,bounds=(lo,hi),method='trf',max_nfev=200)
    if best is None or r.cost<best.cost: best=r
e=np.linalg.norm(model(best.x,P)-C,axis=1)
print(np.round(best.x,3));print('mean',e.mean(),'p90',np.percentile(e,90))
np.save('ph.npy',best.x)
