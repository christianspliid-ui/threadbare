# Encounter Pipeline: The Debt Arbitration
> Scale: short | Slug: debt-arbitration | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0 (Factory v3, batch expert-everyday-1 slot 1, THR-1678)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Opt-in Complication on gold: weigh the house's offer, then by the mortal's `courage_prudence` either call an arbitration against a noble (Vanguard) or collect the third (Watcher). Possession + knowledge hand. |
| Editorial | PASS WITH REVISIONS | P3 forfeit stated; ten seam echoes and four carryover echoes rewritten; chip kit de-duplicated; four band fragments added; five items handed to Pass 3. |
| Systems | READY WITH CAVEATS | Every id and field verified in `src/`. Six fixes applied (below). One corpus-wide engine gap (pre-fork critical failure) filed as BACKLOG. |

### Caveats / Blockers

1. **Pre-fork critical failure (engine, corpus-wide, BACKLOG).** A step-0
   `critical_failure` ends the action after the fork's pole is recorded, so the chosen
   arm's `critical_failure` band renders: prose about a step that never ran, and chips
   whose writes never fired. Rare at 0.58 for an expert. The fallback aftermath below
   is authored so the page is correct once the engine fix lands (spec in
   `debt-arbitration-systems.md` § 9).
2. THR-1685: avoided by construction. No `$cast:` reputation chip.
3. The step-1 Vanguard at-cost afterimage ("the elders charged the costs of the
   arbitration to them") asserts a charge no write performs. It is in-scene narration,
   left verbatim for the editorial lane.
4. The opening's `{location}` may render a Place name. This follows the precedent; every
   overview now says "town".
5. In a town (no native noble role) the claimant is minted as a walk-on noble. In a city
   or capital it reuses one.
6. Bind **no** `libraryCardId` on the step-0 specials. Kindled Ambition and Whisper
   library cards promise an ambition and a reveal these cards do not deliver.

### Changes applied by Pass 3

| # | Where | Change | Why |
|---|---|---|---|
| S1 | Ladder § 9, chip kit § 15 | Town-standing BOON confirmed on `success_at_cost`. Ladder row now names it | `successMetadata` fires on every `isStepSuccess` outcome (ruling a, Law 56 both ways) |
| S2 | Vanguard `success_at_cost` overview | "…from the warehouses, less the elders' fees." → "…from the warehouses, though only after a long hearing." | at-cost and near-miss draw on the success tier curve, and the band also covers a step-0 cost. No lesser prize and no fee exist (ruling b) |
| S3 | Reaction "Tell the town" intent | "…The noble's name falls in town, and the mortal is known as the one who told." → "…The town thinks better of the mortal for it, and the noble thinks far worse." | `reputation_with $cast:claimant` moves the mortal's standing with the noble. It does not move the noble's name. No chip (ruling c) |
| S4 | Vanguard spine; Vanguard and Watcher `critical_failure` overviews | "in {location}" → "in town" | `{location}` is the raw `located_at` node (can be a Place), and `$here` resolves to the settlement (ruling d) |
| S5 | Watcher overviews (crit, success, failure) | "The noble will have the deed." → "The deed goes to the noble." | rule 7b: a future claim with no effect |
| S6 | Watcher `success_at_cost` overview | "The clipped coins in {actor}'s third weigh less than their face. …" → "{actor} has their third. …" | the aggregate at-cost band also shows after a clean step 1, whose afterimage says "good coin" |
| S7 | Both arms' carryover lines | `critical_failure` rows removed | unreachable: a step-0 critical failure ends the action |
| S8 | Trait variant | `factorLine` supplied: "Being Greedy, they price the deed by what it yields." | field is required (`TraitVariant.factorLine`) and was missing |
| S9 | Step and aftermath `fallback` | authored (Watcher-arm copy; aftermath fallback with a truthful step-0 critical-failure band, no chips) | required by `ActionStepBranch` / `BranchAwareAftermathConfig`; the band is reachable after the BACKLOG fix |
| S10 | Effect payloads, chip ids/titles, supportRoles, narrativeTemplates, description | concrete values supplied (marked *systems-supplied* below) | the revised packet named them without values |

### Editorial Notes Summary

The editorial kept the structure (one fork, two arms, KEEP 2). It stated the forfeit in
P3 and fixed a run-level contradiction ("the deed alone covers every bill" against a lost
arbitration). It removed "nothing" ×2 from outcome fields, rewrote every afterimage→overview
and carryover seam echo, and grounded two effect lines that named unestablished targets.
It added four band fragments so both special-bearing hands cover all six `StepOutcome`s
from the specials alone. It moved the reputation chips to `reputation with {target}` on
`$here`, stopped the knowledge chip retelling the overview, and moved the Watcher favour
chip's cause onto the chip.

### Implementation File Map

- **Compiled** (not hand-edits): `Docs/plans/encounters/debt-arbitration.package.json`
  → `npm run compile:encounter` (module, structural test, both registrations). Run
  `check:encounter` too (#1114).
- `src/data/content-eval/plotHooks.ts`: stamp `usedBy` for `hook.puzzle_gauntlet` and
  `hook.unlikely_alliance` at closeout.
- No engine, type or art file for this encounter. The BACKLOG engine fix is separate
  work (see systems § 9).

---

## Encounter Packet

### 0. Mechanical design block (verbatim from revised, Pass-3 notes in brackets)

```
Crux            A banking house will not pay {actor}'s bill in full, and the only way to be
                paid in full is to call an arbitration that must run to a ruling, against a
                noble who wants the same pledge.
Title           The Debt Arbitration — states the complication (a debt) and the objective
                (an arbitration).
Id              encounter.town.debt_arbitration (binding; never encounter.slice.*)
Brief row       reach gold · steps gold 0.58 → gold 0.66 · shape opt-in complication ·
                settings urban · consequence hand possession + knowledge (binding)
                rarityTier 2 · scale local · intrinsicTier shaping
Rolled dice     p3 contest · opposition uncanny (its own law) read as the house's own custom ·
                disposition hostile (the house master) · agentRole client who is owed ·
                scale settlement · system target carryover (THR-892)
Hook            plotHookRolled: hook.builders_dilemma, hook.unlikely_alliance, hook.puzzle_gauntlet
                plotHookTaken:  hook.puzzle_gauntlet, blended with hook.unlikely_alliance.
                builders_dilemma set aside.
Whose problem?  The agent's. The bill is scene-local (prose rule 7).
Reach = theme?  Step 0 Gold 0.58 prices the offer. Step 1 Gold on both arms: arbitration 0.66
                ranks a bill against a larger claim; the exit 0.30 sees a full third counted.
Shape           Opt-in Complication; agent-decided fork on courage_prudence
                (positive = Vanguard / arbitration, negative = Watcher / collect).
Carryover       Step 0 continue_weakened; both arms key carryoverFactorLines on step 0.
                [Pass 3: critical_failure rows dropped — a step-0 critical failure ends the
                action, so no arm ever reads them.]
Consequence hand possession (arbitration successMetadata.rewardPool, #gold) + knowledge
                (intelligence political_secret, arbitration success AND failure halves).
Extras          reputation_with $here up on an arbitration win, down on a loss; Watcher
                favor_creation debtor $cast:master on success, reputation_with $here down on
                failure; reactions: favour from $cast:claimant, or tell the town.
Trait hooks     Variant: Greedy (trait.personality.gold.vice) +0.04.
Systems quota   cast + rewards + reputation + favours — four.
Heavy Hand      none.
Measurement     measure:roll-spread reads step 0 only (0.58, window fit 0.72).
```

### 1–8 (verbatim from revised)

Inspiration anchors, scale justification, pressure knot, intervention fantasy, cast
table, beat structure, branching profile and map are unchanged from
`debt-arbitration-revised.md` §§ 1–8. They carry no field values beyond those
transcribed below.

### 9. Outcome Ladder (arbitration arm) — corrected

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | bill ranked first, noble last | nothing | prize (tier by step 1's own outcome; best curve when step 1 crit), town standing up, knowledge |
| success | bill ranked first | nothing | prize, town standing up, knowledge |
| success_at_cost | bill paid | time: a long hearing (or a costly weighing at step 0) | prize (success curve), **town standing up** (successMetadata fires), knowledge |
| failure | noble paid first | the bill | town standing down; knowledge kept |
| critical_failure | ruled against on every point, read aloud | the bill, the name | town standing down; knowledge kept |

Watcher arm: success bands → the master owes a favour; failure bands → town standing down.

---

## Package transcription (field by field)

Fields marked *systems-supplied* were absent from the revised packet. Every other
prose string is verbatim from the revised file, with Pass-3 edits S2–S6 applied.

### Template header

```
id                encounter.town.debt_arbitration
name              The Debt Arbitration
reach             gold
rarityTier        2
intrinsicTier     shaping
scale             local
crudType          update                                   (systems-supplied)
apCost            1
actorAffinities   ["individual"]
motivations       ["courage_prudence"]
settings          ["urban"]
openings.urban    "{actor} arrives in {location} to cash a bill of exchange at its oldest banking house."
traitVariants     [{ traitId: "trait.personality.gold.vice", forecastDelta: 0.04,
                     factorLine: "Being Greedy, they price the deed by what it yields." }]   (factorLine systems-supplied)
```

### Step 0 — Weigh the offer

```
reach             gold
duration          { min: 1, max: 2 }
difficulty        0.58
purposeLine       "Weigh the offer"
failBehavior      continue_weakened
onSuccess / onFailure  []
narrativeTemplate
  "The house has stopped paying. {cast:master}, its master, offers each creditor a third of their bill in coin. Three merchants have taken it.\n\nA noble with the largest claim wants the house's last pledge, the deed to its warehouses. By the house's own rule, any creditor may call an arbitration. Once called, it runs to a ruling, and the loser forfeits the bill."
criticalSuccessAfterimage  "They worked out that the deed is worth far more than the house admits, and that a third is a small part of what it can pay."
successAfterimage          "They worked out that the deed covers far more than a third of every bill."
successAtCostAfterimage    "They worked out what the deed is worth, and the master saw them do it and closed the books."
failureAfterimage          "They saw only the pages the master chose, and the third looked fair."
criticalFailureAfterimage  "They took the master's figures on trust, and the figures were false."
deal              { count: 4, tags: ["insight", "social"] }
```

Nudges (no `libraryCardId`):

| field | `debt.stoke_the_grievance` | `debt.counsel_patience` |
|---|---|---|
| name | Stoke The Grievance | Plant Patience |
| sphere | spirit | mind |
| essenceCost | 1 | 1 |
| forecastDelta | 0.06 | 0.06 |
| imageTag | generic.energy | generic.focus |
| poleLean | `{ axis: "courage_prudence", toward: "positive" }` | `{ axis: "courage_prudence", toward: "negative" }` |
| effectLine | "Make the unpaid sum burn in their thoughts. They lean toward calling the arbitration." | "Put the sure coin first in their mind. They lean toward taking the offer over waiting on a ruling." |
| bandProse | success: "The unpaid sum stayed in their thoughts, and they read every page the master showed for it." · success_at_cost: "The unpaid sum drove them through the master's pages fast enough to be seen doing it." · failure: "The unpaid sum burned in their thoughts, and they read the master's pages too fast." | critical_success: "They thought of the coin first, and counted exactly what a third came to." · near_miss: "They thought of the coin first, and skipped a page about the deed." · failure: "They thought only of the coin, and never asked about the deed." · critical_failure: "They thought only of the coin, and took the master's word for the rest." |

### Step 1 — branch

```
branchOnStep      0
decidedBy         { axis: "courage_prudence" }
variants          { positive: <Vanguard>, negative: <Watcher> }
fallback          <copy of Watcher, byte-identical>          (systems-supplied, precedent shape)
```

#### variants.positive — Win the arbitration

```
reach             gold
duration          { min: 1, max: 2 }
difficulty        0.66
purposeLine       "Win the arbitration"
failBehavior      fail_action
onSuccess / onFailure  []
narrativeTemplate
  "{actor} calls the arbitration. The house's elders sit in its hall and read every claim against its books. {cast:claimant}, the noble, argues that the largest claim must be paid first, out of the deed. {actor} must prove their own bill ranks ahead. The ruling cannot be appealed, and every counting house in town will hear who lost."      [S4]
criticalSuccessAfterimage  "They proved their bill first in line, and the elders set the noble's claim last of all."
successAfterimage          "They proved their bill first in line, to be paid out of the deed."
successAtCostAfterimage    "They proved their bill first in line, and the elders charged the costs of the arbitration to them."   (caveat 3)
failureAfterimage          "The elders ranked the noble's claim first, and the deed did not stretch to their bill."
criticalFailureAfterimage  "The elders ruled against them on every point, and read the ruling aloud in the hall."
carryoverFactorLines
  critical_success  { text: "They can prove the deed's true worth.", polarity: "for", forecastDelta: 0.06 }
  success           { text: "They know what the deed is worth.", polarity: "for", forecastDelta: 0.04 }
  success_at_cost   { text: "The master is ready for what they found.", polarity: "against", forecastDelta: -0.02 }
  near_miss         { text: "They know only part of what the deed is worth.", polarity: "for", forecastDelta: 0.02 }
  failure           { text: "They argue from half the house's books.", polarity: "against", forecastDelta: -0.03 }
  (critical_failure dropped — S7)
successMetadata
  rewardPool  { categoryWeights: { possession: 1 }, tagFilters: ["#gold"] }
  effects
    - { kind: "intelligence", category: "political_secret",
        label: "Where the house's money went",
        detail: "Most of the banking house's money went out as loans to the claimant noble's household and was never repaid, read aloud from its own books.",
        reliability: 0.9, targetAgentId: "$actor" }                         (detail/reliability systems-supplied)
    - { kind: "reputation_with", targetLocationId: "$here", delta: 0.10 }
failureMetadata
  effects
    - <same intelligence effect>
    - { kind: "reputation_with", targetLocationId: "$here", delta: -0.12 }
deal              { count: 4, tags: ["social", "presence"] }
```

Nudges (no `libraryCardId` required; `card.stumble.signature.chaos` on Scatter is optional):

| field | `debt.scatter_the_figures` | `debt.invoke_the_rule` |
|---|---|---|
| name | Scatter The Figures | Invoke The Rule |
| sphere | chaos | order |
| essenceCost | 2 | 2 |
| forecastDelta | 0.10 | 0.12 |
| imageTag | generic.luck | generic.oath |
| opposes | `claimant` | — |
| effectLine | "Make the noble lose their place in their own accounts before the elders. The larger claim sounds weaker for it." | "Hold the elders to the letter of their own procedure. Every claim is weighed against the books, whatever the claimant's rank." |
| bandProse | success: "The noble lost their place twice in their own accounts, and the elders noticed." · near_miss: "The noble lost their place once, and {actor} was too slow to press it." · failure: "The noble stumbled over one figure and recovered before the elders cared." · critical_failure: "The noble found their place again at once, and the elders took them for the steadier head." | critical_success: "The eldest of the elders read the rule aloud before the ruling, and ruled by it." · success: "The elders kept to the letter of their rule, and weighed the noble's claim like any other." · success_at_cost: "The elders kept to the letter of their rule, and the letter charged its costs to whoever called them." · failure: "The elders kept to the letter of their rule, and their rule favoured the larger claim." |

#### variants.negative — Collect the third (also the step `fallback`)

```
reach             gold
duration          { min: 1, max: 1 }
difficulty        0.30
purposeLine       "Collect the third"
failBehavior      fail_action
onSuccess / onFailure  []
narrativeTemplate
  "{actor} takes the offer. {cast:master} counts out the third from the strongroom while other creditors queue behind. Some of the coin is clipped. {actor} must see a full third counted before the strongroom runs dry."
criticalSuccessAfterimage  "They left with a full third in good coin, and the master's thanks for not calling the arbitration."
successAfterimage          "They left with a full third in good coin."
successAtCostAfterimage    "They left with a full third, part of it in clipped coin."
failureAfterimage          "The strongroom ran dry before their turn, and they left with the master's note instead."
criticalFailureAfterimage  "They left with a note on a house that has stopped paying its notes."
carryoverFactorLines
  critical_success  { text: "They know to the coin what a third comes to.", polarity: "for", forecastDelta: 0.05 }
  success           { text: "They know what a third should come to.", polarity: "for", forecastDelta: 0.03 }
  failure           { text: "They take the master's count on trust.", polarity: "against", forecastDelta: -0.03 }
  (critical_failure dropped — S7)
successMetadata
  effects
    - { kind: "favor_creation", magnitudeRange: [0.15, 0.3],
        context: "Took the third and spared the banking house an arbitration",
        debtorAgentId: "$cast:master" }                                      (context systems-supplied)
failureMetadata
  effects
    - { kind: "reputation_with", targetLocationId: "$here", delta: -0.05 }
deal              { count: 4, tags: ["social", "craft"] }
nudges            none
```

### supportBundle

```
- { kind: "actor", key: "master", delivery: "lazy-materialize-on-trigger", persistence: "must-persist",
    reuseNpcRoles: ["merchant"], supportRole: "house_master", spawnNpcRole: "merchant", spawnName: "Aurel Vance" }
- { kind: "actor", key: "claimant", delivery: "lazy-materialize-on-trigger", persistence: "must-persist",
    reuseNpcRoles: ["noble"], supportRole: "rival_claimant", spawnNpcRole: "noble", spawnName: "Ysolde Carrow" }
(supportRole strings systems-supplied)
```

### narrativeTemplates and description (systems-supplied)

```
initiation  "A banking house has stopped paying its bills. {actor} may take a third in coin, or call an arbitration against a noble who wants the house's last pledge."
success     "{actor} came away from the failing banking house paid."
failure     "{actor} came away from the failing banking house unpaid."
description "An opt-in debt arbitration at a failing town banking house: weigh the master's offer of a third (Gold), then, by the mortal's own nerve, call an arbitration against a noble for the house's last pledge (a Vanguard, Gold) or collect the third before the strongroom runs dry (a Watcher, Gold). The arbitration pays a #gold possession and the house's lending record, and moves the mortal's standing in town either way."
```

### aftermathConfig

```
branchOnStep  0
```

#### Chip definitions (reused by id pattern per band)

| Chip | kind | category | direction/polarity | title | causeClause | detail | stateNoun | concepts |
|---|---|---|---|---|---|---|---|---|
| KNOW | shell_state | boon | gain | "Where the money went" | — | "{actor} keeps the house's lending record." | `{ text: "knowledge", tooltipId: "ui.knowledge" }` | `[{ text: "lending record", tooltipId: "ui.knowledge" }]` |
| REP+ | reputation | boon | gain | "The Town's Trust" *(title systems-supplied)* | — | "The town trusts {actor}'s judgement with money more." | `{ text: "reputation with {target}", entityId: "$here", visualKind: "location", tooltipId: "ui.reputation_with" }` | `[{ text: "trusts", tooltipId: "ui.standing" }]` |
| REP− | reputation | scar | loss | "The Town's Trust" *(title systems-supplied)* | — | "The town trusts {actor}'s judgement with money less." | same as REP+ | same as REP+ |
| FAVOUR | shell_state | bond | gain | "A Favour Owed" | "Spared the house an arbitration" | "{cast:master} owes {actor} a favour." | `{ text: "a favour owed", tooltipId: "ui.favour_owed" }` | `[{ text: "{cast:master}", entityId: "$cast:master", visualKind: "agent" }]` |

The PRIZE chip is engine-rendered from the draw. Do not author it.
Chip ids: `debt.<pos|neg>.<crit|succ|cost|fail|critfail>.<know|rep|favour>`.

#### variants.positive (Vanguard)

```
overview  "{actor} called the arbitration."                                   (systems-supplied base)
changes   []
byOutcome
  critical_success
    overview  "The elders read the house's books aloud. Most of its money had gone out as loans to {cast:claimant}'s household, never repaid. {actor} was paid in full, in goods from the warehouses, before the noble saw a coin."
    changes   [REP+, KNOW]
    reactions [KEEP_QUIET, TELL_TOWN]
  success
    overview  "The elders read the house's books aloud, and most of its money had gone out as loans to {cast:claimant}'s household. {actor}'s bill was paid in goods from the warehouses."
    changes   [REP+, KNOW]
    reactions [KEEP_QUIET, TELL_TOWN]
  success_at_cost
    overview  "{actor}'s bill was paid in goods from the warehouses, though only after a long hearing. The books, read aloud, showed that {cast:claimant}'s household had borrowed most of the house's money."      [S2]
    changes   [REP+, KNOW]                                                     [S1]
  failure
    overview  "The deed went to {cast:claimant}. The books, read aloud, showed that the noble's own household had borrowed most of the house's money. The ruling stands anyway."
    changes   [REP−, KNOW]
    reactions [KEEP_QUIET, TELL_TOWN]
  critical_failure
    overview  "{actor}'s bill is worthless now. The books showed that {cast:claimant}'s household had borrowed most of the house's money, and the deed still went to the noble. Every counting house in town knows who called the arbitration and lost."      [S4]
    changes   [REP−, KNOW]
```

Reactions:

```
KEEP_QUIET  id "debt.pos.keep_quiet"   label "Keep the noble's debts quiet"
            intent "Say no word outside the hall about the noble's loans. The noble owes the mortal for the silence."
            effects [{ kind: "favor_creation", magnitudeRange: [0.2, 0.35],
                       context: "Kept the noble household's unpaid loans quiet",
                       debtorAgentId: "$cast:claimant" }]                     (magnitude/context systems-supplied)
TELL_TOWN   id "debt.pos.tell_town"    label "Tell the town who emptied the bank"
            intent "Let every counting house hear whose household borrowed the money. The town thinks better of the mortal for it, and the noble thinks far worse."      [S3]
            effects [{ kind: "reputation_with", targetLocationId: "$here", delta: 0.05 },
                     { kind: "reputation_with", targetAgentId: "$cast:claimant", delta: -0.12 }]
```

#### variants.negative (Watcher)

```
overview  "{actor} took the house's offer."                                   (systems-supplied base)
changes   []
byOutcome
  critical_success
    overview  "{cast:master} counted {actor}'s third out first, ahead of the whole queue. The deed goes to the noble."      [S5]
    changes   [FAVOUR]
  success
    overview  "{actor} was paid before the strongroom emptied. The deed goes to the noble."      [S5]
    changes   [FAVOUR]
  success_at_cost
    overview  "{actor} has their third. The house is left to its other creditors."      [S6]
    changes   [FAVOUR]
  failure
    overview  "{actor} holds the master's note for the third, and no coin. The deed goes to the noble."      [S5]
    changes   [REP−]
  critical_failure
    overview  "The merchants in the queue saw {actor} take the master's paper for coin. By evening every counting house in town has heard it."      [S4]
    changes   [REP−]
```

No reactions on the Watcher arm or on Vanguard `critical_failure`.

#### fallback (systems-supplied; reachable after the BACKLOG engine fix)

```
overview  "{actor} left the banking house before any count or ruling."
changes   []
byOutcome
  critical_failure
    overview  "{actor} took the master's false figures on trust and left before any count or ruling. The deed goes to the noble."
    changes   []
```

No chips: no write fires on the step-0 terminal path.

### 15. Chip kit — per band (post-fix, Law 56 check)

| Arm · band | Writes that fire | Chips |
|---|---|---|
| Vanguard crit / success / at-cost | prize draw, intelligence, rep $here +0.10 | PRIZE (engine), REP+, KNOW |
| Vanguard failure / crit-fail (via step 1) | intelligence, rep $here −0.12 | REP−, KNOW |
| Watcher crit / success / at-cost | favor (master) | FAVOUR |
| Watcher failure / crit-fail (via step 1) | rep $here −0.05 | REP− |
| Either arm, crit-fail via step 0 | none | today: that arm's crit-fail chips render hollow (caveat 1); after the fix: fallback, no chips |

### 16. Support Bundle Contract (verified)

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `master` (merchant) | lazy-materialize-on-trigger | reuse merchant (1.0 in town/city/capital), else spawn "Aurel Vance" | must-persist | favour debtor | ready |
| `claimant` (noble) | lazy-materialize-on-trigger | reuse noble (city 0.7, capital 0.9), else spawn "Ysolde Carrow" (always in a town) | must-persist | favour debtor, reputation counterparty | ready |
| possession prize | step rewardPool `#gold` | reward attachment catalog (≥12 `#gold` possessions) | must-persist | item | ready |
| intelligence record | step success + failure metadata | engine | must-persist | intelligence queries | ready |

### 17. Self-Audit (Pass 3 additions)

- Every effect id and field verified against `src/` (systems § id table): PASS
- Law 56 both ways on every band step 1 reaches: PASS. Step-0 terminal path: caveat 1
- Prose rule 7b: every later-tense promise names its effect, or was made present tense: PASS
- No place/time promise, no appointment: PASS
- THR-1685: no `$cast:` reputation chip: PASS
- Over-exposed card budget: untouched (no `libraryCardId` bound): PASS

### Concept Art Direction (verbatim)

1. Emotions: a debt that will not be paid; an old procedure that still binds; standing on the line.
2. Image: an empty strongroom shelf with a single stack of clipped coins beside an open ledger and a wax-sealed deed, lamplight, no people. Painterly, muted, threadbare fantasy.

### Experience Differentiator Gate (verbatim from revised)

1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 N/A · 13 YES · 14 YES
