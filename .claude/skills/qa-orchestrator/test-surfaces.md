# QA Test Surface Registry

Last updated: 2026-03-10

This file is the single source of truth for every testable UI surface in The Fantasy World Simulator. The QA orchestrator uses this registry to ensure full coverage across sweeps.

## How to Use

- **During QA sweeps:** Each surface listed here must be verified at least once per full sweep. Track coverage with the `lastTested` and `status` fields in the companion JSON file.
- **After implementing a new component:** Add an entry here. If you skip this step, QA sweeps will miss the new surface.
- **After removing a component:** Mark the entry as `deprecated` rather than deleting it, so historical findings still resolve.

## Surface Categories

| Category | Description |
|----------|-------------|
| `screen` | Full-viewport phase (world creation, character selection, main game) |
| `panel` | Major sidebar or center-area panel |
| `widget` | Small status display, progress bar, or HUD element |
| `overlay` | Modal, popover, or full-screen overlay that appears over the game |
| `sub-component` | Building block embedded inside a panel or overlay |
| `utility` | Shared component used across multiple surfaces (tooltip, error boundary) |
| `dev` | Debug-only or experimental view |

## Surface Registry

### Phase 1: World Generation

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-001 | World Gen Screen | App (worldgen phase) | screen | App.tsx | Page loads, phase routing works | Dev server running |
| S-002 | Cosmology Panel | CosmologyPanel | panel | components/Cosmology/CosmologyPanel.tsx | Drag sphere sliders, enter seed, select presets, click Generate World | On worldgen phase |
| S-003 | Sphere Slider | SphereSlider | sub-component | components/Cosmology/SphereSlider.tsx | Drag slider, value updates, label displays | Inside CosmologyPanel |
| S-004 | Hex Map (worldgen) | HexMap | panel | components/HexMap/HexMap.tsx | Renders after generation, zoom/pan, hover shows info | World generated |
| S-005 | Hex Info Panel | InfoPanel | widget | components/UI/InfoPanel.tsx | Shows terrain/elevation/temp/moisture on hover | Hovering a hex tile |

### Phase 2: Ascendant Selection

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-010 | Character Selection Screen | AscendantSelection | screen | components/Ascendant/AscendantSelection.tsx | 4 archetype cards generated, select one, enter name, click Ascend | World generated |
| S-011 | Archetype Card | ArchetypeCard | sub-component | components/Ascendant/ArchetypeCard.tsx | Click to select, shows spheres/flavor/domains, highlight state | Inside AscendantSelection |

### Phase 3: Main Game — Layout & Controls

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-020 | Main Game View | GameView | screen | components/Game/GameView.tsx | All panels render, layout correct, no crashes | Ascended |
| S-021 | Simulation Controls | SimulationControls | widget | components/Game/SimulationControls.tsx | Season icon, year/tick display, play/pause, step, speed slider | In game |
| S-022 | Doom Bar | DoomBar | widget | components/Game/DoomBar.tsx | Progress bar fills, stage label updates, pulse animation on change | In game, doom > 0 |
| S-023 | Mandate Tracker | MandateTracker | widget | components/Game/MandateTracker.tsx | Stage pips render, progress bar fills, click for details | Mandate exists |
| S-024 | Essence Panel | EssencePanel | widget | components/Game/EssencePanel.tsx | 8 sphere bars render, values update on tick, pulse on change, sorted by alignment | In game |
| S-025 | Rival Panel | RivalPanel | widget | components/Game/RivalPanel.tsx | Rival gods list, icons, behavior colors, status text | Rivals generated |
| S-026 | Avatar HUD | AvatarHUD | widget | components/Game/AvatarHUD.tsx | Avatar name, Center/Move/Wheel/Scry/Zoom buttons functional | World map view |
| S-027 | Narrative Log | NarrativeLog | widget | components/Game/NarrativeLog.tsx | Events appear after ticks, type-colored, auto-opens on intervention beats | In game |

### Phase 3: Main Game — World Map

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-030 | Hex Map (game) | HexMap | panel | components/HexMap/HexMap.tsx | Zoom/pan, fog of war (black/dim/visible), location overlays, avatar position | In game |
| S-031 | Hex Tile | HexTile | sub-component | components/HexMap/HexTile.tsx | Terrain image renders, location overlay icon, hex clip mask | Inside HexMap |
| S-032 | Coastline Overlay | CoastlineOverlay | sub-component | components/HexMap/CoastlineOverlay.tsx | Coastline lines render correctly around land/water boundaries | Inside HexMap |
| S-033 | Hex Defs | HexDefs | sub-component | components/HexMap/HexDefs.tsx | SVG clip paths defined correctly | Inside HexMap |

### Phase 3: Main Game — Hex Zoom

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-040 | Hex Zoom View | HexZoomView | panel | components/Game/HexZoomView.tsx | Large hex SVG, locations as circles, agents as orbit indicators, connection lines | Clicked a hex |
| S-041 | Hex Breadcrumb | HexBreadcrumb | widget | components/Game/HexBreadcrumb.tsx | Coords, terrain, location count, sight level, sphere influence | In hex zoom |
| S-042 | Hex Flavor Panel | HexFlavorPanel | panel | components/Game/HexFlavorPanel.tsx | Terrain flavor text, sight explanation, culture/faction summaries | In hex zoom |
| S-043 | Hex POI Panel | HexPoiPanel | panel | components/Game/HexPoiPanel.tsx | Scrollable location list with agent counts | In hex zoom |

### Phase 3: Main Game — Location View

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-050 | Location View | LocationView | panel | components/Game/LocationView.tsx | Location interior, agents present, encounter display, prose generation | Clicked a location |
| S-051 | Encounter Log | EncounterLog | sub-component | components/Game/EncounterLog.tsx | Active/completed encounters, threat color, progress steps, narrative text | Inside LocationView |

### Phase 3: Main Game — Right Sidebar (Agent Info)

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-060 | Retinue Panel | RetinuePanel | panel | components/Game/RetinuePanel.tsx | Agent list, tier badges, selection highlight, zoom buttons | No agent selected |
| S-061 | Agent Info Card | AgentInfoCard | panel | components/Game/AgentInfoCard.tsx | Name, portrait, domains, knowledge level, prose | Agent selected |
| S-062 | World Pulse | WorldPulse | widget | components/Game/WorldPulse.tsx | Tick, active agent count, culture count, mood summary | No agent selected |

### Phase 3: Main Game — Overlays & Modals

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-070 | Agent Wheel | AgentWheel | overlay | components/Game/AgentWheel.tsx | Radial menu with action slots, opens on agent click in hex zoom | In hex zoom, click agent |
| S-071 | Action Drawer | ActionDrawer | overlay | components/Game/ActionDrawer.tsx | Bottom drawer, agent header, horizontally scrolling action cards | Action triggered via HUD or wheel |
| S-072 | Action Card | ActionCard | sub-component | components/Game/ActionCard.tsx | Glyph, name, cost, detection risk, range info, click triggers confirm | Inside ActionDrawer |
| S-073 | Intervention Confirm | InterventionConfirm | overlay | components/Game/InterventionConfirm.tsx | Cost, detection risk, range, essence requirement, confirm/cancel | Clicked an ActionCard |
| S-074 | Agenda Picker | AgendaPicker | overlay | components/Game/AgendaPicker.tsx | Centered modal, agenda template list, selection | Intervention requires agenda |
| S-075 | Agent Profile Modal | AgentProfileModal | overlay | components/Game/AgentProfileModal.tsx | Full-screen, abilities, cooperation strategy, knowledge levels | Click "View Profile" |
| S-076 | Agent Detail Panel | AgentDetailPanel | panel | components/Game/AgentDetailPanel.tsx | Domain grid, allegiances, strategies | Alternative agent view |
| S-077 | Strand View | StrandView | overlay | components/Game/StrandView.tsx | Six strands (Presence/Desires/Bonds/Ambitions/Beliefs/Fears), insights | Click "View Psyche" |
| S-078 | Harvest Screen | HarvestScreen | overlay | components/Game/HarvestScreen.tsx | Full-screen cycle end, harvest type, echoes, "Begin Next Cycle" | Cycle ends |
| S-079 | Scry Overlay | ScryOverlay | overlay | components/Game/ScryOverlay.tsx | Divine court visualization, position slots, assignment UI, title proposals | Click "Scry" in HUD |

### Debug & Dev Surfaces

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-090 | Debug Panel | DebugPanel | dev | components/Game/DebugPanel.tsx | Feed/Agent-follow/Tick-inspector tabs, trace entries, category filters | Debug mode on (backtick) |
| S-091 | Magic Glow Tiles | MagicGlowTiles | dev | components/UI/MagicGlowTiles.tsx | Sphere color visualization with layered glows | URL param `?view=glow` |
| S-092 | Taxonomy Viewer | TaxonomyViewer | dev | components/TaxonomyViewer/TaxonomyViewer.tsx | Force-directed graph of cosmological taxonomy | Separate route/view |
| S-093 | Node Detail | NodeDetail | sub-component | components/TaxonomyViewer/NodeDetail.tsx | Sidebar detail for selected taxonomy node | Inside TaxonomyViewer |

### Shared/Utility Components

| ID | Surface | Component | Category | File | Testable Actions | Prerequisites |
|----|---------|-----------|----------|------|------------------|---------------|
| S-100 | Error Boundary | GameErrorBoundary | utility | components/shared/GameErrorBoundary.tsx | Catches render errors, shows fallback UI | Error in child |
| S-101 | Tooltip System | Tooltip | utility | components/shared/Tooltip.tsx | Dynamic tooltips with chaining and portal rendering | Hover interactive elements |
| S-102 | Progress Bar | ProgressBar | utility | components/shared/ProgressBar.tsx | Horizontal bar with glow effect | Used by DoomBar, MandateTracker, etc. |
| S-103 | Entity Card | EntityCard | utility | components/shared/EntityCard.tsx | Sidebar card for agents/cultures/factions with sections | Used in multiple panels |
| S-104 | Sphere Icon | SphereIcon | utility | components/shared/SphereIcon.tsx | Colored glyph for a sphere | Used throughout |
| S-105 | Rival Icon | RivalIcon | utility | components/shared/RivalIcon.tsx | Overlapping colored circles for rival affinities | Inside RivalPanel |
| S-106 | Animate Mount | AnimateMount | utility | components/shared/AnimateMount.tsx | Portal animation wrapper for entering/exiting overlays | Used by overlays |

### Cross-Cutting Concerns (tested across all surfaces)

| ID | Concern | Description | Surfaces Affected |
|----|---------|-------------|-------------------|
| X-001 | Keyboard Navigation | Tab order, Enter/Space on interactive elements, Escape to close overlays | All overlays, all interactive widgets |
| X-002 | STYLE.md Compliance | Brightness ranges, sphere colors, typography, fog of war | All visible surfaces |
| X-003 | Responsive Layout | Panels don't overlap, no horizontal scroll, sidebar widths | All panels/widgets |
| X-004 | Error States | Null/undefined data → graceful fallback, not crash | All panels that render data |
| X-005 | Loading States | Skeleton/spinner while data loads, no flash of empty content | Panels that fetch/compute |
| X-006 | Animation & Transitions | Enter/exit animations smooth, no layout jumps | All overlays, AnimateMount wrappers |
| X-007 | State Persistence | Closing/reopening panels preserves user selections | Debug panel, agent selection |

## Maintenance

When adding a surface:
1. Pick the next available ID in the appropriate section
2. Fill in all columns
3. Update the count below

**Total surfaces: 49 testable components + 7 cross-cutting concerns**
**Last full sweep coverage: 0/49** (registry is new — first tracked sweep pending)
