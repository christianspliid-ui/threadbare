# Three-Tier Attention Model — Phase 6 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the attention tier system visible to the player through thread lines, activity icons, thread tugs, Read the Threads panel, and agent character sheet enhancements.

**Architecture:** New HexMapV2 layers for thread lines and activity icons, React components for Read the Threads panel and agent detail enhancements. All visual state driven by existing engine data (`activeThreadTugs`, `digestBuffer`, `effectiveTier`, attention pool on ascendant node).

**Tech Stack:** Three.js (HexMapV2 layers), React + TypeScript, CSS custom properties, existing UI primitives (Modal, SectionHeading, Button)

**Spec:** `Docs/plans/2026-04-05-attention-tier-model-design.md` (Sections 3, 5, 6, 7)

---

## File Structure Overview

**New files to create:**

| File | Responsibility |
|------|---------------|
| `src/components/HexMapV2/scene/ThreadLineMesh.ts` | Thread line rendering between avatar and agents |
| `src/components/HexMapV2/scene/ActivityIconMesh.ts` | Per-reach micro-icons on active agents |
| `src/components/Game/ReadTheThreadsPanel.tsx` | Read the Threads modal content — digest display grouped by reach |
| `src/components/Game/RecentActivityLog.tsx` | Agent detail panel subsection — recent digest entries |
| `src/components/Game/AttentionPoolIndicator.tsx` | Attention pool visual indicator for thread network aesthetic |
| `src/hooks/useLastViewedTick.ts` | Per-agent "last viewed" tracking for "new" indicators |

**Existing files to modify:**

| File | Changes |
|------|---------|
| `src/components/HexMapV2/scene/RenderLayers.ts` | Add THREADS and ACTIVITY_ICONS layers |
| `src/components/HexMapV2/HexMapV2.tsx` | Create and mount new layers, tick animations |
| `src/components/Game/AgentDetailPanel.tsx` | Add RecentActivityLog section, growth/new indicators |
| `src/components/Game/GameView.tsx` | Add Read the Threads button/modal, attend-tug click handler |

---

## Task 1: Render Layer Constants for New Layers

**Files:**
- Modify: `src/components/HexMapV2/scene/RenderLayers.ts`

- [ ] **Step 1: Add THREADS and ACTIVITY_ICONS to RENDER_ORDER and LAYER_Z**

Thread lines render below agents (connecting avatar to agent sprites). Activity icons render just above agents.

```typescript
// Add to RENDER_ORDER (between TRAILS and AGENTS):
THREADS:            9.5,   // Thread lines — below agent sprites, above trails

// Add to RENDER_ORDER (after BATTLE_INDICATORS):
ACTIVITY_ICONS:     10.9,  // Reach micro-icons — above battles, below events

// Add to LAYER_Z:
THREADS:            5.500,  // Below agents (6.000) — lines behind sprites
ACTIVITY_ICONS:     6.090,  // Above battles (6.080), below events (6.100)
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/HexMapV2/scene/RenderLayers.ts
git commit -m "feat(attention-ui): add THREADS and ACTIVITY_ICONS render layer constants"
```

---

## Task 2: Thread Line Mesh — Avatar-to-Agent Visual Connections

**Files:**
- Create: `src/components/HexMapV2/scene/ThreadLineMesh.ts`

The thread line layer draws lines from the avatar hex to each threaded agent's hex. Lines are coloured by court position and pulse based on attention pool state.

- [ ] **Step 1: Create ThreadLineMesh.ts**

```typescript
// src/components/HexMapV2/scene/ThreadLineMesh.ts

/**
 * ThreadLineMesh.ts — Three.js scene module for divine thread line rendering.
 *
 * Draws glowing lines from the avatar position to each threaded agent.
 * Line appearance reflects court position (colour) and attention pool state (opacity/blur).
 *
 * NFP #1: All colours, widths, and animation params are named constants.
 * NFP #4: Missing avatar or agent positions silently skip — never crash.
 */

import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';

// ── Constants ────────────────────────────────────────────────────────────────

/** Thread line colours by court position */
export const THREAD_COLORS: Record<string, string> = {
  the_first: '#d4a040',  // accent gold — protagonist thread
  retinue:   '#8b9dc3',  // soft blue-grey — inner circle
  watched:   '#5a6a7a',  // dim grey — distant observation
  dormant:   '#3a3a3a',  // near-invisible — slackened thread
};

/** Base opacity for thread lines (at full attention) */
export const THREAD_BASE_OPACITY = 0.6;

/** Minimum opacity for thread lines (when overwhelmed) */
export const THREAD_MIN_OPACITY = 0.15;

/** Line width (Three.js LineBasicMaterial, browser-dependent) */
export const THREAD_LINE_WIDTH = 1;

/** Pulse period for the_first thread (seconds) */
export const THREAD_PULSE_PERIOD_S = 3.0;

/** Pulse amplitude (added/subtracted from base opacity) */
export const THREAD_PULSE_AMPLITUDE = 0.15;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ThreadLineData {
  agentId: string;
  courtPosition: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface ThreadLineLayer {
  group: THREE.Group;
  /** Rebuild all lines from fresh data. Call when threads change (not every frame). */
  rebuild(threads: ThreadLineData[]): void;
  /** Per-frame tick: update opacity based on attention state and time. */
  tick(elapsedS: number, attentionRatio: number): void;
  dispose(): void;
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createThreadLineLayer(): ThreadLineLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.THREADS;

  const materials = new Map<string, THREE.LineBasicMaterial>();
  let lineRefs: Array<{ line: THREE.Line; courtPosition: string }> = [];

  function getMaterial(courtPosition: string): THREE.LineBasicMaterial {
    let mat = materials.get(courtPosition);
    if (!mat) {
      const color = THREAD_COLORS[courtPosition] ?? THREAD_COLORS.watched;
      mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: THREAD_BASE_OPACITY,
        linewidth: THREAD_LINE_WIDTH,
        depthTest: false,
      });
      materials.set(courtPosition, mat);
    }
    return mat;
  }

  function rebuild(threads: ThreadLineData[]): void {
    // Dispose existing
    for (const ref of lineRefs) {
      ref.line.geometry.dispose();
      group.remove(ref.line);
    }
    lineRefs = [];

    for (const t of threads) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(t.fromX, t.fromY, LAYER_Z.THREADS),
        new THREE.Vector3(t.toX, t.toY, LAYER_Z.THREADS),
      ]);
      const mat = getMaterial(t.courtPosition).clone();
      const line = new THREE.Line(geom, mat);
      line.renderOrder = RENDER_ORDER.THREADS;
      line.userData = { courtPosition: t.courtPosition, agentId: t.agentId };
      group.add(line);
      lineRefs.push({ line, courtPosition: t.courtPosition });
    }
  }

  function tick(elapsedS: number, attentionRatio: number): void {
    // Scale all opacities by attention ratio (focused=1.0, overwhelmed=0.15)
    const attentionScale = THREAD_MIN_OPACITY + (THREAD_BASE_OPACITY - THREAD_MIN_OPACITY) * Math.min(1, attentionRatio);

    for (const ref of lineRefs) {
      const mat = ref.line.material as THREE.LineBasicMaterial;
      let opacity = attentionScale;

      // The First gets a gentle pulse
      if (ref.courtPosition === 'the_first') {
        const pulse = Math.sin(elapsedS * (2 * Math.PI / THREAD_PULSE_PERIOD_S)) * THREAD_PULSE_AMPLITUDE;
        opacity = Math.max(THREAD_MIN_OPACITY, Math.min(1, opacity + pulse));
      }

      // Dormant threads are barely visible
      if (ref.courtPosition === 'dormant') {
        opacity *= 0.3;
      }

      mat.opacity = opacity;
    }
  }

  function dispose(): void {
    for (const ref of lineRefs) {
      ref.line.geometry.dispose();
      (ref.line.material as THREE.Material).dispose();
    }
    lineRefs = [];
    for (const mat of materials.values()) mat.dispose();
    materials.clear();
  }

  return { group, rebuild, tick, dispose };
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/HexMapV2/scene/ThreadLineMesh.ts
git commit -m "feat(attention-ui): create thread line mesh layer for avatar-to-agent connections"
```

---

## Task 3: Activity Icon Mesh — Per-Reach Micro-Icons on Active Agents

**Files:**
- Create: `src/components/HexMapV2/scene/ActivityIconMesh.ts`

Small reach-coloured sprites positioned near each agent that has an active encounter. Pulses gently.

- [ ] **Step 1: Create ActivityIconMesh.ts**

Follow the BattleIndicatorLayer pattern: canvas-rendered texture sprites per reach, positioned offset from agent dot.

Key specs from the design:
- Size: 6-8px world units (use `ACTIVITY_ICON_SIZE = 7` from attention-constants)
- Position: upper-right offset from agent world position (+3, +3 world units)
- Opacity by tier: background=0.4, shaping=0.6, story_beat=0.8
- Pulse: `ACTIVITY_ICON_PULSE_PERIOD = 1.75` seconds
- Zoom hide: disappear when hex size < `ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD = 15`px
- One icon per agent showing `reachPrimary` of current encounter

Reach colours (from spec Section 6):
```typescript
export const REACH_ICON_COLORS: Record<string, string> = {
  iron:   '#ff6b6b',
  stone:  '#d4a87a',
  eye:    '#ffe44d',
  gold:   '#33ff77',
  veil:   '#44aaff',
  heart:  '#cc66ff',
  star:   '#ffb355',
  shadow: '#8fd4c0',
};
```

Interface:
```typescript
export interface ActivityIconData {
  agentId: string;
  worldX: number;
  worldY: number;
  reachPrimary: string;
  tierOpacity: number; // 0.4, 0.6, or 0.8
}

export interface ActivityIconLayer {
  group: THREE.Group;
  rebuild(icons: ActivityIconData[]): void;
  tick(elapsedS: number): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}
```

Create a canvas texture per reach colour (8 textures, cached). Each icon is a THREE.Sprite. On rebuild, clear old sprites and create new ones from the data. On tick, pulse opacity.

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/HexMapV2/scene/ActivityIconMesh.ts
git commit -m "feat(attention-ui): create activity icon mesh layer for per-reach agent indicators"
```

---

## Task 4: Mount Thread Lines and Activity Icons in HexMapV2

**Files:**
- Modify: `src/components/HexMapV2/HexMapV2.tsx`

Wire both new layers into the renderer lifecycle: create on mount, rebuild when data changes, tick each frame, dispose on unmount.

- [ ] **Step 1: Import new layer factories**

```typescript
import { createThreadLineLayer } from './scene/ThreadLineMesh';
import type { ThreadLineData, ThreadLineLayer } from './scene/ThreadLineMesh';
import { createActivityIconLayer } from './scene/ActivityIconMesh';
import type { ActivityIconData, ActivityIconLayer } from './scene/ActivityIconMesh';
```

- [ ] **Step 2: Add refs and create layers in the init section**

Following the pattern of `battleIndicatorLayerRef`, add:

```typescript
const threadLineLayerRef = useRef<ThreadLineLayer | null>(null);
const activityIconLayerRef = useRef<ActivityIconLayer | null>(null);
```

In the scene creation block (after agent sprites are created, before fog), add:

```typescript
// Thread lines
const threadLineLayer = createThreadLineLayer();
scene.add(threadLineLayer.group);
threadLineLayerRef.current = threadLineLayer;

// Activity icons
const activityIconLayer = createActivityIconLayer();
scene.add(activityIconLayer.group);
activityIconLayerRef.current = activityIconLayer;
```

- [ ] **Step 3: Add data collection useEffect**

Create a useEffect that runs when `gameState` changes. It should:

1. **For thread lines:** Iterate `gameState.graph.getOutgoingEdges(gameState.ascendantId, 'thread')`, get each target agent's hex position via the graph, get the avatar hex position, and build `ThreadLineData[]`. Call `threadLineLayerRef.current?.rebuild(data)`.

2. **For activity icons:** Iterate `gameState.unifiedActions` (active, not resolved). For each, get the agent's world position and the template's reach. Build `ActivityIconData[]` with tier-appropriate opacity. Also check `gameState.encounterProgress` for legacy encounters. Call `activityIconLayerRef.current?.rebuild(data)`.

- [ ] **Step 4: Add tick calls to render loop**

In the animation frame callback (where `tickBattleIndicators` etc. are called), add:

```typescript
threadLineLayerRef.current?.tick(elapsedS, attentionRatio);
activityIconLayerRef.current?.tick(elapsedS);
```

For `attentionRatio`: read from ascendant node `attentionPool / attentionCapacity`, defaulting to 1.0 if not set.

- [ ] **Step 5: Add zoom visibility for activity icons**

In the zoom change handler, toggle activity icon visibility:

```typescript
activityIconLayerRef.current?.setVisible(hexPixelSize >= ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD);
```

Import `ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD` from attention-constants.

- [ ] **Step 6: Dispose on unmount**

In the cleanup function, add:

```typescript
threadLineLayerRef.current?.dispose();
activityIconLayerRef.current?.dispose();
```

- [ ] **Step 7: Verify compile and visual check**

Run: `npx tsc --noEmit`
Run: `npx vite build`
Start dev server and check `?view=game` — thread lines should appear from avatar to threaded agents, activity icons should show on agents in encounters.

- [ ] **Step 8: Commit**

```bash
git add src/components/HexMapV2/HexMapV2.tsx
git commit -m "feat(attention-ui): mount thread lines and activity icons in HexMapV2 renderer"
```

---

## Task 5: Thread Tug Interaction — Click to Attend

**Files:**
- Modify: `src/components/HexMapV2/scene/ThreadLineMesh.ts`
- Modify: `src/components/HexMapV2/HexMapV2.tsx`
- Modify: `src/components/Game/GameView.tsx`

Thread tugs make thread lines vibrate with reach-coloured pulses. Clicking an agent dot with an active tug "attends" it — spending attention and surfacing the encounter notification.

- [ ] **Step 1: Add tug animation to ThreadLineMesh**

Add a `setActiveTugs(tugAgentIds: Set<string>)` method to the ThreadLineLayer interface. In `tick()`, if a line's agentId is in the tug set, apply a faster, higher-amplitude pulse (vibration) using the tug's reach colour instead of court position colour.

```typescript
// In tick(), for tugged lines:
if (tugAgentIds.has(ref.agentId)) {
  // Fast vibrate: 0.5s period, 0.3 amplitude, reach colour overlay
  const vibrate = Math.sin(elapsedS * (2 * Math.PI / 0.5)) * 0.3;
  mat.opacity = Math.max(0.3, Math.min(1.0, 0.7 + vibrate));
  // Could also modulate position slightly for physical vibration effect
}
```

- [ ] **Step 2: Wire tug data into HexMapV2**

In HexMapV2.tsx, create a derived set of agent IDs with active tugs from `gameState.activeThreadTugs`. Pass to `threadLineLayerRef.current?.setActiveTugs(tugSet)`.

- [ ] **Step 3: Wire attend-tug click handler in GameView**

In GameView.tsx, when an agent dot is clicked and that agent has an active tug in `gameState.activeThreadTugs`:

1. Mark the tug as `attended: true` (mutation on the tug record)
2. Compute attention cost via `computeAttendCost(tug.threatLevel, tug.courtPosition)`
3. Deduct from attention pool (mutate ascendant node property)
4. The encounter notification system will now surface the notification (since the encounter's effectiveTier is 'shaping' and it passed the routing check)

This should hook into the existing agent click handler — when an agent is clicked, check if they have an active tug.

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/HexMapV2/scene/ThreadLineMesh.ts src/components/HexMapV2/HexMapV2.tsx src/components/Game/GameView.tsx
git commit -m "feat(attention-ui): add thread tug vibration animation and click-to-attend handler"
```

---

## Task 6: useLastViewedTick Hook

**Files:**
- Create: `src/hooks/useLastViewedTick.ts`

Simple hook tracking when the player last viewed each agent's detail panel. Used by the Recent Activity Log and "new" indicators.

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useLastViewedTick.ts

import { useCallback, useRef } from 'react';

/**
 * Tracks the game tick at which each agent was last viewed by the player.
 * Used to determine "new" indicators on digest entries and capability changes.
 *
 * UI-only state — not persisted in GameState.
 */
export function useLastViewedTick() {
  const lastViewed = useRef<Map<string, number>>(new Map());

  const markViewed = useCallback((agentId: string, currentTick: number) => {
    lastViewed.current.set(agentId, currentTick);
  }, []);

  const getLastViewedTick = useCallback((agentId: string): number => {
    return lastViewed.current.get(agentId) ?? 0;
  }, []);

  const hasNewEntries = useCallback((agentId: string, latestEntryTick: number): boolean => {
    const last = lastViewed.current.get(agentId) ?? 0;
    return latestEntryTick > last;
  }, []);

  return { markViewed, getLastViewedTick, hasNewEntries };
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLastViewedTick.ts
git commit -m "feat(attention-ui): add useLastViewedTick hook for agent view tracking"
```

---

## Task 7: Recent Activity Log Component

**Files:**
- Create: `src/components/Game/RecentActivityLog.tsx`
- Modify: `src/components/Game/AgentDetailPanel.tsx`

A compact subsection showing the agent's recent digest entries.

- [ ] **Step 1: Create RecentActivityLog.tsx**

```typescript
// src/components/Game/RecentActivityLog.tsx

import type { DigestEntry } from '../../types/attention';

const REACH_DOT_COLORS: Record<string, string> = {
  iron: '#ff6b6b', stone: '#d4a87a', eye: '#ffe44d', gold: '#33ff77',
  veil: '#44aaff', heart: '#cc66ff', star: '#ffb355', shadow: '#8fd4c0',
};

interface RecentActivityLogProps {
  entries: DigestEntry[];
  lastViewedTick: number;
  maxEntries?: number;
}

export function RecentActivityLog({ entries, lastViewedTick, maxEntries = 6 }: RecentActivityLogProps) {
  if (entries.length === 0) return null;

  const recent = entries
    .sort((a, b) => b.tick - a.tick)
    .slice(0, maxEntries);

  return (
    <div style={{ padding: 'var(--space-2) 0' }}>
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-1)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Recent Activity
      </div>
      {recent.map((entry, i) => {
        const isNew = entry.tick > lastViewedTick;
        const dotColor = REACH_DOT_COLORS[entry.reachPrimary] ?? 'var(--text-muted)';
        return (
          <div
            key={`${entry.encounterId}-${entry.tick}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-1)',
              padding: '2px 0',
              fontSize: 'var(--text-xs)',
              color: isNew ? 'var(--text-primary)' : 'var(--text-tertiary)',
              opacity: isNew ? 1 : 0.7,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: '2ch' }}>
              t{entry.tick}
            </span>
            <span style={{
              display: 'inline-block',
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: dotColor,
              flexShrink: 0,
            }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.encounterName}. {entry.success ? 'Success' : 'Failed'}.
              {Object.entries(entry.capabilityChanges).map(([reach, delta]) =>
                delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${reach})` : ''
              ).join('')}
            </span>
            {isNew && (
              <span style={{
                fontSize: '0.5rem',
                color: 'var(--accent-gold)',
                flexShrink: 0,
              }}>NEW</span>
            )}
            {entry.wasCuratedOut && (
              <span style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-gold-dim)',
                fontStyle: 'italic',
              }}>missed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add to AgentDetailPanel**

In `src/components/Game/AgentDetailPanel.tsx`, import `RecentActivityLog` and the digest query function. After the Activity section (~line 515) and before the action buttons, add:

```typescript
import { RecentActivityLog } from './RecentActivityLog';
import { queryDigest } from '../../engine/digestBuffer';

// In the component body, derive recent entries:
const recentEntries = useMemo(() => {
  const buffer = gameState?.digestBuffer ?? [];
  return queryDigest(buffer, {
    agentId: detail.id,
    fromTick: Math.max(0, (gameState?.tick ?? 0) - 48),
    toTick: gameState?.tick ?? 999,
  });
}, [gameState?.digestBuffer, gameState?.tick, detail.id]);

// In JSX, after Activity section:
<RecentActivityLog
  entries={recentEntries}
  lastViewedTick={lastViewedTick}
/>
```

Note: `gameState` and `lastViewedTick` need to be available in the component. If `gameState` isn't currently passed to AgentDetailPanel, pass the `digestBuffer` and `tick` as separate props instead to keep the interface lean.

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/RecentActivityLog.tsx src/components/Game/AgentDetailPanel.tsx
git commit -m "feat(attention-ui): add RecentActivityLog component to agent detail panel"
```

---

## Task 8: Read the Threads Panel

**Files:**
- Create: `src/components/Game/ReadTheThreadsPanel.tsx`
- Modify: `src/components/Game/GameView.tsx`

A modal panel showing the digest buffer grouped by reach domain. Invoked as a divine action.

- [ ] **Step 1: Create ReadTheThreadsPanel.tsx**

The panel groups digest entries by reach domain, shows notable entries prominently, separates location and dormant sections. Uses existing Modal primitive.

Key layout (from spec Section 5):
- Header: *"You close your eyes and reach along the threads. Voices echo back through time..."*
- Grouped sections by reach (Iron/Stone/Eye/Gold/Veil/Heart/Star/Shadow)
- Notable callout section with individual lines
- Watched Locations section (vaguer)
- Dormant Court section (vaguest)
- Lookback selector (6/12/24/36 ticks) with essence cost display

```typescript
// src/components/Game/ReadTheThreadsPanel.tsx

import { useState, useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import type { DigestEntry } from '../../types/attention';
import { queryDigest } from '../../engine/digestBuffer';
import {
  READ_THREADS_COST_6,
  READ_THREADS_COST_12,
  READ_THREADS_COST_24,
  READ_THREADS_COST_36,
} from '../../data/attention-constants';

const REACH_LABELS: Record<string, string> = {
  iron: 'Warfare & Conflict', stone: 'Building & Craft',
  eye: 'Exploration & Lore', gold: 'Commerce & Trade',
  veil: 'Magic & Mystery', heart: 'Bonds & Diplomacy',
  star: 'Faith & Devotion', shadow: 'Intrigue & Shadow',
};

const REACH_ORDER = ['iron', 'stone', 'eye', 'gold', 'veil', 'heart', 'star', 'shadow'];

const LOOKBACK_OPTIONS = [
  { ticks: 6, label: 'Half day', cost: READ_THREADS_COST_6, fidelity: 'Full' },
  { ticks: 12, label: 'Full day', cost: READ_THREADS_COST_12, fidelity: 'High' },
  { ticks: 24, label: '2 days', cost: READ_THREADS_COST_24, fidelity: 'Moderate' },
  { ticks: 36, label: '3 days', cost: READ_THREADS_COST_36, fidelity: 'Vague' },
];

interface ReadTheThreadsPanelProps {
  open: boolean;
  onClose: () => void;
  digestBuffer: DigestEntry[];
  currentTick: number;
  essenceAvailable: number;
  onSpendEssence: (cost: number) => void;
}

export function ReadTheThreadsPanel({
  open, onClose, digestBuffer, currentTick, essenceAvailable, onSpendEssence,
}: ReadTheThreadsPanelProps) {
  const [selectedLookback, setSelectedLookback] = useState(0); // index into LOOKBACK_OPTIONS
  const [hasRead, setHasRead] = useState(false);

  const option = LOOKBACK_OPTIONS[selectedLookback];

  const entries = useMemo(() => {
    if (!hasRead) return [];
    return queryDigest(digestBuffer, {
      fromTick: currentTick - option.ticks,
      toTick: currentTick,
    });
  }, [hasRead, digestBuffer, currentTick, option.ticks]);

  // Group by reach
  const byReach = useMemo(() => {
    const groups = new Map<string, DigestEntry[]>();
    for (const e of entries) {
      if (e.isDormantAgent) continue; // separate section
      if (e.sourceType === 'location') continue; // separate section
      const arr = groups.get(e.reachPrimary) ?? [];
      arr.push(e);
      groups.set(e.reachPrimary, arr);
    }
    return groups;
  }, [entries]);

  const notable = entries.filter(e => e.isNotable);
  const dormant = entries.filter(e => e.isDormantAgent);
  const locations = entries.filter(e => e.sourceType === 'location');
  const curatedOut = entries.filter(e => e.wasCuratedOut);

  const handleRead = () => {
    if (essenceAvailable >= option.cost) {
      onSpendEssence(option.cost);
      setHasRead(true);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={700}>
      <Modal.Header onClose={onClose}>Read the Threads</Modal.Header>
      <Modal.Body>
        {!hasRead ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-4)' }}>
              You close your eyes and reach along the threads. Voices echo back through time...
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              {LOOKBACK_OPTIONS.map((opt, i) => (
                <button
                  key={opt.ticks}
                  onClick={() => setSelectedLookback(i)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: i === selectedLookback ? 'var(--bg-hover)' : 'var(--bg-raised)',
                    border: i === selectedLookback ? '1px solid var(--accent-gold-dim)' : '1px solid var(--bg-surface)',
                    borderRadius: 'var(--panel-radius)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-dim)' }}>
                    {opt.cost} essence
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleRead}
              disabled={essenceAvailable < option.cost}
            >
              Read ({option.cost} essence)
            </Button>
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 'var(--space-3)' }}>
              Reading the last {option.label}... ({option.fidelity} fidelity)
            </p>

            {/* Notable callout */}
            {notable.length > 0 && (
              <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Notable</div>
                {notable.map((e, i) => (
                  <div key={i} style={{ color: 'var(--text-primary)' }}>
                    {e.agentName}: {e.encounterName}. {e.success ? 'Success' : 'Failed'}.
                  </div>
                ))}
              </div>
            )}

            {/* Curated-out encounters */}
            {curatedOut.length > 0 && (
              <div style={{ borderLeft: '3px solid var(--accent-gold-dim)', paddingLeft: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ color: 'var(--accent-gold-dim)', fontStyle: 'italic', marginBottom: 'var(--space-1)' }}>Missed Opportunities</div>
                {curatedOut.map((e, i) => (
                  <div key={i} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    You could have shaped {e.agentName}&apos;s {e.encounterName}.
                  </div>
                ))}
              </div>
            )}

            {/* By reach domain */}
            {REACH_ORDER.map(reach => {
              const group = byReach.get(reach);
              if (!group || group.length === 0) return null;
              return (
                <div key={reach} style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.05em' }}>
                    {REACH_LABELS[reach] ?? reach}
                  </div>
                  {group.map((e, i) => (
                    <div key={i} style={{ color: 'var(--text-primary)', paddingLeft: 'var(--space-2)' }}>
                      {e.agentName}: {e.encounterName}. {e.success ? 'Success' : 'Failed'}.
                      {Object.entries(e.capabilityChanges).map(([r, d]) =>
                        d !== 0 ? ` (+${d.toFixed(1)} ${r})` : ''
                      ).join('')}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Watched Locations */}
            {locations.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>
                  Watched Locations
                </div>
                {locations.map((e, i) => (
                  <div key={i} style={{ color: 'var(--text-tertiary)', paddingLeft: 'var(--space-2)' }}>
                    Activity at {e.encounterName}.
                  </div>
                ))}
              </div>
            )}

            {/* Dormant Court */}
            {dormant.length > 0 && (
              <div>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 'var(--text-xs)' }}>
                  Dormant Court
                </div>
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: 'var(--space-2)' }}>
                  Faint echoes along slackened threads...
                </div>
                {dormant.map((e, i) => (
                  <div key={i} style={{ color: 'var(--text-muted)', paddingLeft: 'var(--space-2)' }}>
                    {e.agentName}: The thread murmurs of {e.reachPrimary}. Reactivate to know more.
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
```

- [ ] **Step 2: Wire into GameView**

In `src/components/Game/GameView.tsx`:
1. Import `ReadTheThreadsPanel`
2. Add state: `const [readThreadsOpen, setReadThreadsOpen] = useState(false)`
3. Add a button in the top bar (near alerts/system section) or as a divine action
4. Render the panel conditionally

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/ReadTheThreadsPanel.tsx src/components/Game/GameView.tsx
git commit -m "feat(attention-ui): add Read the Threads panel with reach-grouped digest display"
```

---

## Task 9: Attention Pool Visual Indicator

**Files:**
- Create: `src/components/Game/AttentionPoolIndicator.tsx`
- Modify: `src/components/Game/GameView.tsx`

A small indicator in the top bar showing the attention pool state through visual metaphor (thread aesthetic, not numbers).

- [ ] **Step 1: Create AttentionPoolIndicator.tsx**

A small component showing a visual thread-quality indicator. At full attention, shows a clean golden thread. As attention depletes, the thread frays/dims. Hover reveals numeric detail.

```typescript
// src/components/Game/AttentionPoolIndicator.tsx

import { useMemo } from 'react';
import { getAttentionVisualState } from '../../engine/attentionPool';
import type { AscendantAttentionState, AttentionVisualState } from '../../types/attention';
import {
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
} from '../../data/attention-constants';

const STATE_STYLES: Record<AttentionVisualState, { color: string; label: string; opacity: number }> = {
  focused:     { color: 'var(--accent-gold)',     label: 'Focused',     opacity: 1.0 },
  busy:        { color: 'var(--accent-gold-dim)', label: 'Busy',        opacity: 0.8 },
  strained:    { color: 'var(--warning)',          label: 'Strained',    opacity: 0.6 },
  overwhelmed: { color: 'var(--negative)',         label: 'Overwhelmed', opacity: 0.4 },
};

interface AttentionPoolIndicatorProps {
  attentionPool: number;
  attentionCapacity: number;
  attentionRegen: number;
}

export function AttentionPoolIndicator({
  attentionPool,
  attentionCapacity = ATTENTION_BASE_CAPACITY,
  attentionRegen = ATTENTION_BASE_REGEN,
}: AttentionPoolIndicatorProps) {
  const state = useMemo(() => getAttentionVisualState({
    attentionPool,
    attentionCapacity,
    attentionRegen,
  }), [attentionPool, attentionCapacity, attentionRegen]);

  const style = STATE_STYLES[state];
  const ratio = attentionCapacity > 0 ? attentionPool / attentionCapacity : 1;

  return (
    <div
      title={`Attention: ${attentionPool.toFixed(1)} / ${attentionCapacity} (${style.label})\nRegen: ${attentionRegen}/tick`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        cursor: 'default',
      }}
    >
      {/* Thread quality bar */}
      <div style={{
        width: 40,
        height: 4,
        borderRadius: 2,
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${ratio * 100}%`,
          height: '100%',
          background: style.color,
          opacity: style.opacity,
          borderRadius: 2,
          transition: 'width 0.3s ease, background-color 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 'var(--text-xs)',
        color: style.color,
        opacity: style.opacity,
      }}>
        {style.label === 'Focused' ? '' : style.label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Wire into GameView top bar**

Add the indicator to the top bar's right group section. Read attention data from the ascendant node properties.

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/AttentionPoolIndicator.tsx src/components/Game/GameView.tsx
git commit -m "feat(attention-ui): add attention pool visual indicator to top bar"
```

---

## Task 10: Verification Pass

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: No new failures

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Success

- [ ] **Step 4: Visual verification at 1920x1080**

Start dev server, navigate to `?view=game`. Verify:
- Thread lines visible from avatar to threaded agents
- Activity icons visible on agents in encounters (small coloured dots, pulsing)
- Activity icons disappear when zoomed far out
- Attention pool indicator in top bar shows state
- Read the Threads button opens panel, shows grouped digest data
- Agent detail panel shows recent activity log with reach-coloured entries

- [ ] **Step 5: Commit any fixes**

---

## Deferred to Follow-Up Plan

These require additional design or are polish-level work:

- **Story beat modal** — dramatic full-screen modal for story_beat encounters (the encounter stage system already handles encounters; story beats need a wrapper that pauses sim + adds dramatic framing)
- **Gathering storm indicator** — hex glow/swirl for queued story beats
- **Thread network overload aesthetics** — shader-based blur/fuzz on thread lines when attention depleted (current plan uses opacity scaling as v1)
- **Dormant/reactivate action templates** — divine action templates for dormanting and reactivating threads (engine already supports the state; needs template + ActionDrawer integration)
- **Agent profile modal Background Record tab** — full digest history grouped by reach in the Chronicle tab
- **Agent "new" badges** on attachment and capability sections (data available via lastViewedTick; visual treatment TBD)

---

## Wiring Checklist Update

After completing this plan, update `Docs/plans/wiring-checklist.md` with:

| Module | UI component | Data source |
|--------|-------------|-------------|
| Thread lines | ThreadLineMesh (HexMapV2 layer) | Graph thread edges, avatar position |
| Activity icons | ActivityIconMesh (HexMapV2 layer) | unifiedActions/encounterProgress |
| Thread tugs | ThreadLineMesh vibration | state.activeThreadTugs |
| Read the Threads | ReadTheThreadsPanel (Modal) | state.digestBuffer |
| Recent activity | RecentActivityLog (AgentDetailPanel) | state.digestBuffer filtered by agentId |
| Attention indicator | AttentionPoolIndicator (top bar) | Ascendant node properties |
