# Intent Visibility — Agent Model & Character Sheet

**Date:** 2026-03-17
**Status:** Ready for implementation
**Scope:** Data layer extension + 3 UI touch-points

## Goal

Surface agent intent (active ambitions, priorities, milestone progress) in the character sheet UI. For the prototype: always visible. Design supports knowledge-gated reveal for the mature game.

## Background

Agents already pursue ambitions via `pursues` edges (directed graph edges from actor → ambition node). Each carries `priority` (primary/secondary), `status`, `completedMilestones[]`, and timestamps. The ambition templates define categories, milestones, reach affinities, and prose. The action selection pipeline already boosts candidates based on active ambitions (0.6× primary, 0.2× secondary).

None of this is currently visible to the player.

## Design

### What to show per active ambition

| Element | Example | Notes |
|---------|---------|-------|
| Ambition name | "Dominate Regional Trade" | Template `displayName` |
| Category glyph + label | ⚔ dominion | 7 categories, each with icon + color |
| Priority badge | `Primary` / `Secondary` | Subtle tag |
| Milestone pips | ●●○ | Filled/empty, count = template required milestones |
| Milestone prose (hover) | "Secured river trade monopoly" | Only at transparent tier in mature game |
| Reach affinity dots | Gold · Eye | Small tinted domain dots from template `reachAffinity` |
| Reactive trigger | "Triggered by: betrayal" | Only for reactive templates (4 of 14) |

### Category → color mapping

Reuse existing domain palette:

| Category | Color source | Hex (approx) |
|----------|-------------|---------------|
| dominion | Iron | `#8b4513` warm brown-red |
| mastery | Veil | `#7b68ee` medium purple |
| vengeance | Shadow | `#2f2f2f` dark charcoal |
| legacy | Gold | `#daa520` amber |
| survival | Stone | `#808080` grey |
| discovery | Eye | `#20b2aa` teal |
| devotion | Star | `#f0e68c` pale gold-white |

### UI placement

#### AgentProfileModal (full character sheet)

New **"Intent"** section between "Nature" (values) and "Prowess" (domains).

Renders 0–2 ambition cards (primary first, secondary below). Each card:
- Inset container with left border tinted to category color
- Category glyph + name on first line
- Priority badge right-aligned on first line
- Milestone pips row below
- Reach affinity dots below pips
- Reactive trigger tag (if applicable) below affinities

When no ambitions are active: show "No discernible intent" placeholder in muted text.

#### AgentDetailPanel (sidebar)

Same full Intent section as the modal. Place it between the Character (values) section and the Domain Grid.

#### AgentInfoCard (compact hover card)

Single line below archetype/faction:
```
⚔ Conquer Territory
```
Primary ambition only. Category glyph + ambition name. No milestones, no secondary.

When no ambitions: omit the line entirely (don't waste compact card space).

### Knowledge gating

**Prototype:** Always visible (all tiers see everything). Implement with a `PROTOTYPE_INTENT_VISIBLE = true` flag so gating can be toggled on later.

**Mature game design** (implement gating later, but structure data flow to support it):

| Familiarity tier | Visible |
|---|---|
| stranger | Nothing |
| recognised | Category only ("driven by vengeance") |
| known | Primary ambition name + category |
| intimate | Both ambitions, milestones, affinities, triggers |
| transparent | Everything + milestone prose on hover |

**Divine influence bypass:** Agents with `worships` edge to player's ascendant at tier ≥ 2 → treat as `intimate` for intent visibility regardless of familiarity score. (Implement with gating, not in prototype.)

## Implementation

### Step 1 — Extend types

**File:** `src/types/agentDetail.ts` (or wherever `AgentDetail` / `AgentInfoCardData` live)

Add to `AgentDetail`:
```typescript
interface ActiveIntent {
  templateId: string;
  displayName: string;
  category: AmbitionCategory; // 'dominion' | 'mastery' | 'vengeance' | 'legacy' | 'survival' | 'discovery' | 'devotion'
  priority: 'primary' | 'secondary';
  completedMilestones: number;
  requiredMilestones: number;
  milestoneDescriptions?: string[]; // prose for completed milestones (gated)
  reachAffinity: Partial<Record<ReachDomain, number>>;
  reactiveTrigger?: string; // e.g. 'betrayal', 'loss_of_home'
}
```

Add field:
```typescript
intents?: ActiveIntent[];  // 0–2 items, primary first
```

Add to `AgentInfoCardData`:
```typescript
primaryIntentSummary?: { displayName: string; category: AmbitionCategory };
```

### Step 2 — Extend data aggregation

**File:** `src/engine/agentDetail.ts`

In `getAgentFullProfile()` and `getAgentInfoCard()`:

1. Query `pursues` edges from agent node where `status === 'active'`
2. For each, resolve the ambition template by `templateId`
3. Build `ActiveIntent` objects
4. Sort: primary first, then secondary
5. Attach to result as `intents` (full profile) or `primaryIntentSummary` (info card)

For the prototype, skip knowledge gating — populate unconditionally. Add a `// TODO: gate by familiarity tier` comment at the filtering point.

### Step 3 — Build IntentSection component

**File:** `src/components/Game/IntentSection.tsx` (new)

Props: `{ intents: ActiveIntent[] }`

Renders:
- Section header "Intent" with the same styling as other modal sections
- For each intent: a card with category color border, name, priority badge, milestone pips, affinity dots, reactive tag
- Empty state: "No discernible intent" in muted text

Use the existing section header pattern from AgentProfileModal (look at how "Nature", "Prowess", "Bonds" sections are structured).

### Step 4 — Integrate into AgentProfileModal

**File:** `src/components/Game/AgentProfileModal.tsx`

- Import IntentSection
- Place `<IntentSection intents={profile.intents} />` between the Nature and Prowess sections
- Gate rendering on `profile.intents` being defined (always true in prototype)

### Step 5 — Integrate into AgentDetailPanel

**File:** `src/components/Game/AgentDetailPanel.tsx`

- Same IntentSection component, placed between Character and Domain Grid sections

### Step 6 — Add intent line to AgentInfoCard

**File:** `src/components/Game/AgentInfoCard.tsx`

- If `data.primaryIntentSummary` exists, render a single line:
  `{categoryGlyph} {displayName}`
- Use the category color for the glyph
- Place below archetype/faction line

### Step 7 — Category glyph map

Create a small lookup (could be in IntentSection or a shared constants file):

```typescript
const CATEGORY_GLYPHS: Record<AmbitionCategory, string> = {
  dominion: '👑',   // or use a more thematic unicode/svg
  mastery: '⚗',
  vengeance: '⚔',
  legacy: '🏛',
  survival: '🛡',
  discovery: '🔍',
  devotion: '✦',
};
```

Prefer SVG icons or unicode symbols that match the Threadbare aesthetic over emoji. The exact glyphs should be tuned during implementation.

### Step 8 — Tests

- Unit test for `ActiveIntent` construction from pursues edges + templates
- Test that primary sorts before secondary
- Test empty state (no active ambitions → empty array)
- Test reactive trigger population
- Snapshot or render test for IntentSection with 0, 1, and 2 intents
- Test milestone count accuracy against template `requiredMilestones`

## Files touched

| File | Change |
|------|--------|
| `src/types/agentDetail.ts` (or equivalent) | Add `ActiveIntent` type, extend `AgentDetail`, `AgentInfoCardData` |
| `src/engine/agentDetail.ts` | Extend aggregation functions |
| `src/components/Game/IntentSection.tsx` | New component |
| `src/components/Game/AgentProfileModal.tsx` | Add IntentSection |
| `src/components/Game/AgentDetailPanel.tsx` | Add IntentSection |
| `src/components/Game/AgentInfoCard.tsx` | Add primary intent line |
| `src/data/ambition-categories.ts` (or constants) | Category glyph + color map |
| Tests for all above | New test files |

## Notification integration (this PR)

The ambition lifecycle already emits `ambition_assigned`, `ambition_milestone`, `ambition_completed`, and `ambition_abandoned` tick events. These already route through `notificationRouter` into toasts/alerts, and through `filterEventsByVisibility()` for LOS gating. Three additions connect notifications to the new intent display:

### Step 9 — Add `actorId` to ambition tick events

**File:** `src/engine/ambitionTick.ts`

Currently, ambition events carry `message` and `notification` but no actor reference. Add `actorId: string` to `TickEvent` (optional field on the existing type). Populate it for all four ambition event types. This enables click-to-select on notifications.

**File:** `src/types/gameState.ts`

Add optional `actorId?: string` to the `TickEvent` interface.

### Step 10 — Wire notification tap-through to agent selection

**Files:** `src/components/Game/ToastStack.tsx`, `src/components/Game/AlertBar.tsx`

When a toast or alert carries `actorId`:
- Render it as clickable (cursor pointer, subtle hover highlight)
- On click: call the existing `onSelectAgent(actorId)` callback to highlight the agent dot on the hex map
- Optional: if the character sheet sidebar is open, it navigates to that agent

This is a general-purpose improvement — it works for any event with `actorId`, not just ambition events (movement, encounters, death events could use it later too).

### Step 11 — Intent-change pulse animation on character sheet

**File:** `src/components/Game/IntentSection.tsx`

When the `intents` prop changes between renders (new ambition, milestone progress, removal):
- Identify which ambition card changed via `templateId` comparison
- Apply a brief CSS pulse animation (amber flash, ~600ms) on the changed card
- Use a `useEffect` + `usePrevious` pattern to detect the diff

This gives the player a visual cue when they're looking at a sheet and something shifts — a milestone pip fills, or an ambition disappears.

### Step 12 — Tune notification channels

Current routing vs. proposed:

| Event | Current channel | Proposed channel | Rationale |
|-------|----------------|-----------------|-----------|
| `ambition_assigned` | toast | toast | Low urgency; new intent will appear on sheet |
| `ambition_milestone` | toast | toast | Progress marker, informational |
| `ambition_completed` | alert (discovery ◎) | alert (discovery ◎) | Significant, keep as-is |
| `ambition_abandoned` | toast | **alert** (use ⚖ dilemma glyph) | Promote: abandonment is a major narrative beat; agent behavior shifts |

**File:** `src/engine/ambitionTick.ts` — Change the `ambition_abandoned` notification from `{ channel: 'toast' }` to `{ channel: 'alert', icon: 'dilemma' }`.

### Step 13 — Tests for notification integration

- Test that ambition tick events include `actorId`
- Test that `ambition_abandoned` now routes to alert channel
- Test that ToastStack/AlertBar render clickable when `actorId` present
- Test IntentSection pulse animation triggers on prop change (snapshot or className check)

### Files touched (notification additions)

| File | Change |
|------|--------|
| `src/types/gameState.ts` | Add optional `actorId` to `TickEvent` |
| `src/engine/ambitionTick.ts` | Populate `actorId`, promote abandonment to alert |
| `src/components/Game/ToastStack.tsx` | Click handler for `actorId` events |
| `src/components/Game/AlertBar.tsx` | Click handler for `actorId` events |
| `src/components/Game/IntentSection.tsx` | Pulse animation on intent change |
| Tests for all above | New/extended test files |

## Future work (not this PR)

- Knowledge-gated reveal per familiarity tier
- Divine influence bypass for worshipped agents
- Eye sphere bonus: intent revealed 1 tier earlier
- Milestone prose hover tooltips (transparent tier only)
- Knowledge-gated notification filtering (ambition events hidden if intent is gated for that agent)
- Visual connection between intent affinity dots and domain grid (highlight matching domains)
- Intent change notifications in NarrativeLog with richer formatting (category color, milestone detail)
