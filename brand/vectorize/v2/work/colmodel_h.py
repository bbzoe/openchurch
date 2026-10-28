import numpy as np
from colfit import *
cols=np.array([hexc('#0F3D2E'),hexc('#22C55E'),hexc('#86EFAC')])
def model(p,P):
    A1=p[0:2];B1=p[2:4];m1=p[4]
    base=interp_stops(lin(P,A1,B1),np.array([0,m1,1.0]),cols)
    A2=p[5:7];B2=p[7:9];o0,o1=p[9],p[10]
    t2=lin(P,A2,B2)
    alpha=np.clip((t2-o0)/(o1-o0),0,1)
    ov=interp_stops(np.clip(t2,o0,1.0),np.array([o0,1.0]),cols[1:])
    out=base*(1-alpha[:,None])+ov*alpha[:,None]
    s,q0,q1,q2=p[11:15]
    sh=np.interp(t2,[q0,q1,q2],[0,s,0],left=0,right=0)
    return out*(1-sh[:,None])
