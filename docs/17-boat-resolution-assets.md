# The Boat — resolution screen asset package

The pay-off. He has read the river, and there is a boat. He leaps in with the bicycle,
the bicycle rests on the deck, and the boat carries him on down the water.

Built to [docs/10](10-immersive-scene-playbook.md), same as
[docs/14](14-broken-bridge-assets.md) and [docs/15](15-raft-building-assets.md).

**This is a small package, and that is the finding, not a shortcut.** The whole
background stack already exists and is already correct for open water. Read the next
two sections before commissioning anything — most of what a boat scene needs is
sitting in `assets/` already, and there is exactly one thing missing that matters.

---

## The one asset that actually matters

Measured in the running game, not taken from the previous doc:

| layer | where its **painted rows** land, as % of frame height |
|---|---|
| `water_far` | 62.0 – 99.9 |
| `water_near` | **94.8 – 97.4** |
| `near_reeds` | 86.3 – 98.9 |
| *the waterline* | *78.4* |
| *a boat hull would occupy* | *78.4 – 82.5* |

docs/15 §"Why those three matter" claims `water_near` at rate 1.22 "passes in front of
the hull and cuts the waterline… that is what makes him float *in* the water instead of
sitting on top of a painted river." The intent was right and the layer is ordered
correctly — its box spans 68.6%–100% and its z-index is above the action plane. But the
delivered strip paints its ripples in the bottom sixth of its own canvas, so on screen
they land at **95%–97%**: the very bottom of the frame, nowhere near the waterline.

**Nothing in the shipped game crosses 78%–82%.** The raft survives that because it is
two logs sitting almost flush with the surface, with barely any hull to cut. A boat has
freeboard — a visible side standing proud of the water — and an uncut hull edge against
flat water is precisely the "pasted cutout" read that the shore edge already had to be
rebuilt to fix (`taper_shore()`, commit `8de473b`).

So the first asset below, **`water_cut`**, is not decoration. It is the one thing
standing between this scene and a boat sticker on a water photograph. If only one asset
gets made, make that one.

---

## What carries over free — do not re-commission

| layer | file | size | rate | still correct here? |
|---|---|---|---|---|
| far sky | `far_sky` | 3840×1080 | 0.20 | yes — same river, same day. **Do not warm it for an ending** (see below) |
| distant water + far reed line | `water_far` | 3840×1080 | 0.62 | yes |
| shore he leaps from | `act_raft_bank` | 1920×1080 | 1.00 | **yes — plate 1 of this scene is the existing shore plate**, tapered end and all |
| open water | `act_raft_open` | 1920×1080 | 1.00 | yes — it is a deliberate empty spacer, which is exactly what open water needs |
| near ripples, bottom of frame | `water_near` | 3840×340 | 1.22 | yes, but for the *bottom* of the frame only — see the table above |
| top fringe | `near_leaves` | 3840×169 | 1.40 | yes at the shore, **wrong once he is out** — fade it off in code, don't redraw it |
| foreground reeds | `near_reeds` | 3840×300 | 1.62 | **no** — reeds grow at a bank, not mid-river. Replaced free, see §3 |
| rider on the bicycle, parked | `jhumru_still_body` + the six `face_*` | 458×682 | — | **yes — and this is what keeps all six expressions working on the resolution screen** |
| rider mid-air with the bicycle | `wheelie_lift` / `_hold` / `_land` | 467×429 | — | **probably yes for the leap** — see §2 |

Opening on `act_raft_bank` is worth saying out loud: the previous scene ends with him
stopped at that shore, so starting here means the cut is invisible. Same taper, same
logs, same ground height. Nothing to match by hand.

### Resist the sunset

An ending wants warmer light. Do not get it from new art — `far_sky` and `water_far`
would both have to be regenerated, the shore plate would no longer match, and Block N
bans golden-hour colour across this whole set for that reason. If the resolution wants
warmth, it is a single CSS gradient over `#stage` at runtime, costs nothing, and can be
tuned without a regeneration. Keep the art consistent.

---

## The layer stack

Nine layers. One is new.

| # | file | size | rate | drift | new? | role |
|---|---|---|---|---|---|---|
| 1 | `far_sky` | 3840×1080 | 0.20 | — | — | opaque, covers the frame |
| 2 | `water_far` | 3840×1080 | 0.62 | 0.030 | — | distant water, far reed line |
| 3 | `act_boat_*` | 1920×1080 ×3 | 1.00 | — | reuse | shore → open water → *(optional far shore)* |
| 4 | **`water_cut`** | **3840×340** | **1.30** | **0.085** | **NEW** | **the band that crosses the hull at the waterline** |
| 5 | `water_near` | 3840×340 | 1.22 | 0.078 | — | bottom-of-frame ripples |
| 6 | `water_near` 2nd pass | — | 0.96 | 0.045 | — | interference, so a sparse texture reads as alive |
| 7 | CSS sheen | — | 1.10 | 0.104 | — | tilted highlight streaks, no asset |
| 8 | `near_leaves` | 3840×169 | 1.40 | — | — | top fringe, faded off as he leaves the bank |
| 9 | `water_near` 3rd pass, scaled ×1.4 | — | 1.70 | 0.130 | — | replaces `near_reeds` — bigger ripples read as nearer. Free |

**Layer 4 sits above the action plane (z 6) and below nothing.** It is the only layer
whose paint is allowed in the 76%–84% band, and it must be sparse enough to see the
boat through.

**Layer 9 is free and should be tried before commissioning anything.** The scene
already runs `water_near` twice at different rates precisely because one pass of a
sparse texture reads as still; a third pass at 1.70 with `background-size` scaled up
1.4× gives larger, nearer-looking ripples from art that is already in the build. If it
is not enough, §7 has a prompt for a purpose-drawn `water_fore`.

### This scene's motion is nearly all drift

Worth stating because it changes how the art is judged. The boat is the camera's
subject: it stays near frame centre and barely moves across the world. So almost none of
the motion comes from the camera panning — it comes from the water drifting past. The
drift rates in the table are the ones the river scene now runs at (raised ~1.9× in
`3ab1971`), and this scene leans on them harder than any before it.

Consequence for the artist: **every water layer here must tile perfectly**, because
these will be scrolling continuously and in view for the whole scene. A seam that the
raft crossing got away with in two seconds will come round four times here.

---

## The geometry contract

Derived from the shipped rider box and the shipped waterline, not eyeballed. A prop that
misses these puts him in the air, underwater, or sliding off a deck.

```
Frame                    1920 x 1080 design units
Horizon                  62%      (far_sky at its palest 60-65%)
Waterline                78.4%    LOCKED -- the water layers are unchanged
Rider box, parked        234 x 348 units  = 12.2% x 32.2% of frame
Rider box, mid-air       467 x 429 canvas, drawn at 314 units tall
Rider anchor             the REAR WHEEL, at 25.22% across his box
```

### The boat

```
Canvas                   1152 x 384, RGBA, real transparency  (3:1)
On screen                600 x 200 units = 31.2% x 18.5% of frame

  fraction of canvas height        lands at, % of frame
  gunwale, top of the side  0.26   ->  70.3%
  DECK, where wheels rest   0.40   ->  72.8%
  WATERLINE                 0.70   ->  78.4%
  hull bottom               0.92   ->  82.5%
```

Three of those numbers are load-bearing:

- **The deck at 0.40 of the canvas** puts him at **72.8%** of frame height, which is
  2.6% higher than the raft's deck at 75.4%. That difference *is* the freeboard, and it
  is why this scene needs `water_cut` and the raft did not.
- **The waterline at 0.70** is what the runtime aligns to 78.4%. Get this wrong and the
  boat floats above the river or sinks into it.
- **The hull must be drawn all the way down to 0.92**, opaque, below its own waterline.
  It is meant to be covered. A hull that stops at the waterline has nothing for
  `water_cut` to cross, and the whole point is lost.

His head ends up at **40.6%** of frame height — clear of the top 18% reserve, and above
the horizon, which is correct for a near subject.

The boat is **2.6× his box width**, so a 234-unit bicycle-and-rider sits on a 600-unit
deck with room to spare. That reads as a boat he is *in*, not one he is balanced on.

### Which way round

- **Bow at the RIGHT.** He travels right in every scene in this game.
- **The left end must be boardable** — an open stern or a low gunwale on the left. He
  leaps in from the shore, which is behind him on the left. A boat walled in on all four
  sides makes the leap look like he lands on top of it.
- **Drawn dead level, no tilt.** The bob is a runtime rotation on the sprite (±1.5°,
  ±1.2% of frame height, on the game clock). A tilt baked into the art fights it and
  reads as a permanent list.
- **The deck must be flat across its whole length**, not curved. He is placed by his
  rear wheel at one y value; a curved floor makes him look like he is sliding.

---

## Block S — style constants, paste at the top of every prompt

Attach **`assets/source/px_act_clearing.png`** as the style anchor, plus **the approved
`master_river`** from docs/15 so the water matches the scene it is joining.

```
Match the attached reference images EXACTLY in art style, colour palette, line quality
and rendering technique. Treat them as the single source of truth for style. Do not
stylise differently.

Flat, poster-clean 2D cartoon jungle for a children's game, ages 6-7. Warm and bright:
ochre earth, saturated leaf greens, pale blue sky, warm pale plank wood. No film grain,
no noise, no paper or canvas texture, no painterly brush marks, no 3D render look, no
photographic realism.

CAMERA
- Side-on, flat, at the eye level of a small rider on a bicycle. Looking straight
  ahead.
- The water must be seen nearly EDGE-ON. Do not tilt it toward the viewer. No
  bird's-eye, no top-down, no three-quarter view. Do not show the inside of the boat
  from above.
- Horizon at 62% of image height, identical in every asset in this set.

CLEAN COMPOSITION -- the most important instruction
- Calm, open and uncluttered. Restraint over detail.
- Large areas of flat uninterrupted colour are wanted.

LIGHTING
- Soft even late-morning light from the upper left.
- No cast shadows, no rim light, no lens flare, no god rays, no vignette. Identical in
  every asset in this set.
```

## Block N — negative, append to every prompt

```
Do NOT include: any sunset, sunrise, dusk or golden-hour colour; any waterfall, rapids
or white water; any storm, rain or dark cloud; any sail, mast, flag, motor, propeller or
outboard; any anchor, chain, rope coil or lifebuoy; any crocodile, fish, turtle or bird;
any mirror-perfect reflection of the sky; any mist or fog bank; any text, letters,
numbers, words, writing or signage of any kind; any UI, buttons, icons, arrows or speech
bubbles; any watermark or logo; any border or frame; any cluttered or busy composition;
any top-down or tilted-ground angle; any cast shadows; any dark, moody or scary
atmosphere; any photographic realism; any 3D render look.
```

> Note the reversal: docs/15's Block N banned boats outright, because a boat appearing
> in the raft scene would have given the puzzle away. That ban is lifted here and only
> here.

---

# The prompts

Ordered by how much they matter. **1 is required. 2 and 3 are probably free. Stop after
4 unless the scene needs more.**

## 0 · The mockup — generate this FIRST

Playbook §1.5. One image of the whole screen, purely to be argued with.

```
[Block S, and DELETE the characters ban from Block N]

Landscape 16:9. A single finished game screenshot, not an asset.

A small grey cartoon elephant in blue dungarees sits on his little red bicycle, and
both of them are resting inside a small open wooden rowing boat that is drifting down
a calm, wide jungle river. The boat's bow points to the right. Bright, sunny, calm and
triumphant -- this is the happy ending of a journey.

Show the water clearly as a horizontal band with gentle ripples. Show ripples and a
little foam CROSSING THE SIDE OF THE BOAT at the waterline, so the boat is clearly
sitting IN the water rather than on top of it.

[Block N, minus the characters clause]
```

**Argue with it before going on.** Does he look like he is *in* the boat? Is the boat
big enough for him and the bicycle without looking like a barge? Does it read as an
ending?

---

## 1 · `water_cut` — the band that crosses the hull  ★ REQUIRED

The whole package. Read "The one asset that actually matters" above before drawing it.

The row numbers below are not stylistic — they are derived from where a bottom-pinned
340-unit strip lands on a 1080-unit frame. Rows 80–170 of the canvas land at 75.9%–84.3%
of frame height, straddling the hull's 78.4%–82.5%.

```
[Block S]
A 3840 x 340 pixel layer -- twice the frame width, a low wide strip. No characters, no
boat, no bank.

A narrow band of near water-surface ripples, seen almost edge-on: clean horizontal
ripple lines with small crisp white foam highlights, in warm jungle green-blue, matching
the attached river master exactly in colour.

THE VERTICAL PLACEMENT IS THE ENTIRE POINT OF THIS ASSET:
- Rows 0 to 70 (the top of the strip): FULLY TRANSPARENT. Real alpha.
- Rows 80 to 170: this is the ONLY band that may contain anything. All the ripples and
  all the foam live here, in a strip 90 pixels tall across the full 3840px width.
- Rows 180 to 340 (the bottom of the strip): FULLY TRANSPARENT. Real alpha.

Do not centre the content. Do not fill the strip. The painted band sits in the UPPER
THIRD of the canvas and everything else is empty.

SPARSE -- this layer passes IN FRONT of a boat and its rider, so it must have real
gaps. At most 5 ripple groups across the whole 3840px width, each 200-400px wide, with
large fully transparent gaps between them. The gaps matter more than the ripples.

Soften the top and bottom edges of each ripple group so they fade to transparent rather
than ending on a hard line.

SEAMLESS TILING: the left and right edges must match exactly so the image can repeat
horizontally forever with no visible join. This layer scrolls continuously and stays on
screen for the whole scene, so a seam will come round several times.

[Block N]
```

**Check, and this is the one check that decides the scene:** lay the strip over the
mockup with its bottom edge on the mockup's bottom edge. The ripples must land ON the
side of the boat, roughly a third of the way up its hull. If they land at the bottom of
the frame, it is the asset we already have and it will not work. If you can no longer
see the boat, it is too dense.

---

## 2 · The leap — try the existing wheelie frames first

`wheelie_lift` / `wheelie_hold` / `wheelie_land` are already in the build: a rider and
his bicycle, off the ground, on a shared 467×429 canvas at `hu` 314. The runtime already
has `o.air(a, tilt)` — it arcs a sprite, shrinks and lifts its contact shadow away, and
tilts it — and the river scene already uses it to hop the logs.

**So build the leap in code first and commission nothing.** It costs one afternoon to
try, and if it reads, the package is one asset long.

The known risk: a wheelie is front-wheel-up with the rear wheel down, and a leap is both
wheels off the ground. At the top of a fast arc, with a tilt on it and no shadow under
it, that difference may not be legible. If it isn't, here is the prompt.

```
[Block S]
THREE game sprites of the SAME character in the SAME art style as the attached
reference, delivered as three separate images on ONE shared canvas size, on a plain
flat mid-grey background for easy cutout. No scene, no environment, no ground, no
water. Wide landscape, generous margin.

A small grey cartoon elephant in blue dungarees on a little red bicycle, seen side-on,
facing and travelling to the RIGHT, LEAPING through the air. BOTH wheels are clearly
off the ground in all three images.

Frame 1 -- take-off: crouched low over the handlebars, the bicycle just leaving the
ground, nose beginning to rise, body tense and leaning forward.
Frame 2 -- apex: fully airborne and level, both wheels well clear, body upright and
relaxed, ears lifted, delighted. This is the frame that will be on screen longest, so
it is the one to get right.
Frame 3 -- landing: nose down, front wheel reaching for the ground ahead, knees
absorbing, body settling.

CRITICAL -- the three frames must register:
- Identical canvas size and identical framing in all three.
- The character is the SAME SIZE in all three. Do not rescale him between frames.
- His REAR WHEEL must be at the same horizontal position in all three, so the sprite
  can be swapped mid-flight without him jumping sideways.
- Same palette, same line weight, same lighting in all three.

[Block N, and add: no motion blur, no speed lines, no dust cloud, no impact stars]
```

**Delivery check:** stack the three at 30% opacity. The rear wheels must sit within a
few pixels of one another horizontally. `build_wheelie()` in `tools/build-assets.py`
already crops a set like this to one shared bbox and prints the `hu`/`ar`/`ax` the
runtime needs — the same machinery, no new code.

---

## 3 · The rider at rest — reuse, and here is the condition

`jhumru_still_body` plus the six registered `face_*` heads gives the resolution screen
**all six expressions for free**, which is worth more to an ending than a new pose. He
is sitting on the parked bicycle; the bicycle stands on the deck. "The bicycle rests on
the boat" is satisfied, and the character can react.

Use it. The boat's deck is specified flat and 2.6× his width precisely so this sprite
lands on it cleanly.

**If you would rather have him lounging** — sat on the deck with the bicycle leaned
behind him, which is a nicer picture — that is a real upgrade, but it costs the
expression system unless it is delivered to the same contract that made expressions work
in the first place:

```
SEVEN images: one body and six heads, not six complete characters.

- ONE body image: the elephant sitting on the boat's deck, legs out in front, leaning
  back relaxed, with the little red bicycle resting on its side behind him. The body
  image has NO HEAD -- it stops cleanly at the neck.
- SIX head images on the SAME canvas at the SAME position, one per expression:
  neutral, proud, thinking, wow, asking, cheering.
- Every head must sit at the identical position and identical scale on the canvas. The
  blue hair tuft on top of his head is the registration landmark: it must be the same
  size and in the same place in all six.
- Draw each head COMPLETE, continuing well past the neck into the shoulders and chest,
  even though the lower part will be cut away. Do not stop the drawing at the neck.
- HARD alpha edges. Do not feather, blur or soften the cut edge of any image.
```

That last pair of instructions is not pedantry. The first expression pack came back as
six complete characters whose bodies differed by up to 163,000 pixels, so cross-fading
them morphed the bicycle; and its heads stopped mid-mouth at row 280, which put the
seam through the lips and produced a visible doubled mouth. Both are recorded in
[docs/16](16-expression-stills-brief.md), and both are avoided by the four lines above.

---

## 4 · `boat` — the boat itself  ★ REQUIRED

Generate this after the mockup is approved, and attach the mockup.

```
[Block S]
A single game PROP, isolated on a plain flat mid-grey background for cutout, seen
side-on. Canvas exactly 1152 x 384 pixels (3:1 landscape). Generous margin.

A small, simple, open wooden rowing boat, empty, seen from the side, with its BOW
pointing to the RIGHT. Warm pale plank wood matching the bridge planks in the attached
reference. Sturdy, friendly, cheerful -- a boat a child would want to get into. Simple
enough to read instantly at small size.

- Open on top: we see over the near gunwale into a flat plank floor.
- The near side is low enough to see the floor clearly, but high enough to read as a
  real side with thickness. A simple rubbing strake along the top of the side is welcome.
- The LEFT end is open and low -- a squared-off stern that could be stepped into.
- ONE simple bench thwart across the boat, set well toward the bow at the right, so the
  middle and left of the floor stay CLEAR AND EMPTY. A character and a bicycle go there.
- The floor is FLAT and LEVEL across the whole length. No curve, no camber, no step.
- The whole boat is drawn dead LEVEL. No tilt, no list, no perspective rotation.

EXACT VERTICAL GEOMETRY -- these are the numbers the game aligns to:
- The top edge of the near side (the gunwale) sits at 26% of image height.
- The flat plank floor -- the surface something standing in the boat rests on -- sits at
  40% of image height, and is level across the boat's whole length.
- The waterline -- where the outside of the hull would meet the water -- sits at 70% of
  image height. Do not draw any water. Mark nothing. Just place the hull so that this
  is where the water would be.
- The hull continues BELOW that line, fully painted and fully opaque, down to 92% of
  image height, where it ends in a rounded keel.

The part of the hull below 70% is meant to be covered by a water layer in the game.
Draw it properly anyway -- do not fade it, do not make it transparent, do not stop the
drawing at the waterline.

Everything outside the boat is FULLY TRANSPARENT -- real alpha, no water, no white, no
matte colour, no background fill, no drop shadow, no reflection.

[Block N, and add: no oars in the water, no boat name, no numbers on the bow, no
painted stripe with lettering]
```

Optional and welcome, as a **separate** image on the same canvas so it can be layered or
dropped: a single simple wooden **oar or pole lying flat along the floor**, `prop_oar`.
Do not draw it into the boat — a loose oar that can be added later is worth more than
one that is baked in.

**Delivery checks, in this order:**

1. Open it over magenta. Is everything outside the boat genuinely transparent?
2. Measure the three rows. The floor at 40%, the waterline at 70%, the hull bottom at
   92%, ±4 pixels. `build_boat()` will verify and print these; if they are wrong the
   build will say so rather than the game looking wrong.
3. Is the floor flat? Lay a ruler on it.
4. Is the middle-left of the floor clear for 230 units of bicycle?

---

## 5 · `fx_bow_wake` — the boat is moving  ◇ optional, high value for the money

Small, cheap, and it does a lot: a boat that pushes water looks powered; a boat that
does not looks parked.

```
[Block S]
A single small game EFFECT sprite, isolated on a plain flat mid-grey background for
cutout. Canvas 768 x 256 pixels. Generous margin.

A curl of clean white and pale blue water foam peeling away from the bow of a boat, seen
side-on, as if the boat is moving gently to the RIGHT. A soft rounded crest at the right
where the bow would be, trailing off to the LEFT into two or three thinning ripple lines
and a few small round bubbles.

Flat cartoon shapes with clean edges -- no spray droplets, no mist, no soft airbrushed
gradients, no motion blur. Gentle: this is a slow drift down a calm river, not a speed
boat.

The foam sits in the LOWER HALF of the canvas. The top 40% is FULLY TRANSPARENT.
Everything around the foam is FULLY TRANSPARENT -- real alpha.

[Block N]
```

A **second frame** of the same wake, with the ripple lines in slightly different
positions and the crest a little lower, lets the runtime alternate the two and the bow
comes alive for the price of one more image. Ask for it as `fx_bow_wake_b` on the
identical canvas.

---

## 6 · `act_boat_far` — the far shore arrives  ◇ optional, but it is the ending

The previous scene deliberately establishes that *there is no land further on*. This
plate is the answer to that: land, eventually, and the path going on.

If it is cut, the scene simply drifts on open water, which reads fine as an ending. If
it is made, it is the third act plate and the boat drifts toward it.

```
Attached is the river master plate. Match its style exactly. Landscape 16:9, 1920x1080,
no characters, no boat.

A welcoming far shore of the same river, seen from the water and now close: a low green
bank rising out of the water at 78% of image height, with the ochre path continuing to
the RIGHT at about 72% of image height, heading into taller sunlit jungle. A gentle
break in the trees where the path enters.

Everything BELOW 78% of image height is FULLY TRANSPARENT -- real alpha, no painted
water. The water is a separate layer.

Warm, bright, open and welcoming. This is the reward at the end of a journey.

[Block N]
```

---

## 7 · `water_fore` — a purpose-drawn fastest layer  ◇ optional, try the free one first

Only if layer 9 (a third `water_near` pass, scaled ×1.4) is not enough. Judge that in
the game before commissioning this.

```
[Block S]
A 3840 x 300 pixel layer -- twice the frame width, a low wide strip. No characters.

Large, near foreground water: bold horizontal ripple lines and a few broad flat lily
pads lying on the surface, in deep saturated jungle green-blue, clearly darker and
higher in contrast than distant water because it is close to us. No flowers.

- Transparent above. Real alpha.
- VERY SPARSE -- this is the fastest layer on screen and it passes in front of
  everything. At most 4 ripple groups and at most 3 lily pads across the whole 3840px
  width, with big fully transparent gaps between them.
- Nothing rises more than 150px from the bottom edge.
- Vary the groups clearly from one another; do not repeat one shape.

SEAMLESS TILING: left and right edges must match exactly.

[Block N]
```

---

## Delivery checklist

Every one of these has caught a real problem in this project at least once.

| # | check | why it is on the list |
|---|---|---|
| 1 | **No white or coloured padding.** Transparent means transparent. | The raft plates arrived 15–40% white padding, and a matte flood to clear it ate the ripple highlights out of `water_near` |
| 2 | **Open every file over magenta** before sending it. | The only way to see a near-white matte on near-white foam |
| 3 | **Hard alpha at any edge that meets the world.** No feather. | A 12px feather on the expression heads was the actual cause of "the head replacement looks weird", after two wrong diagnoses |
| 4 | **No text, numbers or letters anywhere**, including a boat name or bow number. | Words are drawn at runtime so content can change without new art (playbook §3.0) |
| 5 | **One shared canvas size per sprite set**, with the subject at one scale across it. | `build_*` crops a set to one shared bbox; sets that drift cannot be registered afterwards |
| 6 | **Water layers must tile perfectly.** | This scene scrolls continuously for its whole length; a seam comes round repeatedly |
| 7 | **Nothing painted below 78.4% on any act plate.** Real alpha. | Water on the action plane travels at 1.00, the depth differential collapses, and the river becomes wallpaper |
| 8 | **`water_cut`'s paint in rows 80–170 only.** | The single reason this package exists. Verify it, do not assume it |
| 9 | Deliver **PNG with alpha** at the stated pixel sizes. | The build converts to WebP, resizes and crops. Do not pre-optimise |

### Size budget

The shipped game is ~6.84 MB across 65 files and the aim is to keep it there.

| asset | budget |
|---|---|
| `water_cut` | ≤ 45 KB |
| `boat` | ≤ 55 KB |
| `fx_bow_wake` (+ b) | ≤ 20 KB each |
| leap frames ×3, if needed | ≤ 45 KB total |
| `act_boat_far`, if made | ≤ 120 KB |
| **required only** | **≤ 100 KB** |
| **everything** | **≤ 305 KB** |

---

## What the build will do, so the artist does not have to

A `build_boat()` in `tools/build-assets.py`, following `build_raft()` and
`build_wheelie()`:

- measure the boat's floor, waterline and hull bottom off the alpha and **assert** they
  land at 40% / 70% / 92% ±4px, failing loudly if not
- measure where `water_cut`'s paint actually falls and assert it lands in the 76%–84%
  band on screen — the check that this whole package turns on
- crop the leap frames, if any, to one shared bbox and print `hu` / `ar` / `ax`
- print the boat's deck and waterline as the `BOAT.deck` / `BOAT.water` constants for
  `levels.js`
- convert everything to WebP and report the total against the budget above

And in the scene, runtime-side, no new art needed:

- the bob: ±1.2% of frame height and ±1.5° on the game clock, boat and rider from one
  number so they cannot drift apart
- the reflection: the boat sprite again, flipped, blurred, ~18% opacity, below the
  waterline — free, and it will do more for "floating" than any painted reflection
- `near_leaves` faded off over the first few seconds as he leaves the bank
- the leap: `o.air(a, tilt)`, which already exists and already hops logs
