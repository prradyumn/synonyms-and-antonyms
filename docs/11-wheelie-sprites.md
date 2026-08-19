# Wheelie over a wooden ramp — sprites and prompts

What to commission, what to derive, and what needs no art at all.

---

## The beats

| # | beat | duration | sprite |
|---|---|---|---|
| 1 | riding level, approaching | — | `jhumru_cycle` ✅ exists |
| 2 | **front wheel lifts** | ~350ms, one-shot | **new: `wheelie_lift`** |
| 3 | **wheelie held, climbing the ramp** | as long as the climb, loops | **new: `wheelie_hold`** |
| 4 | cresting, front wheel drops | ~350ms, one-shot | **derived: `wheelie_land`** |
| 5 | rolling down and away | — | `jhumru_cycle` ✅ exists |

**Two sprites to commission. The third comes free** — `wheelie_land` is
`wheelie_lift` with its frames reversed, which the build can emit automatically.
A front wheel coming down is a front wheel going up, played backwards.

---

## First: you may not need any of it

A wheelie is a rotation about the **rear wheel contact point**. That point is
already measured in the existing sprite:

```
jhumru_cycle.webp   331 x 440
  rear wheel contact   x=96   (29.2% across)   y=439  (bottom edge)
  front wheel contact  x=258  (78.1% across)
  wheelbase            162px
```

So this, with no new art at all:

```css
.cyc img { transform-origin: 29.2% 100%; }   /* the rear wheel contact */
```
```js
/* -22deg reads as a wheelie; the rider leans back with the bike, which is
   what actually happens in one */
J.img.style.transform = 'rotate(-22deg)';
```

**It is more convincing than it sounds**, because in a real wheelie the rider and
bike rotate together — which is exactly what rotating the whole sprite does.

What it does not give you: arms straightening, weight shifting back, ears and
trunk trailing, the visible effort of pedalling through it. Those are what make it
read as a *trick* rather than a tilt.

**Try the free version first.** If it reads well enough, stop. If it looks stiff,
commission the two below.

---

## The alignment rule — read before commissioning anything

> **Every sprite in this set must be delivered on one shared canvas with the rear
> wheel contact at the same pixel.**

If the lift sprite's rear wheel sits 20px left of the cycle sprite's, he will jump
sideways the instant the sprite swaps, and no amount of runtime tweaking fixes it
cleanly.

Specify it in the brief:

```
Canvas 660 x 880, transparent. The bicycle's REAR WHEEL touches the ground at
x = 29% across and y = 100% down (the very bottom edge of the canvas) in EVERY
frame of EVERY sprite in this set. The bicycle is the same size in every sprite.
Extra headroom above is fine and expected -- the front of the bike rises out of
the level-riding silhouette.
```

Canvas at 2× the current sprite (660×880) because a raised front wheel needs room
above the level-riding bounding box.

### One pipeline change this forces

`crop_loop()` in `tools/build-assets.py` crops each loop to **its own** union bbox.
For a set that must stay aligned that is wrong — each sprite would be cropped
differently and the anchor would drift.

These need a **shared-bbox group**: compute one union bbox across *all* sprites in
the set, then crop every one of them to it. Small change, but it has to happen
before the wheelie sprites go through the build. Say the word and I will add it.

---

## The ramp

Two options.

**A · A ramp prop** *(cheaper, recommended)* — a wooden ramp laid on the existing
bridge deck, composited into the action layer. The deck art stays untouched, and
`LEG_A_Y` / `LEG_B_Y` gain a hump where the ramp sits.

**B · A re-rendered bridge** with the hump built into `act_bridge`. Cleaner
looking, but it replaces a plate you have already approved and re-opens the
level-deck property that made the riding maths simple.

Go with A unless the prop reads as bolted on.

Note the incline: on the ramp he is tilted by the ramp angle **plus** the wheelie
angle. Keep them as two separate numbers in the code or it becomes impossible to
tune.

---

# The prompts

## An honest note on what image models can and cannot do

Image models give you **poses** reliably, **sprite sheets** unreliably, and
**coherent animation loops** not at all. Your existing loops — breathing, cycling,
walking — plainly came from an animation tool, not a text-to-image prompt.

So the workflow is:

1. Generate **key poses** with the image model (below). These are reliable.
2. Feed those poses to whatever produced `monkey-side-walk-loop.gif` to get the
   in-betweens.

A sprite-sheet prompt is included at the end for completeness, but expect to
regenerate it a lot.

---

## Block W — constants for this set

Paste at the top of every prompt, and **attach `assets/chars/jhumru_cycle_still.webp`**
as the reference every single time.

```
Match the attached reference image EXACTLY: the same grey cartoon elephant in
blue dungarees over a white T-shirt, with a spiky blue-and-white tuft of HAIR on
top of his head (not a cap, not a helmet), orange ears and a maroon trunk tip, on
the same small red-orange bicycle, in the same flat 2D cartoon style, same
palette, same line weight, same proportions.
This is the SAME character on the SAME bike -- not a redesign.

Side view, facing RIGHT. Full body. Isolated on a plain flat mid-grey background
for cutout, with a generous margin.

The bicycle is the SAME SIZE as in the reference. The REAR WHEEL touches the
ground at 29% across the canvas and at the very bottom edge. Leave clear empty
space ABOVE the character -- the front of the bike rises in this set.

Flat poster-clean rendering. No film grain, no texture, no 3D look, no
photographic realism.

Do NOT include: any background scene, any ground line, any ramp, any motion
lines or speed streaks, any text, any shadow cast onto the backdrop, any second
character, any change to the character's clothing or colours.
```

---

## 1 · `wheelie_hold` — the money shot

This is the pose the whole thing lives or dies on. Get it right first; it also
becomes the reference for the others.

```
[Block W]

The elephant riding in a WHEELIE: the front wheel lifted clear of the ground and
the whole bicycle tilted back about 25 degrees, balanced on the rear wheel only.

He leans back with the bike, arms straight out in front holding the handlebars,
chest open, one leg pushed down on the pedal and the other lifted. Ears swept
back and trunk raised and curled with the motion. Delighted, confident
expression -- this is a show-off trick, not a loss of control.

The rear wheel stays on the ground at the anchor point. The front wheel is high,
roughly level with his chest.
```

**Check:** is he *balanced*, or does he look like he is falling backwards? Are the
arms straight? Is the tilt around 25° — enough to read at thumbnail size, not so
much that he looks about to tip?

---

## 2 · `wheelie_lift` — the transition into it

Ask for **three key poses**, attaching the approved hold pose so the end state
matches.

```
[Block W]

THREE key poses of the same wheelie, as three separate images:

POSE A -- the crouch. Still level on both wheels, but compressed: he leans
forward over the handlebars, knees bent, gathering himself. Front wheel firmly
down.

POSE B -- the pull. Front wheel just breaking contact, bicycle tilted about 10
degrees, arms pulling the handlebars up and back, body starting to rise. Weight
visibly shifting backwards.

POSE C -- identical to the attached wheelie hold pose: tilted 25 degrees, front
wheel high, balanced on the rear wheel.

Same character, same bike, same size, same anchor point in all three.
```

Those three interpolate into a convincing ~350ms lift. **Do not commission the
landing** — reverse this one.

---

## 3 · `ramp_wood` — the prop

```
Match the attached reference image EXACTLY in art style, colour palette and line
quality -- the same flat 2D cartoon look, the same warm plank wood as the bridge.

A single game PROP isolated on a plain flat mid-grey background for cutout. No
scene, no environment, no characters. Soft contact shadow directly beneath only.

A short wooden skateboard-style ramp seen from the SIDE, made of the same pale
plank wood as the bridge: a gentle curved ramp rising from left to right, low and
friendly, with a flat run-up at the bottom left and a rounded lip at the top
right. Simple plank construction with a few visible boards and two support
struts underneath.

Wide and shallow, not steep -- something a small character could cycle up
comfortably. The rise is about one third of the ramp's length.

Do NOT include: any rope, any text, any metal, any skate-park styling, any
graffiti, any steep or dangerous angle, any characters.
```

**Check:** shallow enough to cycle up? Same wood as the bridge, or does it read as
imported from another game?

---

## 4 · Optional — sprite sheet in one shot

Lower success rate. Worth one attempt before falling back to key poses.

```
[Block W]

A sprite sheet: EIGHT frames of the same wheelie animation in a 4 x 2 grid,
reading left to right, top row then bottom row. Every cell exactly the same size,
with the character in the same position within its cell and the rear wheel at the
same point in every cell.

Frame 1: level on both wheels, crouched forward.
Frames 2-3: front wheel lifting, bike tilting to about 10 then 18 degrees.
Frames 4-8: held wheelie at about 25 degrees, legs pedalling through a full
cycle, front wheel steady.

Plain flat mid-grey background, no grid lines, no borders, no numbers, no text.
```

---

## Once you have them

Send the files over and I will:

- add the shared-bbox crop group to `build-assets.py` so the set stays aligned
- emit `wheelie_land` automatically by reversing `wheelie_lift`
- wire the beats to the camera fraction, with ramp tilt and wheelie tilt as
  separate tunable numbers
- put the ramp in the action layer and add its hump to the ground track

The runtime side is small. The alignment is the part that will bite, which is why
it is the one instruction repeated in every prompt above.

---

# The ramp asset — prompt

Currently `rampSVG()` in `sprites.js` draws it at runtime. A painted plate will
match the bridge properly. **Attach `assets/source/px_act_bridge.png`** as the
style reference.

## The geometry rule — read this first

The code treats the image's own box **as** the ramp: its bottom edge sits on the
deck, its top edge is the crest. `RAMP_A_RISE` / `RAMP_B_RISE` then drive both the
Y-track and the drawn height from one number, which is what stops the rider
floating over the lip.

So the ramp surface must run **corner to corner**:

- it touches the **bottom-left** corner of the image, and
- it reaches the **top-right** corner,
- with **no transparent margin** at either of those corners.

Any padding there and the wheels will sit off the surface by exactly that much.

Rise is 40% of the length — a **5:2 image**. On screen it renders at most
~321×128, so deliver **640×256 or larger**. One asset serves both ramps; the code
scales it.

## Prompt — the climb ramp

```
Match the attached reference image EXACTLY in art style, colour palette and line
quality: the same flat 2D cartoon look and the same warm pale plank wood as the
bridge deck. This is the same carpentry, by the same builder.

A single game PROP isolated on a FULLY TRANSPARENT background. No scene, no
environment, no ground line, no characters, no shadow cast onto the backdrop.

A short wooden ramp seen from the SIDE, rising from LEFT to RIGHT. Wide 5:2
landscape proportions.

GEOMETRY -- follow exactly:
- The ramp's top surface begins at the very BOTTOM-LEFT corner of the image and
  rises in one gentle continuous curve to the very TOP-RIGHT corner.
- Both of those corners must be solid ramp, touching the image edge, with no
  transparent gap or margin.
- The rise is shallow and friendly -- something a small character cycles up
  comfortably, not a steep jump.
- Solid wood fills the area beneath the surface, down to the bottom edge.

Built from plain planks laid across the slope, with a few visible board joins and
a simple thicker board along the top surface edge. Pale weathered wood, warm
tone, simple flat shading. Clean and uncluttered.

Do NOT include: any rope, any metal, any bolts, any skate-park styling, any
graffiti or markings, any text, any grass or plants, any rocks, any steep or
dangerous angle, any characters, any ground beneath it.
```

## Optional second variant — the take-off kicker

Leg A is a climb *onto* the bridge, so its ramp should join the deck smoothly.
Leg B is a take-off, where a lip reads better. If you want both, generate the
climb ramp first, then attach it:

```
The SAME wooden ramp as the attached image, in the SAME style, wood and
proportions, with ONE change: the top-right end now finishes in a small rounded
upward LIP, like a take-off kicker. Everything else identical -- same curve, same
planks, same 5:2 proportions, and the surface still touches the bottom-left and
top-right corners exactly.
```

## What to check

- [ ] Surface touches bottom-left and top-right corners with no margin. Open it
      on a dark background and look at those two corners specifically — this is
      the one that will bite.
- [ ] Same wood as the bridge, or does it read as imported from another game?
- [ ] Shallow enough to cycle up.
- [ ] Real alpha, no white matte, no halo. Composite over magenta.

Send it over and I will measure the actual rise:run off the art, feed it into
`RAMP_*_RISE`, and swap `rampSVG()` out for it.
