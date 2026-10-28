import numpy as np, cv2
from bez import *
from alpha import alpha
c=np.array([145.37,123.39])
xh=np.load('xh.npy');xe=np.load('xe.npy')
def render(polys,A,box,S=4):
    H,W=A.shape
    m=np.zeros((H*S,W*S),np.uint8)
    for poly in polys:
        pp=np.round((poly-np.array(box))*S*16).astype(np.int32)
        cv2.fillPoly(m,[pp],1,shift=4)
    return m>0
c_,A,keep=alpha((20,30,260,210),(248,250,244))
S=4;H,W=A.shape
ref=cv2.resize(A,(W*S,H*S),interpolation=cv2.INTER_CUBIC)>0.5
def iou(m): return (m&ref).sum()/(m|ref).sum()
oh=outline(xh,80);oe=outline(xe,80)
print('independent',iou(render([oh,2*c-oe],A,(20,30))))
xm=(xh+xe)/2
om=outline(xm,80)
print('symmetric avg',iou(render([om,2*c-om],A,(20,30))))
z=np.load('xj.npy');nx=len(xh);xj=z[:nx];cj=z[nx:]
oj=outline(xj,80)
print('joint',iou(render([oj,2*cj-oj],A,(20,30))))
allp=np.vstack([oj,2*cj-oj]);print('bbox',allp.min(0),allp.max(0),np.ptp(allp,axis=0))
