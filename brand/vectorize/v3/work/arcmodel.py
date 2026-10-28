import numpy as np
def tang(a): return np.array([-np.sin(a),np.cos(a)])
def cubic(p0,p1,p2,p3,n=30,end=False):
    t=np.linspace(0,1,n,endpoint=end)[:,None];return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def arcpts(c,R,a0,a1,n=60):
    a=np.linspace(a0,a1,n,endpoint=False);return np.c_[c[0]+R*np.cos(a),c[1]+R*np.sin(a)]
def unpack(z):
    return dict(t=z[0:5],c=z[5:10],k1=z[10:17],k2=z[17:24])
def geometry(z):
    d=unpack(z);tcx,tcy,tR,ta0,ta1=d['t'];ccx,ccy,cR,ca0,ca1=d['c']
    tc=np.array([tcx,tcy]);cc=np.array([ccx,ccy])
    S_t=tc+tR*np.array([np.cos(ta0),np.sin(ta0)]);E_t=tc+tR*np.array([np.cos(ta1),np.sin(ta1)])
    S_c=cc+cR*np.array([np.cos(ca0),np.sin(ca0)]);E_c=cc+cR*np.array([np.cos(ca1),np.sin(ca1)])
    u_St=tang(ta0);u_Et=tang(ta1);u_Sc=tang(ca0);u_Ec=tang(ca1)
    def conn(A,uA,B,uB,k):
        ix,iy,th,h1,h2,h3,h4=k;I=np.array([ix,iy]);uI=np.array([np.cos(th),np.sin(th)])
        return [(A,A+uA*h1,I-uI*h2,I),(I,I+uI*h3,B-uB*h4,B)]
    c1=conn(E_t,u_Et,S_c,u_Sc,d['k1']);c2=conn(E_c,u_Ec,S_t,u_St,d['k2'])
    return dict(tc=tc,tR=tR,ta0=ta0,ta1=ta1,cc=cc,cR=cR,ca0=ca0,ca1=ca1,S_t=S_t,E_t=E_t,S_c=S_c,E_c=E_c,c1=c1,c2=c2)
def outline(z,n=30):
    g=geometry(z);o=[arcpts(g['tc'],g['tR'],g['ta0'],g['ta1'],4*n)]
    for s in g['c1']: o.append(cubic(*s,n=n))
    o.append(arcpts(g['cc'],g['cR'],g['ca0'],g['ca1'],4*n))
    for s in g['c2']: o.append(cubic(*s,n=n))
    return np.vstack(o)
def path_d(z,rot=False,nd=2):
    g=geometry(z)
    f=lambda v:('%.*f'%(nd,v)).rstrip('0').rstrip('.') if abs(v)>=0.5*10**-nd else '0'
    T=(lambda a:np.array([960-a[0],960-a[1]])) if rot else (lambda a:np.asarray(a))
    pt=lambda a:f(T(a)[0])+' '+f(T(a)[1])
    sw=lambda a0,a1:1 if (a1-a0)%(2*np.pi)>np.pi else 0
    big=lambda a0,a1:1 if (a1-a0)>np.pi else 0
    s='M'+pt(g['S_t'])+'A%s %s 0 %d 1 %s'%(f(g['tR']),f(g['tR']),big(g['ta0'],g['ta1']),pt(g['E_t']))
    for c in g['c1']: s+='C'+pt(c[1])+' '+pt(c[2])+' '+pt(c[3])
    s+='A%s %s 0 %d 1 %s'%(f(g['cR']),f(g['cR']),big(g['ca0'],g['ca1']),pt(g['E_c']))
    for c in g['c2']: s+='C'+pt(c[1])+' '+pt(c[2])+' '+pt(c[3])
    return s+'Z'
