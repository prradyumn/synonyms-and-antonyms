#!/usr/bin/env python3
"""Regenerate assets/bg and assets/chars from assets/source.

    pip install pillow numpy
    python3 tools/build-assets.py
"""
from PIL import Image
import numpy as np, pathlib, sys

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


EXPR_SRC = 'assets/chars/expressions/full_frames'
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


def build_expressions():
    """Emit ONE headless body plus a head-only overlay per expression.

    The obvious build -- flatten each delivered frame into its own full sprite --
    was tried first and rejected on measurement. The delivered frames are our
    sprite upscaled 2x with a new head, so flattening them means re-encoding the
    body seven more times; lossy WebP then left 0.3% of body pixels differing by
    more than 24/255 along the bike outlines, which is a shimmer on a character
    who is standing still while his face changes. Encoding losslessly fixes that
    but costs 532KB instead of 207KB.

    Stacking a transparent head over one shared body file is both exact and
    smaller: 79KB for the whole set, and the body is literally the same decoded
    image in every frame because it is the same file.

    The ears drift: hue is spot on across the set (within 1.2 degrees) but
    saturation is not, and three frames came back noticeably washed out. The
    correction is measured against the approved still rather than typed in, so it
    stays right if the pack is ever regenerated."""
    src = ROOT / EXPR_SRC
    base_p = CH / 'jhumru_cycle_still.webp'
    if not src.exists() or not base_p.exists():
        print('skip expressions (no pack)'); return
    base = Image.open(base_p).convert('RGBA')
    seam = EXPR_SEAM * base.height // 880
    total = 0

    body = base.copy()
    body.paste((0, 0, 0, 0), (0, 0, base.width, seam))
    dst = CH / 'jhumru_cycle_body.webp'
    body.save(dst, 'WEBP', quality=88, method=6)
    total += dst.stat().st_size
    print('body ', f'{dst.name:24s}', body.size, f'{dst.stat().st_size / 1024:.0f}KB')

    def head_of(im, tag, sat=1.0, val=1.0):
        nonlocal total
        h = im.crop((0, 0, im.width, im.height))
        h.paste((0, 0, 0, 0), (0, seam, im.width, im.height))
        d = CH / f'face_{tag}.webp'
        h.save(d, 'WEBP', quality=88, method=6)
        total += d.stat().st_size
        print('face ', f'{tag:24s}', h.size, f'sat x{sat:.2f} val x{val:.2f}',
              f'{d.stat().st_size / 1024:.0f}KB')

    head_of(base, 'neutral')

    ref = Image.open(src / 'jhumru_cycle_still.png').convert('RGBA')
    _, ref_s, ref_v = warm(ref, EXPR_SEAM)
    for name in EXPR:
        p = src / f'{name}.png'
        if not p.exists():
            print('skip (missing)', name); continue
        im = Image.open(p).convert('RGBA')
        m, s0, v0 = warm(im, EXPR_SEAM)
        hsv = np.array(im.convert('RGB').convert('HSV')).astype(float)
        hsv[..., 1][m] = np.clip(hsv[..., 1][m] * (ref_s / s0), 0, 255)
        hsv[..., 2][m] = np.clip(hsv[..., 2][m] * (ref_v / v0), 0, 255)
        rgb = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
        fixed = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
        head_of(fixed.resize(base.size, Image.LANCZOS),
                name.replace('still_', ''), ref_s / s0, ref_v / v0)

    print(f'       seam y={seam} of {base.height}; total {total / 1024:.0f}KB')
    print('       NOTE: the seam crosses the OPEN MOUTH, so the lower lip and '
          'tongue are\n'
          '       shared by every expression -- closed-mouth variants are not '
          'possible from\n'
          '       this pack. A future round would need the seam at y=162, below '
          'the mouth\n'
          '       and through the flat blue strap instead.')


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

if __name__ == '__main__':
    main()
