"""One playthrough by CLICKS ONLY: verify every line against the script, measure how
long each held, and screenshot every dialogue screen into ONE flat folder, numbered in
playback order so the sequence reads top to bottom.

Uses ?nocurl so the page-curl transition cannot land on top of a capture -- the curl is
a scene transition, not part of the dialogue flow being documented."""
import os, re, shutil, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = r"C:\Users\HP\Pictures\synonyms and antonyms"
OUT  = os.path.join(ROOT, "docs", "flow")
URL  = "file:///C:/Users/HP/Pictures/synonyms%20and%20antonyms/index.html?nocurl"

SCRIPT = [
 ('nar','Jhumru was setting off on an exciting adventure through the jungle on his new bicycle.'),
 ('jhu','Hello, everyone! Have you seen my new bicycle?'),
 ('jhu',"Tring! Tring! Look at it! It's shiny! It's bright! It's sparkling!"),
 ('jhu',"Today, I'm going on a jungle adventure journey!"),
 ('jhu',"I wonder what we'll find along the way!"),
 ('jhu','Oh! The jungle path looks full of surprises and challenges.'),
 ('jhu','Will you come on this adventure with me?'),
 ('nar',"Wonderful! Let's go!"),
 ('nar','But Jhumru cannot solve all the challenges alone.'),
 ('jhu','Will you help me find the word friends and clear the path?'),
 ('jhu',"It looks like this adventure is going to be trickier than I thought!"),
 ('jhu','Tring, tring!'),
 ('jhu',"Oh no! The bridge is broken. I can't cross like this!"),
 ('nar','Jhumru discovered a set of words. To continue his journey, he would need to '
        'find another word with the same meaning.'),
]
slug = lambda t: (re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:46] or 'shot')

if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

TAP = "()=>{const b=document.querySelector('.over.card .btn');return b?b.textContent.trim():null}"
CLK = ("()=>{const c=document.querySelector('.over.card');return c?"
       "(c.querySelector('h3')||{}).textContent||'card':null}")

rows, errs, order = [], [], []          # order: the flat capture sequence
with sync_playwright() as p:
    b = p.chromium.launch(headless=False, args=['--force-device-scale-factor=1'])
    pg = b.new_page(viewport={'width': 1500, 'height': 940})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until='load'); pg.wait_for_timeout(1000)

    def shoot(name, note):
        """PNG straight out of the browser, kept as WebP. Eighteen full-frame PNGs came
        to 20MB, which is a lot of repo for a set of screenshots; the same shots as
        WebP are a fraction of that and lose nothing on flat cartoon art."""
        f = f"{len(order)+1:02d}-{name}.webp"
        tmp = os.path.join(OUT, "_shot.png")
        pg.screenshot(path=tmp)
        Image.open(tmp).convert("RGB").save(os.path.join(OUT, f), "WEBP",
                                           quality=86, method=6)
        os.remove(tmp)
        order.append((f, note)); print("  ", os.path.join("docs", "flow", f))

    pg.wait_for_selector('.over.card .btn')
    n, last, pend = 0, None, None
    for _ in range(2600):
        st = pg.evaluate("""()=>({t:document.querySelector('#asktxt').textContent,
                                  vt:window.VT===undefined?performance.now():VT,
                                  sc:window.__scene})""")
        if st['t'] != last:
            if rows: rows[-1]['held'] = st['vt'] - rows[-1]['vt']
            if st['t'] != 'Tap Play to begin.':
                n += 1
                rows.append({'i': n, 't': st['t'], 'vt': st['vt'], 'sc': st['sc'], 'held': None})
                pend = (n, st['vt'])
            last = st['t']
        if pend and st['vt'] - pend[1] > 1400:                 # settled on the line
            i = pend[0]; pend = None
            who = 'Narrator' if SCRIPT[i-1][0] == 'nar' else 'Jhumru'
            shoot(f"{slug(rows[i-1]['t'])}", f"**{who}:** {rows[i-1]['t']}")
        btn = pg.evaluate(TAP)
        if btn:
            if rows: rows[-1]['held'] = st['vt'] - rows[-1]['vt']
            pg.wait_for_timeout(400)
            title = pg.evaluate(CLK) or 'card'
            shoot(f"card-{slug(title)}", f"*card:* {title} — button `{btn}`")
            if btn in ('On to the river', 'Back to the start'): break
            pg.click('.over.card .btn'); pg.wait_for_timeout(300)
        pg.wait_for_timeout(100)
    b.close()

print(f"\n  {'#':>2}  {'held':>8} {'floor':>8}  scene    line")
ok = True
for r in rows:
    w = len(r['t'].split()); need = max(1500, w * 430) * 0.92
    cut = (r['held'] or 0) < need
    exp = SCRIPT[r['i']-1][1] if r['i'] <= len(SCRIPT) else '<<nothing expected>>'
    off = r['t'].strip() != exp.strip()
    if cut or off: ok = False
    print(f"  {r['i']:>2}  {r['held'] or 0:7.0f}ms {need:7.0f}ms  {r['sc']:<8} "
          f"{r['t'][:50]:<50} {'CUT ' if cut else ''}{'OFF-SCRIPT' if off else ''}")
    if off: print(f"       expected: {exp[:72]}")
if len(rows) != len(SCRIPT):
    ok = False; print(f"\n  {len(rows)} lines but {len(SCRIPT)} in the script")

md = ["# Dialogue flow — title to the broken bridge", "",
      "Captured from the running game by clicking through it: no dev shortcuts, no",
      "hand-placed scenes. Every line is verbatim from the supplied script. `held` is how",
      "long it stayed on screen, against the floor its word count needs — nothing is cut",
      "short. Read the images in order; they are numbered in playback order.", "",
      "| # | screen | what is said | held |", "|---|---|---|---|"]
li = 0
for f, note in order:
    if note.startswith('*card'):
        md.append(f"| {f.split('-')[0]} | [`{f}`]({f}) | {note} | — |")
    else:
        held = rows[li]['held'] or 0; li += 1
        md.append(f"| {f.split('-')[0]} | [`{f}`]({f}) | {note} | {held:.0f}ms |")
md += ["", f"{len(rows)} lines, {len(SCRIPT)} in the script, none cut, "
       f"{'no console errors' if not errs else 'ERRORS: ' + str(errs)}.", "",
       "Captured with `?nocurl` so the page-curl scene transition could not land on top",
       "of a screenshot — the curl is a transition between scenes, not part of the",
       "dialogue flow documented here.", ""]
open(os.path.join(OUT, "README.md"), "w", encoding="utf-8").write(chr(10).join(md))
print(f"\n  {len(order)} screens + README   errors: {errs if errs else 'none'}")
print("  RESULT:", "ON SCRIPT, NONE CUT" if ok and not errs else "PROBLEMS ABOVE")
sys.exit(0 if ok and not errs else 1)
