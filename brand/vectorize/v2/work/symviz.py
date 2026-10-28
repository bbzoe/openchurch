import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from alpha import alpha
c,a,keep=alpha((20,30,260,210),(248,250,244))
S=4
A=np.clip(ndi.zoom(a,S,order=3),0,1)
cx,cy=(145.37-20)*S,(123.39-30)*S
yy,xx=np.mgrid[0:A.shape[0],0:A.shape[1]]
R=ndi.map_coordinates(A,[2*cy-yy,2*cx-xx],order=1,cval=0)
out=np.zeros(A.shape+(3,),np.uint8)
out[...,0]=(A*255); out[...,1]=(R*255); out[...,2]=0
Image.fromarray(out).save('symviz.png')
