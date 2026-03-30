# Graph-Native Modifier System Design

**Date:** 2026-03-09
**Status:** Approved
**Scope:** General-purpose attribute modification via graph edges, with LOS as first consumer

## Problem

All agent attributes (LOS range, action costs, domain capabilities, etc.) are currently static constants or fixed node properties. There's no mechanism for traits, divine influence, terrain, culture, or future systems (items, spells) to dynamically modify these values. The game needs a universal modifier system that scales to any numeric attribute without introducing new abstractions.

## Decision 1: Graph-Native Edge Modifiers

**Chosen:** Optional `modifiers?: Record<string, number>` property on any edge.

A single pure function collects all modifiers:

```ts
function getModifiedValue(
  graph: WorldGraph,
  nodeId: string,
  attribute: string,
  baseValue: number,
): number
```

Walk all incoming + outgoing edges from `nodeId`, sum any `edge.properties.modifiers[attribute]`, clamp to floor. Zero new types, zero new data structures — fully graph-native.

**Why not component/ECS:** The world graph already IS the entity system. Adding a parallel modifier registry would duplicate state and create sync bugs.

**Why not per-attribute functions:** Each new attribute would need its own collector function. The generic approach scales infinitely.

## Decision 2: Attribute Floor System

Per-attribute minimum values prevent degenerate states:

```ts
const ATTRIBUTE_FLOORS: Record<string, number> = {
  los_range: 0,        // always see own hex
  action_cost: 1,      // minimum 1 essence
  domain_capability: 0, // can't go negative
};
```

Default floor is `-Infinity` (no floor) for attributes not in the map. This is a tunable constant, not hardcoded logic.

## Decision 3: Edge-Type Modifier Sources

| Edge Type | Modifier Source | Example |
|-----------|----------------|---------|
| `has_trait` | Trait grants modifier | Eagle-Eyed: `{los_range: +1}` |
| `divine_influence` | Active intervention effect | Far Sight blessing: `{los_range: +2}` |
| `located_at` | Terrain at location (via lookup) | Dense forest location: `{los_range: -1}` |
| `belongs_to` | Cultural identity modifier | Mountain culture: `{los_range: +1}` |
| `worships` | Devotion-based bonuses | High-tier worship: `{los_range: +1}` |
| `possesses` | Item in inventory (future) | Spyglass: `{los_range: +3}` |
| `affected_by` | Active spell/curse (future) | Blindness curse: `{los_range: -2}` |

The collector function doesn't care about edge types — it just reads `modifiers` from any edge touching the node. New modifier sources are added by putting `modifiers` on new edge types, not by changing engine code.

## Decision 4: Terrain Modifier via Located_at Lookup

`located_at` edges don't directly carry terrain modifiers. Instead, when collecting modifiers for an agent, the system follows `located_at → location node → terrain type` and applies terrain-based modifiers from a content data lookup table.

This is implemented as a special case in the collector: if the edge type is `located_at`, also check the target location's terrain against `TERRAIN_MODIFIERS`.

```ts
const TERRAIN_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  dense_forest: { los_range: -1 },
  mountain_peak: { los_range: +2 },
  fog_marsh: { los_range: -2 },
};
```

## Decision 5: Integration with Visibility System

`collectLOSSources` in `src/engine/visibility.ts` changes from static constants to dynamic per-agent values:

```ts
// Before
sources.push({ hexCol, hexRow, range: AVATAR_SIGHT_RANGE });

// After
const losRange = getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE);
sources.push({ hexCol, hexRow, range: losRange });
```

Same pattern for retinue agents (base `AGENT_SIGHT_RANGE`) and scry targets (base `SCRY_SIGHT_RANGE`). The static constants become default base values.

## Decision 6: Tracing

New trace category `modifier_resolution`:

```ts
interface ModifierResolutionTrace extends TraceBase {
  category: 'modifier_resolution';
  nodeId: string;
  attribute: string;
  baseValue: number;
  modifiers: Array<{ source: string; edgeType: string; delta: number }>;
  finalValue: number;
}
```

Emitted by `getModifiedValue` when trace buffer is enabled. Visible in debug panel's Agent Follow mode — click an agent, see every modifier contributing to their attributes.

## Decision 7: Initial Content — LOS-Modifying Traits

Three trait definitions prove the system works:

- **Eagle-Eyed** (innate): `modifiers: { los_range: +1 }` on `has_trait` edge
- **Night Blind** (scar): `modifiers: { los_range: -1 }` on `has_trait` edge (floored at 0)
- **Far Sight** (mastery): `modifiers: { los_range: +2 }` on `has_trait` edge

Plus terrain modifiers for 3-5 terrain types as proof of the `located_at` lookup path.

## Future: Item & Spell System

The modifier system is designed to support `possesses` (items) and `affected_by` (spells/curses) edge types. These systems don't exist yet and should be added to the backlog as the next priority after this modifier system ships.

## Non-Goals

- No UI for viewing modifier breakdowns (debug panel trace is sufficient for now)
- No modifier stacking rules (simple additive sum — complexity added later if needed)
- No conditional modifiers (time-of-day, weather — these become global state modifiers later)
- No modifier expiry (divine influence already has its own decay system)
