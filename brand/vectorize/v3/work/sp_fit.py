import sys,time,numpy as np
from sp import *
from scipy.optimize import least_squares
H=float(sys.argv[1]);nit=int(sys.argv[2]);tag=sys.argv[3]
N=10
I={n:SInst(n) for n in NAMES}
p0=np.load('p_ls_2.0_mean.npy');R0=np.load('R_ls_2.0_mean.npy')
z0=np.r_[p_to_spline(p0),R0.ravel()];nz=5*N
w={n:1/np.sqrt(len(I[n].G)) for n in NAMES}
for n in ('wersja-jasna','wersja-ciemna'): w[n]*=H
w['app-1024']*=0.7
lo=np.full(len(z0),-np.inf);hi=np.full(len(z0),np.inf);lo[3*N:5*N]=1
def res(z):
    return np.concatenate([w[n]*I[n].res(z[:nz],z[nz+3*i:nz+3*i+3]) for i,n in enumerate(NAMES)])
xs=np.r_[np.full(2*N,5.),np.full(N,0.05),np.full(2*N,5.),np.tile([0.003,0.5,0.5],len(NAMES))]
t=time.time()
for it in range(nit):
    r=least_squares(res,z0,bounds=(lo,hi),method='trf',x_scale=xs,max_nfev=15,diff_step=1e-4);z0=r.x
    Rd={n:z0[nz+3*i:nz+3*i+3] for i,n in enumerate(NAMES)}
    v={n:raster_iou_s(z0[:nz],N,Rd[n],M[n]) for n in NAMES}
    print(tag,it,{k[:6]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'%.0fs'%(time.time()-t),flush=True)
    np.save(f'zs_{tag}.npy',z0)
