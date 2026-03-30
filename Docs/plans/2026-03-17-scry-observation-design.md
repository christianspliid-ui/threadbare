# Scry — Temporary Remote Observation

**Date:** 2026-03-17
**Status:** Draft
**Companion doc:** `2026-03-06-ascendant-scry-design.md` (Divine Court / Investiture — the system formerly called "Scry")

## Overview

Scry is a god-power that lets the player temporarily share an agent's line of sight. The player targets an agent via the action wheel's "Scry" slot, pays an essence cost, and for a fixed duration sees through that agent's eyes — their hex and surrounding hexes become visible in the fog of war.

While a scry link is active, the player can also use intervention actions on the scried agent regardless of avatar distance. This creates a tactical window: the player trades essence for temporary remote influence over an agent who may be far away or heading into unknown territory.

Scry is fundamentally **observation**. The Divine Court (investiture) is **hierarchy**. These are orthogonal systems:

| System | Verb | Duration | Sidebar category | LOS contribution |
|--------|------|----------|-----------------|-----------------|
| **Scry** | Observe | Temporary (N ticks) | "Scry" | Temporary; expires with the link |
| **Divine Court** | Invest | Permanent (until demoted) | "Retinue" | Permanent; as long as agent holds a position |

## Design

### Core Mechanic

1. Player selects an agent and clicks the **Scry** wheel slot (position 0, 12 o'clock)
2. System checks: agent is not already scried, concurrent scry limit not reached, player can afford essence cost
3. A `scrying` edge is created in the graph: `ascendant --scrying--> agent` with `startTick` and `expiryTick` properties
4. For the duration, the agent acts as an LOS source using `SCRY_OBSERVATION_RANGE`
5. The agent appears in the right sidebar under a dedicated **"Scry"** section (above or below Retinue)
6. The player can use intervention wheel slots on this agent even if the agent's hex is outside avatar range
7. When `expiryTick` is reached, the edge is removed. The agent leaves the Scry sidebar section. Hexes they were revealing transition to `remembered` with stale snapshots. Intervention range reverts to normal rules.

### Who Can Be Scried?

- **Any agent the player has influence over (tier >= 1)** — scry requires at minimum a thread of divine connection
- **Agents already in the Divine Court** cannot be scried — they already provide permanent LOS. The scry slot is disabled/hidden for court agents with tooltip: "Already in your court"
- **Agents already being scried** cannot be double-scried — the slot shows "Already scrying" and is disabled
- Future expansion: scrying tier 0 agents at higher cost (requires "reaching out" to an unaware soul)

### Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SCRY_DURATION_TICKS` | 30 | How many ticks a scry link lasts |
| `SCRY_ESSENCE_COST` | 5 | One-time upfront essence cost to initiate a scry |
| `SCRY_ESSENCE_SPHERE` | player's primary | Which sphere pool the cost draws from |
| `MAX_CONCURRENT_SCRYS` | 3 | Maximum number of simultaneous scry links |
| `SCRY_OBSERVATION_RANGE` | 2 | Hex radius revealed around the scried agent |
| `SCRY_COOLDOWN_TICKS` | 0 | Ticks before the same agent can be re-scried (0 = immediate re-scry allowed) |
| `SCRY_MIN_TIER` | 1 | Minimum influence tier required to scry an agent |

### Graph Representation

Scry is modeled as a temporary directed edge in the world graph:

```typescript
interface ScryEdge {
  type: 'scrying';
  sourceId: string;       // ascendant node ID
  targetId: string;       // agent node ID
  startTick: number;      // tick when scry was initiated
  expiryTick: number;     // startTick + SCRY_DURATION_TICKS
}
```

This fits the "everything is a graph node/edge" architectural constraint. The edge is removed during tick processing when `currentTick >= expiryTick`.

### PRNG Callouts

No randomness in the scry system itself. Scry is a deterministic player action: target + cost → duration. If future expansions add "scry interference" or "scry clarity" variance, those would use `hash(ascendantId + agentId + tick)` as seed.

### Tracing

```typescript
interface ScryStartedTrace {
  type: 'scry_started';
  tick: number;
  ascendantId: string;
  agentId: string;
  agentName: string;
  essenceCost: number;
  sphere: SphereName;
  expiryTick: number;
  concurrentCount: number;  // how many scrys are now active (including this one)
}

interface ScryExpiredTrace {
  type: 'scry_expired';
  tick: number;
  ascendantId: string;
  agentId: string;
  agentName: string;
  startTick: number;
  /** Hex coords that will transition to 'remembered' due to this expiry */
  revealedHexCount: number;
}

interface ScryActionAtDistanceTrace {
  type: 'scry_action_at_distance';
  tick: number;
  agentId: string;
  interventionType: InterventionType;
  hexDistance: number;
  /** True if this intervention would NOT have been in range without the scry link */
  extendedByScry: boolean;
}
```

### Fail-Soft

| Failure Case | Fallback Behavior |
|---|---|
| Scry edge references agent ID not in graph | Remove the edge silently during tick. Log warning. No crash. |
| Agent moves to a hex outside the grid bounds | Scry remains active but contributes no LOS hexes for that tick. Resumes when agent re-enters valid hex. |
| Concurrent scry count exceeds `MAX_CONCURRENT_SCRYS` (data corruption) | Expire oldest scry edge(s) until count is valid. Log warning. |
| `expiryTick` is in the past when first encountered (clock jump) | Remove edge immediately. Treat as expired at current tick. |
| Essence pool insufficient when scry is attempted | Reject action. Show "Insufficient essence" message. No edge created. |
| Player attempts to scry a court-assigned agent | Reject action. Show "Already in your court — permanent sight." No edge created. |

## Sidebar: The "Scry" Category

### Layout

The right sidebar currently shows a single **Retinue** section (all tier >= 1 agents). With this change, the sidebar gets a second section:

```
┌─────────────────────────┐
│  ◈ Scry (2/3)           │  ← active scrys / max
│  ┌─────────────────────┐│
│  │ ⟐ Kael the Wanderer ││  ← scry icon + agent name
│  │   The Dustfields     ││  ← current location
│  │   ▮▮▮▮▮▮▯▯▯▯ 18t   ││  ← duration bar + ticks remaining
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ ⟐ Sera Nightbloom   ││
│  │   Thornhaven         ││
│  │   ▮▮▯▯▯▯▯▯▯▯  6t   ││
│  └─────────────────────┘│
│                         │
│  ✦ Retinue (5)          │  ← existing retinue section
│  ┌─────────────────────┐│
│  │ ▎ Dorin Ashmark      ││
│  │   Ironfeld           ││
│  └─────────────────────┘│
│  ...                    │
└─────────────────────────┘
```

### Scry Entry Behavior

- **Click** → selects the agent (opens agent drawer with action wheel, just like clicking a retinue entry)
- **Duration bar** → visual countdown. Color shifts from calm (blue/teal) to urgent (amber/red) in the last 25% of duration
- **Expiry** → entry fades out with a brief dissolve animation, then is removed from the list
- **Hover** → shows tooltip with: agent name, location, ticks remaining, "Click to interact"

### Interaction at Distance

When a scried agent is selected and the action wheel opens, **all wheel slots behave as if the agent is in range**, regardless of actual hex distance. Specifically:

- `rangeStatus` is forced to `'in_range'` for all intervention slots when the selected agent has an active scry link
- The wheel slot tooltip shows "(via Scry)" next to range info to make the source of the range extension clear
- This does NOT reduce essence costs or detection risk — only range is bypassed

When the scry expires, if the agent is still selected and the action wheel is open:
- Range status reverts to actual hex distance calculation
- Slots that are now out of range visually lock with the standard "out of range" appearance
- No in-flight intervention is cancelled (if the player confirmed an intervention before expiry, it still executes)

## Wheel Slot Changes

The existing `'scry'` wheel slot (position 0, type `'observation'`) changes behavior:

| Property | Before (opens Court) | After (initiates Scry) |
|----------|---------------------|----------------------|
| `id` | `'scry'` | `'scry'` (unchanged) |
| `label` | `'Scry'` | `'Scry'` (unchanged) |
| `type` | `'observation'` | `'observation'` (unchanged) |
| `essenceCost` | 0 | `SCRY_ESSENCE_COST` (5) |
| `available` check | `tier >= 1` | `tier >= 1 AND canAfford AND !alreadyScried AND !inCourt AND concurrentCount < MAX` |
| Click behavior | Opens ScryOverlay (Divine Court) | Creates scrying edge, shows confirmation, agent appears in Scry sidebar |
| `description` | "Observe agent psyche and situation" | "Share this agent's sight for 30 ticks" |

The Divine Court overlay gets a new access point — a dedicated button in the top bar or sidebar header (design TBD, tracked separately).

## Engine Integration

### Tick Processing

During `runTick`:

1. **Collect active scry edges** — query graph for all edges of type `'scrying'` from the ascendant
2. **Expire stale scrys** — for each edge where `currentTick >= expiryTick`, remove edge, emit `ScryExpiredTrace`
3. **Build LOS sources** — remaining active scry edges contribute LOS sources at their agent's current hex with range `SCRY_OBSERVATION_RANGE` (modifier-aware via `getModifiedValue`)
4. **Recalculate visibility** — existing `recalcVisibility` pipeline unchanged; it just receives the scry LOS sources alongside avatar and retinue sources

### New Engine Functions

```typescript
/** Initiate a scry on an agent. Returns the created edge or null if rejected. */
function initiateScry(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  currentTick: number,
  essencePool: EssencePool,
  primarySphere: SphereName
): { edge: ScryEdge; updatedPool: EssencePool } | { error: string };

/** Get all currently active scry targets for an ascendant. */
function getActiveScryTargets(
  graph: WorldGraph,
  ascendantId: string,
  currentTick: number
): Array<{ agentId: string; agentName: string; locationId: string; locationName: string; startTick: number; expiryTick: number; ticksRemaining: number }>;

/** Expire all scry edges that have passed their expiry tick. */
function expireStaleScryEdges(
  graph: WorldGraph,
  ascendantId: string,
  currentTick: number
): ScryExpiredTrace[];

/** Check if an agent is currently being scried by the ascendant. */
function isAgentScried(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  currentTick: number
): boolean;
```

### Delivery / Range Override

In `useAgentInteraction.ts`, when computing wheel slot availability:

```typescript
// If agent is being scried, override range to 'in_range' for all slots
const isScried = isAgentScried(graph, ascendantId, agentId, currentTick);
if (isScried) {
  slot.rangeStatus = 'in_range';
  slot.lockedReason = null; // clear any "out of range" lock
}
```

## Files Changed (Implementation Plan)

| File | Change |
|---|---|
| `src/types/scry.ts` | Add `ScryEdge` interface. Rename `ScryState` → `CourtState` (or alias). Add scry constants. |
| `src/types/visibility.ts` | Rename `SCRY_SIGHT_RANGE` → `COURT_AGENT_SIGHT_RANGE`. Add `SCRY_OBSERVATION_RANGE = 2`. |
| `src/engine/scry.ts` | Add `initiateScry`, `getActiveScryTargets`, `expireStaleScryEdges`, `isAgentScried`. Keep court functions. |
| `src/engine/visibility.ts` | `collectLOSSources` reads both court positions (permanent) and scry edges (temporary) as LOS sources. |
| `src/engine/wheel.ts` | Update scry slot: add essence cost, availability checks for concurrent limit / already scried / in court. Update description. |
| `src/engine/orchestrator.ts` | Call `expireStaleScryEdges` at start of tick. Pass scry LOS sources to visibility recalc. |
| `src/components/Game/hooks/useAgentInteraction.ts` | Scry slot click → call `initiateScry` instead of `onOpenScry()`. Override range for scried agents. |
| `src/components/Game/ScryPanel.tsx` | **New file.** Sidebar panel showing active scrys with duration bars. |
| `src/components/Game/RetinuePanel.tsx` | No change to retinue logic. Retinue stays as-is (tier >= 1 agents). |
| `src/components/Game/GameView.tsx` | Add `ScryPanel` to right sidebar above/below RetinuePanel. Add Court button to top bar. Remove `scryVisible` → `courtVisible`. |
| `src/components/Game/ScryOverlay.tsx` | Rename to `CourtOverlay.tsx`. Update all internal references. |
| `src/components/Game/ScryContext.tsx` | Rename to `CourtContext.tsx`. |
| `src/components/Game/hooks/useScry.ts` | Rename to `useCourt.ts`. |
| Tests | New: `scry-observation.test.ts` (initiate, expire, concurrent limit, range override). Update existing court tests for renames. |

## Rejected Alternatives

- **Scry costs essence per tick (ongoing drain):** Rejected — harder to budget, creates analysis paralysis. One-time cost is simpler and more predictable. The player already faces a strategic tradeoff (limited slots + expiry).
- **Scry is free (no essence cost):** Rejected — without cost, scry becomes a no-brainer on every agent. Cost creates meaningful decisions about who to observe.
- **Scry gives full map vision (not agent-centered):** Rejected — agent-centered vision is thematically stronger (seeing through their eyes) and creates spatial gameplay (agent's path matters).
- **Scry pauses when agent is stationary:** Rejected — adds complexity for marginal benefit. Duration is simple and predictable.
- **Scried agents automatically join retinue:** Rejected — scry is observation, not allegiance. The two systems must remain orthogonal.
- **Unlimited concurrent scrys:** Rejected — without a limit, the player can observe everything at once, trivializing fog of war. The cap creates prioritization decisions.

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — Duration, cost, max concurrent, range, cooldown, and min tier are all named constants. |
| 2 | Inspectability | PASS — Three trace types cover initiation, expiry, and action-at-distance. Scry edges are queryable graph state. |
| 3 | Determinism | PASS — No randomness. Scry is a deterministic player action with tick-based expiry. |
| 4 | Fail-soft | PASS — Six failure cases covered with graceful fallbacks. No crash paths. |
| 5 | Narrative | PASS — "Seeing through a mortal's eyes" is thematically rich. Duration bar creates urgency. Separation from Court gives each system its own fantasy identity. |
| 6 | Additive | PASS — New graph edge type, new sidebar panel, new engine functions. Court system unchanged except entry point relocation. |
| 7 | Performance | PASS — Active scrys capped at 3. LOS recalc adds at most 3 additional sources to existing pipeline. Scry edge expiry is O(n) where n <= 3. |
