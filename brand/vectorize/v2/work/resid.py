import numpy as np, json
from arm import *
from scipy.spatial import cKDTree
C=[np.array(c) for c in json.load(open('contours_light.json'))]
P=dict(RT=29.91,R=29.13,tx=149.34,ty=71.87,lx=190.6,rx=202.54,y0=122.19,f1=32.55,f2=16.53)
o=outline(P,200)
tree=cKDTree(o)
# signed: positive if contour outside model: use distance to model centre approx via polygon test
from matplotlib.path import Path
poly=Path(o)
for k in range(0,len(C[0]),9):
    p=C[0][k]; d,_=tree.query(p); s=-1 if poly.contains_point(p) else 1
    print(k,np.round(p,1),round(s*d,2))
