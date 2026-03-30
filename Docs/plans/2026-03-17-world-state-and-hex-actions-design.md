# Mutable World State + Hex Action Templates — Design Doc

**Date:** 2026-03-17
**Status:** Design complete, pending implementation
**Depends on:** Generalized Action Targeting (complete)
**Brainstorm notes:** Obsidian → [[Generalized Action Targeting]] § Model Expansions

## Problem

The Generalized Action Targeting architecture is in place — players can now see action cards when focusing on locations, attachments, and sublocations. But two major surfaces remain inert:

1. **Hexes have zero mutable state.** The `HexTile` interface is `{ coord, geoParams, terrain, hasRiver?, regionId? }` — all static from world generation. There's no property that player actions can modify, and hexes aren't graph nodes so GraphOps can't target them. This means the 4 "hex action" concepts from the brainstorm (Bless the Land, Corrupt the Land, Survey Territory, Seed Life) have no data to write to.

2. **Locations lack unrest and magical saturation.** Prosperity already exists (0–100, 5 tiers, tick-driven via `phaseProsperity`), but there's no `unrest` to make "Incite Unrest" do something, and no `magicalSaturation` to track divine presence accumulating at locations. The existing location action templates (Ward, Place of Power, Incite Unrest, Fortify) currently use edge-based GraphOps (`add_edge: warded`) but can't modify numeric state on the location itself.

This design adds mutable numeric state to both hexes and locations, authors hex action templates to fill the last gap in the targeting system, and enhances existing location templates to write to the new state fields.

## Design Decisions

### Decision 1: Hex State Lives on HexTile, Not as Graph Nodes

**Chosen:** Add `divineInfluence` and `corruption` floats directly to the `HexTile` interface rather than creating 2,000+ graph nodes for each hex.

**Why:** The world graph is optimized for entities with rich typed edges (traits, relationships, enchantments). Hexes don't need that — they need two mutable numbers. Creating graph nodes for every hex would bloat the node count from ~250 to ~2,500+, slow every `getNodesByType` call, and require a new indexing strategy. The hex grid is already a separate data structure (`GameState.tiles: HexTile[]`) accessed by coordinate, which is fast.

**Implication:** GraphOps can't directly target hexes via `update_node`. Instead, hex action resolution uses a new lightweight `HexMutation` that the tick loop applies to the tile array. This is a small, contained addition — not a rearchitecture.

### Decision 2: Two Hex State Fields — Divine Influence and Corruption

**Chosen:** Two floats (0.0–1.0), each with a decay-per-tick constant.

- `divineInfluence` — how much the player's divine presence has seeped into this hex. Drives positive effects: fertility boosts, morale lifts for agents, visibility. Decays toward 0.
- `corruption` — how much entropy/darkness/chaos has taken hold. Drives negative effects: terrain degradation, threat increase, agent morale penalties. Decays toward 0 (slower than divineInfluence).

**Why not one axis?** They're not opposites. A hex can be simultaneously blessed and corrupted (divine battleground). Or neither (neutral wilderness). Two independent floats give richer state space with minimal complexity.

**Why not more fields?** Tunability (NFP #1) says start with what you need and add later. Two fields are enough for the 4 brainstormed hex actions plus organic effects. If we need moisture manipulation or temperature shifting later, we add fields then.

### Decision 3: Location Gets `unrest` and `magicalSaturation`

**Chosen:** Two new numeric properties on location nodes (same pattern as `prosperity`), with dedicated tick phases.

- `unrest` (0–100, default 0) — political instability. Driven up by player actions ("Incite Unrest"), agent betrayals, low prosperity. Driven down by stability, strong leadership, prosperity. At high levels: agents defect, actions fail more, settlement can be sacked.
- `magicalSaturation` (0.0–1.0, default 0.0) — concentration of divine/magical energy at this location. Driven up by player actions (Ward, Place of Power), sphere-aligned encounters. Decays naturally. High saturation: magical actions are easier, sphere-specific effects trigger, attracts Veil-reach agents.

**Why on the node properties (not edges)?** Prosperity already uses `node.properties.prosperity` — this is the established pattern. Numeric state that ticks per-turn belongs on the node. Edges are for relationships between entities.

### Decision 4: HexMutation Struct Instead of GraphOp for Hex Changes

**Chosen:** Introduce a `HexMutation` type that hex action templates produce on resolution. The tick loop applies these to `GameState.tiles` in a new mini-phase.

```typescript
export interface HexMutation {
  readonly col: number;
  readonly row: number;
  readonly field: 'divineInfluence' | 'corruption';
  readonly delta: number;      // added to current value, clamped 0.0–1.0
  readonly source: string;     // template ID or system ID for tracing
}
```

**Why not extend GraphOps?** GraphOps resolve symbolic refs (`$actor`, `$target`) against graph node IDs. Hexes aren't graph nodes — they're indexed by coordinate. Forcing hex mutations through GraphOps would require either a hack (fake node IDs like `hex_5_3`) or a real architectural change (hexes as graph nodes — rejected in Decision 1). A separate, tiny mutation type is cleaner and more honest.

**Implication:** The resolution pipeline needs a small extension: when a target_action resolves against a hex target, it produces `HexMutation[]` alongside the normal `GraphOp[]`. A new `phaseApplyHexMutations` applies them to the tile array.

### Decision 5: Terrain Transformation Is Threshold-Based

**Chosen:** When `corruption` crosses a threshold, the hex's terrain type downgrades (e.g., `grassland` → `dead_forest`, `temperate_forest` → `swamp`). When `divineInfluence` crosses a threshold, terrain upgrades (e.g., `dead_forest` → `light_forest`, `desert` → `oasis`).

Transformations are defined in a static lookup table, not computed dynamically — inspectable and tunable.

**Why thresholds, not gradual?** Discrete terrain types are how the system works. A hex is either `grassland` or `moor_bog` — there's no gradient. Threshold-based transformation is clean, traceable ("corruption crossed 0.7, terrain changed"), and reversible (reduce corruption below threshold → terrain can recover).

**Implication:** Transformation only fires when the value crosses the threshold (not every tick), preventing flickering. A `terrainTransformedTick` property tracks when the last transformation happened, with a cooldown.

## Architecture

### HexTile Extension

```typescript
// Modified in src/types/index.ts

export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
  hasRiver?: boolean;
  regionId?: string;

  // ── New: Mutable hex state ──────────────────────────────────
  /** Divine influence level (0.0–1.0). Decays per tick. Default 0. */
  divineInfluence?: number;
  /** Corruption level (0.0–1.0). Decays per tick (slower). Default 0. */
  corruption?: number;
  /** Original terrain before any transformation (for recovery). */
  baseTerrain?: TerrainType;
  /** Tick when terrain was last transformed (cooldown). */
  terrainTransformedTick?: number;
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `HEX_DIVINE_INFLUENCE_DECAY_RATE` | `0.02` | Divine influence lost per tick |
| `HEX_CORRUPTION_DECAY_RATE` | `0.01` | Corruption lost per tick (slower — corruption lingers) |
| `HEX_CORRUPTION_TRANSFORM_THRESHOLD` | `0.7` | Corruption level that triggers terrain degradation |
| `HEX_DIVINE_TRANSFORM_THRESHOLD` | `0.8` | Divine influence level that triggers terrain upgrade |
| `HEX_TRANSFORM_COOLDOWN_TICKS` | `10` | Minimum ticks between terrain transformations |
| `HEX_INFLUENCE_VISIBILITY_THRESHOLD` | `0.3` | Min divine influence to grant fog-of-war visibility boost |

**Tracing:**

```typescript
export interface HexStateTickTrace {
  readonly category: 'hex_state';
  readonly type: 'hex_state_tick';
  readonly tick: number;
  readonly col: number;
  readonly row: number;
  readonly prevDivineInfluence: number;
  readonly newDivineInfluence: number;
  readonly prevCorruption: number;
  readonly newCorruption: number;
  readonly terrainChanged: boolean;
  readonly prevTerrain?: string;
  readonly newTerrain?: string;
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| `divineInfluence` missing on hex | Treat as 0.0 |
| `corruption` missing on hex | Treat as 0.0 |
| `baseTerrain` missing when trying to restore | Use current terrain as base |
| Hex coordinate out of bounds in mutation | Skip mutation, log warning |
| Transformation lookup has no entry for terrain type | No transformation, terrain stays |

**PRNG:** Not needed for hex state ticking — it's deterministic arithmetic. Terrain transformation is threshold-based, not random.

### HexMutation Type

```typescript
// New file: src/types/hexMutation.ts

export interface HexMutation {
  readonly col: number;
  readonly row: number;
  readonly field: 'divineInfluence' | 'corruption';
  readonly delta: number;
  readonly source: string;
}
```

### Terrain Transformation Table

```typescript
// New in src/data/terrain-transformation-content.ts

export interface TerrainTransformation {
  readonly from: TerrainType;
  readonly to: TerrainType;
  readonly trigger: 'corruption' | 'divineInfluence';
}

export const TERRAIN_TRANSFORMATIONS: readonly TerrainTransformation[] = [
  // Corruption degrades
  { from: 'grassland', to: 'moor_bog', trigger: 'corruption' },
  { from: 'farmland', to: 'grassland', trigger: 'corruption' },
  { from: 'temperate_forest', to: 'dead_forest', trigger: 'corruption' },
  { from: 'dense_forest', to: 'dead_forest', trigger: 'corruption' },
  { from: 'light_forest', to: 'dead_forest', trigger: 'corruption' },
  { from: 'boreal_forest', to: 'dead_forest', trigger: 'corruption' },
  { from: 'floodplain', to: 'swamp', trigger: 'corruption' },
  { from: 'savanna', to: 'badlands', trigger: 'corruption' },
  { from: 'hills', to: 'badlands', trigger: 'corruption' },
  { from: 'oasis', to: 'desert', trigger: 'corruption' },
  { from: 'steppe', to: 'rocky_desert', trigger: 'corruption' },

  // Divine influence restores / upgrades
  { from: 'dead_forest', to: 'light_forest', trigger: 'divineInfluence' },
  { from: 'moor_bog', to: 'grassland', trigger: 'divineInfluence' },
  { from: 'badlands', to: 'hills', trigger: 'divineInfluence' },
  { from: 'desert', to: 'oasis', trigger: 'divineInfluence' },
  { from: 'swamp', to: 'floodplain', trigger: 'divineInfluence' },
  { from: 'rocky_desert', to: 'steppe', trigger: 'divineInfluence' },
  { from: 'broken_lands', to: 'grassland', trigger: 'divineInfluence' },
];
```

| Constant | Default | Purpose |
|----------|---------|---------|
| All transformations are data | — | Tunable: add/remove rows to change what transforms into what |

### Location State Extensions

```typescript
// Location node properties additions (convention, not interface — stored in properties bag)

// node.properties.unrest: number (0–100, default 0)
// node.properties.magicalSaturation: number (0.0–1.0, default 0.0)
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNREST_DECAY_RATE` | `1` | Unrest decrease per tick (natural stabilization) |
| `UNREST_PROSPERITY_DAMPER` | `0.5` | Extra unrest decay when prosperity > 60 |
| `UNREST_DEFECTION_THRESHOLD` | `70` | Unrest level at which agent defection rolls begin |
| `UNREST_SACK_THRESHOLD` | `90` | Unrest level at which settlement can be sacked/downgraded |
| `MAGICAL_SATURATION_DECAY_RATE` | `0.02` | Saturation decrease per tick |
| `MAGICAL_SATURATION_VEIL_BONUS_THRESHOLD` | `0.5` | Saturation above which Veil-reach actions get +0.3 score |
| `MAGICAL_SATURATION_VISIBILITY_THRESHOLD` | `0.3` | Saturation above which divine visibility radius expands |

**Tracing:**

```typescript
export interface UnrestTickTrace {
  readonly category: 'unrest_tick';
  readonly tick: number;
  readonly locationId: string;
  readonly locationName: string;
  readonly prevUnrest: number;
  readonly newUnrest: number;
  readonly decayApplied: number;
  readonly prosperityDamper: number;
  readonly thresholdsCrossed: string[];  // 'defection' | 'sack'
}

export interface MagicalSaturationTickTrace {
  readonly category: 'saturation_tick';
  readonly tick: number;
  readonly locationId: string;
  readonly prevSaturation: number;
  readonly newSaturation: number;
  readonly decayApplied: number;
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| `unrest` missing on location node | Treat as 0, initialize on first write |
| `magicalSaturation` missing | Treat as 0.0, initialize on first write |
| Unrest exceeds 100 or goes below 0 | Clamp to 0–100 |
| Saturation exceeds 1.0 or goes below 0 | Clamp to 0.0–1.0 |

**PRNG:** Unrest defection rolls at threshold crossing use `mulberry32(seed + tick + agentId.hashCode())` for deterministic per-agent defection checks.

### Phase: phaseHexState

```typescript
// New file: src/engine/phaseHexState.ts

/**
 * Phase 6.7x — Tick hex state (divine influence + corruption decay,
 * terrain transformation checks).
 *
 * Runs once per tick. Iterates all tiles, decays values, checks thresholds.
 * Emits HexStateTickTrace per modified hex.
 */
export function phaseHexState(state: GameState): Partial<GameState> {
  // 1. Apply any pending HexMutations from resolved target_actions this tick
  // 2. Decay divineInfluence by HEX_DIVINE_INFLUENCE_DECAY_RATE
  // 3. Decay corruption by HEX_CORRUPTION_DECAY_RATE
  // 4. Check corruption threshold → terrain degradation
  // 5. Check divineInfluence threshold → terrain restoration
  // 6. Respect cooldown (terrainTransformedTick)
  // 7. Emit traces for any hex that changed
  // 8. Return { tiles: updatedTiles }
}
```

### Phase: phaseUnrest

```typescript
// New file: src/engine/phaseUnrest.ts

/**
 * Phase 6.7x — Tick unrest for all settlement locations.
 *
 * Runs after phaseProsperity. Decays unrest naturally;
 * prosperity acts as a damper. Checks defection/sack thresholds.
 */
export function phaseUnrest(state: GameState): Partial<GameState> {
  // 1. For each settlement location:
  //    a. Read current unrest (default 0)
  //    b. Apply decay: unrest -= UNREST_DECAY_RATE
  //    c. If prosperity > 60: extra decay of UNREST_PROSPERITY_DAMPER
  //    d. Clamp to 0–100
  //    e. If crossed UNREST_DEFECTION_THRESHOLD upward: emit event, flag agents for defection roll
  //    f. If crossed UNREST_SACK_THRESHOLD upward: emit event
  //    g. Write back to node.properties.unrest
  //    h. Emit UnrestTickTrace
}
```

### Phase: phaseMagicalSaturation

```typescript
// New file: src/engine/phaseMagicalSaturation.ts

/**
 * Phase 6.7x — Tick magical saturation for all locations.
 *
 * Simple decay phase. Saturation is driven UP by player actions and
 * sphere-aligned encounters; this phase only handles decay.
 */
export function phaseMagicalSaturation(state: GameState): Partial<GameState> {
  // 1. For each location:
  //    a. Read current magicalSaturation (default 0.0)
  //    b. Apply decay: magicalSaturation -= MAGICAL_SATURATION_DECAY_RATE
  //    c. Clamp to 0.0–1.0
  //    d. Write back
  //    e. Emit MagicalSaturationTickTrace
}
```

### Hex Action Templates (4 new)

```typescript
// Added to src/data/unified-action-templates.ts

// 1. Bless the Land (Star / Create)
{
  id: 'hex.bless_land',
  name: 'Bless the Land',
  reach: 'star',
  crudType: 'create',
  scale: 'regional',
  steps: [{ reach: 'star', duration: { min: 2, max: 4 }, difficulty: 0.3,
    onSuccess: [], // HexMutation: divineInfluence += 0.3
    onFailure: [],
    failBehavior: 'fail_action' }],
  apCost: 1,
  essenceCost: 3,
  actorAffinities: ['ascendant'],
  targetCategories: ['hex'],
  motivations: ['tradition_innovation', 'devotion_independence'],
  narrativeTemplates: {
    initiation: 'extends divine favor over this land',
    success: 'the earth drinks in the blessing — life stirs beneath the soil',
    failure: 'the land resists the divine touch; the blessing scatters',
  },
}

// 2. Corrupt the Land (Entropy sphere)
{
  id: 'hex.corrupt_land',
  name: 'Corrupt the Land',
  reach: 'veil',
  crudType: 'delete',
  scale: 'regional',
  steps: [{ reach: 'veil', duration: { min: 3, max: 5 }, difficulty: 0.4,
    onSuccess: [], // HexMutation: corruption += 0.25
    onFailure: [],
    failBehavior: 'fail_action' }],
  apCost: 1,
  essenceCost: 4,
  actorAffinities: ['ascendant'],
  sphereAffinity: 'entropy',
  targetCategories: ['hex'],
  motivations: ['cruelty_compassion', 'dominance_humility'],
  narrativeTemplates: {
    initiation: 'reaches into the foundations of this land with corrupting intent',
    success: 'darkness seeps into the soil — the land begins to wither',
    failure: 'the land holds firm against the corruption',
  },
}

// 3. Survey Territory (Eye / Read)
{
  id: 'hex.survey',
  name: 'Survey Territory',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [{ reach: 'eye', duration: { min: 1, max: 1 }, difficulty: 0.1,
    onSuccess: [], // Effect: reveal fog-of-war for this hex + all adjacent hexes
    onFailure: [],
    failBehavior: 'continue_weakened' }],
  apCost: 1,
  essenceCost: 0,  // Free — observation action
  actorAffinities: ['ascendant'],
  targetCategories: ['hex'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'casts divine sight across this territory',
    success: 'the land reveals its secrets — features, resources, and dwellers become clear',
    failure: 'the land is shrouded; divine sight gains only fragments',
  },
}

// 4. Seed Life (Flesh / Create)
{
  id: 'hex.seed_life',
  name: 'Seed Life',
  reach: 'flesh',
  crudType: 'create',
  scale: 'regional',
  steps: [{ reach: 'flesh', duration: { min: 4, max: 8 }, difficulty: 0.5,
    onSuccess: [], // HexMutation: divineInfluence += 0.5 (large, slow action)
    onFailure: [],
    failBehavior: 'fail_action' }],
  apCost: 1,
  essenceCost: 6,
  actorAffinities: ['ascendant'],
  sphereAffinity: 'life',
  targetCategories: ['hex'],
  targetSubtypes: ['desert', 'rocky_desert', 'tundra', 'badlands', 'dead_forest',
    'broken_lands', 'sand_dunes', 'moor_bog'],  // Only barren/damaged terrain
  motivations: ['cruelty_compassion', 'tradition_innovation'],
  narrativeTemplates: {
    initiation: 'pours vital essence into this barren ground',
    success: 'life takes root where none grew before — green tendrils pierce dead earth',
    failure: 'the land is too far gone; the seeds of life cannot find purchase',
  },
}
```

### Enhanced Location Action Templates (modify existing)

Update existing location templates to also write `unrest` or `magicalSaturation` via `update_node` GraphOps:

**Incite Unrest** — `onSuccess` adds GraphOp: `{ op: 'update_node', nodeId: '$target', changes: { unrest: '+20' } }`

**Ward This Place** — `onSuccess` adds GraphOp: `{ op: 'update_node', nodeId: '$target', changes: { magicalSaturation: '+0.15' } }` (in addition to existing `add_edge: warded`)

**Establish Place of Power** — `onSuccess` adds: `{ op: 'update_node', nodeId: '$target', changes: { magicalSaturation: '+0.3' } }`

**Note on relative changes:** The GraphOp executor's `update_node` handler currently does direct property replacement. This design requires supporting **relative changes** — a `changes` value prefixed with `+` or `-` means "add to current value" rather than "set to value." This is a small extension to `graphOpExecutor.ts`.

### GraphOp Executor Extension: Relative Changes

```typescript
// Modified in src/engine/graphOpExecutor.ts — update_node handler

// For each key in changes:
//   If value is a string starting with '+' or '-': parse as number, add to current
//   Otherwise: direct replacement (existing behavior)

function applyChanges(
  current: Record<string, unknown>,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...current };
  for (const [key, value] of Object.entries(changes)) {
    if (typeof value === 'string' && (value.startsWith('+') || value.startsWith('-'))) {
      const delta = parseFloat(value);
      const prev = typeof result[key] === 'number' ? result[key] as number : 0;
      result[key] = prev + delta;
    } else {
      result[key] = value;
    }
  }
  return result;
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| — | — | No new constants; behavior is driven by the value format |

**Fail-soft:** Non-numeric strings that start with `+`/`-` but aren't parseable → `NaN` → skip that key, log warning.

### Hex Action Resolution Bridge

Since hex actions produce `HexMutation[]` instead of `GraphOp[]`, the resolution pipeline needs a bridge:

```typescript
// New in src/engine/hexActionBridge.ts

/**
 * Convert a resolved hex target_action into HexMutation[].
 *
 * Called by the resolution pipeline when a UnifiedAction with source='player'
 * resolves against a hex target (targetId starts with 'hex_').
 */
export function resolveHexAction(
  templateId: string,
  targetCol: number,
  targetRow: number,
  outcome: 'success' | 'failure',
): HexMutation[] {
  // Lookup template, return mutations based on outcome
}
```

The hex action bridge maps template IDs to HexMutation deltas. This is a simple lookup — no complex logic.

| Constant | Default | Purpose |
|----------|---------|---------|
| `HEX_BLESS_INFLUENCE_DELTA` | `0.3` | Divine influence added by Bless the Land |
| `HEX_CORRUPT_CORRUPTION_DELTA` | `0.25` | Corruption added by Corrupt the Land |
| `HEX_SEED_INFLUENCE_DELTA` | `0.5` | Divine influence added by Seed Life (large, slow) |
| `HEX_SURVEY_VISIBILITY_RADIUS` | `1` | Hex rings revealed by Survey Territory |

**Tracing:**

```typescript
export interface HexActionResolvedTrace {
  readonly category: 'action';
  readonly type: 'hex_action_resolved';
  readonly tick: number;
  readonly templateId: string;
  readonly col: number;
  readonly row: number;
  readonly outcome: string;
  readonly mutations: HexMutation[];
}
```

### buildHexTargetContext Update

The existing `buildHexTargetContext` needs to pass the new fields through to `properties` so the UI can display them:

```typescript
// Updated in src/engine/targetContextBuilders.ts

export function buildHexTargetContext(params: {
  col: number;
  row: number;
  terrain: string;
  nodeId?: string;
  divineInfluence?: number;  // NEW
  corruption?: number;        // NEW
  properties?: Record<string, unknown>;
}): TargetContext {
  const { col, row, terrain, nodeId, divineInfluence, corruption, properties } = params;
  return {
    nodeId: nodeId ?? `hex_${col}_${row}`,
    nodeType: 'location',
    displayName: `Hex (${col}, ${row})`,
    displayLabel: terrain,
    subtype: terrain,
    traitIds: [],
    sphereAffinity: null,
    position: { col, row },
    properties: {
      ...properties,
      terrain,
      divineInfluence: divineInfluence ?? 0,
      corruption: corruption ?? 0,
    },
  };
}
```

## Implementation Plan

### Phase 1: Hex Mutable State

**Files to create:**
1. `src/types/hexMutation.ts` — `HexMutation` interface
2. `src/data/terrain-transformation-content.ts` — `TERRAIN_TRANSFORMATIONS` lookup table
3. `src/engine/phaseHexState.ts` — `phaseHexState` tick phase (decay + transformation)
4. `src/engine/hexActionBridge.ts` — template ID → HexMutation[] mapper

**Files to modify:**
5. `src/types/index.ts` — add `divineInfluence?`, `corruption?`, `baseTerrain?`, `terrainTransformedTick?` to `HexTile`
6. `src/types/trace.ts` — add `HexStateTickTrace`, `HexActionResolvedTrace`
7. `src/engine/orchestrator.ts` — wire `phaseHexState` into the tick loop (Phase 6.7x)
8. `src/engine/targetContextBuilders.ts` — update `buildHexTargetContext` to accept/pass new fields

**Tests:**
9. `src/engine/__tests__/phaseHexState.test.ts` — decay tests, threshold tests, cooldown, transformation table, fail-soft for missing values
10. `src/engine/__tests__/hexActionBridge.test.ts` — template→mutation mapping, unknown template fallback

### Phase 2: Hex Action Templates

**Files to modify:**
11. `src/data/unified-action-templates.ts` — add 4 hex templates (Bless the Land, Corrupt the Land, Survey Territory, Seed Life) with `targetCategories: ['hex']`
12. `src/engine/targetActions.ts` — ensure `'hex'` target category works in the filter cascade (verify the existing `nodeType === 'location' && subtype === 'hex'` logic handles this, or adjust)

**Files to modify (resolution bridge):**
13. `src/engine/unifiedActionResolution.ts` (or wherever target_action slot clicks create UnifiedActions) — detect hex targets and route through `hexActionBridge` on resolution

**Tests:**
14. Template validation tests — hex templates have correct targetCategories, targetSubtypes
15. Integration test — hex action creation → resolution → HexMutation applied → tile state changed

### Phase 3: Location State Extensions

**Files to create:**
16. `src/engine/phaseUnrest.ts` — `phaseUnrest` tick phase
17. `src/engine/phaseMagicalSaturation.ts` — `phaseMagicalSaturation` tick phase

**Files to modify:**
18. `src/types/trace.ts` — add `UnrestTickTrace`, `MagicalSaturationTickTrace`
19. `src/engine/orchestrator.ts` — wire both new phases (after phaseProsperity)
20. `src/engine/graphOpExecutor.ts` — add relative-change support to `update_node` handler

**Tests:**
21. `src/engine/__tests__/phaseUnrest.test.ts` — decay, prosperity damper, threshold crossing, defection flag, clamping
22. `src/engine/__tests__/phaseMagicalSaturation.test.ts` — decay, clamping
23. `src/engine/__tests__/graphOpExecutor-relative.test.ts` — relative changes (`+20`, `-5`, `+0.15`), non-numeric fallback

### Phase 4: Enhanced Location Templates + Wiring

**Files to modify:**
24. `src/data/unified-action-templates.ts` — update existing location templates (Incite Unrest, Ward, Place of Power) to include `update_node` GraphOps writing to unrest / magicalSaturation
25. Wire HexZoom detail view to pass `divineInfluence`/`corruption` from the tile to `buildHexTargetContext`

**Tests:**
26. Integration — Incite Unrest → unrest increases on target location
27. Integration — Ward → magicalSaturation increases on target location

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | PASS | 13 new named constants. Terrain transformation table is pure data. All decay rates, thresholds, and deltas are constants, not hardcoded. |
| 2 | Inspectability | PASS | 4 new trace types (HexStateTickTrace, HexActionResolvedTrace, UnrestTickTrace, MagicalSaturationTickTrace). Every hex and location state change is traced with before/after values. |
| 3 | Determinism | PASS | All decay is arithmetic (no randomness). Defection rolls use seeded PRNG. Terrain transformations are threshold-based (deterministic). |
| 4 | Fail-soft | PASS | Every new field defaults to 0 when missing. Unknown terrain in transformation table → no-op. Invalid hex coordinates → skip. GraphOp relative change on non-numeric → skip with warning. |
| 5 | Narrative > mechanical | PASS | Terrain transformation is the narrative payoff — the player literally reshapes the world map. Prose templates describe divine acts, not numeric operations. |
| 6 | Additive > destructive | PASS | 4 optional fields added to HexTile. 2 new properties on location nodes (stored in existing `properties` bag). New tick phases are additive. GraphOp executor extended, not rewritten. |
| 7 | Performance budget | PASS | Hex state phase iterates tiles once per tick (~2000 tiles, O(1) per tile). Location phases iterate only settlement-type nodes. Terrain transformation lookup is O(1) via Map. No new per-frame costs. |
