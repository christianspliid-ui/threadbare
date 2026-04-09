# Ambition-Driven Strategic Actions — Implementation Plan

> **For Codex:** Implement in order unless a local code seam makes one step impossible. If the runtime reality conflicts with the approved design, update this plan and [2026-04-09-ambition-driven-strategic-actions-design.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-09-ambition-driven-strategic-actions-design.md) together before changing behavior.

**Goal:** Turn the approved strategic-actions design into a live, inspectable runtime system where ambitions can produce proactive world-shaping steps beside encounters, starting with a merchant proving slice and scaling toward broad behavior families.

**Architecture:** Keep one chooser. `phaseAgentDecision` remains the single planning surface, but it now merges encounter candidates with ambition-driven strategic candidates. Strategic steps execute through graph mutations, multi-tick projects, control upkeep, and catalyst encounter seeding. Encounters remain the dramatic/reactive layer; they are not replaced.

**Spec:** [2026-04-09-ambition-driven-strategic-actions-design.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-09-ambition-driven-strategic-actions-design.md)

**Key current seams:**
- [ambition.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/ambition.ts)
- [ambition-templates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/ambition-templates.ts)
- [ambitionTick.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/ambitionTick.ts)
- [phaseAgentDecision.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseAgentDecision.ts)
- [phaseEncounterProgression.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseEncounterProgression.ts)
- [encounterVisibility.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/encounterVisibility.ts)
- [encounterSeeding.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/encounterSeeding.ts)
- [encounterScoring.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/encounterScoring.ts)
- [balanceTelemetry.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/balanceTelemetry.ts)
- [action-template-content.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/action-template-content.ts)
- [unified-action-templates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/unified-action-templates.ts)
- [unifiedCandidates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/unifiedCandidates.ts)
- [factionAmbitions.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/factionAmbitions.ts)
- [ThreadDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadDetailView.tsx)
- [ThreadsPanel.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadsPanel.tsx)

---

## Frozen Contracts

- `phaseAgentDecision` remains the only autonomous decision chooser. Do **not** revive `phaseIdleSelection` or create a second hidden planner.
- First implementation stays additive. No new graph node type in v1. Use existing `event`, `location`, and edge/property seams before introducing schema expansion.
- Strategic actions must be inspectable through the same telemetry/debug surfaces as encounters. No silent background planner.
- Ambitions remain the planner spine. Strategic actions are generated from active ambitions; they are not free-floating generic CRUD picks.
- Encounters remain in the candidate board at all times. Strategic actions supplement and compete with them; they do not replace them.
- First proving slice is merchant-focused, but the data model must already support additional behavior families without structural rewrite.
- World mutations should prefer existing graph edges and location/sublocation structures. Reuse `trades_with`, `controls`, `constructed_by`, `contains`, and `member_of` where semantically correct.

---

## Throughput Gate

Before changing runtime logic, verify the upstream systems that strategic actions depend on are alive enough to matter.

- [ ] **Ambition assignment/progress is active**
  - Seams: [ambitionTick.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/ambitionTick.ts), `pursues` edges
  - Verification: seeded run produces active ambitions and milestone completions within 50 ticks
- [ ] **Encounter chooser remains healthy**
  - Seams: [phaseAgentDecision.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseAgentDecision.ts), balance telemetry
  - Verification: existing encounter liveness / threaded balance contracts stay green
- [ ] **Encounter phase ordering stays coherent**
  - Seams: encounter progression → visibility → seeding in the current 2a.x pipeline
  - Verification: any new strategic runtime phase is inserted without breaking encounter progression, notification timing, or aftermath seeding
- [ ] **Sublocation creation works**
  - Seams: [phaseSublocations] in [orchestrator.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/orchestrator.ts), settlement/location graph helpers
  - Verification: existing sublocation integration test passes before strategic warehouse/chapter work begins
- [ ] **Trade and faction graph seams are alive**
  - Seams: `trades_with` edges, faction detail graph queries
  - Verification: current faction/trade tests remain green

If any of these are dead, repair them before trying to land strategic actions. A unified chooser wired to dead upstream systems is functionally dead code.

---

## Delivery Slices

**Slice A — Infrastructure and chooser integration**
- types, constants, ambition strategic metadata
- strategic candidate generation
- scoring/merging in `phaseAgentDecision`
- traces + telemetry + debug plumbing

**Slice B — Merchant proving slice**
- market survey
- storage-right negotiation
- trade-route establishment
- warehouse building
- guild-chapter founding
- monopoly/control upkeep
- catalyst encounter hooks

**Slice C — Player-facing visibility**
- thread detail family/agenda/step display
- strategic history in agent detail
- hex-map project/control icons
- CLI/debug views

**Slice D — Behavior-family expansion**
- scholar / zealot
- court / shadow
- builder / steward
- faction adoption

If scope tightens, ship A+B together first. Do not ship UI-only strategic labels without a real runtime candidate family behind them.

---

## Orchestrator Placement

The new system adds proactive runtime behavior, but it must not add a second planner.

- **Chooser remains at Phase 2b**
  - [phaseAgentDecision.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseAgentDecision.ts) still decides what idle agents do next
  - strategic candidates are merged into this existing decision surface
- **Recommended runtime progression phase**
  - add `phaseStrategicProjects` at **2a.55**, after encounter progression and before encounter visibility
  - rationale:
    - active encounters resolve first
    - strategic projects then advance/complete
    - visibility/notifications can see both outcomes in the same tick
    - catalyst encounter seeds from completed strategic steps can be handed off before the next decision cycle
- **Do not add a separate strategic-selection phase**
  - no `phaseAgentInitiative`
  - no planner branch outside `phaseAgentDecision`

---

## File Plan

**New files**

| File | Responsibility |
|---|---|
| [strategicAction.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/strategicAction.ts) | Core strategic candidate, runtime project, control-state, and behavior-family types |
| [strategic-action-constants.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/strategic-action-constants.ts) | All tunable weights, caps, cooldowns, cadence, and catalyst constants |
| [strategicActionCandidates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionCandidates.ts) | Generate ambition-driven strategic candidates from active ambitions + world blockers + opportunities |
| [strategicActionScoring.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionScoring.ts) | Family-aware scoring and normalization for strategic candidates |
| [strategicActionLifecycle.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionLifecycle.ts) | Start/advance/complete/fail multi-tick strategic projects and control stances |
| [strategicGraphOps.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicGraphOps.ts) | Safe graph mutations for create/change/control/destroy steps |
| [phaseStrategicProjects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseStrategicProjects.ts) | Runtime progression phase for active strategic projects/control upkeep |
| [merchantStrategicPack.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/strategic-packs/merchantStrategicPack.ts) | Merchant behavior-pack definitions, target rules, and first catalyst hooks |
| [strategicTelemetry.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicTelemetry.ts) | Helpers for strategic decision summaries, dominance, and history formatting |
| [strategicActionCandidates.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionCandidates.test.ts) | Candidate-generation tests |
| [strategicActionScoring.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionScoring.test.ts) | Scoring/merge tests |
| [strategicActionLifecycle.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionLifecycle.test.ts) | Runtime project/control tests |
| [strategic-actions.contract.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/contracts/strategic-actions.contract.test.ts) | Merchant proving-slice end-to-end contract |

**Existing files to modify**

| File | Changes |
|---|---|
| [ambition.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/ambition.ts) | Add optional strategic profile metadata types |
| [ambition-templates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/ambition-templates.ts) | Tag ambitions with behavior families / preferred strategic verbs / targets |
| [gameState.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/gameState.ts) | Add runtime state for in-progress strategic projects and recent history if needed |
| [trace.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/trace.ts) | Add strategic candidate/project/world-change trace contracts |
| [balanceEval.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/balanceEval.ts) | Add strategic decision payloads beside encounter decision telemetry |
| [phaseAgentDecision.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseAgentDecision.ts) | Merge encounter + strategic candidate families in one chooser |
| [orchestrator.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/orchestrator.ts) | Wire `phaseStrategicProjects` at 2a.55 and keep encounter/visibility/seeding order coherent |
| [encounterSeeding.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/encounterSeeding.ts) | Reuse or extend aftermath seeding seams for catalyst follow-up encounters from strategic completions |
| [balanceTelemetry.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/balanceTelemetry.ts) | Record strategic decision/project/world-change events |
| [debug-bridge.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/debug-bridge.ts) | Expose strategic candidate/history summaries |
| [scripts/cli.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/scripts/cli.ts) | Add strategic inspection commands |
| [ThreadDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadDetailView.tsx) | Show current strategic step, family, and history |
| [ThreadsPanel.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadsPanel.tsx) | Surface strategic family badges / link to candidate board |
| [GameView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/GameView.tsx) | Route telemetry/runtime state into thread/detail/map surfaces |
| [hexMapAgentVisibility.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/hexMapAgentVisibility.ts) and HexMapV2 activity/icon files | Add project/control icon visibility for proactive work |
| [wiring-checklist.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/wiring-checklist.md) | Update only if new permanent surfaces/phases are added |

---

## Starter Constants Table

All values below must live in [strategic-action-constants.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/strategic-action-constants.ts). Names are part of the contract; defaults can tune later.

| Constant | Default | Purpose |
|---|---:|---|
| `ENABLE_STRATEGIC_ACTIONS` | `false` | Rollout gate for safe A/B verification against encounter-only behavior |
| `STRATEGIC_MAX_CANDIDATES_PER_ACTOR` | `12` | Hard cap on proactive candidates generated per actor per tick |
| `STRATEGIC_MAX_CANDIDATES_PER_AMBITION` | `5` | Prevent a single ambition from flooding the board |
| `STRATEGIC_WORLD_IMPACT_WEIGHT` | `0.24` | Reward actions that materially reshape graph state |
| `STRATEGIC_BLOCKER_RELIEF_WEIGHT` | `0.22` | Reward steps that unblock ambition progress |
| `STRATEGIC_CATALYST_VALUE_WEIGHT` | `0.16` | Reward actions likely to seed follow-up encounters |
| `STRATEGIC_ROLE_FIT_WEIGHT` | `0.12` | Reward actions that fit the actor's archetype and domain profile |
| `STRATEGIC_TRAVEL_PENALTY_WEIGHT` | `0.14` | Penalize proactive steps that demand unattractive travel |
| `STRATEGIC_VARIETY_PENALTY_WEIGHT` | `0.18` | Penalize same-template spam in recent history and candidate boards |
| `STRATEGIC_CONTROL_PRESSURE_WEIGHT` | `0.20` | Elevate upkeep/contest actions when the actor risks losing control |
| `STRATEGIC_PROJECT_PROGRESS_PER_TICK` | `1` | Baseline project advancement cadence before modifiers |
| `STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS` | `18` | Fail-soft timeout for stalled multi-tick projects |
| `STRATEGIC_HISTORY_WINDOW_TICKS` | `120` | Window kept for player/debug strategic history summaries |
| `STRATEGIC_CATALYST_SEED_CHANCE` | `0.65` | Default chance for eligible completions to emit a follow-up encounter seed |
| `STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS` | `10` | Ticks before unattended control states begin degrading |

Tune names can expand during implementation, but all new magic numbers should follow this pattern.

---

## Trace Contracts

Strategic work must be inspectable from the first implementation slice. Add trace unions up front instead of backfilling them later.

```ts
export interface StrategicCandidateBoardTrace {
  kind: 'strategic_candidate_board';
  tick: number;
  actorId: string;
  ambitionIds: string[];
  candidatesGenerated: number;
  candidatesRejected: number;
  topCandidateIds: string[];
  chosenCandidateId: string | null;
  featureEnabled: boolean;
}

export interface StrategicActionStartedTrace {
  kind: 'strategic_action_started';
  tick: number;
  actorId: string;
  candidateId: string;
  behaviorFamily: BehaviorFamily;
  verb: StrategicVerb;
  targetNodeId?: string;
  targetHex?: { col: number; row: number };
  executionMode: StrategicExecutionMode;
}

export interface StrategicProjectProgressTrace {
  kind: 'strategic_project_progress';
  tick: number;
  actorId: string;
  projectId: string;
  progress: number;
  progressRequired: number;
  status: 'active' | 'completed' | 'stalled' | 'failed';
}

export interface StrategicWorldChangeTrace {
  kind: 'strategic_world_change';
  tick: number;
  actorId: string;
  projectId?: string;
  verb: StrategicVerb;
  graphOps: string[];
  catalystSeeded: boolean;
  affectedNodeIds: string[];
}
```

These traces should be mirrored by balance/debug summary payloads rather than inventing a second inspection path.

---

## Fail-Soft Table

| Failure case | Expected fallback |
|---|---|
| Ambition has no strategic profile | Skip proactive generation for that ambition; keep encounter chooser alive |
| No valid targets for a strategic template | Reject the candidate with a reason; do not throw |
| Graph mutation helper cannot resolve a reusable seam | Abort that action, emit failure trace/telemetry, preserve actor/project integrity |
| Strategic project times out | Mark stalled/failed, write history entry, optionally seed a complication encounter, and release actor back to chooser |
| Catalyst encounter seed cannot be created | Complete the strategic action anyway and log `catalystSeeded=false` |
| UI/debug surface receives incomplete strategic payload | Render partial information with explicit fallback labels such as `Unknown target` / `No strategic history yet` |
| Feature flag disabled mid-save / test | `phaseAgentDecision` reverts to encounter-only behavior; orphaned project data is ignored but preserved for migration scripts |

---

## PRNG Callouts

- Candidate tie-breaks in [strategicActionScoring.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionScoring.ts) must use the seeded simulation PRNG, never `Math.random`.
- Catalyst encounter seeding in [strategicActionLifecycle.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionLifecycle.ts) must consume explicit seeded rolls so the same seed yields the same proactive-history chain.
- Any target selection among equally good graph nodes in [strategicActionCandidates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionCandidates.ts) must be stable under the same seed + graph ordering.

---

## Phase 1 — Lock the Data Contracts

- [ ] Create [strategicAction.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/strategicAction.ts).
  - Define `StrategicVerb`, `StrategicExecutionMode`, `BehaviorFamily`, `StrategicActionCandidate`, `StrategicProjectRuntime`, `StrategicHistoryEntry`.
  - Include both instant steps and multi-tick project/control states.
- [ ] Create [strategic-action-constants.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/strategic-action-constants.ts).
  - Move all weights/caps/cooldowns from the design into named exported constants.
  - Add one top-level feature flag for rollout safety, e.g. `ENABLE_STRATEGIC_ACTIONS`.
- [ ] Extend [ambition.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/ambition.ts).
  - Add optional `strategicProfile` contract to `AmbitionTemplate`.
  - Keep the extension additive. No breaking rename of current ambition fields.
- [ ] Extend [ambition-templates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/ambition-templates.ts).
  - Start by tagging only the ambitions needed for the merchant proving slice.
  - Do not try to annotate every ambition in the first commit.
- [ ] Extend [trace.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/trace.ts).
  - Add `strategic_candidate_board`, `strategic_action_started`, `strategic_project_progress`, `strategic_world_change`.
- [ ] Extend [balanceEval.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/types/balanceEval.ts).
  - Add a strategic payload sibling to the existing encounter decision shape instead of overloading encounter-only fields.

**Tests**

- [ ] Add type-focused tests or compile assertions where existing suites already cover ambition/trace unions.
- [ ] Confirm `npx tsc --noEmit` is clean before moving on.

---

## Phase 2 — Build the Ambition-to-Step Generator

- [ ] Create [merchantStrategicPack.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/strategic-packs/merchantStrategicPack.ts).
  - First-wave templates:
    - survey market
    - negotiate storage rights
    - establish trade route
    - build warehouse
    - found guild chapter
    - maintain monopoly / control
  - Include target rules, reach profile, resource heuristics, and catalyst hints.
- [ ] Create [strategicActionCandidates.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionCandidates.ts).
  - Inputs:
    - graph
    - actor
    - active ambitions
    - current location / hex
    - recent history
    - blocker context
  - Candidate sources:
    - ambition template progression
    - world blockers
    - opportunity pulls
    - control obligations
    - recent unfinished work
  - Keep this pure. Generation should return candidates and rejection reasons, not mutate the graph.
- [ ] Explicitly reuse legacy CRUD content where it helps, but do **not** run the old autonomous selection path.
  - Reuse action-template semantics and vocabulary from [action-template-content.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/action-template-content.ts).
  - If a legacy template maps cleanly, use a mapping layer; otherwise author the strategic pack directly.
- [ ] Fail soft on missing targets.
  - No warehouse site available -> no `build warehouse` candidate, trace rejection
  - No relevant faction or market -> omit or downgrade candidate

**Tests**

- [ ] Add [strategicActionCandidates.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionCandidates.test.ts).
  - Merchant ambition generates a diverse candidate board from realistic state
  - Missing prerequisites suppress candidates, not crash
  - Same actor in different world contexts gets different candidates
  - Generator does not emit duplicate copies of the same step without target distinction

---

## Phase 3 — Score and Merge Strategic Candidates in the Live Chooser

- [ ] Create [strategicActionScoring.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionScoring.ts).
  - Score by:
    - ambition alignment
    - blocker relief
    - direct world impact
    - catalyst value
    - resource affordability
    - control obligation pressure
    - role/archetype fit
    - variety penalty
    - travel penalty
  - Add deterministic tie-breaking with seeded PRNG.
- [ ] Modify [phaseAgentDecision.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseAgentDecision.ts).
  - Keep encounter generation/filtering exactly alive.
  - Build strategic candidate list alongside the encounter candidate list.
  - Normalize them into one decision board.
  - Select one winner using the same overall decision flow.
  - Record whether the chosen family was `encounter`, `strategic_action`, `idle`, or `forced_travel`.
- [ ] Add strategic candidate board traces and balance telemetry.
  - Keep the current `encounter_decision` stream intact for backward compatibility if practical.
  - If a new event kind is cleaner, add it beside the existing event kind instead of overloading it.

**Tests**

- [ ] Add [strategicActionScoring.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionScoring.test.ts).
  - Strategic candidate can legitimately beat an encounter when it relieves a major blocker
  - Encounter still wins when drama/opportunity is stronger
  - Variety penalty prevents raw template spam
  - Deterministic ordering under seeded tie-breaks
- [ ] Add one focused chooser contract proving:
  - same seed + same state yields same family choice
  - disabling the feature flag reverts to encounter-only behavior

---

## Phase 4 — Execute Strategic Actions Safely

- [ ] Create [strategicGraphOps.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicGraphOps.ts).
  - Reuse existing graph mutation helpers where possible.
  - Prefer existing edges and properties:
    - `trades_with`
    - `controls`
    - `constructed_by`
    - `member_of`
    - `contains`
  - No new node types in v1.
- [ ] Create [strategicActionLifecycle.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicActionLifecycle.ts).
  - Support:
    - instant graph op
    - multi-tick project
    - seed encounter
    - claim control
    - contest control
  - Represent runtime state with additive project records, likely backed by `event` nodes or `GameState` runtime arrays/maps.
- [ ] Add an orchestrator progression seam if needed.
  - Implement [phaseStrategicProjects.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/phaseStrategicProjects.ts) at **2a.55**, immediately after encounter progression and before visibility/decision.
  - This is a runtime progression phase, **not** a second planner.
- [ ] Implement merchant proving-slice outcomes.
  - `survey market` -> information state/history only, possibly improved trade candidate scores
  - `negotiate storage rights` -> relationship/permission state and future warehouse viability
  - `establish trade route` -> create/modify `trades_with`
  - `build warehouse` -> create sublocation/location child + `constructed_by`
  - `found guild chapter` -> faction-linked sublocation or faction membership/control edge
  - `maintain monopoly/control` -> control state with upkeep and contest pressure
- [ ] Add catalyst follow-up seeding for at least 2 merchant actions.
  - `build warehouse` -> sabotage/inspection/labor encounter seed
  - `establish route` -> ambush/toll/route dispute seed
  - Prefer handing these through the existing encounter seeding/visibility path instead of inventing a parallel notification channel.

**Tests**

- [ ] Add [strategicActionLifecycle.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/strategicActionLifecycle.test.ts).
  - instant mutation path
  - multi-tick project advances and completes
  - invalid target fails soft
  - control state degrades when neglected
  - catalyst seeding emits expected runtime records

---

## Phase 5 — Merchant Proving Slice Contract

- [ ] Add [strategic-actions.contract.test.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/__tests__/contracts/strategic-actions.contract.test.ts).
  - Seed an agent with a merchant/guild ambition in a location-rich environment.
  - Run enough ticks to confirm the actor can:
    - generate both encounter and strategic candidates
    - pick at least one strategic action
    - mutate the world graph
    - record strategic history
    - seed at least one follow-up encounter or conflict
- [ ] Acceptance bar for the proving slice:
  - the actor log/history reads as a coherent commercial campaign
  - the candidate board shows variety beyond one repeated template
  - no second invisible planner is introduced

---

## Phase 6 — Telemetry, CLI, and Debug Visibility

- [ ] Create [strategicTelemetry.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/strategicTelemetry.ts).
  - Format history summaries and candidate dominance for UI/debug consumption.
- [ ] Extend [balanceTelemetry.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/engine/balanceTelemetry.ts).
  - Record strategic starts, completions, failures, control loss, and seeded encounters.
- [ ] Extend [debug-bridge.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/debug-bridge.ts).
  - Suggested helpers:
    - `getStrategicDecisionSummary(agentId?)`
    - `getStrategicProjects()`
    - `getStrategicHistory(agentId)`
- [ ] Extend [scripts/cli.ts](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/scripts/cli.ts).
  - Suggested commands:
    - `strategic`
    - `strategic agent <name>`
    - `projects`
    - `history <name>`

**Tests**

- [ ] Add/extend focused telemetry and CLI formatting tests where those suites already exist.

---

## Phase 7 — Player-Facing Surfaces

- [ ] Update [ThreadDetailView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadDetailView.tsx).
  - Show:
    - current ambition
    - current execution family
    - current strategic step
    - top alternatives considered
    - recent strategic history
- [ ] Update [ThreadsPanel.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/ThreadsPanel.tsx).
  - Surface a strategic badge or activity line when the latest decision is proactive rather than encounter-driven.
- [ ] Update [GameView.tsx](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/components/Game/GameView.tsx).
  - Route strategic telemetry/runtime state into existing thread/detail/map surfaces.
- [ ] Add map feedback for strategic projects and control states.
  - Reuse the current activity/icon system rather than inventing a parallel visual stack.
  - First-wave examples:
    - build/project icon
    - trade/control icon
- [ ] Add strategic history to the agent detail/profile surfaces once the proving slice is stable.

**Tests**

- [ ] Extend thread/detail component tests to cover strategic family rendering.
- [ ] Add a minimal visibility test for map/icon presentation if those surfaces are touched.

---

## Phase 8 — Broaden the Behavior Families

Do not start this until the merchant proving slice is stable and legible.

- [ ] **Scholar / seeker pack**
  - research archive
  - investigate anomaly
  - write treatise
  - suppress knowledge
- [ ] **Zealot / temple pack**
  - consecrate site
  - convert followers
  - found shrine
  - police doctrine
- [ ] **Court / shadow pack**
  - buy influence
  - secure office
  - organize patronage
  - blackmail / spy network / sabotage
- [ ] **Builder / steward pack**
  - fortify
  - civic construction
  - repair
  - steward granary/clinic/storehouse
- [ ] **Faction adoption**
  - let faction ambitions consume the same strategic framework at organizational scale

Each new pack should mostly be new data + tests, not a rewrite of the core engine seam.

---

## Test Strategy

Use the existing `src/engine/__tests__/` style for engine work, `contracts/` for cross-module behavior, and `src/components/Game/__tests__/` for UI surfaces.

**Must-have tests**

- [ ] ambition strategic metadata / type-compat tests
- [ ] strategic candidate generation unit tests
- [ ] strategic scoring merge tests
- [ ] lifecycle tests for multi-tick projects and control states
- [ ] merchant proving-slice contract
- [ ] thread/detail UI tests for strategic family/history visibility
- [ ] telemetry/debug tests for strategic summaries

**Verification commands**

- [ ] `npm test`
- [ ] `npx tsc --noEmit`
- [ ] `npx vite build`
- [ ] `npm run cli -- --seed 42`
  - Then smoke test enough ticks to observe at least one strategic decision in the proving slice

**Manual verification**

- [ ] `?view=game&seeded`
- [ ] Threaded merchant-like actor shows a strategic step in thread detail/history
- [ ] Strategic project or control icon appears on the map
- [ ] Created warehouse/chapter/route becomes visible in the world model
- [ ] Follow-up encounter seed appears when expected

---

## Wiring Checklist

| Surface | Expected wiring |
|---|---|
| Orchestrator | Existing `phaseAgentDecision` remains the chooser; a new project/control progression phase may be added for runtime advancement only |
| GameState flow | Runtime project/history state, if added, must be consumed by thread/detail/debug surfaces |
| Traces | Strategic candidate board, start/progress/world-change traces emitted from generation/selection/lifecycle seams |
| Debug visibility | Existing debug bridge + CLI + thread detail should expose strategic decisions without requiring a brand-new debug panel first |
| UI rendering | `GameView`, `ThreadsPanel`, `ThreadDetailView`, and map activity/icon surfaces must render the new state |
| Player controls | No new direct player controls required for v1 beyond inspection; if management actions are added later, wire them explicitly |
| Prose pipeline | Any new player-facing narrative text for strategic history should go through the existing prose/enrichment seam where templated |
| Throughput gate | Ambitions, encounters, sublocation creation, trade/faction seams must be alive before the proving slice is called done |

If this work adds a permanent new orchestrator phase or a permanent new debug/player surface, update [wiring-checklist.md](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/wiring-checklist.md) in the same implementation slice.

---

## Documentation Follow-Through

When the runtime implementation lands, update:

- [public/encounters-agents-reference.html](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/public/encounters-agents-reference.html)
  - document the new dual-family chooser and strategic-action family
- [public/tick-cycle-reference.html](/Users/chris/Dev/Projects/TheFantasyWorldSimulator/public/tick-cycle-reference.html)
  - add `phaseStrategicProjects` if it becomes a permanent orchestrator phase

---

## Recommended Commit Boundaries

1. `feat(strategic): add strategic action types, constants, and ambition profile metadata`
2. `feat(strategic): generate and score ambition-driven strategic candidates`
3. `feat(strategic): merge strategic candidates into phaseAgentDecision`
4. `feat(strategic): add lifecycle and merchant proving-slice world mutations`
5. `feat(strategic): add telemetry, CLI, and thread/detail visibility`
6. `test(strategic): add merchant contract and strategic chooser coverage`

Keep each commit coherent and test-backed. Do not batch the entire system into one mega-commit.

---

## NFP Compliance

| Priority | Status | Notes |
|---|---|---|
| Tunability | PASS | All starter weights/caps/cadence values are named constants in a dedicated constants module. |
| Inspectability | PASS | Strategic chooser, project lifecycle, and world changes all emit explicit trace contracts and feed existing debug/telemetry surfaces. |
| Determinism | PASS | Tie-breaks, catalyst seeding, and equal-target resolution all call out seeded PRNG requirements. |
| Fail-soft | PASS | Missing targets, failed graph ops, stalled projects, and missing UI payloads all degrade to traceable fallbacks rather than tick crashes. |
| Narrative over mechanical perfection | PASS | Encounters stay in the board as the drama/friction layer while proactive actions express long-form ambition progress. |
| Additive over destructive changes | PASS | v1 adds strategic state/types/phases beside the encounter pipeline rather than replacing the current chooser or graph schema. |
| Performance budget | PASS with note | Candidate caps and history windows are bounded up front; if profiling later shows pressure, trim per-ambition generation before deeper refactors. |
