# Story spine — one premise, two operations

How Word Tree covers **synonyms and antonyms** without asking a six-year-old to
hold a rule in their head.

Written against `docs/01`. Where the two disagree, `docs/01` §1.4 and §6.2 win —
they are the research; this is an application of it.

---

## The premise

> **The Word Tree fruits once a year, and today is the day.** Monty, Jhumru and
> Tez set out along the trail to reach it.
>
> But the Tree has been dropping its words, and a word that goes missing leaves a
> hole behind it. When a **friend** loses a word, he cannot make himself
> understood. When a **place** loses a word, it forgets how to be itself — the
> cave forgets that it should be bright, the waterfall forgets that it should be
> strong.
>
> Six places. Put the word back and walk on.

That is the whole plot. One paragraph, spoken once, roughly 12 seconds.

**It is deliberately thin.** `docs/01` §6.2 argues that a named cast with clear
domains *replaces* story: "No plot to maintain, no cutscenes to skip, no
localisation of narrative." This premise is built to respect that — it exists to
give both operations one shared cause, not to be a narrative the child follows.
Every location beat is self-contained. A child dropped into place 4 with no memory
of place 1 loses nothing.

Note what the premise buys: **one cause, two task types, no antagonist.** A
trickster character who says everything backwards is the obvious alternative, and
it is genuinely more charming — but it costs a new character with an idle loop, a
talk loop and a reaction library, and §6.3 already flags paired-state art as "the
single largest art dependency in the project." A missing word costs nothing to
draw.

---

## The two operations, and how a child tells them apart

The load problem is not "what is a synonym." It is **which question am I being
asked right now.** §1.4 names this as the genuinely hard G2 skill.

The answer here is that the child never has to remember which mode they are in,
because **the scene looks different**. The cue is perceptual, not verbal.

| | A friend is stuck | A place is stuck |
|---|---|---|
| **Operation** | synonym — *means the same* | antonym — *means the opposite* |
| **What you see** | two friends facing each other, one waiting on the right | **no friend waiting.** A lit word-stone set into the place itself |
| **What you do** | carry a word across to the friend | drop a word onto the stone |
| **What changes** | the **friend** understands and acts | the **place** flips state |
| **Logical shape** | many-to-one (§1.3) | polarity flip (§1.2) |

Both are the same physical action — pull a tag off the vine, carry it to the thing
that is asking. Only the target differs. Per §P6, tap stays the default and drag
stays a reward.

### Why this satisfies intrinsic integration (§P1)

- **Synonym rounds demonstrate equivalence by consequence, not appearance.**
  §1.3 is explicit that this is the hard part: both words resolve to the same
  picture, so there is no visual delta to show. Here, two *different* words
  produce one *identical* outcome — the friend understands and acts. That is the
  "two keys, one lock" structure §1.3 asks for.
- **Antonym rounds make the mechanic the meaning.** §1.2 wants the flip to *be*
  the animation. Naming the opposite is what transforms the scene. Swap English
  for maths and the antonym round stops working entirely — which is the test §P1
  sets.

---

## The ramp — this is the load management

Massed practice first, then the other operation, then interleaved, then mixed.
Both operations are never live at once until the child has succeeded at each
alone.

| # | Place | Operation | Word → answer | Flip you already own |
|---|---|---|---|---|
| 1 | Rope bridge | **same** | broken → **smashed** | `bridge_fixed` (real plate) |
| 2 | River | **same** | scared → **afraid** | `river_shallow` (real plate) |
| 3 | Cave | **opposite** | dark → **bright** | `fxGlow()` |
| 4 | Fruit tree | **opposite** | empty → **full** | `fxFruit()` |
| 5 | Rock wall | **same** | big → **huge** | `fxCheer()` |
| 6 | Waterfall | **boss — mixed** | two rounds, one of each | `fxWater()` |

`same · same · opposite · opposite · same · mixed`

Four things this ordering buys:

1. **Place 1 teaches the verb with nothing to discriminate.** One operation, one
   correct answer, no competing rule.
2. **The first antonym round is the most dramatic flip available.** A dark cave
   lighting up is the clearest possible demonstration that naming the opposite
   changes the world. Introducing a new operation on the weakest visual would
   waste it.
3. **Place 5 is the interleave.** Returning to *same* only after *opposite* exists
   is where discrimination actually begins — and it is deliberately a synonym
   round, because place 5 is the rock wall, the one location with **no state
   flip** (`fxCheer` only draws sparkles). Synonym rounds do not need a flip; they
   need a consequence. The weakest asset now sits where it does least damage.
4. **Place 6 is the boss, per §1.4.** Mixed mode is where learning is
   demonstrated, so it goes last, and only once.

### The boss level, without a memory tax

Place 6 runs two rounds at the waterfall — one friend-round and one place-round,
in either order. It is genuinely mixed mode, but **the child still reads the
answer off the scene**: is a friend waiting, or is a stone lit? Discrimination
stays perceptual.

This matters. A boss level that asked *"was this one same or opposite?"* would add
working-memory load exactly where the task is already hardest. This one adds none
— it only removes the predictability of alternating.

---

## Two sentence frames. Only two. Ever.

Spoken every time, word for word, so the frame itself becomes a cue:

```
SAME      "<Name> says <word>. Carry a word that means the SAME to <Name>."
OPPOSITE  "The <place> is <word>. Carry the word that means the OPPOSITE."
```

Per §P5 both are audio-first; text is decoration. Stress falls on SAME /
OPPOSITE — those two words are the entire rule, and the child hears one of them
six times.

---

## What the wrong answers now tell you

Every round offers exactly one synonym, one antonym and one unrelated word —
unchanged from the current build. Flipping *which one is correct* turns the
existing distractor set into a **diagnostic instrument**:

| Round asks | Child picks | Reading |
|---|---|---|
| same | the antonym | **confused the two operations** — the signal worth counting |
| same | the unrelated | has not accessed the word's meaning at all |
| opposite | the synonym | **confused the two operations** — same signal, other direction |
| opposite | the unrelated | as above |

Before this change, picking the antonym in a synonym round was ambiguous — there
was no antonym task to confuse it with. Now the same click means something
specific, and it is measurable in both directions. Per §P3 none of it is
punished: the word is handed back and the round re-prompts.

---

## Cost to build

Small, because the existing content already fits.

- **A `want:'syn'|'ant'` field per level in `levels.js`.** `land()` already
  branches three ways on which word was chosen; it needs to compare against
  `r[r.want]` instead of always `r.syn`.
- **Reorder `L`** to `bridge, river, cave, tree, rockwall, falls`. `POCK` is
  positional, so the trail re-labels itself.
- **Vocabulary: no change at places 1–5.** The existing triples already carry one
  synonym, one antonym and one unrelated word, so places 3 and 4 become antonym
  rounds by flipping a flag — `dark → bright` and `empty → full` are already in
  the data. Place 6 needs its prompt swapped to `weak` and a synonym-of-weak
  distractor written (`tired`).
- **New art: the word-stone**, plus a lit state. One prop, per `docs/03` Block C.
- **A second round at place 6**, which `level(k)` does not currently support.

---

## Three things in the current build that this exposes

Flagged rather than fixed — each needs a decision, not a patch.

1. **Time-to-first-interaction is over budget.** §P7 sets it at under 20 seconds
   from cold open. The opening cinematic alone is ~7.5s, then intro tap → map tap
   → level load. Worth timing properly. The cinematic is skippable, but a
   first-time player does not know that. Consider opening the *first* run on place
   1 directly and moving the cinematic behind a "story" button.
2. **Scaffold fading has nowhere to happen.** §P4 wants support to decay across
   three items *inside* one session — picture + audio + highlight, then picture +
   audio, then audio only. The build has **one item per location**, six items
   total, so there is no room for the fade. Three items per location would give
   eighteen and make §P4 implementable.
3. **The cast does not match §6.1.** The research specifies one-character-one-domain
   (BASTA nouns, FLIP antonyms, ECHO synonyms); the build has Monty, Jhumru and Tez
   as an undifferentiated trio. Worth noting that the trio already encodes the
   antonym idea by accident — Monty is fast and loud, Tez is slow and calm and
   ironically named "fast." If domains are wanted without new characters, that pair
   is already sitting there.
