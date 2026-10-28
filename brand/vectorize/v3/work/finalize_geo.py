import sys, json, subprocess, numpy as np
from scipy import ndimage
from scipy.optimize import minimize
from joint import *
tag=sys.argv[1]
z=np.load(f'z_q_{tag}.npy');q=z[:NQ].copy();R=z[NQ:].reshape(-1,3)
# --- normalise: bbox width 960 about (480,480)
k=(960-480)/(q[0]+q[2]-480)
posidx=[0,1,3,4,5,6,8,9,11,12,13,14,15,16]
for i in posidx: q[i]=(q[i]-480)*k+480
q[2]*=k;q[17:29]*=k
R=R.copy();R[:,0]/=k
print('k',k)
# --- rounding of the numbers that define the path (2 decimals) is done in emit; also round params
q=np.round(q,2);q[7]=round(q[7],4);q[10]=round(q[10],4)
p=q_to_p(q)
def emit(q):
    p=q_to_p(q);S=segs(p)
    r=lambda v:round(float(v),2)
    pts={'P9':(r(p[0]),r(p[1])),'T0':(r(p[2]),r(p[3])),'B0':(r(p[6]),r(p[7])),'P2':(r(p[8]),r(p[9]))}
    cub=[tuple((r(a[0]),r(a[1])) for a in s[1:]) for s in S[2:]]
    return pts,cub,r(q[2])
def d_from(pts,cub,Rr,rot):
    T=(lambda a:(round(960-a[0],2),round(960-a[1],2))) if rot else (lambda a:a)
    f=lambda v:('%.2f'%v).rstrip('0').rstrip('.') if abs(v)>=0.005 else '0'
    pt=lambda a:f(T(a)[0])+' '+f(T(a)[1])
    o=['M'+pt(pts['P9']),'L'+pt(pts['T0']),'A%s %s 0 0 1 %s'%(f(Rr),f(Rr),pt(pts['B0'])),'L'+pt(pts['P2'])]
    for c in cub: o.append('C'+pt(c[0])+' '+pt(c[1])+' '+pt(c[2]))
    o.append('Z');return ''.join(o)
pts,cub,Rr=emit(q)
heaven=d_from(pts,cub,Rr,False);earth=d_from(pts,cub,Rr,True)
mono='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><g fill="#0F3D2E"><path id="heaven" d="%s"/><path id="earth" d="%s"/></g></svg>'%(heaven,earth)
open(f'master_{tag}.svg','w').write(mono)
subprocess.check_call(['rsvg-convert','-w','960','-h','960',f'master_{tag}.svg','-o',f'master_{tag}.png'])
master=np.asarray(Image.open(f'master_{tag}.png').convert('RGBA'))[:,:,3]/255.0
def iou_ref(reg_vb,mask):
    s,tx,ty=reg_vb;H,W=mask.shape
    gy,gx=np.mgrid[0:H,0:W]
    vx=(gx+0.5-tx)/s+480;vy=(gy+0.5-ty)/s+480
    pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
    a,b=mask>0.5,pred>0.5
    return (a&b).sum()/(a|b).sum()
regs={};ious_={}
for i,n in enumerate(NAMES):
    r=minimize(lambda r:-iou_ref(r,M[n]),R[i],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=600,initial_simplex=None))
    r=minimize(lambda r:-iou_ref(r,M[n]),r.x,method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=600))
    regs[n]=r.x;ious_[n]=-r.fun
print({k:round(v,4) for k,v in ious_.items()},'mean',round(np.mean(list(ious_.values())),4))
json.dump(dict(q=q.tolist(),heaven=heaven,earth=earth,regs={n:regs[n].tolist() for n in NAMES},iou=ious_),open(f'final_{tag}.json','w'),indent=1)
print(heaven)
