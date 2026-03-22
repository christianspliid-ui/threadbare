# Divine Court (Investiture) — Design Document

**Date:** 2026-03-06
**Revised:** 2026-03-17 — Separated from Scry. "Scry" now refers exclusively to temporary remote observation (see `2026-03-17-scry-observation-design.md`). This document covers the divine court hierarchy, titles, sacred sites, and artifacts.
**Phase:** 6D
**Status:** Approved (revised)

## Overview

The Divine Court is a full-screen overlay that represents the player's divine hierarchy — a metaphysical visualization inspired by the Deck of Dragons from Malazan Book of the Fallen. It shows all positions in the player's court (agents, sacred sites, artifacts), where each position has a player-chosen title with bonuses and weaknesses.

The Court is *not* a tactical dashboard. It's a narrative experience — connecting to the cosmic forces, seeing your divine court take shape. Abstract, conceptual, about correlations and titles rather than precise tactical details.

> **Naming clarification (2026-03-17):** The Divine Court and Scry are separate systems. "Scry" means temporary remote observation of an agent (see companion design doc). The Divine Court is about permanent hierarchy — investiture, titles, rank. Agents assigned to court positions appear in the sidebar under **Retinue**. Agents being scried appear under **Scry**. These are orthogonal categories.

## Key Design Decisions

1. **Player chooses titles** from system-proposed options based on agent stats/spheres — not auto-assigned
2. **Titles have bonuses AND weaknesses** — mechanical implications create interesting tradeoffs
3. **Titles can be changed** for an escalating essence cost — reassignment, demotion, restructuring
4. **Court geometry is player-chosen** — different visual layouts linked to Foundation Spheres
5. **Three holding types**: Agent positions, Sacred Sites, Divine Artifacts
6. **Full-screen overlay** — represents ascending to the metaphysical plane
7. **Player court only** for initial implementation; rival courts are a future phase
8. **Extensibility is paramount** — all structures data-driven, expandable
9. **Court agents provide permanent LOS** — agents assigned to court positions share line of sight with the player indefinitely (see LOS design doc). This is distinct from Scry, which is temporary.

## Court Structures

Four geometries tied to Foundation Sphere pairs. The player chooses one when first opening the Court (or can restructure later for significant cost).

| Structure | Geometry | Foundation | Passive Bonus |
|-----------|----------|------------|---------------|
| The High House | Pyramid/ziggurat | Order | +1 tier maintenance reduction for top 3 positions |
| The Circle | Mandala/radial | Light | All positions share a minor sphere influence bonus |
| The Web | Network graph | Chaos | Outer positions get +1 to a random domain each tick |
| The Abyss | Inverse pyramid | Darkness | Weaknesses on titles are reduced by 30% |

Each structure has 10 agent positions (1 Apex, 3 Inner, 6 Outer), 2-3 Sacred Site slots, and 2-4 Artifact slots. The geometry is purely visual — slot mechanics are identical across structures.

### Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `APEX_SLOTS` | 1 | Number of apex positions per court |
| `INNER_SLOTS` | 3 | Number of inner positions per court |
| `OUTER_SLOTS` | 6 | Number of outer positions per court |
| `RANK_MIN_TIER.apex` | 3 (Devoted) | Minimum influence tier for apex |
| `RANK_MIN_TIER.inner` | 2 (Aligned) | Minimum influence tier for inner |
| `RANK_MIN_TIER.outer` | 1 (Touched) | Minimum influence tier for outer |
| `RANK_REASSIGNMENT_COST.apex` | 30 | Essence cost to reassign apex |
| `RANK_REASSIGNMENT_COST.inner` | 15 | Essence cost to reassign inner |
| `RANK_REASSIGNMENT_COST.outer` | 5 | Essence cost to reassign outer |
| `RANK_DEMOTION_COST.apex` | 15 | Essence cost to demote from apex |
| `RANK_DEMOTION_COST.inner` | 8 | Essence cost to demote from inner |
| `RANK_DEMOTION_COST.outer` | 3 | Essence cost to demote from outer |
| `REASSIGNMENT_ESCALATION` | 1.25 | Cost multiplier per reassignment |
| `RESTRUCTURE_COST` | 50 | Essence cost to change court geometry |
| `TITLE_PROPOSALS_COUNT` | 3–4 | Number of title options generated per assignment |

### Expandability

Court structures are defined as data objects (not hardcoded). New structures can be added by defining:
- `structureType` identifier
- Foundation affinity
- Position count per rank
- Sacred site / artifact slot counts
- Passive bonus definition
- SVG/layout hints for UI geometry

## Positions & Title System

### Ranks

| Rank | Slots | Min Agent Tier | Title Power |
|------|-------|----------------|-------------|
| Apex | 1 | Tier 3+ (Devoted) | Strongest bonuses, strongest weaknesses |
| Inner | 3 | Tier 2+ (Aligned) | Moderate bonuses and weaknesses |
| Outer | 6 | Tier 1+ (Touched) | Mild bonuses and weaknesses |

### Title Generation

When a player assigns an agent to a position, the system generates 3-4 title proposals. Generation is deterministic (seeded PRNG: `hash(agentId + positionId + totalReassignmentCount)`) and based on:

- **Agent's sphere affinities** (from ascendant's sphere alignment + agent's domain capabilities)
- **Agent's strongest domains** (from domainCapabilities in RetinueAgent)
- **Position rank** (higher rank = more dramatic titles)
- **Court structure** (thematic influence — e.g., High House titles sound regal, Web titles sound conspiratorial)

Each title proposal includes:
- A name (e.g., "The Storm Marshal", "Keeper of the Veil", "Shadow of the Web")
- 1-2 bonuses (e.g., +2 Iron domain, +1 essence generation per tick)
- 1 weakness (e.g., -1 Heart domain, +10% detection risk by rivals)
- Flavor text

### Title Effects

Effects use a unified `TitleEffect` type:

| Effect Type | Example |
|-------------|---------|
| `domain_bonus` | +2 to Iron (warfare) domain |
| `tier_cost` | -1 essence for tier maintenance |
| `detection_risk` | +15% chance of being detected by rival scrying |
| `essence_gen` | +0.5 essence per tick to primary sphere |
| `sphere_influence` | +0.2 sphere weight in agent's hex |
| `custom` | Placeholder for future narrative effects |

### Reassignment

- **Reassign**: Replace the agent in a position. Costs essence, scaling with rank (Apex: 30, Inner: 15, Outer: 5). Cost increases by 25% each subsequent reassignment.
- **Demote**: Remove agent from position. Agent stays in retinue, loses title bonuses (and weaknesses). Position opens. Half the reassignment cost.
- **Restructure Court**: Change the court geometry entirely. Costs 50 essence + all current titles are revoked. Positions and slots reset.

### Tracing

The court system emits these trace types:

```typescript
interface CourtAssignmentTrace {
  type: 'court_assignment';
  tick: number;
  positionId: string;
  agentId: string;
  titleId: string;
  action: 'assign' | 'reassign' | 'demote' | 'restructure';
  essenceCost: number;
  rank: PositionRank;
}

interface CourtStructureTrace {
  type: 'court_structure_change';
  tick: number;
  oldStructure: CourtStructureType | null;
  newStructure: CourtStructureType;
  essenceCost: number;
}
```

### Fail-Soft

| Failure Case | Fallback Behavior |
|---|---|
| Agent no longer meets tier requirement for assigned position | Agent remains in position; UI shows warning badge. Not auto-demoted (player chose this). |
| Title generation seed produces fewer than 3 proposals | Show whatever proposals were generated (minimum 1). Log warning. |
| Court state missing on ascendant node | Treat as uninitialized; show court structure picker on open. |
| Referenced agent ID not found in graph | Show empty slot with "Agent lost" label. Do not crash. |
| Essence pool insufficient mid-assignment | Reject assignment; show "Insufficient essence" message. State unchanged. |

## The Three Holdings

### 1. Agent Positions (fully implemented)

The core of the Court — 10 slots arranged in the court geometry. Each slot holds one retinue agent with a player-chosen title.

### 2. Sacred Sites (Nexus) — data model + UI, placeholder interaction

Concept: The player consecrates an existing location node as a rift into their divine domain. This creates a nexus that radiates the player's primary sphere influence to adjacent hexes.

| Field | Description |
|-------|-------------|
| Slots | 2-3 per court structure |
| Target | Any location node the player has line of sight to |
| Cost | Essence scaled by terrain (higher for hostile terrain) |
| Effect | Radiates primary sphere influence to adjacent hexes |
| Bonus | Generates small amount of bonus essence per tick |
| Risk | Rivals can detect and attempt to desecrate |

### 3. Divine Artifacts (Relics) — data model + UI, placeholder interaction

Concept: The player forges a divine artifact by spending significant essence, then assigns it to an Inner+ rank agent as a bearer.

| Field | Description |
|-------|-------------|
| Slots | 2-4 per court structure |
| Target | Created from scratch (not existing items) |
| Cost | High essence cost scaled by sphere |
| Effect | Powerful bonuses for the bearer agent |
| Bearer | Must be Inner or Apex rank agent |
| Risk | Catastrophic consequences if bearer is captured/killed — artifact can be stolen by rivals |

## Data Model

### Core Types

```typescript
// Court structure chosen by player
interface CourtStructure {
  id: string;
  structureType: 'high_house' | 'circle' | 'web' | 'abyss';
  foundationAffinity: 'order' | 'light' | 'chaos' | 'darkness';
  positions: Position[];
  sacredSiteSlots: number;
  artifactSlots: number;
  structureBonus: StructureBonus;
}

// A named slot in the court
interface Position {
  id: string;
  rank: 'apex' | 'inner' | 'outer';
  slotIndex: number;
  assignedAgentId: string | null;
  activeTitle: Title | null;
  locked: boolean; // expansion hook
}

// A divine title with mechanical weight
interface Title {
  id: string;
  name: string;
  rank: PositionRank;
  sphereAffinity: SphereName;
  domainAffinity: ReachDomain;
  bonuses: TitleEffect[];
  weaknesses: TitleEffect[];
  flavorText: string;
  generationSeed: Record<string, unknown>;
}

// Unified mechanical modifier
interface TitleEffect {
  type: 'domain_bonus' | 'tier_cost' | 'detection_risk'
      | 'essence_gen' | 'sphere_influence' | 'custom';
  target: string;
  value: number;
  description: string;
}

// Sacred site holding
interface SacredSite {
  slotIndex: number;
  locationId: string | null;
  consecrationCost: number;
  radiusSphereInfluence: SphereName;
  influenceStrength: number;
  bonusEssencePerTick: number;
}

// Divine artifact holding
interface DivineArtifact {
  slotIndex: number;
  artifactId: string | null;
  name: string;
  bearerId: string | null;
  sphereAffinity: SphereName;
  effects: TitleEffect[];
  lossConsequence: string;
  creationCost: number;
}

// Top-level court state (lives on ascendant node properties)
// NOTE: This was formerly named ScryState. Renaming to CourtState
// is tracked as a future refactor task.
interface CourtState {
  courtStructure: CourtStructure;
  sacredSites: SacredSite[];
  artifacts: DivineArtifact[];
  titleHistory: TitleAssignment[];
  totalReassignmentCount: number;
}

// Audit trail entry
interface TitleAssignment {
  tick: number;
  positionId: string;
  agentId: string;
  titleId: string;
  action: 'assign' | 'reassign' | 'demote' | 'restructure';
  essenceCost: number;
}
```

### Content Package Fields

Content packages must define:

**Court Structures** (per structure type):
- `structureType`, `foundationAffinity`, `name`, `description`, `flavorText`
- `positions[]` with rank, slot index, `positionArchetype` (thematic label guiding title generation)
- `structureBonus` definition
- `sacredSiteSlots`, `artifactSlots` counts
- Layout hints (vertex positions, connection lines for SVG rendering)

**Title Generation** (per sphere):
- `titleFragments`: name prefixes, suffixes, epithets
  - Force: "Storm", "Iron", "War", "Blade", "Thunder"
  - Mind: "Dream", "Thought", "Silent", "Whisper", "Sight"
  - Spirit: "Veil", "Soul", "Ghost", "Shade", "Ether"
  - etc.
- `titleTemplates` per rank:
  - Apex: "The [Epithet] [Role]" — e.g., "The Storm Sovereign"
  - Inner: "[Sphere] [Role]" — e.g., "Veil Keeper"
  - Outer: "[Epithet] of the [Domain]" — e.g., "Watcher of the Eye"
- `bonusRules` per rank: stat ranges, allowed effect types
- `weaknessPool`: possible negative effects with sphere/domain associations

**Sacred Sites** (placeholder content):
- `consecrationCostByTerrain`: base costs
- `radiusRules`: adjacent hex count
- `influenceDecayRate`: distance weakening

**Divine Artifacts** (placeholder content):
- `artifactTemplates`: name fragments, sphere associations
- `creationCostBySphere`: essence costs
- `lossConsequenceTemplates`: narrative fragments

### Structure Bonus Definitions

| Structure | Bonus Type | Target | Value | Description |
|-----------|-----------|--------|-------|-------------|
| High House | `tier_cost` | top 3 positions | -1 | Reduced maintenance for highest ranks |
| Circle | `sphere_influence` | all positions | +0.1 | Shared sphere resonance |
| Web | `domain_bonus` | outer positions | +1 random | Chaotic domain enhancement |
| Abyss | `custom` | all titles | ×0.7 weakness | Weakness mitigation |

## UI Layout

### Full-Screen Overlay

The Court is a full-screen modal with a visual transition (fade + subtle particle effect suggesting ascending to the metaphysical plane).

**Access point:** A dedicated "Court" button in the top bar or sidebar header — *not* the scry wheel slot (which now triggers temporary observation). The wheel slot labeled "Scry" on the action wheel is for the observation mechanic described in the companion design doc.

```
┌─────────────────────────────────────────────────────┐
│  ✦ THE DIVINE COURT — [Court Name]       [Close ✕]  │
│  "Through the veil, your court takes shape..."       │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌─────────┐                            │
│              │  APEX    │  ← 1 position             │
│              │ (title)  │                            │
│              └────┬────┘                            │
│           ┌───────┼───────┐                         │
│      ┌────┴───┐ ┌─┴──┐ ┌─┴────┐                   │
│      │ INNER  │ │    │ │ INNER │ ← 3 positions     │
│      └────────┘ └────┘ └──────┘                    │
│    ┌──┬──┬──┬──┬──┬──┐                             │
│    │O │O │O │O │O │O │  ← 6 outer positions        │
│    └──┴──┴──┴──┴──┴──┘                             │
│                                                     │
│  ─── Sacred Sites ───    ─── Divine Artifacts ───   │
│  [ ◆ Nexus 1 ]          [ ⚔ Artifact 1 ]          │
│  [ ◇ Empty   ]          [ ◇ Empty       ]          │
│  [ ◇ Empty   ]          [ ◇ Empty       ]          │
│                          [ ◇ Empty       ]          │
├─────────────────────────────────────────────────────┤
│  Essence: ◈◈◈◈◈◇◇  │  Reassignment cost: 15  │   │
└─────────────────────────────────────────────────────┘
```

### Interaction Flows

**Assign Agent to Position:**
1. Click empty position slot → Agent Picker slides in (retinue agents filtered by min tier for rank)
2. Select agent → Title Proposal panel shows 3-4 cards with bonuses/weaknesses
3. Pick title → Confirmation with essence cost → Position fills
4. Filled positions show: agent name, title, tier indicator, sphere icon, sphere-color glow

**Reassign/Demote:**
1. Click filled position → context menu: "Reassign" / "Demote" / "View Agent"
2. Reassign → same picker flow with escalated cost displayed
3. Demote → confirmation → agent removed, title revoked, slot opens

**Sacred Sites / Artifacts (Phase 6D scope: placeholder only):**
- Slots visible with "Coming Soon" tooltip
- Visual design matches court aesthetic
- No click interaction — atmospheric presence only

## Implementation Scope (Phase 6D)

### Fully Implemented
- Type system for all three holdings
- Court structure data definitions (4 structures)
- Title generation engine (pure function, seeded PRNG)
- Title effect application (mechanical modifiers)
- Agent assignment / reassignment / demotion flow
- Court state on ascendant node properties
- Full-screen overlay UI with court geometry visualization
- Agent picker and title proposal panels
- Essence cost calculation and spending
- Title history audit trail

### Visible but Placeholder
- Sacred Site slots (rendered, not interactive)
- Artifact slots (rendered, not interactive)
- Court restructuring (button visible, not wired)

### Requires Refactoring (post-separation)
- Rename `ScryState` → `CourtState` in types and engine
- Rename `ScryOverlay` → `CourtOverlay` / `DivineCourt` in UI
- Rename `ScryContext` / `useScry` → `CourtContext` / `useCourt`
- Move court entry point from scry wheel slot to dedicated top-bar/sidebar button
- Update `scry-content.ts` → `court-content.ts`
- Update LOS: court-assigned agents still provide permanent LOS via `COURT_AGENT_SIGHT_RANGE` (renamed from `SCRY_SIGHT_RANGE`)

### Future Phases
- Sacred Site consecration flow
- Artifact forging flow
- Rival Courts (obscured view of opponent courts)
- Court restructuring interaction
- Title-driven narrative events
- Artifact theft/loss mechanics

## Rejected Alternatives

- **Auto-assigned titles**: Rejected — player agency in choosing from proposals is core to the Deck of Dragons feel
- **Organic/freeform positions**: Rejected — fixed positional hierarchy gives structure and progression
- **Sphere-themed sub-courts**: Rejected as initial approach — could be an expansion of the system later
- **Dashboard-style UI**: Rejected — the Court must feel metaphysical and narrative, not tactical
- **"Scry" as the name for this system**: Rejected (2026-03-17) — "scry" means observe/see remotely, which is a different god-power. The divine hierarchy is investiture, not observation. Conflating them confused both the UI (one button for two unrelated actions) and the mental model (retinue vs. scry sidebar categories).

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — All costs, tier thresholds, slot counts, and escalation factors are named constants. |
| 2 | Inspectability | PASS — `CourtAssignmentTrace` and `CourtStructureTrace` provide full causal audit trail. |
| 3 | Determinism | PASS — Title generation uses seeded PRNG (`hash(agentId + positionId + reassignmentCount)`). |
| 4 | Fail-soft | PASS — Fail-soft table covers missing agents, insufficient proposals, missing state, and insufficient essence. |
| 5 | Narrative | PASS — Metaphysical overlay aesthetic, title flavor text, court geometry as narrative identity. |
| 6 | Additive | PASS — Separation from Scry is additive: Court retains all existing functionality, Scry becomes a new system. |
| 7 | Performance | PASS — Court is opened on demand (no per-tick cost). Title generation is pure and cacheable. |
