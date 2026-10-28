import sys,time,json,numpy as np
from scipy import ndimage
from scipy.optimize import least_squares,minimize
from common import *
import arcmodel as am
H=float(sys.argv[1]);tag=sys.argv[2];nrounds=int(sys.argv[3])
z=np.load(sys.argv[4]) if len(sys.argv)>4 else np.load('zarc0.npy')
wt={n:1.0 for n in NAMES};wt['app-1024']=0.5;wt['wersja-jasna']=H;wt['wersja-ciemna']=H
GR=960;gy,gx=np.mgrid[0:GR,0:GR];VB=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
import cv2
def raster_master(z,S=4):
    o=am.outline(z,40);m=np.zeros((GR*S,GR*S),np.uint8)
    for q in (o,960-o): cv2.fillPoly(m,[np.round(q*S*16).astype(np.int32)],1,shift=4)
    return m.reshape(GR,S,GR,S).mean((1,3))
def iou_inst(master,reg,mask):
    s,tx,ty=reg;Hh,W=mask.shape;yy,xx=np.mgrid[0:Hh,0:W]
    vx=(xx+0.5-tx)/s+480;vy=(yy+0.5-ty)/s+480
    pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
    a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
def register_all(z,regs):
    master=raster_master(z);out={}
    for n in NAMES:
        r=minimize(lambda r:-iou_inst(master,r,M[n]),regs[n],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=400));out[n]=r.x
    return out
def field(regs):
    F=np.zeros((GR,GR));ws=0
    for n in NAMES:
        s,tx,ty=regs[n];px=(gx+0.5-480)*s+tx-0.5;py=(gy+0.5-480)*s+ty-0.5
        F+=wt[n]*ndimage.map_coordinates(M[n],[py,px],order=1,cval=0);ws+=wt[n]
    F/=ws;return (F+F[::-1,::-1])/2
fin=json.load(open('final_H2.json'));regs={n:np.array(fin['regs'][n]) for n in NAMES}
t=time.time()
for rd in range(nrounds):
    regs=register_all(z,regs);F=field(regs)
    band=ndimage.binary_dilation((F>0.03)&(F<0.97),iterations=4)
    idx=np.nonzero(band.ravel())[0];P=VB[idx];tgt=(F.ravel()[idx]>0.5).astype(float)
    lo=np.full(24,-np.inf);hi=np.full(24,np.inf);lo[2]=100;lo[7]=100;lo[[13,14,15,16,20,21,22,23]]=1;hi[2]=250;hi[7]=250
    def res(zz):
        o=am.outline(zz,16);o2=960-o;O=np.vstack([o,o2]);d,_=cKDTree(O).query(P)
        ins=MPath(o).contains_points(P)|MPath(o2).contains_points(P)
        sd=np.where(ins,-d,d);cov=np.clip(0.5-sd,0,1);return 1/(1+np.exp(-(cov-0.5)/0.12))-tgt
    xs=np.r_[5,5,5,0.05,0.05,5,5,5,0.05,0.05,5,5,0.05,5,5,5,5,5,5,0.05,5,5,5,5]
    r=least_squares(res,z,bounds=(lo,hi),method='trf',x_scale=xs,max_nfev=30,diff_step=1e-4);z=r.x
    regs=register_all(z,regs);master=raster_master(z)
    v={n:iou_inst(master,regs[n],M[n]) for n in NAMES}
    print(tag,rd,{k[:8]:round(x,4) for k,x in v.items()},'mean',round(np.mean(list(v.values())),4),'%.0fs'%(time.time()-t),flush=True)
    np.save(f'zarc_{tag}.npy',z);json.dump({n:regs[n].tolist() for n in NAMES},open(f'Rarc_{tag}.json','w'))
