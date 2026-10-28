import numpy as np, json
from emit import emit
from colfit import hexc
x=np.load('xn.npy')
HV=emit(x);ER=emit(x,True)
import sys
cp=json.load(open('colparams.json'))
cpd=json.load(open('colparams_dark.json'))
def f(v):
    s=('%.2f'%v).rstrip('0').rstrip('.');return '0' if s in('-0','') else s
def hx(c): return '#%02X%02X%02X'%tuple(int(round(min(255,max(0,v)))) for v in c)
def lerp(a,b,t): return a+(b-a)*t
def stopline(o,c,op=None):
    s='<stop offset="%s" stop-color="%s"'%(f(o),c)
    if op is not None and op<1: s+=' stop-opacity="%s"'%f(op)
    return s+'/>'
def lg(id,A,B,stops):
    return '<linearGradient id="%s" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s">%s</linearGradient>'%(id,f(A[0]),f(A[1]),f(B[0]),f(B[1]),''.join(stops))
def clampgrad(A,B,pts):
    """pts: list of (t,color(rgb array),opacity). Reparam so all t in [0,1]; extend B if needed, shift A if t<0."""
    t=[p[0] for p in pts];tmin=min(0,min(t));tmax=max(1,max(t))
    A=np.array(A,float);B=np.array(B,float);v=B-A
    A2=A+v*tmin;B2=A+v*tmax
    return A2,B2,[((p[0]-tmin)/(tmax-tmin),p[1],p[2]) for p in pts]

def halfplane(poly,A,B,t0,keep_greater=True):
    A=np.array(A,float);B=np.array(B,float);v=B-A
    tf=lambda p:((p-A)@v)/(v@v)-t0
    out=[]
    for i in range(len(poly)):
        p,q=poly[i],poly[(i+1)%len(poly)];fp,fq=tf(p),tf(q)
        if not keep_greater: fp,fq=-fp,-fq
        if fp>=0: out.append(p)
        if (fp>=0)!=(fq>=0):
            u=fp/(fp-fq);out.append(p+(q-p)*u)
    return out
def polyd(poly): return 'M'+'L'.join('%s %s'%(f(p[0]),f(p[1])) for p in poly)+'Z'
SQ=[np.array(p,float) for p in ((0,0),(960,0),(960,960),(0,960))]

def build(variant):
    free=variant in('sampled','ondark')
    src=cpd if variant=='ondark' else cp
    defs=[];body=[]
    ph=np.array(src['heaven_free' if free else 'heaven_official']);pe=np.array(src['earth_free' if free else 'earth_official'])
    cH=ph[15:24].reshape(3,3) if free else np.array([hexc('#0F3D2E'),hexc('#22C55E'),hexc('#86EFAC')])
    cE=pe[10:19].reshape(3,3) if free else np.array([hexc('#0A2E22'),hexc('#16A34A'),hexc('#22C55E')])
    # heaven base
    A1,B1,m1=ph[0:2],ph[2:4],ph[4]
    A,B,st=clampgrad(A1,B1,[(0,cH[0],1),(m1,cH[1],1),(1,cH[2],1)])
    defs.append(lg('heaven-base',A,B,[stopline(o,hx(c)) for o,c,_ in st]))
    # heaven overlay
    A2,B2,o0,o1=ph[5:7],ph[7:9],ph[9],ph[10]
    c0=cH[1];c1=cH[2];cat=lerp(c0,c1,(o1-o0)/(1-o0))
    A,B,st=clampgrad(A2,B2,[(o0,c0,0),(o1,cat,1),(1,c1,1)] if o1<1 else [(o0,c0,0),(1,c1,1)])
    defs.append(lg('heaven-fold',A,B,[stopline(o,hx(c),op) for o,c,op in st]))
    # heaven crease shadow
    s,q0,q1,q2=ph[11:15]
    A,B,st=clampgrad(A2,B2,[(q0,np.zeros(3),0),(q1,np.zeros(3),s),(q2,np.zeros(3),0)])
    defs.append(lg('heaven-crease',A,B,[stopline(o,'#000000',op) for o,c,op in st]))
    # earth
    A1,B1,m1=pe[0:2],pe[2:4],pe[4]
    A,B,st=clampgrad(A1,B1,[(0,cE[0],1),(m1,cE[1],1),(1,cE[2],1)])
    defs.append(lg('earth-base',A,B,[stopline(o,hx(c)) for o,c,_ in st]))
    A2,B2,m2=pe[5:7],pe[7:9],pe[9]
    A,B,st=clampgrad(A2,B2,[(0,cE[0],1),(m2,cE[1],1),(1,cE[2],1)])
    defs.append(lg('earth-fold',A,B,[stopline(o,hx(c)) for o,c,_ in st]))
    defs.append('<clipPath id="clip-heaven"><use href="#heaven"/></clipPath>')
    defs.append('<clipPath id="clip-earth"><use href="#earth"/></clipPath>')
    A2n,B2n=ph[5:7],ph[7:9]
    FOLD=polyd(halfplane(SQ,A2n,B2n,ph[9]))
    CREASE=polyd(halfplane(halfplane(SQ,A2n,B2n,ph[11+1]),A2n,B2n,ph[11+3],False))
    ov='M293.5 1100V489C293.5 455 333 445 359 430.4H1100V1100Z'
    body.append('<g id="heaven-arm"><path id="heaven" d="%s" fill="url(#heaven-base)"/><g clip-path="url(#clip-heaven)"><path id="heaven-fold-layer" d="%s" fill="url(#heaven-fold)"/><path id="heaven-crease-layer" d="%s" fill="url(#heaven-crease)"/></g></g>'%(HV,FOLD,CREASE))
    body.append('<g id="earth-arm"><path id="earth" d="%s" fill="url(#earth-base)"/><g clip-path="url(#clip-earth)"><path id="earth-fold-layer" d="%s" fill="url(#earth-fold)"/></g></g>'%(ER,ov))
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><title>OpenChurch mark</title><defs>%s</defs>%s</svg>'%(''.join(defs),''.join(body))
    return svg,defs,ov
if __name__=='__main__':
    for v,name in (('official','mark.svg'),('sampled','mark-sampled.svg'),('ondark','mark-on-dark.svg')):
        svg,defs,ov=build(v);open(name,'w').write(svg);print(name,len(svg))
    mono='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><title>OpenChurch mark (mono)</title><g fill="#0F3D2E"><path id="heaven" d="%s"/><path id="earth" d="%s"/></g></svg>'%(HV,ER)
    open('mark-mono.svg','w').write(mono)
