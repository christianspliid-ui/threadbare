# The Nudge Authoring Spec

**The canonical authoring contract for nudge-native encounters.** THR-774 (WS1).

Both authoring skills load this file: `encounter-pipeline` (branching encounters) and
`template-encounter-rewrite` (linear templates). They differ in structure, scale, and
orchestration; they do **not** differ on anything in this document. If the two skills
ever appear to disagree about a rule below, this file wins.

- Executable half: `src/engine/__tests__/nudgeModel.test.ts` § *WS1 golden exemplar*.
- Worked example: `src/data/__fixtures__/nudge-exemplar/darkhollow-vault-exemplar.ts`.
- Tunable numbers: `src/data/content-eval/nudgeAuthoringConstants.ts`.

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
| **rider** | A mechanical remap of the resolved band (`no_crit_fail`, `floor_at_cost`). Deterministic, zero PRNG draws, at most one applies. | `StepNudge.rider` |
| **band fragment** | A line of prose appended to the step's outcome text when this nudge was active for that band. | `StepNudge.bandProse[outcome]` |

A rider changes what happened. A fragment says the god was there when it did.

---

## The 8-step checklist

Author in this order. Each step assumes the one before it is settled.

### 1. Vignette

Scene prose per the prose rubric below. Declare three things before writing a card:

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

### 3. The hand

`NUDGE_HAND_MIN`–`NUDGE_HAND_MAX` (**4–8**) authored `StepNudge`s per nudge-bearing step.

> These are **authoring** guardrails at warn level, not the rejected "fixed action count
> / capped action slots". The renderer draws whatever `NudgeHand.playable` contains,
> uncapped; the pool stays open-ended and data-driven. Nine cards is a lint warning, not
> a truncation.

Rules:

- **Per-encounter specific by default.** Options are authored content, not a shared
  library (ruling 3). Reuse comes only from the generic pool below.
- **Sphere coverage ≥ `HAND_SPHERE_COVERAGE_MIN` (4) distinct spheres** across the hand.
  The hand is the replayability engine — different gods see different subsets — and that
  only holds if the spread is wide enough for gods to differ on it.
- **≥ `HAND_COMMON_OPTIONS_MIN` (1) common option** — sphere-less, so a god with no
  matching sphere is never handed an empty step.
- **Trait-only options where a `traitVariant` exists.** Cost **0**: the price was paid by
  being that person. A trait-only card is *hidden*, never dimmed, for an agent who cannot
  hold the trait — a card you can never unlock is noise, not a goal.
- **Every `fiction` line passes the concreteness rubric** — a witnessed physical cause.
  "Their nerve steadies" is a claim; "The tremor in their fingers goes out of them" is a
  thing the reader can see happen.
- **`effectLine` in words, never percentages.** No digits at all. "A large help", not
  "+15%". The numbers exist behind the words and stay there (ruling 1; designer view is
  the stated exception).
- **Costs ≥ 0.** Zero is reserved for trait options.
- **Riders rare and justified in a code comment.** A rider on every card turns the
  outcome ladder into a floor. Write why *this* card earns one.
- **Match the step's reach to an actor who plausibly holds it, or keep the difficulty
  under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45 — the `steep` floor).** This is the one
  rule that decides whether the hand *does anything*, and it is invisible while
  authoring: a hand can pass every rule above and still be inert.

  Measured (THR-821, `npm run measure:nudge-headroom`, seeds 42/99;
  `Docs/audits/2026-07-27-thr-821-nudge-headroom.md`): a `notable`-tier mortal — the
  tier a newly-threaded NPC lands in — has capability **0.027–0.119** in a reach that
  is neither its primary nor its secondary. At difficulty 0.45 that floors at
  `PROBABILITY_FLOOR` and stays floored through the entire hand — 0% of the cohort
  clears the floor unaided, with two cards, or with all of them. The player spends
  essence and the forecast word does not move.

  So either **gate the encounter to actors who hold the reach** (role, faction, or
  late-run capability — what the golden exemplar does, drawing a thief into an
  `eye`/`shadow` vault), **or** keep an open-draw step at `fair` or below. A `severe`
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
(THR-786), so the full node id is the form least likely to rot. THR-800 tracks the 62
authored refs that currently fail the sweep; the allowed set is everything that passes,
and it grows as those repairs land. A hook on a dead ref is a gate that never opens —
invisible to every test that does not enumerate values.

### 6. Aftermath

Prizes, tolls, and seeds as **object references** — ids the modal system resolves — not
inline prose descriptions. Every game object is a clickable modal (ruling 6), and that
only works if the aftermath names objects rather than describing them.

**Tolls in words.** "A heavy toll", "tremendous exertion". Never a number.

### 7. Images

- **`imageTag` per nudge**, from the manifest vocabulary.
- **Scene tag per encounter** (see step 1).
- Until WS4's manifest lands, the fallback chain runs: specific art → `imageTag` lookup
  *when the manifest exists* → category generic → EntityVisual gradient + glyph. An
  unresolvable tag degrades; it never blocks a render.

**The genericity test.** A tag belongs in the shared vocabulary only if it reads
correctly in at least `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) *unrelated* encounters.
Below that bar it is encounter-specific art wearing a generic name.

### 8. Evidence

Run the register scorer and the detectors below on all new prose. An encounter is not
finished until they are clean.

---

## Register assignment per authored field

Absent declaration ⇒ **baseline**. Canon: `Docs/canon/prose.md` § the register model.

| Field | Register |
|---|---|
| `name`, `effectLine`, factor lines, purpose lines | **interactive-plain** |
| Scene prose, `fiction`, band base text | **baseline** |
| Final-step band prose, the fate-reveal line | **peak-eligible** |

**The hard plainness rule.** Interactive text is always plain — no metaphor, no ambiguity
about what the click does. The picturable-anchor rule below applies to *prose* fields;
it never applies to a label. A label's job is to be unmistakable.

"Peak-eligible" means permitted, not required. Most encounters never need it.

---

## Prose rubric (hard rules)

From the 2026-07-25 prose pilot and abstraction assessment.

1. **Every sentence carries a picturable anchor.** If the reader cannot see it, rewrite it.
2. **Abstractions only as stakes, and cashed in-sentence.** You may stake "their
   reputation"; you may not leave it uncashed. Name what reputation *looks like* here.
3. **"something / thing / way" target zero.** See the detector.
4. **≤1 not-X-but-Y construction per encounter.** See the detector.
5. **God-action as witnessed effect.** Not "the god grants courage" — write the thing
   that happens in the room.
6. **Card-discipline budgets** (`NUDGE_WORD_BUDGETS`, warn-level):

| Field | Budget |
|---|---|
| Scene | 60 words |
| Factor line | 12 words |
| `fiction` | 30 words |
| Band base | 60 words |
| Band fragment | 25 words |
| `name` | 6 words (`NUDGE_NAME_MAX_WORDS`) |

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
  vagueness. This is the one that bites: it is not a word you would flag by eye.
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

## Shared generic pool

The **only** nudge families reusable across encounters. Everything else is written for
the encounter it sits in (ruling 3).

| Family | What it covers |
|---|---|
| `focus` | Focus / steady-breath — the mortal's own nerve, held a moment longer |
| `luck` | Moment's luck — the coin lands the right way up |
| `blessing` | Unlock-gated; the god's overt favour |
| `oath` | Oath / word — a promise already made, remembered on cue |
| `light` | Light in dark — literal illumination where there was none |
| `strength` | Strength surge — the body finds one more pull |

Six families. **The canonical list is `SHARED_GENERIC_NUDGE_FAMILIES` in
`nudgeAuthoringConstants.ts`** — extending the pool means editing that array, which is
deliberately a code change with a reviewer rather than a judgement an authoring session
makes alone.

A generic card still has to pass the genericity test (≥3 unrelated encounters). A card
that only reads in dungeons is a dungeon card, whatever you name it.

---

## Fail-soft contract

Everything in the nudge model is opt-in. A step with no `nudges` resolves exactly as it
did before the schema landed, and that is a supported authoring choice — not every step
wants a hand. What is *not* supported is a half-authored hand: four cards with two
failure fragments between them is worse than no hand at all, because the god's absence
then reads as a bug rather than a decision.
