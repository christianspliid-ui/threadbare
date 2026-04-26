# THR-225 — Event recipe phased activation tied to doom-clock tiers

**Status:** Design (Ready for Dev)
**Project:** Social Systems Expansion
**Author:** Cowork (autonomous scheduled session, 2026-04-23)
**Brainstorm companion:** `TheFantasyWorldSimulator/Brainstorms/2026-04-23-event-phased-activation.md`

## Context

Events authored in the Composition DSL (THR-222, shipped) are today one-shot: preconditions pass, nodes resolve, effects apply, done. The worked examples from the April 20 brainstorm (THR-219 through THR-232) proved this shape is wrong. The Chain Weakens and Winnowing of Luck events each unfold across **four doom-clock tiers**: a rumor-level mandate appears, later a plague-bringer materialises, later still a shield-anvil begins absorbing, and only at the final tier does the structure crack. The recipe seeds a subgraph and the clock keeps activating more of it over time.

THR-225 is the design that turns that pattern into first-class DSL surface.

Prerequisites already landed:
- **THR-222** — Composition DSL v0 schema + validator (`src/composition-dsl/schema.ts`)
- **THR-229** — Pacing system map (`Docs/pacing-system-map.md`) — event tempo inherits from existing pacing vocabulary; no new enum
- **THR-224** — Node-class mutability gate (`src/composition-dsl/mutationGate.ts`)
- **THR-223** — Find-card (`src/composition-dsl/findCard.ts`)
- **THR-232** — Node-type audit (`Docs/audits/node-type-audit-2026-04-20.md`)

Non-goals:
- Authoring more than one worked-example phased recipe (Chain Weakens is the canonical fixture; other recipes are separate content work).
- Supporting non-doom-clock tempos (economic ticks, season ticks, etc.). Per THR-229's closing note, those are pacing-system follow-ups.
- Introducing a new pacing vocabulary enum. We reuse `doom-clock` tiers directly.

## Three-Pillar Overview

### Engine pillar
Add a `phases: Phase[]` array to `Composition` and a runtime phase-runner that advances phases when the doom-clock tier crosses each phase's `activatesAt` predicate. The recipe validator is extended to preview phase activation against a doom-clock tier input; the runtime runner drives state changes on the live graph. Ownership is settled: **the clock drives the runner** (consistent with `phaseJourneyBeat` / `phaseMandate` which already threshold-trigger against `doomClock.progress`). Per-node activation is expressed via membership in a phase, not via a field on `NodeSpec` — this keeps `NodeSpec` focused on resolution and adds a clean orthogonal axis.

### Content pillar
Author **Chain Weakens** as the reference phased recipe (`src/composition-dsl/examples/event-chain-weakens.recipe.ts`), exercising all four phase tiers. Extend `event-winnowing-of-luck.recipe.ts` with a `phases` block retrofitting the brainstormed four-phase arc so the existing example demonstrates the feature.

### UI pillar
Surface phase state on event nodes through:
- A phase indicator (chip + tier label) on the event detail view.
- A new Chronicle entry per phase transition ("The Chain Weakens — Phase 2: Shield-Anvil Responds").
- DebugPanel inspection: active phase, next phase predicate, last activated tick.
- Story-beat promotion per phase: phases tagged `storyBeat: true` emit a queued story beat through the existing `pacingGovernor` / `StoryBeatModal` path — no new modal surface.

## Engine Design

### Recipe DSL extension

New optional field on `Composition`:

```ts
export interface PhaseEffect extends Effect {}  // reuse existing Effect union

export interface PhaseStoryBeatSpec {
  tier: 'routine' | 'notable' | 'story_beat';   // reuse attention-tier vocabulary
  template: string;                               // story-beat template id
  priority?: 'template_intrinsic' | 'doom_clock';// reuse existing StoryBeatPriority
}

export interface Phase {
  id: string;                                     // kebab-case, unique within composition
  activatesAt: WorldPredicate;                    // reuse existing predicate language
  activates: string[];                            // node keys to resolve and apply on activation
  effects?: PhaseEffect[];                        // additional effects at activation
  storyBeat?: PhaseStoryBeatSpec;                 // optional interrupt surfacing
  rationale?: string;                             // shown in debug traces
}

export interface Composition {
  // ... existing fields ...
  phases?: Phase[];                               // optional; absence = single-shot (current behavior)
}
```

Key properties of this shape:
- **Phases are optional.** Legacy one-shot recipes (factions, quests, mandates) keep working unchanged.
- **`activatesAt` is a `WorldPredicate`, not a doom-clock-only construct.** This keeps the DSL general. In v1 we only _implement_ `doom-clock` and `composition-fired` predicates in the phase runner; other predicates can be added without schema changes (see Fail-soft table below).
- **`activates: string[]`** references node keys in the composition's `nodes` map. A node may appear in multiple phases (activated once on the earliest satisfying phase — later phases treat it as already-present). Nodes not listed in any phase activate at fire-time (tier 0, backward-compatible).
- **`effects`** are a phase-scoped subset of the existing `Effect` union — same ops, re-used verbatim. (Why not inline into the composition's top-level `effects`? Because the composition's `effects` fire once when the composition fires; phase effects fire when the phase activates, which is a different tick.)
- **`storyBeat`** re-uses the existing attention-tier/pacing-governor vocabulary. Phase activation becomes a first-class emitter of queued story beats.

### Ownership: clock drives, event is passive ledger

**Settled:** the clock calls tiers on the event.

Rationale:
- `phaseDoom` already advances `doomClock.progress` each tick.
- `phaseJourneyBeat` and `phaseMandate` already pattern-match on `doomClock.progress` threshold crossings to fire journey beats and checkpoints. Adding a fourth consumer of the same progress signal is architecturally consistent.
- The alternative (event watches clock) would require each live event to subscribe to tick updates and self-evaluate, which couples event lifecycle to tick-phase ordering in a more fragile way.
- Traces are simpler: one phase-runner emits one trace category (`composition.phase_activated`) rather than N live events each emitting their own.

Phase runner lives in `src/engine/phaseComposition.ts` (new). Runs after `phaseDoom` and before `phaseAttention` in the orchestrator. Iterates live composition instances in `gameState.activeCompositions` and for each:
1. Read `composition.phases` (skip if absent).
2. For each phase not yet activated, evaluate `phase.activatesAt` against the current world snapshot.
3. If predicate passes, resolve the phase's nodes via the existing validator pipeline (same code path as fire-time node resolution, reusing `findCard.ts` + `mutationGate.ts`).
4. Apply phase effects.
5. Enqueue story beat if `phase.storyBeat` is set.
6. Emit a `composition.phase_activated` trace.

### Live composition state

New `GameState` field: `activeCompositions: ActiveComposition[]`. Populated when a composition fires; updated in place as phases activate.

```ts
export interface ActiveComposition {
  compositionId: string;                  // stable id of the recipe
  firedAtTick: number;                    // when composition-fire happened
  activatedPhaseIds: string[];            // phases already activated (ordered by activation tick)
  phaseActivationTicks: Record<string, number>; // phaseId → tick when activated
  resolvedNodes: Record<string, GraphNodeId>;   // node-key → resolved graph node id
  status: 'active' | 'completed' | 'failed';
  lastEvaluationTick: number;             // for trace correlation
}
```

**Completion.** A composition is `completed` when all phases have activated AND the composition's `effects` include `mark-composition-fired` OR when an explicit `terminalPhase: true` is set on the last phase. `failed` when a `hard`-strength phase predicate becomes permanently unsatisfiable (for example, a required node was destroyed). For v1 we track completion but do not wire cleanup — live events persist in `activeCompositions` indefinitely. Cleanup is a follow-up (tracked in Deferrals below).

### Handoff contract to ascendant AI

The ascendant's AI uses `activeCompositions` as its read surface:
- **Monitor**: the AI selects an `ActiveComposition` to observe when its highest-priority phase's `activatesAt` predicate is >=75% satisfied (heuristic: for `doom-clock` predicates, current tier / required tier >= 0.75). Details of observation-selection are an AI concern, not a DSL concern.
- **Escalate mandates**: when a phase with `storyBeat.tier === 'story_beat'` is activated on a composition the AI is observing, the AI may emit a mandate escalation via the existing `phaseMandate` path. The DSL does not prescribe *which* mandate — the AI composes that from its own planning layer reading the composition's resolved nodes.
- **Completion / failure paths**: on `status: 'completed'`, the AI's observation of this composition is cleared; on `status: 'failed'`, the AI emits a cool-failure narrative beat (reuses existing cool-failure pipeline, THR-229 precedent).

This contract is minimal by design: the DSL exposes the ledger; the AI reads it and decides what to do with the information. No AI logic is part of THR-225 scope.

### Constants

All tunable numbers named (NFP #1). New constants live in `src/data/composition-config.ts` (new file).

| Constant | Default | Purpose |
|---|---|---|
| `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK` | `16` | Cap active compositions evaluated per tick. Keeps runner cost bounded when many events are live. Excess deferred to next tick. |
| `PHASE_ACTIVATION_COOLDOWN_TICKS` | `0` | Minimum ticks between phase activations on the same composition. Default 0 = activate as soon as predicate passes. Nonzero enforces pacing. |
| `PHASE_STORY_BEAT_DEFAULT_PRIORITY` | `'doom_clock'` | Default `StoryBeatPriority` stamped on phase-emitted beats. Flips the unused enum variant from the pacing map into first-class use. |
| `COMPOSITION_FAILED_RETENTION_TICKS` | `20` | How long failed compositions persist in `activeCompositions` before being garbage-collected (NFP #4: fail-soft retention for debugging). |

### Fail-soft behaviour

| Failure | Behaviour |
|---|---|
| Phase predicate evaluation throws | Log to `trace.composition.phase_eval_failed` with phase id + error message, treat as predicate=false, continue. No crash. |
| Phase node resolution fails (required node missing) | If node tier is `essential` → mark composition `status: 'failed'`, emit `composition.failed` trace. If `flavor` → skip, emit `composition.phase_flavor_dropped`. If `atmospheric` → skip silently. |
| Phase effect fails (e.g. `advance-doom-clock` when clock already expired) | Log warning, skip effect, continue phase activation. |
| Unknown predicate op in `phase.activatesAt` | Treat as false, log `composition.unknown_predicate_op` warning, phase does not activate. |
| Composition instance references a recipe id that no longer exists in the library | Log `composition.orphaned_active` warning, transition composition to `status: 'failed'`, retain per cleanup window above. |
| `activeCompositions.length > PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK` | Round-robin through compositions across ticks; emit `composition.runner_backpressure` trace once per backpressure episode. |

### Tracing

New trace categories in `src/engine/traceBuffer.ts`:

```ts
interface CompositionPhaseActivatedTrace {
  category: 'composition';
  event: 'phase_activated';
  compositionId: string;
  phaseId: string;
  tick: number;
  activatedNodes: string[];                 // node keys
  effects: Effect[];                        // applied effects
  storyBeatQueued: boolean;
}

interface CompositionFailedTrace {
  category: 'composition';
  event: 'failed';
  compositionId: string;
  failingPhaseId?: string;
  reason: string;
}

interface CompositionPhaseEvalFailedTrace {
  category: 'composition';
  event: 'phase_eval_failed';
  compositionId: string;
  phaseId: string;
  error: string;
}
```

Existing `composition.fired` trace stays as-is.

### Determinism

Phase-runner iteration over `activeCompositions` is ordered by `compositionId` ascending (deterministic). Phase evaluation within a composition is ordered by `phase.id` ascending. No PRNG in the runner itself (node resolution retains its existing PRNG usage via `findCard`).

### Additive

The DSL schema addition is optional (`phases?:`). The runtime phase is new; no existing phase is modified. No existing composition recipe requires rework to ship THR-225.

## Content Design

### Reference recipe: Chain Weakens

New file: `src/composition-dsl/examples/event-chain-weakens.recipe.ts`.

Four phases over four doom-clock tiers. Sketch:

```ts
export const CHAIN_WEAKENS_EVENT_RECIPE: Composition = {
  id: 'the-chain-weakens',
  kind: 'event',
  preconditions: [
    { predicate: { op: 'has-agent-of-archetype', archetype: 'azath_warden', count: { gte: 1 } }, strength: 'hard' },
    { predicate: { op: 'doom-clock', comparator: 'gte', tier: 1 }, strength: 'medium' },
  ],
  nodes: {
    azath: { tier: 'essential', resolve: { type: 'find-rename-create', /* ... */ } },
    chainWarden: { tier: 'essential', resolve: { /* ... */ } },
    plagueBringer: { tier: 'essential', resolve: { /* ... */ } },
    shieldAnvil: { tier: 'essential', resolve: { /* ... */ } },
    rumorMandate: { tier: 'flavor', resolve: { /* ... */ } },
    crackedGlyph: { tier: 'atmospheric', resolve: { /* ... */ } },
  },
  phases: [
    {
      id: 'phase-1-rumor',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 1 },
      activates: ['rumorMandate'],
      storyBeat: { tier: 'notable', template: 'chronicle.rumor-mandate', priority: 'doom_clock' },
      rationale: 'Rumor-level mandate introduces the event to the ascendant at tier 1.',
    },
    {
      id: 'phase-2-plague',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 2 },
      activates: ['plagueBringer'],
      effects: [{ op: 'set-world-flag', key: 'chain-weakens.plague-materialized', value: true }],
      storyBeat: { tier: 'story_beat', template: 'story-beat.plague-bringer-materializes', priority: 'doom_clock' },
      rationale: 'Plague-bringer materializes — the event becomes concrete.',
    },
    {
      id: 'phase-3-absorbing',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 3 },
      activates: ['shieldAnvil'],
      storyBeat: { tier: 'story_beat', template: 'story-beat.shield-anvil-responds', priority: 'doom_clock' },
      rationale: 'Shield-Anvil begins absorbing; a counter-force rises.',
    },
    {
      id: 'phase-4-crack',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 4 },
      activates: ['crackedGlyph'],
      effects: [{ op: 'advance-doom-clock', by: 1 }, { op: 'mark-composition-fired', id: 'the-chain-weakens' }],
      storyBeat: { tier: 'story_beat', template: 'story-beat.azath-cracks', priority: 'doom_clock' },
      rationale: 'Azath structurally cracks — climax of the event.',
    },
  ],
  effects: [{ op: 'mark-composition-fired', id: 'the-chain-weakens' }],
  metadata: { author: 'cowork-thr-225', createdAt: '2026-04-23', tags: ['doom-event', 'saga'] },
};
```

Prose for each phase's story-beat template lives in `src/data/story-beat-templates/` following existing attention-tier content conventions. THR-225 scope ships **the recipe + placeholder prose**; prose polish to bar is a follow-up encounter-pipeline task (see Deferrals).

### Retrofit: Winnowing of Luck

Add a `phases` block to `event-winnowing-of-luck.recipe.ts` splitting its existing fire-time node activation into three phases matching the April 20 brainstorm's arc. This proves the retrofit pattern and gives a second test fixture.

### Narrative tone per phase

Each phase carries a distinct narrative tone — rumor (quiet, speculative), materialization (concrete, dread-tinged), response (a counter-force rises, conflict escalates), crack (climactic, irreversible). Prose templates written to match. This follows the Threadbare aesthetic (`prose-pipeline` skill) and is captured in the brainstorm companion.

## UI Design

### Event detail view — phase indicator

Composition nodes (kind `event`) rendered in the CMS or Agent/Location detail views get a phase chip row above the core content:

- One chip per phase, left-to-right in activation order.
- Activated phases: solid fill, sphere-tinted.
- Next-to-activate: outlined, pulsing.
- Future phases: ghosted, tier label visible (`T3`, `T4`, etc.).
- Tooltip on hover shows `phase.rationale` and `activatesAt` in human-readable form.

Reuses existing `Chip` primitive from the design system (`Docs/design-system/primitives.md`). No new component.

### Chronicle integration

Each phase activation emits a Chronicle entry (existing ChronicleRail). Format: `"{composition.title} — Phase {N}: {phase.title}"` with the phase's rationale rendered as flavor prose. Sphere badge derived from `composition.metadata.tags` (doom events are sphere-tagged).

This uses the dual-voice Chronicle surface that shipped via THR-155 — phases can optionally carry a `voice: 'divine' | 'mortal'` hint on the story-beat template, falling back to `divine` for doom events.

### Story-beat modal

No new modal. Phases with `storyBeat.tier === 'story_beat'` route through the existing `pacingGovernor` → `pacingActiveStoryBeat` → `StoryBeatModal` path (see pacing-system-map.md §1). The only behavioral change is that these beats will carry `priority: 'doom_clock'` — a currently-unused enum variant that now becomes live.

### DebugPanel inspection

New `CompositionView` tab in DebugPanel (wire under the existing composition debug tooling or extend `ActiveCompositionsView`). Shows:
- List of all live compositions with status.
- Per composition: phase activation ticks, activated node keys, last evaluation tick, pending phase + its `activatesAt` predicate rendered in human-readable form.
- Pending-phase diagnostic: "waiting on doom-clock tier 3 (currently tier 2, ~40 ticks away at current modifier)".

Reuses existing `DebugPanel` sub-component patterns — no new primitives.

### Hex map signifiers

**N/A for v1.** Phased events don't themselves place map signifiers — their _resolved nodes_ do (locations, factions, agents each have their own signifier pathways through existing systems). When a phase activates a new location via `find-rename-create`, the location's own signifier pipeline handles visibility; nothing phase-specific needs to be drawn on HexMapV2.

Explicitly marked N/A (per design governance): the UI pillar is satisfied by chips + Chronicle + DebugPanel + story-beat surfacing; hex-map hooks are not needed because phase activation's geographic footprint is delegated to the nodes it activates, which already have geographic presence.

### Player controls

No new player-facing control in THR-225. Players do not trigger phase activation — the clock does. Players observe phases through Chronicle and (for story-beat phases) the StoryBeatModal, where they make the existing story-beat decisions. Divine interventions that could shift doom-clock tiers (already shipped) indirectly control phase pacing; no new divine action is introduced.

## Wiring Checklist

Reference: `Docs/plans/wiring-checklist.md`

| Surface | Wiring |
|---|---|
| **Orchestrator phase** | `phaseComposition` added after `phaseDoom`, before `phaseAttention`, in the main tick loop. |
| **GameState field** | `activeCompositions: ActiveComposition[]` added; initialized empty at game start. |
| **UI component** | Event detail view renders phase-chip row. ChronicleRail consumes `composition.phase_activated` traces. DebugPanel adds `CompositionView` tab. |
| **GameState flow** | Composition fire writes new `ActiveComposition`; runner mutates `activatedPhaseIds` + `phaseActivationTicks` + `resolvedNodes`. |
| **Traces** | Three new trace types registered: `composition.phase_activated`, `composition.failed`, `composition.phase_eval_failed`. |
| **Debug visibility** | `CompositionView` in DebugPanel. `window.__DEBUG.getActiveCompositions()` debug bridge function. |
| **Prose pipeline** | Phase story-beat templates author through the existing story-beat template registry. Chronicle entries flow through the existing enrichProse path (sphere tint, divine/mortal voice). |
| **Player controls** | None. Phases are clock-driven. |

## NFP Compliance

| NFP | Compliance | Notes |
|---|---|---|
| 1. Tunability | PASS | All numeric constants named in `composition-config.ts` (`PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK`, etc.). Phase tiers reuse existing doom-clock vocabulary. |
| 2. Inspectability | PASS | Three new trace types. DebugPanel `CompositionView` surfaces pending predicate state. Debug bridge. |
| 3. Determinism | PASS | Iteration order stable (id-sorted). No new PRNG in runner. Node resolution inherits existing deterministic behavior. |
| 4. Fail-soft | PASS | Full fail-soft table above. Predicate evaluation errors, missing nodes, orphaned compositions, runner backpressure — all defined. |
| 5. Narrative over mechanical perfection | PASS | Phase story beats carry tone (rumor → materialization → response → crack). Chronicle entries per phase. Mechanics serve the four-beat narrative structure the brainstorm discovered. |
| 6. Additive over destructive | PASS | `phases?` is optional; legacy recipes unchanged. New orchestrator phase; no existing phase modified. New GameState field; no existing field reshaped. |
| 7. Performance budget | PASS with note | Per-tick runner cost is O(activeCompositions × phases-not-yet-activated × predicate-eval-cost). Capped by `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK`. Doom-clock-predicate evaluation is O(1). Expected operating range: 10–50 live compositions, 4–8 phases each, trivial. Re-profile if ever exceeding 200 live compositions. |

## Acceptance Criteria

- [ ] `phases?: Phase[]` field added to `Composition` schema + Zod validator (`src/composition-dsl/schema.ts`).
- [ ] Ownership question resolved in doc and implementation: **clock drives runner** (confirmed in § Engine Design).
- [ ] Per-node activation syntax: nodes referenced by key in `phase.activates`; unlisted nodes fire-time-activated (confirmed).
- [ ] Phase-runner module (`src/engine/phaseComposition.ts`) added to tick loop after `phaseDoom`, before `phaseAttention`.
- [ ] `activeCompositions: ActiveComposition[]` in `GameState`, populated at composition-fire, mutated by runner.
- [ ] Three new trace types registered and emitted.
- [ ] `CompositionView` DebugPanel tab functional.
- [ ] `window.__DEBUG.getActiveCompositions()` exposed in dev builds.
- [ ] Chain Weakens recipe (`event-chain-weakens.recipe.ts`) validates clean and activates all four phases across synthetic doom-clock ticks.
- [ ] Winnowing of Luck retrofit with `phases` block validates clean.
- [ ] Handoff contract documented in `ActiveComposition`'s type comment referencing this plan doc.
- [ ] Pacing vocabulary: phases **do not** introduce a novel enum; doom-clock tier is the only activation predicate implemented in the runner for v1 (others valid at schema level, deferred in runner).
- [ ] All NFP compliance items PASS (or PASS with note as called out).
- [ ] Unit tests: phase runner activates in order, fails soft on missing nodes, respects `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK`, emits traces.
- [ ] Integration test: CLI (`npm run cli -- --seed 42 --map medium`) runs 100 ticks with Chain Weakens active; all four phases activate in correct tier order; `events` shows phase transitions.

## Deferrals

Tracked as follow-up Linear issues under Social Systems Expansion (filed at handoff time):

1. **Phase-runner cleanup of completed/failed compositions.** v1 retains indefinitely (with `COMPOSITION_FAILED_RETENTION_TICKS` sketch). A proper garbage-collection pass is follow-up work. Label: `Deferral`.
2. **Non-doom-clock predicates in the runner.** The schema accepts any `WorldPredicate` as `activatesAt`; the runner in v1 only evaluates `doom-clock` and `composition-fired`. Adding `world-flag`, `edge-exists`, etc. is straightforward (the validator already handles them) — defer until a recipe demands it. Label: `Deferral`.
3. **Prose polish for Chain Weakens story-beat templates.** Ship placeholder prose in THR-225; schedule a content-pipeline pass (via `encounter-pipeline` or `prose-content-systems`) to bring prose to quality bar. Label: `Content`.
4. **Chronicle dual-voice authoring for phased events.** Phases may support `voice: 'divine' | 'mortal'` per THR-155; current proposal defaults to `divine`. A dual-voice pass for Chain Weakens is follow-up. Label: `Content`.

Every deferral above must be filed as a Linear issue with `// TODO(THR-XXX): <reason>` in the corresponding source line, per Definition of Done.

## Load-Bearing Decisions

- **Phases are an orthogonal array on `Composition`, not a field on `NodeSpec`.** Keeps `NodeSpec` focused on resolution. Multi-phase node membership is expressed through the `phase.activates` array.
- **Clock drives event, not event watches clock.** Consistent with `phaseJourneyBeat`/`phaseMandate`.
- **Doom-clock tier is the only _runtime_-implemented `activatesAt` predicate in v1.** Schema accepts any predicate; runner evaluates a whitelist. Extending the whitelist is additive.
- **No novel pacing enum.** Events declare pacing through the existing doom-clock tier vocabulary. THR-229's decision upheld.
- **Story beats re-use existing pacingGovernor path.** No new modal, no new queue; phases just produce new priority=`doom_clock` entries that flow through the shipped infrastructure.

## Rejected Approaches

- ❌ Add `activatesAt: WorldPredicate` as a field on `NodeSpec`. Rejected because a node may belong to multiple phases (atmospheric node appearing in phase 1 and phase 3, for example). Expressing phase membership on the node field doesn't compose cleanly. The array-on-composition shape is cleaner.
- ❌ Event watches clock. Rejected for architectural consistency reasons above.
- ❌ Introduce `pacing: 'cosmic-slow' | 'standard' | 'fast'` enum on composition. Rejected per THR-229's ruling.
- ❌ Phase runner iterates only on doom-clock-tier-change ticks (optimization). Rejected because some phases may have non-doom predicates, and uniform per-tick evaluation keeps the runner simple and correct. Cost is bounded by the runner cap.
- ❌ Embed story-beat prose inline in the recipe. Rejected — prose lives in the story-beat template registry; recipes reference templates by id. This keeps the recipe structural (per THR-222's "structure-only recipes" decision) and lets content authors iterate prose without touching recipes.

## Vision Audit

No Vision premise contradicted. This design strengthens the **"content is design"** principle (game-design-direction §6): phase structure IS the narrative shape of doom events. The four-phase arc (rumor → materialization → response → crack) is not a mechanical artifact — it's the dramatic pattern the brainstorm revealed as the authored content's natural grain. Codifying it in the DSL makes every future doom event cheaper to author in that shape.

The design also reinforces **"turn-based pacing"** (§4): players see the event arrive in pieces across doom-clock ticks rather than all at once. Each phase activation is a turn-worthy moment.

## Sources

- [THR-225](https://linear.app/threadbare/issue/THR-225/event-recipe-phased-activation-tied-to-doom-clock-tiers) — this issue
- [THR-222](https://linear.app/threadbare/issue/THR-222) — Composition DSL v0 (shipped)
- [THR-229](https://linear.app/threadbare/issue/THR-229) — Pacing integration (shipped)
- [THR-219](https://linear.app/threadbare/issue/THR-219) — source brainstorm
- `Docs/plans/2026-04-20-thr-222-composition-dsl.md` — DSL grammar
- `Docs/pacing-system-map.md` — pacing integration target
- `src/composition-dsl/schema.ts` — existing schema
- `src/engine/doomClock.ts` — clock state machine
- `TheFantasyWorldSimulator/Brainstorms/2026-04-23-event-phased-activation.md` — companion
