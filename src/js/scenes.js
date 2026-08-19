/* The four scenes: opening, map, a level, ending. */

/* ---------- parallax rig ----------
   Seven layers out of assets/bg. Each repeating layer is a div four frames wide
   showing two tiles -- the art is pre-mirrored, so one tile is two frames -- which
   leaves enough content for even the fastest layer to translate without running
   dry. The act layer is three frames wide (bank | bridge | clearing) and is the
   plane the camera and the rider share, so its rate is exactly 1: layers slower
   than 1 fall behind him, faster than 1 sweep past in front.
   Heights for the two fringe strips are their art heights against a 1920 tile. */
const PXBACK=[['far_sky',0.20],['mid_canopy',0.50]];
const PXFRONT=[['near_leaves',1.40,'top',169],['near_grass',1.40,'bottom',236]];
const SEG=['act_bank','act_bridge','act_clearing'];

function pxBuild(f0){
 /* The camera is a FRACTION of total travel (0 = bank, .5 = bridge, 1 = clearing),
    never a pixel count. Every pixel is recomputed from the live frame width by
    layout(), so a resize cannot leave the layers and the riders disagreeing about
    where the world is -- which is what put him at the bank's ground height while
    the bridge already filled the frame. */
 const rig=[];
 BG.style.backgroundImage='none';      /* far_sky is opaque and covers the frame */
 const layer=(cls,z,css)=>{
  const d=el('<div class="'+cls+'"></div>');
  d.style.cssText='z-index:'+z+';'+css;F.appendChild(d);return d};
 PXBACK.forEach(([k,rate])=>rig.push({el:layer('pxb',1,
  'top:0;height:100%;background-image:url('+A[k]+')'),rate:rate,tile:1}));
 const act=layer('pxb',1,'top:0;height:100%');
 const segs=SEG.map(k=>{
  const g=el('<div></div>');
  g.style.cssText='position:absolute;top:0;height:100%;background-size:100% 100%;'
   +'background-repeat:no-repeat;background-image:url('+A[k]+')';
  act.appendChild(g);return g});
 /* One trunk laid over each segment join. Both plates carry a full-height edge
    trunk, so where two segments butt you get two HALF trunks on a hard vertical
    edge plus a tonal step; one trunk spanning the join reads as scenery. */
 const joins=SEG.slice(1).map(()=>{
  const t=el('<div></div>');
  t.style.cssText='position:absolute;top:0;height:100%;background-size:100% 100%;'
   +'background-repeat:no-repeat;background-image:url('+A.join_trunk+')';
  act.appendChild(t);return t});
 rig.push({el:act,rate:1});
 PXFRONT.forEach(([k,rate,edge,h])=>rig.push({el:layer('pxf',6,
  edge+':0;background-image:url('+A[k]+')'),rate:rate,tile:1,strip:h}));
 rig.act=act;rig.f=f0||0;

 rig.layout=()=>{
  const Fw=Math.round(F.clientWidth);
  rig.span=Fw*(SEG.length-1);          /* total camera travel, in px */
  rig.forEach(o=>{
   if(o.tile){
    o.el.style.width=(Fw*4)+'px';
    o.el.style.backgroundSize=(Fw*2)+'px 100%';
    if(o.strip)o.el.style.height=Math.round(Fw*o.strip/1920)+'px';
   } else o.el.style.width=(Fw*SEG.length)+'px';
  });
  /* 1px wider than a frame so neighbours overlap rather than risk a hairline gap */
  segs.forEach((g,i)=>{g.style.left=(i*Fw)+'px';g.style.width=(Fw+1)+'px'});
  joins.forEach((t,i)=>{
   const tw=Math.round(Fw*230/1920);
   t.style.left=((i+1)*Fw-tw/2)+'px';t.style.width=tw+'px'});
  rig.setF(rig.f);
 };
 rig.setF=f=>{rig.f=f;rig.forEach(o=>{
  o.el.style.transform='translateX('+Math.round(-f*rig.span*o.rate)+'px)'})};
 rig.layout();
 return rig;
}


/* Drive motion from rAF. Progress comes from wall-clock rather than accumulating,
   so a backgrounded tab catches up instead of drifting out of step with the
   later() beats. Layers AND riders are placed from the same fraction each frame,
   so they cannot disagree about where the world is. */
function tween(ms,step,after){
 const g=GEN,t0=VT;
 (function fr(){
  if(g!==GEN)return;
  const p=Math.min(1,(VT-t0)/ms);
  step(p);
  if(p<1)requestAnimationFrame(fr);else if(after)after();
 })();
}
const easeOut=p=>1-Math.pow(1-p,3);
/* y at fraction p along a [fraction, y%] track */
function yAt(track,p){
 for(let i=1;i<track.length;i++)if(p<=track[i][0]){
  const a=track[i-1],b=track[i];
  return a[1]+(b[1]-a[1])*(b[0]===a[0]?0:(p-a[0])/(b[0]-a[0]));
 }
 return track[track.length-1][1];
}

/* An actor positioned in PERCENTAGES, so a resize just re-places it. Its box is
   sized for its widest sprite -- object-fit:contain would otherwise shrink a wide
   walk cycle to fit a box cut for the narrower idle. */
function mkActor(modes,defKey,streaks){
 /* three streaks at different heights, widths and phases so they read as motion
    rather than as a repeating pattern. Trail left, behind a right-facing rider. */
 const dash=streaks?[[52,64,0],[66,44,.17],[78,54,.33]].map(([top,wid,delay])=>
  '<div class="dash" style="top:'+top+'%;width:'+wid+'%;left:-'+(wid*0.75)+'%;'
  +'animation-delay:'+delay+'s"></div>').join(''):'';
 const w=el('<div class="cyc">'+dash+'<div class="cycsh"></div><img></div>');
 F.appendChild(w);
 const o={w:w,img:w.querySelector('img'),x:0,y:0,f:1,modes:modes,base:modes[defKey]};
 o.riding=on=>{w.classList.toggle('riding',!!on);
  if(streaks){if(on)play('bike');else stopSnd('bike')}};
 /* Switch sprite set. Box size and anchor come from the mode, so a wider wheelie
    canvas does not move him. */
 o.show=k=>{const m=o.modes[k];if(!m||m===o.m)return;
  o.m=m;o.img.src=m.url;w.classList.toggle('wheelie',!!m.wheelie);o.layout()};
 o.layout=()=>{
  const m=o.m||o.base;
  o.CH=U(m.hu);o.CW=Math.round(o.CH*m.ar);
  w.style.width=o.CW+'px';w.style.height=o.CH+'px';o.place();
 };
 o.place=(x,y,f)=>{
  if(x!==undefined)o.x=x;if(y!==undefined)o.y=y;if(f!==undefined)o.f=f;
  const m=o.m||o.base,b=o.base,Fw=F.clientWidth;
  /* The rear wheel is the fixed point. Its screen position is defined by the BASE
     sprite's geometry, so every existing coordinate keeps meaning what it meant. */
  const bCW=U(b.hu)*b.ar, anchorX=o.x/100*Fw - bCW/2 + b.ax*bCW;
  w.style.transform='translate('+(anchorX - m.ax*o.CW)+'px,'
   +(o.y/100*F.clientHeight - o.CH)+'px) scaleX('+o.f+')';
 };
 o.show(defKey);
 return o;
}

/* The live scene registers how to re-lay itself out; clean() drops it. */
let RELAY=null;
addEventListener('resize',()=>{if(RELAY)RELAY()});


/* ---------- title ----------
   Browsers will not start audio until the user has interacted, and the story used
   to auto-play on load -- so the first tap only happened once it was over, and the
   music arrived with the map. One deliberate tap here unlocks audio first, and the
   opening then plays with sound under it. */
function title(){
 clean();cur=0;pips();
 const rig=pxBuild(0);
 RELAY=()=>rig.layout();
 F.appendChild(el('<div class="over card"><h3>Word Tree</h3>'
  +'<p>Monty, Jhumru and Tez are walking to the Word Tree.<br>Somebody always needs another word.</p>'
  +'<button class="btn">Play</button></div>'));
 F.querySelector('.btn').onclick=()=>{audioStart();hook()};
 $('#asktxt').textContent='Tap Play to begin.';   /* set, not spoken -- no gesture yet */
}


/* ---------- opening ----------
   Three stops:
     1  near bank    -- he rides in and introduces himself
     2  mid bridge   -- he stops, Monty walks in from ahead and joins him
     3  the clearing -- they travel on together, Tez is waiting
   Camera stops are fractions of travel: 0, .5, 1. Tap anywhere to skip. */
/* Travel was reading as rushed. LEG is the slowest lever -- it is how long a
   full screen of world takes to pass. */
const RIDE_IN=1500,LEG=4200,JOIN=1000,SETTLE=800,LINE=1550;
const HOLD_X=42,MONTY_X=58;
/* The three walkable surfaces, measured off the art. GROUND1 is the top of the
   ochre PATH in act_bank -- measuring topmost-opaque instead finds the bushes
   standing BEHIND the path and leaves him floating ~32px above it. */
const GROUND1=77.5,DECK=65.6,GROUND3=86;
/* Both legs carry a ramp and a wheelie.

   Leg A is the climb ONTO the bridge: the ramp rises the full bank-to-deck
   distance, so the height change is explained rather than just happening.
   Leg B is the ride off it: a shorter take-off ramp on the deck itself.

   RAMP_*_RISE is the single source of truth for each -- it sets both the crest in
   the Y track and the ramp's drawn height, so the two cannot drift apart and
   leave him floating over the lip. Width follows from a 0.40 rise:run. */
const RAMP_A_RISE=GROUND1-DECK, RAMP_A_TIP=0.70;   /* fraction along leg A */
const RAMP_B_RISE=10.5,          RAMP_B_TIP=0.30;   /* fraction along leg B */

const LEG_A_Y=[[0,GROUND1],[.55,GROUND1],[RAMP_A_TIP,DECK],[1,DECK]];
const LEG_B_Y=[[0,DECK],[.17,DECK],[RAMP_B_TIP,DECK-RAMP_B_RISE],[.40,DECK-RAMP_B_RISE],
               [.50,DECK],[.60,GROUND3],[1,GROUND3]];
/* [leg fraction, sprite] -- lift before the ramp, hold over it, land coming off */
const WHEELIE_A=[[0,'cyc'],[.47,'lift'],[.56,'hold'],[.72,'land'],[.82,'cyc']];
const WHEELIE_B=[[0,'cyc'],[.17,'lift'],[.26,'hold'],[.42,'land'],[.52,'cyc']];
/* and the body tilt that goes with each */
const TILT_A=[[0,0],[.47,0],[.58,-14],[.70,-14],[.82,0],[1,0]];
const TILT_B=[[0,0],[.17,0],[.30,-14],[.42,-14],[.52,0],[1,0]];

/* A take-off ramp in the act layer, so it scrolls with the world. topY is the
   height its crest reaches; it descends `rise` from there to its base. */
function putRamp(rig,tipCam,topY,rise){
 const Fh=F.clientHeight,rh=rise/100*Fh,rw=Math.round(rh/0.40),rp=svg(rampSVG());
 rp.style.cssText='position:absolute;width:'+rw+'px;height:'+Math.round(rh)+'px;'
  +'left:'+(tipCam*rig.span+HOLD_X/100*F.clientWidth-rw*0.94)+'px;'
  /* bed it into the surface rather than perching on its top edge */
  +'top:'+(topY/100*Fh+Fh*0.015)+'px;z-index:2';
 rig.act.appendChild(rp);return rp;
}
/* Steps the rider through a wheelie table as p advances and tilts him with the
   ramp. Returns the per-frame call. */
function wheelieRun(J,table,tiltTrack){
 let mode='';
 return p=>{
  for(let i=table.length-1;i>=0;i--)if(p>=table[i][0]){
   if(mode!==table[i][1]){mode=table[i][1];J.show(mode);
    if(mode==='lift')tone(520,.10);if(mode==='land')tone(300,.14)}
   break}
  J.img.style.transform='rotate('+yAt(tiltTrack,p).toFixed(1)+'deg)';
 };
}


function hook(){
 clean();cur=0;pips();
 const g=GEN;

 function skip(){intro()}                 /* clean() drops the listener for us */
 fon('pointerdown',skip);
 const done=()=>intro();

 Promise.all(['far_sky','mid_canopy','act_bank','act_bridge','act_clearing','cyc','cycs']
  .map(k=>new Promise(r=>{const i=new Image();i.onload=i.onerror=r;i.src=A[k]})))
  .then(()=>{if(g===GEN)roll()});

 /* Plays one stop of HOOK. Each line carries its own voice and optional cue, and
    the stop's length falls out of how many lines it has -- so the script can grow
    or shrink in levels.js without touching any timing here. */
 const say=(lines,t0)=>{
  lines.forEach((l,i)=>later(()=>{
   ask(l.line,l.who);
   if(l.fx==='bell')play('bell');
   if(l.fx==='map')trailMap();
   if(l.fx==='ask')askToCome();
  },t0+i*LINE));
  return Math.max(LINE,lines.length*LINE);
 };
 /* the jungle trail map, popped up in front of him */
 function trailMap(){
  const m=el('<img class="trailmap" src="'+A.map+'">');
  F.appendChild(m);
  later(()=>{m.classList.add('away');later(()=>m.remove(),420)},2600);
 }
 /* He turns to the player. Nothing advances until they answer, so the skip
    listener comes off -- the choice IS the interaction at this point. */
 function askToCome(){
  foff();
  const c=el('<div class="over card"><h3>Will you come?</h3>'
   +'<button class="btn">Yes!</button></div>');
  F.appendChild(c);
  c.querySelector('.btn').onclick=e=>{
   e.stopPropagation();c.remove();
   say(HOOK.go,0);
   later(intro,Math.max(LINE,HOOK.go.length*LINE)+200);
  };
 }

 function roll(){
  const rig=pxBuild(0);
  chip('tur','left:90.7%;bottom:'+(100-GROUND3)+'%',rig.act).classList.add('px');
  /* 0.70 is the WALK aspect: his box must fit his widest sprite */
  /* 322 = 215 * 1.5. Monty stays 185, so the elephant now reads 1.74x the monkey.
     For 1.5x the MONKEY instead, this is 278. Feet are unaffected either way --
     place() anchors on the ground line, not the top of the sprite. */
  const J=mkActor(RIDER,'cyc',1);
  const M=mkActor({idle:{url:IDLE.mon,hu:185,ar:0.70,ax:0.5},
                   walk:{url:WALK.mon,hu:185,ar:0.70,ax:0.5}},'idle');
  J.place(-14,GROUND1);M.place(118,GROUND3,-1);   /* waits off the right edge */
  RELAY=()=>{rig.layout();J.layout();M.layout()};

  let t=0;
  /* ---- stop 1: the near bank ---- */
  J.riding(1);
  tween(RIDE_IN,p=>J.place(-14+(HOLD_X+14)*easeOut(p),GROUND1),
        ()=>{J.show('still');J.riding(0);tone(430,.12)});
  t=RIDE_IN;t+=say(HOOK.bank,t);

  /* ---- leg A: ride to the middle of the bridge ---- */
  later(()=>{
   say(HOOK.legA,0);                                 /* spoken as he pedals off */
   J.show('cyc');J.riding(1);
   putRamp(rig,RAMP_A_TIP*.5,DECK,RAMP_A_RISE);      /* the climb onto the bridge */
   const runA=wheelieRun(J,WHEELIE_A,TILT_A);
   tween(LEG,p=>{rig.setF(p*.5);J.place(HOLD_X,yAt(LEG_A_Y,p));runA(p)},
         ()=>{J.img.style.transform=''});
  },t);
  t+=LEG;

  /* ---- stop 2: he stops midspan and speaks, alone ---- */
  later(()=>{J.show('still');J.riding(0);tone(430,.12)},t);
  t+=say(HOOK.bridge,t);

  /* ---- leg B: both travel on to the clearing ---- */
  later(()=>{
   J.show('cyc');J.riding(1);
   putRamp(rig,.5+RAMP_B_TIP*.5,DECK-RAMP_B_RISE,RAMP_B_RISE);
   const runB=wheelieRun(J,WHEELIE_B,TILT_B);
   tween(LEG,p=>{rig.setF(.5+p*.5);J.place(HOLD_X,yAt(LEG_B_Y,p));runB(p)},
         ()=>{J.img.style.transform=''});
  },t);
  t+=LEG;

  /* ---- stop 3: the clearing, and Monty arrives from the right ---- */
  later(()=>{J.show('still');J.riding(0);tone(430,.12)},t);
  t+=SETTLE;
  later(()=>{
   tone(560,.12);M.show('walk');
   /* walk cycle faces right, so scaleX(-1) to come leftward off the right edge */
   const si=every(()=>play('step'),360);   /* 8-frame cycle is 720ms -> 2 steps */
   tween(JOIN,p=>M.place(118+(MONTY_X-118)*easeOut(p),GROUND3,-1),
         ()=>{M.show('idle');cancel(si)});
  },t);
  t+=JOIN;
  say(HOOK.clearing,t);   /* ends on 'Will you come?' -- askToCome() takes over */
 }
}


/* ---------- intro ----------
   The clearing, camera parked where the opening left it and everyone standing
   where they stopped, so the handoff is a continuation rather than a cut. */
function intro(){
 clean();cur=0;pips();
 const rig=pxBuild(1),bt='bottom:'+(100-GROUND3)+'%';
 RELAY=()=>rig.layout();
 chip('ele','left:'+HOLD_X+'%;'+bt).classList.add('px');
 chip('mon','left:'+MONTY_X+'%;'+bt).classList.add('px');
 chip('tur','left:90.7%;'+bt,rig.act).classList.add('px');
 F.appendChild(svg(vineSVG()));
 const go=svg(tagSVG('start',0));go.style.left='72%';go.style.bottom=U(52)+'px';
 go.onclick=()=>map();F.appendChild(go);
 /* the script already said 'Let us go', so this is just the instruction */
 ask('Tap the start tag to begin the trail.','nar');
}


/* ---------- map ---------- */
const POCK=[[20,31],[45,30],[71,31],[71,70],[46,71],[26,70]];
function map(){
 clean();pips();setbg('map');
 if(cur>=L.length)return finishAll();
 L.forEach((_,k)=>{
  const cls=k<cur?'doneN':(k===cur?'cur':'lockN');
  const n=el('<div class="node '+cls+'" style="left:'+POCK[k][0]+'%;top:'+POCK[k][1]+'%">'+(k<cur?'\u2713':(k+1))+'</div>');
  if(k===cur)n.onclick=()=>level(cur);
  F.appendChild(n);
 });
 ask('Tap the glowing spot. Place '+(cur+1)+' of 6.');
}


/* ---------- a level ---------- */
function level(k,rd){
 clean();pips();
 /* rd is a follow-up round (level 6's `then`); it overrides only what differs */
 /* {then:null} first, or a follow-up round inherits its parent's `then` and
    re-enters itself forever. rd may still set its own to chain a 3rd round. */
 const r=rd?Object.assign({},L[k],{then:null},rd):L[k];
 setbg(r.bg);
 if(r.fx0&&FXMAP[r.fx0])FXMAP[r.fx0]();          /* carry state into round 2 */

 /* want decides which of the three tags is correct, and therefore what the
    other two mean when they are picked. See docs/05-story-spine.md. */
 const good=r[r.want],other=r[r.want==='syn'?'ant':'syn'];
 const otherL=r.want==='syn'?r.antL:r.synL,same=r.want==='syn';

 chip(r.say,'left:4%');
 /* SAME -> a friend waits on the right. OPPOSITE -> a lit stone does instead.
    That swap is the only thing telling the child which operation this is. */
 let hr;
 if(same){hr=chip(r.hear,'right:4%')}
 else{hr=svg(stoneSVG());hr.style.right='5%';hr.style.bottom=U(26)+'px';F.appendChild(hr)}

 const sg=svg(signSVG(r.w));sg.style.left='3%';sg.style.bottom=U(367)+'px';F.appendChild(sg);
 F.appendChild(svg(vineSVG()));
 ask(same?NAME[r.say]+' says '+r.w+'. Carry a word that means the SAME to '+NAME[r.hear]+'.'
         :'The '+r.place+' is '+r.w+'. Carry the word that means the OPPOSITE.');
 let live=true;
 const opts=[r.syn,r.ant,r.un].sort(()=>Math.random()-.5);
 const xs=['27%','45.5%','64%'];
 opts.forEach((w,i)=>{
  const t=svg(tagSVG(w,i));t.style.left=xs[i];t.style.bottom=U(13)+'px';
  F.appendChild(t);
  let held=false,sx=0,sy=0,ox=0,oy=0,moved=0;
  const home=()=>{t.style.transform='';t.classList.add('sway');t.classList.remove('held')};
  const land=()=>{
   const fr=F.getBoundingClientRect(),tb=t.getBoundingClientRect();
   const hb=hr.getBoundingClientRect();
   const cx=hb.left+hb.width/2-fr.left, cy=hb.top+hb.height*0.42-fr.top;
   const nx=cx-(tb.left+tb.width/2-fr.left), ny=cy-(tb.top+tb.height/2-fr.top);
   if(w===good){
    live=false;t.classList.add('gone');
    t.animate([{transform:t.style.transform||'none'},
      {transform:`translate(${ox+nx*0.5}px,${oy+ny-U(153)}px) rotate(-12deg)`,offset:.55},
      {transform:`translate(${ox+nx}px,${oy+ny}px) rotate(6deg)`}],
      {duration:700,easing:'cubic-bezier(.3,.1,.4,1)',fill:'forwards'}).onfinish=()=>{
       ringAt(cx,cy);sparkle(cx-9,cy-9);tone(660,.24);
       t.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});
       if(same)hr.style.transform='translateX('+U(-74)+'px) scale(1.07)';else hr.classList.add('lit');
       if(r.after){BG2.style.backgroundImage='url('+A[r.after]+')';BG2.style.opacity='1'}
       if(r.fx&&FXMAP[r.fx])FXMAP[r.fx]();
       shells++;streak++;$('#shn').textContent=shells;
       if(!kept.some(x=>x.w===r.w&&x.x===good))kept.push({w:r.w,x:good,same:same});
       F.appendChild(el('<div class="verd">'+r.w+' and '+good+(same?' mean the same':' are opposites')+'</div>'));
       speak(r.w+'. '+good+'. '+(same?'Same meaning. ':'Opposites. ')+r.ok);
       later(()=>{if(r.then)level(k,r.then);else{cur=k+1;map()}},4300);
      };
   } else if(w===other){
    tone(300,.14);streak=0;t.classList.remove('sway');
    t.animate([{transform:t.style.transform||'none'},
      {transform:`translate(${ox+nx*0.86}px,${oy+ny}px) rotate(8deg)`,offset:.45},
      {transform:'none'}],{duration:1200,easing:'ease-in-out'}).onfinish=home;
    hr.classList.add('wob');later(()=>hr.classList.remove('wob'),520);
    speak(otherL);
   } else {
    tone(230,.16);streak=0;t.classList.remove('sway');
    t.animate([{transform:t.style.transform||'none',opacity:1},
      {transform:`translate(${ox}px,${oy+U(393)}px) rotate(46deg)`,opacity:0}],
      {duration:800,easing:'cubic-bezier(.4,0,.8,.4)',fill:'forwards'}).onfinish=()=>{
       t.style.transform='';t.style.animation='grow .55s cubic-bezier(.3,1.5,.5,1) both';
       t.animate([{opacity:0},{opacity:1}],{duration:400,fill:'forwards'});
       later(()=>{t.style.animation='';t.classList.add('sway')},600);
      };
    speak(r.unL);
   }
  };
  t.addEventListener('pointerdown',e=>{
   if(!live)return;held=true;moved=0;sx=e.clientX;sy=e.clientY;
   t.classList.remove('sway');t.classList.add('held');
   try{t.setPointerCapture(e.pointerId)}catch(x){}
  });
  t.addEventListener('pointermove',e=>{
   if(!held||!live)return;ox=e.clientX-sx;oy=e.clientY-sy;
   moved=Math.max(moved,Math.abs(ox)+Math.abs(oy));
   t.style.transform=`translate(${ox}px,${oy}px) scale(1.06) rotate(${ox*0.03}deg)`;
  });
  const up=e=>{
   if(!held||!live)return;held=false;t.classList.remove('held');
   const fr=F.getBoundingClientRect(),tb=t.getBoundingClientRect();
   const centre=tb.left+tb.width/2-fr.left;
   if(moved<U(31)){ox=0;oy=0;t.style.transform='';land();return}
   if(centre>fr.width*0.58){land()}
   else{t.animate([{transform:t.style.transform},{transform:'none'}],{duration:340,easing:'cubic-bezier(.3,1.3,.6,1)'}).onfinish=home}
  };
  t.addEventListener('pointerup',up);t.addEventListener('pointercancel',up);
 });
}


/* ---------- ending ---------- */
function finishAll(){
 clean();pips();setbg('falls');fxWater();
 chip('ele','left:6%');chip('tur','left:26%');chip('mon','left:44%');
 /* the two operations are reported separately -- a child who only ever saw
    "pairs" would have no name for what happened at the cave and the tree */
 const row=(t,a,sep)=>a.length?'<p class="rowt">'+t+'</p><div class="chips">'
   +a.map(x=>'<span>'+x.w+' '+sep+' '+x.x+'</span>').join('')+'</div>':'';
 F.appendChild(el('<div class="over"><h3>The Word Tree is full again!</h3>'
  +row('Words that mean the same',kept.filter(x=>x.same),'=')
  +row('Words that mean the opposite',kept.filter(x=>!x.same),'↔')
  +'<button class="btn">Walk it again</button></div>'));
 F.querySelector('.btn').onclick=()=>{shells=0;streak=0;kept.length=0;$('#shn').textContent=0;hook()};
 speak('The Word Tree is full again. Some words mean the same. Some mean the opposite.');
}


/* ---------- PROTOTYPE: ride-through gates ----------
   docs/07 mechanic 1. Not wired into the trail yet -- press G from any screen.

   Arches approach in pairs, one word over each. Hold the UPPER half of the frame
   to lift into the high arch, the LOWER half to stay down. The word is a ROUTE:
   choosing is going somewhere, and being wrong is being somewhere else. No tiles,
   no release target, one continuous hold -- the most forgiving input available at
   six (docs/01 §P6).

   Wrong is never punished: he coasts to a stop, the arch says its own word, and
   he rolls on. Correct is a pass-through with a ring and a chime (§P3).

   want:'syn' -> take the arch whose word means the SAME
   want:'ant' -> take the arch whose word means the OPPOSITE                     */
const WORLD_Y=[[0,GROUND1],[.30,GROUND1],[.35,DECK],[.735,DECK],[.80,GROUND3],[1,GROUND3]];
const GATE_AT=[.26,.52,.78];      /* where along the world each pair stands */
const LANE_LIFT=17;               /* how far above the ground the high arch sits, %  */
const RUN_MS=15000;

function archSVG(word,hi){
 return `<svg class="arch" viewBox="0 0 260 200" preserveAspectRatio="none">
  <rect x="14" y="40" width="30" height="160" rx="8" fill="#8A6231"/>
  <rect x="216" y="40" width="30" height="160" rx="8" fill="#8A6231"/>
  <path d="M14 46q116-46 232 0v34q-116-40-232 0z" fill="${hi?'#C89A5E':'#B98C52'}" stroke="#7A5A2E" stroke-width="5"/>
  <text x="130" y="66" text-anchor="middle" dominant-baseline="central"
        font-family="Segoe UI,sans-serif" font-size="34" font-weight="700" fill="#4A3316">${word}</text>
 </svg>`;
}

function gates(k){
 clean();pips();
 const g=GEN,r=L[k||0];
 const good=r[r.want],other=r[r.want==='syn'?'ant':'syn'];
 const rig=pxBuild(0);
 const J=mkActor(RIDER,'cyc',1);J.riding(1);
 J.place(HOLD_X,yAt(WORLD_Y,0));
 RELAY=()=>{rig.layout();J.layout();place()};

 const sg=svg(signSVG(r.w));sg.style.left='3%';sg.style.bottom=U(367)+'px';F.appendChild(sg);
 ask(r.want==='syn'
  ? 'Ride through the word that means the SAME as '+r.w+'.'
  : 'Ride through the word that means the OPPOSITE of '+r.w+'.');

 /* one pair per gate: which lane holds the right word is shuffled per pair */
 const pairs=GATE_AT.map((at,i)=>{
  const hiGood=Math.random()<.5;
  const mk=(word,hi)=>{const e=svg(archSVG(word,hi));rig.act.appendChild(e);return e};
  return {at:at,hiGood:hiGood,done:false,
          hi:mk(hiGood?good:other,1),lo:mk(hiGood?other:good,0)};
 });

 let lane=0,taken=0,stopped=0;
 const place=()=>{
  const Fw=Math.round(F.clientWidth),Fh=F.clientHeight;
  const aw=Fw*0.17,ah=Fh*0.20;
  pairs.forEach(p=>{
   const gy=yAt(WORLD_Y,p.at)/100*Fh;
   const cx=p.at*rig.span+HOLD_X/100*Fw;
   [[p.hi,LANE_LIFT],[p.lo,0]].forEach(([e,lift])=>{
    e.style.cssText='position:absolute;width:'+aw+'px;height:'+ah+'px;z-index:2;'
     +'left:'+(cx-aw/2)+'px;top:'+(gy-lift/100*Fh-ah)+'px';
   });
  });
 };
 place();

 /* hold the upper half to lift, the lower half to drop. Tap counts too. */
 const pick=e=>{const b=F.getBoundingClientRect();lane=(e.clientY-b.top)<b.height*0.55?1:0};
 fon('pointerdown',pick);
 fon('pointermove',e=>{if(e.buttons)pick(e)});

 tween(RUN_MS,p=>{
  if(stopped){return}
  rig.setF(p);
  const gy=yAt(WORLD_Y,p);
  J.place(HOLD_X,gy-lane*LANE_LIFT*(1));
  place();
  pairs.forEach(q=>{
   if(q.done||p<q.at)return;
   q.done=true;
   const right=(lane===1)===q.hiGood;
   const fr=F.getBoundingClientRect();
   const cx=HOLD_X/100*fr.width,cy=(gy-lane*LANE_LIFT)/100*fr.height-U(90);
   if(right){
    taken++;shells++;$('#shn').textContent=shells;
    ringAt(cx,cy);sparkle(cx-U(20),cy-U(20));tone(660,.22);
    F.appendChild(el('<div class="verd">'+r.w+' '+(r.want==='syn'?'=':'↔')+' '+good+'</div>'));
    later(()=>{const v=F.querySelector('.verd');if(v)v.remove()},1100);
   } else {
    tone(240,.2);
    /* not punished: he stops, the arch says its word, and he rolls on */
    stopped=1;J.img.src=A.cycs;
    speak((lane===1?(q.hiGood?good:other):(q.hiGood?other:good))+'. '+
          (r.want==='syn'?'That is not the same as ':'That is not the opposite of ')+r.w+'.');
    later(()=>{if(g===GEN){stopped=0;J.img.src=A.cyc}},1800);
   }
  });
 },()=>{
  if(g!==GEN)return;
  foff();
  F.appendChild(el('<div class="over"><h3>'+taken+' of '+GATE_AT.length+' gates</h3>'
   +'<p>Hold the top of the screen to lift into the high arch, the bottom to stay down.</p>'
   +'<button class="btn">Ride again</button></div>'));
  F.querySelector('.btn').onclick=()=>gates(k);
 });
}
addEventListener('keydown',e=>{if(e.key==='g'||e.key==='G')gates(0)});
