# The Broken Bridge — asset package

The first hurdle. He rides on from the clearing, the ground opens into a ravine, and
the bridge across it has two planks missing in the middle. Both ends are sound; the
gap is not jumpable. Then the game screen takes over.

This package is written so the location **arrives** rather than appears — you see
the problem from a long way off, it grows as you approach, and you can see down
into the drop through the hole in the deck.

---

## The one thing that makes it feel like the same world

**Do not commission a sky, a canopy, or foreground foliage.** They already exist,
they tile, and they travel at their own rates:

| layer | file | size | rate | what it does |
|---|---|---|---|---|
| far | `far_sky` | 3840×1080 | 0.20 | opaque, covers the frame |
| mid | `mid_canopy` | 3840×1080 | 0.50 | treeline |
| near | `near_leaves` | 3840×169 | 1.40 | top-edge leaves |
| near | `near_grass` | 3840×236 | 1.40 | bottom-edge grass |

Because these four carry straight over, the new location inherits the same sky, the
same distance haze and the same foreground fringe as the opening. That continuity is
most of what "not abrupt" means, and it is free. Every new plate below has to sit
*inside* that existing world rather than replace it.

**So we are only commissioning the action plane and the ravine.**

---

## The plates

Three new action-layer plates, each **1920×1080 RGBA**, played left to right:

| # | file | the beat | what the player sees |
|---|---|---|---|
| 1 | `act_gorge_near` | the approach | path climbing out of the clearing; the ravine's near rim; **the broken bridge already visible ahead**, small, across the gap |
| 2 | `act_gorge_span` | the hurdle | the bridge filling the frame, the two-plank gap dead centre |
| 3 | `act_gorge_far` | the far side | the far rim, the path continuing into trees — where the game screen takes over |

Plus **one plate behind them** that is the whole reason this reads as a drop:

| # | file | size | rate | role |
|---|---|---|---|---|
| 4 | `mid_gorge` | 5760×1080 | 0.42 | the inside of the ravine — walls receding, a river far below, mist. Seen **through** the gap and under the bridge. |

`mid_gorge` is 3× a frame wide because it sits behind all three action plates and
travels slower than they do, so it needs the extra width not to run out.

### Why plate 1 matters most

Plate 1 is what stops this being abrupt. The bridge has to be **drawn in the
distance on it** — small, hazier, across the gap — so that by the time the span
fills the frame the player has been looking at it for two seconds. If plate 1 is
just a path and the bridge only exists on plate 2, the hurdle will pop into
existence no matter how the camera moves.

---

## The geometry contract — read before drawing anything

These are measured off the shipped art, not preferences. The rider's height is
derived from them, so a plate that misses them puts him in the air or in the deck.

```
Canvas                1920 x 1080, RGBA, real transparency
Clearing ground       y = 929  (86.0% down)   <- where plate 1 must start
Bridge deck surface   y = 706  (65.4% down)   <- where plates 1,2,3 must agree
Deck slab thickness   66px  (surface 706, underside 772)
```

**Plate 1** — the path enters at the LEFT edge at **y = 929** and rises in one
gentle continuous curve to **y = 706** at the RIGHT edge, where it meets the rim.
One smooth climb across the full width; no steps, no stairs, nothing steeper than
the rider can pedal.

**Plate 2** — the deck surface is flat at **y = 706** all the way across, except
for the gap.

**Plate 3** — the deck surface enters at the LEFT edge at **y = 706**, crosses the
far rim, and the path continues at **y = 706** or eases down slightly. It must not
climb.

### The gap

```
Gap left edge    x = 864   (45.0% across)
Gap right edge   x = 1056  (55.0% across)
Gap width        192px     (two plank widths)
```

Dead centre, and **192px is not negotiable** — it is wider than the bicycle's
wheelbase on purpose, so the gap reads as impossible rather than as something he
might just clear. Narrower and children will expect him to jump it.

### The gap must be genuinely transparent

> Inside the gap, and everywhere below the deck slab, the plate must be **fully
> transparent** — real alpha, no painted sky, no painted rock, no white.

This is the single instruction most likely to be missed and it is the one that
breaks the effect. `mid_gorge` sits behind and travels at 0.42 against the deck's
1.00, so what shows through the hole slides more slowly than the hole does — which
is exactly what makes the eye read a real drop instead of a printed picture. Paint
anything into the gap and it dies.

Same for the space under the whole bridge on plate 2: transparent, so the ravine
shows there too.

---

## Block G — paste at the top of every prompt

Attach **`assets/source/px_act_bridge.png`** as the style reference every time, and
**`assets/source/px_act_clearing.png`** as well for plate 1.

```
Match the attached reference images EXACTLY in art style, colour palette, line
quality and lighting: the same flat 2D cartoon jungle, the same warm pale plank
wood, the same soft cel shading, the same light coming from the upper left. This is
the same location by the same hand, a little further along the path.

A 16:9 game background layer, 1920 x 1080, drawn as a SIDE-ON view with the camera
at the rider's height -- flat on, no perspective tilt, no vanishing point, no
three-quarter view. The whole plate reads as one continuous strip that will scroll
horizontally.

Keep the TOP THIRD of the frame simple and open. A separate sky layer and a
separate treeline layer sit behind this one and a leaf fringe sits in front, so
anything busy up there will fight them.

Flat poster-clean rendering. No film grain, no texture overlay, no 3D render look,
no photographic realism, no lens blur, no vignette.

Do NOT include: any characters, any animals, any text or numbers, any UI, any
arrows or markers, any motion lines, any watermark, any border or frame, any
drop shadow onto the canvas edge.
```

---

# The prompts

## 1 · `act_gorge_near` — the approach

```
[Block G]

A jungle path climbing gently to the near rim of a deep ravine.

GEOMETRY -- follow exactly:
- The path surface enters at the very LEFT edge of the image at 86% down and rises
  in ONE smooth continuous curve to 65% down at the very RIGHT edge.
- At the right edge the path ends on a rocky rim, and the first planks of a wooden
  bridge begin there, running off the right edge of the image.
- Everything below the path surface is solid ground and rock down to the bottom
  edge. Nothing transparent on this plate except the sky area above the treeline.

IN THE DISTANCE, small and hazy, draw the CONTINUATION of the same wooden bridge
crossing the ravine, and the far rim beyond it -- so the player can see where they
are going before they get there. Use aerial haze: paler, lower contrast, cooler
than the foreground. It should read as roughly a third of the way to the horizon,
not as a second bridge nearby.

Warm ochre earth path, mossy rocks, ferns and low jungle planting along the
path's edge. Pleasant and inviting, not ominous -- this is a puzzle, not a threat.
No mist, no storm, no darkness.
```

**Check:** is the distant bridge actually visible and clearly the *same* bridge? Is
the climb one smooth curve, and does it start at 86% and end at 65%?

## 2 · `act_gorge_span` — the hurdle

```
[Block G]

A wooden plank bridge spanning a deep ravine, seen dead side-on, filling the frame.

GEOMETRY -- follow exactly:
- The deck's top surface is FLAT and level all the way across at 65% down.
- The deck slab is about 66px thick, so its underside is at 71% down.
- TWO PLANKS ARE MISSING from the exact middle: a clean gap from 45% to 55% across.
  The deck is sound and continuous either side of it.
- The gap, and the whole area below the deck slab, must be FULLY TRANSPARENT --
  real alpha. Do not paint sky, rock, water, mist or white into them. A separate
  ravine layer sits behind this plate and shows through.

The broken ends either side of the gap are splintered and pale where the wood has
snapped, with a couple of bent nails. ONE of the missing planks still hangs from
the left-hand edge by a single nail, tilted down into the gap. The other is gone.

Two simple support posts or rope-lashed uprights, one at each end of the span,
standing on the rims. The rims themselves -- rock and a little planting -- enter
from the left and right edges at the deck's height.

Same pale weathered plank wood as the reference bridge, same board joins, same
warm tone. Sturdy carpentry that has lost two boards, NOT a rotten or collapsing
bridge. No rope handrails, no missing posts, no danger signs, no skulls.
```

**Check:** open it over a bright magenta background. The gap and everything under
the deck must be magenta. If any of it is painted, the depth effect is gone.

## 3 · `act_gorge_far` — the far side

```
[Block G]

The far rim of the ravine and the jungle path continuing beyond it.

GEOMETRY -- follow exactly:
- The bridge deck enters at the very LEFT edge at 65% down, flat and level, and
  runs a short way in before reaching the far rim.
- Past the rim the path continues to the right at the same height, or eases down
  very slightly. It must NOT climb.
- Everything below the path surface, right of the rim, is solid ground and rock
  down to the bottom edge. The area below the DECK, left of the rim, stays fully
  transparent.

Beyond the path, an inviting opening into taller jungle -- a clearing mouth with
bigger trees either side, somewhere a journey continues into. Warm, bright and
welcoming: this is the reward for solving the bridge.

Same ochre path, same rock and planting as the reference.
```

## 4 · `mid_gorge` — what you see down the hole

This is the depth. It is worth getting right.

```
[Block G]

A 5760 x 1080 layer -- three frames wide -- of the INSIDE of a deep jungle ravine,
seen side-on. This layer sits BEHIND the bridge and is glimpsed through a gap in
its deck, so it must read as a long way down.

From the top of the image downward:
- the top 30% is FULLY TRANSPARENT. Real alpha. Nothing painted there at all.
- below that, the two facing rock walls of the ravine falling away, in cool greys
  and green-greys, with ferns and hanging creepers clinging to them. Bands of
  lighter and darker rock so the eye can read the drop.
- a pale MIST band across the middle, softening everything below it -- this is the
  single strongest depth cue, so make it clearly visible.
- at the very bottom, small and pale through the mist, a narrow river with a few
  rocks. It should read as very far below, not as a stream you could step into.

Everything progressively paler, cooler and lower in contrast toward the bottom.
Clearly a big drop, but pretty rather than frightening -- soft light, no darkness,
no storm, no danger.

The left and right edges must be able to butt against copies of themselves without
a visible join: keep both edges to plain rock wall and mist with no distinctive
shape crossing them.
```

**Check:** the top 30% transparent? Is the mist band obvious? Held next to plate 2,
does what shows through the gap read as *far below the deck* rather than just
behind it?

---

## Optional, if you want the extra polish

**5 · `prop_plank`** — one loose plank on its own transparent canvas, ~300×60. The
missing board, for the level to hand the player as the thing they carry and lay
across the gap. Worth having if the mechanic turns out to be "fetch the plank".

```
[Block G, minus the 1920x1080 line]

A single wooden plank prop, isolated on a FULLY TRANSPARENT background, seen
side-on, lying horizontally. Wide and thin, about 5:1. The same pale weathered
plank wood as the bridge deck, with two or three visible board grains and one bent
nail near each end. Both ends slightly splintered, as though it snapped out of a
deck. Soft contact shadow directly beneath only. No scene, no ground line, no
characters, no text.
```

**Sound** — two short effects, if easy: a low wooden **creak** as he rolls onto the
span, and a single dry **knock** when a plank is laid. Both CC0, mono, under a
second. I will level them in the build like the others.

---

## What to check before sending anything

- [ ] **Composite every plate over bright magenta.** The gap, everything under the
      deck on plate 2, and the top 30% of `mid_gorge` must all be magenta. This is
      the check that matters most.
- [ ] Deck surface at 65% down on all three action plates. Lay them side by side and
      confirm the line does not step at the joins.
- [ ] Plate 1's path starts at 86% down at its left edge, so it meets the clearing.
- [ ] The distant bridge is visible on plate 1, and hazier than the foreground.
- [ ] Gap dead centre, 45%–55%, no wider and no narrower.
- [ ] Top third of every plate open and simple, so the sky and treeline layers read.
- [ ] Nothing painted at the very top or bottom edge of the action plates that would
      fight `near_leaves` (169px) or `near_grass` (236px).
- [ ] No characters anywhere.

---

## What I do when they arrive

- add the three action plates as a new scene's segment list, sharing the existing
  sky, canopy and fringe layers, so the world is continuous by construction
- add `mid_gorge` as a positioned slow layer behind the action plane, and verify the
  parallax through the gap by stepping the camera and measuring what moves
- **measure** plate 1's climb off the art the way I did the ramp, and drive the
  rider's height from the measured profile rather than from waypoints — that is what
  stops him floating over the rise
- measure the gap's real edges from the alpha rather than trusting 45/55, and stop
  the rider at the near edge
- put a join overlay on each segment join, as `join_trunk` already does for the
  opening
- wire the beat: ride in, see the gap, stop, react — then hand over to the game
  screen

The alignment numbers are the part that will bite, which is why the deck height and
the transparency rule are repeated in every prompt above.
