/* ---------------------------------------------------------------------------
   TEMPORARY dev layout editor.  Press E on any screen.

   Freezes whatever is on screen, then lets you drag any element to move it and
   pull its handles to resize it, instead of guessing numbers in the stylesheet.
   An alignment map bottom-right shows every box at once and how far the
   selected one is from centre. Export when done.

   Adapted from the portable editor spec. Three things are specific to this game
   and worth knowing:

   1  There is no transform:scale() stage. #frame is sized by `width:100%` with
      `aspect-ratio:16/9`, and `--u` is `100cqw/1920` -- so frameWidth/1920 IS
      the design-space scale factor, and every number this editor reports is in
      1920x1080 DESIGN UNITS. That means an exported `left: 913` pastes back as
      `calc(913 * var(--u))` and lands exactly. Percentages are exported too,
      because this game positions a lot of things in %.

   2  Actors (.cyc) are positioned with `transform: translate(...)`, not
      left/top. Writing left/top on those would be offset by the transform, so
      normalise() clears transform as well -- after pinning the element to the
      box it currently occupies, so nothing jumps.

   3  Freeze is real, not approximate. The game runs every delay off one virtual
      clock (VT in engine.js) advanced by rAF, so setPaused(true) stops the
      story, the camera, the audio and the speech together. The editor drives it
      through window.__gameFreeze.

   TO REMOVE: delete this file and its <script> tag in index.html. It touches
   nothing else -- the two hooks it uses (__gameFreeze, __scene) are one line
   each and harmless on their own.
   ------------------------------------------------------------------------- */
(function () {
'use strict';

// -- CONFIG - the only game-specific part -----------------------------------
const CONFIG = {
  stageSelector: '#frame',
  stageW: 1920,          // the design space --u is built on
  stageH: 1080,

  /* [selector, label]. Re-queried on every interaction, so anything the game
     builds at runtime is editable the moment it exists. Parallax layers are
     left out on purpose: they are four frames wide and never want dragging. */
  targets: [
    ['#ask',        'narrator box'],
    ['.bub',        'jhumru bubble'],
    ['.bubtxt',     'jhumru bubble text'],
    ['#mute',       'sound button'],
    ['.over.card',  'card panel'],
    ['.btn',        'button'],
    ['.trailmap',   'trail map'],
    ['.ramp',       'ramp'],
    ['.rampsh',     'ramp shadow'],
    ['.cyc',        'rider'],
    ['.cycsh',      'rider shadow'],
    ['.ch',         'character'],
  ],

  keyAttrs: ['key', 'name', 'id'],
  freeze: (on) => (window.__gameFreeze ? window.__gameFreeze(on) : undefined),
  screenName: () => window.__scene || 'unknown',
  panelPosKey: 'wt-le-panel',
  mapPosKey:   'wt-le-map',
};
// ---------------------------------------------------------------------------

const STAGE_W = CONFIG.stageW, STAGE_H = CONFIG.stageH;
const SNAP = 6, HANDLE = 16;

let open = false, frozen = false, selected = null, drag = null, snapOn = true;
let layer, capture, selBox, guideX, guideY, panel, mini, miniCtx;
let readout, nameLabel, freezeBtn;
const edited = new Set();

const stageEl = () => document.querySelector(CONFIG.stageSelector);

// -- coords -----------------------------------------------------------------
function scale() {
  const r = stageEl().getBoundingClientRect();
  return r.width / STAGE_W || 1;
}
function toStage(cx, cy) {
  const r = stageEl().getBoundingClientRect(), s = scale();
  return { x: (cx - r.left) / s, y: (cy - r.top) / s };
}
/* An element's box in design units, whatever it is parented to. Ancestor
   transforms are included, which is what makes children of the scrolling
   parallax layer measurable. */
function stageBox(el) {
  const r = el.getBoundingClientRect(), sr = stageEl().getBoundingClientRect(), s = scale();
  return { x: (r.left - sr.left) / s, y: (r.top - sr.top) / s, w: r.width / s, h: r.height / s };
}

function visible(el) {
  if (!el) return false;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.02) return false;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}
function targets() {
  const out = [];
  for (const [sel, label] of CONFIG.targets) {
    document.querySelectorAll(CONFIG.stageSelector + ' ' + sel).forEach((el) => {
      if (visible(el)) out.push({ el, label });
    });
  }
  return out;
}
/* Classes the game toggles as STATE. They must not go into a key, or the same
   element exports as `.cyc` in one run and `.cyc.riding` in the next and the two
   look like different things. */
const STATE_CLASSES = ['riding', 'held', 'gone', 'away', 'lit', 'on', 'q', 'shake', 'wob', 'sway'];
function keyFor(el) {
  if (el.id) return '#' + el.id;
  const cls = [...el.classList].filter((c) => STATE_CLASSES.indexOf(c) < 0);
  for (const a of CONFIG.keyAttrs) if (el.dataset[a]) {
    const base = cls.length ? '.' + cls[0] : el.tagName.toLowerCase();
    return base + '[data-' + a + '="' + el.dataset[a] + '"]';
  }
  return '.' + cls.join('.');
}

// -- make an element movable ------------------------------------------------
/* Pins the element to the box it currently occupies and clears everything that
   would fight left/top: right, bottom, margin, inset AND transform. The game
   positions actors purely by transform, so without that last one an edit would
   be silently offset by whatever translate was in play. */
/* CSS px, from a box given in stage units.

   This is the one place the original editor needed adapting. It assumes a stage
   scaled by transform:scale(k), where a CSS pixel inside the stage IS a stage
   unit. #frame has no such transform -- it is sized by width:100% -- so here
   1 stage unit is `scale()` CSS pixels, and unit values have to be multiplied on
   the way in. Writing them raw moved everything by 1/scale and compounded on
   every nudge. The parent offset is already in CSS px, so it is NOT scaled. */
function writeBox(el, b) {
  const parent = el.offsetParent || stageEl();
  const pr = parent.getBoundingClientRect(), sr = stageEl().getBoundingClientRect(), s = scale();
  el.style.left = Math.round(b.x * s - (pr.left - sr.left)) + 'px';
  el.style.top = Math.round(b.y * s - (pr.top - sr.top)) + 'px';
  el.style.width = Math.round(b.w * s) + 'px';
  el.style.height = Math.round(b.h * s) + 'px';
}
function normalise(el) {
  if (edited.has(el)) return;
  const b = stageBox(el);
  const pos = getComputedStyle(el).position;
  el.style.position = pos === 'static' ? 'absolute' : pos;
  el.style.right = 'auto'; el.style.bottom = 'auto';
  el.style.margin = '0'; el.style.inset = 'auto';
  el.style.transform = 'none';          /* actors are placed purely by transform */
  writeBox(el, b);
  edited.add(el);
}
const applyBox = writeBox;

// -- freeze -----------------------------------------------------------------
function setFrozen(on) {
  frozen = on;
  CONFIG.freeze(on);                                   // the game's own clock
  try {
    document.getAnimations().forEach((a) => { try { on ? a.pause() : a.play(); } catch (e) {} });
  } catch (e) {}
  if (freezeBtn) {
    freezeBtn.textContent = on ? '▶  Resume screen' : '⏸  Stop screen';
    freezeBtn.style.background = on ? '#166534' : '#7f1d1d';
  }
}

// -- selection --------------------------------------------------------------
function select(el) {
  selected = el;
  if (!el) {
    selBox.style.display = 'none';
    nameLabel.textContent = 'click an element';
    readout.textContent = '';
    drawMini(); return;
  }
  normalise(el);
  selBox.style.display = 'block';
  nameLabel.textContent = keyFor(el);
  syncSel();
}
function syncSel() {
  if (!selected) return;
  const b = stageBox(selected);
  const s = scale();
  selBox.style.left = b.x * s + 'px'; selBox.style.top = b.y * s + 'px';
  selBox.style.width = b.w * s + 'px'; selBox.style.height = b.h * s + 'px';
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const dx = Math.round(cx - STAGE_W / 2), dy = Math.round(cy - STAGE_H / 2);
  const col = (v) => Math.abs(v) <= 1 ? '#4ade80' : '#fbbf24';
  readout.innerHTML =
    'units &nbsp;x <b>' + Math.round(b.x) + '</b> y <b>' + Math.round(b.y) +
    '</b> w <b>' + Math.round(b.w) + '</b> h <b>' + Math.round(b.h) + '</b><br>' +
    'percent &nbsp;left ' + (b.x / STAGE_W * 100).toFixed(1) + '% top ' +
    (b.y / STAGE_H * 100).toFixed(1) + '%<br>' +
    'bottom ' + ((STAGE_H - (b.y + b.h)) / STAGE_H * 100).toFixed(1) +
    '% &nbsp; feet y ' + ((b.y + b.h) / STAGE_H * 100).toFixed(1) + '%<br>' +
    'centre off <b style="color:' + col(dx) + '">' + (dx > 0 ? '+' : '') + dx + '</b>, ' +
    '<b style="color:' + col(dy) + '">' + (dy > 0 ? '+' : '') + dy + '</b>' +
    (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 ? ' <b style="color:#4ade80">centred</b>' : '');
  drawMini();
}

// -- pointer ----------------------------------------------------------------
function hit(pt) {
  let best = null;
  for (const { el } of targets()) {
    const b = stageBox(el);
    if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
      const a = b.w * b.h;
      if (!best || a < best.a) best = { el, a };    // smallest hit wins
    }
  }
  return best ? best.el : null;
}
function onDown(ev) {
  const pt = toStage(ev.clientX, ev.clientY);
  const mode = ev.target.dataset ? ev.target.dataset.handle : null;
  if (mode && selected) drag = { mode, start: pt, box: stageBox(selected) };
  else {
    const el = hit(pt);
    select(el);
    if (el) drag = { mode: 'move', start: pt, box: stageBox(el) };
  }
  if (drag) { ev.preventDefault(); ev.stopPropagation(); try { layer.setPointerCapture(ev.pointerId); } catch (e) {} }
}
function onMove(ev) {
  if (!drag || !selected) return;
  const pt = toStage(ev.clientX, ev.clientY);
  const dx = pt.x - drag.start.x, dy = pt.y - drag.start.y, s = drag.box;
  let b = { x: s.x, y: s.y, w: s.w, h: s.h };
  if (drag.mode === 'move') { b.x = s.x + dx; b.y = s.y + dy; }
  else {
    if (drag.mode.indexOf('w') >= 0) { b.x = s.x + dx; b.w = s.w - dx; }
    if (drag.mode.indexOf('e') >= 0) { b.w = s.w + dx; }
    if (drag.mode.indexOf('n') >= 0) { b.y = s.y + dy; b.h = s.h - dy; }
    if (drag.mode.indexOf('s') >= 0) { b.h = s.h + dy; }
    if (ev.shiftKey && drag.mode.length === 2) {          // keep the aspect ratio
      const ar = s.w / s.h, h2 = b.w / ar;
      if (Math.abs(h2 - b.h) > 0.5) { if (drag.mode.indexOf('n') >= 0) b.y += b.h - h2; b.h = h2; }
    }
    b.w = Math.max(8, b.w); b.h = Math.max(8, b.h);
  }
  let gx = false, gy = false;
  if (snapOn) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (Math.abs(cx - STAGE_W / 2) <= SNAP) { if (drag.mode === 'move') b.x += STAGE_W / 2 - cx; gx = true; }
    if (Math.abs(cy - STAGE_H / 2) <= SNAP) { if (drag.mode === 'move') b.y += STAGE_H / 2 - cy; gy = true; }
  }
  guideX.style.display = gx ? 'block' : 'none';
  guideY.style.display = gy ? 'block' : 'none';
  applyBox(selected, b);
  syncSel();
  ev.preventDefault();
}
function onUp() { drag = null; guideX.style.display = 'none'; guideY.style.display = 'none'; }

// -- alignment map ----------------------------------------------------------
function drawMini() {
  if (!miniCtx) return;
  const W = mini.width, H = mini.height, k = W / STAGE_W, c = miniCtx;
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#0d0820'; c.fillRect(0, 0, W, H);
  c.lineWidth = 1;
  for (const { el } of targets()) {
    const b = stageBox(el);
    c.strokeStyle = 'rgba(160,150,220,0.35)';
    c.strokeRect(b.x * k, b.y * k, b.w * k, b.h * k);
  }
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([4, 4]);
  c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();
  c.setLineDash([]);
  if (selected) {
    const b = stageBox(selected);
    const cx = (b.x + b.w / 2) * k, cy = (b.y + b.h / 2) * k;
    const ok = Math.abs(b.x + b.w / 2 - STAGE_W / 2) <= 1 && Math.abs(b.y + b.h / 2 - STAGE_H / 2) <= 1;
    c.strokeStyle = '#f472b6'; c.lineWidth = 2;
    c.strokeRect(b.x * k, b.y * k, b.w * k, b.h * k);
    c.strokeStyle = ok ? '#4ade80' : '#fbbf24'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(W / 2, H / 2); c.stroke();
    c.fillStyle = ok ? '#4ade80' : '#fbbf24';
    c.beginPath(); c.arc(cx, cy, 3, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, W - 1, H - 1);
}

// -- export -----------------------------------------------------------------
/* A dragged ramp is only useful if it can go back into the code, so work out the
   constants that would reproduce where it now sits. The placement in putRamp() is
       left = tip*span + HOLD_X% * frame - width*0.94
   and the game facts needed are fixed: three segments (span = 2 frames), and the
   rider holds at HOLD_X. */
const HOLD_X_UNITS = 0.42 * STAGE_W, SPAN_UNITS = 2 * STAGE_W;
function rampCode(el, b) {
  const act = document.querySelectorAll(CONFIG.stageSelector + ' .pxb')[2];
  if (!act) return null;
  const a = stageBox(act);
  const leftInAct = b.x - a.x;
  const tip = (leftInAct + b.w * 0.94 - HOLD_X_UNITS) / SPAN_UNITS;
  const rise = +((b.h / STAGE_H) * 100).toFixed(2);
  const legA = el.dataset.name === 'ramp-climb';
  return {
    which: el.dataset.name || 'ramp',
    RAMP_RISE: rise,
    RAMP_TIP: +(legA ? tip / 0.5 : (tip - 0.5) / 0.5).toFixed(3),
    crestPercent: +((b.y / STAGE_H) * 100).toFixed(2),
    basePercent: +(((b.y + b.h) / STAGE_H) * 100).toFixed(2),
    note: legA ? 'set RAMP_A_TIP / RAMP_A_RISE' : 'set RAMP_B_TIP / RAMP_B_RISE',
  };
}

function collect() {
  const items = {};
  const seen = {};
  for (const { el, label } of targets()) {
    const b = stageBox(el);
    /* two elements can share a class; suffix rather than silently overwrite --
       the first export lost one of the two ramps this way */
    let k = keyFor(el);
    seen[k] = (seen[k] || 0) + 1;
    if (seen[k] > 1) k += ' (' + seen[k] + ')';
    items[k] = {
      label,
      units: { left: Math.round(b.x), top: Math.round(b.y), width: Math.round(b.w), height: Math.round(b.h) },
      percent: {
        left: +(b.x / STAGE_W * 100).toFixed(2),
        top: +(b.y / STAGE_H * 100).toFixed(2),
        bottom: +((STAGE_H - (b.y + b.h)) / STAGE_H * 100).toFixed(2),
        feetY: +((b.y + b.h) / STAGE_H * 100).toFixed(2),
      },
      centreOffset: [Math.round(b.x + b.w / 2 - STAGE_W / 2), Math.round(b.y + b.h / 2 - STAGE_H / 2)],
      edited: edited.has(el),
      code: el.classList.contains('ramp') ? rampCode(el, b) : undefined,
    };
  }
  return {
    screen: CONFIG.screenName(),
    stage: [STAGE_W, STAGE_H],
    note: 'units are 1920x1080 design units - paste as calc(N * var(--u)). feetY is the ground line a character stands on.',
    items,
  };
}
function cssText() {
  const s = scale();
  let out = '/* screen: ' + CONFIG.screenName() + ' - only what you moved.' + '\n'
          + '   Numbers are design units: calc(N * var(--u)).' + '\n'
          + '   left/top are PARENT-relative, so they paste back as-is. */' + '\n';
  for (const { el } of targets()) {
    if (!edited.has(el)) continue;
    const bx = stageBox(el);
    /* Read left/top back off the inline style rather than using the stage x.
       Emitting stage coords was wrong for anything inside the scrolling act
       layer -- the value cannot be converted back without the camera offset,
       which is exactly the case for the ramps. */
    const lx = Math.round((parseFloat(el.style.left) || 0) / s);
    const ty = Math.round((parseFloat(el.style.top) || 0) / s);
    const c = el.classList.contains('ramp') ? rampCode(el, bx) : null;
    if (c) out += '/* ' + c.which + ' -> ' + c.note + ':  TIP ' + c.RAMP_TIP
                + '   RISE ' + c.RAMP_RISE + '   crest ' + c.crestPercent + '% */' + '\n';
    out += keyFor(el) + ' {' + '\n'
        + '  left:   calc(' + lx + ' * var(--u));' + '\n'
        + '  top:    calc(' + ty + ' * var(--u));' + '\n'
        + '  width:  calc(' + Math.round(bx.w) + ' * var(--u));' + '\n'
        + '  height: calc(' + Math.round(bx.h) + ' * var(--u));' + '\n' + '}' + '\n';
  }
  return out;
}

function download(text, name, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
}

// -- UI ---------------------------------------------------------------------
function mk(tag, style, text) {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text !== undefined) el.textContent = text;
  return el;
}
function btn(label, bg, fn) {
  const b = mk('button', 'display:block;width:100%;margin-top:6px;padding:7px 8px;background:' + bg +
    ';color:#fff;border:none;border-radius:6px;font:600 12px monospace;cursor:pointer;', label);
  b.addEventListener('click', fn);
  return b;
}
function makeDraggable(el, handle, storeKey) {
  handle.style.cursor = 'move';
  let d = null;
  const clamp = () => {
    const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, parseFloat(el.style.left) || 0));
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, parseFloat(el.style.top) || 0));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  };
  handle.addEventListener('pointerdown', (ev) => {
    const r = el.getBoundingClientRect();
    d = { dx: ev.clientX - r.left, dy: ev.clientY - r.top };
    el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
    try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
    ev.preventDefault();
  });
  handle.addEventListener('pointermove', (ev) => {
    if (!d) return;
    el.style.left = (ev.clientX - d.dx) + 'px';
    el.style.top = (ev.clientY - d.dy) + 'px';
    clamp();
  });
  const end = () => {
    if (!d) return; d = null;
    try { localStorage.setItem(storeKey, JSON.stringify({ left: el.style.left, top: el.style.top })); } catch (e) {}
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  try {
    const sv = JSON.parse(localStorage.getItem(storeKey) || 'null');
    if (sv && sv.left) { el.style.left = sv.left; el.style.top = sv.top; el.style.right = 'auto'; el.style.bottom = 'auto'; }
  } catch (e) {}
}

function build() {
  const st = stageEl();
  layer = mk('div', 'position:absolute;inset:0;z-index:9000;display:none;');
  capture = mk('div', 'position:absolute;inset:0;cursor:crosshair;');
  layer.appendChild(capture);
  guideX = mk('div', 'position:absolute;left:50%;top:0;width:2px;height:100%;background:#22d3ee;display:none;pointer-events:none;');
  guideY = mk('div', 'position:absolute;top:50%;left:0;height:2px;width:100%;background:#22d3ee;display:none;pointer-events:none;');
  layer.append(guideX, guideY);
  selBox = mk('div', 'position:absolute;display:none;border:2px solid #f472b6;pointer-events:none;');
  ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((m) => {
    const h = mk('div', 'position:absolute;width:' + HANDLE + 'px;height:' + HANDLE +
      'px;background:#f472b6;border:2px solid #fff;border-radius:3px;pointer-events:auto;');
    h.dataset.handle = m;
    const half = -HANDLE / 2;
    if (m.indexOf('n') >= 0) h.style.top = half + 'px';
    if (m.indexOf('s') >= 0) h.style.bottom = half + 'px';
    if (m.indexOf('w') >= 0) h.style.left = half + 'px';
    if (m.indexOf('e') >= 0) h.style.right = half + 'px';
    if (m === 'n' || m === 's') { h.style.left = '50%'; h.style.marginLeft = half + 'px'; }
    if (m === 'e' || m === 'w') { h.style.top = '50%'; h.style.marginTop = half + 'px'; }
    h.style.cursor = m + '-resize';
    selBox.appendChild(h);
  });
  layer.appendChild(selBox);
  st.appendChild(layer);
  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', onUp);

  panel = mk('div', 'display:none;position:fixed;top:10px;left:10px;width:264px;z-index:10000;' +
    'background:rgba(10,6,28,0.96);border:1px solid #6d28d9;border-radius:10px;padding:11px 13px;' +
    'font-family:monospace;color:#ddd;box-shadow:0 8px 32px rgba(0,0,0,.8);user-select:none;');
  const title = mk('div', 'color:#a78bfa;font-size:13px;font-weight:700;margin:-11px -13px 8px;' +
    'padding:9px 13px 7px;border-bottom:1px solid #3b1f6e;border-radius:10px 10px 0 0;' +
    'background:rgba(124,58,237,0.16);', 'Layout Editor   [E]');
  panel.appendChild(title);
  freezeBtn = btn('⏸  Stop screen', '#7f1d1d', () => setFrozen(!frozen));
  panel.appendChild(freezeBtn);
  panel.appendChild(mk('div', 'color:#c4b5fd;font-size:11px;font-weight:700;margin:10px 0 4px;' +
    'border-top:1px solid #3b1f6e;padding-top:7px;', 'Selected'));
  nameLabel = mk('div', 'color:#fff;font-size:11px;word-break:break-all;margin-bottom:4px;', 'click an element');
  readout = mk('div', 'color:#9ca3af;font-size:11px;line-height:1.7;');
  panel.append(nameLabel, readout);
  const snapRow = mk('div', 'display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;color:#9ca3af;');
  const cb = mk('input'); cb.type = 'checkbox'; cb.checked = true; cb.style.accentColor = '#7c3aed';
  cb.addEventListener('change', () => { snapOn = cb.checked; });
  snapRow.append(cb, mk('span', '', 'snap to centre'));
  panel.appendChild(snapRow);
  panel.appendChild(mk('div', 'color:#6b7280;font-size:10px;line-height:1.5;margin-top:8px;',
    'drag to move · handles to resize · shift-drag a corner keeps the ratio · arrows nudge, shift x10 · Esc deselects'));
  panel.appendChild(mk('div', 'color:#c4b5fd;font-size:11px;font-weight:700;margin:10px 0 4px;' +
    'border-top:1px solid #3b1f6e;padding-top:7px;', 'Export'));
  panel.appendChild(btn('↓  Download layout.json', '#166534', () => {
    download(JSON.stringify(collect(), null, 2), 'layout-' + CONFIG.screenName() + '.json', 'application/json');
  }));
  panel.appendChild(btn('⧉  Copy CSS of edits', '#5b21b6', async () => {
    try { await navigator.clipboard.writeText(cssText()); } catch (e) {}
  }));
  panel.appendChild(btn('↺  Revert my edits', '#7f1d1d', () => {
    edited.forEach((el) => ['left', 'top', 'width', 'height', 'right', 'bottom', 'margin', 'inset', 'position', 'transform']
      .forEach((p) => el.style.removeProperty(p)));
    edited.clear(); select(null);
  }));
  document.body.appendChild(panel);

  const wrap = mk('div', 'display:none;position:fixed;right:10px;bottom:10px;z-index:10000;' +
    'background:rgba(10,6,28,0.96);border:1px solid #6d28d9;border-radius:10px;padding:8px;' +
    'font-family:monospace;box-shadow:0 8px 32px rgba(0,0,0,.8);');
  const miniTitle = mk('div', 'color:#a78bfa;font-size:10px;font-weight:700;margin:-8px -8px 6px;' +
    'padding:6px 8px 5px;border-bottom:1px solid #3b1f6e;border-radius:10px 10px 0 0;' +
    'background:rgba(124,58,237,0.16);', 'ALIGNMENT MAP');
  wrap.appendChild(miniTitle);
  mini = document.createElement('canvas');
  mini.width = 288; mini.height = Math.round(288 * STAGE_H / STAGE_W);
  mini.style.cssText = 'display:block;border-radius:4px;';
  wrap.appendChild(mini);
  miniCtx = mini.getContext('2d');
  document.body.appendChild(wrap);
  panel._mini = wrap;
  makeDraggable(panel, title, CONFIG.panelPosKey);
  makeDraggable(wrap, miniTitle, CONFIG.mapPosKey);
}

function openEditor() {
  open = true;
  layer.style.display = 'block';
  panel.style.display = 'block';
  panel._mini.style.display = 'block';
  setFrozen(true);
  select(null);
  drawMini();
}
function closeEditor() {
  open = false;
  layer.style.display = 'none';
  panel.style.display = 'none';
  panel._mini.style.display = 'none';
  setFrozen(false);
  select(null);
}

/* DEV ONLY. Ungated, this built its panel and a 288x162 alignment-map canvas into
   every shipped page load, and bound E to open it. */
if (!IS_DEV) return;

build();
window.addEventListener('keydown', (ev) => {
  if (/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  if (ev.key === 'e' || ev.key === 'E') {
    if (ev.shiftKey) return;
    open ? closeEditor() : openEditor();
    return;
  }
  if (!open) return;
  if (ev.key === 'Escape') { select(null); return; }
  if (selected && ev.key.indexOf('Arrow') === 0) {
    const step = ev.shiftKey ? 10 : 1, b = stageBox(selected);
    if (ev.key === 'ArrowLeft') b.x -= step;
    if (ev.key === 'ArrowRight') b.x += step;
    if (ev.key === 'ArrowUp') b.y -= step;
    if (ev.key === 'ArrowDown') b.y += step;
    applyBox(selected, b); syncSel(); ev.preventDefault();
  }
});
window.addEventListener('resize', () => { if (open) { syncSel(); drawMini(); } });
console.log('[layout editor] press E');
})();
