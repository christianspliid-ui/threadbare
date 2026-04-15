# Strategic Actions — UI/Threads Visibility & HexMap Overlays

**Issue:** THR-9  
**Project:** Attention Tier Model  
**Status:** Design  
**Date:** 2026-04-15  
**Depends on:** Phase 8 strategic action data expansion (shipped — 36 templates, 6 behavior families)

## Problem

Strategic actions are running in the engine — agents pursue ambitions, build projects, claim control — but none of this is visible to the player. The Threads panel shows encounter activity only, the agent detail panel has no strategic section, and the HexMap has no indication of projects under construction or territories under control. The player has no way to observe, understand, or react to strategic behavior.

## Design Goals

1. **Make strategic intent legible in Threads** — at a glance, the player should see *what* an agent is doing strategically (behavior family), *how far along* they are (project progress), and *what they hold* (control stances).
2. **Make strategic presence visible on the HexMap** — projects and control stances should have distinct hex signifiers so the player can see the world being shaped.
3. **Make strategic history inspectable** — the agent detail panel should show a narrative timeline of completed strategic actions, reinforcing the "character sheet" feel.
4. **Prose first** — all indicators communicate through narrative language and iconography, never raw numbers. Progress is "nearly complete" not "7/12 ticks."

---

## Engine Pillar

### Data Sources

All data comes from `gameState.strategicState: StrategicRuntimeState`:

- **`projects: StrategicProjectRuntime[]`** — active multi-tick projects with `actorId`, `templateId`, `progress`, `progressRequired`, `status`
- **`controls: StrategicControlState[]`** — active control stances with `actorId`, `targetNodeId`, `behaviorFamily`, `neglectTicks`, `degradation`, `active`
- **`history: StrategicHistoryEntry[]`** — rolling window (120 ticks) of completed/failed actions with `actorId`, `templateId`, `verb`, `behaviorFamily`, `displayName`, `outcome`

### New Derived Data (pure selector functions)

No engine changes needed — all UI data is derived via pure selectors:

```typescript
// strategicPresentation.ts — new file

/** Per-agent strategic summary for Threads row display */
interface AgentStrategicSummary {
  agentId: string
  behaviorFamily: BehaviorFamily | null
  activeProject: {
    displayName: string
    progressFraction: number        // 0–1
    progressLabel: string           // "just begun" | "underway" | "nearly complete"
    verb: StrategicVerb
  } | null
  controlCount: number              // number of active control stances
  primaryControl: {
    displayName: string
    targetName: string
    healthLabel: string             // "firm" | "weakening" | "crumbling"
  } | null
  recentCompletions: number         // count in last 30 ticks
}

/** Per-hex strategic overlay data for HexMap */
interface HexStrategicOverlay {
  hexCol: number
  hexRow: number
  projects: Array<{
    actorId: string
    actorName: string
    displayName: string
    behaviorFamily: BehaviorFamily
    progressFraction: number
  }>
  controls: Array<{
    actorId: string
    actorName: string
    behaviorFamily: BehaviorFamily
    degradation: number
  }>
}
```

### Selector Wiring

- `getAgentStrategicSummary(state, agentId)` — consumed by `ThreadsPanel` and `ThreadDetailView`
- `getHexStrategicOverlays(state)` — consumed by HexMapV2 render pipeline
- `getAgentStrategicHistory(state, agentId)` — consumed by `AgentInfoCard`

All selectors key on `worldVersion` for memo invalidation (existing pattern).

### Progress Label Mapping

```typescript
const PROGRESS_LABELS: Record<string, [number, string][]> = {
  default: [
    [0.0, 'just begun'],
    [0.25, 'underway'],
    [0.5, 'well advanced'],
    [0.75, 'nearly complete'],
  ],
}

const HEALTH_LABELS: [number, string][] = [
  [0.0, 'firm'],
  [0.3, 'weakening'],
  [0.6, 'fraying'],
  [0.8, 'crumbling'],
]
```

**NFP #1 (Tunability):** All thresholds are named constants.  
**NFP #5 (Narrative > mechanical):** Labels are prose, not percentages.

---

## Content Pillar

### Behavior Family Visual Identity

Each behavior family needs a glyph and a color accent for consistent identification across Threads, HexMap, and detail panels.

| Family | Glyph | Color | Hex | Rationale |
|--------|-------|-------|-----|-----------|
| `merchant-expansion` | ¤ (coin) | Warm gold | `#c8a84e` | Commerce, wealth |
| `builder-civic` | ⚒ (hammer) | Stone grey | `#8a9a7c` | Construction, infrastructure |
| `scholar-seeker` | 📜 (scroll) | Ink blue | `#5b7fa5` | Knowledge, research |
| `zealot-mission` | ✦ (star) | Ember red | `#b85450` | Fervor, sacred fire |
| `court-political` | ⚜ (fleur-de-lis) | Royal purple | `#8b6baa` | Authority, patronage |
| `underworld-network` | 🗡 (dagger) | Shadow grey | `#6a6a72` | Covert, illicit |
| `warlord-expansion` | ⚔ (swords) | Iron rust | `#9a6850` | Conquest, military |
| `caretaker-steward` | ✚ (cross) | Sage green | `#6a9a6e` | Healing, tending |
| `artist-crafter` | ◈ (diamond) | Azure | `#5a8aaa` | Creation, beauty |
| `wanderer-explorer` | ⇢ (arrow) | Dusty amber | `#aa8a5a` | Travel, discovery |

**Implementation:** `BEHAVIOR_FAMILY_PRESENTATION: Record<BehaviorFamily, { glyph: string; color: string; label: string }>` — new constant in `strategicPresentation.ts`.

### Strategic Verb Icons (for detail panel history)

| Verb | Icon | Meaning |
|------|------|---------|
| `gather_info` | 🔍 | Scouting, surveying |
| `create` | ⚒ | Building, founding |
| `change` | ↻ | Transforming, converting |
| `control` | ⚜ | Claiming, holding |
| `destroy` | ✕ | Razing, sabotaging |

### Activity Prose Templates

The secondary info line for agents with active projects uses `activityProse` from the template (already authored for all 36 templates). Example: "Negotiating warehouse terms" rather than "multi_tick_project: 7/12".

---

## UI Pillar

### 1. Threads Panel — CompactThreadRow Changes

**Current row structure:**
```
┌─ [tier-color border] Name ─────────────── [👁 eye] ─┐
│  Secondary info · activity label                      │
│  [encounter pool button]                              │
└───────────────────────────────────────────────────────┘
```

**Proposed row structure (agents with strategic activity):**
```
┌─ [tier-color border] Name ──── [family glyph] [👁] ─┐
│  Secondary info · activity label                      │
│  [strategic badge ──────────────────] [enc pool btn]  │
└───────────────────────────────────────────────────────┘
```

**Changes:**

**A. Behavior family glyph** — Small inline glyph (12px) in the name line, right-aligned before the eye icon. Uses `BEHAVIOR_FAMILY_PRESENTATION[family].glyph` with family color. Only shown when agent has an active project or control stance. Hover title: "Merchant expansion" (human-readable family label).

**B. Strategic badge** — New optional third line, same row as encounter pool button. Pill-shaped badge (matching existing encounter badge pattern: `font-body`, `text-xs`, family-color background at 8% opacity, family-color text). Content varies:

- **Active project:** `"{glyph} {activityProse} — {progressLabel}"` e.g. `"⚒ Raising workshop walls — well advanced"`
- **Active control (no project):** `"{glyph} Holds {controlName}"` e.g. `"¤ Holds Riverside Market"`
- **Multiple controls:** `"{glyph} Holds {primaryControl} +{n-1}"` e.g. `"¤ Holds Riverside Market +2"`
- **No active strategic:** badge hidden (row unchanged from current)

**C. Priority:** Strategic badge appears *only* for agents (not locations/factions/armies/artifacts). When both encounter pool button and strategic badge are present, they share the bottom row via flex with `gap: 4px`, strategic badge first (flex-1 truncate), encounter pool button second (flex-shrink-0).

**D. Dormant agents:** Strategic badges follow the existing dormant opacity (0.5). A dormant agent with an active project is a valid state (they may be building something while out of encounter rotation).

### 2. HexMap — Strategic Signifiers

**Two new signifier entity types** registered in the hex composition system:

#### A. Strategic Project Marker

- **Entity type:** `'strategic-project'`
- **Preferred slot:** `SE` (fallback: `SW`, `NE`)
- **Footprint:** `small`
- **Priority:** 60 (below location icons at 80, above terrain signifiers at 40)
- **Visible at:** `['hero-local', 'regional']` (hidden at continental/full-world)
- **Visual:** Family-colored dot (6px at hero-local) with a subtle radial pulse animation (1.5s period, 0.6–0.9 opacity). At hero-local zoom, a tiny progress arc (quarter/half/three-quarter fill) wraps the dot.
- **Suppresses:** Nothing (small footprint, non-overlapping)
- **Data source:** `HexStrategicOverlay.projects` — one marker per active project on the hex
- **Multiple projects on same hex:** Stack in RING slot with sequential `ringIndex`

#### B. Control Territory Marker

- **Entity type:** `'strategic-control'`
- **Preferred slot:** `RING`
- **Footprint:** `tiny`
- **Priority:** 50
- **Visible at:** `['hero-local', 'regional']`
- **Visual:** Small family-colored pip (4px) on the hex ring. Firm control: full opacity (0.8). Degraded control: reduced opacity (0.4) + slight jitter animation. This produces a "claimed territory" feel — pips accumulate around hexes where agents exert control.
- **Suppresses:** Nothing (RING slot has unlimited capacity)
- **Data source:** `HexStrategicOverlay.controls`
- **Degradation visual:** Opacity scales linearly: `0.8 - (degradation × 0.4)` → range [0.4, 0.8]

#### Implementation Pattern

Follows the existing `ActivityIconMesh` pattern:
1. New `StrategicMarkerMesh` class with `InstancedMesh` (one for projects, one for controls)
2. Canvas-rasterized icon textures via `buildStrategicIconTextureCache()` (same pattern as `buildActivityIconTextureCache`)
3. Per-frame update reads `HexStrategicOverlay` data, sets instance transforms and colors
4. Registered in `HexMapV2Scene` alongside existing meshes

**NFP #7 (Performance):** Textures built once. Instance count bounded by project/control count (typically < 50). No per-frame canvas operations.

### 3. Agent Detail Panel — Strategic Section

**New section in `AgentInfoCard`** (inserted between current "Relationships" and "Movement" sections):

#### Section: "Designs" (heading)

**Active project subsection** (if any):
```
⚒ Raising workshop walls
  Well advanced — at Thornfield
```
- Display font for project name, body font for progress + location
- Family-colored left accent bar (2px, same as tier border pattern)
- Progress conveyed via prose label only (not a progress bar — NFP #5)

**Control stances subsection** (if any):
```
Holds:
  ¤ Riverside Market — firm
  ¤ Harbor Warehouse — weakening
```
- List of held controls with family glyph, target name, health label
- Health label color: `firm` → text-secondary, `weakening` → `#aa8a5a`, `crumbling` → `#b85450`

**Recent history subsection** (last 5 entries from `strategicState.history` for this agent):
```
History:
  ✓ Founded trade chapter at Millhaven — 12 ticks ago
  ✓ Surveyed Thornfield markets — 28 ticks ago
  ✕ Failed to secure warehouse lease — 45 ticks ago
```
- Completed actions: `✓` prefix, text-secondary color
- Failed actions: `✕` prefix, muted red color (`#b85450`)
- Stalled actions: `—` prefix, text-muted color
- Relative tick display: `{n} ticks ago` (not absolute tick numbers)

**Empty state:** If agent has no strategic activity (no project, no controls, no history), the "Designs" section is hidden entirely — no empty placeholder.

### 4. Debug Panel Integration

**Strategic tab** in the existing debug panel (alongside traces, CLI):

- **Agent strategic board:** For selected agent, show top 5 strategic candidates with scoring breakdown (ambitionAlignment, roleFit, worldImpact, etc.)
- **Global strategic overview:** Active project count, control count, per-family breakdown
- **Strategic traces viewer:** Filter traces by `StrategicCandidateBoardTrace`, `StrategicProjectProgressTrace`, `StrategicWorldChangeTrace`

This reuses existing debug panel patterns — no new infrastructure needed.

---

## Wiring Section

| Module | Orchestrator Phase | UI Component | GameState Flow | Traces | Debug |
|--------|-------------------|--------------|----------------|--------|-------|
| `strategicPresentation.ts` (new) | N/A (pure selectors) | ThreadsPanel, ThreadDetailView, AgentInfoCard | Reads `strategicState` | N/A | N/A |
| `StrategicMarkerMesh` (new) | N/A (render layer) | HexMapV2Scene | Reads via `getHexStrategicOverlays` | N/A | Visible in debug panel hex inspector |
| `buildStrategicIconTextureCache` (new) | N/A (init-time) | HexMapV2 texture pipeline | N/A | N/A | N/A |
| Strategic debug tab (new) | N/A | DebugPanel | Reads `strategicState` + trace buffer | Displays strategic traces | Primary debug surface |

**Prose pipeline:** No `enrichProse()` integration needed — `activityProse` and `completionProse` are pre-authored on templates. Future enrichment is a separate ticket.

**Player controls:** No new player controls. This is observability only — the player watches strategic behavior unfold, they don't direct it (that's a different system).

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `BEHAVIOR_FAMILY_PRESENTATION` | (see Content Pillar table) | Glyph, color, label per family |
| `PROGRESS_LABEL_THRESHOLDS` | [0, 0.25, 0.5, 0.75] | Progress fraction → prose label boundaries |
| `HEALTH_LABEL_THRESHOLDS` | [0, 0.3, 0.6, 0.8] | Degradation → health label boundaries |
| `STRATEGIC_BADGE_BG_OPACITY` | 0.08 | Badge background opacity |
| `STRATEGIC_PROJECT_MARKER_SIZE` | 0.12 (× HEX_SIZE) | Project dot size on hex |
| `STRATEGIC_CONTROL_PIP_SIZE` | 0.08 (× HEX_SIZE) | Control pip size on hex ring |
| `STRATEGIC_PROJECT_PULSE_PERIOD` | 1.5s | Pulse animation period |
| `STRATEGIC_PROJECT_PULSE_RANGE` | [0.6, 0.9] | Opacity range for pulse |
| `STRATEGIC_CONTROL_OPACITY_FIRM` | 0.8 | Control pip opacity when healthy |
| `STRATEGIC_CONTROL_OPACITY_DEGRADED` | 0.4 | Control pip opacity at max degradation |
| `STRATEGIC_HISTORY_DISPLAY_COUNT` | 5 | Max history entries in detail panel |
| `STRATEGIC_HISTORY_RECENT_TICKS` | 30 | Window for "recent completions" count |
| `STRATEGIC_PROJECT_PRIORITY` | 60 | Hex composition priority |
| `STRATEGIC_CONTROL_PRIORITY` | 50 | Hex composition priority |
| `STRATEGIC_MARKER_TEXTURE_SIZE` | 64 | Canvas resolution for marker textures |

---

## Tracing

No new trace types needed — the engine already emits:

- `StrategicCandidateBoardTrace` — candidate scoring per decision
- `StrategicActionStartedTrace` — when a strategic action begins
- `StrategicProjectProgressTrace` — per-tick project advancement
- `StrategicWorldChangeTrace` — graph mutations from completions

The UI reads `strategicState` directly; traces are for debug inspection only.

---

## Fail-Soft Table

| Failure Case | Fallback |
|-------------|----------|
| `strategicState` is `undefined` | All selectors return empty/null. No badges, no markers, no section. Existing UI unchanged. |
| Agent has project but template not found | Show `displayName` from runtime state (already stored). Skip family glyph — use generic `◆`. |
| Behavior family not in `BEHAVIOR_FAMILY_PRESENTATION` | Use fallback `{ glyph: '◆', color: '#8a8a8a', label: 'Unknown' }` |
| Project `progressRequired` is 0 | Progress fraction clamped to 1.0. Label: "complete". |
| Control `targetNodeId` not found in graph | Display "(unknown location)" instead of resolved name. |
| Hex strategic overlay has > 8 markers | Composition resolver naturally handles via RING slot stacking. Visual density is intentional — crowded hexes look contested. |
| `activityProse` array empty on template | Fall back to `displayName` (always present on runtime state). |

---

## Implementation Slices

Ordered for incremental delivery — each slice is independently shippable and testable.

### Slice 1: Presentation Layer Foundation
- Create `strategicPresentation.ts` with `BEHAVIOR_FAMILY_PRESENTATION`, selector functions, label mappings
- Unit tests for all selectors (empty state, single project, multiple controls, degradation labels)
- **Verifiable:** `npm test` — all selectors produce correct output for mock strategic state

### Slice 2: Threads Panel Integration
- Add `AgentStrategicSummary` prop threading through `ThreadsPanel` → `CompactThreadRow`
- Implement family glyph in name line
- Implement strategic badge (third line)
- Flex layout with encounter pool button
- **Verifiable:** `?view=game&seeded` — agents with strategic activity show badges. Agents without show unchanged rows.

### Slice 3: Agent Detail Panel
- Add "Designs" section to `AgentInfoCard`
- Active project display with prose progress
- Control stances list with health labels
- Recent history timeline
- **Verifiable:** Click agent in Threads → detail panel shows strategic section (or hides it if no activity)

### Slice 4: HexMap Strategic Markers
- Create `StrategicMarkerMesh` with `InstancedMesh` for projects and controls
- Build texture cache for family-colored dots/pips
- Register composition manifests (`strategic-project`, `strategic-control`)
- Pulse animation for projects, opacity scaling for control degradation
- **Verifiable:** `?view=game&seeded&nofog` — hexes with strategic activity show colored markers

### Slice 5: Debug Panel & Verification
- Strategic tab in debug panel
- Agent strategic board display
- Global strategic overview
- Strategic trace filtering
- End-to-end CLI verification: `tick 50` → `status` → confirm strategic entries exist → check UI matches
- **Verifiable:** Debug panel accurately reflects engine state

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | **PASS** — All visual parameters (sizes, opacities, thresholds, colors) are named constants in the constants table |
| 2 | Inspectability | **PASS** — Strategic state readable via selectors, history timeline in detail panel, debug panel with full candidate board and trace filtering |
| 3 | Determinism | **PASS** — Pure selectors from deterministic state. No UI-side randomness. |
| 4 | Fail-soft | **PASS** — Fail-soft table covers all edge cases. Missing strategicState → graceful empty. |
| 5 | Narrative > mechanical | **PASS** — Progress labels are prose ("well advanced"), health labels are prose ("weakening"), activity descriptions from authored templates. No numbers exposed to player. |
| 6 | Additive | **PASS** — New file (strategicPresentation.ts), new mesh (StrategicMarkerMesh), new section in existing components. No existing code deleted or restructured. |
| 7 | Performance | **PASS** — Textures built once. InstancedMesh for hex markers (typically < 50 instances). Selectors memoized on worldVersion. No per-frame canvas ops. |
