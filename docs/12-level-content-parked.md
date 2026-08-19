# Level content bank — parked

The opening is finalised up to Monty's arrival. Everything past it was built
against the three-tile MCQ, which `docs/07` and `docs/08` replace, so the level
code has been removed from `src/`.

**The word content is not scrap** — it is the pedagogy from `docs/05`, and it
survives here verbatim so the new mechanic can be built against it rather than
reinvented.

Each entry carries one synonym, one antonym and one unrelated word. `want`
decides which is correct, which is what makes a wrong answer diagnostic:
choosing the antonym in a `syn` round means the two operations were confused,
and that is the signal worth counting.

Order and reasoning are in `docs/05-story-spine.md`; the four-option
alternatives are in `docs/08-four-option-mechanics.md`.

```js
const L=[
 /* 1 · SAME — teaches the verb with nothing to discriminate against */
 {bg:'bridge_broken',after:'bridge_fixed',fx:null,want:'syn',say:'mon',hear:'ele',
  w:'broken',syn:'smashed',ant:'fixed',un:'noisy',
  ok:'Jhumru understands and nails the planks back.',
  antL:'Fixed is the opposite of broken. Jhumru thinks the bridge is fine and hands it back.',
  unL:'Noisy has nothing to do with broken. The tag slips out of the air.'},

 /* 2 · SAME — massed practice, second and last before the operation changes */
 {bg:'river_deep',after:'river_shallow',fx:null,want:'syn',say:'tur',hear:'mon',
  w:'scared',syn:'afraid',ant:'brave',un:'hungry',
  ok:'Monty understands and finds the shallow stepping stones.',
  antL:'Brave is the opposite of scared. Monty pushes it straight back.',
  unL:'Hungry is not about being scared. The tag drifts away.'},

 /* 3 · OPPOSITE — the new operation opens on the most dramatic flip we own */
 {bg:'cave',after:null,fx:'glow',want:'ant',place:'cave',say:'mon',
  w:'dark',syn:'black',ant:'bright',un:'soft',
  ok:'The fireflies come in and the whole cave lights up.',
  synL:'Black means the same as dark. The cave stays just as dark.',
  unL:'Soft is not about light at all. The tag falls.'},

 /* 4 · OPPOSITE — consolidate */
 {bg:'tree',after:null,fx:'fruit',want:'ant',place:'tree',say:'tur',
  w:'empty',syn:'bare',ant:'full',un:'fast',
  ok:'Every branch fills with fruit.',
  synL:'Bare means the same as empty. The tree stays bare.',
  unL:'Fast is not about how much is there. The tag slips.'},

 /* 5 · SAME — the interleave, where telling the two apart begins.
        Deliberately a synonym round: rockwall is the one place with no state
        flip (fxCheer only draws sparkles), and synonym rounds need a
        consequence rather than a flip. */
 {bg:'rockwall',after:null,fx:'cheer',want:'syn',say:'ele',hear:'mon',
  w:'big',syn:'huge',ant:'tiny',un:'wet',
  ok:'Monty understands and finds a way up the huge rocks.',
  antL:'Tiny is the opposite of big. Monty returns it.',
  unL:'Wet is not about size. The tag drops.'},

 /* 6 · BOSS — mixed mode, per docs/01 §1.4. Two rounds, one of each, at the
        same place. Still no memory tax: the child reads which is which off the
        scene exactly as before. Opposite first to bring the water back, then
        same to describe the roar. */
 {bg:'falls',after:null,fx:'water',want:'ant',place:'waterfall',say:'ele',
  w:'weak',syn:'tired',ant:'strong',un:'cold',
  ok:'The waterfall bursts back to life.',
  synL:'Tired means much the same as weak. The water stays a trickle.',
  unL:'Cold is not about being weak. The tag tumbles.',
  then:{fx:null,fx0:'water',want:'syn',say:'ele',hear:'mon',
        w:'loud',syn:'noisy',ant:'quiet',un:'dry',
        ok:'Monty understands. They shout over the roar all the way home.',
        antL:'Quiet is the opposite of loud. Monty hands it back.',
        unL:'Dry has nothing to do with loud. The tag slips away.'}}
];
```

## The backgrounds it needs

`bridge_broken`, `bridge_fixed`, `river_deep`, `river_shallow`, `rockwall`,
`cave`, `tree`, `falls` — removed from `assets/bg/` while unused, but the
originals are still in `assets/source/` and `tools/build-assets.py` still lists
them, so one run of the build script brings them all back.
