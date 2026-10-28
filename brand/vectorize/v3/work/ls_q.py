import sys,numpy as np,time
from joint import *
from scipy.optimize import least_squares
H=float(sys.argv[1]);nit=int(sys.argv[2]);startp=sys.argv[3];startR=sys.argv[4];tag=sys.argv[5]
I={n:Inst(n) for n in NAMES}
p0=np.load(startp);R0=np.load(startR)
cx,cy,R=808.3,475.4,152.9
q0=p_to_q(p0);q0[0:3]=[cx,cy,R]
w={n:1/np.sqrt(len(I[n].G)) for n in NAMES}
for n in ('wersja-jasna','wersja-ciemna'): w[n]*=H
w['app-1024']*=0.7
z0=np.r_[q0,R0.ravel()]
lo=np.full(len(z0),-np.inf);hi=np.full(len(z0),np.inf);lo[17:29]=1;lo[2]=100
def res(z):
    p=q_to_p(z[:NQ]);return np.concatenate([w[n]*I[n].res(p,z[NQ+3*i:NQ+3*i+3]) for i,n in enumerate(NAMES)])
xs=np.r_[np.ones(NQ),np.tile([0.003,0.5,0.5],len(NAMES))]
t=time.time()
for it in range(nit):
    r=least_squares(res,z0,bounds=(lo,hi),method='trf',x_scale=xs,max_nfev=12,diff_step=1e-4);z0=r.x
    p=q_to_p(z0[:NQ]);Rd={n:z0[NQ+3*i:NQ+3*i+3] for i,n in enumerate(NAMES)}
    v=ious(p,Rd);print(tag,it,{k[:6]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'%.0fs'%(time.time()-t),flush=True)
    np.save(f'z_q_{tag}.npy',z0)
