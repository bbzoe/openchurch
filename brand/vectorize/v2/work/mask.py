import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
im=np.asarray(Image.open('board.jpg').convert('RGB')).astype(float)
def mask(x0,y0,x1,y1,dark):
    c=im[y0:y1,x0:x1]
    bg=np.median(np.concatenate([c[:3].reshape(-1,3),c[-3:].reshape(-1,3)]),axis=0) if not dark else np.median(c[:6].reshape(-1,3),axis=0)
    d=np.linalg.norm(c-bg,axis=2)
    return c,bg,d
for name,box,dark in [('light',(20,30,260,210),0),('dark',(520,30,780,210),1)]:
    c,bg,d=mask(*box,dark)
    print(name,bg, d.max())
    m=d>d.max()*0.0+40
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); print(n,sizes)
