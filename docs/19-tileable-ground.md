# Tileable ground — the pattern for every new location

Press **T** in a dev build to see it running. Reference implementation: `tiled()` in
[src/js/scenes.js](../src/js/scenes.js).

This replaces "three 1920 act plates per location" for all new scenes. The three
shipped scenes (hook, gorge, river) are untouched and stay on plates.

---

## Why, in numbers

Every join problem this project has had was on the action plane. **Not one was ever on
a tileable layer.** Measured with the playbook's own §4.1 test:

| | difference at the join / wrap |
|---|---|
| 8 tileable layers, across 4 scenes | 0.00, 0.50, 0.70, 1.09, 1.19, 1.28, 1.30, 9.38 |
| 6 act-plane butt joins | 13.3, 25.2, 27.8, 28.0, 45.2, **78.0** |
| `ground_path` (this asset) | **1.11**, against an interior of 0.71 |

Tileable layers average about **0.9**. Act-plane joins average about **36** — forty
times worse, every single time. And the cost of fighting them is on the record:
`laps:[240,200]`, the join trunks, the `nojoin` flag, `taper_shore()` and its three
failed predecessors, and finally the muddy path, which was cut from three plates to two
to one and then removed because the joins could not be made to flow.

## The insight

The action plane welds two different things into one image:

- **terrain** — path, ground, surface. Repetitive by nature; could tile forever.
- **features** — a gap at 47.9% of the world, three logs, a mud patch, a stone.
  Unique, and each belongs at a specific place.

Because they share one image, the image must be unique. Unique images must be cut into
plates. Plates must meet. **Split them and there is nothing left to join.**

```
                 rate    what it is                     joins?
far_sky          0.20    tileable                       none, ever
mid_canopy       0.50    tileable                       none, ever
ground_path      1.00    tileable          <-- NEW      none, ever
props            1.00    placed by world fraction       n/a, they are objects
near_grass       1.40    tileable                       none, ever
near_leaves      1.40    tileable                       none, ever
```

## What it retires

For any scene built this way:

| plates forced this | tileable ground gives |
|---|---|
| `GORGE.prof` — **103 hand-measured samples** in 5 arrays | one declared number |
| `ride_top()` / `band_top()` hunting the ground by colour | nothing to detect. It found a rope handrail once, then a tree canopy, and left the rider floating 83px |
| `taper_shore()`, `laps`, join trunks, `nojoin` | unnecessary |
| a new 1920 plate to lengthen the world | one more entry in `segs` |
| 3 × ~100 KB plates per location | one 83 KB strip |

The rider's ground height in `tiled()` is a **declared** 76.0%, and he measures 77.6% on
screen — 76.0 plus the 5% tyre bedding, exactly as stated. Nothing was measured off art
to get there.

## How a scene uses it

```js
const rig = pxBuild(0, {
  segs: ['', '', ''],      // EMPTY. They exist only to give the camera two frames of
  nojoin: 1,               // travel and the props a coordinate space. No art.
  mids: [{key: 'ground', rate: 1.00, z: 2, strip: 400, edge: 'bottom'}],
  back:  [['far_sky', 0.20], ['mid_canopy', 0.50]],
  front: [['near_leaves', 1.40, 'top', 169], ['near_grass', 1.40, 'bottom', 236]]
});

// everything unique, at a world fraction, size in design units, bottom at y% of frame
putProp(rig, 'log_a', 0.767, 77.5, 190, 74);
```

**One arithmetic trap, and it caught me.** `wf` spans the whole action plane — 3 frames
here — while the camera travels only 2. So when the ride ends the frame shows fractions
0.667 to 1.0, and a prop meant to sit at *x*% of the parked frame belongs at
`(2 + x/100) / 3`. Placed by eye at 0.30–0.62, every prop ended up behind him.

`rig.props` re-places them from the live frame size on every `layout()`, so they survive
a resize: measured drift across 1960px → 1100px is **0.3% of frame**.

---

## The art brief for a tileable ground

`ground_path.webp` was distilled from a 266px window of the deleted muddy-path pack —
the one genuinely good thing in it, with the surface varying by 0.3px and the band
bottom by 0.0px. It proves the mechanism but it is a **placeholder**: a per-row median
with harmonic mottling, not drawn ground. A purpose-drawn one will look better.

```
Canvas            3840 x 400, RGBA, real transparency (twice the frame width)
Transparent       rows 0 to 140. Real alpha, nothing painted.
Ground            rows 141 to 400, opaque, edge to edge, no gaps in any column.
Surface           row 141 is the walkable line, and it must be DEAD LEVEL across the
                  whole width -- every column identical to within 1px. A character
                  stands on this line and it is declared as a number, not measured.
Depth             the ground continues to the bottom of the canvas, so nothing behind
                  it can show through beneath the path.
```

**The one rule that matters: TEXTURE, never LANDMARKS.**

A tileable strip repeats every two frames, so anything a child could point at recurs
three or four times per screen. Grain, mottling, tonal drift: all welcome. A distinctive
pebble, a crack, a tuft, a stone, a footprint: none. Those are props.

**Seamless by construction, not by hope.** Either mirror the strip (`[A | flip(A)]`), or
build any variation on a period that divides 3840 exactly. Then verify:

```python
a = np.array(Image.open(f).convert('RGBA')).astype(int)
wrap     = np.abs(a[:, 0, :] - a[:, -1, :]).mean()
interior = np.abs(a[:, 100, :] - a[:, 101, :]).mean()
# wrap must be within about 2x interior. ground_path: 1.11 vs 0.71 = 1.6x.
```

And a second check that catches what the first cannot: lay the tile beside itself and
measure column-to-column difference right across the join. On `ground_path` the wrap
column reads 2.21 against a normal range of 1.36–2.18 — indistinguishable from ordinary
variation, which is the standard to hit.

### Props for the same location

Per playbook §3.6, on a plain flat mid-grey background for cutout, hard alpha, no
feather, and **never** with a word in the image — words are drawn at runtime. Each prop
needs its width and height in design units stated, because `putProp` takes both
explicitly: a prop whose height depends on when its file happens to decode is not
measurable.
