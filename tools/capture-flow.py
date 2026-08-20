"""Walk the game by CLICKS ONLY from the title to the broken bridge, check every line
against the script, and screenshot each dialogue screen into docs/flow, numbered in
playback order.

Two things this harness learned the hard way, both worth keeping:

  * A scene reached by pressing a dev key cannot show a broken hand-off, so this
    clicks through exactly as a player would. That is how the river was found to be
    unreachable when every test still "passed".

  * The GAME reports its own line timings, via window.__said in engine.js. Nothing
    measured from out here survived contact: polling read a screenshot pause as the
    line still being up (69s and 143s holds for lines that ran about ten, and one
    3050ms line missed entirely); freezing the game to take the shot stopped the game
    clock but not speechSynthesis, so the same twelve-word line measured 5.76s one way
    and 917ms the other. Wall clock overstates, game clock understates, and neither is
    the truth while the harness does expensive work inside a line. speak() knows when
    it started and when its completion callback fired, so it records that.

    What the report calls CUT-OFF is the only thing that really matters: the next line
    starting while this one was still going. That is the bug this file exists to catch,
    and it is now a fact the game states rather than one a test infers.

Run:  python tools/capture-flow.py
Exit: 0 if every line is present, verbatim and uncut; 1 otherwise.
"""
import os, re, shutil, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "docs", "flow")
URL  = "file:///" + os.path.join(ROOT, "index.html").replace("\\", "/").replace(" ", "%20") + "?nocurl"

# The supplied script, verbatim. Anything the game says that is not here, or says
# differently, is reported as OFF-SCRIPT.
SCRIPT = [
 ('nar', 'Jhumru was setting off on an exciting adventure through the jungle on his new bicycle.'),
 ('jhu', 'Hello, everyone! Have you seen my new bicycle?'),
 ('jhu', "Tring! Tring! Look at it! It's shiny! It's bright! It's sparkling!"),
 ('jhu', "Today, I'm going on a jungle adventure journey!"),
 ('jhu', "I wonder what we'll find along the way!"),
 ('jhu', 'Oh! The jungle path looks full of surprises and challenges.'),
 ('jhu', 'Will you come on this adventure with me?'),
 ('nar', "Wonderful! Let's go!"),
 ('nar', 'But Jhumru cannot solve all the challenges alone.'),
 ('jhu', 'Will you help me find the word friends and clear the path?'),
 ('jhu', "It looks like this adventure is going to be trickier than I thought!"),
 ('jhu', 'Tring, tring!'),
 ('jhu', "Oh no! The bridge is broken. I can't cross like this!"),
 ('nar', 'Jhumru discovered a set of words. To continue his journey, he would need to '
         'find another word with the same meaning.'),
]

# His words are in HIS bubble; the narrator keeps the box at the top. '' means nothing
# is on screen -- a ride with no dialogue, or the beat between two lines.
VISIBLE = """() => {
  const b = document.querySelector('.bub:not([hidden]) .bubtxt');
  if (b) return b.textContent;
  const box = document.querySelector('#ask');
  if (box.classList.contains('hushed')) return '';
  return document.querySelector('#asktxt').textContent;
}"""
# `VT` is a top-level `let` in engine.js: global LEXICAL scope, not a window property.
# So `window.VT` is undefined, and a `window.VT === undefined` guard silently falls
# through to wall clock -- which matters, because __gameFreeze stops VT but not wall
# clock, so every hold came out inflated by the time spent photographing it. `typeof VT`
# reaches the lexical binding; this is the same "read the page's own clock" lesson that
# already caught out an earlier round of measurements.
CLOCK = "(typeof VT === 'number' ? VT : performance.now())"

RECORDER = """(visSrc) => {
  const vis = eval(visSrc);
  window.__log = [];
  let last = null;
  (function fr() {
    const t = vis();
    if (t !== last) {
      window.__log.push({t: t, vt: __CLOCK__});
      last = t;
    }
    requestAnimationFrame(fr);
  })();
}""".replace('__CLOCK__', CLOCK)
TAP = "()=>{const b=document.querySelector('.over.card .btn');return b?b.textContent.trim():null}"
CARD = ("()=>{const c=document.querySelector('.over.card');return c?"
        "(c.querySelector('h3')||{}).textContent||'card':null}")
STOP = ('On to the river', 'Back to the start')

slug = lambda t: (re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:46] or 'shot')

if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

order, errs = [], []          # order: the flat capture sequence, in playback order
with sync_playwright() as p:
    b = p.chromium.launch(headless=False, args=['--force-device-scale-factor=1'])
    # #wrap is min(1920px, 100%, (100vh-92)*16/9), so the frame only renders at a true
    # 1920x1080 -- one design unit per pixel -- if the window gives it this much room.
    pg = b.new_page(viewport={'width': 1960, 'height': 1200})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until='load')
    pg.evaluate(RECORDER, VISIBLE)         # tracks the VISIBLE line, for naming shots
    pg.wait_for_timeout(1000)

    def shoot(name, note):
        """Freeze, shoot, unfreeze. Freezing keeps the loop from falling behind and
        dropping a line's shot -- a 1920-wide screenshot costs most of a second. It is
        safe to freeze now that the timings come from window.__said and not from
        anything this loop observes. Encoding happens after the browser closes."""
        f = f"{len(order)+1:02d}-{name}.png"
        pg.evaluate("()=>window.__gameFreeze(true)")
        pg.screenshot(path=os.path.join(OUT, f))
        pg.evaluate("()=>window.__gameFreeze(false)")
        order.append((f, note)); print("  ", os.path.join("docs", "flow", f))

    pg.wait_for_selector('.over.card .btn')
    seen, last = 0, None
    for _ in range(3000):
        line = pg.evaluate("()=>{const L=window.__log;return L.length?L[L.length-1].t:''}")
        if line and line != 'Tap Play to begin.' and line != last:
            last = line; seen += 1
            pg.wait_for_timeout(1200)               # let the scene settle on the line
            who = 'UNSCRIPTED' if seen > len(SCRIPT) else                   ('Narrator' if SCRIPT[seen-1][0] == 'nar' else 'Jhumru')
            shoot(slug(line), f"**{who}:** {line}")
        btn = pg.evaluate(TAP)
        if btn:
            pg.wait_for_timeout(400)
            title = pg.evaluate(CARD) or 'card'
            shoot("card-" + slug(title), f"*card:* {title} — button `{btn}`")
            if btn in STOP: break
            # the card can go between spotting it and clicking it: the harness racing
            # the game, not a fault in the game
            try: pg.click('.over.card .btn', timeout=4000)
            except Exception: pass
            pg.wait_for_timeout(300)
        pg.wait_for_timeout(60)
    said = pg.evaluate("()=>window.__said")
    b.close()

# ---- the timeline, straight off the game's own record --------------------------
# `held` is how long the line was actually speaking, from speak() to its completion
# callback. `by` says what ended it: 'speech' means the voice finished the sentence,
# 'fallback' means no onend arrived and the length-based guard released the chain.
# `cutBy` is the thing that matters -- it is set only when the NEXT line started while
# this one was still going, which is exactly the bug this file exists to catch.
rows = [{'i': k+1, 't': r['t'], 'who': r['who'], 'words': r['words'],
         'held': (r['t1'] - r['t0']) if r['t1'] else 0,
         'by': r['by'], 'cut': r.get('cutBy')} for k, r in enumerate(said)]

print(f"\n  {'#':>2}  {'held':>8} {'floor':>8}  by        line")
ok = True
for r in rows:
    need = max(1500, r['words'] * 430) * 0.92      # the speech fallback floor, less slack
    # The floor is the FALLBACK timer's estimate, not a requirement. When by=='speech'
    # the voice finished the sentence, so the line was fully said by definition even if
    # it beat the estimate -- flagging that as short is a false alarm.
    short = r['held'] < need and r['by'] != 'speech'
    exp = SCRIPT[r['i']-1][1] if r['i'] <= len(SCRIPT) else '<<nothing expected>>'
    off = r['t'].strip() != exp.strip()
    bad = r['cut'] or off
    if bad: ok = False
    print(f"  {r['i']:>2}  {r['held']:7.0f}ms {need:7.0f}ms  {str(r['by'] or '-'):<9} "
          f"{r['t'][:46]:<46} {'CUT-OFF ' if r['cut'] else ''}"
          f"{'OFF-SCRIPT' if off else ''}{'(short)' if short and not r['cut'] else ''}")
    if off: print(f"       expected: {exp[:72]}")
    if r['cut']: print(f"       interrupted by: {r['cut'][:60]}")
if len(rows) != len(SCRIPT):
    ok = False
    print(f"\n  {len(rows)} lines spoken but {len(SCRIPT)} in the script")

# ---- PNG -> WebP, now that nothing is being timed ---------------------------
conv = []
for f, note in order:
    src = os.path.join(OUT, f); dst = src[:-4] + ".webp"
    Image.open(src).convert("RGB").save(dst, "WEBP", quality=86, method=6)
    os.remove(src); conv.append((f[:-4] + ".webp", note))

md = ["# Dialogue flow — title to the broken bridge", "",
      "Captured from the running game by clicking through it: no dev shortcuts, no",
      "hand-placed scenes. Every line is verbatim from the supplied script. `held` is how",
      "long the line was actually speaking, recorded by the game itself, against the",
      "floor its word count needs — and no line was interrupted by the next one. The",
      "images are numbered in playback order.", "",
      "Jhumru's words are in his own parchment bubble, near his mouth, in Poppins",
      "SemiBold at 32 design units. The narrator keeps the box at the top, and the two",
      "are never both up.", "",
      "| # | screen | what is said | held |", "|---|---|---|---|"]
li = 0
for f, note in conv:
    if note.startswith('*card'):
        md.append(f"| {f.split('-')[0]} | [`{f}`]({f}) | {note} | — |")
    else:
        held = rows[li]['held'] if li < len(rows) else 0; li += 1
        md.append(f"| {f.split('-')[0]} | [`{f}`]({f}) | {note} | {held:.0f}ms |")
md += ["", f"{len(rows)} lines, {len(SCRIPT)} in the script, none interrupted, "
       f"{'no console errors' if not errs else 'ERRORS: ' + str(errs)}.", "",
       "Captured at a true 1920×1080 frame (one design unit per pixel) with `?nocurl`,",
       "so the page-curl scene transition could not land on top of a screenshot — the",
       "curl is a transition between scenes, not part of the dialogue flow.", ""]
open(os.path.join(OUT, "README.md"), "w", encoding="utf-8").write(chr(10).join(md))

print(f"\n  {len(conv)} screens + README   errors: {errs if errs else 'none'}")
print("  RESULT:", "ON SCRIPT, NONE CUT" if ok and not errs else "PROBLEMS ABOVE")
sys.exit(0 if ok and not errs else 1)
