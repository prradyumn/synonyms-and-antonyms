# The Raft Building — asset package

Scene 2. The path meets a river too wide to ride. Three logs lie on the shore. Two
of them mean the same thing, and those two lash into a raft that carries him across.

Built to [docs/10](10-immersive-scene-playbook.md). Richer than the bridge package
on purpose: water is where parallax earns its keep, so the layer stack is deeper and
the rates are specified per band.

---

## Before you draw anything

Playbook §1.1, applied honestly:

> **Swap the subject for arithmetic. Does the game still work identically?**

"Pick the two logs that are synonyms" → "pick the two logs that sum to 10". Identical
game. **It fails the test.** As written it is a three-option quiz with logs painted on
it, and no amount of art fixes that.

**The one change that fixes it.** Make the two logs *become one thing*. A correct pair
lashes flush — the seam closes and the raft is a single solid deck. A wrong pair stays
two pieces with a step between them; it rocks, water comes over the low end, he steps
back off, and the odd log drifts away saying its own word. Synonymy stops being a
label you check and becomes *these two are the same, so they make one*.

Two consequences for the art, and they are the reason this section is here:

- **The three logs must be identical in length and thickness.** If the matching pair
  were visibly the same size, a child solves it without reading and it stops being a
  word game. Vary the bark, never the silhouette.
- **You need a paired raft state** — fused and stepped — which §3.5 covers below.

Everything else in this package is the same either way, so if you would rather ship
the simple version first, nothing here is wasted.

---

## What carries over free — do not re-commission

| layer | file | size | rate | still correct here? |
|---|---|---|---|---|
| far sky | `far_sky` | 3840×1080 | 0.20 | yes — same sky, same day |
| distant treeline | `mid_canopy` | 3840×1080 | 0.50 | yes — reads as the jungle beyond both banks |
| top fringe | `near_leaves` | 3840×169 | 1.40 | yes |
| bottom fringe | `near_grass` | 3840×236 | 1.40 | **no** — grass over open water is wrong. Replaced by `near_reeds` for this scene only. |

Three of the four carry over, which is what keeps this feeling like the same river
in the same jungle rather than a new game.

---

## The layer stack

Eight layers. The three in bold are what make water read as water.

| # | file | size | rate | new? | role |
|---|---|---|---|---|---|
| 1 | `far_sky` | 3840×1080 | 0.20 | — | opaque, covers the frame |
| 2 | `mid_canopy` | 3840×1080 | 0.50 | — | distant treeline, tops out at 24% |
| 3 | **`water_far`** | 3840×1080 | **0.62** | new | the far shore's reed line and the hazy far water. Tileable. |
| 4 | `act_raft_*` | 1920×1080 ×3 | **1.00** | new | near bank, logs, raft, rider |
| 5 | **`water_near`** | 3840×340 | **1.22** | new | the near water surface, passing **in front of** the raft's waterline |
| 6 | `near_leaves` | 3840×169 | 1.40 | — | top fringe |
| 7 | **`near_reeds`** | 3840×300 | **1.62** | new | sparse foreground reeds and lily pads |

### Why those three matter

**`water_near` at 1.22 is the whole trick.** It travels *faster* than the raft, so it
passes in front of the hull and cuts the waterline. That is what makes him float *in*
the water instead of sitting on top of a painted river — the same occlusion lever as
the contact shadow that fixed the bicycle (§1.3, and it is listed first there for a
reason). Without it, no amount of ripple detail will save the shot.

**`water_far` at 0.62 vs `water_near` at 1.22** gives a 2:1 differential across the
river. That spread is what reads as *distance over water*, which is otherwise a flat
featureless plane with no depth cues at all.

**`near_reeds` at 1.62** is the fastest layer in the game so far, deliberately: on a
crossing he is barely moving relative to the far bank, so the foreground has to do the
work of saying "you are travelling".

### Water also drifts on its own

Both water bands scroll horizontally at a slow constant rate **on top of** their
parallax offset, so the river flows while he is stationary. That is runtime, not art —
but it is why both must tile.

**Do not agonise over the tiling seam.** The build already fixes it: `mirror_x` for
uniform texture (both water bands — mirroring is invisible on ripples) and `roll_x`
for anything with distinctive shapes (`near_reeds` — a mirrored reed clump reads as a
butterfly, which we have already been caught by once).

---

## The geometry contract

Measured off the shipped game. A plate that misses these puts him in the air or
underwater.

```
Canvas                 1920 x 1080, RGBA, real transparency
Horizon                62%   (far_sky is at its palest 60-65%)
Distant treeline top   24%   (measured off mid_canopy)
Bank path IN           69.63%  <- where act_gorge_far ends. Continuity number.
Waterline              78%
Raft deck (walkable)   75.5%   -- floats 2.5% proud of the waterline
Rider                  322 design units tall = 29.8% of frame height
Rider wheel contacts   29% and 78% across his own box
```

**Plate 1 (`act_raft_bank`)** — the path enters at the LEFT edge at **69.63%**, runs
level or eases down gently, and ends at the shore. The bank edge drops to the
waterline at **78%**. Three logs lie on the shore, clear of the path.

**Plate 2 (`act_raft_open`)** — open water. No walkable ground at all: everything below
the waterline at 78% is water, everything above is far bank and sky. This plate is
almost empty by design.

**Plate 3 (`act_raft_far`)** — the far shore rises out of the water at 78% and the path
continues at about **72%**, heading on.

### Transparency rules

> Everything below **78%** on all three act plates must be **fully transparent** — real
> alpha, no painted water.

The water is layers 3 and 5, not the act plate. If water is painted into the action
plane it travels at 1.00, the differential collapses, and the river becomes wallpaper.
This is the same instruction that made the broken bridge's gap work, and it is the one
most likely to be missed — check it over magenta.

---

## Block S — style constants, paste at the top of every prompt

Attach **`assets/source/px_act_clearing.png`** as the style anchor for the master
plate, then attach **your own approved master** for everything after it.

```
Match the attached reference image EXACTLY in art style, colour palette, line quality
and rendering technique. Treat the reference as the single source of truth for style.
Do not stylise differently.

Flat, poster-clean 2D cartoon jungle for a children's game, ages 6-7. Warm and bright:
ochre earth, saturated leaf greens, pale blue sky, warm pale plank wood. No film grain,
no noise, no paper or canvas texture, no painterly brush marks, no 3D render look, no
photographic realism.

CAMERA
- Side-on, flat, at the eye level of a small rider on a bicycle. Looking straight
  ahead.
- The ground and the water must be seen nearly EDGE-ON. Do not tilt either toward the
  viewer. No bird's-eye, no top-down, no three-quarter view.
- Horizon at 62% of image height, identical in every asset in this set.

CLEAN COMPOSITION -- the most important instruction
- Calm, open and uncluttered. Restraint over detail.
- Hard budget for the whole image: AT MOST 3 plant clusters, AT MOST 2 rocks, AT MOST
  4 clouds. Do not add more. Empty space is correct here, not unfinished.
- Large areas of flat uninterrupted colour are wanted.

RESERVED EMPTY SPACE -- keep these genuinely empty
- Top 18%: plain sky only. UI and a speech bubble sit there.
- Nothing may intrude more than 12% inward from the left or right edge except where an
  edge occluder is explicitly requested.

LIGHTING
- Soft even late-morning light from the upper left.
- No cast shadows across the ground, no rim light, no lens flare, no god rays, no
  vignette. Identical in every asset in this set.
```

## Block N — negative, append to every prompt

The domain bans at the front are the things an image model reaches for the moment you
say "river". Every one of these has to be named or it will appear.

```
Do NOT include: any waterfall, any rapids or white water, any boat, canoe, raft or
jetty unless explicitly asked for, any bridge, any fishing net, any crocodile or fish
or bird, any sunset or golden-hour colour, any mirror-perfect reflection of the sky,
any mist or fog bank, any lily flowers in bloom; any text, letters, numbers, words,
writing or signage of any kind; any UI, buttons, icons, arrows or speech bubbles; any
watermark or logo; any border or frame; any characters, people or creatures; any
cluttered or busy composition; any top-down or tilted-ground angle; any cast shadows
across the ground; any dark, moody or scary atmosphere; any photographic realism; any
3D render look.
```

---

# The prompts

## 0 · The mockup — generate this FIRST

Playbook §1.5. One image of the whole screen with the mechanic in play, purely to be
argued with. It costs one generation and it has killed bad ideas before.

```
[Block S, but DELETE the "any characters" ban from Block N]

Landscape 16:9. A single finished game screenshot, not an asset.

A small grey cartoon elephant in blue dungarees on a little red bicycle has stopped at
the near shore of a calm jungle river. Three plain logs of the SAME length and
thickness lie side by side on the shore in front of him, each with a completely BLANK
pale sawn end facing the viewer. The far bank is visible across the water with the
path continuing into the trees.

Show the water clearly as a horizontal band with gentle ripples, no waterfall, no
rapids. Calm, sunny, inviting -- a puzzle, not a hazard.

[Block N, minus the characters clause]
```

**Argue with it before going on.** Do the three logs read as choosable? Is the river
obviously too wide to ride but obviously crossable? Does the far bank promise
something?

## 1 · `master_river` — the style anchor

Everything else attaches this. Get it exactly right before generating anything else.

```
[Block S]
Landscape, 16:9. A BACKGROUND PLATE -- no characters.

The near shore of a calm, wide jungle river, seen side-on. Warm ochre earth bank in
the foreground dropping to the water's edge. Calm water filling the lower third, with
soft horizontal ripple bands and no strong reflections. The far bank sits across the
water as a low green line with reeds, hazier and paler than the foreground. Jungle
trees beyond it.

The water surface sits at 78% of image height. The bank's earth is above it, the water
below it, and the division between them is clean and horizontal.

EDGE OCCLUDERS: a broad vertical tree trunk flush against the left edge and another
flush against the right edge, both cropped by the frame, running the full height.

[Block N]
```

## 2 · `act_raft_bank` — the approach

A layer split off the master, so the near bank matches it exactly.

```
Attached is the master plate. Return the SAME image at the SAME dimensions with
pixel-for-pixel identical framing -- do not redraw, restyle, reposition, rescale or
relight anything that stays.

Keep ONLY: the near bank and everything standing on it, down to the water's edge at
78% of image height.

Delete the water, the far bank and the sky and make them FULLY TRANSPARENT -- real
alpha, no painted water, no white, no matte colour. Everything below 78% must be
transparent.

CHANGES to what remains:
- The ochre path enters at the very LEFT edge at 69.6% of image height and runs
  level, or eases down very gently, to the shore.
- Add THREE plain logs lying on the shore, side by side, clear of the path and clear
  of each other. All three EXACTLY the same length and the same thickness. Each has a
  completely BLANK pale sawn end facing the viewer, ready for a mark. Vary only the
  bark texture between them, never the size or shape.

Where deleting an element reveals nothing behind it, paint in what would plausibly be
there, continuing the surrounding art exactly. No holes, no smears, no halos.
```

## 3 · `act_raft_open` — the crossing

```
[Block S]
Landscape 16:9. A BACKGROUND PLATE -- no characters. Attached is the master plate for
style; match it exactly.

Open water. This plate is almost empty by design and that is correct.

- Everything BELOW 78% of image height is FULLY TRANSPARENT. Real alpha. Do not paint
  water here -- a separate water layer sits behind and in front of this one.
- Everything ABOVE 78% is the far bank in the distance: a low green reed line and
  jungle trees beyond, hazy, pale and low in contrast, sitting near the horizon.
- No near bank, no path, no logs, no ground of any kind in the lower half.

[Block N]
```

## 4 · `act_raft_far` — the far shore

```
Attached is the master plate. Match its style exactly. Landscape 16:9, no characters.

The FAR shore of the same river, now close to us: the bank rises out of the water at
78% of image height and the ochre path continues to the right at about 72%, heading
into taller jungle.

Everything BELOW 78% is FULLY TRANSPARENT -- real alpha, no painted water.

Beyond the path, an inviting opening into bigger trees. Warm, bright and welcoming --
this is the reward for solving the river.

[Block N]
```

## 5 · `water_far` — the distant water band (rate 0.62)

```
[Block S]
A 3840 x 1080 layer, TWICE the frame width, for horizontal scrolling. No characters.

- The top 62% is FULLY TRANSPARENT. Real alpha, nothing painted there.
- Below that, a band of calm distant water: soft horizontal ripple lines, pale,
  cool, low contrast, growing slightly darker and more saturated toward the bottom.
- Along the very top of the water band, a thin low line of far-bank reeds in silhouette
  -- pale and hazy, no individual leaves readable.

This layer is seen ACROSS the river, so everything on it is atmospheric: paler, cooler
and lower in contrast than anything in the foreground. No strong ripples, no waves, no
sparkle highlights, no reflections of specific objects.

SEAMLESS TILING: the left and right edges must match exactly so the image can repeat
horizontally forever with no visible join.

[Block N]
```

## 6 · `water_near` — the near surface that cuts the hull (rate 1.22)

The most important new asset in the set. Read the note under the layer table.

```
[Block S]
A 3840 x 340 layer -- twice the frame width, a low strip. No characters.

A band of NEAR water surface seen almost edge-on: clear horizontal ripple lines,
slightly larger and more defined than distant water, in warm-tinted jungle green-blue.
A few small lily pads lying flat on the surface, no flowers.

- The top 15% of the strip fades to FULLY TRANSPARENT so it can sit over the water
  behind it with no hard edge.
- SPARSE. This layer passes IN FRONT of the character, so it must have real gaps --
  large areas of transparency between the ripple groups. At most 4 ripple groups and
  at most 3 lily pads across the whole 3840px width.
- Nothing may rise more than 120px from the bottom of the strip. It crosses the hull
  of a raft, never the rider above it.

SEAMLESS TILING: left and right edges must match exactly.

[Block N]
```

**Check:** hold it over the master plate. Can you see plenty of the water behind it
through the gaps? If it reads as a solid band, it is too dense — regenerate. A
foreground occluder that occludes everything is just a wall.

## 7 · `near_reeds` — the fastest layer (rate 1.62)

```
[Block S]
A 3840 x 300 layer -- twice the frame width, a low strip. No characters.

Sparse foreground reeds and tall grass blades rising from the bottom edge, in
saturated deep jungle green, darker than the mid-ground because they are close.

- Transparent above. Real alpha.
- VERY SPARSE, with big empty gaps: at most 5 clumps across the whole 3840px width,
  each clump 3-6 blades. The gaps matter more than the clumps.
- Nothing rises more than 240px from the bottom edge -- these pass a rider's wheels
  and hull, never his head.
- Vary the clump shapes clearly from one another; do not repeat one clump.

[Block N]
```

## 8 · `prop_logs` — the three choosable logs

Per playbook §3.0, **never ask for the word in the image** — the words are drawn at
runtime so content can change without new art.

```
[Block S]
THREE game PROPS as three separate images, on a plain flat mid-grey background for
easy cutout. No scene, no environment, no ground. Soft contact shadow directly beneath
each log only, none cast onto the background. Wide 3:1 landscape, generous margin.

A fallen jungle log lying horizontally, seen side-on. Pale warm sawn wood. The nearer
sawn END faces the viewer at the right, and it is COMPLETELY BLANK and smooth -- a
clean pale disc ready for a mark to be added later. No rings, no cracks, no knots on
that end face.

All THREE logs are EXACTLY the same length and the same thickness. Vary ONLY the bark
along the side: one smooth, one with shallow ridges, one with a little moss. Do not
vary the silhouette, the length, the thickness, or the size of the blank end.

[Block N]
```

**Check, and this one is the design:** put the three side by side. If you can tell
which two belong together without reading anything, they are wrong — regenerate.

## 9 · `raft_fused` and `raft_stepped` — the paired result

Generate `raft_fused` first, then attach it for the second so the two sit still under
a crossfade (§3.5).

```
[Block S]
A single game PROP, isolated on a plain flat mid-grey background for cutout, seen
side-on. Wide 3:1 landscape, generous margin.

TWO of those same logs lashed together side by side with jungle vine into a small
raft, seen from the side. The two logs sit FLUSH -- their top surfaces form one
continuous flat deck with no step between them. Three vine lashings across. Sturdy and
neat: this is a raft that works.

[Block N]
```

Then, attaching it:

```
[Block S]
The SAME raft as the attached image, in the SAME style, colour and size, with ONE
change: the two logs are NOT flush. One sits noticeably lower than the other, so the
deck has an obvious STEP down the middle and the raft is visibly lopsided. The vine
lashings are loose and slack. Everything else identical.

Same plain flat mid-grey background, isolated for cutout.
[Block N]
```

## 10 · `fx_splash` — a small water disturbance

```
[Block S]
A single game EFFECT sprite isolated on a plain flat mid-grey background, square 1:1.

A small, gentle water splash seen side-on: a low ring of ripple and a few rounded
droplets rising, in pale blue-white. Soft and cartoon-simple, cheerful rather than
dramatic. Small -- this is a log settling into calm water, not an impact.

No characters, no scene, no ground, no spray, no foam, no waves.
[Block N]
```

---

## What to check before sending anything

- [ ] **Composite every act plate over bright magenta.** Everything below 78% must be
      magenta on all three. This is the check that matters most — if water is painted
      into the action plane the whole depth stack collapses.
- [ ] `water_far`'s top 62% transparent; `water_near` and `near_reeds` transparent
      above their strips.
- [ ] Plate 1's path enters at 69.6% at the left edge, so it meets where the bridge
      scene ends.
- [ ] The waterline is at 78% and level on all three plates. Lay them side by side and
      confirm it does not step at the joins.
- [ ] **The three logs are indistinguishable in size.** Cover the end faces and check.
- [ ] `water_near` has real gaps — hold it over the master and look through it.
- [ ] Horizon at 62% everywhere; treeline no higher than 24%.
- [ ] Top 18% of every plate is plain sky.
- [ ] No characters in anything except the mockup.

---

## What I do when they arrive

- add the three act plates as a new scene, sharing `far_sky`, `mid_canopy` and
  `near_leaves` with the opening and the gorge, so the world stays continuous
- add `water_far`, `water_near` and `near_reeds` as new rates in `pxBuild`, and give
  the two water bands their own constant drift so the river flows while he is still
- **measure the waterline off the alpha** rather than trusting 78%, exactly as the
  gap's real edges turned out to be 233px and not the 192px in the bridge spec
- run the plates through `mirror_x` (water) and `roll_x` (reeds) so tiling is exact by
  construction rather than by hope
- overlap the plate joins and feather the plate edges, as the gorge now does — the
  plates will each be drawn self-contained and will not butt cleanly
- give the raft a slow bob on the virtual clock, and sit the rider on it with the same
  contact shadow treatment that grounded the bicycle
- wire the beat: arrive, see the river, three logs offered, choose, lash, float across

The waterline and the transparency rule are the two numbers that will bite, which is
why both are repeated in every prompt above.
