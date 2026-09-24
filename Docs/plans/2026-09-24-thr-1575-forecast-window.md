> **title:** The forecast window — mortals take on challenges they can win about half the time; skill decides which — THR-1575
> **linear_issue:** THR-1575
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `done — difficulty re-read as "the proficiency a step demands"; coverage report is the brief for higher-level content, authored later by ruling` · UI `done — the sheet's reach words and the encounter skill line read one curve; designer view carries the engagement verdict`

# The forecast window — THR-1575

*A mortal engages a challenge when its own forecast says it can win about half the time. Who the mortal is decides which challenges those are — so success stays level across the world while what a mortal attempts grows with them.*

## Why this is load-bearing

**Director ruling (Christian, chat, 2026-09-24; recorded on the ticket):** *"we will aim for agents aiming for the same general success rate … who a mortal is should count a lot. The scaling should allow more proficient mortals to tackle higher difficulty challenges … less proficient mortals would shy away from higher difficulty encounters … the 50–65% success rate is what a mortal would deem acceptable as forecast in order to actually actively engage with the challenge."* And: *"lets get the right long term design back on, and then we can always create more higher difficulty encounter, monster and undertaking content."*

Measured on `main` 2026-09-24 (KPI report seeds 42/99/7 × 120 ticks; plus 3,100 step rolls, seeds 42/99 × 300 ticks):

| Measure | Target | 2026-07-04 | Today |
|---|---|---|---|
| Encounter total success (KPI) | 0.50–0.65 | 0.55–0.61 ✓ | **0.70–0.78** ✗ on 2 of 3 seeds |
| Step rolls pinned at exactly the local floor 0.65 | — | — | **44%** |
| Success, weakest vs strongest protagonist reach | — | — | **61% → 79%** |
| Success, authored difficulty 0.1 vs 0.7 | — | — | **77% → 73%** |

Neither who the mortal is nor what it faces moves the odds much, and the world has drifted easier since July. Four causes, all verified on `main`:

1. **The capability curve saturates.** `computeCapability` is a sigmoid with midpoint 10, k 0.4 (`domainCapability.ts:16-18`), fitted in March for raw 2–25. TB-056 (`b15e3ce9`) later made protagonists' seeded raw 10–40+ the base of the score without re-fitting it: raw 20 reads 0.98.
2. **`P = capability − difficulty` only works because capability is saturated.** At par (capability = difficulty) it gives 0%.
3. **The scale floors pin the odds.** `MIN_PROBABILITY_BY_SCALE` (personal 0.70, local 0.65) caps difficulty so a capable actor never rolls below the floor (`resolutionScaleAdjust.ts:62-67, 123-135`). Nearly all content is `local` (every legacy entry hard-codes it, `encounter-content.ts:311`).
4. **Mortals choose with a forecast that is not the roll, and always choose the easiest.**
   - The planner skips the scale adjustment (`plannerForecast.ts:133-146`).
   - It inflates difficulty with multipliers the roll never applies (`encounterCache.ts:247-250, 478`).
   - It counts continue-weakened failures as losses (`plannerForecast.ts:277`).
   - Its growth term is constant: 0–1 values are passed to a 0–100 function (`encounterScoring.ts:1149-1151`).
   - The outgrowth filter reads saturated capability and strips ~75% of content from protagonists (`encounterFilterPipeline.ts:533-570`).

The fix is one system moving together: **dice that separate skill levels**, **a forecast that is the roll**, and **a choice rule that seeks the window**. Adding harder content later then gives masters work without making the world easier or harder for anyone else.

**The invariant this plan makes testable, so the principle cannot drift again:** realised success is **level across proficiency bands** (50–65% in every band that has enough content), and **the difficulty a mortal attempts rises with its proficiency**.

## Mortal behaviour goals — and the two failure modes this must never recreate

**Christian, chat, 2026-09-24:** *"in the beginning of the game … we had too many failures that led to mortals either retrying the same content over and over and not getting anywhere, or actually losing skill (reach level) because of penalties, and so also becoming stuck. we want neither of those failure modes here. the overall goals for mortal behavior is variety, tension, progression and theme."*

This plan raises failure from ~25% to ~35–50% of engagements on purpose, so both historical traps are designed out explicitly. Each guard has a test or KPI that fails when it drifts.

| Goal / trap | What guarantees it | Evidence that fails when it drifts |
|---|---|---|
| **Trap 1 — retry loops.** A failed mortal still sees the same even odds, so without a guard it comes straight back to the same challenge. | **Failure cooldown (S4):** a template the mortal *failed* stays on cooldown `FAILED_TEMPLATE_COOLDOWN_MULT` × the completion cooldown (`filterByCooldown`, `phaseAgentDecision.ts:129`). Today every resolved outcome gets the same short cooldown, as little as `COOLDOWN_MINIMUM` 2 ticks. The existing familiarity discount (−0.20 per attempt, cap −0.70) and `MAX_COMPLETIONS_PER_TEMPLATE` (5) stay. | KPI `retry_after_failure_rate`: the share of failed free-choice engagements followed by the same mortal engaging the same template within `RETRY_WINDOW_TICKS`. It must be ≤ `KPI_RETRY_AFTER_FAILURE_MAX`. |
| **Trap 2 — skill loss and becoming stuck.** Failure penalties lowered reach, lower reach meant more failure, and mortals spiralled. | **Failure never lowers reach.** Verified on `main`: encounter growth writes the `experience` trait, which has no decay, and a failed step still grows it (`computeGrowthAmount`, `capabilityGrowth.ts:93-109`, ~64% of a success's growth near the old saturation). Failure's costs stay where they are today: temporary conditions, quintessence, standing, and story artifacts. None of them rewrites `domainCapabilities` or the experience level. **Setback shift (S4):** after consecutive failed engagements, a mortal looks for something it can win. Its window shifts easier by `SETBACK_WINDOW_SHIFT` per failure, capped at `SETBACK_WINDOW_SHIFT_MAX`, and resets on its next success. | A unit test: a failed resolution never decreases `computeRawScore` on the step's reach. KPI `max_failure_streak` (p95 of consecutive failed free-choice engagements per mortal) must be ≤ `KPI_FAILURE_STREAK_P95_MAX`. |
| **Progression** — mortals grow into harder challenges. | Growth on every engagement; the re-fitted curve makes growth move the odds; the window moves the mortal onto harder content as it grows. | KPI `attempted_difficulty_trend`: for mortals with ≥ `KPI_TREND_MIN_ENGAGEMENTS` engagements, the median per-mortal slope of attempted difficulty over ticks is > 0. The invariant's "difficulty rises with proficiency" is the population view of the same thing. |
| **Tension** — outcomes are genuinely open. | The window itself: free-choice engagements sit at 50–65%, reading *uncertain*/*favorable*. | The level-success invariant; `KPI_IN_WINDOW_MIN`. |
| **Variety** — mortals do not collapse onto a few safe templates. | The fit is a *multiplier*. Cooldowns, familiarity, novelty, the share ceilings and the too-easy side of the fit (masters leave beginner content) all stay. | The existing KPIs `template_top_share` and `template_entropy` must hold their thresholds before and after S4. |
| **Theme** — mortals pursue what they care about. | The fit multiplies the score and never replaces it. Desire (THR-1525 both poles), ambition, faction, reputation and resonance terms still decide *which* in-window challenge a mortal picks. | A unit test on `scoreUnifiedBoard`: of two in-window candidates, the one with the higher desire multiplier wins. |

**Out of scope, flagged (corrected 2026-09-24 by measurement):** mastery traits (`subcategory: 'mastery'`, granted today only by mentorship graduation) carry a decay rule — a level lost every `MASTERY_DECAY_PERIOD` (48) ticks without reinforcement (`traits.ts:161-199`). **It never fires.** `grantMasteryTrait` does not write `lastReinforcedTick`, so the check compares against `NaN`; a trait granted at tick 177 on seed 99 was unchanged at tick 300. Mastery is also rare (0–2 per 300 ticks) and worth +0.1 raw per level. So it is not a skill-loss path. The real finding — graduation gives almost nothing, and the decay rule is dead — is filed as [THR-1584](https://linear.app/threadbare/issue/THR-1584) (recommendation: mastery permanent, rescaled after THR-1581). An earlier draft of this paragraph said the traits do decay; that came from reading the code without running it.

## Substrate inventory

Grepped `Docs/canon/systems-inventory.md` and `src/engine/` for capability, resolution, forecast, planner, outgrowth, scoring, decision board, awareness and KPI. Everything this plan needs exists; nothing is green-field except the fit function and its trace.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `domain` — `domainCapability.ts` (`computeCapability`, `computeTier`) | 🟢 ACTIVE | **extends** — re-fitted curve for dice readers; a named pre-refit reader keeps non-dice readers' numbers |
| `resolution` — `resolutionService.ts` `computeResolutionThreshold` (the one P formula) | 🟢 ACTIVE | **extends** — odds at par plus gain times the gap |
| `resolution` — `resolutionScaleAdjust.ts` scale offsets + floors | 🟢 ACTIVE | **extends** — floors retired to `PROBABILITY_FLOOR`, difficulty-cap switched off; offsets kept |
| `step` — `stepResolutionCore.ts` | 🟢 ACTIVE | **preserves** — inherits the formula; THR-571 floor-upgrade becomes inert by value |
| `scaled` — `scaledForecast.ts` `forecastActionAtScale` | 🟢 ACTIVE (UI-only callers) | **extends** — the planner becomes a second caller |
| `planner` — `plannerForecast.ts` | 🟢 ACTIVE | **extends** — forecasts through the scaled forecast; completion mirrors `computeFinalActionOutcome` |
| Encounters & Dilemmas — `encounterScoring.ts` `scoreAndSelect`, `encounterFilterPipeline.ts`, `encounterCache.ts` | 🟢 ACTIVE | **extends** — fit multiplier; outgrowth retired by switch; planner-only multipliers switched off; growth-term units fixed |
| `decisionBoard.ts` `scoreUnifiedBoard` (encounters vs undertakings) | 🟢 ACTIVE | **extends** — the same fit on both score lines |
| `undertaking` — `undertakingCheckpoints.ts`, `decisionBoard.forecastAdvanceProbability` | 🟢 ACTIVE | **preserves** — inherits the dice; its forecast becomes the undertaking's fit input |
| `idleBehavior.ts` `resolveIdleBehavior` | 🟢 ACTIVE | **preserves** — the fallback when nothing is engageable (drift / trivial local / stay) |
| Encounter awareness — `encounterAwareness.ts` | 🟢 ACTIVE | **preserves** — reads the pre-refit curve; sight is out of scope |
| KPI — `kpi/gameplayKpi.ts`, `kpiConstants.ts`, `simulationRuntime` lifetime counters | 🟢 ACTIVE | **extends** — per-proficiency-band counters, engagement counters, band invariant |
| Fights — `fights/fightStepInputs.ts`, `testing/fightCalibration.ts` | 🟢 ACTIVE | **preserves** — inherits the dice; the calibration is re-run against its kill criterion |

Runtime population consumed: 63 distinct acting mortals made the 3,100 rolls (seeds 42/99, 300 ticks). 96% of rolls were `spotlight` tier. 97% of rolls were `local` scale.

## Engine pillar

### Systems design

Four moving parts, in four slices (§ Slices).

**1. The dice (S3).** `computeResolutionThreshold` (`resolutionService.ts:90`) becomes:

```
P = clamp( ODDS_AT_PAR + ODDS_GAIN × (capability − difficulty) + sphereFactor + actionModifiers + influenceNudge,
           PROBABILITY_FLOOR, PROBABILITY_CEILING )
```

- `difficulty` now reads **"the proficiency this step demands"**, on the same 0–1 scale as capability. A mortal exactly as able as the step demands rolls `ODDS_AT_PAR`, which is *uncertain*: the player hesitates.
- **Modifiers stay outside the gain.** A nudge card's +0.10 still means +10 points, so every authored card magnitude and `nudgeAuthoringConstants.ts` keep their meaning. The same holds for standing modifiers once THR-1535 lands.
- `computeCapability` re-fits to `SIGMOID_MIDPOINT = 30`, `SIGMOID_K = 0.08`. Raw 10 reads 0.17, 20 reads 0.31, 30 reads 0.50, 40 reads 0.69, 60 reads 0.92.
- `MIN_PROBABILITY_BY_SCALE` becomes `PROBABILITY_FLOOR` at every scale.
- **The difficulty-cap branch of `applyScaleDifficultyAdjust` is switched off** by a new `SCALE_FLOOR_DIFFICULTY_CAP_ENABLED = false`. This is load-bearing:
  - The branch computes `maxDifficulty = cap + mods − minFloor`, which is the old formula's arithmetic.
  - Under the new formula it would cap difficulty at a gap of roughly −0.05, a silent floor near 0.61.
  - It must be off, not merely fed a lower floor.
- `SCALE_DIFFICULTY_OFFSETS` are kept. Personal content stays easier, cosmic harder; the window absorbs them.
- **The THR-571 floor upgrade (`stepResolutionCore.ts:254-265`) goes inert by value.** No probability can fall below a 0.05 floor it is compared against. No code is deleted.
- Modelled on the recorded rolls with today's (unchanged) choices: total success ~57% (sd 0.24, today 0.10). Weakest-reach rolls ~45%, specialist reach ~94%, easy steps 63%, hard steps 44%.

**2. The forecast is the roll (S2).** The number a mortal plans with is the number the dice use, except for things the mortal cannot foresee (a god's nudges, a company assist, push/resist).

- `forecastStepProbabilities` and `estimateStepProbability` (`encounterScoring.ts:789-802`) forecast through `forecastActionAtScale` with the template's `scale`. The cache entry gains `scale` and per-step `stepFailBehaviors` (`encounterCache.ts` `buildEntryUnified`).
- **Planner-only difficulty multipliers switched off.** The late-game ×1.3 tier multiplier and the danger ×(1+0.5·danger) apply to the planner's cache difficulty but never to the roll. They go behind `PLANNER_DIFFICULTY_MULTIPLIERS_ENABLED = false`, and the cache stores authored difficulty. If danger should deter, a later ticket adds it as a named *cost* term, never as a false probability.
- **Engagement forecast `F`** = the planner's probability that the action ends in the success family (`critical_success · success · success_at_cost`). It mirrors `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:318`): only a failure on a `fail_action` step, or a critical failure on any step, ends the action.
  - As a formula: `F = ∏ steps (1 − P(crit_fail) − [failBehavior = fail_action] × P(failure))`.
  - The existing `completionProb` product counts continue-weakened failures as losses. It stays for expected utility; `F` is new.
- **Growth-term units bug fixed.** `difficultyScaling(avgDifficulty × 100)` at `encounterScoring.ts:1149-1151`.
- Undertakings already mirror the dice (`forecastAdvanceProbability`, `decisionBoard.ts:653`). Their `F` is that probability.
- **Standing modifiers:** once THR-1535 puts `computeResolutionModifiers` in the roll, the planner adds the same per-agent, per-reach total, computed once per decision pass. S2 ships the parity test without it; THR-1535's executor extends it (§ Notes for the executor).

**3. The forecast window (S4).** A new pure module `src/engine/engagementWindow.ts`:

```ts
export interface EngagementFit {
  fit: number;              // multiplier on the candidate's score, 0 when refused
  zone: 'refused' | 'below' | 'in' | 'above';
  windowLow: number;        // after the personality shift
  windowHigh: number;
}
export function computeEngagementFit(
  forecast: number,         // F, 0..1
  courageLean: number,      // axiologicalProfile.courage_prudence incl. drift, −1..+1
  consecutiveFailures: number, // free-choice failures since the mortal's last success
  opts?: { exemptTooEasy?: boolean },
): EngagementFit;
```

- **Window:** `[ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH] − ENGAGE_PERSONALITY_SHIFT × courageLean + setbackShift`, so a bold mortal (lean +1) accepts 0.45–0.60 and a cautious one (−1) wants 0.55–0.70. The same general rate holds, per the ruling.
- **Setback shift:** `min(SETBACK_WINDOW_SHIFT × consecutiveFailures, SETBACK_WINDOW_SHIFT_MAX)`. The count is the mortal's consecutive failed free-choice engagements (outcome `failure` or `critical_failure`), read from its resolved actions. It resets on the next success-family outcome. A mortal that has failed three times running looks for something it can win.
- **Failure cooldown:** `filterByCooldown` (`phaseAgentDecision.ts:129`) sets a failed template's cooldown to `FAILED_TEMPLATE_COOLDOWN_MULT ×` the effective completion cooldown. Success-family outcomes keep today's cooldown.
- **Fit:**
  - 1 inside the window.
  - Below it, linear from 1 down to `ENGAGE_BELOW_FIT_MIN` at `ENGAGE_REFUSE_BELOW`, and 0 (refused) under that. **Mortals shy away from challenges above them.**
  - Above it, linear from 1 down to `ENGAGE_TOO_EASY_FIT` at `ENGAGE_TOO_EASY_AT`, and flat after. **Challenges beneath a mortal are allowed but unattractive**, so masters never idle for lack of master content.
- **Where it applies:**
  1. `scoreAndSelect` multiplies `finalScore` by `fit` before the sort (`encounterScoring.ts:1459`), so the top 5 handed to the board is already window-ranked. This closes the gap where the board only sees the top 5.
  2. `scoreUnifiedBoard` multiplies both score lines, encounter (`decisionBoard.ts:498`) and undertaking (`:562`), and records `forecastFit` / `forecastZone` on `BoardEntry`.
- **Exemptions:**
  - Branching quests keep today's outgrowth exemption as `exemptTooEasy`; they are still refused below `ENGAGE_REFUSE_BELOW`.
  - Anything that is not a mortal's free choice bypasses the window: appointment re-ranking (`phaseAgentDecision.ts:841-870`), seeded or forced arrivals, a lair confrontation's fight, `?spawn=`/debug spawns, and The First's meeting. Fate and promises are not choices.
- **Outgrowth retired by switch.** `OUTGROWTH_FILTER_ENABLED = false`; the too-easy side of the fit replaces it. The code stays (NFP #6).
- **Fallback.** When every candidate is refused, the existing idle path runs (drift toward an ambition, a trivial local encounter, or stay; `idleBehavior.ts:161`). No new fallback is invented. An empty window shows up in the idle-rate and coverage KPIs as a content gap, not as a frozen mortal.

**4. Readers that are not the dice keep their numbers (S3).** `domainCapability.ts` gains `computeCapabilityPreRefit(graph, id, reach)`. It is the same raw walk through `PRE_REFIT_SIGMOID_MIDPOINT = 10`, `PRE_REFIT_SIGMOID_K = 0.4`, with a `// TODO(THR-deferral)` naming the re-fit Deferral. **The rule for each call site:** does this read feed a d100 probability, or a choice between candidates by their odds? If yes, it uses `computeCapability`. If no, it uses the pre-refit reader. Starting classification (the executor verifies each against the rule):

| New curve — dice and odds-based choice | Pre-refit reader — sight, gates, tiers, growth |
|---|---|
| `unifiedActionResolution.ts:401`, `encounter.ts:155, 402` | `encounterAwareness.ts:207` (awareness hops) |
| `buildNudgePhaseModel.ts:669`, `buildSimpleEncounterStageModel.ts:139`, `phaseAscendantHandFilter.ts:136` | `capabilityGrowth.ts:165, 262` (growth and `tierCrossed`) |
| `plannerForecast.ts:261, 340, 409`, `encounterScoring.ts:819, 1155`, `encounterFilterPipeline.ts:561, 646`, `decisionBoard.ts:699` | `mentorshipOutcomes.ts`, `mentorshipUndertaking.ts`, `notableAgendas.ts`, `phaseReputationTraits.ts:268` |
| `undertakingCheckpoints.ts:509`, `branchDecision.ts:222`, `groups/groupResolution.ts:101` | `encounterScoring.ts:449, 456` (anomaly thresholds), `socialEncounterGeneration.ts:531`, `strategicGraphOps.ts:1267` |
| `contestation.ts:235-238`, `controlContestationResolver.ts:126, 194`, `ruins/delveVariant.ts:470`, `kpi/branchingDistance.ts:210`, `testing/fightCalibration.ts` | `socialLeverage.ts`, `reputationWalk.ts`, `armySpawning.ts`, `phaseAscendantProgression.ts` |

A read that computes its own `cap − diff` probability rather than calling `computeResolutionThreshold` moves onto `computeResolutionThreshold` in the same slice, so there is one formula.

**The measurement (S1, no behaviour change).**
- `scripts/measure-roll-spread.ts` → `npm run measure:roll-spread`. It productises the 2026-09-24 scratch measurement and reports:
  - the P histogram;
  - the share of rolls pinned at a scale floor;
  - success by raw-score band and by authored difficulty;
  - **content coverage**: drawable templates, undertaking verbs and monster cards whose at-par proficiency falls in each band.
- New lifetime counters on the runtime (§ KPI).
- The heavy-lane invariant test (§ Done when).
- The `runTick(state, runtime)` argument-order bug in `scripts/measure-nudge-headroom.ts:74` is fixed. Every tick after tick 0 crashed, so its tick-mode numbers were never real.

### Graph nodes / edges

None added or changed. Capability, difficulty and personality are read from existing properties (`domainCapabilities`, the has_trait / possesses / bonded_to / controls walk, `axiologicalProfile.courage_prudence`). The cache entry and `BoardEntry` gain fields; both are runtime structures, not graph.

### Tick phases

No new phase. The fit runs inside the existing agent-decision phase (`phaseAgentDecision.ts` → `runFilterPipeline` → `scoreAndSelect` → `scoreUnifiedBoard`). The dice change is inside step resolution, wherever it already runs. The KPI counters increment where lifetime outcome counters already do (`orchestrator.ts:3862-3876`).

### Resolution logic

The formula is in § Systems design. **Terminology:** "difficulty = the proficiency a step demands" is filed for the UL as [THR-1577](https://linear.app/threadbare/issue/THR-1577/ul-proposal-difficulty-step-the-proficiency-a-step-demands), to seat when S3 lands. The band names below (novice · journeyman · expert · master) are **KPI-internal bucket labels**. They are never rendered to a player and are not the Domain Capability tier words in `domain-words.ts`; a surface that ever shows them owes its own UL-proposal. **Proficiency band** of an engagement = the acting mortal's `computeCapability` on the template's primary reach at commit time, bucketed by `PROFICIENCY_BAND_EDGES` (novice < 0.35 ≤ journeyman < 0.65 ≤ expert < 0.85 ≤ master). **Attempted difficulty** = the mean authored step difficulty after the scale offset. Proficiency and forecast are stamped at commit into a runtime-side map keyed by action id, so `UnifiedAction` gains no field (§ Blast Radius). The resolution-time counter reads the map and deletes the entry.

### PRNG callouts

None. The fit is deterministic arithmetic. `scoreAndSelect` and `scoreUnifiedBoard` stay argmax with their existing index tie-breaks. The step core still draws at most two values in the same order. `stepResolutionGolden.test.ts` pins `roll` and `probability` per row, so its `probability` column changes by design and its `roll` column must not; that is the stream-break check. `measure-roll-spread` and the invariant test run seeded worlds only.

## Content pillar

### Encounter templates

- **No template is rewritten.** Authored `difficulty` values stand, re-read as "the proficiency this step demands". The four difficulty words (`gentle` < 0.30 · `fair` < 0.45 · `steep` < 0.60 · `severe`, `DIFFICULTY_WORD_BANDS`) keep their bands.
- **Authoring guidance changes in S1.** The systemic wiring guide (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) and `Docs/canon/encounters.md` gain one paragraph: pick a step's difficulty as the proficiency level of the mortal it is written for, and expect mortals of that level to engage it at about even odds.
- `NUDGE_OFF_REACH_MAX_DIFFICULTY = 0.45` (THR-821/831) is re-measured in S3 with the fixed headroom script. If the constraint no longer holds its stated purpose, S3 retunes the constant and records the measurement; no card is re-authored.
- `MEETING_TEST_CAPABILITY = 0.8` (`meeting-nudge-constants.ts`) was set to stop a mid-difficulty meeting reading *doomed* under the old formula. Under the new one, 0.8 against difficulty 0.5 reads *fated*. S3 re-sets it so an unled mid-difficulty meeting reads *uncertain*, the shape its tests already pin.

### Prose tables

N/A — no prose is generated from the odds. Forecast and difficulty words are unchanged vocabularies; only which word a step shows moves.

### Attachment content

N/A — item and condition magnitudes are additive modifiers outside the gain and keep their meaning.

### Data tables

- **Coverage is the brief for later content.** Christian ruled higher-difficulty content is authored after the algorithm is right. S1's coverage report names the gap per band (expected: expert and master thin, since ~70% of authored steps sit at difficulty ≤ 0.40 and undertaking verbs sit at 0.35–0.60).
- After S4 lands, a follow-up ticket for expert- and master-level encounters, monsters and undertakings is filed from that report into **Todo**, not Ready for Dev. That is authoring work with its own design.
- Fight card difficulties (`fight-constants.ts:18-23`, gentle 0.20 … severe 0.65) are re-checked by S3's fight-calibration run. They change only if the fight block's kill criterion fails (`Docs/plans/2026-09-23-fight-block.md:590`).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — the agent sheet and the encounter stage).*

### Player-facing display

- **The sheet's reach words (S5).** The character sheet (`agentDetail.ts:693`, 1627–1628, 1681–1682) reads the raw `domainCapabilities` through `getDomainTier`, a 0–10 function, so every mortal shows the top word in every reach. It switches to `computeCapability` (the dice curve, including traits and items), passed through `getDomainTier(capability × CAPABILITY_TO_DOMAIN_SCALE)`. That is the same call the encounter skill line makes (`stepFactorLines.ts:151`), so **the sheet and the skill line say the same word for the same mortal and reach**.
- **Forecast words are unchanged**, and now spread. A mortal's own chosen challenges read mostly *uncertain*/*favorable*. The long odds a god pushes a mortal into read *perilous*/*doomed*.
- **UI Laws engaged:** 1, 13/14, 17, 21, 33, 37 (the THR-1007 minimum), plus the UI Law of `design-governance.md`. Magnitudes stay words; no number reaches the mortal-facing surface (THR-772 ruling 1).

### Event notifications

N/A — no new alert, toast or chronicle entry. Existing chronicle entries (failures, aftermath) change in frequency only; `failure_story_rate` guards that every failure still leaves an artifact.

### Debug inspection (DebugPanel)

- New trace category `engagement_decision` (§ Tracing). It appears in the DebugPanel trace viewer by category, like every other trace.
- `window.__DEBUG.getEngagementVerdicts(agentRef?: string, limit = 20)` → `Promise<EngagementDecisionTrace[]>`, read from the trace buffer. It returns `[]` when tracing is disabled, like `getTraces`, and says so in its JSDoc in `src/debug-bridge.d.ts`.
- `resolution.input` gains `reach` (additive). The 2026-09-24 measurement had to recover it by inverting the sigmoid.

### Visual presence (HexMapV2)

N/A — no map signifier reads odds or engagement.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `resolutionService.computeResolutionThreshold` (new formula) | step resolution (unified, legacy, undertaking, fight) | nudge stage forecast via `forecastActionAtScale` | — | `resolution.input` (+`reach`) | DebugPanel designer view numbers |
| `domainCapability.computeCapability` re-fit + `computeCapabilityPreRefit` | every reader per § 4 | sheet Prowess tab, stage skill line | — | — | sheet + skill line words |
| `plannerForecast` / `encounterScoring` forecast parity + `F` | agent decision (`phaseAgentDecision`) | — | encounter cache entry (`scale`, `stepFailBehaviors`) | `encounter_scoring` (+`engagementForecast`) | `getEngagementVerdicts` |
| `engagementWindow.computeEngagementFit` | agent decision: `scoreAndSelect` + `scoreUnifiedBoard` | — | `BoardEntry.forecastFit/forecastZone` | `engagement_decision`, `decision_board_comparison` (+fit) | trace viewer, `getEngagementVerdicts` |
| KPI band counters + invariant | resolution counter site `orchestrator.ts:3862-3876` | — | `SimulationRuntime` lifetime counters | — | `npm run gameplay-report`, `measure:roll-spread` |

Player controls: none added. The god's nudge hand is unchanged; it simply now matters at uncertain odds.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SIGMOID_MIDPOINT` | 30 (was 10) | Raw score that reads capability 0.5 — the middle of the protagonist range |
| `SIGMOID_K` | 0.08 (was 0.4) | Slope; raw 10→0.17, 40→0.69, 60→0.92 |
| `PRE_REFIT_SIGMOID_MIDPOINT` / `PRE_REFIT_SIGMOID_K` | 10 / 0.4 | Today's curve, kept for non-dice readers until the Deferral re-fits them |
| `ODDS_AT_PAR` | 0.55 | Success chance when capability equals difficulty — reads *uncertain* |
| `ODDS_GAIN` | 1.25 | Points of chance per point of capability gap |
| `MIN_PROBABILITY_BY_SCALE` | all `PROBABILITY_FLOOR` (was 0.70/0.65/0.20/0.05) | Scale floors retired |
| `SCALE_FLOOR_DIFFICULTY_CAP_ENABLED` | false (new) | Switches off the difficulty cap that encodes the old formula |
| `SCALE_DIFFICULTY_OFFSETS` | unchanged (−0.20/−0.10/0/+0.10) | Scale still shifts demanded proficiency |
| `PLANNER_DIFFICULTY_MULTIPLIERS_ENABLED` | false (new) | Planner cache stores authored difficulty, as the roll uses |
| `ENGAGE_WINDOW_LOW` / `ENGAGE_WINDOW_HIGH` | 0.50 / 0.65 | The ruling's acceptable forecast |
| `ENGAGE_PERSONALITY_SHIFT` | 0.05 | Window shift per unit of `courage_prudence` (bold lower, cautious higher) |
| `ENGAGE_REFUSE_BELOW` | 0.30 | Below this forecast a mortal will not engage on its own |
| `ENGAGE_BELOW_FIT_MIN` | 0.10 | Fit at the refuse edge |
| `ENGAGE_TOO_EASY_AT` | 0.85 | Forecast at which fit bottoms out on the easy side |
| `ENGAGE_TOO_EASY_FIT` | 0.25 | Fit for challenges beneath a mortal — allowed, unattractive |
| `OUTGROWTH_FILTER_ENABLED` | false (was true) | Replaced by the too-easy side of the fit |
| `SETBACK_WINDOW_SHIFT` | 0.05 | Window shift toward easier per consecutive failed engagement |
| `SETBACK_WINDOW_SHIFT_MAX` | 0.15 | Cap on the setback shift (three failures) |
| `FAILED_TEMPLATE_COOLDOWN_MULT` | 3 | A failed template's cooldown, as a multiple of the completion cooldown |
| `RETRY_WINDOW_TICKS` | 24 | Look-ahead for the retry-after-failure KPI |
| `KPI_RETRY_AFTER_FAILURE_MAX` | 0.10 | Max share of failures followed by the same mortal re-engaging the same template within the look-ahead |
| `KPI_FAILURE_STREAK_P95_MAX` | 4 | Max p95 run of consecutive failed free-choice engagements per mortal |
| `KPI_TREND_MIN_ENGAGEMENTS` | 5 | Min engagements for a mortal to count in the attempted-difficulty trend |
| `PROFICIENCY_BAND_EDGES` | [0.35, 0.65, 0.85] | novice · journeyman · expert · master |
| `KPI_BAND_SUCCESS_MIN` / `MAX` | 0.50 / 0.65 | The level-success invariant per band |
| `KPI_BAND_TOLERANCE` | 0.05 | Sampling slack on the invariant |
| `KPI_BAND_MIN_ENGAGEMENTS` | 30 | A band is asserted only with this many resolved engagements; below it is reported as coverage |
| `KPI_FLOOR_PINNED_MAX` | 0.05 | Max share of rolls sitting on a scale floor |
| `KPI_IN_WINDOW_MIN` | 0.60 | Min share of free-choice engagements whose `F` was in the window |
| `KPI_IDLE_RATE_DELTA_MAX` | 0.05 | Max rise in idle-decision rate against the pre-change baseline |
| `KPI_FORECAST_PARITY_MAX` | 0.02 | Max mean \|planner step P − resolver step P\| on the parity sample |

These are starting values from the 2026-09-24 model. S3 and S4 calibrate `SIGMOID_*`, `ODDS_*` and `ENGAGE_*` against the KPIs with the gauge, not by hand.

## Tracing

```ts
// EngagementDecisionTrace — emitted once per agent decision that reached the board (phaseAgentDecision)
interface EngagementDecisionTrace {
  category: 'engagement_decision';
  tick: number;
  agentId: string;
  windowLow: number;            // after the personality and setback shifts
  windowHigh: number;
  courageLean: number;
  consecutiveFailures: number;
  setbackShift: number;
  candidates: Array<{
    kind: 'encounter' | 'undertaking';
    id: string;                 // templateId or undertaking verb/cell id
    forecast: number;           // F
    proficiency: number;        // capability on the primary reach
    difficulty: number;         // mean demanded proficiency after scale offset
    fit: number;
    zone: 'refused' | 'below' | 'in' | 'above';
    exempt?: 'too_easy';        // branching quest
  }>;                           // the board's entries, max 5 + undertakings
  chosenId: string | null;
  reason: 'in_window' | 'best_available' | 'idle';
  summary: string;
}

// ResolutionInputTrace — additive field
interface ResolutionInputTrace { /* …existing… */ reach: ReachDomain; }

// ScoringTrace (encounter_scoring) and DecisionBoardComparisonTrace — additive fields
//   engagementForecast?: number; forecastFit?: number; forecastZone?: EngagementFit['zone'];
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Cache entry lacks `scale` (pre-S2 entry, social/lifecycle candidate) | Treat as `'regional'`, the existing `forecastActionAtScale` default |
| Cache entry lacks `stepFailBehaviors` | Treat every step as continue-weakened: `F` counts only critical failure as ending |
| `courage_prudence` missing / NaN | Lean 0 (no shift) |
| `F` is NaN or outside 0..1 | Clamp; NaN → zone `in`, fit 1 (today's behaviour for that candidate), trace the anomaly once |
| Every candidate refused | Existing idle path; `reason: 'idle'` traced |
| Engagement stamp missing at resolution (action committed before the upgrade, or by a bypassing path) | Counted in the KPI as band `unknown`; excluded from the invariant |
| Pre-refit reader on an actor with no `domainCapabilities` | Same raw walk as today (ambient actors read ~0.018) |
| Band with fewer than `KPI_BAND_MIN_ENGAGEMENTS` | Reported as a coverage gap; never fails the invariant |
| Consecutive-failure count unreadable (no resolved actions, pruned history) | 0 — no setback shift |
| Outcome of the previous action unknown when setting a cooldown | Today's completion cooldown (no failure multiplier) |

## Interface impact

Encounters & Dilemmas (core) is ⚪ UNAUDITED in `Docs/canon/interface-map.md`, so this plan writes its rows (audit-on-touch). The rows are verified by grep on `main` 2026-09-24. The executor registers **add** rows in `scripts/interface-contracts.ts` in the slice that adds them.

| Contract | Producer → consumer | Today | Action |
|---|---|---|---|
| `planner-forecast-equals-roll` | `computeResolutionThreshold` + `applyScaleDifficultyAdjust` → `plannerForecast`/`estimateStepProbability` | **LEAKED** — planner skips the scale adjustment and adds multipliers the roll never applies | **add** (S2) — parity test is its evidence |
| `stage-forecast-equals-roll` | `forecastActionAtScale` → `buildNudgePhaseModel` | LEAKED on standing modifiers (THR-1535) | **preserve** — THR-1535 owns the fix; the new formula flows through both sides |
| `capability-feeds-dice` | `computeCapability` → resolution, planner, contests, fights, undertakings | live, saturated | **extend** — re-fitted curve |
| `capability-feeds-sight-and-gates` | `computeCapability` → awareness, tiers, growth, thresholds | live, saturated | **extend** — repointed at `computeCapabilityPreRefit`; Deferral re-fits each |
| `engagement-forecast-gates-choice` | `computeEngagementFit` → `scoreAndSelect`, `scoreUnifiedBoard` | absent | **add** (S4) |
| `outgrowth-filters-easy-content` | `filterByOutgrowth` → filter pipeline | live, over-filtering on saturated capability | **retire** (S4) by switch — replaced by the fit's too-easy side (the session's delegated *how* under the 2026-09-24 ruling; the ruling itself does not name the filter) |
| `resolved-actions-feed-band-kpi` | resolution counter site → `gameplayKpi` | absent | **add** (S1) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/simulationRuntime.ts` | 164 | Additive lifetime counters and the commit-stamp map on the runtime; nothing renamed. Tests that construct a runtime by literal need the new fields defaulted in `createSimulationRuntime`. |
| `src/types/trace.ts` | 107 | One new trace interface plus optional fields on three existing ones. The trace union widens, so an exhaustive `switch` over categories (if any) must add a case. |
| `src/data/agent-behavior-constants.ts` | 62 | Two constant value flips plus one new switch. Tests asserting outgrowth-filter behaviour are repointed or deleted in S4 (their contract is retired). |
| `src/engine/encounterCache.ts` | 59 | Two additive entry fields; the multiplier switch. `eligibilityFunnel` and cache tests that assert multiplied difficulties change by design. |
| `src/engine/domainCapability.ts` | 55 | The curve change moves every capability value. Every test that pins a capability number or a "master" reading moves; the pre-refit reader keeps non-dice tests stable. |

`src/types/unifiedAction.ts` is deliberately **not** touched: the engagement stamp lives in the runtime map.

## Slices

| Slice | What | Blocked by | Behaviour change |
|---|---|---|---|
| **S1** Gauge | `measure:roll-spread`, band counters + KPIs in `gameplayKpi`/`kpiConstants`, heavy invariant test (skipped until S4 via `it.skip` with a `TODO(S4-ticket)`), `resolution.input.reach`, headroom-script fix, authoring-guide paragraph | — | none |
| **S2** Forecast parity | scaled forecast in planner, cache `scale`/`stepFailBehaviors`, multipliers switch, `F`, growth-units fix, parity test, `planner-forecast-equals-roll` row | — | small (planner only) |
| **S3** Dice re-fit | curve, formula, floors, difficulty-cap switch, pre-refit reader + call-site split, meeting capability, headroom constraint re-measure, fight calibration re-run | S1 | large (odds) |
| **S4** Forecast window | `engagementWindow.ts` (incl. setback shift), fit in `scoreAndSelect` + board, failure cooldown, outgrowth retired, `engagement_decision` trace + debug accessor, un-skip the invariant | S2, S3 | large (choice) |
| **S5** Words | sheet reads `computeCapability`; sheet/skill-line agreement test; browser capture | S3 | UI |

Plus two tickets that are **not** Ready for Dev: a Deferral to re-fit the pre-refit readers one by one on their own evidence, and the content follow-up from the coverage report (Todo, after S4).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (no rewrites by ruling; guidance, coverage brief, two re-set constants)
- [x] UI pillar present (sheet words, skill line, debug verdicts)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the north star ("the player hesitates"): a mortal's own challenges sit at open odds, so a card is worth hesitating over. It serves the non-negotiable that interventions *shift probabilities*: nudge magnitudes stay additive points. And it serves the cool-failure rule: 35–50% of engaged challenges fail, and `failure_story_rate` still guards every failure.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play (how odds form, and how mortals choose what to attempt).
- [x] `Docs/canon/rulebook.md` §7 and `rulebook-quick-reference.md` are updated **in this PR**, marked `[DESIGN — THR-1575]` until S3/S4 land. The "capability-poor by design" framing is replaced by the ruling. The nudge-floor paragraph's claim that spotlight mortals clear the floor on nearly every reach is corrected.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1575-forecast-window-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is a named constant (§ Constants); the retired floors and filter are switches or values, not deleted code |
| 2. Inspectability | PASS | `engagement_decision` trace names every candidate's forecast, fit and zone; `resolution.input` gains `reach`; the gauge reports why the world lands where it does |
| 3. Determinism | PASS | No new PRNG; argmax with existing tie-breaks; the golden test's `roll` column is the stream-break check |
| 4. Fail-soft | PASS | § Fail-soft; an empty window falls to the existing idle path, never a throw |
| 5. Narrative over mechanical perfection | PASS with note | Failure rises from ~25% to ~35–50% of engagements; every failure still leaves a story artifact. If the July at-cost texture (share 0.30–0.70) leaves its band, the finding goes to Christian, not a silent retune |
| 6. Additive over destructive | PASS | Pre-refit reader, switches for outgrowth, floors-by-value and planner multipliers; no `UnifiedAction` field; retired contract recorded |
| 7. Performance budget | PASS with note | Fit is O(1) per candidate; `F` reuses per-step P already computed; planner standing-modifier read (post-THR-1535) cached per agent per decision pass. S4 records `check:tick-cost` before and after |

## Done when

S1:
- [ ] `npm run measure:roll-spread -- --seeds 42,99 --ticks 300` prints the P histogram, the floor-pinned share, success by raw band and by difficulty, and content coverage per proficiency band. Its tick-0 numbers match the 2026-09-24 scratch measurement within sampling noise (floor-pinned ≈ 44%).
- [ ] `npm run gameplay-report` prints per-band success, per-band mean attempted difficulty, in-window share, idle rate, `retry_after_failure_rate`, `max_failure_streak` p95 and `attempted_difficulty_trend` for each seed. It records today's baseline for all of them in the PR body.
- [ ] `npm run measure:nudge-headroom -- --ticks 30` completes with no `Tick crashed` line.
- [ ] Wiki pages owed: `encounters-manual-reference` (if `encounterCache`/scoring files are touched), `system-interface-map`.

S2:
- [ ] A parity test samples ≥ 200 cache-entry steps across scales and asserts `mean |planner P − previewStepProbability P| ≤ KPI_FORECAST_PARITY_MAX`, with nudges, push, company and standing modifiers excluded.
- [ ] A fixture encounter with one `fail_action` step and one continue-weakened step: `F` equals the exact product, and differs from `completionProb`.
- [ ] Growth term varies with difficulty on a fixture (it is constant today).
- [ ] Wiki pages owed: `encounters-manual-reference`, `agents-reference`, `system-interface-map`.

S3:
- [ ] `stepResolutionGolden.test.ts` updated deliberately: the `probability` column changes and the **`roll` column is unchanged**. The PR body records the before/after band distribution.
- [ ] `measure:roll-spread`: floor-pinned ≤ `KPI_FLOOR_PINNED_MAX`. Success spread by raw band ≥ 30 points (weakest band vs specialist) and by difficulty ≥ 15 points.
- [ ] KPI report, with choices still S2's: total success within 0.45–0.72, `crit_failure_rate` ≤ 0.15, `failure_story_rate` ≥ 0.90, idle rate within `KPI_IDLE_RATE_DELTA_MAX` of baseline. **Kill criterion:** outside these, stop and report. Do not tune toward them by moving the floors back.
- [ ] Fight calibration (`fightCalibration.ts`) re-run against `Docs/plans/2026-09-23-fight-block.md:590`. Within tolerance, or the fight difficulty constants are re-set with the run recorded.
- [ ] Headroom script re-run; `NUDGE_OFF_REACH_MAX_DIFFICULTY` confirmed or re-set with the measurement recorded. `MEETING_TEST_CAPABILITY` re-set so the meeting's mid-difficulty step reads *uncertain*.
- [ ] Every pre-refit call site carries `// TODO(THR-<deferral>)`; the Deferral issue exists before the first reference (never predict its number).
- [ ] Wiki pages owed: `encounters-manual-reference`, `agents-reference`, `cosmology-reference` (if `capabilityGrowth.ts` is touched), `world-map-reference` (if `encounterAwareness.ts` is touched).

S4:
- [ ] **The invariant (heavy lane, `src/engine/__tests__/engagementWindow.invariant.test.ts`, `// @vitest-lane heavy`):** seeds 42/99 × 120 ticks. Every proficiency band with ≥ `KPI_BAND_MIN_ENGAGEMENTS` resolved free-choice engagements has success within `[KPI_BAND_SUCCESS_MIN − tol, KPI_BAND_SUCCESS_MAX + tol]`. Mean attempted difficulty rises strictly across those bands. In-window share ≥ `KPI_IN_WINDOW_MIN`.
- [ ] **If the invariant fails for a covered band:** calibrate only `ENGAGE_*`, `ODDS_*` and `SIGMOID_*` within the ranges the gauge supports. If it still fails, stop and post the gauge output on the ticket. **Whole-design kill criterion:** if the invariant cannot be met for the novice or journeyman band without restoring a scale floor or scaling difficulty to the actor, the premise ("enough content exists at lower levels") is wrong. The ticket returns to design, and the slice does not merge.
- [ ] KPI total success within 0.50–0.65 on seeds 42/99/7. The at-cost share is reported; **if it leaves 0.30–0.70, the executor stops and a finding goes to Christian** (his July ruling), with no retune.
- [ ] Unit tests for `computeEngagementFit`: zone edges, personality shift both ways, setback shift growth and cap, refuse, too-easy, `exemptTooEasy`.
- [ ] **The two historical traps (Christian, 2026-09-24):** on seeds 42/99/7 × 120 ticks, `retry_after_failure_rate` ≤ `KPI_RETRY_AFTER_FAILURE_MAX`, `max_failure_streak` p95 ≤ `KPI_FAILURE_STREAK_P95_MAX`, and `attempted_difficulty_trend` > 0. A unit test shows a failed resolution never decreases `computeRawScore` on the step's reach. A fixture shows a failed template's cooldown is `FAILED_TEMPLATE_COOLDOWN_MULT` × a succeeded one's.
- [ ] **Variety and theme hold:** `template_top_share` and `template_entropy` are within their KPI thresholds on the same seeds, before and after. A `scoreUnifiedBoard` unit test shows that between two in-window candidates the higher desire multiplier wins.
- [ ] `window.__DEBUG.getEngagementVerdicts('@hero')` returns verdicts with `F`, fit and zone after `enableTracing()` + `tick(20)`.
- [ ] `check:tick-cost` before/after recorded.
- [ ] Wiki pages owed: `encounters-manual-reference`, `agents-reference`, `system-interface-map`.

S5:
- [ ] A test asserts the sheet word and the skill-line word agree for the same mortal and reach across a seeded population, and that ≥ 3 distinct words appear across a protagonist's eight reaches on seed 42.
- [ ] Four-part browser evidence for the sheet's Prowess tab at 1920×1080 (Playwright; the sheet-capture route), console output, a `__DEBUG` assertion, and a UI-Laws line citing 1, 13/14, 17, 21, 33, 37.

Every slice:
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; for engine slices `npm run test:heavy` locally and a 30-tick CLI smoke.
- [ ] Closing commit body and PR body each carry their own slice's close line; this parent closes with the last slice.

## Coordination block

**Suggested model:** opus — the dice change moves every roll; calibration against a KPI with a kill criterion needs judgment, not transcription.

**Parallel-safe with:** THR-1565, THR-1566, THR-1567, THR-1568, THR-1569, THR-1573 (seed targets, battle deaths, wayside draw, item reactions, condition tags, follow button — none edit resolution, scoring, capability or the decision board). THR-1528 (battle-history record, `battleAftermath` only).

**Mutex with:**
- THR-1535 — both edit the roll's input sum in `unifiedActionResolution.ts` and move success rates. Land one, re-baseline, then the other. THR-1535 first is preferred: it is smaller, and its 10-point kill criterion is only meaningful on today's dice.
- THR-1556 and any open fight-block slice — S3 may re-set `fight-constants.ts` difficulties and re-runs `fightCalibration.ts`.
- THR-1576 — both touch how reach capability feeds a probability (colocation weights); S3's call-site split must classify its reader.

**Files to touch:**
- Create: `src/engine/engagementWindow.ts`, `src/engine/__tests__/engagementWindow.test.ts`, `src/engine/__tests__/engagementWindow.invariant.test.ts`, `scripts/measure-roll-spread.ts`
- Edit: `src/engine/domainCapability.ts` (curve + pre-refit reader), `src/engine/resolutionService.ts` (formula), `src/engine/resolutionScaleAdjust.ts` (floors, cap switch), `src/engine/plannerForecast.ts` and `src/engine/encounterScoring.ts` (parity, `F`, fit, growth units), `src/engine/encounterCache.ts` (entry fields, multiplier switch), `src/engine/encounterFilterPipeline.ts` (outgrowth switch), `src/engine/decisionBoard.ts` (fit on both lines), `src/engine/phaseAgentDecision.ts` (trace), `src/engine/kpi/gameplayKpi.ts` and `src/engine/kpi/kpiConstants.ts`, `src/engine/simulationRuntime.ts` and `src/engine/orchestrator.ts` (counters, stamp map), `src/types/trace.ts`, `src/data/agent-behavior-constants.ts`, `src/data/meeting-nudge-constants.ts`, `src/engine/agentDetail.ts` (sheet words), `src/debug-bridge.ts` and `src/debug-bridge.d.ts`, `scripts/measure-nudge-headroom.ts`, `scripts/interface-contracts.ts`, the pre-refit call sites in § 4, `Docs/canon/encounters.md` and `Docs/plans/2026-04-16-systemic-wiring-guide.md` (authoring paragraph), `package.json` (script)

## Notes for the executor

- **Do not restore any floor to hit a KPI.** The floors are the drift this plan undoes. If S3's kill criterion fires, stop and report.
- **Whole-design kill criterion (restated from § Done when S4):** if level success for the novice or journeyman band needs a floor or actor-scaled difficulty to hold, the design's premise is wrong. Return the ticket to design; do not ship around it.
- **Do not scale difficulty to the actor.** It makes success level trivially and skill meaningless (brainstorm § F). The mortal's choice does the matching.
- **The window is the mortal's free choice only.** Appointments, seeds, forced arrivals, lair fights, debug spawns and The First's meeting bypass it.
- **Nudges and standing modifiers stay outside `ODDS_GAIN`.** Multiplying them would silently rescale every authored card.
- **THR-1535 interplay.** When THR-1535 lands after S2, its executor adds the standing-modifier term to the planner and extends S2's parity test to include it. S2 files a comment on THR-1535 saying so. That is a bare id with no close keyword; THR-1535 is not closed by this work.
- **At-cost texture.** Christian's July ruling set the at-cost share band. It is his to move. Report it, don't tune it.
- **Content gaps are expected** for expert and master bands until the content follow-up. The invariant asserts only bands with enough engagements; do not lower `KPI_BAND_MIN_ENGAGEMENTS` to make a thin band pass.

## Intent-judge verdict

*2026-09-24. Proposal: `Docs/plans/.intent-proposals/2026-09-24-thr-1575-forecast-window.md`.*

**Allow.** Impact class High-risk, confirmed, with the explicit sign-off quoted in the proposal. Nine dimensions PASS; two GAPs, both closed in this revision:

- **Dim 6, UL:** the difficulty re-definition is filed as [THR-1577](https://linear.app/threadbare/issue/THR-1577/ul-proposal-difficulty-step-the-proficiency-a-step-demands), and the proficiency band names are declared KPI-internal (§ Resolution logic).
- **Dim 10, kill criteria:** the whole-design kill criterion and the covered-band failure action are now in § Done when S4 and § Notes for the executor.

The outgrowth-retirement attribution was corrected to "the session's delegated *how*" (§ Interface impact).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-24*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Full Constants table (§ Constants table) names every value (`SIGMOID_MIDPOINT`, `ENGAGE_*`, `KPI_*`, etc.); retired behaviors are flags (`OUTGROWTH_FILTER_ENABLED=false`) not hardcodes |
| 2. Inspectability | PASS | New `engagement_decision` trace lists every candidate's forecast/fit/zone; `resolution.input` gains `reach`; `getEngagementVerdicts` debug accessor; Wiring table maps modules→traces→debug visibility per checklist format |
| 3. Determinism | PASS | "None. The fit is deterministic arithmetic" (§ PRNG callouts); golden test's `roll` column pinned as the stream-break check; seeded-only gauge/invariant runs |
| 4. Fail-soft | PASS | Detailed § Fail-soft table (10 cases: missing scale, NaN F, all-refused→idle path, etc.), all resolving to safe defaults, never a throw |
| 5. Narrative over mechanical | PASS-with-note | Failure rises ~25%→35–50% by design, but `failure_story_rate ≥0.90` KPI-gated and at-cost-share drift routes to Christian, not silent retune (plan's own self-rated note, verified consistent) |
| 6. Additive over destructive | PASS | Pre-refit `computeCapabilityPreRefit` preserves non-dice readers; retired paths are constant switches (`SCALE_FLOOR_DIFFICULTY_CAP_ENABLED`, `PLANNER_DIFFICULTY_MULTIPLIERS_ENABLED`) with code left in place (NFP #6 cited explicitly); no `UnifiedAction` field added, stamp lives in a runtime map instead |
| 7. Performance budget | PASS-with-note | Fit is O(1) per candidate, `F` reuses already-computed per-step P; note is that the standing-modifier read is only "cached per agent per decision pass" post-THR-1535 (not yet), and `check:tick-cost` before/after is a Done-when promise, not measured evidence in the doc itself |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges (N/A, justified), tick phases, resolution logic, and PRNG callouts all filled with concrete formulas, constants, and call-site tables |
| Content | present-and-substantive | Encounter templates, prose tables (N/A-with-rationale), attachment content (N/A-with-rationale), and data tables sections all filled; explicitly no rewrites by ruling, with coverage-report follow-up named |
| UI | present-and-substantive | Player-facing display, event notifications (N/A-with-rationale), debug inspection, and visual presence (N/A-with-rationale) all filled with concrete accessor signatures and UI-Law citations |

No missing required sections. Wiring: the table maps five modules to orchestrator phase, UI component, GameState field, trace emitted and debug visibility. Substrate check: present and compliant; no green-field duplication — `engagementWindow.ts` is disclosed as new and plugs into the existing `scoreAndSelect`/`scoreUnifiedBoard`.

PILLAR AUDIT: PASS

### Vision audit

- `00-north-star.md` → "the player hesitates… nudge shifted the odds, fate picked the band" — **confirmed**.
- `01-core-loop.md` → not referenced; scan → encounter → aftermath untouched.
- `02-non-negotiables.md` → god/protagonist separation, narrative-over-mechanics (trade-off flagged and guarded by `failure_story_rate`), prose-not-numbers, additive-over-destructive, three pillars — all **confirmed**.
- `03-design-tensions.md` → mechanical legibility vs narrative mystery — silent/low-risk; the precision is debug-facing only.
- `taste-profile.md` → "player is a god", narrative over mechanical perfection, no numbers in UI — **confirmed**.

No contradictions found. North star: directly implements the hesitation mechanism. Core loop preserved. Non-negotiables respected. Tensions: legibility stays debug-side. Taste profile respected.

VISION AUDIT: PASS-with-notes — the failure-rate increase and internal legibility push are both self-flagged and guarded; no Vision edit required.
