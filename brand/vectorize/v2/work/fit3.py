import numpy as np, json, cv2
from fit2 import *
c=np.array([145.37,123.39])
x0=[29.5,29,149.3,71.5,190.6,202.5,122.2,32,17]
def fit_one(cont,x0):
    tree=cKDTree(cont)
    def res(x):
        P=dict(zip(names,x))
        try: o=outline(P,40)
        except Exception: return np.ones(len(cont)*2)*50
        d1,_=cKDTree(o).query(cont); d2,_=tree.query(o)
        return np.r_[d1,d2[::2]*0.7]
    return least_squares(res,x0,method='lm')
rh=fit_one(C[0],x0); Ph=dict(zip(names,rh.x))
E=2*c-C[1]; re=fit_one(E,x0); Pe=dict(zip(names,re.x))
print('H',{k:round(v,2) for k,v in Ph.items()},np.sqrt(np.mean(rh.fun**2)))
print('E',{k:round(v,2) for k,v in Pe.items()},np.sqrt(np.mean(re.fun**2)))
c_,A,keep=alpha((20,30,260,210),(248,250,244))
S=4;H,W=A.shape
m=np.zeros((H*S,W*S),np.uint8)
for poly in (outline(Ph,80),2*c-outline(Pe,80)):
    pp=np.round((poly-np.array((20,30)))*S*16).astype(np.int32)
    cv2.fillPoly(m,[pp],1,shift=4)
ref=cv2.resize(A,(W*S,H*S),interpolation=cv2.INTER_CUBIC)>0.5
m=m>0;print('IoU indep',(m&ref).sum()/(m|ref).sum())
