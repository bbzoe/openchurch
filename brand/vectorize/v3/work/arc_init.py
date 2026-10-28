import json,numpy as np
from sp import spl
from arcmodel import *
fin=json.load(open('final_H2.json'));N=fin['N'];zs=np.r_[np.array(fin['A']).ravel(),fin['th'],fin['hi'],fin['ho']]
o=spl(zs,N,200);n=len(o)
tc=np.array([493.8,174.4]);tR=160.7;cc=np.array([807.1,474.5]);cR=152.9
def ang(p,c): return np.arctan2(p[:,1]-c[1],p[:,0]-c[0])
dt=np.abs(np.hypot(*(o-tc).T)-tR);dc=np.abs(np.hypot(*(o-cc).T)-cR)
# contour is in path order; indices where on circle (<2.0 deviation and within lobe side)
on_t=dt<2.0;on_c=dc<2.0
def runs(mask):
    idx=np.nonzero(mask)[0];
    # largest contiguous run (with wrap)
    best=(0,0);start=None
    m=np.r_[mask,mask]
    cur=0;bs=0
    for i,v in enumerate(m):
        if v:
            if cur==0: s=i
            cur+=1
            if cur>best[1]-best[0] and cur<=n: best=(s,s+cur)
        else: cur=0
    return best
rt=runs(on_t);rc=runs(on_c);print('top run',rt,'cap run',rc,'n',n)
def angs(run,c):
    i0,i1=run[0]%n,(run[1]-1)%n;a0=ang(o[[i0]],c)[0];a1=ang(o[[i1]],c)[0]
    # make a1>a0 (clockwise = increasing)
    a1=a0+((a1-a0)%(2*np.pi));return a0,a1,i0,i1
ta0,ta1,ti0,ti1=angs(rt,tc);ca0,ca1,ci0,ci1=angs(rc,cc)
print('top arc',np.degrees(ta0),np.degrees(ta1),'cap arc',np.degrees(ca0),np.degrees(ca1))
def kinit(i0,i1):
    # connector between contour index i0 (after arc end) and i1 (arc start): choose mid index
    L=(i1-i0)%n;im=(i0+L//2)%n;I=o[im];tan=o[(im+3)%n]-o[(im-3)%n];th=np.arctan2(tan[1],tan[0])
    ch=np.hypot(*(o[im]-o[i0]));return [I[0],I[1],th,ch/3,ch/3,ch/3,ch/3]
k1=kinit(ti1,ci0);k2=kinit(ci1,ti0)
z=np.r_[tc,tR,ta0,ta1,cc,cR,ca0,ca1,k1,k2];np.save('zarc0.npy',z)
print(np.round(z,2))
