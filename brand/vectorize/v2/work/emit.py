import numpy as np, json, sys
from bez import *
def emit(x,rot=False):
    d,P,segs=path(x)
    cx,cy,R=d['cx'],d['cy'],d['R']
    f=lambda v:('%.2f'%v).rstrip('0').rstrip('.')
    Q=lambda p:(960-np.asarray(p)) if rot else np.asarray(p)
    pt=lambda p:f(Q(p)[0])+' '+f(Q(p)[1])
    top=cy-R;bot=cy+R
    o=['M'+pt([d['P9x'],top]),'L'+pt([cx,top]),'A%s %s 0 0 1 %s'%(f(R),f(R),pt([cx,bot])),'L'+pt([d['P2x'],bot])]
    for a,b,cc,dd in segs: o.append('C'+pt(b)+' '+pt(cc)+' '+pt(dd))
    o.append('Z')
    return ''.join(o)
if __name__=='__main__':
    x=np.load(sys.argv[1])
    h,e=emit(x),emit(x,True)
    json.dump(dict(heaven=h,earth=e,meta=dict(scale=1.0,center_ref=[480,480])),open('geo_raw.json','w'),indent=1)
    open('draft_mono.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" width="960" height="960"><path id="heaven" d="{h}" fill="#0F3D2E"/><path id="earth" d="{e}" fill="#0F3D2E"/></svg>')
    print(h);print(e)
