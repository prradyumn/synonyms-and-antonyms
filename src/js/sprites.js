/* Runtime SVG props. */

/* ---------- animated SVG pieces ---------- */
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
