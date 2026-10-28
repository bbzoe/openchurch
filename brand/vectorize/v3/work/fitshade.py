import numpy as np, json, sys
from scipy.optimize import least_squares
from common import *
from shade import *
def arm_pixels(inst,p,reg,arm,erode_px=2.0):
    x0,y0,w,h=INSTANCES[inst];s,tx,ty=reg[:3]
    gy,gx=np.mgrid[0:h,0:w];G=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
    o,o2=both(p,24);poly=o if arm=='heaven' else o2
    Pp=(poly-480)*s+np.array([tx,ty])
    ins=MPath(Pp).contains_points(G)
    d,_=cKDTree(dense(Pp,0.3)).query(G)
    sel=ins&(d>erode_px)
    vb=(G[sel]-np.array([tx,ty]))/s+480
    col=board[y0:y0+h,x0:x0+w].reshape(-1,3)[sel]
    return vb,col,G[sel]
def fit_model(Model,P,C,th0,restarts=12,seed=0,nfev=300,sub=None):
    lo,hi=Model.bounds()
    if sub is not None and len(P)>sub:
        idx=np.random.default_rng(1).choice(len(P),sub,replace=False);P=P[idx];C=C[idx]
    f=lambda th:np.r_[(Model.color(P,th)-C).ravel(),Model.extra(th)*30]
    rng=np.random.default_rng(seed);best=None
    for k in range(restarts):
        t0=np.clip(th0*(1+0.12*rng.standard_normal(len(th0))*(k>0)) if k else th0.copy(),lo+1e-6,hi-1e-6)
        try: r=least_squares(f,t0,bounds=(lo,hi),method='trf',max_nfev=nfev,x_scale=np.maximum(np.abs(th0),1.0)*0.1)
        except Exception as e: print('fail',e);continue
        if best is None or r.cost<best.cost: best=r
    e=np.linalg.norm(Model.color(P,best.x)-C,axis=1)
    return best.x,e.mean(),np.percentile(e,90)
