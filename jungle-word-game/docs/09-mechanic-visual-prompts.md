# Seeing the mechanics — prompt packages

Prompts for generating **visual mockups** of the four mechanics in `docs/08`, so
they can be judged before anything is built, plus the **production assets** each
one needs afterwards.

---

## How to use this

**Two prompts per mechanic, in this order.**

1. **The mockup.** One image showing the whole screen with the mechanic in play —
   characters, props, everything baked in. It exists to be *looked at and argued
   with*, not composited. Cheap, and it kills a bad idea in one generation.
2. **The production assets.** Only after the mockup is approved. Transparent
   props, no characters, no scene — these get cut into the game.

Do not skip to step 2. A prop pack for a mechanic that turns out to read badly is
a wasted afternoon.

### Attach a reference every time

Attach **`assets/bg/act_bridge.png`** (or the approved clearing plate) to every
generation and keep Block S at the top. That is what holds the style together —
these models drift hard between calls otherwise.

### About text in images

**Never ask for words in the image.** Image models garble lettering, and worse,
the game already draws every word itself as runtime SVG (`signSVG`, `tagSVG`) so
that content can change without new art.

So every prompt below asks for **blank plaques, blank stones, blank plates** —
a shape with a clear empty face, ready for a word to be drawn on top. In the
mockups this means you will be looking at empty holds and empty stones. That is
correct. Send me the result and I will composite the real words on in the game's
own type so you can judge legibility properly.

### About output size

GPT Image returns roughly **1536×1024** landscape or **1024×1536** portrait, not
1920×1080. That is the same ceiling your current plates hit (they are 1672×941
upscaled). Ask for the aspect, accept the size, upscale in the build. For the
climbing wall specifically, ask **portrait** — see below for why.

---

## Block S — style constants (paste at the top of every prompt)

```
Match the attached reference image EXACTLY in art style, colour palette, line
quality and rendering technique. Treat the reference as the single source of
truth. Do not stylise differently.

Flat, poster-clean 2D cartoon for a children's mobile game. No film grain, no
noise, no paper or canvas texture, no painterly brush marks, no 3D render look,
no photographic realism.

CAMERA
- Eye level of a small animal: camera low, looking straight ahead.
- The ground plane must be seen nearly EDGE-ON, not from above. Do not tilt the
  ground toward the viewer. Do not use a bird's-eye or top-down angle.

CLEAN COMPOSITION -- the most important instruction
- Calm, open and uncluttered. Restraint over detail.
- Hard budget for the whole image: AT MOST three plant clusters, AT MOST two
  loose rocks, AT MOST four clouds. Do not add more. Empty space is correct here,
  not unfinished.
- Large areas of flat uninterrupted colour are wanted.
- No hanging vines, no flowers, no scattered leaf litter, twigs or pebbles.

RESERVED EMPTY SPACE
- Top 18%: plain sky or plain rock only. A UI bar and a speech bubble sit there.
- Bottom 26%: plain, clear ground. Characters stand there.

LIGHTING
- Soft even late-morning light from the upper left. No cast shadows across the
  ground, no rim light, no lens flare, no god rays, no vignette.
```

## Block N — negative prompt (append to every prompt)

```
Do NOT include: any text, letters, numbers, words, writing, carved inscriptions
or signage of any kind; any UI, buttons, icons, arrows or speech bubbles; any
watermark or logo; any border or frame; any rope, rope bridge or rope railing;
any chasm, cliff edge or long drop; any dense undergrowth or cluttered
composition; any top-down or tilted-ground angle; any cast shadows across the
ground; any dark, moody or scary atmosphere.
```

---

# 1 · Rock wall climb ★

**The mechanic.** Four handholds are in reach above Jhumru, each carrying a word.
Tap one. If the word fits the relationship being asked for, it holds and he pulls
up — and four new holds come into reach. If not, it crumbles to dust, he stays
exactly where he is, and the hold speaks its own word. Reaching the top is the
level. Progress is *height*.

**Why it is worth seeing first.** It is the only one of the four where being
wrong actively helps: a crumbled hold removes an option *and* teaches its word, so
the puzzle gets easier as the child learns.

> ### A design consequence to check in the mockup
> Climbing needs **vertical** space. A 16:9 plate gives you about one body-length
> of climb, which is not a climb. The wall wants to be a **tall portrait plate**
> the camera pans up — roughly three screens tall — or a vertically tileable
> band. That is why the mockup below is portrait. Look at it and decide whether
> the vertical camera is worth it before anything else gets built.

### 1a · Mockup prompt — portrait

```
[Block S]

A tall vertical rock face in a jungle, seen straight on, filling the frame from
bottom to top. Portrait orientation, 2:3.

At the bottom, a small flat ledge of packed earth where two small cartoon animal
characters stand looking upward -- a grey elephant in blue dungarees and a brown
monkey in a blue cap. Keep them small: about one seventh of the image height.

Set into the rock face above them, four flat pale stone HANDHOLD PLAQUES arranged
in a loose fan within reach -- two lower, two higher, none in a straight line.
Each plaque is a smooth rounded rectangle of pale sandstone with a completely
BLANK polished front face, sunk slightly into the rock and clearly grippable.
They must read as four separate choices, all equally reachable.

Higher up the wall, a second set of four similar plaques, smaller with distance,
showing that the climb continues.

The rock is warm grey-brown with simple flat shading and a few broad cracks.
Sparse green tufts growing from ledges -- at most three. Open sky at the very top.

[Block N]
```

**What to check.** Are the four plaques obviously *alternatives for one move*
rather than a staircase? Do they read at thumbnail size? Is the climb legibly
upward — can you tell height means progress?

### 1b · Production assets — after approval

```
[Block S]

A single game PROP, centred and isolated on a plain flat mid-grey background for
cutout. No scene, no environment, no ground. Soft contact shadow directly beneath
the object only. Square 1:1, generous even margin.

A smooth rounded rectangular handhold plaque of pale sandstone, seen straight on,
with a completely BLANK flat polished front face and a slightly chipped natural
stone edge. It should look like something you could grip and pull on.

[Block N]
```

Then, attaching the approved plaque:

```
[Block S]
The SAME handhold plaque as the attached image, in the SAME style and colour,
now CRUMBLING: broken into four or five chunks flying apart, with a small puff of
pale dust behind them. Same plain flat mid-grey background, isolated for cutout.
[Block N]
```

And a climbing pose:

```
[Block S]
The SAME grey cartoon elephant in blue dungarees as the attached reference, in a
CLIMBING pose seen from the side: both arms raised gripping above his head, one
knee lifted, body pressed close to an unseen wall, looking upward, cheerful and
determined. Isolated on a plain flat mid-grey background for cutout. Full body.
[Block N]
```

---

# 2 · Four stepping stones

**The mechanic.** Four stones stand in the river, each carrying a word. Step on
the ones that mean the same to build a path across. A wrong stone tips and sinks —
he hops back to the bank dry, the stone says its word and bobs up again. This is
the only one of the four that needs **two** correct answers, which is how it
teaches that a word has many equivalents rather than one partner.

### 2a · Mockup prompt — landscape

```
[Block S]
Landscape, 3:2.

A calm shallow jungle river seen from the near bank, edge-on at water level.

Four large flat-topped stepping stones stand in the water in a loose staggered
line from the near bank to the far bank -- not evenly spaced, not in a straight
row. Each stone breaks the surface with a broad, flat, completely BLANK pale top
face, clearly wide enough to stand on, with a soft ripple ring where it meets the
water.

On the near bank at the left, a small grey cartoon elephant in blue dungarees
stands at the water's edge looking across, about one fifth of the image height.

The water is calm, pale blue-green and shallow -- no rapids, no white water, no
spray, no depth or danger. Simple flat jungle greenery on the far bank. Open sky
above.

[Block N]
```

**What to check.** Do the four stones read as a *choosable path* rather than
scenery? Are the blank tops big enough to carry a word legibly? Does the water
look safe rather than threatening?

### 2b · Production assets

```
[Block S]
A single game PROP isolated on a plain flat mid-grey background for cutout, no
scene, no ground, square 1:1, generous margin.

A broad flat-topped river stone, pale grey-green, seen slightly from the side,
with a completely BLANK smooth flat top face wide enough to stand on.

[Block N]
```

Plus a sinking state, attaching the approved stone:

```
[Block S]
The SAME river stone as the attached image, now TIPPED and half sunk: leaning
steeply to one side with its top face partly under water, a ring of ripples and a
few small splash droplets around it. Same plain flat mid-grey background.
[Block N]
```

---

# 3 · Four cave mouths

**The mechanic.** Four openings in the rock face, a word above each. Walk into
one. Wrong, and it is a shallow dead end — a bat flaps out, he walks back, the
word is spoken. Right, and fireflies come in and light the passage through.

**The calmest of the four.** Nothing moves, nothing is timed, the options are
large and spatially separate, and the choice is a single walk. Put this one
*before* the climb in the trail order as the gentle introduction to four options.

### 3a · Mockup prompt — landscape

```
[Block S]
Landscape, 3:2.

A broad jungle rock face seen straight on, with FOUR separate dark cave openings
along it at roughly the same height -- evenly spaced, clearly distinct from one
another, each a rounded arch tall enough for a small animal to walk into.

Above each opening, a flat pale stone lintel with a completely BLANK front face,
like an empty plaque waiting for a word.

At the bottom, a flat clear strip of packed earth running unbroken from the left
edge to the right edge in front of all four openings, so a character can walk
between them. A small grey cartoon elephant in blue dungarees stands on it near
the left, about one fifth of the image height, looking at the openings.

Warm grey-brown rock, simple flat shading, at most three green tufts. The
openings are dark inside but not black and not frightening.

[Block N]
```

**What to check.** Four openings and four blank lintels, evenly weighted so none
looks like the obvious answer. Is the walking strip genuinely clear? Do the
mouths read as inviting rather than ominous — this is the one to watch, models
drift toward horror-cave.

### 3b · Production assets

Two full plates rather than props, since the openings are painted into the wall:

```
[Block S]
Landscape, 3:2. A BACKGROUND PLATE -- no characters, no creatures.

[same rock face description as 3a, minus the elephant]
All four openings unlit and dark inside.

[Block N]
```

Then, attaching the approved plate:

```
[Block S]
The SAME rock face as the attached image, pixel-for-pixel identical framing, with
ONE change: the SECOND opening from the left is now warmly LIT from within --
a soft golden glow spilling out onto the ground in front of it, and a scatter of
small warm firefly lights drifting around its mouth. Everything else identical.
[Block N]
```

---

# 4 · Shake the tree

**The mechanic.** Four fruits hang on a branch, each carrying a word. Swipe to
shake the tree. The right fruit falls; the wrong ones cling on. The child's input
is not *choosing*, it is *shaking* — the game does the choosing and shows what the
words mean by which fruit lets go. Nearly impossible to fail, which makes it a
**teaching beat** for a new word set rather than a test.

### 4a · Mockup prompt — landscape

```
[Block S]
Landscape, 3:2.

A single broad friendly jungle tree with a thick straight trunk and a wide
rounded canopy, standing in an open clearing, seen edge-on at ground level.

From one long horizontal branch hang FOUR large round fruits, evenly spaced and
clearly separated, each on its own short stem. Each fruit has a flat BLANK
front-facing disc face -- like a smooth round tag -- large and clear enough to
carry a mark. Warm orange and red, simple flat shading.

Below, a broad flat clearing floor of short grass and packed earth, completely
clear and open. A small grey cartoon elephant in blue dungarees stands beneath the
branch, about one fifth of the image height, reaching up toward the trunk as if
about to shake it.

Open sky. At most three plant clusters in the whole image.

[Block N]
```

**What to check.** Are the four fruits separated enough to tap individually? Is
the branch high enough that a falling fruit has somewhere to fall? Does the tree
read as the same Word Tree you will later need in bare and laden states?

### 4b · Production assets

```
[Block S]
A single game PROP isolated on a plain flat mid-grey background for cutout, no
scene, square 1:1, generous margin.

One large round ripe jungle fruit on a short leafy stem, warm orange, seen
straight on, with a smooth flat BLANK circular front face like a round tag.

[Block N]
```

---

## Order I would generate in

1. **Rock wall mockup (1a)** — the biggest open question is whether a vertical
   camera is worth it, and one portrait image answers that.
2. **Cave mouths mockup (3a)** — the cheapest to build if it reads well, since it
   is two plates and no props.
3. **Stepping stones (2a)**, then **shake the tree (4a)**.

Send me any of them and I will composite the real words on in the game's own type,
at the game's own size, so you can judge legibility rather than guess at it.
