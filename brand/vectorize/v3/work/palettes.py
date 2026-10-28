import sys,json,time,numpy as np
from sp import *
from shade import *
from scipy.optimize import least_squares
from fitshade import fit_model
tag=sys.argv[1];N=int(sys.argv[2])
fin=json.load(open(f'final_{tag}.json'));z=np.r_[np.array(fin['A']).ravel(),fin['th'],fin['hi'],fin['ho']];regs={n:np.array(fin['regs'][n]) for n in NAMES}
o=spl(z,N,40);polys={'heaven':o,'earth':960-o}
def arm_pixels(inst,arm,erode_px):
    x0,y0,w,h=INSTANCES[inst];s,tx,ty=regs[inst][:3]
    gy,gx=np.mgrid[0:h,0:w];G=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
    Pp=(polys[arm]-480)*s+np.array([tx,ty])
    ins=MPath(Pp).contains_points(G);d,_=cKDTree(dense(Pp,0.3)).query(G)
    sel=ins&(d>erode_px)
    return (G[sel]-np.array([tx,ty]))/s+480,board[y0:y0+h,x0:x0+w].reshape(-1,3)[sel]
PAL=[('light','wersja-jasna',2.0),('dark','wersja-ciemna',2.0),('podstawowy','podstawowy',1.0),('na-jasnym','na-jasnym',1.0)]
only=sys.argv[3].split(',') if len(sys.argv)>3 else [p[0] for p in PAL]
out={}
OUTF=f'palettes_fit_{tag}_'+'-'.join(only)+'.json'
for name,inst,er in PAL:
    if name not in only: continue
    out[name]={}
    for arm,Model in (('heaven',Heaven),('earth',Earth)):
        P,C=arm_pixels(inst,arm,er)
        t=time.time()
        th0=Model.init()
        if name=='dark' and arm=='earth':
            th0[5:14]=[1,50,30,5,95,58,10,150,80]; th0[32:41]=[11,190,98,11,190,98,11,170,90]
        th,e,p90=fit_model(Model,P,C,th0,restarts=10,sub=5000)
        out[name][arm]=dict(theta=th.tolist(),mean_err=float(e),p90=float(p90),npix=int(len(P)))
        print(name,arm,len(P),'mean dRGB %.2f p90 %.2f'%(e,p90),'%.0fs'%(time.time()-t),flush=True)
        json.dump(out,open(OUTF,'w'),indent=1)
