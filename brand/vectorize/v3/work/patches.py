import json,re,subprocess,numpy as np
from PIL import Image
from sp import *
from sheets import render_mark,bgcol,V3,regs
fin=json.load(open('final_H2.json'));N=fin['N']
z=np.r_[np.array(fin['A']).ravel(),fin['th'],fin['hi'],fin['ho']]
o=spl(z,N,60);polys={'heaven':o,'earth':960-o}
PH=[('top lobe L',(420,160)),('top lobe R',(560,150)),('neck',(600,330)),('front L',(690,440)),('front mid',(790,480)),('front R',(890,480)),('top lobe low',(480,300))]
PE=[('left lobe L',(150,480)),('left lobe mid',(300,440)),('crease',(380,520)),('bottom top',(420,640)),('bottom mid',(470,780)),('bottom low',(480,880)),('bottom R',(560,720))]
res={}
for pal,inst,svgf in (('light','wersja-jasna','mark.svg'),('dark','wersja-ciemna','mark-dark.svg'),('podstawowy','podstawowy','mark-podstawowy.svg'),('na-jasnym','na-jasnym','mark-na-jasnym.svg')):
    box=INSTANCES[inst];x0,y0,w,h=box;reg=regs[inst]
    render_mark(str(V3/svgf),box,reg,1,'_p.png',bg=bgcol(box))
    ren=np.asarray(Image.open('_p.png').convert('RGB')).astype(float);ref=board[y0:y0+h,x0:x0+w]
    s,tx,ty=reg;rr=2 if w>150 else 1
    res[pal]={}
    for arm,PL in (('heaven',PH),('earth',PE)):
        lst=[]
        for lab,vb in PL:
            if not MPath(polys[arm]).contains_point(vb): continue
            px=np.array(vb)-480;px=px*s+np.array([tx,ty]);xi,yi=int(round(px[0]-0.5)),int(round(px[1]-0.5))
            a=ref[yi-rr:yi+rr+1,xi-rr:xi+rr+1].reshape(-1,3).mean(0);b=ren[yi-rr:yi+rr+1,xi-rr:xi+rr+1].reshape(-1,3).mean(0)
            lst.append((lab,tuple(int(v) for v in a),tuple(int(v) for v in b),float(np.linalg.norm(a-b))))
        res[pal][arm]=lst
    for arm in ('heaven','earth'):
        d=[p[3] for p in res[pal][arm]];print(pal,arm,'patches',len(d),'mean dRGB %.1f'%np.mean(d),[round(x,1) for x in d])
    allp=[p[3] for arm in ('heaven','earth') for p in res[pal][arm]];res[pal]['mean']=float(np.mean(allp))
    print(pal,'MEAN',round(np.mean(allp),2))
json.dump(res,open('patch_results.json','w'),indent=1)
