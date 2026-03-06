# Phase 6C Design: Hex Zoom Level

**Date:** 2026-03-06

---

## Context

The original View Levels design described three zoom levels: World → Region (multi-hex group) → Location. The Region Level has been redesigned as a **single-hex zoom** — clicking one hex shows all locations within it. This simplifies region management, eliminates terrain-variant art requirements, and creates a clearer interaction flow.

This document designs the full Hex Zoom Level UI, the Location Level view, and the view state architecture connecting them.

### Prerequisites

- HexMap (20×15 SVG grid) — ✅ built
- Locations in graph with `hexCol`/`hexRow` — ✅ built (4-6 per world via `worldSeed.ts`)
- Agent Wheel + InterventionConfirm — ✅ built (Layer 2)
- Location art — ❌ not built (placeholder for now)

### Related Design Docs

- `2026-03-06-art-prompt-model-design.md` — Decision 3 (terrain-neutral location art) and Decision 4 (single-hex zoom)
- `2026-03-05-intervention-delivery-mechanics.md` — delivery modes reference hex distance

---

## Decision 1: View State Architecture

Three view states managed by GameView. The main content area swaps components based on `viewLevel`. All sidebars (retinue, essence, rivals, doom bar) persist across all levels — they're god-level context.

### State Shape

```typescript
type ViewLevel = 'world' | 'hex-zoom' | 'location';

// New state in GameView:
viewLevel: ViewLevel;           // default: 'world'
focusedHex: HexCoord | null;    // set when entering hex-zoom
focusedLocationId: string | null; // set when entering location view
```

### Transitions

| From | Action | To | State Change |
|------|--------|----|-------------|
| `world` | Click hex | `hex-zoom` | `viewLevel = 'hex-zoom'`, `focusedHex = clicked coord` |
| `hex-zoom` | Double-click location | `location` | `viewLevel = 'location'`, `focusedLocationId = id` |
| `hex-zoom` | Single-click location | (info tooltip) | No view change — shows preview |
| `hex-zoom` | Back button | `world` | `viewLevel = 'world'`, `focusedHex = null` |
| `location` | Back button | `hex-zoom` | `viewLevel = 'hex-zoom'`, `focusedLocationId = null` |

### Main Content Area Rendering

```
viewLevel === 'world'     → <HexMap ... />
viewLevel === 'hex-zoom'  → <HexZoomView ... />
viewLevel === 'location'  → <LocationView ... />
```

---

## Decision 2: HexZoomView Layout

When `viewLevel === 'hex-zoom'`, the main content area shows a single hex expanded to fill the viewport.

### Header Bar

- **Back arrow** button → returns to world view
- **Hex terrain indicator** — colored circle or small hex matching the biome color
- **Hex name** — placeholder for now: terrain type + coordinates (e.g., "Forest Hex (5, 3)"). Future: seeded name generator
- **Sphere influence summary** — small colored dots showing which spheres are active in this hex, aggregated from locations and agents

### Main Area: Hex Outline + Polygon Layout

A large hex-shaped outline centered on screen, filled with dark stone background (`#2a2a2e`). The hex border is a thin amber line (`#d4af37` at ~30% opacity).

**Location placement uses inscribed polygon geometry:**

| Location Count | Layout |
|---|---|
| 1 | Centered |
| 2 | Horizontal line |
| 3 | Equilateral triangle |
| 4 | Square |
| 5 | Pentagon |
| 6 | Hexagon |

The polygon is inscribed within the hex outline with padding (~70% of hex radius). Locations sit at polygon vertices. The polygon itself is not drawn — only the travel lines between connected locations.

### Location Circles

Each location rendered as:
- **Circular-cropped art** — placeholder gradient circle for now (~80-100px diameter)
- **Location name** underneath in Cinzel font, amber text
- **Single click** → info tooltip (name, type, agent count, description preview)
- **Double click** → navigate to Location Level view

### Agent Squares

Agents at each location shown as smaller squares (~32-40px) clustered near their location circle:
- Colored square with first initial of agent name
- Square shape distinguishes agents from circular locations
- Positioned in a small arc or cluster adjacent to their location circle

### Travel Lines

Adjacency edges between locations in the same hex rendered as styled connection lines:
- Thin amber lines (`#d4af37`) with subtle radiant glow effect
- CSS/SVG glow: amber center fading to transparent, like luminous threads
- Follow the polygon edges between connected locations
- Styled after Endless Legend's abstract UI connectors — not literal roads

### Line of Sight

Based on avatar's position relative to the hex:

| Condition | Label | Effect |
|---|---|---|
| Avatar is in this hex | "Full Sight" | All locations and agents visible |
| Avatar is in adjacent hex | "Partial Sight" | Locations visible, agents may be dimmed/hidden |
| Avatar is distant | "No Sight" | Location circles shown as dark silhouettes with "?", agents hidden |

### Hex Data Panel

Small info section (bottom-left or overlay) showing:
- Terrain type and biome
- Sphere influence breakdown (colored bars or dots per sphere)
- Number of locations / agents
- Avatar presence indicator

---

## Decision 3: LocationView Layout

When `viewLevel === 'location'`, the main content area shows a single location in detail.

### Header Bar

- **Back arrow** → returns to hex-zoom view
- **Location art thumbnail** — circular crop (same as hex zoom but smaller)
- **Location name** in Cinzel font
- **Location type badge** — city, ruin, temple, wilderness camp, etc.
- **Terrain context label** — "in Forest Hex (5, 3)" — carried from the hex

### Main Area

**Establishing shot** (top):
- Large placeholder (dark rectangle with location name, where terrain-neutral art will eventually go)
- Aspect ratio 16:9, centered
- Art will be terrain-neutral per art prompt model design (Decision 3 in `2026-03-06-art-prompt-model-design.md`)

**Two-column layout** (below art):

| Left Column — Agents Present | Right Column — Ordeals & Sub-locations |
|---|---|
| List of agents at this location | Sub-locations grouped by Ordeal |
| Portrait square, name, tier badge, faction | Ordeal name, stage progress, sub-location list |
| Clickable → opens agent wheel | Placeholder for now — Ordeal system designed separately |

**Agents present:**
- Shows all individuals/factions with edges to this location
- Clickable → opens agent wheel (same interaction as retinue panel)
- Includes both retinue agents AND non-retinue agents visible at this location

**Ordeals section (placeholder):**
- "Ordeals at this location" header
- Placeholder text: "No active Ordeals" or mock entries
- Ordeal system will be designed in a separate design document

**Location description:**
- Bottom section with narrative text (from graph node properties or generated placeholder)

---

## Decision 4: Ordeal Concept (Deferred)

An **Ordeal** is a named sequence of encounters within a location. Each encounter (sub-location) has a scene, narrative text, skill checks, and success/failure outcomes. Agents progress through Ordeals step by step. Multiple Ordeals can exist per location (e.g., a marketplace has "Find the Magic Book" and "Commission a Weapon").

**Examples:**
- Marketplace → Ordeal: "The Arcane Bookseller" → sub-locations: find shop → browse wares → barter → acquire
- Dungeon → Ordeal: "The Deep Descent" → sub-locations: entrance → trapped corridor → beast's lair → treasure vault
- Temple → Ordeal: "The Rite of Ascension" → sub-locations: purification → trial of faith → inner sanctum → revelation

Players can intervene via Divine Toolkit to nudge agents toward different Ordeals or influence outcomes within them.

**This requires its own design document** covering: event chain data model, challenge resolution within Ordeals, branching/failure paths, narrative generation per encounter, content pipeline integration, and UI for viewing/influencing Ordeal progress.

---

## Decision 5: Exploration Mechanic (Deferred)

When the avatar is in a hex, the player should be able to **explore** to discover new locations. This likely integrates with the agent wheel (a new "Explore" action slot) or a hex-level action.

**Deferred** — needs its own design pass covering: discovery probability, what determines which locations exist but are hidden, how exploration interacts with line of sight, and the UI for triggering/resolving exploration.

---

## New Engine Queries

New file: `src/engine/hexZoom.ts`

| Function | Signature | Purpose |
|---|---|---|
| `getLocationsInHex` | `(graph, col, row) → LocationNode[]` | All location nodes where `hexCol === col && hexRow === row` |
| `getAgentsAtLocation` | `(graph, locationId) → AgentNode[]` | All individual/faction nodes with edges to the location |
| `getHexSphereInfluence` | `(graph, col, row) → SphereInfluence` | Aggregated sphere biases from locations and agents in the hex |
| `getLineOfSight` | `(graph, ascendantId, hexCoord) → 'full' \| 'partial' \| 'none'` | Avatar position relative to hex |
| `getLocationConnections` | `(graph, locationIds) → Edge[]` | Adjacency edges between locations in the same hex |

## New Layout Utility

New file: `src/lib/polygonLayout.ts`

| Function | Signature | Purpose |
|---|---|---|
| `getPolygonVertices` | `(count, centerX, centerY, radius) → Point[]` | N points at regular polygon vertices inscribed in circle |

Pure geometry — no game logic. Used by HexZoomView to position location circles.

## New Components

| Component | File | Purpose |
|---|---|---|
| `HexZoomView` | `src/components/Game/HexZoomView.tsx` | Main hex-zoom screen — hex outline, polygon locations, agent squares, travel lines |
| `LocationView` | `src/components/Game/LocationView.tsx` | Location detail — establishing shot, agents, ordeals placeholder |
| `HexBreadcrumb` | `src/components/Game/HexBreadcrumb.tsx` | Header bar with back nav + context (terrain, name, sphere data) |

## GameView Changes

- Add `viewLevel`, `focusedHex`, `focusedLocationId` state
- Main content area conditionally renders HexMap / HexZoomView / LocationView
- `onHexClick` sets `focusedHex` and transitions to hex-zoom (replaces current `setSelectedHex`)
- New handlers: `handleLocationClick` (tooltip), `handleLocationDoubleClick` (navigate), `handleBack` (unwind)
- Agent wheel interaction works from LocationView (clicking an agent opens wheel, same as retinue panel)

## Styling Notes

All components follow the Threadbare aesthetic:
- Dark stone backgrounds (`#2a2a2e` to `#4a4540`)
- Amber accents (`#d4af37`) for interactive elements and text
- Cinzel font for headings
- Travel lines: amber center with radiant glow — CSS `filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))` or SVG `feGaussianBlur` + `feComposite`
- Hex outline: thin amber stroke at 30% opacity
- Location circles: dark gradient placeholder with amber ring border
- Agent squares: sphere-colored background with white initial text

---

## Scope Summary

**In scope (Phase 6C):**
- View state machine (world → hex-zoom → location)
- HexZoomView with polygon layout, location circles, agent squares, glowing travel lines
- Hex data display (sphere influence, line-of-sight)
- LocationView with establishing shot placeholder, agents present, ordeals placeholder
- Click/double-click navigation, back buttons
- 5 new engine query functions
- Polygon layout utility
- 3 new components + GameView modifications

**Out of scope (separate design work):**
- Ordeal system (event chain engine, challenge resolution, branching)
- Exploration mechanic (discovering new locations in a hex)
- Generated hex names (seeded name generator)
- Location art generation (art pipeline)

---

## Phase Renumbering

With this insertion:
- Phase 6C: **Hex Zoom Level** (this document)
- Phase 6D: Ascendant Scry, Divine Titles, Mandate Tracker (was 6C)
- Phase 6E: Polish & Juice (was 6D)
