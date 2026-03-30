# CRUD Action Unification — Design Decision

## Context

The original CRUD action framework (designed 2026-03-03) envisioned a unified system where all actors interact through Create/Read/Update/Delete operations on the world graph, mediated by the Nine Reaches. Over 8 weeks of implementation, the *selection end* and *world model end* of this bridge were built, but the *execution core* was never connected. Three parallel systems evolved to fill the gap:

1. **Encounters** — 64 templates with linear step sequences, threat-based filtering, and their own progress tracking (`EncounterProgress`)
2. **Intervention Effects** — Player-initiated graph mutations with decay curves and divine influence overlays
3. **Agendas** — Action-biasing mechanism with decay curves and value drift

Each does part of what the CRUD system would do, but they're separate codepaths with separate types, separate orchestrator phases, and no shared execution model.

## Decision: Three Connective Pieces

Rather than building the full 48-action execution pipeline from scratch, we unify existing systems with three targeted connective pieces that bridge the selection pipeline to graph outcomes.

### Piece 1: GraphOp Executor

A small, tested module that applies typed graph operations to the world graph. This formalizes the ad-hoc mutation patterns already used in `interventionEffects.ts` and `encounter.ts`.

**Interface:**
```typescript
// Maps directly from the existing GraphMutation in types/graph.ts
type GraphOpType = 'add_node' | 'remove_node' | 'update_node' | 'add_edge' | 'remove_edge' | 'update_edge';

interface GraphOp {
  op: GraphOpType;
  nodeType?: NodeType;       // for add_node
  edgeType?: EdgeType;       // for add_edge
  targetRef?: string;        // symbolic ref resolved at execution time ('$actor', '$target', '$location')
  properties?: Record<string, unknown>;
  // For update operations
  nodeId?: string;
  edgeId?: string;
  changes?: Record<string, unknown>;
}

interface GraphOpResult {
  op: GraphOp;
  success: boolean;
  createdId?: string;        // for add operations
  error?: string;            // for failures (fail-soft)
}
```

**Key design choices:**
- Symbolic references (`$actor`, `$target`, `$location`) resolved at execution time — templates stay generic
- Fail-soft: individual op failures don't crash the batch; each op returns success/error
- Traces emitted per batch via `emitTrace()` for inspectability
- Reuses existing `GraphMutation` type from `types/graph.ts` as conceptual parent

### Piece 2: Template Enrichment

Grow the 36 skeletal world-model.json action templates (currently only `reach` + `crudType`) into full `ActionTemplateData` records in a content package following the established pattern.

**Enriched interface:**
```typescript
interface ActionTemplateData {
  id: string;                          // e.g. 'action.iron.raise-force'
  name: string;                        // e.g. 'Raise Force'
  crudType: 'create' | 'read' | 'update' | 'delete';
  reach: ReachDomain;

  // Duration model
  durationRange: { min: number; max: number };  // ticks

  // Motivation mapping (like ENCOUNTER_TYPE_MOTIVATIONS)
  motivations: ValuePair[];

  // Graph outcomes
  onSuccess: GraphOp[];
  onFailure: GraphOp[];
  onCritical?: GraphOp[];              // optional critical success/failure variants

  // Resolution parameters
  difficulty: number;                  // base difficulty (0-1 scale, feeds into resolution)

  // Narrative
  narrativeTemplates: {
    initiation: string;                // "{{actor}} begins to {{verb}} at {{location}}"
    success: string;
    failure: string;
    critical?: string;
  };

  // Filtering
  locationSubtypes?: string[];         // which sublocations this can spawn at (empty = any)
  actorAffinities?: ActorType[];       // which actor types prefer this (empty = any)
  sphereAffinity?: SphereName;         // optional sphere link for filtering/theming
}
```

**Key design choices:**
- Lives in `src/data/action-template-content.ts` following established content package pattern
- 36 templates enriched (4 per reach × 9 reaches) — no expansion to 48
- Motivation mapping reuses the same `ValuePair[]` mechanism as encounters
- Graph outcomes use `GraphOp[]` arrays, not ad-hoc code
- `locationSubtypes` filtering parallels encounter's `locationTypes` field

### Piece 3: ActionInProgress Lifecycle

Activate the orphaned `ActionInProgress` type in `temporal.ts`. Agents without active actions run the selection pipeline, instantiate an `ActionInProgress`, progress each tick, and resolve on completion.

**Extended interface:**
```typescript
interface ActionInProgress {
  actionId: string;           // unique instance ID
  actorId: string;
  templateId: string;         // action template ID (e.g. 'action.iron.raise-force')
  targetId: string;
  domain: string;             // which Reach domain
  startTick: number;
  duration: number;           // total ticks
  progress: number;           // 0 to duration

  // New fields
  encounterId?: string;       // if this action spawned/is part of an encounter
  resolved?: boolean;         // true once resolution has run
  outcome?: OutcomeType;      // from resolution system
}
```

**Orchestrator integration:**
- `phaseAgentActions` becomes: for each idle agent → generate candidates (CRUD actions + encounters) → run selection pipeline → instantiate ActionInProgress
- New `phaseActionProgress` tick phase: for each active ActionInProgress → increment progress → if complete, resolve via resolution system → apply GraphOps from template outcome → emit events
- `phaseEncounterProgression` handles the *dramatic sub-path*: encounters are still encounters, but they're initiated via ActionInProgress when the selected template has encounter-type steps

**Key design choices:**
- No AP economy — spotlight tier already handles attention budgets architecturally
- `performing` edge type already exists in `graph.ts` — used to track active actions
- Encounters become a subtype: when an ActionInProgress's template has `encounterSteps`, the encounter system handles step-by-step resolution instead of the simple single-roll resolution

## Subsumption Plan

How existing systems fold into the unified model:

| System | Current Role | Unified Role |
|--------|-------------|-------------|
| **Encounters** | Parallel action-like system (64 templates, linear steps) | "Dramatic resolution" path — encounters are multi-step actions with their own resolution per step. Selected through the same candidate pipeline. |
| **Agendas** | Action-biasing mechanism with decay | Unchanged — agendas bias the selection pipeline's value overlay, which now feeds into CRUD action selection too |
| **Intervention Effects** | Player graph mutations | Player's direct CRUD actions — `applyInterventionEffects` becomes a caller of the GraphOp executor |
| **Disposition** | Game-theory scoring modifier | Unchanged — disposition modifier already runs in selection pipeline, now applies to CRUD action candidates too |
| **Divine Influence** | Value drift overlay | Unchanged — `buildValueOverlay` already modulates selection, now affects CRUD action preference |

## What We Deliberately Leave Out

- **Full AP economy**: The spotlight tier system already handles attention allocation. Adding per-agent action points would create a parallel resource system with unclear benefit.
- **Expanding to 48 actions**: 36 templates (4 per reach) is sufficient coverage. The original 48 included some redundant entries.
- **Actor-type-specific action sets**: All actors use the same templates; actor type influences selection probability via axiological profiles and trait biases, not hard exclusions.
- **Contested action resolution**: `resolveContestedAction` exists but is unused. We'll activate it later when PvP encounters need it — not in this sprint.

## Implementation Sequence

Five phases, each independently testable:

1. **GraphOp Executor** (~150 lines) — Pure function, no dependencies on orchestrator. Test with mock graphs.
2. **Template Enrichment** (~600 lines content) — Data package, no engine changes. Test with structural validation.
3. **Action Candidate Generator** (~100 lines) — Mirrors `encounterCandidates.ts` pattern. Generates `ActionCandidate[]` from enriched templates.
4. **ActionInProgress Lifecycle** (~250 lines) — Orchestrator changes. Unifies phaseAgentActions to use both CRUD + encounter candidates.
5. **Encounter Subsumption** (~100 lines) — Encounters initiated via ActionInProgress. phaseEncounterProgression becomes a sub-handler within phaseActionProgress.

Total estimate: ~1,200 lines of new/modified code, ~200+ tests.

## Files Touched

**New files:**
- `src/engine/graphOpExecutor.ts` — GraphOp execution engine
- `src/data/action-template-content.ts` — Enriched action template data
- `src/engine/actionCandidates.ts` — CRUD action candidate generator
- `src/engine/actionLifecycle.ts` — ActionInProgress management
- Test files for each

**Modified files:**
- `src/types/temporal.ts` — Extend ActionInProgress interface
- `src/types/graph.ts` — Add GraphOp type (or new types file)
- `src/engine/orchestrator.ts` — Unified agent action phase + action progress phase
- `src/engine/interventionEffects.ts` — Use GraphOp executor for mutations
- `src/engine/encounterCandidates.ts` — May merge into unified candidate generator

**Unchanged files:**
- `src/engine/agentSelection.ts` — Already generic over ActionCandidate[]
- `src/engine/resolution.ts` — Already generic
- `src/engine/disposition.ts` — Already generic
- `src/engine/interventionEffects.ts` (divine influence parts) — Already generic
