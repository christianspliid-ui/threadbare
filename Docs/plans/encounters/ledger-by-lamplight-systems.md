# Encounter Pipeline: The Ledger by Lamplight
> Scale: short (local) | Slug: ledger-by-lamplight | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## 1. Support Bundle Honesty

- **`factor`**: `lazy-materialize-on-trigger`, reuses broker/merchant/trader (all in `NpcRole`, `src/types/npc.ts`), otherwise spawns broker "Maren Quill". Persistence is `must-persist`. That is **required, and correctly set**: the factor is the target of both `bond_change` writes (THR-1165 cast-target safety). A lazy, must-persist key is materialized by the encounter itself, never merely bound from ambient scenery, so the bond cannot land on a bystander or nowhere. `inheritContext: true` carries the binding into the `#steal` sequel.
- **`clerk`**: lazy, `scene-only`. **Correct.** No effect and no chip targets `$cast:clerk`, which appears only in the step 1 spine as `{cast:clerk}`. A scene-only key needs no persistence, and `{cast:clerk}` falls back to `spawnName` if unbound. I changed reuse `guard` to `steward` (clerk/scribe/steward): a town guard reused as a counting house's night clerk was a fiction mismatch, since every afterimage calls him "the clerk".
- **`$here`**: the actor's `located_at`, walked to the Location tier. Step-metadata effects dispatch through the aftermath effect applier (`applyStepOutcomeEffects`, THR-783), so `$here` binds on this path the same way it did for batch 1's `masons-commission`.

## 2. Missing Primitives

None. The template uses: step `rewardPool` with `tagFilters` (a ContentQuery site), `encounter_seed.query` plus `inheritContext` (THR-1488/THR-697), `apply_condition.targetLocationId: '$here'` (THR-1143), and `bond_change` (reciprocal by default, `encounterAftermath.ts` `case 'bond_change'`). All four are live.

## 3. Runtime Feasibility

The template is linear, with two steps: shadow 0.42 `continue_weakened`, then shadow 0.45 `fail_action`. Both are at or under the open-draw ceiling of 0.45 (`intrinsicTier: 'background'`), with a mean of 0.435, which matches the brief row exactly. The check's forecast arithmetic confirms that neither hand pushes a step out of [0,1]. All six step outcomes are covered, because `near_miss` maps to `successAfterimage` (`isStepSuccess` counts it as success and fires `successMetadata`).

**Which band writes what.** `isStepSuccess` puts step 1's `critical_success`, `success`, `success_at_cost` and `near_miss` on `successMetadata`: the prize, bond+ and the seed. It puts `failure` and `critical_failure` on `failureMetadata`: Under Watch and bond−. The aftermath `byOutcome` chips match those sides one for one, so no chip on any band claims a write its side does not make.

## 4. Aftermath Supportability

**(a) `place` family on the failure side only (the author's flag). Accepted.** The binding brief wires slot 3's `place` as "a condition on `$here` (the counting house's town knows its books were read)". That fact is true only on failure, so the brief itself places it there. The consequence hand requires the family to be *wired in context*, not wired on both sides. A success-side place write would claim that the town learned of a copy nobody detected, which is a lie about the world. `trait.condition.location.under_watch` exists (`condition-trait-content.ts:488`, name "Under Watch", described as "Quiet work here is harder and more likely to be seen"). Its reader is the Shadow term in `LOCATION_CONDITION_STEP_MODIFIER` (`LOCATION_WATCHED_SHADOW_PENALTY`), so the chip detail now states that mechanic: "{location} is watched now, and quiet work there is harder." `durationTicks: 48` overrides the 84-tick default, which suits a single copy job.

**(b) The `{target}` rendering on the reputation chip (the author's flag). This was a real defect, now fixed.** `buildAftermathConsequences` enriches `stateNoun.text` with the **scene** enrichment context (`enrich: (text) => enrichProse(text, ctx)`, `buildUnifiedEncounterStageModel.ts:802`). It does not use the chip's own `entityId`. On an organic everyday draw the action's target is the location (`phaseAgentDecision.ts:1690`, `targetId: sel.entry.targetAgentId ?? sel.entry.locationId`), and `resolveSceneTargetContext` names it. The tag `reputation with {target}` would therefore have rendered **"REPUTATION WITH <the town>"**, linked to the factor, above a sentence about the factor. The bond it reports is with the factor, not the town. The fix is to make the noun the generic sheet word, `{ text: 'reputation', tooltipId: 'ui.reputation_with' }`. It is lawful: one word, anchored by a resolving tooltip, not a carrier anchor, so `chipStateNounWordingViolations` and `chipAnchorViolations` both pass. It is also true, because `bond_change` writes `relates_to.trust`, which is leg 3 of the unified reputation read (`reputation.ts`, THR-1206). The factor is still named and linked in the chip sentence by the narrative linker's cast-name scan.

> **Corpus-wide, outside this encounter:** every everyday/self-targeted template whose chip uses `reputation with {target}` with a `$cast:*` (or `$faction:*`) anchor has the same wrong-name render. That includes batch 1's `masons-commission` (inspector chip), `bell-at-the-exchange` (buyer chips) and `assize-letter`. The durable fix is engine-side: enrich a `stateNoun`'s `{target}` against its own resolved `entityId`. Reported to the orchestrator; not in scope here.

**(c) `#steal` seed query (the author's flag). It resolves to drawable town templates.** I measured it with `resolveContentQuery` over `staticContentCatalogs()` plus the seeding site's own `eligibleAt` rule (individual-performable, and `locationSubtypes` includes the target's subtype). `urban` expands to town/city/capital. The results by subtype:
- **town (5):** `black_market_deal`, `pickpocket`, `shadow_in_the_night`, `smuggle_goods`, `the_fence`
- **city (6):** the five above plus `shadow_hunt`
- **capital (7):** `black_market_deal`, `pickpocket`, `shadow_in_the_night`, `the_fence`, `steal_secrets`, `vault_heist`. `smuggle_goods` is town/city only.

`grave_robbery` is ruins-only and joins the pool only if the mortal has drifted to ruins by the due tick. `shadow_in_the_night` accepts almost every subtype, so the seed rarely withers anywhere. Every member is individual-performable, but every member is **rarity 1**, so a journeyman is sent novice-tier follow-up work. That is acceptable for a "more work" sequel, but it goes on record. The query seed keeps the eligibility filter, so confirm the `Family seed matched` / content-query trace at live proof.

**(d) Rule 34 sweep (THR-1476).** I walked every later-tense sentence:
- PATH "{cast:factor} will send for {actor} with more work": enacted by the placeless `#steal` `encounter_seed` on the same (success) side. It is truthful because the other party finds the mortal, and no place or time is named.
- The seedLabel names no place or time. It is not rendered as a chip, because the aftermath carries no reactions and `displayReactions` is `[]`.
- "{location} is watched now": enacted by `apply_condition` on the same (failure) side.
- **Cut:** "the rest had better come next time" (success_at_cost overview). No effect performs it, because the `#steal` sequel is not the rest of this page.
- **Cut:** "sent for the watch" in the step 0 critical_failure afterimage. That band could still end in step 1 success with no watch written.
- Step 0's success_at_cost "a shutter that will not close again" is scene description, not a binding on the mortal. Left alone.

**(e) Reward.** Step 1 `successMetadata.rewardPool` is `{ categoryWeights: { possession: 1 }, tagFilters: ['#shadow'] }`. Reference liveness in the check (`validateContentQueries`) passes. The engine renders the PRIZE chip from the draw, and "paid in kind" names it in the overview.

## 5. Chip referents

- BOND/SCAR `reputation`: tooltip `ui.reputation_with` resolves, and the write is `bond_change` with `$cast:factor` (must-persist, lazy).
- SCAR `Under Watch`: condition template `trait.condition.location.under_watch` (attachment, linked).
- PATH `seed`: `ui.aftermath_seed`, backed by the `#steal` `encounter_seed`. I removed a dead `{actor}` concept from all three PATH chips: concept text is matched **unenriched** against the enriched sentence (`applyConceptDecorations`), so it could never decorate anything.
- PRIZE: engine-rendered.
- Growth fallback `shadow reach`: `reach.shadow`.

Every chip resolves.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Only the compiled set (package → module, structural test, registrations via `compile:encounter`). No engine changes are needed for this encounter. The `{target}` enrichment fix in § 4b is a separate corpus ticket.

## 8. Verdict

**READY WITH CAVEATS.** There are two live-proof caveats. First, the `#steal` query seed keeps the eligibility filter, so confirm it matched (trace) on a success run. Second, the `#shadow` possession draw must land a real item on a success band. `check:encounter` (probe run) is clean with 0 warnings, and `compile:encounter --dry-run` exits 0.

## 9. Primitive Disposition

No missing primitives identified.
