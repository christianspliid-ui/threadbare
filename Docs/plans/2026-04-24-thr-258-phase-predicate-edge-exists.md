# THR-258 — Phase predicate: `edge-exists` (runtime adapter, scoped FilterQuery subset)

**Status:** Ready for Codex
**Project:** Social Systems Expansion
**Author:** Cowork (autonomous scheduled session, 2026-04-24)
**Parent:** THR-252 (non-doom-clock WorldPredicate ops — Done 2026-04-23)
**Parent plan:** `Docs/plans/2026-04-23-thr-252-phase-runner-world-predicates.md` §Deferrals #1

## Context

THR-252 shipped `world-flag`, `has-faction-of-archetype`, and `has-agent-of-archetype` in `evaluatePhasePredicateV1()` (`src/engine/phaseComposition.ts:56`). It explicitly deferred `edge-exists` because it requires evaluating a `FilterQuery` over runtime graph nodes, and the only existing FilterQuery evaluator (`evaluateFilterQuery` in `src/composition-dsl/findCard.ts:120`) is a private function operating on the DSL-side `WorldSnapshot`/`WorldNode` shape, not the runtime `WorldGraph`/`GraphNode` shape.

The DSL schema (`src/composition-dsl/schema.ts:186`) defines:

```typescript
export interface PredicateEdgeExists {
  op: 'edge-exists';
  fromFilter: FilterQuery;
  edgeType: string;
  toFilter?: FilterQuery;
}
```

Semantics (per `validator.ts:274-285`): there exists at least one source node satisfying `fromFilter` such that it has an edge of `edgeType` whose target satisfies `toFilter` (if `toFilter` is omitted, any target counts).

## Locked design decision: runtime adapter, NOT shared evaluator

The deferral note in THR-252's plan said implementation could "either extract the evaluator to a shared module and parameterise it over the two node shapes, or build an adapter." **This plan locks the adapter approach.** Rationale:

| Concern | Extract + parameterise | Runtime adapter (chosen) |
|---|---|---|
| Surface area | Touches `findCard.ts`, `validator.ts`, `worldTypes.ts` + adds new shared module | Localized to `phaseComposition.ts` |
| Type gymnastics | Requires `NodeAdapter<T>` interface + generic threading through every FilterQuery op | None — runtime types used directly |
| `node-class` op | DSL-only concept; needs a runtime equivalent or stub | Same — but stub is private and explicit |
| `has-tag` / `has-any-tag` | DSL `WorldTags` is `{ archetype, reach, sphere }`; runtime tags live in `properties.tags` (flat `string[]`). Reconciling shapes adds further parameters | Same — but the v1 scope sidesteps the need (see below) |
| Risk to existing DSL paths | Touches load-bearing `findCard.ts` used by `resolveFindCard`; regression risk in unrelated paths | Zero — DSL-side code untouched |
| Test surface | Existing `findCard.test.ts` + new shared-module tests + new runtime tests | New runtime tests only |

The DSL-side `evaluateFilterQuery` is **not duplicated wholesale**. The runtime adapter only supports the minimum FilterQuery ops needed for `edge-exists` to be useful for current content authoring, with explicit fallthrough-and-warn for the rest. If a content author requests fuller FilterQuery parity on the runtime side, that opens a separate ticket.

## Three-Pillar Overview

### Engine pillar
Add a runtime FilterQuery evaluator (`evaluatePhaseFilterQuery`) and an `edge-exists` branch to `evaluatePhasePredicateV1`. The evaluator supports a v1 subset of FilterQuery ops (`and`, `or`, `not`, `prop-equals`, `has-edge`) and warns + returns `false` for unsupported ops (`has-tag`, `has-any-tag`, `node-class`), mirroring the existing fail-soft pattern.

### Content pillar
N/A — no new authored content in this ticket. The Chain Weakens recipe is **not** extended; `phase-5-reckoning` (THR-252) already exercises `world-flag` + `has-faction-of-archetype` and is sufficient demonstration of phase predicates. Adding an `edge-exists`-using phase to Chain Weakens would require designing a meaningful in-recipe relationship — judgment work that belongs in a separate content ticket once the predicate evaluator lands.

### UI pillar
N/A — no new player-facing surface. Phase activation traces (`composition.phase_activated`) and DebugPanel composition view rendered by THR-225 already display the predicate op string. The `edge-exists` op string will appear unmodified once the predicate is supported. No formatting changes in this ticket; if a deeper inspector is requested later, that is a follow-up in the UI Visual Overhaul project.

## Engine Design

### v1 supported FilterQuery ops on runtime nodes

| FilterQuery op | v1 supported | Runtime semantics |
|---|---|---|
| `and` | ✅ | All terms recurse, all must match |
| `or` | ✅ | All terms recurse, any may match |
| `not` | ✅ | Inner term recurses, result negated |
| `prop-equals` | ✅ | `node.properties[query.prop] === query.value` |
| `has-edge` | ✅ | Uses `state.graph.getOutgoingEdges(node.id, query.edgeType as EdgeType)`; if `toFilter` present, recurses on each edge's target node via `state.graph.getNode(edge.target)` |
| `has-tag` | ❌ v1 | Runtime tags live in `node.properties.tags` (flat `string[]`); DSL has `{ archetype, reach, sphere }` axes. Returns `false` + console.warn. |
| `has-any-tag` | ❌ v1 | Same coupling problem. Returns `false` + console.warn. |
| `node-class` | ❌ v1 | DSL-only concept (`generic`/`promoted`/`threaded` from DSL `nodeClass`); no runtime equivalent. Returns `false` + console.warn. |
| _any unknown op_ | — | Returns `false` + console.warn (fail-soft) |

**Why the narrowing is safe.** No authored recipe currently uses `has-tag`/`has-any-tag`/`node-class` inside an `edge-exists` predicate (verified by grep in this session — no `edge-exists` references exist in `src/composition-dsl/examples/` or `src/data/composition-config.ts`). The first predicate use will land alongside its content; if that content needs richer ops, it will surface the requirement and trigger the follow-up. v1 ships the most common shape (`prop-equals` + `has-edge` + boolean composition) which covers e.g. "actor with `actorType: 'individual'` and `archetypeId: 'martyr'` has a `bonded_to` edge to a node with `kind: 'artifact_legendary'`."

### Implementation

Add to `src/engine/phaseComposition.ts` directly above `evaluatePhasePredicateV1`:

```typescript
import type { FilterQuery } from '../composition-dsl/schema';
import type { GraphNode, EdgeType } from '../types/graph';

/**
 * Evaluate a FilterQuery against a runtime GraphNode.
 *
 * v1 scope: supports `and`, `or`, `not`, `prop-equals`, `has-edge`.
 * Unsupported ops (`has-tag`, `has-any-tag`, `node-class`) return false with a console.warn,
 * mirroring the unknown-predicate-op fail-soft pattern. See plan doc for rationale.
 */
function evaluatePhaseFilterQuery(
  query: FilterQuery,
  node: GraphNode,
  state: GameState
): boolean {
  switch (query.op) {
    case 'and':
      return query.terms.every((term) => evaluatePhaseFilterQuery(term, node, state));
    case 'or':
      return query.terms.some((term) => evaluatePhaseFilterQuery(term, node, state));
    case 'not':
      return !evaluatePhaseFilterQuery(query.term, node, state);
    case 'prop-equals':
      return node.properties[query.prop] === query.value;
    case 'has-edge': {
      const edges = state.graph.getOutgoingEdges(node.id, query.edgeType as EdgeType);
      if (edges.length === 0) return false;
      if (!query.toFilter) return true;
      const toFilter = query.toFilter;
      return edges.some((edge) => {
        const target = state.graph.getNode(edge.target);
        return target ? evaluatePhaseFilterQuery(toFilter, target, state) : false;
      });
    }
    case 'has-tag':
    case 'has-any-tag':
    case 'node-class':
      console.warn(
        `[phaseComposition] FilterQuery op "${query.op}" not supported on runtime graph in v1 — treating as false (see THR-258 plan doc)`
      );
      return false;
    default:
      console.warn(
        `[phaseComposition] Unknown FilterQuery op "${(query as { op: string }).op}" — treating as false`
      );
      return false;
  }
}

/**
 * Iterate every node in the graph and apply a FilterQuery. Returns the matching nodes.
 * O(n) over total node count; acceptable at current scale per plan doc §Performance.
 */
function findNodesMatchingFilter(
  filter: FilterQuery,
  state: GameState
): GraphNode[] {
  const allNodes = ALL_NODE_TYPES.flatMap((t) => state.graph.getNodesByType(t));
  return allNodes.filter((node) => evaluatePhaseFilterQuery(filter, node, state));
}

const ALL_NODE_TYPES: readonly NodeType[] = [
  'actor',
  'location',
  'trait',
  'artifact',
  'artifact_legendary',
  'resource',
  'action_template',
  'event',
  'cosmology',
  'region',
  'ambition',
] as const;
```

Then add the `edge-exists` case to `evaluatePhasePredicateV1`'s switch, immediately after the `has-agent-of-archetype` case and before the `and` case:

```typescript
    case 'edge-exists': {
      const sourceNodes = findNodesMatchingFilter(predicate.fromFilter, state);
      if (sourceNodes.length === 0) return false;
      const toFilter = predicate.toFilter;
      return sourceNodes.some((sourceNode) => {
        const edges = state.graph.getOutgoingEdges(sourceNode.id, predicate.edgeType as EdgeType);
        if (edges.length === 0) return false;
        if (!toFilter) return true;
        return edges.some((edge) => {
          const target = state.graph.getNode(edge.target);
          return target ? evaluatePhaseFilterQuery(toFilter, target, state) : false;
        });
      });
    }
```

### Imports to add at top of `src/engine/phaseComposition.ts`

```typescript
import type { Phase, WorldPredicate, FilterQuery } from '../composition-dsl/schema';
import type { GraphNode, EdgeType, NodeType } from '../types/graph';
```

(`Phase` and `WorldPredicate` already imported on line 12; extend the same import. Add the `graph` import as a new line.)

### `EdgeType` cast safety

The DSL schema declares `edgeType: string` (open universe — DSL is decoupled from runtime). Runtime `getOutgoingEdges` takes `edgeType?: EdgeType` (closed enum). The cast `query.edgeType as EdgeType` is structurally safe because runtime edge lookup never reads the value beyond `===` comparison against the stored `edge.type`, so an unknown edge type simply matches no edges and returns `false` — fail-soft. **Do not narrow this to `EdgeType` validation in v1**; that would require an enum check and a new failure mode. Bare cast is correct.

### Performance

Worst case per `edge-exists` evaluation:
- `findNodesMatchingFilter` iterates all nodes once (~O(n) with n = total nodes; ~5,000 at large-map scale by tick 100).
- Per source candidate, `getOutgoingEdges(id, edgeType)` is O(out-degree) using the existing `outgoing` index map; typical out-degree ≤ ~10.
- If `toFilter` is present, recurse into the target.
- Phase runner cap: `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK = 16` × ~4 phases × at most a few `edge-exists` per phase → upper bound ~250 `edge-exists` evaluations per tick.
- Worst case ~250 × 5,000 = 1.25M property reads per tick. Comparable to existing predicate cost; within NFP #7 budget at v1 content density. If profiling pressures appear, add an LRU `Map<JSON.stringify(filter), GraphNode[]>` cache invalidated on `structuralCacheVersion` — deferral noted in §Deferrals.

### Constants table

| Constant | Default | Where | Purpose |
|---|---|---|---|
| — | — | — | No new constants. Existing `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK` already bounds the work. |

### Tracing

| Trace category | Changes | New fields |
|---|---|---|
| `composition.phase_activated` | None | — |
| `composition.phase_eval_failed` | None | — |

No new trace categories. The existing outer try/catch around `evaluatePhasePredicateV1` (`phaseComposition.ts:310-323`) catches any thrown errors during recursion and emits `composition.phase_eval_failed`.

### Fail-soft table

| Failure case | Behavior | Trace |
|---|---|---|
| `predicate.fromFilter` matches no nodes | Returns `false`. Phase stays dormant. | — |
| `predicate.toFilter` present but no target matches | Returns `false`. | — |
| `query.toFilter` references a node that no longer exists in the graph | `state.graph.getNode(edge.target)` returns `undefined`; that target excluded. Other targets still considered. | — |
| Unsupported FilterQuery op (`has-tag`, `has-any-tag`, `node-class`) inside the filter | `console.warn` per evaluation, returns `false`. Phase stays dormant. | — |
| Unknown FilterQuery op | `console.warn`, returns `false`. | — |
| Graph iteration throws | Caught by outer try/catch in phase runner, emits `composition.phase_eval_failed`, phase skipped. | `composition.phase_eval_failed` |
| `predicate.edgeType` references an unknown `EdgeType` | Lookup returns no edges; predicate returns `false`. | — |

## Wiring

| Surface | Touch | What |
|---|---|---|
| Orchestrator phase | No change | `phaseComposition` already wired |
| UI component | No change | DebugPanel renders predicate op string unmodified |
| GameState fields | No change | Reads `state.graph` only |
| Trace categories | No change | Existing categories cover failure modes |
| Prose pipeline | No change | — |
| Player controls | No change | — |
| `wiring-checklist.md` | No update | No new surfaces |

## Testing

### Unit tests — extend `src/engine/__tests__/phaseComposition.worldPredicates.test.ts`

Add a new `describe('edge-exists predicate', ...)` block at the end of the file, using the existing `makeState` / `makeActiveComposition` factories. Each test case wires a minimal graph (use `state.graph.addNode(...)` and `state.graph.addEdge(...)`) and asserts the predicate evaluates to the expected boolean by running `phaseComposition(state)` and checking whether `phase-test`'s id appears in the resulting `activeCompositions[0].activatedPhaseIds`.

Required cases:

1. **Empty fromFilter match → false.** Empty graph, `{ op: 'edge-exists', fromFilter: { op: 'prop-equals', prop: 'archetypeId', value: 'martyr' }, edgeType: 'bonded_to' }` → predicate false, phase not activated.
2. **Source matches, no edges of type → false.** Add an actor matching `fromFilter` but no `bonded_to` edges → false.
3. **Source matches, edge of type exists, no toFilter → true.** Add `bonded_to` edge from matching source to any target → true.
4. **Source matches, edge exists, toFilter matches target → true.** Source matches `fromFilter`, edge target matches `toFilter` → true.
5. **Source matches, edge exists, toFilter does NOT match target → false.** Source matches `fromFilter`, edge exists, but target does not match `toFilter` → false.
6. **Multiple sources, only one with matching edge → true.** Two source candidates; only one has the qualifying edge → true.
7. **Edge target node missing from graph (dangling edge) → false for that edge.** Add an edge whose target id is not in the graph; if no other qualifying edges exist → false.
8. **`and` composition inside `fromFilter` → recursion works.** `fromFilter: { op: 'and', terms: [{ prop-equals }, { prop-equals }] }` → expected behavior.
9. **`or` composition inside `toFilter` → recursion works.**
10. **`not` composition → recursion works.**
11. **Unsupported op `has-tag` inside fromFilter → false + console.warn (assert with `vi.spyOn(console, 'warn')`).**
12. **Unsupported op `node-class` inside toFilter → false + console.warn.**
13. **Unknown FilterQuery op (cast as `any` to bypass typing) → false + console.warn.**
14. **`edge-exists` wrapped in `and` with another supported predicate (e.g. `world-flag`) → both must pass for activation.**
15. **`edge-exists` wrapped in `not` → negation applied correctly.**

### Existing tests

Run full suite. No existing test should change — `edge-exists` is a brand-new predicate op that isn't exercised by any existing fixture.

### Pre-commit gate

`npm test`, `npx tsc --noEmit`, `npx vite build`. Paste raw terminal output in the closing Linear comment per Definition of Done.

## Deferrals

Tracked as new Linear issues by Codex at closeout (label `Deferral`, project Social Systems Expansion):

1. **Runtime FilterQuery: `has-tag` / `has-any-tag` support.** Requires reconciling DSL `WorldTags` (categorized) with runtime `properties.tags` (flat `string[]`). Open only when a content author needs tag-based gating inside an `edge-exists`.
2. **Runtime FilterQuery: `node-class` support.** No runtime equivalent for DSL nodeClass exists. Open only on first content request.
3. **`edge-exists` evaluation cache.** LRU `Map<filterFingerprint, GraphNode[]>` keyed on `JSON.stringify(filter)` and invalidated via `structuralCacheVersion`. Open only on profiling evidence (>5ms per tick attributable to `findNodesMatchingFilter`).
4. **Adopt the runtime FilterQuery evaluator beyond phase predicates.** If other engine surfaces (intelligence, scoring, scrying) want runtime FilterQuery semantics, extract `evaluatePhaseFilterQuery` to `src/engine/runtimeFilterQuery.ts`. Not needed in v1.

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | No new magic numbers. Filter shape comes entirely from recipe data. |
| #2 Inspectability | PASS | Existing `composition.phase_activated` and `composition.phase_eval_failed` traces carry necessary info. Console warnings surface unsupported-op usage. |
| #3 Determinism | PASS | `state.graph.getNodesByType` and `getOutgoingEdges` iteration order is insertion-order (Map). No PRNG. |
| #4 Fail-soft | PASS | All failure modes table-checked; predicate degrades to `false` on every error path. |
| #5 Narrative over mechanical perfection | PASS | Predicate enables richer narrative gating (e.g. "ritual fires only if bonded artifact exists between two factions"). |
| #6 Additive | PASS | Adds one switch case + two private helpers. No removal, no signature change. |
| #7 Performance | PASS | Worst-case ~1.25M property reads/tick at large-map scale; within budget. Caching deferred behind evidence. |

## Acceptance Criteria

- [ ] `evaluatePhasePredicateV1` in `src/engine/phaseComposition.ts` handles `edge-exists` per §Engine Design.
- [ ] Private helpers `evaluatePhaseFilterQuery`, `findNodesMatchingFilter`, and `ALL_NODE_TYPES` constant added (private to `phaseComposition.ts` — no re-export).
- [ ] Imports updated: `FilterQuery` added to existing `composition-dsl/schema` import; new import line for `GraphNode`, `EdgeType`, `NodeType` from `../types/graph`.
- [ ] Unsupported FilterQuery ops (`has-tag`, `has-any-tag`, `node-class`) emit `console.warn` and return `false`.
- [ ] Unknown FilterQuery op fallthrough also `console.warn` + `false`.
- [ ] Existing `console.warn` for unknown WorldPredicate op preserved unchanged.
- [ ] All 15 unit test cases in §Testing pass.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green — raw terminal output pasted in closeout comment.
- [ ] Deferrals 1–4 logged as Linear issues (1, 2, and 3 marked "open only on demand"; only file 4 if extracting evaluator already feels like the right move).
- [ ] Closing commit body includes `Fixes THR-258`.

## Files to touch

- `src/engine/phaseComposition.ts` — add `FilterQuery` to existing schema import; add new `GraphNode`/`EdgeType`/`NodeType` import; add `evaluatePhaseFilterQuery`, `findNodesMatchingFilter`, `ALL_NODE_TYPES`; add `case 'edge-exists'` to `evaluatePhasePredicateV1` switch
- `src/engine/__tests__/phaseComposition.worldPredicates.test.ts` — extend with `describe('edge-exists predicate', ...)` block per §Testing
- `Docs/changelog.md` — append row
- `Docs/project-status.md` — append entry; rotate older entries to `project-history.md` if file ≥60 lines

**Do NOT touch** (explicit out-of-scope):
- `src/composition-dsl/findCard.ts` — DSL-side evaluator stays untouched
- `src/composition-dsl/validator.ts` — DSL validator path for `edge-exists` already works on `WorldSnapshot`
- `src/composition-dsl/examples/event-chain-weakens.recipe.ts` — no recipe changes; content authoring belongs in a separate ticket
- `src/data/story-beat-templates/chain-weakens.ts` — no new templates
- `src/components/DebugPanel/**` — no UI changes
