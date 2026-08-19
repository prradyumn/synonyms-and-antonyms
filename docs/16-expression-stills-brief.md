# Expression stills — the brief that works

Six complete stopped-pose stills, one per expression. Whole character and bicycle
drawn each time, no compositing, no head layers, no seam.

This supersedes [docs/13](13-expression-frames.md), which asked for head layers and
produced a set that could not be used. What changed is explained below, because the
same mistake is easy to make twice.

---

## Send this to whoever made the cycling loop

Not to a general image model. The cycling loop and the wheelie set both came off a
rig, and it shows: the wheelie set dropped into the game on the first try. What we
need is the same rig, the same stopped pose, six different faces — a re-render, not a
redraw.

---

## Why the last set failed

Both packs were AI art. Only one worked, and the difference was the brief.

| | wheelie set — **worked** | expression set — **did not** |
|---|---|---|
| delivered as | complete frames from a rig | their head composited onto our sprite |
| canvas | shared 660×880, anchor stated | 662×880, but head only |
| alignment | one shared bbox across the whole set | drifted 80–110% in scale, up to 28px in position |
| edges | hard alpha | 12px feather baked into the alpha |
| result | shipped unchanged | unusable |

The head art also **stopped at row 280**, which is the middle of his open mouth. Once
each head was registered to the correct size, the scaling pushed its chin *past* where
the art ended, and there was nothing left to meet the body with. Registration and the
seam were mutually exclusive — there was no compositing that satisfied both.

**None of that can happen to a complete still.** There is nothing to register and
nothing to join.

---

## Also worth knowing: expression is not needed while he rides

Measured on the cycling loop: the head **moves 17px across and 16px vertically** over
the 13 frames — he leans as he pedals. An animated WebP cannot be frame-queried from
JavaScript, so nothing can ever be layered onto that loop in sync. That route is
closed regardless of how the art is made.

It does not matter. Every line in the script that carries an expression is spoken at a
**stop**. The only line delivered while moving is "Today, I am going on a jungle
adventure journey!", and it needs no face. So six static poses covers the whole game.

---

# The brief

## Block C — constants, paste at the top of every prompt

Attach **`docs/ref/jhumru_bike_ref.png`** (the exact frame, 2× on mid-grey) and
**`docs/ref/jhumru_bike_head_ref.png`** (the head at 3×) every single time.

```
Match the attached reference images EXACTLY. The same chubby grey cartoon elephant: a
spiky blue-and-white tuft of HAIR on top of his head (not a cap, not a helmet), ORANGE
outer ears with pale pink inners, a trunk with a MAROON tip, blue dungarees with yellow
buckles over a white short-sleeved T-shirt, a small blue collar at the throat, a short
tail with an orange tuft. He sits on the same small RED-ORANGE bicycle with silver
spoked wheels. Same character, same bike, not a redesign.

He is STOPPED: sitting upright on the stationary bicycle, both feet on the pedals, both
hands on the handlebars. Body side-on facing RIGHT, head turned three-quarters toward
the viewer so both eyes read. Exactly the pose in the reference.

CANVAS -- identical in every still in this set:
- 660 x 880, transparent PNG, real alpha.
- The bicycle's REAR WHEEL touches the ground at x = 191, y = 879 -- 29% across and
  the very bottom edge -- in EVERY still.
- The bicycle and the body are the SAME SIZE and in the SAME PLACE in every still.
  Only the face, ears and trunk change.
- Hard alpha edges. NO feathering, NO soft fade at any edge, NO drop shadow.

Flat 2D cartoon rendering: thin dark outline, soft cel shading, poster-clean. No film
grain, no texture, no 3D look, no photographic realism.

Do NOT include: any background scene, any ground line, any motion lines or speed
streaks, any text, any speech bubble, any emoji, any symbol floating in the air, any
second character, any change to his clothing, the bicycle, or his colours.
```

> **The floating-symbol ban is load-bearing.** Ask a model for *thinking* or *confused*
> and it will reach for a thought bubble or a question mark above the head every time.
> Those cannot ship: the game draws its own bubbles, and a baked-in `?` would appear in
> every scene that reuses the frame.

## The six

| file | expression | the line it plays under |
|---|---|---|
| `still_neutral` | happy, mouth open, trunk up | "Hello, everyone! Have you seen my new bicycle?" |
| `still_proud` | showing off | "Tring! Tring! Look at it! It is shiny!" |
| `still_think` | wondering | "I wonder what we will find along the way!" |
| `still_wow` | surprised | "Oh! The jungle path looks full of surprises." |
| `still_ask` | hopeful, inviting | "Will you come on this adventure with me?" |
| `still_cheer` | delighted | "Wonderful! Let us go!" |

`still_neutral` is the pose we already have — include it anyway, re-rendered from the
same rig in the same pass, so all six are siblings rather than five siblings and one
cousin.

```
[Block C]

SIX stills of the same character in the same stopped pose, as six separate images.
Only the face, ears and trunk differ between them. The body, clothing, arms, hands,
legs and bicycle are identical in all six.

1  NEUTRAL   -- open friendly smile, trunk raised and curled up to the right.
              This is the reference pose exactly.

2  PROUD     -- chin lifted, chest out, eyes bright and half-closed in a pleased way,
              brows raised. A big closed-lipped smug grin, one corner higher. The
              trunk curls up and over in a tall confident flourish. A small child
              proud of a new toy: warm and funny, not arrogant.

3  THINKING  -- eyes looking UP and to his left, away from the viewer, pupils rolled
              upward. One brow raised higher than the other. Mouth a small closed
              line, pursed slightly to one side. The trunk curls up and tucks its tip
              under his chin, the way a person rests a hand on their chin. Curious and
              pleasant, not worried.

4  SURPRISED -- eyes wide and fully round, whites showing all around, brows as high as
              they go. Mouth open in a small round "oh". Ears lifted and spread. The
              trunk shoots straight UP in a startled curve. Wide-eyed wonder, NOT fear:
              no sweat drops, no shaking.

5  ASKING    -- head tilted slightly toward the viewer and turned a little further
              forward, so he is nearly looking at us. Brows raised in a soft hopeful
              arch, eyes big and warm and looking straight AT the viewer. A gentle
              closed-lip smile. The trunk reaches forward toward the viewer, tip curled
              up in a small welcoming beckon.

6  DELIGHTED -- eyes squeezed shut into happy upward arcs. Mouth wide open in an open
              laugh showing the tongue and the single white tooth. Ears lifted. The
              trunk thrown UP and back in a big joyful trumpet.
```

---

## What to check before sending

The first four are the ones that decide whether the set is usable.

- [ ] **Rear wheel at (191, 879) in all six.** Open them as layers and flick between
      them — the bicycle must not move by a single pixel.
- [ ] **The bicycle and body are identical in all six.** Only the head changes. Flick
      again and watch the pedals and the wheels.
- [ ] **Hard alpha edges.** No feather, no soft fade. This is what broke the last set.
- [ ] **Complete characters** — not heads, not head layers, not anything composited
      onto a supplied body.
- [ ] Ears still **orange**, not red. The single most likely drift, and the one that
      makes a face look pasted on.
- [ ] Trunk tip still maroon; hair still a blue-and-white spiky tuft.
- [ ] Nothing floating in the air: no `?`, no thought bubble, no sparkles, no text.
- [ ] Read each at **thumbnail size, about 25mm tall**. He renders 322 units tall,
      which is roughly 248px on a desktop frame and a face about 55px wide. If you
      cannot tell *thinking* from *surprised* at that size, the expression is too
      subtle — brows and eyes have to carry it, because nothing finer survives.

---

## What I do when they arrive

- crop all six to **one shared bbox**, the same mechanism as `build_wheelie()` — that
  is what guarantees the set stays aligned, and it is why the wheelie sprites never
  drifted
- verify the anchor off the alpha rather than trusting the brief, and print the
  measured `hu / ar / ax` for `RIDER`
- add a sprite cross-fade back to `mkActor` — the 220ms dissolve currently lives in
  `portrait()`; a change of face on a motionless character is a pop otherwise
- **regenerate the dialogue portraits from these stills**, so one set of art feeds both
  the character and the face beside the text, and the old pack in
  `assets/chars/expressions/` can be retired entirely
- keep `HOOK`'s `face:` keys exactly as they are — they already name all six, so
  nothing in the script needs touching

## What this costs

Six stills at roughly 31KB each is about **190KB**. The shipped game is currently
3.60MB, so this is a 5% increase for the character actually acting. Retiring the old
expression pack removes 79KB of portraits that would be rebuilt from the new art
anyway, so the net is closer to 110KB.

---

## If the animator is not available

Fall back to the headless-body route: I cut the headless body out of the sprite we
already own and hand *that* over as the canvas, so the artist draws a head that fits
our neck instead of compositing onto our art. It removes the drift class, but it
reintroduces the seam, and it needs the neck drawn down to row 400 of 880 rather than
stopping at 280. The tuft registration in `build-assets.py` is already written and
proven to 99.6–101% scale and 0.5px placement, so the machinery exists — but a
complete still needs none of it, which is why it is the better ask.
