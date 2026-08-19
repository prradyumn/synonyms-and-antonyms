/* ---------------------------------------------------------------------------
   Opening curl reveal — the level unrolls from the left behind a rolling tube of
   leaf that fattens as it eats the cover.

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

   WHY THIS IS DRAWN AND NOT TWEENED

   The first version slid a fixed-width gradient band across the screen, and it
   read as exactly that: a band sliding. A roll has three properties a band does
   not, and all three are geometry rather than timing --

     1. it FATTENS, because it is accumulating the cover it travels over;
     2. it ROTATES, and needs a mark on its surface for that to be visible;
     3. it SHADES like a cylinder, and throws a shadow on the floor it uncovers.

   None of that is something a tweening library could add. What a library could
   buy is wrapping the real scene pixels around the cylinder -- but the thing
   curling here is an opaque cover, so its pixels are never needed, which is
   fortunate, because this scene is DOM and rasterising DOM to a texture is the
   genuinely hard part.

   So: one narrow full-height canvas travelling with the boundary, drawing a
   shaded cylinder. The shading profile is scale-invariant across the diameter, so
   a single 512px source serves a roll that triples in width, and nothing is
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
const R0     = 8;    /* radius of the first tight curl */
const RMAX   = 58;   /* radius once the whole cover is wound on. At 44 the tube
                        finished 62px wide on a 1476px frame and read as a vine
                        rather than as something with a cover wound onto it --
                        presence matters more here than restraint. */
const SHADOW = 76;   /* how far the roll's shadow falls over the revealed scene */
const UNDER  = 5;    /* shadow pushed under the roll so its dark end never shows */
const LIP    = 10;   /* black cover held ahead of the contact point, so the sag
                        can never expose a sliver of scene past the roll */
const STRIP  = 16;   /* strip height for the sag deformation */
const ROUND  = 18;   /* #frame's border-radius, kept during the clip */
const BAND   = SHADOW + 2 * RMAX + LIP + 6;   /* canvas width */

/* A roll eating this much cover would really turn about eight times. At 1600ms
   that strobes -- each seam pass would last 200ms and the eye reads blur rather
   than rotation. 2.2 is slow enough to follow: the same readability-over-physics
   trade the easing below makes. */
const TURNS = 2.2;

/* 1600ms with a power-1.7 ease-out rather than 950ms with a cubic. Cubic put 79%
   of the travel into the first 40% of the time, so the curl flicked across and
   then crept -- it read as a flash rather than an unroll. 1.7 spreads it to 59%
   over the same span, which is what makes the edge readable while it moves. */
const DEFAULTS = { direction: 'left-to-right', duration: 1600, hold: 90 };
const EASE_POW = 1.7;
const ease = (p) => 1 - Math.pow(1 - p, EASE_POW);

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
let prof = null, profF = null, seam = null, seamF = null, shad = null, shadF = null;
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

/* Progress -> where the cover lifts off the floor, in px.

   The contact point travels the frame width PLUS one whole roll diameter, so at
   the end the roll carries on out of shot instead of parking against the edge.
   clipTo() clamps at the frame, so the scene is fully revealed at about 84% of
   the duration and the last quarter-second is just the roll leaving. */
function contactAt(p, w) {
  const pl = plan();
  return pl.from * w + (pl.to - pl.from) * (w + 2 * RMAX * px) * ease(p);
}

/* Radius grows as the SQUARE ROOT of progress. A roll gains area at a constant
   rate, so its radius -- sqrt(area/pi) -- climbs fast at first and then crawls.
   This is what the old flat band was missing: its width never changed, so nothing
   appeared to be accumulating, and a band that does not fatten cannot read as
   something being rolled up no matter how well it is shaded. */
function radiusAt(p) {
  return (R0 + (RMAX - R0) * Math.sqrt(Math.max(0, Math.min(1, p)))) * px;
}

/* -- the pieces, pre-rendered once ---------------------------------------- */
/* Three one-pixel-tall strips, stamped and stretched per frame so nothing is
   allocated during the animation. */
function buildParts() {
  const N = 512;
  if (!prof)  { prof  = document.createElement('canvas'); prof.height  = 1; }
  if (!profF) { profF = document.createElement('canvas'); profF.height = 1; }
  prof.width = N; profF.width = N;

  /* Light from the upper front-left, so the highlight lands left of centre --
     the same side the scene is being revealed on. */
  const LX = -0.55, LZ = 0.835;
  const DEEP = [12, 34, 18],   MID  = [63, 143, 58],
        LIT  = [142, 210, 106], PALE = [234, 247, 206];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t,
                            a[1] + (b[1] - a[1]) * t,
                            a[2] + (b[2] - a[2]) * t];

  const pc = prof.getContext('2d');
  const id = pc.createImageData(N, 1), d = id.data;
  for (let i = 0; i < N; i++) {
    const u  = (i + 0.5) / N;                        /* across the diameter */
    const sn = 2 * u - 1;                            /* sin of the surface angle */
    const cs = Math.sqrt(Math.max(0, 1 - sn * sn));  /* cos: depth toward us */
    const lam = Math.max(0, sn * LX + cs * LZ);      /* Lambert */
    const t = Math.min(1, 0.16 + 0.84 * lam);        /* ambient + diffuse */
    let col = t < 0.5 ? mix(DEEP, MID, t / 0.5) : mix(MID, LIT, (t - 0.5) / 0.5);
    col = mix(col, PALE, Math.pow(lam, 30) * 0.78);   /* the specular band */
    col = mix(col, LIT,  Math.pow(1 - cs, 4) * 0.22); /* silhouette rim */
    /* The far sliver darkens into the flat cover it is feeding off, so the roll
       and the black meet in a crease rather than a step. */
    if (u > 0.93) { const k = (u - 0.93) / 0.07; col = mix(col, [0, 0, 0], k * k * 0.92); }
    const o = i * 4;
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2];
    /* Feather the near silhouette only: it sits over revealed scene and wants
       antialiasing. The far one meets black and wants a hard edge. */
    d[o + 3] = 255 * Math.min(1, u * N / 1.5);
  }
  pc.putImageData(id, 0, 0);
  flip(prof, profF, N);

  /* The seam: the cover's free end, lying proud of the surface it is wound onto,
     so it catches light along its leading side and throws a line of shadow
     behind. The first attempt was a soft dark stripe, and it was invisible -- a
     smooth falloff squeezed into three screen pixels averages itself away, and it
     measured 3 lum deep against a 170 lum range. A light-then-dark STEP survives
     the downscale, because it is the step and not the darkness that reads as an
     edge. */
  if (!seam)  { seam  = document.createElement('canvas'); seam.height  = 1; }
  if (!seamF) { seamF = document.createElement('canvas'); seamF.height = 1; }
  seam.width = 64; seamF.width = 64;
  const sc = seam.getContext('2d');
  const sid = sc.createImageData(64, 1), sd = sid.data;
  for (let i = 0; i < 64; i++) {
    const u = (i + 0.5) / 64, o = i * 4;
    let col, al;
    if (u < 0.42)      { col = [236, 248, 210]; al = 0.62 * Math.pow(u / 0.42, 1.4); }
    else if (u < 0.54) { col = [6, 18, 10];     al = 0.92; }
    else               { col = [10, 30, 15];    al = 0.55 * Math.pow(1 - (u - 0.54) / 0.46, 1.8); }
    sd[o] = col[0]; sd[o + 1] = col[1]; sd[o + 2] = col[2]; sd[o + 3] = 255 * al;
  }
  sc.putImageData(sid, 0, 0);
  flip(seam, seamF, 64);

  /* The shadow it throws across the floor it has just uncovered. */
  if (!shad)  { shad  = document.createElement('canvas'); shad.height  = 1; }
  if (!shadF) { shadF = document.createElement('canvas'); shadF.height = 1; }
  shad.width = 128; shadF.width = 128;
  const hc = shad.getContext('2d');
  const hid = hc.createImageData(128, 1), hd = hid.data;
  for (let i = 0; i < 128; i++) {
    const u = (i + 0.5) / 128, o = i * 4;   /* 0 far off, 1 hard against the roll */
    hd[o] = 4; hd[o + 1] = 14; hd[o + 2] = 8;
    /* pow 1.5, not 2.2: a steeper ramp buried most of its darkness in the strip
       that ends up hidden UNDER the tube, leaving the visible part too faint to
       ground it. */
    hd[o + 3] = 255 * 0.55 * Math.pow(u, 1.5);
  }
  hc.putImageData(hid, 0, 0);
  flip(shad, shadF, 128);
}

function flip(src, dst, w) {
  const c = dst.getContext('2d');
  c.clearRect(0, 0, w, 1);
  c.save(); c.translate(w, 0); c.scale(-1, 1); c.drawImage(src, 0, 0); c.restore();
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
  cwPx = Math.max(8, Math.round(BAND * px));
  chPx = Math.round(r.height);
  cv.style.width = cwPx + 'px';
  cv.style.height = chPx + 'px';
  cv.width = Math.round(cwPx * dpr);
  cv.height = Math.round(chPx * dpr);
  buildParts();
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

/* -- the roll ------------------------------------------------------------- */
/* The canvas lives entirely on the revealed side, because it is a child of the
   element carrying the clip-path and so cannot draw past the boundary. The
   contact point is therefore pinned LIP units inside the canvas's inner edge and
   that last strip is filled black -- so however far the sag pushes the tube, the
   cover it is feeding off always reaches the clip. */
function drawCurl(clipXpx, r, ms, p) {
  if (!cx) return;
  const W = cv.width, H = cv.height, sc = px * dpr;
  cx.clearRect(0, 0, W, H);

  const left = plan().sceneLeft;
  const dir  = left ? -1 : 1;                 /* the roll extends this way */
  const contactX = left ? W - LIP * sc : LIP * sc;
  const dia = 2 * r * dpr;

  /* The shadow deepens as the roll fattens, and runs UNDER it so the gradient's
     dark end always sits beneath the tube rather than showing as a band. */
  const shW = SHADOW * sc;
  const sEnd = contactX + dir * (dia - UNDER * sc);
  cx.globalAlpha = Math.min(1, 0.55 + 0.45 * (r / (RMAX * px)));
  cx.drawImage(left ? shad : shadF, 0, 0, 128, 1,
               left ? sEnd - shW : sEnd, 0, shW, H);
  cx.globalAlpha = 1;

  /* The seams are the only thing that tells the eye this is ROTATING rather than
     sliding. They run off the same eased distance as the travel, so the spin slows
     when the roll does -- a seam on its own clock reads as a texture animating on
     a static shape.

     TWO of them, half a turn apart. One alone is only visible for half of each
     revolution, which left long stretches with no rotation cue at all; and a roll
     this size really has several wraps, so the joins between them are visible all
     the way round. The trailing one is fainter, being a wrap further in. */
  const phi = 2 * Math.PI * TURNS * ease(p);
  const seamW = 9 * sc;
  const marks = [[phi, 1], [phi + Math.PI, 0.45]].map(([a, k]) => {
    const face = Math.cos(a);
    return face > 0
      ? { u: (1 + Math.sin(a) * (left ? 1 : -1)) / 2, a: Math.min(1, face * 2.6) * k }
      : null;
  }).filter(Boolean);

  const src = left ? prof : profF;
  const stripPx = Math.max(4, STRIP * sc);
  cx.fillStyle = '#000';
  for (let y = 0; y < H; y += stripPx) {
    const yl = y / sc;                        /* logical y: same sag at any DPI */
    const wob = (Math.sin(yl * 0.021 + ms * 0.006) * 2.4 +
                 Math.sin(yl * 0.008 - ms * 0.003) * 1.6) * sc;
    const rd = dia * (1 + Math.sin(yl * 0.013 + 1.7) * 0.025);  /* a slight sag */
    const x0 = left ? contactX - rd + wob : contactX + wob;
    /* +1 on the height overlaps the strips so no hairline shows between them */
    cx.drawImage(src, 0, 0, src.width, 1, x0, y, rd, stripPx + 1);
    for (let m = 0; m < marks.length; m++) {
      cx.globalAlpha = marks[m].a;
      cx.drawImage(left ? seam : seamF, 0, 0, 64, 1,
                   x0 + rd * marks[m].u - seamW / 2, y, seamW, stripPx + 1);
    }
    cx.globalAlpha = 1;
    /* the flat cover, from the roll's crease out to the clip */
    if (left) cx.fillRect(x0 + rd, y, W - (x0 + rd), stripPx + 1);
    else      cx.fillRect(0, y, x0, stripPx + 1);
  }
  cv.style.transform = 'translateX(' + (left ? clipXpx - cwPx : clipXpx) + 'px)';
}

function drawDebug(p, clipXpx, r) {
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
    '\nclipX    ' + Math.round(clipXpx) + 'px' +
    '\nradius   ' + r.toFixed(1) + 'px  dia ' + (2 * r).toFixed(1) +
    '\nturns    ' + (TURNS * ease(p)).toFixed(2) +
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
  const w = f.getBoundingClientRect().width;
  const r = radiusAt(p);
  /* The clip sits LIP ahead of the contact point and the roll's own black covers
     that strip, so the visible edge follows the sagging tube with no gap. */
  const clipX = contactAt(p, w) + LIP * px * (plan().sceneLeft ? 1 : -1);

  clipTo(clipX);
  drawCurl(clipX, r, ms, p);
  drawDebug(p, clipX, r);

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
     pre-rendered pieces both depend on the frame size and DPI. */
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
