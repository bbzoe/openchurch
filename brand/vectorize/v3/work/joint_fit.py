import numpy as np, sys, time
from joint import *
def joint(p0,R0,I,w,nfev=40,free_p=None):
    R0=np.array([R0[n] for n in NAMES]) if isinstance(R0,dict) else R0
    z0=np.r_[p0,R0.ravel()]
    lo=np.full(len(z0),-np.inf);hi=np.full(len(z0),np.inf);lo[22:38]=1
    def unpack(z):
        return z[:NP],{n:z[NP+3*i:NP+3*i+3] for i,n in enumerate(NAMES)}
    def res(z):
        p,R=unpack(z)
        return np.concatenate([w[n]*I[n].res(p,R[n]) for n in NAMES])
    xs=np.r_[np.full(NP,1.0),np.tile([0.003,0.5,0.5],len(NAMES))]
    r=least_squares(res,z0,bounds=(lo,hi),method='trf',x_scale=xs,max_nfev=nfev,diff_step=1e-4)
    return unpack(r.x)
def report(p,R,tag=''):
    v=ious(p,R);print(tag,{k[:6]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'heroes',round(v['wersja-jasna'],4),round(v['wersja-ciemna'],4),'small min',round(min(v[n] for n in NAMES[2:]),4))
    return v
if __name__=='__main__':
    p=np.load('p_cons.npy');R0=np.load('R0.npy');I={n:Inst(n) for n in NAMES}
    Rd={n:R0[i] for i,n in enumerate(NAMES)}
    report(p,Rd,'start')
    w={n:Rd[n][0]**-1.5 for n in NAMES}
    # normalise so mean weight 1 at s of small
    m=np.mean(list(w.values()));w={k:v/m for k,v in w.items()}
    t=time.time()
    for it in range(3):
        p,Rd=joint(p,Rd,I,w,nfev=15)
        report(p,Rd,'it%d'%it);print(time.time()-t)
    np.save('p_joint.npy',p);np.save('R_joint.npy',np.array([Rd[n] for n in NAMES]))
