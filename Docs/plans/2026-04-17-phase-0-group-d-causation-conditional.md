# Phase 0 Group D — Causation and Conditional Aftermath (THR-116)

**Date:** 2026-04-17
**Status:** Design complete — Ready for Dev
**Parent plan:** `Docs/plans/2026-04-16-encounter-template-migration.md` (Group D, items 9–11)
**Issue:** THR-116
**Project:** Encounter Format Migration
**Siblings (mutex):** THR-114 (Group B multi-target), THR-115 (Group C world-shaping), THR-117 (Group E wound system)

## 1. Problem Statement

The encounter aftermath system currently fires every effect unconditionally the moment a reaction is selected, and leaves no trace of which prior encounter set up a later one. That produces two concrete gaps:

1. **No causation record.** When an encounter seed fires a follow-up encounter, the follow-up has no edge back to the originating encounter event. Prose, resolvers, and the debug panel cannot say *"this is the echo of what you did three ticks ago."* Downstream content (`{cause:label}` enrichment, "in response to" resolver decisions, callback vignettes) has nothing to query.
2. **No conditional firing.** An aftermath template that wants *"if the faction is now in enemy territory, inflict a wound; otherwise whisper a rumour"* must be split into two separate reactions with artificial selection logic upstream. Encounter authors are forced to push branching into the reaction-picker, which is not where branching belongs.
3. **Threads are un-reachable from aftermath.** Ascendant → mortal `thread` edges (the protagonist portfolio) can be created, listed, and severed from dedicated thread systems, but an encounter outcome cannot strengthen, weaken, break, or branch a thread. Every meaningful arc beat — "the seer stops answering your call," "the disciple becomes your new anchor" — currently has to be simulated by other effects (recent events, rumours) rather than structurally.

Group D addresses all three gaps in one pass because they share the same shape: they extend the effect list on `EncounterAftermathReactionEffect` and the same graph edges, and they all need to land before Phase 1 encounter authors start writing consequence chains.

## 2. Goals and Non-Goals

**Goals**
- Record a structural causation link every time a seeded encounter fires.
- Gate individual aftermath effects on live world state, using the same predicate grammar encounter authors already see in `EffectPredicate`.
- Give aftermath effects four verbs for thread mutation: strengthen, weaken, break, branch.
- Surface all three in traces and the debug panel so we can inspect them the same tick they fire.

**Non-Goals (deferred past this issue)**
- Arbitrary predicate expressions (AND/OR/NOT trees). We ship a flat predicate; composition is Group F territory if authoring demand appears.
- Two-hop causation queries ("encounters caused by encounters caused by X"). We ship the edge; aggregation is a resolver problem.
- Thread-branch UX beyond a trace + narrative event. The ThreadsPanel refresh is in scope; any "choose which branch" modal is deferred.
- Predicate evaluation inside `encounter_seed` fire-time. Seeds already have their own eligibility and busy-check logic; adding `when` there doubles the surface without solving an authoring problem we hit.

## 3. Load-Bearing Constraints

Reaffirming the load-bearing decisions this design honours:

- **Everything is a graph node/edge.** Causation is an edge, not a property bag lookup. (From `CLAUDE.md` load-bearing decisions.)
- **No inventing node types without verification.** Causation targets existing `event` and `action_template` nodes and an existing seed record; no new node type. (Verified against `src/types/graph.ts`.)
- **Relationships between entities are graph edges, not property fields.** `caused_by` and thread mutations go through edges, not string IDs in properties.
- **Predicates are observable and side-effect-free.** `when` must read state; it must not call into resolvers, RNG, or tick phases.
- **Fail-soft.** Unknown predicate → false, skip effect, emit trace. Unknown thread target → skip effect, emit trace. Never throw from aftermath.

## 4. Engine Design

### 4.1 New edge type: `caused_by`

Add one entry to `EdgeType` in `src/types/graph.ts`:

```ts
| 'caused_by'          // event → event/seed (this encounter was set up by that one)
```

**Semantics.** Source is the new `event` node produced when a seeded encounter fires (or, for non-seeded chains, the new action's creation event). Target is the originating `event` node — the encounter that planted the seed. The edge is created exactly once when the seed actually fires (inside `encounterSeeding.ts`), never speculatively when the seed is planted.

**Why not reuse an existing edge type.** Checked every entry in `src/types/graph.ts`:
- `thread` is ascendant → mortal, semantically unrelated.
- `participated_in` and `occurred_at` are participant edges on resolved events, not causation.
- No `seeded_by` or `in_response_to` exists.

Adding `caused_by` is the minimal new edge. The parent design doc floated `seeded_by` and `in_response_to` as alternatives; the simpler single edge type wins on NFP #6 (additive over destructive) and on query cost — resolvers can ask "what caused this?" with one edge walk.

**Edge properties.**

```ts
properties: {
  seedId: string;               // The PendingEncounterSeed.seedId that fired
  seedLabel: string;            // Human-readable label copied off the seed
  sourceReactionId: string;     // EncounterAftermathReaction.id that planted it
  plantedTick: number;
  firedTick: number;
  ticksBetween: number;         // firedTick - plantedTick (convenience for resolvers)
  family?: string;              // encounterFamily, if seeded by family
  templateId?: string;          // resolvedTemplateId, if seeded by template
}
```

All fields are already present on `PendingEncounterSeed`. Copying them onto the edge is intentional — resolvers should not have to cross-reference a transient pending list to answer "what originally caused this encounter?"

**Creation site.** `evaluateEncounterSeeds()` in `src/engine/encounterSeeding.ts`. Each of the three `encounter_seed_triggered` emission points (template-spawn at line 81, family-narrative at line 113, discard at line 137) gets a paired `graph.addEdge('caused_by', ...)` call in the `'fired'` branches only. `'discarded'` does not create an edge — the follow-up encounter never existed.

**Circular causation guard.** Seeds are planted by an aftermath reaction on some encounter *E₁*, and the seed fires by creating a new encounter *E₂*. *E₂*'s resolution may plant a seed that fires *E₃*. Each `caused_by` edge points backward exactly once, so the graph is a DAG by construction — no cycle prevention logic needed. The trace record does include `ticksBetween` so excessive chains are visible.

**Versioning.** `caused_by` edge creation calls `touchWorld(runtime)`. It is not structurally relevant to the distance matrix, so `touchStructure()` is *not* called. (Per the load-bearing rule: "both tick phases and UI hooks must use the same touch API.")

### 4.2 `when` predicate on aftermath effects

Extend `EncounterAftermathReactionEffect` in `src/types/unifiedAction.ts` with one optional field on every variant:

```ts
readonly when?: EffectPredicate;
```

`EffectPredicate` is the string-DSL type already exported from `src/types/effects.ts` and consumed by `src/engine/effects/effectPredicates.ts`. Reusing it rather than inventing a parallel grammar is the core move — encounter authors already know `biome:X`, `has_trait:X`, `reach_above:R:T`, `faction_rank:N`, and the simple literals (`in_combat`, `alone`, `near_water`, etc.).

**Evaluation.** Before `applyEncounterAftermathReaction` dispatches to the per-kind handler, it calls:

```ts
if (effect.when) {
  const ctx = buildPredicateContext(graph, targetAgentId, undefined, action?.templateId);
  const passed = evaluatePredicate(effect.when, ctx);
  if (!passed) {
    emitTrace({ tick, category: 'aftermath_effect_skipped_by_when', ... });
    continue; // skip this effect, proceed to next
  }
  emitTrace({ tick, category: 'aftermath_effect_when_passed', ... }); // verbose tier only
}
```

The `targetAgentId` passed into `buildPredicateContext` is the resolved aftermath target (from `resolveAftermathTarget`), falling back to `action.actorId` when the target is `actor_fallback`. This guarantees that predicates like `has_trait:veteran` or `in_enemy_territory` reference the entity the effect is about, not some unrelated actor.

**Context gaps.** `buildPredicateContext` in its current form does not know about:
- Hidden marks on an agent (`has_mark:bloodprice`)
- Intelligence records held by an agent (`has_intel:military`)
- Reputation score vs. threshold (`reputation_above:0.6`)
- Faction control of a location (`faction_controls:loc-id`)

We extend `PredicateContext` and `buildPredicateContext` with five new fields and add five new parameterised predicate handlers:

| Predicate | Context field | Evaluator |
|---|---|---|
| `has_mark:<category>` | `hiddenMarkCategories: Set<HiddenMarkCategory>` | `ctx.hiddenMarkCategories.has(category)` |
| `has_intel:<category>` | `intelCategories: Set<IntelligenceCategory>` | `ctx.intelCategories.has(category)` |
| `reputation_above:<float>` | `reputationScore: number` | `ctx.reputationScore > threshold` |
| `reputation_below:<float>` | (same field) | `ctx.reputationScore < threshold` |
| `faction_controls:<locationId>` | `controlledLocations: Set<string>` (faction's) | `ctx.controlledLocations.has(locId)` |

All five are observable, deterministic, and free of RNG. `has_mark` reads `state.hiddenMarks` filtered by target; `has_intel` reads `state.intelligenceRecords`; `reputation_above/below` reads the target node's `properties.reputationScore` with `DEFAULT_REPUTATION` fallback; `faction_controls` reads outgoing `controls` edges from the agent's `factionId`.

The predicate grammar stays flat — no AND/OR/NOT. If an author needs a disjunction, they write two effects with mutually exclusive `when` predicates. This is the decision that keeps this issue size M rather than L; Group F can revisit composition if authoring demand shows up.

**Backwards compatibility.** `when` is optional. Every existing effect without `when` behaves identically to today. NFP #6 satisfied.

### 4.3 Four new effect kinds: `thread_strengthen`, `thread_weaken`, `thread_break`, `thread_branch`

Add four variants to the `EncounterAftermathReactionEffect` union:

```ts
| {
    readonly kind: 'thread_strengthen';
    readonly ascendantId: string;       // source of the thread edge
    readonly mortalId: string;          // target of the thread edge
    readonly delta?: number;            // default: THREAD_STRENGTHEN_DEFAULT
    readonly reason?: string;           // narrative label, stored on the edge
    readonly when?: EffectPredicate;
  }
| {
    readonly kind: 'thread_weaken';
    readonly ascendantId: string;
    readonly mortalId: string;
    readonly delta?: number;            // default: THREAD_WEAKEN_DEFAULT (positive; applied as subtraction)
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
| {
    readonly kind: 'thread_break';
    readonly ascendantId: string;
    readonly mortalId: string;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
| {
    readonly kind: 'thread_branch';
    readonly ascendantId: string;
    readonly sourceMortalId: string;    // existing thread recipient
    readonly newMortalId: string;       // new thread recipient
    readonly initialStrength?: number;  // default: THREAD_BRANCH_INITIAL_STRENGTH
    readonly reason?: string;
    readonly when?: EffectPredicate;
  };
```

**Strengthen / weaken.** Find the `thread` edge between `ascendantId` and `mortalId` (check once via `graph.getEdges(source: ascendantId, target: mortalId, type: 'thread')`), adjust `properties.strength` by ±delta, clamp to `[0, THREAD_STRENGTH_MAX]`. If the edge does not exist, fail soft: emit `thread_mutation_skipped` trace with reason `edge_missing`, continue.

**Break.** Remove the `thread` edge entirely. If no edge exists, fail soft with `edge_missing`. Emits a `TickEvent` of type `narrative` so the UI can surface the severance.

**Branch.** Leave the existing thread edge alone (it already exists to `sourceMortalId`). Add a new `thread` edge from `ascendantId` to `newMortalId` with `properties.strength = initialStrength`, and add a `properties.branchedFromMortalId = sourceMortalId` crumb on the new edge so resolvers can walk the branch history. If the source edge does not exist, fail soft (can't branch from nothing).

**Target fallbacks.** All four kinds require explicit `ascendantId` and `mortalId`. No `actor_fallback` behavior — thread mutations are too surgical to guess targets. If either field is missing or refers to a non-existent node, emit `thread_mutation_skipped` trace and continue.

**All four emit:**

```ts
emitTrace({
  tick,
  category: 'thread_mutation_applied',
  actionId,
  encounterId,
  reactionId: reaction.id,
  effectKind: effect.kind,
  ascendantId,
  mortalId,
  before: { strength?: number, existed: boolean },
  after:  { strength?: number, existed: boolean },
  delta,
  reason,
  summary,
});
```

`touchWorld(runtime)` after every successful thread mutation. `thread_break` with a live edge may also need `touchStructure()` if any structural selector cares — check `useAgentInteraction` / `useProtagonistPortfolio` selectors; if they key on `worldVersion`, `touchWorld` is sufficient. (Per the load-bearing rule: "over-invalidate is fine, under-invalidate is a bug.")

### 4.4 Constants

Add to `src/data/effect-constants.ts` (already exists and already exports `HEALTH_LOW_THRESHOLD`, `HEALTH_HIGH_THRESHOLD`):

| Constant | Default | Purpose |
|---|---|---|
| `THREAD_STRENGTHEN_DEFAULT` | `0.15` | Default strength delta for `thread_strengthen` when effect omits it. |
| `THREAD_WEAKEN_DEFAULT` | `0.2` | Default strength delta for `thread_weaken`. Slightly higher than strengthen — weakening is narratively sharper. |
| `THREAD_BRANCH_INITIAL_STRENGTH` | `0.3` | Starting strength on a newly-branched thread. |
| `THREAD_STRENGTH_MAX` | `1.0` | Clamp ceiling for thread.properties.strength. |
| `THREAD_STRENGTH_MIN` | `0.0` | Clamp floor. |
| `CAUSATION_EDGE_RETENTION_TICKS` | `0` (indefinite) | Future GC for `caused_by` edges. Zero means never GC in v1. |

Every number tunable by editing one file. NFP #1 satisfied.

### 4.5 Traces emitted

All new categories, fully typed. Add interfaces to `src/types/traces.ts` (or the local category file per existing convention):

```ts
interface CausationEdgeCreatedTrace {
  category: 'causation_edge_created';
  tick: number;
  sourceEventId: string;      // the new encounter's event node
  causedByEventId: string;    // the original encounter's event node
  seedId: string;
  seedLabel: string;
  ticksBetween: number;
  summary: string;
}

interface AftermathEffectSkippedByWhenTrace {
  category: 'aftermath_effect_skipped_by_when';
  tick: number;
  actionId: string;
  encounterId: string;
  reactionId: string;
  effectKind: EncounterAftermathReactionEffect['kind'];
  predicate: string;          // the when string as authored
  targetEntityId: string;     // resolved target
  contextSnapshot: {          // minimal snapshot, truthy fields only
    biome?: string;
    inCombat?: boolean;
    inEnemyTerritory?: boolean;
    healthLow?: boolean;
    hiddenMarkCategories?: string[];
    intelCategories?: string[];
    reputationScore?: number;
  };
  summary: string;
}

interface AftermathEffectWhenPassedTrace {
  category: 'aftermath_effect_when_passed';
  // same fields as skipped, minus 'predicate passed' difference
  // Verbose-tier only — gated by debug verbose flag to avoid trace flood
}

interface ThreadMutationAppliedTrace {
  category: 'thread_mutation_applied';
  tick: number;
  actionId: string;
  encounterId: string;
  reactionId: string;
  effectKind: 'thread_strengthen' | 'thread_weaken' | 'thread_break' | 'thread_branch';
  ascendantId: string;
  mortalId: string;
  before: { strength?: number; existed: boolean };
  after: { strength?: number; existed: boolean };
  delta?: number;
  reason?: string;
  summary: string;
}

interface ThreadMutationSkippedTrace {
  category: 'thread_mutation_skipped';
  tick: number;
  actionId: string;
  encounterId: string;
  reactionId: string;
  effectKind: 'thread_strengthen' | 'thread_weaken' | 'thread_break' | 'thread_branch';
  ascendantId: string;
  mortalId: string;
  reason: 'edge_missing' | 'node_missing' | 'invalid_target';
  summary: string;
}
```

Register the five categories in the DebugPanel trace category filter (`src/components/DebugPanel/categories.ts` or equivalent — see wiring section).

### 4.6 Fail-soft table

| Failure case | Behavior | Trace |
|---|---|---|
| `when` predicate is unknown string | Treat as false (existing `evaluatePredicate` behavior). Effect skipped. | `aftermath_effect_skipped_by_when` with `predicate` field |
| `when` predicate passed but context could not be built (no agent node) | Skip effect. | `aftermath_effect_skipped_by_when` with `reason: 'context_unavailable'` field |
| `caused_by` creation: source or target event node missing | Skip edge creation. Still fire the follow-up encounter. | `causation_edge_creation_skipped` with `reason` |
| `thread_strengthen/weaken` target edge missing | No-op. | `thread_mutation_skipped` `reason: 'edge_missing'` |
| `thread_break` target edge missing | No-op. | `thread_mutation_skipped` `reason: 'edge_missing'` |
| `thread_branch` source edge missing | No-op (can't branch from nothing). | `thread_mutation_skipped` `reason: 'edge_missing'` |
| `thread_branch` new mortal node missing | No-op. | `thread_mutation_skipped` `reason: 'node_missing'` |
| Any unrecognised effect kind (e.g. loaded from newer save) | Existing default-case skip — unchanged. | `encounter_aftermath_effect` `outcome: 'unknown_kind'` |

No throw paths added. NFP #4 satisfied.

### 4.7 Determinism

All three changes read graph state or predicate state only. No RNG consumed. Thread mutations are deterministic graph writes. Predicate evaluation is pure. Causation edges are written at the same moment as the pre-existing `encounter_seed_triggered` trace, so no new nondeterminism enters the pipeline. NFP #3 satisfied.

## 5. Content Design

Three authoring capabilities unlocked, with concrete example snippets.

### 5.1 `when`-gated effects

**Example: betrayal-only reputation spike.** Currently, a "you spared my life" aftermath hands out `reputation_score +0.1` to the sparing actor. With `when`, the same reaction can tack on "but if the spared agent is a known oathbreaker, also plant a hidden mark for later betrayal":

```ts
effects: [
  { kind: 'reputation_score', targetAgentId: '$target', delta: 0.1 },
  {
    kind: 'hidden_mark',
    category: 'bloodprice',
    severity: 0.6,
    label: 'Spared a known oathbreaker',
    targetAgentId: '$actor',
    when: 'has_trait:oathbreaker',
  },
],
```

The author writes one reaction with two effects instead of two reactions and a pre-filter. That's the whole ergonomics win.

**Example: territory-conditional wound.** "If the loser is in enemy territory, their rout is catastrophic; otherwise they merely retreat":

```ts
effects: [
  {
    kind: 'apply_condition',
    conditionTraitId: 'condition.wounded.deep',
    durationTicks: 20,
    targetAgentId: '$loser',
    when: 'in_enemy_territory',
  },
  {
    kind: 'apply_condition',
    conditionTraitId: 'condition.wounded.light',
    durationTicks: 8,
    targetAgentId: '$loser',
    when: 'at_home_territory',
  },
],
```

**Example: biome-conditional intel.** "If the scouting happened near water, the scout learns where the smugglers land":

```ts
effects: [
  {
    kind: 'intelligence',
    category: 'smuggling_routes',
    label: 'Coastal landing point',
    detail: 'The cove north of the lighthouse.',
    targetAgentId: '$actor',
    when: 'near_water',
  },
],
```

### 5.2 Thread-mutation effects

**Example: disciple deepens bond.** A successful ritual deepens the ascendant's tie to the disciple:

```ts
effects: [
  {
    kind: 'thread_strengthen',
    ascendantId: '$ascendant',
    mortalId: '$actor',
    delta: 0.2,
    reason: 'Completed the ritual of anchoring',
  },
],
```

**Example: betrayal weakens thread.** The disciple acts against the ascendant's interest:

```ts
effects: [
  {
    kind: 'thread_weaken',
    ascendantId: '$ascendant',
    mortalId: '$actor',
    delta: 0.25,
    reason: 'Broke the prohibition',
  },
],
```

**Example: thread breaks at apostasy.** Triggered by a `when` predicate on reputation:

```ts
effects: [
  {
    kind: 'thread_break',
    ascendantId: '$ascendant',
    mortalId: '$actor',
    reason: 'Final rejection',
    when: 'reputation_below:0.15',
  },
],
```

**Example: thread branches to heir.** The dying disciple names an heir, creating a new thread:

```ts
effects: [
  {
    kind: 'thread_branch',
    ascendantId: '$ascendant',
    sourceMortalId: '$dying_disciple',
    newMortalId: '$named_heir',
    initialStrength: 0.35,
    reason: 'Named heir at the deathbed',
  },
  {
    kind: 'thread_break',
    ascendantId: '$ascendant',
    mortalId: '$dying_disciple',
    reason: 'Death',
  },
],
```

### 5.3 Causation-aware prose

Expose two new enrichment placeholders on `enrichProse()` (the prose-pipeline enrichment context already walks outgoing edges from the current event; `caused_by` becomes the edge it checks):

| Placeholder | Resolves to |
|---|---|
| `{cause:label}` | `seedLabel` from the `caused_by` edge properties. Empty string if no cause. |
| `{cause:ticksAgo}` | `ticksBetween` from the edge, rendered as "three ticks ago" / "long ago" per tier table in `prose-vignettes-and-enrichment`. |

**Example prose in an encounter template:**

> "{name} feels the echo of {cause:label}. It was {cause:ticksAgo}. The world is still listening."

If the encounter was not caused by another, both placeholders resolve to empty, and an existing fallback elides the sentence (existing enrichment pipeline handles empty-placeholder suppression — no new code path).

Authors writing seeded follow-up encounters now have a vocabulary for "this is the echo of" prose without hardcoding the seed label in every template variant.

### 5.4 Predicate naming hygiene

Encounter authors currently have sixteen predicate literals to memorise. We are adding five parameterised ones. To keep the skill manageable:

- All five new predicates follow the existing `noun:param` pattern (`has_mark:X`, `has_intel:X`, `reputation_above:X`, `reputation_below:X`, `faction_controls:X`).
- The `prose-content-systems` skill gets a new section "conditional effects" with the full predicate list and one example per category, replacing the current scattered references.
- The `encounter-pipeline` 4-pass flow adds a `when` audit to the systems-audit pass: if any effect's `when` references an unknown predicate, flag it. (Authoring catch, not runtime — runtime is still fail-soft.)

## 6. UI Design

### 6.1 DebugPanel — trace categories

Five new trace categories registered and filterable in the DebugPanel's Traces tab:

- `causation_edge_created`
- `aftermath_effect_skipped_by_when`
- `aftermath_effect_when_passed` (default-off — verbose tier)
- `thread_mutation_applied`
- `thread_mutation_skipped`

Category colouring follows the existing category→colour map. "aftermath_*" and "thread_*" share a colour group with the existing aftermath traces so filter-by-colour still works.

Each trace row renders `summary` as the one-line description; expanding the row shows the typed payload (already how the DebugPanel renders all traces).

### 6.2 ThreadsPanel — surface mutations

`src/components/ThreadsPanel.tsx` already reads the live graph and renders the ascendant's threads with strength bars. Two additions:

1. **Animated strength change.** When `thread_mutation_applied` fires on a thread the panel is showing, the strength bar animates from `before.strength` to `after.strength` over 400 ms. Implementation: ThreadsPanel already re-renders on `worldVersion` bump; we add a `framer-motion` animated width transition on the bar (framer-motion is already a dependency — verify in package.json before implementing). If not already a dep, use a CSS transition on the width property — same visual, zero new dependency.
2. **"Thread severed" toast.** `thread_break` emits a `TickEvent` of type `narrative` — the existing EventFeed / toast system picks that up automatically. No new UI wiring. Copy authored by encounter content, not by engine code.

**Thread branch rendering.** Newly-branched threads appear in the panel the tick they're created. No special UI treatment in v1 — they're just a new row. A future enhancement could visually link branched threads to their parent via an indent or connector line; filed as deferral, not in this issue.

### 6.3 Encounter stage — causation breadcrumb (deferred)

The "echo of past encounters" UX — a small breadcrumb at the top of the encounter stage showing "caused by: [prior seed label] · [N] ticks ago" — is **deferred to a separate follow-up issue** (open a THR on accept, title: "Encounter stage: causation breadcrumb UI"). Rationale:

- The engine write and `{cause:label}` enrichment are in scope and unblock the content pillar.
- The stage-level UI element needs interaction design (clickable? navigable to the prior event? hover preview?) that doesn't belong in a causation-plumbing issue.
- Deferring keeps THR-116 size M. Bundling expands to L territory.

This is the only UI element we defer. All in-scope UI (DebugPanel, ThreadsPanel, toast) is covered above.

### 6.4 Player control

No new player-facing controls in this issue. All three capabilities are authoring-side; the player interacts with them via encounter outcomes as normal.

## 7. Wiring

Cross-reference `Docs/plans/wiring-checklist.md` before merging. Each row below must be live before this issue closes.

| Module / Surface | Wired at |
|---|---|
| `caused_by` edge creation | `src/engine/encounterSeeding.ts` — both `'fired'` branches (template spawn, family narrative). Add `graph.addEdge` + `touchWorld(runtime)` + `emitTrace('causation_edge_created')`. |
| `when` evaluation | `src/engine/encounterAftermath.ts` — inside `applyEncounterAftermathReaction`, before the per-kind switch, new pre-dispatch block calling `evaluateOptionalCondition(effect.when, ctx)`. |
| Predicate context extensions | `src/engine/effects/effectPredicates.ts` — extend `PredicateContext`, extend `buildPredicateContext` to populate 5 new fields, extend `evaluatePredicate` to handle 5 new prefixes. |
| Thread effect handlers | `src/engine/encounterAftermath.ts` — four new `case` branches in the effect-kind switch. Each walks the graph, checks target presence, mutates edge properties or adds/removes edges, emits trace, calls `touchWorld(runtime)`. |
| Trace type registrations | `src/types/traces.ts` (or the category file) — add the 5 new interfaces to the trace union. |
| DebugPanel category filter | `src/components/DebugPanel/*` — register 5 new categories in the filter list. |
| ThreadsPanel strength transition | `src/components/ThreadsPanel.tsx` — CSS/framer-motion transition on strength bar. |
| Prose enrichment placeholders | `src/engine/prose/enrichment.ts` (or equivalent) — `{cause:label}` and `{cause:ticksAgo}` resolvers walk outgoing `caused_by` edge from the current event node. |
| Constants | `src/data/effect-constants.ts` — add 6 new constants. |
| Tests | See §10 Testing. |

The issue is not "done" (per `Definition of Done` in CLAUDE.md) until every row is green.

## 8. NFP Compliance

| NFP | Status | Notes |
|---|---|---|
| 1. Tunability | **PASS** | All numbers named in `src/data/effect-constants.ts`. |
| 2. Inspectability | **PASS** | Five new trace categories, typed interfaces, DebugPanel filter registration. Every skip path emits a trace. |
| 3. Determinism | **PASS** | No RNG consumed. Predicates are pure reads. Thread mutations are deterministic graph writes. Causation edges are written at the same site as existing deterministic traces. |
| 4. Fail-soft | **PASS** | Full fail-soft table in §4.6. Every new failure mode returns a trace-emitting skip, never a throw. |
| 5. Narrative over mechanical perfection | **PASS** | The thread effect set is authored in service of narrative beats (deepen, sever, branch). `{cause:label}` exists to let prose reach back to prior events. |
| 6. Additive over destructive | **PASS** | Every change is additive: one new edge type, one new optional field, four new effect kinds, five new predicate prefixes, five new trace categories. No existing types altered. No existing field removed. No existing behavior changed. |
| 7. Performance budget | **PASS with note** | Predicate evaluation per effect adds one `buildPredicateContext` + one `evaluatePredicate` call per `when`-gated effect per aftermath resolution. Aftermath is an infrequent path (per-encounter-resolution, not per-tick-agent). Context build is O(agent's edges). Worst case: a 20-effect reaction × 50 concurrent resolutions × small constant per predicate ≈ 1000 ops. Well under budget. No profiling needed before merging; flag if profiling later shows it. |

## 9. Rejected Approaches

- **Arbitrary boolean expressions in `when` (AND/OR/NOT trees).** Rejected: grammar creep, harder to trace, harder for content agents to author. Authors can always write two effects with mutually exclusive flat predicates. Revisit in Group F if demand appears.
- **`seeded_by` + `in_response_to` as two separate edge types.** Rejected: one edge serves both "what caused this" and "what is this in response to." The distinction is a resolver concern, not a graph concern. YAGNI.
- **Nested `EncounterAftermathReactionEffect[]` as the `when`-gated branch ("if predicate, run sub-effects").** Rejected: breaks the flat dispatch shape of `applyEncounterAftermathReaction`. Authoring benefit marginal over a flat `when` on each effect.
- **Causation stored as a property on the new event node rather than an edge.** Rejected by the load-bearing decision: "Relationships between entities are graph edges, not property fields." Causation IS a relationship between two events.
- **Thread mutation as a generic `mutate_edge` effect with edge type and delta parameters.** Rejected: too generic, no type safety for thread-specific fields (branchedFromMortalId), no trace specificity. Four purpose-built verbs are clearer for authors and more traceable for debuggers.

## 10. Testing

Contract tests required before merge (per `testing-patterns` skill):

1. **Causation edge fires on seeded spawn.** Plant a seed via `encounter_seed` effect, advance ticks past `eligibleAfterTick`, assert one `caused_by` edge exists between the new action's event node and the originating event node, with correct properties.
2. **Causation edge does not fire on discarded seed.** Plant a seed with no templateId and no family, advance ticks, assert no `caused_by` edge created, assert `encounter_seed_triggered` trace has `outcome: 'discarded'`.
3. **`when` predicate gates correctly.** Construct an aftermath reaction with two effects, one `when: 'in_combat'`, one without. Resolve in a non-combat context, assert only the non-gated effect fired, assert one `aftermath_effect_skipped_by_when` trace.
4. **Unknown predicate fails soft.** `when: 'nonsense_predicate:42'`. Assert effect skipped, trace emitted, no throw.
5. **`thread_strengthen` clamps at max.** Existing thread with strength 0.95, apply `thread_strengthen` with delta 0.2, assert resulting strength is exactly `THREAD_STRENGTH_MAX` (1.0).
6. **`thread_weaken` clamps at min.** Symmetric to above.
7. **`thread_break` removes edge.** Start with a live thread, apply break, assert edge gone, assert `thread_mutation_applied` trace, assert narrative TickEvent created.
8. **`thread_branch` creates new edge without destroying old.** Assert both edges present, assert new edge has `branchedFromMortalId` property.
9. **Thread mutation with missing target is fail-soft.** Reference a mortalId that doesn't exist. Assert `thread_mutation_skipped` trace with `reason: 'node_missing'`, no throw.
10. **Predicate context extensions populate correctly.** Seed an agent with a hidden mark in the bloodprice category, assert `has_mark:bloodprice` evaluates true for that agent.

Test files: colocate with `src/engine/encounterAftermath.test.ts` and `src/engine/encounterSeeding.test.ts` (if present; create if not).

## 11. Migration / Rollout

- All changes are additive — no save-file migration.
- Existing encounter templates unchanged by default (no `when`, no thread mutations).
- `caused_by` edges begin appearing on new saves only; old saves don't retroactively get them (intentional — `seedId` → event-node mapping from prior sessions is not reconstructible).
- Claude Code implementer should run the encounter-pipeline 4-pass audit against the authoring-pattern updates in §5 before merging content-side changes.

## 12. Out of Scope / Follow-ups

File these as separate Linear issues if/when they're needed:

- **Encounter stage causation breadcrumb UI.** Deferred per §6.3.
- **Two-hop causation resolver** (query "the chain of causes leading to this encounter"). Engine is ready; resolver is its own feature.
- **Boolean composition of `when` predicates.** Evaluate after we see 6+ months of content authoring.
- **Causation edge GC.** `CAUSATION_EDGE_RETENTION_TICKS` is 0 (indefinite) in v1. If the graph grows large on long campaigns, wire a sweep phase.
- **Thread-branch UX beyond a new row in the panel.** Visual parent→branch connector.

## 13. Suggested Implementation Order (for CC)

1. **Types first.** Extend `EdgeType`, extend `EncounterAftermathReactionEffect`, extend `PredicateContext`, add trace interfaces, add constants. Compile passes, existing tests pass.
2. **Predicate extensions.** Wire the five new parameterised predicates + context fields. Add predicate unit tests.
3. **`when` gate in aftermath.** Pre-dispatch check. Add contract tests 3, 4.
4. **Causation edges in encounterSeeding.** Add contract tests 1, 2.
5. **Four thread effect kinds.** Add to the switch. Add contract tests 5–9.
6. **Trace category registrations in DebugPanel.**
7. **ThreadsPanel transition.**
8. **Prose enrichment placeholders (`{cause:label}`, `{cause:ticksAgo}`).**
9. **Author one example encounter template using `when` + `thread_strengthen`** to prove the full authoring loop end-to-end.
10. **Integration test:** run CLI `spawn encounter`, resolve, advance ticks, `tick 30`, inspect traces via `window.__DEBUG.getTraces()`. Assert the full chain end-to-end.

Each step compiles and tests pass before moving to the next. Per `CLAUDE.md`: `npm test`, `npx tsc --noEmit`, `npx vite build`.
