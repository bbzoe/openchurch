import sys,time,numpy as np
from sp import *
from scipy.optimize import least_squares
H=float(sys.argv[1]);nit=int(sys.argv[2]);tag=sys.argv[3];start=sys.argv[4]
if start=='cons10':
    N=10;z0s=p_to_spline(np.load('p_cons.npy'))
elif start.startswith('spl'):
    N=int(start[3:]);z0s=np.load(f'spl_{N}.npy')
else:
    zz=np.load(start);N=len(zz)//5 if False else int(sys.argv[5]);z0s=zz
SInst.N=N
I={n:SInst(n) for n in NAMES}
R0=np.load('R_ls_2.0_mean.npy')
nz=5*N;z0=np.r_[z0s,R0.ravel()]
Ab={n:(I[n].av>0.5).astype(float) for n in NAMES}
Un={n:(M[n]>0.5).sum() for n in NAMES}
w={n:1/np.sqrt(Un[n]) for n in NAMES}
for n in ('wersja-jasna','wersja-ciemna'): w[n]*=H
w['app-1024']*=0.7
lo=np.full(len(z0),-np.inf);hi=np.full(len(z0),np.inf);lo[3*N:5*N]=1
tau=[0.25,0.15,0.10,0.07,0.05,0.05]
xs=np.r_[np.full(2*N,5.),np.full(N,0.05),np.full(2*N,5.),np.tile([0.003,0.5,0.5],len(NAMES))]
t=time.time()
for it in range(nit):
    tt=tau[min(it,len(tau)-1)]
    def res(z):
        out=[]
        for i,n in enumerate(NAMES):
            c=I[n].cov(z[:nz],z[nz+3*i:nz+3*i+3])
            out.append(w[n]*(1/(1+np.exp(-(c-0.5)/tt))-Ab[n]))
        return np.concatenate(out)
    r=least_squares(res,z0,bounds=(lo,hi),method='trf',x_scale=xs,max_nfev=15,diff_step=1e-4);z0=r.x
    Rd={n:z0[nz+3*i:nz+3*i+3] for i,n in enumerate(NAMES)}
    v={n:raster_iou_s(z0[:nz],N,Rd[n],M[n]) for n in NAMES}
    print(tag,it,'tau',tt,{k[:6]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'%.0fs'%(time.time()-t),flush=True)
    np.save(f'zs_{tag}.npy',z0)
