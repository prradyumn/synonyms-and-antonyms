"""QA sweep of Word Tree in a HEADED browser.

Covers what tools/capture-flow.py does not: the opening page-curl, failed requests,
resize while a scene is live, the input edges, reduced motion, and whether the dev
surfaces stay out of a deployed build.

Three checks in the first version of this file were wrong, and the corrections are
worth keeping in view:

  * fetch() is blocked on file:// by CORS, so 40 present assets read as missing.
    Image()/Audio() loading works on file:// and is what the game does anyway.
  * `document.querySelector('canvas')` matched the DEV LAYOUT EDITOR's hidden
    alignment map -- 288x162, built at page load -- and reported it as a leaked curl
    canvas. Scope to `#frame canvas.curl`.
  * The curl is the OPENING reveal, fired once from main.js at boot. Clicking Play and
    then looking for it finds nothing, because it finished two seconds earlier.

Run:  python tools/qa.py
Exit: 0 if nothing FAILs.
"""
import os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE_URL = "file:///" + ROOT.replace("\\", "/").replace(" ", "%20") + "/index.html"
SHOT = os.environ.get('TEMP', ROOT)

results = []
def check(name, ok, detail="", warn=False):
    tag = "PASS" if ok else ("WARN" if warn else "FAIL")
    results.append((name, tag))
    print(f"  [{tag}] {name}" + (f"  -- {detail}" if detail else ""))

# ---- probes (kept as plain strings; no backslash escapes, deliberately) ------
FRAME = "() => { const f = document.querySelector('#frame').getBoundingClientRect();" \
        " return {w: Math.round(f.width), h: Math.round(f.height)}; }"

# Only things that could visibly sit outside the frame. Parallax layers are four
# frames wide by design and #frame clips them, so they are not interesting here.
STRAY = """() => {
  const f = document.querySelector('#frame').getBoundingClientRect(), out = [];
  for (const sel of ['#ask', '.bub', '.over.card', '.btn', '.cyc', '.trailmap'])
    for (const e of document.querySelectorAll(sel)) {
      if (e.hidden || !e.getClientRects().length) continue;
      const r = e.getBoundingClientRect();
      const o = {left: f.left - r.left, right: r.right - f.right,
                 top: f.top - r.top, bottom: r.bottom - f.bottom};
      const worst = Math.max(o.left, o.right, o.top, o.bottom);
      if (worst > 2) out.push({sel: sel, px: Math.round(worst),
        side: Object.keys(o).find(k => o[k] === worst)});
    }
  return out;
}"""
RIDER = """() => {
  const f = document.querySelector('#frame').getBoundingClientRect();
  const c = document.querySelector('.cyc');
  if (!c) return null;
  const r = c.getBoundingClientRect(), sh = c.querySelector('.cycsh');
  return {bottom: +(((r.bottom - f.top) / f.height) * 100).toFixed(1),
          shadow: !!sh};
}"""
FPS = """(ms) => new Promise(r => { let n = 0; const t0 = performance.now();
  (function f(){ n++; performance.now() - t0 < ms ? requestAnimationFrame(f)
    : r(Math.round(n / ((performance.now() - t0) / 1000))); })(); })"""
CURL = """() => ({
  canvas: document.querySelectorAll('#frame canvas.curl').length,
  clip: (document.querySelector('#frame').style.clipPath || '-').slice(0, 24),
  busy: window.openingCurl ? window.openingCurl.busy() : null,
  playDisabled: (document.querySelector('.over.card .btn') || {}).disabled})"""
# Image()/Audio() rather than fetch(), which CORS blocks on file://
ASSETS = """async () => {
  const urls = [...new Set([...Object.values(A), ...Object.values(FACES),
                            ...Object.values(RIDER).map(m => m.url)])];
  const load = u => new Promise(r => {
    if (u.match(/[.](mp3|ogg|wav)$/i)) {
      const a = new Audio(); a.oncanplaythrough = () => r(null);
      a.onerror = () => r(u); a.src = u; a.load(); setTimeout(() => r(null), 4000);
      return;
    }
    const i = new Image(); i.onload = () => r(null); i.onerror = () => r(u); i.src = u;
  });
  const bad = (await Promise.all(urls.map(load))).filter(Boolean);
  return {total: urls.length, missing: bad};
}"""
DEVSURF = """() => ({
  flag: (typeof IS_DEV === 'boolean') ? IS_DEV : 'undefined',
  canvases: document.querySelectorAll('body canvas').length,
  editorPanel: [...document.querySelectorAll('body>div')]
                 .some(d => /ALIGNMENT MAP/i.test(d.textContent))})"""


def page(b, url, w=1960, h=1200, media=None, from_disk=False):
    ctx = b.new_context(viewport={'width': w, 'height': h})
    pg = ctx.new_page()
    errs, fails = [], []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('requestfailed', lambda r: fails.append(r.url.split('/')[-1]))
    pg.on('response', lambda r: fails.append(str(r.status) + ' ' + r.url.split('/')[-1])
          if r.status >= 400 and 'favicon' not in r.url else None)
    if from_disk:
        def serve(route, request):
            rel = request.url.split('wordtree.test/')[-1].split('?')[0]
            p = os.path.join(ROOT, rel.replace('/', os.sep))
            if os.path.isfile(p):
                ct = ('text/javascript' if p.endswith('.js') else
                      'text/css' if p.endswith('.css') else
                      'text/html' if p.endswith('.html') else
                      'image/webp' if p.endswith('.webp') else 'application/octet-stream')
                route.fulfill(status=200, body=open(p, 'rb').read(),
                              headers={'content-type': ct, 'cache-control': 'no-store'})
            else:
                route.fulfill(status=404, body=b'')
        pg.route("**/*", serve)
    if media:
        pg.emulate_media(**media)
    return ctx, pg, errs, fails


with sync_playwright() as p:
    b = p.chromium.launch(headless=False, args=['--force-device-scale-factor=1'])

    print("\nA. Boot, assets, fonts")
    ctx, pg, errs, fails = page(b, FILE_URL)
    pg.goto(FILE_URL, wait_until='load'); pg.wait_for_timeout(3000)
    check("no console errors on boot", not errs, str(errs[:2]))
    check("no failed or 404 requests", not fails, str(fails[:4]))
    fb = pg.evaluate(FRAME)
    check("frame renders at a true 1920x1080", fb['w'] == 1920, str(fb))
    check("Poppins SemiBold loaded",
          pg.evaluate("() => document.fonts.check('600 32px Poppins')"))
    a = pg.evaluate(ASSETS)
    check("every declared asset loads", not a['missing'],
          f"{a['total']} declared, {len(a['missing'])} missing {a['missing'][:3]}")
    ctx.close()

    print("\nB. The opening curl (at boot, where it actually lives)")
    for label, media in [("normal", None), ("reduced motion", {'reduced_motion': 'reduce'})]:
        ctx, pg, errs, fails = page(b, FILE_URL, media=media)
        pg.goto(FILE_URL, wait_until='commit')
        pg.wait_for_timeout(150)
        early = pg.evaluate(CURL)
        pg.wait_for_timeout(2600)
        late = pg.evaluate(CURL)
        if label == "normal":
            check("curl covers the frame while it runs",
                  early['canvas'] == 1 and early['playDisabled'] is True, str(early))
            check("curl clips progressively", early['clip'].startswith('inset'), str(early))
        else:
            check("reduced motion skips the reveal",
                  late['canvas'] == 0 and late['busy'] is False, str(late))
        check(f"{label}: curl cleans up and enables Play",
              late['canvas'] == 0 and late['clip'] == '-' and late['playDisabled'] is False,
              str(late))
        check(f"{label}: scene is up afterwards",
              pg.evaluate("() => document.querySelectorAll('#stage .pxb, #stage .pxf').length") >= 5)
        check(f"{label}: no errors through the reveal", not errs, str(errs[:2]))
        ctx.close()

    print("\nC. Each scene: errors, frame rate, stray boxes, rider on the ground")
    for key, name in [('b', 'gorge'), ('r', 'river')]:
        ctx, pg, errs, fails = page(b, FILE_URL + "?nocurl")
        pg.goto(FILE_URL + "?nocurl", wait_until='load'); pg.wait_for_timeout(900)
        pg.click('.over.card .btn'); pg.wait_for_timeout(300)
        pg.keyboard.press(key); pg.wait_for_timeout(3000)
        check(f"{name}: reachable by dev key", pg.evaluate("()=>window.__scene") == name)
        fps = pg.evaluate(FPS, 2500)
        check(f"{name}: frame rate at least 30fps", fps >= 30, f"{fps} fps", warn=fps >= 24)
        stray = pg.evaluate(STRAY)
        check(f"{name}: nothing pushed outside the frame", not stray, str(stray[:2]))
        rd = pg.evaluate(RIDER)
        check(f"{name}: rider on the ground with a shadow",
              bool(rd) and 50 <= rd['bottom'] <= 90 and rd['shadow'], str(rd))
        check(f"{name}: no console errors", not errs, str(errs[:2]))
        ctx.close()

    print("\nD. Input edges")
    ctx, pg, errs, fails = page(b, FILE_URL + "?nocurl")
    pg.goto(FILE_URL + "?nocurl", wait_until='load'); pg.wait_for_timeout(900)
    for _ in range(5):
        try: pg.click('.over.card .btn', timeout=400)
        except Exception: pass
    pg.wait_for_timeout(2500)
    n = pg.evaluate("() => ({riders: document.querySelectorAll('.cyc').length,"
                    " cards: document.querySelectorAll('.over.card').length})")
    check("hammering Play does not double the scene",
          n['riders'] <= 1 and n['cards'] == 0, str(n))
    pg.click('#spk'); pg.wait_for_timeout(400)
    check("replay button does not throw", not errs, str(errs[:2]))
    pg.click('#mute'); pg.wait_for_timeout(250); pg.click('#mute'); pg.wait_for_timeout(250)
    check("mute toggles without throwing", not errs, str(errs[:2]))
    pg.mouse.click(300, 900); pg.wait_for_timeout(2500)
    check("tap-to-skip jumps to the hurdle",
          pg.evaluate("()=>window.__scene") == 'gorge')
    check("no errors through the input edges", not errs, str(errs[:2]))
    ctx.close()

    print("\nE. Layout under resize")
    ctx, pg, errs, fails = page(b, FILE_URL + "?nocurl")
    pg.goto(FILE_URL + "?nocurl", wait_until='load'); pg.wait_for_timeout(900)
    pg.click('.over.card .btn'); pg.wait_for_timeout(300)
    pg.keyboard.press('b'); pg.wait_for_timeout(3500)
    before = pg.evaluate(RIDER)
    pg.set_viewport_size({'width': 1000, 'height': 700}); pg.wait_for_timeout(900)
    after = pg.evaluate(RIDER)
    drift = abs(before['bottom'] - after['bottom'])
    check("rider holds its ground height across a resize", drift < 2.0,
          f"{before['bottom']}% -> {after['bottom']}%  (drift {drift:.1f}%)")
    check("nothing escapes the small frame", not pg.evaluate(STRAY), str(pg.evaluate(STRAY)[:2]))
    fb = pg.evaluate(FRAME)
    check("small frame keeps 16:9", abs(fb['w'] / fb['h'] - 16 / 9) < 0.02, str(fb))
    check("no errors through resizing", not errs, str(errs[:2]))
    ctx.close()

    print("\nF. Dev surfaces must not reach a deployed build")
    # served from a hostname that is neither localhost nor a file, straight off disk so
    # the browser cache cannot mask a source change
    for label, url, want in [("deployed", "http://wordtree.test/index.html?nocurl", False),
                             ("deployed + ?dev", "http://wordtree.test/index.html?nocurl&dev", True),
                             ("local file://", FILE_URL + "?nocurl", True)]:
        disk = url.startswith('http')
        ctx, pg, errs, fails = page(b, url, w=1200, h=760, from_disk=disk)
        pg.goto(url, wait_until='load'); pg.wait_for_timeout(1200)
        st = pg.evaluate(DEVSURF)
        pg.click('.over.card .btn'); pg.wait_for_timeout(2200)
        was = pg.evaluate("()=>window.__scene")
        pg.keyboard.press('b'); pg.wait_for_timeout(700)
        now = pg.evaluate("()=>window.__scene")
        pg.keyboard.press('e'); pg.wait_for_timeout(500)
        ed = pg.evaluate("() => [...document.querySelectorAll('body>div')]"
                         ".some(d => /ALIGNMENT MAP/i.test(d.textContent))")
        jumped = was != now
        check(f"{label}: IS_DEV is {want}", st['flag'] is want, str(st))
        check(f"{label}: jump key B {'works' if want else 'does nothing'}",
              jumped is want, f"{was} -> {now}")
        check(f"{label}: editor {'opens' if want else 'is absent'}", ed is want)
        check(f"{label}: no errors", not errs, str(errs[:2]))
        ctx.close()
    b.close()

print("\n" + "=" * 72)
bad = [n for n, r in results if r == "FAIL"]
warn = [n for n, r in results if r == "WARN"]
print(f"  {len(results)} checks: {len(results) - len(bad) - len(warn)} pass, "
      f"{len(warn)} warn, {len(bad)} FAIL")
for n in bad: print("    FAIL  " + n)
for n in warn: print("    WARN  " + n)
sys.exit(1 if bad else 0)
