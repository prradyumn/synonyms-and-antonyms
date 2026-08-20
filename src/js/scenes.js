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

/* `segs` names the act-layer plates; it defaults to the opening's three. `mid` adds
   ONE extra positioned layer between the canopy and the action plane -- the gorge
   interior, which has to travel slower than the deck so that what shows through the
   hole in the bridge slides more slowly than the hole does. That differential IS
   the depth effect; matched rates would look painted on. */
function pxBuild(f0,o){
 o=o||{};
 const segs=o.segs||SEG;
 /* `back` and `front` default to the opening's layers, so the world stays the same
    place unless a scene deliberately says otherwise. The raft swaps near_grass out
    -- grass over open water is wrong -- and adds three water bands.
    `mids` are extra layers between the far set and the action plane, each with its
    own rate, z, strip height and drift. */
 const back=o.back||PXBACK, front=o.front||PXFRONT, mids=o.mids||[];
 const laps=o.laps||[];
 /* `laps` OVERLAPS neighbouring plates instead of butting them, in design units.
    The gorge plates were each drawn self-contained, with their own rim at both
    edges -- so butted, the approach's thin bridge stub is followed by the span's
    240px rim block and you see two different structures meet. Pulling the span
    left by its rim width lands that rim ON the approach's edge, which is what it
    is a drawing of. Where laps are given the join trunks are dropped: an overlap
    that works needs no cover, and a tree was the wrong object over a rocky rim. */
 const lapAt=i=>laps.slice(0,i).reduce((a,b)=>a+b,0);
 const lapAll=lapAt(segs.length);
 /* The camera is a FRACTION of total travel (0 = bank, .5 = bridge, 1 = clearing),
    never a pixel count. Every pixel is recomputed from the live frame width by
    layout(), so a resize cannot leave the layers and the riders disagreeing about
    where the world is -- which is what put him at the bank's ground height while
    the bridge already filled the frame. */
 const rig=[];
 BG.style.backgroundImage='none';      /* far_sky is opaque and covers the frame */
 const layer=(cls,z,css)=>{
  const d=el('<div class="'+cls+'"></div>');
  d.style.cssText='z-index:'+z+';'+css;STAGE.appendChild(d);return d};
 back.forEach(([k,rate])=>rig.push({el:layer('pxb',1,
  'top:0;height:100%;background-image:url('+A[k]+')'),rate:rate,tile:1}));
 /* Extra layers between the far set and the action plane. A plain one (the gorge
    interior) is a single wide plate; a `strip` one (the water bands, the reeds) is a
    tiling strip pinned to an edge, like the near fringe. */
 mids.forEach(m=>{
  /* `paint` is a CSS background instead of an image -- used for the water sheen,
     which has to be a TILTED repeating gradient. The delivered ripples are long
     horizontal streaks, and a horizontal line scrolling sideways shows no movement
     at all, which is why the river read as still however fast it drifted. */
  const bg=m.paint||('url('+A[m.key]+')');
  const box=m.strip
   ? (m.edge||'bottom')+':0;height:'+Math.round(m.strip)+'px'
   : 'top:0;height:100%';
  const paint=m.strip
   ? 'background-repeat:repeat;background-image:'+bg
   : 'background-repeat:no-repeat;background-size:100% 100%;background-image:'+bg;
  const fx=m.fx?';filter:url(#'+m.fx+')':(m.dim?';filter:saturate(.86) brightness(.95)':'');
  /* A DRIFTING layer gets an inner texture div, and the drift is a transform on
     THAT, not a background-position on the layer itself. background-position is a
     paint property: every step repainted a full-frame div and, on three of these,
     re-ran an SVG filter over it. Measured, raising the drift rates alone cost 4fps
     purely because the rounded offset then changed twice as often -- the paint was
     always the cost, the speed just stopped hiding it. A transform on a
     will-change'd child is a compositor move, so the filtered result is reused.
     The swell animates background-position-y, so `wave` follows the background. */
  const wrap=layer((m.front?'pxf':'pxb')+((m.swell&&!m.drift)?' wave':''),m.z||1,
   box+(m.drift?'':';'+paint+fx)+(m.op?';opacity:'+m.op:''));
  let tex=null;
  if(m.drift){
   tex=el('<div class="tex'+(m.swell?' wave':'')+'"></div>');
   tex.style.cssText='position:absolute;left:0;top:0;height:100%;'+paint+fx
    +';will-change:transform';
   wrap.appendChild(tex);
  }
  rig.push({el:wrap,tex:tex,rate:m.rate,wide:m.wide,tile:m.strip?1:0,strip:m.strip,
            drift:m.drift||0,paint:!!m.paint});
 });
 const act=layer('pxb',2,'top:0;height:100%');
 const plates=segs.map(k=>{
  const g=el('<div></div>');
  g.style.cssText='position:absolute;top:0;height:100%;background-size:100% 100%;'
   +'background-repeat:no-repeat;'+(k?'background-image:url('+A[k]+')':'');
  act.appendChild(g);return g});
 /* One trunk laid over each segment join. Both plates carry a full-height edge
    trunk, so where two segments butt you get two HALF trunks on a hard vertical
    edge plus a tonal step; one trunk spanning the join reads as scenery. */
 /* Join trunks cover the seam where two painted plates butt. They are wrong when
    there is no seam: the raft world's middle segment is an empty spacer, so its
    boundaries have nothing to hide, and the trunk sprite -- feathered, since it is
    built to blend -- laid a translucent tree across the open river. `nojoin` opts
    out; overlaps already do. */
 const joins=(laps.length||o.nojoin)?[]:segs.slice(1).map(()=>{
  const t=el('<div></div>');
  t.style.cssText='position:absolute;top:0;height:100%;background-size:100% 100%;'
   +'background-repeat:no-repeat;background-image:url('+A.join_trunk+')';
  act.appendChild(t);return t});
 rig.push({el:act,rate:1});
 front.forEach(([k,rate,edge,h])=>rig.push({el:layer('pxf',6,
  edge+':0;background-image:url('+A[k]+')'),rate:rate,tile:1,strip:h}));
 rig.act=act;rig.segs=plates;rig.n=segs.length;rig.f=f0||0;

 rig.layout=()=>{
  const Fw=Math.round(F.clientWidth);
  const u=Fw/1920;
  rig.span=Fw*(segs.length-1)-lapAll*u;   /* total camera travel, in px */
  rig.forEach(o=>{
   const t=o.tex||o.el;                  /* the box scales; the texture paints */
   if(o.tile){
    o.el.style.width=(Fw*4)+'px';if(o.tex)o.tex.style.width=(Fw*4)+'px';
    if(!o.paint)t.style.backgroundSize=(Fw*2)+'px 100%';
    if(o.strip)o.el.style.height=Math.round(Fw*o.strip/1920)+'px';
   } else {
    const w=(Fw*(o.wide||segs.length)-(o.wide?0:lapAll*u))+'px';
    o.el.style.width=w;if(o.tex)o.tex.style.width=w;
   }
  });
  /* 1px wider than a frame so neighbours overlap rather than risk a hairline gap */
  plates.forEach((g,i)=>{
   g.style.left=Math.round(i*Fw-lapAt(i)*u)+'px';g.style.width=(Fw+1)+'px'});
  joins.forEach((t,i)=>{
   const tw=Math.round(Fw*230/1920);
   t.style.left=((i+1)*Fw-tw/2)+'px';t.style.width=tw+'px'});
  rig.setF(rig.f);
 };
 /* Drift moves the TEXTURE inside a repeating layer rather than the layer itself,
    so a river still flows while the camera is parked. Wrapped at the tile width so
    it never runs away over a long scene. */
 const dx=(o,Fw)=>'translateX('+(-(VT*o.drift)%(Fw*2)).toFixed(1)+'px)';
 rig.setF=f=>{rig.f=f;const Fw=Math.round(F.clientWidth);rig.forEach(o=>{
  o.el.style.transform='translateX('+Math.round(-f*rig.span*o.rate)+'px)';
  if(o.drift)o.tex.style.transform=dx(o,Fw);
 })};
 rig.flow=()=>{const Fw=Math.round(F.clientWidth);rig.forEach(o=>{
  if(o.drift)o.tex.style.transform=dx(o,Fw)})};
 rig.layout();
 window.__rig=rig;      /* test hook: step the camera by hand */
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
/* Gentler than easeOut for the entry: cubic braked hard at the end, which read
   as him stopping rather than arriving. This keeps a steady pedalling speed and
   only settles at the last moment. */
const easeRide=p=>1-Math.pow(1-p,1.7);
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
 /* Three layers: the body sprite, the face on it, and a spare face slot the
    outgoing expression dissolves through. */
 const w=el('<div class="cyc"><div class="cycsh"></div><img>'
           +'<img class="face" hidden><img class="face out" hidden></div>');
 STAGE.appendChild(w);
 const im=w.querySelectorAll('img');
 const o={w:w,img:im[0],f1:im[1],f2:im[2],fk:'neutral',x:0,y:0,f:1,
          modes:modes,base:modes[defKey]};
 /* `rider` marks who the wheel loop belongs to */
 o.riding=on=>{w.classList.toggle('riding',!!on);
  if(rider){if(on)play('bike');else stopSnd('bike')}};
 /* Switch sprite set. Box size and anchor come from the mode, so a wider wheelie
    canvas does not move him. */
 /* how far the rear wheel sits from the box centre, in px. The ramp needs this:
    his position along the slope is where the WHEEL is, not where the box is. */
 o.wheelDX=()=>{const b=o.base,bCW=U(b.hu)*b.ar;return (b.ax-0.5)*bCW};
 /* A point on the sprite box, given as fractions of it, expressed as percentages
    of the FRAME -- which is what transform-origin on #stage wants. The handlebar
    grip measured off the sprite is (0.77, 0.56). */
 /* Airborne: `a` is 0 on the ground to 1 at the apex, `tilt` in degrees. The shadow
    shrinking and lifting away is what sells a jump -- a sprite that rises with its
    shadow nailed under it reads as an elevator, not a hop. */
 o.air=(a,tilt)=>{
  const sh=w.querySelector('.cycsh');
  if(sh){sh.style.opacity=String(1-0.7*a);
         sh.style.transform='scale('+(1-0.28*a)+')'}
  o.img.style.transform=a?'rotate('+tilt.toFixed(1)+'deg)':'';
 };
 o.at=(fx,fy)=>{
  const r=w.getBoundingClientRect(),f=F.getBoundingClientRect();
  return [100*(r.x-f.x+fx*r.width)/f.width, 100*(r.y-f.y+fy*r.height)/f.height];
 };
 /* Which expression he wears. Held across mode changes, so a stop sets it once and
    the cycling and wheelie sprites -- which carry their own heads -- ignore it until
    he stops again.

    The dissolve is 260ms and it moves ONLY the head: the body underneath is the same
    file throughout, so nothing about the bicycle can shift mid-fade. Runs on VT, so
    it pauses with the game. */
 o.face=k=>{
  if(!k||!FACES[k]||k===o.fk)return;
  const was=o.f1.getAttribute('src'),m=o.m||o.base;
  o.fk=k;
  if(!m.face||!was||o.f1.hidden){o.dress();return}
  o.f2.src=was;o.f2.hidden=false;o.f2.style.opacity='1';
  o.f1.src=FACES[k];
  tween(260,p=>{o.f2.style.opacity=String(1-easeOut(p))},
        ()=>{o.f2.hidden=true;o.f2.removeAttribute('src')});
 };
 /* The stopped body is headless; it is never drawn without a face. */
 o.dress=()=>{const m=o.m||o.base;
  o.f2.hidden=true;
  if(m.face&&FACES[o.fk]){o.f1.src=FACES[o.fk];o.f1.hidden=false}
  else o.f1.hidden=true};
 o.show=k=>{const m=o.modes[k];if(!m||m===o.m)return;
  o.m=m;o.img.src=m.url;w.classList.toggle('wheelie',!!m.wheelie);o.dress();o.layout()};
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
 /* ---- his own speech bubble ----
    Geometry measured off bubble.webp (572x235): the tail tip is at (0.985, 0.923)
    of the canvas, so the bubble hangs up and to the LEFT of whatever the tail points
    at. TAIL_DX/DY back the tip off his mouth so it aims at him rather than covering
    his face. All four numbers are in design units and the editor reports the same
    units, so a nudge there pastes straight back in here. */
 const BUB_W=520, BUB_AR=572/235, TAIL_X=0.985, TAIL_Y=0.923;
 const TAIL_DX=18, TAIL_DY=30;
 const bub=el('<div class="bub" hidden><div class="bubtxt"></div></div>');
 F.appendChild(bub);                     /* OUTSIDE #stage, so a push cannot scale it */
 const btx=bub.firstElementChild;
 let bubOn=0;
 /* 32 design units is the specified size and every line in the script fits in the
    three lines the box holds -- measured, all thirteen of them. But this is a WORD
    game: the content is meant to change, and a line one word longer would be
    silently clipped. So the size steps down only if it has to, which keeps 32 the
    normal case and makes a clipped line impossible rather than unlikely. */
 const BUB_SIZES=[32,29,26,23];
 o.bubble=t=>{
  btx.textContent=t;bub.hidden=false;
  for(const px of BUB_SIZES){
   btx.style.fontSize='calc('+px+' * var(--u))';
   if(btx.scrollHeight<=btx.clientHeight+1)break;
  }
  if(bubOn)return;
  /* Follows him every frame while it is up. It has to be every frame and not just on
     place(): a camera push moves him on screen without place() ever being called, and
     at() reads getBoundingClientRect, so it already accounts for the stage scale.
     Idle while the game is paused, which is how the dev layout editor can hold the
     frame and drag the bubble to read numbers off it. */
  bubOn=1;const g=GEN;
  (function fr(){
   if(!bubOn||g!==GEN)return;
   if(!PAUSED)o.bubAt();
   requestAnimationFrame(fr);
  })();
 };
 o.hush=()=>{bubOn=0;bub.hidden=true};
 o.bubAt=()=>{
  const m=o.m||o.base;
  const [mx,my]=o.at(m.mx===undefined?0.36:m.mx,m.my===undefined?0.25:m.my);
  const w=100*BUB_W/1920, h=100*(BUB_W/BUB_AR)/1080;
  bub.style.left=(mx-100*TAIL_DX/1920-TAIL_X*w).toFixed(2)+'%';
  bub.style.top =(my-100*TAIL_DY/1080-TAIL_Y*h).toFixed(2)+'%';
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
 clean();window.__scene='title';
 const rig=pxBuild(0);
 RELAY=()=>rig.layout();
 F.appendChild(el('<div class="over card"><h3>Word Tree</h3>'
  +'<p>Jhumru is riding out to the Word Tree.<br>Somebody always needs another word.</p>'
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
/* PACE is the one knob for how fast the opening runs. Everything below is a base
   figure multiplied by it, so raising PACE slows the bicycle, the camera, how long
   each line stays and how long the map holds, all together and in proportion. */
const PACE=1.45;
/* LINE is gone. It was "how long a line of dialogue takes", and every dialogue bug
   in this game traced back to it: a guessed per-line duration cannot be right for a
   4-word line and a 24-word line at once, so short lines left dead air and long ones
   were cut off by the next ask() calling speechSynthesis.cancel(). Every line now
   ends when its own speech ends. Nothing reads a line duration any more. */
const RIDE_IN=2700*PACE, LEG=4200*PACE, SETTLE=800*PACE;
/* how long the trail map stays up, and the fade off it */
const MAP_LIFE=2600*PACE,MAP_FADE=420;
const HOLD_X=42;
/* The three walkable surfaces, measured off the art. GROUND1 is the top of the
   ochre PATH in act_bank -- measuring topmost-opaque instead finds the bushes
   standing BEHIND the path and leaves him floating ~32px above it. */
/* DECK is the plank surface of act_bridge, measured at 65.28% -- not eyeballed. */
const GROUND1=77.5,DECK=65.3,GROUND3=86;
/* Both legs carry a ramp and a wheelie.

   Leg A is the climb ONTO the bridge: the ramp rises the full bank-to-deck
   distance, so the height change is explained rather than just happening.
   Leg B is the ride off it: a shorter take-off ramp on the deck itself.

   RAMP_*_RISE is the single source of truth for each -- it sets both the crest in
   the rider's height and the ramp's drawn height, so the two cannot drift apart
   and leave him floating over the lip. */
/* RAMP_A_TIP is set so the ramp's crest runs UNDER the deck rather than stopping
   short of it. act_bridge's deck starts ~16% into its segment; at 0.70 the ramp
   ended 2.4% of frame width before that, leaving its cut right face showing
   against the background, which is what read as pasted on. 0.755 tucks it ~3%
   under, and the segment paints over the overlap. */
/* Crest and rise come from the layout editor: the climb ramp was nudged DOWN so
   it beds into the bank and the deck instead of sitting flush on both. Its crest
   is therefore 0.53% below the plank surface and its base 0.56% below the path --
   both under 6px, which the u<=0 / u>=1 clamps absorb without a visible step. */
const RAMP_A_CREST=65.83, RAMP_A_RISE=12.22, RAMP_A_TIP=0.687;
const RAMP_B_RISE=10.5,          RAMP_B_TIP=0.30;   /* fraction along leg B */
/* The plate is 5:2, which is a 21.8-degree slope -- steep for something a small
   character cycles up. Stretched horizontally it reads as a gentler built ramp,
   and 1.6 lands the real slope at 14 degrees, matching the tilt used on the
   rider. Stretching is safe for the physics: the surface profile is a fraction of
   the ramp's own box, so a wider box still puts the wheels on the planks. */
const RAMP_AR=2.5, RAMP_STRETCH=1.6;

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
function putRamp(rig,tipCam,crestY,rise,behind){
 const Fw=F.clientWidth,Fh=F.clientHeight;
 const rh=rise/100*Fh,rw=Math.round(rh*RAMP_AR*RAMP_STRETCH);
 const rp=el('<img class="ramp" src="'+A.ramp+'">');
 rp.style.cssText='position:absolute;width:'+rw+'px;height:'+Math.round(rh)+'px;'
  +'left:'+(tipCam*rig.span+HOLD_X/100*Fw-rw*0.94)+'px;'
  +'top:'+(crestY/100*Fh)+'px;z-index:2';
 /* `behind` slots the ramp before a segment so that segment paints OVER its
    cut right edge -- otherwise the flat end of the plate sits on top of the
    deck as a hard vertical line, which reads as pasted on. */
 rp.dataset.name=behind?'ramp-climb':'ramp-kick';   /* so exports can tell them apart */
 if(behind)rig.act.insertBefore(rp,behind);else rig.act.appendChild(rp);
 const left=tipCam*rig.span+HOLD_X/100*Fw-rw*0.94;
 const sh=el('<div class="rampsh"></div>');
 sh.dataset.name=(behind?'ramp-climb':'ramp-kick')+'-shadow';
 sh.style.cssText='position:absolute;z-index:1;left:'+(left+rw*0.03)+'px;'
  +'top:'+((crestY+rise)/100*Fh-rh*0.10)+'px;'
  +'width:'+Math.round(rw*0.96)+'px;height:'+Math.round(rh*0.20)+'px';
 if(behind)rig.act.insertBefore(sh,rp);else rig.act.appendChild(sh);
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

/* ---------- dialogue, one line at a time ----------
   Plays a list of scripted lines, each one WAITING for its own speech to finish
   before the next begins. `done` runs when the list is exhausted.

   It lives at module scope because the hook is not the only scene with a script:
   the gorge was still firing its lines on a precomputed `700 + LINE * n` timeline,
   and since ask() -> speak() calls speechSynthesis.cancel() before it starts, a
   line arriving on a guessed schedule cuts off the one before it. That is what was
   left of "dialogue doesn't complete" after the hook was chained.

   `fx` is the scene's own cue table, so the gorge can ring a bell without knowing
   anything about the hook's trail map. A cue may declare:
     .hold   -- it owns what happens next (the Yes button: nothing advances until
                the player answers), so the chain stops and the cue takes over
     .after  -- run once the line has actually FINISHED. The bell's camera release
                uses this: it used to be scheduled at LINE-800 off the pacing table,
                which released mid-line the moment a bell line ran long.
   GAP is the breath between lines. */
const GAP=520;
function sayWith(actor,lines,fx,done){
 let i=0;
 (function step(){
  /* The bubble is a SPEECH ACT: it goes when he stops speaking. Leaving it up cost
     nothing when his words were in the narrator's box, but a bubble pinned to him for
     the fifteen seconds of a ride covers the scene he is riding through. A HOLDING
     cue never reaches here -- the Yes button keeps his question on screen, which it
     must, since the child is being asked to answer it. */
  if(i>=lines.length){
   if(actor&&actor.hush)actor.hush();
   if(done)done();return}
  const l=lines[i++];
  if(actor&&l.face)actor.face(l.face);
  const cue=(l.fx&&fx)?fx[l.fx]:null;
  /* His words go in HIS bubble; the narrator keeps the box at the top. ask() hushes
     the box for a 'jhu' line, so the two are never both up. */
  if(actor&&actor.bubble){
   if(l.who==='jhu'){actor.bubble(l.line);actor.bubAt()}else actor.hush();
  }
  ask(l.line,l.who,(cue&&cue.hold)?cue:()=>{
   if(cue&&cue.after)cue.after();
   later(step,GAP);
  });
  if(cue&&!cue.hold)cue();
 })();
}

/* "Tring! Tring!" -- the one place the camera goes in close on a detail rather than
   on him. He is stopped, the line is about the bicycle, and the bell is a 14px
   object on a 1476px frame: without the push there is nothing to look at, and the
   SFX has to carry the whole beat on its own.

   1.22 is a shade past the 1.15 used at the bridge, which is affordable here
   because it is brief and the plate behind him is 1920 native. Origin is the
   handlebar itself, so the grip stays put and the world grows around it.

   Used by both the hook and the bridge, so it takes its actor rather than closing
   over one, and it releases on `.after` -- when the line ends -- rather than on a
   guessed duration. */
function bellCue(get){
 const run=()=>{
  play('bell');
  const actor=get&&get();
  if(!actor)return;
  const [ox,oy]=actor.at(0.77,0.56);
  camTo(1.22,600,ox,oy);
  const b=svg(bellSVG());actor.w.appendChild(b);
  later(()=>{if(b.parentNode)b.remove()},1050);      /* 2 x 430ms, plus a tail */
 };
 run.after=()=>camTo(1,650);
 return run;
}

function hook(){
 clean();window.__scene='hook';
 const g=GEN;

 function skip(){gorge()}                 /* clean() drops the listener for us */
 fon('pointerdown',skip);

 /* The faces preload with the plates: one arriving late would show a headless body
    for a frame, since the stopped sprite is a body plus a face layer. */
 Promise.all(['far_sky','mid_canopy','act_bank','act_bridge','act_clearing','cyc','cycs']
  .map(k=>A[k]).concat(Object.values(FACES))
  .map(u=>new Promise(r=>{const i=new Image();i.onload=i.onerror=r;i.src=u})))
  .then(()=>{if(g===GEN)roll()});

 let J=null;                    /* built by roll() once the plates are in */
 /* The hook's cue table. Each line names its own cue in levels.js, so the script can
    grow or shrink there without touching any timing here. `ask` HOLDS the chain: the Yes button only appears once
    the question has actually been spoken, because offered alongside the line a
    child can answer before hearing what was asked -- it was measured on screen for
    450ms before this was fixed. */
 const HFX={bell:bellCue(()=>J),map:()=>trailMap(),ask:askToCome};
 askToCome.hold=1;
 const say=(lines,done)=>sayWith(J,lines,HFX,done);
 /* the jungle trail map, popped up in front of him */
 function trailMap(){
  const m=el('<img class="trailmap" src="'+A.map+'">');
  F.appendChild(m);
  later(()=>{m.classList.add('away');later(()=>m.remove(),MAP_FADE)},MAP_LIFE);
 }
 /* He turns to the player. Nothing advances until they answer, so the skip
    listener comes off -- the choice IS the interaction at this point. */
 function askToCome(){
  foff();
  const c=el('<div class="over card ask"><h3>Will you come?</h3>'
   +'<button class="btn">Yes!</button></div>');
  F.appendChild(c);
  c.querySelector('.btn').onclick=e=>{
   e.stopPropagation();c.remove();
   /* "Wonderful! Let's go!" and then the script's Game section, which ends on
      "[Child will tap Play button]" -- so the hurdle waits for a tap, it does not
      arrive on a timer. */
   say(HOOK.go,()=>later(()=>say(HOOK.game,playGate),GAP));
  };
 }
 /* The script's second Play button: the line between the story and the game. */
 function playGate(){
  foff();
  const c=el('<div class="over card"><h3>Ready?</h3>'
   +'<p>Help Jhumru find the word friends<br>and clear the jungle path.</p>'
   +'<button class="btn">Play</button></div>');
  F.appendChild(c);
  c.querySelector('.btn').onclick=e=>{e.stopPropagation();c.remove();gorge()};
 }

 function roll(){
  const rig=pxBuild(0);
  /* Both ramps are built up front. They are part of the world, so they must not
     pop into existence when their leg starts. The climb ramp goes BEHIND the
     bridge segment so the deck covers where it meets it; the take-off ramp on the
     deck stays in front. */
  const rA=putRamp(rig,RAMP_A_TIP*.5,RAMP_A_CREST,RAMP_A_RISE,rig.segs[1]);
  /* Only the ENTRY ramp now. The take-off plank that used to sit on the deck is
     gone, so leg B is a plain roll off the far end of the bridge and down to the
     clearing -- no lip to launch from means no wheelie there either. */
  /* his box fits his widest sprite -- the wheelie canvas */
  /* 322 = 215 * 1.5. Monty stays 185, so the elephant now reads 1.74x the monkey.
     For 1.5x the MONKEY instead, this is 278. Feet are unaffected either way --
     place() anchors on the ground line, not the top of the sprite. */
  J=mkActor(RIDER,'cyc',1);J.w.dataset.name='jhumru';
  J.place(-14,GROUND1);
  RELAY=()=>{rig.layout();J.layout()};

  /* A CHAIN, not a timeline. Every stop hands on when its dialogue has actually
     finished, so no line is ever cut off and no leg starts over the top of one.
     The old version added up LINE * (number of lines) in advance, which only
     worked while every line was assumed to take the same time to say. */
  J.riding(1);
  tween(RIDE_IN,p=>J.place(-14+(HOLD_X+14)*easeRide(p),GROUND1),()=>{
   J.show('still');J.riding(0);tone(430,.12);
   later(()=>say(HOOK.bank,legA),400);
  });

  /* ---- leg A: up the ramp to the middle of the bridge ---- */
  function legA(){
   say(HOOK.legA);                                  /* spoken as he pedals off */
   J.show('cyc');J.riding(1);
   const runA=wheelieRun(J,rA,c=>c/.5);
   /* The ramp is bedded, so its base sits 2px below the bank and its crest 6px
      below the deck. Blending across those instead of clamping means there is no
      hitch stepping on or off it -- his path follows the ramp as placed. */
   const BLEND=0.25;
   const yA=(u)=>{
    if(u>=1)return rA.crestY+(DECK-rA.crestY)*Math.min(1,(u-1)/BLEND);
    if(u>0)return rA.y(u);
    return rA.y(0)+(GROUND1-rA.y(0))*Math.min(1,-u/BLEND);
   };
   tween(LEG,p=>{
    rig.setF(p*.5);
    J.place(HOLD_X,yA(rA.u(p*.5,J.wheelDX())));
    runA(p);
   },()=>{
    J.img.style.transform='';J.show('still');J.riding(0);tone(430,.12);
    later(()=>say(HOOK.bridge,()=>later(legB,MAP_LIFE*0.55)),400);
   });
  }

  /* ---- leg B: on to the clearing. Waits for the map to clear. ---- */
  function legB(){
   J.show('cyc');J.riding(1);
   /* Deck height until the bridge ends, then a smooth ease down to the clearing.
      DECK_OFF is where his wheel leaves the deck, measured as a fraction of leg B. */
   const DECK_OFF=0.52, LAND=0.86;
   tween(LEG,p=>{
    rig.setF(.5+p*.5);
    const y=p<=DECK_OFF ? DECK
          : DECK+(GROUND3-DECK)*easeOut(Math.min(1,(p-DECK_OFF)/(LAND-DECK_OFF)));
    J.place(HOLD_X,y);
   },()=>{
    J.img.style.transform='';J.show('still');J.riding(0);tone(430,.12);
    later(()=>say(HOOK.clearing),SETTLE);   /* ends on 'Will you come?' */
   });
  }
 }
}


/* ---------- the broken bridge ----------
   The first hurdle. He rides out of the clearing, up the approach, onto the span,
   and stops short of the gap. A game screen takes over from there.

   The world is three NEW act plates, but the sky, canopy and both fringe strips are
   the same files as the opening -- so this reads as the same jungle further along
   rather than as a new place, and it costs nothing. The one addition is mid_gorge
   between the canopy and the action plane: the ravine interior, seen through the
   hole in the deck and under the whole span.

   His height comes from GORGE.prof, measured off the plates, so he follows the
   drawn path over its dip and up to the rim instead of a straight line between
   guessed waypoints. Same approach as the ramp. */
function gorge(){
 clean();window.__scene='gorge';
 const rig=pxBuild(0,{segs:GORGE.seg,laps:GORGE.laps,
  mids:[{key:'mid_gorge',rate:GORGE.midRate,dim:1,wide:GORGE.seg.length}]});
 const J=mkActor(RIDER,'cyc',1);J.w.dataset.name='jhumru';
 RELAY=()=>{rig.layout();J.layout()};

 const n=GORGE.seg.length,laps=GORGE.laps;
 /* Everything below is in DESIGN units, so it is resolution-independent and the
    overlaps only have to be reasoned about once.

    The plates overlap, so a plate's world position is not i*1920 -- and the later
    plate is drawn on top, so where two profiles cover the same world x the later
    one is the surface he actually rides. Hence the track is built in order and
    later points overwrite earlier ones. */
 const lapTo=i=>laps.slice(0,i).reduce((a,b)=>a+b,0);
 const worldW=1920*n-lapTo(n);
 const track=[];
 GORGE.prof.forEach((pr,i)=>{
  const left=i*1920-lapTo(i);
  pr.forEach((y,j)=>{
   const f=(left+j*1920/(pr.length-1))/worldW;
   while(track.length&&track[track.length-1][0]>=f-1e-9)track.pop();
   track.push([f,y]);
  });
 });
 const travel=1920*(n-1)-lapTo(n);
 const worldAt=f=>(f*travel+HOLD_X/100*1920)/worldW;
 /* GORGE.drop is a percentage of his height; the track is percentages of frame
    height, so convert once through hu/1080 rather than at every lookup. */
 const drop=(GORGE.drop||0)*RIDER.still.hu/1080;
 const yOf=f=>yAt(track,worldAt(f))+drop;
 /* The gap's near edge in world units, then backed off so it sits AHEAD of him
    rather than under him. Both come off the measured alpha, not the delivered spec. */
 const gapW=(1920-laps[0]+GORGE.gapPx[0])/worldW;
 const stopF=Math.min(1,(gapW*worldW-HOLD_X/100*1920-250)/travel);

 J.place(-12,yOf(0));
 let armed=1;
 const RIDE=RIDE_IN*1.1,RUN=LEG*1.9;

 /* ride on from the left */
 tween(RIDE,p=>{
  const x=-12+(HOLD_X+12)*easeRide(p);
  J.place(x,yOf(0));
 },()=>{
  J.riding(1);J.show('cyc');
  /* the long haul: camera and rider off one fraction, so they cannot disagree */
  tween(RUN,p=>{
   const f=stopF*easeOut(p);
   rig.setF(f);J.place(HOLD_X,yOf(f));
  },()=>{
   J.show('still');J.riding(0);tone(430,.12);
   /* The one push in the game so far, and it earns it: this is the first obstacle,
      and the gap has to become the SUBJECT before any words arrive. Wide, it is one
      thing among a ravine, two rims and a tree.

      It starts after a beat of stillness -- a dead stop following sustained parallax
      is itself a strong attention cue, and the zoom lands on top of it rather than
      competing. The origin sits between him and the gap, and slightly above the
      deck, so the drop opens up as it closes in.

      Then it releases before the game screen, so the handover starts from a neutral
      frame rather than mid-move. */
   /* A CHAIN, as the hook has been since e28b492. Each beat hands on when its own
      speech has finished, so nothing is cut off and the camera never moves over the
      top of a line. The old version fired these on 700 + LINE * n and truncated
      both of them.

      Order follows the script: he arrives and rings the bell, THEN the camera goes
      in on the gap and he sees it, then the narrator's transition line. The bell
      releases its own push when its line ends, so the two camera moves cannot
      overlap however long the lines run. Written as named beats rather than nested
      callbacks, because the nesting was four deep and unreadable. */
   const GFX={bell:bellCue(()=>J)};
   const beat=(lines,next,wait)=>later(()=>sayWith(J,lines,GFX,next),wait||0);

   const seeIt =()=>{camTo(1.15,900,50,62);beat(BRIDGE.see,turn,500)};
   const turn  =()=>beat(BRIDGE.turn,handOn);
   const handOn=()=>{
    camTo(1,700);
    /* Hurdle one hands on to hurdle two. Until this the river was only reachable
       by pressing R, so playing the game normally you never saw it. */
    later(()=>{
     if(!armed)return;armed=0;
     F.appendChild(el('<div class="over card"><h3>The Broken Bridge</h3>'
      +'<p>The word game goes here.<br>Two planks to mend, two words to find.</p>'
      +'<button class="btn">On to the river</button></div>'));
     F.querySelector('.btn').onclick=()=>river();
    },700);
   };
   beat(BRIDGE.in,seeIt,400);
  });
 });
 fon('pointerdown',()=>{});
}
/* ---------- the river ----------
   Hurdle two. He rides down to the shore, three logs are waiting, and a raft carries
   him across.

   The crossing is where the layer stack earns itself. Seven layers at 0.20 / 0.50 /
   0.62 / 1.00 / 1.22 / 1.40 / 1.62, and the two that matter are water_near at 1.22 --
   faster than the raft, so it cuts across the hull and he floats IN the water -- and
   near_reeds at 1.62, because on a crossing he is barely moving against the far bank
   and the foreground has to carry the sense of travel.

   The water also drifts on its own clock, so the river is alive while he is parked
   at the shore reading the logs. Without that a wide flat plane just looks dead.

   The mechanic is not here yet: the three logs are placed and the raft assembles on
   a timer, which is enough to see whether the location reads. */
function river(){
 clean();window.__scene='river';
 const rig=pxBuild(0,{segs:RAFT.seg,mids:RAFT.mids,back:RAFT.back,front:RAFT.front,nojoin:1});
 const J=mkActor(RIDER,'cyc',1);J.w.dataset.name='jhumru';
 RELAY=()=>{rig.layout();J.layout()};

 fade('river',0.055,1400);          /* the place arrives before he does */
 /* the river keeps moving between beats, not only while the camera does */
 (function flow(){if(window.__scene!=='river')return;rig.flow();requestAnimationFrame(flow)})();

 /* No log props: the plate already carries three, and adding more made six. When
    the word game needs individually choosable logs they can be overlaid then. */


 J.place(-12,yAt(RAFT.shore,0));
 /* Long enough that three hops are all readable. At 1.45 the whole approach was
    over in a bit more than a second and the jumps flicked past. */
 const RIDE=RIDE_IN*2.1;

 /* A hop over each painted log. Height comes off a cosine so take-off and landing
    are smooth, and the tilt follows the direction of travel -- nose up on the way
    up, nose down coming in -- which is what a bike actually does. */
 const hop=(x)=>{
  for(let i=0;i<RAFT.logs.length;i++){
   const d=(x-RAFT.logs[i])/RAFT.hopW;
   if(d>-1&&d<1) return [RAFT.hopH*Math.cos(d*Math.PI/2), 15*Math.sin(d*Math.PI/2), i];
  }
  return [0,0,-1];
 };

 /* The scene ENDS at the shore. Crossing on the raft is cut until the word game
    exists -- floating away before there is anything to solve made the puzzle look
    like it had already been solved. The raft, the splash and the far bank are all
    built and measured; they come back when the mechanic does. */
 let landed=-1;
 tween(RIDE,p=>{
  const x=-12+(RAFT.stop+12)*easeRide(p);
  const [lift,tilt,i]=hop(x);
  J.place(x,yAt(RAFT.shore,Math.max(0,x/100))-lift);
  J.air(lift/RAFT.hopH,tilt);
  if(i>=0&&lift<RAFT.hopH*0.25&&tilt>0&&landed!==i){landed=i;tone(210,.09)}
 },()=>{
  J.air(0,0);
  J.show('still');J.riding(0);tone(430,.12);
  /* Chained, like the hook and the bridge. These three were the last lines in the
     game still on a precomputed schedule, so they talked over each other. */
  /* Look downstream. He holds his WORLD position while the camera drifts on, so he
     slides left across the frame and open water comes in from the right.

     This only works because taper_shore() gives the bank a real ending. Panning used
     to bring the plate's straight right edge into shot -- a cut through a plant
     cluster that read as a sliced cutout, and neither feathering it nor capping it
     with mirrored foliage helped, because both just moved the cut somewhere else.
     mid_canopy is dropped for this scene too, so there is no treeline on the horizon
     to contradict "no land". */
  const pan=()=>tween(LEG*0.9,q=>{
   const f=RAFT.look*easeOut(q);
   rig.setF(f);
   J.place(RAFT.stop-f*200,yAt(RAFT.shore,RAFT.stop/100));
  });
  const card=()=>later(()=>{
   F.appendChild(el('<div class="over card ask"><h3>The River</h3>'
    +'<p>The word game goes here.<br>Two logs that mean the same make one raft.</p>'
    +'<button class="btn">Back to the start</button></div>'));
   F.querySelector('.btn').onclick=()=>title();
  },600);
  later(()=>sayWith(J,RIVER.see,null,()=>{
   pan();                                    /* the pan runs UNDER the next line */
   sayWith(J,RIVER.look,null,()=>sayWith(J,RIVER.logs,null,card));
  }),300);
 });
}
/* Jump keys, DEV ONLY -- R for the river, B for the hurdle, while they are being
   built. Ungated these shipped, so a child leaning on the keyboard mid-story was
   teleported into another scene. */
if(IS_DEV){
 addEventListener('keydown',e=>{if(e.key==='r'||e.key==='R')river()});
 addEventListener('keydown',e=>{if(e.key==='b'||e.key==='B')gorge()});
}

