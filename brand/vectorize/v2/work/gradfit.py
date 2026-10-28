import numpy as np, json, cv2
from PIL import Image
from scipy.optimize import least_squares
from scipy import ndimage as ndi
from bez import *
im=np.asarray(Image.open('board.jpg').convert('RGB')).astype(float)
reg=json.load(open('reg2.json'))
x=np.load('xn.npy')
H=outline(x,80);E=960-H
def masks(name,S=1):
    a=reg[name]['a'];t=np.array(reg[name]['t'])
    out={}
    for arm,poly in (('heaven',H),('earth',E)):
        m=np.zeros(im.shape[:2],np.uint8)
        q=(a*(poly-480)+t)
        cv2.fillPoly(m,[np.round(q*16).astype(np.int32)],1,shift=4)
        out[arm]=m>0
    return out
def hexc(h): h=h.lstrip('#');return np.array([int(h[i:i+2],16) for i in (0,2,4)],float)
STOPS={'heaven':[(0,'#0F3D2E'),(0.55,'#22C55E'),(1,'#86EFAC')],'earth':[(0,'#0A2E22'),(0.5,'#16A34A'),(1,'#22C55E')]}
def grad_eval(stops,t):
    t=np.clip(t,0,1);offs=[s[0] for s in stops];cols=np.array([hexc(s[1]) for s in stops])
    return np.stack([np.interp(t,offs,cols[:,k]) for k in range(3)],-1)
def fit_linear(name,arm,init,free_stops=False):
    m=masks(name)[arm]; m=ndi.binary_erosion(m,iterations=3)
    ys,xs=np.nonzero(m);C=im[ys,xs]
    a=reg[name]['a'];t0=np.array(reg[name]['t'])
    P=np.c_[xs+0.5,ys+0.5]
    st=STOPS[arm]
    def model(p):
        A=np.array(p[0:2]);B=np.array(p[2:4]);v=B-A
        tt=((P-A)@v)/(v@v)
        s=st
        if free_stops: s=[(st[0][0],st[0][1]),(p[4],st[1][1]),(st[2][0],st[2][1])]
        return grad_eval(s,tt)
    p0=list(init)+([st[1][0]] if free_stops else [])
    r=least_squares(lambda p:(model(p)-C).ravel(),p0,method='lm')
    err=np.linalg.norm(model(r.x)-C,axis=1)
    return r.x,err.mean(),(xs,ys,err,model(r.x)),a,t0
if __name__=='__main__':
    for name in ('light','dark'):
        a=reg[name]['a'];t=np.array(reg[name]['t'])
        f=lambda p:a*(np.array(p)-480)+t
        for arm,A,B in (('heaven',(400,150),(800,480)),('earth',(560,810),(160,480))):
            r,e,_,_,_=fit_linear(name,arm,np.r_[f(A),f(B)])
            inv=lambda q:((np.array(q)-t)/a+480)
            print(name,arm,'A_vb',np.round(inv(r[:2]),1),'B_vb',np.round(inv(r[2:4]),1),'mean RGB err',round(e,2))
