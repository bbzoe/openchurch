import sys,time
from fitshade import *
z=np.load('z_mean.npy');p=z[:NP];R=z[NP:].reshape(-1,3)
reg={n:R[i] for i,n in enumerate(NAMES)}
for inst in ['wersja-jasna']:
    for arm,Model in (('heaven',Heaven),('earth',Earth)):
        P,C,_=arm_pixels(inst,p,reg[inst],arm)
        t=time.time()
        th,e,p90=fit_model(Model,P,C,Model.init(),restarts=4,sub=4000)
        print(inst,arm,len(P),'mean dRGB %.2f p90 %.2f'%(e,p90),'%.0fs'%(time.time()-t))
        np.save(f'th_test_{arm}.npy',th)
