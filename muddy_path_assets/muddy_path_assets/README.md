# The Muddy Path — generated asset package

Production files:

- `act_mud_near.png`, `act_mud_deep.png`, `act_mud_far.png` — 1920×1080 RGBA action plates
- `mud_near.png` — 3840×400 RGBA foreground immersion strip
- `prop_stone_1.png`, `prop_stone_2.png`, `prop_stone_3.png` — registered 900×600 RGBA selectable stones
- `stones_firm.png`, `stones_sunk.png` — registered 1200×400 RGBA outcome states
- `fx_mud_splat.png`, `fx_mud_splat_b.png` — 512×256 RGBA effect frames

Development references:

- `mockup_muddy_path.png` — mechanic mockup
- `master_mud.png` — generated style/composition master

Runtime notes:

- Plate world positions: `0`, `1660`, `3320` (260-unit overlap).
- Adjacent 260-pixel overlap bands are pixel-identical.
- All action-plate pixels below row 885 (82% of 1080) are transparent.
- `mud_near.png` contains paint only in rows 90–189 and has transparent matching tile edges.
- Stone top faces intentionally contain no writing; labels belong at runtime.
