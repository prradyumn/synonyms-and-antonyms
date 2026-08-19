/* Asset paths, character names, and all level content.
   Edit word pairs and story lines here — nothing else needs to change. */

/* Only what the opening loads. The six location plates are parked -- see
   docs/12-level-content-parked.md -- and come back with one build run. */
const A={map:'assets/bg/map.webp',ramp:'assets/bg/ramp.webp',
         far_sky:'assets/bg/far_sky.webp',mid_canopy:'assets/bg/mid_canopy.webp',
         near_leaves:'assets/bg/near_leaves.webp',near_grass:'assets/bg/near_grass.webp',
         join_trunk:'assets/bg/join_trunk.webp',act_bank:'assets/bg/act_bank.webp',act_bridge:'assets/bg/act_bridge.webp',act_clearing:'assets/bg/act_clearing.webp',
         wlift:'assets/chars/wheelie_lift.webp',whold:'assets/chars/wheelie_hold.webp',wland:'assets/chars/wheelie_land.webp',
         cyc:'assets/chars/jhumru_cycle.webp',cycs:'assets/chars/jhumru_cycle_still.webp',
         ele:'assets/chars/jhumru.webp'};

/* Idle breathing loop, used wherever Jhumru just stands there. */
const IDLE={ele:'assets/chars/jhumru_idle.webp'};

/* Dialogue portraits -- a face beside the speech text, not a swap on the bike.

   Swapping his head on the bicycle was tried twice and abandoned. The delivered
   heads are drawn at 80-90% of the original's size and sit up to 28px low, so
   unregistered they shrink and slide as the expression changes; and registering
   them to the right size pushes the chin down through row 280, where the art
   simply stops, leaving a cut with the original's chin under it. There is no
   composite that satisfies both.

   A portrait needs no body, so the circle is framed to end above row 280 and
   nothing is joined at all. Every head is registered on the blue hair tuft first,
   so one crop box frames all eight identically and the face never jumps.
   build_portraits() in tools/build-assets.py. */
const PORTRAIT={
 neutral  :'assets/chars/port_neutral.webp',
 proud    :'assets/chars/port_proud.webp',
 think    :'assets/chars/port_think.webp',
 wow      :'assets/chars/port_wow.webp',
 ask      :'assets/chars/port_ask.webp',
 cheer    :'assets/chars/port_cheer.webp',
 confused :'assets/chars/port_confused.webp',
 encourage:'assets/chars/port_encourage.webp'
};

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
/* `face` names an entry in PORTRAIT. It holds until another line changes it, so a
   stop only needs to name an expression when it turns. Narrator lines carry one
   too -- he is on screen being talked about. */
const HOOK={
 /* stop 1 -- the near bank, he introduces himself and his bicycle */
 bank:[{who:'nar',line:'Jhumru was setting off on an exciting adventure through the jungle on his new bicycle.',face:'neutral'},
       {who:'jhu',line:'Hello, everyone! Have you seen my new bicycle?',face:'neutral'},
       {who:'jhu',line:'Tring! Tring! Look at it! It is shiny! It is bright! It is sparkling!',fx:'bell',face:'proud'}],
 /* leg A -- he climbs on and pedals off, up the ramp onto the bridge */
 legA:[{who:'jhu',line:'Today, I am going on a jungle adventure journey!'}],
 /* stop 2 -- midway across the bridge, the trail map appears */
 bridge:[{who:'jhu',line:'I wonder what we will find along the way!',face:'think'},
         {who:'jhu',line:'Oh! The jungle path looks full of surprises and challenges.',fx:'map',face:'wow'}],
 /* stop 3 -- the clearing. He turns to the player and waits to be answered. */
 clearing:[{who:'jhu',line:'Will you come on this adventure with me?',fx:'ask',face:'ask'}],
 /* and once they say yes */
 go:[{who:'nar',line:'Wonderful! Let us go!',face:'cheer'}]
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
