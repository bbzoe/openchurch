import numpy as np, json
from bez import *
C=[np.array(c) for c in json.load(open('contours_light.json'))]
c=np.array([145.37,123.39])
# initial anchors from contour 0 (heaven) read from curvature table
x0=np.r_[203.8,122.2,28.3, 186.0,
         162.3,127.0,-np.pi/2-0.15,  139.4,101.5,-2.5,   # P3, P4 (theta: P3 heading ~up-left, P4 up-left)
         71.0,121.1,  149.5,41.0,  177.4,72.0,  200.0,
         np.full(14,8.0)]
# better theta guesses
x0[6]=-1.75; x0[9]=-2.4
def fit(cont,x0):
    tree=cKDTree(cont)
    def res(x):
        o=outline(x,40)
        d1,_=cKDTree(o).query(cont); d2,_=tree.query(o)
        return np.r_[d1,d2[::2]*0.7]
    r=least_squares(res,x0,method='trf',max_nfev=4000)
    return r
if __name__=='__main__':
    r=fit(C[0],x0)
    print('rms',np.sqrt(np.mean(r.fun**2)),'max',np.abs(r.fun).max())
    np.save('xh.npy',r.x)
    E=2*c-C[1]
    r2=fit(E,r.x); print('earth rms',np.sqrt(np.mean(r2.fun**2)),'max',np.abs(r2.fun).max()); np.save('xe.npy',r2.x)
    print(np.round(r.x,2))
