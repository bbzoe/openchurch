import numpy as np
from iou_fit import *
z=np.load('z_mean.npy');p0,R0=split(z)
I={n:IInst(n) for n in NAMES}
P={n:np.load(f'p_single_{n}.npy')[:NP] for n in NAMES}
def cov_d(inst,p,reg,delta):
    sc,tx,ty=reg[:3];SC=np.array([sc,sc])
    o,o2=both(p,18);O=np.vstack([o,o2]);Op=(O-480)*SC+np.array([tx,ty])
    d,_=cKDTree(Op).query(inst.G);ins=np.zeros(len(inst.G),bool)
    for q in (o,o2): ins|=MPath((q-480)*SC+np.array([tx,ty])).contains_points(inst.G)
    sd=np.where(ins,-d,d)-delta
    return np.clip(0.5-sd,0,1)
print('rows=shape, cols=eval; shows IoU(refit reg + delta px) and delta')
for a in ('wersja-jasna','podstawowy','mono'):
    row=[]
    for b in NAMES:
        r=least_squares(lambda rr:cov_d(I[b],P[a],rr[:3],rr[3])-I[b].av,np.r_[R0[b],0.0],method='lm',x_scale=[0.01,1,1,0.3])
        # binary IoU of dilated shape
        c=np.zeros(M[b].shape);
        row.append((r.x[3]))
        print(a[:8],b[:8],'delta px',round(r.x[3],2),'= %.3f u'%(r.x[3]/r.x[0]/40),'soft cost',round((r.fun**2).sum(),2))
