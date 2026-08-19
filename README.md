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
src/js/fx.js               after-state effects (glow, fruit, water)
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
| bank | he rides in and introduces himself |
| leg A | the camera travels; he rides up onto the bridge |
| bridge | he stops **alone** midspan and says what he is doing |
| leg B | he rides on; the camera travels to the clearing |
| clearing | he settles, then **Monty walks in from the right** to meet him |

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

## How a level works

Everything lives in one array in `src/js/levels.js`:

```js
{
  bg: 'bridge_broken',      // key into the A asset map
  after: 'bridge_fixed',    // second plate to crossfade to, or null
  fx: null,                 // 'glow' | 'fruit' | 'water' | 'cheer' | null
  say: 'mon',               // who says the word
  hear: 'ele',              // who doesn't understand
  w: 'broken',              // the word on the signpost
  syn: 'smashed',           // correct answer
  ant: 'fixed',             // wrong: opposite meaning
  un: 'noisy',              // wrong: unrelated
  ok:   '...',              // spoken on success
  antL: '...',              // spoken when the antonym is chosen
  unL:  '...'               // spoken when the unrelated word is chosen
}
```

Every round offers exactly one synonym, one antonym and one unrelated word, shuffled. That is the whole item design, and it makes each attempt diagnostic — **which** wrong answer a child reaches for says more than whether they were right.

**To add a level:** append an object to `L`, add its background to `assets/bg/` and register the path in the `A` map at the top of the same file. Then add a seventh entry to `POCK` in `src/js/scenes.js` for the map pin position (percentages of frame width and height).

---

## Interaction

Pull a word tag off the vine and drag it to the friend on the right. Release past 58% of the frame width and it flies.

- **Synonym** → arcs across, lands, ring pulses, sparkles, scene transforms
- **Antonym** → travels most of the way, then gets handed back
- **Unrelated** → tumbles out of frame, and a fresh tag grows back on the vine

**Tap also works.** A press-and-release under 14px of movement resolves as a tap. Keep this. Drag is error-prone for six-year-olds, so it's the reward for children who can manage it, never a barrier.

Nothing is ever lost on a wrong answer. No red cross, no lives, no timer, no score. This is deliberate — see `docs/01`.

---

## What's placeholder

| Thing | State |
|---|---|
| Background resolution | Sources are only **1672×941**, so 1920 output is a ~15% upscale. `bg_river_deep` is a 1086×1448 portrait and fares worst. Re-export the sources at 1920+ to recover real detail |
| `bridge_broken` → `bridge_fixed` | Real painted pair ✅ |
| `river_deep` → `river_shallow` | Near-pair, deep is centre-cropped from a portrait plate |
| Cave lit / tree laden / falls flowing | **CSS overlays in `fx.js`** — need real second plates |
| Rock wall resolved | **No transformation at all.** Currently just a cheer. Weakest level |
| Characters | Monty and Jhumru breathe everywhere. **Tez has no idle loop** and stands still. No talk/understand/confused states yet |
| Voice | Browser speech synthesis, standing in for recorded Indian-English VO |
| Signpost, vine, tags | Runtime SVG. Fine to keep — cheap and scales cleanly |

---

## Next steps, in order

1. **Character animation.** `idle` is done for Monty and Jhumru. Still needed: **an idle loop for Tez**, then `talk`, `understand` and `confused` for all three — read `docs/02`. The code already fires those moments; they just render as stills. To add one, drop the raw GIF in `assets/chars/`, add a line to `LOOPS` in `tools/build-assets.py`, run it, and reference the output. Recommendation in the doc is skeletal (Rive) over sprite sheets for characters, sprite sheets for effects.
2. **The three missing after-plates.** `docs/03` has ready-to-paste prompts. Cave lit, tree laden, falls flowing.
3. **A real transformation for the rock wall**, or swap that location out.
4. **Record the VO.** Human, Indian English, not TTS. When the word being taught is the word being mispronounced, the cost is higher than usual.
5. **Playtest with 6–8 children** before any of the above gets expensive. Watch specifically whether the two wrong-answer animations read as *information* or as *failure* — the whole no-fail design rests on that.

---

## Notes

- Landscape 16:9 to match the background art. If you need portrait, the backgrounds must be repainted, not cropped.
- `assets/bg/` and `assets/chars/` are entirely derived. Change `W, H` or `CHAR_H` or `LOOPS` in `tools/build-assets.py` and re-run rather than editing them by hand.
- No build step on purpose. Plain scripts in load order, no modules, so `file://` works.
- Load order in `index.html` matters: `levels → engine → sprites → fx → scenes → main`.
- `assets/chars/*.gif` with spaces in the name are raw 1920×1080 exports, not game assets. `tools/build-assets.py` crops them; only the cropped output is loaded.
- `assets/source/` holds the full-resolution originals. Don't delete them — everything in `assets/bg/` and `assets/chars/` is derived and regenerable, those aren't.
