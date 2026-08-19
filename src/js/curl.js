/* ---------------------------------------------------------------------------
   Opening curl reveal — the level unrolls from the left behind a travelling
   curled leaf edge.

   HOW THE SHARED MASK WORKS

   This game has no canvas scene renderer: the parallax layers, actors, ramps and
   props are DOM elements inside #frame, moved with CSS transforms. So there is no
   render function to wrap in ctx.clip(). The equivalent is to clip their common
   ancestor -- ONE clip-path on #frame -- which every layer inherits. Because
   there is physically a single clip, the layers cannot disagree about where the
   boundary is: no per-layer masks, no tearing, no exposed strips, and the scene's
   own positioning code is never touched.

   Behind #frame sits a temporary black backdrop, so the unrevealed side is true
   black rather than the page background.

   The curl itself is the one place a canvas belongs: a narrow full-height canvas
   that travels with the boundary and draws the fold. Its cross-section is
   pre-rendered once, then stamped per strip with a wave offset, so nothing is
   allocated per frame.

   Time comes from VT, the game's own clock in engine.js. That makes the reveal
   frame-rate independent and means it honours the same pause contract as
   everything else (tab hidden, or the layout editor holding the screen).
   ------------------------------------------------------------------------- */
(function () {
'use strict';

const FRAME = () => document.querySelector('#frame');
const WRAP  = () => document.querySelector('#wrap');

/* logical units, in the game's 1920x1080 design space */
const CURL_W     = 64;   /* width of the curl band */
const BLACK_LEAD = 18;   /* how far the black lip runs ahead of the fold */
const STRIP      = 12;   /* strip height for the wave deformation */
const ROUND      = 18;   /* #frame's border-radius, kept during the clip */

const DEFAULTS = { direction: 'left-to-right', duration: 950, hold: 80 };

let state   = 'idle';    /* idle | armed | running | done */
let mode    = DEFAULTS.direction;
let dur     = DEFAULTS.duration;
let hold    = DEFAULTS.hold;
let t0      = 0;
let raf     = 0;
let onDone  = null;
let onCover = null;
let coverFired = false;
let debug   = false;

let backdrop = null, cv = null, cx = null, dbg = null;
let cross = null, crossCx = null, crossFlip = null;   /* pre-rendered fold */
let px = 1;              /* logical unit -> CSS px */
let dpr = 1;
let cwPx = 0, chPx = 0;

/* -- geometry ------------------------------------------------------------- */
function unit() {
  const f = FRAME();
  return f ? f.getBoundingClientRect().width / 1920 : 1;
}
/* Which side of the boundary the scene occupies, and where the boundary runs
   from and to, for each mode. */
function plan() {
  switch (mode) {
    case 'right-to-left': return { sceneLeft: false, from: 1, to: 0 };
    case 'close-left':    return { sceneLeft: false, from: 0, to: 1 };
    case 'close-right':   return { sceneLeft: true,  from: 1, to: 0 };
    default:              return { sceneLeft: true,  from: 0, to: 1 };
  }
}

/* Normalised progress -> boundary as a fraction of width.

   0 - 0.10  the curl appears, barely moving
   0.10- 0.85 the main unroll, cubic ease-out: decisive, easing off at the end
   0.85- 1.00 a small overshoot past the edge, then the curl flattens away    */
function shape(p) {
  let f, w = 1;
  if (p < 0.10) {
    f = 0.012 * (p / 0.10);
    w = p / 0.10;                                   /* curl grows in */
  } else if (p < 0.85) {
    const q = (p - 0.10) / 0.75;
    f = 0.012 + (1 - Math.pow(1 - q, 3)) * 0.988;   /* reaches exactly 1 at 0.85 */
  } else {
    const q = (p - 0.85) / 0.15;
    /* The overshoot only ever pushes PAST the edge -- it must never dip back
       below 1, or the clip re-covers a strip of the right edge and a black seam
       reappears for the last 150ms. clipTo() clamps the excess. */
    f = 1 + 0.028 * Math.sin(q * Math.PI);
    w = 1 - q * q;                                  /* and the curl flattens */
  }
  return { frac: f, width: Math.max(0, w) };
}

/* -- the fold's cross-section, pre-rendered once -------------------------- */
/* transparent shadow -> dark green underside -> bright fold -> pale highlight
   -> black. Stamped per strip, so no gradient is built during animation. */
function buildCross() {
  const w = Math.max(8, Math.round(CURL_W * px * dpr));
  const h = 6;
  if (!cross) { cross = document.createElement('canvas'); crossCx = cross.getContext('2d'); }
  if (!crossFlip) crossFlip = document.createElement('canvas');
  cross.width = w; cross.height = h;
  crossFlip.width = w; crossFlip.height = h;

  const g = crossCx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0.00, 'rgba(6,20,10,0)');
  g.addColorStop(0.26, 'rgba(6,20,10,0.34)');       /* shadow on the revealed side */
  g.addColorStop(0.46, '#1E4426');                  /* folded underside */
  g.addColorStop(0.60, '#3F8F3A');                  /* saturated jungle green */
  g.addColorStop(0.68, '#8ED26A');                  /* the lit fold */
  g.addColorStop(0.735, '#EAF7CE');                 /* pale highlight along it */
  g.addColorStop(0.75, '#0A140C');
  g.addColorStop(1.00, '#000');                     /* black lip, leads the fold */
  crossCx.clearRect(0, 0, w, h);
  crossCx.fillStyle = g;
  crossCx.fillRect(0, 0, w, h);

  const fc = crossFlip.getContext('2d');
  fc.clearRect(0, 0, w, h);
  fc.save(); fc.translate(w, 0); fc.scale(-1, 1);
  fc.drawImage(cross, 0, 0); fc.restore();
}

/* -- build / tear down ---------------------------------------------------- */
function ensure() {
  const f = FRAME(), wrap = WRAP();
  if (!f || !wrap) return false;
  px = unit();
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:#000;border-radius:' +
      ROUND + 'px;z-index:0;pointer-events:none;';
    wrap.style.position = 'relative';
    f.style.position = 'relative';
    f.style.zIndex = '1';
    wrap.insertBefore(backdrop, f);
  }
  if (!cv) {
    cv = document.createElement('canvas');
    cv.className = 'curl';
    cv.style.cssText = 'position:absolute;top:0;left:0;z-index:9500;pointer-events:none;';
    cx = cv.getContext('2d');
    f.appendChild(cv);
  }
  const r = f.getBoundingClientRect();
  cwPx = Math.max(8, Math.round(CURL_W * px));
  chPx = Math.round(r.height);
  cv.style.width = cwPx + 'px';
  cv.style.height = chPx + 'px';
  cv.width = Math.round(cwPx * dpr);
  cv.height = Math.round(chPx * dpr);
  buildCross();
  return true;
}

function clipTo(boundaryPx) {
  const f = FRAME(); if (!f) return;
  const w = f.getBoundingClientRect().width;
  const b = Math.max(0, Math.min(w, boundaryPx));
  /* one clip, on the ancestor of every layer. `round` keeps #frame's corners. */
  const inset = plan().sceneLeft
    ? '0 ' + (w - b) + 'px 0 0'
    : '0 0 0 ' + b + 'px';
  f.style.clipPath = 'inset(' + inset + ' round ' + ROUND + 'px)';
}

function cleanup() {
  const f = FRAME();
  if (f) { f.style.clipPath = ''; f.style.zIndex = ''; }
  if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
  if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  if (dbg && dbg.parentNode) dbg.parentNode.removeChild(dbg);
  cv = cx = backdrop = dbg = null;
  if (raf) cancelAnimationFrame(raf), raf = 0;
}

/* -- the curl edge -------------------------------------------------------- */
function drawCurl(boundaryPx, widthMul, ms) {
  if (!cx) return;
  const W = cv.width, H = cv.height, sc = px * dpr;
  cx.clearRect(0, 0, W, H);
  if (widthMul <= 0.01) return;

  const src = plan().sceneLeft ? cross : crossFlip;
  const stripPx = Math.max(4, STRIP * sc);
  const squash = 0.82 + 0.18 * widthMul;            /* mild horizontal compression */
  const drawW = W * squash;
  const baseX = plan().sceneLeft ? W - drawW : 0;

  for (let y = 0; y < H; y += stripPx) {
    const yl = y / sc;                              /* logical y, so the wave is
                                                       the same at any DPI */
    const wave = (Math.sin(yl * 0.025 + ms * 0.008) * 3 +
                  Math.sin(yl * 0.009 - ms * 0.004) * 2) * sc * widthMul;
    /* +1 on the height overlaps the strips so no hairline shows between them */
    cx.drawImage(src, 0, 0, src.width, src.height,
                 baseX + wave, y, drawW, stripPx + 1);
  }
  cv.style.transform = 'translateX(' +
    ((plan().sceneLeft ? boundaryPx - cwPx : boundaryPx)) + 'px)';
}

function drawDebug(p, boundaryPx) {
  if (!debug) return;
  const f = FRAME();
  if (!dbg) {
    dbg = document.createElement('div');
    dbg.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:9600;' +
      'font:11px monospace;color:#9ef;background:rgba(0,0,0,.6);padding:6px 8px;' +
      'border-radius:6px;pointer-events:none;white-space:pre;';
    f.appendChild(dbg);
  }
  dbg.textContent =
    'curl ' + state + '  mode ' + mode +
    '\nprogress ' + p.toFixed(3) +
    '\nrevealX  ' + Math.round(boundaryPx) + 'px' +
    '\ncurl w   ' + cwPx + 'px (' + CURL_W + 'u)' +
    '\nunit     ' + px.toFixed(3) + '  dpr ' + dpr;
  cx.save();
  cx.strokeStyle = '#00e5ff'; cx.lineWidth = 2;
  cx.beginPath();
  const bx = plan().sceneLeft ? cv.width - 1 : 1;
  cx.moveTo(bx, 0); cx.lineTo(bx, cv.height); cx.stroke();
  cx.restore();
}

/* -- loop ----------------------------------------------------------------- */
function now() { return (typeof VT === 'number') ? VT : performance.now(); }

function tick() {
  raf = requestAnimationFrame(tick);
  if (state !== 'running') return;
  const f = FRAME(); if (!f) return finish();

  const ms = now() - t0;
  const p = Math.max(0, Math.min(1, ms / dur));
  const sh = shape(p);
  const w = f.getBoundingClientRect().width;
  const pl = plan();
  const frac = pl.from + (pl.to - pl.from) * sh.frac;
  const revealX = frac * w;

  /* The black lip leads the fold, and the clip sits at the lip. The scene is
     therefore revealed slightly past the fold, and the curl's own black covers
     that sliver -- so the visible edge follows the wavy fold with no gap. */
  const lead = BLACK_LEAD * px * (pl.sceneLeft ? 1 : -1);
  clipTo(revealX + lead);
  drawCurl(revealX + lead, sh.width, ms);
  drawDebug(p, revealX);

  if (!coverFired && p >= 1 && onCover) { coverFired = true; onCover(); }
  if (ms >= dur + hold) finish();
}

function finish() {
  if (state === 'done') return;              /* onComplete fires exactly once */
  state = 'done';
  cleanup();
  const cb = onDone; onDone = null; onCover = null;
  if (cb) cb();
}

/* -- API ------------------------------------------------------------------ */
const api = {
  /* Cover the frame before anything is built, so the first paint is black and
     no partially loaded layer is ever shown. */
  arm() {
    if (!ensure()) return;
    state = 'armed';
    mode = DEFAULTS.direction;
    clipTo(0);
    if (cx) cx.clearRect(0, 0, cv.width, cv.height);
  },

  play(opt) {
    opt = opt || {};
    mode = opt.direction || DEFAULTS.direction;
    dur = opt.duration || DEFAULTS.duration;
    hold = opt.hold === undefined ? DEFAULTS.hold : opt.hold;
    onDone = opt.onComplete || null;
    onCover = opt.onCovered || null;
    coverFired = false;
    debug = /[?&]curldebug/.test(location.search);

    if (!ensure()) { finish(); return api; }

    /* Reduced motion, or a dev flag, land straight in the finished state. */
    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || /[?&]nocurl/.test(location.search)) { state = 'running'; finish(); return api; }

    state = 'running';
    t0 = now();
    clipTo(plan().from * FRAME().getBoundingClientRect().width);
    if (!raf) raf = requestAnimationFrame(tick);
    return api;
  },

  /* Jump to the finished state: mask, curl and backdrop all removed, and
     onComplete called once. Never leaves a partial clip behind. */
  skip() { if (state === 'running' || state === 'armed') { state = 'running'; finish(); } },

  busy() { return state === 'running' || state === 'armed'; },

  /* Re-measure on resize / fullscreen: the canvas backing store and the
     pre-rendered fold both depend on the frame size and DPI. */
  resize() {
    if (state !== 'running' && state !== 'armed') return;
    ensure();
    if (state === 'armed') clipTo(0);
  },
};

window.openingCurl = api;

/* Skip on the project's confirm keys, or any tap, while the reveal is running. */
addEventListener('keydown', (e) => {
  if (!api.busy()) return;
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { api.skip(); e.preventDefault(); }
});
addEventListener('pointerdown', () => { if (api.busy()) api.skip(); }, true);
addEventListener('resize', () => api.resize());
})();
