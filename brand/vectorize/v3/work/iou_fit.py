import numpy as np, sys, time, json
from scipy.optimize import minimize
from joint import *
from joint_fit import report
class IInst(Inst):
    def __init__(s,name,band=6):
        super().__init__(name,band)
        a=s.a;s.n_in=ndi.binary_erosion(a>0.9,iterations=band).sum()
    def siou(s,p,reg):
        c=s.cov(p,reg);return (s.n_in+np.minimum(c,s.av).sum())/(s.n_in+np.maximum(c,s.av).sum())
def make_obj(I,wt):
    def obj(z):
        p=z[:NP]
        if (p[22:38]<1).any(): return 10.0
        tot=0
        for i,n in enumerate(NAMES):
            tot+=wt[n]*(1-I[n].siou(p,z[NP+3*i:NP+3*i+3]))
        return tot/sum(wt.values())
    return obj
def optimise(z0,I,wt,maxiter=60):
    obj=make_obj(I,wt)
    sc=np.r_[np.full(NP,1.0),np.tile([0.002,0.3,0.3],len(NAMES))]  # variable scaling via reparam
    f=lambda u:obj(z0+u*sc)
    r=minimize(f,np.zeros(len(z0)),method='L-BFGS-B',options=dict(maxiter=maxiter,maxfun=100000,eps=1e-2,ftol=1e-10,gtol=1e-9))
    return z0+r.x*sc,r
def split(z): return z[:NP],{n:z[NP+3*i:NP+3*i+3] for i,n in enumerate(NAMES)}
if __name__=='__main__':
    p=np.load('p_cons.npy');R0=np.load('R0.npy')
    I={n:IInst(n) for n in NAMES}
    z=np.r_[p,R0.ravel()]
    wt={n:1.0 for n in NAMES}
    t=time.time()
    for it in range(4):
        z,r=optimise(z,I,wt,maxiter=40)
        pp,RR=split(z);report(pp,RR,'it%d f=%.5f'%(it,r.fun));print(time.time()-t,flush=True)
        np.save('z_mean.npy',z)
