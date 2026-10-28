import sys,numpy as np
from sp import *
tag=sys.argv[1];Nin=int(sys.argv[2]);mode=sys.argv[3]
z=np.load(f'zf_{tag}.npy')[:5*Nin]
o=spl(z,Nin,80);n=len(o)
p=np.load('p_cons.npy')
T0,Rt,B0,P3,P4,P5,P6,P7=p[2:4],p[4:6],p[6:8],p[10:12],p[13:15],p[16:18],p[18:20],p[20:22]
tg=[T0,Rt,B0,P3,P4,P5,P6,P7]
idx=[int(np.argmin(np.hypot(*(o-t).T))) for t in tg]
if mode=='10':
    # add mid anchors between B0..P3 and P7..T0 (wrapping)
    def mid(a,b): return (a+(b-a)%n//2)%n
    idx=[idx[0],idx[1],idx[2],mid(idx[2],idx[3]),idx[3],idx[4],idx[5],idx[6],idx[7],mid(idx[7],idx[0])]
    # reorder to path order starting at T0: T0,Rt,B0,mid,P3,P4,P5,P6,P7,mid2
if mode=='12':
    def mid(a,b): return (a+(b-a)%n//2)%n
    T,R_,B,P3_,P4_,P5_,P6_,P7_=idx
    idx=[T,R_,B,mid(B,P3_),P3_,mid(P3_,P4_),P4_,mid(P4_,P5_),P5_,P6_,P7_,mid(P7_,T)]
print(idx)
A=o[idx];N=len(idx)
tan=np.array([o[(i+4)%n]-o[(i-4)%n] for i in idx]);th=np.arctan2(tan[:,1],tan[:,0])
ho=np.zeros(N);hi=np.zeros(N)
for k in range(N):
    j=(k+1)%N;ch=np.hypot(*(A[j]-A[k]));ho[k]=ch/3;hi[j]=ch/3
np.save(f'z{N}_{tag}.npy',np.r_[A.ravel(),th,hi,ho])
