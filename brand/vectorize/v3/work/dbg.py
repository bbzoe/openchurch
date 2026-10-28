from sp import *
from scipy.optimize import minimize
N=12;z=np.load('spl_12.npy');SInst.N=N
I={n:SInst(n) for n in NAMES}
R0=np.load('R_ls_2.0_mean.npy')
for i,n in enumerate(NAMES[:3]+['mono']):
    j=NAMES.index(n)
    f=lambda r:-raster_iou_s(z,N,r,M[n])
    r=minimize(f,R0[j],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=500))
    reg=r.x;c=I[n].cov(z,reg);A=I[n].av>0.5
    xor_band=((c>0.5)!=A).sum();U=(M[n]>0.5).sum()
    print(n,'raster IoU',round(-r.fun,4),'band xor',xor_band,'band-based IoU',round(1-xor_band/U,4),'reg',reg.round(4))
