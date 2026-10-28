import numpy as np, json
from PIL import Image
im=np.asarray(Image.open('board.jpg').convert('RGB')).astype(float)
reg=json.load(open('reg2.json'))
def px(name,p):
    a=reg[name]['a'];t=np.array(reg[name]['t']);return a*(np.asarray(p)-480)+t
def samp(name,p,r=2):
    x,y=px(name,p);x=int(round(x));y=int(round(y))
    return im[y-r:y+r+1,x-r:x+r+1].reshape(-1,3).mean(0)
hx=lambda c:'#%02X%02X%02X'%tuple(int(round(v)) for v in c)
# heaven centerline polyline in vb
H=[(497,190),(560,290),(620,370),(680,430),(760,475),(805,475)]
H=np.array(H,float)
def along(P,n=12):
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))];t=np.linspace(0,d[-1],n)
    return np.c_[np.interp(t,d,P[:,0]),np.interp(t,d,P[:,1])]
if __name__=='__main__':
    for name in ('light','dark'):
        print(name)
        for arm,rot in (('heaven',False),('earth',True)):
            Pp=along(960-H if rot else H,14)
            print(' ',arm,' '.join(hx(samp(name,p)) for p in Pp))
