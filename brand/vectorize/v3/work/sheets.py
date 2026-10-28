import json,re,subprocess,numpy as np,sys
from PIL import Image,ImageDraw,ImageFont
from matplotlib import cm
from common import board,INSTANCES,NAMES
from matplotlib.path import Path as MPath
V3=__import__('pathlib').Path('..').resolve()
fin=json.load(open('final_H2.json'));regs={k:np.array(v) for k,v in fin['regs'].items()}
tiles={t['name']:t for t in json.load(open('tiles.json'))};flats=json.load(open('flats.json'))
def bgcol(box):
    x0,y0,w,h=box;c=board[y0:y0+h,x0:x0+w];b=np.concatenate([c[0],c[-1],c[:,0],c[:,-1]]);return '#%02X%02X%02X'%tuple(int(v) for v in np.median(b,0))
def render_mark(svgfile,box,reg,scale,out,bg=None,tile=None):
    x0,y0,w,h=box
    if reg is not None: s,tx,ty=reg[:3]
    txt=open(svgfile).read()
    if tile is None:
        vx=(0-tx)/s+480;vy=(0-ty)/s+480;vw=w/s;vh=h/s
        S0=None
    else:
        t=tiles[tile];side=(t['w']+t['h'])/2;tcx=t['x']+t['w']/2;tcy=t['y']+t['h']/2
        S=float(re.search(r'viewBox="0 0 ([\d.]+)',txt).group(1))
        vx=((x0-tcx)/side+0.5)*S;vy=((y0-tcy)/side+0.5)*S;vw=w/side*S;vh=h/side*S
    txt=re.sub(r'viewBox="[^"]*" width="[^"]*" height="[^"]*"','viewBox="%f %f %f %f" width="%d" height="%d"'%(vx,vy,vw,vh,w*scale,h*scale),txt,count=1)
    open('_tmp.svg','w').write(txt)
    cmd=['rsvg-convert','_tmp.svg','-o',out]
    if bg: cmd+=['--background-color',bg]
    subprocess.check_call(cmd)
ROWS=[('wersja-jasna','mark.svg','light',None),('wersja-ciemna','mark-dark.svg','dark',None),('podstawowy','mark-podstawowy.svg','podstawowy',None),
      ('na-jasnym','mark-na-jasnym.svg','na-jasnym',None),('mono','mark-mono-board.svg','mono',None),('negatyw','mark-negatyw.svg','negatyw',None),
      ('app-1024','app-icon.svg','app',('app',(526,250,92,90))),('pole-ochronne','mark-podstawowy.svg','podstawowy (stand-in)',None),('favicon-32','favicon-32.svg','favicon 32',('favicon32',(632,270,48,48)))]
def row(inst,svgf,palname,tileinfo,Z=4):
    if tileinfo:
        tn,box=tileinfo
        if inst=='app-1024': reg=None;iou=fin['iou'][inst]
        else: reg=None;iou=flats['favicon32']['iou']
    else:
        box=INSTANCES[inst];reg=regs[inst];iou=fin['iou'][inst]
    x0,y0,w,h=box
    bg=bgcol(INSTANCES[inst] if inst in INSTANCES else (632,270,48,48))
    if inst=='app-1024': bg=bgcol((520,240,110,110))
    ref=Image.fromarray(board[y0:y0+h,x0:x0+w].astype(np.uint8)).resize((w*Z,h*Z),Image.LANCZOS)
    render_mark(str(V3/svgf),box,reg,Z,'_row.png',bg=bg,tile=tileinfo[0] if tileinfo else None)
    ren=Image.open('_row.png').convert('RGB')
    d=np.abs(np.asarray(ref).astype(float)-np.asarray(ren).astype(float)).mean(2)
    heat=(cm.inferno(np.clip(d/80,0,1))[...,:3]*255).astype(np.uint8)
    return ref,ren,Image.fromarray(heat),iou,d.mean()
def sheet():
    rows=[row(*r) for r in ROWS]
    font=ImageFont.load_default(size=26);W=max(r[0].width for r in rows);gap=8;lab=36
    Hs=sum(r[0].height+lab+gap for r in rows)
    im=Image.new('RGB',(3*W+2*gap,Hs),(255,255,255));dr=ImageDraw.Draw(im);y=0
    for (inst,svgf,pn,ti),(a,b,c,iou,md) in zip(ROWS,rows):
        dr.text((4,y+4),'%s | %s (%s) | silhouette IoU %.4f | mean |diff| %.1f'%(inst,svgf,pn,iou,md),fill=(0,0,0),font=font)
        y+=lab
        for k,x in enumerate((a,b,c)): im.paste(x,(k*(W+gap),y))
        y+=a.height+gap
    im.save(V3/'zestawienie.png');print('sheet',im.size)
if __name__=='__main__': sheet()

def hero_sheet():
    import subprocess
    from scipy import ndimage
    from scipy.optimize import minimize
    from common import masks
    M=masks();font=ImageFont.load_default(size=30)
    def reg_for(svg_mono,inst):
        subprocess.check_call(['rsvg-convert','-w','960','-h','960',svg_mono,'-o','_m.png'])
        master=np.asarray(Image.open('_m.png').convert('RGBA'))[:,:,3]/255.0
        mask=M[inst]
        def iou(reg):
            s,tx,ty=reg;H,W=mask.shape;gy,gx=np.mgrid[0:H,0:W]
            vx=(gx+0.5-tx)/s+480;vy=(gy+0.5-ty)/s+480
            pred=ndimage.map_coordinates(master,[vy-0.5,vx-0.5],order=1,cval=0)
            a,b=mask>0.5,pred>0.5;return (a&b).sum()/(a|b).sum()
        a=mask>0.5;yy,xx=np.nonzero(a)
        r=minimize(lambda r:-iou(r),[np.sqrt(a.sum()/(master>0.5).sum()),xx.mean()+0.5,yy.mean()+0.5],method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-8,maxiter=800))
        return r.x,-r.fun
    V2=V3.parent/'v2'
    out=[]
    for inst,v2svg,v3svg,lbl in (('wersja-jasna','mark-sampled.svg','mark.svg','HERO LIGHT'),('wersja-ciemna','mark-on-dark.svg','mark-dark.svg','HERO DARK')):
        box=INSTANCES[inst];x0,y0,w,h=box;Z=6;bg=bgcol(box)
        reg2,iou2=reg_for(str(V2/'mark-mono.svg'),inst);reg3,iou3=reg_for(str(V3/'mark-mono.svg'),inst)
        ref=Image.fromarray(board[y0:y0+h,x0:x0+w].astype(np.uint8)).resize((w*Z,h*Z),Image.LANCZOS)
        render_mark(str(V2/v2svg),box,reg2,Z,'_h2.png',bg=bg);render_mark(str(V3/v3svg),box,reg3,Z,'_h3.png',bg=bg)
        r2=Image.open('_h2.png').convert('RGB');r3=Image.open('_h3.png').convert('RGB')
        hm=lambda im:Image.fromarray((cm.inferno(np.clip(np.abs(np.asarray(ref).astype(float)-np.asarray(im).astype(float)).mean(2)/80,0,1))[...,:3]*255).astype(np.uint8))
        out.append((lbl,ref,r2,r3,hm(r2),hm(r3),iou2,iou3))
    W=out[0][1].width;H=out[0][1].height;gap=10;lab=44
    im=Image.new('RGB',(5*W+4*gap,2*(H+lab)),(255,255,255));dr=ImageDraw.Draw(im)
    for i,(lbl,ref,r2,r3,h2,h3,i2,i3) in enumerate(out):
        y=i*(H+lab);dr.text((6,y+6),'%s | board | v2 (IoU %.4f) | v3 (IoU %.4f) | |diff| v2 | |diff| v3  (same scale, 6x)'%(lbl,i2,i3),fill=(0,0,0),font=font)
        for k,x in enumerate((ref,r2,r3,h2,h3)): im.paste(x,(k*(W+gap),y+lab))
    im.save(V3/'zestawienie-hero.png');print('hero',im.size)
if __name__=='__main__': hero_sheet()
