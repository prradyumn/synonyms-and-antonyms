/* DOM references, timers, audio, and small helpers. */


const $=s=>document.querySelector(s),F=$('#frame'),BG=$('#bg'),BG2=$('#bg2'),FX=$('#fx'),AIR=$('#air');

[...Object.values(A),...Object.values(IDLE),...Object.values(WALK)].forEach(u=>{const i=new Image();i.src=u});

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
 for(let i=T.length-1;i>=0;i--){
  const q=T[i];
  if(q.g!==GEN){T.splice(i,1);continue}
  if(VT>=q.t){if(q.every)q.t=VT+q.every;else T.splice(i,1);q.f()}
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
[['bgm','jungle_loop.mp3',.065,1],['bike','bike_loop.ogg',.17,1],['step','step.ogg',.26,0],
 ['bell','bell.ogg',.34,0]]
 .forEach(([k,f,v,loop])=>{const a=new Audio('assets/audio/'+f);
  a.volume=v;a.loop=!!loop;a.preload='auto';SND[k]=a});
function audioLive(on){const m=$('#mute');if(m)m.classList.toggle('q',!on)}
function play(k){if(muted||!audioOn)return;const a=SND[k];if(!a)return;
 const ok=()=>{if(k==='bgm')audioLive(true)},no=()=>{if(k==='bgm')audioLive(false)};
 try{
  if(a.loop){if(a.paused){const pr=a.play();if(pr&&pr.then)pr.then(ok).catch(no);else ok()}else ok()}
  else{a.currentTime=0;const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{})}
 }catch(e){no()}}
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
function speak(t,who){said=t;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);
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
function ask(t,who){$('#asktxt').textContent=t;speak(t,who)}
function el(h){const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild}
function svg(h){const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild}
function clean(){GEN++;kill();RELAY=null;foff();stopSnd('bike');FX.innerHTML='';AIR.innerHTML='';[...F.querySelectorAll('.pxb,.pxf,.ch,.cyc,.stone,.sign,.vine,.tag,.node,.over,.verd,.ring')].forEach(n=>n.remove());BG2.style.opacity='0';BG2.style.backgroundImage='';F.classList.remove('shake');try{speechSynthesis.cancel()}catch(e){}}
function setbg(k){BG.style.backgroundImage='url('+A[k]+')'}
/* parent lets a character be mounted inside a scrolling parallax layer, so it
   travels with the world instead of being pinned to the frame */
function chip(kind,side,parent){const c=el('<img class="ch '+kind+'" src="'+(IDLE[kind]||A[kind])+'" style="'+side+'">');(parent||F).appendChild(c);return c}
