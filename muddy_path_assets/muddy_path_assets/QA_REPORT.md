# QA report

- Action plates: `1920×1080`, RGBA.
- Action pixels below row `885`: alpha max `0`.
- Join 1 (`near[1660:1920]` vs `deep[0:260]`): `0` differing pixels.
- Join 2 (`deep[1660:1920]` vs `far[0:260]`): `0` differing pixels.
- `mud_near`: painted alpha bounds `3640×100+100+90`; rows outside `90–189` are transparent.
- `mud_near` left/right edge bands are transparent, giving matching repeat boundaries.
- Stone 1/2/3 alpha silhouettes: `0` differing pixels.
- Splash frames: rows `0–102` fully transparent.
- All production assets contain real alpha; the mockup is intentionally opaque.
- PNG size budgets are met for the three action plates, `mud_near`, stones, paired states, and splash frames.

`QA_magenta_contact_sheet.png` composites every transparent deliverable over magenta to expose matte or padding defects.
