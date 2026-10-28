import numpy as np, cv2, json, sys
from scipy import ndimage as ndi
from scipy.optimize import minimize
from alpha import alpha
from bez import outline
def vb_polys(x,c,s):
    o=outline(x,80); o2=2*c-o
    f=lambda p:(p-c)*s+480
    return [f(o),f(o2)]
def ref_mask(box,bg,S=4,close=0):
    c_,A,keep=alpha(box,bg)
    H,W=A.shape
    R=cv2.resize(A,(W*S,H*S),interpolation=cv2.INTER_CUBIC)>0.5
    if close:
        k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*close*S+1,2*close*S+1))
        R=cv2.morphologyEx(R.astype(np.uint8),cv2.MORPH_CLOSE,k)>0
    R=ndi.binary_fill_holes(R)
    return R,(H,W)
def raster(polys,a,t,box,shape,S=4):
    H,W=shape
    m=np.zeros((H*S,W*S),np.uint8)
    for p in polys:
        q=(a*(p-480)+t-np.array(box[:2]))*S
        cv2.fillPoly(m,[np.round(q*16).astype(np.int32)],1,shift=4)
    return m>0
def register(polys,box,bg,close=0,a0=None,t0=None):
    R,shape=ref_mask(box,bg,close=close)
    def neg(p):
        m=raster(polys,p[0],p[1:3],box,shape)
        return -(m&R).sum()/(m|R).sum()
    best=None
    r=minimize(neg,[a0,*t0],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,initial_simplex=None,maxiter=400))
    return r.x,-r.fun
if __name__=='__main__':
    z=np.load('xj.npy');x=z[:31];c=z[31:]
    s=json.load(open('geo_raw.json'))['meta']['scale']
    polys=vb_polys(x,c,s)
    out={}
    for name,box,bg,close,t0 in [('light',(20,30,260,210),(248,250,244),0,(145.84,123.62)),('dark',(520,30,780,210),(1,27,18),5,(646.9,123.6))]:
        p,iou=register(polys,box,bg,close,1/s,t0)
        print(name,'scale a=%.5f (ref px per vb unit; 1/a=%.4f)'%(p[0],1/p[0]),'t=',np.round(p[1:],3),'IoU=%.4f'%iou)
        out[name]=dict(a=p[0],t=p[1:].tolist(),iou=iou)
    json.dump(out,open('reg.json','w'))
