# Encounter Event Nodes → Causation Wiring (THR-143)

**Date:** 2026-04-18
**Status:** Design complete, ready for dev
**Issue:** THR-143 — Wire encounter history event nodes so `caused_by` edges can land
**Predecessors:** TB-077 (encounter event nodes, shipped), THR-116 (causation edges, incomplete in v1)

## Problem

`caused_by` edges between encounter events never actually land in the graph. The v1 implementation in `src/engine/encounterSeeding.ts` (lines 73–118 and 150–190) tries to create them between strings that are not graph nodes:

- `causedBySourceId = seed.sourceEncounterId` — set in `encounterAftermath.ts:561` to `action.templateId` (a **template** ID string like `enc.gate_duty`, not a node in the graph).
- `causedByNewId = action.actionId` — the new `UnifiedAction.actionId` (e.g. `ua_42`, not a node).
- Family-path source: `familyEventId = ${seed.seedId}_family_ready` — a synthetic string with no matching node.

Every call hits `addEdge`'s "endpoint is not a graph node" guard and silently falls through to the `causation_edge_creation_skipped` trace. The comment block at `encounterSeeding.ts:73–78` documents the gap and points at this issue.

The machinery that **could** connect them already exists: TB-077's `createEncounterEventNode` (`src/engine/encounterEventNode.ts`) produces real `event` nodes with IDs shaped `evt_${actorId}_${tick}_${stepIndex}` and is called from `orchestrator.ts:806` — but the return value is discarded. Nothing carries the event node ID forward into aftermath reactions, so seeds remember the template, not the event.

This is pure engine plumbing. No content or gameplay changes. The plumbing, once in place, gives every downstream tool (prose enrichment, agent biography, chronicle threads) a real causal spine instead of a pile of skipped-trace warnings.

## Three-Pillar Scope

- **Engine** — propagate event node IDs through the action lifecycle and create the `caused_by` edge at the right moment. Primary pillar.
- **Content** — N/A. No encounter author, no prose table, no template change. All existing seeds keep working; they simply start producing valid causation edges when the upstream encounter resolved and got an event node.
- **UI** — small: debug panel should let a developer pivot from a trace line to the event node chain, and the encounter event overlay (dev-only) should indicate causation arrows. No player-facing UI.

## Engine Design

### Data model additions

Three new optional fields, all additive, all opt-in. No existing data migration required.

**`UnifiedAction` (`src/types/unifiedAction.ts`)**

```ts
export interface UnifiedAction {
  // ...existing fields...

  /**
   * Graph event node ID created for this action's most recent resolved step.
   * Set by the orchestrator right after createEncounterEventNode returns.
   * Overwritten on each step resolution — always points at the latest event.
   * Undefined before first step resolves.
   */
  readonly eventNodeId?: string;

  /**
   * Pending causation marker: when this action was spawned from a PendingEncounterSeed
   * with a valid sourceEventNodeId, we record it here. The orchestrator reads this
   * field when the action's first event node is created and emits the caused_by edge.
   */
  readonly pendingCausationSourceEventId?: string;
}
```

**`PendingEncounterSeed` (`src/types/unifiedAction.ts:406`)**

```ts
export interface PendingEncounterSeed {
  // ...existing fields...

  /**
   * The graph event node that spawned this seed (via aftermath reaction).
   * Populated when the originating UnifiedAction had an eventNodeId at the
   * time its aftermath ran. Undefined when the originating action had no
   * event node yet (e.g. system-spawned actions, or future pathways that
   * create seeds outside the normal encounter flow).
   *
   * This is the TARGET of the future caused_by edge.
   */
  readonly sourceEventNodeId?: string;
}
```

`sourceEncounterId` stays untouched — it continues to carry the template ID string for logging, trace context, hidden marks, intelligence records, artifact spawns, omens, and faction mutations. Only the causation edge needed a real node reference.

### Pipeline changes

**Step 1 — Capture event node ID in the orchestrator.**
`src/engine/orchestrator.ts:806` currently discards the return value. Change:

```ts
// before
createEncounterEventNode({ graph, progress, template, stepIndex, ... });

// after
const eventNodeId = createEncounterEventNode({ graph, progress, template, stepIndex, ... });
```

The orchestrator already holds the `UnifiedAction` whose step just resolved. Set `action.eventNodeId = eventNodeId` via the same functional-update pattern used elsewhere in the resolve block (build a new action with the field set, splice it back into `state.unifiedActions`). Only update when `eventNodeId` is truthy — fail-soft if event node creation failed.

**Step 2 — Emit pending `caused_by` edge if this action was seed-spawned.**
Still in the orchestrator, in the same block, *after* the new `eventNodeId` is known: if `action.pendingCausationSourceEventId` is set AND `eventNodeId` is set, call:

```ts
if (action.pendingCausationSourceEventId && eventNodeId) {
  try {
    state.graph.addEdge({
      id: `caused_by_${eventNodeId}_${action.pendingCausationSourceEventId}`,
      source: eventNodeId,                            // new event
      target: action.pendingCausationSourceEventId,   // prior event
      type: 'caused_by',
      properties: {
        seedId: action.spawnedFromSeedId,   // see note below
        seedLabel: action.spawnedFromSeedLabel,
        firedTick: state.tick,
      },
    });
    touchWorld(runtime);
    emitTrace({ category: 'causation_edge_created', ... });
  } catch {
    emitTrace({ category: 'causation_edge_creation_skipped', reason: 'orchestrator_add_failed', ... });
  }

  // Clear the pending marker — causation only lands on the first resolved step.
  action = { ...action, pendingCausationSourceEventId: undefined };
}
```

To preserve `seedId`/`seedLabel` on the edge, add two more additive, optional fields to `UnifiedAction`: `spawnedFromSeedId?` and `spawnedFromSeedLabel?`. They're written by `encounterSeeding.ts` at spawn time (see Step 3), read here, and never touched again. Total new fields on `UnifiedAction`: four, all optional.

**Step 3 — Thread seed → spawned action.**
In `src/engine/encounterSeeding.ts:61–70`, when `createUnifiedAction` succeeds from a seed with a template, set the new fields on the action:

```ts
const action = createUnifiedAction({ ... });
const actionWithCausation = {
  ...action,
  pendingCausationSourceEventId: seed.sourceEventNodeId,
  spawnedFromSeedId: seed.seedId,
  spawnedFromSeedLabel: seed.seedLabel,
};
nextActions = [...nextActions, actionWithCausation];
```

Remove the broken `try { state.graph.addEdge(...) }` block at lines 82–117. The edge creation has moved to the orchestrator where it can fire with real event node IDs. Keep the surrounding trace emissions (`encounter_seed_triggered`); drop the `causation_edge_created` / `causation_edge_creation_skipped` traces from the seeding module — they now live in the orchestrator.

**Step 4 — Populate `sourceEventNodeId` on newly-planted seeds.**
In `src/engine/encounterAftermath.ts:558`:

```ts
case 'encounter_seed': {
  const seed: PendingEncounterSeed = {
    seedId: `seed_${actionId}_${reaction.id}_${i}`,
    sourceEncounterId: encounterId,
    sourceReactionId: reaction.id,
    // NEW: carry the real event node ID forward if the originating action has one
    sourceEventNodeId: action?.eventNodeId,
    // ...rest unchanged
  };
}
```

`action?.eventNodeId` will be set when the aftermath is applied in-flow (the orchestrator updates the action right before the aftermath reaction runs). It will be undefined for edge-case pathways where aftermath runs without a preceding event node (system-spawned artifacts, reactive reactions in tests). That's a fail-soft outcome: no event node → no `sourceEventNodeId` → no causation edge → `causation_edge_creation_skipped` trace with `reason: 'no_source_event_node'`. Preserving the template ID in `sourceEncounterId` keeps all downstream logging sane.

**Step 5 — Family-only path stays advisory.**
In `encounterSeeding.ts` lines 150–214 (family fire without templateId), remove the broken edge creation. Replace the whole `if (seed.sourceEncounterId && familyEventId) { ... }` block with a single trace:

```ts
emitTrace({
  tick, category: 'causation_edge_creation_skipped',
  sourceEventId: familyEventId,
  causedByEventId: seed.sourceEventNodeId,
  seedId: seed.seedId,
  reason: 'family_only_no_target_event',
  summary: `Causation edge skipped (family): no new event node, family fire is advisory narrative for v1`,
});
```

Family-only fires emit narrative events without spawning a unified action. There is no new event node to be the source of a `caused_by` edge. In v1, we accept this as intentional — family fires are advisory signals for the dynamic director, not promoted encounters. Document this in the narrative event prose so the user sees it as "consequences stirring," not a missing causation link. A future THR-??? can revisit once the family router actually spawns templates.

**Step 6 — Edge schema cleanup.**
`src/types/edgeSchema.ts:285–296`: update the comment above the `caused_by` entry. Replace:

```
// NOTE: In v1, caused_by edge creation often fails silently because action IDs are not
// graph nodes. Full implementation requires event-node creation during encounter resolution.
// TODO(THR-???): wire encounter history event nodes so caused_by edges can be created reliably.
```

with:

```
// THR-143: caused_by edges connect encounter event nodes created by TB-077.
// Source/target are both `event` nodes (evt_${actorId}_${tick}_${stepIndex}).
// Orchestrator creates the edge when a seed-spawned action resolves its first step.
// Family-only fires are advisory and do NOT produce caused_by edges (v1 scope).
```

### Constants

No new tunable constants. The orchestrator uses existing `ENCOUNTER_EVENT_ENABLED` from `encounterEventNode.ts` — if event nodes are disabled, no causation edges land, which is the correct invariant.

| Constant | File | Value | Purpose |
|---|---|---|---|
| `ENCOUNTER_EVENT_ENABLED` | `encounterEventNode.ts` | `true` | Feature flag — also gates causation edges transitively |

### Trace types

Trace categories already exist; this issue moves where they're emitted and adds richer properties. No new TypeScript interfaces.

```ts
// causation_edge_created — emitted from orchestrator.ts after edge lands
interface CausationEdgeCreatedTrace {
  tick: number;
  category: 'causation_edge_created';
  sourceEventId: string;        // new event node
  causedByEventId: string;      // prior event node
  seedId: string;
  seedLabel: string;
  ticksBetween: number;         // firedTick - plantedTick
  summary: string;
}

// causation_edge_creation_skipped — emitted when edge cannot land
interface CausationEdgeSkippedTrace {
  tick: number;
  category: 'causation_edge_creation_skipped';
  sourceEventId?: string;
  causedByEventId?: string;
  seedId?: string;
  reason:
    | 'no_source_event_node'           // seed had no sourceEventNodeId
    | 'no_new_event_node'              // spawned action's step didn't produce an event node
    | 'family_only_no_target_event'    // family path — no action spawned, no new event
    | 'orchestrator_add_failed';       // addEdge threw
  summary: string;
}
```

### Fail-soft table

Everything is additive and guarded. No throw path in normal operation.

| Failure case | Fallback | Trace emitted |
|---|---|---|
| Event node creation fails in orchestrator (throws inside `createEncounterEventNode`) | Action gets no `eventNodeId`, no causation edge, encounter resolution unaffected | `encounter_event_node_creation_failed` (existing trace from `encounterEventNode.ts`) |
| Seed has no `sourceEventNodeId` (originating action had no event node) | No edge attempted; seed still spawns its action normally | `causation_edge_creation_skipped` with `reason: 'no_source_event_node'` |
| Seed-spawned action's first step produces no event node | No edge attempted; action resolves normally | `causation_edge_creation_skipped` with `reason: 'no_new_event_node'` |
| `addEdge` throws in orchestrator (e.g. endpoint node deleted by concurrent phase) | Caught; action continues; pending marker cleared so we don't retry | `causation_edge_creation_skipped` with `reason: 'orchestrator_add_failed'` |
| Family fire without templateId | Advisory narrative event only — no edge, no action | `causation_edge_creation_skipped` with `reason: 'family_only_no_target_event'` |
| `ENCOUNTER_EVENT_ENABLED = false` | No event nodes created upstream, so no causation edges either — the whole system is gated consistently | N/A (event node creation trace not emitted) |

## Content Design

N/A. This issue is pure infrastructure. No encounter template changes, no prose table edits, no attachment authoring. The work unblocks future content that wants to reference prior events (prose pipeline resolvers can walk `caused_by` edges), but that consumption is deferred.

## UI Design

### Debug panel — causation inspection

Minimal, dev-only. Two small additions to the Debug Panel's Trace tab:

1. **Clickable trace rows for `causation_edge_created` / `causation_edge_creation_skipped`**: when the row's `sourceEventId` or `causedByEventId` is present, render it as a clickable chip that scrolls to the matching event node in the Graph tab. Today these trace rows exist but their IDs are inert strings.

2. **Causation column in the encounter history view** (if/when the Debug Panel's Encounters tab exists — otherwise deferred to whenever that tab is added). Per-row indicator: "spawned from: evt_xxx" when the event has an incoming `caused_by` edge, clickable to jump to the parent event.

### Player-facing UI

None. Causation edges are author/tooling infrastructure in v1. The player already sees the narrative consequences through the existing "planted thread / bears fruit" tick events. That prose is unchanged.

### Visual presence (HexMapV2)

None in v1. A possible future extension: render a faint arc between the hexes where linked events occurred when the developer hovers a chronicle item. Not in scope.

## Wiring

Checklist-driven per `Docs/plans/wiring-checklist.md`:

| Surface | Wired? | Where |
|---|---|---|
| Orchestrator phase | ✅ existing | `orchestrator.ts:802–817` — `createEncounterEventNode` call block. This issue captures the return and adds the edge emission here. |
| GameState field | ✅ additive | `UnifiedAction.eventNodeId`, `UnifiedAction.pendingCausationSourceEventId`, `UnifiedAction.spawnedFromSeedId`, `UnifiedAction.spawnedFromSeedLabel`, `PendingEncounterSeed.sourceEventNodeId` |
| Trace category | ✅ existing two, refined | `causation_edge_created`, `causation_edge_creation_skipped` — emitted from orchestrator, no longer from seeding module |
| Debug panel visibility | 🟡 small add | Clickable event node IDs in the Trace tab when trace rows carry them |
| UI component | N/A | No player-facing UI |
| Modal rendered in GameView JSX | N/A | No modal |
| Player controls | N/A | No control |
| Prose pipeline (`enrichProse()`?) | N/A today, unblocked for later | Once edges land, resolvers can walk `caused_by` for prose callbacks — separate issue |

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | Single existing feature flag `ENCOUNTER_EVENT_ENABLED` gates the whole chain |
| #2 Inspectability | PASS | Every create/skip path emits a trace with a `reason`; debug panel adds clickable pivot to event nodes |
| #3 Determinism | PASS | Edge ID is deterministic from event node IDs; orchestrator is already deterministic |
| #4 Fail-soft | PASS | Every step wrapped in try/catch or guarded by truthy checks; failure emits a reason trace and continues |
| #5 Narrative over mechanics | PASS with note | Family-only fires stay advisory — the narrative prose already communicates "consequences stirring" to the player |
| #6 Additive over destructive | PASS | Four new optional fields on `UnifiedAction`, one new optional field on `PendingEncounterSeed`. The only deletion is the broken try/catch block in `encounterSeeding.ts` that never produced edges anyway |
| #7 Performance budget | PASS | At most one `addEdge` per resolved step; the existing encounter event node creation is already the bottleneck if any |

## Load-Bearing Decisions

- **Event node ID rides on the UnifiedAction, not on EncounterProgress.** EncounterProgress is per-step ephemeral state; the action persists across steps and is what aftermath reactions already see. Adding the field here avoids a second propagation channel.
- **Causation edge is emitted in the orchestrator, not in the seeding module.** The edge needs both event node IDs, and only the orchestrator has both at the same moment (prior event via `pendingCausationSourceEventId`, new event via `createEncounterEventNode` return). Emitting from seeding was the original design's mistake — seeds don't have event nodes yet.
- **Pending marker is cleared after first use.** An action can resolve many steps and get many event nodes; causation only binds to the first resolved step. Leaving the marker set would produce N copies of the same edge with different sources.
- **Family fires stay advisory in v1.** Promoting family fires to real actions is a bigger design question about the dynamic director; tracked separately. In v1 family fires emit narrative events only, and `caused_by` is correctly gated to unified-action seeds.

## Rejected Approaches

- ❌ Store event node IDs in a parallel `Map<actionId, eventNodeId>` on GameState — duplicates information already implicit in the action, and wouldn't survive action resolution cleanup without bespoke lifecycle management.
- ❌ Make `createEncounterEventNode` also emit the `caused_by` edge by passing it the prior event ID — conflates the event-creation responsibility with the causation responsibility and forces every call site to thread seed provenance through.
- ❌ Retrofit `sourceEncounterId` to hold event node IDs — would silently break hidden marks, intelligence records, artifact spawns, omens, and faction mutations that use the template string as a stable key. Additive field is safer.
- ❌ Wait for a bigger rewrite of encounter state to graph nodes — TB-077 already landed event nodes; this is the follow-through. Further consolidation can happen later without blocking.

## Implementation Notes for Dev

Files touched:

1. `src/types/unifiedAction.ts` — add four optional fields to `UnifiedAction` and `sourceEventNodeId` to `PendingEncounterSeed`.
2. `src/engine/orchestrator.ts` — capture `createEncounterEventNode` return (~line 806), update the action in `state.unifiedActions`, emit `caused_by` edge when `pendingCausationSourceEventId` is set, clear the marker.
3. `src/engine/encounterAftermath.ts` — add `sourceEventNodeId: action?.eventNodeId` to the seed object (~line 558).
4. `src/engine/encounterSeeding.ts` — set `pendingCausationSourceEventId`, `spawnedFromSeedId`, `spawnedFromSeedLabel` on the spawned action (~line 61). Remove the broken try/catch blocks in both the template and family paths. Replace the family-path edge attempt with a single `causation_edge_creation_skipped` trace.
5. `src/types/edgeSchema.ts` — update the comment above `caused_by` entry (lines 285–296).

Tests to add:

- Unit: seed planted with event node A → new action resolves first step and gets event node B → graph contains `caused_by(B → A)` edge with correct `seedId`, `seedLabel`, `firedTick` properties.
- Unit: seed planted without event node → action spawns, resolves → no `caused_by` edge, trace has `reason: 'no_source_event_node'`.
- Unit: family-only seed fires → no action spawned, no edge, trace has `reason: 'family_only_no_target_event'`.
- Unit: action resolves second step → no duplicate `caused_by` edge (pending marker was cleared after first step).

Pre-existing TB-077 tests for `createEncounterEventNode` should still pass unchanged — this issue only adds to what the orchestrator does with the return value.

## Model & Parallelism

- **Suggested model:** sonnet — contained plumbing, five files, clear test cases.
- **Parallel-safe with:** THR-133 (does not touch encounter resolution, seeding, or aftermath paths).
- **Mutex with:** none.
- **Codex review:** yes — this issue wires a causal primitive that many future prose/UI features will read from. A second pass before landing is cheap insurance.
