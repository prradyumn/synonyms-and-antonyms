# Jungle Trail — location art prompt pack
### For GPT Image 2, with your own background reference attached

---

## How to use this

1. **Attach your reference background** to the first generation only.
2. Generate **Asset 01A (rope bridge, broken state)** first. Iterate until the style, palette and camera height are exactly right. This becomes your *style anchor*.
3. For every asset after that, attach **the approved 01A output** as the reference instead of your original. This locks the palette across all thirteen images.
4. For each **B state**, attach the approved **A state** of that same location and use the paired-state prompt. Never generate an A and B state independently — they must line up for a crossfade.
5. Run the **prop pass** last, once the locations are settled.

Paste **Block A** at the top of every single prompt, then append the specific asset block.

---

## Block A — constants (paste every time)

```
Match the attached reference image EXACTLY in art style, colour palette,
line quality, level of detail, and rendering technique. Treat the reference
as the single source of truth for style. Do not stylise differently.

This is a BACKGROUND PLATE for a children's mobile game. Characters are
animated separately and will be composited on top, so the image must
contain NO characters and NO creatures of any kind.

CAMERA AND COMPOSITION
- Portrait orientation, 3:4 aspect ratio.
- Eye level of a small animal: camera low, roughly 40cm off the ground.
- Horizon line at 58% of the image height. Keep this identical in every asset.
- A flat, walkable ground plane running unbroken from the left edge to the
  right edge across the lower third.
- Three clear depth bands: near framing foliage, mid-ground where the action
  happens, far background haze.
- Framing leaves and hanging vines in the TOP LEFT and TOP RIGHT corners only,
  for depth. They must not intrude past 18% from any edge.

RESERVED EMPTY SPACE — this is critical
- Top 16% of the image: plain, uncluttered sky or canopy. A UI bar sits here.
- Bottom 20%: plain, uncluttered ground. A row of UI tiles sits here.
- Centre 40% of the image width: the obstacle sits here. Keep it readable and
  free of busy detail or competing shapes.
- Upper-centre-left, around 25% from the left and 30% from the top: leave a
  clear pocket of quiet space for a wooden signpost to be composited in.

LIGHTING
- Soft, even, late-morning light from the upper left.
- No harsh cast shadows anywhere on the walkable ground plane.
- No dramatic rim lighting, no lens flare, no god rays, no vignette.
- Identical time of day and light direction in every asset.

OUTPUT
- Add roughly 8% extra image on all four edges as safe bleed for cropping.
- Flat, poster-clean rendering. No film grain, no noise, no texture overlay.
```

---

## Block B — the thirteen assets

Each location has an **A state** (the problem) and a **B state** (resolved after the child answers). The word pair each pair teaches is noted so the art director knows what the change has to communicate.

---

### 01A · Rope bridge — broken
*Teaches: weak → strong*

```
LOCATION: A rope bridge across a narrow jungle ravine.
The two rock ledges sit at the left and right edges, with a gap between them.
The bridge is in poor condition: frayed rope handrails, several wooden planks
missing so daylight shows through the gaps, the whole span sagging in the
middle. Tropical ferns on both ledges. Soft green depth of jungle beyond.
The ravine below fades into gentle mist so it never looks frightening.
Warm and inviting, never threatening.
```

### 01B · Rope bridge — repaired
*Attach 01A as reference.*

```
Keep this image IDENTICAL in every way: same camera, same ledges in the same
positions, same ferns, same background, same light.
Change ONLY the bridge itself: it is now sturdy and complete. Every plank is
present, thick and new. The rope handrails are taut and clean. The span is
level rather than sagging. Nothing else in the frame moves or changes.
```

---

### 02A · River crossing — deep
*Teaches: deep → shallow*

```
LOCATION: A jungle river crossing the trail from left to right.
The water is high and deep, opaque muddy brown-green, moving briskly, filling
the whole middle band of the image. Only the very tops of a few stepping
stones break the surface. Muddy banks on the near and far side. Broad-leafed
plants and a fallen mossy log at the water's edge. Dense green jungle behind.
```

### 02B · River crossing — shallow
*Attach 02A as reference.*

```
Keep this image IDENTICAL: same banks, same plants, same fallen log, same
background, same light, same camera.
Change ONLY the water level: the river has drained to a shallow trickle. The
full stepping stones are now exposed and dry on top, forming a clear path
across. Wet dark mud shows where the high water line used to be. The remaining
water is clear and shallow enough to see the pebble bed through it.
```

---

### 03A · Rock wall — high
*Teaches: high → low*

```
LOCATION: A wall of stacked mossy boulders blocking the jungle trail.
The boulders are piled high enough to fill most of the image height, leaving
no way over or around. Grey-green stone with moss in the crevices and small
ferns growing from the cracks. The trail runs up to the base of the wall and
stops. Jungle canopy visible above and to the sides of the stack.
```

### 03B · Rock wall — low
*Attach 03A as reference.*

```
Keep this image IDENTICAL: same trail, same moss, same ferns, same canopy,
same light, same camera.
Change ONLY the boulder stack: it has sunk down until it is barely knee-high,
a low easy step rather than a wall. The same boulders, same moss, same shapes,
simply settled low into the ground. The trail now continues visibly beyond
them into the jungle. Much more open sky and canopy is revealed above.
```

---

### 04A · Cave mouth — dark
*Teaches: dark → light*

```
LOCATION: The mouth of a small cave in a mossy rock face, directly ahead on
the trail. The interior is deep flat black, completely unreadable, with no
detail visible inside. Vines hang across the top of the opening. Damp stone,
ferns and scattered pebbles around the entrance. The trail leads straight in.
```

### 04B · Cave mouth — lit
*Attach 04A as reference.*

```
Keep this image IDENTICAL: same rock face, same vines, same ferns, same
pebbles, same entrance shape, same camera.
Change ONLY the cave interior: it is now softly lit from within by warm
glowing crystals in the walls, so the inside is fully visible — a short
friendly tunnel with a smooth sandy floor leading through to daylight at the
far end. Gentle warm light spills a little way out onto the stone at the
entrance. Inviting, never spooky.
```

---

### 05A · Fruit tree — bare
*Teaches: empty → full*

```
LOCATION: A tall wide-canopied jungle fruit tree in a small sunlit clearing,
centred in frame. The branches are completely bare of fruit. The canopy is
thin and sparse with gaps of sky showing through. Short grass and a few fallen
dry leaves at the base. A low mossy rock to one side. Open clearing, jungle
wall behind.
```

### 05B · Fruit tree — laden
*Attach 05A as reference.*

```
Keep this image IDENTICAL: same tree trunk in the same position, same clearing,
same rock, same grass, same background, same light, same camera.
Change ONLY the tree's canopy and fruit: the leaves are now thick, full and
lush, and the branches are heavy with clusters of ripe tropical fruit in warm
yellows, oranges and reds. A few fruits rest on the grass beneath. The trunk,
ground and everything else in the frame is unchanged.
```

---

### 06A · Waterfall lagoon — dry
*Teaches: dry → flowing. This is the finale location.*

```
LOCATION: A wide natural rock amphitheatre with a tall cliff face at the back.
A dry waterfall: bare streaked stone where water once fell, and an empty
cracked basin of pale dry mud at the bottom. Sun-bleached rocks, dry reeds,
a few hardy ferns around the rim. Hazy green jungle beyond the cliff top.
Muted, thirsty, still.
```

### 06B · Waterfall lagoon — flowing
*Attach 06A as reference.*

```
Keep this image IDENTICAL: same cliff face, same rock amphitheatre, same rim
of ferns and reeds, same camera, same light direction.
Change ONLY the water: a full waterfall now pours down the cliff face in a
bright clean sheet, filling the basin into a wide turquoise lagoon with a soft
foam ring at the base of the falls. Light mist in the air near the falls only.
The dry cracked mud is gone, replaced by clear shallow water over pale sand at
the near edge. The reeds are now green and full. Joyful and refreshing — this
is the reward image at the end of the journey.
```

---

### 07 · The trail map
*Different rules: this one is a top-down map, not a background plate.*

```
Match the attached reference image EXACTLY in art style, colour palette and
rendering technique.

A hand-drawn top-down JUNGLE MAP for a children's game, portrait 3:4.
Bird's-eye illustrated map view, not a photographic satellite view.

A single winding dirt trail snakes from the TOP LEFT corner down to the BOTTOM
LEFT corner, crossing the map twice: left to right along the upper third, then
right to left along the lower third, connected by a curve down the right side.

Along the trail, leave SIX clearly separated circular pockets of open flat
ground where level markers will be composited on top. Space them evenly along
the path. These six pockets must be plain and uncluttered.

Fill the surrounding map with dense stylised jungle seen from above: rounded
tree canopies, a winding river, small rock outcrops, patches of tall grass.
Keep all of this detail OUT of the trail itself and out of the six pockets.

NO characters, NO creatures, NO text, NO labels, NO numbers, NO compass rose,
NO legend, NO map border decorations, NO dotted route markers.
Leave the top 14% and bottom 18% plain for UI.
```

---

## Block C — prop pass

Generate these **after** the locations are locked. Props are composited on top, so they need clean edges.

```
Match the attached reference image EXACTLY in art style, colour palette and
rendering technique.

A single game PROP asset, centred, isolated on a plain flat mid-grey
background for easy cutout. No scene, no environment, no ground, no shadow
cast onto the background. Soft contact shadow directly beneath the object only.
Square 1:1. Generous even margin around the object.
```

Append one of these:

| Prop | Prompt |
|---|---|
| **Signpost** | `A weathered wooden jungle signpost: a single post with one horizontal plank nailed across it. The plank has a clean empty rectangular recess cut into its face, like an empty slot waiting for a tile. The plank surface must be completely blank — no carving, no letters, no marks of any kind.` |
| **Word stone — round** | `A smooth rounded river pebble, pale grey-green, flat-faced, with a completely blank polished front surface. No letters, no carving, no symbols.` |
| **Word stone — square** | `A squared-off flat stone tile, pale sandstone, with a completely blank flat front surface. No letters, no carving, no symbols.` |
| **Word stone — triangle** | `A flat triangular slate tile, dark blue-grey, with a completely blank front surface. No letters, no carving, no symbols.` |
| **Vine tile socket** | `A ring of woven green jungle vine forming an empty circular frame, like a hoop waiting for something to be placed inside it.` |
| **Fruit cluster** | `A small cluster of three ripe tropical fruits on a short leafy stem, warm orange and red.` |

Three stone shapes matter: **unrelated words get the wrong shape and physically won't fit the socket.** That's how a child learns "this word isn't even in the conversation" without any text.

---

## Block D — negative prompt

Append to every generation.

```
Do NOT include: any characters, any animals, any people, any insects, any
faces, any text, any letters, any numbers, any words, any signage with
writing, any UI elements, any buttons, any icons, any watermarks, any logos,
any borders or frames, any speech bubbles, any arrows, any drop shadows across
the ground plane, any harsh contrast, any dark or scary mood, any photographic
realism, any 3D render look, any visible brush texture or canvas grain.
```

---

## Block E — parallax layer split

For depth on a location the camera moves across (right now: the rope bridge in
the opening). A single flat plate cannot parallax, and it is also why the cycling
elephant reads as a sticker laid on the deck — there is no near-rope layer to
cross in front of his legs.

### The one rule that matters

**Do not generate the layers as independent images.** Five separate generations
will not register — the cliffs will sit 30px off, the horizon will drift, the
light will swing. You get one usable set only by generating the **master plate
once**, then producing every layer as an *edit of that same file* with the master
attached. Registration is the whole job; style is already solved by Block A.

For each layer, attach the approved master and ask for a transparent-background
PNG at the same dimensions:

```
Attached is the master plate. Return the SAME image at the SAME dimensions with
pixel-for-pixel identical framing -- do not redraw, restyle, reposition, rescale
or relight anything that stays.

Keep ONLY: <the layer contents>
Delete everything else and make it fully transparent.

Where deleting an element reveals nothing behind it, paint in what would
plausibly be there, continuing the surrounding art exactly. Do not leave holes,
smears or halos. Keep edges clean and slightly anti-aliased for compositing.
Output a PNG with a true alpha channel. No checkerboard pattern drawn into the
image, no matte colour, no drop shadow.
```

### The five layers

| # | File | Keep ONLY | Scroll rate |
|---|---|---|---|
| 0 | `bridge_far` | sky, clouds, the distant jungle valley and its haze. Fully opaque, no alpha. **Extend 20% wider than the frame** so it can pan without running out | `0.15` |
| 1 | `bridge_mid` | the two rock cliff faces, the four bridge anchor posts, and the jungle foliage growing on the cliff tops | `0.45` |
| 2 | `bridge_deck` | the rope bridge only — plank deck, the FAR handrail rope, its vertical ties, and the deck's support ropes | `1.0` |
| 3 | `bridge_rail_near` | the NEAR-side handrail rope only, with its vertical ties — the rope that a character walking the deck would pass *behind* | `1.0` |
| 4 | `bridge_front` | the near foreground — dirt ground across the bottom, the flowering bushes in the bottom corners, the hanging vines and leaves in the top corners | `1.5` |

Layer 3 is the one that fixes the flat look. It composites **in front of** the
characters; every other layer sits behind them. If the master plate has no
distinguishable near railing, ask for it to be **added** to the master first, then
split.

Stacking order back to front: `far → mid → deck → [characters] → rail_near → front`.

### Also worth asking for, same session

| Ask | Why |
|---|---|
| The cycling elephant redrawn from a camera **~25° above eye level**, so the wheels are ellipses rather than circles and the top of the seat and handlebars are visible | The current loop is flat side-profile at eye level while the deck is drawn from above. No amount of compositing fixes a perspective mismatch |
| A **breathing/idle loop for Tez** matching the existing `breathing monty` and `brreacthing jhumru` framing | He is the only character who does not breathe |

### Note on Block A

Block A above specifies **portrait 3:4** with the horizon at 58%. The game is now
**landscape 1920x1080** and the shipped plates are 16:9. Update Block A's camera
section before generating anything new, or the output will not match what is in
`assets/bg/`.

---

## QA checklist before you accept an asset

- [ ] Horizon line at the same height as the style anchor. Flip between them to check.
- [ ] Ground plane is unbroken left edge to right edge, and flat enough to walk on.
- [ ] Top 16% and bottom 20% are genuinely empty — hold a finger over them and check nothing important is lost.
- [ ] Signpost pocket is clear at upper-centre-left.
- [ ] No text anywhere. Image models sneak in gibberish lettering on signs, rocks and bark — zoom in and check.
- [ ] A and B states line up. Overlay them at 50% opacity: everything except the changing element should sit still.
- [ ] Parallax layers line up. Stack all five at full opacity and compare against the master — it should be indistinguishable. Then hide one layer at a time and check for holes, halos or smeared fill.
- [ ] Light direction matches every other asset.
- [ ] The B state is *visibly, unmistakably* the transformation. Squint at it — if you can't tell which is which from across the room, it's too subtle for a six-year-old.

---

## Two notes on the design

**I swapped one location.** Your level 4 was a sleeping tiger teaching `loud → quiet`. Sound is very hard to paint convincingly, and the two states would look nearly identical. A cave mouth teaching `dark → light` gives you a dramatic, unmistakable visual change for the same slot. Keep the tiger as a prop for a bonus level if you want him.

**Ask for more state pairs per location later.** Each location can host several word pairs — the river can also do `wide → narrow`, the tree `bare → full` and `small → tall`. Once a location's camera is locked, extra states are cheap edits of the approved plate rather than new generations, which is where your art budget goes furthest.
