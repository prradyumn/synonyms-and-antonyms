# Broken Bridge — Production Asset Package

Five game-ready illustrated assets matched to the established jungle art style.

## Assets

- `png/act_gorge_near.png` — 1920×1080 RGBA approach plate with distant bridge visible.
- `png/act_gorge_span.png` — 1920×1080 RGBA hurdle plate.
- `png/act_gorge_far.png` — 1920×1080 RGBA far-side continuation.
- `png/mid_gorge.png` — 5760×1080 RGBA parallax ravine interior.
- `png/prop_plank.png` — 1600×320 transparent loose plank prop.

## Geometry contract

- Shared bridge deck surface: `y = 706`.
- Deck underside: `y = 772`.
- Exact central gap: `x = 864…1055` (`192 px`).
- `mid_gorge` transparent top band: `324 px` (30%).
- Suggested ravine parallax rate: `0.42`.

## QC

- `qc/action-plates-magenta-proof.jpg` proves the transparent action-plane regions.
- `qc/bridge-over-ravine-preview.jpg` demonstrates the span over the slower ravine layer. Its black upper area represents the intentionally absent sky layer; the existing `far_sky` supplies that region in-game.
- `broken-bridge-assets.json` contains machine-readable geometry and layer paths.

The PNGs—not the JPEG previews—are the production files.
