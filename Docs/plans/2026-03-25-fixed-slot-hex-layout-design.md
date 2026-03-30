# Fixed-Slot Hex Layout Design

> 2026-03-25 · Replaces continuous ring distribution with hex-geometry-aligned fixed slots to eliminate icon overlap.

## Problem

Agents and secondary locations both use `getRingSlotOffset()` with the same ring radius (6 world units). Location icons are rotated 8° from agents to avoid overlap, but this is far too small — with multiple entities on a hex the sprites visually collide, especially at regional zoom.

## Design: Three-Zone Layout

Three non-overlapping zones within each hex:

| Zone | Contents | Positioning |
|------|----------|-------------|
| **Center** | Primary location (city, capital, temple, etc.) | Hex center, unchanged from current `CENTERED_SIZE_CLASSES` logic |
| **Edge-midpoint slots** | Agents | 6 fixed positions at 30°, 90°, 150°, 210°, 270°, 330° — midpoints of each hex edge |
| **Vertex slots** | Secondary/small locations | 6 fixed positions at 0°, 60°, 120°, 180°, 240°, 300° — hex corner directions |

Adjacent slots are always 30° apart. No two agent slots overlap a location slot at any entity count.

### Geometry (flat-top hex)

```
         0° (vertex: location)
        /  \
  330° /    \ 30°
 (agent)    (agent)
      |      |
 300° |      | 60°
(loc) | CENTER| (loc)
      |      |
 270° |      | 90°
 (agent)    (agent)
        \  /
  240° /  \ 120°
        180° (vertex: location)
```

All slots share a single ring radius: **`SLOT_RING_RADIUS = 6`** (same as current `AGENT_RING_RADIUS`). The 30° angular separation provides sufficient visual clearance at this radius.

### Constants Table

| Constant | Value | Purpose | Replaces |
|----------|-------|---------|----------|
| `SLOT_RING_RADIUS` | 6 | Shared radius for all perimeter slots | `AGENT_RING_RADIUS`, `LOCATION_RING_RADIUS` |
| `VERTEX_ANGLES_DEG` | [0, 60, 120, 180, 240, 300] | Fixed angles for secondary location slots | — |
| `EDGE_MID_ANGLES_DEG` | [30, 90, 150, 210, 270, 330] | Fixed angles for agent slots | — |
| `MAX_SLOT_AGENTS` | 6 | Max agents per hex (unchanged) | `MAX_RING_AGENTS` |
| `MAX_SLOT_LOCATIONS` | 6 | Max ring locations per hex (unchanged) | `MAX_RING_LOCATIONS` |
| `LOCATION_RING_SCALE_FACTOR` | 0.75 | Ring-location downscale (unchanged) | — |

**Removed constants:** `LOCATION_RING_ROTATION_DEG` (the 30° offset is now structural, not a tunable hack).

### Balanced Distribution Lookup

When fewer than 6 entities need slots, pick maximally-spaced ones for visual balance:

| Count | Slot indices (0-5) | Angular positions (agents example) |
|-------|--------------------|------------------------------------|
| 1 | [0] | 30° (top-right edge) |
| 2 | [0, 3] | 30°, 210° (opposite edges) |
| 3 | [0, 2, 4] | 30°, 150°, 270° (every other) |
| 4 | [0, 1, 3, 4] | 30°, 90°, 210°, 270° (two opposite pairs) |
| 5 | [0, 1, 2, 3, 4] | first five slots |
| 6 | [0, 1, 2, 3, 4, 5] | all slots |

This is a static lookup table — `BALANCED_SLOT_INDICES: number[][]`. Same table used for both agent and location distribution.

```typescript
const BALANCED_SLOT_INDICES: readonly number[][] = [
  [],              // 0 entities
  [0],             // 1
  [0, 3],          // 2
  [0, 2, 4],       // 3
  [0, 1, 3, 4],    // 4
  [0, 1, 2, 3, 4], // 5
  [0, 1, 2, 3, 4, 5], // 6
];
```

### New Function: `getFixedSlotOffset`

Replaces `getRingSlotOffset` for static on-hex positioning. Lives in `src/lib/movementPath.ts` alongside the existing function (which stays for bezier animation endpoints).

```typescript
/**
 * Returns world-unit offset from hex center for a fixed hex-geometry slot.
 *
 * @param entityIndex  - Index of this entity among its peers on this hex (0-based, sorted by id/name)
 * @param totalEntities - Total entities of this category on this hex (capped at 6)
 * @param slotAnglesDeg - The 6 fixed angles for this category (VERTEX or EDGE_MID)
 * @param radius        - Distance from hex center (SLOT_RING_RADIUS)
 * @returns {x, y} offset in world units
 */
export function getFixedSlotOffset(
  entityIndex: number,
  totalEntities: number,
  slotAnglesDeg: readonly number[],
  radius: number,
): Point {
  const capped = Math.min(totalEntities, 6);
  const indices = BALANCED_SLOT_INDICES[capped] ?? BALANCED_SLOT_INDICES[6];
  const slotIdx = indices[entityIndex] ?? 0;
  const angleDeg = slotAnglesDeg[slotIdx] ?? 0;
  const angleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2; // -90° to start from top
  return {
    x: Math.cos(angleRad) * radius,
    y: Math.sin(angleRad) * radius,
  };
}
```

## Files Changed

### 1. `src/data/agent-visual-content.ts`

- Add `SLOT_RING_RADIUS`, `VERTEX_ANGLES_DEG`, `EDGE_MID_ANGLES_DEG`
- Keep `AGENT_RING_RADIUS` and `LOCATION_RING_RADIUS` as deprecated aliases (or remove if no other consumers)
- Remove `LOCATION_RING_ROTATION_DEG`

### 2. `src/lib/movementPath.ts`

- Add `BALANCED_SLOT_INDICES` lookup table
- Add `getFixedSlotOffset()` function
- Keep `getRingSlotOffset()` unchanged (used by bezier animation)

### 3. `src/components/HexMapV2/scene/AgentSpriteMesh.ts`

In `createAgentSpriteMesh` and `updateAgentPositions`:

```diff
- const ringOffset = getRingSlotOffset(i, visible.length, AGENT_RING_RADIUS);
+ const ringOffset = getFixedSlotOffset(i, visible.length, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
```

Import changes: add `getFixedSlotOffset`, `EDGE_MID_ANGLES_DEG`, `SLOT_RING_RADIUS`. Remove old imports if no longer needed.

### 4. `src/components/HexMapV2/scene/LocationIconMesh.ts`

In `createLocationIconMesh` (ring-eligible section):

```diff
- const offset = getRingSlotOffset(i, visible.length, LOCATION_RING_RADIUS, LOCATION_RING_ROTATION_RAD);
+ const offset = getFixedSlotOffset(i, visible.length, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);
```

Remove `LOCATION_RING_ROTATION_RAD` constant and its import of `LOCATION_RING_ROTATION_DEG`.

### 5. Movement animation (bezier hop)

The bezier animation in the render loop computes source/destination ring offsets. These must also switch to `getFixedSlotOffset` so agents animate *to* the correct fixed slot, not a continuous ring position. Search for `getRingSlotOffset` calls in the animation path (likely in the tick/animation module) and update similarly.

### 6. Tests

- New unit tests for `getFixedSlotOffset`: verify angles, balanced distribution at each count 1-6, edge cases (0 entities, >6 entities)
- Update existing `getRingSlotOffset` tests if they cover the rendering callsites
- Existing composition resolver tests (`compositionResolver.test.ts`) unchanged — the declarative system is not yet integrated

## Tracing

No new trace types needed. The existing agent-move and location-render traces carry hex coordinates; the slot offset is a derived visual property, not a game-state event.

## Fail-Soft

| Failure | Fallback |
|---------|----------|
| `entityIndex >= 6` | Clamp to last slot (index 5) — entity renders but may overlap |
| `totalEntities = 0` | Returns `{x: 0, y: 0}` — center position (harmless) |
| `slotAnglesDeg` is empty | Falls back to angle 0° |

## PRNG Callouts

None. Fixed slots are deterministic by construction (sorted entity list + static lookup table). No randomness needed.

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — all constants named, radius and angles easily tunable |
| 2 | Inspectability | PASS — slot assignment is a pure lookup from sorted index, trivially traceable |
| 3 | Determinism | PASS — sorted by id/name + static table = same inputs → same slots |
| 4 | Fail-soft | PASS — clamping and fallbacks for every edge case |
| 5 | Narrative > mechanical | N/A |
| 6 | Additive | PASS — new function added, old `getRingSlotOffset` preserved for animation use |
| 7 | Performance | PASS — lookup table, no per-frame computation beyond what exists today |
