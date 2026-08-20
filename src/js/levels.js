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
         g_near:'assets/bg/act_gorge_near.webp',g_span:'assets/bg/act_gorge_span.webp',
         g_far:'assets/bg/act_gorge_far.webp',mid_gorge:'assets/bg/mid_gorge.webp',
         plank:'assets/chars/prop_plank.webp',
         r_bank:'assets/bg/act_raft_bank.webp',r_open:'assets/bg/act_raft_open.webp',
         r_far:'assets/bg/act_raft_far.webp',water_far:'assets/bg/water_far.webp',
         water_near:'assets/bg/water_near.webp',near_reeds:'assets/bg/near_reeds.webp',
         raft:'assets/chars/raft_fused.webp',raft_bad:'assets/chars/raft_stepped.webp',
         log_a:'assets/chars/prop_log_smooth.webp',log_b:'assets/chars/prop_log_ridged.webp',
         log_c:'assets/chars/prop_log_moss.webp',splash:'assets/chars/fx_splash.webp'};

/* The idle breathing loop and the standing sprite are OUT of the shipped set.
   Nothing draws them: chip() was their only consumer and its last call went when
   the opening stopped handing off to a standing-around scene. Between them they
   were 936KB of the 4.5MB boot -- a fifth of it -- fetched every load and never
   shown. `python tools/build-assets.py` regenerates both from the GIFs in
   assets/chars, which stay in git. Add them back to A when a scene needs them. */

/* Expression heads for the stopped pose. Each is the same 458x682 canvas as the
   body, cropped to ONE shared bbox by build_stills(), so they need no placement of
   their own and cannot drift apart at runtime.

   The pack arrived as six complete characters -- correct brief -- but from a model
   rather than a rig, so the rear-wheel contact spanned 18px and the bodies differed
   by up to 163,000 pixels. Cross-fading those whole would morph the bike. Taking the
   body from ONE file and swapping only the registered head is what makes the change
   seamless. */
const FACES={
 neutral:'assets/chars/face_neutral.webp', proud:'assets/chars/face_proud.webp',
 think  :'assets/chars/face_think.webp',   wow  :'assets/chars/face_wow.webp',
 ask    :'assets/chars/face_ask.webp',     cheer:'assets/chars/face_cheer.webp'
};


const GORGE={
 seg:['g_near','g_span','g_far'],
 midRate:0.62,
 /* How far to bed the tyres into the ground, as a percentage of HIS height (322
    design units) -- so it stays right at any frame size. 5% is about 12px on a
    desktop frame: enough that the narrow tyre tangent reads as sitting in the
    surface rather than kissing it. Raise it for softer ground, lower it for planks. */
 drop:5,
 /* Overlap per join, in design units. Each plate was drawn self-contained with its
    own rim at both edges, so butted they stack two structures. Measured off the
    alpha: the span's left rim block runs x0-240 and its right rim x1720-1920, so
    pulling each following plate left by that much lands one plate's rim on the
    other's edge instead of beside it. */
 laps:[240,200],
 gap:0.4790,        /* the gap's near edge, as a fraction of the whole world */
 gapPx:[839,1071],      /* measured off the alpha: 233px, not the 192 in their spec */
 deck:65.28,
 /* Rideable surface of each plate, 33 points left to right, as a percentage of
    frame height. Measured off the art by build_gorge() -- see ride_top() for why
    colour and not opacity. Do not hand-edit; re-run the build. */
 prof:[
  /* act_gorge_near */
  [84.81,84.81,84.72,83.89,83.24,83.24,83.24,82.22,82.22,82.22,82.22,81.76,81.67,81.67,80.74,80.00,79.72,78.70,77.69,76.76,75.46,74.35,72.96,71.57,70.28,70.28,69.07,69.07,67.31,66.30,66.30,66.02,65.93],
  /* act_gorge_span */
  [65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28,65.28],
  /* act_gorge_far */
  [64.86,64.86,64.91,64.91,64.91,64.91,64.91,64.91,64.91,64.91,64.91,66.76,66.76,66.76,66.76,66.76,66.76,66.76,67.13,67.13,67.13,67.13,67.13,67.96,68.15,68.24,68.43,68.43,68.52,69.63,69.63,69.63,69.63]
 ]
};

const RAFT={
 /* act_raft_open is deliberately an empty spacer. It arrived painted as a full
    background, but the far side of the river already has a treeline from mid_canopy
    at 0.50 and a reed line from water_far at 0.62 -- anything left on the action
    plane there would travel at 1.00 and read as the far bank rushing past a raft
    that is barely moving. */
 seg:['r_bank','r_open','r_far'],

 /* The depth stack. water_near travels FASTER than the raft, so it passes in front
    of the hull and cuts the waterline: that is what makes him float IN the water
    rather than on a painting of it. Against water_far's 0.62 it gives a 2:1 spread
    across the river, which is the only depth cue an otherwise flat plane has.
    near_reeds is the fastest layer in the game because on a crossing he barely moves
    against the far bank, so the foreground has to say "you are travelling".
    `drift` scrolls each texture on its own, so the river flows while he is parked.
    The near band moves nearly 3x the far one: measured, at the first values only 0.4%
    of the water's pixels changed over a second, because water_near is deliberately
    sparse at 5% coverage and a slow scroll of a sparse texture reads as still. */
 mids:[{key:'water_far',  rate:0.62,z:1,strip:1080,edge:'bottom',drift:0.016,fx:'rippleFar'},
       {key:'water_near', rate:1.22,z:6,strip:340, edge:'bottom',drift:0.042,front:1,fx:'ripple',swell:1},
       /* A SECOND pass of the near band at a different rate and drift. water_near is
          deliberately sparse -- 5% coverage -- so one copy scrolling reads as almost
          still; two crossing at different speeds interfere and the surface comes
          alive without any new art. */
       {key:'water_near', rate:0.96,z:5,strip:300, edge:'bottom',drift:0.024,op:0.75},
       /* Sheen: highlight streaks drawn in CSS, no asset.

          The angle is the GRADIENT's direction, not the stripes'. 98deg ran the
          gradient left-to-right and produced near-VERTICAL lines across the river,
          which looked like a fence. 6deg runs it bottom-to-top, so the stripes lie
          near-horizontal as water lines do, tilted just enough that the horizontal
          drift shifts them visibly -- a line 6 degrees off level moving sideways
          reads as moving down the river. The ripple filter then bends them. */
       {rate:1.10,z:5,strip:300,edge:'bottom',drift:0.055,fx:'rippleStatic',swell:1,op:0.42,
        paint:"repeating-linear-gradient(6deg,"
             +"rgba(255,255,255,0) 0 22px,rgba(255,255,255,.26) 22px 26px,"
             +"rgba(255,255,255,0) 26px 54px,rgba(214,244,255,.16) 54px 57px,"
             +"rgba(255,255,255,0) 57px 92px)"},
       {key:'near_reeds', rate:1.62,z:7,strip:300, edge:'bottom',front:1}],
 /* near_grass is dropped for this scene -- grass over open water is wrong.
    mid_canopy goes too: a distant treeline on the horizon reads as the far bank, and
    the whole point of this place is that the land ENDS. far_sky plus water_far leaves
    water meeting sky, which cannot be misread. */
 back:[['far_sky',0.20]],
 front:[['near_leaves',1.40,'top',169]],

 /* The bank plate already has three logs PAINTED into it at 36%, 53% and 70%, with
    their bases level at 66%. Placing prop logs as well put six on the shore, and
    riding along the shore's far top edge at 58% put him on a different plane from
    the logs entirely -- the ground is seen nearly edge-on, so further DOWN the image
    is nearer the viewer, and the logs sit in the middle of the band, not on its far
    lip. 66% is their plane and therefore his. */
 logs:[36,53,70],
 shore:[[0,64.0],[0.25,65.5],[0.36,66.0],[1,66.5]],
 stop:82,          /* past the last log, at the water's edge */
 /* How far the camera drifts on once he has stopped, as a camera fraction. The bank
    plate is exactly one frame wide and the segment after it is an empty spacer, so
    any pan at all slides open water in from the right: 0.15 puts the frame's right
    edge 0.3 of a frame past the end of the shore, which is enough water to read as
    "it does not start again over there". act_raft_far sits at world 2..3 frames and
    never comes into view, so nothing contradicts it. */
 look:0.15,
 hopW:11,          /* half-width of a hop, in percent of frame */
 hopH:12,          /* how high he clears, in percent of frame height */
 water:78.4,
 deck:75.4         /* the raft's walkable top -- floats 3% proud of the waterline */
};

/* Jhumru's sprite modes. Every entry declares its own box aspect and its own
   rear-wheel anchor as a fraction of that box, because the wheelie frames sit on
   a wider canvas than the level-riding ones. Placement anchors on the REAR WHEEL,
   so swapping modes never shifts him -- see place() in scenes.js.
   hu/ar/ax for the wheelie modes are printed by build_wheelie(); re-run it and
   paste them again if the frames are ever regenerated. */
const RIDER={
 cyc  :{url:'assets/chars/jhumru_cycle.webp',      hu:322, ar:331/440, ax:0.290},
 /* The stopped pose is a HEADLESS body plus a face layer, so only the head ever
    changes and a cross-fade cannot morph the bicycle. hu/ar/ax are printed by
    build_stills(); hu 348 is derived from the wheel-to-tuft distance so he stays
    exactly the size he was on the cycling loop when the sprite swaps. */
 still:{url:'assets/chars/jhumru_still_body.webp',hu:348, ar:0.6716, ax:0.2522, face:1},
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
/* `face` names an entry in FACES and changes the expression ON HIM. It holds until
   another line changes it, so a stop only names an expression when it turns.
   Narrator lines carry one too -- he is on screen being talked about. */
const HOOK={
 /* stop 1 -- the near bank. Four lines, because the script says "Today, I'm going
    on a jungle adventure journey!" BEFORE the direction "[He climbs onto his
    bicycle and begins to pedal.]" -- so it belongs to the stop, not to the ride. */
 bank:[{who:'nar',line:'Jhumru was setting off on an exciting adventure through the jungle on his new bicycle.',face:'neutral'},
       {who:'jhu',line:'Hello, everyone! Have you seen my new bicycle?',face:'neutral'},
       {who:'jhu',line:"Tring! Tring! Look at it! It's shiny! It's bright! It's sparkling!",fx:'bell',face:'proud'},
       {who:'jhu',line:"Today, I'm going on a jungle adventure journey!",face:'cheer'}],
 /* leg A -- spoken while he pedals, per "[He climbs onto his bicycle...]" */
 legA:[{who:'jhu',line:"I wonder what we'll find along the way!"}],
 /* stop 2 -- midway across the bridge, where the trail map appears */
 bridge:[{who:'jhu',line:'Oh! The jungle path looks full of surprises and challenges.',fx:'map',face:'wow'}],
 /* stop 3 -- he turns to the children and waits to be answered */
 clearing:[{who:'jhu',line:'Will you come on this adventure with me?',fx:'ask',face:'ask'}],
 /* and once they say Yes */
 go:[{who:'nar',line:"Wonderful! Let's go!",face:'cheer'}]
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
