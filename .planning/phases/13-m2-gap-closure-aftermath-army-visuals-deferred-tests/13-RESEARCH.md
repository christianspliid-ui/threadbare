# Phase 13: M2 Gap Closure — Aftermath, Army Visuals, Deferred Tests — Research

**Researched:** 2026-03-30
**Domain:** Engine aftermath integration, Three.js InstancedMesh scene layers, Vitest contract test completion
**Confidence:** HIGH — all findings are based on direct source code inspection of the existing codebase

## Summary

Phase 13 closes the three open M2 gaps from Phase 12 (Conflict & Destruction). This is a gap-closure phase, not a greenfield phase — every implementation target has a clear insertion point in existing code, and the patterns to follow are already present in the codebase.

Work stream 1 (aftermath sphere pressure + refugee trace stub) is a direct insertion into `applyAftermath()` in `battleAftermath.ts`. The sphere pressure pipeline already exists and handles all the hard work — aftermath merely needs to push `SpherePressureEvent` objects into `state.pendingSpherePressures` using the victor's dominant sphere. Refugee generation is deferred: replace the two REFUGEE_GENERATION constants with a documented note, emit a trace field `refugeeEncountersGenerated: 0`.

Work stream 2 (deferred tests) requires creating two new source files (`battleSpotlights.ts` and the `generateRegionalEncounters` function in `siegeResolution.ts`). The test contracts in `battleThreadVisibility.test.ts` and `siegeRegionalEncounters.test.ts` define the exact function signatures and behaviors expected. Both functions use existing graph traversal patterns and the `hexDistance` utility from `delivery.ts`.

Work stream 3 (HexMapV2 army visual layers) follows the InstancedMesh + texture atlas pattern established in `SignifierMesh.ts`. The UI-SPEC has already locked all visual constants (sizes, colors, Z values, zoom visibility). Three new scene modules need creating (`ArmySpriteMesh.ts`, `BattleIndicatorMesh.ts`, `SiegeIndicatorMesh.ts`) and wiring into `HexMapV2.tsx` alongside the existing agent and signifier meshes.

**Primary recommendation:** Implement in stream order — engine (no dependencies), tests (no dependencies), then visuals (no dependencies on the other streams). All three streams are independent and can be planned as separate wave tasks.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Aftermath Sphere Pressure**
- Apply a small bonus sphere pressure spike to the battle hex after resolution, on top of natural effects (army presence + destruction already shift spheres)
- Multipliers by severity: minor = 1.0, major = 1.5, total = 2.0
- Sphere to pressure: victor faction's dominant sphere (highest score in faction node's sphereAffinity)
- Use existing phaseSpherePressure pipeline — push a SpherePressureEvent to the settlement/hex location node
- Populate trace fields: `spherePressureApplied` with applied values

**Refugee Generation**
- Deferred to a later phase — do NOT implement refugee spawning logic
- Log a trace noting "refugees deferred" with count (1 for major, 3 for total) for future implementation
- Populate trace field `refugeeEncountersGenerated: 0` with a comment that this is deferred
- Remove/update the REFUGEE_GENERATION constants to document deferred status

**Battle Thread Visibility (7 tests)**
- Fully implement `hasThreadToBattle(ascendantId, battleState)` — check if player's ascendant has thread-of-fate edges to any battle participant
- Fully implement `selectSpotlight(ascendantId, battleState, prng)` — seeded selection of spotlight encounter template from eligible set
- These enable first-person POV narration when the player is connected to a battle participant
- 7 deferred .todo tests in battleThreadVisibility.test.ts define the full contract

**Regional Siege Encounters (6 tests)**
- Fully implement `generateRegionalEncounters(state, siegeState, prng)` — scan agents within SIEGE_REGIONAL_ENCOUNTER_RANGE
- Encounter types: call_for_aid (allied agents), smuggle_supplies (Shadow-capable), negotiate_terms (Heart-capable)
- No duplicate encounters per actor per siege; no encounters for actors already in battles
- 6 deferred .todo tests in siegeRegionalEncounters.test.ts define the full contract

**Army Visual Representation**
- Faction-colored shield icon using instanced mesh (follow SignifierMesh pattern with InstancedMesh + texture atlas)
- Army size encoded by icon scale: small/medium/large based on army size thresholds
- Distinct from agent dots — armies are shield-shaped, agents are circular
- Register army visual layer in RenderLayers.ts with appropriate Z constant (between agents and signifiers)

**Battle Indicators**
- Crossed-swords icon replacing both army icons during active battle
- Pulsing animation (opacity oscillation) to draw attention
- Single visual element per battle (not per army)

**Siege Indicators**
- Ring of siege icons around the settlement being sieged
- Faction-colored to match the besieging army
- Settlement hex gets a darkened overlay (reduced opacity filter on terrain)

### Claude's Discretion
- Exact icon artwork/texture atlas layout for army, battle, siege sprites
- Specific animation timing for battle pulse
- Z-ordering values for new render layers
- Internal implementation details for thread visibility graph traversal
- Encounter template IDs and content for regional siege encounters

### Deferred Ideas (OUT OF SCOPE)
- Refugee generation system — full implementation with refugee encounters at neighboring settlements, population effects, sphere contamination. Planned for a future phase.
- Army movement animation (marching along roads)
- Army leader portrait in army sprite
- Siege visual encirclement animation
- M2.5 Monster Encounters (TB-051) — entirely separate phase needed
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | Already in project | InstancedMesh, ShaderMaterial, Sprite for visual layers | Project standard; no R3F per CLAUDE.md |
| vitest | Already in project | Test runner for .todo → implemented tests | Project standard test framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | Already in project | All new source files | Always |

No new packages needed. This phase is entirely within the existing tech stack.

---

## Architecture Patterns

### Existing Source Files — Insertion Points

**Engine Work Stream**

| File | Change Type | Insertion Point |
|------|-------------|-----------------|
| `src/engine/battleAftermath.ts` | Modify | After line 212 (after commander fate, before disband) |
| `src/engine/battleAftermath.ts` | Modify | Constants section: update REFUGEE_GENERATION_MAJOR/TOTAL to document deferred |
| `src/engine/battleAftermath.ts` | Modify | emitTrace call (line 247): add `spherePressureApplied`, `refugeeEncountersGenerated: 0` fields |

**New file for thread visibility:**
- `src/engine/battleSpotlights.ts` — exports `hasThreadToBattle` and `selectSpotlight`

**Modify for siege encounters:**
- `src/engine/siegeResolution.ts` — add `generateRegionalEncounters` function, already referenced in test

**Visual Work Stream**

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/components/HexMapV2/scene/RenderLayers.ts` | Modify | Add `ARMIES` and `BATTLE_INDICATOR` to `LAYER_Z` |
| `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts` | Modify | Add `armies`, `battle_indicator`, `siege_ring` to visibility matrix |
| `src/components/HexMapV2/scene/ArmySpriteMesh.ts` | New | InstancedMesh army shields |
| `src/components/HexMapV2/scene/BattleIndicatorMesh.ts` | New | Pulsing crossed-swords indicators |
| `src/components/HexMapV2/scene/SiegeIndicatorMesh.ts` | New | Ring + hex darkening for sieges |
| `src/components/HexMapV2/HexMapV2.tsx` | Modify | Wire the three new mesh factories into scene init |

### Pattern 1: Sphere Pressure Injection in applyAftermath

The `phaseControlEffects.ts` file shows exactly how to push pressure events:

```typescript
// Source: src/engine/phaseControlEffects.ts lines 264-273
pressures.push({
  targetEntityId: effect.targetNodeId,
  sphere: sphere as SphereName,
  magnitude: CONTROL_PRESSURE_PER_TICK,
  source: 'control_effect',
  sourceId: effect.effectId,
});
```

For aftermath, the pattern becomes:

```typescript
// In applyAftermath, after commander fate determination:
// Find victor faction's dominant sphere from faction node's sphereAffinity
const victorNode = graph.getNode(victorArmyId);
const victorMemberEdges = victorNode ? graph.getOutgoingEdges(victorArmyId, 'member_of') : [];
const factionId = victorMemberEdges[0]?.target;
const factionNode = factionId ? graph.getNode(factionId) : null;
const factionAffinity = factionNode?.properties.sphereAffinity as SphereAffinity | undefined;

// Find dominant sphere (highest score)
let dominantSphere: SphereName = 'Force'; // fallback
if (isValidSphereAffinity(factionAffinity)) {
  let maxScore = -1;
  for (const [sphere, score] of Object.entries(factionAffinity.scores)) {
    if (score > maxScore) { maxScore = score; dominantSphere = sphere as SphereName; }
  }
}

// Severity multiplier
const AFTERMATH_PRESSURE_MULTIPLIERS: Record<DestructionSeverity, number> = {
  minor: 1.0,
  major: 1.5,
  total: 2.0,
};
const pressureMagnitude = AFTERMATH_BASE_PRESSURE * AFTERMATH_PRESSURE_MULTIPLIERS[severity];

// Target: settlement/hex location node
const pressureTargetId = settlementId ?? battleState.settlementId;
if (pressureTargetId) {
  (state.pendingSpherePressures ?? []).push({
    targetEntityId: pressureTargetId,
    sphere: dominantSphere,
    magnitude: pressureMagnitude,
    source: 'environmental',
    sourceId: `aftermath_${state.tick}`,
  });
}
```

Note: `state.pendingSpherePressures` is the accumulator array on `GameState` — check `src/types/gameState.ts` for the property name. The phaseSpherePressure orchestrator phase consumes it each tick.

### Pattern 2: hasThreadToBattle via Graph Traversal

The `thread` edge type goes `ascendant → mortal` (source=ascendant, target=mortal). To find battle participants from `battleState`:
- `battleState.attackerArmyId` → get outgoing `commanded_by` edges → commander node
- `battleState.defenderArmyId` → same

```typescript
// Source: src/types/edgeSchema.ts line 133 — thread direction: ascendant is source
// Source: src/engine/essenceIncome.ts line 60 — pattern for querying thread edges

export function hasThreadToBattle(
  ascendantId: string,
  battleState: BattleState,
  graph: WorldGraph,
): boolean {
  // Get all mortals the ascendant has threads to
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadTargetIds = new Set(threadEdges.map(e => e.target));

  // Get all battle participants: both armies + their commanders
  const participantIds = new Set<string>([
    battleState.attackerArmyId,
    battleState.defenderArmyId,
  ]);
  // Add commanders
  for (const armyId of [battleState.attackerArmyId, battleState.defenderArmyId]) {
    const cmdEdges = graph.getOutgoingEdges(armyId, 'commanded_by');
    cmdEdges.forEach(e => participantIds.add(e.target));
  }

  // Check intersection
  for (const participantId of participantIds) {
    if (threadTargetIds.has(participantId)) return true;
  }
  return false;
}
```

### Pattern 3: generateRegionalEncounters — Range + Capability Check

Use `hexDistance` from `src/engine/delivery.ts` (identical to `src/lib/hexMath.ts` but operates on `{ col, row }` objects):

```typescript
// Source: src/engine/delivery.ts lines 19-30
export function hexDistance(a: HexPosition, b: HexPosition): number {
  const ax = a.col - Math.floor(a.row / 2);
  // ... cube coordinate conversion
}
```

Siege hex position: get the battle/siege node → `located_at` edge → location node (hex). Agent location: agent node → `located_at` edge → location node.

Capability check pattern for Shadow/Heart — look at `armyState` or actor reach capabilities. The existing encounter system uses `reach` or `domainCapabilities` on actor nodes.

Duplicate prevention: check `battleState.spotlightHistory` for encounter IDs already spawned in this siege. Use a Set membership check per actor-siege pair.

### Pattern 4: InstancedMesh + Texture Atlas (ArmySpriteMesh)

Follow `SignifierMesh.ts` exactly:

```typescript
// Source: SignifierMesh.ts
// Key components:
// 1. PlaneGeometry(1,1) cloned per mesh type
// 2. ShaderMaterial with uAtlas uniform, aUvRect and aFogAlpha instance attributes
// 3. buildAtlas() to composite variants onto one canvas texture
// 4. Per-instance Matrix4 (position + rotation + scale)
// 5. group.meta with hexInstanceMap for fog culling

// Army shield differs from signifier:
// - Army positions come from graph nodes (not tiles array)
// - Army has one instance per army node (not per hex)
// - Color is faction-heraldic (use FACTION_HERALDIC_COLORS from agentSpriteTypes)
// - Scale is army-size-based (ARMY_SIZE_SMALL_MAX=49, ARMY_SIZE_MEDIUM_MAX=149)
```

For per-instance color tinting, there are two approaches:
1. Build 6 separate atlas variants (one per faction color) — simpler but more draw calls
2. Add a per-instance `aColor` attribute (vec3) and multiply in fragment shader — one draw call, more GPU work

Given that there are typically few armies (< 20), **approach 1 (separate atlas per faction color)** is simpler and sufficient. Follow the SignifierMesh pattern of one InstancedMesh per variant grouping.

### Pattern 5: Battle Pulse Animation in Render Loop

The avatar pulse in `AgentSpriteMesh.ts` (look for `tickAvatarPulse`) demonstrates the render loop animation pattern:

```typescript
// Called each frame from HexMapV2's animation loop
// Uses THREE.Clock or tick-based time for deterministic animation
// Modifies sprite.material.opacity directly — no React state changes

export function tickBattlePulse(
  battleGroup: BattleIndicatorGroup,
  elapsedMs: number,
): void {
  const t = (elapsedMs % BATTLE_PULSE_PERIOD_MS) / BATTLE_PULSE_PERIOD_MS;
  const opacity = BATTLE_PULSE_MIN + (BATTLE_PULSE_MAX - BATTLE_PULSE_MIN) *
    (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
  battleGroup.sprite.material.opacity = opacity;
  battleGroup.sprite.material.needsUpdate = true;
}
```

Constants (all named per NFP #1):
- `BATTLE_PULSE_PERIOD_MS = 1200` (per UI-SPEC)
- `BATTLE_PULSE_MIN = 0.4`, `BATTLE_PULSE_MAX = 1.0` (per UI-SPEC)

### Pattern 6: Hex Darkening for Siege Overlay

The siege hex darkening is NOT a separate mesh. It's a per-instance color attribute modification on `HexFillMesh`. Look at how fog culling modifies hex colors via `updateFogColors` in `HexMapV2.tsx` — siege darkening follows the same per-instance color mutation pattern.

```typescript
// Existing color cache pattern (buildOriginalColorCache in FogCulling.ts)
// Siege darkening: multiply the stored RGB by 0.75 for besieged hex instances
// Revert on siege end

// Must track "which hexes are under siege" in a Set<string> (hex key)
// and update when siege starts/ends via the same useEffect that watches game state
```

### Recommended Project Structure for New Files

```
src/
├── engine/
│   ├── battleAftermath.ts       (modify: +sphere pressure, +refugee stub)
│   ├── battleSpotlights.ts      (new: hasThreadToBattle, selectSpotlight)
│   └── siegeResolution.ts       (modify: +generateRegionalEncounters)
└── components/HexMapV2/
    └── scene/
        ├── RenderLayers.ts      (modify: +ARMIES, +BATTLE_INDICATOR Z values)
        ├── ZoomVisibilityMatrix.ts (modify: +armies/battle_indicator/siege_ring)
        ├── ArmySpriteMesh.ts    (new: shield InstancedMesh)
        ├── BattleIndicatorMesh.ts (new: crossed-swords pulse sprite)
        └── SiegeIndicatorMesh.ts  (new: ring icons + hex darkening control)
```

### Anti-Patterns to Avoid

- **Do not implement refugee spawning** — explicitly deferred. Only trace the intent.
- **Do not use React state for battle pulse** — mutate Three.js material in render loop directly (see avatar pulse pattern).
- **Do not add a new overlay/DOM element for siege darkening** — darken the hex fill instance color directly.
- **Do not create a separate texture per battle/siege instance** — share textures (one atlas per icon type, instances share it).
- **Do not use Object.keys() on graph.nodes** — it is a `Map`. Use `graph.getNodesByType()` or `Map.entries()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sphere pressure resolution | Custom pressure math | `phaseSpherePressure` pipeline | It already handles cancellation, constructive/destructive, level-up logic |
| Hex distance for siege range | Custom distance formula | `hexDistance()` from `delivery.ts` | Cube-coordinate conversion is already correct and tested |
| Seeded PRNG | Custom random | `mulberry32()` local pattern (already in battleAftermath.ts, siegeResolution.ts) | Determinism requirement — identical pattern in both engine files |
| Per-frame animation time | `Date.now()` | THREE.Clock delta passed in from render loop | Consistent with existing avatar pulse pattern |
| Faction color lookup | Hardcoded hex strings | `FACTION_HERALDIC_COLORS` from `agentSpriteTypes.ts` | Same colors used by agent dots — visual consistency |
| Graph traversal for armies | Custom query | `graph.getNodesByType('actor').filter(n => n.properties.armyState != null)` | Established pattern in DebugPanel ArmiesTab |

---

## Common Pitfalls

### Pitfall 1: pendingSpherePressures Mutation
**What goes wrong:** `state.pendingSpherePressures` may be `undefined` if no pressures have been added yet. Direct push crashes.
**Why it happens:** The array is lazily initialized on GameState.
**How to avoid:** Always use `(state.pendingSpherePressures ?? [])` or initialize: `if (!state.pendingSpherePressures) state.pendingSpherePressures = [];`
**Warning signs:** TypeScript error `Cannot read properties of undefined (reading 'push')`.

### Pitfall 2: Battle Node Has No settlementId for Field Battles
**What goes wrong:** Aftermath sphere pressure targets `settlementId` — which is `undefined` for field battles (only sieges have a settlement).
**Why it happens:** `BattleState.settlementId` is optional (`settlementId?: string`).
**How to avoid:** Fallback to the battle/siege hex's `located_at` location node if `settlementId` is absent. If neither is available, skip pressure (fail-soft).
**Warning signs:** Aftermath runs but no pressure events emitted for field battles.

### Pitfall 3: Victor Faction Has All-Zero SphereAffinity
**What goes wrong:** All sphere scores are 0 → dominant sphere lookup returns the last-iterated sphere (non-deterministic).
**Why it happens:** Factions are initialized with default (all-zero) affinity and may not have been pressured yet.
**How to avoid:** Check `maxScore > 0` before using the dominant sphere; fallback to `'Force'` (or any defined constant) deterministically.
**Warning signs:** Tests fail non-deterministically based on iteration order of SPHERE_NAMES.

### Pitfall 4: Thread Edge Direction
**What goes wrong:** `hasThreadToBattle` returns false even when a thread exists.
**Why it happens:** Thread edges are directed: `source = ascendant`, `target = mortal`. Querying `getIncomingEdges(ascendantId, 'thread')` finds edges where ascendant is the TARGET (wrong direction).
**How to avoid:** Use `graph.getOutgoingEdges(ascendantId, 'thread')` — the ascendant is the source.
**Warning signs:** All 4 `hasThreadToBattle` tests fail.

### Pitfall 5: ZoomVisibilityMatrix Missing New Layer Keys
**What goes wrong:** New army/battle/siege mesh groups are added to the scene but never toggle visibility with zoom.
**Why it happens:** `ZOOM_VISIBILITY_MATRIX` in `ZoomVisibilityMatrix.ts` is the single source of truth. Adding a group to the scene doesn't auto-register it.
**How to avoid:** Add `'armies'`, `'battle_indicator'`, `'siege_ring'` entries to the matrix AND hook the group refs into `useZoomLayerVisibility`.
**Warning signs:** Armies visible at full-world zoom (should be hidden).

### Pitfall 6: InstancedMesh count Must Be Known at Construction
**What goes wrong:** `new THREE.InstancedMesh(geo, mat, count)` — if count changes at runtime (army spawned/disbanded), the mesh cannot resize.
**Why it happens:** Three.js InstancedMesh count is fixed at construction time.
**How to avoid:** Either (a) set count to a generous max (e.g., 64) and use `mesh.count` to hide unused instances, or (b) rebuild the mesh on army list changes (same as how AgentSpriteMesh is rebuilt). Option (b) is simpler and consistent with the existing pattern.
**Warning signs:** Crash or missing armies after first army spawns/disbands.

### Pitfall 7: Siege Darkening Must Restore on Siege End
**What goes wrong:** Settlement hex stays darkened after siege resolves.
**Why it happens:** Per-instance color attribute is mutated but never restored.
**How to avoid:** Track which hexes are under active siege in a `Set<string>`. When siege resolves (battleState removed from node), restore the original hex fill color from `originalColorCache`.
**Warning signs:** Settlements appear permanently darkened after a siege.

---

## Code Examples

### Pushing Aftermath Sphere Pressure

```typescript
// Source: src/engine/phaseControlEffects.ts (lines 264-273) — adapted for aftermath
const AFTERMATH_BASE_PRESSURE = 2; // named constant (NFP #1)
const AFTERMATH_PRESSURE_MULTIPLIERS: Record<DestructionSeverity, number> = {
  minor: 1.0,
  major: 1.5,
  total: 2.0,
};

// After severity is known and victorArmyId is set
const pressureTarget = settlementId ?? battleHexLocationId;
if (pressureTarget) {
  const magnitude = AFTERMATH_BASE_PRESSURE * AFTERMATH_PRESSURE_MULTIPLIERS[severity];
  if (!state.pendingSpherePressures) state.pendingSpherePressures = [];
  state.pendingSpherePressures.push({
    targetEntityId: pressureTarget,
    sphere: dominantSphere,
    magnitude,
    source: 'environmental',
    sourceId: `aftermath_${battleState.attackerArmyId}_${state.tick}`,
  });
}
```

### Updated emitTrace Call

```typescript
// Extend the existing emitTrace at end of applyAftermath:
emitTrace({
  tick: state.tick,
  category: 'faction_ambition',
  summary: `Aftermath: ...`,
  event: 'aftermath_applied',
  severity,
  resolutionType,
  settlementId,
  sublocationsDestroyed,
  tradeRoutesSevered,
  prosperityBefore,
  prosperityAfter,
  commanderFate,
  commanderId,
  spherePressureApplied: pressureTarget ? { sphere: dominantSphere, magnitude } : null,
  refugeeEncountersGenerated: 0, // deferred — see REFUGEE_GENERATION_DEFERRED
});
```

### Refugee Constants — Deferred Documentation

```typescript
// Replace in battleAftermath.ts constants section:

/** @deprecated REFUGEE_GENERATION: deferred to future phase.
 * When implemented, major defeat = 1 refugee encounter, total destruction = 3.
 * Implementation will spawn refugee child encounters at neighboring settlements.
 */
export const REFUGEE_GENERATION_MAJOR_DEFERRED = 1;
export const REFUGEE_GENERATION_TOTAL_DEFERRED = 3;
```

### ArmySpriteMesh Factory Signature

```typescript
// New file: src/components/HexMapV2/scene/ArmySpriteMesh.ts
// Follows: createSignifierMesh pattern (InstancedMesh + atlas)
// Follows: createAgentSpriteMesh rebuild-on-change pattern

export interface ArmyRenderData {
  armyId: string;
  hexCol: number;
  hexRow: number;
  factionColor: string;   // from FACTION_HERALDIC_COLORS
  armySize: number;       // determines sprite scale tier
  isInBattle: boolean;    // if true, suppress army sprite (battle indicator shows instead)
}

export interface ArmyIndicatorGroup {
  group: THREE.Group;
  tick: (elapsedMs: number) => void;  // for battle pulse animation
}

export function createArmySpriteMesh(armies: ArmyRenderData[]): THREE.Group
```

### ZoomVisibilityMatrix Extension

```typescript
// Add to ZOOM_VISIBILITY_MATRIX in ZoomVisibilityMatrix.ts:
armies: {
  'hero-local': true,
  regional: true,
  continental: true,
  'full-world': false,
},
battle_indicator: {
  'hero-local': true,
  regional: true,
  continental: true,
  'full-world': false,
},
siege_ring: {
  'hero-local': true,
  regional: true,
  continental: true,
  'full-world': false,
},
```

### RenderLayers Extension

```typescript
// Add to LAYER_Z in RenderLayers.ts:
ARMIES:            0.090,  // Between TRAILS (0.085) and AGENTS (6.000) per UI-SPEC
BATTLE_INDICATOR:  6.050,  // Between AGENTS (6.000) and EVENTS (6.100) per UI-SPEC
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| REFUGEE_GENERATION constants active | Constants renamed `_DEFERRED`, refugeeEncountersGenerated=0 in trace | Phase 13 | Removes misleading dead code; future refugee impl can rename back |
| .todo test stubs | Implemented tests with real function imports | Phase 13 | 13 tests activate, test suite completeness improves |
| No army visuals on hex map | InstancedMesh army shields + battle/siege indicators | Phase 13 | Military state becomes visible to player on map |

---

## Open Questions

1. **Where is the battle hex location node for field battles?**
   - What we know: siege nodes have `settlementId`; field battles are located at a hex via `located_at` edge
   - What's unclear: the `applyAftermath` function receives `battleState` but the hex location ID is not stored on `BattleState` directly — it's on the battle node via `located_at` edge, and the battle node ID is not passed to `applyAftermath`
   - Recommendation: Either (a) pass the battle node ID into `applyAftermath`, or (b) query `graph.getNodesByType('actor').filter(n => n.properties.battleState === battleState)[0]` to get the battle node, then follow its `located_at` edge. Option (b) is slower but avoids changing the function signature. Check if battle node ID is already accessible at the call site.

2. **selectSpotlight encounter template pool**
   - What we know: The test contract requires selecting from "eligible templates" for current battle state
   - What's unclear: Where is the spotlight encounter template pool defined? Phase 12 plans may have created these templates but the test file doesn't reference specific IDs
   - Recommendation: Check `src/data/encounter-templates/` or similar for spotlight templates. If none exist yet, create a minimal stub pool (e.g., 2-3 templates) sufficient to make the tests pass without full content.

3. **generateRegionalEncounters — how to check Shadow/Heart capability**
   - What we know: Encounter types `smuggle_supplies` (Shadow) and `negotiate_terms` (Heart) require specific capability
   - What's unclear: Whether capability check should use `sphereAffinity.scores['Shadow'] > 0`, `reachCapabilities`, or the `domainCapabilities` system
   - Recommendation: Use `sphereAffinity.scores['Shadow'] > 0` as the simplest proxy — actors with any Shadow sphere affinity are eligible for Shadow-typed encounters. This matches how Phase 10 wired sphere → encounter type.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| Aftermath sphere pressure | applyAftermath pushes pressure event to pendingSpherePressures | unit | `npm test -- battleAftermath` | ✅ (add to existing test) |
| Refugee stub | refugeeEncountersGenerated=0 in aftermath trace | unit | `npm test -- battleAftermath` | ✅ (add to existing test) |
| hasThreadToBattle | 4 .todo tests → implemented | unit | `npm test -- battleThreadVisibility` | ✅ `battleThreadVisibility.test.ts` |
| selectSpotlight | 3 .todo tests → implemented | unit | `npm test -- battleThreadVisibility` | ✅ `battleThreadVisibility.test.ts` |
| generateRegionalEncounters | 6 .todo tests → implemented | unit | `npm test -- siegeRegionalEncounters` | ✅ `siegeRegionalEncounters.test.ts` |
| ArmySpriteMesh | Creates THREE.Group with InstancedMesh | unit | `npm test -- ArmySpriteMesh` | ❌ Wave 0 |
| BattleIndicatorMesh | Creates sprite, pulse animation works | unit | `npm test -- BattleIndicatorMesh` | ❌ Wave 0 |
| SiegeIndicatorMesh | Creates ring + darkening, restores on clear | unit | `npm test -- SiegeIndicatorMesh` | ❌ Wave 0 |
| RenderLayers Z values | ARMIES and BATTLE_INDICATOR constants exist | unit | `npm test -- RenderLayers` | ✅ (add to existing test if any) |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=dot` (fast, all tests)
- **Per wave merge:** `npm test && npx tsc --noEmit`
- **Phase gate:** `npm test && npx tsc --noEmit && npx vite build` all green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/HexMapV2/scene/__tests__/ArmySpriteMesh.test.ts` — covers army sprite construction
- [ ] `src/components/HexMapV2/scene/__tests__/BattleIndicatorMesh.test.ts` — covers battle indicator pulse
- [ ] `src/components/HexMapV2/scene/__tests__/SiegeIndicatorMesh.test.ts` — covers siege ring + darkening

The deferred test files (`battleThreadVisibility.test.ts`, `siegeRegionalEncounters.test.ts`) already exist with `.todo` stubs — they just need the functions implemented for the stubs to become real tests.

---

## Sources

### Primary (HIGH confidence)
- Direct source code: `src/engine/battleAftermath.ts` — applyAftermath full implementation inspected
- Direct source code: `src/engine/phaseControlEffects.ts` — sphere pressure injection pattern (lines 257-274)
- Direct source code: `src/engine/phaseSpherePressure.ts` — full pipeline inspected
- Direct source code: `src/engine/__tests__/battleThreadVisibility.test.ts` — exact test contracts
- Direct source code: `src/engine/__tests__/siegeRegionalEncounters.test.ts` — exact test contracts
- Direct source code: `src/engine/siegeResolution.ts` — siege constants, SIEGE_REGIONAL_ENCOUNTER_RANGE=5
- Direct source code: `src/types/battle.ts` — BattleState interface, all battle constants
- Direct source code: `src/types/graph.ts` — thread edge type: `source=ascendant, target=mortal`
- Direct source code: `src/types/edgeSchema.ts` — thread edge schema (line 133)
- Direct source code: `src/types/sphereAffinity.ts` — SpherePressureEvent interface
- Direct source code: `src/components/HexMapV2/scene/SignifierMesh.ts` — InstancedMesh pattern
- Direct source code: `src/components/HexMapV2/scene/AgentSpriteMesh.ts` — zoom-aware sprite pattern
- Direct source code: `src/components/HexMapV2/scene/RenderLayers.ts` — existing Z values and render order
- Direct source code: `src/components/HexMapV2/HexMapV2.tsx` — scene init wiring pattern
- Direct source code: `src/engine/delivery.ts` — hexDistance implementation
- Direct source code: `.planning/phases/13-.../13-UI-SPEC.md` — all visual constants locked

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing packages, no new dependencies
- Architecture: HIGH — all patterns verified from direct code inspection
- Pitfalls: HIGH — derived from code structure, type definitions, and established patterns
- Test contracts: HIGH — .todo stubs define exact function signatures required

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no external dependencies)
