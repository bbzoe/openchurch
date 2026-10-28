import sys, subprocess, numpy as np
from scipy import ndimage
from scipy.optimize import minimize
from joint import *
def eval_svg(svg,start_regs=None,verbose=True):
    subprocess.check_call(['rsvg-convert','-w','960','-h','960',svg,'-o','_ev.png'])
    master=np.asarray(Image.open('_ev.png').convert('RGBA'))[:,:,3]/255.0
    ys,xs=np.nonzero(master>0.5);cx,cy=(xs.min()+xs.max()+1)/2,(ys.min()+ys.max()+1)/2
    def iou_ref(reg,mask):
        s,tx,ty=reg;H,W=mask.shape;gy,gx=np.mgrid[0:H,0:W]
        vx=(gx+0.5-tx)/s+cx;vy=(gy+0.5-ty)/s+cy
        pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
        a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
    out={}
    for n in NAMES:
        a=M[n]>0.5;yy,xx=np.nonzero(a)
        r0=[np.sqrt(a.sum()/(master>0.5).sum()),xx.mean()+0.5,yy.mean()+0.5]
        r=minimize(lambda r:-iou_ref(r,M[n]),r0,method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=800))
        r=minimize(lambda r:-iou_ref(r.copy(),M[n]),r.x,method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=800))
        out[n]=-r.fun
    if verbose: print(svg,{k[:8]:round(v,4) for k,v in out.items()},'mean',round(np.mean(list(out.values())),4))
    return out
if __name__=='__main__':
    for s in sys.argv[1:]: eval_svg(s)
