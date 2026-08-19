# Jhumru — Stopped Bicycle Expression Set

Seven production-ready expression frames built from the supplied specification, plus the approved original still.

## Production files

- `full_frames/`: transparent 662×880 RGBA composites. Every generated expression uses the same approved body/bicycle layer below the collar seam.
- `head_layers/`: transparent, full-canvas head-only overlays for the game build.
- `jhumru-expression-sheet-4x2.png`: transparent review/import sheet, four columns by two rows; seven populated cells.
- `jhumru-expressions.json`: dimensions, order, registration, seam, and runtime values.
- `jhumru-expression-review.gif`: slow review animation on a dark neutral matte. The GIF is for checking only; use PNGs in the game.
- `SOURCE-SPEC.md`: supplied production brief.

## Frame order

0. `still_proud`
1. `still_think`
2. `still_wow`
3. `still_ask`
4. `still_cheer`
5. `still_confused`
6. `still_encourage`

## Runtime constants

```js
{ hu: 322, ar: 331 / 440, ax: 0.290 }
```

The delivered PNG resolution is exactly 2× the original game frame: 662×880. The documented seam is therefore `y=280` with a 12 px feather, equivalent to `y=140` with a 6 px feather at source resolution.
