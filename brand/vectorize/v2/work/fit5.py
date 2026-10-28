import numpy as np, json
from bez import *
C=[np.array(c) for c in json.load(open('contours_light.json'))]
xh=np.load('xh.npy');xe=np.load('xe.npy')
x0=np.r_[(xh+xe)/2,145.37,123.39]
nx=len(xh)
def fit(x0,fixR=None):
    def res(z):
        x=z[:nx].copy(); c=z[nx:nx+2]
        if fixR is not None: x[2]=fixR
        o=outline(x,40)
        E=2*c-C[1]
        pts=np.vstack([C[0],E]);
        d1,_=cKDTree(o).query(pts); d2,_=cKDTree(pts).query(o)
        return np.r_[d1,d2[::2]*0.7]
    r=least_squares(res,x0,method='trf',max_nfev=3000)
    return r
r=fit(x0)
print('rms',np.sqrt(np.mean(r.fun**2)),'max',np.abs(r.fun).max(),'c',r.x[nx:])
np.save('xj.npy',r.x)
print('R',r.x[2])
