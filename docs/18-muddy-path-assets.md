# The Muddy Path — asset package

Hurdle three, the last one. Rain has turned a stretch of the jungle path to deep
mud. The wheels sink; he cannot ride through. Something has to go down first.

Built to [docs/10](10-immersive-scene-playbook.md), same as
[docs/14](14-broken-bridge-assets.md), [docs/15](15-raft-building-assets.md) and
[docs/17](17-boat-resolution-assets.md).

---

## Read this section first

Every previous package produced at least one join or edge that read as unnatural,
and each was fixed in code after the art arrived rather than being drawn right. This
table is the whole reason this document exists. Each row is a real defect from this
build, and the instruction that stops it recurring — those instructions are repeated
inside the prompts below, so they cannot be skipped by reading only the fun parts.

| what went wrong | why | the instruction here |
|---|---|---|
| **The gorge plates butted and showed two structures meeting.** | Each plate was drawn self-contained, with its own rim at *both* edges. Butted, the approach's thin bridge stub sat against the span's 240px rim block, plus a tonal step. Fixed in code with `laps:[240,200]`. | **§Joins.** Plates *overlap* by 260 units, and the overlap band is the **same drawing on both plates**. Invisible by construction, not by cover-up. |
| **The shore edge read as a pasted cutout.** | `act_raft_bank` ended in a straight vertical cut through a plant cluster. Three fixes failed — an interior feather left a ghost tree, a mirrored cap made a box — before a build-time taper worked. | **§Joins.** The 260-unit bands at both ends of every plate contain **no distinctive object**: continuous ground and generic texture only. A plate may never end mid-object. |
| **`water_near` never crossed the hull it was designed to cross.** | Its box and z-order were right, but the ripples were painted in the bottom sixth of its own canvas, so on screen they landed at 94.8%–97.4% — the bottom of the frame — while the waterline is at 78.4%. | **§4.** The near mud strip states **which canvas rows may contain paint**, by number, and the delivery check is to verify those rows. Never "near the top". |
| **`act_raft_open` arrived as a full painted background.** | Anything on the action plane travels at rate 1.00. A treeline there read as the far bank rushing past a raft that was barely moving. | **§Layers.** The action plane carries **only what he touches**. Everything distant belongs on a slower layer. |
| **A join trunk laid a translucent tree across open water.** | It was built to blend, so it was feathered — correct over a seam, wrong anywhere else. Needed a `nojoin` opt-out. | **§Joins.** No occluder props at all in this set. Overlap replaces them. Feather **only inside an overlap band**; hard alpha everywhere a plate meets the world. |
| **Plates arrived with 15–40% white padding**, and the flood used to clear it ate the ripple highlights out of `water_near`. | Padding is invisible against a pale asset. | **§Delivery 1–2.** Real alpha, and open every file over magenta before sending it. |
| **The rider floated 83px above the approach.** | Ground was found by topmost-opaque alpha, which located the rope handrail — an 8px band 40px above the deck — and then the tree canopy at 26%. Only colour worked. | **§Geometry.** Every plate states its walkable height as a number, and the path is drawn as a **distinct colour band**, so it can be found by colour. |
| **The head-swap looked wrong** for three attempts. | A 12px feather baked into the supplied alpha. | **§Delivery 3.** Hard alpha. No feather, no soft fade, no drop shadow on any prop or plate edge. |

---

## Argue with the mechanic first

Playbook §1.1, applied honestly:

> **Swap the subject for arithmetic. Does the game still work identically?**

"Pick the two words that mean the same and lay a stone" → "pick the two numbers that
sum to ten and lay a stone". Identical game. **It fails the test** — it is a quiz with
stones painted on it, exactly as the raft was before the fusing idea.

The raft was fixed by making a correct pair *become one thing*. Doing that again here
would work but repeat itself. Two options that do not:

- **Width.** A single stone is narrower than the mud is wide, and sinks. Two stones
  that mean the same thing sit flush and make one footing wide enough to hold. This is
  the raft's idea again — safe, and the art below covers it.
- **Opposite banks.** A plank across mud needs support at *both* ends. Two words that
  are opposites belong at opposite ends and the plank sits level; two that mean the
  same thing both belong at the same end, so it tips and slides in. Antonyms become a
  physical fact rather than a label — and this game teaches antonyms too, which no
  hurdle has used yet.

**The art in this package works for either**, because both need the same things: a mud
stretch of a stated width, three choosable objects with an identical silhouette, and a
paired firm/sunk result. Decide the mechanic before the *runtime* work, not before the
art. If the plank version wins, swap `prop_stone` for `prop_plank` — which already
exists — and only §7's paired states change.

---

## What carries over free — do not re-commission

| layer | file | size | rate | still right here? |
|---|---|---|---|---|
| far sky | `far_sky` | 3840×1080 | 0.20 | yes — same sky, same day |
| distant treeline | `mid_canopy` | 3840×1080 | 0.50 | yes — a jungle path wants a treeline, unlike the open river |
| top fringe | `near_leaves` | 3840×169 | 1.40 | yes |
| bottom fringe | `near_grass` | 3840×236 | 1.40 | **yes** — and this is the one place it comes back. It was dropped for the river because grass over open water is wrong; beside a muddy path it is exactly right |
| rider, riding | `jhumru_cycle` | 331×440 | — | yes |
| rider, stopped + 6 faces | `jhumru_still_body` + `face_*` | 458×682 | — | yes |
| a plank, if the mechanic goes that way | `prop_plank` | — | — | yes |
| mud splash | — | — | — | see §8, and it is optional |

All four background layers carry over, which is what keeps this feeling like the same
jungle rather than a new game. **No new character art at all** — see §Geometry for why
the sinking is free.

---

## The layer stack

Eight layers. One is new and it is the one that matters.

| # | file | size | rate | drift | new? | role |
|---|---|---|---|---|---|---|
| 1 | `far_sky` | 3840×1080 | 0.20 | — | — | opaque, covers the frame |
| 2 | `mid_canopy` | 3840×1080 | 0.50 | — | — | distant treeline, tops out at 24% |
| 3 | `act_mud_*` | 1920×1080 ×3 | **1.00** | — | **new** | approach, the mud, the far side |
| 4 | **`mud_near`** | **3840×400** | **1.18** | — | **NEW** | **the near lip of the mud, passing in front of his wheels** |
| 5 | CSS wet sheen | — | 1.06 | slow | — | wetness, drawn in CSS. No asset |
| 6 | `near_grass` | 3840×236 | 1.40 | — | — | bottom fringe |
| 7 | `near_leaves` | 3840×169 | 1.40 | — | — | top fringe |

### Why layer 4 is the whole scene

A wheel resting *on* a painting of mud looks like a sticker. A wheel with the mud's
near lip crossing *in front of* it is in the mud. That is the cheapest immersion lever
there is (playbook §1.3, and it is listed first there for a reason) — the same lever as
the contact shadow that fixed the floating bicycle and the same one `water_near` was
supposed to provide for the raft and did not.

**It did not work for the raft because of where the paint sat inside the canvas.** So
this layer is specified by row number in §4, and verifying those rows is a delivery
check, not a nice-to-have.

### Layer 5 is free

The wet look comes from a tilted repeating CSS gradient drifting slowly across the mud
band — no asset, and tunable without a regeneration. The river's sheen is the same
trick. One warning carried over: the angle in `repeating-linear-gradient` is the
**gradient's** direction, not the stripes'. `98deg` produced near-vertical lines that
looked like a fence; `6deg` lays them near-horizontal, as a wet surface does.

---

## Joins — the section that exists because of past mistakes

Three plates, two joins. **Overlap, never butt.**

```
Overlap per join        260 design units
Plate world positions   plate 1 at 0,  plate 2 at 1920-260,  plate 3 at 2*(1920-260)
```

Two instructions, and they are the difference between a seam and no seam:

1. **The overlap band is the same drawing on both plates.** Plate 2's leftmost 260
   pixels must be a pixel-accurate copy of plate 1's rightmost 260 pixels; plate 3's
   leftmost 260 the same against plate 2's rightmost 260. Laid over each other at
   runtime they cancel, and the join cannot be seen because there is nothing there to
   see. This replaces the "spanning occluder" of playbook §4.2, which was the fix for a
   problem better avoided.

2. **No distinctive object may sit in any 260-unit end band.** No tree, no rock, no
   sign, no plant cluster, no animal. Continuous ground, continuous texture. If an
   object straddles a plate end, the overlap shows half of it twice — which is how the
   shore edge came to look like a cutout in the first place.

Both bands of plate 1's left edge and plate 3's right edge are world edges rather than
joins: those get a **hard alpha edge and generous edge occluders** (§2).

---

## The geometry contract

Measured off the shipped game. A plate that misses these puts him in the air or buried.

```
Canvas                   1920 x 1080, RGBA, real transparency
Horizon                  62%     identical in every asset in this set
Distant treeline top     24%     (measured off mid_canopy)
Path IN, at the LEFT     72.0%   <- CONTINUITY NUMBER. act_raft_far's path
                                    height, so the scene before this one hands
                                    over with nothing to reconcile by hand.
Mud surface              74.5%
How deep the wheels go   78.0%   the tyre contact once bedded in
Path OUT, at the RIGHT   70.0%   rising slightly, heading on
Rider box, riding        242 x 322 units  = 12.6% x 29.8% of frame
Rider box, stopped       234 x 348 units  = 12.2% x 32.2% of frame
Rider anchor             the REAR WHEEL, 29.0% (riding) / 25.2% (stopped) across
```

**Plate 1 `act_mud_near`** — the path enters at the LEFT edge at **72.0%** and runs
level or eases down very gently. Ordinary dry ochre path. It ends at the near edge of
the mud. Its rightmost 260 units are the overlap band: bare path, nothing on it.

**Plate 2 `act_mud_deep`** — the mud itself. Its surface sits at **74.5%**, a little
below the dry path either side, because water pools in a dip. The mud spans the middle
of the plate and dry path returns at both ends, so the obstacle reads as *a stretch of
path*, not as a lake. Both 260-unit end bands are dry path.

**Plate 3 `act_mud_far`** — dry path again, rising to **70.0%** at the right edge and
heading into brighter trees. This is the last hurdle, so the far side should look like
arriving somewhere.

### The sinking needs no new art

The runtime already beds tyres into ground by a percentage of his height — `GORGE.drop`
is 5% on planks. Mud is soft, so this scene sets it far higher: **11%**, which is the
number that actually lands the tyre at 78.0% from a 74.5% surface (3.5% of the frame is
37.8 design units, and 37.8 of his 348 is 10.9%). Layer 4 then crosses in front of it. Between them the bicycle sits *in* the surface with no
new sprite. **Do not draw a sunken bicycle**, and do not draw him at all on any plate.

### Transparency rule

> On all three act plates, everything **below 82%** of image height must be **fully
> transparent** — real alpha, no painted ground.

That band is where layer 4 and `near_grass` live. If it is painted into the action
plane it travels at 1.00, the depth differential collapses, and the foreground stops
reading as nearer than the path.

---

## Block S — style constants, paste at the top of every prompt

Attach **`assets/source/px_act_clearing.png`** as the style anchor for the master
plate, then attach **your own approved master** for everything after it.

```
Match the attached reference image EXACTLY in art style, colour palette, line quality
and rendering technique. Treat the reference as the single source of truth for style.
Do not stylise differently.

Flat, poster-clean 2D cartoon jungle for a children's game, ages 6-7. Warm and bright:
ochre earth, saturated leaf greens, pale blue sky. No film grain, no noise, no paper or
canvas texture, no painterly brush marks, no 3D render look, no photographic realism.

CAMERA
- Side-on, flat, at the eye level of a small rider on a bicycle. Looking straight
  ahead.
- The ground must be seen nearly EDGE-ON. Do not tilt it toward the viewer. No
  bird's-eye, no top-down, no three-quarter view. Do not show the mud from above.
- Horizon at 62% of image height, identical in every asset in this set.

CLEAN COMPOSITION -- the most important instruction
- Calm, open and uncluttered. Restraint over detail.
- Hard budget for the whole image: AT MOST 3 plant clusters, AT MOST 2 rocks, AT MOST
  4 clouds. Do not add more. Empty space is correct here, not unfinished.
- Large areas of flat uninterrupted colour are wanted.

RESERVED EMPTY SPACE -- keep these genuinely empty
- Top 18%: plain sky only. A speech bubble and the UI sit there.
- The leftmost 260 pixels and the rightmost 260 pixels: continuous ground and generic
  texture ONLY. No tree, no rock, no plant cluster, no sign, no creature. These bands
  are overlapped with the neighbouring plate and anything distinctive in them appears
  twice.

LIGHTING
- Soft even late-morning light from the upper left.
- No cast shadows across the ground, no rim light, no lens flare, no god rays, no
  vignette. Identical in every asset in this set.
```

## Block N — negative, append to every prompt

The bans at the front are what an image model reaches for the moment you say "mud".

```
Do NOT include: any rain, raindrops, storm cloud or dark sky; any puddle reflections of
the sky; any swamp, bog, marsh or wetland reeds; any crocodile, snake, frog, insect or
bird; any footprints or tyre tracks unless explicitly asked for; any mist or fog; any
dirty, grimy, murky or unpleasant atmosphere -- this mud is a puzzle, not a hazard; any
sunset or golden-hour colour; any text, letters, numbers, words, writing or signage of
any kind; any UI, buttons, icons, arrows or speech bubbles; any watermark or logo; any
border or frame; any characters, people or creatures; any bicycle; any cluttered or
busy composition; any top-down or tilted-ground angle; any cast shadows across the
ground; any photographic realism; any 3D render look.
```

---

# The prompts

## 0 · The mockup — generate this FIRST

Playbook §1.5. One image of the whole screen with the mechanic in play, purely to be
argued with. It costs one generation and it has killed bad ideas before.

```
[Block S, but DELETE the "any characters" and "any bicycle" bans from Block N]

Landscape 16:9. A single finished game screenshot, not an asset.

A small grey cartoon elephant in blue dungarees on a little red bicycle has stopped at
the near edge of a stretch of deep wet mud that crosses the jungle path in front of
him. The mud is a broad band lying across the path, dry ochre path either side of it.
Three plain flat stepping stones of the SAME size lie on the dry ground beside him,
each with a completely BLANK pale top face.

The mud reads as soft, wet and shallow -- shiny highlights on the surface, a slightly
sunken dip -- and clearly too soft to ride. Bright, sunny and inviting: a puzzle, not a
hazard.

[Block N, minus the characters and bicycle clauses]
```

**Argue with it before going on.** Is it obviously mud rather than water? Do the stones
read as choosable? Is it obviously crossable rather than dangerous? Does the far side
promise something, given this is the last hurdle?

---

## 1 · `master_mud` — the style anchor

Everything else attaches this. Get it exactly right before generating anything else.

```
[Block S]
Landscape, 16:9. A BACKGROUND PLATE -- no characters, no bicycle.

A jungle path seen side-on, running left to right, with a broad stretch of deep wet mud
lying across the middle of it. Warm ochre dry earth on both sides. The mud is a
soft-edged band of darker warm brown, slightly dished so it sits a little lower than the
dry path, with a few flat wet highlights on its surface. Jungle greenery behind, well
back from the path.

The dry path surface sits at 72% of image height on the left and 70% on the right. The
mud surface sits at 74.5% of image height. Everything BELOW 82% of image height is
FULLY TRANSPARENT -- real alpha, no painted ground.

Draw the path as a clearly distinct band of colour from the greenery behind it, so its
top edge is unambiguous.

EDGE OCCLUDERS: a broad vertical tree trunk flush against the left edge and another
flush against the right edge, both cropped by the frame, running the full height.

[Block N]
```

**Why the colour instruction is there:** the walkable height is found off the art by
colour. Measured by topmost-opaque alpha instead, it found a rope handrail 40px above the
bridge deck, and then a tree canopy at 26% — which is how the rider came to float 83px
above the ground on the approach.

---

## 2 · `act_mud_near` — the approach

A layer split off the master, so it matches exactly.

```
Attached is the master plate. Return the SAME image at the SAME dimensions with
pixel-for-pixel identical framing -- do not redraw, restyle, reposition, rescale or
relight anything that stays.

Keep the dry approach: the path enters at the very LEFT edge at 72.0% of image height
and runs level, or eases down very gently, to the right. The near edge of the mud
appears in the right-hand third.

Everything BELOW 82% of image height must be FULLY TRANSPARENT -- real alpha, no white,
no matte colour, no painted ground.

The LEFT edge is a world edge: keep the full-height tree trunk there, and give it a HARD
alpha edge -- no feather, no soft fade.

The RIGHTMOST 260 PIXELS are an overlap band. They must contain ONLY continuous dry path
and generic ground texture: no tree, no rock, no plant cluster, no mud. Nothing
distinctive whatsoever.

Where deleting an element reveals nothing behind it, paint in what would plausibly be
there, continuing the surrounding art exactly. No holes, no smears, no halos.
```

## 3 · `act_mud_deep` — the obstacle

```
Attached is the master plate. Match its style exactly. Landscape 16:9, 1920x1080, no
characters, no bicycle.

The mud stretch itself, filling the middle of the plate. Dry ochre path returns at both
ends, so this reads as a stretch OF the path rather than a pond across it.

- The mud surface sits at 74.5% of image height, a little lower than the dry path at
  72%, because water pools in a dip. The transition from dry to wet is soft and
  irregular, never a straight line.
- Darker, warmer brown than the dry path, with a few flat wet highlight shapes lying on
  the surface. Soft and smooth: no ripples, no waves, no splashing.
- Everything BELOW 82% of image height is FULLY TRANSPARENT -- real alpha.

BOTH the leftmost 260 pixels AND the rightmost 260 pixels must be dry path only:
continuous ground and generic texture, no mud, no objects. These are overlap bands and
anything distinctive in them will appear twice.

CRITICAL: the leftmost 260 pixels of this image must be an exact copy of the rightmost
260 pixels of act_mud_near.

[Block N]
```

## 4 · `mud_near` — the layer that crosses his wheels  ★ REQUIRED

The most important new asset in the set. Read "Why layer 4 is the whole scene" first.

The row numbers below are derived, not stylistic: a bottom-pinned strip of 400 design
units on a 1080-unit frame has its top edge at 62.96% of the frame, so row *r* lands at
`62.96 + r/400 × 37.04` percent. Rows 90–190 therefore cover **71.3% to 80.6%** —
straddling the mud surface at 74.5% and the bedded tyre at 78%.

```
[Block S]
A 3840 x 400 pixel layer -- twice the frame width, a wide low strip. No characters, no
bicycle, no path.

The NEAR LIP of a stretch of wet mud, seen almost edge-on: a soft irregular band of
darker wet brown with a few flat wet highlight shapes, as if it is the closest edge of
the mud to the viewer.

THE VERTICAL PLACEMENT IS THE ENTIRE POINT OF THIS ASSET:
- Rows 0 to 80 (the top of the strip): FULLY TRANSPARENT. Real alpha.
- Rows 90 to 190: this is the ONLY band that may contain anything. All of the mud lip
  lives here, in a strip 100 pixels tall across the full 3840px width.
- Rows 200 to 400 (the bottom of the strip): FULLY TRANSPARENT. Real alpha.

Do not centre the content. Do not fill the strip. The painted band sits in the UPPER
HALF of the canvas and everything else is empty.

SPARSE -- this layer passes IN FRONT of the character and his bicycle, so it must have
real gaps. At most 5 lip segments across the whole 3840px width, each 250-500px wide,
with large fully transparent gaps between them. The gaps matter more than the mud.

Soften the top and bottom edge of each segment so it fades to transparent rather than
ending on a hard line.

SEAMLESS TILING: the left and right edges must match exactly so the image can repeat
horizontally forever with no visible join.

[Block N]
```

**Check, and this one check decides the scene:** lay the strip over the mockup with its
bottom edge on the mockup's bottom edge. The mud lip must land across the *lower part
of the bicycle wheels*. If it lands at the very bottom of the frame it is the mistake
`water_near` already made and it will not work. If you can no longer see the bicycle, it
is too dense.

## 5 · `act_mud_far` — the far side

```
Attached is the master plate. Match its style exactly. Landscape 16:9, 1920x1080, no
characters, no bicycle.

Dry path again, continuing to the right and rising gently to 70.0% of image height at
the right edge, heading into taller, brighter, sunlit jungle. An inviting opening
between bigger trees. This is the last obstacle of the journey, so the far side should
feel like arriving somewhere.

Everything BELOW 82% of image height is FULLY TRANSPARENT -- real alpha.

The RIGHT edge is a world edge: a full-height tree trunk flush against it, HARD alpha,
no feather.

The LEFTMOST 260 PIXELS are an overlap band: continuous dry path and generic texture
only, nothing distinctive. They must be an exact copy of the rightmost 260 pixels of
act_mud_deep.

[Block N]
```

## 6 · `prop_stone` — the three choosable stones

Per playbook §3.0, **never ask for the word in the image** — words are drawn at runtime
so content can change without new art.

```
[Block S]
THREE game PROPS as three separate images, on a plain flat mid-grey background for easy
cutout. No scene, no environment, no ground, no mud. Soft contact shadow directly
beneath each stone only, none cast onto the background. Wide 3:2 landscape, generous
margin.

A flat stepping stone, seen side-on and very slightly from above, thick enough to read
as solid. Pale warm grey stone. Its flat TOP FACE is COMPLETELY BLANK and smooth -- a
clean pale surface ready for a mark to be added later. No cracks, no moss, no speckles
on that top face.

All THREE stones are EXACTLY the same width, the same thickness and the same silhouette.
Vary ONLY the stone texture along the SIDE: one smooth, one with shallow pitting, one
with a little moss at the base. Do not vary the outline, the size, or the size of the
blank top face.

HARD alpha edges. No feather, no soft fade, no glow.

[Block N]
```

**Check, and this one is the design:** put the three side by side. If you can tell which
two belong together without reading anything, they are wrong — regenerate. The bark
version of this check caught the log set.

## 7 · `stones_firm` and `stones_sunk` — the paired result

Generate `stones_firm` first, then attach it for the second, so the two sit still under
a crossfade (playbook §3.5).

```
[Block S]
A single game PROP, isolated on a plain flat mid-grey background for cutout, seen
side-on. Wide 3:1 landscape, generous margin.

TWO of those same stepping stones set side by side into wet mud, their flat top faces
FLUSH and forming one continuous level footing with no step between them. Firm, solid,
settled: this is a footing that holds. A little mud pushed up around the edges where
they bedded in.

[Block N]
```

Then, with `stones_firm` attached:

```
Attached is the firm version. Return the SAME image at the SAME dimensions with
pixel-for-pixel identical framing, changing ONLY what is listed.

The two stones no longer match: one sits noticeably LOWER than the other, so their top
faces form a step rather than one level footing, and the lower one is half swallowed by
the mud with wet mud slumped over its edge. It reads as unstable -- something you would
not step on.

Do not move, rescale or relight anything else. Everything not listed above must be
pixel-identical, so the two images can be cross-faded without anything sliding.
```

## 8 · `fx_mud_splat` — optional, cheap, worth it

```
[Block S]
A single small game EFFECT sprite, isolated on a plain flat mid-grey background for
cutout. Canvas 512 x 256 pixels. Generous margin.

A small splash of wet brown mud thrown upward and outward, as if a bicycle wheel has
just dropped into it. A low rounded crown of mud with five or six separate round blobs
flying up and to the right, largest nearest the centre.

Flat cartoon shapes with clean edges -- no spray, no mist, no soft airbrushed gradients,
no motion blur. Cheerful, not messy.

The splash sits in the LOWER HALF of the canvas; the top 40% is FULLY TRANSPARENT.
Everything around it is FULLY TRANSPARENT -- real alpha.

[Block N]
```

A **second frame** with the blobs further out and lower lets the runtime alternate the
two for the price of one more image. Ask for it as `fx_mud_splat_b` on the identical
canvas.

---

## Delivery checklist

Every one of these has caught a real problem in this project at least once.

| # | check | why it is on the list |
|---|---|---|
| 1 | **No white or coloured padding.** Transparent means transparent. | The raft plates arrived 15–40% white padding, and the matte flood used to clear it ate the ripple highlights out of `water_near` |
| 2 | **Open every file over magenta** before sending it. | The only way to see a near-white matte on a pale asset |
| 3 | **Hard alpha at every world edge.** No feather, no soft fade, no drop shadow. | A 12px feather on the expression heads was the real cause of "the head replacement looks weird", after two wrong diagnoses; and a feathered join trunk laid a translucent tree across open water |
| 4 | **Overlap bands are pixel-identical between neighbouring plates**, and contain nothing distinctive. | Butted self-contained plates put the approach's bridge stub against the span's rim block; a plate ending mid-plant-cluster read as a pasted cutout |
| 5 | **`mud_near`'s paint in rows 90–190 only.** Verify it; do not assume it. | `water_near` was designed to cross the hull and never did, because its paint sat in the bottom sixth of its canvas |
| 6 | **Nothing painted below 82% on any act plate.** Real alpha. | Foreground on the action plane travels at 1.00, the depth differential collapses, and the scene goes flat |
| 7 | **The path is a distinct colour band** from the greenery behind it. | Ground found by alpha located a rope handrail, then a tree canopy, and left the rider floating |
| 8 | **No text, numbers or letters anywhere**, including on a stone's top face. | Words are drawn at runtime so content can change without new art |
| 9 | **One shared canvas size per set**, subject at one scale across it. | `build_*` crops a set to one shared bbox; a set that drifts cannot be registered afterwards |
| 10 | **`mud_near` tiles perfectly.** | It scrolls continuously for the whole scene; a seam comes round repeatedly |
| 11 | Deliver **PNG with alpha** at the stated pixel sizes. | The build converts to WebP, resizes and crops. Do not pre-optimise |

### Size budget

The shipped game is 4.40 MB and the aim is to keep it there.

| asset | budget |
|---|---|
| `act_mud_near` / `_deep` / `_far` | ≤ 120 KB each |
| **`mud_near`** | ≤ 50 KB |
| `prop_stone` ×3 | ≤ 20 KB each |
| `stones_firm` + `stones_sunk` | ≤ 30 KB each |
| `fx_mud_splat` (+ b) | ≤ 15 KB each |
| **required only** (3 plates + strip) | **≤ 410 KB** |
| **everything** | **≤ 530 KB** |

---

## What the build will do, so the artist does not have to

A `build_mud()` in `tools/build-assets.py`, following `build_gorge()` and `build_raft()`:

- measure each plate's walkable height **by colour** and assert it lands at 72.0% /
  74.5% / 70.0% ±0.5%, failing loudly rather than letting him float
- assert the overlap bands are pixel-identical between neighbouring plates, and report
  the mean difference if they are not — the one check that makes joins provable rather
  than hoped for
- measure where `mud_near`'s paint actually falls and assert it lands in the 71%–81%
  band on screen, which is what this whole package turns on
- assert nothing is painted below 82% on any act plate, over magenta
- crop the stone set to one shared bbox and print its runtime aspect and anchor
- convert everything to WebP and report the total against the budget above

And in the scene, runtime-side, no new art needed:

- `drop` raised to 11% of his height, so the tyres bed deep into soft ground instead
  of the 5% used on planks. Derived, not guessed: it is what puts the contact at 78.0%
  given a mud surface at 74.5%
- `laps:[260,260]` and `nojoin` — the overlap replaces the join trunk, which is wrong
  here as it was over water
- the wet sheen: one tilted `repeating-linear-gradient` at 6deg, drifting slowly. Not
  98deg, which reads as a vertical fence
- the splash fired off the same hop detector the river scene already uses for its logs
