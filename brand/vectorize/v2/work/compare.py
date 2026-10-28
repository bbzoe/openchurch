import numpy as np, json, subprocess, sys, cv2, re
from PIL import Image
from scipy import ndimage as ndi
from scipy.optimize import minimize
from alpha import alpha
from bez import outline
INST={
 'light':dict(src='board.jpg',box=(20,30,260,210),bg=(248,250,244),close=0,t0=(145.53,123.34),a0=0.18035,minsize=1000),
 'dark':dict(src='board.jpg',box=(520,30,780,210),bg=(1,27,18),close=5,t0=(647.0,123.43),a0=0.17957,minsize=1000),
 'onepager':dict(src='onepager.png',box=(55,115,150,210),bg=(255,255,255),close=0,t0=(101.5,160.5),a0=0.078,minsize=300),
}
x=np.load('xn.npy');POL=[outline(x,80),960-outline(x,80)]
def refmask(I,S=4):
    c,A,keep=alpha(I['box'],I['bg'],I['src'],I['minsize'])
    H,W=A.shape
    R=cv2.resize(A,(W*S,H*S),interpolation=cv2.INTER_CUBIC)>0.5
    if I['close']:
        k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*I['close']*S+1,2*I['close']*S+1))
        R=cv2.morphologyEx(R.astype(np.uint8),cv2.MORPH_CLOSE,k)>0
    return ndi.binary_fill_holes(R),A,(H,W),c
def rast(a,t,I,shape,S=4):
    H,W=shape;m=np.zeros((H*S,W*S),np.uint8)
    for p in POL:
        q=(a*(p-480)+np.array(t)-np.array(I['box'][:2]))*S
        cv2.fillPoly(m,[np.round(q*16).astype(np.int32)],1,shift=4)
    return m>0
def register(I):
    R,A,shape,c=refmask(I)
    def neg(p):
        m=rast(p[0],p[1:3],I,shape);return -(m&R).sum()/(m|R).sum()
    r=minimize(neg,[I['a0'],*I['t0']],method='Nelder-Mead',options=dict(xatol=1e-4,fatol=1e-7,maxiter=500))
    # restart once
    r=minimize(neg,r.x,method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=500))
    return r.x,-r.fun
def render(svgfile,I,a,t,out,transparent=False,scale=1):
    x0,y0,x1,y1=I['box'];W=x1-x0;H=y1-y0
    vx=(x0-t[0])/a+480;vy=(y0-t[1])/a+480;vw=W/a;vh=H/a
    s=open(svgfile).read()
    s=re.sub(r'viewBox="0 0 960 960" width="960" height="960"','viewBox="%f %f %f %f" width="%d" height="%d"'%(vx,vy,vw,vh,W*scale,H*scale),s,count=1)
    tmp='_tmp.svg';open(tmp,'w').write(s)
    bg='#%02X%02X%02X'%I['bg']
    cmd=['rsvg-convert',tmp,'-o',out]
    if not transparent: cmd+=['--background-color',bg]
    subprocess.check_call(cmd)
def patches():
    H=[('H top-lobe L',(420,200)),('H top-lobe R',(580,150)),('H neck',(600,360)),('H fold L',(690,430)),('H fold mid',(780,470)),('H cap R',(890,480))]
    E=[('E left-lobe L',(200,490)),('E left-lobe mid',(300,420)),('E crease',(370,520)),('E bottom top',(420,640)),('E bottom mid',(450,780)),('E bottom btm',(500,880))]
    return H+E
def run(svgfile,tag,names=('light','dark','onepager'),regs=None,write=True):
    res={}
    for nm in names:
        I=INST[nm]
        if regs and nm in regs: a,t,iou4=regs[nm]
        else:
            p,iou4=register(I);a,t=p[0],p[1:3]
        out=f'_r_{nm}.png';render(svgfile,I,a,t,out)
        render(svgfile,I,a,t,'_ra_'+nm+'.png',transparent=True)
        R,A,shape,c=refmask(I,S=1)
        ren=np.asarray(Image.open(f'_ra_{nm}.png').convert('RGBA')).astype(float)
        M=ren[...,3]>127
        Rn=ndi.binary_fill_holes(A>0.5)
        if I['close']: Rn=ndi.binary_closing(Rn,iterations=I['close'])|Rn;Rn=ndi.binary_fill_holes(Rn)
        iou1=(M&Rn).sum()/(M|Rn).sum()
        # patches
        rgb=np.asarray(Image.open(out).convert('RGB')).astype(float)
        refim=c
        pl=[]
        for lab,vb in patches():
            px=a*(np.array(vb)-480)+np.array(t)-np.array(I['box'][:2])
            xi,yi=int(round(px[0])),int(round(px[1]));r=2 if nm!='onepager' else 1
            if not(0<=yi-r and yi+r<rgb.shape[0] and 0<=xi-r and xi+r<rgb.shape[1]): continue
            ins=M[yi,xi]
            rc=refim[yi-r:yi+r+1,xi-r:xi+r+1].reshape(-1,3).mean(0);mc=rgb[yi-r:yi+r+1,xi-r:xi+r+1].reshape(-1,3).mean(0)
            pl.append((lab,bool(ins),'#%02X%02X%02X'%tuple(int(v) for v in rc),'#%02X%02X%02X'%tuple(int(v) for v in mc),float(np.linalg.norm(rc-mc))))
        res[nm]=dict(a=float(a),t=[float(t[0]),float(t[1])],iou_4x=float(iou4),iou_native=float(iou1),patches=pl)
        if write:
            Z=3 if nm!='onepager' else 5
            refimg=Image.fromarray(refim.astype(np.uint8)).resize((refim.shape[1]*Z,refim.shape[0]*Z),Image.LANCZOS)
            ren_img=Image.open(out).convert('RGB').resize(refimg.size,Image.LANCZOS)
            # diff: silhouette diff red/blue + colour abs diff
            d=np.abs(np.asarray(refimg).astype(float)-np.asarray(ren_img).astype(float)).sum(2);d=np.clip(d*2,0,255).astype(np.uint8)
            diff=Image.fromarray(255-d).convert('RGB')
            W=refimg.width;sheet=Image.new('RGB',(W*3+20,refimg.height),(255,255,255))
            sheet.paste(refimg,(0,0));sheet.paste(ren_img,(W+10,0));sheet.paste(diff,(2*W+20,0))
            sheet.save(f'compare-{nm}{tag}.png')
    return res
if __name__=='__main__':
    svg=sys.argv[1];tag=sys.argv[2] if len(sys.argv)>2 else ''
    res=run(svg,tag)
    json.dump(res,open('compare_results%s.json'%tag,'w'),indent=1)
    for nm,r in res.items():
        print(nm,'a=%.5f (1/a=%.4f) t=%s IoU4x=%.4f IoUnative=%.4f'%(r['a'],1/r['a'],np.round(r['t'],2),r['iou_4x'],r['iou_native']))
        for p in r['patches']: print('   ',p[0],'in' if p[1] else 'OUT',p[2],p[3],'dRGB=%.1f'%p[4])
        pp=[p[4] for p in r['patches'] if p[1]];print('   mean dRGB',np.mean(pp))
