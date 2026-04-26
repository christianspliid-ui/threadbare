# Phase 0 Group C — World-shaping Aftermath Effects

**Date:** 2026-04-17
**Linear:** THR-115
**Status:** Design → Ready for Dev
**Project:** Encounter Format Migration (Now, Urgent)
**Applies to:** `src/engine/encounterAftermath.ts`, `src/types/unifiedAction.ts`, `src/types/trace.ts`, `src/engine/factionNetwork.ts`, `src/engine/phaseOmenAgenda.ts`, `src/types/omen.ts`, `src/engine/graph.ts`, UI chronicle + DebugPanel
**Three pillars:** Engine (new effect kinds + graph mutations + traces), Content (author surface + wiring guide updates), UI (chronicle events + debug visibility + hex map signifier hooks)
**Parent design doc:** `Docs/plans/2026-04-16-encounter-template-migration.md` → Phase 0 Engine prerequisites → Group C

---

## Framing

Authored aftermath today can nudge reputation, plant seeds, tag gates, emit low-stakes chronicle lines, and place hidden marks and intelligence records. It cannot reshape the world. Templates that want to *create* something (an artifact that came out of a tomb), *stain* something (an atrocity that sours the regional mood), or *restructure* something (a guild that splinters after a betrayal) hit a wall.

The Encounter Format Migration design calls these out as three distinct capability gaps — the "CRUD-the-world menu." They are sized S (`spawn_artifact`), M (`emit_omen`), and L (faction-level effects). This issue ships all three behind a shared effect-kind pattern so the author-facing shape is consistent, while the engine implementations are layered and testable independently.

**The frame ("living stories in a living world") demands this.** Aftermath that cannot mutate the world cannot produce stories whose consequences persist. Hidden marks and encounter seeds plant *memory*; Group C lets aftermath plant *change*.

---

## Scope

**In scope (this issue ships all three):**

1. `spawn_artifact` — create an artifact node and an edge attaching it to an actor (`possesses`) or a location (`contains`). Optional tier + tags.
2. `emit_omen` — inject a scoped omen event that propagates through world reactions without disturbing the mandate-driven primary/secondary omens. Scope = `global` | `regional(regionId)` | `local(hexCol,hexRow)`.
3. Faction topology effects — `faction_splinter`, `faction_absorb`, `faction_dissolve`, `faction_declare_war`, `faction_force_peace`.

**Explicitly out of scope:**

- `modify_omen_intensity` on existing OmenState primary/secondary slots. Direct mutation of the ascendant-driven omen pair is reserved for engine phases (mandate, doom). Aftermath emits *regional* omens that overlay — see "Emit omen — design resolution" below.
- NPC spawn and sublocation creation. These are GraphOp helpers already reachable from engine code; their absence from aftermath is intentional until we have a narrative pattern demanding them.
- Raw GraphOp execution callable from aftermath. Authors compose from typed effect kinds only; proposing a new effect kind is the right escape hatch.
- Attachment/condition CRUD on actors. That belongs to Group B (`add_condition` / `remove_condition`, THR-114) and is already in Ready for Dev.
- `when` predicates and causation edges — Group D / THR-116.

---

## Engine Pillar

### Three new effect kinds (shared shape, independent implementations)

All three extend `EncounterAftermathReactionEffect` in `src/types/unifiedAction.ts` and are handled inside the existing `switch (effect.kind)` block in `src/engine/encounterAftermath.ts`. Each effect: (a) mutates the world graph / state, (b) emits a dedicated trace plus the existing generic `encounter_aftermath_effect` trace, (c) optionally appends a chronicle `TickEvent`, (d) fails soft per the table below.

#### 1. `spawn_artifact` (Effort: S)

```typescript
| {
    readonly kind: 'spawn_artifact';
    readonly templateId?: string;          // artifact template id from content catalog
    readonly category?: ArtifactCategory;  // fallback category if templateId not given
    readonly tier?: ArtifactTier;          // override template tier (common/shaping/legendary)
    readonly nameOverride?: string;        // narrative-specific display name
    readonly tags?: readonly string[];
    // Placement target — exactly one must resolve:
    readonly targetAgentId?: string;       // put in actor's inventory via `possesses` or `bonded_to` (legendary)
    readonly targetLocationId?: string;    // place at location via `contains`
  }
```

Resolution order for target: explicit id → `$actor` / `$ally` / `$rival` / `$witness` symbolic ref (from Group B, already landing in THR-114) → `action.actorId` default. If neither actor nor location resolves, the effect emits a `failReason: 'no_placement_target'` trace and fails soft.

Node creation uses the existing `WorldGraph.addNode()` with `type: 'artifact'` or `type: 'artifact_legendary'` per tier. Edge creation uses `addEdge()` with `type: 'possesses'` (common/shaping to any actor), `type: 'bonded_to'` (legendary), or `type: 'contains'` (any tier → location).

**Tier → node type mapping:**

| Tier | Node type | Attaching edge (to actor) | Attaching edge (to location) |
|---|---|---|---|
| `common` | `artifact` | `possesses` | `contains` |
| `shaping` | `artifact` | `possesses` | `contains` |
| `legendary` | `artifact_legendary` | `bonded_to` | `contains` |

Node id format: `artifact_spawned_${encounterId}_${reactionId}_${effectIndex}_${tick}`.

**Trace:** `artifact_spawned` (new category; see Tracing section).

**Chronicle event:** `TickEvent.type = 'narrative'`, significance 0.65, message authored by the effect (`messageOverride?: string`) or derived from the artifact name.

#### 2. `emit_omen` (Effort: M)

**Design resolution — scope channel, not mandate replacement.** The existing `OmenState` slots (`primary`, `secondary`) are driven by mandate, doom, and sphere dynamics. Aftermath should not overwrite them — a single atrocity should not blow away the ascendant's primary omen arc. Instead, aftermath emits a **regional / local / global omen event** on a new channel that propagates through existing consumers via `recentEvents` with a structured `omenEmission` payload.

```typescript
| {
    readonly kind: 'emit_omen';
    readonly category: OmenCategory;      // reuse existing: doom_echo | sphere_surge | cultural | seasonal
    readonly intensity: number;           // 0–1; drives encounter bias weight and chronicle significance
    readonly durationTicks: number;       // how long the omen stains the scope
    readonly narrativeHook: string;       // short prose, appears in chronicle + feeds enrichment {omen}
    readonly scope:
      | { readonly kind: 'global' }
      | { readonly kind: 'regional'; readonly regionId: string }
      | { readonly kind: 'local'; readonly hexCol: number; readonly hexRow: number; readonly radius?: number };
    readonly sphereAlignment?: SphereId;  // optional sphere tint — biases sphere_surge category encounters
  }
```

**State representation.** A new optional field on `GameState`:

```typescript
emittedOmens?: EmittedOmen[];

interface EmittedOmen {
  omenId: string;                 // `omen_${encounterId}_${reactionId}_${effectIndex}_${tick}`
  sourceEncounterId: string;
  sourceReactionId: string;
  category: OmenCategory;
  intensity: number;
  scope: EmittedOmenScope;
  narrativeHook: string;
  sphereAlignment?: SphereId;
  emittedTick: number;
  expiresTick: number;            // emittedTick + durationTicks
}
```

**Decay phase.** A new lightweight phase `phaseEmittedOmenDecay` runs inside the existing omen phase block (`phaseOmenAgenda` neighborhood) and removes entries where `tick > expiresTick`. No PRNG. No reordering. O(n) in active omens; expected |n| < 10.

**Consumers.** Two integration points, both additive (do not rewrite existing logic):

1. **Encounter scoring** (`src/engine/encounterScoring.ts` or `phaseAgentDecision.ts`): when scoring candidate encounters for an agent, if the agent's hex/region has an `EmittedOmen` whose category synergizes with the candidate's category (reuse `OMEN_CATEGORY_SYNERGY` map from `complicationSelection.ts:53`), add `intensity * EMITTED_OMEN_SCORE_WEIGHT` to the score. Additive; never subtractive; capped at `OMEN_ENCOUNTER_BIAS_CAP` (existing constant).
2. **Prose enrichment** — placeholder `{omen}` resolves against the highest-intensity active `EmittedOmen` in scope at render time, falling back to global `OmenState.primary` if none. Already documented in the enrichment reference; this adds a feeder.

**Fail-soft.** Invalid scope (regionId not found, hex out of bounds) degrades to `global` with a `failReason: 'scope_degraded_to_global'` trace.

**Trace:** `omen_emitted` (new category).

**Chronicle event:** `TickEvent.type = 'narrative'`, significance = clamp(0.5 + intensity * 0.3, 0.5, 0.85), message = `narrativeHook`.

#### 3. Faction topology effects (Effort: L)

Five sub-effects, shared structure:

```typescript
| {
    readonly kind: 'faction_splinter';
    readonly sourceFactionId: string;
    readonly newFactionName: string;
    readonly memberSelection: FactionMemberSelection; // see below
    readonly inheritReputationShare?: number;         // 0–1, fraction of parent rep transferred
    readonly narrativeHook?: string;
  }
| {
    readonly kind: 'faction_absorb';
    readonly absorbingFactionId: string;
    readonly absorbedFactionId: string;
    readonly reputationMerge?: 'max' | 'sum_clamped' | 'weighted_avg';  // default 'weighted_avg'
    readonly narrativeHook?: string;
  }
| {
    readonly kind: 'faction_dissolve';
    readonly factionId: string;
    readonly memberFallback?: 'independent' | 'drift_to_rival';  // default 'independent'
    readonly narrativeHook?: string;
  }
| {
    readonly kind: 'faction_declare_war';
    readonly factionA: string;
    readonly factionB: string;
    readonly narrativeHook?: string;
  }
| {
    readonly kind: 'faction_force_peace';
    readonly factionA: string;
    readonly factionB: string;
    readonly sentimentBoost?: number;     // default 0.1
    readonly narrativeHook?: string;
  }
```

**FactionMemberSelection (splinter only):**

```typescript
type FactionMemberSelection =
  | { kind: 'all_matching_trait'; traitId: string }
  | { kind: 'within_radius'; hexCol: number; hexRow: number; radius: number }
  | { kind: 'by_reputation_below'; threshold: number }   // disgruntled members
  | { kind: 'by_reputation_above'; threshold: number }   // elite defectors
  | { kind: 'explicit_ids'; agentIds: readonly string[] }
  | { kind: 'random_sample'; fraction: number };         // uses state.seed
```

**Determinism.** `random_sample` uses the existing seeded PRNG (`state.seed` + a salt composed of `actionId + reactionId + effectIndex`). No `Math.random`.

**Graph mutations per sub-effect:**

| Effect | Node mutations | Edge mutations |
|---|---|---|
| `faction_splinter` | Add new faction actor node. Inherit `actorType='faction'`. | For each selected member: remove `member_of(member → source)`, add `member_of(member → new)` with preserved `reputation` scaled by `inheritReputationShare ?? 0.8`. Copy `relates_to` edges from source to new, marked `inherited: true`. Add `relates_to(new → source)` with sentiment = -0.3 (splinters start resentful). |
| `faction_absorb` | Mark absorbed node `properties.actorStatus = 'dissolved'`. | Rewrite every `member_of(x → absorbed)` to `member_of(x → absorbing)`, merging reputations per rule. Rewrite `relates_to` targets. Remove edges that become self-loops. |
| `faction_dissolve` | Mark node `properties.actorStatus = 'dissolved'`. | Remove all `member_of` edges pointing to faction. If `memberFallback='drift_to_rival'`, add `member_of` edges to the faction's top `relates_to` target with starting reputation 0.1. |
| `faction_declare_war` | None. | Upsert `relates_to(A → B)` with `sentiment = -0.8`, `strength = 1.0`, `basis = 'war'`. Symmetric on B→A. |
| `faction_force_peace` | None. | Upsert `relates_to(A → B)` with `sentiment = max(current + sentimentBoost, 0.2)`, `basis = 'treaty'`. Symmetric. |

**Cache invalidation.** All faction mutations call `touchStructure()` (existing API in `src/engine/graph.ts`) to bump `structuralCacheVersion`, since faction topology affects distance matrix scoring via membership lookups and reputation caches.

**Validity preservation (hard requirement).**

- No orphaned `member_of` edges (every edge points to a live faction or is removed).
- No dangling `reputationTallies` or reputation records for dissolved factions (trimmed during the next `phaseFactionReputationDecay` run via a dissolved-check; add a one-line filter there).
- `relates_to` self-loops are removed synchronously.
- Integration test (see "Test Plan") verifies a round-trip splinter → absorb leaves the world graph in an equivalent topology to the pre-splinter baseline (modulo node ids and timestamps).

**Trace:** each sub-effect fires a dedicated trace: `faction_splintered`, `faction_absorbed`, `faction_dissolved`, `faction_war_declared`, `faction_peace_forced`.

**Chronicle event:** one per sub-effect, significance 0.7–0.85 per "this is a world-facing change".

---

## Content Pillar

### Author surface

Authors reach these capabilities from encounter template aftermath `effects[]` arrays, with the same shape as the existing seven effect kinds. The wiring guide (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) gains a new "World-shaping effects" section after the existing aftermath section, covering the three effect families with one worked example each.

**Example — artifact spawn from a discovery encounter outcome:**

```typescript
{
  id: 'tg.vault.find_ashenmourne',
  effects: [
    {
      kind: 'spawn_artifact',
      templateId: 'artifact.ashenmourne',
      tier: 'legendary',
      targetAgentId: '$actor',    // symbolic ref (Group B)
    },
    {
      kind: 'recent_event',
      message: 'Ashenmourne comes out of the tomb and into your hand.',
      significance: 0.85,
    },
  ],
}
```

**Example — omen emission from a battlefield atrocity:**

```typescript
{
  id: 'army.atrocity.aftermath',
  effects: [
    {
      kind: 'emit_omen',
      category: 'doom_echo',
      intensity: 0.6,
      durationTicks: 20,
      narrativeHook: 'The red field refuses to dry. The earth remembers.',
      scope: { kind: 'regional', regionId: '$encounterRegion' },
    },
  ],
}
```

**Example — splinter after a guild betrayal:**

```typescript
{
  id: 'tg.betrayal.splinter',
  effects: [
    {
      kind: 'faction_splinter',
      sourceFactionId: 'faction.thieves_guild',
      newFactionName: 'The Kept-Faith',
      memberSelection: { kind: 'by_reputation_above', threshold: 0.7 },
      inheritReputationShare: 0.9,
      narrativeHook: 'Half the senior fences walk. They will not forget what was done.',
    },
  ],
}
```

### Template updates

This issue does **not** require any template content authoring pass — the effect kinds ship empty, and Phase 2–4 content migrations opt in per-template where the fiction demands it. The existing worked example (`tg.quest.pocket_run`) does not add a Group C effect.

### Wiring-guide updates (deferred to THR-118)

THR-118 is the canonical wiring-guide correction pass. This issue notes the corrections required but does not edit the guide (avoids merge conflicts with the enrichment and tracing corrections landing in parallel). Specifically THR-118 adds:

1. "World-shaping effects" subsection documenting the three families.
2. "Coming in Group D" note: `when` predicates apply to these effects once THR-116 lands.
3. Trace category additions: `artifact_spawned`, `omen_emitted`, `faction_splintered`, `faction_absorbed`, `faction_dissolved`, `faction_war_declared`, `faction_peace_forced`.
4. "How to verify" pointers to the integration tests added here.

---

## UI Pillar

### Chronicle

Each world-shaping effect appends exactly one `TickEvent` to `recentEvents` and `tickEvents` during `applyEncounterAftermathReaction`. No new UI component needed — the existing Chronicle renderer already handles `TickEvent.type = 'narrative'` with significance-based styling. Significance guidance:

| Effect | Significance | Rationale |
|---|---|---|
| `spawn_artifact` (common) | 0.55 | Ordinary |
| `spawn_artifact` (shaping) | 0.7 | Notable |
| `spawn_artifact` (legendary) | 0.9 | Momentous |
| `emit_omen` | 0.5 + intensity × 0.3 | Scales with drama |
| `faction_declare_war` | 0.85 | Regional-scale shift |
| `faction_force_peace` | 0.75 | Regional-scale shift |
| `faction_splinter` | 0.8 | Structural change |
| `faction_absorb` | 0.7 | Structural change |
| `faction_dissolve` | 0.7 | Structural change |

### DebugPanel

Extend the existing **Aftermath** tab (already renders the seven known effect kinds after THR-135) with rows for the eight new effect kinds. Each row shows: tick, encounterId, reactionId, effect payload summary, trace id. No new panel — additive rows in the existing table.

Add the eight new trace categories to the trace filter dropdown. This is a one-line change per category in the DebugPanel filter component — see `src/ui/components/DebugPanel/` for the filter source. Surface-level work, not design work; CC handles during implementation.

### HexMapV2

Two additive signifier hooks, both gated behind settings (off by default — keep the map legible):

1. **`emit_omen` with regional/local scope** — render a faint tinted overlay on affected hexes for the omen's duration. Tint color maps to `OmenCategory`: doom_echo → dark red, sphere_surge → per-sphere color, cultural → amber, seasonal → steel-blue. Alpha = `intensity × 0.25` (capped low; visual noise is a real cost). Uses the existing `hexOverlays` tier in HexMapV2 rather than creating a new render layer.
2. **`faction_declare_war`** — over the next 5 ticks, the Chronicle entry plus a brief toast alerts the player. No persistent map signifier in Phase 0; a persistent "at war" indicator between faction controlled regions is deferred to the Thematic Pressure project.

### Player notifications

Use existing toast system for: `spawn_artifact` at legendary tier (player-relevant), `faction_declare_war` (world-shift moment), `faction_splinter` when one of the involved factions is a thread target. All other effects land as chronicle-only — the player can dig in from the Chronicle entry or the DebugPanel trace filter. No new notification category.

---

## Wiring Section

Per `Docs/plans/wiring-checklist.md`:

| Surface | What connects |
|---|---|
| **Orchestrator** | Existing: `applyEncounterAftermathReaction` is called from the unified action stage adapter during aftermath resolution. No new orchestrator phase for effect execution. **New:** `phaseEmittedOmenDecay` added adjacent to the omen phase block (after `phaseOmenAgenda`) to expire `EmittedOmen` entries. Single phase, no PRNG, O(n). |
| **GameState** | New optional field: `emittedOmens?: EmittedOmen[]`. Defaults to empty. Persisted in save/load per existing `GameState` serialization patterns. |
| **WorldGraph** | Uses existing `addNode`, `addEdge`, `removeEdge`, node property mutation. All writes call `touchWorld()` + `touchStructure()` per the "graph mutated in place" load-bearing decision. |
| **Traces** | Eight new categories (see Tracing section). Added to `TRACE_CATEGORIES` array in `src/types/trace.ts` and to the DebugPanel filter. |
| **UI — Chronicle** | Reads `recentEvents` as today — no changes required. Each effect appends exactly one TickEvent. |
| **UI — DebugPanel** | Aftermath tab gains eight effect-kind rows; trace filter gains eight categories. Additive; no refactor. |
| **UI — HexMapV2** | `emittedOmens` feeds regional/local overlay tier via the existing `hexOverlays` registration. Opt-in setting. |
| **UI — Toasts** | Three triggers fire existing toast pipeline: legendary artifact spawn, war declared, splinter involving thread target. |
| **Prose enrichment** | `{omen}` placeholder resolver gains a scoped `EmittedOmen` lookup before falling back to global `OmenState`. Updates `Docs/plans/2026-04-16-systemic-wiring-guide.md` enrichment reference (handled by THR-118). |
| **Faction subsystem** | `phaseFactionReputationDecay` gains a one-line filter that skips `actorStatus === 'dissolved'` factions. |
| **Cache invalidation** | Every faction topology mutation calls `touchStructure()`. Every artifact spawn calls `touchWorld()`. Every omen emit calls `touchWorld()`. |

---

## Constants Table (NFP #1 — Tunability)

All magic numbers are named constants. Location: `src/data/game-config.ts`, under a new `ENCOUNTER_WORLD_SHAPING_CONSTANTS` export.

| Constant | Default | Purpose |
|---|---|---|
| `EMITTED_OMEN_SCORE_WEIGHT` | `0.35` | How strongly an active emitted omen biases encounter scoring when its category synergizes. Capped by existing `OMEN_ENCOUNTER_BIAS_CAP`. |
| `EMITTED_OMEN_DEFAULT_DURATION_TICKS` | `15` | Fallback if author omits `durationTicks`. |
| `EMITTED_OMEN_MAX_ACTIVE` | `20` | Hard cap on simultaneous emitted omens; oldest drops if exceeded. |
| `EMITTED_OMEN_LOCAL_DEFAULT_RADIUS` | `2` | Hex radius for `scope.kind = 'local'` when radius not specified. |
| `SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_COMMON` | `0.55` | Chronicle significance for common tier. |
| `SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_SHAPING` | `0.7` | Chronicle significance for shaping tier. |
| `SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_LEGENDARY` | `0.9` | Chronicle significance for legendary tier. |
| `FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE` | `0.8` | Fraction of parent reputation transferred to new faction members. |
| `FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT` | `-0.3` | Starting relates_to sentiment between splinter and parent. |
| `FACTION_PEACE_DEFAULT_SENTIMENT_BOOST` | `0.1` | Default boost if author omits `sentimentBoost`. |
| `FACTION_PEACE_SENTIMENT_FLOOR` | `0.2` | Peace cannot drop sentiment below this floor. |
| `FACTION_WAR_SENTIMENT_FLOOR` | `-0.8` | Declare-war clamps sentiment to this. |
| `FACTION_DRIFT_TO_RIVAL_INITIAL_REPUTATION` | `0.1` | Starting reputation when `memberFallback='drift_to_rival'`. |
| `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.declare_war` | `0.85` | Per-effect chronicle significance. |
| `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.force_peace` | `0.75` | |
| `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter` | `0.8` | |
| `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.absorb` | `0.7` | |
| `FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.dissolve` | `0.7` | |

---

## Tracing (NFP #2 — Inspectability)

Eight new trace categories. Add to `TRACE_CATEGORIES` array in `src/types/trace.ts` and to the `TraceEntryMap` discriminated union. Each trace fires **in addition to** the existing generic `encounter_aftermath_effect` trace, so authors can filter by either granularity.

```typescript
// Additions to src/types/trace.ts TRACE_CATEGORIES
'artifact_spawned',
'omen_emitted',
'omen_decayed',
'faction_splintered',
'faction_absorbed',
'faction_dissolved',
'faction_war_declared',
'faction_peace_forced',

// Trace entry shapes
interface ArtifactSpawnedTrace extends BaseTraceEntry {
  category: 'artifact_spawned';
  artifactId: string;
  artifactName: string;
  tier: ArtifactTier;
  templateId?: string;
  targetAgentId?: string;
  targetLocationId?: string;
  sourceEncounterId: string;
  sourceReactionId: string;
  summary: string;
}

interface OmenEmittedTrace extends BaseTraceEntry {
  category: 'omen_emitted';
  omenId: string;
  omenCategory: OmenCategory;
  intensity: number;
  scope: EmittedOmenScope;
  expiresTick: number;
  sourceEncounterId: string;
  sourceReactionId: string;
  degradedToGlobal?: boolean;    // true if scope failed and degraded
  summary: string;
}

interface OmenDecayedTrace extends BaseTraceEntry {
  category: 'omen_decayed';
  omenId: string;
  livedTicks: number;
  summary: string;
}

interface FactionSplinteredTrace extends BaseTraceEntry {
  category: 'faction_splintered';
  sourceFactionId: string;
  newFactionId: string;
  memberCount: number;
  selectionKind: string;
  reputationShare: number;
  summary: string;
}

interface FactionAbsorbedTrace extends BaseTraceEntry {
  category: 'faction_absorbed';
  absorbingFactionId: string;
  absorbedFactionId: string;
  migratedMemberCount: number;
  reputationMergeStrategy: string;
  summary: string;
}

interface FactionDissolvedTrace extends BaseTraceEntry {
  category: 'faction_dissolved';
  factionId: string;
  releasedMemberCount: number;
  memberFallback: string;
  summary: string;
}

interface FactionWarDeclaredTrace extends BaseTraceEntry {
  category: 'faction_war_declared';
  factionA: string;
  factionB: string;
  previousSentiment: number;
  summary: string;
}

interface FactionPeaceForcedTrace extends BaseTraceEntry {
  category: 'faction_peace_forced';
  factionA: string;
  factionB: string;
  previousSentiment: number;
  newSentiment: number;
  summary: string;
}
```

---

## Fail-Soft Table (NFP #4)

| Failure | Fallback |
|---|---|
| `spawn_artifact` — no placement target resolves | Skip effect. Trace `success=false, failReason='no_placement_target'`. No chronicle event. |
| `spawn_artifact` — `templateId` not found | Fall back to blank artifact with `nameOverride` or generic name. Trace `failReason='template_missing_used_fallback'`. Continue. |
| `spawn_artifact` — target actor node missing | Skip effect. Trace `failReason='target_actor_missing'`. |
| `emit_omen` — regionId not found | Degrade to `scope.kind='global'`. Trace `degradedToGlobal=true`. Continue. |
| `emit_omen` — hex out of bounds | Degrade to global. Trace with degradation flag. |
| `emit_omen` — pushes active count over `EMITTED_OMEN_MAX_ACTIVE` | Drop oldest (lowest `emittedTick`); continue with new. Trace on the dropped omen `category='omen_decayed', failReason='cap_evicted'`. |
| `faction_splinter` — `sourceFactionId` not a valid faction | Skip effect. Trace `failReason='source_faction_invalid'`. |
| `faction_splinter` — selection yields zero members | Still create the new (empty) faction node. Trace `memberCount=0`. Authors may want an empty faction for narrative reasons. |
| `faction_absorb` — either party missing or already dissolved | Skip effect. Trace `failReason='faction_missing_or_dissolved'`. |
| `faction_dissolve` — faction has no members | Mark `actorStatus='dissolved'`. Trace `releasedMemberCount=0`. |
| `faction_declare_war` / `faction_force_peace` — either party missing | Skip effect. Trace `failReason='faction_missing'`. |
| PRNG failure (impossible, but defensive) | Fallback to the first N members by id sort order. Trace. |
| Circular reference (splinter → absorb → splinter in same tick) | Each effect resolves against current graph state at its own `i` index — i.e., later effects see earlier effects' mutations. No cycle detection needed; authors can chain deterministically. |

**Tick-loop never crashes.** Every effect handler is wrapped in the same shape as the existing seven: switch case → guards → mutation → trace. A throw inside an effect is caught at the reaction level and the remaining effects in the reaction still run, matching the existing behavior pattern (see how Group A handled this in `src/engine/encounterAftermath.ts`).

---

## Open Questions / Decisions

Two decisions locked in this doc, surfaced here for review:

**Q1. How does `emit_omen` relate to `OmenState.primary` / `.secondary`?**

**Decision:** Separate channel (`emittedOmens` array on `GameState`). Aftermath never mutates the mandate-driven primary/secondary slots. Consumers that want "the active omen" read both channels and pick by precedence: a scope-matching `EmittedOmen` with higher intensity than `OmenState.primary` wins for local prose; global signals still prefer `OmenState.primary`.

**Rationale:** protects the ascendant mandate arc from being blown away by a single dramatic encounter. Keeps phaseOmenAgenda authoritative for its own concern.

**Q2. Faction splinter — who selects which members?**

**Decision:** Author specifies via `FactionMemberSelection` discriminated union (trait match, radius, reputation threshold, explicit ids, seeded random sample). No "engine picks" mode — selection is a narrative decision and should be authored.

**Rationale:** mirrors how encounter authors already think about targeting; keeps the effect deterministic (no implicit PRNG).

**Q3. Should `faction_absorb` preserve the absorbed faction's relates_to edges?**

**Decision:** Yes, rewrite targets to the absorbing faction. Then remove self-loops. Merge overlapping edges by summing `strength` (clamped to 1.0) and weighted-averaging `sentiment`.

**Rationale:** preserves narrative continuity ("the absorbing faction now carries the old grudges") while keeping the graph valid.

**Q4. Should emitted omens stack with existing `OmenState.primary` in encounter scoring?**

**Decision:** Yes, additively, but the combined bonus is capped at `OMEN_ENCOUNTER_BIAS_CAP` (the existing global cap). Neither channel gets more than the cap on its own; together they can hit it faster but never exceed.

---

## Test Plan

Colocated in `src/engine/__tests__/encounterAftermath.worldShaping.test.ts` (new file; siblings follow existing naming).

### Contract tests per effect kind

1. **`spawn_artifact` — creates node + edge + chronicle event.** Given a mock state and an action with a known actor, applying a reaction with one `spawn_artifact` effect results in: (a) a new node of type `artifact` in the graph, (b) a `possesses` edge from actor to artifact, (c) a `TickEvent` appended to `recentEvents`, (d) an `artifact_spawned` trace emitted, (e) `touchWorld()` called.
2. **`spawn_artifact` — legendary tier uses `artifact_legendary` + `bonded_to`.**
3. **`spawn_artifact` — location target uses `contains` edge.**
4. **`spawn_artifact` — fail-soft when no target resolves.** No node created; one trace with `failReason='no_placement_target'`.
5. **`emit_omen` — appends to `emittedOmens`, sets expiresTick, emits trace.**
6. **`emit_omen` — invalid regionId degrades to global.** `degradedToGlobal=true` on trace.
7. **`emit_omen` — cap eviction.** Pre-populate 20 omens; emit 21st; oldest evicted with `omen_decayed` trace.
8. **`phaseEmittedOmenDecay` — removes expired, keeps active.**
9. **`faction_splinter` — creates new node, migrates selected members, emits trace.**
10. **`faction_splinter` — member selection variants (5 selection kinds, one test each).** Seeded PRNG reproducible.
11. **`faction_splinter` — preserves graph validity.** No orphan member_of edges. Splinter has relates_to edge to parent with initial sentiment.
12. **`faction_absorb` — migrates members with correct reputation merge strategies (max, sum_clamped, weighted_avg).**
13. **`faction_absorb` — removes self-loops in relates_to after target rewrite.**
14. **`faction_dissolve` — marks node dissolved, handles member fallback (independent vs drift_to_rival).**
15. **`faction_declare_war` / `faction_force_peace` — upsert relates_to with correct sentiment floor/ceiling, symmetric.**
16. **Round-trip validity: splinter then absorb same source.** Graph topology equivalent to baseline modulo ids.

### Integration tests

17. **Encounter → spawn_artifact → agent uses artifact in next action.** End-to-end: encounter resolves, artifact spawned, subsequent action can reference it via `possesses` query.
18. **Encounter → emit_omen (regional) → agent in region sees elevated scoring for synergy encounters.** Two agents, one in region one out; scoring differential measurable.
19. **Encounter → faction_splinter → new faction participates in faction network summary.** Calls `getFactionNetworkSummary` and verifies the splinter appears.
20. **Determinism: same seed + same effect sequence → identical trace output.** Snapshot test with PRNG.

### Fail-soft regression

21. **Malformed effect (runtime-built with missing required fields) does not crash tick loop.** Force an intentionally-broken effect through and assert tick completes.

Each test < 30 lines. Total new test footprint ~500 lines, ~21 test cases.

---

## Phased Delivery (within this one issue)

Recommended CC landing order to keep PRs reviewable. Each sub-phase is a self-contained commit stack but **ships together in one branch / one Ready-for-Dev merge** to keep the author surface atomic:

1. **Sub-phase 1: type additions + trace categories** (~1 hour)
   - Extend `EncounterAftermathReactionEffect` union in `src/types/unifiedAction.ts`.
   - Add trace categories and interfaces in `src/types/trace.ts`.
   - Add constants to `src/data/game-config.ts`.
   - Ship: tsc clean, no runtime changes.
2. **Sub-phase 2: `spawn_artifact` handler + tests** (~0.5 day)
   - Implement switch case in `encounterAftermath.ts`.
   - Write tests 1–4 + test 17.
3. **Sub-phase 3: `emit_omen` + decay phase + tests** (~1 day)
   - Add `emittedOmens` to `GameState`, `phaseEmittedOmenDecay`, orchestrator wiring.
   - Implement effect handler.
   - Update encounter scoring consumer (single call site, additive).
   - Update `{omen}` enrichment placeholder resolver.
   - Write tests 5–8 + test 18.
4. **Sub-phase 4: faction topology effects + tests** (~3 days)
   - Implement five sub-effects with graph mutations.
   - Wire `phaseFactionReputationDecay` dissolved-skip filter.
   - Write tests 9–16 + tests 19–20.
5. **Sub-phase 5: fail-soft regression + DebugPanel filter update + chronicle significance constants** (~0.5 day)
   - Test 21.
   - Add eight trace categories to DebugPanel filter dropdown.
   - Verify every constant from the Constants Table is exported and consumed.
6. **Sub-phase 6: HexMapV2 overlay opt-in** (~0.5 day)
   - Register regional omen overlay tier behind a setting flag. Default off.
7. **Sub-phase 7: CLI verification** (~0.5 day)
   - Run `npm run cli` with a scripted encounter that fires all three effect families; verify `status`, `factions`, `traces` show expected outcomes.

**Stretch cut line if scope slips:** drop sub-phase 6 (HexMapV2 overlay) — chronicle + debug panel visibility is sufficient for Phase 2–4 content authors. File a deferral as `THR-XXX deferral: HexMapV2 emittedOmens overlay rendering`, Deferral label, same project.

**Estimate:** 5–7 working days for one agent. L bucket overall (faction effects dominate). Matches the parent migration doc's sizing.

---

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | **PASS** | 17 named constants in the constants table; no magic numbers. |
| 2. Inspectability | **PASS** | Eight new trace categories with typed interfaces; existing generic `encounter_aftermath_effect` trace still fires for compatibility. |
| 3. Determinism | **PASS** | `faction_splinter` random_sample uses seeded PRNG with salt. No `Math.random`. All graph mutations ordered by effect index. |
| 4. Fail-soft | **PASS** | Fail-soft table covers 12 failure modes; tick loop never crashes; effect errors do not abort reaction. |
| 5. Narrative over mechanical | **PASS** | Effect shapes prioritize author-facing narrative fields (`narrativeHook`, `messageOverride`, `nameOverride`) over raw data plumbing. Omen channel separation defends the ascendant's story arc from being bulldozed. |
| 6. Additive over destructive | **PASS** | Every effect is a new switch case; existing seven effects untouched. New `emittedOmens` state field is optional. New phase added adjacent to omen phase rather than rewriting omen phase. |
| 7. Performance budget | **PASS with note** | `phaseEmittedOmenDecay` is O(n) with n capped at `EMITTED_OMEN_MAX_ACTIVE = 20`. Faction topology mutations call `touchStructure()` which invalidates caches — expected per load-bearing decision. Note: `faction_splinter` with `random_sample` on a large faction is O(m) in faction size. With ~40 max members per faction in current world sizing, not a concern; if faction sizes grow 10x, revisit. |

---

## Acceptance Criteria

- [ ] `EncounterAftermathReactionEffect` union extended with three new families (8 new discriminated variants including five faction sub-effects).
- [ ] `src/engine/encounterAftermath.ts` handles each new kind with full graph mutation + trace + chronicle event + fail-soft.
- [ ] `GameState.emittedOmens` field added; `phaseEmittedOmenDecay` added to orchestrator.
- [ ] 21 tests pass covering all effect kinds and failure modes.
- [ ] Eight new trace categories appear in DebugPanel filter.
- [ ] Encounter scoring consumes `emittedOmens` additively; existing `OmenState` behavior unchanged.
- [ ] `{omen}` enrichment placeholder resolver prefers scope-matching `EmittedOmen`.
- [ ] CLI verification smoke: scripted encounter fires all three families; `npm run cli` shows expected state deltas.
- [ ] Constants exported from `src/data/game-config.ts`; no numeric literals in new code.
- [ ] `touchWorld()` / `touchStructure()` called on every mutation.
- [ ] `wiring-checklist.md` updated with the new phase + new GameState field + new trace categories.

---

## Dependencies

- **Blocks:** THR-118 (wiring-guide correction pass) — cannot finalize until this and sibling groups land.
- **Blocks:** Phase 2+ content migrations (THR-91, THR-93–99 etc.) that want world-shaping outcomes. Non-blocking for migrations that do not need Group C.
- **Parallel-safe with:** THR-113 (Group A intelligence), THR-114 (Group B multi-target), THR-117 (Group E wound decision). No file overlap in the handler — switch cases add in distinct regions. Trace registration overlaps (`src/types/trace.ts`): small merge surface, trivial to resolve.
- **Mutex with:** none. All Phase 0 Group issues extend the same `encounterAftermath.ts` switch and `unifiedAction.ts` union; they should merge serially into main. Branch strategy: sequence PRs so the second/third rebase clean over the first, picking up the upstream trace categories before adding its own.
