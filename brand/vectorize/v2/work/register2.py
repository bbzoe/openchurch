import numpy as np, json
from register import *
x=np.load('xv.npy'); polys=[outline(x,80),960-outline(x,80)]
reg=json.load(open('reg.json'));out={}
for name,box,bg,close,t0 in [('light',(20,30,260,210),(248,250,244),0,(145.84,123.62)),('dark',(520,30,780,210),(1,27,18),5,(646.9,123.6))]:
    p,iou=register(polys,box,bg,close,reg[name]['a'],reg[name]['t'])
    print(name,'a=%.5f 1/a=%.4f t=%s IoU=%.4f'%(p[0],1/p[0],np.round(p[1:],3),iou)); out[name]=dict(a=p[0],t=p[1:].tolist(),iou=iou)
allp=np.vstack(polys);print('bbox',allp.min(0),allp.max(0),np.ptp(allp,axis=0))
json.dump(out,open('reg2.json','w'))
