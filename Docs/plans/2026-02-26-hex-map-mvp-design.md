# The Fantasy World Simulator — MVP Design: The Hex Map

**Date:** 2026-02-26
**Status:** Approved
**Tech Stack:** React + TypeScript (web app)

---

## 1. What We're Building

A web-based hex map generator and force visualizer — the foundational spatial layer of FantasyWorld. The player configures a cosmology (the balance of metaphysical forces), and the system generates a hex grid where each tile's terrain and character emerge from how those forces saturate the landscape.

This is **not** a game yet. It's the world engine's beating heart: the thing that proves the cosmology → terrain → visualization pipeline works and looks beautiful.

### What's In Scope

- Cosmology configuration screen (set force weights)
- Hex grid generation seeded by cosmology + noise
- Force-to-terrain mapping with rich color rendering
- Force overlay toggle (see raw force saturations per hex)
- Responsive, visually striking presentation

### What's Out of Scope (for now)

- Location zoom / Site view / Story view
- Agents, NPCs, factions
- Coincidence Deck / Nudge Cards
- Rival Ascendants / adversarial AI
- Doom Clocks, Victory Mandates
- Echo system / meta-progression
- Descriptor engine / narrative prose
- Sound, music, animation

---

## 2. The Cosmology Model

### 2.1 The Five Governing Forces

The world is shaped by five metaphysical forces (inspired by MTG color philosophy and Malazan warrens). Each force governs a domain of reality:

| Force | Domain | Color Identity | Terrain Affinity |
|-------|--------|---------------|-----------------|
| **Aether** | Mind, knowledge, arcane energy | Blue/violet | Crystal spires, mage towers, thin-atmosphere peaks |
| **Verdance** | Life, growth, nature | Green | Dense forests, marshlands, fertile plains |
| **Ignis** | Destruction, passion, transformation | Red/orange | Volcanoes, scorched earth, hot springs |
| **Umbra** | Shadow, death, entropy | Dark purple/black | Swamps, caverns, blighted wastes |
| **Terra** | Order, stability, earth | Gold/brown | Mountains, stone fortresses, arid plateaus |

### 2.2 Force Interactions

Forces exist in tension. Each force has one **allied** and one **opposed** force:

```
        Aether
       /      \
    Umbra --- Verdance
      |    X    |
    Ignis --- Terra
```

- **Allied pairs:** Aether↔Umbra, Verdance↔Terra, Ignis stands alone (catalyst)
- **Opposed pairs:** Aether↔Terra, Verdance↔Umbra, Ignis opposes stagnation

These relationships influence how forces blend on the hex map: allied forces reinforce each other, opposed forces create tension zones (interesting gameplay territory).

### 2.3 Cosmology Configuration

The player sets a **Cosmology Profile** — a normalized vector of 5 weights that sum to 1.0:

```typescript
interface CosmologyProfile {
  aether: number;   // 0.0 – 1.0
  verdance: number;  // 0.0 – 1.0
  ignis: number;     // 0.0 – 1.0
  umbra: number;     // 0.0 – 1.0
  terra: number;     // 0.0 – 1.0
}
// Constraint: sum of all values === 1.0
```

Default (balanced world): `{ aether: 0.2, verdance: 0.2, ignis: 0.2, umbra: 0.2, terra: 0.2 }`

The player adjusts sliders; moving one up proportionally reduces others (or the player can manually unlock and set each). Presets available: "Balanced," "Arcane Dominance," "Wild Growth," "Scorched," "Shadowed," "Fortress World."

---

## 3. Hex Grid Generation

### 3.1 Grid Structure

- **Flat-top hexagons** in an offset coordinate system
- Default grid size: **20 × 15 hexes** (configurable)
- Each hex is identified by `(col, row)` offset coordinates
- Cube coordinates used internally for distance/neighbor calculations

```typescript
interface HexCoord {
  col: number;
  row: number;
}

interface HexTile {
  coord: HexCoord;
  forces: ForceVector;       // per-force saturation at this hex
  terrain: TerrainType;      // derived from dominant force
  elevation: number;         // 0.0–1.0
  moisture: number;          // 0.0–1.0
  magicDensity: number;      // 0.0–1.0
}

type ForceVector = {
  aether: number;
  verdance: number;
  ignis: number;
  umbra: number;
  terra: number;
}
```

### 3.2 Generation Algorithm

Each hex's force saturation is computed from:

1. **Base cosmology** — the player's global force weights
2. **Simplex noise layers** — one noise field per force, creating regional variation
3. **Force interaction modifiers** — allied forces amplify nearby; opposed forces suppress

```
For each hex (x, y):
  For each force F:
    base = cosmology[F]
    noise = simplexNoise(x * scale, y * scale, seed_F) * amplitude
    interaction = sum of (ally_boost * nearby_allied - oppose_penalty * nearby_opposed)
    forces[F] = clamp(base + noise + interaction, 0, 1)

  Normalize forces so they sum to 1.0
  terrain = classifyTerrain(forces)
  elevation = deriveElevation(forces)
  moisture = deriveMoisture(forces)
```

**Noise parameters:**
- Scale: 0.08 (large regional blobs)
- Octaves: 3 (detail layers)
- Persistence: 0.5
- Lacunarity: 2.0
- Each force gets a unique seed offset

### 3.3 Terrain Classification

The dominant force (highest saturation) determines base terrain. Secondary forces modify it:

| Dominant Force | Base Terrain | Modified by... |
|---------------|-------------|----------------|
| Aether | Crystal Wastes | +Verdance → Enchanted Grove, +Terra → Runed Mountains |
| Verdance | Deep Forest | +Umbra → Haunted Wood, +Ignis → Volcanic Jungle |
| Ignis | Scorched Plains | +Aether → Lightning Fields, +Terra → Forge Mountains |
| Umbra | Shadow Marsh | +Verdance → Fungal Forest, +Aether → Void Rift |
| Terra | Stone Highlands | +Ignis → Obsidian Peaks, +Umbra → Buried Ruins |

When no force dominates (max < 0.3), the hex is classified as **Contested Ground** — a blend zone rendered with mixed colors.

---

## 4. Visual Design

### 4.1 Color Palette

Each force has a primary and secondary color:

| Force | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| Aether | `#6B5CE7` (violet) | `#A8D8EA` (ice blue) | `#E8E0FF` |
| Verdance | `#2D8F4E` (forest green) | `#7BC950` (lime) | `#D4F5D4` |
| Ignis | `#E84830` (flame red) | `#FF9F43` (amber) | `#FFE0D0` |
| Umbra | `#4A2080` (deep purple) | `#1A1A2E` (void black) | `#C8A0E8` |
| Terra | `#C8A850` (gold) | `#8B6914` (earth brown) | `#F0E8C8` |

Hex fill color is computed by blending force colors weighted by their saturation values. This produces a continuous color landscape rather than discrete terrain blocks.

### 4.2 Hex Rendering

Each hex displays:
- **Fill color:** Force-weighted blend (smooth, painterly)
- **Border:** Subtle, darker shade of fill
- **Icon/glyph:** Small terrain indicator in center (tree, mountain, flame, crystal, skull)
- **Elevation:** Slight shadow/highlight based on elevation value

### 4.3 Force Overlay Mode

Toggling the overlay shows per-force saturation as a semi-transparent color wash over the map. The player can select which force(s) to visualize:
- Single force: heatmap from transparent (0) to full color (1)
- All forces: each hex shows a small pie/bar chart of force distribution
- Contour lines: iso-lines where a force crosses threshold values (0.3, 0.5, 0.7)

### 4.4 Cosmology Config UI

A sidebar/panel with:
- Five labeled sliders (one per force) with force color + icon
- Normalization toggle (auto-balance vs. free-form)
- Preset buttons (Balanced, Arcane Dominance, etc.)
- "Generate" button to re-roll the world with current settings
- Seed input field (for reproducible worlds)

---

## 5. Technical Architecture

### 5.1 Project Structure

```
src/
  app/
    App.tsx                  # Root layout
    page.tsx                 # Main page
  components/
    HexMap/
      HexMap.tsx             # Main hex grid renderer (SVG or Canvas)
      HexTile.tsx            # Individual hex component
      ForceOverlay.tsx       # Overlay visualization layer
    Cosmology/
      CosmologyPanel.tsx     # Force weight sliders + presets
      ForceSlider.tsx        # Individual force slider
    UI/
      Layout.tsx             # App shell
      InfoPanel.tsx          # Hex detail on hover/click
  engine/
    cosmology.ts             # CosmologyProfile type + normalization
    hexGrid.ts               # Grid generation, coordinate math
    forceField.ts            # Noise-based force saturation computation
    terrain.ts               # Force → terrain classification
    color.ts                 # Force → color blending
  lib/
    noise.ts                 # Simplex noise implementation
    hexMath.ts               # Hex coordinate conversions, neighbors, distance
  types/
    index.ts                 # Shared type definitions
```

### 5.2 Key Dependencies

- **React 18+** with TypeScript
- **Vite** for build/dev server
- **simplex-noise** (or hand-rolled) for terrain generation
- **No game engine** — pure SVG/Canvas rendering
- **Tailwind CSS** for UI components (not the hex map itself)

### 5.3 Rendering Approach

**SVG-based hex rendering** for the MVP:
- Each hex is an SVG `<polygon>` with computed fill
- Overlay is a second SVG layer with opacity
- Hover/click interactions via SVG event handlers
- Performant enough for 20×15 grid (~300 hexes)

If performance becomes an issue at larger grids, migrate to HTML Canvas with a 2D rendering loop.

### 5.4 State Management

Simple React state (useState/useReducer) — no external state library needed for MVP:

```typescript
interface AppState {
  cosmology: CosmologyProfile;
  seed: number;
  gridSize: { cols: number; rows: number };
  hexGrid: HexTile[];           // generated grid
  overlayMode: OverlayMode;     // 'none' | 'single' | 'all' | 'contour'
  selectedForce: ForceName | null;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
}
```

---

## 6. User Flow

1. **App loads** → default balanced cosmology, auto-generated map
2. **Player adjusts cosmology sliders** → sees force weights change in real-time
3. **Player clicks "Generate"** → new hex grid computed and rendered
4. **Player hovers hexes** → info panel shows force breakdown, terrain type, elevation
5. **Player toggles force overlay** → sees raw force saturation heatmap
6. **Player clicks a hex** → detailed force pie chart + terrain descriptor
7. **Player enters a seed** → reproducible world generation
8. **Player selects presets** → quick cosmology profiles to explore

---

## 7. Success Criteria

This MVP succeeds if:

1. **Cosmology → Map pipeline works**: Changing force weights produces visually distinct, recognizable worlds
2. **It looks beautiful**: Rich, painterly hex map with clear force-driven color identity
3. **Forces feel meaningful**: You can "read" the map — see where Verdance dominates, where Ignis and Umbra clash, where Aether creates crystalline peaks
4. **It invites exploration**: Looking at the generated map makes you want to zoom in and learn more about specific hexes
5. **Foundation is solid**: The data model and generation code can extend to support agents, locations, and the full game loop later

---

## 8. Future Extensions (Not This MVP)

In priority order, the next layers to add after the hex map:

1. **Location zoom** — click a hex to see named locations within it
2. **Descriptor engine** — float-to-word mapping ("a land of towering crystal spires where the air crackles with arcane potential")
3. **Agent seeding** — place autonomous characters on the map
4. **Force dynamics** — forces shift over time (seasons, events)
5. **Coincidence Deck** — player intervention cards at each zoom level

---

*This document captures the approved design from the brainstorming session. Next step: create an implementation plan and begin building.*
