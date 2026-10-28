import sys,numpy as np,time
from joint_fit import *
H=float(sys.argv[1]);start=sys.argv[2]
I={n:Inst(n) for n in NAMES}
z=np.load('z_mean.npy');p=z[:NP];R0=z[NP:].reshape(-1,3)
if start!='mean': p=np.load(f'p_single_{start}.npy')[:NP]
Rd={n:R0[i] for i,n in enumerate(NAMES)}
w={n:1/np.sqrt(len(I[n].G)) for n in NAMES}
for n in ('wersja-jasna','wersja-ciemna'): w[n]*=H
w['app-1024']*=0.7
t=time.time()
for it in range(int(sys.argv[3]) if len(sys.argv)>3 else 4):
    p,Rd=joint(p,Rd,I,w,nfev=12)
    v=report(p,Rd,'H=%s %s it%d'%(H,start,it));print(time.time()-t,flush=True)
np.save(f'p_ls_{H}_{start}.npy',p);np.save(f'R_ls_{H}_{start}.npy',np.array([Rd[n] for n in NAMES]))
