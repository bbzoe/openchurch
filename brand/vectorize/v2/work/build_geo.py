import numpy as np, json
from bez import *
z=np.load('xj.npy');nx=31;x=z[:nx];c=z[nx:]
d,P,segs=path(x)
cx,cy,R=d['cx'],d['cy'],d['R']
allp=np.vstack([outline(x,80),2*c-outline(x,80)])
W=np.ptp(allp,axis=0)
s=960/W[0]
def T(p): return (np.asarray(p)-c)*s+480.0
def f(v): return ('%.2f'%v).rstrip('0').rstrip('.')
def pt(p): return f(p[0])+' '+f(p[1])
def make(rot=False):
    def Q(p):
        q=T(p)
        return 960-q if rot else q
    top=cy-R;bot=cy+R
    out=[]
    out.append('M'+pt(Q([d['P9x'],top])))
    out.append('L'+pt(Q([cx,top])))
    r=R*s
    out.append(f'A{f(r)} {f(r)} 0 0 {1}'+' '+pt(Q([cx,bot])))   # sweep: clockwise on screen (rot keeps)
    out.append('L'+pt(Q([d['P2x'],bot])))
    for a,b,cc,dd in segs:
        out.append('C'+pt(Q(b))+' '+pt(Q(cc))+' '+pt(Q(dd)))
    out.append('Z')
    return ''.join(out)
heaven=make(False);earth=make(True)
geo=dict(scale=s,center_ref=c.tolist(),R_vb=R*s,bbox_ref=W.tolist())
json.dump(dict(heaven=heaven,earth=earth,meta=geo),open('geo_raw.json','w'),indent=1)
print(heaven);print(earth);print(geo)
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><path id="heaven" d="{heaven}" fill="#0F3D2E"/><path id="earth" d="{earth}" fill="#0F3D2E"/></svg>'''
open('draft_mono.svg','w').write(svg)
