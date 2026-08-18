# Scrolling opening — background art prompts

For the revised opening: **Jhumru cycles, the camera travels with him across a
simple bridge, and he arrives at a jungle clearing where Monty and Tez are
waiting.** That clearing becomes the hub the trail map opens from.

Supersedes the single flat `bridge_fixed` plate for the opening. Six assets.

---

## Why the current plate cannot do this

Three separate reasons, all fixable only in the art:

1. **It is one flat image.** A camera move across a flat plate is a pan, not a
   journey — nothing passes at different speeds, so there is no sense of travel.
2. **It is cluttered.** Dense foliage, flowers, vines and rocks fill every corner.
   A character riding across it competes with the background instead of reading
   against it, and there is nowhere clean for the speech bubble or the word-tags.
3. **The rope bridge is the wrong object.** A rope suspension bridge over a deep
   chasm is dramatic, which is exactly the problem — it is visually busy, it reads
   as dangerous, and its sagging deck forced the rider onto a measured catenary
   path. A short plain plank bridge over a shallow stream is calmer, friendlier
   and far easier to ride across convincingly.

---

## The six assets

Three **scrolling layers** that tile and repeat, plus three **action segments**
that are unique and butt together end to end.

| # | Asset | Size | Alpha | Scroll rate | Repeats? |
|---|---|---|---|---|---|
| 1 | `far_sky` | 2560×1440 | opaque | `0.20` | yes, tileable L↔R |
| 2 | `mid_canopy` | 2560×1440 | transparent above and below the band | `0.50` | yes, tileable L↔R |
| 3 | `act_bank` | 1920×1080 | transparent sky | `1.00` | no — segment 1 |
| 4 | `act_bridge` | 1920×1080 | transparent sky | `1.00` | no — segment 2 |
| 5 | `act_clearing` | 1920×1080 | transparent sky | `1.00` | no — segment 3 |
| 6 | `near_fringe` | 2560×540 | transparent above | `1.40` | yes, tileable L↔R |

Stacking back to front:
`far_sky → mid_canopy → act_* → [characters] → near_fringe`

The character rides on the action layer, so that layer moves at exactly the
camera rate (`1.00`). Everything behind moves slower, the fringe in front moves
faster. That difference *is* the parallax.

Total camera travel is two screens (3840px), which is why the three action
segments are 1920 each: `bank → bridge → clearing`.

### The seam rule — read this before generating anything

An image model will not produce three 1920-wide segments that join invisibly.
Do not try to make it.

**Instead, put every seam behind a vertical occluder.** Each action segment must
begin and end with a full-height foreground element — a broad tree trunk, a rock
face, a bamboo stand — placed hard against the frame edge. When two segments butt
together, the join falls inside that trunk and a few pixels of mismatch are
invisible. This is standard side-scroller practice and it is the difference
between six usable images and six weeks of retouching.

Every segment therefore ends with the same instruction: *a broad vertical tree
trunk flush against both the left and right edges, cropped by the frame.*

---

## Block A2 — constants, landscape (paste at the top of every prompt)

Replaces `docs/03` Block A for this set. That block specifies **portrait 3:4 with
the horizon at 58%**, which no longer matches the game — the build is landscape
1920×1080 and every shipped plate is 16:9.

```
Match the attached reference image EXACTLY in art style, colour palette, line
quality and rendering technique. Treat the reference as the single source of
truth for style. Do not stylise differently.

This is a BACKGROUND LAYER for a children's mobile game. Characters are animated
separately and composited on top, so the image must contain NO characters, NO
people and NO creatures of any kind.

CAMERA
- Landscape, 16:9.
- Eye level of a small animal: camera low, roughly 40cm off the ground, looking
  straight ahead. NOT looking down. The ground plane must be seen nearly
  edge-on, not from above.
- Horizon at 52% of image height. Identical in every asset in this set.

CLEAN COMPOSITION -- this is the most important instruction
- This scene must read as calm, open and uncluttered. Restraint over detail.
- Hard detail budget for the whole image: AT MOST three plant clusters, AT MOST
  two rocks, AT MOST four clouds. Do not add more. Empty space is correct here,
  not unfinished.
- Large areas of flat, uninterrupted colour are wanted: open sky, open ground.
- No vines hanging into frame. No flowers. No scattered pebbles, twigs, leaf
  litter or grass tufts spread across the ground.

RESERVED EMPTY SPACE -- keep these genuinely empty
- Top 18%: plain sky only. A UI bar and a speech bubble sit here.
- Bottom 26%: plain, flat, walkable ground, completely clear. Characters stand
  here and a row of word-tags hangs here.
- Nothing may intrude more than 12% inward from the left or right edge except
  where a full-height edge trunk is explicitly asked for.

LIGHTING
- Soft, even, late-morning light from the upper left.
- No cast shadows across the walkable ground. No rim light, no lens flare, no
  god rays, no vignette.
- Identical time of day and light direction in every asset in this set.

OUTPUT
- Flat, poster-clean vector-style rendering. No film grain, no noise, no paper
  or canvas texture, no painterly brush marks.
```

---

## The prompts

Generate **`act_bridge` first** and iterate until the style is right — the bridge
is the object most likely to come back wrong. That approved image becomes the
style reference attached to all five others.

### 1 · `far_sky` — furthest layer, opaque, tileable

```
A wide, calm jungle sky with a very distant tree line along the bottom edge.

Open blue sky filling the upper three quarters, with at most four small soft
clouds. Along the bottom, a low band of far-distant jungle canopy reduced almost
to a flat silhouette in pale desaturated blue-green -- heavy atmospheric haze, no
individual leaves, no trunks, no detail. It should read as "very far away" and
nothing more.

Fully opaque. No transparency.

SEAMLESS TILING: the left and right edges must match exactly so the image can
repeat horizontally forever with no visible join. No element may touch either
vertical edge except the flat haze band.
```

### 2 · `mid_canopy` — middle layer, transparent, tileable

```
A horizontal band of mid-distance jungle trees, isolated on a fully transparent
background.

Rounded tree crowns in two or three greens, overlapping into a soft continuous
mass, with a few slim trunks visible beneath. Simplified and flat -- suggest
foliage as shape, do not draw individual leaves. Noticeably lighter and more
desaturated than foreground green, because this sits behind everything.

The band occupies only the vertical middle of the image. Everything above it and
everything below it must be FULLY TRANSPARENT -- sky shows through above, the
ground layer shows through below. Output a PNG with a true alpha channel.

SEAMLESS TILING: left and right edges must match exactly for infinite horizontal
repeat, with crowns continuing across the join.
```

### 3 · `act_bank` — segment 1, where he sets off

```
The near bank of a shallow jungle stream, seen edge-on at ground level.

A wide, flat, bare dirt path running unbroken from the left edge to the right
edge across the bottom quarter -- smooth, clear and completely free of clutter,
because a character rides a bicycle along it. Warm ochre earth.

Behind the path, low simple ground and, at most, two rounded shrubs and one rock.
Toward the right edge, the ground begins to fall away into the stream bed that
the next segment bridges -- but the drop is shallow and gentle, a dip of a metre
or so, NOT a cliff, chasm, gorge or ravine.

The sky area must be FULLY TRANSPARENT -- a separate sky layer sits behind. Output
a PNG with a true alpha channel.

EDGE TRUNKS: a broad vertical tree trunk flush against the left edge and another
flush against the right edge, both cropped by the frame, running the full height.
These hide the joins to neighbouring segments.
```

### 4 · `act_bridge` — segment 2, the bridge itself. Generate this one first.

```
A short, simple wooden plank bridge crossing a shallow, calm jungle stream, seen
side-on at ground level.

THE BRIDGE -- follow this exactly:
- A plain flat wooden footbridge. Straight and level, NOT sagging, NOT curved,
  NOT arched.
- The deck is made of plain planks laid flat across two straight log beams. The
  deck surface is seen nearly edge-on, almost as a straight line -- NOT tilted
  toward the viewer, NOT seen from above.
- A single straight horizontal wooden handrail on one side only, carried on three
  or four simple square posts.
- Absolutely NO ROPE anywhere: no rope suspension, no rope handrails, no rope
  lashings, no knots, no rope netting, no hanging rope. This is a plain carpentry
  bridge, not a rope bridge.
- It spans a SHALLOW stream, a metre or so below the deck. Not a chasm, gorge,
  ravine, canyon or abyss. There must be no sense of height or danger.
- Plain, clean, pale weathered wood. No moss, no vines, no creepers, no broken or
  missing planks, no decorative carving.

BELOW: a slow, shallow stream with a flat, calm surface and a few smooth stones.
Water is calm and friendly -- no rapids, no white water, no spray.

The bridge deck must sit at a constant height across the whole image so a
character can ride straight across it without rising or falling.

The sky area must be FULLY TRANSPARENT. Output a PNG with a true alpha channel.

EDGE TRUNKS: a broad vertical tree trunk flush against the left edge and another
flush against the right edge, both cropped by the frame, running the full height.
```

### 5 · `act_clearing` — segment 3, the hub where the friends wait

```
An open, sunlit jungle clearing with a wide flat floor, seen edge-on at ground
level.

The bottom 30% is a broad, flat, completely clear clearing floor of short even
grass and packed earth -- open and uninterrupted from the left edge to the right
edge. This is the most important part of the image: three characters stand here
and a row of hanging word-tags sits above it, so it must stay genuinely empty.
No flowers, no shrubs, no rocks, no logs, no leaf litter anywhere on it.

Behind the clearing, a calm ring of simplified jungle trees enclosing the space,
with one gap toward the left where the path arrives from the bridge.

Centred toward the back and clearly the focal point, ONE large friendly broad
tree -- a thick straight trunk and a wide rounded canopy. Keep it simple and
readable. This is the Word Tree, so leave its canopy plain and unfussy: it will
later be shown both bare and heavy with fruit.

Between the two upper corners, a single long horizontal branch or liana spanning
the frame at roughly 60% height, clear of the canopy, from which tags can hang.
Nothing else in the upper third but sky.

The sky area must be FULLY TRANSPARENT. Output a PNG with a true alpha channel.

EDGE TRUNK: a broad vertical tree trunk flush against the left edge only, cropped
by the frame, full height. The right edge needs no trunk -- travel ends here.
```

### 6 · `near_fringe` — nearest layer, in front of the characters, tileable

```
A low, narrow strip of foreground foliage running along the bottom of the frame,
isolated on a fully transparent background.

Simple broad leaves and grass blades, occupying only the bottom quarter of the
strip and reaching up in a few loose clumps. Deliberately sparse -- gaps are
essential, because characters must remain clearly visible between the clumps.
Darker and more saturated green than the rest of the scene, and slightly softer,
as if very close to the camera.

Everything above the foliage must be FULLY TRANSPARENT. Output a PNG with a true
alpha channel.

SEAMLESS TILING: left and right edges must match exactly for infinite horizontal
repeat.

This layer sits IN FRONT of the characters, so it must never rise high enough to
cover a character's head or body -- only their feet.
```

---

## Negative prompt — append to all six

```
Do NOT include: any rope, rope bridge, rope handrail, rope lashing, knots or
netting; any suspension bridge; any chasm, gorge, ravine, canyon, cliff or
drop; any characters, animals, people, insects or faces; any text, letters,
numbers or words; any signage; any UI, buttons or icons; any watermark or logo;
any border or frame; any hanging vines or creepers; any flowers; any scattered
leaf litter, twigs or pebbles on the ground; any dense undergrowth; any busy or
cluttered composition; any top-down or bird's-eye angle; any tilted ground plane;
any cast shadows across the ground; any dark, moody or scary atmosphere; any
photographic realism; any 3D render look; any visible brush or canvas texture.
```

---

## QA checklist

- [ ] **No rope anywhere.** Image models reach for rope bridges by default in
      jungle scenes. Check every generation.
- [ ] Bridge deck is level and at a constant height left to right. Lay a ruler
      along it.
- [ ] Ground plane is seen edge-on, not from above. This is what made the cycling
      sprite look pasted on before.
- [ ] Top 18% and bottom 26% genuinely empty — cover them and check nothing is
      lost.
- [ ] Detail budget respected: count the plant clusters. More than three means
      regenerate, do not accept and crop.
- [ ] Horizon at 52% in all six. Flip between them.
- [ ] Full-height trunks flush against segment edges, so the seams have somewhere
      to hide.
- [ ] Tileable assets actually tile: place two copies side by side and look at the
      join.
- [ ] Alpha is real transparency, not a painted-in checkerboard and not a white
      matte. Composite over solid magenta to check for halos.
- [ ] All three action segments butt together: lay `bank | bridge | clearing`
      side by side and confirm the ground line meets at both joins.

---

## What the code will need

Not yet built — noted so the art is generated against a real target.

- The camera pans two screens (3840px) at 1920×1080, so the six layers scroll at
  `0.20 / 0.50 / 1.00 / 1.40` against camera position.
- `#bg` is currently a single `background-image` on one div. Scrolling needs one
  positioned div per layer, with the tiling layers set to `background-repeat:
  repeat-x` and driven by `background-position-x`.
- Jhumru stays near frame centre while the layers move, rather than translating
  across a static plate as he does now. `RIDE` and `SINK` in `scenes.js` become
  unnecessary — a level bridge deck means a constant Y, which is the whole point
  of asking for one.
- `act_clearing` replaces `bridge_broken` as the backdrop for `intro()`, and the
  long horizontal branch is what `vineSVG()` should hang from.
