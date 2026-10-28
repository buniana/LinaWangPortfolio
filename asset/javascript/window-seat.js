/* Window Seat intro for lina-wang.com: a Seattle metro ride that ends on the projects section. */
(function(){
function boot(){
(() => {
const $=id=>document.getElementById(id);
const stage=$('stage'), ride=$('ride'), cvs=$('scene'), ctx=cvs.getContext('2d');
const off=document.createElement('canvas'), oc=off.getContext('2d');
const mixC=document.createElement('canvas'), mc=mixC.getContext('2d');
const lightC=document.createElement('canvas'), lc=lightC.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const behind=document.querySelector('.behind');
const sw=$('sw'), iw=$('iw'), hint=$('hint'), hintText=$('hintText'), led=$('led'), ledText=$('ledText'), ctl=$('ctl'), bar=$('bar'), slogan=$('slogan'), skipBtn=$('skip');

(() => { const n=document.createElement('canvas'); n.width=n.height=140; const x=n.getContext('2d'); const d=x.createImageData(140,140);
  for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255|0; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;}
  x.putImageData(d,0,0); document.documentElement.style.setProperty('--grain',`url(${n.toDataURL()})`); })();

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rrp(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function rr(c,x,y,w,h,r){c.beginPath();rrp(c,x,y,w,h,r);}
function glow(c,x,y,r,rgb,a,sy){c.save();c.translate(x,y);c.scale(1,sy);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(-r,-r,2*r,2*r);c.restore();}

// state
let W=0,H=0,DPR=1,win,side=false,scenes={},sign=null,fabric=null,mist=null,drops=[],motes=[];
let P,g,ceilY,floorY,seatTop,seatBot,cushH,doors,carX0,carX1,carLen,carTop,carBot,railY,carCx,carCy,zInt,zExt,signCx,yf,yb,signBottom,pfHalf;
let view='seattle', prevView=null, xf=1;
view='seattle';
let D=0,t=0,ti=reduce?99:0,s=reduce?0:1.3,slogShown=false,introDone=reduce;
let seatReadyAt=-1, seatGo=false;
let mode='cruise',arrA=0,depD=0,s0=1,pfX=null,pfL=0,stopT=0,cp=0,introVis=0;
let z=1,cx=0,cy=0,plat=null,gap=null;
const occ=[];
let px=0,py=0,tx=0,ty=0,gx=-999,gy=-999,cgx=-999,cgy=-999;
const PF_V=1500, ARR=3.4, DEP=2.2;
const G=.8; const treeMode='none'; let trackTrees=null; /* front trees off for now; 'water' and 'track' still work if switched back */ let flyV=0, peelV=0; const tkWrap=document.getElementById('tkWrap'), tkEl=document.getElementById('tkEl'), tkFlap=document.getElementById('tkFlap'); let galV=0, galEx=0, galW=0, swing=0, swingV=0, lastW=0, trackW=0;
let BW=0, layoutMode='ticket', tk=null, tkF=null, tkB=null, panel=null, zoomV=0, flipV=0, panV=0, ledLabel='Seattle · Waterfront line', slogStart=-99;
layoutMode='pan'; // seat and wall is the chosen layout
const wallMode='text'; // final: Seattle, seat and wall text
const GAL=()=>layoutMode==='pan'&&wallMode==='gallery';
const lineName={seattle:'Seattle · Waterfront line'};

function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w*DPR));c.height=Math.max(1,Math.ceil(h*DPR));const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);return [c,x];}
function drawWrap(c,img,T,sy,sh,ox,dy,dh){let x=-(((ox%T)+T)%T);const k=img.width/T;for(;x<BW;x+=T)c.drawImage(img,0,sy*k,img.width,sh*k,x,dy,T,dh);}
const inGap=x=>gap&&x>gap[0]&&x<gap[1];
function drawPoles(c,D,sp,speed,gp,col,a){
  const blur=Math.min(140,sp*90), o=((D*speed+px*55)%gp+gp)%gp;
  c.fillStyle=col; c.globalAlpha=a*Math.min(1,1.1/(1+blur*.02));
  for(let x=-o+gp*.5;x<BW+200;x+=gp){ if(x<-260||inGap(x)) continue; c.fillRect(x,win.y-20,22+blur,win.h+40); c.fillRect(x-40,win.y+win.h*.05,100+blur,6); occ.push([x+(22+blur)/2,22+blur]); }
  c.globalAlpha=1;
}
function wires(c,a){
  c.globalAlpha=a; c.strokeStyle='rgba(22,16,32,.6)'; c.lineWidth=1.2;
  [.07,.1].forEach(f=>{c.beginPath();c.moveTo(-20,win.y+win.h*f);c.quadraticCurveTo(W/2,win.y+win.h*(f+.022),BW+20,win.y+win.h*f);c.stroke();});
  c.globalAlpha=1;
}

function needle(k,x,b,h,col){
  k.fillStyle=col;
  k.beginPath();k.moveTo(x-h*.07,b);k.lineTo(x-h*.012,b-h*.45);k.lineTo(x-h*.03,b-h*.74);k.lineTo(x+h*.03,b-h*.74);k.lineTo(x+h*.012,b-h*.45);k.lineTo(x+h*.07,b);k.closePath();k.fill();
  k.beginPath();k.moveTo(x-h*.13,b-h*.76);k.lineTo(x+h*.13,b-h*.76);k.lineTo(x+h*.07,b-h*.82);k.lineTo(x-h*.07,b-h*.82);k.closePath();k.fill();
  k.fillRect(x-h*.035,b-h*.88,h*.07,h*.06); k.fillRect(x-1,b-h,2,h*.13);
  k.fillStyle='rgba(255,255,255,.75)'; k.fillRect(x-h*.11,b-h*.772,h*.22,1.5);
}
function cloud(c,R,cx,cy,sz,rain,hz){
  if(rain){ c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=1; for(let i=0;i<28;i++){ const x=cx+(R()-.5)*sz*3; c.beginPath(); c.moveTo(x,cy+sz*.3); c.lineTo(x-(hz-cy)*.12,hz); c.stroke(); } }
  const pts=[]; const n=5+(R()*4|0); for(let i=0;i<n;i++) pts.push([cx+(R()-.5)*sz*4, cy+(R()-.5)*sz*.25, sz*(.5+R()*.6)]);
  c.fillStyle=rain?'rgba(150,158,190,.5)':'rgba(180,194,226,.35)'; for(const [x,y,r] of pts){c.beginPath();c.ellipse(x,y+r*.18,r*1.6,r*.45,0,0,Math.PI*2);c.fill();}
  c.fillStyle=rain?'rgba(236,239,248,.85)':'rgba(255,255,255,.88)'; for(const [x,y,r] of pts){c.beginPath();c.ellipse(x,y-r*.06,r*1.45,r*.4,0,0,Math.PI*2);c.fill();}
}

function buildSeattle(){
  const R=rng(11), hz=win.y+win.h*.6, SH=Math.round(win.h*.32), T=Math.max(Math.round(W*1.3),1100), T2=BW+400;
  const sun=[win.x+win.w*.7, hz-win.h*.07];
  const [sky,c]=mk(BW,H);
  let gr=c.createLinearGradient(0,win.y,0,hz);
  [[0,'#251d4a'],[.36,'#5b4791'],[.64,'#be78a6'],[.85,'#ea9da8'],[1,'#f9cfbd']].forEach(s=>gr.addColorStop(s[0],s[1]));
  c.fillStyle=gr; c.fillRect(0,0,BW,hz+2);
  glow(c,sun[0],sun[1],Math.max(W,H)*.5,'255,214,180',.62,1);
  for(let i=0;i<46;i++){c.fillStyle=`rgba(255,242,250,${.15+R()*.45})`;const s=R()<.15?1.8:1.1;c.fillRect(R()*BW,win.y+R()*(hz-win.y)*.38,s,s);}
  for(let i=0;i<10;i++){const y=win.y+(hz-win.y)*(.4+R()*.45),x=R()*BW,w=W*(.12+R()*.28),h=2+R()*5;c.fillStyle=`rgba(255,212,224,${.08+R()*.12})`;c.beginPath();c.ellipse(x,y,w/2,h,0,0,Math.PI*2);c.fill();}
  for(let i=0;i<2;i++){ const x=win.x+win.w*(.08+i*.18), y=win.y+(hz-win.y)*(.3+R()*.15), w=win.w*(.1+R()*.06);
    c.strokeStyle='rgba(255,220,235,.16)'; c.lineWidth=1; for(let j=0;j<26;j++){const xx=x+(R()-.5)*w*1.6; c.beginPath(); c.moveTo(xx,y+6); c.lineTo(xx-(hz-y)*.12,hz); c.stroke();}
    c.fillStyle='rgba(96,72,128,.55)'; c.beginPath(); c.ellipse(x,y,w,win.h*.022,0,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(236,170,196,.35)'; c.beginPath(); c.ellipse(x+w*.1,y-win.h*.008,w*.8,win.h*.012,0,0,Math.PI*2); c.fill(); }
  glow(c,sun[0],sun[1],win.h*.13,'255,240,220',.8,1);
  c.fillStyle='#fff1df'; c.beginPath(); c.arc(sun[0],sun[1],Math.max(9,win.h*.032),0,Math.PI*2); c.fill();
  gr=c.createLinearGradient(0,hz,0,H); gr.addColorStop(0,'#c68aa9'); gr.addColorStop(.3,'#86609a'); gr.addColorStop(1,'#2c2149'); c.fillStyle=gr; c.fillRect(0,hz,BW,H-hz);
  glow(c,sun[0],hz,W*.3,'255,214,200',.4,.3);
  const [sk,k]=mk(T,SH);
  const put=(x,y,w,h)=>{k.fillRect(x,y,w,h); if(x+w>T) k.fillRect(x-T,y,w,h);};
  k.fillStyle='rgba(118,86,150,.55)';
  for(let x=0;x<T;){const w=14+R()*42,h=SH*(.1+R()*.2);put(x,SH-h,w,h);x+=w+R()*8;}
  const ccx=T*.58, spread=T*.2, bl=[];
  for(let x=0;x<T;){const w=14+R()*30,d=Math.abs(x-ccx)/spread,tall=d<1?(1-d*d):0,h=SH*(.07+R()*.1+tall*(.35+R()*.45));bl.push([x,w,h]);x+=w+1+R()*3;}
  bl.forEach(([x,w,h])=>{k.fillStyle='#33264f'; put(x,SH-h,w,h); k.fillStyle='rgba(255,170,150,.16)'; put(x+w*.7,SH-h,w*.3,h);});
  bl.forEach(([x,w,h])=>{ if(h>SH*.5&&R()<.4){k.fillStyle='#33264f'; put(x+w/2-.5,SH-h-SH*.06,1,SH*.06);} });
  bl.forEach(([x,w,h])=>{ if(h<SH*.18) return; for(let yy=SH-h+5;yy<SH-4;yy+=5) for(let xx=x+3;xx<x+w-3;xx+=4.5){ if(R()<.2){k.fillStyle=`rgba(255,212,166,${.3+R()*.55})`;put(xx,yy,1.5,1.5);} } });
  needle(k,T*.2,SH,SH*.95,'#2e2348');
  // evergreen forests: a hazy ridge behind the city, and dark wooded points on the near shore
  const conifer=(g,x,base,h,col)=>{ const w=h*.32; g.fillStyle=col; g.beginPath(); g.moveTo(x,base-h);
    for(let i=1;i<=4;i++){ const yy=base-h+h*i/4.2, ww=w*(i/4)*.5+w*.12; g.lineTo(x+ww,yy); g.lineTo(x+ww*.45,yy-h*.03); }
    g.lineTo(x+w*.5,base); g.lineTo(x-w*.5,base);
    for(let i=4;i>=1;i--){ const yy=base-h+h*i/4.2, ww=w*(i/4)*.5+w*.12; g.lineTo(x-ww*.45,yy-h*.03); g.lineTo(x-ww,yy); }
    g.closePath(); g.fill(); };
  const FT=Math.max(Math.round(W*1.6),1400), FH=Math.round(win.h*.2);
  const [fr,fk]=mk(FT,FH);
  // distant ridge: a continuous evergreen skyline behind the city
  for(let x=-20;x<FT+20;){ const ridge=.45+.3*Math.sin(x/FT*Math.PI*2*2+1)+.15*Math.sin(x/FT*Math.PI*2*5);
    const h=FH*(.25+ridge*.45)*(.7+R()*.5); conifer(fk,x,FH,h,'rgba(78,58,102,.9)'); if(x>FT-40) conifer(fk,x-FT,FH,h,'rgba(78,58,102,.9)'); x+=3+R()*6; }
  fk.fillStyle='rgba(78,58,102,.9)'; fk.fillRect(0,FH-3,FT,3);
  // near shore: wooded points that read as a forest mass, two depth layers on a low rocky mound
  const NT=Math.max(Math.round(W*2.4),2000), NH=Math.round(win.h*.22);
  const [nf,nk]=mk(NT,NH);
  const pts=[[.06,.26],[.55,.2]];
  const canopy=(tp,seed)=>Math.sin(tp*Math.PI)*(.72+.18*Math.sin(tp*9+seed)+.1*Math.sin(tp*23+seed*2));
  for(const [st,len] of pts){ const x0=NT*st, x1=x0+NT*len, w=x1-x0, base=NH-NH*.03, seed=st*10;
    // back layer: lighter, taller, dense
    for(let x=x0+w*.04;x<x1-w*.04;){ const tp=(x-x0)/w, env=canopy(tp,seed); const h=NH*(.28+env*.62)*(.85+R()*.25);
      conifer(nk,x,base-NH*.02,h,'#3a2d4c'); x+=3+R()*4; }
    // ground mound
    nk.fillStyle='#1d1529'; nk.beginPath(); nk.moveTo(x0-20,NH);
    nk.bezierCurveTo(x0+w*.1,NH-NH*.07,x0+w*.3,NH-NH*.1,x0+w*.5,NH-NH*.1); nk.bezierCurveTo(x0+w*.7,NH-NH*.1,x0+w*.9,NH-NH*.07,x1+20,NH); nk.fill();
    // front layer: darker, a little shorter, slightly irregular spacing
    for(let x=x0;x<x1;){ const tp=(x-x0)/w, env=canopy(tp,seed+1.7); const h=NH*(.18+env*.5)*(.8+R()*.3);
      conifer(nk,x,base,h,'#211830'); x+=4+R()*6; }
    // a few taller emergent firs
    for(let i=0;i<4;i++){ const tp=.2+R()*.6, x=x0+w*tp; conifer(nk,x,base,NH*(.65+R()*.3)*Math.sin(tp*Math.PI),'#211830'); }
  }
  const shim=[]; for(let i=0;i<90;i++) shim.push({u:R()*T2,v:R(),l:6+R()*30,a:.08+R()*.22,p:R()*6});
  return {sun,draw(c,D,t,sp,nearA){
    c.drawImage(sky,0,0,BW,H);
    const mx=W*.8+px*4, my=py*2, top=hz-win.h*.21;
    c.fillStyle='rgba(226,180,212,.55)'; c.beginPath(); c.moveTo(mx-W*.3,hz); c.lineTo(mx-W*.07,top+win.h*.05+my); c.lineTo(mx-W*.015,top+my); c.lineTo(mx+W*.03,top+win.h*.012+my); c.lineTo(mx+W*.09,top+win.h*.06+my); c.lineTo(mx+W*.32,hz); c.closePath(); c.fill();
    c.fillStyle='rgba(255,240,246,.55)'; c.beginPath(); c.moveTo(mx-W*.045,top+win.h*.035+my); c.lineTo(mx-W*.015,top+my); c.lineTo(mx+W*.03,top+win.h*.012+my); c.lineTo(mx+W*.055,top+win.h*.035+my); c.lineTo(mx+W*.03,top+win.h*.045+my); c.lineTo(mx+W*.005,top+win.h*.03+my); c.lineTo(mx-W*.02,top+win.h*.05+my); c.closePath(); c.fill();
    const ox=D*22+px*10, sy=py*3;
    drawWrap(c,fr,FT,0,FH,D*14+px*7,hz-FH+sy+2,FH);
    drawWrap(c,sk,T,0,SH,ox,hz-SH+sy,SH);
    c.fillStyle='#2a2045'; c.fillRect(0,hz-1+sy,BW,3);
    const RH=SH*.5;
    for(let j=0;j<RH;j+=3){ c.globalAlpha=.26*(1-j/RH); const dx=Math.sin(j*.32+t*2.2)*(1+j*.05); drawWrap(c,sk,T,SH-(j/RH)*SH*.95-3,3,ox-dx,hz+2+j+sy,3); }
    c.globalAlpha=1;
    const wb=win.y+win.h;
    for(const q of shim){
      const v=q.v, y=hz+4+Math.pow(v,1.5)*(wb-hz-4);
      const x=(((q.u-D*(30+v*130)-px*(6+v*22))%T2)+T2)%T2-200;
      const near=Math.exp(-(((x-sun[0])/(W*.13))**2));
      const a=q.a*(.55+.45*Math.sin(t*2.6+q.p))*(1+2.4*near);
      c.fillStyle=`rgba(255,228,224,${Math.min(.9,a)})`; c.fillRect(x,y+py*(4+v*10),q.l*(.5+v),1+v*1.4);
    }
    if(treeMode==='water'){
      const nb=hz+(wb-hz)*.42+py*8, nox=D*130+px*20;
      c.save(); c.globalAlpha=.16; c.translate(0,nb); c.scale(1,-.5); drawWrap(c,nf,NT,0,NH,nox,-NH,NH); c.restore();
      c.globalAlpha=.97; drawWrap(c,nf,NT,0,NH,nox,nb-NH,NH); c.globalAlpha=1;
    }
    trackTrees=(cc,blur)=>{ // nearer to the rails: larger, lower, faster, motion-blurred when moving
      const k=1.7, tw=NT*k, th=NH*k, base=win.y+win.h*.865+py*14, ox=((D*520+px*40)%tw+tw)%tw;
      const one=(off,al)=>{ cc.globalAlpha=al; for(let x=-ox-off;x<BW;x+=tw) cc.drawImage(nf,x,base-th,tw,th); };
      if(blur>4){ one(blur*.5,.35); one(blur,.2); } one(0,1); cc.globalAlpha=1; };
    if(treeMode==='track'&&trackTrees) trackTrees(c,Math.min(60,sp*40));
    if(nearA>.01){
      c.globalAlpha=nearA;
      const hb=win.y+win.h*.86+py*14, rh=win.h*.075;
      c.fillStyle='#1d1630'; c.fillRect(0,hb,BW,H-hb);
      c.fillStyle='rgba(255,186,200,.22)'; c.fillRect(0,hb,BW,1.5);
      c.fillStyle='rgba(28,20,42,.92)'; c.fillRect(0,hb-rh,BW,3);
      const blur=Math.min(70,sp*44), gp=70, o=((D*950+px*30)%gp+gp)%gp;
      c.fillStyle=`rgba(28,20,42,${.9/(1+blur*.05)})`;
      for(let x=-o;x<BW+gp;x+=gp){ if(inGap(x)) continue; c.fillRect(x,hb-rh,4+blur,rh); }
      c.globalAlpha=1;
      drawPoles(c,D,sp,1800,1300,'#120e19',nearA);
      wires(c,nearA);
    }
  }};
}

function drawTunnel(c,D){
  const y=-20,h=H+40;
  let gr=c.createLinearGradient(0,win.y,0,win.y+win.h); gr.addColorStop(0,'#120e18'); gr.addColorStop(.5,'#07060a'); gr.addColorStop(1,'#110d16'); c.fillStyle=gr; c.fillRect(0,y,W,h);
  const base=D*2600+px*40;
  const rg=180, ro=(base%rg+rg)%rg; c.fillStyle='rgba(255,255,255,.025)'; for(let x=-ro;x<W;x+=rg) c.fillRect(x,y,14,h);
  c.fillStyle='rgba(150,135,170,.16)'; [.31,.335,.36,.7].forEach(f=>c.fillRect(0,win.y+win.h*f,W,1.2));
  const gp=640, o=(base%gp+gp)%gp, ly=win.y+win.h*.2;
  for(let x=-o-300;x<W+300;x+=gp){
    glow(c,x+60,ly,180,'255,190,140',.16,1);
    const lg=c.createLinearGradient(x,0,x+300,0); lg.addColorStop(0,'rgba(255,244,230,.95)'); lg.addColorStop(.35,'rgba(255,214,170,.8)'); lg.addColorStop(1,'rgba(255,200,150,0)');
    c.fillStyle=lg; c.fillRect(x,ly-3,300,6);
  }
  const g2=420, o2=(base%g2+g2)%g2; c.fillStyle='rgba(140,255,200,.5)'; for(let x=-o2;x<W;x+=g2) c.fillRect(x,win.y+win.h*.82,70,2);
}

function buildSign(){
  const w=Math.round(sign0w), h=Math.round(w*.42);
  const [c,k]=mk(w+40,h+40);
  k.translate(20,16);
  k.save(); k.shadowColor='rgba(40,40,60,.22)'; k.shadowBlur=18*DPR; k.shadowOffsetY=6*DPR;
  rr(k,0,0,w,h,10); k.fillStyle='#fbfaf7'; k.fill(); k.restore();
  rr(k,0,0,w,h,10); k.strokeStyle='#d9d4cc'; k.lineWidth=1; k.stroke();
  const bh=h*.24;
  k.save(); rr(k,0,0,w,h,10); k.clip(); k.fillStyle='#DE7E98'; k.fillRect(0,h-bh,w,bh); k.restore();
  const bx=h*.24, by=h*.36, br=h*.15;
  k.beginPath(); k.arc(bx,by,br,0,Math.PI*2); k.fillStyle='#fff'; k.fill(); k.lineWidth=h*.03; k.strokeStyle='#DE7E98'; k.stroke();
  k.fillStyle='#111318'; k.textAlign='center'; k.textBaseline='middle';
  k.font=`600 ${h*.06}px Inter, system-ui, sans-serif`; k.fillText('LW',bx,by-br*.38);
  k.font=`700 ${h*.1}px Inter, system-ui, sans-serif`; k.fillText('01',bx,by+br*.25);
  let fs=h*.25; const nx=w*.56; k.textBaseline='alphabetic';
  k.font=`700 ${fs}px Inter, system-ui, sans-serif`; while(k.measureText('Selected Work').width>w*.66&&fs>8){fs*=.95;k.font=`700 ${fs}px Inter, system-ui, sans-serif`;}
  k.fillText('Selected Work',nx,h*.47);
  k.fillStyle='#6b6f76'; k.font=`500 ${h*.08}px Inter, system-ui, sans-serif`; k.fillText('4 projects · 1 experimental line',nx,h*.63);
  k.fillStyle='#fff'; k.font=`600 ${h*.085}px Inter, system-ui, sans-serif`; k.textBaseline='middle';
  k.textAlign='left'; k.fillText('← Intro',w*.05,h-bh/2); k.textAlign='right'; k.fillText('AI Playground →',w*.95,h-bh/2);
  sign={c,w,h};
}
let sign0w=300;

function drawPlatform(c,sx,withSign){
  const x0=sx-pfHalf, x1=sx+pfHalf, top=win.y-win.h*.03, ch=win.h*.1;
  c.fillStyle='#3a3442'; c.fillRect(x0,top,x1-x0,ch); c.fillStyle='#2a2530'; c.fillRect(x0,top+ch-5,x1-x0,5);
  c.fillStyle='rgba(255,255,255,.95)'; for(let x=x0+130;x<x1;x+=260) c.fillRect(x-40,top+ch-10,80,4);
  let gr=c.createLinearGradient(0,top+ch,0,top+ch+win.h*.12); gr.addColorStop(0,'rgba(70,80,110,.16)'); gr.addColorStop(1,'rgba(70,80,110,0)'); c.fillStyle=gr; c.fillRect(x0,top+ch,x1-x0,win.h*.12);
  for(let x=x0+280;x<x1;x+=560){ if(Math.abs(x-sx)<sign.w*.7) continue; c.fillStyle='#4a4352'; c.fillRect(x-10,top+ch,20,yf-top-ch); c.fillStyle='#352f3c'; c.fillRect(x+3,top+ch,7,yf-top-ch); occ.push([x,20]); }
  gr=c.createLinearGradient(0,yf,0,yb); gr.addColorStop(0,'#6b6070'); gr.addColorStop(1,'#8a7d88'); c.fillStyle=gr; c.fillRect(x0,yf,x1-x0,yb-yf);
  c.fillStyle='#4a4352'; c.fillRect(x0,yf,x1-x0,2);
  const ty=yf+(yb-yf)*.55, th=Math.max(6,(yb-yf)*.16); c.fillStyle='#d9ae45'; c.fillRect(x0,ty,x1-x0,th);
  c.fillStyle='rgba(170,130,30,.35)'; for(let x=x0+4;x<x1;x+=9){ c.fillRect(x,ty+th*.25,2,2); c.fillRect(x+4,ty+th*.62,2,2); }
  c.fillStyle='#d8cfd6'; c.fillRect(x0,yb-(yb-yf)*.12,x1-x0,3);
  c.fillStyle='#3d3645'; c.fillRect(x0,yb,x1-x0,win.h*.12);
  if(withSign){
    c.fillStyle='#5a5260'; c.fillRect(sx-sign.w*.32-3,signBottom-4,6,yf-signBottom+4); c.fillRect(sx+sign.w*.32-3,signBottom-4,6,yf-signBottom+4);
    c.drawImage(sign.c,sx-sign.w/2-20,signBottom-sign.h-16,sign.w+40,sign.h+40);
  }
}

function windowXs(){const a=[];for(let k=-3;k<=3;k++)a.push(win.x+k*P);return a;}
function doorWins(d){const dW=d.w;return [[d.x+dW*.1,win.y-win.h*.04,dW*.3,win.h*.72],[d.x+dW*.6,win.y-win.h*.04,dW*.3,win.h*.72]];}
function holes(c){ for(const x of windowXs()) rrp(c,x,win.y,win.w,win.h,win.r); for(const d of doors) for(const [x,y,w,h] of doorWins(d)) rrp(c,x,y,w,h,w*.25); }
function frameWin(c,x,y,w,h,r){
  c.lineWidth=14; c.strokeStyle='#29242f'; rr(c,x-7,y-7,w+14,h+14,r+7); c.stroke();
  c.lineWidth=1.5; c.strokeStyle='rgba(255,255,255,.08)'; rr(c,x-14,y-14,w+28,h+28,r+14); c.stroke();
  c.lineWidth=1; c.strokeStyle='rgba(0,0,0,.45)'; rr(c,x-14.5,y-12.5,w+29,h+28,r+14.5); c.stroke();
  c.lineWidth=4; c.strokeStyle='#08070a'; rr(c,x-2,y-2,w+4,h+4,r+2); c.stroke();
}
function ledBox(c,x,y,text,a){
  const pa=c.globalAlpha; c.globalAlpha=a; c.font="13px 'DotGothic16', ui-monospace, monospace"; const tw=c.measureText(text).width, bw=tw+44, bh=30;
  rr(c,x-bw/2,y,bw,bh,8); c.fillStyle='#121015'; c.fill(); c.strokeStyle='#2a2530'; c.lineWidth=1; c.stroke();
  c.fillStyle='#DE7E98'; c.beginPath(); c.arc(x-bw/2+17,y+bh/2,3,0,Math.PI*2); c.fill();
  c.textAlign='left'; c.textBaseline='middle'; c.fillText(text,x-bw/2+28,y+bh/2+1); c.globalAlpha=pa;
}
function routeMap(c,x,y,w,h){
  rr(c,x,y,w,h,h*.12); c.fillStyle='#121015'; c.fill(); c.strokeStyle='#2a2530'; c.lineWidth=1; c.stroke();
  const names=['Intro','Selected Work','Teams','Agnes AI','nurtur','SafeBook','AI Playground'];
  const lx0=x+w*.07, lx1=x+w*.93, ly=y+h*.4, st=(lx1-lx0)/6;
  c.strokeStyle='#DE7E98'; c.lineWidth=h*.08; c.beginPath(); c.moveTo(lx0,ly); c.lineTo(lx0+st*5,ly); c.stroke();
  c.setLineDash([h*.12,h*.1]); c.beginPath(); c.moveTo(lx0+st*5,ly); c.lineTo(lx1,ly); c.stroke(); c.setLineDash([]);
  c.font=`500 ${h*.15}px Inter, system-ui, sans-serif`; c.textAlign='center'; c.textBaseline='alphabetic';
  names.forEach((n,i)=>{ const sx=lx0+st*i; c.beginPath(); c.arc(sx,ly,h*(i===1?.12:.085),0,Math.PI*2); c.fillStyle=i===1?'#DE7E98':'#121015'; c.fill(); c.lineWidth=h*.035; c.strokeStyle='#DE7E98'; c.stroke(); c.fillStyle='#efe8f1'; c.fillText(n,sx,ly+h*.4); });
}

function drawInterior(c,a){
  c.globalAlpha=a;
  const top=ceilY-5*H, bot=floorY+5*H;
  c.fillStyle='#1c1921'; c.fillRect(carX0,top,carLen,ceilY-top);
  c.fillStyle='rgba(255,236,242,.14)'; c.fillRect(carX0,ceilY-win.h*.26,carLen,win.h*.07);
  c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(carX0,ceilY-win.h*.19,carLen,2);
  c.beginPath(); c.rect(carX0,ceilY,carLen,floorY-ceilY); holes(c);
  let gr=c.createLinearGradient(0,ceilY,0,floorY); gr.addColorStop(0,'#1f1b24'); gr.addColorStop(.6,'#18151d'); gr.addColorStop(1,'#110f15'); c.fillStyle=gr; c.fill('evenodd');
  c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(carX0,ceilY,carLen,3);
  for(const x of windowXs()) frameWin(c,x,win.y,win.w,win.h,win.r);
  for(const d of doors){
    const dTop=win.y-win.h*.22;
    c.beginPath(); c.rect(d.x,dTop,d.w,floorY-dTop); for(const [x,y,w,h] of doorWins(d)) rrp(c,x,y,w,h,w*.25);
    c.fillStyle='#24202a'; c.fill('evenodd'); c.lineWidth=2; c.strokeStyle='#3a3442'; c.strokeRect(d.x,dTop,d.w,floorY-dTop);
    c.fillStyle='#3a3442'; c.fillRect(d.x+d.w/2-1,dTop,2,floorY-dTop);
    for(const [x,y,w,h] of doorWins(d)){ c.lineWidth=4; c.strokeStyle='#08070a'; rr(c,x-2,y-2,w+4,h+4,w*.25+2); c.stroke(); }
    if(a>.05) ledBox(c,d.x+d.w/2,dTop-44,'Selected Work',a);
  }
  windowXs().forEach((x,i)=>{ if(i!==3) routeMap(c,x+win.w*.1,win.y-win.h*.22,win.w*.8,win.h*.14); });
  const railYc=ceilY+win.h*.06;
  c.fillStyle='#4a4352'; c.fillRect(carX0,railYc,carLen,win.h*.014);
  const sp=win.w*.28;
  // hanging straps only appear once the train has stopped
  const strapA=a*(1-clamp(s/.15)); if(strapA>.01){ const pa=c.globalAlpha; c.globalAlpha=strapA;
  for(let x=carX0+sp/2;x<carX1;x+=sp){ c.fillStyle='#4f4757'; c.fillRect(x-win.w*.006,railYc,win.w*.012,win.h*.2); c.beginPath(); c.arc(x,railYc+win.h*.2+win.w*.028,win.w*.028,0,Math.PI*2); c.lineWidth=win.w*.008; c.strokeStyle='#8f8696'; c.stroke(); }
  c.globalAlpha=pa; }
  const s0x=doors[0].x+doors[0].w+g*.25, s1x=doors[1].x-g*.25;
  rr(c,s0x,seatTop,s1x-s0x,seatBot-seatTop+14,16);
  gr=c.createLinearGradient(0,seatTop,0,seatBot); gr.addColorStop(0,'#4d3c58'); gr.addColorStop(1,'#33283d'); c.fillStyle=gr; c.fill();
  if(fabric){ c.fillStyle=fabric; c.fill(); }
  c.fillStyle='rgba(255,200,220,.16)'; c.fillRect(s0x+10,seatTop+3,s1x-s0x-20,2);
  gr=c.createLinearGradient(0,seatBot,0,seatBot+cushH); gr.addColorStop(0,'#2c2234'); gr.addColorStop(1,'#211a27'); c.fillStyle=gr; c.fillRect(s0x,seatBot,s1x-s0x,cushH);
  c.fillStyle='rgba(255,200,220,.1)'; c.fillRect(s0x,seatBot,s1x-s0x,1.5);
  c.fillStyle='#0e0c11'; c.fillRect(s0x,seatBot+cushH,s1x-s0x,floorY-seatBot-cushH);
  const pw=Math.max(6,win.w*.012);
  windowXs().forEach((x,i)=>{ if(i===6||(layoutMode==='pan'&&i===3)) return; const xx=x+win.w+g/2; gr=c.createLinearGradient(xx-pw/2,0,xx+pw/2,0); gr.addColorStop(0,'#2a2530'); gr.addColorStop(.45,'#968d9c'); gr.addColorStop(1,'#221e27'); c.fillStyle=gr; c.fillRect(xx-pw/2,railYc,pw,floorY-railYc); });
  c.fillStyle='#141118'; c.fillRect(carX0,floorY,carLen,bot-floorY); c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(carX0,floorY,carLen,3);
  c.globalAlpha=1;
}

function drawSunPatches(c,amt){
  if(amt<.01) return;
  lc.setTransform(1,0,0,1,0,0); lc.clearRect(0,0,lightC.width,lightC.height);
  lc.setTransform(DPR*z,0,0,DPR*z,DPR*(W/2-cx*z),DPR*(H/2-cy*z));
  lc.save(); lc.beginPath(); lc.rect(carX0,win.y+win.h+8,carLen,floorY-(win.y+win.h+8)); lc.clip();
  const sy=(H-seatTop)/win.h*1.05, k=-.38;
  windowXs().forEach((wx,i)=>{
    const ox=wx+win.w*.1;
    lc.save(); lc.translate(ox,seatTop+4); lc.transform(1,0,k,sy,0,0);
    const pg=lc.createLinearGradient(0,0,0,win.h); pg.addColorStop(0,'rgb(255,196,150)'); pg.addColorStop(1,'rgba(255,140,120,.3)'); [[14,.18],[7,.3],[0,1]].forEach(([e,a])=>{lc.globalAlpha=a; rr(lc,-e,-e,win.w+2*e,win.h+2*e,win.r+e); lc.fillStyle=pg; lc.fill();});
    lc.globalAlpha=1;
    if(i===3&&occ.length){ lc.globalCompositeOperation='destination-out';
      for(const [x,w] of occ){ const u=x-ox; lc.fillStyle='rgba(0,0,0,.3)'; lc.fillRect(u-w*.9,-20,w*1.8,win.h+40); lc.fillStyle='rgba(0,0,0,.4)'; lc.fillRect(u-w*.45,-20,w*.9,win.h+40); }
      lc.globalCompositeOperation='source-over'; }
    lc.restore();
  });
  lc.restore();
  c.save(); c.setTransform(1,0,0,1,0,0); c.globalCompositeOperation='screen'; c.globalAlpha=amt*.42; c.drawImage(lightC,0,0); c.restore();
}
function drawBeam(c,amt){
  if(amt<.01) return;
  const k=-.38, sy=(H-seatTop)/win.h*1.05, ox=win.x+win.w*.1, by=seatTop+sy*win.h;
  c.save(); c.globalCompositeOperation='screen'; c.globalAlpha=amt;
  c.beginPath(); c.moveTo(win.x+win.w*.25,win.y+win.h*.55); c.lineTo(win.x+win.w*.98,win.y+win.h*.3); c.lineTo(ox+win.w+k*win.h,by); c.lineTo(ox+k*win.h,by); c.closePath();
  const gr=c.createLinearGradient(0,win.y+win.h*.3,0,by); gr.addColorStop(0,'rgba(255,190,150,.22)'); gr.addColorStop(1,'rgba(255,190,150,.03)'); c.fillStyle=gr; c.fill();
  for(const m of motes){ const x=win.x+((m.x+Math.sin(t*m.s+m.p)*.02)%1)*win.w, y=win.y+win.h*.35+((m.y-t*m.s*.01)%1+1)%1*(H-win.y-win.h*.35);
    c.fillStyle=`rgba(255,250,236,${(.35+.35*Math.sin(t*2*m.s+m.p))})`; c.beginPath(); c.arc(x,y,m.r,0,Math.PI*2); c.fill(); }
  c.restore();
}

const RAIN_PHYSICS=(()=>{ let drops=[], mist=null;
let dropSprites=[];
function makeDropSprite(r,el){
  const pad=r*.6, w=r*2+pad*2, h=r*2*el+pad*2, S=DPR*2;
  const c=document.createElement('canvas'); c.width=Math.ceil(w*S); c.height=Math.ceil(h*S); const k=c.getContext('2d'); k.setTransform(S,0,0,S,0,0);
  const cx=w/2, cy=h/2, ry=r*el;
  // contact shadow on the glass
  k.beginPath(); k.ellipse(cx+r*.1,cy+r*.16,r*1.02,ry*1.02,0,0,Math.PI*2); k.fillStyle='rgba(12,6,20,.2)'; k.fill();
  // body: a small lens, dark at the rim, brighter where it gathers light at the bottom
  k.save(); k.beginPath(); k.ellipse(cx,cy,r,ry,0,0,Math.PI*2); k.clip();
  let g=k.createRadialGradient(cx,cy+ry*.35,r*.1,cx,cy,Math.max(r,ry));
  g.addColorStop(0,'rgba(255,236,244,.42)'); g.addColorStop(.55,'rgba(205,176,212,.18)'); g.addColorStop(.85,'rgba(60,38,74,.38)'); g.addColorStop(1,'rgba(26,14,36,.62)');
  k.fillStyle=g; k.fillRect(cx-r,cy-ry,r*2,ry*2);
  // inverted sky: bright crescent along the bottom inside edge
  g=k.createLinearGradient(0,cy,0,cy+ry); g.addColorStop(0,'rgba(255,230,238,0)'); g.addColorStop(.75,'rgba(255,232,240,.42)'); g.addColorStop(1,'rgba(255,240,246,.15)');
  k.fillStyle=g; k.beginPath(); k.ellipse(cx,cy+ry*.18,r*.86,ry*.78,0,0,Math.PI); k.fill();
  // darker top band where the drop bends the darker scene below into view
  g=k.createLinearGradient(0,cy-ry,0,cy-ry*.2); g.addColorStop(0,'rgba(22,12,32,.55)'); g.addColorStop(1,'rgba(22,12,32,0)');
  k.fillStyle=g; k.fillRect(cx-r,cy-ry,r*2,ry*.9);
  k.restore();
  // rim
  k.beginPath(); k.ellipse(cx,cy,r,ry,0,0,Math.PI*2); k.lineWidth=Math.max(.6,r*.09); k.strokeStyle='rgba(20,10,30,.42)'; k.stroke();
  // specular highlight
  k.beginPath(); k.ellipse(cx-r*.32,cy-ry*.42,r*.2,ry*.13,-.5,0,Math.PI*2); k.fillStyle='rgba(255,255,255,.9)'; k.fill();
  k.beginPath(); k.ellipse(cx+r*.3,cy+ry*.5,r*.14,ry*.07,0,0,Math.PI*2); k.fillStyle='rgba(255,255,255,.35)'; k.fill();
  return {c,w,h,r,el};
}
// Every droplet is a particle. Forces: wind from the train's speed (grows with drop size),
// gravity (grows with mass), and surface friction that pins a drop until the push beats it.
// Every droplet is a particle. Forces: wind from the train's speed (grows with drop size),
// gravity (grows with mass), and surface friction that pins a drop until the push beats it.
// Running drops sweep up the beads in their path and grow; fresh mist keeps landing.
let rainGrid=new Map(), rainCell=18, residue=[];
function buildRain(){
  dropSprites=[]; const R=rng(41);
  for(const r of [.75,1,1.3,1.6,1.95,2.3]) for(let v=0;v<3;v++) dropSprites.push(makeDropSprite(r,1+R()*.35+v*.06));
  mist=true; drops=[];
  const area=win.w*win.h;
  for(let i=0;i<Math.round(area/2250);i++) drops.push(makeBead(.18+R()*R()*.55,R));
  for(let i=0;i<Math.round(area/5100);i++) drops.push(makeBead(.6+Math.pow(R(),1.6)*1.6,R));
}
function spriteFor(r,rnd){ return r>=.6?dropSprites[Math.min(5,Math.max(0,Math.round((r-.75)/1.55*5)))*3+((rnd()*3)|0)]:null; }
function makeBead(r,R){
  const rnd=R||Math.random;
  return {x:win.x+rnd()*win.w, y:win.y+rnd()*win.h, r, sp:spriteFor(r,rnd), vx:0, vy:0, pin:.4+rnd()*.9, hold:rnd()*1.5, trail:[], a:.2+rnd()*.25, dead:false};
}
function newDrop(){ return makeBead(.6+Math.pow(Math.random(),1.6)*1.6); }
function respawn(d,fromRight){
  const r=Math.random()<.75?.18+Math.random()*Math.random()*.55:.6+Math.pow(Math.random(),1.6)*1.6;
  d.r=r; d.sp=spriteFor(r,Math.random); d.vx=d.vy=0; d.trail.length=0; d.dead=false; d.a=.2+Math.random()*.25;
  d.x=fromRight?win.x+win.w+Math.random()*10:win.x+Math.random()*win.w; d.y=fromRight?win.y+Math.random()*win.h:win.y-6;
}
function stepRain(dt){
  const wind=Math.min(1.4,s), now=performance.now();
  rainGrid.clear();
  for(const d of drops){ if(d.sp) continue; const k=((d.x/rainCell)|0)*4096+((d.y/rainCell)|0); let l=rainGrid.get(k); if(!l) rainGrid.set(k,l=[]); l.push(d); }
  for(const d of drops){
    const r=d.r*2; // forces use the drop's original scale so behaviour is unchanged
    const fx=-wind*(55+r*48), fy=wind*(10+r*7)+(6+r*r*7);
    const push=Math.hypot(fx,fy), grip=(14+r*6)*d.pin;
    let tvx=0,tvy=0;
    if(push>grip){ const k=(push-grip)/push; tvx=fx*k; tvy=fy*k; }
    else { d.hold-=dt; if(d.hold<=0){ tvy=2+r*1.5; if(d.hold<-.25) d.hold=.6+Math.random()*1.8; } }
    if(Math.random()<dt*.9) d.pin=.4+Math.random()*.9;
    const e=Math.min(1,dt*6); d.vx+=(tvx-d.vx)*e; d.vy+=(tvy-d.vy)*e;
    d.x+=d.vx*dt; d.y+=d.vy*dt;
    const v=Math.hypot(d.vx,d.vy);
    if(d.sp&&v>8){
      // sweep up small beads in the path; the runner grows a little, and the swept beads respawn as new mist
      const cx0=(d.x/rainCell)|0, cy0=(d.y/rainCell)|0, rr=d.r*1.6;
      for(let gx=cx0-1;gx<=cx0+1;gx++) for(let gy=cy0-1;gy<=cy0+1;gy++){ const l=rainGrid.get(gx*4096+gy); if(!l) continue;
        for(const m of l){ if(m.dead) continue; if(Math.abs(m.x-d.x)<rr&&Math.abs(m.y-d.y)<rr){ m.dead=true; d.r=Math.min(2.6,Math.sqrt(d.r*d.r+m.r*m.r*.5)); } } }
      if(Math.abs(d.r*2-r)>.15) d.sp=spriteFor(d.r,Math.random);
      const last=d.trail[d.trail.length-1];
      if(!last||Math.abs(last.x-d.x)+Math.abs(last.y-d.y)>4) d.trail.push({x:d.x,y:d.y,t:now});
    }
    while(d.trail.length&&(now-d.trail[0].t>1600||d.trail.length>50)){ const q=d.trail.shift();
      if(Math.random()<.2) residue.push({x:q.x+(Math.random()-.5)*d.r*.6,y:q.y+(Math.random()-.5)*d.r*.4,r:.35+Math.random()*d.r*.22,t:now,life:2500+Math.random()*3500}); }
    if(d.x<win.x-8){ respawn(d,true); continue; }
    if(d.y>win.y+win.h+8){ respawn(d,false); continue; }
  }
  if(residue.length>180) residue.splice(0,residue.length-180);
  for(let i=residue.length-1;i>=0;i--) if(now-residue[i].t>residue[i].life) residue.splice(i,1);
  for(const d of drops) if(d.dead) respawn(d,false), d.y=win.y+Math.random()*win.h, d.x=win.x+Math.random()*win.w;
}
function drawRain(c,a){
  if(a<.01||!mist) return;
  c.save(); c.globalAlpha=a;
  c.fillStyle='rgba(225,210,232,.05)'; c.fillRect(win.x,win.y,win.w,win.h);
  const T=c.getTransform();
  // tiny beads: one fill colour, batched into one path
  c.fillStyle='rgba(255,240,248,.32)'; c.beginPath();
  for(const d of drops){ if(d.sp) continue; const l=Math.min(3,Math.abs(d.vx)*.04);
    c.rect(d.x-d.r-l,d.y-d.r*.85,(d.r+l)*2,d.r*1.7); }
  c.fill();
  // trails taper: full width right behind the drop, thinning to a hairline; one filled shape per trail.
  // As the wet track dries it beads up into tiny residue drops.
  const nowT=performance.now();
  const shape=(pts,scale)=>{ const n=pts.length, L=[], Rr=[];
    for(let i=0;i<n;i++){ const p=pts[i], q=pts[Math.min(n-1,i+1)], o=pts[Math.max(0,i-1)];
      let dx=q.x-o.x, dy=q.y-o.y; const m=Math.hypot(dx,dy)||1; dx/=m; dy/=m;
      const f=i/(n-1), age=clamp((nowT-p.t)/1600), w=p.r*(.06+.44*Math.pow(f,1.5))*(1-age*.45)*scale;
      L.push([p.x-dy*w,p.y+dx*w]); Rr.push([p.x+dy*w,p.y-dx*w]); }
    c.beginPath(); c.moveTo(L[0][0],L[0][1]); for(let i=1;i<n;i++) c.lineTo(L[i][0],L[i][1]); for(let i=n-1;i>=0;i--) c.lineTo(Rr[i][0],Rr[i][1]); c.closePath(); };
  for(const d of drops){ if(!d.sp||d.trail.length<2) continue;
    const pts=d.trail.map(p=>({x:p.x,y:p.y,t:p.t,r:d.r})); pts.push({x:d.x,y:d.y,t:nowT,r:d.r});
    shape(pts,1.35); c.fillStyle='rgba(20,10,30,.1)'; c.fill();
    shape(pts,.8); c.fillStyle='rgba(255,238,246,.2)'; c.fill(); }
  c.fillStyle='rgba(255,240,248,.38)'; c.beginPath();
  for(const q of residue){ if(nowT-q.t>q.life) continue; c.moveTo(q.x+q.r,q.y); c.arc(q.x,q.y,q.r,0,Math.PI*2); }
  c.fill();
  // beads: sprite per drop, oriented along its motion
  for(const d of drops){ if(!d.sp) continue;
    const sc=d.r/d.sp.r, v=Math.hypot(d.vx,d.vy), st=1+Math.min(.7,v/140);
    if(v>1){ const an=Math.atan2(d.vy,d.vx)-Math.PI/2, co=Math.cos(an), si=Math.sin(an);
      c.setTransform(T.a*co+T.c*si, T.b*co+T.d*si, (-T.a*si+T.c*co)*st, (-T.b*si+T.d*co)*st, T.a*d.x+T.c*d.y+T.e, T.b*d.x+T.d*d.y+T.f);
      c.drawImage(d.sp.c,-d.sp.w*sc/2,-d.sp.h*sc/2,d.sp.w*sc,d.sp.h*sc);
    } else { c.setTransform(T); c.drawImage(d.sp.c,d.x-d.sp.w*sc/2,d.y-d.sp.h*sc/2,d.sp.w*sc,d.sp.h*sc); }
  }
  c.setTransform(T);
  c.restore();
}


return {build:buildRain, step:stepRain, draw:drawRain}; })();
// rain takes turns: a rainy visit, then a clear one
let rainMode='PHYSICS'; try{ rainMode=localStorage.getItem('ws-rain-last')==='PHYSICS'?'OFF':'PHYSICS'; localStorage.setItem('ws-rain-last',rainMode);}catch(e){}
const RAINS={PHYSICS:RAIN_PHYSICS};
function buildRain(){ RAIN_PHYSICS.build(); }
function stepRain(dt){ if(RAINS[rainMode]) RAINS[rainMode].step(dt); }
function drawRain(c,a){ if(RAINS[rainMode]) RAINS[rainMode].draw(c,a); }
function drawRails(c,a){
  c.globalAlpha=a; const vx0=cx-W/(2*z)-60, vw=W/z+120;
  c.fillStyle='#4a4150'; const step=win.w*.14; for(let x=Math.floor(vx0/step)*step;x<vx0+vw;x+=step) c.fillRect(x,railY-win.h*.01,win.w*.05,win.h*.12);
  c.fillStyle='#8a7f8c'; c.fillRect(vx0,railY,vw,win.h*.025); c.fillRect(vx0,railY+win.h*.08,vw,win.h*.025);
  c.fillStyle='rgba(255,200,215,.5)'; c.fillRect(vx0,railY,vw,win.h*.006); c.fillRect(vx0,railY+win.h*.08,vw,win.h*.006);
  c.globalAlpha=1;
}
function bodyPath(c){
  const r=win.h*.3, x=carX0, y=carTop, w=carLen, h=carBot-carTop;
  c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h); c.lineTo(x,y+h); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
}
function bodyFill(c){const g=c.createLinearGradient(carX0,0,carX1,0);g.addColorStop(0,'#cbbdcb');g.addColorStop(.6,'#e6d6dc');g.addColorStop(1,'#f6dfd6');return g;}
function drawCar(c,a,dx){
  c.save(); c.globalAlpha=a; c.translate(dx,0);
  c.beginPath(); bodyPath(c); holes(c); c.fillStyle=bodyFill(c); c.fill('evenodd');
  c.save(); c.beginPath(); bodyPath(c); c.clip();
  c.fillStyle='#bfb2c0'; c.fillRect(carX0,carTop,carLen,win.h*.16);
  c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(carX0,carTop+win.h*.16,carLen,win.h*.012);
  const sY=win.y+win.h+win.h*.14;
  c.fillStyle='#b8b3ff'; c.fillRect(carX0,sY,carLen,win.h*.025);
  c.fillStyle='#DE7E98'; c.fillRect(carX0,sY+win.h*.05,carLen,win.h*.13);
  c.fillStyle='#4a464c'; c.fillRect(carX0,carBot-win.h*.14,carLen,win.h*.14);
  c.restore();
  for(const x of windowXs()){ rr(c,x,win.y,win.w,win.h,win.r); c.fillStyle='rgba(30,40,60,.18)'; c.fill(); c.lineWidth=win.h*.035; c.strokeStyle='#2e2b31'; c.stroke();
    c.save(); c.clip(); c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x+win.w*.15,win.y); c.lineTo(x+win.w*.35,win.y); c.lineTo(x+win.w*.1,win.y+win.h); c.lineTo(x-win.w*.1,win.y+win.h); c.closePath(); c.fill(); c.restore(); }
  for(const d of doors){
    const dTop=win.y-win.h*.22, dBot=carBot-win.h*.16;
    c.beginPath(); c.rect(d.x,dTop,d.w,dBot-dTop); for(const [x,y,w,h] of doorWins(d)) rrp(c,x,y,w,h,w*.25);
    c.fillStyle='#d6cad3'; c.fill('evenodd'); c.lineWidth=win.h*.012; c.strokeStyle='#b9b2a7'; c.strokeRect(d.x,dTop,d.w,dBot-dTop);
    c.fillStyle='#b9b2a7'; c.fillRect(d.x+d.w/2-win.h*.006,dTop,win.h*.012,dBot-dTop);
    for(const [x,y,w,h] of doorWins(d)){ rr(c,x,y,w,h,w*.25); c.fillStyle='rgba(30,40,60,.18)'; c.fill(); c.lineWidth=win.h*.025; c.strokeStyle='#2e2b31'; c.stroke(); }
  }
  for(const bx of [carX0+carLen*.14,carX1-carLen*.14]){
    c.fillStyle='#3a373c'; c.fillRect(bx-win.w*.35,carBot,win.w*.7,railY-carBot-win.h*.06);
    for(const wx of [bx-win.w*.2,bx+win.w*.2]){ c.beginPath(); c.arc(wx,railY-win.h*.13,win.h*.14,0,Math.PI*2); c.fillStyle='#2a272c'; c.fill(); c.beginPath(); c.arc(wx,railY-win.h*.13,win.h*.05,0,Math.PI*2); c.fillStyle='#77727a'; c.fill(); }
  }
  c.textAlign='center'; c.textBaseline='middle';
  c.font=`600 ${win.h*.07}px Inter, system-ui, sans-serif`; c.fillStyle='#55585f'; c.fillText('LW 01',doors[1].x-g*.5,win.y-win.h*.1);
  c.fillStyle='#ffe9b8'; c.fillRect(carX0+win.h*.06,carBot-win.h*.32,win.h*.08,win.h*.05); c.fillRect(carX1-win.h*.14,carBot-win.h*.32,win.h*.08,win.h*.05);
  c.restore();
}

function tfont(w,sz,f){return `${w} ${sz}px ${f==='serif'?"'Instrument Serif', Georgia, serif":"Inter, system-ui, sans-serif"}`;}
function spaced(k,text,x,y,ls,align){
  let w=0; for(const ch of text) w+=k.measureText(ch).width+ls; w-=ls;
  let xx=align==='right'?x-w:align==='center'?x-w/2:x;
  const a=k.textAlign; k.textAlign='left'; for(const ch of text){ k.fillText(ch,xx,y); xx+=k.measureText(ch).width+ls; } k.textAlign=a; return w;
}
function buildTicket(){
  if(!tk) return;
  const w=tk.w,h=tk.h,pad=24,S=DPR*2.2;
  const mkT=()=>{const c=document.createElement('canvas');c.width=Math.ceil((w+pad*2)*S);c.height=Math.ceil((h+pad*2)*S);const k=c.getContext('2d');k.setTransform(S,0,0,S,S*pad,S*pad);return [c,k];};
  const sx=w*.76, nr=h*.075, ink='#1d1a22', mute='#6b6470', m=w*.05, L=Math.max(7,h*.05);
  function base(k,back){
    k.beginPath(); k.moveTo(8,0); k.lineTo(sx-nr,0); k.arc(sx,0,nr,Math.PI,0,true); k.lineTo(w-8,0); k.quadraticCurveTo(w,0,w,8); k.lineTo(w,h-8); k.quadraticCurveTo(w,h,w-8,h); k.lineTo(sx+nr,h); k.arc(sx,h,nr,0,Math.PI,true); k.lineTo(8,h); k.quadraticCurveTo(0,h,0,h-8); k.lineTo(0,8); k.quadraticCurveTo(0,0,8,0); k.closePath();
    k.fillStyle=back?'#efe5d3':'#f4ebdb'; k.fill();
    k.save(); k.clip(); const R=rng(back?19:9); for(let i=0;i<w*h/50;i++){k.fillStyle=`rgba(110,80,60,${R()*.07})`;k.fillRect(R()*w,R()*h,1.2,1.2);}
    k.fillStyle='#DE7E98'; k.fillRect(0,h*.885,w,h*.04); k.restore();
    k.strokeStyle='rgba(70,50,60,.4)'; k.setLineDash([3,4]); k.lineWidth=1; k.beginPath(); k.moveTo(sx,nr+5); k.lineTo(sx,h-nr-5); k.stroke(); k.setLineDash([]);
  }
  const label=(k,t,x,y,al='left',col=mute)=>{k.fillStyle=col; k.font=tfont(600,L,'sans'); k.textBaseline='alphabetic'; spaced(k,t,x,y,L*.18,al);};
  const rule=(k,y,x0=m,x1=sx-m)=>{k.fillStyle='rgba(29,26,34,.28)'; k.fillRect(x0,y,x1-x0,1);};
  const scx=(sx+w)/2;
  // front: the slogan as the route
  const [fc,f]=mkT(); base(f,false);
  label(f,'LW LINE · WINDOW SEAT',m,h*.15); label(f,'NO. 2026',sx-m,h*.15,'right');
  rule(f,h*.2);
  let vs=h*.18, wC,wA,wT,gap;
  for(let i=0;i<20;i++){
    f.font=tfont('italic 400',vs*1.12,'serif'); wC=f.measureText('Complexity').width;
    f.font=tfont(400,vs*.6,'sans'); wA=f.measureText('→').width;
    f.font=tfont(700,vs,'sans'); wT=f.measureText('Clarity').width; gap=vs*.3;
    if(wC+wA+wT+gap*2<=sx-m*2) break; vs*=.94;
  }
  const xA=m+wC+gap, xT=xA+wA+gap;
  label(f,'FROM',m,h*.33); label(f,'TO',xT,h*.33);
  f.textBaseline='alphabetic'; f.textAlign='left';
  f.fillStyle=ink; f.font=tfont('italic 400',vs*1.12,'serif'); f.fillText('Complexity',m,h*.54);
  f.fillStyle='#a94a63'; f.font=tfont(400,vs*.6,'sans'); f.fillText('→',xA,h*.52);
  f.fillStyle=ink; f.font=tfont(700,vs,'sans'); f.fillText('Clarity',xT,h*.54);
  rule(f,h*.65);
  label(f,'ONE WAY',m,h*.77); label(f,'SEAT 07',(m+sx-m)/2,h*.77,'center'); label(f,'PLATFORM 1',sx-m,h*.77,'right');
  label(f,'STOP',scx,h*.2,'center');
  f.fillStyle=ink; f.font=tfont(700,h*.2,'sans'); f.textAlign='center'; f.fillText('01',scx,h*.47);
  label(f,'SELECTED',scx,h*.62,'center'); label(f,'WORK',scx,h*.71,'center');
  f.textAlign='left';
  // back: who you are
  const [bc,b]=mkT(); base(b,true);
  label(b,'PASSENGER RECORD',m,h*.15); label(b,'LW 01',sx-m,h*.15,'right'); rule(b,h*.2);
  const rows=[['PASSENGER','Lina Wang'],['CLASS','Product designer'],['FOCUS','AI and enterprise tools'],['PREVIOUS STOP','Microsoft']];
  const r0=h*.2, rh=(h*.83-r0)/rows.length;
  rows.forEach(([l,v],i)=>{
    const y=r0+rh*(i+.64); label(b,l,m,y);
    b.fillStyle=ink; let vf=rh*(i===0?.5:.4); b.font=tfont(i===0?600:500,vf,i===0?'sans':'sans');
    while(b.measureText(v).width>sx-m*2-w*.2&&vf>6){vf*=.94; b.font=tfont(i===0?600:500,vf,'sans');}
    b.textAlign='right'; b.fillText(v,sx-m,y+rh*.05); b.textAlign='left';
    if(i<rows.length-1) rule(b,r0+rh*(i+1));
  });
  const R=rng(31); let bx=sx+w*.05; while(bx<w-w*.05){const bw2=1+R()*3; b.fillStyle=ink; b.fillRect(bx,h*.2,bw2,h*.48); bx+=bw2+1+R()*3;}
  label(b,'ADMIT ONE',scx,h*.79,'center');
  tkF=fc; tkB=bc;
}
function drawTicket(c,a){
  if(!tkF||a<.01) return;
  const pad=24, fl=flipV, sc=Math.cos(Math.PI*fl), img=sc>=0?tkF:tkB, lift=1+.06*Math.sin(Math.PI*fl);
  // o: 0 = lying flat on the seat (foreshortened), 1 = held up facing the camera
  const o=clamp(.45*ease(seg(cp,0,.07))+.55*zoomV);
  const sy=.3+.7*o, taper=.26*(1-o);
  const flatY=seatBot-tk.h*.3*.5-4, cyy=flatY+(tk.cy-flatY)*o;
  const fw=tk.w+pad*2, fh=tk.h+pad*2, dh=fh*sy*lift, xs=Math.max(.02,Math.abs(sc))*lift;
  c.save(); c.globalAlpha=a; c.translate(tk.cx,cyy); c.rotate(tk.rot*(1-o*.85)+(1-o)*-.03);
  // soft contact shadow
  c.save(); c.shadowColor='rgba(8,4,14,.55)'; c.shadowBlur=(14+12*o)*DPR; c.shadowOffsetY=(4+8*o)*DPR;
  c.beginPath(); const tt=tk.w*(1-taper)*xs/2, bb=tk.w*xs/2, hh=tk.h*sy*lift/2;
  c.moveTo(-tt,-hh); c.lineTo(tt,-hh); c.lineTo(bb,hh); c.lineTo(-bb,hh); c.closePath(); c.fillStyle='rgba(8,4,14,.35)'; c.fill(); c.restore();
  // perspective: draw in horizontal strips, narrower at the far (top) edge
  const n=36, iw=img.width, ih=img.height;
  for(let i=0;i<n;i++){
    const v0=i/n, v1=(i+1)/n, k=1-taper*(1-(v0+v1)/2), dw=fw*k*xs;
    const yy=-dh/2+v0*dh;
    c.drawImage(img,0,v0*ih,iw,ih/n+1,-dw/2,yy,dw,dh/n+.6);
  }
  c.restore();
}
const slogStyle='B'; // wave
function drawSloganC(c,x,y,size,a,align){
  if(a<.01) return; const k=ease(clamp((t-slogStart)/1.8));
  const LS=false; // manual tracking: changing ctx.letterSpacing can briefly swap fonts in some browsers
  c.save(); c.globalAlpha=a; c.fillStyle='#fff6f1'; c.shadowColor='rgba(26,12,40,.32)'; c.shadowBlur=12*DPR; c.textBaseline='alphabetic'; c.textAlign='left';
  const S=size, SI=S*1.2, tt=t-slogStart, e1=ease(clamp(tt/.9)), rise=S*.28;
  const e2=ease(clamp((tt-(.55+.1*9+1.3)+.05)/.8));                             // italic a touch larger so its x-height sits with Inter
  const fA=tfont(500,S,'sans'), fB=tfont(700,S,'sans'), fI=tfont('italic 400',SI,'serif');
  const tA=-.05*S, tB=-.04*S, tI=-.02*SI;   // homepage: Instrument Serif Italic at 1.333x, -0.02em
  // one pass of the homepage wave: each letter of Complexity bobs up and back, staggered
  const WS=.55, WD=1.3, WG=.1, AMP=SI*.055, waveEnd=WS+WG*9+WD;
  const drawWave=(px,py)=>{ c.font=fI; let xx=px; let i=0;
    for(const ch of 'Complexity'){ const lt=tt-WS-i*WG, ph=clamp(lt/WD), off=lt>0&&lt<WD?-AMP*(.5-.5*Math.cos(ph*Math.PI*2)):0;
      c.fillText(ch,xx,py+off); xx+=c.measureText(ch).width+tI; i++; } };
  const meas=(f,str,tr)=>{ c.font=f; if(LS){ c.letterSpacing=tr+'px'; const w=c.measureText(str).width-tr; c.letterSpacing='0px'; return w; } let w=0; for(const ch of str) w+=c.measureText(ch).width+tr; return w-tr; };
  const draw=(f,str,px,py,tr)=>{ c.font=f; if(LS){ c.letterSpacing=tr+'px'; c.fillText(str,px,py); c.letterSpacing='0px'; return; } for(const ch of str){ c.fillText(ch,px,py); px+=c.measureText(ch).width+tr; } };
  // soft focus without ctx.filter (Safari): stacked low-alpha copies around a ring
  const soft=(f,str,px,py,tr,rad,al)=>{ const ga=c.globalAlpha; c.shadowBlur=0;
    for(let i=0;i<10;i++){ const an=i/10*Math.PI*2, rr=rad*(i%2?1:.55); c.globalAlpha=ga*al*.16; draw(f,str,px+Math.cos(an)*rr,py+Math.sin(an)*rr,tr); }
    c.globalAlpha=ga*al*.22; draw(f,str,px,py,tr); c.globalAlpha=ga; c.shadowBlur=12*DPR; };
  const gap=S*.2025, lead=S*1.04;                     // from Figma: 16px gap and 82px leading at 79px                        // word space and leading
  const flush=align==='left';
  if(slogStyle==='D'){
    const wD=meas(fA,'I design',tA), wC=meas(fI,'Complexity',tI), wL=meas(fB,'Clarity',tB), seg=S*1.05;
    const w2=wC+gap+seg+gap+wL, x0=flush?x:x-Math.max(wD,w2)/2;
    const b1=y-S*.12+rise*(1-e1), b2=y-S*.12+lead+rise*(1-e2);
    c.globalAlpha=a*e1; draw(fA,'I design',x0,b1,tA);
    const b2c=y-S*.12+lead+rise*(1-e1); c.globalAlpha=a*e1*.8; drawWave(x0,b2c);
    // pink route segment with two stations, drawn left to right
    const sx=x0+wC+gap, sy=b2c-S*.34, lw=Math.max(3,S*.075), p=ease(clamp((tt-waveEnd)/.6));
    c.globalAlpha=a*e2; c.shadowBlur=0;
    c.fillStyle='#DE7E98'; c.fillRect(sx,sy-lw/2,seg*p,lw);
    const st=(cx,on)=>{ c.beginPath(); c.arc(cx,sy,lw*1.15,0,Math.PI*2); c.fillStyle=on?'#DE7E98':'#3a2a3e'; c.fill(); c.lineWidth=lw*.55; c.strokeStyle='#DE7E98'; c.stroke(); };
    if(p>0) st(sx,false); if(p>=1) st(sx+seg,true);
    c.shadowBlur=12*DPR; c.fillStyle='#fff6f1';
    c.globalAlpha=a*ease(clamp((tt-waveEnd-.45)/.5)); draw(fB,'Clarity',sx+seg+gap,b2c+rise*(1-ease(clamp((tt-waveEnd-.45)/.5))),tB);
  } else {
    const wD=meas(fA,'I design',tA), wC=meas(fI,'Complexity',tI), wI=meas(fA,'into',tA), wL=meas(fB,'Clarity',tB);
    const w1=wD+gap+wC, w2=wI+gap+wL, x0=flush?x:x-Math.max(w1,w2)/2;
    const b1=y-S*.12+rise*(1-e1), b2=y-S*.12+lead+rise*(1-e2);
    c.globalAlpha=a*e1; draw(fA,'I design',x0,b1,tA);
    // Complexity stays out of focus, like it's seen through the wet glass; it eases a little sharper as Clarity lands
    c.globalAlpha=a*e1; drawWave(x0+wD+gap,b1);
    c.globalAlpha=a*e2; draw(fA,'into',x0,b2,tA); draw(fB,'Clarity',x0+wI+gap,b2,tB);
  }
  c.restore();
}

// Wall text, laid out exactly as the Figma frame "Wall text · 1440" (node 22:170), in design px at 1440 wide
function wallZoom(){ return panel&&panel.phone?(W*.9)/g:Math.max(1.6,(W*1160/1440)/g); }   // phone: the panel fills 90% of the width, window edges show either side   // panel fills 1160 of 1440 px, as in Figma
function drawWallText(c,a){
  if(a<.01||!panel) return;
  const zW=wallZoom();
  if(panel.phone){ const u=Math.min(1,(W*.82)/755)/zW; drawWallTextAt(c,a,panel.x-755*u/2,panel.y-428*u/2,u); return; }
  const u0=(W/1440)/zW, u=u0*WT; drawWallTextAt(c,a,panel.x+(311-720)*u0,panel.y-428*u/2,u);
}
function drawWallTextAt(c,a,X0,Y0,u){
  const ink='#fff6f1', pink='#DE7E98';
  c.save(); c.globalAlpha=a; c.textAlign='left'; c.textBaseline='middle';
  c.shadowColor='rgba(26,12,40,.45)'; c.shadowBlur=14*DPR;
  const font=(w,sz,serif)=>serif?`italic 400 ${sz*u}px 'Instrument Serif', Georgia, serif`:`${w} ${sz*u}px Inter, system-ui, sans-serif`;
  const run=(parts,x,cy)=>{ let xx=X0+x*u; for(const [txt,w,sz,col,trk,serif,al] of parts){ c.font=font(w,sz,serif); c.fillStyle=col; const ga=c.globalAlpha; if(al!=null) c.globalAlpha=ga*al;
      const tr=trk*sz*u; for(const ch of txt){ c.fillText(ch,xx,Y0+cy*u); xx+=c.measureText(ch).width+tr; } c.globalAlpha=ga; } return xx; };
  // headline stack
  run([["I'm ",500,64,ink,-.05],['Lina Wang',600,64,pink,-.05],[',',500,64,ink,-.05]],0,35);
  run([['a product designer',400,80,ink,0,true]],0,72+40);
  run([['and a builder.',500,64,ink,-.05]],0,154+32);
  // subline
  run([['Building intuitive interfaces and interactions for',600,32,ink,0,false,.92]],0,258+21.8);
  run([['AI products',600,32,pink,0],[' and enterprise tools.',600,32,ink,0,false,.92]],0,258+43.5+21.8);
  // credential pill with the Microsoft mark
  c.shadowBlur=0;
  const py=366, ph=62, px=0;
  c.font=font(500,25); let tw=0; for(const ch of 'Prev. Product Design Intern @ Microsoft') tw+=c.measureText(ch).width;
  const pw=28+tw/u+4+27+28;                       // padding · text · 4px gap · 27px logo · padding (as in Figma)
  rr(c,X0+px*u,Y0+py*u,pw*u,ph*u,ph*u/2); c.fillStyle='rgba(22,14,34,.45)'; c.fill(); c.lineWidth=Math.max(.5,1*u); c.strokeStyle='rgba(255,255,255,.35)'; c.stroke();
  const tEnd=run([['Prev. Product Design Intern @ Microsoft',500,25,ink,0]],28,py+ph/2);
  // centre the mark on the text's cap height rather than the pill box
  c.font=font(500,25); const mm=c.measureText('M'), capMid=(mm.actualBoundingBoxDescent-mm.actualBoundingBoxAscent)/2;
  const q=12*u, gq=1*u, logo=q*2+gq*3, lx=tEnd+6*u, ly=Y0+(py+ph/2)*u+capMid-logo/2;
  [['#F25022',0,0],['#7FBA00',1,0],['#00A4EF',0,1],['#FFB900',1,1]].forEach(([col,i,j])=>{ c.fillStyle=col; c.fillRect(lx+gq+i*(q+gq),ly+gq+j*(q+gq),q,q); });
  c.restore();
}
function wrapLines(c,text,maxW){const words=text.split(' ');const out=[];let l='';for(const w of words){const tt=l?l+' '+w:w; if(c.measureText(tt).width>maxW&&l){out.push(l);l=w;} else l=tt;} if(l) out.push(l); return out;}
function drawIntroC(c,x,y,maxW,sz,a){
  if(a<.01) return;
  c.save(); c.globalAlpha=a; c.fillStyle='#fff6f1'; c.shadowColor='rgba(26,12,40,.45)'; c.shadowBlur=14*DPR; c.textAlign='center'; c.textBaseline='alphabetic';
  let s1=sz; const fits=()=>{c.font=tfont(600,s1,'sans'); const a1=c.measureText("I'm Lina Wang,").width; c.font=tfont('italic 400',s1*1.08,'serif'); return Math.max(a1,c.measureText('a product designer').width)<=maxW;}; while(!fits()&&s1>10) s1*=.95;
  const ss=Math.max(11,s1*.36); c.font=tfont(400,ss,'sans'); const lines=wrapLines(c,'Building intuitive interfaces and interactions for AI products and enterprise tools',maxW);
  const ps=Math.max(10,ss*.75), ph=ps*2.2;
  const total=s1*1.05+s1*1.1+ss*.6+lines.length*ss*1.5+ss*.6+ph;
  let yy=y-total/2+s1*.85;
  c.font=tfont(600,s1,'sans'); c.fillText("I'm Lina Wang,",x,yy); yy+=s1*1.1;
  c.font=tfont('italic 400',s1*1.08,'serif'); c.fillText('a product designer',x,yy); yy+=ss*.6+ss*1.3;
  c.font=tfont(400,ss,'sans'); for(const l of lines){ c.fillText(l,x,yy); yy+=ss*1.5; }
  c.shadowBlur=0; c.font=tfont(500,ps,'sans'); const pt='Prev. Product Design Intern @ Microsoft'; const pw=c.measureText(pt).width+ps*2.2;
  const py0=yy-ss*.6; rr(c,x-pw/2,py0,pw,ph,ph/2); c.fillStyle='rgba(22,14,34,.45)'; c.fill(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; c.stroke();
  c.fillStyle='#fff6f1'; c.textBaseline='middle'; c.fillText(pt,x,py0+ph/2);
  c.restore();
}

const S0=.22;
const WALL=.3, WT=.78, WTP=.88;   // wall text scale vs. the Figma frame (desktop, phone)   // story point where the camera rests on the wall text
function storyP(p){ if(!GAL()) return {sp:p*WALL,gq:0}; const q=p*(1+G); if(q<S0) return {sp:q,gq:0}; if(q<S0+G) return {sp:S0,gq:(q-S0)/G}; return {sp:q-G,gq:1}; }
function rawOf(sp){ return !GAL()?Math.min(1,sp/WALL):(sp<S0?sp/(1+G):(sp+G)/(1+G)); }
const prog=$('prog'), pfill=$('pfill'), gal=$('gal'), gtrack=$('gtrack');
function buildDots(){
  prog.querySelectorAll('.pdot').forEach(d=>d.remove());
  const uniq=GAL()?[0,rawOf(.12),S0/(1+G),(S0+G*.3)/(1+G),rawOf(.38),rawOf(.72),.995]:[0,.12,.2,.38,.72,.995];
}
(()=>{ const m=$('mol'); const pts=[[20,30],[55,22],[70,55],[38,62],[50,85],[82,30]]; const e=[[0,1],[1,2],[2,3],[3,0],[3,4],[1,5]];
  for(const [a,b] of e){ const [x1,y1]=pts[a],[x2,y2]=pts[b]; const l=document.createElement('s'); l.style.left=x1+'%'; l.style.top=y1+'%'; m.appendChild(l); l.dataset.k=[x1,y1,x2,y2].join(','); }
  pts.forEach(([x,y],i)=>{ const b=document.createElement('b'); const sz=i===2?18:12; b.style.cssText=`left:calc(${x}% - ${sz/2}px);top:calc(${y}% - ${sz/2}px);width:${sz}px;height:${sz}px`; m.appendChild(b); });
})();
function sizeMol(){ const m=$('mol'), w=m.clientWidth, h=m.clientHeight; m.querySelectorAll('s').forEach(l=>{ const [x1,y1,x2,y2]=l.dataset.k.split(',').map(Number); const dx=(x2-x1)*w/100, dy=(y2-y1)*h/100; l.style.width=Math.hypot(dx,dy)+'px'; l.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`; }); }
function clipHalf(poly,C,u,s,keepFar){ // keep points with (C-x)·u >= s (keepFar) or < s
  const f=p=>((C[0]-p[0])*u[0]+(C[1]-p[1])*u[1])-s, out=[];
  for(let i=0;i<poly.length;i++){ const a=poly[i], b=poly[(i+1)%poly.length], fa=f(a), fb=f(b), ina=keepFar?fa>=0:fa<0, inb=keepFar?fb>=0:fb<0;
    if(ina) out.push(a); if(ina!==inb){ const k=fa/(fa-fb); out.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]); } }
  return out;
}
function applyPeel(k){
  const w=tkWrap.clientWidth, h=tkWrap.clientHeight, D=Math.hypot(w,h), u=[w/D,h/D], C=[w,h], s=k*D*1.02;
  if(k<=0){ tkEl.style.clipPath='none'; tkFlap.style.visibility='hidden'; return; }
  const rect=[[0,0],[w,0],[w,h],[0,h]];
  const keep=clipHalf(rect,C,u,s,true), gone=clipHalf(rect,C,u,s,false);
  tkEl.style.clipPath=keep.length?`polygon(${keep.map(p=>p[0].toFixed(1)+'px '+p[1].toFixed(1)+'px').join(',')})`:'polygon(0 0,0 0,0 0)';
  const refl=gone.map(p=>{ const d=s-((C[0]-p[0])*u[0]+(C[1]-p[1])*u[1]); return [p[0]-2*d*u[0],p[1]-2*d*u[1]]; });
  tkFlap.style.visibility=refl.length>2?'visible':'hidden';
  tkFlap.style.clipPath=refl.length>2?`polygon(${refl.map(p=>p[0].toFixed(1)+'px '+p[1].toFixed(1)+'px').join(',')})`:'none';
}
// The push at the end shows a live copy of your projects section, so landing on the real one is seamless
function buildClone(){
  const src=document.getElementById('projects'), host=document.getElementById('wsClone'); if(!src||!host) return;
  const c=src.cloneNode(true); c.removeAttribute('id');
  c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  c.querySelectorAll('[data-aos]').forEach(n=>{ n.removeAttribute('data-aos'); n.classList.remove('aos-init'); n.style.opacity='1'; n.style.transform='none'; });
  c.querySelectorAll('img').forEach(i=>i.loading='eager');
  host.replaceChildren(c);
}
function markProjectsShown(){ document.querySelectorAll('#projects [data-aos]').forEach(n=>{ const r=n.getBoundingClientRect(); n.classList.add('aos-animate'); }); }
function layout(){
  W=stage.clientWidth; H=stage.clientHeight; DPR=Math.min(window.devicePixelRatio||1,1.5);
  for(const c of [cvs,off,mixC,lightC]){c.width=W*DPR|0;c.height=H*DPR|0;}
  const m=W<700;
  const x=m?16:Math.max(28,W*.07), y=m?Math.max(132,H*.17):Math.max(132,H*.15);   // clears your 80px header
  const h=Math.max(220,H-y-(m?Math.max(170,H*.26):Math.max(150,H*.3)));
  win={x,y,w:W-2*x,h,r:m?22:34};
  side=win.w>=720; stage.classList.toggle('side',side);
  const st=stage.style; st.setProperty('--wx',x+'px'); st.setProperty('--wy',y+'px'); st.setProperty('--ww',win.w+'px'); st.setProperty('--wh',win.h+'px'); st.setProperty('--wr',win.r+'px');
  seatTop=win.y+win.h+Math.max(24,H*.035); seatBot=H-Math.max(26,H*.055); cushH=H-seatBot;
  st.setProperty('--st',seatTop+'px'); st.setProperty('--sb',seatBot+'px');
  P=win.w*1.3; g=P-win.w; ceilY=win.y-win.h*.6; floorY=H+win.h*.3;
  const dW=win.w*.5;
  doors=[{x:win.x-3*P-g-dW,w:dW},{x:win.x+3*P+win.w+g,w:dW}];
  carX0=doors[0].x-g*1.2; carX1=doors[1].x+dW+g*1.2; carLen=carX1-carX0;
  carTop=ceilY-win.h*.1; carBot=floorY+win.h*.18; railY=carBot+win.h*.3;
  carCx=win.x+win.w/2; carCy=(carTop+railY)/2;
  zInt=clamp(W/(2.7*P),.2,.5);
  zExt=Math.max(W/(carLen*1.1),H*.15/(railY-carTop));
  yf=win.y+win.h*.78; yb=win.y+win.h; signBottom=yf-win.h*.05;
  signCx=side?win.x+win.w*.73:win.x+win.w*.5;
  let sw0=side?Math.min(win.w*.36,440):win.w*.84;
  const lim=signBottom-(win.y+win.h*(side?.16:.56)); if(sw0*.42>lim) sw0=lim/.42;
  sign0w=Math.max(120,sw0); buildSign();
  pfHalf=Math.max(win.w*1.5,900);
  const f=document.createElement('canvas'); f.width=8; f.height=8; const fx=f.getContext('2d');
  fx.fillStyle='rgba(255,255,255,.08)'; fx.fillRect(0,0,2,8); fx.fillStyle='rgba(40,70,60,.06)'; fx.fillRect(0,4,8,1);
  fabric=oc.createPattern(f,'repeat');
  const R=rng(5);
  buildRain();
  motes=[]; for(let i=0;i<60;i++) motes.push({x:R(),y:R(),r:.6+R()*1.1,s:.2+R()*.6,p:R()*6});
  BW=W*1.8;
  const sm=(seatTop+seatBot)/2;
  const tw=side?Math.min(560,W*.42):W*.86;
  tk={w:tw,h:tw*.42,cx:W/2,cy:sm+(side?14:0),rot:-.05};
  panel=side?{x:win.x+win.w+g/2,y:win.y+win.h*.5,maxW:g*.8,s:Math.min(g*.12,48)}:null;
  buildTicket();
  scenes={seattle:buildSeattle()};
  if(typeof measureTrack==='function') measureTrack(); else trackW=gtrack.scrollWidth; sizeMol();
  if(pfX!==null&&mode==='stopped') pfX=signCx;
}

function updateMotion(dt,p){
  const afterTunnel=ti>=2.42;
  if(reduce){
    s=0;
    if(true){ if(mode!=='stopped'){mode='stopped';pfX=signCx;stopT=5;} }
    else if(cp<.385){ mode='cruise'; pfX=null; }
    stopT+=dt; return;
  }
  if(afterTunnel&&mode==='cruise') cruiseT+=dt;
  // a few seconds of open view, then the train pulls in by itself
  if(mode==='cruise'&&afterTunnel&&cruiseT>=2.6&&pfX===null&&s>.9){ mode='arriving'; arrA=0; s0=s; pfL=PF_V*s0*ARR/2; pfX=signCx+pfL; }
  if(false){ depD=mode==='arriving'?s0*(1-arrA):0; mode='departing'; }
  if(mode==='arriving'){ arrA=Math.min(1,arrA+dt/ARR); s=s0*(1-arrA); pfX=signCx+pfL*(1-arrA)**2; if(arrA>=1){mode='stopped';stopT=0;s=0;} }
  else if(mode==='stopped'){ s=0; stopT+=dt; pfX=signCx; }
  else if(mode==='departing'){ depD=Math.min(1,depD+dt/DEP); s=depD; pfX-=dt*s*PF_V; if(depD>=1) mode='cruise'; }
  else { const tg=ti<2.42?1.3:1; s+=(tg-s)*Math.min(1,dt*1.5); if(pfX!==null) pfX-=dt*s*PF_V; }
  if(pfX!==null&&(mode==='cruise'||mode==='departing')&&pfX+pfHalf<-100) pfX=null;
  D+=dt*s;
}

let uM=0;
function render(){
  const u1=ease(seg(cp,.38,.52)), u2=ease(seg(cp,.52,.64)), ux=ease(seg(cp,.54,.62)), uL=seg(cp,.64,.86);
  uM=ease(seg(cp,.72,.94));
  z=Math.exp(Math.log(zInt)*u1+Math.log(zExt/zInt)*u2);
  const intCy=win.y+win.h*.8, extCy=carCy-H*.1/zExt;
  cx=W/2+(carCx-W/2)*u1; cy=H/2+(intCy-H/2)*u1+(extCy-intCy)*u2;
  const a1=ease(seg(cp,0,.07)), aOut=ease(seg(cp,.33,.38)), sm=(seatTop+seatBot)/2;
  let lx=W/2, ly=H/2, lz=1;
  if(layoutMode==='ticket'){ }
  else { ly=H/2+((sm-H*.12)-H/2)*a1; if(panel){ lx+=(panel.x-lx)*panV; ly+=(panel.y-ly)*panV; lz=1+(GAL()?.32:(wallZoom()-1))*panV; }
    else if(!GAL()){ const zi=ease(introVis); lx+=(win.x+win.w+g/2-lx)*zi; ly+=(win.y+win.h*.5-ly)*zi; lz=1+(Math.max(2.4,W/(g*.55))-1)*zi; } lz*=1+2.6*galEx; }
  lx+=(W/2-lx)*aOut; ly+=(H/2-ly)*aOut; lz+=(1-lz)*aOut;
  const wcx=win.x+win.w/2, wcy=win.y+win.h/2;
  const dxL=(wcx-lx)*lz+W/2-wcx, dyL=(wcy-ly)*lz+H/2-wcy;
  behind.style.transform=`translate3d(${((uM-1)*100).toFixed(2)}%,0,0)`;
  const nearA=clamp((z-.45)/.5), tunnel=ti<2.42;
  const sunAmt=reduce?1:tunnel?0:ease(clamp((ti-2.3)/1));
  oc.setTransform(DPR,0,0,DPR,0,0); oc.clearRect(0,0,W,H);
  oc.setTransform(DPR,0,0,DPR,DPR*dxL*.35,DPR*dyL*.35);
  occ.length=0; gap=pfX!==null?[pfX-pfHalf,pfX+pfHalf]:null;
  if(tunnel) drawTunnel(oc,D);
  else {
    if(prevView&&xf<1){
      scenes[prevView].draw(oc,D,t,s,nearA);
      mc.setTransform(1,0,0,1,0,0); mc.clearRect(0,0,mixC.width,mixC.height); mc.setTransform(DPR,0,0,DPR,DPR*dxL*.35,DPR*dyL*.35); scenes[view].draw(mc,D,t,s,nearA);
      oc.save(); oc.setTransform(1,0,0,1,0,0); oc.globalAlpha=ease(xf); oc.drawImage(mixC,0,0); oc.restore(); oc.setTransform(DPR,0,0,DPR,DPR*dxL*.35,DPR*dyL*.35);
    } else scenes[view].draw(oc,D,t,s,nearA);
    const sn=scenes[view].sun; glow(oc,sn[0],sn[1],win.w*.3,'255,214,190',.4*sunAmt,1);
  }
  plat=null;
  if(pfX!==null&&!tunnel){
    const zf=Math.pow(z,.5), n=clamp((1-z)/(1-zExt));
    const carFloorS=(floorY-cy)*z+H/2, carHS=(railY-carTop)*z, targetS=carFloorS-.12*carHS;
    const cyT=yf-(targetS-H/2)/zf, cyp=H/2+(cyT-H/2)*n, cxp=cx;
    plat={zf,cxp,cyp};
    oc.setTransform(DPR*zf,0,0,DPR*zf,DPR*(W/2-cxp*zf+dxL*.8),DPR*(H/2-cyp*zf+dyL*.8));
    drawPlatform(oc,pfX,false);
    oc.setTransform(DPR,0,0,DPR,0,0);
    if(ux>0){ const gy=(yb+win.h*.12-cyp)*zf+H/2; oc.globalAlpha=ux; const gr=oc.createLinearGradient(0,gy,0,H); gr.addColorStop(0,'#3a3140'); gr.addColorStop(1,'#1f1a25'); oc.fillStyle=gr; oc.fillRect(0,gy,W,H-gy); oc.globalAlpha=1; }
  }
  cx=cx+(lx-W/2); cy=cy+(ly-H/2); const zb=z; z=z*lz;
  oc.setTransform(DPR*z,0,0,DPR*z,DPR*(W/2-cx*z),DPR*(H/2-cy*z));
  const glassA=seg(zb,.6,1);
  if(glassA>0&&!tunnel){
    oc.save(); rr(oc,win.x,win.y,win.w,win.h,win.r); oc.clip();
    const rainA=(view==='seattle'?(prevView&&xf<1?ease(xf):1):(prevView==='seattle'&&xf<1?1-ease(xf):0))*glassA;
    drawRain(oc,rainA);
    oc.save(); oc.translate(win.x+win.w*.16,win.y); oc.rotate(.35);
    let gr=oc.createLinearGradient(0,0,win.w*.12,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,`rgba(255,255,255,${.06*glassA})`); gr.addColorStop(1,'rgba(255,255,255,0)');
    oc.fillStyle=gr; oc.fillRect(0,-H,win.w*.12,H*3); oc.fillRect(win.w*.16,-H,win.w*.03,H*3); oc.restore();
    if(cgx>-900&&zb>.98&&lz<1.02) glow(oc,cgx,cgy,Math.min(320,win.w*.3),'255,255,255',.1,1);
    oc.restore();
  }
  if(tunnel){ oc.save(); rr(oc,win.x,win.y,win.w,win.h,win.r); oc.clip(); const gr=oc.createLinearGradient(0,win.y,0,win.y+win.h*.2); gr.addColorStop(0,'rgba(255,236,244,.14)'); gr.addColorStop(1,'rgba(255,236,244,0)'); oc.fillStyle=gr; oc.fillRect(win.x,win.y,win.w,win.h*.2); oc.restore(); }
  if(ux<1){
    drawInterior(oc,1-ux);
    ledBox(oc,win.x+win.w/2,win.y-46,ledLabel,1-ux);
    if(layoutMode!=='ticket'){
      const sz=side?Math.min((seatBot-seatTop)*.36,win.w*.066):Math.min((seatBot-seatTop)*.34,win.w*.064);
      const iv=panel?panV:introVis;
      drawSloganC(oc,side?win.x+win.w*.035:W/2,sm,sz,(slogShown?1:0)*(1-iv)*(1-aOut)*(1-ux),side?'left':'center');
      if(!GAL()){ if(panel) drawWallText(oc,panV*(1-aOut)*(1-ux));
      }
    }
    drawSunPatches(oc,sunAmt*(1-ux));
    drawBeam(oc,sunAmt*(1-ux)*seg(zb,.7,1));
  }
  if(ux>0){
    drawRails(oc,ux);
    const dxw=Math.pow(uL,2.2)*(W/z)*1.25;
    if(uL>.15){ const gpx=win.w*uL*1.6; drawCar(oc,ux*.1,dxw-gpx); drawCar(oc,ux*.05,dxw-gpx*2); }
    drawCar(oc,ux,dxw);
  }
  oc.setTransform(DPR,0,0,DPR,0,0);
  if(!GAL()&&!panel&&introVis>.01){ const av=clamp(introVis*1.3)*(1-aOut)*(1-ux);
    oc.globalAlpha=av*.35; oc.fillStyle='#120f16'; oc.fillRect(0,0,W,H); oc.globalAlpha=1;   // light veil only, so the wall texture and sunlight show through
    const u=Math.min(1,(W-40)/755)*WTP; drawWallTextAt(oc,clamp((introVis-.35)/.65)*(1-aOut)*(1-ux),(W-755*u)/2,(H-428*u)/2,u); }
  const dim=reduce?0:tunnel?.35:.35*(1-ease(clamp((ti-2.42)/1.2)));
  if(dim>0){ oc.save(); oc.globalCompositeOperation='multiply'; oc.fillStyle=`rgba(40,44,70,${dim})`; oc.fillRect(0,0,W,H); oc.restore(); }
  const fa=ti<2.05?0:ti<2.42?(ti-2.05)/.37:ti<3.5?1-ease((ti-2.42)/1.08):0;
  if(fa>0){ oc.fillStyle=`rgba(255,246,236,${fa*.92})`; oc.fillRect(0,0,W,H); }
  if(ti<.7){ oc.fillStyle=`rgba(0,0,0,${1-ti/.7})`; oc.fillRect(0,0,W,H); }

  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cvs.width,cvs.height);
  ctx.drawImage(off,Math.round(uM*cvs.width),0);
}

let ledState='', hintState='';
function updateDOM(p,rawP){
  const sl=seg(p,.07,.12);
  sw.style.opacity=slogShown?1-sl:0; sw.style.transform=`translate3d(${(-px*8).toFixed(1)}px,${(-sl*30).toFixed(1)}px,0)`;
  iw.style.opacity=introVis.toFixed(3); iw.style.transform=`translate3d(${(-px*6).toFixed(1)}px,${((1-introVis)*16).toFixed(1)}px,0)`;
  const u1=seg(cp,.38,.45);
  let ht='',ho=0,cueMode='';
  if(!panel&&!GAL()&&mode==='stopped'&&introVis>.9&&!rideReleased){ho=clamp((wallSeenT-.5)/.5);cueMode='down';}
  else if(mode==='stopped'&&slogShown&&t-slogStart>4.8&&(panel?cp<.15:!seatGo)&&!GAL()){ho=1;cueMode='right';}
  else if(GAL()&&galV>.16&&galV<.3){ho=1;cueMode='right';}
  else if(mode==='stopped'&&stopT>1.2&&galEx<.02&&((GAL()&&galV>=.999)||(layoutMode==='pan'&&!GAL()&&p>.26)||(layoutMode==='ticket'&&peelV>=.95&&p>.26))){ho=GAL()?1-u1:clamp((wallSeenT-.5)/.5)*(rideReleased?0:1);cueMode=GAL()?'right':'down';}
  if(!slogShown&&!introVis&&!panV) ho=0;
  hint.style.opacity=ho;
  if(cueMode&&cueMode!==hintState){ hintState=cueMode; hint.classList.toggle('right',cueMode==='right'); hint.classList.toggle('down',cueMode==='down');
    // down = the original homepage cue (arrow over a line of text), in white
    $('cueArrow').setAttribute('viewBox',cueMode==='down'?'0 0 24 24':'0 0 68 59');
    $('cueArrow').classList.toggle('filled',cueMode!=='down');   // the seat arrow is the Figma shape (32:180), drawn filled
    $('cuePath').setAttribute('d',cueMode==='down'?'M12 4v14M12 18l-6-6M12 18l6-6':'M0 29.4561L0 25.4561L64 25.4561V29.4561V33.4561L0 33.4561L0 29.4561ZM66.8284 26.6276C68.3905 28.1897 68.3905 30.7224 66.8284 32.2845L41.3726 57.7403C39.8105 59.3024 37.2778 59.3024 35.7157 57.7403C34.1536 56.1782 34.1536 53.6456 35.7157 52.0835L58.3431 29.4561L35.7157 6.82864C34.1536 5.26654 34.1536 2.73388 35.7157 1.17178C37.2778 -0.390314 39.8105 -0.390314 41.3726 1.17178L66.8284 26.6276Z');
    hintText.textContent=cueMode==='down'?'View my selected works':'scroll to continue'; }
  if(cueMode==='right'){
    // bottom-right of the seat, lined up with the window's right edge and the slogan's last line (Figma frame 32:183)
    const k=W/1710; hint.style.setProperty('--k',k.toFixed(4));
    const S=side?Math.min((seatBot-seatTop)*.36,win.w*.066):Math.min((seatBot-seatTop)*.34,win.w*.064), sm=(seatTop+seatBot)/2;
    const base=sm-S*.12+S*1.04;   // baseline of "into Clarity"
    hint.style.left='auto'; hint.style.right=Math.round(W-(win.x+win.w))+'px';
    hint.style.top=Math.round(base-hint.offsetHeight+6*k)+'px';
  } else if(cueMode==='down'){
    // centered near the bottom, like the original homepage hero (positioned in CSS)
    hint.style.left=''; hint.style.right=''; hint.style.top='';
  }
  const st=mode==='arriving'?'arr':mode==='stopped'?'stop':view;
  if(st!==ledState){ledState=st; ledLabel=st==='arr'?'Arriving · Selected Work':st==='stop'?'Selected Work':lineName[view]; ledText.textContent=st==='arr'?'Arriving · Selected Work':st==='stop'?'Selected Work':lineName[view]; led.classList.toggle('arriving',st==='arr');}
  const f=1-clamp(u1*3);
  const bf=f*(1-(layoutMode==='pan'?panV:0)); led.style.opacity=f; bar.style.opacity=bf; bar.style.visibility=bf<.05?'hidden':'visible';
  ctl.style.opacity=f; ctl.style.visibility=f<.05?'hidden':'visible';
  if(layoutMode==='ticket'&&flyV>.001&&peelV<.999){
    const f=flyV, inv=1-f, wob=reduce?0:Math.sin(t*3.2)*inv*6;
    tkWrap.style.visibility='visible';
    tkWrap.style.transform=`perspective(1600px) translate3d(${(inv*62).toFixed(2)}vw,${(inv*92).toFixed(2)}vh,0) rotateX(${(inv*38+wob).toFixed(2)}deg) rotateY(${(-inv*48).toFixed(2)}deg) rotateZ(${(-inv*26).toFixed(2)}deg) scale(${(.3+.7*f).toFixed(3)})`;
    applyPeel(ease(peelV));
  } else { tkWrap.style.visibility='hidden'; }
  const cover=layoutMode==='ticket'?clamp(flyV*1.4)*(1-clamp(peelV*1.6)):0;
  bar.style.opacity=(bf*(1-cover)).toFixed(3);
  const go=GAL()?clamp((galEx-.3)/.6):0;
  gal.style.opacity=go.toFixed(3); gal.style.visibility=go<.01?'hidden':'visible';
  if(go>0){
    const vw=stage.clientWidth, vh=stage.clientHeight, A=introMode==='A';
    const appear=clamp((galV-.08)/.1), shift=Math.max(0,trackW-vw)*galW;
    if(A){
      const tr=ease(seg(galV,.3,.42)), drop=ease(seg(galV,.38,.5));
      $('gA').style.opacity=appear.toFixed(3);
      const hero=$('heroA'); hero.style.opacity=(appear*(1-clamp(tr*1.7))).toFixed(3); hero.style.transform=`translate3d(0,${(-tr*7).toFixed(2)}vh,0)`;
      const trk=$('gtrk'); trk.style.top=(vh*.7+(vh*.14-vh*.7)*tr).toFixed(1)+'px'; trk.style.clipPath=`inset(-40px ${((1-appear)*100).toFixed(1)}% -40px 0)`;
      trk.querySelectorAll('i').forEach((l,i)=>{ l.style.transform=`translateY(${(i*9*(1-tr)).toFixed(1)}px)`; l.style.opacity=(i===0?1:1-tr).toFixed(3); });
      trk.querySelector('.dots').style.opacity=(1-clamp(tr*2)).toFixed(3);
      $('gcap').style.left=(76+tr*40)+'%';
      $('grail').style.opacity=clamp((tr-.8)/.2).toFixed(3);
      gtrack.style.opacity=drop>0?'1':'0';
      gtrack.style.transform=`translate3d(${(-shift).toFixed(1)}px,${(-(1-drop)*85).toFixed(2)}vh,0)`;
      $('gspot').style.opacity=(appear*(1-tr*.6)).toFixed(3);
    } else {
      $('grail').style.opacity=appear.toFixed(3); gtrack.style.opacity='1';
      gtrack.style.transform=`translate3d(${(-shift).toFixed(1)}px,${(-(1-ease(appear))*30).toFixed(2)}vh,0)`;
      $('gspot').style.opacity=(appear*.7).toFixed(3);
    }
    gtrack.querySelectorAll('.poster').forEach((el,i)=>{ el.style.transform=reduce?'none':`rotate(${(swing+Math.sin(t*.8+i*1.7)*.35).toFixed(2)}deg)`; }); }
  const pv=1-seg(cp,.8,.9);
  prog.style.opacity=pv.toFixed(3); pfill.style.width=(rawP*100).toFixed(2)+'%';
  prog.querySelectorAll('.pdot').forEach(d=>d.classList.toggle('on',rawP>=+d.dataset.v-.002));
  skipBtn.hidden=introDone;
}

let fontsReady=false; (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>fontsReady=true); setTimeout(()=>fontsReady=true,1500);
function showSlogan(){ if(slogShown||!fontsReady) return; slogShown=true; slogStart=reduce?-99:t; slogan.classList.add('show'); }

// eased follow with a speed limit, so a fast flick plays the story through instead of skipping it
function approach(v,target,dt,rate,maxPerSec){ const d=target-v; if(Math.abs(d)<1e-4) return target; let step=d*Math.min(1,dt*rate); const mx=maxPerSec*dt; if(Math.abs(step)>mx) step=Math.sign(step)*mx; return v+step; }
let wallSeenT=0, cruiseT=0;
// After the intro, one scroll plays the whole exit on its own: pull back, step outside, the train leaves, Selected work pushes in.
const EXIT_FROM=.36, EXIT_DUR=3.3; let exitT=-1, exitFrom=.3, introReadyAt=-1, lastFwdInput=-1;
// keyframes for the exit: time share -> story point, so the outside shot and the departure get their moment
const EXIT_KEYS=[[0,null],[.2,.52],[.42,.66],[.9,.94],[1,1]];
function exitCurve(k,from){ const e=.5-.5*Math.cos(Math.PI*k); for(let i=1;i<EXIT_KEYS.length;i++){ const [t1,v1]=EXIT_KEYS[i], [t0,v0]=EXIT_KEYS[i-1]; if(e<=t1){ const a=v0==null?from:v0; return a+(v1-a)*(e-t0)/(t1-t0); } } return 1; }
const markFwd=()=>{ lastFwdInput=performance.now(); };
// The page can't scroll past the intro until the exit animation has played.
let rideReleased=false;
function gateY(){ return ride.offsetTop+(ride.offsetHeight-innerHeight)-1; }
function gateOn(){ return !reduce&&!rideReleased; }
addEventListener('wheel',e=>{ if(gateOn()&&e.deltaY>0&&scrollY>=gateY()-2) e.preventDefault(); },{passive:false});
addEventListener('scroll',()=>{ if(gateOn()&&exitT<0&&scrollY>gateY()+1) scrollTo({top:gateY(),behavior:'instant'}); },{passive:true});
// a new gesture = the first wheel event after a short pause, so momentum from an earlier fling doesn't count
let lastWheelT=0; addEventListener('wheel',e=>{ const n=performance.now(); if(e.deltaY>0&&n-lastWheelT>350) markFwd(); lastWheelT=n; },{passive:true});
let touchY0=null; addEventListener('touchstart',e=>{ touchY0=e.touches[0].clientY; },{passive:true});
addEventListener('touchmove',e=>{ if(touchY0!=null&&e.touches[0].clientY<touchY0-6){ markFwd(); touchY0=null; } },{passive:true});
addEventListener('keydown',e=>{ if(['ArrowDown','PageDown',' ','Space','End'].includes(e.key)) markFwd(); });
const exitEase=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function exitLocked(){ return exitT>=0; }
addEventListener('wheel',e=>{ if(exitLocked()) e.preventDefault(); },{passive:false});
addEventListener('touchmove',e=>{ if(exitLocked()) e.preventDefault(); },{passive:false});
addEventListener('keydown',e=>{ if(exitLocked()&&['ArrowDown','ArrowUp','PageDown','PageUp','Space',' ','End','Home'].includes(e.key)) e.preventDefault(); });
// Magnet: between the wall and the projects there's no in-between. One scroll glides the page until the bottom
// of the ride docks at the top of the screen (or, going up, back onto the wall). The rest of that gesture is absorbed.
let magnetActive=false, magnetGesture=false, mWheelT=0, mInputT=0, mTouchY=null, mTouchDir=0;
function endY(){ return ride.offsetTop+ride.offsetHeight; }
function magnetTo(y){
  if(magnetActive) return; const y0=scrollY, d=y-y0; if(Math.abs(d)<2) return;
  magnetActive=true; magnetGesture=true;
  const dur=reduce?0:Math.min(950,480+Math.abs(d)*.3), t0=performance.now();
  const step=n=>{ const k=dur?Math.min(1,(n-t0)/dur):1, e=1-Math.pow(1-k,3);
    scrollTo({top:Math.round(y0+d*e),behavior:'instant'});
    if(k<1) requestAnimationFrame(step); else magnetActive=false; };
  requestAnimationFrame(step);
}
function mZone(dir){ const g=gateY(), en=endY(); return dir>0?(scrollY>=g-3&&scrollY<en-3):(scrollY>g+3&&scrollY<=en+3); }
addEventListener('wheel',e=>{
  const n=performance.now(), fresh=n-mWheelT>300; mWheelT=n; mInputT=n;
  if(magnetActive||(magnetGesture&&!fresh)){ e.preventDefault(); return; }
  magnetGesture=false;
  if(!rideReleased||reduce||Math.abs(e.deltaY)<1) return;
  const dir=e.deltaY>0?1:-1;
  if(mZone(dir)){ e.preventDefault(); magnetTo(dir>0?endY():gateY()); }
},{passive:false});
addEventListener('touchstart',e=>{ mTouchY=e.touches[0].clientY; mTouchDir=0; mInputT=performance.now(); },{passive:true});
addEventListener('touchmove',e=>{ mInputT=performance.now(); if(magnetActive){ e.preventDefault(); return; } if(mTouchY!=null){ const dy=mTouchY-e.touches[0].clientY; if(Math.abs(dy)>6) mTouchDir=dy>0?1:-1; } },{passive:false});
addEventListener('touchend',()=>{ mInputT=performance.now(); if(rideReleased&&!reduce&&mTouchDir&&mZone(mTouchDir)) magnetTo(mTouchDir>0?endY():gateY()); mTouchY=null; },{passive:true});
addEventListener('keydown',e=>{ mInputT=performance.now(); if(!rideReleased||reduce) return;
  const dn=['ArrowDown','PageDown',' ','Space'].includes(e.key), up=['ArrowUp','PageUp'].includes(e.key);
  if(magnetActive&&(dn||up)){ e.preventDefault(); return; }
  if(dn&&mZone(1)){ e.preventDefault(); magnetTo(endY()); } else if(up&&mZone(-1)){ e.preventDefault(); magnetTo(gateY()); } });
let last=performance.now();
// Header over the ride: hidden while the train is moving, then white or black text depending on what's behind it.
const navSamp=document.createElement('canvas'); navSamp.width=32; navSamp.height=4; const nsc=navSamp.getContext('2d',{willReadFrequently:true});
const wsStripes=document.getElementById('wsStripes'), wsBands=wsStripes?[...wsStripes.children]:[];
let navDark=false, navLastT=0, navPeekT=-1e9;
addEventListener('mousemove',e=>{ if(e.clientY<110) navPeekT=performance.now(); },{passive:true});
addEventListener('focusin',e=>{ if(e.target.closest&&e.target.closest('header')) navPeekT=performance.now()+6e4; });
function navTone(r,now){
  const NB=92;   // bottom of the floating nav
  const onRide=r.top<=1&&r.bottom>NB;
  const moving=onRide&&mode!=='stopped'&&!reduce;
  document.body.classList.toggle('ws-navhide', moving&&now-navPeekT>1500);
  if(now-navLastT<180) return; navLastT=now;
  let dark=false;
  if(onRide){
    try{
      const k=cvs.width/innerWidth;
      nsc.drawImage(cvs,24*k,16*k,(innerWidth-48)*k,(NB-16)*k,0,0,32,4);
      const d=nsc.getImageData(0,0,32,4).data; let L=0;
      for(let i=0;i<d.length;i+=4) L+=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;
      L/=d.length/4;
      dark=navDark?L<.56:L<.46;   // a little hysteresis so it doesn't flicker
    }catch(e){ dark=true; }
  }
  navDark=dark; document.body.classList.toggle('ws-dark',dark);
}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; t+=dt;
  const r=ride.getBoundingClientRect(), rawP=clamp(-r.top/Math.max(1,r.height-H)), SP=storyP(rawP), p=SP.sp;
  if(!introDone){ ti+=dt; if(p>.01&&ti<3.2) ti=3.2; if(ti>=4.2) introDone=true; }
  if(prevView&&xf<1){ xf=Math.min(1,xf+dt/.9); if(xf>=1) prevView=null; }
  updateMotion(dt,p);
  // the slogan waits for the train to come to a full stop; it clears again if the train pulls away
  if(mode==='stopped'&&stopT>.35) showSlogan();
  if((mode==='departing'||mode==='cruise')&&slogShown){ slogShown=false; }
  // the wall is a required stop: hold the camera there until the text has been fully visible for a moment
  const wallVis=panel?panV:introVis;
  if(!GAL()&&mode==='stopped'&&wallVis>.9) wallSeenT+=dt;
  if(mode!=='stopped'||(panel?cp<.05:introVis<.1)) wallSeenT=0;
  const HOLD=2.4; const hold=!GAL()&&!reduce&&wallSeenT<HOLD;   // with the fade-in, the intro is readable for about 3s
  let camT=(mode==='stopped'&&stopT>.4)?p:Math.min(p,GAL()?.38:.14);
  if(hold&&mode==='stopped') camT=Math.min(camT,.3);
  // keep the camera on the seat until the slogan has played and had a moment on screen
  const slogDone=slogShown&&(reduce||t-slogStart>4.8);
  if(!reduce&&mode==='stopped'&&exitT<0&&(GAL()?galV>.5:true)&&cp>=.15&&cp<EXIT_FROM) camT=Math.min(camT,GAL()?camT:.3);
  if(!slogDone) camT=Math.min(camT,.14);
  // the seat waits for the visitor: scrolling done during the ride doesn't count, only a new scroll after the slogan has played
  if(slogDone){ if(seatReadyAt<0) seatReadyAt=performance.now(); } else if(cp<.05) seatReadyAt=-1;
  seatGo=reduce||cp>.16||(seatReadyAt>0&&lastFwdInput>seatReadyAt+120);
  if(!seatGo) camT=Math.min(camT,.14);
  if(rideReleased) camT=p;   // after the exit the page is a normal page; the ride just follows the scroll
  const introDoneHere=mode==='stopped'&&(GAL()?galV>=.999:wallSeenT>=HOLD);
  if(introDoneHere){ if(introReadyAt<0) introReadyAt=performance.now(); } else if(cp<.15) introReadyAt=-1;
  if(rideReleased&&rawP<.01&&cp<.05){ rideReleased=false; wallSeenT=0; introReadyAt=-1; }
  // full stop: only a fresh forward scroll that starts after the intro is fully shown moves on
  if(!reduce&&!rideReleased&&introDoneHere&&introReadyAt>0&&lastFwdInput>introReadyAt+120&&performance.now()-lastFwdInput<600){ rideReleased=true; magnetTo(endY()); }   // no exit animation: one glide down to the projects
  if(exitT>=0){
    exitT+=dt; const k=clamp(exitT/EXIT_DUR); cp=exitCurve(k,exitFrom);
    if(k>=1){ exitT=-1; cp=1; rideReleased=true; introReadyAt=-1; wallSeenT=0; const end=document.getElementById('projects').getBoundingClientRect().top+scrollY; markProjectsShown(); scrollTo({top:end,behavior:'instant'}); }
  } else cp=approach(cp,camT,dt,camT<cp?6:3.5,reduce?99:(camT<cp?.7:.08));   // going back rewinds quickly; going forward stays paced
  const sDone=slogShown&&(reduce||t-slogStart>4.8);
  const it=mode==='stopped'?(panel?ease(clamp((stopT-.15)/.7)):(sDone&&seatGo?1:0))*(1-seg(cp,.34,.38)):0;
  introVis+=(it-introVis)*Math.min(1,dt*(reduce?60:6));
  const stp=mode==='stopped'&&stopT>.3, sk=reduce?60:1;
  const tz=stp?ease(seg(cp,.15,.21)):0; zoomV+=(tz-zoomV)*Math.min(1,dt*4*sk);
  const tf=stp?ease(seg(cp,.19,.26)):0; flipV+=(tf-flipV)*Math.min(1,dt*5*sk);
  const tp=stp&&cp>.145?1:0; panV+=(tp-panV)*Math.min(1,dt*3*sk);   // once past the seat, always settle fully on the wall
  if(coarse){tx=Math.sin(t*.25)*.35; ty=Math.sin(t*.17)*.2;}
  const k=Math.min(1,dt*3); px+=(tx-px)*k; py+=(ty-py)*k;
  if(gx>-900){ if(cgx<-900){cgx=gx;cgy=gy;} cgx+=(gx-cgx)*Math.min(1,dt*6); cgy+=(gy-cgy)*Math.min(1,dt*6); } else cgx=cgy=-999;
  if(!reduce) stepRain(dt);
  const gT=(mode==='stopped'&&stopT>.5)?(SP.gq>=1?1:SP.gq):0;
  galV=approach(galV,gT,dt,gT<galV?6:3,reduce?99:(gT<galV?.8:.16));
  galEx=galV<=0||galV>=1?0:(galV<.5?ease(clamp(galV/.12)):ease(clamp((1-galV)/.12)));
  galW=introMode==='A'?clamp((galV-.5)/.38):clamp((galV-.32)/.56);
  const vel=(galW-lastW)/Math.max(dt,1e-3); lastW=galW;
  swingV+=(-clamp(vel*10,-7,7)-swing)*Math.min(1,dt*6)-swingV*Math.min(1,dt*3); swing+=swingV*Math.min(1,dt*8);
  const tkOn=layoutMode==='ticket';
  const fT=tkOn?ease(seg(p,.015,.09)):0; flyV+=(fT-flyV)*Math.min(1,dt*(reduce?60:6)); if(Math.abs(fT-flyV)<1e-4) flyV=fT;
  const pT=tkOn&&mode==='stopped'&&stopT>.4?seg(p,.24,.34):0; peelV=approach(peelV,pT,dt,5,reduce?99:.9);
  if(r.bottom>0){ render(); updateDOM(p,rawP); }
  navTheme();
  // leaving the ride: four pink lines run out from the left under it, each a beat behind the one above (Figma 43:295)
  if(rideReleased&&!reduce&&!magnetActive&&performance.now()-mInputT>220){ const g=gateY(), en=endY(); if(scrollY>g+3&&scrollY<en-3) magnetTo(scrollY-g<(en-g)/2?g:en); }
  if(wsStripes){ const st=wsStripes.getBoundingClientRect().top, k2=clamp((innerHeight-st)/(innerHeight*.75));
    for(let i=0;i<wsBands.length;i++) wsBands[i].style.transform='scaleX('+(reduce?1:ease(clamp((k2-i*.08)/.62))).toFixed(4)+')'; }
  navTone(r,now);
  requestAnimationFrame(frame);
}

stage.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse') return; const b=stage.getBoundingClientRect(); tx=(e.clientX-b.left)/W*2-1; ty=(e.clientY-b.top)/H*2-1; gx=e.clientX-b.left; gy=e.clientY-b.top; });
stage.addEventListener('pointerleave',()=>{tx=ty=0; gx=gy=-999;});


skipBtn.onclick=()=>{ ti=Math.max(ti,3.2); };
function buildSnaps(){
  ride.querySelectorAll('.snap').forEach(n=>n.remove());
  const span=ride.offsetHeight-innerHeight;
  const pts=GAL()
    ?[0,rawOf(.16),(S0+G*.2)/(1+G),(S0+G*.5)/(1+G),(S0+G*.8)/(1+G),(S0+G)/(1+G)+.008,rawOf(.47),rawOf(.62),rawOf(.95)]
    :[0,.1,.2,.355,.47,.62,.95];
  if(true) return; // snapping removed: the story holds replace it, and proximity snapping trapped tall screens
  for(const v of pts){ const d=document.createElement('div'); d.className='snap'; d.style.top=Math.round(v*span)+'px'; d.setAttribute('aria-hidden','true'); ride.appendChild(d); }
}
function setLayout(l){ const was=layoutMode; layoutMode=l; const isg=document.getElementById('introSeg'); if(isg) isg.hidden=!GAL();  ride.style.height=(GAL()?Math.round(760*(1+G)):320)+'vh'; buildDots(); buildSnaps();  }



let introMode='A'; try{const im=localStorage.getItem('ws-intro'); if(im==='A'||im==='C') introMode=im;}catch(e){}
function setIntro(m){ introMode=m; gal.classList.toggle('intro-a',m==='A'); gal.classList.toggle('intro-c',m==='C');  try{localStorage.setItem('ws-intro',m);}catch(e){} measureTrack(); }
function measureTrack(){ const vw=stage.clientWidth; if(introMode==='C'){ const sg=$('gSign'); gtrack.style.paddingLeft=Math.max(16,(vw-sg.offsetWidth)/2)+'px'; } else gtrack.style.paddingLeft=''; trackW=gtrack.scrollWidth; }

setLayout('pan');
$('replay').onclick=()=>{ exitT=-1; cruiseT=0; rideReleased=false;
  window.scrollTo({top:ride.offsetTop,behavior:'auto'});
  cp=0; introVis=0;
  if(reduce){ mode='cruise'; pfX=null; return; }
  ti=0; introDone=false; slogShown=false; slogan.classList.remove('show'); mode='cruise'; pfX=null; s=1.3;
};


const fnav=$('fnav'), fmenu=$('fmenu'); let navForced=false, navHover=false, lastY=scrollY, navCollapsed=false;
function setNav(c){ if(c===navCollapsed) return; navCollapsed=c; fnav.classList.toggle('collapsed',c); fmenu.setAttribute('aria-expanded',String(!c)); if(typeof placeSel==='function') setTimeout(placeSel,c?0:560); }
addEventListener('scroll',()=>{ const y=scrollY, d=y-lastY; lastY=y;
  if(y<40){ navForced=false; setNav(false); return; }
  if(navHover||navForced) return;
  if(d>4) setNav(true); else if(d<-6) setNav(false);
},{passive:true});
fnav.addEventListener('pointerenter',e=>{ if(e.pointerType==='mouse'){ navHover=true; setNav(false);} });
fnav.addEventListener('pointerleave',()=>{ navHover=false; });
// Liquid glass refraction (Chromium): a displacement map shaped like the pill bends the backdrop near the rim
(()=>{ const isChromium=!!window.chrome&&CSS.supports('backdrop-filter','blur(1px)'); if(!isChromium) return;
  const mapEl=document.getElementById('lgmap'), cv=document.createElement('canvas'), cx=cv.getContext('2d');
  let lastW=0,lastH=0;
  function build(){ const w=Math.round(fnav.offsetWidth), h=Math.round(fnav.offsetHeight); if(!w||!h||(w===lastW&&h===lastH)) return; lastW=w; lastH=h;
    cv.width=w; cv.height=h; const img=cx.createImageData(w,h), d=img.data, r=h/2, band=Math.min(h*.5,22);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      // nearest point on the capsule's centre line, then distance to the rim
      const qx=Math.min(Math.max(x+.5,r),w-r), qy=r, vx=x+.5-qx, vy=y+.5-qy, dist=Math.hypot(vx,vy), din=r-dist;
      let dx=0,dy=0; if(din<band&&dist>0){ const t=1-Math.max(0,din)/band, m=t*t*(3-2*t); dx=vx/dist*m; dy=vy/dist*m; }
      const i=(y*w+x)*4; d[i]=128-dx*127; d[i+1]=128-dy*127; d[i+2]=128; d[i+3]=255; }
    cx.putImageData(img,0,0); mapEl.setAttribute('href',cv.toDataURL()); mapEl.setAttribute('width',w); mapEl.setAttribute('height',h); }
  build(); fnav.classList.add('refract');
  if('ResizeObserver' in window) new ResizeObserver(()=>build()).observe(fnav);
})();
fnav.addEventListener('pointermove',e=>{ const b=fnav.getBoundingClientRect(); fnav.style.setProperty('--mx',((e.clientX-b.left)/b.width*100).toFixed(1)+'%'); });
fnav.addEventListener('pointerleave',()=>fnav.style.removeProperty('--mx'));
fnav.addEventListener('focusin',()=>setNav(false));
fmenu.addEventListener('click',()=>{ navForced=true; setNav(false); });
 // dark recessed selection pill: glides to the hovered link, rests on the active one
const fsel=$('fsel'), flinkEls=[...document.querySelectorAll('#flinks a')]; let navActive=null, navHot=null;
function placeSel(){
  const el=navHot||navActive;
  flinkEls.forEach(a=>{ a.classList.toggle('active',a===navActive&&!navHot); a.classList.toggle('hovered',a===navHot); });
  if(!el||navCollapsed){ fsel.style.opacity='0'; return; }
  const nb=fnav.getBoundingClientRect(), eb=el.getBoundingClientRect();
  fsel.style.width=eb.width+'px'; fsel.style.transform=`translateX(${(eb.left-nb.left).toFixed(1)}px)`; fsel.style.opacity='1';
}
flinkEls.forEach(a=>{ a.addEventListener('pointerenter',()=>{navHot=a; placeSel();}); a.addEventListener('focus',()=>{navHot=a; placeSel();}); a.addEventListener('blur',()=>{navHot=null; placeSel();}); a.addEventListener('pointerdown',()=>{navActive=a; placeSel();}); });
$('flinks').addEventListener('pointerleave',()=>{navHot=null; placeSel();});
fnav.addEventListener('transitionend',e=>{ if(e.target.id==='flinks') placeSel(); });
function navTheme(){
  const wr=document.getElementById('projects').getBoundingClientRect(), act=(wr.top<innerHeight*.5&&wr.bottom>innerHeight*.3)?flinkEls[0]:null;
  if(act!==navActive){ navActive=act; placeSel(); } if(navCollapsed&&fsel.style.opacity!=='0') placeSel(); const w=document.getElementById('projects').getBoundingClientRect(); const light=w.top<60||(ride.getBoundingClientRect().bottom>0&&cp>=.83); fnav.classList.toggle('light',light); }
let rz; addEventListener('resize',()=>{clearTimeout(rz); rz=setTimeout(()=>{layout(); buildSnaps();},150);});
buildClone(); layout(); requestAnimationFrame(frame);
if(document.fonts&&document.fonts.load){
  const warm=()=>{ const wc=document.createElement('canvas').getContext('2d'); for(const f of ['500 40px Inter','700 40px Inter','300 40px Inter','600 40px Inter',"italic 400 40px 'Instrument Serif'"]){ wc.font=f; wc.fillText('I design Complexity into Clarity',0,40); } };
  Promise.all(['300 20px Inter','900 20px Inter','700 20px Inter','600 20px Inter','500 20px Inter',"13px 'DotGothic16'","italic 400 40px 'Instrument Serif'"].map(f=>document.fonts.load(f).catch(()=>{}))).then(()=>{warm(); buildSign(); buildTicket();});
}
})();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
