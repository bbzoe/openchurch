import numpy as np, time
from iou_fit import *
from scipy.optimize import least_squares
# per-instance: anisotropic registration only, shape fixed = z_mean's p
z=np.load('z_mean.npy');p,R=split(z)
I={n:IInst(n) for n in NAMES}
out={}
for n in NAMES:
    r0=np.r_[R[n],R[n][0]]
    f=lambda r:I[n].res(p,r)
    r=least_squares(f,r0,method='lm',x_scale=[0.01,1,1,0.01])
    out[n]=r.x
    print(n,'uniform IoU',round(raster_iou(p,R[n],M[n]),4),'aniso',round(raster_iou(p,r.x,M[n]),4),'sx/sy',round(r.x[0]/r.x[3],4))
