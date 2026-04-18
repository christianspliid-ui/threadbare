# THR-144 — Alone / Outnumbered Predicates

**Date:** 2026-04-18
**Status:** Design complete — Ready for Dev
**Parent issue:** THR-144 (deferral from THR-116)
**Project:** Encounter Format Migration
**Siblings (same parent):** THR-143 (caused_by node wiring), THR-133 (emitTrace StrictMode dedup)

## 1. Problem Statement

THR-116 added `buildPredicateContext` to `src/engine/effects/effectPredicates.ts` and declared the `alone` and `outnumbered` predicates in `EffectPredicate`. Their implementations are hard-coded stubs (lines 203–209):

```ts
// TODO(THR-144): allyCount and enemyCount are stubs. alone is always true,
// outnumbered always false.
const allyCount = 0;
const enemyCount = 0;
const alone = allyCount === 0 && enemyCount === 0;
const outnumbered = enemyCount > (allyCount + 1);
```

Consequences:

1. Any effect using `when: 'alone'` fires unconditionally — solo-scene content cannot be gated.
2. Any effect using `when: 'outnumbered'` never fires — crowd-pressure content is dead on arrival.
3. Content authors cannot author encounters that lean on co-location arithmetic without hand-rolling a custom predicate.

A source audit (2026-04-18) confirmed **zero** current usages of `when: 'alone'` or `when: 'outnumbered'` in `src/data/encounters/**`. So correcting the stubs does not silently change existing behaviour. It unblocks new content.

## 2. Goals and Non-Goals

**Goals**
- Compute real `allyCount` and `enemyCount` from the graph.
- Keep the two predicates observable (counts exposed on `PredicateContext`).
- Stay within the existing predicate grammar — no new predicate strings, no new orchestrator phases.
- Document the unlocked primitive in the systemic wiring guide so authors use it.
- Lock behaviour in with unit tests before CC ships.

**Non-Goals (deferred)**
- New predicates like `has_ally_count_above:N` or `enemies_within_hex:N`. v1 keeps `alone` / `outnumbered` as the public surface.
- Sub-faction resolution (guild-within-house chains via `member_of`). v1 uses only the top-level `factionId` property.
- Hex-distance variants (`isolated_on_hex`, `outnumbered_within_1_hex`). Encounter awareness uses hex-distance, but "alone" should mean *this scene*, not *this region*.
- Dynamic posture (currently engaged in combat, currently fleeing). The predicate is about structural presence, not state.
- Authoring new encounter templates that exercise the predicates. Content comes in separate issues.

## 3. Load-Bearing Constraints Honoured

- **Everything is a graph node/edge.** Co-location is read off the existing `located_at` edge. Alliance/enmity reads off `relates_to` and `factionId`. No new node/edge types.
- **No inventing node types.** Verified against `src/types/graph.ts` and `src/types/edgeSchema.ts`: `located_at`, `relates_to`, `member_of` all exist and carry the required properties.
- **Relationships as edges, not property fields.** The classification helper reads edges, never a "faction relationship map" property bag.
- **Predicates are side-effect-free.** The helper is pure; no RNG, no state mutation, no resolver calls.
- **Fail-soft.** Missing edges, missing actors, malformed sentiment → neutral / zero, never throws.
- **Three-tier position model.** An actor has exactly one `located_at` edge to their most-specific node. v1 uses strict same-node equality for co-location; an agent at a sublocation is *not* co-located with an agent at the parent location. A future `co_located_on_hex` predicate can add a looser signal without muddying `alone`.

## 4. Engine Design

### 4.1 New helper: `classifyCoLocatedActor`

**File:** `src/engine/effects/actorClassification.ts` (new).

```ts
export type ActorAlignment = 'ally' | 'enemy' | 'neutral';

/**
 * Classify `otherId` relative to `selfId` for the purposes of alone/outnumbered
 * and future alignment-based predicates. Pure, graph-only, fail-soft.
 *
 * Resolution order (first match wins):
 *   1. Direct actor-to-actor `relates_to` edge (either direction). Sentiment
 *      above ALLY_SENTIMENT_THRESHOLD → ally. Below ENEMY_SENTIMENT_THRESHOLD → enemy.
 *   2. Shared `factionId` on actor node properties → ally.
 *   3. Faction-to-faction `relates_to` edge between the two factions (either
 *      direction). Sentiment bands as above.
 *   4. Otherwise → neutral.
 */
export function classifyCoLocatedActor(
  graph: WorldGraph,
  selfId: string,
  otherId: string,
): ActorAlignment;
```

**Sentiment helper** (local to the file):

```ts
function sentimentBetween(graph: WorldGraph, a: string, b: string): number | null {
  // Try outgoing a→b first, then incoming b→a. Return the first sentiment whose
  // absolute value is ≥ the smaller of ALLY_SENTIMENT_THRESHOLD / |ENEMY_SENTIMENT_THRESHOLD|.
  // If none exceed threshold, return the outgoing sentiment (may be null).
}
```

**Why this order.** Direct actor relationships are the strongest signal (personal grudges, oaths, explicit loyalty). Shared faction is the broadest cheap signal. Faction-level relationships are the last resort. Neutrals are not enemies by default — this matters because most NPCs in a crowded location are bystanders, not combatants.

**Why both directions of `relates_to`.** The edge is directed, but sentiment is usually mutual in practice. Checking both directions catches cases where only one actor has logged the relationship.

**Why not a fourth rule for `relates_to.strength`.** Strength is bond intensity, not polarity. A strong positive sentiment is already captured in step 1. Strength alone does not make an ally.

### 4.2 Wiring into `buildPredicateContext`

Replace the stub block (current lines 203–209) with:

```ts
// Alone / outnumbered — count co-located allies/enemies at the actor's
// most-specific located_at node.
let allyCount = 0;
let enemyCount = 0;
const locatedAt = graph.getOutgoingEdges(agentId, 'located_at');
if (locatedAt.length > 0) {
  const locationId = locatedAt[0].target;
  const incoming = graph.getIncomingEdges(locationId, 'located_at');
  for (const edge of incoming) {
    if (edge.source === agentId) continue;
    const align = classifyCoLocatedActor(graph, agentId, edge.source);
    if (align === 'ally') allyCount++;
    else if (align === 'enemy') enemyCount++;
  }
}
const alone = allyCount === 0 && enemyCount === 0;
const outnumbered = enemyCount > (allyCount + OUTNUMBERED_MARGIN);
```

**Complexity.** O(N · E) where N is the number of co-located actors (typically < 10 per scene) and E is the number of `relates_to` edges the helper walks (typically 0–2 per pair). Under the per-scene caps observed in `encounterAwareness.ts`, this is effectively constant-time per call.

**No caching.** `buildPredicateContext` is called at effect-resolution time, not per-tick. A resolver that evaluates five predicates on one actor pays the cost once per context build. If profiling later shows hotspots, memoise `classifyCoLocatedActor(selfId, otherId)` within a single context build — but do not memoise across ticks (the graph mutates in place; see the `worldVersion` load-bearing rule).

### 4.3 `PredicateContext` shape change

Add two fields next to the existing `alone` / `outnumbered`:

```ts
interface PredicateContext {
  // ...existing...
  allyCount: number;     // NEW
  enemyCount: number;    // NEW
  alone: boolean;
  outnumbered: boolean;
}
```

This makes the counts inspectable by DebugPanel and by any future predicate that wants to ask `ally_count_above:2` without rebuilding the traversal. It is additive — no consumer breaks.

### 4.4 Constants

Append to `src/data/effect-constants.ts`:

| Constant | Value | Purpose |
|----------|-------|---------|
| `ALLY_SENTIMENT_THRESHOLD` | `0.35` | `relates_to.sentiment` at or above this counts as an ally signal |
| `ENEMY_SENTIMENT_THRESHOLD` | `-0.35` | `relates_to.sentiment` at or below this counts as an enemy signal |
| `OUTNUMBERED_MARGIN` | `1` | `outnumbered` requires `enemyCount > allyCount + OUTNUMBERED_MARGIN` (one-enemy-past-parity) |

Calibration notes (for CC):
- `0.35` is chosen because `RelatesToEdgeProperties.sentiment` ranges −1..+1 with neutral at 0. 0.35 puts the threshold roughly at "noticeable warmth / noticeable coldness" without demanding "devoted ally / sworn enemy". We can tighten after real encounter telemetry lands.
- `OUTNUMBERED_MARGIN = 1` preserves the existing formula semantics. A 2-vs-2 scene is *not* outnumbered. A 3-vs-1 scene *is* outnumbered.

### 4.5 Traces

**No new trace type.** Rationale: `buildPredicateContext` is a pure read; adding per-call traces would flood the buffer. The downstream `effect_applied` / `effect_skipped` traces (emitted by the effect resolver when a `when:` predicate decides the fate of an effect) already capture the observable outcome.

**Debug bridge (optional, not required to close the issue).** Expose a dev-only inspector:

```ts
window.__DEBUG.inspectPredicateContext(agentId: string): PredicateContext
```

Implemented in `src/debug-bridge.ts` by calling `buildPredicateContext(state.graph, agentId)`. This lets the user run `window.__DEBUG.inspectPredicateContext('agent-foo')` and see exact ally/enemy counts for one agent on demand. CC can defer this to a follow-up if the test suite already covers the behaviour.

### 4.6 Fail-soft table

| Failure mode | Behaviour |
|--------------|-----------|
| Agent has no `located_at` edge | `allyCount = 0`, `enemyCount = 0`, `alone = true`, `outnumbered = false` |
| Co-located edge's `source` actor node missing | Skip that entry, continue the loop |
| Actor has no `factionId` property | Skip the faction step; fall through to step 3 and then neutral |
| `relates_to` edge missing a `sentiment` property | Treat as `0` → neutral contribution |
| Both actors factionless, no `relates_to` between them | Classify as neutral → does not count as ally or enemy |
| Cyclic / malformed graph (missing target node on a `relates_to` edge) | Skip the edge, continue |

The helper never throws. Every early return falls through to neutral.

### 4.7 Test plan

New file: `src/engine/effects/__tests__/effectPredicates.alone-outnumbered.test.ts`.

Contract-level cases:

1. **Agent alone at a location** → `allyCount=0`, `enemyCount=0`, `alone=true`, `outnumbered=false`.
2. **Agent with 2 same-faction co-located actors, no opposing faction or negative `relates_to`** → `allyCount=2`, `enemyCount=0`, `alone=false`, `outnumbered=false`.
3. **Agent with 1 same-faction ally + 3 hostile-faction co-located (faction-to-faction `relates_to.sentiment = -0.6`)** → `allyCount=1`, `enemyCount=3`, `alone=false`, `outnumbered=true` (3 > 1+1).
4. **Parity scene** — 2 allies vs 2 enemies → `alone=false`, `outnumbered=false`.
5. **Neutral-only co-location** — 2 factionless strangers, no `relates_to` → `allyCount=0`, `enemyCount=0`, `alone=false`.
6. **Sub-location isolation** — actor at sublocation `S`, another actor at parent location `L` (different node) → `alone=true`. Regression guard for the three-tier model.
7. **Self-exclusion** — actor's own incoming `located_at` edge must not be counted.
8. **Direct edge overrides faction** — same `factionId` but direct `relates_to.sentiment = -0.9` between them → classify as enemy.
9. **Bidirectional sentiment** — hostile sentiment only on the incoming edge (`other → self`), outgoing edge absent → still classifies as enemy.
10. **Fail-soft: stale co-located edge with missing source node** → loop continues; final counts unaffected.
11. **Fail-soft: agent has no `located_at` edge** → `alone=true`, `outnumbered=false`, no throw.

Add one **integration-shaped** case in the existing predicate suite: evaluate an effect with `when: 'outnumbered'` against a predicate context built from a fixture world; confirm the effect fires only in the outnumbered case. This guards the wiring from `buildPredicateContext` → `evaluatePredicate` → effect resolver.

## 5. Content Pillar

### 5.1 Verification pass

Source audit (2026-04-18): `grep -rn "when:.*'alone'\|when:.*'outnumbered'\|when:\"alone\"\|when:\"outnumbered\"" src/data/encounters/` returned **zero matches**. No existing template breaks. No regression risk in content.

### 5.2 Systemic wiring guide update

Add an entry in `Docs/plans/2026-04-16-systemic-wiring-guide.md` under the engine capabilities section:

> **`alone` and `outnumbered` predicates.** Evaluate to true against the actor's co-located actors — same `located_at` target node. An *ally* is another actor with either (a) a direct `relates_to.sentiment ≥ +0.35` in either direction, (b) the same top-level `factionId`, or (c) an inter-faction `relates_to.sentiment ≥ +0.35` between their factions. An *enemy* uses the same rules with `sentiment ≤ −0.35`. `alone` = no co-located allies or enemies. `outnumbered` = `enemies > allies + 1`. Faction-less strangers count as neither. Sublocations and parent locations are *different* scenes; an agent at a sublocation is alone with respect to the parent location.

This keeps content authors from reinventing the wheel or writing hardcoded `actorCount` reach-arounds.

### 5.3 Content opportunities (not in scope)

Three templates that would exercise the primitive, filed as follow-ups if/when authoring bandwidth allows:

- **Last Stand** — duel encounter with `when: 'outnumbered'` granting a `resolve_bonus` effect.
- **Lone Walk** — social exploration encounter gated on `when: 'alone'` for a reflective prose branch.
- **Party Strength** — battle encounter where a morale effect only fires `when: 'alone' === false && allyCount >= 2` (needs the future `ally_count_above:` predicate; track separately).

These stay out of THR-144 to keep the issue bounded.

## 6. UI Pillar

### 6.1 DebugPanel

DebugPanel already renders `PredicateContext` dumps for condition-gated effects (see `DebugPanel.tsx` predicate tree rows). With `allyCount` and `enemyCount` added to the context, the values surface for free through the existing renderer — no DebugPanel change needed unless the existing view has a hand-picked list of fields. CC should **confirm** by opening the debug panel against a scene with co-located actors and taking one screenshot; if the counts are not visible, add them to the fields list in `DebugPanel.tsx` (single-line change).

### 6.2 Player-facing UI

**N/A.** `alone` and `outnumbered` gate effects; their visible consequence is the encounter's own narrative / aftermath prose, which existing encounter rendering handles. No new modal, toast, chronicle entry, or hex signifier.

### 6.3 Debug bridge (optional)

`window.__DEBUG.inspectPredicateContext(agentId)` (4.5 above) gives the user a CLI one-liner to spot-check a scene. Nice-to-have, not a blocker.

## 7. Wiring Checklist

Run against `Docs/plans/wiring-checklist.md`:

- [x] **Orchestrator phase.** No new phase; `phaseEncounterResolution` and `phaseEncounterAftermath` already invoke `buildPredicateContext`. ✅ Covered by the existing entry.
- [x] **UI component.** DebugPanel auto-renders the new context fields. Add explicit field mapping if current view uses a whitelist (CC to verify in one check).
- [x] **GameState field.** None added. Counts are derived, not stored.
- [x] **Trace category.** None added. Existing `effect_applied` / `effect_skipped` carry the story.
- [x] **Debug visibility.** `PredicateContext` dump shows counts; optional `window.__DEBUG.inspectPredicateContext`.
- [x] **Prose pipeline.** N/A — no new enrichment placeholders.
- [x] **Player controls.** N/A.

No update required to `wiring-checklist.md` itself.

## 8. Definition of Done (delta from project default)

Standard DoD applies. Additions specific to this issue:

- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated with the entry from §5.2.
- [ ] `src/data/effect-constants.ts` exports the three constants.
- [ ] `PredicateContext` (in `src/types/effects.ts`) has `allyCount` and `enemyCount` fields.
- [ ] Unit tests from §4.7 all pass.
- [ ] Confirm zero existing content usages: re-run the grep from §5.1 as part of review.
- [ ] Commit message body includes `Fixes THR-144`.
- [ ] Codex review is **not** required (see coordination block).

## 9. NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | Three constants live in `effect-constants.ts` (`ALLY_SENTIMENT_THRESHOLD`, `ENEMY_SENTIMENT_THRESHOLD`, `OUTNUMBERED_MARGIN`) |
| 2. Inspectability | PASS | `PredicateContext` exposes raw counts; downstream effect traces show outcomes |
| 3. Determinism | PASS | Pure graph traversal, no RNG, stable ordering via graph edge insertion order |
| 4. Fail-soft | PASS | Every missing edge/node path returns neutral or zero; helper never throws |
| 5. Narrative over mechanical | PASS with note | Predicate is structural; narrative impact lives in the encounter/attachment content that gates on it (tracked as content follow-ups, not blocking) |
| 6. Additive | PASS | New helper file, two constants, two `PredicateContext` fields; no removals, no signature changes |
| 7. Performance | PASS | O(N · E) per call with N typically < 10 and E ≤ 2; only runs when a conditional effect with `when:` is evaluated |

## 10. Three-Pillar Summary

| Pillar | Status | Deliverable |
|--------|--------|-------------|
| Engine | PRIMARY | `classifyCoLocatedActor` helper + wiring in `buildPredicateContext` + `PredicateContext` shape change + constants + tests |
| Content | VERIFICATION + DOCS | Confirm zero existing usages; add entry to systemic wiring guide |
| UI | MINIMAL | DebugPanel auto-reflects via context dump; optional `window.__DEBUG.inspectPredicateContext` |

## 11. Risks and Open Questions

1. **Threshold calibration.** `±0.35` is an educated guess. If the first encounters that use these predicates fire too liberally or never, retune. Tracked by the fact that the numbers are named constants (NFP #1).
2. **Bidirectional relates_to ambiguity.** When outgoing self→other and incoming other→self have opposite sentiments, the helper picks outgoing first. Acceptable for v1; if edge cases bite, upgrade to max-absolute-value or most-recent-updatedTick. Not a blocker.
3. **Sub-faction alignment.** Guild-inside-house chains need the `member_of` walk, not the `factionId` property. v1 ignores this; a sub-faction helper is a separate ticket if content demands it.
4. **Hex-level co-location not covered.** If a design later wants "outnumbered on this hex" (including actors at other sublocations), add a distinct predicate (`outnumbered_on_hex`). Do not redefine `outnumbered`.
