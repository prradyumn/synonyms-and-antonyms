/* Runtime SVG: signpost, vine, hanging word tags, ring and sparkle bursts. */

/* ---------- animated SVG pieces ---------- */
function signSVG(word){
 return `<svg class="sign" viewBox="0 0 200 118">
  <path d="M100 96V118" stroke="#7A5A2E" stroke-width="7" stroke-linecap="round"/>
  <rect x="6" y="8" width="188" height="84" rx="14" fill="#C89A5E" stroke="#8A6231" stroke-width="5"/>
  <rect x="16" y="18" width="168" height="64" rx="9" fill="#DBB27B"/>
  <circle cx="24" cy="26" r="4" fill="#8A6231"/><circle cx="176" cy="26" r="4" fill="#8A6231"/>
  <circle cx="24" cy="74" r="4" fill="#8A6231"/><circle cx="176" cy="74" r="4" fill="#8A6231"/>
  <text x="100" y="50" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI,sans-serif" font-size="34" font-weight="700" fill="#4A3316">${word}</text>
 </svg>`;
}
function vineSVG(){
 return `<svg class="vine" viewBox="0 0 880 22" preserveAspectRatio="none">
  <path d="M0 12 Q110 2 220 12 T440 12 T660 12 T880 12" stroke="#3F7F3A" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M120 10q16-12 30-2-16 10-30 2z" fill="#4F9E45"/><path d="M420 12q16-12 30-2-16 10-30 2z" fill="#4F9E45"/>
  <path d="M700 10q-16-12-30-2 16 10 30 2z" fill="#4F9E45"/>
 </svg>`;
}
function tagSVG(word,i){
 const tint=['#D9A45F','#CFA86A','#D3A05A'][i%3];
 return `<svg class="tag sway" viewBox="0 0 150 116" style="animation-delay:${i*0.42}s">
  <path d="M75 2 C68 16 82 26 75 40" stroke="#8A7A4E" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g class="body">
   <path d="M14 40h122a10 10 0 0 1 10 10v46a10 10 0 0 1-10 10H14a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10z" fill="${tint}" stroke="#8A6231" stroke-width="5"/>
   <path d="M18 48h114a5 5 0 0 1 5 5v40a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5V53a5 5 0 0 1 5-5z" fill="#E8C692"/>
   <circle cx="75" cy="40" r="6" fill="#8A6231"/>
   <text x="75" y="74" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI,sans-serif" font-size="26" font-weight="700" fill="#4A3316">${word}</text>
  </g>
 </svg>`;
}
/* The drop target for a want:'ant' round. Its presence where a friend would
   otherwise stand IS the cue that this round wants the opposite. Runtime SVG,
   standing in for the word-stone prop specced in docs/03 Block C. */
/* A short wooden take-off ramp laid on the bridge deck. Runtime SVG in the same
   idiom as the signpost and the word-stone, matched to the deck's plank colours,
   so it needs no new art and its angle stays tunable. */
function rampSVG(){
 return `<svg class="ramp" viewBox="0 0 300 120" preserveAspectRatio="none">
  <path d="M0 120 C140 118 236 92 300 0 L300 120 Z" fill="#B07C3E"/>
  <path d="M0 112 C140 110 234 84 298 -4 L300 6 C236 92 140 118 0 120 Z" fill="#D8A45E"/>
  <g stroke="#A2702F" stroke-width="2.5" fill="none" opacity=".7">
   <path d="M52 118 L54 108"/><path d="M104 115 L107 104"/><path d="M154 108 L158 96"/>
   <path d="M202 94 L208 81"/><path d="M244 72 L252 58"/><path d="M280 40 L290 26"/>
  </g>
 </svg>`;
}
function stoneSVG(){
 return `<svg class="stone" viewBox="0 0 150 176">
  <ellipse cx="75" cy="166" rx="54" ry="9" fill="rgba(28,38,22,.3)"/>
  <path d="M22 142C7 116 10 62 34 38 58 14 104 12 126 40c22 28 19 80 5 102-14 22-95 21-109-0z" fill="#8E9A86" stroke="#5A6553" stroke-width="5"/>
  <path d="M33 131C21 108 23 66 43 46c20-20 57-22 75 2 18 24 15 70 3 88-12 18-76 17-88-5z" fill="#A9B49E"/>
  <rect x="38" y="56" width="74" height="56" rx="10" fill="#6B7663" stroke="#5A6553" stroke-width="4"/>
  <rect x="45" y="63" width="60" height="42" rx="6" fill="#57624F"/>
  <circle cx="47" cy="65" r="3" fill="#48523F"/><circle cx="103" cy="65" r="3" fill="#48523F"/>
  <circle cx="47" cy="103" r="3" fill="#48523F"/><circle cx="103" cy="103" r="3" fill="#48523F"/>
 </svg>`;
}
function ringAt(x,y){
 const r=svg(`<svg class="ring" viewBox="0 0 100 100" style="left:${x-U(131)}px;top:${y-U(131)}px;width:${U(262)}px;height:${U(262)}px">
  <circle cx="50" cy="50" r="26" fill="none" stroke="#F2E06A" stroke-width="7"/></svg>`);
 F.appendChild(r);
 r.animate([{transform:'scale(.35)',opacity:.95},{transform:'scale(1.7)',opacity:0}],{duration:750,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>r.remove();
}
function sparkle(x,y){
 for(let i=0;i<12;i++){
  const s=svg(`<svg viewBox="0 0 20 20" style="position:absolute;left:${x}px;top:${y}px;width:${U(39)}px;height:${U(39)}px;z-index:9;pointer-events:none">
   <path d="M10 1l2.4 5.6L18 9l-5.6 2.4L10 17l-2.4-5.6L2 9l5.6-2.4z" fill="#F7D14C"/></svg>`);
  AIR.appendChild(s);
  const a=Math.random()*6.28,d=U(65)+Math.random()*U(118);
  s.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(0) rotate(180deg)`,opacity:0}],{duration:620,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>s.remove();
 }
}

function debris(x,y){
 const tint=['#A9793F','#8A6231','#C08B4B','#94683A'];
 for(let i=0;i<11;i++){
  const w=U(20)+Math.random()*U(37),h=U(9)+Math.random()*U(13);
  const d=el(`<div class="dust" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${tint[i%4]}"></div>`);
  AIR.appendChild(d);
  const dx=(Math.random()-.5)*U(371),dy=U(109)+Math.random()*U(284),rt=(Math.random()-.5)*680;
  d.animate([{transform:'translate(0,0) rotate(0)',opacity:1},
    {transform:`translate(${dx}px,${dy}px) rotate(${rt}deg)`,opacity:0}],
    {duration:720+Math.random()*520,easing:'cubic-bezier(.3,.1,.7,1)'}).onfinish=()=>d.remove();
 }
}
