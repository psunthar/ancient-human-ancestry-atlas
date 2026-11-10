import {LAND,BLACKSEA,CASPIAN,GREENLAND} from './data/geography.js';
import {ICE} from './data/ice_schematic.js';
import {loadSeaLevel} from './sealevel.js';
import {loadIce} from './ice.js';
import {loadShelf} from './shelf.js';
import {GROUPS,GCOL,GBY} from './data/populations.js';
import {ROUTES} from './data/routes.js';
import {EVENTS} from './data/events.js';
import {LANES,LINKS,MARKS} from './data/tree.js';

var NS='http://www.w3.org/2000/svg';
var K=1000/360, W=1000, H=(80+58)*K;
function X(lon){return (lon+180)*K;}
function Y(lat){return (80-lat)*K;}
function normLon(l){return ((l+180)%360+360)%360-180;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs){e.setAttribute(k,attrs[k]);}if(parent){parent.appendChild(e);}return e;}
function polyPath(pts){return 'M'+pts.map(function(p){return X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1);}).join('L')+'Z';}
function linePath(pts){return 'M'+pts.map(function(p){return X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1);}).join('L');}
function centroid(pts){var sx=0,sy=0;pts.forEach(function(p){sx+=X(p[0]);sy+=Y(p[1]);});return [sx/pts.length,sy/pts.length];}

/* ---------- time mapping (piecewise linear, shared by slider and tree) ---------- */
var PK=[0,0.14,0.28,0.50,0.72,0.88,1], TK=[300,130,60,25,10,4,0];
function tFromP(p){for(var i=1;i<PK.length;i++){if(p<=PK[i]){var f=(p-PK[i-1])/(PK[i]-PK[i-1]);return TK[i-1]+(TK[i]-TK[i-1])*f;}}return 0;}
function pFromT(t){for(var i=1;i<TK.length;i++){if(t>=TK[i]){var f=(TK[i-1]-t)/(TK[i-1]-TK[i]);return PK[i-1]+(PK[i]-PK[i-1])*f;}}return 1;}

function iceFrac(sl){return clamp((-sl-10)/115,0,1);}

/* ---------- runtime data layers (each is a separate module that loads its own file) ---------- */
var sea, ice, shelf;
try{
  var layers=await Promise.all([
    loadSeaLevel('data/sealevel_spratt_lisiecki_2016_0-300ka.csv'),
    loadIce('data/ice_paleomist_1.0.geojson'),
    loadShelf('data/shelf_etopo2022.geojson')
  ]);
  sea=layers[0];ice=layers[1];shelf=layers[2];
}catch(err){
  var m=document.createElement('p');m.className='note';m.setAttribute('role','alert');
  m.textContent='Map data could not be loaded ('+err.message+'). If you opened this page from a file, serve the folder instead, for example: python3 -m http.server';
  document.querySelector('.ctl').before(m);
  throw err;
}
function multiPath(polys){return polys.map(function(rings){return rings.map(polyPath).join('');}).join('');}

/* ---------- DOM setup ---------- */
var svg=document.getElementById('map');
var gShelf=el('g',{},svg), gLand=el('g',{},svg), gIce=el('g',{},svg), gRoute=el('g',{},svg), gPop=el('g',{},svg), gLines=el('g',{},svg), gEv=el('g',{},svg);
svg.insertBefore(el('rect',{x:-1200,y:-100,width:3400,height:H+200,fill:'var(--sea)'},null),gShelf);

shelf.bands.forEach(function(b){b.el=el('path',{d:multiPath(b.polygons),fill:'var(--shelf)','fill-rule':'evenodd',opacity:0},gShelf);});
LAND.forEach(function(p){el('path',{d:polyPath(p),fill:'var(--land)',stroke:'var(--land)','stroke-width':0.6,'stroke-linejoin':'round'},gLand);});
el('path',{d:polyPath(BLACKSEA),fill:'var(--sea)'},gLand);
el('path',{d:polyPath(CASPIAN),fill:'var(--sea)'},gLand);
el('path',{d:polyPath(GREENLAND),fill:'var(--ice)',stroke:'var(--ice-line)','stroke-width':0.8,'stroke-linejoin':'round'},gIce);
ice.slices.forEach(function(s){s.el=el('path',{d:multiPath(s.polygons),fill:'var(--ice)',stroke:'var(--ice-line)','stroke-width':0.6,'stroke-linejoin':'round','fill-rule':'evenodd',opacity:0},gIce);});
ICE.forEach(function(s){var c=centroid(s.p);s.c=c;s.el=el('path',{d:polyPath(s.p),fill:'var(--ice)',stroke:'var(--ice-line)','stroke-width':0.9,'stroke-linejoin':'round',opacity:0.92},gIce);});

/* routes */
ROUTES.forEach(function(r){
  var d=linePath(r.pts);
  r.items=[0,-W].map(function(dx){
    var g=el('g',{transform:'translate('+dx+' 0)'},gRoute);
    var p=el('path',{d:d,fill:'none',stroke:r.col,'stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round'},g);
    var h=el('circle',{r:4.2,fill:r.col,stroke:'var(--marker-fill)','stroke-width':1.2},g);
    return {p:p,h:h};
  });
  r.len=r.items[0].p.getTotalLength();
});

/* population bubbles */
GROUPS.forEach(function(g){
  g.items=[0,1].map(function(k){
    var gr=el('g',{},gPop);
    var c=el('circle',{r:10,fill:g.col,'fill-opacity':0.3,stroke:g.col,'stroke-width':1.6},gr);
    if(g.dash){c.setAttribute('stroke-dasharray','5 3');}
    var t=el('text',{'text-anchor':'middle',class:'lbl'},gr);t.textContent=g.short;
    return {g:gr,c:c,t:t};
  });
});

/* event markers */
EVENTS.forEach(function(e){
  if(e.lon==null){return;}
  var gr=el('g',{transform:'translate('+X(e.lon)+' '+Y(e.lat)+')',opacity:0},gEv);
  if(e.type==='mix'){
    el('circle',{r:7,fill:'none',stroke:'var(--marker)','stroke-width':1.6,class:'pulse'},gr);
    el('circle',{r:5,fill:'var(--marker-fill)',stroke:'var(--marker)','stroke-width':2},gr);
    el('path',{d:'M-2.4 -2.4L2.4 2.4M2.4 -2.4L-2.4 2.4',stroke:'var(--marker)','stroke-width':1.6},gr);
  }else{
    el('rect',{x:-4.5,y:-4.5,width:9,height:9,transform:'rotate(45)',fill:'var(--marker-fill)',stroke:'var(--marker)','stroke-width':2},gr);
  }
  var leftSide=X(e.lon)>780;
  var tx=el('text',{x:leftSide?-10:10,y:3,'text-anchor':leftSide?'end':'start',class:'elbl'},gr);tx.textContent=e.lab||e.title;
  e.el=gr;
  e.lines=[];
  (e.src||[]).forEach(function(id){e.lines.push({id:id,kind:'src',el:el('line',{stroke:GCOL[id]||'#888',opacity:0},gLines)});});
  (e.dst||[]).forEach(function(id){e.lines.push({id:id,kind:'dst',el:el('line',{stroke:GCOL[id]||'#888',opacity:0},gLines)});});
});

/* static place labels */
var gStat=el('g',{},svg);
[['Andaman Is.',94.3,11.2,'start'],['Wallacea',122.5,-6.4,'middle'],['Sunda',108,-1,'middle'],['Sahul',131,-29,'middle']].forEach(function(a){
  var t=el('text',{x:X(a[1]),y:Y(a[2]),'text-anchor':a[3],class:'lbl'},gStat);t.textContent=a[0];t.style.fontStyle='italic';
});

/* ticks under slider */
var ticksEl=document.getElementById('ticks');
[[300,'300k'],[200,'200k',1],[130,'130k'],[100,'100k',1],[60,'60k'],[40,'40k',1],[25,'25k'],[10,'10k'],[4,'4k'],[0,'now']].forEach(function(a){
  var s=document.createElement('span');s.style.left=(pFromT(a[0])*100)+'%';s.textContent=a[1];if(a[2]){s.className='opt';}ticksEl.appendChild(s);
});

/* tree */
var tree=document.getElementById('tree');
var LEFT=160,RIGHT=985,TOP=34,LH=24;
function tx(t){return LEFT+pFromT(t)*(RIGHT-LEFT);}
var laneY={};LANES.forEach(function(l,i){laneY[l.id]=TOP+LH*i+LH/2;});
var treeH=TOP+LH*LANES.length+12;
tree.setAttribute('viewBox','0 0 1000 '+treeH);
[300,200,130,100,70,50,40,25,15,10,6,4,2,0].forEach(function(t){
  var x=tx(t);
  el('line',{x1:x,x2:x,y1:TOP-6,y2:treeH-8,stroke:'var(--line)','stroke-width':1},tree);
  var a=el('text',{x:x,y:TOP-12,'text-anchor':t===300?'start':(t===0?'end':'middle'),class:'ta'},tree);a.textContent=t===0?'now':t+'k';
});
LANES.forEach(function(l){
  var col=GCOL[l.id]||'#888';var y=laneY[l.id];
  var d='';
  if(l.from){d+='M'+tx(l.s)+' '+laneY[l.from]+'V'+y+'H'+tx(l.e);}
  else{d+='M'+tx(l.s)+' '+y+'H'+tx(l.e);}
  var p=el('path',{d:d,fill:'none',stroke:col,'stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round'},tree);
  if(l.dash){p.setAttribute('stroke-dasharray','8 5');}
  var tt=el('text',{x:8,y:y+4,class:'tl'},tree);tt.textContent=l.name;
});
LINKS.forEach(function(k){
  var x=tx(k.t),y1=laneY[k.f],y2=laneY[k.to];var col=GCOL[k.f]||'#888';
  el('line',{x1:x,x2:x,y1:y1,y2:y2,stroke:col,'stroke-width':2,'stroke-dasharray':k.hyp?'1.5 4':'4 3',opacity:k.hyp?0.8:1},tree);
  var s=y2>y1?1:-1;
  el('path',{d:'M'+(x-5)+' '+(y2-s*8)+'L'+x+' '+y2+'L'+(x+5)+' '+(y2-s*8)+'Z',fill:col},tree);
});
MARKS.forEach(function(m){
  var g=el('g',{transform:'translate('+tx(m.t)+' '+laneY[m.lane]+')'},tree);
  el('circle',{r:6.5,fill:'var(--panel)',stroke:'var(--marker)','stroke-width':1.8},g);
  el('path',{d:'M-2.6 -2.6L2.6 2.6M2.6 -2.6L-2.6 2.6',stroke:'var(--marker)','stroke-width':1.6},g);
  var tt=document.createElementNS(NS,'title');tt.textContent=m.tip+' ('+fmtKya(m.t)+' kya)';g.appendChild(tt);
});
var future=el('rect',{x:LEFT,y:TOP-4,width:RIGHT-LEFT,height:treeH-TOP,fill:'var(--panel)',opacity:0.72},tree);
var cursor=el('line',{x1:LEFT,x2:LEFT,y1:TOP-8,y2:treeH-4,stroke:'var(--accent)','stroke-width':2.5},tree);
var cursorT=el('text',{x:LEFT,y:12,'text-anchor':'middle',class:'ta',fill:'var(--accent)'},tree);
cursorT.style.fill='var(--accent)';

/* ---------- formatting ---------- */
function fmtKya(x){return x>=10?String(Math.round(x)):String(+x.toFixed(1));}
function fmtYears(t){
  var y=t*1000, r;
  if(t<=0.001){return 'Present';}
  if(t>=20){r=Math.round(y/1000)*1000;}else if(t>=2){r=Math.round(y/100)*100;}else{r=Math.round(y/50)*50;}
  return r.toLocaleString('en-US')+' years ago';
}
function calendar(t){
  if(t>12||t<=0.001){return '';}
  var yr=Math.round((2026-t*1000)/50)*50;
  return yr<0?'about '+Math.abs(yr).toLocaleString('en-US')+' BCE':'about '+yr+' CE';
}
function rangeStr(a,b){return fmtKya(a)+' to '+fmtKya(b)+' kya';}
/* an event with an `outdated` note is a claim of the book that later research has revised; the checkbox hides these */
function shown(e){return state.layers.old||!e.outdated;}
var TAGTXT={book:'In the book',after:'After the book',hyp:'Hypothesis',ctx:'Background'};

/* ---------- state and update ---------- */
var state={p:0,playing:false,last:0,layers:{ice:true,pop:true,route:true,mix:true,old:true}};
var slider=document.getElementById('slider');
var lastEvKey=null,lastChipKey=null;

function interp(keys,t){
  if(t>=keys[0][0]){return keys[0];}
  var n=keys.length;
  if(t<=keys[n-1][0]){return keys[n-1];}
  for(var i=1;i<n;i++){
    if(t>=keys[i][0]){var a=keys[i-1],b=keys[i];var f=(a[0]-t)/(a[0]-b[0]);return [t,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f];}
  }
  return keys[n-1];
}

var curUpp=1;
function dashPattern(L,total){var u=curUpp,n=Math.max(1,Math.floor(L/(9*u))),a=[];for(var i=0;i<n;i++){a.push((6*u).toFixed(1),(3*u).toFixed(1));}a.push('0',String(Math.round(total+10)));return a.join(' ');}
function applyScale(){
  var pxW=svg.getBoundingClientRect().width||1000;
  var upp=svg.viewBox.baseVal.width/pxW;curUpp=upp;
  svg.style.setProperty('--fs',(11.5*upp).toFixed(2)+'px');
  svg.style.setProperty('--sw',(3*upp).toFixed(2)+'px');
  ROUTES.forEach(function(r){r.items.forEach(function(it){it.p.setAttribute('stroke-width',(2.6*upp).toFixed(2));it.h.setAttribute('r',(4.2*upp).toFixed(2));it.h.setAttribute('stroke-width',(1.2*upp).toFixed(2));});});
  EVENTS.forEach(function(e){if(e.el){e.el.setAttribute('transform','translate('+X(e.lon)+' '+Y(e.lat)+') scale('+upp.toFixed(3)+')');}});
  GROUPS.forEach(function(g){g.items.forEach(function(it){it.c.setAttribute('stroke-width',(1.6*upp).toFixed(2));});});
  EVENTS.forEach(function(e){if(e.lines){e.lines.forEach(function(L){L.el.setAttribute('stroke-width',(1.8*upp).toFixed(2));L.el.setAttribute('stroke-dasharray',L.kind==='src'?(5*upp).toFixed(1)+' '+(3*upp).toFixed(1):'none');});}});
  update();
}

function update(){
  var t=tFromP(state.p);
  var sl=sea.at(t), fr=iceFrac(sl);
  document.getElementById('tMain').textContent=fmtYears(t);
  document.getElementById('tSub').textContent=calendar(t);
  document.getElementById('sSea').textContent=(sl>0?'+':'')+Math.round(sl)+' m';
  document.getElementById('sIce').textContent=Math.round(fr*100)+'%';

  /* sea level and ice */
  var showIce=state.layers.ice;
  gShelf.style.display=showIce?'':'none';
  gIce.style.display=showIce?'':'none';
  if(showIce){
    shelf.bands.forEach(function(b){b.el.setAttribute('opacity',shelf.exposure(b,sl).toFixed(2));});
    /* real ice outlines where data exist (0 to ice.maxAge kya), schematic scaled outlines beyond */
    var ow={};
    ice.layers(t).forEach(function(l){ow[l.index]=l.opacity;});
    ice.slices.forEach(function(s,i){s.el.setAttribute('opacity',((ow[i]||0)*0.92).toFixed(3));});
    var sw=ice.schematicWeight(t), sc=Math.pow(fr,0.65);
    ICE.forEach(function(s){
      if(sw<=0||sc<0.04){s.el.setAttribute('opacity',0);return;}
      s.el.setAttribute('opacity',(0.92*sw).toFixed(3));
      s.el.setAttribute('transform','translate('+s.c[0]+' '+s.c[1]+') scale('+sc.toFixed(3)+') translate('+(-s.c[0])+' '+(-s.c[1])+')');
    });
  }

  /* populations */
  gPop.style.display=state.layers.pop?'':'none';
  var activeGroups=[];
  GROUPS.forEach(function(g){
    var t0=g.keys[0][0],t1=g.keys[g.keys.length-1][0];
    var vis=(t<=t0&&t>=t1);
    if(!vis){g.cur=null;g.items.forEach(function(it){it.g.setAttribute('opacity',0);});return;}
    var w=clamp((t0-t1)*0.12,0.3,6);
    var fin=t0>=300?1:(t0-t)/w, fout=t1<=0?1:(t-t1)/w;
    var op=clamp(Math.min(fin,fout),0,1);
    var k=interp(g.keys,t);
    var lon=normLon(k[1]),x=X(lon),y=Y(k[2]),rpx=k[3]*K;
    g.cur={x:x,y:y,op:op};
    g.items[0].g.setAttribute('opacity',op.toFixed(2));
    g.items[0].c.setAttribute('cx',x);g.items[0].c.setAttribute('cy',y);g.items[0].c.setAttribute('r',rpx);
    g.items[0].t.setAttribute('x',x);g.items[0].t.setAttribute('y',y+3);
    var cx2=null;
    if(x-rpx<0){cx2=x+W;}else if(x+rpx>W){cx2=x-W;}
    if(cx2===null){g.items[1].g.setAttribute('opacity',0);}
    else{
      g.items[1].g.setAttribute('opacity',op.toFixed(2));
      g.items[1].c.setAttribute('cx',cx2);g.items[1].c.setAttribute('cy',y);g.items[1].c.setAttribute('r',rpx);
      g.items[1].t.setAttribute('x',cx2);g.items[1].t.setAttribute('y',y+3);
    }
    if(op>0.05){activeGroups.push(g);}
  });

  /* routes */
  gRoute.style.display=state.layers.route?'':'none';
  ROUTES.forEach(function(r){
    var prog=t>r.t0?0:clamp((r.t0-t)/(r.t0-r.t1),0,1);
    var done=prog>=1;
    r.items.forEach(function(it){
      if(prog<=0){it.p.setAttribute('opacity',0);it.h.setAttribute('opacity',0);return;}
      var L=r.len*prog;
      it.p.setAttribute('stroke-dasharray',r.dash?dashPattern(L,r.len):L.toFixed(1)+' '+(r.len+10).toFixed(1));
      it.p.setAttribute('opacity',done?0.32:0.95);
      var pt=it.p.getPointAtLength(L);
      it.h.setAttribute('cx',pt.x);it.h.setAttribute('cy',pt.y);
      it.h.setAttribute('opacity',done?0:1);
    });
  });

  /* event markers */
  gEv.style.display=state.layers.mix?'':'none';
  gLines.style.display=state.layers.mix?'':'none';
  var active=[];
  EVENTS.forEach(function(e){
    var on=(t<=e.t0&&t>=e.t1)&&shown(e);
    if(on){active.push(e);}
    if(e.el){e.el.setAttribute('opacity',on?1:0);}
    if(e.lines){
      e.lines.forEach(function(L){
        var g=GBY[L.id],ok=on&&g&&g.cur&&g.cur.op>0.05;
        if(!ok){L.el.setAttribute('opacity',0);return;}
        L.el.setAttribute('x1',X(e.lon));L.el.setAttribute('y1',Y(e.lat));
        L.el.setAttribute('x2',g.cur.x);L.el.setAttribute('y2',g.cur.y);
        L.el.setAttribute('opacity',0.9);
      });
    }
  });

  /* tree cursor */
  var cx=LEFT+state.p*(RIGHT-LEFT);
  cursor.setAttribute('x1',cx);cursor.setAttribute('x2',cx);
  future.setAttribute('x',cx);future.setAttribute('width',Math.max(0,RIGHT-cx));
  cursorT.setAttribute('x',clamp(cx,LEFT+20,RIGHT-20));
  cursorT.textContent=t<0.01?'now':fmtKya(t)+'k';

  /* panels, only rebuilt when the active set changes */
  var list=active, nearby=false;
  if(!list.length){list=nearestEvents(t);nearby=true;}
  var key=(nearby?'near:':'now:')+list.map(function(e){return e.id;}).join(',');
  if(key!==lastEvKey){lastEvKey=key;renderEvents(list,nearby);}
  var ck=activeGroups.map(function(g){return g.id;}).join(',');
  if(ck!==lastChipKey){lastChipKey=ck;renderChips(activeGroups);}
}

function nearestEvents(t){
  var past=EVENTS.filter(function(e){return shown(e)&&e.t1>=t;}).sort(function(a,b){return a.t1-b.t1;});
  var next=EVENTS.filter(function(e){return shown(e)&&e.t0<t;}).sort(function(a,b){return b.t0-a.t0;});
  var list=[];
  if(past.length){list.push(past[0]);}
  if(next.length){list.push(next[0]);}
  return list;
}
function renderEvents(list,nearby){
  var box=document.getElementById('events');
  box.innerHTML='';
  if(nearby){var p=document.createElement('p');p.className='empty';p.style.marginBottom='10px';p.textContent='No event is dated to this exact time. Nearest events before and after:';box.appendChild(p);}
  list.forEach(function(e){
    var d=document.createElement('div');d.className='ev';
    var h=document.createElement('h3');h.textContent=e.title;
    var pill=document.createElement('span');pill.className='pill '+e.tag;pill.textContent=TAGTXT[e.tag];h.appendChild(pill);
    if(e.outdated){var op=document.createElement('span');op.className='pill old';op.textContent='Outdated';h.appendChild(op);}
    var w=document.createElement('div');w.className='when';w.textContent=rangeStr(e.t0,e.t1);
    var tp=document.createElement('p');tp.textContent=e.text;
    d.appendChild(h);d.appendChild(w);d.appendChild(tp);
    if(e.outdated){var on=document.createElement('p');on.className='oldnote';on.textContent='Since revised: '+e.outdated;d.appendChild(on);}
    box.appendChild(d);
  });
}
function renderChips(groups){
  var box=document.getElementById('chips');box.innerHTML='';
  if(!groups.length){var p=document.createElement('p');p.className='empty';p.textContent='No population ranges are drawn at this time.';box.appendChild(p);return;}
  groups.forEach(function(g){
    var c=document.createElement('span');c.className='chip';
    var i=document.createElement('i');i.style.background=g.col;if(g.dash){i.style.opacity='0.6';}
    c.appendChild(i);c.appendChild(document.createTextNode(g.name));box.appendChild(c);
  });
}

/* ---------- controls ---------- */
function setP(p){state.p=clamp(p,0,1);slider.value=Math.round(state.p*1000);update();}
function setT(t){setP(pFromT(clamp(t,0,300)));}
slider.addEventListener('input',function(){state.p=slider.value/1000;update();});

var playBtn=document.getElementById('play');
var speedSel=document.getElementById('speed');
function frame(ts){
  if(!state.playing){return;}
  var dt=Math.min(0.1,(ts-state.last)/1000);state.last=ts;
  var rate=parseFloat(speedSel.value)/45;
  setP(state.p+dt*rate);
  if(state.p>=1){stop();return;}
  requestAnimationFrame(frame);
}
function stop(){state.playing=false;playBtn.textContent='Play';}
playBtn.addEventListener('click',function(){
  if(state.playing){stop();return;}
  if(state.p>=1){setP(0);}
  state.playing=true;playBtn.textContent='Pause';state.last=performance.now();requestAnimationFrame(frame);
});
['lIce','lPop','lRoute','lMix','lOld'].forEach(function(id){
  document.getElementById(id).addEventListener('change',function(ev){
    var m={lIce:'ice',lPop:'pop',lRoute:'route',lMix:'mix',lOld:'old'};
    state.layers[m[id]]=ev.target.checked;syncJump();update();
  });
});
var REGIONS={
  world:[0,0,1000,H],
  old:[X(-22),Y(75),170*K,115*K],
  'india-aus':[X(66),Y(31),86*K,72*K],
  sasia:[X(40),Y(48),70*K,50*K],
  'eurasia-e':[X(60),Y(62),120*K,108*K],
  amer:[X(-170),Y(75),140*K,133*K]
};
document.getElementById('region').addEventListener('change',function(ev){
  var v=REGIONS[ev.target.value];svg.setAttribute('viewBox',v.map(function(n){return n.toFixed(1);}).join(' '));applyScale();
});
/* tree interaction */
function treeSet(ev){
  var r=tree.getBoundingClientRect();
  var x=(ev.clientX-r.left)/r.width*1000;
  setP((x-LEFT)/(RIGHT-LEFT));
}
var dragging=false;
tree.addEventListener('pointerdown',function(ev){dragging=true;tree.setPointerCapture(ev.pointerId);stop();treeSet(ev);});
tree.addEventListener('pointermove',function(ev){if(dragging){treeSet(ev);}});
tree.addEventListener('pointerup',function(){dragging=false;});
tree.addEventListener('pointercancel',function(){dragging=false;});

/* jump list */
var jump=document.getElementById('jump');
EVENTS.slice().sort(function(a,b){return b.t0-a.t0;}).forEach(function(e){
  var b=document.createElement('button');b.type='button';
  b.textContent=e.title;
  var s=document.createElement('small');s.textContent=rangeStr(e.t0,e.t1);b.appendChild(s);
  b.addEventListener('click',function(){stop();setT((e.t0+e.t1)/2);window.scrollTo({top:0,behavior:'smooth'});});
  e.btn=b;
  jump.appendChild(b);
});
function syncJump(){EVENTS.forEach(function(e){if(e.btn){e.btn.hidden=!shown(e);}});}

applyScale();
if(window.ResizeObserver){new ResizeObserver(function(){applyScale();}).observe(svg);}
