# Beyond tap-the-right-tile — mechanic ideas

Six alternatives to the three-tile MCQ, each judged against `docs/01`.

---

## Why the current mechanic needs replacing

`docs/01` §P1 sets its own test: *"if I replaced the English content with maths
content and the game still worked identically, the integration is extrinsic and
the design is wrong."*

Three hanging tags, tap the right one — swap `broken/smashed/fixed/noisy` for
`7+5 / 12 / 2 / 9` and **nothing about the game changes.** It is a quiz with a
jungle painted on it, which is the "chocolate-covered broccoli" failure §P1 names.

What follows all tries to pass that test: the action itself has to *be* the
relationship.

Two constraints shape every option:

- **§1.2 antonyms are a polarity flip** — a state, inverted. The action should
  move something between two poles.
- **§1.3 synonyms are many-to-one** — two forms, one referent, and *no visual
  delta*, which is why they are the hard one. The action must show equivalence
  **by identical consequence**: two different inputs, one indistinguishable
  result.

And §P6: tap is the default, drag is error-prone at six. Anything needing
precision is a worse bet than anything needing a sweep or a hold.

---

## 1 · Ride-through gates ★ *recommended first prototype*

**The action.** Jhumru cycles — the scrolling world already exists. Archways
approach in pairs, one word over each. Steer up or down to pass through the right
one. Correct, he rides on; wrong, he coasts to a stop, the arch says its word
aloud, and he rolls back a little and tries again.

**Why it carries the meaning.** The word is a *route*. Choosing is going
somewhere, and being wrong is being somewhere else. Replace the words with sums
and it still works — so on its own this only half-passes §P1. It earns the pass
from what the gate *does*: pass the antonym gate and the world beyond it flips
(the far side of the "bright" arch is a lit cave), so the choice visibly changes
the place.

**Input.** One continuous steer — hold anywhere on the upper or lower half. No
targets to hit, nothing to release accurately. The most forgiving input on this
list, and the best fit for §P6.

**Cost.** Low. The parallax rig, the cyclist, the layer stack and the camera are
built. Needs arch art (one prop, two states) and a lane-position variable.

**What wrong answers teach.** Physical, not punitive: he ends up at the wrong
place and can see it. Satisfies §P3 without a single red cross.

---

## 2 · The dial

**The action.** A big wooden dial or lever. Turn it and the scene moves
*continuously* between two poles — the cave brightens as you turn right, darkens
as you turn left. The word only locks in at the extreme.

**Why it carries the meaning.** This is the one idea here that teaches something
the MCQ cannot: **antonyms are the two ends of a scale.** The child feels the
middle. `dark → bright` stops being two tiles and becomes a direction.

**Input.** A single drag with no release target — anywhere on the dial, any
distance. Very forgiving.

**Cost.** Medium. Needs a continuously-lit version of each scene, not two plates.
Achievable with a cross-fade between the A and B plates driven by dial angle,
which is cheap with the pairs already commissioned.

**Limitation.** Antonyms only. Synonyms have no scale to slide along.

---

## 3 · Two keys, one lock

**The action.** A door with one keyhole and three keys of visibly different
shapes. The synonym key and the prompt key are *different shapes* but both turn
this lock. The antonym key turns a second, clearly different door. The unrelated
key fits nothing and won't go in.

**Why it carries the meaning.** This is §1.3's own prescription — equivalence
demonstrated by consequence. Two different objects, one identical outcome. And it
teaches the harder truth underneath: synonyms are not the *same word*, they are
different words that *do the same job*. The shapes being different is the lesson.

**Input.** Drag with generous snap, or tap-then-tap. Sockets are large.

**Cost.** Low-medium. One door prop, three key shapes, per `docs/03` Block C —
which already specs three distinct stone shapes for exactly this reason.

---

## 4 · Echo call-and-response ★ *strongest for early readers*

**The action.** Jhumru calls a word into a canyon. The echo returns — but changed.
Three echoes come back one at a time, spoken aloud. Tap the echo that **means the
same** and a stepping stone rises out of the water. Tap one that doesn't and it
fades, and the next echo comes.

**Why it carries the meaning.** An echo is *the same thing said again*. The
metaphor is the definition. And crucially it is **audio-first with no text at
all** — §P5 says text is decoration until mid-G2, and this is the only option here
that a non-reader can play at full speed.

**Input.** Tap one of three, but sequential rather than simultaneous — the child
hears, then decides, instead of scanning. Much lower load than three tiles at
once.

**Cost.** Low art, **high VO**. Every word needs a recorded call and a recorded
echo. §P5 already rules out TTS, so this is a recording-budget decision more than
an engineering one.

---

## 5 · Two baskets ★ *the best answer to §1.4*

**The action.** Six or eight words hang on the vine. Jhumru holds a basket marked
with an `=` sign, Monty a basket marked `↔`. Post every word into the basket that
matches its relationship to the signpost word. Unrelated words go in neither —
shake the vine and they fall away.

**Why it carries the meaning.** §1.4 calls telling the two operations apart *the*
genuinely hard G2 skill. Every other mechanic here asks one question at a time;
this one asks the child to **sort by relationship**, which is the contrast task in
physical form. It also stops being answerable by elimination — with eight items
and two bins there is no "one of three" to guess between.

**Input.** Drag, but into two enormous targets. Generous.

**Cost.** Low. Two basket props. The vine, tags and drag handling all exist.

**Best used as** the boss level `docs/05` already reserves at place 6, not as the
everyday mechanic — it is the most demanding thing on this list.

---

## 6 · The potion

**The action.** Two ingredients into a pot. Drop in the prompt word and a synonym
and the brew turns the *same* colour both times — proof they are the same thing.
Drop in an antonym and it splits into two colours. Unrelated, and it goes grey and
fizzles.

**Why it carries the meaning.** Identical outcome from different inputs, again per
§1.3 — but expressed as **colour**, so the child can verify the answer without
reading either word. Reading load near zero.

**Input.** Drag into one big pot.

**Cost.** Low. One pot, a colour-mix animation, no new plates.

---

## A stretch: say the word

The child **speaks** the answer instead of choosing it. Web Speech recognition,
one word, closed vocabulary of three — which is the easiest possible ASR problem.

Productive rather than receptive language, and enormously motivating at six.

**The risk is real:** ASR on Indian-English child speech is weak, and a game that
mishears is worse than no game. Ship it as an *optional* second way to answer,
never the only way, and never let a failed recognition count as a wrong answer.

---

## Recommendation

| | mechanic | operation | reading load | input risk | build cost |
|---|---|---|---|---|---|
| 1 | Ride-through gates | both | medium | **lowest** | **low** |
| 2 | The dial | antonym only | low | low | medium |
| 3 | Two keys, one lock | synonym | medium | medium | low-med |
| 4 | Echo | synonym | **none** | low | low art / high VO |
| 5 | Two baskets | **both, contrasted** | high | medium | low |
| 6 | Potion | synonym | **near none** | low | low |

**Prototype 1 and 4 first**, and keep 5 for the boss.

- **Gates** because the rig is already built, the input is the most forgiving
  thing available to a six-year-old, and it makes the answer a *place* rather than
  a tile. Cheapest path to something that feels like a game rather than a quiz.
- **Echo** because it is the only option that a child who cannot read yet can play
  properly, and it solves the problem §1.3 flags as hardest by leaning on sound
  instead of pictures.
- **Baskets** at place 6, because §1.4 says mixed-mode discrimination belongs in a
  boss level and this is that task made physical.

**What not to do:** do not keep three tiles and add juice. Confetti, streaks,
stars and combo counters on top of an MCQ is precisely the chocolate-covered
broccoli §P1 warns about, and it will test well in a demo and teach nothing.
