import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.asarray(Image.open('board.jpg').convert('RGB')).astype(float)
IMS={}
def alpha(box,bgpt,src='board.jpg',minsize=1000,thr=40):
    if src not in IMS: IMS[src]=np.asarray(Image.open(src).convert('RGB')).astype(float)
    x0,y0,x1,y1=box
    c=IMS[src][y0:y1,x0:x1]
    bg=np.array(bgpt,float)
    d=np.linalg.norm(c-bg,axis=2)
    m=d>thr
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>minsize])
    inner=ndi.binary_erosion(keep,iterations=4)
    idx=ndi.distance_transform_edt(~inner,return_indices=True)[1]
    ref=d[idx[0],idx[1]]
    a=np.clip(d/np.maximum(ref,30),0,1)
    a[~ndi.binary_dilation(keep,iterations=3)]=0
    return c,a,keep
if __name__=='__main__':
    for name,box,bg in [('light',(20,30,260,210),(248,250,244)),('dark',(520,30,780,210),(1,27,18))]:
        c,a,keep=alpha(box,bg)
        Image.fromarray((a*255).astype(np.uint8)).save(f'alpha_{name}.png')
        ys,xs=np.nonzero(a>0.5)
        print(name,xs.min()+box[0],xs.max()+box[0],ys.min()+box[1],ys.max()+box[1],'w',xs.max()-xs.min()+1,'h',ys.max()-ys.min()+1,'area',(a>0.5).sum())
