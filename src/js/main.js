/* Boot. Load order matters: levels -> engine -> sprites -> scenes -> curl -> main. */
try { speechSynthesis.getVoices(); } catch (e) {}

/* Cover the frame before the title scene exists, so the first paint is black and
   no half-loaded layer is ever visible. */
openingCurl.arm();

/* The title screen IS the opening scene: pxBuild puts the parallax layers up and
   sets their starting positions. Build it behind the cover, wait for every layer
   the reveal will show to decode, give the browser one frame to paint that hidden
   scene, then unroll. */
title();

const OPENING_LAYERS = ['far_sky', 'mid_canopy', 'act_bank', 'act_bridge',
                        'act_clearing', 'near_leaves', 'near_grass',
                        'join_trunk', 'ramp'];

function playBtn() { return document.querySelector('.over.card .btn'); }

/* No input until the scene is actually on screen. */
(function gate() { const b = playBtn(); if (b) b.disabled = true; })();

Promise.all(OPENING_LAYERS.map(k => new Promise(r => {
  const i = new Image();
  i.onload = i.onerror = r;
  i.src = A[k];
}))).then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
  openingCurl.play({
    direction: 'left-to-right',
    duration: 950,
    hold: 80,
    onComplete: () => { const b = playBtn(); if (b) b.disabled = false; },
  });
})));
