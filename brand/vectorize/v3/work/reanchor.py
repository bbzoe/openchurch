import sys,numpy as np
from sp import *
tag=sys.argv[1];Nin=int(sys.argv[2])
z=np.load(f'zf_{tag}.npy')[:5*Nin]
o=spl(z,Nin,60)
# anchor targets from p_cons (meaningful structure): P9,T0,Rt,B0,P2,P3,P4,P5,P6,P7
p=np.load('p_cons.npy')
tg=np.array([p[0:2],p[2:4],p[4:6],p[6:8],p[8:10],p[10:12],p[13:15],p[16:18],p[18:20],p[20:22]])
# snap to nearest contour point
idx=[int(np.argmin(np.hypot(*(o-t).T))) for t in tg]
print(idx)
A=o[idx];n=len(o)
tan=np.array([o[(i+4)%n]-o[(i-4)%n] for i in idx]);th=np.arctan2(tan[:,1],tan[:,0])
N=10
ho=np.zeros(N);hi=np.zeros(N)
for k in range(N):
    j=(k+1)%N;ch=np.hypot(*(A[j]-A[k]));ho[k]=ch/3;hi[j]=ch/3
z10=np.r_[A.ravel(),th,hi,ho]
np.save(f'z10_{tag}.npy',z10)
