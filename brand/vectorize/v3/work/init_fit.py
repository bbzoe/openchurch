import numpy as np, subprocess, json
from PIL import Image
from skimage import measure
from scipy import ndimage as ndi
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from common import *
S=4
subprocess.check_call(['rsvg-convert','-w',str(960*S),'-h',str(960*S),'../../v2/work/consensus_rot.svg','-o','cons.png'])
a=np.asarray(Image.open('cons.png').convert('RGBA'))[...,3]/255.
cs=[c for c in measure.find_contours(ndi.gaussian_filter(a,1.0),0.5) if len(c)>500]
cs=[np.c_[c[:,1]+0.5,c[:,0]+0.5]/S for c in cs]
print([ (len(c),c.mean(0).round(1)) for c in cs])
# bbox width normalise to 960 about 480
allp=np.vstack(cs);k=960/np.ptp(allp[:,0]);cx=(allp[:,0].min()+allp[:,0].max())/2
print('k',k,'bbox',allp.min(0),allp.max(0))
cs=[(c-np.array([cx,480.0]))*k+480 for c in cs]
# note vertical centre: consensus frame centre 480 is rotation centre
heaven=[c for c in cs if c[:,0].mean()>480 and c[:,1].mean()<480][0]
np.save('cons_heaven.npy',heaven)
x=np.load('../../v2/work/xn.npy');p0=from_v2(x)
tree=cKDTree(heaven)
def res(p):
    o=outline(p,40)
    return np.r_[tree.query(o)[0],cKDTree(o).query(heaven)[0][::2]]
lo=np.full(NP,-np.inf);hi=np.full(NP,np.inf);lo[22:]=1;
r=least_squares(res,p0,bounds=(lo,hi),method='trf',max_nfev=300)
print('init-from-v2 rms',np.sqrt(np.mean(res(p0)**2)),'->',np.sqrt(np.mean(r.fun**2)),'max',np.abs(r.fun).max())
np.save('p_cons.npy',r.x)
