# The Nudge Authoring Spec

**The canonical authoring contract for nudge-native encounters**, in the locked THR-883
format. THR-774 (WS1) established this document; the 2026-07-30 THR-883 prototype
sessions locked the format it now records: the communication pivot, setting envelopes
(THR-884), and the card system (THR-885), with the card library progression designed in
`Docs/plans/2026-07-30-nudge-card-repertoire.md`.

Both authoring skills load this file: `encounter-pipeline` (branching encounters) and
`template-encounter-rewrite` (linear templates). They differ in structure, scale, and
orchestration; they do **not** differ on anything in this document. If the two skills
ever appear to disagree about a rule below, this file wins.

- Executable half: `src/engine/__tests__/nudgeModel.test.ts` § *golden exemplar*.
- Worked example: `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`
  (The Swollen Ford — supersedes the pre-pivot Darkhollow Vault).
- Tunable numbers: `src/data/content-eval/nudgeAuthoringConstants.ts`.
- Card-type catalog: `public/nudge-cards-reference.html` (the wiki page where the
  21-type library and the Repertoire are iterated) +
  `Docs/plans/2026-07-30-encounter-authoring-frameworks.md` § Decision 3.

Read the exemplar before authoring. Every rule here is visible in it once.

---

## What a nudge is

> The god acts in the physics of the scene, never in the dramaturgy of the story.

A **nudge** is an authored, essence-priced card the god may play into an *attended*
encounter step. It shifts the odds. **Fate still picks the outcome.**

This is the line that governs every card you write. A stumble at the right moment, an
unnaturally good mood, a spark of light in a dark room, a surge of strength on a climb —
these are nudges. "Forge the truth" and "Temper the narrative" are not: choosing between
authored futures for a mortal is the rejected model this one replaced (program ruling,
`Docs/plans/2026-07-26-nudge-model-encounter-system.md`). The player must never pick an
ending.

**Terminology — riders vs band fragments.** These are different things and the words are
not interchangeable:

| Term | What it is | Where it lives |
|---|---|---|
| **rider** | A mechanical remap of the resolved band (`no_crit_fail`, `floor_at_cost`, `all_or_nothing`). Deterministic, zero PRNG draws, at most one applies. | `StepNudge.rider` |
| **band fragment** | A line of prose appended to the step's outcome text when this nudge was active for that band. | `StepNudge.bandProse[outcome]` |

A rider changes what happened. A fragment says the god was there when it did.

---

## The communication pivot — prose does the scene, cards do the rules

Locked 2026-07-30 (Christian: "we have tried and failed enough to pivot"). Card prose
that tried to carry the scene read as euphemistic mood even when every detector passed.
So the jobs are split:

- **Prose does the scene.** The openings, the step spine, the stake block, and the
  outcome prose (base text + band fragments) are fully written, scene-built, and carry
  all the fiction.
- **Cards do the rules.** A card face is **generic and reusable** — the same face reads
  correctly in any encounter its type fits. Zero scene-bespoke prose on the face.

The card face and how the schema carries it:

| Card element | Field | Rule |
|---|---|---|
| Picture | `imageTag` | One generic image per library card; fallback chain ends at a type icon on a tinted band |
| Keyword + icon | *(code comment until THR-887 lands the library schema)* | The card's library type — player-facing vocabulary |
| Title | `name` | 2–4 generic words, reusable everywhere ("Steady Breath", "Pay It Later") |
| Cost | `essenceCost` + `costs` | Essence pips · free · alternate channels (detection, doom, obligation) |
| Effect | `effectLine` | **One plain mechanical sentence: what the god does and why that moves the odds.** No digits, no `%` — the pip row renders magnitude |
| Flavor quote | `fiction` | One short generic line, the card's only prose |

**The effect line states mechanism, not mood** (checklist Q14). Eldritch Horror register:
"Send restful dreams — you quiet their mind while they sleep, so the rest actually
counts." Take the space the reasoning needs; never take refuge in atmosphere.

**Grounding moved from prose to binding** (checklist Q13). A generic card is grounded
because it *acts on* a target the scene established — the light on the water, the rope,
the opposition — and because dealing is self-grounding: under THR-887, cards carry typed
text slots (`{condition}`, `{host}`, `{target}`) and **target selectors** resolved at
deal time; a card whose selector binds to nothing is not dealt. Until the library data
model lands, authored hand instances name their targets directly (the exemplar's Balm
names the condition it lifts) — but write every face as if it were already a library
card, because the retrofit will make it one.

**Band fragments stay bespoke.** They render in the *outcome prose*, never on the card
face — they are the scene's account of the god's hand, so they are written per encounter
like the rest of the scene.

**Odds are pips, authored as raw numbers.** `forecastDelta` and the cost deltas stay
numeric in data; the UI renders the approved pip vocabulary (five pips per color tier at
~5% steps — green circles, blue squares, purple diamonds, gold stars, red down-triangles
for penalties; see the wiki page). The pivot changes no part of the no-digits rule for
`effectLine`.

---

## The scene-writer's checklist (14 questions + the envelope question)

Locked 2026-07-30 (frameworks plan § Decision 1). Every encounter's prose is validated
against these before it ships. The authoring agent answers each **in writing, per
scene** — the exemplar's header comment is the template; any "no" means rewrite first.

**A. Build the scene, in this order**
1. *Where are we?* Place described concretely enough to sketch — ground, structures,
   light — before anything else happens.
2. *How does it feel?* At least two senses beyond sight: sound, smell, temperature, the
   hour.
3. *Who is here?* Everyone present or implied is shown or accounted for. If a fire is
   lit, we know who lit it.
4. *What must we know?* Relevant context — why the character is here, what state they're
   in — before it matters.
5. *Does the complication come last*, landing on a scene already built?

**B. Internal logic**
6. *Nothing referred to before it's introduced.* Every object/person/feature a sentence
   uses already exists in the text.
7. *Every event has a visible cause.*
8. *Nothing contradicts what's established* — time of day, weather, who's present, what's
   in hand.

**C. Human realism, fantasy-adjusted**
9. *Would a real person in this world do this?* Strangers' camps aren't walked into;
   doors are knocked on; space has owners.
10. *Do people react to each other like people?* Greetings, wariness, permission,
    obligation.
11. *Do actions carry their true cost* — fatigue, hunger, fear, time?

**D. The interactive layer**
12. *Can the player restate the stake in one sentence* — what's being decided, what a
    good and a bad outcome each concretely look like? (Stake lines are several sentences
    and concrete — "will the rest take?" is too thin.)
13. *Is every card grounded?* It acts on a target the scene established — deleting the
    card's target from the prose should make the card senseless in this hand.
14. *Does every card state mechanism, not mood?* What the god does, and why that moves
    the odds, in the plain mechanical `effectLine`.
15. *Does every setting class the envelope declares have an opening written for it?*
    (Enforced by `validateSettingEnvelope` — build-time, fail loud.)

---

## Setting envelopes (THR-884)

Authors never touch the 20-subtype list. Declare a **setting envelope** from the closed
8-class vocabulary (`src/data/settingClasses.ts`): `rural · urban · stronghold · sacred ·
arcane · ruin · wayside · battlefield`. One table expands classes to subtypes; the
existing cache filter enforces it unchanged.

- **Write toward the widest honest envelope** (Christian's explicit direction:
  flexibility is the default, enforced by prose, never by narrowing).
- **One opening per declared class** (~1 paragraph, scene word budget). Checklist
  questions 1–4 live in the opening; the complication, stakes, and hand are
  setting-neutral. The spine below the opening may not name class scenery.
- **Per-card `fictionBySetting`** for the rare card whose flavor quote names class
  scenery — one line per declared class, generic quote as default. Post-pivot most cards
  never need it.
- **Exact-subtype override** (`locationTypes`) remains for genuinely specific encounters
  (a temple rite).
- **Raw entries** declare `settings` + `openings` and the converter derives
  `locationSubtypes` and compiles openings onto the reserved `opening` fragment slot.
  Direct-authored templates derive the subtype list with `expandSettings()` — never by
  hand (the exemplar shows this).
- **Coverage matrix** (THR-884 generator + committed report): settings × reaches →
  drawable-template counts plus per-family card-type composition. Check it before picking
  an envelope — feed the starving cells.

---

## The 8-step checklist

Author in this order. Each step assumes the one before it is settled.

### 1. Envelope + vignette

Declare the setting envelope, then write the scene prose per class (openings) and the
setting-neutral spine, all under the scene-writer's checklist above. Declare three things
before writing a card:

- **Motive hooks** — which sources may route an agent here (`choice` / `mission` /
  `chance` / `divine`, from `classifyMotive`). Naming them is how you learn whose
  encounter this is. An encounter nobody can arrive at by any route is unreachable
  content.
- **Quintessence stakes** — the erosion class. How badly does failing here wear the
  mortal? Two hard steps with a lethal trap is a different promise than one gentle
  social test, and the aftermath owes the difference.
- **Scene tag** — from the WS4 manifest vocabulary. Until that manifest exists the
  fallback chain ends at EntityVisual, so an unresolvable tag never blocks a render —
  but decide it now, or the encounter ships imageless by omission rather than by choice.

None of the three has a schema field yet. Record them in the file's doc comment.

### 2. Test panel data

Per step:

- **Reach(es)** with a **purpose line** — `ActionStep.purposeLine`,
  `REACH_PURPOSE_MAX_WORDS` (4) words, plain. What the step is *testing*, not a
  description of the fiction. "Read the lock", not "The mason's puzzle awaits".
- **Difficulty** 0–1. Never write the number into prose: `DIFFICULTY_WORD_BANDS` renders
  it as *severe / steep / fair / gentle*, and the word is the only surface the player
  sees (ruling 1).
- **`FACTOR_LINES_MIN`–`FACTOR_LINES_MAX` (2–4) factor lines** — `ActionStep.factorLines`,
  each a `{ text, polarity }` pair. Author **both** signs: a step whose lines all cut one
  way is an assertion, not a weighing, and two is the floor for the same reason. Each line
  concrete, each one **naming its source**.

**Canon rule 1 — a factor names its source in the sentence.** A factor line the player
cannot trace back to a cause is noise, and the source belongs *in the prose* rather than
in a label beside it — "The mason cut his mark beside the third pin", not
`Source: mason's mark`. Trait-derived lines are the same rule: they live on
`TraitVariant.factorLine` and the trait's name appears in the sentence.

**Both fields are schema (THR-820).** They sit on the step, and `buildNudgePhaseModel`
reads them straight onto the rendered test panel. A step that authors no `factorLines`
falls back to the contract's unsigned `beat.forecast_factors`, which can only render
`neutral` — that fallback is for un-migrated legacy templates, not a place to author.

### 3. The hand — cut from the 21-type library

**Hands are fully authored at encounter design time.** No runtime generic deck: runtime
only *filters* the authored hand (trait, group, favor-availability, sphere access,
target binding). Variation comes from world state, not shuffling.

Pick each card as an instance of one of the **21 library types** (Boost, Heavy Hand,
Insurance, Mercy, Gambit, Side-Bet, Long Game, Whisper, Trait card, Signature, Bargain,
Undertow, Stumble, Kindled Ambition, Omen, Cache, Balm, Veil, Favor, Fellowship,
Compulsion — statuses and mechanics on the wiki page). Name the type in a code comment
per card until THR-887 gives it a schema key.

Author `NUDGE_HAND_MIN`–`NUDGE_HAND_MAX` (**4–8**) cards per nudge-bearing step; gated
cards (trait, group, favor) hide when unmet, so the **dealt** hand lands at the 4–6 the
card-row is designed around.

> These are **authoring** guardrails at warn level, not the rejected "fixed action count
> / capped action slots". The renderer draws whatever `NudgeHand.playable` contains,
> uncapped; the pool stays open-ended and data-driven.

Hand-building rules:

- **No two cards in a hand answer the same question.** Two Boosts are legal only when
  they buy different certainties (nerve vs light vs memory); two rider cards never are —
  **at most one rider per hand**, justified in a code comment. (Pre-pivot this rule was
  one rider per encounter; the library made Insurance, Mercy, and Gambit first-class
  repertoire members, so the honest unit is the hand.)
- **No two encounters in a family repeat a type composition** — audited by the coverage
  matrix, never hoped for.
- **Sphere coverage ≥ `HAND_SPHERE_COVERAGE_MIN` (4) distinct spheres** across the hand,
  and **≥ `HAND_COMMON_OPTIONS_MIN` (1) ungated common (sphere-less) option**, so no god
  is ever handed an empty step. Sphere-keyed cards honor the sphere-signature table
  (chaos → Gambit/Stumble, order → Favor/Insurance, entropy → Bargain, …) from the
  Repertoire plan.
- **Trait-only options where a `traitVariant` exists.** Cost **0**: the price was paid by
  being that person. Hidden, never dimmed, for an agent who cannot hold the trait.
- **Zero essence outside a trait card is legal only when another channel carries the
  price** — `costs.doomDelta` (The Bargain), `costs.detectionDelta` (The Heavy Hand pays
  up, The Veil pays down), or an obligation the card creates. A card that is simply free
  is a pricing bug, and the exemplar test enforces this.
- **Grants ship with their content built** (the supporting-content rule). Any card
  granting an item / trait / ambition / omen / condition names ids that resolve against
  built catalogs — `validateNudgeGrantRefs` fails the build otherwise (THR-844's lesson:
  names referencing unbuilt content rot silently). Grants ride the existing
  `EncounterAftermathReactionEffect` vocabulary — never mint a card-specific effect
  language.
- **`effectLine` in words, never digits or `%`.** The pip row renders magnitude.
- **Match the step's reach to an actor who plausibly holds it, or keep the difficulty at
  or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45 — the `steep` floor).** This is the one
  rule that decides whether the hand *does anything*, and it is invisible while
  authoring: a hand can pass every rule above and still be inert.

  Measured (THR-821, `npm run measure:nudge-headroom`, seeds 42/99;
  `Docs/audits/2026-07-27-thr-821-nudge-headroom.md`): a `notable`-tier mortal has
  capability 0.027–0.119 in a reach that is neither its primary nor its secondary. At
  difficulty 0.45 that floors at `PROBABILITY_FLOOR` and stays floored through the
  entire hand — the player spends essence and the forecast word does not move.

  So either **gate the encounter to actors who hold the reach** (role, faction, or
  late-run capability — what the retired Darkhollow Vault demonstrated), **or** keep an
  open-draw step at `fair` or below (what The Swollen Ford demonstrates). A `severe`
  step drawn by anyone is a decorative hand.

### 4. Band prose

- **All six `StepOutcome`s covered** between the hand's fragments —
  `critical_success · success · success_at_cost · near_miss · failure · critical_failure`.
  `near_miss` is a failure texture for authoring purposes even though `isStepSuccess()`
  counts it as advancing: the step got through, the nudge did not land clean, and the
  prose owes that.
- **Every band must read correctly with any subset of the hand active.** Nudge-specific
  payoffs go in `bandProse` fragments, never in the base band text. The base text is what
  happens when the god did nothing.
- **Every nudge carries at least one failure-band fragment.** The god's hand must be
  traceable in failure at any size — payoff at every band, program ruling. Failure is
  plot, not punishment, and a nudge that vanishes on a loss is the god's hand vanishing.
  For a `floor_at_cost` card the reachable failure band is `critical_failure` — put the
  fragment there, since the rider erases `failure` and `near_miss` while active.
- **`forecastDelta ≥ NUDGE_BIG_DELTA` (0.15) ⇒ cover BOTH `failure` and
  `critical_failure`.** A nudge that moved the odds this far and still lost owes the
  player a distinct reading of *how* it lost at each depth.

Watch the domain. `bandProse` keys on the six-value `StepOutcome` — **not** the five-band
`EncounterOutcomeBand`, and **not** `OutcomeBand` from `outcomeConsequences.ts`. Either
would type-check while being the wrong domain.

Note `ActionStep` carries five afterimage fields, not six: there is no near-miss
afterimage. Near-miss is paid off through band fragments.

### 5. Trait hooks (mandatory step)

For every encounter, ask four questions and answer each one explicitly:

1. **Gate?** — `requiredTraits` / `blockedByTraits` on the template.
2. **Variant?** — a `TraitVariant`: forecast modifier, difficulty ease, factor line.
3. **Trait-only nudge?** — a card with `requiredTrait`, unlocked via `addNudgeIds`.
4. **Trait fragment?** — band prose that only reads when the trait-holder played it.

"No hook" is a valid answer, written down. Silence is not.

**Hard constraint: hooks may only name traits that `validateTraitRefs()` does not report
as dead.** A ref is matched ANY-of across node id / short id / display name / tag
(THR-786), so the full node id is the form least likely to rot. THR-800 tracks the
authored refs that currently fail the sweep; the allowed set is everything that passes,
and it grows as those repairs land. A hook on a dead ref is a gate that never opens —
invisible to every test that does not enumerate values.

### 6. Aftermath

Prizes, tolls, and seeds as **object references** — ids the modal system resolves — not
inline prose descriptions. Every game object is a clickable modal (ruling 6), and that
only works if the aftermath names objects rather than describing them. Card-carried world
changes (`grants`) fire once per committed card, after the step resolves, through the
host system's own API.

**Tolls in words.** "A heavy toll", "tremendous exertion". Never a number.

### 7. Images

- **`imageTag` per card**, from the manifest vocabulary — **one generic image per
  library card**, shared by every hand that deals it. Until painted, the fallback chain
  runs: `imageTag` lookup *when the manifest exists* → category generic → type icon on a
  tinted band (EntityVisual).
- **Scene tag per encounter** (see step 1) — scene art stays encounter-specific; card
  art does not.

**The genericity test.** A tag belongs in the shared vocabulary only if it reads
correctly in at least `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) *unrelated* encounters.
Post-pivot every card face must pass it — a face that only reads in dungeons is a
dungeon card, whatever you name it.

### 8. Evidence

Run the register scorer and the detectors below on all new prose — openings included. An
encounter is not finished until they are clean, and until the scene-writer's checklist is
answered in writing in the file's doc comment.

---

## Register assignment per authored field

Absent declaration ⇒ **baseline**. Canon: `Docs/canon/prose.md` § the register model.

| Field | Register |
|---|---|
| `name`, `effectLine`, factor lines, purpose lines | **interactive-plain** |
| Openings, spine, band base text, `fiction` (the flavor quote) | **baseline** |
| Final-step band prose, the fate-reveal line | **peak-eligible** |

**The hard plainness rule.** Interactive text is always plain — no metaphor, no ambiguity
about what the click does. The picturable-anchor rule below applies to *prose* fields;
it never applies to a label. A label's job is to be unmistakable. The flavor quote is the
one card element allowed a dry aphorism ("Rest is armor.") — still one plain idea, never
stacked metaphor.

"Peak-eligible" means permitted, not required. Most encounters never need it.

---

## Prose rubric (hard rules)

From the 2026-07-25 prose pilot and abstraction assessment. Applies to scene prose:
openings, spine, stakes, band text, fragments, afterimages.

1. **Every sentence carries a picturable anchor.** If the reader cannot see it, rewrite it.
2. **Abstractions only as stakes, and cashed in-sentence.** You may stake "their
   reputation"; you may not leave it uncashed. Name what reputation *looks like* here.
3. **"something / thing / way" target zero.** See the detector.
4. **≤1 not-X-but-Y construction per encounter.** See the detector.
5. **God-action as witnessed effect.** In *scene-side prose* (band fragments, outcome
   text), never "the god grants courage" — write what happens in the room. The
   `effectLine` is the exception by design: it is the rules text, and it says what the
   god does plainly.
6. **Card-discipline budgets** (`NUDGE_WORD_BUDGETS`, warn-level):

| Field | Budget |
|---|---|
| Scene / each opening | 60 words |
| Factor line | 12 words |
| `fiction` (flavor quote) | 30 words — aim far lower; a quote is one line |
| Band base | 60 words |
| Band fragment | 25 words |
| `name` | 6 words (`NUDGE_NAME_MAX_WORDS`) — aim for 2–4 |

Over budget is a signal the field is carrying another field's job, not an error.

---

## Detector spec (verbatim)

Three detectors. Constants live in **two** modules — authoring guardrails in
`nudgeAuthoringConstants.ts`, the audit's own thresholds and term lists in
`nudgeAuditDetectors.ts` — and where they disagree, **the code is the contract, not this
page.** The table below names which module each detector reads.

### Vagueness lexicon — target **zero**

**There are two lists and they do not agree.** Know which one is scoring you (THR-868
finding, 2026-07-30 — this cost a full rewrite cycle). Reconciliation is tracked in
[THR-877](https://linear.app/threadbare/issue/THR-877); until it lands, write against the
**union**, because either can be the one that fails you.

| Constant | Module | What reads it |
|---|---|---|
| `VAGUENESS_LEXICON` (10 terms) | `nudgeAuthoringConstants.ts` | `nudgeModel.test.ts` golden-exemplar assertions only |
| `AUDIT_VAGUENESS_TERMS` (~35 terms) | `nudgeAuditDetectors.ts` | `countVagueness()` — the **audit and scoring path**, i.e. the number quoted as evidence |

`VAGUENESS_LEXICON` — the historical list this page documented:

```
something · anything · nothing · thing · things · way · ways · somehow · whatever · somewhere
```

`AUDIT_VAGUENESS_TERMS` — what `countVagueness()` actually matches, in four groups:

```
hedges          somehow · somewhat · seems to · appears to · a kind of · a sort of ·
                something like · in some way
stand-ins       something · someone · somewhere · things · stuff
nominalised     the situation · the matter · the moment · the atmosphere · the tension ·
                the dynamic · the connection · the understanding · the balance ·
                the energy · the presence · the experience · the process
intensifiers    very · really · quite · rather · truly · deeply · profoundly · utterly
```

**The overlap is only four words** (`somehow`, `something`, `somewhere`, `things`). Two
traps follow:

- **`someone` and the intensifiers trip the audit but appear nowhere on the older list.**
  Innocuous-looking prose — "You look for someone who…", "she felt it deeply" — scores as
  vagueness. This is the one that bites: it is not a word you would flag by eye. Note
  `rather` fires inside "rather than".
- **`thing`, `way`, `ways`, `anything`, `nothing`, `whatever` are on the older list but the
  audit does not catch them.** The previous version of this page additionally claimed
  "all the way", "either way", "it costs you nothing" and "in a way" all trip the detector.
  Three of those four do not — `way` and `nothing` are not in `AUDIT_VAGUENESS_TERMS`, and
  only `in some way` is, not `in a way`. Do not rely on that claim.

Each term is a word standing where a picturable noun belongs. *"It cost them something"*
has a sentence's shape and no image in it. Matching is on word boundaries, so `someone`
fires inside `someone's`.

### Annotation patterns — ≤ `ANNOTATION_MAX_PER_ENCOUNTER` (1) across the encounter

| Pattern | Matches |
|---|---|
| `notButClause` | a "not … but" clause inside a single sentence |
| `emDashNot` | an em-dash followed by a negation ("— not the …") |

Both are the writer stepping in to gloss their own image. One is a rhythm; three is a tic.
The budget is per **encounter**, not per field.

### Abstraction-as-subject spot check

Per the 2026-07-25 assessment: read each sentence and ask what its grammatical subject
is. When an abstraction keeps arriving in the subject slot — *the tension rose, the
silence stretched, the moment held* — the prose has stopped watching the scene and
started narrating its own mood. Concrete subjects act; abstract subjects describe.

This one is a judgement call, not a regex. Run it by hand.

---

## Reusable card faces, bespoke hands

Pre-pivot, ruling 3 made every card per-encounter authored content with a narrow shared
pool of six generic families. The communication pivot inverts the default for **faces**
while keeping it for **hands**:

- **Every card face is library-generic** (title, effect, quote, art) — written to read
  correctly wherever its type deals, and passing the genericity test.
- **Every hand is bespoke** — which types, which spheres, which gates, what the band
  fragments say, what the grants ship. Cutting the hand *is* the encounter-specific
  authoring.

`SHARED_GENERIC_NUDGE_FAMILIES` in `nudgeAuthoringConstants.ts` (`focus · luck ·
blessing · oath · light · strength`) survives as the seed vocabulary for Boost-family
member cards until THR-887 lands the library data file
(`src/data/nudge-card-library.ts`), which becomes the canonical card list. Extending the
library is a code change with a reviewer, never a judgement an authoring session makes
alone.

---

## Fail-soft contract

Everything in the nudge model is opt-in. A step with no `nudges` resolves exactly as it
did before the schema landed, and that is a supported authoring choice — not every step
wants a hand. What is *not* supported is a half-authored hand: four cards with two
failure fragments between them is worse than no hand at all, because the god's absence
then reads as a bug rather than a decision.
