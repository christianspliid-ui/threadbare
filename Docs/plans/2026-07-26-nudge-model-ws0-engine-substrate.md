---
status: current
issue: THR-773
supersedes: none (implements Docs/plans/2026-07-26-nudge-model-encounter-system.md § WS0; folds in the THR-779 wire-or-delete decision)
---

# Nudge Model WS0 — Engine Substrate

**Program:** `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772 epic; user verdicts recorded there and binding here). **Audit input:** `Docs/audits/2026-07-26-nudge-migration-audit.md` (THR-776). This plan is the buildable design for the engine seams; WS1 (builder pipeline) and WS2 (interface) consume its schema.

## Substrate inventory

Verified 2026-07-26 (program plan § Substrate inventory carries the full table with file paths): `outcomeForecast.ts` (five tiers + named `ForecastModifier{source,delta}`), `handFilter.ts` (playable/dimmed/hidden), `quintessenceActions.ts` (spend/resist hooks; erosion sources incl. `encounter_failure`), `quintessenceToWord()` + `QUINTESSENCE_LEXICON` + `QuintessenceThresholdState` (`healthy|strained|weakened|critical|broken`), `requiredTraits` gating in `encounterFilterPipeline.ts`, THR-668 interrupt registry, THR-631 motive receipts, THR-613 milestone grants, and the outcome ladders in `unifiedActionResolution.ts` — **two enums, kept precise throughout**: the step path resolves to the six-value `StepOutcome` (incl. `near_miss`); the branching path uses the five-band `EncounterOutcomeBand`. WS4's five fate-image bands map from StepOutcome with `near_miss` folding into the failure image (a near miss reads as failure). **This plan extends and activates; it green-fields nothing.** No new node types; no new edges; relationships stay on existing graph structures.

## Scope rule (load-bearing)

**Nudges exist only in the attended encounter** — the curated moment of the Three-Beat Turn. **The attended predicate is the existing attention tier**: an encounter whose action was promoted to `AttentionTier = 'story_beat'` by the curator (`src/types/attention.ts`; promotion already traced via `EncounterPromotionTrace`/`CuratorDecisionTrace`). `background` and `shaping` encounters resolve exactly as today (no pause, no hand, no nudge modifiers), and `EROSION_ATTENDED_MULT` reads the same promoted-tier flag on the in-flight action — one signal, no new predicate. This keeps the tick loop's throughput untouched (NFP #7) and makes the nudge hand a player-attention feature, not a sim feature.

## Engine pillar

### 1. Nudge schema (additive, on steps)

```ts
/** Authored per-encounter nudge option (THR-772 ruling 3). */
export interface StepNudge {
  id: string;                      // unique within template
  name: string;                    // ≤6 words, plain (interactivePlainness applies)
  sphere?: SphereName;             // sphere gate; absent ⇒ common pool
  requiredUnlock?: string;         // god-power template id (granted-card gate)
  requiredTrait?: string;          // trait-only option (pairs with traitVariants)
  essenceCost: number;             // 0 allowed (trait options)
  forecastDelta: number;           // named forecast modifier, source `nudge:<id>`
  rider?: NudgeRider;              // optional band rider
  imageTag?: string;               // WS4 library tag; absent ⇒ category generic
  fiction: string;                 // card body — concrete, witnessed effect
  effectLine: string;              // player guidance, words only
  bandProse?: Partial<Record<StepOutcome, string>>; // appended when active
}
export type NudgeRider = 'no_crit_fail' | 'floor_at_cost';
// 'reroll_once' was considered and REJECTED at design audit: any extra draw from the
// resolution rng stream shifts every downstream consumer for that action (the codebase
// already guards this hazard — unifiedActionResolution.ts:1273). Band-mapping riders only.
// HOST TYPE PRECISION (three-pillar audit): the host interface is `ActionStep`
// (src/types/unifiedAction.ts:765) — it gains `nudges?: StepNudge[]` (absent ⇒ no hand).
// The step outcome enum is `StepOutcome` (unifiedAction.ts:1195) with SIX values incl.
// `near_miss` — NOT `OutcomeBand` (outcomeConsequences.ts:45, an unrelated consequence
// enum that would type-check while being wrong), and NOT the five-band branching enum
// `EncounterOutcomeBand`. bandProse keys on StepOutcome.
```

`traitVariants?: TraitVariant[]` on the template: `{ traitId, forecastDelta?, difficultyDelta?, factorLine, addNudgeIds?: string[] }` — applied when the acting agent holds the trait (`has_trait` edge, same resolution as `requiredTraits`).

### 2. Resolution integration

Player-committed nudges ride the in-flight action instance as `activeNudges: string[]` (ids). At resolution: (a) each active nudge contributes a `ForecastModifier{source: 'nudge:'+id, delta}` — the forecast pipeline already sums named modifiers; (b) riders apply at step-outcome selection, defined over the full six-value `StepOutcome` domain so every input is deterministic: `no_crit_fail` maps `critical_failure→failure` (all other values unchanged); `floor_at_cost` maps `failure→success_at_cost` **and** `near_miss→success_at_cost` (a near miss is a failure texture and floors with it; all other values unchanged). Strongest single rider wins per `NUDGE_RIDER_PRIORITY`; riders never touch the d100 itself. PRNG callout: riders are pure band-mapping — **zero extra draws from any stream**; same seed + same nudges = same d100 = same outcome, and every downstream stream consumer (prose enrichment, graph ops) is untouched. Essence is deducted at commit via the existing spend path; a failed commit (pool raced to empty) rejects the nudge before the roll — never after.

### 3. Broken-state behavior (the missing consequence)

State derivation stays pure — **no new persisted flag**: `isBroken(agent)` derives from the threshold state each check, with hysteresis via one property (`brokenSince?: tick`, set on entering `BROKEN_ENTER_STATE`, cleared above `BROKEN_EXIT_STATE`). Consequences while broken: (a) `encounterFilterPipeline` excludes the agent from all candidacy **except** templates flagged `drawableWhileBroken: true` (the WS5 rebuild encounters); (b) movement scoring (`encounterScoring.scoreAndSelect` additive block, the live mover) gains a homeward/safe-hex pull, cause `'broken_drift'`; (c) the attended-encounter surface shows the state word (WS2). Death stays rare: zero-state rules untouched; erosion clamps the resulting ratio at `QUINTESSENCE_RATIO_FLOOR` — only the existing zero-state paths reach zero.

**Terminology collision, resolved here for the UL proposal:** the existing `QuintessenceThresholdState` literal `'broken'` means ratio 0 (dissolution) and is untouched — 232-importer enum, not ours to rename. The player-facing **Broken (mortal state)** is a *behavioral* state driven by the predicate `isBrokenMortal(agent)` (enters at `BROKEN_ENTER_STATE`, hysteresis via `brokenSince`), and WS2 renders the state word from the predicate, never from the threshold enum. The UL proposal defines both: *Broken (mortal state)* = out of the story, mendable; *Dissolution threshold* = the enum's ratio-0 literal.

Erosion becomes band- and attention-scaled (today: flat 0.03 on failure): `erosion = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION × bandMult × attendedMult × (1 + difficulty × DIFFICULTY_EROSION_SCALE)`. Defaults below put "one catastrophe in a dire attended encounter can break a mid-worn mortal" in reach while background failures stay gentle — the pacing Christian reviews.

### 3b. The god restore action (the program plan's "WS0 action" row)

`divine.rekindle_thread` ("Rekindle the Thread") — a `UnifiedActionTemplate` with `actorAffinities: ['ascendant']`, **unlock-gated** via the THR-613 milestone-grant path (not in any starter pool), sphere prerequisite **Spirit**, `essenceCost: REKINDLE_ESSENCE_COST`. Effect: new effect primitive `quintessence_restore` (kind registered alongside the existing effect table) writing through `quintessenceActions` to raise the target mortal to `REKINDLE_RESTORE_TO_RATIO`, clearing `brokenSince`, and attaching a `recent_event` receipt — the mortal *knows whose fire is in them now* (Two-Way Thread; WS5 authors the prose). One target, threaded mortals only, no cooldown beyond its cost (the price is the gate). CRUD: update; scale: personal.

### 4. Motive classification (pure read)

`classifyMotive(action, receipts, seedProvenance): MotiveSource` → `'choice' | 'mission' | 'chance' | 'divine'`. Divine: seed/action provenance traces to a player intervention or god-sponsored seed. Mission: dominant receipt terms are ambition-/faction-assigned (share ≥ `MOTIVE_DOMINANT_SHARE`). Choice: dominant self-scored terms. Fallback: chance. Consumed by the WS2 header; exposed via `__DEBUG`.

### 5. THR-779 fold-in — wire-or-delete verdicts

- **DELETE (44):** the `action.*` regional verbs carrying `['individual','faction']`. Verified reachable by no system (not agent-drawn, not player-castable, faction phase dispatches from `FACTION_ACTION_TEMPLATES`). Not player-visible content — agent-technical call, executes in WS5's kill batch citing the audit.
- **WIRE (17):** the guild `senior/elite` tier + `fa.bounty_hunt`/`alliance_ceremony`/`conclave_debate` + `monster.encounter.lair_defense`/`horde_raid`. Route: register in the **encounter-cache path** (scale-agnostic) and gate the guild tier behind existing **chain prerequisites** (rank progression), so the reward tier unlocks with rank as authored. Executor names per-template registration (cache array membership or seedable family prefix) in the THR-779 PR; audit doc corrected + WS5 kill list regenerated per its Done-when. Engine smoke required (pool membership changes).

## Content pillar

No content authored in WS0. The schema exemplar (Darkhollow spec, program plan + mockup v3) is the authoring reference; WS1 owns the authoring rules, WS5 the library migration. **Rulebook impact (in scope here):** `Docs/canon/rulebook.md` § Encounters + the quick-reference gain the nudge-model rules tagged `[DESIGN]` in the WS0 PR (flip to `[IMPL]` when WS2 ships the interface). **One existing [IMPL] rule is explicitly amended, by name:** "Critical failure survives at every scale" gains the clause *"…except on a step where a god's `no_crit_fail` nudge is active — an authored, essence-priced, per-step exception, never a global gate."* The amendment is part of this ticket's rulebook edit, not implied. (Design note kept from the audit trail: the rebuild road stays the primary recovery path; Rekindle the Thread is the expensive, unlock-gated exception. Essence costs remain numeric by design — essence is the god's own accounting resource, already displayed numerically on shipped action cards; the words-only rule governs mortal meters and fate, per ruling 6's scope.) **UL:** new terms *Nudge*, *Broken (mortal state)*, *Rebuild Road* — UL-proposal issue filed at handoff with definitions from this doc.

## UI pillar

N/A for player-facing surfaces — that is WS2 (THR-775), which consumes this schema; building it here would violate the WS0/WS2 mutex. WS0's visibility deliverable is the **debug surface**: `__DEBUG.getEncounterNudges(agentRef)` (active hand + playable/hidden classification + forecast with modifier list) and `__DEBUG.getBrokenAgents()` (id, state word, ticks broken). Browser-verify: **exempt — engine + debug bridge only**; evidence is the 30-tick CLI smoke plus `__DEBUG` assertions from the Browser pane (no rendered surface changes). DebugPanel column additions, if any, ride WS2.

## Wiring

| Seam | Where |
|---|---|
| Schema | `src/types/unifiedAction.ts` (additive optional fields) |
| Forecast modifiers + riders | `outcomeForecast.ts` (consume), `unifiedActionResolution.ts` (band mapping) |
| Essence commit | existing spend path (`influence` pools), called from the attended-encounter controller (WS2 wires the button; WS0 lands the function) |
| Broken gate | `encounterFilterPipeline.ts` candidacy + `encounterScoring.scoreAndSelect` movement pull (cause `'broken_drift'`) |
| Erosion scaling | `quintessenceActions.ts` erosion call sites (orchestrator phase 2 telemetry unchanged) |
| Version counters | `brokenSince` write + `quintessence_restore` effect call `touchWorld()` at the mutation site (property edits participate in `worldVersion` — load-bearing rule); candidacy exclusion and movement pull read derived state per-tick with no memo, so no `touchStructure()` is needed |
| Restore action | new template `divine.rekindle_thread` in `src/data/unified-action-templates.ts` + `quintessence_restore` effect primitive in the effects table + graphOp executor branch |
| Motive read | new pure `src/engine/encounters/motiveClassifier.ts`, consumed by WS2 header + `__DEBUG` |
| Traces | see Tracing; ring-buffer discipline (aggregate/transition-fired only) |
| Debug | `debug-bridge.ts` + `.d.ts` additions above |
| Author-facing docs | `quintessence_restore` is a new content-facing effect primitive → `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated in the WS0 PR; `Docs/plans/wiring-checklist.md` gains the three new trace categories; new template in `unified-action-templates.ts` touches generated artifacts → `npm run check:generated-freshness` runs LAST at closeout |

## Constants (all named, tunable — NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `BROKEN_GATE_ENABLED` | **false** | master switch for broken-state candidacy exclusion + drift. **Ships OFF** — flipping it is a WS5 Done-when, gated on the rebuild encounters existing (Vision audit: the gate must never go live before the road out of it; "failure is plot, not punishment"). Erosion scaling and traces are live regardless, so telemetry accrues before the gate opens. |
| `BROKEN_ENTER_STATE` | `'critical'` | threshold state that flips a mortal to broken (when the gate is enabled) |
| `BROKEN_EXIT_STATE` | `'strained'` | state to climb past before re-entering the story (hysteresis) |
| `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION` | 0.03 | the **existing** constant (`src/types/quintessence.ts:57`), unchanged — the multipliers below scale it |
| `EROSION_BAND_MULT_CRITFAIL` | 5 | catastrophe multiplier |
| `EROSION_ATTENDED_MULT` | 2 | attended-encounter stakes multiplier |
| `DIFFICULTY_EROSION_SCALE` | 1.0 | +100% erosion at difficulty 1.0 |
| `QUINTESSENCE_RATIO_FLOOR` | 0.02 | erosion clamps the resulting **ratio** at this floor — erosion alone never reaches zero; only the existing zero-state paths do (death stays zero-state-owned) |
| `REBUILD_RESTORE_BASE` | 0.06 | per rebuild-encounter success (band-scaled in WS5 content) |
| `MOTIVE_DOMINANT_SHARE` | 0.5 | receipt share that claims choice/mission |
| `DIFFICULTY_WORD_BANDS` | ≥.60 severe / ≥.45 steep / ≥.30 fair / else gentle | step difficulty → display word |
| `NUDGE_RIDER_PRIORITY` | `no_crit_fail > floor_at_cost` | strongest-single-rider rule |
| `REKINDLE_ESSENCE_COST` | 6 | Rekindle the Thread — expensive by design |
| `REKINDLE_RESTORE_TO_RATIO` | 0.6 | restore target (lands the mortal at `steady`-adjacent, above exit hysteresis) |

Worked pacing at defaults (the review anchor): attended crit-failure at difficulty 0.6 ≈ 0.03×5×2×1.6 = **0.48** — breaks a mortal below ~0.58 ratio; background failure stays 0.03; a broken mortal at 0.10 needs ~4 successful rebuild visits (plus passive regen) to clear `strained` ≈ **1–2 in-game weeks**.

## Tracing (NFP #2)

```ts
interface NudgePlayedTrace { type: 'nudge_played'; actionId: string; templateId: string;
  nudgeId: string; essenceSpent: number; forecastBefore: ForecastTier; forecastAfter: ForecastTier; }
interface AgentBrokenTrace { type: 'agent_broken'; agentId: string; ratio: number; cause: string; }
interface AgentMendedTrace { type: 'agent_mended'; agentId: string; ticksBroken: number; }
```
`nudge_played` is player-action-driven (low volume, per-play). Broken/mended fire on **transition only** (never per-tick). Beware the `emitTrace` Omit union-collapse (only `tsc -b` surfaces it) — run the net-new diff.

## Fail-soft (NFP #4)

| Failure | Behavior |
|---|---|
| `nudges` absent on a step | encounter runs exactly as today (whole feature opt-in) |
| Unknown `rider` value | ignored, one warn per template id |
| Essence race at commit | nudge rejected pre-roll; UI refund; never post-roll |
| `brokenSince` missing/stale | state re-derived from ratio; hysteresis degrades to threshold-only |
| Motive unclassifiable | `'chance'` |
| `traitVariants` referencing absent trait/nudge id | variant inert, one warn |
| `imageTag` unmatched | WS4 fallback chain → EntityVisual gradient+glyph |

## Blast Radius

- `src/types/unifiedAction.ts` — **278 importers.** Additive optional fields only; zero signature changes (THR-573 `contextFragments` precedent). Ripple is type-level nil; the danger is a careless required field — forbidden here.
- `src/engine/traceBuffer.ts` — **232 importers.** New trace types are additive union members; the Omit-collapse check above is the guard.
- `unifiedActionResolution.ts`, `encounterFilterPipeline.ts`, `encounterScoring.ts` — sub-100 importers; behavior changes are gated behind `activeNudges`/broken-state presence, so default paths are byte-equivalent.

## Interface impact

*Encounters & Dilemmas (core) and Spheres & Quintessence are ⚪ UNAUDITED — audit-on-touch applies; this table is their first contract slice (grep-verified this session), and the executor registers these rows in `scripts/interface-contracts.ts` in the WS0 PR. The full-subsystem audits remain open.*

| Contract | Producer → Consumer | Action |
|---|---|---|
| `steps[].nudges` authored hand | templates → handFilter/WS2 stage + resolution | **add** (read sites named: `handFilter`, `unifiedActionResolution`) |
| `ForecastModifier{source:'nudge:*'}` | resolution ← nudge commit | **extend** (existing modifier contract, new source class) |
| quintessence erosion on failure | resolution → agent node `quintessence` | **extend** (band/attended scaling; telemetry phase preserved) |
| threshold state → candidacy/movement | quintessence state → filter pipeline + scoreAndSelect | **add** (the previously missing consumer of `weakened/critical/broken`) |
| motive receipts → header classification | THR-631 receipts → `motiveClassifier` → WS2 | **extend** (new pure read; write side untouched) |
| `requiredTraits` gate | templates → filter pipeline | **preserve** (traitVariants reuse its resolution) |
| orphan draw paths (THR-779) | cache arrays/family prefixes → candidacy | **extend** (17 wired) / **retire** (44 deleted, WS5) |

## Kill criteria (falsifiers + revert)

- **Pacing wrong if:** at defaults, a 360-tick seed-42 medium CLI run shows >5% of living mortals simultaneously broken, or median ticks-broken outside 84–168 (1–2 game weeks). Measured headlessly via the existing phase-2 balance telemetry + `__DEBUG.getBrokenAgents()`; the fix is the four erosion/restore constants, not structure.
- **Odds model wrong if:** `__DEBUG.getOutcomeDistribution()` (THR-571 KPI bands) shows attended encounters' realized band split diverging from forecast-tier expectation by more than the KPI amber band across 3 seeds — then nudge `forecastDelta` calibration (WS1 authoring guidance) is wrong, not the modifier plumbing.
- **Revert path:** the feature is absent-safe — `BROKEN_GATE_ENABLED=false` (the shipped default) kills the gate; setting `EROSION_BAND_MULT_CRITFAIL`/`EROSION_ATTENDED_MULT`/`DIFFICULTY_EROSION_SCALE` to 1/1/0 restores flat 0.03 erosion; templates without `nudges[]` never enter the nudge path. Full pre-WS0 behavior is a constants-only rollback.

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — constants table above |
| 2 Inspectability | PASS — named modifiers, transition traces, `__DEBUG` surfaces, forecast factor list |
| 3 Determinism | PASS — riders map bands deterministically; reroll draws from the existing seeded stream |
| 4 Fail-soft | PASS — table above; whole feature absent-safe |
| 5 Narrative over mechanical | PASS — bandProse riders make the misfire narratable; broken is story, not stun-lock |
| 6 Additive | PASS with note — the 44 deletions are audit-verified dead weight, staged in WS5, not here |
| 7 Performance budget | PASS — attended-only scope; broken check is O(1) per candidacy pass |

## Forked-audit verdicts

**NFP auditor (opus, 2026-07-26): REVISE → integrated.** Three blocking findings, all fixed inline: (1) `reroll_once` rider deleted — an extra rng draw shifts every downstream stream consumer (hazard already guarded at `unifiedActionResolution.ts:1273`); riders are now pure band-mapping, zero draws. (2) `QUINTESSENCE_RATIO_FLOOR` renamed and specified as a ratio clamp, not an erosion amount. (3) The `'broken'` terminology collision resolved: the threshold enum literal (ratio 0, dissolution) is untouched; the behavioral state is driven by `isBrokenMortal()` and the UL proposal defines both terms. Non-blocking notes (throughput phrasing, `brokenSince` wording, `REBUILD_RESTORE_BASE` consumer = WS5) accepted.

**Three-pillar auditor (opus, 2026-07-26): REVISE → integrated.** Sections complete, N/A rationales honest. Four precision defects fixed: host type is `ActionStep` (not "UnifiedActionStep"); `bandProse` keys on `StepOutcome` (the six-value step enum incl. `near_miss`), **not** `OutcomeBand` (`outcomeConsequences.ts` — an unrelated enum that would have type-checked while wrong); riders defined over the full six-value domain (`floor_at_cost` floors `near_miss` with `failure`); the existing constant name `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION` used throughout. Fate-image mapping notes `near_miss` folds to the failure image.

**Vision auditor (opus, 2026-07-26): REVISE → integrated.** Verdict: the spine is Vision-strengthening ("the intervention shifted the odds, not the outcome" made literal). Two fixes taken: (1) `BROKEN_GATE_ENABLED` ships **false** — the broken gate cannot go live before WS5's rebuild encounters exist ("failure is plot, not punishment"); flipping it is a WS5 Done-when. (2) The rulebook amendment names the exact [IMPL] rule the `no_crit_fail` rider amends. Advisories: `reroll_once` concern mooted by its deletion; essence-stays-numeric divergence documented with rationale; rebuild road confirmed primary recovery.

## Intent-judge verdict

Round 1 (2026-07-26, opus, cold): **Revise** — four GAPs (restore-action owner, attended predicate unnamed, touchWorld call sites, kill criteria). All four integrated inline. Round 2 (same judge, cold re-read, source-verified): **Allow** — 0 GAPs, 0 VIOLATIONs; `story_beat` tier and promotion traces verified against `src/types/attention.ts`; `divine.*` prefix confirmed pre-existing (no catalog-chain hazard). Non-blocking notes (wiring-guide/wiring-checklist/generated-freshness, THR-779 description anchor) integrated above and in the handoff.
