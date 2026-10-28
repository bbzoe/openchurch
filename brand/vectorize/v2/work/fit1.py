import numpy as np, json
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from arm import *
C=[np.array(c) for c in json.load(open('contours_light.json'))]
names=['RT','R','tx','ty','lx','rx','y0','f1','f2']
def run(cont,x0,fixed={}):
    def res(x):
        P=dict(zip(names,x)); P.update(fixed)
        try: o=outline(P,40)
        except Exception: return np.ones(len(cont)+len(cont)//2)*50
        d1,_=cKDTree(o).query(cont); d2,_=cKDTree(cont).query(o)
        return np.r_[d1,d2[::2]*0.7]
    return least_squares(res,x0,method='lm')
x0=[28.3,28.3,149.5,70,190,203.8,122.2,28,20]
r=run(C[0],x0)
print('heaven',dict(zip(names,np.round(r.x,2))),'rms',np.sqrt(np.mean(r.fun**2)),'max',np.abs(r.fun).max())
c=np.array([145.37,123.39]); E=2*c-C[1]
r2=run(E,r.x)
print('earth(rot)',dict(zip(names,np.round(r2.x,2))),'rms',np.sqrt(np.mean(r2.fun**2)),'max',np.abs(r2.fun).max())
