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
function mkActor(modes,defKey,rider){
 const w=el('<div class="cyc"><div class="cycsh"></div><img></div>');
 F.appendChild(w);
 const o={w:w,img:w.querySelector('img'),x:0,y:0,f:1,modes:modes,base:modes[defKey]};
 /* `rider` marks who the wheel loop belongs to */
 o.riding=on=>{w.classList.toggle('riding',!!on);
  if(rider){if(on)play('bike');else stopSnd('bike')}};
 /* Switch sprite set. Box size and anchor come from the mode, so a wider wheelie
    canvas does not move him. */
 /* how far the rear wheel sits from the box centre, in px. The ramp needs this:
    his position along the slope is where the WHEEL is, not where the box is. */
 o.wheelDX=()=>{const b=o.base,bCW=U(b.hu)*b.ar;return (b.ax-0.5)*bCW};
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
 clean();
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
   the rider's height and the ramp's drawn height, so the two cannot drift apart
   and leave him floating over the lip. */
const RAMP_A_RISE=GROUND1-DECK, RAMP_A_TIP=0.70;   /* fraction along leg A */
const RAMP_B_RISE=10.5,          RAMP_B_TIP=0.30;   /* fraction along leg B */
const RAMP_AR=2.5;                                  /* the plate is 5:2 */

/* Surface height as a fraction of the ramp's own box, MEASURED off
   assets/bg/ramp.webp by build_ramp() -- foot on the left, crest on the right.
   The rider follows this rather than a straight line between two guessed
   waypoints, which is what makes the wheels sit on the planks. Re-run the build
   and paste this again if the ramp art changes. */
const RAMP_PROFILE=[0.9688,0.8850,0.8462,0.8037,0.7588,0.7113,0.6613,0.6075,
                    0.5525,0.4938,0.4325,0.3688,0.3013,0.2300,0.1550,0.0775,0.0000];
function rampSurface(u){
 const n=RAMP_PROFILE.length-1,t=Math.min(1,Math.max(0,u))*n,i=Math.floor(t);
 return i>=n?RAMP_PROFILE[n]:RAMP_PROFILE[i]+(RAMP_PROFILE[i+1]-RAMP_PROFILE[i])*(t-i);
}

/* A ramp in the act layer, so it scrolls with the world. Its box IS the ramp:
   bottom edge on the surface below, top edge the crest. Returns the geometry the
   rider needs to walk its profile. */
function putRamp(rig,tipCam,crestY,rise){
 const Fw=F.clientWidth,Fh=F.clientHeight;
 const rh=rise/100*Fh,rw=Math.round(rh*RAMP_AR);
 const rp=el('<img class="ramp" src="'+A.ramp+'">');
 rp.style.cssText='position:absolute;width:'+rw+'px;height:'+Math.round(rh)+'px;'
  +'left:'+(tipCam*rig.span+HOLD_X/100*Fw-rw*0.94)+'px;'
  +'top:'+(crestY/100*Fh)+'px;z-index:2';
 rig.act.appendChild(rp);
 /* his position along the ramp, 0 at the foot and 1 at the crest. It is placed so
    he is 94% along it at tipCam, which is where the crest sits. */
 const wCam=rw/rig.span;
 return {crestY:crestY,rise:rise,baseY:crestY+rise,
         /* dx shifts u by the rider's wheel offset, so u==0 is the wheel at the
            foot of the ramp rather than the sprite's box centre */
         u:(camF,dx)=>(camF-tipCam)/wCam+0.94+(dx||0)/rw,
         y:u=>crestY+rampSurface(u)*rise,
         footCam:tipCam-0.94*wCam, crestCam:tipCam+0.06*wCam, wCam:wCam,
         dxCam:dx=>(dx||0)/rig.span};
}
/* Steps the rider through the wheelie as he crosses a ramp, and tilts him with
   the slope. Beats are derived from the ramp's own geometry rather than typed in,
   so moving the ramp moves them with it. */
function wheelieRun(J,r,legOf){
 /* shifted by the same wheel offset, so the lift happens as the WHEEL reaches
    the foot rather than as the sprite's centre does */
 const sh=r.dxCam(J.wheelDX());
 const lift=legOf(r.footCam-sh)-0.05, foot=legOf(r.footCam-sh),
       crest=legOf(r.crestCam-sh), done=legOf(r.crestCam-sh)+0.10;
 const table=[[0,'cyc'],[lift,'lift'],[foot,'hold'],[crest,'land'],[done,'cyc']];
 const tilt=[[0,0],[lift,0],[foot,-14],[crest,-14],[done,0],[1,0]];
 let mode='';
 return p=>{
  for(let i=table.length-1;i>=0;i--)if(p>=table[i][0]){
   if(mode!==table[i][1]){mode=table[i][1];J.show(mode);
    if(mode==='lift')tone(520,.10);if(mode==='land')tone(300,.14)}
   break}
  J.img.style.transform='rotate('+yAt(tilt,p).toFixed(1)+'deg)';
 };
}

function hook(){
 clean();
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
   const rA=putRamp(rig,RAMP_A_TIP*.5,DECK,RAMP_A_RISE);   /* onto the bridge */
   const runA=wheelieRun(J,rA,c=>c/.5);
   tween(LEG,p=>{
    rig.setF(p*.5);
    const u=rA.u(p*.5,J.wheelDX());
    J.place(HOLD_X,u<=0?GROUND1:u>=1?DECK:rA.y(u));
    runA(p);
   },()=>{J.img.style.transform=''});  },t);
  t+=LEG;

  /* ---- stop 2: he stops midspan and speaks, alone ---- */
  later(()=>{J.show('still');J.riding(0);tone(430,.12)},t);
  t+=say(HOOK.bridge,t);

  /* ---- leg B: both travel on to the clearing ---- */
  later(()=>{
   J.show('cyc');J.riding(1);
   const rB=putRamp(rig,.5+RAMP_B_TIP*.5,DECK-RAMP_B_RISE,RAMP_B_RISE);
   const runB=wheelieRun(J,rB,c=>(c-.5)/.5);
   const offP=(rB.crestCam-.5)/.5;                   /* leg fraction at the lip */
   tween(LEG,p=>{
    rig.setF(.5+p*.5);
    const u=rB.u(.5+p*.5,J.wheelDX());
    let y;
    if(u<=0)y=DECK; else if(u<1)y=rB.y(u);
    else{const q=Math.min(1,(p-offP)/(0.80-offP));   /* off the lip, down to the clearing */
         y=rB.crestY+(GROUND3-rB.crestY)*q}
    J.place(HOLD_X,y);
    runB(p);
   },()=>{J.img.style.transform=''});  },t);
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
 clean();
 const rig=pxBuild(1),bt='bottom:'+(100-GROUND3)+'%';
 RELAY=()=>rig.layout();
 chip('ele','left:'+HOLD_X+'%;'+bt).classList.add('px');
 chip('mon','left:'+MONTY_X+'%;'+bt).classList.add('px');
 chip('tur','left:90.7%;'+bt,rig.act).classList.add('px');
 /* the script already said 'Let us go', so this is just the instruction */
 ask('The trail starts here. More of it soon.','nar');
}
