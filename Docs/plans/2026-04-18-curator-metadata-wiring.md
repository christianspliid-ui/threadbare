# Curator Metadata Wiring (THR-16)

**Date:** 2026-04-18
**Linear:** [THR-16 · TB-111 · Curator Metadata Wiring](https://linear.app/threadbare/issue/THR-16/tb-111-curator-metadata-wiring)
**Project:** Attention Tier Model
**Author:** Cowork (design handoff to CC)

## Problem

`src/engine/curator.ts` scores shaping-tier encounters across seven signals. Four of them — chain progress, faction thread relevance, ambition alignment — land in the scoring formula but arrive as hard-coded `false`/`0` in `phaseAttention.ts`:

```ts
// src/engine/phaseAttention.ts:197–200, 229–232
isChainStage:       false,         // TODO(THR-16)
isFinalChainStage:  false,         // TODO(THR-16)
factionThreadCount: 0,             // TODO(THR-16)
matchesAmbition:    false,         // TODO(THR-16)
```

Net effect today: the curator picks thread tugs purely on court position, threat rating, agent recency, and reach variety. Three entire weighting axes (W_CHAIN 0.2, W_FACTION 0.1, W_AMBITION 0.1) never contribute — 40% of the scoring budget is dead. Encounters that finish a chain, land on a heavily-threaded faction, or hit an agent's formal ambition score identically to completely disconnected encounters.

This issue wires each signal using infrastructure that already exists.

## Scope

In: populate the four `CurationCandidate` fields on both the unified-action path (`src/engine/phaseAttention.ts:166–202`) and the legacy `encounterProgress` path (`:204–234`). Extend `CuratorDecisionTrace` to expose the four fields for DebugPanel inspection.

Out: re-tuning the scoring weights, adding new chains/ambitions, caching the faction-member lookup across ticks, migrating legacy `encounterProgress` away from the fallback path (THR-118 owns that).

## Pillars

### Engine

**1. Chain stage detection — `isChainStage` / `isFinalChainStage`**

`src/engine/encounterChains.ts` already holds the data: a private `templateToChains` Map keyed by templateId, populated lazily by `ensureIndex()`. The agent's progress lives at `agent.properties.chainProgress` and is read via the exported `getChainProgress(props)`.

Add an exported helper in `encounterChains.ts`:

```ts
/**
 * Classify a template with respect to an agent's chain progress.
 * Returns { isChainStage, isFinalChainStage } where:
 * - isChainStage: template is the agent's next unlocked stage in at least one chain
 * - isFinalChainStage: isChainStage AND stageIndex === chain.stages.length - 1
 * Fail-soft: unknown template → both false.
 */
export function classifyChainStage(
  templateId: string,
  progress: ChainProgress,
): { isChainStage: boolean; isFinalChainStage: boolean };
```

Rationale for "agent's next unlocked stage" (not "template appears in any chain"): the curator's weighting only makes narrative sense when reaching this encounter advances the agent's arc. A template the agent has already completed — or one whose prerequisite they haven't met — has no chain payload for this particular decision. Using `computeChainBonus` logic as the template + progress classifier keeps the two systems consistent (scoring bonus and curator metadata agree).

In `phaseAttention.ts` (unified-action path):

```ts
const chainProgress = getChainProgress(agentNode?.properties ?? {});
const { isChainStage, isFinalChainStage } = classifyChainStage(ua.templateId, chainProgress);
```

Legacy `encounterProgress` path: `ep` carries `encounterDef?.id` (the template id). Use the same classifier with that id. If `encounterDef?.id` is missing, leave both false (existing fail-soft).

**2. Faction thread relevance — `factionThreadCount`**

Semantics: "how many fellow members of this agent's faction(s) carry an active thread from the ascendant." Encodes "this agent is embedded in a web the player is already invested in."

Walk:
```
fellows = new Set<agentId>
for memberEdge in graph.getOutgoingEdges(agent.id, 'member_of'):
  factionId = memberEdge.target
  for incoming in graph.getIncomingEdges(factionId, 'member_of'):
    if incoming.source === agent.id: continue   // exclude self
    if graph.getIncomingEdges(incoming.source, 'thread')
         .some(e => e.source === state.ascendantId): fellows.add(incoming.source)
return fellows.size
```

Set-based de-dup handles the case where the agent belongs to multiple overlapping factions (guild + faction). Self-exclusion prevents trivial +1 when the agent themselves has a thread (that is already modeled by `courtPosition`).

Where it lives: inline helper in `phaseAttention.ts` — not worth a new module for one walk. Factor into `engine/factionThreadRelevance.ts` only if the same walk needs reuse elsewhere.

**Performance note:** The shaping-pool candidate list is small (typically ≤ 20 per tick, capped by tier filtering upstream). The walk is O(factions × faction_members) per candidate — bounded and cheap in practice. If profiling later shows hot-path pressure, memoize the per-agent fellow-count within a single phase invocation (many candidates share an agent). Not needed in v1.

**3. Ambition alignment — `matchesAmbition`**

`src/engine/encounterScoring.ts:577–594` already has `getAmbitionBoostForEntry(graph, agentId, reachPrimary)` walking `pursues` edges and checking `ambition.properties.reachAffinity[reachPrimary] > 0`. It returns `AMBITION_REACH_BOOST` (a number) for the encounter-scoring context.

Extract its predicate into an exported helper in the same file so both callers share the walk logic:

```ts
export function agentPursuesReach(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain,
): boolean {
  const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
  for (const edge of pursuesEdges) {
    const ambition = graph.getNode(edge.target);
    const reachAffinity = ambition?.properties?.reachAffinity as
      | Partial<Record<ReachDomain, number>>
      | undefined;
    if (reachAffinity && (reachAffinity[reach] ?? 0) > 0) return true;
  }
  return false;
}
```

Refactor `getAmbitionBoostForEntry` to call `agentPursuesReach` so the boost function and the curator predicate stay in lockstep. Call in `phaseAttention.ts`:

```ts
const matchesAmbition = agentPursuesReach(state.graph, ua.actorId, template.reach);
```

Legacy `encounterProgress` path: `ep` has no template, so `reachPrimary` is hard-coded to `'combat'`. Pass `'combat'` to `agentPursuesReach` for consistency with existing fallback — or leave `matchesAmbition: false` on that path to avoid falsely crediting combat ambitions. **Choice:** leave false on the legacy path. The reach value on that path is a known placeholder; opting in would bias curator scoring toward a lie. THR-118 (Encounter Format Migration) will retire the legacy path.

**4. Trace extension**

Extend `CuratorDecisionTrace` in `src/types/attention.ts`:

```ts
export interface CuratorDecisionTrace extends TraceBase {
  category: 'curator_decision';
  encounterId: string;
  decision: 'kept' | 'curated_out';
  curationScore: number;
  reason: string;
  // THR-16 additions
  isChainStage: boolean;
  isFinalChainStage: boolean;
  factionThreadCount: number;
  matchesAmbition: boolean;
}
```

Emit site: wherever `phaseAttention.ts` currently emits `curator_decision` traces (the selected/demoted split post-scoring). Pass the candidate fields through.

### Content

N/A for v1. The wiring consumes three existing content surfaces:

- `ENCOUNTER_CHAINS` in `encounterChains.ts` (3 starter chains: Scholar's Path, Rise Through the Ranks, Merchant's Gambit)
- `ENCOUNTER_TYPE_MOTIVATIONS` / per-template `motivations` in unified action templates
- Ambition nodes with `reachAffinity` property bags (created upstream by ambition systems)

No new templates, chains, or ambitions required. Once this wiring lands, content authors adding chains (THR-xxx follow-ups), ambitions, or heavily-threaded factions automatically benefit from curator scoring.

### UI

**DebugPanel — curator trace viewer.** The Debug Panel already surfaces traces by category. Once `CuratorDecisionTrace` carries the four metadata fields, the existing viewer will render them. Concrete change: whatever component renders `curator_decision` rows (likely a table in `DebugPanel/` or a generic trace inspector) must show the four new fields. If it's the generic JSON-ish viewer, no code change — the fields appear automatically. Verify by running `tick 30` in the in-game CLI (F1) with a seeded game and inspecting one curator trace row.

**No player-facing UI.** The curator is an internal selection system. The player experiences its output (thread tugs arriving; digest entries for demoted encounters), not its metadata. No new player controls, alerts, toasts, or HexMap signifiers.

**Marked N/A-with-rationale per the three-pillar rule:** the player-facing surface already exists (thread tug notifications + digest). This change tunes the selection quality of that surface — it doesn't add a new one. Implementer: note in the commit message that the UI pillar is a verification task (DebugPanel trace view shows the 4 new fields), not a new surface.

## Wiring (cross-pillar)

| Surface | Change |
|---|---|
| Orchestrator phase | None — `phaseAttention` is already wired in `orchestrator.ts`. |
| Engine module new exports | `classifyChainStage` (encounterChains.ts), `agentPursuesReach` (encounterScoring.ts). |
| GameState | Unchanged — fields are read from existing graph (thread edges, member_of edges, pursues edges) and agent properties (chainProgress). |
| Traces | `CuratorDecisionTrace` extended with 4 fields. No new trace category. |
| DebugPanel | Verify the curator-trace viewer renders the 4 fields. Extend if it renders a fixed column set. |
| Player controls | N/A — internal scoring. |
| Prose pipeline | N/A — no enrichment placeholders touched. |

Checklist entry for `Docs/plans/wiring-checklist.md`: add row under Traces — "CuratorDecisionTrace extended with chain/faction/ambition metadata (THR-16)."

## Constants

No new constants. All weights (`W_CHAIN`, `W_FACTION`, `W_AMBITION`) and saturation values (`FACTION_THREAD_SATURATION`) already live in `curator.ts` and are tunable.

## Fail-soft

| Failure case | Fallback |
|---|---|
| Agent has no `chainProgress` property | `getChainProgress` returns `{ completed: {} }` → classifier returns `{ false, false }` |
| Template id not in any chain | `classifyChainStage` returns `{ false, false }` |
| Agent not in any faction | `factionThreadCount = 0` (empty `member_of` outgoing edge set) |
| Faction has no other members | `factionThreadCount = 0` (empty `member_of` incoming edge set) |
| Agent has no `pursues` edges | `matchesAmbition = false` |
| Ambition node missing `reachAffinity` property | treated as no affinity → `false` |
| Legacy `encounterProgress` without `encounterDef?.id` | All four fields remain `false` / `0` (documented path) |
| Template missing on unified action (should be impossible) | Chain + ambition fields `false`, reachPrimary falls back to `'combat'` (existing behavior) |

No throws. Curator receives defaults that weight-out to zero contribution, which is the same behavior as today — guaranteed additive change.

## Tracing

Extend existing `CuratorDecisionTrace`. Example trace after change:

```json
{
  "category": "curator_decision",
  "encounterId": "ua_42",
  "decision": "kept",
  "curationScore": 0.67,
  "reason": "top-1 of 4",
  "isChainStage": true,
  "isFinalChainStage": false,
  "factionThreadCount": 2,
  "matchesAmbition": true
}
```

No new trace category. Single surface, one emission site.

## Determinism

Pure function work: edge walks are deterministic given graph state; `classifyChainStage` and `agentPursuesReach` are pure. The curator's existing PRNG tiebreaker is unaffected. Same seed + same graph state → same selected/demoted split.

## Testing

Unit tests:

- `encounterChains.test.ts` — extend with cases for `classifyChainStage`:
  - unknown template → `{ false, false }`
  - stage 0, empty progress → `{ true, false }`
  - mid-chain, progress up to stage N-1 → `{ true, false }` on stage N
  - final stage, progress up to penultimate → `{ true, true }`
  - template matches two chains (if any exist) → prefer the one where it's the next stage
- `encounterScoring.test.ts` — add `agentPursuesReach` unit tests (no `pursues` edges; ambition with zero affinity; ambition with positive affinity for target reach; ambition with affinity for a different reach).
- `phaseAttention.test.ts` — contract test that builds a state with: (a) one agent mid-chain, (b) one agent with faction thread fellows, (c) one agent with a matching ambition. Assert the `CurationCandidate` emitted to the curator has the populated fields. Assert `CuratorDecisionTrace` carries them through.
- `curator.test.ts` — already covers the scoring formula; no changes needed since inputs are now real instead of stubbed.

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new magic numbers. Existing weights already named. |
| 2. Inspectability | PASS | Extended `CuratorDecisionTrace` exposes every new signal in DebugPanel. |
| 3. Determinism | PASS | Pure edge walks; no randomness introduced. |
| 4. Fail-soft | PASS | Every branch has a defined fallback that matches current (zero-contribution) behavior. |
| 5. Narrative over mechanical | PASS | Wiring reflects player-intent signals (chains = arcs, faction threads = cared-about web, ambitions = formal goals) into curator scoring. |
| 6. Additive over destructive | PASS | Adds exported helpers; refactors `getAmbitionBoostForEntry` to call the new predicate (internal, no API change). No data-shape migrations. |
| 7. Performance | PASS with note | Per-candidate faction walk is O(factions × members) and shaping-pool candidates are small. Profile if candidate counts grow; memoize per-agent within a phase call if hot. |

## Rejected Approaches

- **Static `isChainStage` (template-in-any-chain, ignore progress).** Rejected: a completed chain stage would still earn curator bonus, over-selecting settled arcs. The progress-aware classifier matches the `computeChainBonus` semantics the rest of the engine already uses.
- **Per-faction cached thread count on faction node.** Attractive for O(1) lookup but introduces a maintenance cost (update on thread add/remove, member_of add/remove). Not worth it for shaping-pool sizes today. Revisit if profiling shows the walk is hot.
- **Trusting the legacy `encounterProgress` fallback reach ('combat') for ambition alignment.** Rejected above: would bias scoring toward combat-affinity ambitions on any legacy encounter regardless of actual domain. Leave `matchesAmbition = false` on the legacy path until THR-118 retires it.
- **New trace category for extended metadata.** Rejected: fragmenting curator traces across categories breaks the existing DebugPanel filter UX. Extend the existing trace; consumers see more fields.

## Implementation order

1. Add `classifyChainStage` export in `encounterChains.ts` + unit tests.
2. Add `agentPursuesReach` export in `encounterScoring.ts`; refactor `getAmbitionBoostForEntry` to use it; unit tests.
3. Extend `CuratorDecisionTrace` in `src/types/attention.ts`.
4. Wire the four fields in `phaseAttention.ts` (unified-action path first, then legacy fallback).
5. Propagate the four fields to the `CuratorDecisionTrace` emission.
6. Contract test in `phaseAttention.test.ts`.
7. Verify DebugPanel curator trace viewer renders the new fields (in-game CLI at F1, `tick 30` on `?view=game&seeded`).
8. Update `Docs/plans/wiring-checklist.md`.

## File surfaces

| File | Change |
|---|---|
| `src/engine/encounterChains.ts` | Add `classifyChainStage` export. |
| `src/engine/encounterScoring.ts` | Add `agentPursuesReach` export; refactor internal `getAmbitionBoostForEntry`. |
| `src/engine/phaseAttention.ts` | Populate the four stubbed fields on both paths; thread them into the trace emission. |
| `src/types/attention.ts` | Extend `CuratorDecisionTrace` with four fields. |
| `src/engine/__tests__/encounterChains.test.ts` | Extend. |
| `src/engine/__tests__/encounterScoring.test.ts` | Extend. |
| `src/engine/__tests__/phaseAttention.test.ts` | Extend (or create if absent — the existing curator contract test lives in `curator.test.ts`). |
| `Docs/plans/wiring-checklist.md` | Append trace row. |

Parallel-safe with: THR-15, THR-30 (different phase / type surfaces).
Mutex with: any in-flight work on `phaseAttention.ts`, `encounterChains.ts`, `encounterScoring.ts`, or `src/types/attention.ts`. Check current In Dev issues before pulling.
