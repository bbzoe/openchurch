import numpy as np, json
from pathlib import Path
from PIL import Image
from scipy import ndimage
from matplotlib.path import Path as MPath
from scipy.spatial import cKDTree
WORK=Path(__file__).resolve().parent
board=np.asarray(Image.open(WORK/'board.jpg').convert('RGB')).astype(float)
INSTANCES={
 'wersja-jasna':(40,25,210,200),'wersja-ciemna':(545,25,205,200),
 'podstawowy':(15,245,100,75),'na-jasnym':(120,245,100,75),'mono':(262,248,110,75),
 'negatyw':(390,252,90,69),'app-1024':(537,262,69,65),'pole-ochronne':(878,262,80,72)}
NAMES=list(INSTANCES)
def soft_mask(box):
    x0,y0,w,h=box
    crop=board[y0:y0+h,x0:x0+w]
    border=np.concatenate([crop[0],crop[-1],crop[:,0],crop[:,-1]])
    bg=np.median(border,axis=0)
    dist=np.linalg.norm(crop-bg,axis=2)
    dark_bg=bg.sum()<150
    core=dist>(24 if dark_bg else max(24,0.35*np.percentile(dist,99)))
    lab,n=ndimage.label(core)
    sizes=ndimage.sum(core,lab,range(1,n+1))
    core=ndimage.binary_fill_holes(np.isin(lab,np.argsort(sizes)[::-1][:2]+1))
    fg=ndimage.grey_dilation(np.where(core,dist,0),size=5)
    fg=np.where(fg>0,fg,dist.max())
    alpha=np.clip(dist/np.maximum(fg,1),0,1)
    alpha[ndimage.binary_erosion(core,iterations=2)]=1
    alpha[~ndimage.binary_dilation(core,iterations=2)]=0
    return alpha
_masks={}
def masks():
    if not _masks:
        for n,b in INSTANCES.items(): _masks[n]=soft_mask(b)
    return _masks
# ---------------- parametric heaven arm ----------------
# p layout: 0:P9 xy,2:T0 xy,4:Rt xy,6:B0 xy,8:P2 xy,10:P3 xy th,13:P4 xy th,16:P5 xy,18:P6 xy,20:P7 xy, 22..37: 16 handle lengths
NP=38
def unit(v): return v/np.hypot(*v)
def segs(p):
    P9=p[0:2];T0=p[2:4];Rt=p[4:6];B0=p[6:8];P2=p[8:10];P3=p[10:12];P4=p[13:15];P5=p[16:18];P6=p[18:20];P7=p[20:22]
    th3=p[12];th4=p[15];h=p[22:38]
    ut=unit(T0-P9);ub=unit(P2-B0)
    ang=lambda t:np.array([np.cos(t),np.sin(t)])
    d3=ang(th3);d4=ang(th4)
    Dn=np.array([0.,1.]);Up=np.array([0.,-1.]);Rr=np.array([1.,0.])
    order=[(T0,ut,Rt,Dn),(Rt,Dn,B0,ub),(P2,ub,P3,d3),(P3,d3,P4,d4),(P4,d4,P5,Up),(P5,Up,P6,Rr),(P6,Rr,P7,Dn),(P7,Dn,P9,ut)]
    out=[]
    for i,(a,ua,b,ub_) in enumerate(order):
        out.append((a,a+ua*h[2*i],b-ub_*h[2*i+1],b))
    return out
def cubic(c,n):
    t=np.linspace(0,1,n)[:,None];p0,p1,p2,p3=c
    return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def outline(p,n=24):
    P9=p[0:2];T0=p[2:4];B0=p[6:8];P2=p[8:10]
    S=segs(p)
    pts=[np.array([P9,T0])]
    for i in (0,1): pts.append(cubic(S[i],n))
    pts.append(np.array([B0,P2]))
    for i in range(2,8): pts.append(cubic(S[i],n))
    return np.vstack(pts)
def both(p,n=24):
    o=outline(p,n);return o,960-o
def path_d(p,rot=False):
    f=lambda v:('%.2f'%v).rstrip('0').rstrip('.') if abs(v)>=0.005 else '0'
    S=segs(p);T=(lambda q:960-q) if rot else (lambda q:q)
    pt=lambda q:f(T(q)[0])+' '+f(T(q)[1])
    P9=p[0:2]
    o=['M'+pt(P9),'L'+pt(p[2:4])]
    for i in (0,1): o.append('C'+pt(S[i][1])+' '+pt(S[i][2])+' '+pt(S[i][3]))
    o.append('L'+pt(p[8:10]))
    for i in range(2,8): o.append('C'+pt(S[i][1])+' '+pt(S[i][2])+' '+pt(S[i][3]))
    o.append('Z');return ''.join(o)
def from_v2(x):
    d_cx,d_cy,R,P2x=x[0],x[1],x[2],x[3]
    P3=x[4:7];P4=x[7:10];P5y,P5x=x[10],x[11];P6x,P6y=x[12],x[13];P7x,P7y=x[14],x[15];P9x=x[16];h=x[17:17+12]
    top=d_cy-R;bot=d_cy+R;k=0.5523*R
    p=np.zeros(NP)
    p[0:2]=[P9x,top];p[2:4]=[d_cx,top];p[4:6]=[d_cx+R,d_cy];p[6:8]=[d_cx,bot];p[8:10]=[P2x,bot]
    p[10:13]=P3;p[13:16]=P4;p[16:18]=[P5x,P5y];p[18:20]=[P6x,P6y];p[20:22]=[P7x,P7y]
    hh=np.zeros(16);hh[0:4]=[k,k,k,k];hh[4:16]=h
    p[22:38]=hh
    return p
# ---------------- coverage via signed distance ----------------
def coverage(p,reg,shape,box=None):
    """reg=(s,tx,ty): px=s*(vb-480)+t (pixel-centre coords, i.e. pixel i centre at i+0.5). Returns coverage image."""
    s,tx,ty=reg;H,W=shape
    o,o2=both(p,18)
    O=np.vstack([o,o2]);Op=(O-480)*s+np.array([tx,ty])
    gy,gx=np.mgrid[0:H,0:W];G=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
    d,_=cKDTree(Op).query(G)
    ins=np.zeros(len(G),bool)
    for q in (o,o2):
        ins|=MPath((q-480)*s+np.array([tx,ty])).contains_points(G)
    sd=np.where(ins,-d,d)
    return np.clip(0.5-sd,0,1).reshape(H,W)
def raster_iou(p,reg,mask,S=8):
    import cv2
    s,tx,ty=reg[:3];sy=reg[3] if len(reg)>3 else s;H,W=mask.shape
    m=np.zeros((H*S,W*S),np.uint8)
    for q in both(p,40):
        pp=((q-480)*np.array([s,sy])+np.array([tx,ty]))*S
        cv2.fillPoly(m,[np.round(pp*16).astype(np.int32)],1,shift=4)
    cov=m.reshape(H,S,W,S).mean((1,3))
    a=mask>0.5;b=cov>0.5
    return (a&b).sum()/(a|b).sum()

# ---- constrained parametrisation: exact semicircular cap, horizontal straight edges ----
NQ=29
def q_to_p(q):
    cx,cy,R,x9,x2=q[0:5];P3=q[5:8];P4=q[8:11];P5=q[11:13];P6=q[13:15];P7=q[15:17];h=q[17:29]
    top=cy-R;bot=cy+R;k=0.5522847498*R
    p=np.zeros(NP)
    p[0:2]=[x9,top];p[2:4]=[cx,top];p[4:6]=[cx+R,cy];p[6:8]=[cx,bot];p[8:10]=[x2,bot]
    p[10:13]=P3;p[13:16]=P4;p[16:18]=P5;p[18:20]=P6;p[20:22]=P7
    p[22:26]=[k,k,k,k];p[26:38]=h
    return p
def p_to_q(p):
    cx=p[2];R=(p[6+1]-p[3])/2;cy=(p[3]+p[7])/2
    return np.r_[cx,cy,R,p[0],p[8],p[10:13],p[13:16],p[16:18],p[18:20],p[20:22],p[26:38]]
def path_d_q(q,rot=False):
    p=q_to_p(q);S=segs(p)
    f=lambda v:('%.2f'%v).rstrip('0').rstrip('.') if abs(v)>=0.005 else '0'
    T=(lambda a:960-a) if rot else (lambda a:a)
    pt=lambda a:f(T(a)[0])+' '+f(T(a)[1])
    R=q[2]
    o=['M'+pt(p[0:2]),'L'+pt(p[2:4]),'A%s %s 0 0 1 %s'%(f(R),f(R),pt(p[6:8])),'L'+pt(p[8:10])]
    for i in range(2,8): o.append('C'+pt(S[i][1])+' '+pt(S[i][2])+' '+pt(S[i][3]))
    o.append('Z');return ''.join(o)
