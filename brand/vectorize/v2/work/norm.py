import numpy as np
from bez import *
x=np.load('xv.npy')
o=np.vstack([outline(x,80),960-outline(x,80)])
k=960/np.ptp(o[:,0])
print('k',k)
pos_x=[0,3,4,7,11,12,14,16];pos_y=[1,5,8,10,13,15]
y=x.copy()
for i in pos_x: y[i]=(x[i]-480)*k+480
for i in pos_y: y[i]=(x[i]-480)*k+480
for i in [2]+list(range(17,31)): y[i]=x[i]*k
# nudge to make bbox centered exactly at 480 in x (symmetry makes it automatically)
np.save('xn.npy',y)
o=np.vstack([outline(y,80),960-outline(y,80)])
print(o.min(0),o.max(0),np.ptp(o,0),'ratio',np.ptp(o,0)[0]/np.ptp(o,0)[1])
d,P,segs=path(y)
print('R',d['cx'],d['cy'],d['R'],'R/u',d['R']/40)
for i in (2,3,4,5,6,7,9): print(i,np.round(P[i],2))
oh=outline(y,200)
# top lobe width (P5x->P7x)
print('top lobe width',P[7][0]-P[5][0],(P[7][0]-P[5][0])/40,'u; height cap',2*d['R']/40,'u')
# neck width: min distance between concave pieces: segs[1] (P3->P4 concave) and segs[5]
c1=cubic(*segs[1],n=300);c2=cubic(*segs[5],n=300)
D=np.hypot(*(c1[:,None,:]-c2[None,:,:]).transpose(2,0,1));i,j=np.unravel_index(D.argmin(),D.shape)
print('neck width',D.min(),D.min()/40,'u',c1[i],c2[j])
# gap between heaven and earth
e=960-oh
D=cKDTree(e).query(oh)[0];print('min gap heaven-earth',D.min(),D.min()/40,'u')
