/* Asset paths, character names, and all level content.
   Edit word pairs and story lines here — nothing else needs to change. */

const A={bridge_broken:'assets/bg/bridge_broken.webp',bridge_fixed:'assets/bg/bridge_fixed.webp',river_deep:'assets/bg/river_deep.webp',river_shallow:'assets/bg/river_shallow.webp',
         rockwall:'assets/bg/rockwall.webp',cave:'assets/bg/cave.webp',tree:'assets/bg/tree.webp',falls:'assets/bg/falls.webp',map:'assets/bg/map.webp',
         far_sky:'assets/bg/far_sky.webp',mid_canopy:'assets/bg/mid_canopy.webp',
         near_leaves:'assets/bg/near_leaves.webp',near_grass:'assets/bg/near_grass.webp',
         join_trunk:'assets/bg/join_trunk.webp',act_bank:'assets/bg/act_bank.webp',act_bridge:'assets/bg/act_bridge.webp',act_clearing:'assets/bg/act_clearing.webp',
         wlift:'assets/chars/wheelie_lift.webp',whold:'assets/chars/wheelie_hold.webp',wland:'assets/chars/wheelie_land.webp',
         cyc:'assets/chars/jhumru_cycle.webp',cycs:'assets/chars/jhumru_cycle_still.webp',
         ele:'assets/chars/jhumru.webp',mon:'assets/chars/monty.webp',tur:'assets/chars/tez.webp'};

const NAME={ele:'Jhumru',mon:'Monty',tur:'Tez'};

/* Idle breathing loops, used wherever a character just stands there.
   Tez has no loop drawn yet, so chip() falls back to the still for him. */
const IDLE={mon:'assets/chars/monty_idle.webp',ele:'assets/chars/jhumru_idle.webp'};
/* Walk cycles, for characters actually travelling. Faces right at rest. */
const WALK={mon:'assets/chars/monty_walk.webp'};

/* Jhumru's sprite modes. Every entry declares its own box aspect and its own
   rear-wheel anchor as a fraction of that box, because the wheelie frames sit on
   a wider canvas than the level-riding ones. Placement anchors on the REAR WHEEL,
   so swapping modes never shifts him -- see place() in scenes.js.
   hu/ar/ax for the wheelie modes are printed by build_wheelie(); re-run it and
   paste them again if the frames are ever regenerated. */
const RIDER={
 cyc  :{url:'assets/chars/jhumru_cycle.webp',      hu:322, ar:331/440, ax:0.290},
 still:{url:'assets/chars/jhumru_cycle_still.webp',hu:322, ar:331/440, ax:0.290},
 lift :{url:'assets/chars/wheelie_lift.webp',      hu:314, ar:1.0886,  ax:0.409},
 hold :{url:'assets/chars/wheelie_hold.webp',      hu:314, ar:1.0886,  ax:0.409},
 land :{url:'assets/chars/wheelie_land.webp',      hu:314, ar:1.0886,  ax:0.409}
};

/* ---------------------------------------------------------------------------
   THE OPENING SCRIPT.  "Jhumru's Synonym Adventure" -- hook.

   who : 'nar' the narrator, 'jhu' Jhumru. They get different voices in speak().
   fx  : 'bell' rings the bicycle bell, 'map' pops the jungle trail map up,
         'ask' turns to the player and waits for a Yes before going on.

   Keyed to the beats of the opening, not to timings: each stop plays its lines
   in order and the pause sizes itself to fit, so lines can be added or cut here
   without touching scenes.js.
   ------------------------------------------------------------------------- */
const HOOK={
 /* stop 1 -- the near bank, he introduces himself and his bicycle */
 bank:[{who:'nar',line:'Jhumru was setting off on an exciting adventure through the jungle on his new bicycle.'},
       {who:'jhu',line:'Hello, everyone! Have you seen my new bicycle?'},
       {who:'jhu',line:'Tring! Tring! Look at it! It is shiny! It is bright! It is sparkling!',fx:'bell'}],
 /* leg A -- he climbs on and pedals off, up the ramp onto the bridge */
 legA:[{who:'jhu',line:'Today, I am going on a jungle adventure journey!'}],
 /* stop 2 -- midway across the bridge, the trail map appears */
 bridge:[{who:'jhu',line:'I wonder what we will find along the way!'},
         {who:'jhu',line:'Oh! The jungle path looks full of surprises and challenges.',fx:'map'}],
 /* stop 3 -- the clearing. He turns to the player and waits to be answered. */
 clearing:[{who:'jhu',line:'Will you come on this adventure with me?',fx:'ask'}],
 /* and once they say yes */
 go:[{who:'nar',line:'Wonderful! Let us go!'}]
};

/* ---------------------------------------------------------------------------
   THE SIX PLACES.  See docs/05-story-spine.md for why they are in this order.

   want:'syn'  a FRIEND is stuck. Give a word meaning the SAME. The friend
               understands and acts -- equivalence shown by consequence.
   want:'ant'  a PLACE is stuck. Give the OPPOSITE of how it is. The place
               flips state -- the mechanic is the meaning.

   The child is never told which mode they are in: a want:'syn' round puts a
   friend on the right to carry the word to, a want:'ant' round puts a lit
   word-stone there instead. The cue is what they see, not something recalled.

   Ramp:  same · same · opposite · opposite · same · mixed(boss)

   Every round offers exactly one synonym, one antonym and one unrelated word.
   Only `want` decides which is correct, so picking the wrong RELATIONSHIP is
   now measurable in both directions -- that is the diagnostic signal.

   fx0   effect applied when the scene opens (carries state into a 2nd round)
   then  a follow-up round at the same place; only the fields that differ
   ------------------------------------------------------------------------- */
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
