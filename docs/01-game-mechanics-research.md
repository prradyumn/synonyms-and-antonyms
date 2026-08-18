# Game Mechanics Doc — Grade 1–2 English
## Nouns · Synonyms · Antonyms
### Competitive teardown + mechanics library + proposed game set

*Version 0.1 — research draft for internal review*

---

## 0. How to read this doc

Sections 1–2 set the frame. Section 3 is the **teardown** — what already exists, organised by mechanic family, with links. Section 4 is the **mechanics library** — the reusable patterns extracted from that teardown. Section 5 is the **proposed game set** — 10 concrete games. Sections 6–9 cover character/animation systems, feedback juice, progression, and technical constraints. Section 10 is the full link appendix.

**Assumptions I've made — please correct these before we build on them:**

| # | Assumption | If wrong, what changes |
|---|---|---|
| A1 | Learners are Indian government/affordable-private school children, English as a second or third language, not native speakers | Vocabulary tiers, VO accent, cultural referents in art |
| A2 | Delivery is HTML5 in a mobile webview (SwiftChat-style) on low-end Android, not a native app store build | Asset budget, animation tech, offline behaviour |
| A3 | Sessions are short and self-directed — 3–6 min, possibly unsupervised, possibly on a shared/parent phone | No long onboarding, no account friction, no reliance on reading instructions |
| A4 | "A little context, then game" means a 10–15 second animated framing per game, not a narrative campaign | Character system is a *cast*, not a *plot* |

---

## 1. The pedagogical spine (this drives every mechanic)

Before picking mechanics, the three content areas need decomposing — because **each of the three has a fundamentally different logical shape, and that shape dictates which mechanics can work.** This is the single most important idea in this doc.

### 1.1 Nouns = **categorisation / containment**

A noun task is: *does this item belong in this set?* The logical operation is sorting. Every noun game in the market is a sorting game wearing a costume — vending machines, bins, nets, buckets. That's not a failure of imagination; it's the shape of the concept.

Grade 1–2 micro-skills, in teaching order:
1. Noun vs not-a-noun (naming word vs action word)
2. Person / place / animal / thing sub-categorisation
3. Common vs proper (+ capitalisation)
4. Singular vs plural (-s, -es, irregulars)
5. Concrete → abstract (deferred; too hard for G1–2 ESL)

Note the common practice of splitting "animal" out as a fourth bin alongside person/place/thing for early learners — the Noun Kingdom activity does exactly this, because 6-year-olds resist filing a dog under "thing." Worth adopting.

### 1.2 Antonyms = **polarity / transformation**

An antonym task is: *what is the inverted state of this?* The logical operation is a state flip. **This is the richest of the three for animation, and it is under-exploited in the market.** An antonym is literally a visible transformation you can perform on a character: big→small, wet→dry, awake→asleep, open→shut. The mechanic can *be* the meaning rather than pointing at it.

Almost every existing antonym game ignores this and uses generic word-matching. That's our clearest whitespace.

Picture-verifiable G1–2 pairs (the only ones that should ship in v1):
`big/small · tall/short · hot/cold · wet/dry · day/night · open/shut · up/down · in/out · fast/slow · happy/sad · old/new · full/empty · hard/soft · clean/dirty · loud/quiet · light/dark · push/pull · young/old · front/back · on/off`

### 1.3 Synonyms = **equivalence / many-to-one**

A synonym task is: *do these two different forms point at the same thing?* The logical operation is a many-to-one mapping. This is the **hardest of the three to animate**, precisely because both words resolve to the *same* picture — there's no visual delta to show. This is why every synonym game in the market defaults to memory/matching-pairs: it's the only mechanic that natively expresses "two tokens, one value."

The design answer is to use mechanics where **two distinct objects produce one identical outcome** — two keys open the same lock, two paths reach the same room, two ingredients make the same dish. The equivalence has to be demonstrated by *consequence*, not by appearance.

Picture-verifiable G1–2 pairs: `big/large · small/little · happy/glad · sad/unhappy · fast/quick · angry/mad · start/begin · shut/close · home/house · kid/child · mum/mother · road/street · cap/hat · sick/ill · smart/clever · pretty/beautiful · tired/sleepy · nice/kind`

> ⚠️ **Content flag:** most G1–2 synonym and antonym pairs are adjectives, not nouns. The three content areas don't sit in the same grammatical layer. Either the scope statement becomes "nouns + word relationships," or we constrain synonyms/antonyms to noun pairs only — which would shrink the usable word bank to maybe 20 pairs and make the games repetitive. **Recommend: allow adjectives, state it explicitly in the curriculum map.**

### 1.4 The contrast task (the one everyone skips)

The genuinely hard skill at G2 isn't "find the synonym" or "find the antonym" in isolation — it's **telling the two operations apart**. Given `big` and a choice of `large` / `small`, which relationship am I being asked for? Mixed-mode rounds are where real learning is demonstrated, and they should be the boss levels, not an afterthought. Two market products do this well as a combined mode: Arcademics' Furious Frogs (switchable antonym/synonym/homonym) and Learning Games for Kids' "Synonym or Antonym?".

---

## 2. Design principles adopted (with the evidence behind them)

**P1 — Intrinsic integration. The mechanic must carry the meaning.**
The core research finding here is Habgood & Ainsworth's *intrinsic integration* principle: learning improves when the content is delivered *through* the core mechanic rather than bolted alongside it. Later replication work attributes the effect to attention — players only attend to what the game task requires, so if the word relationship isn't load-bearing in the mechanic, it gets ignored. The failure mode has a name: "chocolate-covered broccoli," where gameplay is a reward wrapped around an unchanged quiz.
→ *Practical test for every mechanic below: if I replaced the English content with maths content and the game still worked identically, the integration is extrinsic and the design is wrong.*

**P2 — Animation is instruction, not celebration.**
The most-copied idea in early literacy apps is Endless Alphabet's: after the puzzle resolves, a short animation *illustrates the word's meaning*, and the narrator then states the definition. The animation is the teaching moment, not the confetti. Endless Wordplay extends this to a rhyming trio, with an animation that ties all three words into one sentence.
→ *Every correct answer in our games should trigger an animation that demonstrates the semantic relationship, not a generic star burst.*

**P3 — No-fail, low-stakes.**
Originator explicitly designs Endless Wordplay with no high scores and no fail states, and reviewers consistently name the refusal to punish as its core strength. Khan Academy Kids similarly has no game-over screens. For 6–8-year-old ESL learners with fragile English confidence, a red X is a retention event.
→ *Wrong answers get a gentle physical rejection (spit out, bounce back, slide off) + a re-prompt with a scaffold. Never a buzzer, never a score decrement, never a life lost.*

**P4 — Scaffold fading inside the level, not just across levels.**
Endless Wordplay's three-word structure is the cleanest example: word 1 shows ghosted letters in position, word 2 shows only the initial letter highlighted plus the previous word above as a model, word 3 shows nothing but keeps both prior words visible as reference. The support decays across three items in the same 90-second session.
→ *Adopt directly: item 1 of each set gives the picture + audio + highlight; item 2 gives picture + audio; item 3 gives audio only.*

**P5 — Audio-first, text-second.**
Non-negotiable for G1–2 ESL. Every instruction, every word, every feedback line must be spoken. Text is decoration until roughly G2 mid-year. Noun Kingdom's design notes flag audio read-alouds as the enabling feature for its Pre-K–G1 target.
→ *Use pre-recorded human VO in a neutral Indian English accent. Not TTS — TTS mispronounces and flattens prosody, which matters enormously for word-meaning acquisition.*

**P6 — Physical design for 6–8-year-olds.**
Nielsen Norman Group's segmentation puts 6–8 in a distinct band: developing motor skills, comfortable with tapping large targets, but drag gestures remain error-prone, especially fine-grained ones. Their guidance is large targets (roughly 2cm × 2cm minimum, double the adult recommendation), obvious affordances, and immediate response to every touch — because if a tap does nothing, kids tap harder, then disengage.
→ *Tap is the default input. Drag only where it is semantically meaningful (sorting into a bin, merging two objects) and always with generous snap tolerance and a tap fallback.*

**P7 — Autonomy in the shell, structure in the lesson.**
Khan Academy Kids' Library — letting the child pick freely — is repeatedly cited as a driver of engagement, alongside an adaptive path that adjusts pace. Teach Your Monster gets kids straight into play with no lengthy tutorial or assessment. Duolingo ABC's onboarding, by contrast, has been critiqued as a dozen-plus steps before first play, with drop-off risk.
→ *Time-to-first-interaction target: under 20 seconds from cold open. Avatar creation offered after the first win, not before.*

---

## 3. Competitive teardown — what actually exists

### 3.1 Noun games

| Product | Mechanic | Grade | What to take | What to avoid | Link |
|---|---|---|---|---|---|
| **Education.com — vending machine sort** | Objects dispensed; sort nouns vs verbs into slots | K–2 | Containment metaphor is instantly readable; the machine is a *reason* for sorting | Static art, no character | [education.com/games/common-nouns](https://www.education.com/games/common-nouns/) |
| **Education.com — noun/verb/adjective sorter** | Three-bin group sort | 1–3 | Three-bin ceiling is right for this age | Pure drill | [education.com noun hub](https://www.education.com/resources/games/english-language-arts/grammar-mechanics/parts-speech/nouns/) |
| **Noun Kingdom** | Sentence displayed, target noun highlighted, tap Person/Place/Animal/Thing bin. TTS read-aloud, 10 randomised items from a 20-item bank | PreK–1 | The **four-bin split with Animal separated out**; sentence context around the target word; randomised subset per session | TTS voice; no animation payoff | [onlinemathlearning.com/noun-game.html](https://www.onlinemathlearning.com/noun-game.html) |
| **Turtle Diary — G1 noun games** | Noun questions wrapped in arcade shells: monster truck race, ninja battle, basketball. Correct answers accelerate your vehicle; consecutive correct answers grant a power boost or a slowdown attack on opponents | 1 | **Streak-as-power** is a genuinely good motivator; multiplayer racing framing | Textbook chocolate-broccoli — the noun question has zero relationship to driving a truck | [turtlediary.com/games/first-grade/noun.html](https://www.turtlediary.com/games/first-grade/noun.html) |
| **iKnowIt — common nouns (Level A)** | Practice set with immediate feedback + progress tracking | 1 | Progress tracking model | Worksheet-with-a-skin | [iknowit.com/lessons/a-common-nouns.html](https://www.iknowit.com/lessons/a-common-nouns.html) |
| **TinyTap — nouns** | Drag-and-drop + interactive soundboards, user-authored | 1–2 | Soundboard idea — tap a noun, hear it, see it | UGC quality variance | [tinytap.com/activities/g2x21/play/nouns](https://www.tinytap.com/activities/g2x21/play/nouns) |
| **Twinkl KS1 noun pack** | Word search, top-trumps card game for irregular plurals, SPaG mystery | KS1 | **Top-trumps for irregular plurals** is a clever fit — card comparison forces attention to the form | Print-first | [twinkl KS1 nouns](https://www.twinkl.com/resources/grammar/word-classes-grammar-vocabulary-grammar-and-punctuation-english-key-stage-1-year-1-year-2/nouns-word-classes-grammar-vocabulary-grammar-and-punctuation-english-key-stage-1) |

**Verdict on nouns:** the category is saturated with sorting, and almost none of it has character animation or a semantic payoff. The bar is low. Our differentiator is making the *container itself* a character with personality and a reaction.

### 3.2 Synonym & antonym games

| Product | Mechanic | Grade | What to take | What to avoid | Link |
|---|---|---|---|---|---|
| **Arcademics — Furious Frogs** | Real-time multiplayer. Your frog sits on a lily pad; flies carrying words drift past; rotate and tongue-catch the fly whose word is the antonym of your prompt word. Most flies before the timer wins. Antonym / synonym / homonym modes | 1–5 | **Best-in-class integration in this category** — the "catching" verb maps to "capturing the matching word"; live multiplayer creates genuine urgency; mode switching supports the contrast task | Timer + competitive pressure is wrong for G1 ESL; text-only flies exclude non-readers | [arcademics.com/games/furious-frogs](https://www.arcademics.com/games/furious-frogs) |
| **Arcademics — Elephant Feed** | Same engine, synonyms; feed peanuts to your elephant | 1–5 | Feeding as an equivalence gesture; teacher can set public (global) or private (solo) | Same as above | [arcademics.com/games/elephant-feed](https://www.arcademics.com/games/elephant-feed) |
| **HelpfulGames — Synonyms** | Multi-level: find/identify/select/link, plus an 18-pair **memory** level with unlimited misses. Medals at 2 / 5 / 10 completions (bronze/silver/gold), knowledge points only on first completion | 1–6 | **Memory is the canonical synonym mechanic** — see §1.3; unlimited-misses design; medal tiers reward repetition without inflating score | 18 pairs is far too many for G1 (use 4–6); text-only | [helpfulgames.com/subjects/english/523-synonyms.html](https://www.helpfulgames.com/subjects/english/523-synonyms.html) |
| **Learning Games for Kids — Synonym or Antonym?** | Classify the relationship between a given pair | 2–4 | **The contrast task as its own game** — exactly the boss-level model we want | Bare interface | [learninggamesforkids.com — synonym or antonym](https://www.learninggamesforkids.com/vocabulary-games/synonyms/synonym-or-antonym.html) |
| **Wordwall — synonym/antonym community** | Same word list rendered as Gameshow Quiz, Match Up, Spin the Wheel, Balloon Pop, Flying Fruit, Open the Box, Group Sort, Matching Pairs | 2–4 | **The content-agnostic template model** — one word bank, many shells (see §4.6) | Templates are generic; no character, no semantic animation | [wordwall.net/en-us/community/synonym-and-antonym-games](https://wordwall.net/en-us/community/synonym-and-antonym-games) |
| **PBS LearningMedia — WordGirl synonym/antonym party game** | Collection-based classroom party game around building a richer vocabulary | K–2 | Brand-character framing for K–2 vocabulary; the collection loop | Classroom-bound, not digital-native | [pbslearningmedia — WordGirl](https://www.pbslearningmedia.org/resource/716428c4-c9f0-4f40-9fba-f6caa749b0f2/activity-synonyms-and-antonyms-wordgirl/) |
| **SplashLearn — G1/G2 synonyms & antonyms** | Standards-tagged worksheets and games, several using **image clues for synonym matching** | 1–2 | Explicit CCSS tagging per item — good model for our NCERT/state-board mapping; picture-clue matching for pre-readers | Mostly printables in this particular strand | [splashlearn G2 syn/ant](https://www.splashlearn.com/ela/synonyms-and-antonyms-worksheets-for-2nd-graders) · [G2 ELA games](https://www.splashlearn.com/ela-games-for-2nd-graders) |
| **Lucky Little Learners — shoes & socks card game** | Physical centre game: match a *pair of shoes* (synonyms) or a *pair of socks* (antonyms) | 2 | **Best metaphor I found in the whole search.** Shoes = identical pair; socks = the pair you always mismatch. Instantly communicates same-vs-opposite without explanation. Strongly recommend adapting | Physical only | [luckylittlelearners.com/synonyms-and-antonyms-activities](https://luckylittlelearners.com/synonyms-and-antonyms-activities/) |
| **Turtle Diary / EZSchool / Quia** | Grade-banded matching and quiz variants, commonly aggregated on school resource pages | K–4 | Coverage benchmark | Dated Flash-era design | [ERUSD antonyms game list](https://rve.erusd.org/apps/pages/index.jsp?uREC_ID=153370&type=d&pREC_ID=674383) |

**Verdict on syn/ant:** almost everything is text-on-text matching. **No one is animating the semantic relationship.** For antonyms in particular — where the relationship is inherently a visible transformation — this is a large, obvious gap.

### 3.3 Craft benchmarks — the character/animation bar

These aren't noun/synonym/antonym games. They're the products whose *feel* we're trying to match.

**Endless Alphabet / Endless Wordplay (Originator)** — [Endless Alphabet](https://apps.apple.com/us/app/endless-alphabet/id591626572) · [Endless Wordplay](https://www.originatorkids.com/endless-wordplay/) · [App Store](https://apps.apple.com/us/app/endless-wordplay/id727871636)
The reference standard. A word appears and is spoken; monsters scatter the letters; the child drags them back into ghosted slots. As soon as a letter is touched it *becomes* a creature with eyes and a mouth and vocalises its own sound. On completion the whole word is spoken, the letters dance, and a short film plays that dramatises the word's meaning, followed by the narrator's definition. Wordplay adds the Alphabot mascot and the three-rhyming-word scaffold structure described in P4.
**Steal:** letters/words as living creatures that react to touch; the definition-animation as the reward; the no-fail tone; the scaffold fade. Reviewers note the difficulty ramp can tip from "game" to "work" in later levels — watch that. ([Screenwise review](https://screenwiseapp.com/media/endless-wordplay-app) · [detailed scaffold breakdown](http://teachernorman.blogspot.com/2015/01/app-review-endless-wordplay.html) · [Pixelkin analysis](https://pixelkin.org/2015/02/05/anas-apps-endless-alphabet-and-endless-reader/))

**Teach Your Monster to Read (Usborne Foundation)** — [overview](https://www.teachyourmonster.org/teach-your-monster-to-read-overview/) · [Reading for Fun](https://www.teachyourmonster.org/reading-for-fun/) · [Common Sense review](https://www.commonsense.org/education/reviews/teach-your-monster-to-read)
The reference for *meta-progression*. Child builds a monster avatar in seconds, then plays adaptive mini-games across a map of eight islands. Rewards — including deliberately silly ones like underwear — are earned per island and equipped on the monster; some arrive via treasure chests. Notably, the reward can be **chosen before** the activity, which sharpens motivation. Developed with academics at Roehampton.
**Steal:** the map-of-islands progression; choose-your-reward-first; silly cosmetic rewards over abstract points; the "no tutorial, just play" cold open.
**Avoid:** reviewers consistently flag thin game variety and repetition — eight islands of similar activities gets old. Our answer is 10 mechanically distinct games, not one mechanic × 10 skins. ([review noting repetition](https://www.educationalappstore.com/app/teach-your-monster-to-read) · [craft review](https://smarterlearningguide.com/teach-your-monster-to-read-review/))

**Duolingo ABC** — [engineering blog on animation](https://blog.duolingo.com/a-good-read-building-duolingo-abc-for-android/) · [product teardown](https://screensdesign.com/showcase/learn-to-read-duolingo-abc) · [Common Sense](https://www.commonsensemedia.org/app-reviews/duolingo-abc-learn-to-read)
Their own engineering team is explicit that animation is used as an *educational* device — visualising the components of decoding step by step — and separately as intrinsic motivation: a mascot cameo mid-exercise, letters snapping into place, sparkle bursts on correct answers. The shell is a city map where each building is a lesson cluster; completing a lesson unlocks a book.
**Steal:** animation-as-explanation; map-as-progression; unlock-a-collectible-artefact on completion.
**Avoid:** the long onboarding; and for our age group, do not import adult-Duolingo streak pressure. ([streak system breakdown, for reference on what we're *not* doing](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f))

**Khan Academy Kids** — [Google Play](https://play.google.com/store/apps/details?id=org.khankids.android) · [Khan blog](https://blog.khanacademy.org/best-early-learning-apps-for-kids/)
A named cast with clear domain ownership — Kodi the bear as host, Ollo the elephant on phonics, Reya the red panda on stories and writing, Peck the hummingbird on numbers, Sandy the dingo on puzzles and memory. Adaptive learning path plus a free-choice Library. Rewards are character clothing and badges. No fail states.
**Steal:** **one character owns one skill domain.** This is the cleanest solution to "we need characters but not a story." Our three content areas map to three characters (see §6).

**Martha Speaks (PBS Kids / WGBH)** — [Word Spinner review](https://www.hbook.com/story/martha-speaks-word-spinner-app-review) · [minigame list](https://appydazeblog.com/2016/07/30/martha-speaks-word-spinner/) · [Dog Party](https://toucharcade.com/games/martha-speaks-dog-party) · [Common Sense](https://www.commonsensemedia.org/app-reviews/martha-speaks-dog-party)
The most directly relevant *vocabulary* precedent. Word Spinner is a board game: 1–4 players pick a dog piece, spin to select one of six minigames, and win a word-bone that advances them toward the doghouse; fail the timer and your dog stays put. The six games are mechanically varied — catapulting balls into word-labelled buckets, category naming, sorting a pile by category, word-association picture matching, acting out occupations, storytelling with sound effects.
Dog Party's Chow Time is a lovely example of P2: the child picks the plate matching a described attribute, then physically swipes the dog's tongue to lick it clean. The reward gesture is tactile and silly, and it's *about* the word.
Worth citing internally: a US Department of Education–funded study reported target vocabulary gains of up to 31% for children aged 3–7 over a two-week period of playing Dog Party. Reviewers specifically praise how the learning is integrated without interrupting the fun.
**Steal:** the board-game shell wrapping mechanically varied minigames — this is a strong alternative to an island map; the tactile silly reward gesture; "Stuff Sort" as a direct noun-categorisation mechanic.

**Prodigy English** — [official overview](https://prodigygame.zendesk.com/hc/en-us/articles/4415502214036-Overview-Prodigy-English) · [Common Sense Education](https://www.commonsense.org/education/reviews/prodigy-english) · [critical review](https://screenwiseapp.com/media/prodigy-english-game)
**Included as the cautionary example.** Sandbox village-building; the player chops, digs, crafts and decorates, spending **Energy**, which is replenished by answering multiple-choice ELA questions. Wishcoins reward daily and lifetime tasks.
The critique is worth quoting to the team in spirit: reviewers describe the ELA questions as annoying interludes to get through in order to return to the game, note the learning content feels like a side note, and observe that because a wrong answer can be freely changed while still earning credit, there's little incentive to attend. One review calls it a skill-drill platform in an RPG costume.
**This is exactly the failure mode P1 exists to prevent.** If our reward loop is "answer word questions to earn currency to do unrelated fun things," we have built Prodigy.

**Lingokids** — [Common Sense](https://www.commonsensemedia.org/app-reviews/lingokids-play-and-learn) · [Learning Counsel profile](https://thelearningcounsel.com/articles/app-of-the-week/the-playlearningtm-app-for-kids-ages-2-8-years-old/)
Relevant mainly for two reasons: it began life as an English-for-non-native-speakers product and still profiles children by English level (beginner/intermediate/advanced) at signup — a useful model for our ESL placement. And its character design was led by the creator of Pocoyó, which shows in the readability of the character silhouettes at small sizes.
**Steal:** English-level profiling at entry; high-contrast, simple-silhouette character design that survives a 5-inch screen.

### 3.4 Low-resource / India context benchmarks

**Chimple (Bengaluru)** — [XPRIZE team page](https://www.xprize.org/prizes/global-learning/teams/chimple) · [XPRIZE results](https://www.xprize.org/news/global-learning-xprize-two-grand-prize-winners)
Global Learning XPRIZE finalist; a tablet literacy/numeracy platform built around 60+ explorative games and 70 stories, designed for autonomous use by children without teacher support. **Open-sourced as part of the prize terms** — worth an engineering review of their game shell before we build ours. Field-tested in Tanzanian villages, and separately piloted in Indian low-income contexts by Central Square Foundation, where the operational learning was about teacher onboarding and nudge design as much as the app itself ([GPE writeup](https://www.globalpartnership.org/blog/how-can-edtech-support-learning-low-income-communities-lessons-india)).

**onebillion / onecourse & Enuma Kitkit School** — XPRIZE co-winners. Both open-source. onecourse's design premise — take a child from zero to reading confidently in their own language, on a low-cost dedicated device, with continuous monitoring driving adaptation — is the closest structural analogue to what a state-scale deployment looks like.

**Field constraint evidence** — recent HCI work on English-learning tools in multilingual low-resource Indian schools documents the recurring pattern: brief structured mobile activities do increase English exposure and can produce listening-comprehension gains, but outcomes are gated by connectivity and device access, and content has to be designed for those material conditions rather than retrofitted ([arXiv study](https://arxiv.org/pdf/2601.19304)). See also [EdTech Hub on mobile learning games for low-income children in India](https://docs.edtechhub.org/lib/LRN6BNM9).

---

## 4. Mechanics library

Extracted patterns. Each is annotated with which content area it fits and why.

### 4.1 Containment / sorting
*Drag or tap an item into one of 2–4 labelled receptacles.*
**Fits:** nouns (native fit). **Sources:** Education.com vending machine, Noun Kingdom bins, Wordwall Group Sort & Speed Sorting, Martha's Stuff Sort.
**Why it works:** the physical act of putting a thing in a place *is* categorisation. Intrinsically integrated by default.
**Design notes:** max 4 bins at G1, 3 is safer. Bins must be characters, not boxes. Wrong item = the bin rejects it physically (spits, sneezes, shakes head) — a reaction, not an error message.

### 4.2 Capture / catch
*Moving targets carry words; capture only the ones satisfying a relation.*
**Fits:** all three, best for antonyms and synonyms. **Sources:** Furious Frogs, Elephant Feed, Wordwall Flying Fruit / Balloon Pop / Whack-a-Mole.
**Why it works:** adds time pressure and motor engagement; capture reads as "this one belongs to me."
**Design notes:** motion speed must be tunable to near-zero for level 1. Combine word + icon on every target for pre-readers. Avoid a hard timer before G2.

### 4.3 State transformation / polarity flip ★
*The player's choice visibly transforms an object or character into its opposite state.*
**Fits:** antonyms — perfect fit, and **this is our whitespace.** **Sources:** none found in market as a primary mechanic; closest analogues are physics toys and Endless Alphabet's definition-animation.
**Why it works:** the answer *causes* the meaning to be enacted. Maximum intrinsic integration; maximum animation payoff.
**Design notes:** needs a rig capable of paired extreme states per character (see §6.3). Budget the animation properly — this mechanic lives or dies on the transform feeling delightful.

### 4.4 Equivalence / key-lock / merge ★
*Two visibly different objects produce one identical result.*
**Fits:** synonyms — the only mechanic family that genuinely expresses many-to-one. **Sources:** memory/matching-pairs everywhere (HelpfulGames' 18-pair level), Lucky Little Learners' shoes-and-socks card game, casual-game merge mechanics.
**Why it works:** demonstrates sameness through consequence rather than appearance, solving the "no visual delta" problem in §1.3.
**Design notes:** the *outcome* must be identical and visible — same door opens, same lamp lights, same shape forms. Make the identicality the punchline.

### 4.5 Balance / opposition
*Two forces resolve only when correctly paired.*
**Fits:** antonyms. **Sources:** Arcademics' tug-of-war style games (Giraffe Pull); playground seesaw metaphor.
**Why it works:** physical opposition is a body-level metaphor for semantic opposition. Kids already understand seesaws.

### 4.6 Content-agnostic template shell
*One word bank; many interchangeable presentation shells.*
**Source:** Wordwall's model — 34 interactive templates including Quiz, Match Up, Group Sort, Matching Pairs, Anagram, Maze Chase, Airplane, Balloon Pop, Whack-a-Mole, Flying Fruit, Gameshow Quiz, Open the Box, Spin the Wheel, Speed Sorting, plus instant conversion of the same content between templates. [Full template list](https://wordwall.net/features) · [how-to index](https://wordwall.zendesk.com/hc/en-us/sections/360005042778-Templates) · [mechanic-by-mechanic breakdown](https://eductive.ca/en/resource/create-gamified-interactive-reviews-with-wordwall/)
**Strategic implication for us:** build the **word-bank data layer once**, then render it through multiple game shells. This gives content teams enormous leverage — a new word list ships as ten new "games" without engineering work. **This should be an architectural requirement from day one, not a later refactor.**

### 4.7 Board / spinner meta-shell
*A path board; spin or roll to select which minigame you play next; advance on success.*
**Source:** Martha Speaks Word Spinner.
**Why it works:** wraps mechanically diverse minigames in one coherent frame, adds chance (which children love and which conveniently disguises adaptive selection), and supports 1–4 players on a shared device — relevant for shared-phone and classroom contexts.

### 4.8 Streak-as-power
*Consecutive correct answers grant an in-fiction power-up.*
**Source:** Turtle Diary's arcade shells (consecutive correct → boost / attack).
**Design notes:** good motivator, but only integrate it if the power is fictionally connected to the word work. Otherwise it's chocolate.

### 4.9 Reward-chosen-in-advance
*Show the prize before the activity; the child picks which one they're playing for.*
**Source:** Teach Your Monster. Cheap to implement, meaningfully raises engagement.

---

## 5. Proposed game set

Ten games across three characters. Each is specified for the same envelope: **60–90 second rounds, 8–12 items, 3–6 minute sessions.**

Format for each: *Mechanic family · Skill · Loop · Animation beat · Fail behaviour · Telemetry*

---

### NOUN games — hosted by **BASTA** (see §6)

#### N1. Three Hungry Mouths
- **Family:** 4.1 containment · **Skill:** person / place / animal / thing
- **Loop:** Three (G1) or four (G2) creature-heads sit along the bottom, each with a distinct silhouette and a spoken label. A card — picture + word — drifts down. Drag it into the right mouth, or tap the mouth (tap fallback).
- **Animation beat:** correct → the creature chews with visible relish, swallows, and *the picture reappears as a bulge travelling down its neck* before a satisfied belch. Each creature has a different eating personality: the Person-eater is dainty, the Thing-eater is a garbage-disposal.
- **Fail:** the creature purses its lips, turns its head away, and the card floats gently back up. The correct mouth then does a small attention-getting hop. Re-prompt with audio.
- **Telemetry:** per-category accuracy, latency, which pairs get confused (expect animal↔thing).

#### N2. Naming Net
- **Family:** 4.2 capture · **Skill:** noun vs not-a-noun, category filtering in context
- **Loop:** A living scene — village market, classroom, playground — with objects, people and animals drifting in a slow current. Narrator: *"Catch the animals."* Sweep a net over correct targets. Distractors are action-words attached to the same scene (`running`, `buying`).
- **Animation beat:** netted items pile visibly into a basket at the bottom; at round end the basket tips out and each item is named aloud in sequence with a tiny idle animation.
- **Fail:** wrong catch slips through the net with a comic *sproing*. No penalty.
- **Note:** scenes should be recognisably Indian — a kirana shop, an auto, a chalkboard classroom, a mango tree. Cultural referent familiarity is a comprehension variable, not decoration.

#### N3. Crown the Name (proper nouns)
- **Family:** 4.1 / transformation hybrid · **Skill:** common vs proper, capitalisation
- **Loop:** A townsperson or animal stands beside a signboard reading `dog`. The narrator says *"This dog's name is Moti."* The child drags a **crown** onto the first letter of the word.
- **Animation beat:** the letter grows into a capital and the crown settles onto it with a chime; the character puffs up proudly and does a name-announcement pose. Capitalisation is literally coronation. Wrong letter → the crown slides off comically.
- **Why it's good:** the abstract convention (proper nouns get capitals) becomes a single memorable physical image.

#### N4. The Copy Machine (plurals)
- **Family:** transformation · **Skill:** singular → plural, -s / -es / irregular
- **Loop:** One object goes into a Rube-Goldberg machine. Out come three. The word above must be updated — drag the `-s` or `-es` tile onto it, or for irregulars pick from two whole-word options (`mouse` → `mouses` / `mice`).
- **Animation beat:** the machine clanks, shudders, and ejects the copies with a comedy overshoot; the word visibly stretches to accommodate its new ending. Irregulars get a special "machine malfunction" gag — smoke, a confused beep — which flags them as exceptions in a way children remember.
- **Fail:** the machine produces something absurd (a mouse wearing a moustache) and resets with a shrug.

---

### ANTONYM games — hosted by **FLIP** ★ *flagship strand*

#### A1. Flip-It ★ **(lead title — build this first)**
- **Family:** 4.3 state transformation · **Skill:** core antonym recognition
- **Loop:** Flip stands centre-screen in a state: enormous. Narrator: *"Flip is BIG. Make him the opposite."* Three word-tiles appear (`small`, `tall`, `wet`). Tap the right one.
- **Animation beat:** **the mechanic is the meaning.** Flip squash-stretches down to thumb-size with an exaggerated anticipation and a whoosh; the camera zooms; the background props stay the same size so the contrast is unmistakable. Then the two states are shown side by side for a beat with both words spoken.
- **Fail:** the wrong word triggers a *partial, wrong* transformation that visibly doesn't match — pick `wet` and Flip gets rained on while staying big, then shakes off with a puzzled look, and the prompt repeats. **The wrong answer teaches too.** This is the strongest single idea in this document.
- **Progression:** L1 pictures + words + audio; L2 words + audio; L3 audio only; L4 the state is shown but *not named* — the child must infer both the current state and its opposite.
- **Telemetry:** per-pair accuracy, so we know which opposites are unstable.

#### A2. See-Saw
- **Family:** 4.5 balance · **Skill:** antonym pairing, mixed-mode discrimination
- **Loop:** A see-saw with a word fixed on the left. Three word-blocks on the right. Drop one on. The see-saw balances **only** for a true opposite; a synonym makes it slam down; an unrelated word makes it wobble and fall off.
- **Animation beat:** perfect balance → both characters float, a rainbow arcs, confetti. The physics *is* the feedback — no scoring UI needed.
- **Why it's good:** cleanly distinguishes three relationships (opposite / same / unrelated) through three distinct physical outcomes. This is the contrast task in physical form.

#### A3. Mirror Gate
- **Family:** 4.3 + traversal · **Skill:** applying opposites under mild pressure
- **Loop:** A short side-scrolling run. Flip hits a gate showing a word (`open`). Two doors ahead are labelled. Choose the opposite to pass. Get it right and Flip keeps running; get it wrong and he comically bounces off, gets back up, and tries again — no death, no restart.
- **Animation beat:** passing through the mirror gate briefly inverts the whole scene's palette and Flip's silhouette flips — a satisfying whole-screen event.
- **Note:** this is the closest thing to an "arcade" game in the set, and gives kids who want speed somewhere to go. Keep the run un-timed at L1.

#### A4. Day & Night
- **Family:** 4.3, environmental scale · **Skill:** antonym pairs in scene context
- **Loop:** A whole scene rather than a single character. A village at midday. Narrator: *"Make it the opposite of DAY."* Tap the right word and the entire environment transitions — sun sets, lamps light, shopkeepers close shutters, a dog curls up.
- **Animation beat:** the full-scene transition is the reward, and it's genuinely beautiful. Reuse the same scene across `day/night`, `full/empty`, `loud/quiet`, `clean/dirty`, `open/shut` — one scene, five antonym pairs, high asset reuse.
- **Cost note:** this is the most expensive game in the set per scene, but the reuse ratio is excellent.

---

### SYNONYM games — hosted by **ECHO**

#### S1. Twin Keys ★
- **Family:** 4.4 equivalence · **Skill:** core synonym recognition
- **Loop:** A locked door with a word carved into it (`big`). Four keys hang on a rack, each engraved with a word. **Two** of them fit — the target's synonyms (`large`, `huge`). Fit both to open the door.
- **Animation beat:** each correct key turns with a clunk; when both are in, the door swings open on the *same* room regardless of which key went in first — the identical outcome demonstrating equivalence (§1.3, §4.4). Wrong key won't enter the lock; it slides off with a scrape.
- **Why it's good:** "two different keys, one door" is the cleanest physical statement of what a synonym is that I could construct.

#### S2. Shoes & Socks
- **Family:** 4.4 + matching pairs · **Skill:** synonym/antonym contrast
- **Loop:** Directly adapted from the Lucky Little Learners centre game. A laundry line. Word-cards are pegged up as **shoes** (which must be matched into identical pairs = synonyms) or **socks** (matched into deliberately mismatched pairs = antonyms). The child sorts the whole line.
- **Animation beat:** a correctly paired set of shoes walks off the line together in step; a correctly paired set of socks argues, turns its back, and marches off in opposite directions.
- **Why it's good:** the metaphor carries the entire distinction with zero explanation, and the two animations dramatise "same" vs "opposite" better than any words could.

#### S3. Word Merge
- **Family:** 4.4 merge · **Skill:** synonym recognition, speed
- **Loop:** Word-orbs float in a tank. Drag two together. Synonyms merge into one larger, brighter orb with a satisfying pop; non-synonyms bounce apart. Clear the tank.
- **Animation beat:** merge juice — squash, flash, particle burst, pitch-rising chime. Merging is one of the most reliably satisfying gestures in casual mobile gaming; borrow it wholesale.
- **Design note:** 4–6 pairs per round, never 18 (contra HelpfulGames).

#### S4. Say It Another Way
- **Family:** 4.4 + sentence context · **Skill:** synonym substitution in context — the G2 stretch goal
- **Loop:** A short animated sentence plays out: *"The boy was very **happy**."* The highlighted word lifts out. Two replacements offered. Choose `glad` and the scene **replays identically** — meaning preserved. Choose `sad` and the scene **replays inverted** — the boy's face falls, the music sours.
- **Animation beat:** the replay is the whole point. The child sees, in the most direct way available, that a synonym leaves meaning intact while an antonym reverses it.
- **Why it's good:** this is the only game in the set that teaches *why synonyms matter* rather than just what they are, and it makes the contrast task visual instead of verbal. Expensive (needs two variants per sentence) — ship 8–10 sentences at launch, expand later.

---

### Coverage check

| Skill | Games |
|---|---|
| Noun identification | N1, N2 |
| Person/place/animal/thing | N1 |
| Common vs proper | N3 |
| Singular/plural | N4 |
| Antonym recognition | A1, A3, A4 |
| Antonym in context | A4, S4 |
| Synonym recognition | S1, S3 |
| Synonym in context | S4 |
| **Syn/ant contrast (boss skill)** | **A2, S2, S4** |

---

## 6. Character & animation system

### 6.1 Cast structure — one character owns one domain

Following the Khan Academy Kids model (Ollo→phonics, Reya→stories, Peck→numbers, Sandy→puzzles), which cleanly delivers character warmth without requiring narrative:

| Character | Domain | Design brief |
|---|---|---|
| **BASTA** | Nouns | A large, round, endlessly hungry creature made of pockets and pouches. Everything about it says *container*. Slow, warm, a bit dim, deeply pleased when fed correctly. |
| **FLIP** | Antonyms | A rubbery, high-energy character built for extreme deformation — the rig must support paired opposite states (huge/tiny, soaked/parched, awake/asleep, fast/frozen). Design the silhouette so both extremes read instantly at thumbnail size. |
| **ECHO** | Synonyms | A pair — or a character with a shadow/twin that copies it imperfectly. Two forms, one meaning, embodied. Playful sibling dynamic. |
| **A host** (optional) | Shell/map | Ties the three together, delivers the 10–15s context beats, celebrates milestones. Compare Kodi, Coco, Alphabot, Wishie. |

### 6.2 Why this replaces story

Their request was *"a little context and then actual games."* A named cast with clear domains gives you exactly that: a 10-second framing beat where the character states the goal in-fiction (*"Basta's hungry! Feed him only the animals."*), then straight into play. No plot to maintain, no cutscenes to skip, no localisation of narrative — but the child still has someone to play *with* rather than a menu to click.

### 6.3 Animation rig requirements

- **Paired extreme states** for FLIP — every antonym pair needs both poses. This is the single largest art dependency in the project; scope it early.
- **Reaction library per character**, minimum: idle, anticipate, correct-delight, gentle-reject, confused, celebrate-big, sleepy/attract-mode.
- **Squash-and-stretch as the house style.** It reads at small sizes, it's cheap in skeletal animation, and it's the visual language of "state change" — which is literally our antonym content.
- **Silhouette test:** every character must be identifiable in solid black at 80×80px. (This is where Lingokids' Pocoyó-lineage design succeeds.)
- **Definition animations** (P2): a short semantic animation for each antonym pair and each noun category. Budget these as *content*, not polish — they are the teaching, per the Endless Alphabet model.

### 6.4 Animation technology

Recommend **Rive** or skeletal/spine-style animation over frame-by-frame spritesheets. Runtime-driven skeletal animation lets you interpolate between paired states (essential for A1's transformations), keeps file sizes viable for a webview, and enables state-machine-driven reactions without shipping dozens of sprite atlases. Frame animation only for short, unique reward beats.

---

## 7. Feedback & juice spec

Every interaction gets a response within 100ms. Silence after a tap is the fastest way to lose a 6-year-old (NN/g: no response → tap harder → disengage).

**On touch-down:** target scales to 1.06, soft shadow lifts, quiet tick sound.
**On correct:**
1. 0–80ms — the object commits (snaps, latches, is swallowed)
2. 80–300ms — character reaction animation
3. 300–900ms — **semantic animation** (the transformation / the identical outcome / the eating)
4. 900–1400ms — VO names the word and the relationship: *"Big… small. Opposites!"*
5. Particle burst + rising-pitch chime. Pitch rises with streak length — a free, wordless streak indicator.

**On incorrect:** *no red, no X, no buzzer.* The object is physically rejected in-fiction (spat out, bounced, slid off), the character shows mild confusion, the correct target does a small attention hop, and the prompt repeats with one level more scaffold. Third attempt auto-scaffolds to two choices.

**Attract mode:** after ~6 seconds of inactivity, the character does an idle gag and the target gently pulses.

**Round end:** 3-star or 3-fruit summary — never a percentage, never a numeric score. Show which words were learned, with their pictures, spoken aloud.

**Sound budget:** everything must work with sound off (shared devices, classrooms, embarrassment). Every audio cue needs a visual twin.

---

## 8. Progression & meta-layer

**Shell:** a small map — village lanes or island cluster — following Teach Your Monster's islands and Duolingo ABC's city-map pattern. Three districts, one per character/domain. Nodes light up as unlocked.

**Alternative worth prototyping:** Martha's Word Spinner board-and-spinner shell, which hides adaptive selection inside a chance mechanic and naturally supports 2–4 players on one device. Given shared-phone realities in our context, this may outperform a map.

**Rewards:** cosmetic items for the characters — hats, patterns, silly accessories. Teach Your Monster's evidence is that mildly ridiculous rewards (the underwear) outperform tasteful ones, and that **letting the child choose the prize before playing** sharpens motivation. Adopt both.

**Explicitly not adopting:** streaks with loss-aversion pressure, leaderboards, energy gates. The first two are inappropriate for 6-year-olds; the third is the Prodigy trap.

**Adaptivity:** per-word mastery tracking with spaced re-exposure. A word is retired after 3 correct responses across 2+ separate sessions, and re-injected after ~7 days. Confusion pairs (from telemetry) get deliberately co-presented once mastery is partial.

**Session shape:** 3 games per session, 60–90s each, drawn from at least 2 domains. Hard-stop suggestion at ~12 minutes with a warm "come back tomorrow" beat.

---

## 9. Technical constraints (per assumption A2)

| Constraint | Target |
|---|---|
| Initial payload | ≤ 3 MB; ≤ 1.5 MB for the shell |
| Per-game lazy load | ≤ 800 KB |
| Time to first interaction | ≤ 20 s cold, ≤ 5 s warm |
| Input latency | < 100 ms tap-to-visible-response |
| Frame rate | 60fps target, 30fps floor on 2 GB RAM Android Go |
| Renderer | PixiJS or Phaser 3 (WebGL with Canvas fallback) |
| Animation | Rive / skeletal; frame animation only for unique beats |
| Audio | Pre-recorded human VO, Indian English; compressed; preloaded per game; full visual redundancy when muted |
| Offline | Games cached after first load; progress queued locally and synced |
| Orientation | Portrait-first (webview reality), landscape optional |
| Touch targets | ≥ 2 cm; tap primary, drag with generous snap + tap fallback |
| Text | Never load-bearing. Every word is also a picture and a voice. |

---

## 10. Open questions for the team

1. **Grammatical scope** — do we allow adjective synonym/antonym pairs (recommended) or constrain to nouns only? (§1.3)
2. **Shell choice** — map (Teach Your Monster / Duolingo ABC) or board-and-spinner (Martha)? The latter handles shared devices better.
3. **Multiplayer** — Arcademics' live multiplayer is a strong hook but assumes connectivity. Local pass-and-play may be the right compromise.
4. **Word bank ownership** — who authors and reviews the 200–300 item bank, and against which board's syllabus?
5. **Art capacity** — FLIP's paired-state rig is the critical path. Do we have the animation bandwidth, or does A1 need scope reduction?
6. **Build-first candidate** — my recommendation is **A1 Flip-It**, because it's the clearest whitespace, the strongest demonstration of intrinsic integration, and the best showcase of the animation-led approach. Second: **S1 Twin Keys**.

---

## 11. Link appendix

### Noun games
- Education.com — noun games hub · https://www.education.com/resources/games/english-language-arts/grammar-mechanics/parts-speech/nouns/
- Education.com — common nouns / vending machine sort · https://www.education.com/games/common-nouns/
- Education.com — Grade 1 noun games · https://www.education.com/resources/grade-1/games/english-language-arts/grammar-mechanics/parts-speech/nouns/
- Turtle Diary — Grade 1 noun games (arcade shells) · https://www.turtlediary.com/games/first-grade/noun.html
- Noun Kingdom — person/place/animal/thing sorter · https://www.onlinemathlearning.com/noun-game.html
- iKnowIt — common nouns Level A · https://www.iknowit.com/lessons/a-common-nouns.html
- TinyTap — nouns · https://www.tinytap.com/activities/g2x21/play/nouns
- Twinkl — KS1 nouns pack · https://www.twinkl.com/resources/grammar/word-classes-grammar-vocabulary-grammar-and-punctuation-english-key-stage-1-year-1-year-2/nouns-word-classes-grammar-vocabulary-grammar-and-punctuation-english-key-stage-1
- Firstieland — first grade noun activities · https://firstieland.com/noun-activities-for-first-grade-kids/

### Synonym & antonym games
- Arcademics — Furious Frogs (antonyms, multiplayer) · https://www.arcademics.com/games/furious-frogs
- Arcademics — Elephant Feed (synonyms) · https://www.arcademics.com/games/elephant-feed
- Arcademics — full game catalogue · https://www.arcademics.com/
- HelpfulGames — Synonyms (memory + medals) · https://www.helpfulgames.com/subjects/english/523-synonyms.html
- Learning Games for Kids — Synonym or Antonym? · https://www.learninggamesforkids.com/vocabulary-games/synonyms/synonym-or-antonym.html
- Wordwall — synonym/antonym community activities · https://wordwall.net/en-us/community/synonym-and-antonym-games
- PBS LearningMedia — WordGirl synonym & antonym party game (K–2) · https://www.pbslearningmedia.org/resource/716428c4-c9f0-4f40-9fba-f6caa749b0f2/activity-synonyms-and-antonyms-wordgirl/
- SplashLearn — G2 synonyms & antonyms · https://www.splashlearn.com/ela/synonyms-and-antonyms-worksheets-for-2nd-graders
- SplashLearn — G1 synonyms & antonyms · https://www.splashlearn.com/ela/synonyms-and-antonyms-worksheets-for-1st-graders
- SplashLearn — G2 ELA games · https://www.splashlearn.com/ela-games-for-2nd-graders
- Lucky Little Learners — shoes & socks card game · https://luckylittlelearners.com/synonyms-and-antonyms-activities/
- Smiling & Shining in Second Grade — G2 syn/ant activity roundup · https://smilingandshininginsecondgrade.com/2025/01/antonyms-and-synonyms.html
- Cokogames — Furious Frogs (playable mirror) · https://www.cokogames.com/synonyms-and-antonyms-furious-frogs-by-arcademics/
- ERUSD — curated antonym game list · https://rve.erusd.org/apps/pages/index.jsp?uREC_ID=153370&type=d&pREC_ID=674383

### Craft benchmarks — characters, animation, feel
- Endless Alphabet (App Store) · https://apps.apple.com/us/app/endless-alphabet/id591626572
- Endless Wordplay (Originator) · https://www.originatorkids.com/endless-wordplay/
- Endless Wordplay (App Store) · https://apps.apple.com/us/app/endless-wordplay/id727871636
- Endless Wordplay — scaffold-fade breakdown · http://teachernorman.blogspot.com/2015/01/app-review-endless-wordplay.html
- Endless series — design analysis · https://pixelkin.org/2015/02/05/anas-apps-endless-alphabet-and-endless-reader/
- Endless Wordplay — critical review · https://screenwiseapp.com/media/endless-wordplay-app
- Teach Your Monster to Read — overview · https://www.teachyourmonster.org/teach-your-monster-to-read-overview/
- Teach Your Monster — Reading for Fun · https://www.teachyourmonster.org/reading-for-fun/
- Teach Your Monster — Common Sense Education review · https://www.commonsense.org/education/reviews/teach-your-monster-to-read
- Teach Your Monster — craft review · https://smarterlearningguide.com/teach-your-monster-to-read-review/
- Teach Your Monster — review noting repetition risk · https://www.educationalappstore.com/app/teach-your-monster-to-read
- Duolingo ABC — engineering blog on animation as instruction · https://blog.duolingo.com/a-good-read-building-duolingo-abc-for-android/
- Duolingo ABC — product teardown · https://screensdesign.com/showcase/learn-to-read-duolingo-abc
- Duolingo ABC — Common Sense review · https://www.commonsensemedia.org/app-reviews/duolingo-abc-learn-to-read
- Duolingo streak system breakdown (reference for what we're *not* doing) · https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f
- Khan Academy Kids (Google Play) · https://play.google.com/store/apps/details?id=org.khankids.android
- Khan Academy — early learning app design notes · https://blog.khanacademy.org/best-early-learning-apps-for-kids/
- Martha Speaks Word Spinner — Horn Book review · https://www.hbook.com/story/martha-speaks-word-spinner-app-review
- Martha Speaks Word Spinner — six-minigame breakdown · https://appydazeblog.com/2016/07/30/martha-speaks-word-spinner/
- Martha Speaks Dog Party — feature list + efficacy study note · https://toucharcade.com/games/martha-speaks-dog-party
- Martha Speaks Dog Party — Common Sense review · https://www.commonsensemedia.org/app-reviews/martha-speaks-dog-party
- PBS Kids — Martha Speaks apps hub · https://montanapbs.org/parents/martha/mobileapps/index.html
- Prodigy English — official mechanics overview · https://prodigygame.zendesk.com/hc/en-us/articles/4415502214036-Overview-Prodigy-English
- Prodigy English — Common Sense Education critique · https://www.commonsense.org/education/reviews/prodigy-english
- Prodigy English — "skill-drill in an RPG costume" critique · https://screenwiseapp.com/media/prodigy-english-game
- Lingokids — Common Sense review (ESL origins, level profiling) · https://www.commonsensemedia.org/app-reviews/lingokids-play-and-learn
- Lingokids — character design lineage · https://thelearningcounsel.com/articles/app-of-the-week/the-playlearningtm-app-for-kids-ages-2-8-years-old/

### Mechanic template libraries
- Wordwall — full template list (34 interactive) · https://wordwall.net/features
- Wordwall — per-template how-to index · https://wordwall.zendesk.com/hc/en-us/sections/360005042778-Templates
- Wordwall — mechanic-by-mechanic breakdown · https://eductive.ca/en/resource/create-gamified-interactive-reviews-with-wordwall/

### Research & design theory
- Intrinsic integration — replication study with attentional mechanism (ACM) · https://dl.acm.org/doi/pdf/10.1145/3549503
- Educational game design: elements for promoting engagement (arXiv, full bibliography incl. Habgood & Ainsworth 2011) · https://arxiv.org/pdf/1709.09931
- "Chocolate-covered broccoli" — critique of extrinsic gamification · https://screenwiseparenting.substack.com/p/chocolate-covered-broccoli-games
- Extrinsically integrated in-game quizzes — empirical study · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8417244/
- Taxonomy of motivation and game design · https://instructionaldesignfusions.wordpress.com/2011/08/20/a-taxonomy-of-motivation-and-game-design/

### Child UX research
- NN/g — designing for kids' physical development (touch targets, drag difficulty) · https://www.nngroup.com/articles/children-ux-physical-development/
- NN/g — designing for kids' cognitive development · https://www.nngroup.com/articles/kids-cognition/
- NN/g — children's usability issues, 3–5 / 6–8 / 9–12 segmentation · https://www.nngroup.com/articles/childrens-websites-usability-issues/
- NN/g — UX Design for Children report (156 guidelines) · https://www.nngroup.com/reports/children-on-the-web/
- UXmatters — UX design for kids, key considerations · https://www.uxmatters.com/mt/archives/2020/01/ux-design-for-kids-key-considerations.php

### Low-resource & India context
- Global Learning XPRIZE — winners and open-source release · https://www.xprize.org/news/global-learning-xprize-two-grand-prize-winners
- Chimple (Bengaluru) — XPRIZE team page · https://www.xprize.org/prizes/global-learning/teams/chimple
- Global Partnership for Education — Chimple deployment lessons in India · https://www.globalpartnership.org/blog/how-can-edtech-support-learning-low-income-communities-lessons-india
- EdTech Hub — mobile learning games for low-income children in India · https://docs.edtechhub.org/lib/LRN6BNM9
- Voice-based English practice in multilingual low-resource Indian schools (arXiv) · https://arxiv.org/pdf/2601.19304

---

*Prepared as a research draft. Sections 1–4 are evidence-backed; Sections 5–9 are design proposals that should be prototyped and playtested before commitment. Recommend paper-prototyping A1 (Flip-It) and S1 (Twin Keys) with 6–8 children before any production art is commissioned.*
