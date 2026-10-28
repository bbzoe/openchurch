import numpy as np
from joint import *
def cub(p0,p1,p2,p3,n):
    t=np.linspace(0,1,n,endpoint=False)[:,None];return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def unpack(z,N):
    return z[:2*N].reshape(N,2),z[2*N:3*N],z[3*N:4*N],z[4*N:5*N]
def spl(z,N,n=20,lines=()):
    A,th,hi,ho=unpack(z,N);u=np.c_[np.cos(th),np.sin(th)];out=[]
    for i in range(N):
        j=(i+1)%N
        if i in lines: out.append(np.linspace(A[i],A[j],n,endpoint=False))
        else: out.append(cub(A[i],A[i]+u[i]*ho[i],A[j]-u[j]*hi[j],A[j],n))
    return np.vstack(out)
def both_s(z,N,n=20,lines=()):
    o=spl(z,N,n,lines);return o,960-o
class SInst(Inst):
    N=10;lines=()
    def cov(s,z,reg):
        sc,tx,ty=reg[:3];SC=np.array([sc,sc]);o,o2=both_s(z,s.N,16,s.lines)
        O=np.vstack([o,o2]);Op=(O-480)*SC+np.array([tx,ty])
        d,_=cKDTree(Op).query(s.G);ins=np.zeros(len(s.G),bool)
        for q in (o,o2): ins|=MPath((q-480)*SC+np.array([tx,ty])).contains_points(s.G)
        sd=np.where(ins,-d,d);return np.clip(0.5-sd,0,1)
def raster_iou_s(z,N,reg,mask,S=8,lines=()):
    import cv2
    s,tx,ty=reg[:3];H,W=mask.shape;m=np.zeros((H*S,W*S),np.uint8)
    for q in both_s(z,N,40,lines):
        pp=((q-480)*s+np.array([tx,ty]))*S;cv2.fillPoly(m,[np.round(pp*16).astype(np.int32)],1,shift=4)
    cov=m.reshape(H,S,W,S).mean((1,3));a=mask>0.5;b=cov>0.5;return (a&b).sum()/(a|b).sum()
def p_to_spline(p):
    S=segs(p);P9,T0,Rt,B0,P2=p[0:2],p[2:4],p[4:6],p[6:8],p[8:10]
    A=np.array([P9,T0,Rt,B0,P2,p[10:12],p[13:15],p[16:18],p[18:20],p[20:22]])
    h=p[22:38]
    ut=(T0-P9)/np.hypot(*(T0-P9));ub=(P2-B0)/np.hypot(*(P2-B0))
    th=np.array([np.arctan2(*ut[::-1]),np.arctan2(*ut[::-1]),np.pi/2,np.arctan2(*ub[::-1]),np.arctan2(*ub[::-1]),p[12],p[15],-np.pi/2,0.0,np.pi/2])
    ch=lambda a,b:np.hypot(*(b-a))/3
    # segments: 0:P9->T0 line,1:T0->Rt (h0,h1),2:Rt->B0(h2,h3),3:B0->P2 line,4:P2->P3(h4,h5),5:P3->P4,6:P4->P5,7:P5->P6,8:P6->P7,9:P7->P9
    ho=np.array([ch(A[0],A[1]),h[0],h[2],ch(A[3],A[4]),h[4],h[6],h[8],h[10],h[12],h[14]])
    hi=np.zeros(10)
    hi[1]=ch(A[0],A[1]);hi[2]=h[1];hi[3]=h[3];hi[4]=ch(A[3],A[4]);hi[5]=h[5];hi[6]=h[7];hi[7]=h[9];hi[8]=h[11];hi[9]=h[13];hi[0]=h[15]
    return np.r_[A.ravel(),th,hi,ho]
