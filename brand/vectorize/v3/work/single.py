import numpy as np
from iou_fit import *
from joint_fit import joint
z=np.load('z_mean.npy');p0,R0=split(z)
I={n:IInst(n) for n in NAMES}
P={}
for n in NAMES:
    w={m:0.0 for m in NAMES};w[n]=1.0
    # least squares on this instance only
    def res(zz): return I[n].res(zz[:NP],zz[NP:])
    lo=np.full(NP+3,-np.inf);lo[22:38]=1
    r=least_squares(res,np.r_[p0,R0[n]],bounds=(lo,np.full(NP+3,np.inf)),method='trf',x_scale=np.r_[np.ones(NP),0.003,0.5,0.5],max_nfev=40,diff_step=1e-4)
    P[n]=r.x[:NP];np.save(f'p_single_{n}.npy',r.x)
    print(n,'single-fit IoU',round(raster_iou(r.x[:NP],r.x[NP:],M[n]),4),flush=True)
# cross matrix
print('cross (rows=shape from, cols=evaluated on, regs refit)')
for a in NAMES:
    row=[]
    for b in NAMES:
        r=least_squares(lambda rr:I[b].res(P[a],rr),R0[b],method='lm',x_scale=[0.01,1,1])
        row.append(raster_iou(P[a],r.x,M[b]))
    print(a[:8].ljust(9),' '.join('%.3f'%v for v in row))
