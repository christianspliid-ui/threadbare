# Agent Detail Panel — Design Document

**Date:** 2026-03-06
**Phase:** 6E (Polish & Juice)
**Status:** Design

## Problem

When a player clicks an agent in the RetinuePanel or LocationView, there's no way to inspect them in depth. The player needs a full character sheet to understand who this agent is, what drives them, and what they're capable of — essential for making informed divine intervention decisions.

## Design Decisions

### 1. Placement: Replace Right Sidebar

When an agent is selected, the right column (currently RetinuePanel) slides to show the AgentDetailPanel. A back button returns to the retinue list. This avoids adding new layout complexity and keeps the interaction in the player's existing spatial model.

**Tradeoff:** Player temporarily loses the retinue overview. Acceptable because the detail panel has a compact header showing the agent's tier and a quick back button — the player never feels "lost."

### 2. Depth: Full Character Sheet

Not a tooltip or summary — a scrollable character sheet showing all six psyche strands, domain capabilities, narrative archetype, relationships, and action buttons. This is the deepest view of any agent in the game.

### 3. Narrative Archetype Integration

Each agent has a narrative archetype (one of 19, from the content strategy). The detail panel displays:
- Archetype name as a subtitle tag (e.g., "Tragic Hero", "Trickster")
- Story shape as a one-line flavor text
- Reach affinities highlighted in the domain grid

The archetype is a **trait on the agent node** (type: `narrative_archetype`), set during world generation. The detail panel reads it from the graph.

### 4. Data Sources

All data comes from existing engine modules — no new graph queries needed beyond one aggregator function:

| Section | Source | Module |
|---------|--------|--------|
| Header (name, tier, faction) | RetinueAgent | retinue.ts |
| Archetype | Agent node trait edge → archetype data | graph + content-strategy |
| Location | RetinueAgent.locationName | retinue.ts |
| Domain Capabilities | RetinueAgent.domainCapabilities | retinue.ts |
| Axiological Profile | RetinueAgent.profile | retinue.ts |
| Psyche Strands | 6 strand extractors | strands.ts |
| Relationships | extractBonds() | strands.ts |
| Actions | Existing wheel/scry handlers | GameView.tsx |

### 5. Section Layout (top to bottom)

1. **Header Bar** — Back button, agent name (Cinzel), tier badge (colored dot + name), faction tag if applicable
2. **Archetype Banner** — Archetype name, story shape italic, reach affinity dots
3. **Domain Grid** — 3×3 grid of Nine Reaches with score bars, archetype affinities highlighted
4. **Values Compass** — Top 3 strongest axiological values with labels (e.g., "Deeply Ambitious", "Compassionate")
5. **Bonds List** — Top 5 relationships: name, sentiment bar (red↔green), basis tag
6. **Location Link** — Current location as a clickable breadcrumb
7. **Action Row** — "View Psyche" button (opens StrandView overlay), "Intervene" button (opens AgentWheel)

### 6. No New Engine Modules

One new function `getAgentDetail()` in a new file `src/engine/agentDetail.ts` that aggregates:
- RetinueAgent data (from retinue.ts)
- Strand data for Desires + Bonds (from strands.ts)
- Archetype lookup (from graph trait edges)

This keeps the component thin — it receives a pre-computed `AgentDetail` object and just renders.

## Component Structure

```
AgentDetailPanel.tsx  (~250 lines)
├── Header (back, name, tier, faction)
├── ArchetypeBanner (name, story shape, reach dots)
├── DomainGrid (3×3 Nine Reaches bars)
├── ValuesCompass (top 3 axiological)
├── BondsList (top 5 relationships)
├── LocationLink (clickable)
└── ActionRow (View Psyche, Intervene)
```

All in a single file — sections are small enough to not warrant splitting.

## Integration Points

- **GameView.tsx** — When `selectedAgentId` is set, right column shows AgentDetailPanel instead of RetinuePanel
- **RetinuePanel.tsx** — Agent click sets selectedAgentId (already wired)
- **LocationView.tsx** — Agent click also sets selectedAgentId (already wired)
- **AgentWheel** — "Intervene" button triggers the existing wheel flow
- **StrandView** — "View Psyche" button opens the existing strand overlay

## Archetype Data Shape

For now, archetype is stored as a string trait on the agent node. The detail panel maps it to the content strategy table for display data:

```typescript
interface NarrativeArchetype {
  id: string;           // e.g., 'tragic_hero'
  name: string;         // e.g., 'Tragic Hero'
  storyShape: string;   // e.g., 'Rise, hubris, fall'
  proseTone: string;    // e.g., 'Grand, foreboding, inevitable'
  reachAffinities: ReachDomain[]; // e.g., ['iron', 'veil', 'heart']
}
```

This data lives in a new `src/data/archetype-content.ts` file — consistent with the content package pattern from `scry-content.ts` and `mandate-content.ts`.

## Test Strategy

- **Unit tests** for `getAgentDetail()` — mock graph, verify aggregation
- **Component tests** for AgentDetailPanel — render with mock data, verify sections appear
- **Integration test** — full flow: click agent in retinue → detail panel shows → click back → retinue returns

## Implementation Tasks (8 tasks)

1. Create `src/data/archetype-content.ts` — 19 archetype definitions
2. Create `src/engine/agentDetail.ts` — `getAgentDetail()` aggregator
3. Create `src/components/Game/AgentDetailPanel.tsx` — full character sheet component
4. Modify `GameView.tsx` — conditional right column rendering
5. Add archetype trait assignment to world seeding (seed.ts)
6. Unit tests for agentDetail.ts
7. Component tests for AgentDetailPanel.tsx
8. Integration test + final verification

## Rejected Alternatives

- **Tooltip/popover** — Too shallow for 10 value pairs + 9 domains + relationships. Players need to study agents.
- **Full-screen overlay** — Too disruptive. The agent is context within the world, not a separate screen.
- **New third column** — Layout already has 3 columns. Adding a 4th would crowd everything.
- **Modal dialog** — Breaks spatial flow. The sidebar replacement maintains directional consistency.
