# Playable Map: Avatar Presence, Fog of War, Zoom & Pan

**Date:** 2026-03-06
**Status:** Approved
**Context:** The prototype compiles and runs, but the hex map isn't playable — no avatar marker, no fog of war, no zoom. This design adds the minimum spatial interaction needed to make the game feel like a game.

---

## 1. Avatar Presence on the World Map

### 1a. Avatar Hex Overlay

The hex containing the avatar gets a distinct animated border ring. The ring color is derived from the ascendant's chosen spheres (e.g., Chaos+Fire → flickering red-orange pulse, Order+Mind → steady blue-white glow). Animation is CSS-only: a slow opacity/scale breathe cycle (~3s period). A small divine sigil icon sits in the hex corner, distinct from the terrain icon, so the avatar hex is identifiable even when zoomed out.

### 1b. Top-Left Avatar UI

A persistent top-left panel shows:

- **Avatar name + icon** — clicking centers the map on the avatar's hex
- **Quick-action buttons** above the name:
  - **Move** — click to enter "move mode", then click a destination hex. Avatar teleports there. (Movement cost TBD — for prototype, free or flat essence cost.)
  - **Wheel** — opens the radial action menu (currently accessed via retinue panel)
  - **Scry** — opens scrying interface to grant remote LOS

This replaces the current flow where the wheel is only accessible through the retinue panel deep-dive.

### 1c. Movement

Movement is instant teleportation (click Move → click hex → avatar moves). This is thematically appropriate — you're a god, not a foot soldier. Later iterations may add:

- Essence cost scaling with distance
- Movement restrictions (can't teleport to unexplored hexes?)
- Path-based travel for the mortal avatar (tick-by-tick)

For the prototype: instant, free, any hex.

---

## 2. Three-State Fog of War

### 2a. Visibility States

Every hex tracks a visibility state, stored in GameState as a `Map<string, HexVisibility>` keyed by `"col,row"`:

| State | Visual | Information | Transition |
|-------|--------|-------------|------------|
| **Unexplored** | Solid black fill, no terrain icon | Nothing — hex is unknown | → Remembered (when LOS gained then lost) or → Visible (when LOS gained) |
| **Remembered** | Terrain visible but dimmed/desaturated (~40% opacity). Muted color overlay | Stale snapshot: terrain type, locations discovered, last-known agent positions. No real-time updates | → Visible (when LOS regained) |
| **Visible** | Full color, real-time updates | Everything: terrain, locations, agents, events, sphere influence | → Remembered (when LOS lost) |

The map starts with all hexes **unexplored** except those within the avatar's starting LOS radius.

### 2b. Line-of-Sight Sources

Three things grant LOS, each with a tunable radius:

| Source | Radius | Notes |
|--------|--------|-------|
| **Avatar** | `AVATAR_SIGHT_RANGE` (default: 3 hexes) | Primary vision. Could later be influenced by sphere choice (Light god sees further) |
| **Retinue agents** | `AGENT_SIGHT_RANGE` (default: 1 hex) | Bonded agents only (those in the retinue). Building followers expands your map |
| **Scrying** | `SCRY_SIGHT_RANGE` (default: 1 hex around target) | Costs `SCRY_ESSENCE_PER_TICK` sustained essence. Temporary remote camera |

### 2c. Visibility Calculation

Each tick, the engine:

1. Collects all LOS sources (avatar position + retinue agent positions + active scry targets)
2. For each source, marks hexes within its radius as **visible**
3. Any hex that was **visible** last tick but isn't now transitions to **remembered** with a stale snapshot
4. Any hex that was **unexplored** and is now in range transitions to **visible**

This is a simple set-union operation over hex coordinates — O(sources × radius²), well within performance budget for 300 hexes.

### 2d. Stale Snapshots

When a hex transitions from visible → remembered, we snapshot:

- Terrain type (doesn't change, but captured for completeness)
- Location names and types present
- Agent IDs and names last seen there

The snapshot is stored alongside the visibility state. When the hex is rendered in "remembered" mode, it draws from the snapshot, not the live game state. This means agents could move away and you wouldn't know until you look again.

### 2e. Future Extensibility

The fog system is designed to scale:

- Larger maps (50×50, procedurally generated) — same per-hex state, just more entries
- New LOS sources (buildings, spells, artifacts) — add to the source collection
- Sphere-influenced sight ranges — multiply base range by a sphere coefficient
- Permanent reveal (e.g., "this location has a watchtower") — mark hex as always-visible

---

## 3. Scroll-Wheel Zoom + Drag-Pan

### 3a. Implementation

Add d3-zoom (already a project dependency) to the world hex map SVG container. This gives:

- **Scroll-wheel zoom** — smooth zoom in/out
- **Click-drag pan** — move the viewport around the map
- **Programmatic control** — `zoomTo(x, y, scale)` for the "center on avatar" button

### 3b. Zoom Range

| Level | Approximate view | Hex size | Use case |
|-------|-----------------|----------|----------|
| Max zoom-in | ~7×7 hexes | Large — art-ready | Early game, exploring, enjoying hex art |
| Default | ~7×7 hexes (centered on avatar) | Large | Game start, "center on avatar" snap |
| Mid zoom | ~12×10 hexes | Medium | Regional overview |
| Max zoom-out | Full 20×15 map | Small (current size) | Late game empire management |

Zoom is continuous (not discrete steps). The values above are reference points.

### 3c. Default Camera

On game initialization, the camera centers on the avatar's hex at max zoom-in. First impression: a close-up of your starting area, surrounded by black fog. Atmospheric and immediately communicates "explore outward."

The "center on avatar" button in the top-left UI calls `zoomTo(avatarHex, maxZoom)` with a smooth transition.

### 3d. Interaction at Any Zoom

Hex click behavior is preserved at all zoom levels. Clicking a hex still transitions to hex-zoom view. The zoom level only controls how many world-map hexes are visible at once.

---

## 4. Constants (All Tunable)

```typescript
// Fog of War
const AVATAR_SIGHT_RANGE = 3;      // hexes
const AGENT_SIGHT_RANGE = 1;       // hexes
const SCRY_SIGHT_RANGE = 1;        // hexes around target
const SCRY_ESSENCE_PER_TICK = 2;   // essence cost to maintain scrying

// Movement
const MOVE_ESSENCE_COST = 0;       // free for prototype

// Zoom
const DEFAULT_ZOOM_SCALE = 3.0;    // ~7×7 hex view
const MIN_ZOOM_SCALE = 1.0;        // full map
const MAX_ZOOM_SCALE = 4.0;        // close-up

// Avatar overlay
const AVATAR_PULSE_DURATION = 3;   // seconds per breathe cycle
```

---

## 5. Data Flow

```
Tick → recalcVisibility(graph, losSourcePositions) → visibilityMap
                                                          ↓
GameView → HexMap receives visibilityMap as prop
                    ↓
            HexTile renders based on visibility state:
              unexplored → black fill
              remembered → dimmed terrain + stale snapshot
              visible    → full color + live data
                    ↓
            d3-zoom wraps SVG → scroll/pan/programmatic zoom
                    ↓
            AvatarUI (top-left) → center button, move, wheel, scry
```

---

## 6. Tradeoffs and Rejected Alternatives

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Movement model | Instant teleport | Tick-by-tick pathfinding | Simpler for prototype; thematically fits "you're a god" |
| Fog persistence | Per-hex state in GameState | Render-only (no stale data) | Stale snapshots are the whole point — information warfare |
| Zoom library | d3-zoom | Custom scroll handler | d3 already in deps, battle-tested, handles edge cases |
| Zoom type | Continuous | Discrete levels | More natural, standard strategy game feel |
| Adaptive zoom to LOS | No | Auto-frame visible area | Disorienting — map jumps when LOS changes |
| Avatar highlight | Sphere-colored pulse | Static marker/pin | Reinforces cosmology identity, more atmospheric |

---

## 7. Implementation Dependencies

- d3-zoom (already in package.json via d3)
- Existing: hexMath.ts (distance), hexZoom.ts (getLineOfSight), ascendant.ts (avatar position)
- New state: `visibilityMap` in GameState, `HexVisibility` type
- Modified: HexMap.tsx (fog rendering, d3-zoom wrapper), HexTile.tsx (visibility-based rendering), GameView.tsx (avatar UI, visibility recalc, move handler)
