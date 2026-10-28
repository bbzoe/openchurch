import numpy as np, json, cv2
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from arm import *
from alpha import alpha
names=['RT','R','tx','ty','lx','rx','y0','f1','f2']
C=[np.array(c) for c in json.load(open('contours_light.json'))]
def fit_joint(C0,C1,c,x0):
    E=2*c-C1
    pts=np.vstack([C0,E]); tree=cKDTree(pts)
    def res(x):
        P=dict(zip(names,x))
        try: o=outline(P,40)
        except Exception: return np.ones(len(pts)+len(pts)//2)*50
        d1,_=cKDTree(o).query(pts); d2,_=tree.query(o)
        return np.r_[d1,d2[::2]*0.7]
    return least_squares(res,x0,method='lm')
def iou_for(P,c,A,box,S=4):
    o=outline(P,80); o2=2*c-o
    H,W=A.shape
    m=np.zeros((H*S,W*S),np.uint8)
    for poly in (o,o2):
        pp=np.round((poly-np.array(box))*S*16).astype(np.int32)  # shift=4 -> 1/16 px
        cv2.fillPoly(m,[pp],1,shift=4,lineType=cv2.LINE_8)
    ref=cv2.resize(A,(W*S,H*S),interpolation=cv2.INTER_CUBIC)>0.5
    m=m>0
    return (m&ref).sum()/(m|ref).sum()
if __name__=='__main__':
    c=np.array([145.37,123.39])
    x0=[29.5,29,149.3,71.5,190.6,202.5,122.2,32,17]
    r=fit_joint(C[0],C[1],c,x0)
    print(dict(zip(names,np.round(r.x,2))),'rms',np.sqrt(np.mean(r.fun**2)))
    c_,A,keep=alpha((20,30,260,210),(248,250,244))
    print('IoU',iou_for(dict(zip(names,r.x)),c,A,(20,30)))
