import numpy as np, json, sys, time
from scipy.optimize import least_squares
from scipy import ndimage as ndi
from common import *
M=masks()
class Inst:
    def __init__(s,name,band=6):
        s.name=name;a=M[name];s.a=a;H,W=a.shape;s.shape=a.shape
        inner=ndi.binary_erosion(a>0.9,iterations=band);outer=ndi.binary_dilation(a>0.1,iterations=band)
        sel=outer&~inner
        ys,xs=np.nonzero(sel);s.G=np.c_[xs+0.5,ys+0.5];s.av=a[ys,xs]
    def cov(s,p,reg,Op_cache=None):
        sc,tx,ty=reg[:3];sy=reg[3] if len(reg)>3 else sc;SC=np.array([sc,sy])
        o,o2=both(p,18)
        O=np.vstack([o,o2]);Op=(O-480)*SC+np.array([tx,ty])
        d,_=cKDTree(Op).query(s.G)
        ins=np.zeros(len(s.G),bool)
        for q in (o,o2): ins|=MPath((q-480)*SC+np.array([tx,ty])).contains_points(s.G)
        sd=np.where(ins,-d,d)
        return np.clip(0.5-sd,0,1)
    def res(s,p,reg): return s.cov(p,reg)-s.av
def poly_area(q): x,y=q[:,0],q[:,1];return 0.5*abs(np.dot(x,np.roll(y,-1))-np.dot(y,np.roll(x,-1)))
def init_regs(p):
    o,o2=both(p,18);A=poly_area(o)+poly_area(o2);R={}
    for n in NAMES:
        a=M[n]>0.5;ys,xs=np.nonzero(a)
        R[n]=np.array([np.sqrt(a.sum()/A),xs.mean()+0.5,ys.mean()+0.5])
    return R
def fit_regs(p,R,I):
    for n in NAMES:
        r=least_squares(lambda r:I[n].res(p,r),R[n],method='lm',x_scale=[0.01,1,1])
        R[n]=r.x
    return R
def ious(p,R):
    return {n:raster_iou(p,R[n],M[n]) for n in NAMES}
if __name__=='__main__':
    p=np.load('p_cons.npy');I={n:Inst(n) for n in NAMES}
    R=init_regs(p);R=fit_regs(p,R,I)
    for n in NAMES: print(n,np.round(R[n],4),round(raster_iou(p,R[n],M[n]),4))
    np.save('R0.npy',np.array([R[n] for n in NAMES]))
