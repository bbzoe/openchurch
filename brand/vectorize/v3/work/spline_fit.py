import sys,numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from common import *
from eval_svg import eval_svg
import subprocess
h=np.load('cons_heaven.npy')   # dense contour, closed, in vb coords
N=int(sys.argv[1])
def cub(p0,p1,p2,p3,n=30):
    t=np.linspace(0,1,n,endpoint=False)[:,None];return (1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t**2*p2+t**3*p3
def spl(z,n=30):
    A=z[:2*N].reshape(N,2);th=z[2*N:3*N];hi=z[3*N:4*N];ho=z[4*N:5*N]
    u=np.c_[np.cos(th),np.sin(th)];out=[]
    for i in range(N):
        j=(i+1)%N
        out.append(cub(A[i],A[i]+u[i]*ho[i],A[j]-u[j]*hi[j],A[j],n))
    return np.vstack(out)
# init: pick N points evenly by arclength
d=np.r_[0,np.cumsum(np.hypot(*np.diff(h,axis=0).T))];L=d[-1]
idx=np.searchsorted(d,np.linspace(0,L,N,endpoint=False))
A=h[idx];tan=np.roll(h,-5,axis=0)[idx]-np.roll(h,5,axis=0)[idx];th=np.arctan2(tan[:,1],tan[:,0])
seg=np.hypot(*(np.roll(A,-1,axis=0)-A).T)
z0=np.r_[A.ravel(),th,seg/3,seg/3]
tree=cKDTree(h)
def res(z):
    o=spl(z,16);return np.r_[tree.query(o)[0],cKDTree(o).query(h[::4])[0]]
r=least_squares(res,z0,method='trf',max_nfev=400,x_scale=np.r_[np.full(2*N,10.),np.full(N,0.1),np.full(2*N,10.)])
print('N',N,'rms',np.sqrt(np.mean(r.fun**2)),'max',np.abs(r.fun).max())
z=r.x;np.save(f'spl_{N}.npy',z)
A=z[:2*N].reshape(N,2);th=z[2*N:3*N];hi=z[3*N:4*N];ho=z[4*N:5*N];u=np.c_[np.cos(th),np.sin(th)]
f=lambda v:('%.2f'%v).rstrip('0').rstrip('.')
def D(rot):
    T=(lambda a:960-a) if rot else (lambda a:a);pt=lambda a:f(T(a)[0])+' '+f(T(a)[1])
    s='M'+pt(A[0])
    for i in range(N):
        j=(i+1)%N;s+='C'+pt(A[i]+u[i]*ho[i])+' '+pt(A[j]-u[j]*hi[j])+' '+pt(A[j])
    return s+'Z'
open(f'spl_{N}.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960"><path d="%s"/><path d="%s"/></svg>'%(D(False),D(True)))
eval_svg(f'spl_{N}.svg')
