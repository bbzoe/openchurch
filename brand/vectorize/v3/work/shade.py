"""Layered shading models (numpy mirror of the SVG structure) + SVG emitters."""
import numpy as np
from matplotlib.path import Path as MPath
from scipy.spatial import cKDTree
def f2(v):
    s=('%.2f'%v).rstrip('0').rstrip('.');return '0' if s in('-0','') else s
def hx(c): return '#%02X%02X%02X'%tuple(int(round(min(255,max(0,v)))) for v in c)
def lin(P,A,B):
    v=B-A;return ((P-A)@v)/(v@v)
def stops_rgb(t,offs,cols):
    return np.stack([np.interp(t,offs,cols[:,k]) for k in range(3)],-1)
def lin_color(P,A,B,m,cols):
    return stops_rgb(lin(P,A,B),[0,m,1.0],cols)
def lg_svg(id,A,B,m,cols,opac=None):
    st=''
    for o,c,a in zip([0,m,1],cols,opac if opac is not None else [1,1,1]):
        st+='<stop offset="%s" stop-color="%s"%s/>'%(f2(o),hx(c),'' if a>=1 else ' stop-opacity="%s"'%f2(a))
    return '<linearGradient id="%s" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s">%s</linearGradient>'%(id,f2(A[0]),f2(A[1]),f2(B[0]),f2(B[1]),st)
# ------------------------------------------------------------------ HEAVEN
class Heaven:
    n=36
    names='A1x A1y B1x B1y m1 c0r c0g c0b c1r c1g c1b c2r c2g c2b Cx Cy r w A2x A2y B2x B2y m2 c3r c3g c3b c4r c4g c4b c5r c5g c5b s a d b'.split()
    @staticmethod
    def init():
        return np.array([466,161,725,513,0.83, 2,107,72, 2,212,106, 107,239,168,
                         850,470,260,40, 534,477,737,509,0.5, 7,190,100, 60,215,130, 107,239,168,
                         0.1,40,0,60],float)
    @staticmethod
    def bounds():
        lo=np.array([-200,-200,450,250,0.3, 0,50,30, 0,100,40, 0,150,80, 600,300,150,6, 300,200,600,300,0.1, 0,100,40, 0,150,70, 60,190,110, 0,5,-30,5],float)
        hi=np.array([700,500,1100,900,0.95, 30,140,100, 90,230,150, 200,255,220, 1100,650,380,90, 900,700,1300,800,0.9, 90,230,150, 160,250,200, 220,255,230, 0.4,120,60,120],float)
        return lo,hi
    @staticmethod
    def extra(th):
        return np.array([max(0,300-np.hypot(*(th[2:4]-th[0:2])))*0.3,max(0,200-np.hypot(*(th[20:22]-th[18:20])))*0.3])
    @staticmethod
    def color(P,th):
        A1=th[0:2];B1=th[2:4];m1=th[4];c=th[5:14].reshape(3,3)
        base=lin_color(P,A1,B1,m1,c)
        C=th[14:16];r,w=th[16],th[17]
        A2=th[18:20];B2=th[20:22];m2=th[22];c2=th[23:32].reshape(3,3)
        front=lin_color(P,A2,B2,m2,c2)
        d=np.hypot(*(P-C).T)
        m=np.clip((r+w-d)/(2*w),0,1);m=np.where(P[:,0]>=C[0],1.0,m)
        out=base*(1-m[:,None])+front*m[:,None]
        s,a,dl,b=th[32:36]
        al=np.interp(d,[r-a,r+dl,r+b],[0,s,0],left=0,right=0)*(P[:,0]<C[0])
        return out*(1-al[:,None])
    @staticmethod
    def svg(th,arm_clip='clip-heaven',prefix='h'):
        A1=th[0:2];B1=th[2:4];m1=th[4];c=th[5:14].reshape(3,3)
        C=th[14:16];r,w=th[16],th[17]
        A2=th[18:20];B2=th[20:22];m2=th[22];c2=th[23:32].reshape(3,3)
        s,a,dl,b=th[32:36]
        defs=[lg_svg(prefix+'-base',A1,B1,m1,c),lg_svg(prefix+'-front',A2,B2,m2,c2)]
        R=r+w
        defs.append('<radialGradient id="%s-soft" gradientUnits="userSpaceOnUse" cx="%s" cy="%s" r="%s"><stop offset="%s" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>'%(prefix,f2(C[0]),f2(C[1]),f2(R),f2((r-w)/R)))
        defs.append('<mask id="%s-front-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="960"><circle cx="%s" cy="%s" r="%s" fill="url(#%s-soft)"/><rect x="%s" y="0" width="%s" height="960" fill="#fff"/></mask>'%(prefix,f2(C[0]),f2(C[1]),f2(R),prefix,f2(C[0]),f2(960-C[0])))
        Rc=r+b
        offs=[(r-a)/Rc,(r+dl)/Rc]
        defs.append('<radialGradient id="%s-crease" gradientUnits="userSpaceOnUse" cx="%s" cy="%s" r="%s"><stop offset="%s" stop-color="#000" stop-opacity="0"/><stop offset="%s" stop-color="#000" stop-opacity="%s"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'%(prefix,f2(C[0]),f2(C[1]),f2(Rc),f2(max(0,offs[0])),f2(offs[1]),f2(s)))
        xl_=max(0,C[0]-R);xc_=max(0,C[0]-Rc)
        layers=['<rect id="%s-front-layer" x="%s" y="0" width="%s" height="960" fill="url(#%s-front)" mask="url(#%s-front-mask)"/>'%(prefix,f2(xl_),f2(960-xl_),prefix,prefix),
                '<rect id="%s-crease-layer" x="%s" y="0" width="%s" height="960" fill="url(#%s-crease)"/>'%(prefix,f2(xc_),f2(C[0]-xc_),prefix)]
        return defs,layers,'url(#%s-base)'%prefix
# ------------------------------------------------------------------ EARTH
def edge_poly(xl,yv,Qx,Qy,phi,h1,h2,n=30):
    P0=np.array([xl,yv]);Q=np.array([Qx,Qy]);dq=np.array([np.cos(phi),-np.sin(phi)])
    P1=P0+np.array([0,-h1]);P2=Q-dq*h2
    t=np.linspace(0,1,n)[:,None]
    c=(1-t)**3*P0+3*(1-t)**2*t*P1+3*(1-t)*t**2*P2+t**3*Q
    return c,np.array([xl,1200.]),np.array([1200.,Qy+1200*np.tan(0)]),dq
def front_poly(xl,yv,Qx,Qy,phi,h1,h2):
    c,bl,_,dq=edge_poly(xl,yv,Qx,Qy,phi,h1,h2)
    far=np.array([Qx,Qy])+dq*1500
    return np.vstack([[xl,1500],c,far,[far[0],1500]])
class Earth:
    n=41
    names=('A1x A1y B1x B1y m1 c0r c0g c0b c1r c1g c1b c2r c2g c2b Asx Asy Bsx Bsy s os xl yv Qx Qy phi h1 h2 A2x A2y B2x B2y m2 c3r c3g c3b c4r c4g c4b c5r c5g c5b').split()
    @staticmethod
    def init():
        return np.array([347,359,88,204,0.83, 1,48,36, 2,102,71, 4,10,10,
                         470,500,300,500,0.4,0.2, 293.5,489,359,430.4,np.radians(30),34,30,
                         472,1158,27,712,0.9, 2,102,71, 2,60,45, 1,30,25],float)
    @staticmethod
    def bounds():
        lo=np.array([-600,-600,-600,-600,0.05, *[0]*9, 100,100,100,100,0,0, 270,420,320,380,0.0,5,5, -600,-600,-600,-600,0.05, *[0]*9],float)
        hi=np.array([1600,1600,1600,1600,0.95, *[255]*9, 900,900,900,900,0.8,0.95, 330,560,420,480,1.2,200,200, 1600,1600,1600,1600,0.95, *[255]*9],float)
        return lo,hi
    @staticmethod
    def extra(th):
        return np.array([max(0,300-np.hypot(*(th[2:4]-th[0:2])))*0.3,max(0,200-np.hypot(*(th[29:31]-th[27:29])))*0.3])
    @staticmethod
    def front_cov(P,th,eps=2.0):
        poly=front_poly(*th[20:27]);path=MPath(poly)
        ins=path.contains_points(P)
        d,_=cKDTree(poly).query(P)  # polygon vertices only; dense enough near edge
        # dense edge sample for accuracy
        return ins,d
    @staticmethod
    def color(P,th,eps=1.5):
        A1=th[0:2];B1=th[2:4];m1=th[4];c=th[5:14].reshape(3,3)
        base=lin_color(P,A1,B1,m1,c)
        As=th[14:16];Bs=th[16:18];s=th[18];os=th[19]
        t=lin(P,As,Bs);al=s*np.clip((t-os)/(1-os),0,1)
        base=base*(1-al[:,None])
        A2=th[27:29];B2=th[29:31];m2=th[31];c2=th[32:41].reshape(3,3)
        front=lin_color(P,A2,B2,m2,c2)
        poly=front_poly(*th[20:27]);ins=MPath(poly).contains_points(P)
        # dense polyline for distance
        d,_=cKDTree(dense(poly)).query(P)
        sd=np.where(ins,-d,d);cov=np.clip(0.5-sd/(2*eps),0,1)
        return base*(1-cov[:,None])+front*cov[:,None]
    @staticmethod
    def svg(th,prefix='e'):
        A1=th[0:2];B1=th[2:4];m1=th[4];c=th[5:14].reshape(3,3)
        As=th[14:16];Bs=th[16:18];s=th[18];os=th[19]
        A2=th[27:29];B2=th[29:31];m2=th[31];c2=th[32:41].reshape(3,3)
        defs=[lg_svg(prefix+'-base',A1,B1,m1,c),lg_svg(prefix+'-front',A2,B2,m2,c2)]
        defs.append('<linearGradient id="%s-shadow" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s"><stop offset="%s" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="%s"/></linearGradient>'%(prefix,f2(As[0]),f2(As[1]),f2(Bs[0]),f2(Bs[1]),f2(os),f2(s)))
        xl,yv,Qx,Qy,phi,h1,h2=th[20:27];dq=np.array([np.cos(phi),-np.sin(phi)]);P2=np.array([Qx,Qy])-dq*h2
        far=np.array([Qx,Qy])+dq*1500
        d='M%s 1500V%sC%s %s %s %s %s %sL%s %sV1500Z'%(f2(xl),f2(yv),f2(xl),f2(yv-h1),f2(P2[0]),f2(P2[1]),f2(Qx),f2(Qy),f2(far[0]),f2(far[1]))
        layers=['<rect id="%s-shadow-layer" x="0" y="0" width="%s" height="960" fill="url(#%s-shadow)"/>'%(prefix,f2(xl+10),prefix),
                '<path id="%s-front-layer" d="%s" fill="url(#%s-front)"/>'%(prefix,d,prefix)]
        return defs,layers,'url(#%s-base)'%prefix
def dense(poly,step=1.0):
    out=[]
    for a,b in zip(poly[:-1],poly[1:]):
        n=max(2,int(np.hypot(*(b-a))/step));t=np.linspace(0,1,n,endpoint=False)[:,None];out.append(a+(b-a)*t)
    return np.vstack(out)
