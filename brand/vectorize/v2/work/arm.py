import numpy as np
def ci(c1,r1,c2,r2,side):
    d=np.hypot(*(c2-c1)); a=(r1**2-r2**2+d**2)/(2*d); h=np.sqrt(max(r1**2-a**2,0))
    u=(c2-c1)/d; p=c1+a*u; n=np.array([-u[1],u[0]])
    return p+side*h*n
def ang(c,p): return np.arctan2(p[1]-c[1],p[0]-c[0])
def arcpts(c,r,a0,a1,sweep,n=60):
    d=(a1-a0)
    if sweep>0: d=d%(2*np.pi)
    else: d=-((-d)%(2*np.pi))
    a=a0+np.linspace(0,1,n)*d
    return np.c_[c[0]+r*np.cos(a),c[1]+r*np.sin(a)]
def build(P):
    """Returns ordered primitive list: ('A',c,r,a0,a1,sweep) or ('L',p0,p1). Params: RT (top circle radius), R (capsule radius), tx,ty,lx,rx,y0,f1,f2"""
    RT=P['RT'];R=P['R'];t=np.array([P['tx'],P['ty']]);l=np.array([P['lx'],P['y0']]);r=np.array([P['rx'],P['y0']])
    f1=P['f1'];f2=P['f2']
    fy=P['y0']-R-f2
    dx=np.sqrt((RT+f2)**2-(fy-t[1])**2); F2=np.array([t[0]+dx,fy])
    c=[ci(t,RT+f1,l,R+f1,s) for s in (1,-1)]
    F1=min(c,key=lambda p:p[0])
    T_F1=t+(F1-t)*RT/np.hypot(*(F1-t)); T_F2=t+(F2-t)*RT/np.hypot(*(F2-t))
    L_F1=l+(F1-l)*R/np.hypot(*(F1-l))
    topP=np.array([F2[0],P['y0']-R])
    prim=[('A',t,RT,ang(t,T_F1),ang(t,T_F2),+1),
          ('A',F2,f2,ang(F2,T_F2),ang(F2,topP),-1),
          ('L',topP,np.array([r[0],P['y0']-R])),
          ('A',r,R,-np.pi/2,np.pi/2,+1),
          ('L',np.array([r[0],P['y0']+R]),np.array([l[0],P['y0']+R])),
          ('A',l,R,np.pi/2,ang(l,L_F1),+1),
          ('A',F1,f1,ang(F1,L_F1),ang(F1,T_F1),-1)]
    return prim
def outline(P,n=60):
    out=[]
    for p in build(P):
        if p[0]=='A': out.append(arcpts(p[1],p[2],p[3],p[4],p[5],n))
        else: out.append(np.array([p[1],p[2]]))
    return np.vstack(out)
