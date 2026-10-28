import numpy as np, json
from scipy import ndimage as ndi
from common import board
def tile_info(box,thr=130,minarea=300,hole_fill=True):
    x0,y0,x1,y1=box;reg=board[y0:y1,x0:x1]
    dark=(reg.sum(2)<thr);lab,n=ndi.label(dark)
    best=None
    for i in range(1,n+1):
        m=lab==i
        if m.sum()<minarea: continue
        if best is None or m.sum()>best.sum(): best=m
    return best
def analyse(name,box,origin):
    nm=name
    m=tile_info(box,minarea=(40 if nm=='x8' else 300) if False else 40);filled=ndi.binary_fill_holes(m)
    ys,xs=np.nonzero(filled)
    # subpixel bbox via soft: use half-intensity crossing along centre row/col
    x0,y0=origin;w=xs.max()-xs.min()+1;h=ys.max()-ys.min()+1;A=filled.sum()
    r=np.sqrt(max(w*h-A,0)/(4-np.pi))
    # colour = median of tile pixels not in mark: use pixels dark mask
    col=np.median(board[box[1]:box[3],box[0]:box[2]][m],axis=0)
    return dict(name=name,x=int(xs.min()+x0),y=int(ys.min()+y0),w=int(w),h=int(h),area=int(A),radius_px=float(r),radius_frac=float(r/((w+h)/2)),color=[float(c) for c in col])
if __name__=='__main__':
    out=[]
    for nm,box in (('app',(525,250,620,340)),('favicon32',(630,268,680,318)),('x16',(695,275,735,315)),('x8',(745,278,790,312)),('negatyw',(380,240,490,330))):
        o=analyse(nm,box,(box[0],box[1]));out.append(o);print(o)
    json.dump(out,open('tiles.json','w'),indent=1)
