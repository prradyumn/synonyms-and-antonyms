and meets moneky at foinal scene monkey comes from right secondly audios are stillnot audible # Four options without four times the load

The gates prototype tops out at two lanes. This is how to get to **four** options
without making the game harder to think about.

---

## The move that makes four cheap

Four options is only expensive if the child has to **scan all four and compare
them against each other**. That is what a four-tile MCQ does, and it is genuinely
worse than three tiles.

The fix is to present four but ask for **one decision at a time**:

| costly | cheap |
|---|---|
| four tiles side by side, pick one | four options you reach **in sequence**, judging each as you arrive |
| all four must be held in mind | the one in front of you is the only one that matters |
| wrong answer = a mark | wrong answer = a physical, non-punishing result that **says the word aloud** |
| time pressure | options stay put; think as long as you like |

So: **spatial persistence, sequential approach, physical consequence.** Get those
three right and four options costs barely more than two, because the child never
holds more than one comparison at a time.

### What four slots buy pedagogically

Three options force one synonym, one antonym, one unrelated. Four let you run:

- **1 synonym · 1 antonym · 2 unrelated** — the unrelated pair gives a much
  cleaner read on whether the word's meaning was accessed at all
- **2 synonyms · 1 antonym · 1 unrelated** — "find both twins", which teaches that
  a word has *many* equivalents, not one partner. This is `docs/01` §1.3's
  many-to-one shape made explicit, and three options cannot express it

Either way the diagnostic sharpens: picking the antonym still means *confused the
two operations*, picking an unrelated word still means *no meaning access* — but
now you get two independent chances to observe each.

---

## 1 · The rock wall climb ★ *recommended*

**Uses `rockwall`** — currently the weakest location in the game. `fxCheer()` only
draws sparkles; answering correctly changes nothing. This replaces it entirely.

**The action.** Jhumru and Monty stand at the foot of the wall. Four handholds are
within reach above them, each with a word cut into the rock. Tap one. If it holds,
he pulls up and four *new* holds come into reach. If it does not, it crumbles to
dust, he stays exactly where he is, and the hold says its own word.

Reaching the top is the level.

**Why it carries the meaning.** The word is the thing bearing your weight. A word
that means the same holds; a word that means the opposite gives way. Progress is
*height* — the child can see how far the words have taken them, which is a far
better progress meter than a counter.

**Why the load stays low.**
- Only the next move matters. Four holds are visible, but they are alternatives
  for one step, not a set to be sorted.
- Nothing moves and nothing is timed. A child can stare at it.
- Crumbling is not a punishment — it removes a wrong option and speaks the word,
  so the board gets *easier* while the child learns something. Wrong answers
  strictly help, which is §P3 taken seriously rather than just avoiding a red X.
- One tap on a large target. No drag, no release accuracy (§P6).

**Handles both operations** with no new rule: `want:'syn'` asks which hold means
the same, `want:'ant'` which means the opposite, and the prompt word is carved on
the boulder he is standing on.

**Cost.** One handhold prop with a crumble state, plus a climb pose. No new
background.

---

## 2 · Four stepping stones

**Uses `river_deep` → `river_shallow`.**

**The action.** Four stones in the water, each with a word. Step on the ones that
mean the same to cross. A wrong stone tips and sinks, he hops back to the bank
dry, and the stone says its word before bobbing up again.

**Why it works.** Crossing water has natural stakes without any threat. And it is
the one mechanic here that **needs more than one correct answer** — with two
synonyms among the four you must find both to complete the path, which is exactly
the many-to-one idea §1.3 says is hard to show.

**Load.** Sequential by construction: you can only reach the next stone from the
one you are on. Low.

**Cost.** A stone prop with a sinking animation. The river pair already exists.

---

## 3 · Four cave mouths

**Uses `cave`.**

**The action.** Four openings in the rock face, a word above each. Walk into one.
Wrong, and it is a shallow dead end — a bat flaps out, he walks back, the word is
spoken. Right, and the fireflies come in and light the passage through.

**Load: the lowest on this list.** Nothing moves, nothing is timed, the four
options are large and spatially distinct, and the choice is a single walk. The
closest thing here to zero pressure.

**Best for the first four-option level**, precisely because it is the calmest.

**Cost.** Four openings painted into the cave plate — one art edit, no props.

---

## 4 · Shake the tree

**Uses `tree` + `fxFruit()`.**

**The action.** Four fruits hang on the branch, each with a word. Swipe to shake
the tree. The right fruit falls; the wrong ones cling on. Keep shaking.

**Why it is interesting.** The child's input is not *choosing*, it is *shaking* —
the game does the choosing and shows the child what the words mean by which fruit
lets go. Nearly impossible to get wrong, which makes it a good **first
introduction** to a new word set before anything is asked of them.

**Load.** Very low, but so is the challenge — this is a teaching beat, not a test.

**Cost.** A fruit prop with a label, and `fxFruit()` already exists.

---

# 5 · One screen, no levels ★ *if you want to drop the trail entirely*

Everything above still assumes a trail of locations. This one does not.

**The whole game happens at the Word Tree.** One background. No map, no level
transitions, no camera moves, ever.

**The action.** Four fruits hang on the branch, each carrying a word. A friend
stands beneath and asks. Pick the fruit that means the same (or the opposite) and
it drops into the basket — and the tree visibly grows: bare, then buds, then
leaves, then blossom, then small fruit, then heavy with it. Pick wrong and the
fruit stays on the branch and says its own word. Four new words appear. Repeat.

**Progress is the tree.** Not a counter, not a map, not a row of pips — the child
can see how far they have got by looking at the tree, and the finished tree *is*
the reward.

### Why the load is lower than anything else here

- **No re-orientation.** A new location is a new image to read: where is the
  ground, who is here, what has changed. The child learns one screen once and then
  never spends attention on the screen again.
- **No navigation.** No map, no "where am I", no transitions, nothing to lose your
  place in.
- **The only things that change are the four words and who is asking.** All the
  attention that was going into reading a new scene goes into the words instead.
- **Progress is ambient.** Nothing to track, nothing to remember.

### It is also the premise, literally

`docs/05` says the Tree has been dropping its words and a place that loses its
word forgets how to be itself. Putting words back **onto the tree** and watching it
come alive is not a metaphor for the premise, it is the premise. That is
`docs/01` §P1 satisfied about as directly as it can be.

### Variety without new screens

| lever | gives you |
|---|---|
| six tree states, bare → laden | visible change every round |
| the asker rotates: Monty, Jhumru, Tez | a different voice and face each time |
| light shifts morning → late gold | a sense that a day is passing |

### What it costs, and what it deletes

**Costs:** the clearing plate you already have, a labelled fruit prop, and five
more tree states (`fxFruit()` already does the last one).

**Deletes:** the map screen, `POCK`, every level transition, and the hard
dependency on six painted locations. `river_deep`, `rockwall`, `cave` and the
rest become optional scenery rather than required art.

### The honest trade

You lose the journey. Six places on a trail is a real motivator — the map, the
pins lighting up, the sense of travelling somewhere. Trading that away for calm is
a genuine loss, not a free win.

**The reconciliation:** the opening cinematic already delivers the journey. He
rides in, crosses the bridge, arrives at the clearing and meets Monty. Let that be
the travel — once, at the start — and then let the game itself settle at one
screen. The child has *been* somewhere; they just do not have to keep going
somewhere while also learning words.

---

## Recommendation

| | mechanic | four options | load | immersion | uses existing art | cost |
|---|---|---|---|---|---|---|
| 1 | **Rock wall climb** | natural | low | **highest** | `rockwall` | prop + pose |
| 2 | Stepping stones | natural, **2 correct** | low | high | river pair ✅ | prop + anim |
| 3 | Cave mouths | natural | **lowest** | medium | `cave` | one art edit |
| 4 | Shake the tree | natural | lowest | medium | `tree` ✅ | prop |
| 5 | **One screen, no levels** | natural | **lowest** | medium | clearing ✅ | prop + tree states |

**Build the rock wall climb first.**

It is the most immersive of the four, it handles both operations with no extra rule
for the child to remember, and it replaces the one location that currently has no
transformation at all — so it improves the weakest part of the game rather than
adding a seventh thing to maintain.

Its best property is what happens when the child is wrong: the hold crumbles, the
word is spoken, and the puzzle gets easier. A mechanic where being wrong is
actively useful is rarer than it sounds, and it is the strongest argument for this
one over the other three.

**Then the cave mouths**, as the gentlest possible introduction to four options,
placed *before* the climb in the trail order.

**What not to do:** do not put four tiles on the vine. Four simultaneous choices
with no spatial meaning is the one version of this that is genuinely worse than
what the game has now.
