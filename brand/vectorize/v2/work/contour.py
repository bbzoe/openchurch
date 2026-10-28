import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure
from alpha import alpha
c,a,keep=alpha((20,30,260,210),(248,250,244))
box=(20,30)
cs=measure.find_contours(ndi.gaussian_filter(a,0.7),0.5)
cs=[k for k in cs if len(k)>100]
print(len(cs),[len(k) for k in cs])
import json
out=[]
for k in cs:
    pts=np.c_[k[:,1]+box[0]+0.5,k[:,0]+box[1]+0.5]  # pixel centre coords -> image coords where pixel i covers [i,i+1]
    out.append(pts.tolist())
json.dump(out,open('contours_light.json','w'))
# curvature
def curv(pts,sig=3):
    # resample uniformly
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]
    n=int(d[-1]/0.5)
    t=np.linspace(0,d[-1],n,endpoint=False)
    x=np.interp(t,d,pts[:,0]);y=np.interp(t,d,pts[:,1])
    xs=ndi.gaussian_filter1d(x,sig/0.5,mode='wrap');ys=ndi.gaussian_filter1d(y,sig/0.5,mode='wrap')
    dx=np.gradient(xs,0.5);dy=np.gradient(ys,0.5);ddx=np.gradient(dx,0.5);ddy=np.gradient(dy,0.5)
    k=(dx*ddy-dy*ddx)/(dx**2+dy**2)**1.5
    return t,xs,ys,k
for i,p in enumerate(out):
    p=np.array(p)
    t,xs,ys,k=curv(p)
    print('contour',i,'len',t[-1],'cx',xs.mean(),'cy',ys.mean(),'orient sum',np.sign(k).sum())
    # print every 4 px
    for j in range(0,len(t),12):
        print(f'{t[j]:6.1f} ({xs[j]:6.1f},{ys[j]:6.1f}) R={1/k[j] if abs(k[j])>1e-3 else 9999:8.1f}')
    print()
