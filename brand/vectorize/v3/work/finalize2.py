import sys,json,subprocess,numpy as np
from scipy import ndimage
from scipy.optimize import minimize
from sp import *
tag=sys.argv[1];N=int(sys.argv[2])
z=np.load(f'zf_{tag}.npy');Rr=np.load(f'Rf_{tag}.npy').copy()
# normalise bbox width -> 960 about (480,480)
o=spl(z,N,400);oo=np.vstack([o,960-o]);k=960/np.ptp(oo[:,0])
A,th,hi,ho=unpack(z,N)
A=(A-480)*k+480;hi=hi*k;ho=ho*k
Rr[:,0]/=k
# rounding: anchors 2 dp, angles 4 dp (rad), control points computed then rounded to 2dp
A=np.round(A,2);th=np.round(th,4)
u=np.c_[np.cos(th),np.sin(th)]
C1=np.round(np.array([A[i]+u[i]*ho[i] for i in range(N)]),2)
C2=np.round(np.array([A[(i+1)%N]-u[(i+1)%N]*hi[(i+1)%N] for i in range(N)]),2)
f=lambda v:('%.2f'%v).rstrip('0').rstrip('.') if abs(v)>=0.005 else '0'
def D(rot):
    T=(lambda a:np.array([round(960-a[0],2),round(960-a[1],2)])) if rot else (lambda a:a)
    pt=lambda a:f(T(a)[0])+' '+f(T(a)[1])
    s='M'+pt(A[0])
    for i in range(N):
        j=(i+1)%N;s+='C'+pt(C1[i])+' '+pt(C2[i])+' '+pt(A[j])
    return s+'Z'
heaven,earth=D(False),D(True)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><g fill="#0F3D2E"><path id="heaven" d="%s"/><path id="earth" d="%s"/></g></svg>'%(heaven,earth)
open(f'master_{tag}.svg','w').write(svg)
# evaluate with rsvg + register by IoU
subprocess.check_call(['rsvg-convert','-w','960','-h','960',f'master_{tag}.svg','-o',f'master_{tag}.png'])
master=np.asarray(Image.open(f'master_{tag}.png').convert('RGBA'))[:,:,3]/255.0
def iou_ref(reg,mask):
    s,tx,ty=reg;H,W=mask.shape;gy,gx=np.mgrid[0:H,0:W]
    vx=(gx+0.5-tx)/s+480;vy=(gy+0.5-ty)/s+480
    pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
    a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
regs={};ious_={}
for i,n in enumerate(NAMES):
    r=minimize(lambda r:-iou_ref(r,M[n]),Rr[i],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=600))
    r=minimize(lambda r:-iou_ref(r,M[n]),r.x,method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=600))
    regs[n]=r.x;ious_[n]=-r.fun
print({k[:8]:round(v,4) for k,v in ious_.items()},'mean',round(np.mean(list(ious_.values())),4))
json.dump(dict(N=N,A=A.tolist(),th=th.tolist(),hi=hi.tolist(),ho=ho.tolist(),C1=C1.tolist(),C2=C2.tolist(),heaven=heaven,earth=earth,regs={n:regs[n].tolist() for n in NAMES},iou=ious_,k=k),open(f'final_{tag}.json','w'),indent=1)
# geometry facts
o=np.vstack([spl(np.r_[A.ravel(),th,hi,ho],N,400)]);oo=np.vstack([o,960-o])
print('bbox',oo.min(0).round(2),oo.max(0).round(2),'ratio w/h',np.ptp(oo[:,0])/np.ptp(oo[:,1]))
print(heaven)
