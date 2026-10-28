import json,numpy as np
from scipy import ndimage
from scipy.optimize import minimize
from sp import *
from shade import dense
fin=json.load(open('final_H2.json'));N=fin['N']
z=np.r_[np.array(fin['A']).ravel(),fin['th'],fin['hi'],fin['ho']];regs={n:np.array(fin['regs'][n]) for n in NAMES}
o=spl(z,N,40);polys={'heaven':o,'earth':960-o}
master=np.asarray(Image.open('master_H2.png').convert('RGBA'))[:,:,3]/255.0
def reg_mask(mask,start):
    def iou(reg):
        s,tx,ty=reg;H,W=mask.shape;gy,gx=np.mgrid[0:H,0:W]
        vx=(gx+0.5-tx)/s+480;vy=(gy+0.5-ty)/s+480
        pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
        a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
    r=minimize(lambda r:-iou(r),start,method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=500))
    r=minimize(lambda r:-iou(r),r.x,method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=500))
    return r.x,-r.fun
def arm_colours(box,reg,erode=1.0):
    x0,y0,w,h=box;s,tx,ty=reg;gy,gx=np.mgrid[0:h,0:w];G=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
    out={}
    for arm,P in polys.items():
        Pp=(P-480)*s+np.array([tx,ty]);ins=MPath(Pp).contains_points(G);d,_=cKDTree(dense(Pp,0.3)).query(G)
        sel=ins&(d>erode);col=board[y0:y0+h,x0:x0+w].reshape(-1,3)[sel]
        # gradient check: slope along main diagonal
        out[arm]=dict(median=np.median(col,0).tolist(),mean=col.mean(0).tolist(),std=col.std(0).tolist(),n=int(sel.sum()),p10=np.percentile(col,10,axis=0).tolist(),p90=np.percentile(col,90,axis=0).tolist())
    return out
def hexc(c): return '#%02X%02X%02X'%tuple(int(round(v)) for v in c)
res={}
# mono
res['mono']=dict(inst='mono',colour=arm_colours(INSTANCES['mono'],regs['mono'][:3]))
# negatyw: mark light colour; tile colour from border median
x0,y0,w,h=INSTANCES['negatyw'];crop=board[y0:y0+h,x0:x0+w]
border=np.concatenate([crop[0],crop[-1],crop[:,0],crop[:,-1]])
res['negatyw']=dict(tile=np.median(border,0).tolist(),colour=arm_colours(INSTANCES['negatyw'],regs['negatyw'][:3]))
# app-1024
res['app']=dict(colour=arm_colours(INSTANCES['app-1024'],regs['app-1024'][:3],erode=1.2))
# tile-mounted marks: favicon32 / x16 / x8: register the mark inside the tile
tiles=json.load(open('tiles.json'))
for t in tiles:
    if t['name'] in ('favicon32','x16','x8'):
        x,y,w,h=t['x'],t['y'],t['w'],t['h'];box=(x+2,y+2,w-4,h-4)
        bx,by,bw,bh=box;crop=board[by:by+bh,bx:bx+bw];tile=np.array(t['color'])
        d=np.linalg.norm(crop-tile,axis=2);fg=np.clip(d/np.percentile(d,98),0,1)
        # soft mask: fraction of foreground colour
        a=np.clip((d-10)/max(np.percentile(d,95)*0.6,1),0,1)
        yy,xx=np.nonzero(a>0.5);area=(a>0.5).sum()
        start=[np.sqrt(area/ (master>0.5).sum()),xx.mean()+0.5,yy.mean()+0.5]
        r,iou=reg_mask(a,start)
        # to full-tile coordinates: shift by box origin
        res[t['name']]=dict(tile=t,reg_in_box=r.tolist(),box=box,iou=float(iou),colour=arm_colours(box,r,erode=0.6))
        print(t['name'],'mark reg',r.round(4),'iou',round(iou,3))
json.dump(res,open('flats.json','w'),indent=1)
for k,v in res.items():
    if 'colour' in v: print(k,{a:(hexc(c['median']),[round(x,1) for x in c['std']]) for a,c in v['colour'].items()},v.get('tile') if isinstance(v.get('tile'),list) else '')
