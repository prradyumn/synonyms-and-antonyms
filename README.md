# Word Tree

A synonym game for Grade 1–2 English learners. Three jungle friends — **Monty** the monkey, **Jhumru** the elephant and **Tez** the tortoise — travel six locations. At each one, a friend says a word the others don't understand, and the player carries a different word that means the same thing across to them.

**The hook:** Jhumru cycles out onto the rope bridge, it gives way under him, and he scrambles back to his friends. Now nobody can cross — and nobody can agree on the word for what just happened.

Early prototype. Placeholder art in places, no build step, no dependencies.

---

## Run it

Double-click `index.html`. That's it — no server, no npm install.

Better, if you have VS Code: install the **Live Server** extension, right-click `index.html`, "Open with Live Server". You get auto-reload on save, and speech synthesis behaves more reliably over `http://` than `file://`.

Or from a terminal:

```bash
npx serve .
```

---

## Folder map

```
index.html                 markup + script load order
src/css/style.css          all styles, including the keyframe animations
src/js/levels.js           ← EDIT HERE for word pairs and story lines
src/js/engine.js           DOM refs, timers, speech, tones, helpers
src/js/sprites.js          runtime SVG: signpost, vine, word tags, sparkles
src/js/scenes.js           the scenes: hook, intro, map, level, ending
src/js/main.js             boot

assets/bg/                 9 backgrounds, 1920×1080 WebP, game-ready
assets/chars/              3 characters, alpha-cut WebP (stills)
                           *_idle.webp, jhumru_cycle.webp — animated loops,
                           cropped from the raw GIFs by tools/build-assets.py
assets/source/             original full-resolution PNGs — keep these

docs/01-game-mechanics-research.md    competitor teardown + pedagogy
docs/02-animation-sprite-spec.md      sprite sheets to produce next
docs/03-art-prompt-pack.md            GPT Image 2 prompts for new locations
docs/04-seesaw-flow-reference.html    the antonym game flow, for later
docs/05-story-spine.md                premise + how synonyms and antonyms share one plot
docs/06-scrolling-opening-art.md         prompts for the scrolling opening backgrounds
docs/07-mechanic-ideas.md              six alternatives to the three-tile MCQ
docs/08-four-option-mechanics.md        getting to four options without four times the load
docs/09-mechanic-visual-prompts.md      prompts to SEE the four-option mechanics before building
docs/10-immersive-scene-playbook.md      REUSABLE — ideation + parallax/bg prompt packages for any game
docs/11-wheelie-sprites.md              wheelie-over-a-ramp: sprites to commission, and what to derive
docs/12-level-content-parked.md         the word bank, kept while the level mechanic is redesigned

prototypes/v1-tap-to-answer.html      earlier version, tap only
prototypes/v2-carry-the-word.html     same as src/, single-file, base64
```

The two files in `prototypes/` are self-contained snapshots for sharing with people who won't clone a repo. `src/` is the version to develop.

---

## Screen size and units

The game is authored in a **1920×1080** design space and scales to fit the
viewport, capped by width *and* height so the whole 16:9 frame always stays on
screen. On a display tall enough it renders at exactly 1920×1080.

Nothing inside `#frame` may use raw `px`, or it will not scale with the rest:

| | write | not |
|---|---|---|
| CSS | `height:calc(332 * var(--u))` | `height:332px` |
| JS | `U(367)+'px'` | `'367px'` |

`--u` is declared on `#frame` as `calc(100cqw / 1920)`, so one unit is 1/1920 of
the frame's real width. `U(n)` in `engine.js` is the same conversion for JS.
Percentages and `%`-based transforms already scale and need no wrapper.

One exception: `#frame` cannot resolve its own `cqw`, so the `shake` keyframes
used on it are expressed as percentages of its own box.

Verified scale-invariant: every element occupies an identical fraction of the
frame at 1920 and at 1076 wide.

---

## Character animation

`chip()` prefers `IDLE[kind]` over the still, so anyone just standing there
breathes — on the opening, in all six levels, and on the ending.

| | idle loop | note |
|---|---|---|
| Monty | `monty_idle.webp` | 36 frames, 2160ms |
| Jhumru | `jhumru_idle.webp` | 36 frames, 2160ms |
| Tez | **none drawn yet** | falls back to `tez.webp`, stands still |

Drawing Tez a breathing loop is the obvious next art task — he is currently the
only one holding a pose. `talking jhumru.gif` is also on disk and builds fine,
but wiring a talk state for Jhumru alone would read as a bug rather than a
feature, so it is left out until Monty and Tez have one too.

The loops are **animated WebP**, not GIF: roughly a third of the bytes and full
8-bit alpha, where GIF gives 1-bit and visibly hard cut edges. Beware that
Pillow's WebP *reader* reports `duration=0` for these even when the file is
correct — `anmf_durations()` in the build script parses the real values, and the
build prints them.

---

## The opening — a moving parallax journey

`hook()` in `src/js/scenes.js`. Jhumru rides in, the camera travels with him
across a simple bridge, and he arrives at a clearing where Monty and Tez are
waiting. Nothing breaks. **Tap anywhere to skip.**

| beat | what happens |
|---|---|
| bank | he rides in and introduces himself, and rings the bell |
| leg A | the camera travels; he rides the ramp up onto the bridge |
| bridge | he stops midspan; the trail map pops up |
| leg B | he rides on over the take-off ramp |
| clearing | he stops and turns to the player — the opening waits for a Yes |

**Jhumru is the only character.** Monty and Tez are out of the game, along with
their sprites, the walk cycle and the footstep sound.

**Pacing is one knob.** `PACE` in `scenes.js` multiplies every base timing —
ride-in, camera travel, how long each line stays, how long the map holds — so
they stay in proportion. At `1.45` the question lands around 31s.

The entry has its own base (`RIDE_IN`) and its own easing. `easeRide` is gentler
than `easeOut`: cubic braked hard at the end, which read as him *stopping* rather
than *arriving*. He now holds a steady pedalling speed and only settles at the
last moment.

**His path follows the ramp as placed, not as assumed.** Height comes from the
ramp's measured surface profile, and because the climb ramp is bedded — base 2px
below the bank, crest 6px below the deck — those two gaps are blended across
rather than clamped, so there is no hitch stepping on or off it. Verified
continuous: zero height jumps above 0.35% of frame across the whole leg.

~17s end to end, skippable by tapping. The pauses size themselves off `HOOK` in
`levels.js` — one entry per stop, so adding or cutting a line needs no code change.

### The rig

`pxBuild(cam)` builds five divs out of seven WebP layers. The **act layer** is the
plane the camera and the rider share, so its rate is exactly `1.0`: layers slower
than 1 fall behind him, faster than 1 sweep past in front.

| layer | rate | notes |
|---|---|---|
| `far_sky` | 0.20 | opaque, repeats |
| `mid_canopy` | 0.50 | repeats |
| `act_bank` · `act_bridge` · `act_clearing` | **1.00** | one div, 3 frames wide, no repeat |
| — characters ride here — | | |
| `near_leaves` (top) · `near_grass` (bottom) | 1.40 | repeat, drawn **in front** of the rider |

`near_grass` passing in front of his wheels is what finally grounds him — it is the
occlusion cue the old flat plate could not provide.

Monty and Tez are mounted **inside** the act layer via `chip(k, pos, rig.act)`, so
they scroll in with the world instead of being pinned to the frame. Their
segment-3 positions are chosen so they land at 42% and 53% when the camera stops.

`intro()` calls `pxBuild(camMax())` — the same rig, parked — so the handoff is a
continuation rather than a cut. `map()` and the levels use plain `setbg()`, and
`clean()` sweeps `.pxb, .pxf` on the way out.

### Character scale and motion

The parallax art is a wider, more open scale than the original plates, so
characters sit smaller in frame — `.ch.px` in the stylesheet, measured against the
bridge planks rather than guessed. Jhumru is then **1.5x that** again (`322` for
the rider, `.ch.px.ele` for standing), because an elephant beside a monkey was
reading as barely larger. He is now **1.74x** Monty's height; for 1.5x the monkey
instead, the rider constant is `278`.

Growing a character never moves it: chips are bottom-anchored and `place()` anchors
on the ground line, not the top of the sprite.

`.cyc .dash` draws three speed streaks, and `actor.riding(bool)` switches both the
streaks and the wheel loop together — they both mean "the wheels are turning".

### Sound

**The raw downloads are unusably quiet** — the forest ambience measured RMS
**-51 dBFS**, which at any sane element volume is silent. `HTMLAudioElement.volume`
cannot exceed 1.0, so the gain is baked in by `build_audio()` in
`tools/build-assets.py` (needs ffmpeg on PATH) rather than worked around at
runtime. Measured after: ambience -23.9, bike -13.6, step -22.7 dBFS. Raw files are
kept in `assets/source/audio_raw/`.

Three CC0 files in `assets/audio/`, provenance recorded in `CREDITS.txt`:
jungle ambience, a bicycle-wheel loop and a footstep. All Public Domain, no
attribution obligation — the CC-BY jungle tracks on OpenGameArt were rejected for
carrying one.

Browsers refuse audio before a user gesture — and Brave in particular blocks it
hard — so the HUD speaker button **starts in the not-live state and only clears
once `bgm` actually reports playing**. Its first tap turns sound ON rather than
muting, so a blocked browser can never leave the game silent behind an icon that
claims otherwise. Because the opening *starts* before any gesture,
`audioStart()` re-asserts whatever is already happening rather than waiting for the
next state change. Mute is the speaker button in the HUD.

Footsteps fire on a `every()` interval — GEN-guarded, so they stop with the scene
rather than ticking on into the next one.

### Leaving the browser pauses everything

Every delay runs off **one virtual clock** (`VT` in `engine.js`), advanced by rAF
rather than `setTimeout`. `later`, `every` and `tween` all read it, so they cannot
drift apart from each other or from the camera — and switching tabs freezes the
whole story instead of letting it run on invisibly and reappear several beats
later. The per-frame delta is clamped, so a long stall cannot jump the timeline
either. `setPaused()` stops audio and speech with it.

### Two things to be careful of

**The camera is rAF-driven, not WAAPI.** `ride()` computes the camera position
from wall-clock each frame and positions the layers *and* the actors from that one
value, so they cannot drift out of register. It also derives progress from
`performance.now()` rather than accumulating, so a backgrounded tab catches up
correctly instead of desynchronising from the `later()` beats.

**`GROUND1` is the top of the ochre PATH in `act_bank`, not the topmost opaque
row.** Measuring opacity finds the bushes standing *behind* the path and leaves the
rider floating ~32px above the ground — which is exactly what went wrong first
time. Re-measure by colour if the plates are repainted.

**The three surfaces sit at different heights** — bank ~73.5%, bridge deck 65.6%,
clearing ~79.5% — so he rides up onto the bridge and down off it. The deck itself
is dead level (measured: 2px of variation across its whole span), which is why
nothing has to curve while he is on it. Re-measure `YTRACK` if the segments are
repainted.

### Asset repairs baked into the build

`build_parallax()` in `tools/build-assets.py`, from `assets/source/px_*.png`:

- **The tileable layers did not tile as delivered** — wrap-edge differences of
  5.6 / 23.6 / 20.7 against normal adjacent-column steps of 0.44 / 1.47 / 2.15.
  `mirror_x()` emits `[A|flip(A)]`, which makes both the join and the wrap exact
  by construction.
- **`near_leaves` uses `roll_x()` instead.** Mirroring is invisible on uniform
  foliage but makes a distinct shape read as symmetrical, and the top cluster was
  obviously so. Its content sits hard against both edges with an empty middle, so
  rolling half a width moves it to the centre and leaves both edges transparent —
  which tiles for free.
- **`px_near_fringe` is a vignette, not a bottom strip** (grass along the bottom
  *and* hanging leaves in the top corners, gap between). It is split at the empty
  band into `near_leaves` and `near_grass` so each sits at the edge it belongs to.

### Still needed from the art

Neither blocks the opening, but both are one edit of `act_clearing`:

1. **No central Word Tree.** The brief asked for one large tree, centred, as the
   focal point. The clearing is framed by edge trees with nothing in the middle —
   and it is the title object, which later needs bare and laden states.
2. **No horizontal branch at ~60% height.** `vineSVG()` and the hanging word-tags
   were meant to hang from it. Right now the vine floats across open sky and
   crosses the characters at chest height.

---

## Scope right now

**Finalised:** the title tap, the whole opening — bank → ramp + wheelie onto the
bridge → the trail map → ramp + wheelie off it → the clearing, Monty walking in,
the "Will you come?" choice — and the resting shot of the three friends.

**Everything past that has been removed.** The map screen, the six locations, the
three-tile level mechanic, the ending and the gates prototype were all built
against a mechanic `docs/07` and `docs/08` replace, so they are gone from `src/`
rather than left rotting.

- **The word content is not lost.** It sits verbatim in
  `docs/12-level-content-parked.md`, with the reasoning in `docs/05`.
- **The location plates are not lost.** They are still in `assets/source/`, and
  `tools/build-assets.py` still lists them, so one run brings all eight back into
  `assets/bg/`.

Levels return with a new mechanic — see `docs/08` for the four-option options and
`docs/09` for prompts to mock them up before building.

---

## Dev tool: the layout editor

**Press E on any screen.** The game freezes mid-animation and every visible
element can be dragged to move, stretched by its handles, nudged with the arrow
keys and exported. `src/js/editor.js` — temporary; delete the file and its
`<script>` tag to remove it.

Every number it reports is in **1920x1080 design units**, so an exported
`left: 913` pastes straight back as `calc(913 * var(--u))`. Percentages come out
too (including `feetY`, the ground line a character stands on) because so much of
this game is positioned in %.

Three things made it fit this game rather than the reference implementation:

- **CSS px are not design units here.** The reference assumes a stage under
  `transform: scale(k)`, where they coincide. `#frame` has no such transform, so
  1 unit is `scale()` CSS pixels and unit values must be multiplied on the way
  into a style property. Writing them raw moves everything by `1/scale` and
  compounds on every nudge.
- **Actors are positioned purely by `transform: translate()`**, so `normalise()`
  clears transform along with right/bottom/margin/inset — after pinning the
  element to the box it already occupies, so nothing jumps.
- **Freeze is exact, not approximate.** Every delay runs off one virtual clock
  (`VT`), so `setPaused(true)` stops the story, camera, audio and speech together.
  The editor drives it through `window.__gameFreeze`.

### Moving a ramp with it

Drag the ramp, then export: each ramp carries a `code` block giving the
`RAMP_*_TIP` and `RAMP_*_RISE` that reproduce where you put it. Paste those two
numbers into `scenes.js` and the rider's path follows automatically, because the
height comes from the ramp's measured surface rather than a separate track.

**Export before the scene restarts.** The ramps are rebuilt every time `hook()`
runs and the editor's edits are inline styles on the old elements, so replaying
the opening discards them. If an export comes back with `"edited": false` on the
ramp, the edit was lost that way — the geometry will match the code exactly,
which is the tell.

It also doubles as a measuring tool: the export cross-checks the constants in
`scenes.js` — the ramp reads `feetY 65.31%` against `DECK=65.3`, and a standing
character `86.02%` against `GROUND3=86`.

---

## Notes

- Landscape 16:9 to match the background art. If you need portrait, the backgrounds must be repainted, not cropped.
- `assets/bg/` and `assets/chars/` are entirely derived. Change `W, H` or `CHAR_H` or `LOOPS` in `tools/build-assets.py` and re-run rather than editing them by hand.
- No build step on purpose. Plain scripts in load order, no modules, so `file://` works.
- Load order in `index.html` matters: `levels → engine → sprites → scenes → main`.
- `assets/chars/*.gif` with spaces in the name are raw 1920×1080 exports, not game assets. `tools/build-assets.py` crops them; only the cropped output is loaded.
- `assets/source/` holds the full-resolution originals. Don't delete them — everything in `assets/bg/` and `assets/chars/` is derived and regenerable, those aren't.
