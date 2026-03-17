# Generalized Action Targeting — Design Doc

**Date:** 2026-03-17
**Status:** Design complete, pending implementation
**Brainstorm notes:** Obsidian → [[Generalized Action Targeting]]

## Problem

The action system currently only offers player actions when an agent is selected. The entire pipeline — from `getAgentWheelSlots()` to `useAgentInteraction` to `ActionDrawer` — assumes the target is always an agent with an Influence Tier.

But the underlying `UnifiedActionTemplate` already carries a generic `targetId`, and the world model is rich with interactable node types (locations with 20+ subtypes, attachments with 6 categories, sublocations with divine purpose hooks, hexes with 42 terrain types) that have zero player-facing actions. The data model is ready; the UI wiring is the bottleneck.

We need a **generalized action targeting system** where any graph node the player focuses on in a detail view becomes an action target, and the ActionDrawer populates with contextually-filtered actions for that target.

## Design Decisions

### Decision 1: TargetContext as the Universal Selection Descriptor

**Chosen:** Introduce a `TargetContext` interface that describes any focused graph node. All action filtering flows through this single type.

**Why:** The current system has two implicit contexts: "agent selected" (WheelSlot path) and "agent at location" (CRUD candidate path). These can't express "the player is looking at a sword" or "the player zoomed into a hex." A single TargetContext replaces both, and every detail view constructs one from whatever node it's displaying.

**Implication:** `getAgentWheelSlots` becomes a special case of a more general `getTargetActionSlots`. The agent-specific logic (Influence Tier gating, intervention types) is preserved but only activates when `targetContext.nodeType === 'actor'`.

### Decision 2: Template Declares Target Compatibility

**Chosen:** Add `targetCategories` and `targetSubtypes` fields to `UnifiedActionTemplate`. Templates that omit these fields default to current behavior (agent-targeting with location subtype filtering).

**Why not infer target type from template properties?** Explicit declaration is inspectable and traceable. A template that says `targetCategories: ['location', 'actor']` is immediately clear about what it works on. Inference from reach/scale would be fragile and invisible.

**Migration:** Existing templates get `targetCategories: ['actor']` added, and `locationSubtypes` is preserved as-is (it filters the actor's *location*, not the target itself). New non-agent templates use `targetSubtypes` to filter on the target node's own subtype.

### Decision 3: Detail View Triggers, Not Map Click

**Chosen:** The ActionDrawer appears when the player is in a detail view (HexZoom, LocationView, AgentDetail, attachment detail, sublocation detail), not on initial click/selection on the map.

**Why:** Matches god-game pacing — focusing divine attention is a deliberate gesture. Prevents UI clutter from every map click spawning a drawer. The detail view is the player saying "I'm engaging with this thing," which is exactly when to offer choices.

**Implication:** Each detail view component constructs a TargetContext and passes it to a hook that feeds the ActionDrawer.

### Decision 4: ActionDrawer Is Target-Agnostic

**Chosen:** The `ActionDrawer` and `ActionCard` components require zero changes. They already render an array of `WheelSlot[]` with no assumption about what generated them.

**Why:** The drawer's contract is: "given slots, render cards." The slots carry their own labels, costs, lock reasons, and sphere colors. Whether they came from agent interventions or hex blessings is invisible to the component.

**Implication:** The `ActionDrawerProps` interface needs one small change: rename `agentName`/`agentTier` to `targetName`/`targetLabel` (or make them generic). Everything else stays.

### Decision 5: One Unified Template Pool

**Chosen:** All action templates — agent-targeting, location-targeting, hex-targeting, attachment-targeting — live in the existing `UNIFIED_ACTION_TEMPLATES` array. No separate per-category template collections.

**Why:** Single source of truth. Cross-cutting actions (e.g., "Scry" targeting agents, locations, or hexes) are one template with multiple `targetCategories`, not three duplicated templates. This matches the existing content package pattern.

### Decision 6: No Cross-Target Contestation (For Now)

**Chosen:** Contestation stays same-target only. An action corrupting a hex and an action fortifying a location on that hex do not contest each other.

**Why:** Clean, predictable, and traceable. Cross-target contestation (via graph adjacency matching) is architecturally possible later but adds significant complexity to the resolution pipeline. Ship without it; add when players need it.

## Architecture

### TargetContext Interface

```typescript
// src/types/targetContext.ts

import type { NodeType } from './graph';
import type { SphereName } from './index';
import type { HexPosition } from '../engine/delivery';

/**
 * Describes the currently-focused graph node for action filtering.
 * Constructed by each detail view from whatever node it displays.
 */
export interface TargetContext {
  /** The graph node ID of the target */
  readonly nodeId: string;
  /** The node's type (actor, location, artifact, etc.) */
  readonly nodeType: NodeType;
  /** Display name for drawer header */
  readonly displayName: string;
  /** Short label for drawer header (e.g., tier name, location subtype, item tier) */
  readonly displayLabel: string;
  /** Node subtype (actorType, locationSubtype, attachment subcategory, terrain type) */
  readonly subtype: string | null;
  /** Trait IDs present on this node (via has_trait edges) */
  readonly traitIds: readonly string[];
  /** Sphere affinity of the target (if any) */
  readonly sphereAffinity: SphereName | null;
  /** Hex position of the target (for range calculations) */
  readonly position: HexPosition | null;
  /** For actor targets: Influence Tier (enables legacy intervention path) */
  readonly influenceTier?: number;
  /** Arbitrary properties from the node, for advanced filtering */
  readonly properties: Readonly<Record<string, unknown>>;
}

/** Categories a template can declare it targets */
export type TargetCategory = 'actor' | 'location' | 'sublocation' | 'hex'
  | 'artifact' | 'artifact_legendary' | 'resource';
```

| Constant | Default | Purpose |
|----------|---------|---------|
| — | — | No new numeric constants; this is a structural change |

**Tracing:** `TargetContext` is a read-only descriptor; no traces emitted at construction. Traces fire during slot generation (see below).

**Fail-soft:** If a detail view can't find the node in the graph (stale reference), it returns `null` for the context and the drawer stays closed.

**PRNG:** Not applicable at this layer.

### Template Extensions

```typescript
// Additions to UnifiedActionTemplate (src/types/unifiedAction.ts)

export interface UnifiedActionTemplate {
  // ... existing fields ...

  // ── New: Target filtering ──────────────────────────────────────

  /**
   * Which node categories this template can target.
   * Omit or empty → defaults to ['actor'] for backward compatibility.
   */
  readonly targetCategories?: readonly TargetCategory[];

  /**
   * Subtypes of the target node this template applies to.
   * Checked against TargetContext.subtype.
   * Omit or empty → no subtype restriction.
   */
  readonly targetSubtypes?: readonly string[];

  /**
   * Trait IDs that must be present on the target node.
   * All listed traits must be present (AND logic).
   * Omit or empty → no trait restriction.
   */
  readonly requiredTargetTraits?: readonly string[];
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `DEFAULT_TARGET_CATEGORIES` | `['actor']` | Backward compatibility for templates without `targetCategories` |

**Tracing:** No new trace type; template metadata is already logged in action creation traces.

**Fail-soft:** Missing `targetCategories` → default to `['actor']`. Missing `targetSubtypes` → no subtype filter. Missing `requiredTargetTraits` → no trait filter. All additive; existing templates unchanged.

**PRNG:** Not applicable.

### getTargetActionSlots() — The Core Function

```typescript
// src/engine/targetActions.ts

import type { TargetContext, TargetCategory } from '../types/targetContext';
import type { WheelSlot } from './wheel';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type { HexPosition } from './delivery';

/**
 * Constants for target action slot generation.
 */
export const TARGET_ACTION_CONSTANTS = {
  /** Default target categories when template omits the field */
  DEFAULT_TARGET_CATEGORIES: ['actor'] as readonly TargetCategory[],
  /** Maximum slots returned (prevents UI overflow) */
  MAX_SLOTS: 20,
  /** Slot ID prefix for non-intervention actions */
  SLOT_ID_PREFIX: 'target_action_',
} as const;

export interface TargetActionParams {
  /** The focused target */
  target: TargetContext;
  /** All available templates */
  templates: readonly UnifiedActionTemplate[];
  /** Player's essence pool */
  pool: EssencePool;
  /** Player's primary sphere */
  primarySphere: SphereName;
  /** Avatar position (for range gating) */
  avatarPos?: HexPosition;
  /** Player's available sphere access (for sphere gating) */
  accessibleSpheres: readonly SphereName[];
}

/**
 * Generate WheelSlot[] for any target node.
 *
 * Filtering cascade:
 * 1. Node-type gate: template.targetCategories includes target.nodeType
 * 2. Subtype gate: template.targetSubtypes includes target.subtype (if specified)
 * 3. Trait gate: all template.requiredTargetTraits present in target.traitIds
 * 4. Sphere gate: template.sphereAffinity is null OR in accessibleSpheres
 * 5. Essence gate: player can afford template.essenceCost
 * 6. Range gate: target in range from avatar (if positions available)
 *
 * For actor targets with influenceTier, also runs the legacy intervention
 * path (getAgentWheelSlots) and merges results, so agent interactions
 * get both intervention slots AND any new target-based action slots.
 *
 * Emits: TargetActionFilterTrace per call (NFP #2).
 */
export function getTargetActionSlots(params: TargetActionParams): WheelSlot[] {
  // Implementation by Claude Code
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `DEFAULT_TARGET_CATEGORIES` | `['actor']` | Backward compat for templates without `targetCategories` |
| `MAX_SLOTS` | `20` | Prevents UI overflow in the drawer |
| `SLOT_ID_PREFIX` | `'target_action_'` | Distinguishes non-intervention slots from legacy intervention slots |

**Tracing:**

```typescript
// New trace type in src/types/trace.ts

export interface TargetActionFilterTrace {
  readonly category: 'action';
  readonly type: 'target_action_filter';
  readonly tick: number;
  readonly targetNodeId: string;
  readonly targetNodeType: string;
  readonly targetSubtype: string | null;
  readonly templatesConsidered: number;
  readonly filteredByNodeType: number;
  readonly filteredBySubtype: number;
  readonly filteredByTraits: number;
  readonly filteredBySphere: number;
  readonly filteredByEssence: number;
  readonly filteredByRange: number;
  readonly slotsGenerated: number;
}
```

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| `target` is null | Return empty array, no crash |
| Template has no `targetCategories` | Default to `['actor']` |
| Template has unknown `targetCategory` value | Skip template, log warning |
| `target.nodeType` doesn't match any NodeType | Return empty array |
| `target.traitIds` is empty but template requires traits | Skip template (correct behavior) |
| Zero templates pass all filters | Return empty array (drawer shows nothing — acceptable) |
| `accessibleSpheres` is empty | Only sphere-neutral actions pass |

**PRNG:** Not needed — this is deterministic filtering with no randomness.

### useTargetActions Hook

```typescript
// src/components/Game/hooks/useTargetActions.ts

import { useMemo } from 'react';
import type { TargetContext } from '../../../types/targetContext';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { WheelSlot } from '../../../engine/wheel';
import { getTargetActionSlots } from '../../../engine/targetActions';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

interface UseTargetActionsParams {
  target: TargetContext | null;
  gameState: GameState;
  archetype: AscendantArchetype;
  drawerOpen: boolean;
}

/**
 * Hook that computes WheelSlot[] for any target context.
 *
 * Replaces the inline useMemo in useAgentInteraction that called
 * getAgentWheelSlots. Can be used by ANY detail view.
 *
 * For actor targets, merges legacy intervention slots with new
 * target-based action slots.
 */
export function useTargetActions({
  target,
  gameState,
  archetype,
  drawerOpen,
}: UseTargetActionsParams): WheelSlot[] | null {
  return useMemo(() => {
    if (!target || !drawerOpen) return null;

    return getTargetActionSlots({
      target,
      templates: UNIFIED_ACTION_TEMPLATES,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
      avatarPos: undefined, // TODO: wire from avatar position
      accessibleSpheres: [archetype.sphereAlignment.primary],
    });
  }, [target, drawerOpen, gameState.essencePool, archetype]);
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| — | — | Hooks have no magic numbers |

**Tracing:** Delegates to `getTargetActionSlots` which emits the `TargetActionFilterTrace`.

**Fail-soft:** Returns `null` when target is null or drawer is closed. The ActionDrawer already handles null slots by not rendering.

**PRNG:** Not applicable.

### ActionDrawer Props Update

```typescript
// Minimal change to ActionDrawerProps

export interface ActionDrawerProps {
  open: boolean;
  slots: WheelSlot[];
  targetName: string;     // was: agentName
  targetLabel: string;    // was: agentTier (now generic: "Tier 2 Agent" / "Fortified Keep" / "Iron Sword")
  onSlotClick: (slotId: string) => void;
  onClose: () => void;
  playingCardId?: string | null;
}
```

This is a rename, not a restructure. Update all call sites (only `useAgentInteraction` currently).

### TargetContext Builders — One Per Detail View

Each detail view needs a small factory function or inline construction:

```typescript
// Example: buildHexTargetContext (in HexZoomView or a shared builder)
function buildHexTargetContext(hex: HexTile, graph: WorldGraph): TargetContext {
  return {
    nodeId: `hex_${hex.coord.q}_${hex.coord.r}`,
    nodeType: 'location',  // hexes are location-type nodes
    displayName: `Hex (${hex.coord.q}, ${hex.coord.r})`,
    displayLabel: hex.terrain,
    subtype: hex.terrain,
    traitIds: [],  // hexes don't have traits yet
    sphereAffinity: null,
    position: { q: hex.coord.q, r: hex.coord.r },
    properties: { ...hex.geoParams, terrain: hex.terrain, hasRiver: hex.hasRiver },
  };
}

// Example: buildLocationTargetContext
function buildLocationTargetContext(nodeId: string, graph: WorldGraph): TargetContext {
  const node = graph.getNode(nodeId);
  if (!node) return null; // fail-soft
  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  return {
    nodeId,
    nodeType: 'location',
    displayName: node.name,
    displayLabel: (node.properties.locationSubtype as string) ?? 'unknown',
    subtype: (node.properties.locationSubtype ?? node.properties.locationType) as string | null,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null, // TODO: derive from hex coord
    properties: node.properties,
  };
}

// Example: buildAttachmentTargetContext
function buildAttachmentTargetContext(nodeId: string, graph: WorldGraph): TargetContext {
  const node = graph.getNode(nodeId);
  if (!node) return null;
  return {
    nodeId,
    nodeType: node.type, // 'artifact' or 'artifact_legendary'
    displayName: node.name,
    displayLabel: `Tier ${node.properties.tier ?? '?'}`,
    subtype: (node.properties.subcategory as string) ?? null,
    traitIds: graph.getOutgoingEdges(nodeId, 'has_trait').map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    properties: node.properties,
  };
}
```

| Constant | Default | Purpose |
|----------|---------|---------|
| — | — | Context builders are pure data transforms with no magic numbers |

**Tracing:** No traces from builders; they are pure functions.

**Fail-soft:** All builders return `null` if the node is missing from the graph. The hook propagates `null` to the drawer, which stays closed.

**PRNG:** Not applicable.

### Slot Execution — The Intervention vs. Template Action Split

When the player clicks a slot, the execution path depends on the slot type:

1. **Legacy intervention slots** (type: `'intervention'` or `'observation'`): Route through existing `handleWheelSlotClick` → agenda picker → `executeIntervention` → `applyInterventionEffects`. Unchanged.

2. **New target action slots** (type: `'target_action'`): Route through a new handler:
   - Look up the `UnifiedActionTemplate` by slot ID
   - Create a `UnifiedAction` via `createUnifiedAction` with `source: 'player'`
   - Deduct essence if `essenceCost > 0`
   - Add to `gameState.unifiedActions`
   - The normal tick resolution pipeline resolves it

This means new target actions use the **existing resolution engine** — no new resolution code needed. They're just player-sourced `UnifiedAction` instances that the tick loop already knows how to progress, resolve, and apply GraphOps for.

```typescript
// New WheelSlot type value
export type SlotType = 'observation' | 'intervention' | 'info' | 'target_action';
```

| Constant | Default | Purpose |
|----------|---------|---------|
| `PLAYER_ACTION_FEEDBACK_DELAY_MS` | `1200` | Time to show "playing" animation before closing drawer |

**Tracing:** Action creation already emits `UnifiedActionCreatedTrace`. No new trace type needed.

**Fail-soft:**

| Failure case | Fallback behavior |
|-------------|-------------------|
| Template not found by slot ID | Log warning, no-op |
| Essence deduction goes below 0 | Clamp to 0 (defensive) |
| `createUnifiedAction` throws | Catch, log, no-op — drawer stays open |

**PRNG:** Uses `mulberry32(seed + tick * 43)` for step duration rolls, same as existing divine action creation.

## Implementation Plan

### Phase 1: Core Architecture (no visible change yet)

**Files to create:**
1. `src/types/targetContext.ts` — `TargetContext` interface, `TargetCategory` type
2. `src/engine/targetActions.ts` — `getTargetActionSlots()` function with filtering cascade
3. `src/components/Game/hooks/useTargetActions.ts` — React hook wrapping `getTargetActionSlots`

**Files to modify:**
4. `src/types/unifiedAction.ts` — add `targetCategories`, `targetSubtypes`, `requiredTargetTraits` to `UnifiedActionTemplate`
5. `src/engine/wheel.ts` — add `'target_action'` to `SlotType` (or extend WheelSlot type)
6. `src/types/trace.ts` — add `TargetActionFilterTrace` to trace type union
7. `src/data/unified-action-templates.ts` — add `targetCategories: ['actor']` to all existing templates (bulk, backward compat)

**Tests:**
8. `src/engine/__tests__/targetActions.test.ts` — filter cascade tests (node type, subtype, traits, sphere, essence, range), backward compat (templates without `targetCategories` default to actor), empty result case, MAX_SLOTS cap
9. `src/components/Game/hooks/__tests__/useTargetActions.test.ts` — hook returns null when no target, returns slots when target provided

### Phase 2: Wire into Agent Path (regression-safe swap)

**Files to modify:**
10. `src/components/Game/ActionDrawer.tsx` — rename `agentName`→`targetName`, `agentTier`→`targetLabel` in props
11. `src/components/Game/hooks/useAgentInteraction.ts` — replace inline `wheelSlots` useMemo with `useTargetActions` hook, construct TargetContext from selected agent
12. Update all `ActionDrawer` render call sites to use new prop names

**Tests:**
13. Update `ActionDrawer.test.tsx` for renamed props
14. Run full test suite — zero regressions expected

### Phase 3: Wire into Non-Agent Detail Views

**Files to modify (one per view):**
15. `HexZoomView` — add `buildHexTargetContext`, `useTargetActions`, render ActionDrawer
16. `LocationView` — add `buildLocationTargetContext`, `useTargetActions`, render ActionDrawer
17. Sublocation detail (if component exists) — same pattern
18. Attachment detail (if component exists) — same pattern

**Shared helper:**
19. `src/engine/targetContextBuilders.ts` — all `build*TargetContext` functions in one file

**Tests:**
20. `src/engine/__tests__/targetContextBuilders.test.ts` — builder tests (null node, missing properties, trait collection)

### Phase 4: First Content Templates

**Files to modify:**
21. `src/data/unified-action-templates.ts` — add location action templates (Ward, Place of Power, Incite Unrest, Fortify) with `targetCategories: ['location']`
22. Same file — add attachment action templates (Enchant, Shatter, Attune, Nullify, Curse) with `targetCategories: ['artifact']`
23. Same file — add sublocation action templates (Sanctify, Trap, Vision) with `targetCategories: ['sublocation']` (sublocation nodes are location-type with subtype)

**Content for each template:**
- id, name, reach, crudType, scale, steps, apCost, essenceCost
- targetCategories, targetSubtypes, requiredTargetTraits
- motivations, narrativeTemplates
- GraphOps for onSuccess/onFailure

**Tests:**
24. Content validation tests — template IDs unique, required fields present, GraphOps reference valid op types

### Phase 5: Slot Execution for Target Actions

**Files to modify:**
25. `src/components/Game/hooks/useAgentInteraction.ts` (or a new `useTargetActionExecution` hook) — handle `target_action` slot clicks: template lookup → `createUnifiedAction` → essence deduction → gameState update
26. Wire the same execution handler into non-agent detail views

**Tests:**
27. Execution tests — action created with correct targetId, essence deducted, gameState updated

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | PASS | All constants named: MAX_SLOTS, SLOT_ID_PREFIX, DEFAULT_TARGET_CATEGORIES, PLAYER_ACTION_FEEDBACK_DELAY_MS. Template filtering is entirely data-driven — adding new target types = adding templates, not code. |
| 2 | Inspectability | PASS | TargetActionFilterTrace emitted per slot generation call, showing exactly how many templates were filtered at each cascade step. Slot lock reasons carry human-readable strings. |
| 3 | Determinism | PASS | Filtering is pure function of inputs (no randomness). Action creation uses existing seeded PRNG path. Same target + same templates + same state = same slots. |
| 4 | Fail-soft | PASS | Every builder returns null for missing nodes. Every filter defaults to permissive on missing fields. Zero thrown exceptions in the hot path. Empty slot arrays are valid (drawer shows nothing). |
| 5 | Narrative > mechanical | PASS | Detail-view trigger matches god-game pacing. Actions described with narrative templates, not mechanical labels. |
| 6 | Additive > destructive | PASS | Three new fields added to UnifiedActionTemplate (all optional). Two new files created. ActionDrawer prop rename is the only breaking change (trivial). No existing logic removed. |
| 7 | Performance budget | PASS | Filtering runs O(n) over templates, once per detail-view focus (not per tick). MAX_SLOTS caps output. No per-tick cost. |
