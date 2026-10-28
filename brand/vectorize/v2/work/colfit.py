import numpy as np, json, cv2
from PIL import Image
from scipy.optimize import least_squares
from scipy import ndimage as ndi
from bez import *
im=np.asarray(Image.open('board.jpg').convert('RGB')).astype(float)
reg=json.load(open('reg2.json'))
x=np.load('xn.npy');H=outline(x,80);E=960-H
def hexc(h): h=h.lstrip('#');return np.array([int(h[i:i+2],16) for i in (0,2,4)],float)
def pixels(name,arm,erode=3,step=1):
    a=reg[name]['a'];t=np.array(reg[name]['t'])
    poly=H if arm=='heaven' else E
    m=np.zeros(im.shape[:2],np.uint8)
    cv2.fillPoly(m,[np.round((a*(poly-480)+t)*16).astype(np.int32)],1,shift=4)
    m=ndi.binary_erosion(m>0,iterations=erode)
    ys,xs=np.nonzero(m)
    P=(np.c_[xs+0.5,ys+0.5]-t)/a+480
    return P[::step],im[ys,xs][::step]
def lin(P,A,B):
    v=B-A;return ((P-A)@v)/(v@v)
def interp_stops(t,offs,vals):
    t=np.clip(t,offs[0],offs[-1]) if False else t
    return np.stack([np.interp(t,offs,vals[:,k]) for k in range(vals.shape[1])],-1)
OFFS=lambda s:np.array([q[0] for q in s])
