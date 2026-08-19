/* Runtime SVG props. */


/* The bicycle bell, from the supplied animation. Body on the left of the viewBox
   with the arcs running right, so it reads as sound leaving the bell toward the
   direction he is facing. Four arcs staggered by 55ms give one "tring" some body;
   the CSS runs the whole thing twice to match the two rings in the SFX. */
function bellSVG(){
 return '<svg class="bell" viewBox="0 0 340 100" aria-hidden="true">'
  +'<g transform="translate(58 50)" fill="none" stroke="#5BC4C4" stroke-width="5"'
  +' stroke-linecap="round" vector-effect="non-scaling-stroke">'
  +'<path class="ring" d="M0 -26 A 26 26 0 0 1 0 26"></path>'
  +'<path class="ring" d="M0 -26 A 26 26 0 0 1 0 26"></path>'
  +'<path class="ring" d="M0 -26 A 26 26 0 0 1 0 26"></path>'
  +'<path class="ring" d="M0 -26 A 26 26 0 0 1 0 26"></path>'
  +'</g><g class="body">'
  +'<circle cx="34" cy="50" r="24" fill="#5BC4C4"></circle>'
  +'<circle cx="26" cy="42" r="7" fill="#FFFFFF" opacity=".55"></circle>'
  +'</g></svg>';
}
