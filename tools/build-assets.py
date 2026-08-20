#!/usr/bin/env python3
"""Regenerate assets/bg and assets/chars from assets/source.

    pip install pillow numpy
    python3 tools/build-assets.py
"""
from PIL import Image
import numpy as np, pathlib, sys, math, os, subprocess
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, BG, CH = ROOT/'assets/source', ROOT/'assets/bg', ROOT/'assets/chars'
W, H = 1920, 1080        # game frame, 16:9
# NOTE: assets/source backgrounds are only 1672x941 (river_deep is a
# 1086x1448 portrait), so 1920 output is a ~15% upscale. Re-export the
# sources at 1920+ to recover real detail.
CHAR_H = {'monty': 600, 'jhumru': 600, 'tez': 480}

BGS = {
    'bridge_broken': 'bg_bridge_broken.png', 'bridge_fixed': 'bg_bridge_fixed.png',
    'river_deep': 'bg_river_deep.png',       'river_shallow': 'bg_river_shallow.png',
    'rockwall': 'bg_rockwall.png',           'cave': 'bg_cave.png',
    'tree': 'bg_tree.png',                   'falls': 'bg_falls.png',
    'map': 'bg_map.png',
}
CHARS = {
    'jhumru': 'char_jhumru_elephant.png',
    'monty':  'char_monty_monkey.png',
    'tez':    'char_tez_tortoise.png',
}
# Animated loops. The raw GIFs are 1920x1080 with ~91% empty canvas, which ships
# 3x the bytes and makes positioning fiddly -- crop to the character's union
# bbox across all frames so left/top address the character itself.
# {output stem: (raw gif in assets/chars, output height px)}
# {output stem: (raw gif in assets/chars, output height, per-frame ms or None)}
# The ms override exists because monkey-side-walk-loop ships with every frame
# delay set to 0, which browsers play at default speed or as fast as they can.
LOOPS = {
    'jhumru_cycle': ('cycling jhumru.gif', 440, None),
    'monty_idle':   ('breathing monty.gif', 440, None),
    'jhumru_idle':  ('brreacthing jhumru.gif', 440, None),
    'monty_walk':   ('monkey-side-walk-loop (1).gif', 440, 90),
}
# 'talking jhumru.gif' is also on disk and builds fine, but Monty and Tez
# have no talk loop -- wiring only Jhumru would read as a bug, not a feature.
# An animated WebP cannot be paused from JS, so loops that need a stopped pose
# also emit a one-frame still: {output stem: frame index to freeze}
LOOP_STILLS = {'jhumru_cycle': 0}

def cover(im, tw, th):
    s = max(tw / im.width, th / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((l, t, l + tw, t + th))

def cut_white(im, thresh=242):
    a = np.array(im.convert('RGBA'))
    a[:, :, 3] = np.where((a[:, :, :3].astype(int) > thresh).all(axis=2), 0, a[:, :, 3])
    im = Image.fromarray(a)
    ys, xs = np.where(np.array(im)[:, :, 3] > 10)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

# Parallax layers for the scrolling opening. Two repairs are applied here rather
# than asked for again in the art:
#   * the tileable layers do NOT tile as delivered -- left and right edges differ
#     by ~10x a normal adjacent-column step -- so each is mirrored, [A|flip(A)],
#     which makes both the internal join and the wrap join exact by construction.
#   * px_near_fringe is a vignette (bottom grass AND top-corner leaves with a gap
#     between), not the bottom strip that was specced. It is split at the empty
#     band into two layers so each can sit at the edge it belongs to.
PX_FRAME = (1920, 1080)
FRINGE_CUT = 225            # inside the fully-transparent band, rows 180-270
PX_TILE = ['far_sky', 'mid_canopy']
PX_SEG = ['act_bank', 'act_bridge', 'act_clearing']


def mirror_x(im):
    """[A | flip(A)] -- tiles seamlessly at both the join and the wrap. Invisible
    on uniform foliage, but it makes a DISTINCT shape read as symmetrical, so
    sparse layers use roll_x instead."""
    out = Image.new('RGBA', (im.width * 2, im.height))
    out.paste(im, (0, 0))
    out.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (im.width, 0))
    return out


def roll_x(im):
    """[A' | A'] where A' is A rolled half a width. near_leaves carries its
    clusters hard against both edges with an empty middle, so rolling moves them
    to the centre and leaves both edges transparent -- which tiles for free, with
    no mirror symmetry to notice."""
    a = np.array(im)
    a = np.roll(a, im.width // 2, axis=1)
    one = Image.fromarray(a, 'RGBA')
    out = Image.new('RGBA', (im.width * 2, im.height))
    out.paste(one, (0, 0)); out.paste(one, (im.width, 0))
    return out


def build_audio():
    """Normalise the CC0 audio in assets/source/audio_raw into assets/audio.

    The raw downloads are badly under-level -- the forest ambience measures RMS
    -51 dBFS, which at any sane element volume is inaudible. HTMLAudioElement
    volume cannot exceed 1.0, so the gain has to be baked in here rather than
    worked around at runtime. Requires ffmpeg on PATH; skipped if absent."""
    import shutil, subprocess
    if not shutil.which('ffmpeg'):
        print('skip audio (ffmpeg not on PATH)'); return
    raw, out = SRC / 'audio_raw', ROOT / 'assets/audio'
    if not raw.exists():
        print('skip audio (no assets/source/audio_raw)'); return
    out.mkdir(parents=True, exist_ok=True)
    jobs = [
        # (input, output, filter, codec args)   levels measured, not guessed
        # mono at 64k: a background ambience at 0.065 volume gains nothing from
        # stereo or a higher bitrate, and it halves the biggest single asset
        ('raw_jungle_loop.mp3', 'jungle_loop.mp3', 'loudnorm=I=-14:TP=-1.0:LRA=9',
         ['-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k']),
        # River ambience for the raft scene. The source is 5 minutes of 320kbps
        # stereo -- 11.7MB, absurd for a background bed. 24 seconds of it, mono at
        # 56k, is 170KB and nobody can tell: it plays under dialogue at 0.07 volume.
        # Cut from 40s in, past the recordist settling, and loudnorm'd to the same
        # target as the jungle bed so the two ambiences sit at one level.
        ('raw_river_loop.mp3', 'river_loop.mp3', 'loudnorm=I=-14:TP=-1.0:LRA=9',
         ['-ss', '40', '-t', '24', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '56k']),
        ('raw_bike_loop.ogg', 'bike_loop.ogg', 'volume=3.2,alimiter=limit=0.85',
         ['-codec:a', 'libvorbis', '-q:a', '4']),
        ('raw_step.ogg', 'step.ogg', 'volume=16.0,alimiter=limit=0.9',
         ['-codec:a', 'libvorbis', '-q:a', '4']),
        # The source is a ROTATING bell -- a continuous trill, not a ding. The
        # script says "Tring! Tring!", so take the attack, fade it, and lay two
        # copies 430ms apart to make two distinct rings out of one recording.
        ('raw_bell.ogg', 'bell.ogg', None,
         ['-filter_complex',
          '[0:a]atrim=0:0.30,asetpts=N/SR/TB,afade=t=out:st=0.17:d=0.13[d];'
          '[d]asplit=2[d1][d2];[d2]adelay=430:all=1[d2d];'
          '[d1][d2d]amix=inputs=2:normalize=0,volume=2.4,alimiter=limit=0.85[o]',
          '-map', '[o]', '-codec:a', 'libvorbis', '-q:a', '4']),
    ]
    for src, dst, filt, codec in jobs:
        p_in = raw / src
        if not p_in.exists():
            print('skip (missing)', src); continue
        pre = ['-af', filt] if filt else []      # filt None -> codec carries -filter_complex
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(p_in)]
                       + pre + codec + [str(out / dst)], check=True)
        print('audio', dst, f'{(out / dst).stat().st_size / 1024:.0f}KB')


# The wheelie set ships as PNG frame sequences on a shared 660x880 canvas with the
# rear-wheel ground contact fixed at (191, 879). That anchor is the whole point:
# it is the pivot a wheelie rotates about and the ground contact while riding, and
# it matches the existing cycle sprite's own anchor (96/331 = 0.29 across, bottom).
# So these must be cropped with ONE bbox shared across every frame of every
# animation -- cropping each separately would drift the anchor and make him jump
# on each sprite swap.
WHEELIE_SRC = 'assets/chars/wheelie/jhumru-wheelie-set/frames'
WHEELIE = {'wheelie_lift': 63, 'wheelie_hold': 83, 'wheelie_land': 63}   # ms/frame
WHEELIE_ANCHOR = (191, 879)


def build_wheelie():
    """Crop the wheelie set to one shared bbox and emit animated WebP.

    Prints the constants the runtime needs, because they fall out of the crop:
    the anchor as a fraction of the cropped canvas, and how much taller the
    wheelie box must be than the cycle box to keep the character the same size."""
    root = ROOT / WHEELIE_SRC
    if not root.exists():
        print('skip wheelie (no frame folders)'); return
    seqs = {}
    for name in WHEELIE:
        fs = sorted((root / name).glob('*.png'))
        if fs:
            seqs[name] = [Image.open(f).convert('RGBA') for f in fs]
    if not seqs:
        print('skip wheelie (no frames)'); return

    x0, y0, x1, y1 = 10**9, 10**9, 0, 0
    for frames in seqs.values():
        for im in frames:
            ys, xs = np.where(np.array(im)[:, :, 3] > 10)
            x0, x1 = min(x0, xs.min()), max(x1, xs.max())
            y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    pad = 4
    x0, y0 = max(0, int(x0) - pad), max(0, int(y0) - pad)
    src_h = seqs[list(seqs)[0]][0].height
    x1, y1 = int(x1) + pad, min(src_h - 1, int(y1) + pad)
    w, h = x1 - x0 + 1, y1 - y0 + 1

    for name, frames in seqs.items():
        out = [im.crop((x0, y0, x1 + 1, y1 + 1)) for im in frames]
        dst = CH / f'{name}.webp'
        out[0].save(dst, 'WEBP', save_all=True, append_images=out[1:],
                    duration=[WHEELIE[name]] * len(out), loop=0 if name == 'wheelie_hold' else 1,
                    quality=86, method=4)
        real = anmf_durations(dst)
        print('wheel', f'{name:14s}', (w, h), f'{len(real)} frames {sum(real)}ms',
              f'{dst.stat().st_size / 1024:.0f}KB')

    ax = (WHEELIE_ANCHOR[0] - x0) / w
    ay = (WHEELIE_ANCHOR[1] - y0) / h
    print(f'       shared bbox x[{x0}-{x1}] y[{y0}-{y1}] -> {w}x{h}')
    print(f'       RUNTIME: anchor ({ax:.4f}, {ay:.4f})  aspect {w / h:.4f}  '
          f'height x{h / (src_h / 2):.4f} of the cycle box')


EXPR_SRC = 'assets/chars/expressions/head_layers'
EXPR_READY = True
# The export baked a 12px alpha ramp across the seam, which cross-dissolved each
# new mouth into the original's open mouth and left a ghosted smear over the jaw
# -- 3.4px of it at the size he actually renders. That turned out to be
# recoverable: the ramp is entirely in the head layer's ALPHA and it is exactly
# linear (255 at y=268 falling to 21 at y=279), so dividing it back out restores
# their unblended art.
#
# Removing it completely is wrong too. The ramp was hiding the fact that their
# ears and trunks are cut off where the layer ends, and at 0px those become hard
# flat edges -- more obvious than the ghost was. 3px keeps the cut antialiased
# while putting the dissolve at 0.85px on screen, comfortably sub-pixel.
EXPR_FEATHER_IN = 12
EXPR_FEATHER_OUT = 3
EXPR = ['still_proud', 'still_think', 'still_wow', 'still_ask',
        'still_cheer', 'still_confused', 'still_encourage']
EXPR_SEAM = 280          # in the delivered 662x880 space; 140 at game resolution


def warm(im, upto):
    """The ear / trunk-tip / tail pixels, above `upto`, and their mean S and V.

    Warm-and-saturated, which in this character is only ever those three things.
    Restricted to the head so the red bicycle can never be caught by it."""
    hsv = np.array(im.convert('RGB').convert('HSV')).astype(int)
    a = np.array(im)[..., 3]
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m = np.zeros(a.shape, bool)
    m[:upto] = True
    m &= (a > 200) & (s > 40) & ((h < 22) | (h > 240))
    return m, s[m].mean(), v[m].mean()


def tuft(im, upto=240):
    """The blue hair tuft: pixel area and centroid. The registration landmark.

    Pupils were the obvious choice and they do not work. An eyelid changes how much
    of a pupil shows, so half-lidded and squeezed-shut expressions measure small or
    vanish entirely, and no shape test separates a lidded pupil from a shut eye --
    both are thin crescents. The tuft is the only large feature on this character
    that expression cannot touch. `upto` keeps the mask clear of the blue collar at
    his neck.

    Area rather than width, because the hair is drawn with slightly different
    spread from frame to frame -- 140-157px wide by 75-95px tall -- and sqrt(area)
    is less sensitive to that than either dimension on its own."""
    a = np.array(im).astype(int)
    R, B, A = a[..., 0], a[..., 2], a[..., 3]
    m = (A > 200) & (B - R > 50) & (B > 110)
    m[upto:] = False
    ys, xs = np.where(m)
    if len(xs) < 200:
        return None
    return float(len(xs)), (float(xs.mean()), float(ys.mean()))


def align(head, area, mid, ref_area, ref_mid):
    """Resample a head so its tuft matches the original's in size and position.

    This is the repair the whole set needed. Measured against the original, every
    delivered head is 80-90% of its size and sits 39-56px lower, and they vary
    among themselves too -- so on one fixed body the head visibly shrinks, grows
    and slides as the expression changes. That is not something compositing can
    hide; the art has to be registered.

    Matching the tuft's area fixes the size and its centroid fixes the position,
    and because all these heads share the character's proportions that also lands
    each chin roughly where the original's chin is, which is what the seam needs."""
    sc = math.sqrt(ref_area / area)
    big = head.resize((max(1, round(head.width * sc)),
                       max(1, round(head.height * sc))), Image.LANCZOS)
    out = Image.new('RGBA', head.size, (0, 0, 0, 0))
    out.paste(big, (round(ref_mid[0] - mid[0] * sc), round(ref_mid[1] - mid[1] * sc)))
    return out, sc


def prep_head(name, src, ref_s, ref_v):
    """One delivered head layer, un-feathered and colour-corrected, at 2x.

    Order matters: the export's alpha ramp lives at fixed source rows, so it has to
    come off before align() moves those rows anywhere."""
    im = Image.open(src / f'{name}_head.png').convert('RGBA')
    a = np.array(im).astype(float)
    for y in range(EXPR_SEAM - EXPR_FEATHER_IN, EXPR_SEAM):
        a[y, :, 3] = np.minimum(255.0, a[y, :, 3] / ((EXPR_SEAM - y) / EXPR_FEATHER_IN))
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    m, s0, v0 = warm(im, EXPR_SEAM)
    hsv = np.array(im.convert('RGB').convert('HSV')).astype(float)
    hsv[..., 1][m] = np.clip(hsv[..., 1][m] * (ref_s / s0), 0, 255)
    hsv[..., 2][m] = np.clip(hsv[..., 2][m] * (ref_v / v0), 0, 255)
    rgb = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
    return Image.merge('RGBA', (*rgb.split(), im.split()[3])), ref_s / s0, ref_v / v0


def build_expressions():
    """Bake one full sprite per expression: their head, registered, on OUR body.

    Three repairs, all measured off the art rather than guessed:

      * the 12px export feather is divided back out of the head layer's alpha and a
        3px one re-applied -- enough to keep their cut-off ears and trunks
        antialiased, narrow enough (0.85px on screen) not to ghost his mouth;
      * every head is registered to the original's hair tuft by align(), so it
        stops shrinking and sliding between expressions;
      * ear saturation is corrected against the approved still. Hue is spot on
        across the set, within 1.2 degrees, but three frames came back washed out
        by up to -0.19.

    Full sprites rather than head overlays, because an overlay showed its seam.
    That means a lossy re-encode of the bike per frame -- 0.3% of body pixels
    differ by over 24/255 along the outlines -- which the 220ms cross-fade in
    mkActor().face() absorbs. Rows below the seam are the original file's own
    pixels, so the bike stays as sharp as the cycling loop it swaps with."""
    src = ROOT / EXPR_SRC
    base_p = CH / 'jhumru_cycle_still.webp'
    if not EXPR_READY:
        print('skip expressions (EXPR_READY is False)'); return
    if not src.exists() or not base_p.exists():
        print('skip expressions (no pack)'); return
    base = Image.open(base_p).convert('RGBA')
    base2 = base.resize((662, 880), Image.LANCZOS)
    seam = EXPR_SEAM * base.height // 880
    ref = Image.open(ROOT / 'assets/chars/expressions/full_frames'
                     / 'jhumru_cycle_still.png').convert('RGBA')
    _, ref_s, ref_v = warm(ref, EXPR_SEAM)
    ref_area, ref_mid = tuft(base2)
    print(f'       original tuft {ref_area:.0f}px at '
          f'({ref_mid[0]:.0f},{ref_mid[1]:.0f})')

    prepped = []
    for name in EXPR:
        if not (src / f'{name}_head.png').exists():
            print('skip (missing)', name); continue
        im, ds, dv = prep_head(name, src, ref_s, ref_v)
        t = tuft(im)
        prepped.append((name, im, t, ds, dv))

    med = float(np.median([q[2][0] for q in prepped if q[2]]))
    total = 0
    for name, im, t, ds, dv in prepped:
        area, mid = t if t else (med, ref_mid)
        head, sc = align(im, area, mid, ref_area, ref_mid)

        # the short feather goes on AFTER the transform, at the destination seam
        a = np.array(head).astype(float)
        for y in range(EXPR_SEAM - EXPR_FEATHER_OUT, EXPR_SEAM):
            a[y, :, 3] *= (EXPR_SEAM - y) / EXPR_FEATHER_OUT
        a[EXPR_SEAM:, :, 3] = 0
        head = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA') \
                    .resize(base.size, Image.LANCZOS)

        out = base.copy()
        out.paste((0, 0, 0, 0), (0, 0, base.width, seam - 2))
        out.alpha_composite(head)
        tag = name.replace('still_', '')
        dst = CH / f'still_{tag}.webp'
        out.save(dst, 'WEBP', quality=88, method=6)
        total += dst.stat().st_size
        print('face ', f'{tag:12s}', f'tuft {area:5.0f} -> x{sc:.3f}',
              f'sat x{ds:.2f}', f'{dst.stat().st_size / 1024:.0f}KB'
              + ('' if t else '   (no tuft -- median)'))
    print(f'       seam y={seam}, feather {EXPR_FEATHER_IN}->{EXPR_FEATHER_OUT}px, '
          f'heads registered to the tuft, total {total / 1024:.0f}KB')


# Dialogue portraits. Framed to end ABOVE row 280, where the delivered head art
# stops -- so nothing is composited and there is no seam to go wrong. That is the
# whole reason this works where the on-bike route does not: registering a head to
# the original's size pushes its chin down through row 280, and there is no art
# below that to meet the body with. A portrait has no body, so the circle can
# simply be framed above the problem.
STILL_SRC = 'assets/chars/jhumru_expression_stills_webp (1)'
STILLS = ['still_neutral', 'still_proud', 'still_think', 'still_wow',
          'still_ask', 'still_cheer']
# Measured on still_neutral: mouth red ends by row 355 and the blue strap starts at
# 350, so 362 crosses flat white shirt and flat strap and NO mouth. This is the seam
# the old head-layer pack could not have -- its art stopped at 280, mid-mouth. These
# are complete characters, so the drawing continues well past any seam we pick.
STILL_SEAM = 362
STILL_FEATHER = 10


def build_stills():
    """One shared body plus a registered head per expression.

    The pack arrived as six complete characters, which is what was asked for -- but
    from a model rather than a rig, so it drifts: the rear-wheel contact spans 18px
    vertically and the bodies differ by up to 163,000 pixels. Cross-fading those
    directly would morph the bicycle mid-dissolve, which is exactly the "not
    seamless" everyone can see.

    So the body comes from ONE file and never changes, and only the head is swapped.
    That is the same shape as the failed attempt, with the two things that broke it
    fixed: the seam is now BELOW the mouth (there is art there now), and every head
    is registered on the blue tuft before it is cut, so a 9% scale spread and a 33px
    position spread do not reach the screen.

    Everything is cropped to ONE shared bbox, as build_wheelie does, so the layers
    cannot drift apart at runtime."""
    src = ROOT / STILL_SRC
    if not src.exists():
        print('skip stills (no pack)'); return
    ims = {}
    for n in STILLS:
        p = src / f'{n}.webp'
        if p.exists():
            ims[n] = Image.open(p).convert('RGBA')
    if 'still_neutral' not in ims:
        print('skip stills (no neutral to register against)'); return

    # The pack's ears are redder than the cycling loop's -- hue 4.3 and saturation
    # 0.82 against the loop's 10.0 and 0.70 -- so without this his ears would jump
    # colour the instant he stopped pedalling and the sprite swapped. Corrected
    # against the LOOP, measured, not against a typed-in target.
    loop = Image.open(CH / 'jhumru_cycle_still.webp').convert('RGBA')
    lm, ls, lv = warm(loop, 175)
    lh = np.array(loop.convert('RGB').convert('HSV')).astype(float)[..., 0][lm].mean()
    for n, im in list(ims.items()):
        m, s0, v0 = warm(im, 420)
        hsv = np.array(im.convert('RGB').convert('HSV')).astype(float)
        h0 = hsv[..., 0][m].mean()
        hsv[..., 0][m] = np.clip(hsv[..., 0][m] + (lh - h0), 0, 255)
        hsv[..., 1][m] = np.clip(hsv[..., 1][m] * (ls / s0), 0, 255)
        hsv[..., 2][m] = np.clip(hsv[..., 2][m] * (lv / v0), 0, 255)
        rgb = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
        ims[n] = Image.merge('RGBA', (*rgb.split(), im.split()[3]))

    ref_area, ref_mid = tuft(ims['still_neutral'], upto=400)
    print(f'       reference tuft {ref_area:.0f}px at ({ref_mid[0]:.0f},{ref_mid[1]:.0f})')

    heads = {}
    for n, im in ims.items():
        t = tuft(im, upto=400)
        head, sc = align(im, *(t if t else (ref_area, ref_mid)), ref_area, ref_mid)
        a = np.array(head).astype(float)
        for i in range(STILL_FEATHER):          # shirt into shirt, so the blend hides
            a[STILL_SEAM - STILL_FEATHER + i, :, 3] *= 1 - (i + 1) / STILL_FEATHER
        a[STILL_SEAM:, :, 3] = 0
        heads[n] = a
        print(f'       {n:16s} tuft {t[0] if t else 0:5.0f} -> x{sc:.3f}')

    body = np.array(ims['still_neutral']).astype(float)
    body[:STILL_SEAM - STILL_FEATHER, :, 3] = 0

    # ONE bbox across the body and every head, so nothing can drift at runtime
    x0, y0, x1, y1 = 10**9, 10**9, 0, 0
    for a in [body] + list(heads.values()):
        ys, xs = np.where(a[..., 3] > 8)
        x0, x1 = min(x0, xs.min()), max(x1, xs.max())
        y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    pad = 3
    x0, y0 = max(0, int(x0) - pad), max(0, int(y0) - pad)
    x1, y1 = min(body.shape[1] - 1, int(x1) + pad), min(body.shape[0] - 1, int(y1) + pad)
    w, h = x1 - x0 + 1, y1 - y0 + 1

    def cut(a):
        return Image.fromarray(a[y0:y1 + 1, x0:x1 + 1].clip(0, 255).astype(np.uint8), 'RGBA')

    total = 0
    dst = CH / 'jhumru_still_body.webp'
    cut(body).save(dst, 'WEBP', quality=88, method=6)
    total += dst.stat().st_size
    print('body ', f'{dst.name:24s}', (w, h), f'{dst.stat().st_size / 1024:.0f}KB')
    for n, a in heads.items():
        tag = n.replace('still_', '')
        d = CH / f'face_{tag}.webp'
        cut(a).save(d, 'WEBP', quality=88, method=6)
        total += d.stat().st_size
        print('face ', f'{tag:24s}', (w, h), f'{d.stat().st_size / 1024:.0f}KB')

    # the anchor the runtime needs, measured off the shared crop
    ba = np.array(cut(body)).astype(int)[..., 3]
    ys, xs = np.where(ba > 8)
    bot = ys.max(); band = xs[ys > bot - 4]
    ax = (band.min() + band.max()) / 2 / w
    print(f'       shared bbox x[{x0}-{x1}] y[{y0}-{y1}] -> {w}x{h}')
    print(f'       RUNTIME: ar {w/h:.4f}  ax {ax:.4f}  seam {STILL_SEAM}  '
          f'total {total/1024:.0f}KB')


GORGE_SRC = 'assets/bg/gorge-src/png'
GORGE_ACT = ['act_gorge_near', 'act_gorge_span', 'act_gorge_far']
GORGE_EDGE = 64      # columns of alpha fade at each plate's left and right edge


def ride_top(a, x, run=14, need=10, y_from=280):
    """Top of the RIDEABLE surface in column x -- ochre earth or plank wood.

    Two cheaper tests were tried and both fail on a full scene plate. Topmost
    opaque finds the rope handrail, an 8px band 40px above the deck. Topmost solid
    body finds tree canopy, which on the far plate sits at 26% and put the profile
    240px above the path. Colour is what separates the surface from everything
    standing on or above it: the path is warm ochre and the deck is warm plank,
    while the foliage is green and the rock is grey. Same approach that found the
    bank's path height for the opening.

    `need` of the next `run` rows must match too, so a warm pixel inside a leaf
    cluster cannot be mistaken for ground."""
    col = a[:, x]
    R, G, B, A = col[:, 0], col[:, 1], col[:, 2], col[:, 3]
    warm = (A > 200) & (R > 135) & (R - B > 45) & (G < R * 0.92) & (G > R * 0.38)
    for y in range(y_from, a.shape[0] - run):
        if warm[y] and warm[y:y + run].sum() >= need:
            return y
    return None


def band_top(a, x, minrun=40):
    """Top of the LONGEST warm run in column x. For the approach plate.

    There the path and the earth beneath it form one tall warm band, so its top is
    the surface, and the short warm patches that fooled ride_top -- a rock sitting
    above the path, a warm bit of distant canopy -- lose to it on length. It is the
    wrong detector for the far plate, where a foreground bush hides the path and the
    longest warm run is the ground BEHIND it, 160px too low."""
    col = a[:, x]
    R, G, B, A = col[:, 0], col[:, 1], col[:, 2], col[:, 3]
    warm = (A > 200) & (R > 110) & (R - B > 35) & (G < R * 0.95) & (G > R * 0.30)
    best_len, best_y, st = 0, None, None
    for y in range(len(warm)):
        if warm[y] and st is None:
            st = y
        elif not warm[y] and st is not None:
            if y - st > best_len: best_len, best_y = y - st, st
            st = None
    if st is not None and len(warm) - st > best_len:
        best_len, best_y = len(warm) - st, st
    return best_y if best_len >= minrun else None


# Which surface detector suits each plate, and which way its surface is allowed to
# go. Neither detector works everywhere -- see the docstrings -- and the span needs
# neither, because its deck is flat and measured. The monotonic constraint is design,
# not a guess: the approach only ever climbs and the far side only ever eases down,
# so a point that reverses is a misread and gets clamped to its neighbour. Without
# it the approach's last points read 85% and 88% where the art is at 67%.
GORGE_SURF = {'act_gorge_near': ('band', 'up'),
              'act_gorge_span': ('flat', None),
              'act_gorge_far':  ('ride', 'down')}


def gorge_profile(a, name, pts=33):
    """A surface profile for one plate, using the detector that suits it."""
    how, mono = GORGE_SURF.get(name, ('ride', None))
    w = a.shape[1]
    if how == 'flat':
        deck = ride_top(a, w // 4)
        return [deck / a.shape[0] * 100] * pts
    # Primary detector, with the other one as fallback. band_top returns nothing
    # over the approach's bridge stub, where the monotonic clamp then froze the last
    # six points ~15px below the art; ride_top reads that stretch fine.
    first = band_top if how == 'band' else ride_top
    other = ride_top if how == 'band' else band_top
    raw = []
    for i in range(pts):
        x = min(w - 1, round(i * (w - 1) / (pts - 1)))
        v = first(a, x)
        raw.append(v if v is not None else other(a, x))
    v = np.array([np.nan if r is None else r / a.shape[0] * 100 for r in raw])
    out = v.copy()
    for i in range(len(v)):                       # median-3: kill lone outliers
        win = v[max(0, i - 1):i + 2]; win = win[~np.isnan(win)]
        if len(win): out[i] = float(np.median(win))
    good = out[~np.isnan(out)]
    out = np.where(np.isnan(out), np.median(good), out)
    if mono == 'up':     out = np.minimum.accumulate(out)   # climbing: y only falls
    elif mono == 'down': out = np.maximum.accumulate(out)   # easing: y only rises
    return list(out)


def build_gorge():
    """Convert the Broken Bridge plates and MEASURE what the runtime needs.

    Three things are measured rather than taken from the delivered JSON, because
    the drawing is what the rider has to sit on:

      * the rideable surface profile of each plate, so his height follows the art
        the way it follows the ramp;
      * the real gap edges from the alpha -- the splintered plank ends run back
        further than the nominal 864-1056, so the true opening is wider;
      * the deck height either side of each plate join, to catch a step."""
    src = ROOT / GORGE_SRC
    if not src.exists():
        print('skip gorge (no plates)'); return
    prof = {}
    for name in GORGE_ACT + ['mid_gorge']:
        p_in = src / f'{name}.png'
        if not p_in.exists():
            print('skip (missing)', name); continue
        im = Image.open(p_in).convert('RGBA')
        if name in GORGE_ACT:
            # Each plate is cropped square at its own edges, and the runtime now
            # OVERLAPS them, so a plate's hard left edge lands in the middle of its
            # neighbour's art -- where a rim block ending in a straight vertical line
            # across open sky is the most obvious thing on screen. Fading the outer
            # columns lets one plate settle into the other. The deck starts well
            # inside the fade on every plate, so nothing rideable is softened.
            a = np.array(im).astype(float)
            # Feather only the edges that FACE ANOTHER PLATE. Fading a world's
            # OUTERMOST edge has nothing to blend into: at the raft bank the leftmost
            # 64 columns dissolved into the sky and read as a copy-pasted cutout with
            # a soft border round it.
            idx = GORGE_ACT.index(name)
            for i in range(GORGE_EDGE):
                k = (i + 1) / GORGE_EDGE
                if idx > 0:                a[:, i, 3] = a[:, i, 3] * k
                if idx < len(GORGE_ACT) - 1:  a[:, -1 - i, 3] = a[:, -1 - i, 3] * k
            im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
        dst = BG / f'{name}.webp'
        im.save(dst, 'WEBP', quality=76, method=6)
        print('gorge', f'{name:16s}', im.size, f'{dst.stat().st_size / 1024:.0f}KB')
        if name in GORGE_ACT:
            a = np.array(im).astype(int)
            prof[name] = [ride_top(a, min(im.width - 1, round(i * im.width / 16)))
                          for i in range(17)]
    pl = src / 'prop_plank.png'
    if pl.exists():
        im = Image.open(pl).convert('RGBA')
        im.save(CH / 'prop_plank.webp', 'WEBP', quality=88, method=6)
        print('gorge', f'{"prop_plank":16s}', im.size,
              f'{(CH / "prop_plank.webp").stat().st_size / 1024:.0f}KB')

    print('\n       SURFACE PROFILE (fraction of frame height, 17 points L->R)')
    for name, ys in prof.items():
        txt = ','.join('null' if y is None else f'{y / 1080:.4f}' for y in ys)
        print(f'       {name}\n         [{txt}]')

    span = np.array(Image.open(src / 'act_gorge_span.png').convert('RGBA')).astype(int)
    deck = ride_top(span, 400)
    row = span[deck + 6, :, 3] > 8
    runs, st = [], None
    for x in range(span.shape[1]):
        if not row[x] and st is None: st = x
        elif row[x] and st is not None:
            if x - st > 40: runs.append((st, x - 1))
            st = None
    print(f'\n       deck surface y={deck} ({deck / 1080 * 100:.1f}%); '
          f'gap in the alpha: {runs}')
    if runs:
        g0, g1 = runs[0]
        print(f'       -> GAP {g0}-{g1} = {g1 - g0 + 1}px ({100 * g0 / 1920:.1f}%'
              f'-{100 * g1 / 1920:.1f}%), delivered spec said 864-1055 (192px)')

    print('\n       JOINS (deck/ground height either side)')
    for i in range(len(GORGE_ACT) - 1):
        A = np.array(Image.open(src / f'{GORGE_ACT[i]}.png').convert('RGBA')).astype(int)
        B = np.array(Image.open(src / f'{GORGE_ACT[i + 1]}.png').convert('RGBA')).astype(int)
        ea = [v for v in (ride_top(A, x) for x in range(A.shape[1] - 24, A.shape[1])) if v]
        eb = [v for v in (ride_top(B, x) for x in range(0, 24)) if v]
        if ea and eb:
            print(f'       {GORGE_ACT[i]} y{np.mean(ea):.0f} -> '
                  f'{GORGE_ACT[i + 1]} y{np.mean(eb):.0f}   '
                  f'step {np.mean(eb) - np.mean(ea):+.0f}px')


RAFT_SRC = 'assets/bg/raft-src'
RAFT_ACT = ['act_raft_bank', 'act_raft_open', 'act_raft_far']
# How the shore ENDS on the right. The plate is a full-frame background with an edge
# occluder drawn at each side, so its right edge is a straight cut through a plant
# cluster and the earth band -- fine when another plate butts it, obviously sliced
# when the world stops there over open water. Nothing in code can invent the
# shoreline that was never drawn, but the land can be made to taper into the water,
# which reads as a spit instead of a slice.
RAFT_TAPER = 420        # columns over which the land narrows away
RAFT_TAPER_POW = 0.7    # <1 keeps it wide then draws out a long thin tip


def taper_shore(a):
    """Wedge the bank's right end down into the water.

    Two steps, and the order matters. First everything ABOVE the earth band goes
    across the whole zone -- the plant cluster and the rock, removed whole. Letting
    the taper line do that instead cut the rock in half, because a diagonal through a
    solid object reads as a sliced object, while the same diagonal through flat earth
    reads as a bank edge. The zone starts left of the rock for that reason.

    Then the band's top slides down to the waterline so it pinches shut. A low
    frequency wobble keeps the edge off a ruler-straight diagonal. No feather is
    needed: the band reaches zero height on its own, so there is no stub to hide."""
    W = a.shape[1]
    x0 = W - RAFT_TAPER
    col = np.where(a[:, x0 - 24, 3] > 8)[0]        # measured, not assumed
    top0, water = int(col.min()), int(col.max())
    a[:top0, x0:, 3] = 0                            # plants and rock, whole
    for i in range(RAFT_TAPER):
        t = (i + 1) / RAFT_TAPER
        wob = 7 * math.sin(i / 46.0) + 4 * math.sin(i / 17.0)
        cut = int(top0 + (water - top0) * (t ** RAFT_TAPER_POW) + wob)
        a[:max(0, cut), x0 + i, 3] = 0
    return a, top0, water


RAFT_PROPS = ['water_far', 'water_near', 'near_reeds', 'raft_fused', 'raft_stepped',
              'prop_log_smooth', 'prop_log_ridged', 'prop_log_moss', 'fx_splash']


def flood_from_edge(mask):
    """The part of `mask` that touches an image edge.

    Matte and sky both have to go, and both are distinguished from art by being
    connected to the border rather than by their colour: the plates contain plenty
    of legitimate near-white highlight and plenty of blue that is not sky. A flood
    from the edge removes the export padding and the painted sky without punching
    holes in anything interior."""
    lab, _ = ndimage.label(mask)
    edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
    edge.discard(0)
    return np.isin(lab, list(edge))


def strip_plate(a, sky=True):
    """Remove the white export padding, and optionally the painted sky.

    The plates arrived with 15-40% of their pixels as flat white padding where
    transparency was specified -- the same class of delivery error as the
    expression pack's feather, but this one is recoverable because the padding is
    a flat colour the art never uses.

    Two white passes: the first at 238 takes the bulk, the second at 216 takes the
    ragged fringe it leaves along the waterline, which a single threshold cannot
    reach without eating into the shore itself."""
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    for thresh in (238, 216):
        white = (A > 100) & (R > thresh) & (G > thresh) & (B > thresh)
        a[..., 3] = np.where(flood_from_edge(white), 0, a[..., 3])
        A = a[..., 3]
    if sky:
        # Sky on the action plane would travel at 1.00 against far_sky's 0.20 and
        # cover it entirely. Blue-dominant and light, flooded from the top edge.
        blue = (A > 100) & (B - R > 18) & (B > 150)
        a[..., 3] = np.where(flood_from_edge(blue), 0, a[..., 3])
        A = a[..., 3]
    # Whatever near-white survives the floods is an ISLAND of padding, cut off from
    # the edge once its neighbours went. On act_raft_far that left a checkerboard of
    # ~30px squares across the water. Nothing in these plates is legitimately this
    # white -- the rock is 180, the path is ochre, the foliage green -- so the
    # remainder goes unconditionally.
    a[..., 3] = np.where((A > 8) & (R >= 232) & (G >= 232) & (B >= 232), 0, a[..., 3])
    return a


def build_raft():
    """Convert the Raft Building set and measure what the runtime needs.

    act_raft_open is emptied on purpose. It arrived painted as a full background --
    sky and a distant treeline -- but the middle of the river already has a distant
    treeline from mid_canopy at 0.50 and a reed line from water_far at 0.62, and
    anything left on the action plane there would travel at 1.00 and read as the far
    bank rushing past a raft that is barely moving. The segment stays in the list as
    a spacer so the camera still has two screens of travel to cross."""
    src = ROOT / RAFT_SRC
    if not src.exists():
        print('skip raft (no pack)'); return
    total, prof = 0, {}
    for name in RAFT_ACT:
        p_in = src / f'{name}.webp'
        if not p_in.exists():
            print('skip (missing)', name); continue
        im = Image.open(p_in).convert('RGBA')
        a = strip_plate(np.array(im).astype(int), sky=True)
        if name == 'act_raft_open':
            a[..., 3] = 0                      # spacer -- see the docstring
        if name == 'act_raft_bank':
            a, t0, wl = taper_shore(a)
            print(f'       shore tapers over the last {RAFT_TAPER} columns, '
                  f'band top {t0} down to the waterline {wl}')
        # Feather only an edge that meets REAL ART on the other side. Two ways that
        # goes wrong here: a world's outermost edge has nothing to blend into (the
        # bank's leftmost 64 columns dissolved into the sky and read as a
        # copy-pasted cutout), and an edge facing the empty spacer has nothing
        # either -- there the plate's half-trunk faded into the river and looked
        # like a ghost tree. So a neighbour that is the spacer counts as no
        # neighbour, which for this set means no feathering at all.
        idx = RAFT_ACT.index(name)
        solid = lambda j: 0 <= j < len(RAFT_ACT) and RAFT_ACT[j] != 'act_raft_open'
        for i in range(GORGE_EDGE):
            k = (i + 1) / GORGE_EDGE
            if solid(idx - 1): a[:, i, 3] = a[:, i, 3] * k
            if solid(idx + 1): a[:, -1 - i, 3] = a[:, -1 - i, 3] * k
        out = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
        dst = BG / f'{name}.webp'
        out.save(dst, 'WEBP', quality=76, method=6)
        total += dst.stat().st_size
        rows = np.where((a[..., 3] > 8).sum(axis=1) > a.shape[1] * 0.2)[0]
        span = f'rows {rows.min()}-{rows.max()} ({100*rows.min()/1080:.0f}-{100*rows.max()/1080:.0f}%)' \
            if len(rows) else 'empty (spacer)'
        print('raft ', f'{name:16s}', out.size, f'{dst.stat().st_size/1024:.0f}KB   {span}')
        if name == 'act_raft_bank':
            prof[name] = [ride_top(a, min(a.shape[1]-1, round(i*(a.shape[1]-1)/32)), y_from=400)
                          for i in range(33)]

    for name in RAFT_PROPS:
        p_in = src / f'{name}.webp'
        if not p_in.exists():
            print('skip (missing)', name); continue
        im = Image.open(p_in).convert('RGBA')
        a = np.array(im).astype(int)
        # The water bands and the reeds are NOT stripped. They arrived clean -- zero
        # white matte rows -- and running the flood over them ate the white ripple
        # HIGHLIGHTS, which form a connected network reaching the edge, leaving a
        # lace of holes across the river. Only the act plates carry padding.
        dst = (BG if name.startswith(('water', 'near')) else CH) / f'{name}.webp'
        Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA') \
             .save(dst, 'WEBP', quality=82, method=6)
        total += dst.stat().st_size
        print('raft ', f'{name:16s}', im.size, f'{dst.stat().st_size/1024:.0f}KB')

    bank = prof.get('act_raft_bank')
    if bank:
        v = np.array([np.nan if r is None else r/1080*100 for r in bank])
        for i in range(len(v)):                      # median-3, as the gorge does
            w = v[max(0, i-1):i+2]; w = w[~np.isnan(w)]
            if len(w): v[i] = float(np.median(w))
        good = v[~np.isnan(v)]
        v = np.where(np.isnan(v), np.median(good), v)
        print('\n       BANK SURFACE (percent of frame height, 33 points L->R)')
        print('       [' + ','.join(f'{x:.2f}' for x in v) + ']')
        print(f'       ends at {v[-1]:.2f}%   waterline spec 78%')
    print(f'       total {total/1024:.0f}KB')

def build_ramp():
    """Convert the ramp plate to WebP and MEASURE its surface.

    The rider follows the ramp's real curve rather than a straight line between
    two guessed waypoints, so the profile has to come off the art. Printed here
    as a ready-to-paste array: surface height as a fraction of the ramp's own box,
    sampled left (foot) to right (crest)."""
    src = SRC / 'px_ramp.png'
    if not src.exists():
        print('skip ramp (no assets/source/px_ramp.png)'); return
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    im.save(BG / 'ramp.webp', 'WEBP', quality=86, method=4, exact=True)
    print('ramp ', (w, h), f'aspect {w / h:.3f}',
          f'{(BG / "ramp.webp").stat().st_size / 1024:.0f}KB')
    a = np.array(im)[:, :, 3]
    n = 16
    prof = []
    for k in range(n + 1):
        x = min(w - 1, round(k / n * (w - 1)))
        col = np.where(a[:, x] > 40)[0]
        prof.append(round(float(col.min()) / h, 4) if len(col) else 1.0)
    print('       RAMP_PROFILE=[' + ','.join(f'{v:.4f}' for v in prof) + '];')
    print(f'       foot {prof[0]:.3f} -> crest {prof[-1]:.3f} of its own height')


def build_join_trunk():
    """A trunk to lay OVER each act-layer segment join.

    Both plates carry a full-height trunk at their edge, so where two segments
    butt together you get two HALF trunks meeting on a hard vertical edge, plus a
    slight tonal step between plates. The trunks only hide a join if one trunk
    spans it -- so build that one: take act_bank's edge trunk, mirror it into a
    symmetric trunk, and feather both outer edges so it melts into whatever it is
    laid over. The joins sit at the frame edge whenever the camera is parked, so
    this only matters while travelling, but that is when it showed."""
    src = BG / 'act_bank.webp'
    if not src.exists():
        print('skip join_trunk (no act_bank)'); return
    # NOT mirrored: bark is distinctive texture, and mirroring it reads as an
    # obvious butterfly pattern (the same trap as near_leaves). The overlay only
    # has to hide the LINE, not cover both half-trunks -- what it does not cover
    # is the same wood anyway, so the feathered edges blend straight into it.
    im = Image.open(src).convert('RGBA')
    trunk = im.crop((0, 0, 230, im.height))
    a = np.array(trunk).astype(float)
    feather = 52
    ramp = np.clip(np.arange(trunk.width) / feather, 0, 1)
    ramp = np.minimum(ramp, ramp[::-1])
    a[:, :, 3] *= ramp[None, :]
    Image.fromarray(a.astype('uint8'), 'RGBA').save(
        BG / 'join_trunk.webp', 'WEBP', quality=84, method=3, exact=True)
    print('px    join_trunk', (trunk.width, im.height),
          f'{(BG / "join_trunk.webp").stat().st_size / 1024:.0f}KB')


def build_parallax():
    W, H = PX_FRAME
    for key in PX_TILE:
        p = SRC / f'px_{key}.png'
        if not p.exists():
            print('skip (missing)', p.name); continue
        im = Image.open(p).convert('RGBA').resize((W, H), Image.LANCZOS)
        im = mirror_x(im)
        opaque = np.array(im)[:, :, 3].min() > 250
        im.save(BG / f'{key}.webp', 'WEBP', quality=70, method=3,
                **({} if opaque else {'exact': True}))
        print('px   ', key, im.size, 'opaque' if opaque else 'alpha',
              f'{(BG / f"{key}.webp").stat().st_size / 1024:.0f}KB')
    p = SRC / 'px_near_fringe.png'
    if p.exists():
        fr = Image.open(p).convert('RGBA')
        fh = round(fr.height * W / fr.width)
        fr = fr.resize((W, fh), Image.LANCZOS)
        cut = round(FRINGE_CUT * fh / 540)
        for key, box, wrap in [('near_leaves', (0, 0, W, cut), roll_x),
                               ('near_grass', (0, cut, W, fh), mirror_x)]:
            im = wrap(fr.crop(box))
            im.save(BG / f'{key}.webp', 'WEBP', quality=80, method=3, exact=True)
            print('px   ', key, im.size, 'alpha',
                  f'{(BG / f"{key}.webp").stat().st_size / 1024:.0f}KB')
    for key in PX_SEG:
        p = SRC / f'px_{key}.png'
        if not p.exists():
            print('skip (missing)', p.name); continue
        im = Image.open(p).convert('RGBA')
        if im.size != (W, H):
            im = im.resize((W, H), Image.LANCZOS)
        im.save(BG / f'{key}.webp', 'WEBP', quality=72, method=3, exact=True)
        print('px   ', key, im.size, 'alpha',
              f'{(BG / f"{key}.webp").stat().st_size / 1024:.0f}KB')
    build_join_trunk()


def anmf_durations(path):
    """Read real frame durations out of an animated WebP. Pillow's WebP *reader*
    reports 0 for these even when the file is correct, so parse the chunks."""
    import struct
    d = open(path, 'rb').read(); i, out = 12, []
    while i < len(d) - 8:
        tag = d[i:i + 4]; sz = struct.unpack('<I', d[i + 4:i + 8])[0]
        if tag == b'ANMF':
            p = d[i + 8:i + 8 + sz]
            out.append(p[12] | (p[13] << 8) | (p[14] << 16))
        i += 8 + sz + (sz & 1)
    return out


def crop_loop(src, h, dur=None):
    """Crop an animated GIF to the union bbox of its frames and re-encode as
    animated WebP. The raw GIFs are 1920x1080 with most of the canvas empty,
    which ships needless bytes and makes positioning fiddly -- cropping means
    left/top address the character itself. WebP also carries full 8-bit alpha,
    where GIF only has 1-bit, so the cut edges stay smooth."""
    from PIL import ImageSequence
    im = Image.open(src)
    x0, y0, x1, y1 = 10**9, 10**9, 0, 0
    for fr in ImageSequence.Iterator(im):
        ys, xs = np.where(np.array(fr.convert('RGBA'))[:, :, 3] > 10)
        x0, x1 = min(x0, xs.min()), max(x1, xs.max())
        y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    w = round((x1 - x0 + 1) * h / (y1 - y0 + 1))
    frames, durs = [], []
    for fr in ImageSequence.Iterator(im):
        durs.append(dur if dur else max(fr.info.get('duration', 0), 35))
        frames.append(fr.convert('RGBA').crop((x0, y0, x1 + 1, y1 + 1)).resize((w, h), Image.LANCZOS))
    return frames, durs, (w, h)


def main():
    if not SRC.exists():
        sys.exit('assets/source not found')
    BG.mkdir(parents=True, exist_ok=True); CH.mkdir(parents=True, exist_ok=True)
    for key, fn in BGS.items():
        p = SRC / fn
        if not p.exists():
            print('skip (missing)', fn); continue
        cover(Image.open(p).convert('RGB'), W, H).save(BG/f'{key}.webp', 'WEBP', quality=64, method=6)
        print('bg   ', key)
    for key, fn in CHARS.items():
        p = SRC / fn
        if not p.exists():
            print('skip (missing)', fn); continue
        im = cut_white(Image.open(p))
        h = CHAR_H[key]; im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
        im.save(CH/f'{key}.webp', 'WEBP', quality=88, method=6)
        print('char ', key, im.size)
    build_parallax()
    build_audio()
    build_wheelie()
    build_ramp()
    build_bubble()
    build_font()
    build_mud()
    for key, (fn, h, dur) in LOOPS.items():
        p = CH / fn
        if not p.exists():
            print('skip (missing)', fn); continue
        frames, durs, size = crop_loop(p, h, dur)
        dst = CH / f'{key}.webp'
        frames[0].save(dst, 'WEBP', save_all=True, append_images=frames[1:],
                       duration=durs, loop=0, quality=82, method=4)
        real = anmf_durations(dst)
        print('loop ', key, size, f'{len(real)} frames {sum(real)}ms',
              f'{dst.stat().st_size / 1024:.0f}KB')
        if key in LOOP_STILLS:
            still = CH / f'{key}_still.webp'
            frames[LOOP_STILLS[key]].save(still, 'WEBP', quality=88, method=6)
            print('still', key, size, f'{still.stat().st_size / 1024:.0f}KB')
    build_expressions()      # last: it swaps heads onto jhumru_cycle_still

# ---------------------------------------------------------------------------
# The speech bubble and the font it holds
# ---------------------------------------------------------------------------
BUBBLES = [('bubble_tail_corner.png', 'bubble.webp'),      # in use: corner tail
           ('bubble_tail_down.png',   'bubble_down.webp')] # the alternative, spare
FONT_SRC = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'Windows',
                        'Fonts', 'Poppins-SemiBold.ttf')


def build_bubble():
    """Jhumru's parchment speech bubble, and the geometry the runtime needs.

    Two were supplied. bubble.webp is the one in use, because its tail is at the
    bottom-RIGHT corner: the bubble therefore hangs up and to the LEFT of whatever the
    tail points at, and he faces and travels right with the path ahead to be kept
    clear. The other keeps its place here so switching is one CSS url away.

    The printed numbers are what CSS and mkActor are set from -- do not eyeball them."""
    src = ROOT / 'assets' / 'source'
    for a, b in BUBBLES:
        p = src / a
        if not p.exists():
            print(f'skip bubble {a} (not in assets/source)'); continue
        im = Image.open(p).convert('RGBA')
        dst = CH / b
        im.save(dst, 'WEBP', quality=90, method=6)
        arr = np.array(im).astype(int)
        al = arr[..., 3]; H, W = al.shape
        op = al > 128
        ys, xs = np.where(op)
        bot = ys.max(); botx = xs[ys > bot - 3]
        # the largest box that is PALE fill on every row -- the conservative text area.
        # The one CSS uses is wider than this, because the tail only eats the
        # bottom-right corner and centred text never reaches a corner.
        lum = arr[..., :3].mean(2)
        pale = op & (lum > 195)
        best = (0, None)
        for y0 in range(0, H, 4):
            for y1 in range(y0 + 40, H, 4):
                cols = pale[y0:y1].all(0)
                if not cols.any(): continue
                idx = np.where(cols)[0]
                run = max(np.split(idx, np.where(np.diff(idx) != 1)[0] + 1), key=len)
                area = (y1 - y0) * len(run)
                if area > best[0]: best = (area, (run[0], y0, run[-1], y1))
        x0, y0, x1, y1 = best[1]
        print(f'bubble {b:20s} {im.size}  {dst.stat().st_size / 1024:.1f}KB')
        print(f'       aspect {W / H:.3f}   tail tip ({botx.mean() / W:.3f}, {bot / H:.3f})')
        print(f'       text safe (conservative) left {x0 / W:.3f} top {y0 / H:.3f} '
              f'width {(x1 - x0) / W:.3f} height {(y1 - y0) / H:.3f}')


def build_font():
    """Poppins SemiBold, subset and bundled LOCALLY.

    Not a webfont request: the game has to work with no network at all. Subset to
    printable ASCII plus the curly quotes and dashes a script picks up from a word
    processor, which is generous enough that new dialogue never hits a missing glyph.
    Poppins is OFL, so shipping a copy is fine."""
    if not os.path.exists(FONT_SRC):
        print('skip font (Poppins-SemiBold.ttf not installed)'); return
    out = ROOT / 'assets' / 'fonts' / 'poppins-semibold.woff2'
    out.parent.mkdir(parents=True, exist_ok=True)
    chars = ''.join(chr(c) for c in range(0x20, 0x7F)) + '‘’“”–—… '
    r = subprocess.run([sys.executable, '-m', 'fontTools.subset', FONT_SRC,
                        '--unicodes=' + ','.join(f'U+{ord(c):04X}' for c in chars),
                        '--layout-features=kern,liga', '--flavor=woff2',
                        '--output-file=' + str(out)], capture_output=True, text=True)
    if r.returncode:
        print('font subset FAILED:', r.stderr.strip()[:200]); return
    print(f'font   {out.name:20s} {os.path.getsize(FONT_SRC) / 1024:.0f}KB -> '
          f'{out.stat().st_size / 1024:.1f}KB  ({len(chars)} glyphs)')


# ---------------------------------------------------------------------------
# The muddy path -- hurdle three
# ---------------------------------------------------------------------------
MUD_SRC    = 'muddy_path_assets/muddy_path_assets'
MUD_PLATES = [('act_mud_near.png', 'act_mud_near.webp'),
              ('act_mud_deep.png', 'act_mud_deep.webp'),
              ('act_mud_far.png',  'act_mud_far.webp')]
MUD_LAP    = 260      # design units of overlap per join, per docs/18
MUD_TARGET = 72.0     # where plate 1's surface must land: act_raft_far's path height
MUD_FLOOR  = 88.0     # ground continues down to here. near_grass is opaque from
                      # 82.9%, and mid_canopy paints all the way to 100%, so a
                      # floor at the spec's 82% left a sliver of distant treeline
                      # showing THROUGH the path. Overlap the fringe instead.
MUD_BLEND  = 400      # columns over which a ledge at the overlap boundary is eased out


def _mud_surface(a):
    """The path surface and the band's lowest row, per column, found by walking UP from
    the lowest warm pixel.

    Colour from ABOVE finds trunk bark and greenery -- that is how the rider came to
    float 83px on the bridge approach. From below it can only find the ground he
    actually stands on."""
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    warm = (al > 128) & (r > 100) & (r > b + 30) & (g < r)
    H, W = al.shape
    top = np.full(W, -1)
    bot = np.full(W, -1)
    for x in range(W):
        c = np.where(warm[:, x])[0]
        if not len(c):
            continue
        bot[x] = c.max()
        y = c.max()
        while y - 1 >= 0 and warm[y - 1, x]:
            y -= 1
        top[x] = y
    return top, bot


def _mud_greenery(plates, lap):
    """Carry the near greenery across the bald stretches, and restore the overlap
    identity afterwards.

    This is a flaw in the BRIEF, not the delivery. docs/18 said the 260-unit end bands
    must hold no distinctive object, so the join could not show half a bush twice. The
    artist obeyed exactly -- and then also stopped the background greenery, leaving
    plate 1 bald for its last 1147 columns and plate 2's own greenery starting as a wall
    at the far end of the copied band. The rule should have said: no distinctive object,
    but the greenery behind the path continues.

    So the greenery is carried across here, sampled from plate 2's own band and aligned
    to each destination column's ground surface, mirrored on each repeat so it does not
    read as a tiled hedge. It is written to plate 1's right band and plate 2's left band
    from the SAME generated pixels, so the two stay byte-identical and the join is still
    invisible by construction."""
    GH = 230                                    # how much of the band above the surface
    tops = [_mud_surface(a)[0] for a in plates]

    def bald(a):
        r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
        cols = ((al > 128) & (g > r + 15) & (g > 90)).any(0)
        out, s = [], None
        for x in range(len(cols)):
            if not cols[x] and s is None:
                s = x
            elif cols[x] and s is not None:
                if x - s > 60:
                    out.append((s, x - 1))
                s = None
        if s is not None and len(cols) - s > 60:
            out.append((s, len(cols) - 1))
        return out

    # the donor: a stretch of plate 2 that has real bushes on it
    src = plates[1]
    stop = tops[1]
    donor = [x for x in range(300, 690) if stop[x] >= 0]

    def paint(dst, di, x0, x1):
        """Copy greenery into dst columns x0..x1, aligned to each column's surface."""
        dtop = tops[di]
        n = len(donor)
        for k, x in enumerate(range(x0, x1 + 1)):
            if dtop[x] < 0:
                continue
            j = k % (2 * n)
            sx = donor[j] if j < n else donor[2 * n - 1 - j]   # mirror on every repeat
            sy, dy = stop[sx], dtop[x]
            for row in range(1, GH + 1):
                ys, yd = sy - row, dy - row
                if ys < 0 or yd < 0:
                    break
                if src[ys, sx, 3] > 128 and dst[yd, x, 3] < 128:
                    dst[yd, x] = src[ys, sx]

    for i, a in enumerate(plates):
        for x0, x1 in bald(a):
            if i == 1 and x0 == 0:
                continue                        # the copied band; handled below
            paint(a, i, x0, x1)

    # restore the overlap identity: whatever plate 1 now has in its right band IS the
    # band, so copy it verbatim into plate 2's left band, and likewise 2 -> 3
    W = plates[0].shape[1]
    plates[1][:, :lap] = plates[0][:, W - lap:]
    plates[2][:, :lap] = plates[1][:, W - lap:]
    return plates


def build_mud():
    """Three act plates for the muddy path, corrected into the game's coordinate space.

    The delivery got right everything docs/18 made a hard rule, which is the point of
    having written that table: overlap bands pixel-identical (mean difference 0.00
    against a control of 10.9), no padding and no matte, hard alpha at the world edges,
    mud_near tiles and its paint is inside the specified row window, and the three stone
    silhouettes are byte-identical.

    Two things need correcting here and both come from one misreading. "Everything below
    82% of image height must be fully transparent" was read as "stop the ground", so each
    plate's ground is a thin floating strip -- hard cut top AND bottom, sky behind it --
    and the whole scene sits about 28.6% too high, path surface at 43.4% rather than
    72.0%. So:

      1. De-step. Plates 2 and 3 carry the copied overlap band at the neighbour's height
         and then their own ground at a different one, leaving a hard 41px and 52px ledge
         at exactly x=259 where the copied band ends. The overlap itself is perfect; the
         step just moved 260px inboard. Each is eased out over 400 columns starting from
         zero AT the boundary, so the band stays pixel-identical with its neighbour. The
         band there is featureless ochre, so a vertical slide cannot be seen.
      2. Give the ground a body: fill from each column's band bottom down to 82% with
         that column's own colour, so it reads as ground rather than a strip in mid-air.
      3. Shift. ONE offset for all three plates, so the overlap bands stay aligned.
      4. Extend the edge trunks back up to the top of the frame, since the shift moved
         their tops down. Bark is a vertical texture and mirror-tiles invisibly.

    Prints the resulting walkable profile for MUD.prof in levels.js."""
    src = ROOT / MUD_SRC
    if not (src / MUD_PLATES[0][0]).exists():
        print('skip mud (no pack)')
        return

    plates = [np.array(Image.open(src / a).convert('RGBA')).astype(int)
              for a, _ in MUD_PLATES]
    H, W = plates[0].shape[:2]
    lap = round(MUD_LAP * W / 1920)

    # ---- 1. de-step, plates 2 and 3 -----------------------------------------
    for i in (1, 2):
        a = plates[i]
        top, _ = _mud_surface(a)
        step = int(top[lap] - top[lap - 1])      # + means its own ground sits lower
        if abs(step) < 4:
            print('       ' + MUD_PLATES[i][0] + ': no ledge at the overlap boundary')
            continue
        out = a.copy()
        for j in range(MUD_BLEND):
            x = lap + j
            if x >= W:
                break
            t = (j + 1) / MUD_BLEND
            ease = 1 - (1 - t) ** 2              # 0 at the boundary, 1 by the end
            dy = int(round(-step * (1 - ease)))
            if dy:
                out[:, x] = np.roll(a[:, x], dy, axis=0)
        plates[i] = out
        print('       %s: %+dpx ledge at x=%d eased over %d columns'
              % (MUD_PLATES[i][0], -step, lap, MUD_BLEND))

    # ---- 1b. carry the greenery across the bald stretches -------------------
    before = [((a[..., 3] > 128) & (a[..., 1] > a[..., 0] + 15)).sum() for a in plates]
    plates = _mud_greenery(plates, lap)
    after = [((a[..., 3] > 128) & (a[..., 1] > a[..., 0] + 15)).sum() for a in plates]
    print('       greenery carried across: %s -> %s px'
          % (str([int(x) for x in before]), str([int(x) for x in after])))

    # ---- 2 + 3. ground body, then shift into place --------------------------
    top0, _ = _mud_surface(plates[0])
    ref = float(np.median(top0[lap:]))           # plate 1's own surface, past its edge
    shift = int(round(MUD_TARGET / 100 * H - ref))
    floor = int(round(MUD_FLOOR / 100 * H))
    print('       surface %.2f%% -> %.1f%%  (shift +%dpx), ground filled to %.0f%%'
          % (100 * ref / H, MUD_TARGET, shift, MUD_FLOOR))

    for i, a in enumerate(plates):
        _, bot = _mud_surface(a)
        out = np.zeros_like(a)
        out[shift:, :] = a[:H - shift, :]
        # Flat colour per column, SMOOTHED along x. Three approaches were tried and
        # this is the one that survives looking at it:
        #   per-column average alone striped the body like a barcode, because
        #     neighbouring columns each picked their own mean;
        #   tiling the band's own bottom rows downward removed every boundary but
        #     repeated the MUD ellipse as dark stripes all the way down, since the mud
        #     is part of what those rows contain;
        #   a smoothed average leaves only a faint tonal ledge where two plates start
        #     their fill at different heights, below the path and largely under
        #     near_grass, which is the mildest of the three.
        col = np.zeros((W, 4))
        have = np.zeros(W, bool)
        for x in range(W):
            if bot[x] < 0:
                continue
            band = out[max(0, bot[x] + shift - 5):bot[x] + shift + 1, x]
            band = band[band[:, 3] > 128]
            if len(band):
                col[x] = band.mean(0); have[x] = True
        if have.any():
            idx = np.where(have)[0]
            for k in range(4):
                col[:, k] = np.interp(np.arange(W), idx, col[idx, k])
            K = 41
            pad = np.pad(col, ((K // 2, K // 2), (0, 0)), mode='edge')
            col = np.stack([np.convolve(pad[:, k], np.ones(K) / K, 'valid')
                            for k in range(4)], 1)
            for x in range(W):
                if not have[x]:
                    continue
                y0 = bot[x] + shift + 1
                if y0 < floor:
                    out[y0:floor, x] = col[x].round().astype(int)
        # ---- 4. edge trunks back up to the top of the frame ------------------
        had_top = a[0, :, 3] > 128               # only columns that carried a trunk
        for x in np.where(had_top)[0]:
            blk = out[shift:shift * 2, x]
            if not len(blk):
                continue
            fill = np.concatenate([blk[::-1], blk])   # mirrored, so no hard repeat
            reps = int(np.ceil(shift / len(fill))) + 1
            out[:shift, x] = np.tile(fill, (reps, 1))[:shift]
        plates[i] = out

    # ---- save, and report the profile ---------------------------------------
    total = 0
    for (_, dst), a in zip(MUD_PLATES, plates):
        p = BG / dst
        Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(
            p, 'WEBP', quality=88, method=6)
        total += p.stat().st_size
        print('mud   %-20s (%d, %d) %.0fKB'
              % (dst, a.shape[1], a.shape[0], p.stat().st_size / 1024))

    world = 3 * W - 2 * lap
    line = np.full(world, np.nan)
    for i, a in enumerate(plates):
        top, _ = _mud_surface(a)
        off = i * (W - lap)
        for x in range(W):
            if top[x] >= 0:
                line[off + x] = 100 * top[x] / H          # a later plate wins
    stepn = world // 32
    # a local median over a wide window, so a trunk column at a world edge cannot
    # define the ground -- it reported 86.8% once, which is the trunk, not the path
    flat = [round(float(np.nanmedian(line[max(0, k - 60):k + 61])), 2)
            for k in range(0, world, stepn)]
    print('       RUNTIME  laps [%d,%d]   world %.2f frames' % (MUD_LAP, MUD_LAP, world / W))
    print('       MUD.prof (%d samples, %.1f%%-%.1f%%):' % (len(flat), min(flat), max(flat)))
    print('         ' + str(flat))

    for a, dst in [('mud_near.png', BG / 'mud_near.webp'),
                   ('stones_firm.png', CH / 'stones_firm.webp'),
                   ('stones_sunk.png', CH / 'stones_sunk.webp'),
                   ('fx_mud_splat.png', CH / 'fx_mud_splat.webp'),
                   ('fx_mud_splat_b.png', CH / 'fx_mud_splat_b.webp')]:
        p = src / a
        if not p.exists():
            print('       skip ' + a)
            continue
        im = Image.open(p).convert('RGBA')
        im.save(dst, 'WEBP', quality=90, method=6)
        total += dst.stat().st_size
        print('mud   %-20s %s %.0fKB' % (dst.name, im.size, dst.stat().st_size / 1024))

    # the stones already share one canvas; crop all three to ONE bbox so they cannot
    # drift apart at runtime, exactly as build_wheelie and build_stills do
    stones = [Image.open(src / ('prop_stone_%d.png' % i)).convert('RGBA') for i in (1, 2, 3)]
    m = np.zeros(np.array(stones[0]).shape[:2], bool)
    for s in stones:
        m |= np.array(s)[..., 3] > 8
    ys, xs = np.where(m)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    for i, s in enumerate(stones, 1):
        d = CH / ('prop_stone_%d.webp' % i)
        s.crop(box).save(d, 'WEBP', quality=90, method=6)
        total += d.stat().st_size
    bw, bh = box[2] - box[0], box[3] - box[1]
    print('mud   prop_stone_1..3       (%d, %d) shared bbox   ar %.4f' % (bw, bh, bw / bh))
    print('       total %.0fKB' % (total / 1024))


if __name__ == '__main__':
    main()
