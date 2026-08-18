/* After-state effects layered on the background art.
   cave/tree/falls have no second painted plate yet — these stand in. */

/* ---------- after-state effects ---------- */
function fxGlow(){
 FX.appendChild(el('<div class="abs sheet" style="left:50%;top:26%;width:24%;height:40%;border-radius:50% 50% 44% 44%;background:radial-gradient(closest-side,rgba(255,234,158,.95),rgba(255,214,110,.5),rgba(255,200,90,0))"></div>'));
 [[46,42,0],[58,34,.7],[52,56,1.3],[64,50,.4],[42,58,1.9]].forEach(p=>FX.appendChild(svg(
  `<svg class="ff" viewBox="0 0 20 20" style="left:${p[0]}%;top:${p[1]}%;animation-delay:${p[2]}s">
    <circle cx="10" cy="10" r="9" fill="#FFF3A8" opacity=".35"/><circle cx="10" cy="10" r="4" fill="#FFF9CF"/></svg>`)));
}
function fxFruit(){
 const c=['#E8562F','#F2A11E','#E8C41E','#D9452F','#F07A1E'];
 [[41,15],[47,11],[54,14],[36,22],[59,20],[44,25],[52,27],[33,32],[62,30],[48,34],[40,72],[57,74]].forEach((p,i)=>
  FX.appendChild(svg(`<svg class="fruit" viewBox="0 0 22 22" style="left:${p[0]}%;top:${p[1]}%;animation-delay:${i*0.07}s">
   <circle cx="11" cy="13" r="9" fill="${c[i%5]}"/><path d="M11 4v3" stroke="#5E7A28" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M11 5q4-3 6 0-4 2-6 0z" fill="#5E9E38"/><circle cx="8" cy="10" r="2.4" fill="#fff" opacity=".45"/></svg>`)));
}
function fxWater(){
 FX.appendChild(el('<div class="abs sheet" style="left:43.5%;top:27%;width:13%;height:34%;background:linear-gradient(rgba(255,255,255,.92),rgba(158,226,242,.86));border-radius:7px 7px 0 0"></div>'));
 FX.appendChild(el('<div class="abs sheet" style="left:27%;top:56%;width:47%;height:17%;border-radius:50%;background:radial-gradient(closest-side,rgba(120,215,235,.94),rgba(90,190,215,.82));animation-delay:.6s"></div>'));
 FX.appendChild(el('<div class="abs sheet" style="left:41%;top:55%;width:19%;height:8%;border-radius:50%;background:rgba(255,255,255,.88);animation-delay:1.1s"></div>'));
}
function fxCheer(){[0,1,2].forEach(i=>later(()=>sparkle(F.clientWidth*(.3+i*.2),F.clientHeight*.42),i*230))}
const FXMAP={glow:fxGlow,fruit:fxFruit,water:fxWater,cheer:fxCheer};
