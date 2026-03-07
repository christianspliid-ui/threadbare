# Narrative Context Builder — Pass 1 Design

**Date:** 2026-03-07
**Status:** Approved
**Parent design:** `2026-03-06-narrative-context-pipeline.md` (full 5-system spec)
**Scope:** Pass 1 only — harvest→rank→select→feed pipeline with opposition tension scoring. Defers spawning, beat promotion, and chronicler vignettes to Pass 2.

## Goal

Make Notable and Chronicle prose world-aware by enriching events with harvested graph objects before prose generation. Currently `phaseNarrative` produces chronicle entries with empty `promptContext` (no actors, no location, no nearby objects). After this pass, every notable/chronicle event will carry a `NarrativeContext` with ranked, tension-scored world objects.

## What Changes

| Component | Current State | After Pass 1 |
|-----------|--------------|-------------|
| `phaseNarrative` | Copies raw message into chronicle entry with empty promptContext | Runs context builder for notable/chronicle events, enriches promptContext |
| `ProseContext` (types/narrative.ts) | 5 fields: actorName, targetName, locationName, sphere, dominantValues | Extended with `contextObjects`, `historicalFragments`, `oppositionSummary` |
| Prose templates | Generic: "{actorName} did X at {locationName}" | Can reference nearby artifacts, factions, rival agents by name |
| New module: `src/engine/contextBuilder.ts` | Does not exist | Pure functions: harvest, rank, select, buildNarrativeContext |
| New data: `src/data/opposition-content.ts` | Does not exist | Sphere opposition matrix, archetype friction matrix, scoring constants |

## Architecture Decisions

### 1. Pure function pipeline, no class

The context builder is a set of composable pure functions, not an object. Matches project convention (tunability, inspectability, determinism).

```typescript
// Entry point
export function buildNarrativeContext(
  event: NarrativeEvent,
  graph: WorldGraph,
  archetype?: ArchetypeId,
  seed: number,
): NarrativeContext;
```

### 2. Opposition scoring as a separate content package

The sphere opposition matrix and archetype friction matrix are data, not logic. They go in `src/data/opposition-content.ts` following the content package pattern.

### 3. Harvest uses existing WorldGraph API

The graph already has `getOutgoingEdges`, `getIncomingEdges`, `getNeighborIds`, `getNodesByType`. No new graph methods needed — just composition.

### 4. Extend ProseContext, don't replace it

Add optional fields to the existing `ProseContext` interface. Old code that doesn't pass context objects still works. Additive over destructive.

### 5. Routine events skip the pipeline entirely

Per the original design doc: routine events are too frequent and too minor. Only `notable` and `chronicle` tier events run through the context builder.

### 6. No spawning in Pass 1

If the harvest finds no relevant objects, the context builder returns an empty `contextObjects` array. The prose generator handles this gracefully (falls back to existing generic templates). Spawning is a Pass 2 feature.

## Type Definitions

```typescript
// New types in src/types/narrative.ts

export interface NarrativeContext {
  event: NarrativeEvent;
  archetype?: ArchetypeId;
  contextObjects: ContextObject[];
  historicalFragments: string[];
  oppositionSummary: OppositionSummary;
}

export interface ContextObject {
  nodeId: string;
  name: string;
  category: ContextCategory;
  relevanceScore: number;
  tensionType?: string;
  briefDescription: string;
}

export type ContextCategory = 'artifact' | 'faction' | 'character' | 'location' | 'event';

export interface OppositionSummary {
  dominantTension?: string;       // Highest-scoring tension type
  tensionScore: number;           // Total opposition tension in scene
  opposingPairs: OpposingPair[];  // Specific friction points
}

export interface OpposingPair {
  sourceId: string;
  targetId: string;
  tensionType: string;
  score: number;
}
```

## Scoring Formula

Per the parent design doc:

```
RelevanceScore = Proximity + Involvement + OppositionTension
```

**Proximity** (0–3): same location=3, adjacent=2, same region=1, graph-connected=0.5
**Involvement** (0–5): direct participant=5, causal=3, owner/creator=2, atmospheric=1
**Opposition Tension** (0–5, additive): foundation sphere opposition=5, creation sphere=3, archetype friction=3-5, value opposition=3, historical grudge=4, cultural clash=2

## Selection Rules

- Notable: 2–3 objects
- Chronicle: 4–5 objects
- Category cap: max 2 from any single category
- Character/faction minimum: at least 1 if available

## Harvest Categories and Graph Queries

| Category | Node Types | Graph Query Strategy |
|----------|-----------|---------------------|
| Artifacts | `artifact`, `artifact_legendary` | Edges `possesses`/`bonded_to` from actors, `located_at` to same location |
| Factions | `actor` where actorType='faction' | Edges `member_of` from event actors, `controls` edges to location resources |
| Characters | `actor` where actorType='individual' | `located_at` same/adjacent locations, `relates_to` event actors |
| Locations | `location` | Adjacent via `adjacent` edges, `contains`/contained-by |
| Events | `event` | Nodes with edges to same actors or location (historical) |
| Rival agents | `actor` with rival affiliation | `located_at` within range, sphere opposition to player |

Harvest radius:
- Notable: 1 hop from event location (immediate + adjacent)
- Chronicle: 2 hops (region-wide) + any graph-connected actors regardless of distance

## Deferred to Pass 2

- **Narrative-driven spawning** — creating new graph nodes when story demands objects
- **Beat pattern tier promotion** — routine→notable promotion based on archetype beats
- **Chronicler vignettes** — inspect-time prose for world objects (separate UI feature)
- **Cultural palette integration** — using culture-content.ts material vocabulary in context (requires culture engine integration first)

## Decisions Log

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Pass 1 scope | Context builder core only | Full 5-system implementation | Fastest path to world-aware prose; spawning/vignettes are independent features |
| Opposition data location | `opposition-content.ts` | Inline in engine | Content package pattern; matrices are tunable data |
| ProseContext extension | Add optional fields | New interface | Additive; backward compatible; old tests keep passing |
| Harvest implementation | Compose existing graph API | Add new graph methods | Graph API is sufficient; no need to extend it |
| Empty harvest handling | Return empty array, prose falls back | Error/warning | Fail-soft principle; early game may have sparse graphs |
