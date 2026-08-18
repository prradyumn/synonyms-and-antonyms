# Animation spec — Monty, Jhumru, Tez
### Sprite sheets to produce, in build order

---

## Read this first: the budget problem

If you sprite-sheet everything, here is what you are signing up for:

| | Frames | Est. size |
|---|---|---|
| Characters, all states, ×3 | ~200 | **1.6–2.2 MB** |
| Effects | ~75 | ~300 KB |
| Environment loops | ~20 | ~250 KB |
| **Total** | **~295** | **~2.5 MB** |

That is too heavy for a low-end Android webview, and it is before any backgrounds.

**Recommendation: split the pipeline.**

- **Characters → skeletal animation** (Rive or spine-style). Every state for all three characters lands around **80–200 KB total**, because you ship one drawing per character plus motion data instead of 200 baked frames. It also lets you blend between states, which sprite sheets cannot do, and lets you scale Jhumru without redrawing him.
- **Effects → sprite sheets.** Hand-drawn sparks, splashes and dust read far better as frames than as rigged shapes, and they are small.

If you have to go all-sprite for pipeline reasons, everything below still applies — just build Tier 1 only and hold Tier 3 until you have measured load time on a real device.

---

## The reuse trick — read before you quote the animator

Six levels look like six unique actions. They are not. They collapse into **three verbs**:

| Level | Looks like | Actually is |
|---|---|---|
| Rope bridge | Jhumru hammers planks | **heave** |
| River | Monty leaps the stones | **jump** |
| Rock wall | Monty climbs | **climb** |
| Cave | Tez calls the fireflies | **call** |
| Word Tree | Monty shakes the branches | **heave** (reused) |
| Waterfall | All three push together | **heave** (reused, ×3 characters) |

So you need `heave` for Monty and Jhumru, `climb` and `jump` for Monty, `call` for Tez. **Four action animations, not six.** Add Tez's `heave` only for the finale where all three push.

---

## Tier 1 — the game does not work without these

Every character needs all four. **12 sheets.**

| Animation | Frames | Loop | What must be in it |
|---|---|---|---|
| `idle` | 12 | loop | Breathe, one blink, character-specific tic: Monty's tail curls, Jhumru's trunk sways, Tez shifts on the board |
| `talk` | 6 | loop | Mouth and head bob only. Body stays on the idle pose so it can cut in and out cleanly |
| `understand` | 10 | one-shot | Eyes widen, small hop, arms up, settle back to idle pose on the last frame |
| `confused` | 8 | one-shot | Head tilt, shrug, hold. Must read as *puzzled, not sad* — this plays on wrong answers and must never feel like a telling-off |

**The last frame of every one-shot must match frame 1 of `idle` exactly.** Otherwise the character snaps when the animation ends. This is the single most common handover mistake.

---

## Tier 2 — makes it feel alive

**6 sheets.**

| Animation | Who | Frames | Loop |
|---|---|---|---|
| `receive` | all 3 | 6 | one-shot — reach out, catch the word tag, hug it |
| `walk` | all 3 | 8 | loop — for map travel between locations |

Tez walks on the skateboard: no leg cycle, just a push-off every fourth frame and a lean. Cheaper than the other two.

---

## Tier 3 — the four action verbs

**5 sheets.**

| Animation | Who | Frames | Notes |
|---|---|---|---|
| `heave` | Jhumru, Monty | 12 | Wind-up, strain, release, recover. The strain frames want a 2-frame hold |
| `heave` | Tez | 12 | Finale only. Build last |
| `climb` | Monty | 10 | Loop, two-hand cycle |
| `jump` | Monty | 10 | One-shot: crouch, launch, air, land, squash |
| `call` | Tez | 8 | Hands to mouth, shout, hold |

---

## Effects sheets — keep these as sprites

**9 sheets, 256×256 cells.** These are cheap and they carry most of the game's feel.

| Sheet | Frames | Loop | Used for |
|---|---|---|---|
| `fx_sparkle` | 10 | one-shot | Correct answer burst |
| `fx_ring` | 8 | one-shot | Word tag landing |
| `fx_dust` | 8 | one-shot | Landings, rocks shifting, Jhumru's footfalls |
| `fx_splash` | 10 | one-shot | River |
| `fx_water` | 8 | **loop** | The waterfall returning |
| `fx_firefly` | 6 | **loop** | Cave. One firefly, instanced many times with random delays |
| `fx_leaffall` | 12 | one-shot | Wrong-answer tag tumbling |
| `fx_fruitpop` | 6 | one-shot | Word Tree filling |
| `fx_question` | 6 | one-shot | The `?` over a confused listener |

---

## Technical specs

| Setting | Value | Why |
|---|---|---|
| Frame rate | **12 fps** | Right for this cartoon style. 24 doubles your cost for no visible gain; 8 reads as choppy |
| Character cell | **360 × 440 px** | Character displays at ~152 px tall, so this covers 2× density plus headroom for arms-up and squash |
| Effects cell | **256 × 256 px** | |
| Grid | **6 columns max**, rows as needed | A 12-frame animation becomes a 2160 × 880 sheet. Single long strips break texture limits on old devices |
| Source format | PNG-24 with alpha | |
| Ship format | **WebP with alpha, quality 85** | Roughly 40% smaller than PNG at this style |
| Padding | 2 px transparent gutter between cells | Stops neighbouring frames bleeding in when scaled |
| Pivot | **Bottom-centre, identical in every cell** | Non-negotiable. If the pivot drifts, characters slide around when animations change |

**One cell size for all three characters.** Jhumru is wider than Tez, but a shared cell means the code treats them identically and you can swap characters between levels without touching layout.

---

## Naming

```
monty_idle_12.webp
monty_talk_06.webp
monty_understand_10.webp
monty_confused_08.webp
monty_heave_12.webp
jhumru_idle_12.webp
tez_walk_08.webp
fx_sparkle_10.webp
```

`{character}_{state}_{framecount}.webp` — frame count in the filename means the code can derive the grid without a JSON file during prototyping.

For ship, pack everything into one atlas plus a JSON map (free-tex-packer or TexturePacker, both export the standard JSON hash format).

---

## Delivery checklist for the animator

- [ ] Last frame of each one-shot matches frame 1 of `idle` for that character
- [ ] Pivot is bottom-centre and does not move between cells — flip through the sheet, the feet should stay planted
- [ ] `confused` reads as puzzled, not scolded. Show it to someone with no context and ask what the character feels
- [ ] `talk` works cut in and out at any frame
- [ ] Silhouette test: fill every frame solid black at 80 px tall. Each character must still be identifiable, and each pose must still read
- [ ] No frame extends outside its cell
- [ ] `fx_water` and `fx_firefly` loop seamlessly — last frame flows into first
- [ ] Every sheet exported at both 1× and 2×

---

## Build order

1. **`idle` for all three.** Nothing else can be reviewed until characters stand there breathing.
2. **`talk` + `understand` + `confused` for all three.** At this point the full six-level loop is animated end to end.
3. **`fx_sparkle`, `fx_ring`, `fx_question`.** The feedback moments.
4. **`receive` + `walk`.** Carrying and travelling.
5. **The four action verbs.** Level-specific payoffs.
6. **Remaining effects.** Water and fireflies last — the CSS versions in the current prototype hold up until then.

Stop after step 3 and put it in front of children. Steps 4–6 are polish; steps 1–3 are the game.

---

## How this plugs into the current build

The prototype already has the state machine calling the right moments — it just has still images where animations go. Swapping in sheets means replacing each `<img>` with a `<div>` carrying a background sprite and a CSS `steps()` animation:

```css
.sprite { width:180px; height:220px; background-repeat:no-repeat; background-size:600% 200%; }
.monty-idle { background-image:url(monty_idle_12.webp); animation:strip12 1s steps(12) infinite; }
@keyframes strip12 { to { background-position:-1200% 0; } }
```

Simple loops need no JavaScript at all. One-shots use `animation-fill-mode:forwards` plus an `animationend` listener to fall back to `idle`. The five hook moments the code already fires — `talk`, `understand`, `confused`, `receive`, `act` — are the five states to wire first.
