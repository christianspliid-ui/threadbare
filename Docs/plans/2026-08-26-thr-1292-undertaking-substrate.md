> **title:** `The undertaking substrate — THR-1292`
> **linear_issue:** THR-1292
> **author:** `Claude Code`
> **created:** 2026-08-26
> **three_pillars:** Engine `done` · Content `minimal — 7 template fold-ins only; full content is doc 2` · UI `minimal — two dead-field repoints only; surfaces are doc 5`

# The undertaking substrate — THR-1292

*Plan doc 1 of 6 from the [Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map): checkpoint dice on the strategic-actions skeleton via a shared step-resolution library, the initiative retirement with its full blast radius, and the one prioritization board converged by shadow scoring.*

**Settled input (do not re-litigate here):** the substrate verdict + technical addendum on
[THR-1280](https://linear.app/threadbare/issue/THR-1280/one-substrate-what-merges-what-inherits), the
checkpoint simplification + failure-residue amendment on
[THR-1281](https://linear.app/threadbare/issue/THR-1281/the-action-library-grammar-crud-verbs-across-reaches-and-tiers),
the moment/attention + presence/parallelism verdicts on
[THR-1279](https://linear.app/threadbare/issue/THR-1279/mock-following-an-agents-arc-the-project-moments-surface),
and the binding rulings/obligations in
[`Docs/audits/2026-08-26-proactive-agent-actions-review.md`](../audits/2026-08-26-proactive-agent-actions-review.md)
(§2.2, §2.3, §3 rows for doc 1). Measured baselines:
[THR-1277 field survey](https://linear.app/threadbare/issue/THR-1277/field-survey-what-the-proactive-stack-actually-does-today).
All file:line references verified against `main` @ `7981281c` (post-THR-1286).

## Why this is load-bearing

Today a strategic project is a countdown timer: `progress += 1` per tick, unconditionally
(`src/engine/strategicActionLifecycle.ts:258-259`, `STRATEGIC_PROJECT_PROGRESS_PER_TICK = 1`), with
zero stalls or failures in ~400 measured records — no stakes, so no arc, so north star #1 ("follow
an agent and narrate their arc") has nothing to narrate. Meanwhile the initiative pipeline is dead
by construction (wealth-floor gate, 0/30 agents qualify), and the decision loop is three sequential
winner-take contests bridged by ad-hoc ceiling constants. This doc turns projects into
**undertakings** — checkpoint dice through the same resolution machinery encounters use — retires
the dead pipeline whole, and replaces the contests with one traced board. Docs 2 (kinds/naming),
3 (binder), 4 (reactive loop), 5 (surfaces), and 6 (factory) all stand on the runtime shape this
doc fixes.

## Substrate inventory

Everything this plan touches already exists in `Docs/canon/systems-inventory.md`; nothing is
green-fielded. Dispositions:

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Strategic Projects & Control** (`strategic*` modules, phase 2a.55) | 🟢 ACTIVE | **extends** — checkpoint dice, ratchet, flags, moments land on this skeleton; the control sub-family is later **deleted behind a measured gate** (§6) |
| **Encounters & Dilemmas** step resolution (`unifiedActionResolution`, `resolutionService`, phase 2a) | 🟢 ACTIVE | **extends by extraction** — the pure core becomes a shared library; encounter behavior byte-identical |
| **Ambitions & Initiatives** — initiative half (`initiative*` modules, phase 2.32) | 🟢 ACTIVE (but measured-dead: 0 starts in ~5,400 decisions, THR-1277) | **replaces** — retired whole, templates folded into the strategic packs |
| **Ambitions & Initiatives** — mentorship (`phaseMentorship`, phase 2.33) | 🟢 ACTIVE (dead behind the same wealth floor) | **replaces** — folded into undertaking checkpoints, behavior contract preserved |
| Agent decision pipeline (`phaseAgentDecision`, phase 2b) | 🟢 ACTIVE | **extends** — one board shadow-scored, then replaces the three sequential contests |
| Balance telemetry (`recordBalanceEvent` / `balance summary`) | 🟢 ACTIVE | **extends** — shadow fields + CLI block |
| THR-726 event-minted ambition lane (`ambitionTick`) | 🟢 ACTIVE | **extends** — one new producer event (`undertaking_abandoned`) |

## Engine pillar

### 1. The shared step-resolution library (review ruling 2.3.1)

**Verdict being implemented:** undertakings live in the strategic runtime (`state.strategicState`)
and adopt the encounter step/outcome machinery as a shared library — they do **not** become unified
actions; the one-unresolved-action-per-agent busy-gate stands untouched.

**Extraction seam.** `resolveUncontestedStep` (`src/engine/unifiedActionResolution.ts:292-693`) is
today's band producer. Lines 344–677 (difficulty derivation → capability sigmoid → modifiers →
scale floors → d100 → resist → rider remap) are a function of
`(capability, difficulty, scale, modifiers, testShapers, policies, rng)` with exactly three state
couplings: the quintessence node mutation (:450-454, :626-628), the
`state.pendingQuintessenceEvents` queue (:609-611, :640-642), and `emitTrace` (:578). The pure math
underneath (`src/engine/resolutionService.ts` — threshold, ladder, floors, shapers) is already a
side-effect-free module by design.

**New module: `src/engine/stepResolutionCore.ts`.**

```ts
resolveStepCore(input: StepCoreInput, rng: () => number): StepCoreResult
```

- `StepCoreInput`: `actorId`, `reach`, `capability` (post-sigmoid), `difficulty`, `scale?`,
  `actionModifiers`, `testShapers`, `variancePolicy: 'player' | 'agent'`,
  `quintessencePolicy: 'spend-intent' | 'none'`, `nudgeContext?` (activeNudges, step nudges, prior
  outcome, supportBindings), `bandOverride?` (debug pin), `tick`, `sourceLabel`.
- `StepCoreResult`: `outcome: StepOutcome` (six-band, `src/types/unifiedAction.ts:2660`),
  `rawOutcome`, `probability`, `roll`, resist fields, all floor/crit flags currently leaked only
  into the `resolution.input` trace (:578-606), **`spendIntents[]`** (push/resist quintessence
  costs as returned intents, not mutations), and **`tracePayload`** — the library returns, callers
  mutate/queue/emit. This matches `resolutionService`'s stated design ("callers emit traces").
- The library draws at most two `rng()` values (the d100; the conditional resist roll). Riders and
  the debug pin draw zero — preserved exactly.
- `sphereFactor` stays hardcoded 0 for both callers (it is 0 in the encounter path today,
  `unifiedActionResolution.ts:417`) — a dormant input carried honestly, not a new behavior.

**Caller 1 — encounters.** `resolveUncontestedStep` delegates its :344-677 body to the core and
keeps: step resolution/dealt-hand fill/pin lookup/auto-success gates (:292-342), applying spend
intents to the graph, queueing quintessence events, emitting `resolution.input`, and the
`onSuccess`/`onFailure` op selection (:677-692). **Behavior-identical** — golden-fixture tests pin
band outputs for a matrix of inputs before and after the refactor. `executeStepResult` (the ~1370-line
entangled effect executor) stays entirely on the encounter side.

**Caller 2 — undertakings.** New `src/engine/undertakingCheckpoints.ts` (§2) calls the core with
`variancePolicy: 'agent'`, `quintessencePolicy: 'none'` (checkpoint dice do not spend quintessence
in v1 — push is an attended-encounter texture; veto open), and an empty `nudgeContext`
(`collectNudgeModifiers`/`selectActiveRider` are neutral on empty — verified).

**Contract tests** (`src/engine/__tests__/contracts/stepResolutionCore.contract.test.ts`):
1. Identical `StepCoreInput` + identical rng sequence → identical `StepCoreResult` from both
   callers' entry points (drift guard between the two callers — the review's explicit requirement).
2. The band ladder has exactly one implementation: a test asserting neither caller reaches a band
   through any path but the core. Precedent to cite in the test header: `src/engine/resolution.ts`
   (`resolveActionLegacy`) is a drifted second resolver with an incompatible crit ladder — the
   anti-pattern this contract exists to prevent. (Its still-imported alias at
   `unifiedActionResolution.ts:67` is cleanup the executor should take in passing if trivially safe,
   else file a deferral.)
3. **Busy-gate invariant:** an agent with an active undertaking is absent from `busyAgentIds`
   (`src/engine/phaseAgentDecision.ts:302-305`, skip at :348-353) and still receives encounter
   decisions. The gate never reads `strategicState` today (verified — the file's only three
   `strategicState` references are the accumulator at :253, :817-829, :1688); the test pins that.

### 2. Checkpoints: dice in the strategic runtime (THR-1280 §2, THR-1281 §5 + amendment)

**Runtime shape (additive — NFP #6).** `StrategicProjectRuntime`
(`src/types/strategicAction.ts:171-201`) gains: `checkpointIndex`, `nextCheckpointTick`, `halts`,
`escalated`, `everInterrupted`, `atCostMomentFired`, `deferrals`,
`lastCheckpoint?: { band, effect, roll, probability, tick }`. Existing fields unchanged; `project`
survives as the code noun (THR-1281 §3 — **undertaking** is the UL/player term).

**Cadence.** Passive per-tick progress is **replaced** by checkpoint-driven advancement inside the
existing phase 2a.55 (`phaseStrategicProjects` → `advanceStrategicProjects`,
`strategicActionLifecycle.ts:203-380`, insertion at :258-259). A checkpoint fires when
`tick >= nextCheckpointTick`, every `UNDERTAKING_CHECKPOINT_INTERVAL_TICKS` (6). On *advance*,
`progress += UNDERTAKING_PROGRESS_PER_ADVANCE` (6); completion at `progress >= progressRequired` is
unchanged, so an always-succeeding agent finishes the default 18-tick project in 3 checkpoints —
today's expected duration, now with variance.

**The roll.** Reach = the template's primary reach (highest `reachProfile` weight; tie broken by
`REACH_DOMAINS` order — deterministic). Capability via `computeCapability` (sigmoid,
`src/engine/domainCapability.ts:126-133`). Difficulty = new template field `checkpointDifficulty`
(default `UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY = 0.45`; per-kind values are doc 2's band
tables). Modifiers = retargeted Inspire/Sabotage riders (§3) + escalation state (below).

**Band → checkpoint effect** (fixed mapping `CHECKPOINT_EFFECT_BY_BAND`, crits as intensifiers per
THR-1281 §5):

| StepOutcome band | Checkpoint effect |
|---|---|
| `critical_success` | **advance ×2** (`UNDERTAKING_CRIT_ADVANCE_MULTIPLIER = 2`, capped at completion) |
| `success` | advance |
| `success_at_cost` | **advance-at-cost** — full progress plus the cost hook: the checkpoint event carries `atCost: true`; authored cost effects are doc 2 content (grammar §5: costs prefer minting catalog kinds). Until doc 2 lands, the cost is the register + trace, honestly stated. |
| `near_miss` | halt (soft — no residue, ratchet +1) |
| `failure` | halt (ratchet +1) |
| `critical_failure` | halt, ratchet **+2**, and a complication event (`undertaking_complication`) — the hook doc 3's honest-death/complication machinery consumes |

**The halt ratchet (review §3 row 1).** When `halts >= UNDERTAKING_HALT_RATCHET_N` (3), the next
checkpoint is replaced by a forced fork — **abandon or escalate** — decided by the agent,
deterministically and traced:

```
escalationWeight = UNDERTAKING_ESCALATE_BASE (0.35)
  + UNDERTAKING_ESCALATE_AMBITION_TERM (0.25)   // the driving `pursues` edge is still active
  + (courage01 − 0.5) × UNDERTAKING_ESCALATE_COURAGE_WEIGHT (0.4)
  − (halts − UNDERTAKING_HALT_RATCHET_N) × UNDERTAKING_ESCALATE_HALT_PRESSURE (0.1)
escalate ⇔ escalationWeight ≥ UNDERTAKING_ESCALATE_THRESHOLD (0.5)
```

`courage01` is the agent's `courage_prudence` axis read **through `signedToCanonical01`**
(`src/types/axisRegistry.ts:236` — storage is signed ±1, the canonical scale is 0–1; open-coding
this conversion is the pole-inversion trap the review flagged for doc 4, avoided here the same way).

- **Escalate:** `halts = 0`, `escalated = true`, `checkpointDifficulty +=
  UNDERTAKING_ESCALATE_DIFFICULTY_DELTA` (0.1), and the record is marked `rebindRequested` — the
  seam doc 3's re-binding-with-complications consumes. One escalation maximum; a second ratchet trip
  forces abandon.
- **Abandon:** `status: 'failed'`, `failureReason: 'abandoned_after_halts'`, history entry, and an
  `undertaking_abandoned` mint-event emission into the THR-726 event-minted ambition lane (the
  candidate-mint the review requires; doc 4 authors the minting rule — this doc only guarantees the
  event fires with owner + undertaking identity).

**Failure residue follows visibility (review ruling 2.2).** On abandon/failure: if
`everInterrupted` → emit `undertaking_failed_visible` carrying the working possessive inputs
(templateId, actorId, `targetNodeId`, bound node ids when doc 3's bindings exist) — docs 2/3 mint
the half-built scar under the failure-name register; if never interrupted → emit
`undertaking_failed_clean` (chronicle line only, no graph litter — the case THR-1281 Q5 guarded).

**Moment events + presentation (consumed by doc 5, stored here).** Checkpoint resolution emits
moment events (`started`, first `at_cost`, `completion`, `fork`, `abandoned`, `complication`).
A thin resolver `resolveMomentPresentation(state, actorId, momentClass, project)` returns
`'interrupt' | 'badge'` per review ruling 2.1: interrupt only for **followed** agents; completions/
destructions/named-death complications always interrupt when followed; only the *first*
advance-at-cost per undertaking interrupts (`atCostMomentFired` gates repeats); foundings badge.
`GameState` gains `followedAgentIds: string[]`, seeded at init with The First + retinue (the
default-followed set). The follow *affordance* (arc panel + encounter UI) is doc 5; the state field
and resolver live here so `everInterrupted` can be stamped engine-side. Every event lands as a
`TickEvent` + trace regardless of presentation — badges and the chronicle read the same stream.

**Timeout.** The flat `STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS` (18) becomes
`UNDERTAKING_TIMEOUT_TICKS` (60) — a fail-safe backstop only, since halts now legitimately extend
duration and the ratchet is the designed exit.

**PRNG (NFP #3).** Checkpoint dice get their own per-project stream:
`mulberry32(state.seed + state.tick * UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER + hashString(projectId))`
with multiplier **97** — deliberately not 53/59 (`seed + tick*59` is already used by *three* phases
as correlated independent generators, and 53 by two; do not widen that defect) and per-project so
resolution order can never perturb draws (the encounter path's known order-coupling, avoided here).
The existing `stratProjRng` (`*59`) keeps feeding only `maybeSeedCatalyst`, so catalyst draws are
undisturbed. `hashString` is reused from the orchestrator's per-actor idiom, exported once.

### 3. Initiative retirement — full blast radius (review ruling 2.3.3)

Measured inventory: **424 matching lines / 515 occurrences across 32 files** (case-insensitive
`initiativ` under `src/`; one true false-positive, `army-encounter-content.ts:27`, is army-lifecycle
prose). Sequencing is conversion-first, deletion-last (NFP #6 within a sanctioned retirement).

**DELETE (the pipeline proper):** `src/types/initiative.ts` (all six pipeline types incl.
`InitiativeProgress`); `src/engine/initiativeCandidates.ts` (scorer + the wealth floor at :96);
`src/engine/initiativeLifecycle.ts`; `src/engine/phaseInitiativeProgress.ts`;
`src/engine/initiativeOutcomes.ts`; `src/data/initiative-templates.ts`;
`src/data/initiative-constants.ts` (21 constants — verified no external readers); the two divine
action templates `action.initiative.inspire` / `.sabotage`
(`src/data/unified-action-templates.ts:4862-4931`) **as initiative-targeted** (retargeted below);
the four trace categories `initiative_*` (all three registration surfaces in `src/types/trace.ts`:
union :180-184, runtime array :574-578, interfaces :3450-3489); both test files
(`phaseInitiativeProgress.test.ts`, `initiativeCandidates.test.ts`); the decision-loop contest block
(`phaseAgentDecision.ts:896-958`, imports :82-84, `activeInitiative` skip :367);
`'initiative'` from `DecisionFamily` (`src/types/strategicAction.ts:49`); orchestrator phase 2.32
registration (`orchestrator.ts:3191-3200`) with `prevEventCount` bookkeeping re-stitched.

**Extract before deleting:** festival-boost expiry (`phaseInitiativeProgress.ts:239-253`) is the
*only* expiry for `festivalBoost`/`festivalBoostExpiresAtTick` — it rehomes into
`phaseStrategicProjects` so the folded festival undertaking's boost still expires.

**FOLD — the 7 templates become undertaking templates** in the strategic packs (THR-1280 §1), their
outcome kinds mapped onto existing strategic `mutationHint`s: shrine/guild-hall →
`createSublocation`; recruit-party bonds and spy-network edges → `createRelationEdge`;
intelligence → `recordIntelligence`; festival → `modifyLocationProperty`; commissioned quest →
`catalystEncounterIds` (already native). **One gap, stated:** `create_faction` has no strategic op —
`initiativeOutcomes` was the sole runtime producer of `dynamicFactionDefinitions`
(`src/types/gameState.ts:442`). The folded found-organization undertaking ships with its
sublocation payoff; the faction payoff waits for T3's `create_group` op (doc 2's tier plan). The
executor files a `Deferral` issue for that payoff at fold time and updates the two comments that
name the retired producer (`gameState.ts:442`, `factionNetwork.ts:143`).

**FOLD — mentorship (the review's addendum).** `phaseMentorship` is contract-coupled to the
initiative runtime and dead behind the same wealth floor (so today's behavior to preserve is the
*intended* one, with zero existing test coverage — the fold ships its own tests). Train-apprentice
becomes an undertaking template whose checkpoints drive the arc:

- **Preserved:** the `mentors` edge as the durable relationship (phases `offered → training →
  graduated/estranged`); pairing eligibility (mentor tier ≥ floor, apprentice tier band, colocation,
  one-active-mentorship-per-apprentice) — **collapsed to one function** (today it is duplicated
  between `phaseMentorship.ts:361-400` and `initiativeCandidates.ts:139-161`); bond quality as the
  terminal-arc discriminator (the 5-arc table in `mentorshipOutcomes.ts:76-93`); the mastery-trait
  grant on graduation/surpassing; the 4 milestone/terminal encounter seeds with their load-bearing
  seed labels; separation beyond `MENTORSHIP_MAX_SEPARATION_HEXES` ending the arc as Dissolution.
- **Rewired:** bond drift reads the checkpoint band directly (advance → `+BOND_DRIFT_ON_SUCCESS`,
  halt → `−BOND_DRIFT_ON_FAILURE`) instead of piggybacking on phase 2.32's same-tick checkpoint
  array; the terminal arc fires on an **explicit** completion/failure signal from the undertaking —
  the absence-means-completion inference (`phaseMentorship.ts:253-259`) dies, and with it the latent
  deadlock (`markInitiativeFailed` set a status phase 2.32 never cleaned, permanently blocking the
  agent — unreachable today only because nothing ever starts). The fold must not reproduce either.
- **Renamed:** `initiativeId` → `undertakingId` on `MentorsEdgeProperties`
  (`src/types/graph.ts:190-201`), the `edgeSchema.ts:184` description, and
  `src/types/traces/mentorship-traces.ts:32`. Phase 2.33 deletes; the folded logic runs inside the
  checkpoint pass (2a.55), removing the fragile 2.32→2.33 ordering contract.

**RETARGET — Inspire/Sabotage to undertakings** (THR-1280 §1). The two divine actions become
`action.undertaking.inspire` / `action.undertaking.sabotage`, targeting agents with an active
undertaking: they write a one-shot consumed rider on the project record —
`+UNDERTAKING_INSPIRE_MODIFIER` (0.15) / `−UNDERTAKING_SABOTAGE_MODIFIER` (0.15) into the next
checkpoint's `actionModifiers`. Mentorship's own divine pair: *Inspire Mentorship* retargets onto
the same rider mechanism aimed at the mentorship undertaking (its old effect fed only the deleted
scorer); *Sever the Bond* survives with its `pendingMentorshipSever` plumbing rehomed into the
folded checkpoint pass. `action-technical-effects.ts:366-374` rows updated to match.

**RETARGET — UI dead fields** (kept minimal here; real surfaces are doc 5):
`AgentDetailPanel.tsx:425-446` "Active Initiative" card and `LocationView.tsx:413-418` chip repoint
to the agent's active undertaking(s) via `agentDetail.ts` (:198-199, :648 —
`activeInitiative` → `activeUndertakings` projection). Both read through the read-model, ending
LocationView's direct property read.

**Inert leftovers (fail-soft, no migration):** saved worlds carry orphaned `activeInitiative` /
`initiativeInspireBonus` / `initiativeSabotaged` / `lastInitiativeCompletedTick` node properties with
no readers — harmless; prune is optional cleanup, not correctness. `balanceEval.ts`'s
never-declared `initiative_start` decisionType hole closes by deletion.
`src/data/ul-dashboard.generated.json` regenerates via `npm run prebuild` after the UL shard sweep.

### 4. The one prioritization board (THR-1280 §3; review §3 row 2)

**Today, verified:** three sequential winner-take contests — encounter-internal selection
(`scoreAndSelect`), strategic-vs-encounter (`phaseAgentDecision.ts:720-743`,
`bestStrategicScore > bestEncounterScore`), initiative-vs-encounter (:899-960, gated out when
strategic won). The scorers are incommensurate by construction: the encounter score is unbounded
above (multiplicative gates 1.3–2.5, additive bonuses to ~2.5) while the strategic score is clamped
to `[0.08, 0.851]` by `STRATEGIC_ENCOUNTER_SCORE_BRIDGE = 0.85`
(`src/data/strategic-action-constants.ts:95`) — one clamp and one constant are the entire
commensurability story. The comparison itself is **never traced**: nothing records what the other
family's best was, which is why shadow scoring must come first.

**The common currency, named: expected value per tick (EVT).** The encounter scorer's core is
already `euRanking / totalCost` — a five-band expected utility (or expected-reward fallback) over
tick cost (`encounterScoring.ts:1080-1145`). Undertakings join *that* currency rather than inventing
a third:

```
undertakingEVT = expectedPayoff / expectedDurationTicks
expectedPayoff = payoffValue × P(advance-equivalent)          // from computeOutcomeProbabilities
                                                              // over the checkpoint's real inputs
expectedDurationTicks = checkpointsRemaining × interval / P(advance-equivalent)  // halts stretch time
boardScore     = undertakingEVT × desireMultiplier × temperamentFamilyWeight
```

- `payoffValue`: new template field; v1 default derived from the verb-impact table already in
  `computeWorldImpact` (`strategicActionCandidates.ts:339-348`) scaled by
  `UNDERTAKING_PAYOFF_SCALE` (1.0); doc 2's kind rows refine per kind. The shared core's
  `computeOutcomeProbabilities` (`resolutionService.ts`) supplies real band probabilities — the same
  math the encounter EU term uses, which is what makes the currency genuinely common.
- `desireMultiplier`: the encounter scorer's existing pipeline (`:1147-1188` — axiological
  motivations, ambition boost, personality exponent), applied to the undertaking's template
  motivations. Ambitions weight undertakings exactly where they weight encounters.
- `temperamentFamilyWeight`: the temperament mix the verdict requires —
  `1 + UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT (0.3) × [active ambition names this kind/verb]
     + UNDERTAKING_TEMPERAMENT_REACH_WEIGHT (0.2) × reachAffinity(agent, template)`
  (encounter candidates sit at baseline 1.0 — the *relative* weight is the tunable mix; grievance
  candidates arrive in doc 4 with a `urgencyWeight` term on this same board — the slot is declared
  here, filled there). The legacy 7-weight scorer's live components (roleFit, travelPenalty,
  variety) survive as candidate-generation features feeding EVT inputs, not as a parallel currency.
- **Deleted at cutover:** `STRATEGIC_ENCOUNTER_SCORE_BRIDGE`, the strategic clamp, the B/C contest
  blocks, and `INITIATIVE_MAX_SCORE`'s twin-ceiling pattern (already gone with §3). Also fixed in
  passing: `strategic_candidate_board.chosenCandidateId` has never been populated
  (`phaseAgentDecision.ts:735`) — the board trace does what that field promised.

**Prerequisite repair — the value-pair vocabulary split (found in recon; must precede the board).**
The desire term the board leans on is partially inert today: `WANDERLUST_PAIR =
'tradition_progress'` (`agent-behavior-constants.ts:457`), `SPHERE_DRIFT_MAP`'s `'mercy_ambition'` /
`'tradition_progress'` keys (`encounterScoring.ts:187-202`), and hundreds of encounter-content
`motivations` entries (`'tradition_progress'`, `'justice_mercy'`) name value pairs that are **not in
`VALUE_PAIRS`** (`src/types/agent.ts:25-35`) — every such read is `undefined ?? 0`, silently. Fix:
a canonical-name mapping sweep (legacy → `tradition_novelty`, `loyalty_ambition`, `mercy_ruthlessness`),
content-data sweep included, with a schema test pinning that every authored motivation ∈
`VALUE_PAIRS`. Converging two scorers onto a half-dead personality signal would make the temperament
weights fiction — this lands first.

**Shadow scoring before cutover (binding obligation).** Mode constant
`UNIFIED_DECISION_BOARD_MODE: 'off' | 'shadow' | 'live'` (ships `'shadow'`). In shadow, the board
scorer runs per agent per tick alongside the legacy contests; **legacy decides**. Two artifacts per
decision:

1. New trace `decision_board_comparison` (registered in **both** `src/types/trace.ts` surfaces —
   union :63-area and `TRACE_CATEGORIES` :455-area): legacy family winners + scores, board
   ranking top-5, `agreement: boolean`.
2. New fields on the existing balance-telemetry event (`recordBalanceEvent`,
   `kind: 'encounter_decision'` — it already fires on all five decision paths and exports to TSV
   for `agent-analyser`): `shadowWinnerFamily`, `shadowWinnerId`, `shadowAgreement`. The CLI
   `balance summary` gains a shadow-agreement + shadow decision-mix block.

**Cutover gate (measured, not asserted)** — the THR-1277 method: headless CLI, seeds 42 **and** 99,
≥150 ticks, decision mix from the cumulative balance telemetry. Flip to `'live'` only when, under
the shadow board's rankings, on both seeds:

| Criterion | Constant | Default |
|---|---|---|
| undertaking share of spotlight decisions within range | `BOARD_UNDERTAKING_SHARE_RANGE` | `[0.10, 0.35]` |
| encounter share ≥ floor | `BOARD_ENCOUNTER_SHARE_FLOOR` | `0.15` |
| idle share ≤ ceiling | `BOARD_IDLE_SHARE_CEILING` | `0.40` |

Agreement with legacy is deliberately **not** a criterion — the board is a redesign, divergence is
the point; distributional health is what gates. In `'live'`, idle is re-keyed to "board empty or
below `BOARD_SCORE_FLOOR` (0.08)" (today's idle branch is encounter-only — a strategic winner
`continue`s past it, `phaseAgentDecision.ts:1420`). The board scorer gets an **explicit error
trace**, not the legacy empty-`catch` silence (:745-747 et al. silently degrade to encounter-only —
a shadow period with swallowed board throws would read as healthy). The three separate `pursues`
walks (:685-710, :899-910, `encounterScoring.ts:830-838`) collapse to one THR-1285-safe helper.

### 5. Per-verb flags (THR-1279 verdict 7)

Two new `StrategicActionTemplate` fields, enforced at checkpoint time:

- **`requiresLocation`** — the checkpoint resolves only when the actor's resolved hex (three-tier
  position model, upward via `resolveToParentLocation`) matches the stage (`targetNodeId`/
  `targetHex`). Absent → the checkpoint **defers** (`nextCheckpointTick += interval`, traced
  `deferred: 'actor_absent'`); every `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` (3) consecutive absence
  deferrals convert to one halt — neglect has teeth without new movement AI (movement-toward-stage
  is board/binder behavior, docs 3/5 territory).
- **`canRunBeside`** — when `false`, checkpoints defer while the actor has an unresolved unified
  action (a read of the busy set, never a write — the busy-gate itself is untouched). Busy
  deferrals are traced separately and do **not** count toward absence halts.

Conversion default for all 36 existing templates + 7 folded ones: `requiresLocation: true`,
`canRunBeside: true` (preserves today's parallel behavior); doc 2 assigns real per-kind values.

### 6. Control-upkeep deletion, gated on the decision-mix floor (review §3 row 3)

**What deletes:** the 6 control templates (one per pack, always template #6 —
`strategic_maintain_civic_order`, `strategic_maintain_authority`, `strategic_maintain_monopoly`,
`strategic_guard_knowledge`, `strategic_claim_territory`, `strategic_police_doctrine`);
`StrategicControlState` + the neglect/degradation loop (`strategicActionLifecycle.ts:330-367`,
`retireControl` :397+); `computeControlPressure` + the claim gate + `'control_obligation'`
generation (`strategicActionCandidates.ts:365-465`); the `controlPressure` scoring weight; the
THR-1286 cooldown constants; `'strategic_control'` balance decisionType. THR-1287 ("upkeep does not
exist") is **superseded by this deletion** — the executor closes it as such when the deletion lands.
The `controls` *edge type* and its 72-file consumer web are **not** this doc: the ownership-edge
disposition table is doc 2's binding obligation (review §3 row 4). THR-1286's shipped relief
(cooldown + dead-record hygiene, PR #1647, measured 39.5%→11.3% / 38.7%→5.7% control share) stays
in place until the deletion — minimal interim relief, as ruled.

**The gate — measured replacement supply, never tier count.** Deletion ships only when a
post-cutover THR-1277-method run (CLI, seeds 42 + 99, ≥150 ticks, balance-summary decision mix)
shows on **both** seeds: undertaking share ≥ `DECISION_MIX_FLOOR_UNDERTAKING_SHARE` (0.12 — today's
project share is ~8.5–8.8%; the floor demands the checkpoint system has *grown* supply, not merely
survived) **and** idle share ≤ `DECISION_MIX_IDLE_CEILING` (0.40 — baseline 31–33%; the deletion
must not convert control churn into idleness). Below either bar, the deletion slice waits and the
run's evidence is posted to the issue — the interim world keeps THR-1286's tamed control family
rather than regressing proactive behavior during exactly the window Christian will be watching.

### Graph nodes / edges

None new, none retyped. `mentors` edge property rename (`initiativeId` → `undertakingId`) with
`edgeSchema.ts` description update. Ownership edges/`holding` attachments are doc 2.

### Tick phases

| Phase | Change |
|---|---|
| 2a.55 Strategic Projects | absorbs checkpoint resolution, the fork, folded mentorship lifecycle, festival expiry |
| 2b Agent Decision | shadow board (then live board at cutover); initiative contest block deleted |
| 2.32 Initiative Progress | **deleted** (`orchestrator.ts:3191-3200`; `prevEventCount` re-stitched) |
| 2.33 Mentorship Lifecycle | **deleted** (folded into 2a.55; the 2.32→2.33 ordering contract dissolves) |

### Resolution logic

§1–§2 above. Forecast for the board's EVT uses `computeOutcomeProbabilities` /`forecastAction` from
the same shared core — one math, two consumers, no drift.

### PRNG callouts

Per-project checkpoint stream, multiplier 97 (§2). Board tie-break jitter keeps the strategic
scorer's existing `rng() * 0.001` idiom on `decisionRng`. No `Math.random()` anywhere. Existing
`*59`/`*53` stream-collision defect documented in §2 — not widened, not fixed here (pre-existing;
fold into the impediment log if it ever bites).

## Content pillar

Minimal by design — the 7 initiative templates fold into the strategic packs with their existing
prose and outcome mappings (§3), and all 43 existing templates get flag defaults (§5). The kind
catalog, band tables, at-cost consequence content, name lexicons, and the `controls` disposition
table are **doc 2** (carve-up item 2). No new encounter templates, no prose tables here.

## UI pillar

Minimal by design — player surfaces (arc panel, moment cards, follow affordance, interrupt
collation) are **doc 5** (carve-up item 5). This doc ships exactly two mechanical repoints so the
retirement doesn't leave broken UI: the AgentDetailPanel "Active Initiative" card and the
LocationView chip repoint to active undertakings through `agentDetail.ts` (§3). Both are DOM
surfaces — browser-verify via **Playwright** (`browser_resize(1920, 1080)` → screenshot + console
capture), per the Done-when. UI Laws engaged: Law 1 (real data — the card reads the live
undertaking record), Law 13/14 (visibility parity — the same record the arc panel will read),
Law 17 (empty state — agents with no undertaking render the card's absent state, not a blank),
Law 21 (no dead affordances — the dead initiative card is precisely what this removes), Law 37
(state-backed labels). Law 56 chip state-backing binds doc 5's moment cards, not these repoints.

### Debug inspection (DebugPanel / CLI)

- New trace categories in the DebugPanel toggle list (auto via `TRACE_CATEGORIES`):
  `undertaking_checkpoint`, `undertaking_fork`, `decision_board_comparison`; four `initiative_*`
  categories disappear.
- CLI: `balance summary` gains the shadow block (§4); `status`/`agents` continue reading
  `strategicState` unchanged; `eval state.strategicState.projects[0]` now shows checkpoint fields.
- `window.__DEBUG` needs no new methods (traces + balance TSV cover inspection); the debug outcome
  pin (`?outcome=`) deliberately does **not** apply to undertaking checkpoints in v1 — its verdict
  machinery is encounter-shaped; doc 6 owns the undertaking review levers (`?spawn` analogs).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `stepResolutionCore.ts` (new) | via callers (2a, 2a.55) | — | — | payload returned to callers | `resolution.input` (encounter caller, unchanged) |
| `undertakingCheckpoints.ts` (new) | 2a.55 | AgentDetailPanel repoint (doc 5 owns the rest) | `strategicState.projects[*]` new fields | `undertaking_checkpoint`, `undertaking_fork` | DebugPanel toggles, CLI `traces` |
| board scorer (in `phaseAgentDecision.ts` + new `decisionBoard.ts`) | 2b | — (doc 5) | — | `decision_board_comparison` | balance TSV + CLI `balance summary` shadow block |
| moment presentation resolver | 2a.55 | doc 5 consumes | `followedAgentIds`, `projects[*].everInterrupted` | rides `undertaking_checkpoint` | CLI `eval` |
| mentorship fold (in `undertakingCheckpoints.ts`) | 2a.55 | — | `mentors` edges (`undertakingId`) | existing `mentorship_*` (traceBuffer registry, unchanged) | CLI `agent <name>` |
| initiative retirement | 2.32/2.33 deleted | AgentDetailPanel/LocationView repoints | orphan node props inert | 4 categories deleted | — |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNDERTAKING_CHECKPOINT_INTERVAL_TICKS` | 6 | ticks between checkpoint dice |
| `UNDERTAKING_PROGRESS_PER_ADVANCE` | 6 | progress granted per advance (parity with 18-tick default duration) |
| `UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY` | 0.45 | difficulty when a template doesn't author one |
| `UNDERTAKING_CRIT_ADVANCE_MULTIPLIER` | 2 | critical-success intensifier |
| `UNDERTAKING_HALT_RATCHET_N` | 3 | halts that force the abandon-or-escalate fork |
| `UNDERTAKING_CRIT_FAIL_RATCHET_WEIGHT` | 2 | ratchet points a critical failure adds |
| `UNDERTAKING_ESCALATE_BASE` | 0.35 | fork weight baseline |
| `UNDERTAKING_ESCALATE_AMBITION_TERM` | 0.25 | fork weight when the driving ambition is still active |
| `UNDERTAKING_ESCALATE_COURAGE_WEIGHT` | 0.4 | courage-axis contribution to the fork |
| `UNDERTAKING_ESCALATE_HALT_PRESSURE` | 0.1 | per-extra-halt push toward abandon |
| `UNDERTAKING_ESCALATE_THRESHOLD` | 0.5 | escalate at/above, abandon below |
| `UNDERTAKING_ESCALATE_DIFFICULTY_DELTA` | 0.1 | stakes raised on escalation |
| `UNDERTAKING_TIMEOUT_TICKS` | 60 | fail-safe backstop (replaces the flat 18) |
| `UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER` | 97 | PRNG stream derivation (unique; avoids the *59/*53 collisions) |
| `UNDERTAKING_INSPIRE_MODIFIER` | +0.15 | retargeted divine Inspire, next checkpoint |
| `UNDERTAKING_SABOTAGE_MODIFIER` | −0.15 | retargeted divine Sabotage, next checkpoint |
| `UNDERTAKING_PAYOFF_SCALE` | 1.0 | verb-impact → payoffValue bridge until doc 2 refines |
| `UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT` | 0.3 | board mix: ambition-names-this-kind term |
| `UNDERTAKING_TEMPERAMENT_REACH_WEIGHT` | 0.2 | board mix: reach-affinity term |
| `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` | 3 | absence deferrals that convert to one halt |
| `UNIFIED_DECISION_BOARD_MODE` | `'shadow'` | off / shadow / live |
| `BOARD_SCORE_FLOOR` | 0.08 | live-mode idle threshold |
| `BOARD_UNDERTAKING_SHARE_RANGE` | [0.10, 0.35] | cutover gate |
| `BOARD_ENCOUNTER_SHARE_FLOOR` | 0.15 | cutover gate |
| `BOARD_IDLE_SHARE_CEILING` | 0.40 | cutover gate |
| `DECISION_MIX_FLOOR_UNDERTAKING_SHARE` | 0.12 | control-deletion gate |
| `DECISION_MIX_IDLE_CEILING` | 0.40 | control-deletion gate |

## Tracing

```ts
// undertaking_checkpoint — emitted once per checkpoint resolution
interface UndertakingCheckpointTrace {
  type: 'undertaking_checkpoint';
  projectId: string; actorId: string; templateId: string;
  checkpointIndex: number; reach: ReachDomain;
  band: StepOutcome; effect: 'advance' | 'advance_at_cost' | 'halt';
  roll: number; probability: number; capability: number; difficulty: number;
  modifiers: number;             // inspire/sabotage/escalation riders folded in
  halts: number; atCost: boolean; deferred?: 'actor_absent' | 'actor_busy';
  presentation: 'interrupt' | 'badge' | 'none'; tick: number;
}

// undertaking_fork — emitted when the halt ratchet forces the fork
interface UndertakingForkTrace {
  type: 'undertaking_fork';
  projectId: string; actorId: string;
  escalationWeight: number; threshold: number;
  decision: 'abandon' | 'escalate';
  halts: number; ambitionActive: boolean; courage01: number;
  visibleFailure?: boolean;      // abandon only — the §2.2 residue rule input
  tick: number;
}

// decision_board_comparison — emitted once per agent decision while shadow/live
interface DecisionBoardComparisonTrace {
  type: 'decision_board_comparison';
  agentId: string; mode: 'shadow' | 'live';
  legacyWinner: { family: DecisionFamily; id: string | null; score: number };
  boardTop: ReadonlyArray<{ family: DecisionFamily; id: string; score: number }>; // top 5
  agreement: boolean; tick: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Template missing `reachProfile` / all-zero weights | reach falls back to `'iron'` first of `REACH_DOMAINS`; traced, never thrown |
| Actor node missing at checkpoint | undertaking fails clean (`failureReason: 'actor_lost'`), history entry — mirrors today's timeout path |
| Stage node deleted (pre-doc-3 reaper work) | `requiresLocation` check treats it as absent → deferral path; never a throw |
| Board scorer throws | caught, `decision_board_error` trace (NOT silent), legacy path decides (shadow) / encounter-family fallback (live) |
| `signedToCanonical01` given missing axis value | neutral 0.5 → courage term 0 |
| Fork fires with ambition edge already gone | `ambitionActive: false`, weight computes normally |
| Folded mentorship: apprentice/mentor node gone | terminal Dissolution via the explicit signal — the orphan path preserved from `phaseMentorship.ts:191-222` |
| Saved world with orphaned initiative props | no readers — inert by construction |
| `computeOutcomeProbabilities` degenerate inputs | clamped by the core's existing `[0.05, 0.95]` bounds |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 345 | one additive field (`followedAgentIds`); no signature changes — type-only cascade |
| `src/types/unifiedAction.ts` | 278 | `StepOutcome` and result types **imported** by the new core, not modified; zero edits planned — listed because the seam touches its consumers |
| `src/engine/traceBuffer.ts` | 232 | untouched (encounter-internal registry); new categories go in `src/types/trace.ts` only |
| `src/types/gameState.ts` consumers via `strategicState` | — | `StrategicProjectRuntime` gains optional fields — additive, existing readers unaffected |

## Interface impact

*Design workflow Step 0.7 — contracts per `Docs/canon/interface-map.md`.*

| Contract / seam | Disposition |
|---|---|
| `ambition-encounter-boost` (`applyAmbitionBoost` → decision pipeline, 🟢 LIVE) | **preserve + extend** — the board keeps the desire/ambition term; same symbols |
| `event-minted-ambitions` (THR-726 lane, 🟢 LIVE) | **extend** — new producer event `undertaking_abandoned`; the minting *rule* is doc 4's; this doc only guarantees the producer fires |
| `mentors`-edge progress (edgeSchema-documented) | **extend** — `initiativeId` → `undertakingId`; schema description updated in the same PR |
| Initiative pipeline | **retire** — carries **no rows** in the audited contract set (verified against `scripts/interface-contracts.ts`: all `AMBITIONS`-domain rows are ambition-side); no LIVE contract dies, no green tests on a dead contract remain (both initiative test files delete with their subject) |
| Strategic Projects subsystem (⚪ UNAUDITED) | **audit-on-touch** — executor adds new rows: `shared-step-resolution-two-callers` (contract-tested by construction), `undertaking-checkpoint-events` (producer 2a.55 → consumers chronicle/doc-5 surfaces; until doc 5 lands its read side is the TickEvent stream + traces, stated), `decision-board-shadow-telemetry` (producer 2b → balance TSV consumer, live from day one) |

New cross-system write `followedAgentIds`: production read site is `resolveMomentPresentation`
(this doc) — not a write without a reader; doc 5 adds the second reader.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (minimal, rationale stated — doc 2 owns content)
- [x] UI pillar present (minimal, rationale stated — doc 5 owns surfaces)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — checkpoint stakes implement "failure is
  plot, not punishment" at undertaking scale; the god's verbs (Inspire/Sabotage) stay
  probability-bending, never command; the busy-gate preservation keeps the Three-Beat encounter
  cadence intact.
- [x] No Vision edit required — nothing here changes a premise, so none rides this ticket's scope.

## Rulebook impact

- [x] This plan changes rules of play: agents' proactive loop gains stakes (checkpoints, halts,
  forks); two god-verbs retarget from initiatives to undertakings.
- [x] `Docs/canon/rulebook.md` is updated in the same PR: the executor greps it for
  initiative/strategic-project mentions and updates the affected rows (`[IMPL]`-flagged) in the
  closing PR; the quick-reference card is unaffected (it does not describe the agent proactive
  stack).

> Brainstorm companion: `Docs/plans/2026-08-26-thr-1292-undertaking-substrate-brainstorm.md`
> (written alongside, not after).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 27 named constants (table above); two inherited inline magic numbers in the legacy variety penalty (`0.2`/`0.15`, `strategicActionScoring.ts:44-69`) die with that scorer at cutover |
| 2. Inspectability | PASS | three new trace types; the never-traced cross-family comparison becomes `decision_board_comparison`; board errors trace explicitly instead of the legacy empty-catch silence |
| 3. Determinism | PASS | per-project stream (multiplier 97, order-independent), no `Math.random()`, catalyst stream undisturbed, riders/pins draw zero |
| 4. Fail-soft | PASS | table above; the retirement *removes* a latent deadlock (`markInitiativeFailed` orphan) |
| 5. Narrative over mechanical perfection | PASS | halts/forks/residue exist to make arcs narratable; at-cost's v1 mechanical cost is honestly deferred to doc 2's content rather than faked |
| 6. Additive over destructive | PASS with note | runtime/type changes are additive; the initiative deletion is a sanctioned retirement (dead by construction, measured 0 starts in ~5,400 decisions), sequenced conversion-first |
| 7. Performance budget | PASS | checkpoint dice: ≤2 rng draws per project per 6 ticks (~55 projects ⇒ ~18/tick worst case — trivial); shadow period double-scores spotlight agents only (~46 max), bounded and temporary; THR-1286 measured +13% wall clock from agents doing real work — the board does not add per-tick scans beyond the decision path |

## Done when

- [ ] Shared core extracted; golden-fixture tests prove the encounter path byte-identical on bands;
  the three contract tests (§1) green
- [ ] Checkpoint dice live: a 150-tick CLI run (seeds 42 + 99) shows non-zero halts and at least one
  fork or completion-with-variance; `strategicState.history` carries banded entries — paste the
  `balance summary` + a sample `undertaking_checkpoint` trace
- [ ] Initiative retirement merged: `grep -ri initiativ src/ --include='*.ts'` returns only the
  army false-positive and deliberate historical comments; the 2 UI repoints browser-verified
  (Playwright, 1920×1080, console capture) **or** the substitution/exemption rule applied per
  CLAUDE.md
- [ ] Mentorship fold: new tests cover pairing, bond drift from bands, the 5-arc terminal table,
  separation, and the explicit terminal signal
- [ ] Shadow scoring emitting on both channels; CLI `balance summary` shows the shadow block on a
  150-tick run
- [ ] Cutover and control deletion **only** behind their measured gates (§4/§6), evidence pasted to
  the issue; if a gate fails, the slice waits and says so — shipping the gate-fail evidence is a
  valid completion of those items
- [ ] Engine smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`
  passes; `npm test` + `npx vite build` + `npm run check:typecheck` evidence in the closing PR
- [ ] Closing commit body includes `Fixes THR-1292`

## Coordination block

**Suggested model:** opus — multi-slice engine refactor with a behavior-identical extraction and
measured gates; needs sustained judgment (advisory; the automation runs Opus regardless).

**Parallel-safe with:** the doc-4 and doc-5 *design sessions* (docs only). Their *executors* are
parallel-safe except as below.

**Mutex with:** the plan-doc-2 and plan-doc-3 issues (not yet filed — the design sessions for
carve-up items 2/3 will create them; name them here when filed): both consume the shared
step-library seam this doc creates — doc 2's band tables author `checkpointDifficulty`/costs
against `stepResolutionCore.ts`'s contract, and doc 3's binder writes into
`undertakingCheckpoints.ts`'s re-binding hook (`rebindRequested`) and `unifiedActionResolution.ts`.
Concurrent edits to `unifiedActionResolution.ts` / `stepResolutionCore.ts` /
`undertakingCheckpoints.ts` / `strategicActionLifecycle.ts` would collide. Also **THR-1287** (this
doc supersedes it via §6 — do not implement it separately).

**Files to touch:**
- Create: `src/engine/stepResolutionCore.ts`, `src/engine/undertakingCheckpoints.ts`,
  `src/engine/decisionBoard.ts`,
  `src/engine/__tests__/contracts/stepResolutionCore.contract.test.ts`, mentorship-fold tests
- Edit: `src/engine/unifiedActionResolution.ts` (delegate :344-677),
  `src/engine/strategicActionLifecycle.ts` (checkpoints replace passive progress),
  `src/engine/phaseAgentDecision.ts` (shadow board; initiative block deleted),
  `src/engine/orchestrator.ts` (phases 2.32/2.33 removed; new rng stream),
  `src/types/strategicAction.ts`, `src/types/gameState.ts`, `src/types/trace.ts`,
  `src/types/graph.ts` + `src/types/edgeSchema.ts` (mentors rename),
  `src/data/strategic-action-constants.ts` (+ new constants module if cleaner),
  `src/data/unified-action-templates.ts` (divine retargets),
  `src/data/action-technical-effects.ts`, strategic packs (+7 folded templates),
  `src/engine/agentDetail.ts`, `src/components/Game/AgentDetailPanel.tsx`,
  `src/components/Game/LocationView.tsx`, `src/types/balanceEval.ts`,
  `src/engine/balanceTelemetry.ts`, value-pair vocabulary sweep files (§4),
  `scripts/interface-contracts.ts` (+ wiki pages per freshness gate)
- Delete (final slice): the §3 DELETE list

## Notes for the executor

- **Slice order is load-bearing:** (1) value-pair vocabulary repair → (2) core extraction
  (behavior-identical, its own PR) → (3) checkpoints + flags + moments → (4) initiative retirement
  + mentorship fold → (5) shadow board → (6) cutover, then control deletion, each behind its
  measured gate. Slices may land as sequential PRs; the closing PR carries `Fixes THR-1292`. If the
  issue must park between slices, unassign per the parked-WIP rule.
- Do **not** add `strategicState.projects` to `busyAgentIds` under any circumstances — the addendum
  is explicit, and the contract test exists to make the mistake loud.
- The at-cost band's mechanical cost is deliberately content-deferred (doc 2). Do not invent an
  engine-side wealth/health tax to fill the gap.
- `check:wiki-freshness:blocking` will fire on the decision/strategic surfaces — update the
  affected wiki pages in the same PR (run it last, per the tree-diffing-gate rule).
- File the `create_faction` payoff deferral (§3) as a `Deferral` issue with its coordination block
  at fold time; same for any legacy-resolver (`resolution.ts`) cleanup you don't take.
- The debug outcome pin does not extend to checkpoints in v1 — resist the temptation; doc 6 designs
  the undertaking review levers.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-26*

**Intent-judge (Step 8.5): Allow** — run 1 returned Revise on a single structural finding (missing
`## Substrate inventory` section on an Engine-pillar plan); section added, run 2 re-scored all 11
dimensions PASS, impact class Reversible confirmed, zero GAPs/VIOLATIONs. Proposal:
`Docs/plans/.intent-proposals/2026-08-26-thr-1292-undertaking-substrate.md`.

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table lists 27 named tunables (checkpoint interval, ratchet thresholds, escalation weights, board gates, etc.); doc notes legacy inline magic numbers (`0.2`/`0.15`) die with the scorer they belong to. |
| 2. Inspectability | PASS | Three new typed trace interfaces (`undertaking_checkpoint`, `undertaking_fork`, `decision_board_comparison`) with explicit fields; wiring table maps each module to phase/trace/debug visibility; previously-untraced cross-family comparison now traced. |
| 3. Determinism | PASS | Explicit per-project PRNG stream (`mulberry32`, multiplier 97, chosen to avoid the documented *59/*53 collision defect), draw count bounded (≤2 rng() calls), riders/pins draw zero, existing catalyst stream left undisturbed. |
| 4. Fail-soft | PASS | Dedicated fail-soft table with 9 rows (missing reachProfile, actor-lost, deleted stage node, board-scorer throw, missing axis value, etc.), each with a stated fallback and "never thrown" language; board errors explicitly traced rather than silently swallowed. |
| 5. Narrative over mechanical | PASS | Halt/fork/residue machinery exists explicitly to make arcs narratable ("failure is plot, not punishment"); at-cost mechanical cost is honestly deferred to content (doc 2) rather than faked with an ad-hoc engine tax. |
| 6. Additive over destructive | PASS-with-note | Runtime/type changes are additive (new optional fields only); initiative pipeline + control-upkeep deletions are large destructive slices, but both are measured-dead/gated (0/30 or 0 starts in ~5,400 decisions; control deletion behind a measured decision-mix floor) and sequenced conversion-first, deletion-last — self-flagged in the doc's own table, verdict concurred. |
| 7. Performance budget | PASS | Concrete budget stated: ≤2 rng draws per project per 6 ticks (~18/tick worst case for ~55 projects), shadow-mode double-scoring bounded to ~46 spotlight agents and temporary, cites measured +13% wall-clock precedent (THR-1286) as comparison baseline. |

NFP AUDIT: PASS-with-notes (see row 6)

### Three-pillar audit

Confirmed the plan's substrate inventory table names match the real systems-inventory.md entries: "Strategic Projects & Control" (phase 2a.55), "Encounters & Dilemmas" (phase 2a), "Ambitions & Initiatives" (phases 2.32/2.33) all exist as 🟢 ACTIVE, matching the plan's dispositions exactly. No fabricated or omitted premise nouns found.

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Full systems design, graph/edges, tick phases table, resolution logic, PRNG callouts — 6 detailed subsections, far exceeds template minimum |
| Content | N/A-with-rationale | Explicitly "minimal by design," rationale stated (doc 2 owns kind catalog/prose); does note 7 folded templates + flag defaults inline |
| UI | N/A-with-rationale | Explicitly "minimal by design," rationale stated (doc 5 owns surfaces); documents the two mechanical repoints with Playwright tool named and UI Laws cited |

Missing-required-sections list: No missing required sections. Wiring section check: Yes — the Wiring table has 6 rows, each naming module, orchestrator phase, UI component, GameState field, trace emitted, and debug visibility. Substrate-existence check (THR-658): PASS — `## Substrate inventory` present, dispositions cross-checked against `Docs/canon/systems-inventory.md`, no green-field duplication found.

`PILLAR AUDIT: PASS`

### Vision audit

**Premises touched:** `00-north-star.md` → "intervention shifts odds, not outcome" — confirmed (Inspire/Sabotage retarget to checkpoint-dice modifiers, never a command); "one complex story at a time / player as witness" — extended (`followedAgentIds` + `resolveMomentPresentation` gate interrupts to followed mortals). `01-core-loop.md` → scan→encounter→aftermath rhythm — silent (no change to tick-advance model or ordering). `02-non-negotiables.md` → "god, not protagonist" — confirmed (halt-ratchet fork is agent-decided by formula); "narrative over mechanical perfection" — confirmed (at-cost gap honestly deferred, not faked); "additive over destructive" — extended with note (sanctioned measured-dead retirement, conversion-first); "three pillars always present" — silent/deferred with stated rationale, no premature review ask. `03-design-tensions.md` → tension 3 (divine remove vs. attachment) — confirmed (interrupt-vs-badge split is a calibrated instance). `taste-profile.md` → prose-first/no-numbers — silent (EVT/board scoring stays engine-internal).

**Contradictions:** No contradictions found.

**Qualitative checks:** North star: yes — converts a stakes-free countdown into genuine variance/consequence. Core loop: preserved. Non-negotiables: stays inside — probability-only intervention, mortal-decided forks. Design tensions: no over-lean. Taste profile: respected — no numbers surfaced; deferrals explicit, not silent.

`[design-brief-stale]` — Docs/design-brief.md has no Vision summary section.

VISION AUDIT: PASS
