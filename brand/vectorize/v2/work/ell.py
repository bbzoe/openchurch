import numpy as np, json, cv2
C=[np.array(c,np.float32) for c in json.load(open('contours_light.json'))]
def seg(c,a,b): return c[a:b]
# top lobe heaven: indexes ~ 126..270 (of 443) -> from the table arclen/0.5.. use points with y<95 & x<182 
c0=C[0]
sel=c0[(c0[:,1]<92)&(c0[:,0]<177)&~((c0[:,0]>150)&(c0[:,1]>100))]
# exclude concave bits: keep points where distance from rough centre (149.3,71.8) between 25 and 34
d=np.hypot(sel[:,0]-149.3,sel[:,1]-71.8); sel=sel[(d>25)&(d<34)]
print(len(sel))
(e,(w,h),ang)=cv2.fitEllipse(sel); print('ellipse centre',e,'axes',w/2,h/2,'angle',ang)
# circle fit
A=np.c_[2*sel[:,0],2*sel[:,1],np.ones(len(sel))]; b=(sel**2).sum(1)
x=np.linalg.lstsq(A,b,rcond=None)[0]; cx,cy=x[0],x[1]; r=np.sqrt(x[2]+cx**2+cy**2); print('circle',cx,cy,r, 'rms',np.sqrt(np.mean((np.hypot(sel[:,0]-cx,sel[:,1]-cy)-r)**2)))
# right lobe cap
sel=c0[(c0[:,0]>212)]
A=np.c_[2*sel[:,0],2*sel[:,1],np.ones(len(sel))]; b=(sel**2).sum(1)
x=np.linalg.lstsq(A,b,rcond=None)[0]; cx,cy=x[0],x[1]; r=np.sqrt(x[2]+cx**2+cy**2); print('cap circle',cx,cy,r,'rms',np.sqrt(np.mean((np.hypot(sel[:,0]-cx,sel[:,1]-cy)-r)**2)))
(e,(w,h),ang)=cv2.fitEllipse(sel); print('cap ellipse',e,w/2,h/2,ang)
