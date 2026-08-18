# Immersive scene playbook — reusable

Game-agnostic. Everything here was learned building the Word Tree opening, written
so it can be pointed at a different game, setting and cast without editing the
method.

Replace the angle-bracket placeholders and go:
`<SETTING>` `<CAST>` `<PALETTE>` `<HERO>` `<SUBJECT>` `<FRAME_W>×<FRAME_H>`

Read Part 1 before generating art. Most wasted art comes from committing to a
mechanic that had not been tested as an idea yet.

---

# Part 1 — Ideation

## 1.1 The one test that matters

> **Swap the subject matter for arithmetic. Does the game still work identically?**
> If yes, the teaching is decoration and the design is wrong.

This is Habgood & Ainsworth's *intrinsic integration* in one sentence. A quiz with
a beautiful scene painted behind it fails it. "Tap the right tile" fails it — you
can put sums on tiles.

It passes when the **action is the meaning**: the word bears your weight, the
opposite flips the world, the two keys open the same lock.

Apply it before you draw anything.

## 1.2 Load rules that survive contact with a real child

| rule | why |
|---|---|
| **Signal the task perceptually, not verbally** | A rule to remember costs working memory every round. A friend waiting vs a glowing stone costs nothing |
| **N options is only expensive if you must compare all N** | Reach them in sequence and four costs barely more than two |
| **Wrong answers must be physical, non-punishing, and informative** | Best case: a wrong choice *removes an option and teaches its word*, so the puzzle gets easier |
| **Progress should be diegetic** | A tree filling or height climbed beats a counter; nothing to track |
| **One screen beats many** | Every new location is a new image to read: where is the ground, who is here, what changed |
| **Nothing timed at the first difficulty** | Let them stare at it |
| **One large continuous input** | A hold or a sweep is far more forgiving than a precise tap-and-release |

## 1.3 Immersion levers, cheapest first

1. **Occlusion.** A foreground layer passing *in front* of the character. This does
   more to make a sprite belong in a scene than anything else on this list, and it
   is one extra layer.
2. **Contact shadow**, plus sinking the character slightly *into* the surface
   rather than balancing on its top edge.
3. **Parallax** — layers at different rates. See Part 2.
4. **Ambient audio at a level you barely notice.** If you can hear it clearly it is
   too loud.
5. **Diegetic progress.** The world changes as they succeed.
6. **A camera that travels.** Expensive; do the five above first.

## 1.4 Ideation worksheet

Fill this in before opening an image model.

```
SUBJECT              what is being taught
LOGICAL SHAPE        sorting / polarity flip / equivalence / sequence / matching
ACTION THAT IS THAT SHAPE
                     ................................................
INTRINSIC TEST       swap subject for arithmetic -- does it still work?  yes = redesign
INPUT                one hold / one sweep / one tap on a large target
WRONG-ANSWER RESULT  physical, non-punishing, and teaches what?
PROGRESS METER       what visibly changes in the world
SCREENS              one, or a trail? if a trail, what does travel buy you?
FOUR-OPTION FORM     are they reached in sequence, or scanned at once?
```

## 1.5 Mockup before assets, always

**One image of the whole screen with the mechanic in play** — characters, props,
everything baked in, purely to be looked at and argued with. It kills a bad idea in
one generation.

Only then generate transparent production assets. A prop pack for a mechanic that
reads badly is a wasted afternoon.

---

# Part 2 — The parallax recipe

## 2.1 The layer model

The plane the character stands on is rate **1.0**. Everything slower is behind
them, everything faster is in front.

| layer | rate | authored as | repeats |
|---|---|---|---|
| far sky / distant haze | 0.20 | opaque, full frame | yes, tileable |
| mid band (trees, hills, buildings) | 0.50 | alpha above and below the band | yes, tileable |
| **action plane** | **1.00** | N unique segments, one frame each | no |
| — the character lives here — | | | |
| near fringe | 1.40 | alpha, low strip | yes, tileable |

Total camera travel = `(N segments − 1) × frame width`. Three segments gives two
screens of travel.

**The near fringe is not optional.** It is the layer that makes the character
belong in the scene, because it passes in front of their feet.

## 2.2 Camera as a fraction, never as pixels

Store camera position as `0..1` across the whole world. Recompute every pixel from
the *live* frame width in a `layout()` you can call again on resize.

Bake pixels in at build time and any size change desynchronises the layers from the
character — they end up standing at the wrong ground height while the wrong part of
the world is on screen.

## 2.3 One clock

Position the layers **and** the actors from the same value on the same tick. Two
separate animations with "the same" duration and easing will drift, and the drift
shows as a character sliding relative to the ground.

Drive it from `requestAnimationFrame`, deriving progress from a clock you own —
not from `setTimeout`. That gives tab-switch pausing for free and stops a stall
from jumping the timeline.

## 2.4 Ground height is per-segment

Different segments have different walkable heights (a path, a bridge deck, a
clearing floor). Store a `[camera fraction, y%]` track and interpolate.

**Measure the ground off the art by colour, not by alpha.** Topmost-opaque finds
the bushes standing *behind* a path and leaves the character floating above it.

---

# Part 3 — Prompt packages

## 3.0 Workflow

1. Generate **one** asset and iterate until the style is exactly right. That is
   your **style anchor**.
2. Attach the approved anchor to every subsequent generation. Never rely on words
   alone to hold style — these models drift hard between calls.
3. For layer splits and paired states, work by **editing the master file**, never
   by generating independently. Registration is the whole job.

**Never ask for text in an image.** Models garble lettering, and you want words
drawn at runtime anyway so content can change without new art. Ask for **blank
plaques, blank faces, blank plates** — a shape with a clear empty surface.

**Output size.** Expect roughly 1536×1024 landscape or 1024×1536 portrait. Ask for
the *aspect*, accept the size, upscale in the build — and record the real detail
ceiling so nobody later mistakes an upscale for native resolution.

## 3.1 Block S — style constants

Paste at the top of every prompt.

```
Match the attached reference image EXACTLY in art style, colour palette, line
quality and rendering technique. Treat the reference as the single source of
truth for style. Do not stylise differently.

Flat, poster-clean 2D <ART STYLE> for a <AUDIENCE> game. Palette: <PALETTE>.
No film grain, no noise, no paper or canvas texture, no painterly brush marks,
no 3D render look, no photographic realism.

CAMERA
- <CAMERA HEIGHT, e.g. eye level of a small animal, roughly 40cm off the ground>,
  looking straight ahead.
- The ground plane must be seen nearly EDGE-ON. Do not tilt the ground toward the
  viewer. Do not use a bird's-eye or top-down angle.
- Horizon at <52>% of image height, identical in every asset in this set.

CLEAN COMPOSITION -- the most important instruction
- Calm, open and uncluttered. Restraint over detail.
- Hard budget for the whole image: AT MOST <3> <plant clusters>, AT MOST <2>
  <rocks>, AT MOST <4> <clouds>. Do not add more. Empty space is correct here,
  not unfinished.
- Large areas of flat uninterrupted colour are wanted.

RESERVED EMPTY SPACE -- keep these genuinely empty
- Top <18>%: plain <sky> only. UI and a speech bubble sit there.
- Bottom <26>%: plain, clear <ground>. Characters stand there.
- Nothing may intrude more than <12>% inward from the left or right edge except
  where an edge occluder is explicitly requested.

LIGHTING
- Soft even <late-morning> light from the <upper left>.
- No cast shadows across the ground, no rim light, no lens flare, no god rays,
  no vignette. Identical in every asset in this set.
```

> **Why the countable budget.** "Clean" and "simple" mean nothing to these models —
> they default to maximalism. A number you can check by counting is the only
> instruction that survives. If a result exceeds it, regenerate; do not accept and
> crop.

## 3.2 Block N — negative prompt

Append to every prompt. Add your own domain bans to the front — whatever the model
keeps reaching for that you do not want. (For a jungle it was rope bridges, every
single time.)

```
Do NOT include: <YOUR DOMAIN BANS>; any text, letters, numbers, words, writing or
signage of any kind; any UI, buttons, icons, arrows or speech bubbles; any
watermark or logo; any border or frame; any characters, people or creatures
[omit this clause for mockups]; any cluttered or busy composition; any top-down
or tilted-ground angle; any cast shadows across the ground; any dark, moody or
scary atmosphere; any photographic realism; any 3D render look.
```

## 3.3 The master plate

Generate this first. It is the style anchor and the source of every layer.

```
[Block S]
Landscape, 16:9. A BACKGROUND PLATE -- no characters.

<SCENE DESCRIPTION: one sentence of what the place is, then the specific
elements you need, then what must stay clear>

EDGE OCCLUDERS: a broad vertical <tree trunk / rock pillar / column> flush against
the left edge and another flush against the right edge, both cropped by the frame,
running the full height.

[Block N]
```

> **Why edge occluders.** An image model will not give you segments that join
> invisibly. Do not ask it to. Put every seam **behind a full-height foreground
> object** and a few pixels of mismatch disappear. This is the difference between
> a usable set and weeks of retouching.
>
> Note that this alone is not enough: two adjacent segments each carry *half* an
> occluder, so the join still shows as a hard edge with a tonal step. Cut one
> occluder out as a separate feathered sprite and lay it **over** each join. See
> §4.2.

## 3.4 The layer split

**Attach the approved master. Never generate layers independently.**

```
Attached is the master plate. Return the SAME image at the SAME dimensions with
pixel-for-pixel identical framing -- do not redraw, restyle, reposition, rescale
or relight anything that stays.

Keep ONLY: <LAYER CONTENTS>
Delete everything else and make it fully transparent.

Where deleting an element reveals nothing behind it, paint in what would
plausibly be there, continuing the surrounding art exactly. Do not leave holes,
smears or halos. Keep edges clean and slightly anti-aliased for compositing.
Output a PNG with a true alpha channel. No checkerboard pattern drawn into the
image, no matte colour, no drop shadow.
```

Per-layer contents, following Part 2:

| layer | keep only | extra instruction |
|---|---|---|
| far | sky, clouds, the most distant band, heavy haze, no detail | fully opaque; **extend 20% wider** than the frame |
| mid | the middle-distance band; lighter and more desaturated than foreground | transparent above **and** below the band |
| action | the walkable plane and everything standing on it | transparent sky |
| near | the closest foliage/debris, low strip, **sparse with real gaps** | transparent above; must never rise high enough to cover a character's head |

Add to every tileable layer:

```
SEAMLESS TILING: the left and right edges must match exactly so the image can
repeat horizontally forever with no visible join.
```

…and then **verify it yourself**, because it usually will not (§4.1).

## 3.5 Paired states (before → after)

Never generate the two states independently — they must sit still under a
crossfade.

```
[Block S]
The SAME <scene> as the attached image, pixel-for-pixel identical framing, with
ONE change: <THE CHANGE>. Everything else identical -- same camera, same light,
same position and size for every element that stays.
[Block N]
```

## 3.6 Props for cutout

```
[Block S]
A single game PROP, centred and isolated on a plain flat mid-grey background for
easy cutout. No scene, no environment, no ground. Soft contact shadow directly
beneath the object only, none cast onto the background. Square 1:1, generous even
margin.

<PROP DESCRIPTION>, with a completely BLANK <front face> ready for a mark.

[Block N]
```

For a state change, attach the approved prop:

```
[Block S]
The SAME <prop> as the attached image, in the SAME style and colour, now
<STATE: crumbling / sinking / lit / open>. Same plain flat mid-grey background,
isolated for cutout.
[Block N]
```

## 3.7 Character sprites

```
[Block S]
The SAME <CHARACTER> as the attached reference, in a <POSE> seen from the
<side>: <POSE SPECIFICS>. Isolated on a plain flat mid-grey background for
cutout. Full body, generous margin.
[Block N]
```

**Match the camera.** If the ground is drawn from slightly above, a character
drawn in flat side profile at eye level will read as a sticker no matter how well
you composite it. Ask for the character at the *same* angle as the scene — for a
wheeled character, wheels as ellipses rather than circles.

## 3.8 The mockup (§1.5)

Drop the "no characters" clause from Block N and bake everything in.

```
[Block S]

<SCENE>, with <N> <OPTION OBJECTS> arranged <HOW>, each with a completely BLANK
<face>. They must read as <N> separate choices, all equally reachable, none
looking like the obvious answer.

<CHARACTER> stands <WHERE>, about one <fifth> of the image height.

[Block N -- minus the no-characters clause]
```

**What to check in every mockup:** do the options read as *alternatives for one
decision* rather than as scenery or a sequence? Do they survive at thumbnail size?
Is the blank face big enough to carry a word legibly?

---

# Part 4 — Asset pipeline traps

Each of these cost real time. All are cheap to check.

## 4.1 "Tileable" art usually is not

Measure it. Compare the wrap-edge difference against a normal adjacent-column
difference in the same image:

```python
im = np.array(Image.open(f).convert('RGBA')).astype(int)
edge     = np.abs(im[:, 0, :] - im[:, -1, :]).mean()
interior = np.abs(im[:, 100, :] - im[:, 101, :]).mean()
# edge should be within ~1x interior. 10x means a visible seam.
```

**Fix A — mirror.** Emit `[A | flip(A)]`. Both the internal join and the wrap
become exact by construction. Invisible on uniform texture (sky, grass, canopy).

**Fix B — roll.** Mirroring makes a *distinctive* shape read as an obvious
butterfly. If the layer is sparse and its content sits near the edges, roll it half
a width instead: the content moves to the centre, both edges become empty, and it
tiles for free with no symmetry.

Choose by content, not by habit: **uniform → mirror, distinctive → roll.**

## 4.2 Segment joins need a spanning occluder

Two abutting half-occluders read as a hard vertical line with a tonal step between
plates. Cut one occluder from a plate edge, feather both sides to transparent, and
lay it over each join in the action layer. **Do not mirror it** — bark, brick and
stone all show the butterfly.

The joins land at the frame edge whenever the camera is parked, so this only shows
*while travelling* — which is exactly when someone will notice.

## 4.3 A "fringe" layer may be a vignette

Delivered foreground layers often contain both a bottom strip **and** top-corner
content with a gap between. Placed at the bottom of the frame, the top content
lands mid-screen and gets sliced. Check the alpha profile by horizontal band and
split it into two layers.

## 4.4 Crop sprites to their union bbox

Raw character exports are often a small figure on a huge empty canvas. Compute the
union bbox **across all frames** (never per-frame, or the animation loses its bob)
and crop to it. You get a third of the bytes and, more importantly, `left`/`top`
then address the character instead of an invisible canvas.

## 4.5 Animated WebP over GIF — with one warning

A third of the bytes and full 8-bit alpha instead of GIF's 1-bit hard edges.

**But some encoders' WebP *readers* report `duration=0` even when the file is
correct.** Do not conclude the format is broken. Parse the `ANMF` chunks:

```python
def anmf_durations(path):
    d = open(path,'rb').read(); i, out = 12, []
    while i < len(d) - 8:
        tag = d[i:i+4]; sz = struct.unpack('<I', d[i+4:i+8])[0]
        if tag == b'ANMF':
            p = d[i+8:i+8+sz]
            out.append(p[12] | (p[13] << 8) | (p[14] << 16))
        i += 8 + sz + (sz & 1)
    return out
```

Also: source loops often ship **duplicate consecutive frames** (merging them is
lossless — durations sum), and some ship **every frame delay set to 0**, which
plays at whatever speed the browser feels like. Always allow a per-loop override.

## 4.6 Free audio is unusably quiet

CC0 and public-domain packs are frequently 25–30 dB under level. Measure before
assuming your playback code is broken:

```js
const buf = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
const d = buf.getChannelData(0);
let peak = 0, sum = 0;
for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += d[i]*d[i]; }
// rms dBFS = 20*log10(sqrt(sum/d.length))
```

An ambience at RMS −51 dBFS is silent at any sane element volume, and
`HTMLAudioElement.volume` **cannot exceed 1.0** — so the gain has to be baked into
the file, not worked around at runtime:

```bash
ffmpeg -i raw.mp3 -af "loudnorm=I=-19:TP=-1.5:LRA=11" -c:a libmp3lame -b:a 112k out.mp3
ffmpeg -i raw.ogg -af "volume=3.0,alimiter=limit=0.85" -c:a libvorbis -q:a 4 out.ogg
```

Then check you did not overshoot into clipping (peak > 1.0), and keep the raw
downloads as regenerable source.

**Licensing:** only ship CC0 / public domain if you want no obligations. CC-BY
carries an attribution requirement — that is not "non-copyrighted". Record the
source URL and licence for every file, even when attribution is not required.

## 4.7 Ceilings are worth writing down

If your source art is 1672×941 and you build 1920×1080 plates, the extra pixels are
interpolation. Note it next to the build constants so nobody later mistakes the
output size for real detail.

---

# Part 5 — Runtime checklist

| | do this | or else |
|---|---|---|
| **Units** | Author in one design space. Convert with a single unit — a CSS custom property off `cqw`, and one helper in JS. Ban raw px inside the frame | half the scene scales and half does not |
| **Camera** | A fraction, plus a `layout()` that recomputes pixels from the live frame size, called on resize | resize desyncs layers from characters |
| **One clock** | rAF-driven, progress from a clock you own, per-frame delta clamped | tab switch runs the story invisibly; stalls jump the timeline |
| **Pause** | `document.addEventListener('visibilitychange', …)` — it fires on `document` — plus `blur`/`focus`. Stop audio and speech with it | music plays to an empty room |
| **Audio gate** | An explicit title/Play tap **before** any story | browsers block audio until a gesture, so the music arrives after the story ends |
| **Audio honesty** | Show real state in the UI; clear the "off" look only when playback actually reports playing. First tap should turn sound ON, not mute | a silent game with an icon claiming otherwise |
| **Sprite swaps** | `object-fit: contain` with bottom anchoring, box sized for the **widest** sprite | a wide walk cycle stretches into a narrow idle's box |
| **Grounding** | Contact shadow, sink slightly into the surface, and a near layer passing in front | the sticker look |
| **Teardown** | Your scene reset must drop **event listeners and audio loops**, not just DOM nodes | a stale tap-to-skip fires inside the next scene |
| **Growth** | Anchor characters at the feet, so resizing never repositions them | scaling a character moves it |

---

# Part 6 — QA checklist

Run before accepting any art set.

- [ ] Camera and horizon identical across the set. Flip between images to check.
- [ ] Ground seen edge-on, not tilted or top-down.
- [ ] Reserved bands genuinely empty — cover them and confirm nothing is lost.
- [ ] Detail budget respected. **Count them.** Over budget means regenerate, not crop.
- [ ] No text anywhere. Zoom in; models sneak gibberish onto signs and bark.
- [ ] Alpha is real transparency — composite over solid magenta and look for halos
      and matte fringes.
- [ ] Tileable layers actually tile (§4.1 measurement, not eyeball).
- [ ] Segments butt together: lay them side by side and confirm the ground line
      meets at every join.
- [ ] Full-height occluders present at segment edges, plus a spanning occluder
      over each join (§4.2).
- [ ] Paired states line up: overlay at 50% and confirm everything except the
      changing element sits still.
- [ ] Audio measured, not assumed. Peak below 1.0, RMS in a sane range.
- [ ] Character sprite camera matches the scene camera.

---

## One last thing, learned the hard way

**Verify by measurement, and look at the picture.** Across this build, four
separate "seams" turned out to be a tree trunk, a speech bubble, a character's hat,
and a false theory about subpixel rendering — each found by a metric that could not
tell content from defect. And one apparently-working fix had silently never been
applied, because a shell `&&` short-circuited before it ran.

A metric with no eyes finds phantoms. Eyes with no metric miss a −51 dBFS audio
file. Use both, and re-check that an edit actually landed before believing it did.
