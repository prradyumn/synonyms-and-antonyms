# Jhumru Wheelie Animation Set

Production sprite set derived from the supplied cycling-elephant reference and wheelie specification.

## Deliverables

- `wheelie_lift`: 6-frame one-shot at 16 fps (~375 ms)
- `wheelie_hold`: 8-frame seamless pedalling loop at 12 fps
- `wheelie_land`: 6-frame one-shot derived by reversing `wheelie_lift`
- `wheelie-complete-preview.gif`: lift → hold → land review loop
- Transparent PNG sprite sheets and individual frame PNGs
- JSON metadata with the shared rear-wheel anchor and per-frame placement diagnostics

## Shared alignment

Every frame uses a 660×880 transparent canvas. The rear-wheel ground contact is fixed at:

- Pixel: `x=191`, `y=879`
- Normalized: `x=0.29`, `y=1.0`
- Sprite-sheet layout: one horizontal row, zero spacing, zero margin

Use the same anchor for the existing cycling sprite when swapping states. Do not crop these animations independently; preserve their full canvases or crop the entire cycling/wheelie set using one shared union bbox.

## Runtime sequence

1. Existing `jhumru_cycle`
2. Play `wheelie_lift` once
3. Loop `wheelie_hold` while climbing
4. Play `wheelie_land` once
5. Return to `jhumru_cycle`

Keep ramp angle and wheelie angle as separate runtime values. The ramp is deliberately not baked into these character sprites.
