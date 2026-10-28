import numpy as np, json
import colmodel_h as H_
import colmodel_e as E_
from colfit import *
out={}
# ---------- heaven
P,C=pixels('dark','heaven',erode=3,step=2)
offc=H_.cols.copy()
loH=np.array([-300,-300,100,100,0.3, 300,200,500,200,0.0,0.05, 0,0.0,0.05,0.1]);hiH=np.array([960,960,1300,1300,0.9, 960,960,1200,960,0.9,1.0, 0.5,1.0,1.0,1.5])
seedH=np.array([465.7,161.3,725.2,513.1,0.83, 534.3,477.4,736.9,508.8,0.042,1.0, 0.105,0.116,0.518,1.46])
def fitH(free,seed_colors=None):
    def m(p,P):
        H_.cols=p[15:24].reshape(3,3) if free else offc
        return H_.model(p[:15],P)
    L=np.r_[loH,np.zeros(9)] if free else loH;U=np.r_[hiH,np.full(9,255)] if free else hiH
    base=np.r_[seedH,[2,107,72,2,212,106,107,239,168]] if free else seedH
    rng=np.random.default_rng(5);best=None
    for k in range(40):
        p0=np.clip(base*(1+0.15*rng.standard_normal(len(base))*(k>0)),L+1e-3,U-1e-3)
        r=least_squares(lambda p:(m(p,P)-C).ravel(),p0,bounds=(L,U),method='trf',max_nfev=250)
        if best is None or r.cost<best.cost: best=r
    e=np.linalg.norm(m(best.x,P)-C,axis=1);print('heaven','free' if free else 'official','mean',e.mean())
    H_.cols=offc
    return best.x
pass
out['heaven_free']=fitH(True).tolist()
# ---------- earth
P,C=pixels('dark','earth',erode=3,step=2);mask=E_.overlay_mask(P)
offe=E_.cols.copy()
loE=np.array([-600,-600,-600,-600,0.2, -600,-600,-600,-600,0.2]);hiE=np.array([1600,1600,1600,1600,0.9]*2)
def fitE(free):
    def m(p,P):
        c=p[10:19].reshape(3,3) if free else offe
        return E_.model(p[:10],P,mask,c)
    L=np.r_[loE,np.zeros(9)] if free else loE;U=np.r_[hiE,np.full(9,255)] if free else hiE
    seed=np.array([346.9,359.3,88,203.8,0.83, 472.8,1158.7,27.2,712.1,0.9])
    base=np.r_[seed,[1,47.5,35.8,2,102,71.3,3.6,0,0]] if free else seed
    rng=np.random.default_rng(6);best=None
    for k in range(40):
        p0=np.clip(base*(1+0.15*rng.standard_normal(len(base))*(k>0)),L+1e-3,U-1e-3)
        r=least_squares(lambda p:(m(p,P)-C).ravel(),p0,bounds=(L,U),method='trf',max_nfev=250)
        if best is None or r.cost<best.cost: best=r
    e=np.linalg.norm(m(best.x,P)-C,axis=1);print('earth','free' if free else 'official','mean',e.mean())
    return best.x
pass
out['earth_free']=fitE(True).tolist()
json.dump(out,open('colparams_dark.json','w'),indent=1)
