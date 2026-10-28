import numpy as np, json, cv2
from skimage import measure
from scipy import ndimage as ndi
from bez import *
from register import ref_mask
reg=json.load(open('reg.json'))
def contours_vb(name,box,bg,close):
    R,(H,W)=ref_mask(box,bg,close=close,S=4)
    Rf=ndi.gaussian_filter(R.astype(float),2.0)
    cs=[k for k in measure.find_contours(Rf,0.5) if len(k)>300]
    a=reg[name]['a'];t=np.array(reg[name]['t'])
    out=[]
    for k in cs:
        p=np.c_[k[:,1],k[:,0]]/4+np.array(box[:2])+0.0   # ref px (up-sampled grid pixel centre offset ~ -0.125 ignored->fix)
        p=p+0.0
        out.append((p-t)/a+480)
    return out
L=contours_vb('light',(20,30,260,210),(248,250,244),0)
D=contours_vb('dark',(520,30,780,210),(1,27,18),5)
print([len(c) for c in L],[len(c) for c in D])
# decide which contour is heaven: centroid x>480 & y<480 ... heaven centroid right/up
def split(cs):
    cs=sorted(cs,key=lambda c:-c[:,0].mean())
    return cs[0],cs[1]
Lh,Le=split(L);Dh,De=split(D)
rot=lambda p:960-p
pts=np.vstack([Lh,rot(Le),Dh,rot(De)])
np.save('pts_vb.npy',pts)
z=np.load('xj.npy');s=json.load(open('geo_raw.json'))['meta']['scale'];c=z[31:]
# init params in vb: transform xj params
x0=z[:31].copy()
# positions:  idx 0,1 (cx,cy) 2(R) 3(P2x) 4,5 P3xy 7,8 P4xy 10,11,12,13,14,15 P5..P7 16 P9x ; handles 17..
def toV(x):
    x=x.copy()
    pos=[0,1,2,3,4,5,7,8,10,11,12,13,14,15,16]+list(range(17,31))
    for i in pos:
        if i in (0,3,4,7,11,12,14,16): x[i]=(x[i]-c[0])*s+480
        elif i in (1,5,8,10,13,15): x[i]=(x[i]-c[1])*s+480
        else: x[i]=x[i]*s
    return x
xv=toV(x0)
tree=cKDTree(pts)
def res(x):
    o=outline(x,60)
    d1,_=tree.query(o)   # model->data
    d2,_=cKDTree(o).query(pts)
    return np.r_[d1[::1],d2[::6]*1.0]
# polygon outline under rotation: model heaven only, data contains both arms rotated onto heaven
def res2(x):
    o=outline(x,60)
    d1,_=cKDTree(pts).query(o); d2,_=cKDTree(o).query(pts)
    return np.r_[d1,d2]
r=least_squares(res2,xv,method='trf',max_nfev=3000,x_scale='jac')
print('rms vb',np.sqrt(np.mean(r.fun**2)),'(px ref',np.sqrt(np.mean(r.fun**2))/s,')','max',np.abs(r.fun).max())
np.save('xv.npy',r.x)
print(np.round(r.x[:17],2),'R',r.x[2])
