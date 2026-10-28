import sys,time,json,numpy as np,subprocess
from scipy import ndimage
from scipy.optimize import least_squares,minimize
from sp import *
H=float(sys.argv[1]);tag=sys.argv[2];start=sys.argv[3];Nn=int(sys.argv[4]);nrounds=int(sys.argv[5]) if len(sys.argv)>5 else 4
N=Nn
if start=='cons10': z=p_to_spline(np.load('p_cons.npy'))
else: z=np.load(start)
wt={n:1.0 for n in NAMES};wt['app-1024']=0.5;wt['wersja-jasna']=H;wt['wersja-ciemna']=H
GR=960
gy,gx=np.mgrid[0:GR,0:GR];VB=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
def raster_master(z,S=1):
    import cv2
    m=np.zeros((GR*S,GR*S),np.uint8)
    for q in both_s(z,N,40):
        cv2.fillPoly(m,[np.round(q*S*16).astype(np.int32)],1,shift=4)
    return m.reshape(GR,S,GR,S).mean((1,3)) if S>1 else m.astype(float)
def iou_inst(master,reg,mask):
    s,tx,ty=reg;Hh,W=mask.shape;yy,xx=np.mgrid[0:Hh,0:W]
    vx=(xx+0.5-tx)/s+480;vy=(yy+0.5-ty)/s+480
    pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
    a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
def register_all(z,regs):
    master=raster_master(z,4)
    out={}
    for n in NAMES:
        f=lambda r:-iou_inst(master,r,M[n])
        r=minimize(f,regs[n],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=400))
        out[n]=r.x
    return out
def field(regs):
    F=np.zeros((GR,GR));ws=0
    for n in NAMES:
        s,tx,ty=regs[n];px=(gx+0.5-480)*s+tx-0.5;py=(gy+0.5-480)*s+ty-0.5
        F+=wt[n]*ndimage.map_coordinates(M[n],[py,px],order=1,cval=0);ws+=wt[n]
    F/=ws;return (F+F[::-1,::-1])/2
R0=np.load('R_ls_2.0_mean.npy');regs={n:R0[i] for i,n in enumerate(NAMES)}
t=time.time()
nz=5*N
for rd in range(nrounds):
    regs=register_all(z,regs)
    F=field(regs)
    band=ndimage.binary_dilation((F>0.03)&(F<0.97),iterations=4)
    idx=np.nonzero(band.ravel())[0];P=VB[idx];Fb=F.ravel()[idx];tgt=(Fb>0.5).astype(float)
    # exclude the redundant half? keep both arms (rotation sym built in)
    lo=np.full(nz,-np.inf);hi=np.full(nz,np.inf);lo[3*N:5*N]=1
    def res(zz):
        o,o2=both_s(zz,N,16)
        O=np.vstack([o,o2]);d,_=cKDTree(O).query(P);ins=MPath(o).contains_points(P)|MPath(o2).contains_points(P)
        sd=np.where(ins,-d,d);cov=np.clip(0.5-sd,0,1)
        return 1/(1+np.exp(-(cov-0.5)/0.12))-tgt
    r=least_squares(res,z,bounds=(lo,hi),method='trf',x_scale=np.r_[np.full(2*N,5.),np.full(N,0.05),np.full(2*N,5.)],max_nfev=25,diff_step=1e-4)
    z=r.x
    regs=register_all(z,regs)
    master=raster_master(z,4)
    v={n:iou_inst(master,regs[n],M[n]) for n in NAMES}
    print(tag,rd,{k[:8]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'%.0fs'%(time.time()-t),flush=True)
np.save(f'zf_{tag}.npy',z);np.save(f'Rf_{tag}.npy',np.array([regs[n] for n in NAMES]))
