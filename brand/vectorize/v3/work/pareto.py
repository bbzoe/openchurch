import sys, numpy as np, time
from iou_fit import *
h=float(sys.argv[1]);start=sys.argv[2]
z0=np.load('z_mean.npy');p0,R0=split(z0)
if start!='mean':
    pp=np.load(f'p_single_{start}.npy')
    p0=pp[:NP]
z=np.r_[p0,np.array([R0[n] for n in NAMES]).ravel()]
I={n:IInst(n) for n in NAMES}
wt={n:1.0 for n in NAMES};wt['app-1024']=0.5;wt['wersja-jasna']=h;wt['wersja-ciemna']=h
for it in range(3):
    z,r=optimise(z,I,wt,maxiter=40)
    pp,RR=split(z);v=report(pp,RR,'h=%s start=%s it%d f=%.5f'%(h,start,it,r.fun),)
    np.save(f'z_h{h}_{start}.npy',z)
