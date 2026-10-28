import numpy as np, cv2
from matplotlib.path import Path
from colfit import *
cols=np.array([hexc('#0A2E22'),hexc('#16A34A'),hexc('#22C55E')])
XL,YV=293.5,489.0; Q=np.array([359.0,430.4])
def overlay_poly(xl=XL,yv=YV,q=Q,n=30):
    P0=np.array([xl,yv]);P1=np.array([xl,yv-34]);P2=q-np.array([0.87,-0.5])*30
    t=np.linspace(0,1,n)[:,None]
    c=(1-t)**3*P0+3*(1-t)**2*t*P1+3*(1-t)*t**2*P2+t**3*q
    return np.vstack([[xl,1100],c,[1100,q[1]],[1100,1100]])
def overlay_mask(P,**k): return Path(overlay_poly(**k)).contains_points(P)
def model(p,P,mask,cols=cols):
    A1=p[0:2];B1=p[2:4];m1=p[4];A2=p[5:7];B2=p[7:9];m2=p[9]
    b=interp_stops(lin(P,A1,B1),np.array([0,m1,1.0]),cols)
    o=interp_stops(lin(P,A2,B2),np.array([0,m2,1.0]),cols)
    return np.where(mask[:,None],o,b)
