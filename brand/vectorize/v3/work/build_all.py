import json,re,numpy as np,xml.etree.ElementTree as ET
from pathlib import Path
from shade import *
OUT=Path('..')
fin=json.load(open('final_H2.json'));HV,ER=fin['heaven'],fin['earth']
pal={}
for n in ('light','dark','podstawowy','na-jasnym'):
    pal[n]=json.load(open(f'palettes_fit_H2_{n}.json'))[n]
flats=json.load(open('flats.json'));tiles={t['name']:t for t in json.load(open('tiles.json'))}
regs={k:np.array(v) for k,v in fin['regs'].items()}
def hexc(c): return '#%02X%02X%02X'%tuple(int(round(v)) for v in c)
def mark_svg(name,palette,title,vb='0 0 960 960',extra_bg='',width=960,height=960):
    th_h=np.array(palette['heaven']['theta']);th_e=np.array(palette['earth']['theta'])
    dh,lh,fh=Heaven.svg(th_h,prefix='h');de,le,fe=Earth.svg(th_e,prefix='e')
    defs=''.join(dh+de)+'<clipPath id="clip-heaven"><use href="#heaven"/></clipPath><clipPath id="clip-earth"><use href="#earth"/></clipPath>'
    body=extra_bg+'<g id="heaven-arm"><path id="heaven" d="%s" fill="%s"/><g clip-path="url(#clip-heaven)">%s</g></g>'%(HV,fh,''.join(lh))
    body+='<g id="earth-arm"><path id="earth" d="%s" fill="%s"/><g clip-path="url(#clip-earth)">%s</g></g>'%(ER,fe,''.join(le))
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" width="%s" height="%s"><title>%s</title><defs>%s</defs>%s</svg>'%(vb,width,height,title,defs,body)
    return svg
def flat_svg(colour_h,colour_e,title,vb='0 0 960 960',bg=''):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" width="960" height="960"><title>%s</title>%s<path id="heaven" d="%s" fill="%s"/><path id="earth" d="%s" fill="%s"/></svg>'%(vb,title,bg,HV,colour_h,ER,colour_e)
def write(name,svg): (OUT/name).write_text(svg);return svg
files={}
files['mark.svg']=write('mark.svg',mark_svg('mark',pal['light'],'OpenChurch mark (light)'))
files['mark-dark.svg']=write('mark-dark.svg',mark_svg('mark-dark',pal['dark'],'OpenChurch mark (dark)'))
files['mark-podstawowy.svg']=write('mark-podstawowy.svg',mark_svg('p',pal['podstawowy'],'OpenChurch mark (podstawowy)'))
files['mark-na-jasnym.svg']=write('mark-na-jasnym.svg',mark_svg('n',pal['na-jasnym'],'OpenChurch mark (na jasnym)'))
files['mark-mono.svg']=write('mark-mono.svg',flat_svg('#0F3D2E','#0F3D2E','OpenChurch mark (mono #0F3D2E)'))
# mono-board colour: median of both arms
mc=np.median(np.array([flats['mono']['colour']['heaven']['median'],flats['mono']['colour']['earth']['median']]),axis=0)
MONO=hexc(mc)
files['mark-mono-board.svg']=write('mark-mono-board.svg',flat_svg(MONO,MONO,'OpenChurch mark (mono, board sample %s)'%MONO))
# negatyw: tile rect in vb coords
r=regs['negatyw'];box=(390,252,90,69);T=tiles['negatyw']
def px2vb(px,py,reg,box): s,tx,ty=reg;return ((px-box[0]-tx)/s+480,(py-box[1]-ty)/s+480)
x0,y0=px2vb(T['x'],T['y'],r,box);x1,y1=px2vb(T['x']+T['w'],T['y']+T['h'],r,box)
NEG_TILE=hexc(flats['negatyw']['tile']);NEG_MARK=hexc(np.median([flats['negatyw']['colour']['heaven']['median'],flats['negatyw']['colour']['earth']['median']],axis=0))
vb='%s %s %s %s'%(f2(x0),f2(y0),f2(x1-x0),f2(y1-y0))
bg='<rect id="tile" x="%s" y="%s" width="%s" height="%s" fill="%s"/>'%(f2(x0),f2(y0),f2(x1-x0),f2(y1-y0),NEG_TILE)
files['mark-negatyw.svg']=write('mark-negatyw.svg',flat_svg(NEG_MARK,NEG_MARK,'OpenChurch mark (negatyw)',vb=vb,bg=bg).replace('width="960" height="960"','width="%d" height="%d"'%(round(x1-x0),round(y1-y0))))
negspec=dict(viewBox=vb,tile=dict(x=x0,y=y0,w=x1-x0,h=y1-y0,fill=NEG_TILE,radius=0),mark_fill=NEG_MARK)
# ---- tile-mounted marks
def tile_svg(tname,S,reg,box,col_h,col_e,title):
    t=tiles[tname];side=(t['w']+t['h'])/2;s,tx,ty=reg
    cxp=box[0]+tx;cyp=box[1]+ty            # absolute px centre of the mark
    tcx=t['x']+t['w']/2;tcy=t['y']+t['h']/2
    fx=(cxp-tcx)/side;fy=(cyp-tcy)/side;fs=960*s/side
    ms=fs*S;mx=S/2+fx*S-ms/2;my=S/2+fy*S-ms/2
    rad=t['radius_frac']*S*((t['w']+t['h'])/2)/((t['w']+t['h'])/2)
    tilec=hexc(t['color'])
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"><title>%s</title><rect id="tile" width="%d" height="%d" rx="%s" fill="%s"/><svg id="mark" x="%s" y="%s" width="%s" height="%s" viewBox="0 0 960 960"><path id="heaven" d="%s" fill="%s"/><path id="earth" d="%s" fill="%s"/></svg></svg>'%(S,S,S,S,title,S,S,f2(rad),tilec,f2(mx),f2(my),f2(ms),f2(ms),HV,col_h,ER,col_e)
    return svg,dict(tile_fill=tilec,radius_frac=t['radius_frac'],radius=rad,mark_x=mx,mark_y=my,mark_size=ms,mark_size_frac=fs,mark_dx_frac=fx,mark_dy_frac=fy,tile_px=[t['x'],t['y'],t['w'],t['h']])
appreg=regs['app-1024'][:3]
app_h=hexc(flats['app']['colour']['heaven']['median']);app_e=hexc(flats['app']['colour']['earth']['median'])
svg,appspec=tile_svg('app',1024,appreg,INSTANCES_BOX:=(537,262,69,65),app_h,app_e,'OpenChurch app icon 1024')
files['app-icon.svg']=write('app-icon.svg',svg);appspec['heaven_fill']=app_h;appspec['earth_fill']=app_e
favspec={}
for tn,S,fn in (('favicon32',32,'favicon-32.svg'),('x16',16,'favicon-16.svg'),('x8',8,'favicon-8.svg')):
    fl=flats[tn];ch=hexc(fl['colour']['heaven']['median']);ce=hexc(fl['colour']['earth']['median'])
    svg,sp=tile_svg(tn,S,fl['reg_in_box'],fl['box'],ch,ce,'OpenChurch favicon %d'%S)
    files[fn]=write(fn,svg);sp['heaven_fill']=ch;sp['earth_fill']=ce;favspec[tn]=sp
# ---- geometry json with structured gradients
def parse_defs(svg):
    root=ET.fromstring(svg);ns='{http://www.w3.org/2000/svg}'
    grads=[]
    for g in root.iter():
        tag=g.tag.replace(ns,'')
        if tag in('linearGradient','radialGradient'):
            stops=[dict(offset=float(s.get('offset')),color=s.get('stop-color'),opacity=float(s.get('stop-opacity','1'))) for s in g if s.tag.endswith('stop')]
            grads.append(dict(id=g.get('id'),type=tag,units=g.get('gradientUnits'),**{k:float(g.get(k)) for k in ('x1','y1','x2','y2','cx','cy','r') if g.get(k) is not None},stops=stops))
        if tag=='mask':
            grads.append(dict(id=g.get('id'),type='mask',units=g.get('maskUnits'),content=[ET.tostring(c,encoding='unicode').replace(' xmlns="http://www.w3.org/2000/svg"','') for c in g]))
    layers=[]
    z=0
    for el in root.iter():
        tag=el.tag.replace(ns,'')
        if tag in('path','rect') and el.get('id'):
            layers.append(dict(z=z,id=el.get('id'),element=tag,fill=el.get('fill'),mask=el.get('mask'),d=el.get('d'),clip=None));z+=1
    return grads,layers
geo=dict(viewBox='0 0 960 960',unit='1u = 40 viewBox units; bbox 960 wide (24u) x %.2f tall (%.2fu)'%(960/ (fin['k']*0+1)/1.0285,0),heaven=HV,earth=ER)
geo['unit']='1u = 40 viewBox units. Master bbox: 960 wide (24u), 933.4 tall (23.34u), ratio 1.0285'
geo['anchors']=dict(count_per_arm=fin['N'],anchors=fin['A'],tangent_angles_rad=fin['th'],handle_in=fin['hi'],handle_out=fin['ho'],control_points_out=fin['C1'],control_points_in=fin['C2'],note='closed G1 cubic spline, earth = heaven rotated 180 deg about (480,480) (coordinates baked, rounded 2dp)')
geo['palettes']={}
for key,fn,title in (('light','mark.svg','light'),('dark','mark-dark.svg','dark'),('podstawowy','mark-podstawowy.svg','podstawowy'),('na-jasnym','mark-na-jasnym.svg','na-jasnym')):
    g,l=parse_defs(files[fn]);geo['palettes'][key]=dict(file=fn,gradients=g,layers=l,fit=dict(heaven_mean_dRGB=pal[key]['heaven']['mean_err'],earth_mean_dRGB=pal[key]['earth']['mean_err']),
        notes='z-order bottom to top: heaven/earth arm path (base gradient), then clipped layers (clip = same arm path). Heaven: front-layer rect masked by radial soft edge, then crease ring. Earth: shadow rect, then crisp front-layer path.')
geo['palettes']['mono']=dict(file='mark-mono.svg',fill='#0F3D2E',board_sample_file='mark-mono-board.svg',board_sample_fill=MONO,board_sample_stats=flats['mono']['colour'])
geo['palettes']['negatyw']=dict(file='mark-negatyw.svg',**negspec)
geo['palettes']['app']=dict(file='app-icon.svg',tile_size=1024,**appspec)
geo['favicon_tiles']={k:dict(file=f) for k,f in (('favicon32','favicon-32.svg'),('x16','favicon-16.svg'),('x8','favicon-8.svg'))}
for k in favspec: geo['favicon_tiles'][k].update(favspec[k])
geo['regs_px_per_vb_unit']={k:v for k,v in fin['regs'].items()}
geo['silhouette_iou']=fin['iou']
json.dump(geo,open(OUT/'mark-geometry.json','w'),indent=1)
print({k:len(v) for k,v in files.items()})
print('mono board colour',MONO,'neg',NEG_TILE,NEG_MARK,'app',app_h,app_e)
