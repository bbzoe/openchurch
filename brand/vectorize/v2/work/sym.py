import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from alpha import alpha
from scipy.optimize import minimize
for name,box,bg in [('light',(20,30,260,210),(248,250,244)),('dark',(520,30,780,210),(1,27,18))]:
    c,a,keep=alpha(box,bg)
    S=4
    A=ndi.zoom(a,S,order=3); A=np.clip(A,0,1)
    M=A>0.5
    # union rotation about center (cx,cy) in upscaled coords
    def iou(p):
        cx,cy=p
        yy,xx=np.mgrid[0:M.shape[0],0:M.shape[1]]
        # rotated sample: point (x,y)->(2cx-x,2cy-y)
        R=ndi.map_coordinates(A,[2*cy-yy,2*cx-xx],order=1,cval=0)>0.5
        return -(M&R).sum()/ (M|R).sum()
    ys,xs=np.nonzero(M)
    p0=[(xs.min()+xs.max())/2,(ys.min()+ys.max())/2]
    r=minimize(iou,p0,method='Nelder-Mead',options={'xatol':0.05,'fatol':1e-6})
    print(name,'bbox center',np.array(p0)/S+[box[0],box[1]],'sym center',r.x/S+[box[0],box[1]],'IoU rot180',-r.fun)
    # also: heaven vs earth identical?
    lab,n=ndi.label(M); print(n,[ (lab==i).sum()/S/S for i in range(1,n+1)])
