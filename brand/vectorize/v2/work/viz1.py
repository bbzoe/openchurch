import numpy as np, json, sys
from PIL import Image, ImageDraw
from arm import *
from scipy.spatial import cKDTree
C=[np.array(c) for c in json.load(open('contours_light.json'))]
P=dict(R=29.58,tx=149.1,ty=71.61,lx=191.2,rx=201.96,y0=122.21,f1=36.93,f2=17.07)
o=outline(P,60)
S=5;ox,oy=40,30
im=Image.open('board.jpg').convert('RGB').crop((ox,oy,260,215)).resize((220*S,185*S),Image.LANCZOS)
d=ImageDraw.Draw(im)
f=lambda p:[((x-ox)*S,(y-oy)*S) for x,y in p]
d.line(f(o)+[f(o)[0]],fill=(255,0,0),width=1)
dd,_=cKDTree(o).query(C[0])
for p,e in zip(C[0],dd):
    if e>1.5: d.ellipse([ (p[0]-ox)*S-3,(p[1]-oy)*S-3,(p[0]-ox)*S+3,(p[1]-oy)*S+3],outline=(0,0,255))
im.save('viz1.png')
