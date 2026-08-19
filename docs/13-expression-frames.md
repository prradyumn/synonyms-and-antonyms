# Jhumru's expressions on the stopped bicycle — prompt package

Seven new frames of the **exact same seated pose**, with only the face and trunk
changing. What to attach, what to ask for, and why the head is the only part that
actually ships.

---

> ## ✅ Delivered and wired in
>
> The set arrived and is live in the opening. Source art is in
> [assets/chars/expressions/](assets/chars/expressions/); `build_expressions()` in
> [tools/build-assets.py](tools/build-assets.py) turns it into one headless body
> plus eight head overlays in `assets/chars/`.
>
> **The pack itself was exact.** 662×880, seam at 280, anchor 0.29, every frame
> byte-identical below the seam, rear-wheel contact at the same pixel in all
> seven, and the base matched our own sprite with 0.0 delta. Two things came out
> of checking it, and only one was the artist's:
>
> **1 · The seam runs through his mouth — my error, not theirs.** I picked y=140
> by measuring which colours crossed that row and reported "flat grey and flat
> white". I only ever tested the blue and white fractions; I never tested red. 70
> of the 270 opaque pixels on that row are open mouth. So the lower lip and tongue
> belong to the body layer and are **shared by all seven expressions** — the
> closed-mouth instructions in prompts 2, 4 and 7 below were impossible to honour.
>
> It costs little in practice: every line in the opening is spoken, so an open
> mouth is right for all five story beats. It does mean `confused` and
> `encourage` can never be closed-mouthed. **A future round should put the seam at
> y=162**, below the mouth and through the flat blue strap and flat white shirt —
> just as reproducible, and it frees the mouth.
>
> **2 · The ears drifted in saturation.** Hue was spot on everywhere (within
> 1.2°), but `wow`, `encourage` and `cheer` came back washed out and pink — up to
> −0.19 saturation. The build corrects it by measuring each frame's warm pixels
> against the approved still rather than by a typed-in number, so it stays right
> if the pack is regenerated. Corrections applied: ×1.25, ×1.28, ×1.10.
>
> **Head overlays, not flattened sprites.** Flattening each delivered frame into
> its own full sprite re-encodes the body seven more times, and lossy WebP left
> 0.3% of body pixels differing by >24/255 along the bike outlines — a shimmer on
> a character standing still while his face changes. Lossless fixes it at 532KB;
> stacking transparent heads over **one shared body file** is exact *and* smaller,
> at 79KB. `RIDER.still` is now the headless body and `mkActor().face(k)` supplies
> the head, held across mode changes so the cycling and wheelie sprites — which
> carry their own heads — simply ignore it.
>
> Expressions are driven from the script: each `HOOK` line takes a `face:` key.

---

## The reference images to attach

Three files, all exported and sitting in [docs/ref/](docs/ref/):

| file | size | attach it | why |
|---|---|---|---|
| [jhumru_bike_ref.png](docs/ref/jhumru_bike_ref.png) | 802×1020 | **every prompt** | the exact frame the game uses, 2× on mid-grey with a margin. Locks pose, bike, palette, line weight. |
| [jhumru_bike_head_ref.png](docs/ref/jhumru_bike_head_ref.png) | 905×710 | **every prompt** | the head at 3×. Without it the model re-invents the eye shape, the brows and the hair tuft, because in the real sprite the whole face is only ~110px wide and the detail is below what the model resolves. |
| [jhumru_bike_ref_alpha.png](docs/ref/jhumru_bike_ref_alpha.png) | 331×440 | no — for you | the untouched frame with real alpha, for checking cutouts over a dark background. |

**And one to deliberately NOT attach:** `assets/chars/talking jhumru.gif`. It has
plenty of mouth shapes, so it looks like the obvious reference — but it is a
*different rendition*. Standing, front-on, **red** ears against the bike frame's
**orange** ones, heavier outlines, more shading, visible tusks. Attach it and the
style bleeds: you get a face that does not match the body it is being pasted onto.

If you want mouth-shape ideas from it, look at it yourself and describe what you
want in words. Do not hand it to the model.

---

## What he actually looks like

Worth writing down, because the earlier notes had this wrong and called the hair a
cap:

- Chubby grey cartoon elephant, **facing right**, body side-on, **head turned ¾
  toward the viewer** so both eyes read.
- A spiky **blue-and-white tuft of hair** on top of the head. Not a cap. Not a
  helmet.
- **Orange** outer ears with pale pink inners.
- Trunk raised and curled up to the right, with a **maroon tip**.
- **Blue dungarees** with yellow buckles over a **white short-sleeved T-shirt**,
  small blue collar at the throat.
- Short tail with an orange tuft. Grey feet.
- A small **red-orange bicycle**: silver spoked wheels, black tyres, silver
  handlebars.
- Big white eyes, black pupils, dark brown brows. Open smile, one white tooth,
  pink tongue.
- Flat 2D cartoon: thin dark outline, soft cel shading, no texture.

---

## Only the head ships

This is the part that makes the whole set cheap and safe.

The build takes **only the region above the collar** from each delivered frame and
composites it onto the one body and bicycle already approved. Everything from the
shirt down comes from the existing sprite, byte for byte.

Measured on the 331×440 frame: the blue dungaree strap first appears at **y=150**,
and at **y=140** the only things crossing that row are flat grey (neck and trunk)
and flat white (shirt). So the seam sits at **y≈140**, with a 6px feather — it
crosses two flat colours and nothing else, which is why it will be invisible.

Three consequences, and they change what you ask for:

1. **Body and bike drift does not matter.** If the model redraws the pedals
   slightly differently, or the bike ends up 8px left, it is discarded anyway.
   Stop worrying about it.
2. **Head size and angle are now the thing that must match.** Same scale, same ¾
   turn. If the head comes back bigger or rotated, the swap will not line up.
   (A near-miss is still usable — I can measure the eyes and scale it to fit. Do
   not throw away a good expression over a 10% size difference.)
3. **The trunk is your expression tool, and it must stay above the collar.** The
   arms and hands are welded to the handlebars below the seam, so he cannot
   gesture with a hand. The trunk can do everything — curl to the chin, point at
   the viewer, throw up in a cheer — as long as it never drops below chin height.
   A trunk drawn hanging down past the shirt gets cut off at the seam.

---

## Route A — image editing (do this first)

If your tool can edit an attached image rather than generate from scratch —
ChatGPT's image editing can — this is far and away the best route, and it is
exactly what "same frames" means. Upload
[jhumru_bike_ref.png](docs/ref/jhumru_bike_ref.png) and keep the instruction
short:

```
Edit this image. Change ONLY his face and trunk. Keep everything else pixel-for-
pixel identical: the same bicycle, the same blue dungarees and white T-shirt, the
same arms and hands on the handlebars, the same legs and feet, the same position
on the canvas, the same background grey.

New expression: <one expression block from below>

Same art style, same palette, same line weight, same head size, same 3/4 head
angle. Do not move the head. Do not add anything to the scene.
```

Then paste one expression block. One edit per frame, always starting again from
the original reference — never from the previous edit, or the drift compounds.

## Route B — fresh generation (fallback)

If editing is not available, generate from scratch with the full constants block.

### Block E — paste at the top of every Route B prompt

```
Match the two attached reference images EXACTLY. The same chubby grey cartoon
elephant: a spiky blue-and-white tuft of HAIR on top of his head (not a cap, not
a helmet), ORANGE outer ears with pale pink inners, a trunk with a MAROON tip,
blue dungarees with yellow buckles over a white short-sleeved T-shirt, a small
blue collar at the throat, a short tail with an orange tuft. He sits on the same
small RED-ORANGE bicycle with silver spoked wheels. This is the SAME character on
the SAME bike, not a redesign.

He is STOPPED, sitting upright on the stationary bicycle, both feet on the pedals,
both hands on the handlebars. Body side-on facing RIGHT, head turned three-
quarters toward the viewer so both eyes are visible. Exactly the pose in the
reference.

Portrait canvas, 3:4 proportions. Isolated on a plain flat mid-grey background
with a generous margin. Flat 2D cartoon rendering: thin dark outline, soft cel
shading, poster-clean. No film grain, no texture, no 3D look, no photographic
realism.

The head is the SAME SIZE and at the SAME three-quarter angle as in the reference.
The trunk may move but never drops below his chin.

Do NOT include: any background scene, any ground line, any motion lines or speed
streaks, any text, any speech bubble, any emoji, any symbols floating in the air,
any second character, any change to his clothing, the bicycle, or his colours.
```

Note the "no symbols floating in the air" clause — ask a model for *thinking* or
*confused* and it will reach for a thought bubble or a question mark above the
head every time. Those cannot ship: the game draws its own bubbles, and a baked-in
`?` would appear in every scene that reuses the frame.

---

# The expressions

Five core, tied to actual lines in [src/js/levels.js](src/js/levels.js), plus two
for answer feedback later.

| file | expression | the line it plays under |
|---|---|---|
| `jhumru_cycle_still` ✅ | happy, mouth open, trunk up | "Hello, everyone! Have you seen my new bicycle?" |
| **`still_proud`** | showing off | "Tring! Tring! Look at it! It is shiny!" |
| **`still_think`** | wondering | "I wonder what we will find along the way!" |
| **`still_wow`** | surprised | "Oh! The jungle path looks full of surprises and challenges." |
| **`still_ask`** | hopeful, inviting | "Will you come on this adventure with me?" |
| **`still_cheer`** | delighted | "Wonderful! Let us go!" |
| `still_confused` ◇ | puzzled, kind | a wrong answer, later |
| `still_encourage` ◇ | warm, try-again | after a wrong answer, later |

◇ optional — commission these when the level mechanic is settled ([docs/08](docs/08-four-option-mechanics.md)).

---

## 1 · `still_proud` — "Look at it! It is shiny!"

```
PROUD, showing off his new bicycle. Chin lifted, chest out, eyes bright and
half-closed in a pleased way with the brows raised high. A big closed-lipped
smug grin, one corner higher than the other. The trunk curls up and over in a
tall confident flourish, tip high above his head.

This is a small child proud of a new toy -- warm and funny, not arrogant.
```

**Check:** does he look pleased with the *bicycle*, or pleased with himself in a
sneering way? Should be the first.

## 2 · `still_think` — "I wonder what we will find"

```
THINKING, wondering what is ahead. Eyes looking UP and to his left, away from the
viewer, pupils rolled upward. One brow raised higher than the other. Mouth a
small closed line, slightly pursed to one side. The trunk curls up and tucks its
tip under his chin, the way a person rests a hand on their chin while thinking.

Curious and pleasant, not worried, not straining.

Do not draw a thought bubble, a question mark, or any floating symbol.
```

**Check:** eyes actually *up and off to the side*? Straight-ahead eyes with a
curled trunk reads as sniffing, not thinking.

## 3 · `still_wow` — "Oh! Full of surprises"

```
SURPRISED and delighted. Eyes wide and fully round, pupils large, whites showing
all around. Brows raised as high as they go. Mouth open in a small round "oh".
Ears lifted and spread. The trunk shoots straight UP in a startled curve, tip
flicked back.

Wide-eyed wonder at something amazing, NOT fear -- no sweat drops, no shaking, no
frightened expression.
```

**Check:** round eyes and a round mouth. If the mouth is a wide grin it has
drifted back to the base frame.

## 4 · `still_ask` — "Will you come with me?"

```
ASKING, inviting the viewer along. Head tilted slightly toward the viewer, turned
a little further forward than the reference so he is nearly looking at us. Brows
raised in a soft hopeful arch. Eyes big and warm, looking straight AT the viewer.
A gentle closed-lip smile, hopeful rather than wide. The trunk reaches out
forward toward the viewer, tip curled up in a small welcoming beckon.

The whole pose asks a question and waits for an answer.
```

**Check:** is he looking at *us*? This is the one frame where eye contact with the
camera matters — it is the moment the child is invited in.

## 5 · `still_cheer` — "Let us go!"

```
DELIGHTED, celebrating. Eyes squeezed shut into happy upward arcs. Mouth wide
open in an open laugh showing the tongue and the single white tooth. Ears lifted.
The trunk thrown UP and back in a big joyful trumpet, tip wide open.

Pure uncomplicated happiness -- the biggest expression in the set.
```

## 6 · `still_confused` ◇ — a wrong answer

```
CONFUSED, puzzled but not upset. Head tilted to one side. One brow up and one
down. Eyes half-lidded, looking sideways and slightly down. Mouth a small wavy
uncertain line. One ear drooping lower than the other. The trunk curls into a
loose question-mark shape at chin height -- never below the chin.

Gently baffled and still likeable. NOT sad, NOT crying, NOT scared, no tears, no
frown of pain. He is thinking "hmm, that is not right" -- and he is fine.

Do not draw a question mark, a thought bubble, or any floating symbol.
```

**Check:** would a six-year-old read this as "I got it wrong and that's okay", or
as "I made him sad"? If the second, it fails — nothing in this game punishes.

## 7 · `still_encourage` ◇ — try again

```
ENCOURAGING and warm. A soft closed-lip smile, brows relaxed and level. One eye
in a friendly wink, the other open. Head upright and steady. The trunk curls up
in a small reassuring wave toward the viewer.

Calm and kind -- the face of "have another go".
```

---

## 8 · Optional — all five core frames in one sheet

Lower success rate, but one attempt is worth the try because a single generation
keeps the head size consistent across the set for free.

```
[Block E]

A sheet of FIVE separate portraits of the same character in the same seated
bicycle pose, in one row, left to right, evenly spaced. Every cell exactly the
same size, the character the same size and in the same position within its cell.

1: PROUD -- chin up, smug grin, trunk curled high.
2: THINKING -- eyes rolled up and to the side, trunk tip tucked under the chin.
3: SURPRISED -- round wide eyes, small round open mouth, trunk straight up.
4: ASKING -- looking at the viewer, brows hopefully raised, trunk reaching out.
5: DELIGHTED -- eyes squeezed shut in happy arcs, wide open laugh, trunk trumpeting.

Only the face, ears and trunk differ between cells. The body, clothing, arms,
hands, legs and bicycle are identical in all five.

Plain flat mid-grey background. No grid lines, no borders, no numbers, no labels,
no text.
```

If it comes back usable, cut the cells apart and hand me the five. If the heads
drift in size between cells, fall back to Route A one at a time.

---

## Delivery and checks

Deliver **PNG**, at least 660×880, mid-grey background or transparent — either is
fine, the build cuts it out and crops it.

- [ ] Only the face, ears and trunk changed. Flip between the new frame and
      [jhumru_bike_ref.png](docs/ref/jhumru_bike_ref.png) in an image viewer — the
      body should barely move.
- [ ] Head the same size, same ¾ angle, not rotated.
- [ ] Trunk never below the chin.
- [ ] Ears still **orange**, not red. This is the single most likely drift, and
      the one that will make the head look pasted on.
- [ ] Trunk tip still maroon. Hair still a blue-and-white spiky tuft.
- [ ] Nothing floating in the air: no `?`, no thought bubble, no sparkles, no
      speech balloon, no text anywhere.
- [ ] Read each one at thumbnail size — about 25mm tall. If you cannot tell
      *think* from *confused* that small, the expression is too subtle. On a
      1920-wide screen he renders 322 units tall, so what you see shrunk is what
      the child sees.

---

## When they arrive

- add a shared-bbox group to `tools/build-assets.py` so the whole set crops
  identically, as the wheelie set already does
- composite each head onto the approved body at the **y≈140** seam with a 6px
  feather, so the bike and dungarees are literally the same pixels in every frame
- add them to `RIDER` in [src/js/levels.js](src/js/levels.js) — all seven share
  `hu:322, ar:331/440, ax:0.290`, identical to `still`, which is the whole point
  of the head-swap
- tag each `HOOK` line with a `face:` key so the expression changes when the line
  does, driven off the existing `speak()` call
- measure and correct head scale or offset if a frame is a near-miss

The runtime side is a few lines. The alignment is again the part that would bite —
which is why this time the build throws away everything except the head.
