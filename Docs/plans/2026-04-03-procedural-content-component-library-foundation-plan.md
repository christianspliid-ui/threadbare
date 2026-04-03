# Procedural Content Component Library Foundation Plan

**Date:** 2026-04-03  
**Status:** In progress — foundation slice 1 implemented (`test_shaper`, `prevent_loss`, `content_grant`, immediate `service` shell proof pack)  
**Backlog:** TB-104  
**Roadmap:** Cross-cutting future work feeding v1.2 Social Systems Expansion, M3 Dynamic Economy, and general content authoring

---

## Objective

Expand the current generic effect system into a reusable **content grammar** for authored procedural content.

The aim is not to port Eldritch Horror mechanics literally. The aim is to give FWS a small, powerful library of primitives and shells that can be recombined across:

- encounters
- items
- spells
- conditions
- talents
- bonds
- reputations
- achievements
- artifacts
- agreement-style burdens and boons

This plan is the implementation follow-on to the audit in [2026-04-03-procedural-content-component-library-audit.md](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\Docs\plans\2026-04-03-procedural-content-component-library-audit.md).

---

## Non-Goals

- No literal Eldritch Horror content import
- No new graph node types unless later proven necessary
- No replacement of the current attachment or spell frameworks
- No giant authoring pass in the same slice as the runtime foundations
- No bespoke one-off logic for individual cards, items, or talents

---

## Architectural Decision

We should separate the work into three layers:

### 1. Primitives

Small reusable effect behaviors such as:

- `test_shaper`
- `prevent_loss`
- `resource_delta`
- `action_trigger`
- `choice_set`
- `content_grant`

These belong in or adjacent to the current `AttachmentEffect` ecosystem.

### 2. Shells

Reusable authored state machines such as:

- `flip_table`
- `clearance_gate`
- duplicate-gain policy
- `task_progress`
- `service`
- `support_retainer`

These are not new graph node types. They are reusable wrappers for existing attachment, spell, agreement, and reward content.

### 3. Starter libraries

Authored content packs built from the primitives and shells:

- micro combat items
- rescue/support items
- unstable talents
- bargain conditions
- courier/pilgrimage tasks
- unstable spells
- bond assists
- reputation favors / grudges
- achievement tracks

This keeps the runtime small and expressive while making content authoring faster and safer.

---

## Why This Approach Fits The Existing Codebase

The current system already gives us the right seam:

- [effects.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\effects.ts) contains the primitive effect vocabulary
- [attachments.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\attachments.ts) already supports `effects` and `activatedEffects`
- [spell-templates.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\data\spell-templates.ts) already packages costs, effects, cooldowns, and backlash
- [artifact-templates.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\data\artifact-templates.ts) already packages passive plus activated content
- `effectStates` already exists on `GameState` and is already ticked through `phaseEffectTick`

So the correct move is:

- extend the effect vocabulary
- add lifecycle shell metadata
- extend the existing runtime state map
- add authoring tables on top

not build a parallel system.

---

## Proposed Data Model

### A. Extend `AttachmentEffect`

Add the new first-class primitive families:

- `test_shaper`
- `prevent_loss`
- `resource_delta`
- `action_trigger`
- `choice_set`
- `content_grant`

Implementation home:

- [effects.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\effects.ts)

### B. Add shared shell config types

Create a shared shell type file for attachment/spell/talent/condition wrappers, for example:

- `src/types/contentShells.ts`

Candidate shared types:

- `FlipTableConfig`
- `ClearanceGateConfig`
- `DuplicateGainPolicy`
- `ProgressTrackConfig`
- `ServicePayloadConfig`
- `SupportRetainerConfig`

This avoids overloading `effects.ts` with non-primitive lifecycle wrappers while keeping the system additive.

### C. Extend existing template surfaces rather than creating new node types

Add optional shell metadata to existing content types:

- possession/condition/blessing/curse/bestowed power/agreement properties in [attachments.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\attachments.ts)
- spell templates in [effects.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\effects.ts) and [spell-templates.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\data\spell-templates.ts)
- artifact templates in [artifact-templates.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\data\artifact-templates.ts)

### D. Keep service content out of the graph unless persistence is needed

Services should resolve on acquisition and disappear. They should be modeled as:

- authored service templates in data
- resolved through reward/acquisition flows
- emitted as events and traces
- not stored as long-lived graph nodes unless a specific service later needs persistence

### E. Reuse `effectStates` as the lifecycle hub

Extend `GameState.effectStates` so it can track:

- consumed or armed `test_shaper` state
- triggered but unrevealed flip-state content
- progress counters and payout thresholds
- clearance attempts / locks
- duplicate-gain escalation state

This keeps state concentrated in one existing runtime surface.

---

## Implementation Phases

### Phase 1 — Primitive vocabulary expansion

**Goal:** Stop flattening all authored content into passive modifiers.

Add:

- `test_shaper`
- `prevent_loss`
- `resource_delta`
- `action_trigger`
- `choice_set`
- `content_grant`

Primary files:

- [effects.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\effects.ts)
- [effectResolver.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\engine\effectResolver.ts)
- [effectExecutors.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\engine\effectExecutors.ts)
- [effectTick.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\engine\effectTick.ts)
- [spellActivation.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\engine\spellActivation.ts)
- tests in `src/engine/__tests__/`

Success criteria:

1. A micro combat item can express `.18 Derringer`, `.45 Automatic`, and `Bull Whip` as different effects without collapsing to flat Iron bonuses.
2. A rescue item can cancel incoming loss for self or ally through a single reusable primitive.
3. A service or tome can grant drafted content without bespoke executor code.
4. All new primitives emit traces and have deterministic unit tests.

**2026-04-03 implementation slice landed:**

- `test_shaper` added to the generic effect vocabulary and wired through both encounter and unified-action resolution into `resolveAction()`
- `prevent_loss` added for quintessence protection and consumed by `phaseQuintessence`
- `content_grant` added and exercised through immediate reward-time service resolution
- immediate `service` shell behavior added to reward instantiation via `rewardMode: 'service'`
- starter proof pack added to the reward catalog:
  - `Duelist's Luck Token`
  - `Hearthglass Ward`
  - `Letters of Introduction`
  - `Patron's Backing`

**Still pending inside Phase 1:**

- `resource_delta`
- `action_trigger`
- `choice_set`
- trace/debug surfacing beyond current reward/event text and existing runtime inspection

### Phase 2 — Stateful shell runtime

**Goal:** Add authored lifecycle richness without inventing new graph node categories.

Add:

- `flip_table`
- `clearance_gate`
- duplicate-gain behavior
- result-band support for spells and unstable shells

Primary files:

- `src/types/contentShells.ts` (new)
- [attachments.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\attachments.ts)
- [effects.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\effects.ts)
- [gameState.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\types\gameState.ts)
- [effectTick.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\engine\effectTick.ts)
- a new lifecycle helper such as `src/engine/effectShellRuntime.ts`

Success criteria:

1. A condition can have a front state, a clearance rule, and a revealed consequence.
2. Duplicate-gain policies can choose `stack`, `refresh`, `flip`, `worsen`, or `ignore`.
3. A spell or talent can resolve by result band rather than only success/failure.
4. Shell transitions are recorded in traces and visible in runtime state inspection.

### Phase 3 — Progress and service shells

**Goal:** Support delayed value, travel-linked arcs, and on-gain immediate content.

Add:

- `task_progress`
- immediate `service` shell
- `support_retainer` shell

Primary files:

- `src/types/contentShells.ts`
- reward/acquisition pipeline modules
- [reward-attachment-catalog.ts](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\data\reward-attachment-catalog.ts)
- new authored data files for services/tasks if helpful

Success criteria:

1. A courier-style task can bind to a target and pay out on completion.
2. A service can resolve immediately on gain and never persist into inventory.
3. An ally/retainer shell can combine passive support with one action or reaction.
4. Progress advancement and completion emit Chronicle-visible events and debug traces.

### Phase 4 — Starter library authoring

**Goal:** Prove the runtime through varied content, not just worked examples.

Author initial packs for:

- combat items
- rescue/support items
- unstable talents
- deal/bargain conditions
- unstable spells
- courier / pilgrimage / commission tasks
- bond assists
- reputation favors and grudges
- achievement tracks

Success criteria:

1. Each shell family has at least 5-10 authored examples.
2. At least three different content families share the same primitive in meaningfully different ways.
3. The authored library yields richer procedural combinations without introducing one-off engine code.

### Phase 5 — Governance and tuning

**Goal:** Keep the system expressive without letting it sprawl or explode balance.

Add:

- stacking caps
- shell authoring rules
- starter lint/test coverage expectations
- authored content review checklist

Success criteria:

1. Content authors know which primitive/shell families are allowed for each content family.
2. External `test_shaper` stacking is capped and enforced.
3. Missing shell metadata degrades safely and observably.

---

## Recommended First Implementation Slice

Start with the smallest slice that proves the architecture:

1. `test_shaper`
2. `prevent_loss`
3. `content_grant`
4. `service` shell

Proof pack:

- one precision weapon
- one extra-roll weapon
- one rescue/support item
- one training service
- one tome that grants a spell or task

Why this slice first:

- it touches all three important seams: resolution, acquisition, and authored variety
- it avoids the heavier flip-state runtime on day one
- it produces immediately useful content for existing encounters and reward tables

---

## Constants Table

| Constant | Default | Purpose |
|---|---:|---|
| `MAX_EXTERNAL_TEST_SHAPERS_PER_RESOLUTION` | `1` | Prevent runaway stacking from items, talents, bonds, and reputations |
| `MAX_REACTION_PREVENT_LOSS_PER_CHANNEL` | `1` | Prevent rescue loops on the same health/sanity/quintessence event |
| `CONTENT_GRANT_DRAFT_CHOICES` | `3` | Standard draft width when a card grants a filtered content choice |
| `MAX_FLIP_VARIANTS_PER_TEMPLATE` | `6` | Keep authored reveal tables small, inspectable, and readable |
| `MAX_PROGRESS_STEPS_PER_TRACK` | `12` | Keep progress carriers compact enough for UI and debugging |
| `DEFAULT_PROGRESS_COMPLETION_PAYOUT_BAND_COUNT` | `3` | Standard low/mid/high payout band count for tasks and achievements |
| `DEFAULT_CLEARANCE_ATTEMPTS_PER_REST` | `1` | Keep recovery loops predictable and easy to tune |
| `DEFAULT_SERVICE_CHAIN_LIMIT` | `3` | Prevent service-on-gain chains from recursively exploding |
| `DEFAULT_RESULT_BAND_COUNT` | `3` | Standard banding for weak/strong/backlash style outcomes |

All numbers above should live in a named constants file rather than inside executors.

---

## Tracing

New trace categories proposed:

- `effect_shell`
- `effect_progress`
- `effect_service`
- `effect_reaction`

Example detail interfaces:

```ts
interface TestShaperAppliedTraceDetails {
  actorId: string;
  sourceAttachmentId: string;
  mode: 'extra_roll' | 'reroll_one' | 'reroll_any' | 'pip_boost_one' | 'near_miss_to_success' | 'outcome_step_shift';
  encounterId?: string;
  stepId?: string;
  before?: number;
  after?: number;
  consumed: boolean;
}

interface FlipRevealedTraceDetails {
  actorId: string;
  attachmentId: string;
  shellKind: 'condition' | 'talent' | 'spell' | 'agreement';
  trigger: string;
  variantId: string;
  rngRoll?: number;
}

interface ProgressAdvancedTraceDetails {
  actorId: string;
  attachmentId: string;
  trackId: string;
  source: string;
  amount: number;
  before: number;
  after: number;
  completed: boolean;
  boundTargetId?: string;
}

interface ServiceResolvedTraceDetails {
  actorId: string;
  serviceId: string;
  payloadKinds: string[];
  source: 'acquire' | 'reward' | 'grant';
}

interface ClearanceAttemptTraceDetails {
  actorId: string;
  attachmentId: string;
  gate: 'rest' | 'travel' | 'encounter_complete' | 'action' | 'reckoning_survival';
  success: boolean;
  discarded: boolean;
}
```

These traces should route through the existing trace buffer and become inspectable in the DebugPanel.

---

## PRNG Callouts

Seeded randomness is required at these points:

| Use | Why PRNG is needed | Deterministic keying |
|---|---|---|
| Flip variant selection | Revealed backs must stay authored but surprising | Seed from runtime PRNG using attachment id + trigger count + tick |
| Filtered content grant draft | Tomes/training/services may offer a random subset | Seed from actor id + source template id + grant index |
| Reward band selection inside a task/achievement shell | Some payout tables may draw or roll across authored outcomes | Seed from track id + completion tick |

`test_shaper`, `prevent_loss`, `clearance_gate`, and service resolution should be deterministic unless they explicitly invoke one of the seeded authored tables above.

---

## Fail-Soft Table

| Failure case | Fallback behavior |
|---|---|
| Missing `flip_table` variant id or empty table | Keep front state, emit `effect_shell` trace, mark shell invalid but do not crash |
| Progress carrier loses its bound target | Suspend progression, emit trace, surface as stalled in debug/UI |
| Filtered `content_grant` pool is empty | Fallback to no-op or a small authored consolation payout, emit trace |
| `prevent_loss` target is invalid or out of scope | No-op with trace; never redirect to arbitrary target |
| Duplicate-gain policy is unknown | Default to `refresh`, emit trace |
| Service payload chain exceeds chain limit | Stop additional payload execution, emit trace |
| Clearance gate references unsupported action | Gate never auto-fires; emit trace and keep state unchanged |

---

## UI / Visibility Phase

### Player-facing display

The first implementation slices should surface through existing UI where possible:

- [AttachmentsTab.tsx](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\components\Game\tabs\AttachmentsTab.tsx)
  - show shell badges such as `Armed`, `Revealed`, `Progress 2/5`, `Clears on Rest`
- encounter/modal surfaces
  - show reveal moments, service resolutions, and task completion prose through Chronicle/toasts/modal copy
- action or card detail surfaces
  - show `test_shaper` and rescue affordances in mechanical summaries

### Debug visibility

Add a dedicated DebugPanel sub-surface for effect lifecycle state, either:

- a new `effects` tab, or
- an `Effects` section within the existing encounters/debug views

It should show:

- active shell state
- progress tracks
- pending reveals
- triggered/consumed shapers
- clearance gate status

### Chronicle / notifications

At minimum, these state transitions should produce visible events:

- reveal/flip
- service resolved
- task completed
- bargain matured
- achievement unlocked

Narrative text shown to the player should route through `enrichProse()` when authored templates use placeholders.

---

## Wiring

### 1. Orchestrator

No new top-level phase is required for Phase 1.

Use existing seams:

- resolution-time logic in encounter and action resolution for `test_shaper` and `prevent_loss`
- acquisition/reward paths for `service` and `content_grant`
- `phaseEffectTick` for shell timers, progress, clearance, duplicate-gain escalation, and delayed reveals

If Phase 2 grows beyond the current effect tick responsibilities, add helper modules, not another top-level lifecycle phase.

### 2. UI rendering

Primary consumers:

- [GameView.tsx](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\components\Game\GameView.tsx) for visible notifications/modals
- [AgentProfileModal.tsx](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\components\Game\AgentProfileModal.tsx)
- [AttachmentsTab.tsx](C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\src\components\Game\tabs\AttachmentsTab.tsx)
- DebugPanel and its tab views

### 3. GameState flow

Prefer reusing existing fields:

- extend `effectStates`
- emit visible transitions through `recentEvents`

Avoid creating a parallel shell-state map unless `effectStates` proves structurally insufficient.

### 4. Traces

Emit from:

- resolution service integration points
- effect tick / shell runtime transitions
- service and grant resolution code

### 5. Debug visibility

Required before Phase 2 is considered complete:

- developer can inspect at least one active flip-state shell
- developer can inspect task progress movement
- developer can inspect why a clearance gate did or did not fire

### 6. Prose pipeline

Any shell that shows authored text in the UI must route through `enrichProse()` before display.

### 7. Player controls

Phase 1 requires no new global player controls.

Phase 2+ may require:

- explicit activate buttons for unstable talents
- richer spell-card detail surfaces
- task detail inspection in profile/Codex views

### 8. Prerequisite health

Upstream dependencies that must already be alive:

- attachment instantiation and possession flow
- encounter completion and reward assignment
- spell activation and cooldown runtime
- recent event / Chronicle display

Verification:

- reward attachments should appear on at least one agent within normal play or seeded tests
- at least one encounter completion should happen within 50 ticks in headless verification
- `effectStates` should already change during normal spell/effect ticking

### Throughput expectation

This system depends on upstream content flow, not just correct wiring.

- **Upstream dependency:** reward and attachment acquisition must continue producing content
- **Expected throughput:** at least 1 attachment-bearing reward or effect-bearing spell interaction within 50 ticks on a seeded run
- **Verification method:** headless encounter/reward smoke run plus targeted runtime tests

---

## Risks

### 1. Overbuilding shells before proving the primitive layer

Mitigation:

- ship Phase 1 and the first proof pack before building the full flip-state runtime

### 2. Shell state leaking into too many ad hoc maps

Mitigation:

- keep lifecycle state concentrated in `effectStates`

### 3. Content explosion without governance

Mitigation:

- Phase 5 is mandatory before large-scale authoring

### 4. Poor inspectability for hidden-state content

Mitigation:

- require traces and debug inspection from the first shell slice, not as a later polish task

---

## Recommended Execution Order

1. Implement Phase 1 primitives
2. Prove them with a small starter pack
3. Implement Phase 2 shells
4. Add progress/services/retainers
5. Author the first content library
6. Lock governance and caps before mass authoring

---

## NFP Compliance Summary

| Priority | Verdict | Notes |
|---|---|---|
| Tunability | PASS | Every cap and authored shell limit is parameterized through named constants |
| Inspectability | PASS | Traces, DebugPanel visibility, and Chronicle events are designed in from the start |
| Determinism | PASS | Randomness is limited to authored table selection and must use seeded PRNG |
| Fail-soft | PASS with note | Missing tables, targets, or grant pools degrade safely through no-op/suspend behavior plus trace emission |
| Narrative over mechanical perfection | PASS | The plan explicitly prioritizes authored texture, bargains, tasks, and reveal moments |
| Additive over destructive | PASS | Extends existing effect, attachment, and spell systems instead of replacing them |
| Performance budget | PASS with note | Reuses `effectStates`, keeps services ephemeral, and caps reveal/progress complexity with named limits |

---

## Immediate Next Move

The first implementation task should be:

**Phase 1A — Core Content Primitives**

Deliver:

- `test_shaper`
- `prevent_loss`
- `content_grant`
- `service` shell

with:

- unit tests
- trace emission
- one small authored proof pack

That slice is small enough to ship quickly, but rich enough to prove the overall architecture is worth continuing.
