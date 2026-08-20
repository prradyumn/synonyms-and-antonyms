/* DOM references, timers, audio, and small helpers. */


const $=s=>document.querySelector(s),F=$('#frame'),BG=$('#bg'),BG2=$('#bg2'),FX=$('#fx'),AIR=$('#air'),STAGE=$('#stage');

Object.values(A).forEach(u=>{const i=new Image();i.src=u});

let GEN=0,T=[];



/* The game is authored in a 1920x1080 design space (see style.css). U() turns a
   1920-space length into real pixels for whatever size the frame is rendering at. */
const U=n=>n*F.clientWidth/1920;

/* Scene-scoped listeners on #frame. clean() drops them, so a stale tap-to-skip
   from a previous scene cannot fire inside the next one. */
let FLIS=[];
function fon(t,fn){F.addEventListener(t,fn);FLIS.push([t,fn])}
function foff(){FLIS.forEach(([t,fn])=>F.removeEventListener(t,fn));FLIS=[]}

/* ---------- one virtual clock ----------
   Every delay in the game runs off VT, which is advanced by rAF rather than by
   setTimeout. That means leaving the tab freezes the whole story instead of
   letting it run on invisibly and reappear several beats later. The per-frame
   delta is clamped so a long stall cannot jump the timeline either.
   `later`, `every` and `tween` all read the same clock, so they cannot drift
   apart from each other or from the camera. */
let VT=0,lastRAF=0,PAUSED=false;
function later(f,ms){const q={t:VT+ms,f:f,g:GEN};T.push(q);return q}
function every(f,ms){const q={t:VT+ms,f:f,g:GEN,every:ms};T.push(q);return q}
function cancel(q){if(q)q.g=-1}
function kill(){T=[]}
(function clock(now){
 requestAnimationFrame(clock);
 if(lastRAF){const dt=now-lastRAF;if(!PAUSED)VT+=dt>120?120:dt}
 lastRAF=now;
 /* Iterate a SNAPSHOT. A callback can change scene, and clean() calls kill() which
    empties T -- indices then shift under a live loop and T[i] comes back undefined.
    That threw "reading 'g'" once the dialogue chain started handing scenes over from
    inside a timer, which it now does at every stop. */
 const due=T.slice();
 for(let i=0;i<due.length;i++){
  const q=due[i];
  if(!q||q.g!==GEN){const j=T.indexOf(q);if(j>=0)T.splice(j,1);continue}
  if(VT>=q.t){
   if(q.every)q.t=VT+q.every;
   else{const j=T.indexOf(q);if(j>=0)T.splice(j,1)}
   q.f();
  }
 }
})(0);

/* Leaving the browser pauses sound and story together. visibilitychange covers
   tab switches and minimising; blur covers alt-tabbing to another app. */
function setPaused(on){
 if(PAUSED===on)return;
 PAUSED=on;
 try{if(on)speechSynthesis.pause();else speechSynthesis.resume()}catch(e){}
 if(on)Object.keys(SND).forEach(k=>{const a=SND[k];if(!a.paused)a.pause()});
 else if(!muted&&audioOn){play('bgm');if(F.querySelector('.cyc.riding'))play('bike')}
}
/* the dev layout editor (src/js/editor.js) freezes the game through this */
window.__gameFreeze=on=>setPaused(!!on);
document.addEventListener('visibilitychange',()=>setPaused(document.hidden));
addEventListener('pagehide',()=>setPaused(true));
addEventListener('blur',()=>setPaused(true));
addEventListener('focus',()=>setPaused(document.hidden));
let ac=null;
function tone(f,d){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.13;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}
/* ---------- audio ----------
   All CC0, see assets/audio/CREDITS.txt. Browsers refuse to start audio before a
   user gesture, so nothing plays until the first pointerdown or keydown. */
const SND={};
let muted=false,audioOn=false;
[['bgm','jungle_loop.mp3',.065,1],['bike','bike_loop.ogg',.17,1],['bell','bell.ogg',.34,0],
 /* River bed for the raft scene. 0.055 sits just under the jungle bed at 0.065:
    audible as a place, never as a sound you notice -- the playbook's rule. It
    fades rather than cuts, because a 24s loop stopping dead reads as a bug. */
 ['river','river_loop.mp3',.055,1]]
 .forEach(([k,f,v,loop])=>{const a=new Audio('assets/audio/'+f);
  a.volume=v;a.loop=!!loop;a.preload='auto';SND[k]=a});
function audioLive(on){const m=$('#mute');if(m)m.classList.toggle('q',!on)}
function play(k){if(muted||!audioOn)return;const a=SND[k];if(!a)return;
 const ok=()=>{if(k==='bgm')audioLive(true)},no=()=>{if(k==='bgm')audioLive(false)};
 try{
  if(a.loop){if(a.paused){const pr=a.play();if(pr&&pr.then)pr.then(ok).catch(no);else ok()}else ok()}
  else{a.currentTime=0;const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{})}
 }catch(e){no()}}
/* Ramp a loop's volume on the virtual clock, so an ambience arrives and leaves with
   the place rather than snapping on. Ramping to 0 stops it. */
const FADE={};
function fade(k,to,ms){
 const a=SND[k];if(!a)return;
 /* One ramp per sound. clean() fades the river OUT and the next scene fades it IN,
    and with no token the two ran together: the fade-out reached zero and paused the
    element while the fade-in was still raising its volume, so the river sat at full
    gain and silent. The token makes the newer ramp win. */
 const tok=(FADE[k]=(FADE[k]||0)+1);
 if(to>0){if(muted||!audioOn)return;if(a.paused){a.volume=0;a.play().catch(()=>{})}}
 const from=a.volume,t0=VT;
 (function fr(){
  if(FADE[k]!==tok)return;
  const p=Math.min(1,(VT-t0)/ms);
  a.volume=Math.max(0,Math.min(1,from+(to-from)*p));
  if(p<1)requestAnimationFrame(fr);else if(to===0)a.pause();
 })();
}

function stopSnd(k){const a=SND[k];if(a&&!a.paused){a.pause();if(!a.loop)a.currentTime=0}}
function hushAll(){Object.keys(SND).forEach(stopSnd)}
function audioStart(){
 if(audioOn)return;audioOn=true;play('bgm');
 /* the opening starts before any gesture, so re-assert whatever is already
    happening rather than waiting for the next state change */
 if(F.querySelector('.cyc.riding'))play('bike');
}
addEventListener('pointerdown',audioStart,{once:true});
addEventListener('keydown',audioStart,{once:true});

let said='';
/* A line has to be allowed to FINISH. Dialogue used to advance on a fixed 2.2s
   interval whatever the line said, so the long ones were cut off mid-word and the
   camera moved on over the top of them. `done` fires when the utterance actually
   ends.

   The length-based fallback is not belt-and-braces, it is the common case:
   speechSynthesis never fires `end` when it is muted, blocked by autoplay policy,
   or has no voice installed, and without it the whole chain would simply stop. A
   token guards against speechSynthesis.cancel() firing `end` on the line we just
   replaced and advancing the chain twice. */
let SPTOK=0;
function speak(t,who,done){
 said=t;
 const tok=++SPTOK;
 const words=(String(t).match(/\S+/g)||[]).length;
 let fired=false;
 const finish=()=>{if(fired||tok!==SPTOK)return;fired=true;if(done)done()};
 const guard=later(finish,Math.max(1500,words*430)+500);
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);
 u.onend=()=>{cancel(guard);finish()};
 /* the narrator sits lower and slower than Jhumru, so a child can tell who is
    talking without being told */
 u.rate=who==='nar'?.66:.72;u.pitch=who==='nar'?.82:1.12;const v=speechSynthesis.getVoices().find(v=>/en-IN|India/i.test(v.lang+v.name))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
$('#spk').onclick=()=>speak(said);
/* First tap TURNS SOUND ON rather than muting -- the button starts in the
   not-live state, so its first job is to start audio, not silence it. */
$('#mute').onclick=()=>{
 if(!audioOn||!SND.bgm||SND.bgm.paused){
  audioOn=true;muted=false;Object.values(SND).forEach(a=>{a.muted=false});play('bgm');return;
 }
 muted=!muted;Object.values(SND).forEach(a=>{a.muted=muted});
 if(muted){hushAll();audioLive(false)}else play('bgm');
};
function ask(t,who,done){$('#asktxt').textContent=t;speak(t,who,done)}
function el(h){const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild}
function svg(h){const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild}
function clean(){GEN++;kill();RELAY=null;foff();camReset();stopSnd('bike');fade('river',0,700);FX.innerHTML='';AIR.innerHTML='';[...F.querySelectorAll('.pxb,.pxf,.ch,.cyc,.stone,.sign,.vine,.tag,.node,.over,.verd,.ring')].forEach(n=>n.remove());BG2.style.opacity='0';BG2.style.backgroundImage='';F.classList.remove('shake');try{speechSynthesis.cancel()}catch(e){}}
function setbg(k){BG.style.backgroundImage='url('+A[k]+')'}

/* ---- camera scale ----
   A push in is a strong signal, so it is used sparingly: it means "this is the
   thing". Everything in #stage scales about `ox,oy`, given in percentages of the
   frame, so the rider can be held still while the world grows around him.

   1.15 is about the ceiling. The plates are 1920 wide and render at 1476 on a
   desktop frame, so scale up to 1.30 is still downsampling and costs nothing -- but
   on a full-width 1920 frame there is no headroom at all, and past ~1.2 the art
   softens visibly. Re-export the plates larger before going beyond that.

   Honours prefers-reduced-motion by simply not moving. */
function camReset(){if(STAGE){STAGE.style.transform='';STAGE.style.transformOrigin='50% 66%'}}
function camTo(z,ms,ox,oy,after){
 if(!STAGE)return;
 if(ox!==undefined)STAGE.style.transformOrigin=ox+'% '+oy+'%';
 const m=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const from=+(STAGE.style.transform.match(/scale\(([\d.]+)\)/)||[0,1])[1];
 if(m||!ms){STAGE.style.transform='scale('+z+')';if(after)after();return}
 tween(ms,p=>{STAGE.style.transform='scale('+(from+(z-from)*easeOut(p))+')'},after);
}

