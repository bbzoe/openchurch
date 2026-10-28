import numpy as np, json, cv2
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from alpha import alpha

def cubic(p0,p1,p2,p3,n=40):
    t=np.linspace(0,1,n)[:,None]
    return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def arc_semi(c,R,n=60):
    a=np.linspace(-np.pi/2,np.pi/2,n)
    return np.c_[c[0]+R*np.cos(a),c[1]+R*np.sin(a)]
# anchor order after cap: P2(bottom-left of capsule, tangent -x), P3(infl), P4(infl2), P5(left, tangent -y(up)), P6(top, tangent +x), P7(right, tangent +y), P9(top edge start, tangent +x)
# tangent angles (direction of travel, image coords): P2:pi ; P5: -pi/2 ; P6: 0 ; P7: +pi/2 ; P9: 0 ; P3,P4 free
# params vector layout
def unpack(x):
    d={}
    i=0
    d['cx'],d['cy'],d['R']=x[0:3]; 
    d['P2x']=x[3]
    d['P3']=x[4:7]   # x,y,theta
    d['P4']=x[7:10]
    d['P5y']=x[10]; d['P5x']=x[11]
    d['P6x']=x[12]; d['P6y']=x[13]
    d['P7x']=x[14]; d['P7y']=x[15]
    d['P9x']=x[16]
    d['h']=x[17:17+14]  # handle lengths for 7 cubics (a,b)
    return d
def path(x,n=40):
    d=unpack(x)
    cx,cy,R=d['cx'],d['cy'],d['R']
    top=cy-R;bot=cy+R
    P=[None]*10
    P[2]=np.array([d['P2x'],bot])
    P[3]=d['P3'][:2]; P[4]=d['P4'][:2]
    P[5]=np.array([d['P5x'],d['P5y']]); P[6]=np.array([d['P6x'],d['P6y']]); P[7]=np.array([d['P7x'],d['P7y']])
    P[9]=np.array([d['P9x'],top])
    th={2:np.pi,3:d['P3'][2],4:d['P4'][2],5:-np.pi/2,6:0.0,7:np.pi/2,9:0.0}
    u=lambda k:np.array([np.cos(th[k]),np.sin(th[k])])
    order=[2,3,4,5,6,7,9]
    h=d['h']
    segs=[]
    for i in range(len(order)-1):
        a,b=order[i],order[i+1]
        p0,p3=P[a],P[b]
        segs.append((p0,p0+u(a)*h[2*i],p3-u(b)*h[2*i+1],p3))
    return d,P,segs
def outline(x,n=40):
    d,P,segs=path(x,n)
    cx,cy,R=d['cx'],d['cy'],d['R']
    pts=[np.array([[d['P9x'],cy-R],[cx,cy-R]]),arc_semi((cx,cy),R),np.array([[cx,cy+R],[d['P2x'],cy+R]])]
    for s in segs: pts.append(cubic(*s,n=n))
    return np.vstack(pts)
