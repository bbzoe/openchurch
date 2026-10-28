import sys,json,numpy as np
from sp import *
from shade import *
from PIL import Image
tag=sys.argv[1];N=int(sys.argv[2]);pal=sys.argv[3];inst=sys.argv[4]
fin=json.load(open(f'final_{tag}.json'));z=np.r_[np.array(fin['A']).ravel(),fin['th'],fin['hi'],fin['ho']];regs={n:np.array(fin['regs'][n]) for n in NAMES}
o=spl(z,N,40);polys={'heaven':o,'earth':960-o}
fit=json.load(open(f'palettes_fit_{tag}_{pal}.json'))[pal]
x0,y0,w,h=INSTANCES[inst];s,tx,ty=regs[inst][:3]
gy,gx=np.mgrid[0:h,0:w];G=np.c_[gx.ravel()+0.5,gy.ravel()+0.5]
VB=(G-np.array([tx,ty]))/s+480
out=np.zeros((h*w,3));ref=board[y0:y0+h,x0:x0+w].reshape(-1,3)
for arm,Model in (('heaven',Heaven),('earth',Earth)):
    th=np.array(fit[arm]['theta']);ins=MPath((polys[arm]-480)*s+np.array([tx,ty])).contains_points(G)
    out[ins]=Model.color(VB[ins],th)
inside=out.sum(1)>0
diff=np.abs(out-ref).sum(1)*inside
Z=4
im=lambda a:Image.fromarray(a.reshape(h,w,3).clip(0,255).astype(np.uint8)).resize((w*Z,h*Z),Image.LANCZOS)
d=np.clip(diff*3,0,255);dimg=Image.fromarray(np.stack([d]*3,-1).reshape(h,w,3).astype(np.uint8)).resize((w*Z,h*Z),Image.NEAREST)
sheet=Image.new('RGB',(w*Z*3+20,h*Z),(255,255,255));sheet.paste(im(ref),(0,0));sheet.paste(im(np.where(inside[:,None],out,ref)),(w*Z+10,0));sheet.paste(dimg,(2*w*Z+20,0));sheet.save(f'viz_{pal}.png')
