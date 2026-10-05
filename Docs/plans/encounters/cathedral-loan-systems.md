# Encounter Pipeline: The Cathedral Loan
> Scale: short | Slug: cathedral-loan | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0 (factory line v3, master-everyday slot 2, THR-1688)

Cold Pass 3. Audited `cathedral-loan-revised.md` (editorial verdict PASS WITH REVISIONS) against the code:
`src/engine/unifiedActionLifecycle.ts` (`advanceStep`, `terminalActionOutcome`, `computeFinalActionOutcome`),
`src/types/unifiedAction.ts` (`applyAftermathOutcomeBand`, `resolveAftermathVariant`, `ActionStepOutcomeMetadata`,
`StepNudge.opposes`, `attachment_grant`), `src/engine/unifiedActionResolution.ts` (step-outcome effects, step reward
draw), `src/engine/rewardPool.ts`, `src/engine/encounterAftermath.ts` (`bond_change`, `attachment_grant`,
`reputation_with`), `src/engine/sceneSentinels.ts`, `src/engine/encounterSupportBundle.ts`,
`src/engine/encounters/nudges.ts`, `src/engine/encounters/dealHand.ts`, `src/data/content-eval/compositionContract.ts`,
`src/data/reward-attachment-catalog.ts`, `src/data/agreement-reward-catalog.ts`,
`src/data/personality-trait-content.ts`, `src/types/axisRegistry.ts`, `src/data/encounter-image-library.ts`.

Machine gate: the pre-editorial package is green. A scratch copy carrying the revised prose **plus every fix below**
(built outside the repo; the committed package was not touched) is also green on
`node .cache/check-encounter.mjs --package` — `clean 1, warnings 0`, systems `cast, rewards, reputation`. The first
run of that copy raised one page warning on the editorial's revised reaction intents (fixed, S6).

**Verdict: READY WITH CAVEATS.** One Law 56 defect (a chip unbacked on one route into its band) and one prose line
that asserts a scene the same route never played. Both are fixed in the final packet. The caveats are engine-wide
behaviours the packet cannot change.

---

## 0. Route table — which `byOutcome` band each step path lands on (focus a)

The aftermath is keyed on `UnifiedAction.outcome` (`resolveAftermathVariant` → `applyAftermathOutcomeBand`). The
config's `branchOnStep: 1` has no variants (the encounter is linear), so every run reads `fallback.byOutcome[outcome]`.
How a step history becomes that outcome:

- `advanceStep`: a step **failure** under `fail_action`, or a step **critical_failure under any failBehavior**,
  ends the action at once (`failure` / `critical_failure`). Its own comment says: *"critical_failure always triggers
  fail_action regardless of template setting."*
- At the final step, `computeFinalActionOutcome` runs. Any failure in the history gives `success_at_cost`. Any
  `success_at_cost` or `near_miss` gives `success_at_cost`. Any crit on a clean run gives `critical_success`.
  Otherwise the result is `success`.
- `successMetadata` fires on `isStepSuccess`, which **includes `near_miss`**. `failureMetadata` fires on failure and
  critical_failure.

| # | Step 0 | Step 1 | Action outcome → band | Step writes that fire |
|---|---|---|---|---|
| A | **critical_failure** | *never runs* | **critical_failure** | step 0 failure: dean − |
| B | cs / s | cs | critical_success | step 1 success: dean +, town +, prize |
| C | cs | s | critical_success (THR-571: a crit on a clean run) | step 1 success |
| D | s | s | success | step 1 success |
| E | any success-family | sac | success_at_cost | step 1 success |
| F | any success-family | **near_miss** | **success_at_cost** | step 1 success (near_miss counts as success) |
| G | sac / near_miss | cs / s | success_at_cost | step 1 success |
| H | **failure** (continue_weakened) | cs / s / sac / nm | **success_at_cost** | step 0 failure (dean −) + step 1 success (dean +, town +, prize) |
| I | any but cf | failure | failure | (step 0 failure if it failed) + step 1 failure: dean −, town − |
| J | any but cf | critical_failure | critical_failure | (step 0 failure if it failed) + step 1 failure: dean −, town − |

**Answers to the two routes the brief asked about:**

- **A step-1 near_miss lands on `success_at_cost` (row F), not `failure`.** Its writes are all gains: dean +0.12 /
  +0.15, town +0.08, and the prize at the `success` tier curve. The sac band's chips are dean gain, town gain and the
  PRIZE, so all three are backed. The editorial's worry ("two losses over two gain writes") does not occur.
- **A step-0 critical_failure under `continue_weakened` ends the encounter on `critical_failure` (row A).** Step 1
  never runs, and the factor is never met. The only write is step 0's `failureMetadata` (dean −0.05 / −0.08). This is
  the route that breaks the revised critical_failure page (S1, S2). It also means **no step-1 `critical_failure`
  carryover line can ever be read**. The editorial's suggested line would be dead content, so do not add it.

### Law 56, per band, per route (before fixes)

| Band | Chip | Backed on every route? |
|---|---|---|
| critical_success | BOND dean gain · BOON town gain · PRIZE | yes (B, C: step 1 success) |
| success | same | yes (D) |
| success_at_cost | same | yes. Row H nets dean +0.07 / +0.07 and town +0.08: still gains. |
| failure | SCAR town loss · BOND dean loss | yes (I: step 1 failure) |
| critical_failure | **SCAR town loss (`cathedral.cf.town`)** · BOND dean loss | **no**. Route A writes no town reputation. The editorial added this chip reasoning only from route J. |

---

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `dean` (reuse `priest`, spawn `priest` "Anselm Hale", must-persist, lazy-materialize-on-trigger) | Bound at trigger | **Honest.** `prepareEncounterSupportBundle` runs at action creation and binds every bundle actor before step 0. `$cast:dean` in `bond_change.withAgentId` binds through `bindAftermathSceneTargets` (`SCENE_SENTINEL_FIELDS.withAgentId: 'agent'`), for step-outcome effects and reactions alike. |
| `factor` (reuse `merchant`/`broker`, spawn `merchant` "Odile Marrow") | Bound at trigger; bond target; agreement counterparty | **Honest (focus c).** It is bound at trigger too, so it resolves even on route A, where the factor never appears on stage. No write targets the factor on route A, so nothing lands on a stranger. `counterpartyId` is a registered sentinel field (THR-1110), so `$cast:factor` binds there as well. |
| Treasury gift (step 1 `rewardPool { possession: 1 }, tagFilters ['#divine']`) | Non-empty, tiered by band | **Honest, with caveats (focus b).** `possession` projects to `{ kind: 'item_template', tags: ['#divine'] }`. The library holds 13 `#divine` possessions across tiers 1–4: Pilgrim's Robe, Prayer Scroll, Spring Water Vial, Meditation Stones (t1); Ember Sigil, Sanctuary Incense, River Clay Bead, Tithe Box (t2); The Weeping Icon (t3, also `#cursed`); The Woven Sky, The Fulcrum, The Quiet Cup, The Anvilbone (t4). Every tier curve finds weight. The pool empties only if the bearer already holds all 13 (dedup). The gate's pool-liveness check passes. The **tier keys on step 1's outcome**, not the action band. Route C (crit_success band, step-1 plain success) draws on the `success` curve. Route H (sac band, step-1 crit) draws on the crit curve. The player-facing prose names no tier, so nothing lies. Only the ladder's "(best tier)" note was wrong, and it is corrected in the final. |
| `agreement.debt.minor` via `attachment_grant`, counterparty `$cast:factor`, recipient `$actor` (sac reaction) | Edge-backed debt between the mortal and the factor | **Honest (focus d).** The id is live in `AGREEMENT_REWARD_TEMPLATES` ("Minor Debt", tier 1, 48 ticks, `cooperationBias 0.05`). The handler takes the agreement path, binds the counterparty, and no-ops with a trace if it does not resolve. Precedent: `the-garrisons-price.ts`. |

## 2. Missing Primitives

None. Everything used is live: linear steps, `continue_weakened` / `fail_action`, step-outcome effects (THR-783),
`carryoverFactorLines` (THR-892), the step `rewardPool` (THR-1487 content query), `bond_change`, `reputation_with`,
`attachment_grant` (agreement), `traitVariants`, `deal` (THR-1247), cast sentinels. No `authoredChoices`. No
appointment is needed: no place-and-time promise is made (see § 4).

What does **not** exist, and the fix has to work around: **no step-effect can be keyed to a single step band**.
`EffectPredicate` has no outcome term, and only `sharpen_clue` reads `stepOutcome` / `actionOutcome`. A write cannot
fire "on step-0 critical_failure only". That is why fix S1 is shaped the way it is.

## 3. Runtime Feasibility

- Two beats, linear, branch count 0: supported.
- Six step bands are covered by base afterimages and special fragments. Five `byOutcome` bands are authored, and the
  contested pair is never this action's outcome.
- Hands: 2 specials + `deal { count: 4 }` = 6 composed, under `DEAL_HAND_MAX`.
- **Trait variant (focus e):** `trait.personality.gold.virtue` is built by `personalityTraitId('gold', 'virtue')` in
  `personality-trait-content.ts`. Its name is the axis word, `Generous` (`axisRegistry.ts`), which matches the factor
  line. Precedent: `debt-arbitration.ts` uses `trait.personality.gold.vice`. Live.
- Carryover: the **near_miss line was inverted** (S4).

## 4. Aftermath Supportability (incl. prose rule 7b)

- Reputation channels are real: `reputation_with` with `targetLocationId: '$here'` binds the actor's settlement.
  `bond_change` writes are reciprocal by default.
- No conditions. The batch's `apply_condition`-on-`$actor` budget is untouched (0 of 2).
- Later-tense sentences, each with the effect that performs it:
  - "before the carts are loaded" (opening). This is an in-scene clock, resolved by step 0 itself. No later event.
  - "If the factor says no, the plate goes to the melting pot, and every lender in town will hear who failed to stop
    it" (step-1 spine). This is shown only on step-1 routes. It is performed by step 1 `failureMetadata.reputation_with
    $here` on rows I and J. Pass.
  - "The chapter will pay off its loan from the tithes in the years ahead" (success overview) and "the chapter will pay
    the lenders a harder rate for a generation" (sac overview). These state terms agreed now about a third party. They
    bind no mortal to a place or time and promise no event the game would stage. Pass. *(Note for the orchestrator:
    no effect enacts the chapter's repayments. If a later reviewer reads 7b as covering third-party futures, rephrase
    to present-tense terms.)*
  - The reaction intents name exactly their writes: factor bond +, dean bond + with factor bond −, debt plus dean
    bond +. "No debt" is an absence. Pass.
- **critical_failure overview (S2).** "The factor told the whole chapter that {actor}'s offer was worthless … in front
  of {cast:dean}" is false on route A, where the factor never comes. It also grounds nothing, because the factor is
  introduced only in step 1's spine. It is replaced with a route-neutral line.
- **success_at_cost overview (S3).** "that harder rate" points back at the step-1 sac afterimage. On rows F, G and H
  the line above it is a different afterimage (or none, for near_miss), so "that" has no antecedent. It now reads
  "a harder rate".

## 5. Chip referents resolve

| Chip | Referent | Resolves |
|---|---|---|
| BOND dean (gain/loss) | `stateNoun` `reputation with {target}` → `$cast:dean`, `visualKind agent` | yes: a bound cast actor (dean). THR-1685 is superseded by the `anchorNameFor` fix, as the editorial verified. |
| BOON / SCAR town (incl. new `cathedral.cf.town`) | `reputation with {location}` → `$here`, `visualKind location`, `ui.reputation_with` | yes: the settlement. Concepts → `ui.standing`, the same as the shipped `f.town`. |
| PRIZE | engine-rendered `item` change from the step reward | yes: the instantiated node id (THR-1004) |

No chip points at the plate, the tithes or the bailiffs. Those are scene fiction and stay unchipped.

## 6. Card checks (focus f)

| Special | Type (code comment) | Sphere | `imageTag` (library sphere) | `opposes` | Verdict |
|---|---|---|---|---|---|
| Slow The Loading | Signature (order) | order | `generic.oath` (order: a plain wax seal) | **`bailiffs`: not a cast key → remove** | The image fits ("until the list is signed"). `opposes` names nobody the scene binds, so `resolveOpposedCastNodeId` returns undefined and the card falls back to card attribution. The field is a dead pointer (S5). Package id should move to `cathedral.slow_the_loading` (the face changed; inspectability). |
| Dull The Silver | **Signature (matter)**, relabelled from Stumble | matter | `generic.matter` (matter) | none | A Stumble is the type whose modifier is sourced from a **bound cast member** (`opposes`). The bailiffs are uncast, so "Stumble" names a mechanic this card cannot have. The editorial's "add `opposes: bailiffs`" would also be unbindable. Relabel is a code comment only. |
| Plant The Fear | Signature (mind) | mind | `generic.rumor` (mind) | `factor`: binds | Person-scoped `opposes` on a non-Stumble special is corpus-normal (`debt-arbitration` `claimant`, `the-unfinished-rite` `rival`). The forecast row reads as the factor's doing, which is what the card is. Keep. |
| Open The Ledger | Signature (light) | light | `generic.light` (light) | none | Keep. Distinct from the Mill Lease's *Uncover Hidden Tallies* (the creditor's padding versus the tenant's concealment). The editorial's "Consider" stands as an orchestrator option, not a systems defect. |

**Deal duplication.** None of the four is a library member (no `libraryCardId`), so the dealer's
`type_already_authored` dedupe has nothing to match, and no library type is a Signature. The library sphere members
the fill could deal on these spheres are `card.favor.signature.order`, `card.insurance.signature.order`,
`card.cache.signature.matter`, `card.compulsion.signature.mind` and `card.whisper.signature.light`. Each answers a
different question (a favour owed, a floor, an item left behind, the mortal's own urge, the next step revealed), so no
special duplicates a dealable card. Keeping Dull The Silver off the Stumble label also stops a "second Stumble"
reading beside a dealt `card.stumble.signature.chaos`. Over-exposed cards table: no `card.boost.core` special, and
`card.compulsion.signature.mind` is not authored (slot 2's one allowance is unspent).

## 7. Findings and fixes (all applied in `cathedral-loan-final.md`)

| # | Severity | Finding | Fix (packet / package field) |
|---|---|---|---|
| **S1** | **BLOCKING (Law 56)** | `cathedral.cf.town` (critical_failure SCAR, town loss) is backed only on route J. Route A (step-0 critical_failure) writes no town reputation, and there is no band-scoped step effect. Moving the town loss to step 0 at −0.10 would push row H (step-0 failure → sac band) to net −0.02 under a "thinks better" BOON. | **Add** to step 0 `failureMetadata.effects`: `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.05 }`. Route A now writes town −0.05, so the SCAR is true. Row H nets +0.03 (−0.05 + 0.08), so the BOON stays true. Rows I and J carry −0.10 or −0.15, so the SCARs stay true. Every chip on every band is now backed on every route, and every town write is chipped. In the fiction, the town saw the bailiffs refuse the master on the cathedral steps. |
| **S2** | **BLOCKING (truth on a route)** | The critical_failure overview narrates the factor's public scorn. On route A the factor never comes. | critical_failure `overview` → **"The plate is gone to be melted down, and the whole chapter watched it go. {cast:dean} had sent for {actor} to save it."** This is true after either afterimage (bailiffs refuse / factor refuses). It is the cause of the dean BOND, and leaves the town to its SCAR. It shares no four-word run with either afterimage. "Melted down" replaces "the melting pot", which is introduced only on step-1 routes. |
| S3 | Should fix | The success_at_cost overview's "that harder rate" has no antecedent on rows F, G and H. | "that harder rate" → **"a harder rate"**. |
| S4 | Should fix (editorial Q) | Carryover near_miss is `for +0.02` while success_at_cost is `against −0.02`, so a near_miss (spec § 4: "a failure texture") hands step 1 a better line than a success_at_cost. | `carryoverFactorLines.near_miss` → `{ text unchanged, polarity: 'against', forecastDelta: -0.03 }`. The ladder is now monotone: +0.06, +0.04, −0.02, −0.03, −0.04. The line already reads as against ("kept loading"). |
| S5 | Tidy (dead pointer) | Slow The Loading `opposes: 'bailiffs'` names no cast key. | **Remove** `opposes` from that nudge. Rename the package id `cathedral.hold_to_procedure` → `cathedral.slow_the_loading`. Odds are unchanged. |
| S6 | Gate warning | The editorial's revised sac reaction intents share "the mortal owes the factor" (`check:encounter` page warning, THR-1474). | *Leave the chapter its terms* intent → **"The chapter carries its terms alone. None of its debt falls on the mortal."** Gate re-run: 0 warnings. |
| S7 | Label | Dull The Silver "Stumble (matter)" cannot be a Stumble without a cast to oppose. | Relabel **Signature (matter)** (code comment only). |
| S8 | Doc | The outcome ladder claims "(best tier)" on critical_success, but the tier keys on step 1's outcome. The critical_failure row describes the factor's scorn. | Ladder rows corrected (design text, not player-facing). |

### The five editorial "Consider" questions, answered

1. **Package id / imageTag for the re-skin.** Rename the id to `cathedral.slow_the_loading`. Keep `generic.oath`: an
   order plate with a wax seal, which fits "until the list is signed".
2. **Dull The Silver `opposes: "bailiffs"`?** No. `bailiffs` is not a cast key, so it would resolve to nothing. For the
   same reason Dull The Silver is relabelled Signature (matter) rather than Stumble (S7). The same dead pointer is
   removed from Slow The Loading (S5).
3. **Which band does a step-1 near_miss render?** `success_at_cost` (row F). All three chips are gains, and all are
   backed by `successMetadata`, which fires on near_miss. No Law 56 problem. A step-0 near_miss followed by a step-1
   success also lands on `success_at_cost` (row G).
4. **Carryover polarity inversion?** Not intended, and fixed (S4).
5. **A step-1 critical_failure carryover line?** No. A step-0 critical_failure ends the action (route A), so step 1
   never renders after it, and such a line would be unreachable.
6. *(also raised)* **Open The Ledger vs *Uncover Hidden Tallies*.** This is not a systems defect. The editorial's
   re-aim option remains open to the orchestrator.

## 8. New Hooks Needed

None.

## 9. Implementation File Map

Beyond the compiled set (`compile:encounter` owns the module, its structural test and both registrations), the only
file to edit is:

- `Docs/plans/encounters/cathedral-loan.package.json`. Mirror the revised prose and fixes S1–S6: the field list is in
  the final file's Pipeline Summary.
- At closeout, the brief's standing duty: stamp `hook.political_labyrinth` `usedBy` in
  `src/data/content-eval/plotHooks.ts`.

No engine, type, art or catalog file is touched.

## 10. Verdict

**READY WITH CAVEATS.** The two blocking findings (S1, S2) are fixed in the final packet. The package must mirror them
before compiling. Caveats that remain and are engine-wide:

1. **Bad-outcome flip on the prize.** `drawSeededReward` flips 5% of `success`-curve draws (rows D–H) to the harm
   table, while every success-side overview says the dean gave a treasury gift. Step-1 crits are 0%. This is
   corpus-wide behaviour, and the PRIZE chip shows what was actually drawn.
2. **Route A is the lightest critical_failure.** Step-0 critical_failure writes dean −0.05 / −0.08 and town −0.05.
   Plain failure on step 1 writes −0.12 / −0.15 and −0.10. Both chips read true, but "the penalty lands hard" is
   weaker on that route. No band-scoped step effect exists to deepen it without also hitting row H.
3. **Live proof at master difficulty.** As the brief warns, the proof ascendant loses most natural runs. Pin
   `?outcome=critical_failure` once with a step-0 critical_failure and once with a step-1 critical_failure, and pin
   `success_at_cost` via a step-1 near_miss. Read success-side rows on failed runs as *not exercised*.

## 11. Primitive Disposition

No missing primitives identified. *(Observation, not a ticket: a band-scoped `when` predicate on step-outcome
effects would let a step-0 critical_failure write differently from a step-0 failure. It is not needed here.)*
