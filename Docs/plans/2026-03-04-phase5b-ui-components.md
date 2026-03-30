# Phase 5B: UI Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the Phase 5A engine (GameState, orchestrator, worldSeed, cycleEnd) into the existing React UI, adding 4 new components and rewriting GameView to drive the full game loop.

**Architecture:** GameView becomes the single owner of `GameState`. Each tick, it calls `runTick(state)` and React re-renders from the updated state bag. New components (DoomBar, NarrativeFeed, RivalPanel, HarvestScreen) receive slices of GameState as props. The old `Simulation` class and `EventLog` are retired.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Cinzel + Inter fonts

---

## Task 1: DoomBar Component

**Files:**
- Create: `src/components/Game/DoomBar.tsx`
- Test: `src/components/Game/__tests__/DoomBar.test.tsx`

**Context:** Horizontal bar at the top of the game screen. Shows doom archetype name, current stage, progress percentage, colored by archetype. This is a pure display component — no state management.

### Step 1: Write the test

```typescript
// src/components/Game/__tests__/DoomBar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomBar } from '../DoomBar';
import type { DoomClockState, DoomClockDefinition } from '../../../types/doomClock';

function mockDoomDef(): DoomClockDefinition {
  return {
    archetype: 'breach',
    totalTicks: 360,
    stages: [
      { name: 'Whispers', threshold: 0.0, description: 'First signs' },
      { name: 'Cracks', threshold: 0.25, description: 'Growing threat' },
      { name: 'Fractures', threshold: 0.5, description: 'Severe damage' },
      { name: 'Unraveling', threshold: 0.75, description: 'Near collapse' },
    ],
  };
}

function mockDoomState(overrides: Partial<DoomClockState> = {}): DoomClockState {
  return {
    archetype: 'breach',
    totalTicks: 360,
    currentTick: 90,
    progress: 0.25,
    currentStage: 1,
    expired: false,
    ...overrides,
  };
}

describe('DoomBar', () => {
  it('renders the archetype name', () => {
    render(<DoomBar definition={mockDoomDef()} state={mockDoomState()} />);
    expect(screen.getByText(/breach/i)).toBeTruthy();
  });

  it('renders the current stage name', () => {
    render(<DoomBar definition={mockDoomDef()} state={mockDoomState()} />);
    expect(screen.getByText(/Cracks/)).toBeTruthy();
  });

  it('renders progress percentage', () => {
    render(<DoomBar definition={mockDoomDef()} state={mockDoomState({ progress: 0.42 })} />);
    expect(screen.getByText(/42%/)).toBeTruthy();
  });

  it('shows expired state when doom expires', () => {
    render(<DoomBar definition={mockDoomDef()} state={mockDoomState({ expired: true, progress: 1.0 })} />);
    expect(screen.getByText(/expired|unmaking/i)).toBeTruthy();
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/components/Game/__tests__/DoomBar.test.tsx`
Expected: FAIL (module not found)

### Step 3: Write the component

```tsx
// src/components/Game/DoomBar.tsx
import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
}

/** Archetype → color mapping for the progress bar */
const ARCHETYPE_COLORS: Record<string, string> = {
  breach: '#dc2626',      // red
  convergence: '#7c3aed', // violet
  changing: '#059669',     // emerald
  sundering: '#ea580c',    // orange
  failing: '#6b7280',      // gray
  ascension: '#eab308',    // yellow
  reckoning: '#1d4ed8',    // blue
};

export function DoomBar({ definition, state }: DoomBarProps) {
  const color = ARCHETYPE_COLORS[definition.archetype] ?? '#dc2626';
  const pct = Math.round(state.progress * 100);
  const currentStageDef = definition.stages[state.currentStage] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';

  return (
    <div className="w-full px-4 py-2 bg-stone-800/95 border-b border-amber-900/30">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color, fontFamily: 'Cinzel, serif' }}
          >
            {definition.archetype}
          </span>
          <span className="text-amber-200/60 text-xs">
            Stage {state.currentStage + 1}: {stageName}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color }}>
          {state.expired ? 'THE UNMAKING' : `${pct}%`}
        </span>
      </div>
      <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/components/Game/__tests__/DoomBar.test.tsx`
Expected: PASS (4 tests)

Note: You'll need to check if `@testing-library/react` is installed. If not:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```
Also ensure `vitest.config.ts` has `environment: 'jsdom'` or `'happy-dom'` for React component tests.

### Step 5: Commit

```bash
git add src/components/Game/DoomBar.tsx src/components/Game/__tests__/DoomBar.test.tsx
git commit -m "feat(ui): add DoomBar component — doom clock progress display"
```

---

## Task 2: NarrativeFeed Component (replaces EventLog)

**Files:**
- Create: `src/components/Game/NarrativeFeed.tsx`
- Test: `src/components/Game/__tests__/NarrativeFeed.test.tsx`

**Context:** Replaces the old EventLog. Shows TickEvent objects from recentEvents in the GameState. Color-coded by event type, tier-2+ events shown prominently, tier-1 dimmed. Auto-scrolls to bottom.

### Step 1: Write the test

```typescript
// src/components/Game/__tests__/NarrativeFeed.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NarrativeFeed } from '../NarrativeFeed';
import type { TickEvent } from '../../../types/gameState';

const mockEvents: TickEvent[] = [
  { id: 'evt_1', tick: 10, type: 'agent_action', message: 'Kael marched east.', significance: 0.3 },
  { id: 'evt_2', tick: 11, type: 'doom_escalation', message: 'The breach widened.', significance: 0.8, sphere: 'entropy' },
  { id: 'evt_3', tick: 12, type: 'essence_gain', message: '+2.3 essence flows.', significance: 0.2, sphere: 'force' },
];

describe('NarrativeFeed', () => {
  it('renders all events', () => {
    render(<NarrativeFeed events={mockEvents} />);
    expect(screen.getByText(/Kael marched east/)).toBeTruthy();
    expect(screen.getByText(/breach widened/)).toBeTruthy();
    expect(screen.getByText(/essence flows/)).toBeTruthy();
  });

  it('shows tick numbers', () => {
    render(<NarrativeFeed events={mockEvents} />);
    expect(screen.getByText(/10/)).toBeTruthy();
    expect(screen.getByText(/11/)).toBeTruthy();
  });

  it('renders empty state when no events', () => {
    render(<NarrativeFeed events={[]} />);
    expect(screen.getByText(/awaiting/i)).toBeTruthy();
  });
});
```

### Step 2: Write the component

```tsx
// src/components/Game/NarrativeFeed.tsx
import { useEffect, useRef } from 'react';
import type { TickEvent } from '../../types/gameState';

interface NarrativeFeedProps {
  events: TickEvent[];
}

const TYPE_COLORS: Record<TickEvent['type'], string> = {
  agent_action: '#d4a574',
  agent_action_resolved: '#c4956a',
  doom_escalation: '#dc2626',
  rival_action: '#7c3aed',
  essence_gain: '#b8860b',
  mandate_progress: '#059669',
  narrative: '#9c27b0',
  phase_change: '#eab308',
  stealth_alert: '#6b7280',
};

export function NarrativeFeed({ events }: NarrativeFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-4">
        Awaiting the first whispers of fate...
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
      {events.map((evt) => {
        const color = TYPE_COLORS[evt.type] ?? '#78716c';
        const dimmed = evt.significance < 0.5;

        return (
          <div
            key={evt.id}
            className={`flex gap-2 text-xs py-0.5 ${dimmed ? 'opacity-50' : 'opacity-90'}`}
          >
            <span className="text-amber-200/30 font-mono w-8 text-right flex-shrink-0">
              {evt.tick}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-amber-200/80 leading-relaxed">
              {evt.message}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
```

### Step 3: Run test, then commit

Run: `npx vitest run src/components/Game/__tests__/NarrativeFeed.test.tsx`
Expected: PASS (3 tests)

```bash
git add src/components/Game/NarrativeFeed.tsx src/components/Game/__tests__/NarrativeFeed.test.tsx
git commit -m "feat(ui): add NarrativeFeed component — replaces EventLog with TickEvent display"
```

---

## Task 3: RivalPanel Component

**Files:**
- Create: `src/components/Game/RivalPanel.tsx`
- Test: `src/components/Game/__tests__/RivalPanel.test.tsx`

**Context:** Compact sidebar panel showing each rival god with name, behavior type icon, hostility level, and a one-line last-action summary.

### Step 1: Write the test

```typescript
// src/components/Game/__tests__/RivalPanel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RivalPanel } from '../RivalPanel';
import type { RivalDefinition, RivalState } from '../../../types/rival';

const mockDefs: RivalDefinition[] = [
  {
    id: 'rival_0',
    name: 'Xalrath the Conqueror',
    behaviorType: 'aggressive',
    sphereAffinity: 'force',
    description: 'A war-hungry deity',
  },
  {
    id: 'rival_1',
    name: 'Whisper of Veil',
    behaviorType: 'subtle',
    sphereAffinity: 'mind',
    description: 'A quiet manipulator',
  },
];

const mockStates: RivalState[] = [
  { rivalId: 'rival_0', active: true, interventionCount: 3, agentsControlled: 2, regionsInfluenced: ['loc_1'], hostilityToPlayer: 0.7 },
  { rivalId: 'rival_1', active: true, interventionCount: 1, agentsControlled: 0, regionsInfluenced: [], hostilityToPlayer: 0.3 },
];

describe('RivalPanel', () => {
  it('renders all rival names', () => {
    render(<RivalPanel definitions={mockDefs} states={mockStates} />);
    expect(screen.getByText(/Xalrath/)).toBeTruthy();
    expect(screen.getByText(/Whisper/)).toBeTruthy();
  });

  it('shows behavior type indicators', () => {
    render(<RivalPanel definitions={mockDefs} states={mockStates} />);
    // aggressive should show a sword/attack indicator, subtle should show an eye
    expect(screen.getByText(/aggressive/i)).toBeTruthy();
  });

  it('renders empty state when no rivals', () => {
    render(<RivalPanel definitions={[]} states={[]} />);
    expect(screen.getByText(/no rival/i)).toBeTruthy();
  });
});
```

### Step 2: Write the component

```tsx
// src/components/Game/RivalPanel.tsx
import type { RivalDefinition, RivalState } from '../../types/rival';

interface RivalPanelProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

const BEHAVIOR_ICONS: Record<string, string> = {
  aggressive: '⚔️',
  subtle: '👁️',
  territorial: '🏰',
  expansionist: '🌊',
};

const BEHAVIOR_COLORS: Record<string, string> = {
  aggressive: '#dc2626',
  subtle: '#7c3aed',
  territorial: '#ea580c',
  expansionist: '#059669',
};

export function RivalPanel({ definitions, states }: RivalPanelProps) {
  if (definitions.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-2">
        No rival gods stir... yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3
        className="text-xs font-bold text-amber-100/60 uppercase tracking-wider"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        Rival Gods
      </h3>
      {definitions.map((def) => {
        const rivalState = states.find(s => s.rivalId === def.id);
        const hostility = rivalState?.hostilityToPlayer ?? 0;
        const icon = BEHAVIOR_ICONS[def.behaviorType] ?? '❓';
        const color = BEHAVIOR_COLORS[def.behaviorType] ?? '#78716c';

        return (
          <div key={def.id} className="bg-stone-700/50 rounded px-2 py-1.5 border border-stone-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{icon}</span>
                <span className="text-xs text-amber-100/80 font-medium truncate max-w-[140px]">
                  {def.name}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
                {def.behaviorType}
              </span>
            </div>
            {/* Hostility bar */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] text-amber-200/40">Hostility</span>
              <div className="flex-1 h-1 bg-stone-600/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${hostility * 100}%`,
                    backgroundColor: `rgb(${Math.round(hostility * 220)}, ${Math.round((1 - hostility) * 120)}, 50)`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Step 3: Run test, then commit

Run: `npx vitest run src/components/Game/__tests__/RivalPanel.test.tsx`
Expected: PASS (3 tests)

```bash
git add src/components/Game/RivalPanel.tsx src/components/Game/__tests__/RivalPanel.test.tsx
git commit -m "feat(ui): add RivalPanel component — rival god status display"
```

---

## Task 4: HarvestScreen Component

**Files:**
- Create: `src/components/Game/HarvestScreen.tsx`
- Test: `src/components/Game/__tests__/HarvestScreen.test.tsx`

**Context:** Full-screen overlay when cycle ends. Shows harvest type, echo candidates as cards, chronicle summary, and "Begin Next Cycle" button. For the vertical slice, divine echo selection is simplified — just show the candidates and a button.

### Step 1: Write the test

```typescript
// src/components/Game/__tests__/HarvestScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HarvestScreen } from '../HarvestScreen';
import type { HarvestResult, HarvestEchoCandidate } from '../../../engine/cycleEnd';

function mockHarvestResult(): HarvestResult {
  return {
    harvestType: 'bittersweet',
    cosmicEchoCandidates: [
      {
        node: { id: 'ind_0', type: 'actor', name: 'Kael', properties: {} },
        score: 0.9,
        echoDefinition: {
          id: 'echo_1_ind_0',
          echoType: 'legacy',
          source: 'cosmic',
          originNodeId: 'ind_0',
          originCycle: 1,
          name: 'Memory of Kael',
          summary: 'A warrior whose deeds echoed across the ages.',
          sphereAffinities: ['force', 'matter'],
          significance: 0.9,
          injection: { injectionType: 'cultural_template', description: 'Warrior culture', sphereBiases: {} },
        },
      },
    ],
    divineEchoSlots: 2,
    chronicleSummary: 'A bittersweet age. Kael left a lasting mark.',
  };
}

describe('HarvestScreen', () => {
  it('renders harvest type heading', () => {
    render(<HarvestScreen harvest={mockHarvestResult()} cycle={1} onBeginNextCycle={() => {}} />);
    expect(screen.getByText(/bittersweet/i)).toBeTruthy();
  });

  it('renders echo candidates', () => {
    render(<HarvestScreen harvest={mockHarvestResult()} cycle={1} onBeginNextCycle={() => {}} />);
    expect(screen.getByText(/Memory of Kael/)).toBeTruthy();
  });

  it('renders chronicle summary', () => {
    render(<HarvestScreen harvest={mockHarvestResult()} cycle={1} onBeginNextCycle={() => {}} />);
    expect(screen.getByText(/lasting mark/)).toBeTruthy();
  });

  it('fires onBeginNextCycle when button clicked', () => {
    const handler = vi.fn();
    render(<HarvestScreen harvest={mockHarvestResult()} cycle={1} onBeginNextCycle={handler} />);
    fireEvent.click(screen.getByText(/begin next cycle/i));
    expect(handler).toHaveBeenCalledOnce();
  });
});
```

### Step 2: Write the component

```tsx
// src/components/Game/HarvestScreen.tsx
import type { HarvestResult, HarvestEchoCandidate } from '../../engine/cycleEnd';
import type { HarvestType } from '../../types/worldSoul';

interface HarvestScreenProps {
  harvest: HarvestResult;
  cycle: number;
  onBeginNextCycle: () => void;
}

const HARVEST_STYLES: Record<HarvestType, { title: string; color: string; bg: string }> = {
  triumphant: { title: 'A Triumphant Age', color: '#eab308', bg: 'from-yellow-900/30' },
  bittersweet: { title: 'A Bittersweet Age', color: '#a78bfa', bg: 'from-purple-900/30' },
  somber: { title: 'A Somber Age', color: '#6b7280', bg: 'from-gray-900/30' },
};

function EchoCard({ candidate }: { candidate: HarvestEchoCandidate }) {
  const def = candidate.echoDefinition;
  return (
    <div className="bg-stone-700/60 border border-amber-700/20 rounded-lg p-3 w-56 flex-shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-xs font-bold text-amber-100/90 truncate">{def.name}</span>
      </div>
      <p className="text-[10px] text-amber-200/50 leading-relaxed mb-2">{def.summary}</p>
      <div className="flex gap-1">
        {def.sphereAffinities.map(s => (
          <span key={s} className="text-[9px] px-1.5 py-0.5 bg-stone-600/50 rounded text-amber-200/60">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-1 text-[10px] text-amber-200/30">
        Significance: {(candidate.score * 100).toFixed(0)}%
      </div>
    </div>
  );
}

export function HarvestScreen({ harvest, cycle, onBeginNextCycle }: HarvestScreenProps) {
  const style = HARVEST_STYLES[harvest.harvestType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className={`max-w-2xl w-full mx-4 bg-gradient-to-b ${style.bg} to-stone-900 border border-amber-900/30 rounded-xl p-8`}>
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-amber-200/40 uppercase tracking-widest mb-1">
            Cycle {cycle} Complete
          </p>
          <h2
            className="text-2xl font-bold tracking-wide"
            style={{ color: style.color, fontFamily: 'Cinzel, serif' }}
          >
            {style.title}
          </h2>
        </div>

        {/* Chronicle summary */}
        <p className="text-sm text-amber-200/60 text-center italic mb-6 leading-relaxed">
          {harvest.chronicleSummary}
        </p>

        {/* Echo candidates */}
        {harvest.cosmicEchoCandidates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-amber-100/50 uppercase tracking-wider mb-3">
              Echoes Preserved ({harvest.cosmicEchoCandidates.length} cosmic)
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {harvest.cosmicEchoCandidates.map(c => (
                <EchoCard key={c.echoDefinition.id} candidate={c} />
              ))}
            </div>
          </div>
        )}

        {/* Divine echo slots info */}
        {harvest.divineEchoSlots > 0 && (
          <p className="text-xs text-amber-200/40 text-center mb-6">
            {harvest.divineEchoSlots} divine echo slot{harvest.divineEchoSlots > 1 ? 's' : ''} available
            <span className="text-amber-200/20 ml-1">(selection coming in a future update)</span>
          </p>
        )}

        {/* Action button */}
        <div className="text-center">
          <button
            onClick={onBeginNextCycle}
            className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: style.color,
              color: '#1c1917',
              fontFamily: 'Cinzel, serif',
              boxShadow: `0 0 20px ${style.color}40`,
            }}
          >
            Begin Next Cycle
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Run test, then commit

Run: `npx vitest run src/components/Game/__tests__/HarvestScreen.test.tsx`
Expected: PASS (4 tests)

```bash
git add src/components/Game/HarvestScreen.tsx src/components/Game/__tests__/HarvestScreen.test.tsx
git commit -m "feat(ui): add HarvestScreen overlay — cycle-end echo display and transition"
```

---

## Task 5: GameView Rewrite — Wire Engine to UI

**Files:**
- Modify: `src/components/Game/GameView.tsx` (full rewrite)

**Context:** This is the heart of the UI rewrite. GameView currently uses the old `Simulation` class and local state. It needs to:
1. Initialize a full `GameState` using `seedWorld()` + engine factories
2. Use `runTick()` from the orchestrator each tick
3. Use `cycleEnd` functions when doom expires
4. Render the new components (DoomBar, NarrativeFeed, RivalPanel, HarvestScreen)
5. Keep existing components (HexMap, EssencePanel, SimulationControls)

### Step 1: Rewrite GameView.tsx

```tsx
// src/components/Game/GameView.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexTile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../../engine/graph';
import { generateWorld } from '../../engine/hexGrid';
import { createAscendant } from '../../engine/ascendant';
import { seedWorld } from '../../engine/worldSeed';
import { generateRivals, createRivalState } from '../../engine/rival';
import { generateDoomClock, createDoomClockState } from '../../engine/doomClock';
import { createGreatChronicle } from '../../engine/chronicle';
import { createDefaultFundament, createResonanceState } from '../../engine/worldSoul';
import { runTick, resetEventCounter } from '../../engine/orchestrator';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
} from '../../engine/cycleEnd';
import type { HarvestResult } from '../../engine/cycleEnd';
import { computeMaxEssence } from '../../engine/influence';
import { SPHERE_NAMES } from '../../types';

import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { NarrativeFeed } from './NarrativeFeed';
import { RivalPanel } from './RivalPanel';
import { HarvestScreen } from './HarvestScreen';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

const COLS = 20;
const ROWS = 15;

/** Build the initial GameState from creation params */
function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
): { state: GameState; tiles: HexTile[] } {
  const tiles = generateWorld(cosmology, COLS, ROWS, seed);
  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add starting location if not already present
  if (!graph.getNode('loc.start')) {
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });
  }

  const { ascendantId } = createAscendant(graph, {
    archetype,
    avatar: {
      name: avatarName,
      startLocationId: 'loc.start',
      formDescription: `The mortal vessel of ${archetype.title}`,
    },
  });

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  const emptyPool = {} as Record<string, number>;
  for (const s of SPHERE_NAMES) emptyPool[s] = 0;

  const state: GameState = {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyPool as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };

  return { state, tiles };
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Initialize ──
  const initial = useMemo(
    () => initializeGameState(archetype, avatarName, cosmology, seed),
    [archetype, avatarName, cosmology, seed]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tick ──
  const doTick = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'playing') {
        return runTick(prev);
      }
      if (prev.phase === 'twilight') {
        const result = runTwilightTick(prev);
        if (result.complete) {
          // Compute harvest and pause for screen
          const harvest = computeHarvest(result.state);
          // We need to set harvest outside setState — use a ref trick
          setTimeout(() => {
            setHarvestResult(harvest);
            setRunning(false);
          }, 0);
        }
        return result.state;
      }
      return prev;
    });
  }, []);

  // Watch for phase transition to twilight (doom expired)
  useEffect(() => {
    if (gameState.phase === 'twilight' && !harvestResult) {
      // Start twilight ticks
      setGameState(prev => startTwilight(prev));
    }
  }, [gameState.phase]);

  // ── Auto-play ──
  useEffect(() => {
    if (running && gameState.phase !== 'harvest' && gameState.phase !== 'transition') {
      const ms = Math.max(50, 1000 / speed);
      intervalRef.current = setInterval(doTick, ms);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, doTick, gameState.phase]);

  // ── Handle new cycle ──
  const handleBeginNextCycle = useCallback(() => {
    if (!harvestResult) return;
    const cosmicEchoes = harvestResult.cosmicEchoCandidates.map(c => c.echoDefinition);
    setGameState(prev => {
      const nextState = transitionToNewCycle(prev, cosmicEchoes, [], harvestResult.chronicleSummary);
      // Reset to playing for next cycle
      return { ...nextState, phase: 'playing' };
    });
    setHarvestResult(null);
    resetEventCounter();
  }, [harvestResult]);

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  const year = Math.floor(gameState.tick / 120) + 1;
  const maxEssence = computeMaxEssence(gameState.graph, gameState.ascendantId);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Doom bar at top */}
      <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-amber-900/30 bg-stone-800/90">
          {/* Ascendant info */}
          <div className="text-center py-2">
            <h1
              className="text-lg font-bold text-amber-100 tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {archetype.title}
            </h1>
            <p className="text-xs text-amber-400/50 mt-0.5">
              Avatar: {avatarName} · Cycle {gameState.cycle}
            </p>
          </div>

          <SimulationControls
            tick={gameState.tick}
            season={seasonName}
            year={year}
            running={running}
            speed={speed}
            onToggle={() => setRunning(r => !r)}
            onStep={doTick}
            onSpeedChange={setSpeed}
          />

          <EssencePanel
            pool={gameState.essencePool}
            maxEssence={maxEssence}
            primarySphere={archetype.sphereAlignment.primary}
            secondarySphere={archetype.sphereAlignment.secondary}
          />

          <RivalPanel
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hex map */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
            <HexMap
              tiles={tiles}
              cols={COLS}
              rows={ROWS}
              hoveredHex={hoveredHex}
              selectedHex={selectedHex}
              overlayMode="none"
              onHexClick={setSelectedHex}
              onHexHover={setHoveredHex}
            />
          </div>

          {/* Narrative feed at bottom */}
          <div className="border-t border-amber-900/30 bg-stone-800/80 p-3">
            <NarrativeFeed events={gameState.recentEvents} />
          </div>
        </div>
      </div>

      {/* Harvest overlay */}
      {harvestResult && (
        <HarvestScreen
          harvest={harvestResult}
          cycle={gameState.cycle}
          onBeginNextCycle={handleBeginNextCycle}
        />
      )}
    </div>
  );
}
```

### Step 2: Verify TypeScript compiles

Run: `npx tsc --noEmit`
Expected: Clean (or minor fixable issues)

### Step 3: Verify app loads in browser

Run: `npx vite --host 0.0.0.0 &` and manually verify the game view loads.

### Step 4: Commit

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat(ui): rewrite GameView to use GameState orchestrator + new components"
```

---

## Task 6: Final Verification + Cleanup

**Files:**
- Verify all component tests pass
- Run TypeScript check
- Remove old EventLog import if unused

### Step 1: Run all component tests

```bash
npx vitest run src/components/Game/__tests__/
```

### Step 2: Run engine tests (regression check)

```bash
npx vitest run src/engine/__tests__/gameState.test.ts src/engine/__tests__/worldSeed.test.ts
npx vitest run src/engine/__tests__/orchestrator.test.ts src/engine/__tests__/cycleEnd.test.ts
```

### Step 3: TypeScript check

```bash
npx tsc --noEmit
```

### Step 4: Clean up unused imports

If `EventLog` is no longer imported in `GameView.tsx`, ensure no dead imports remain. The `EventLog.tsx` file itself stays — it may be useful elsewhere later.

### Step 5: Final commit if needed

```bash
git add -A
git commit -m "chore: Phase 5B cleanup — remove unused imports, verify all tests"
```

---

## Summary

**Phase 5B adds:**

| Component | Type | Purpose |
|-----------|------|---------|
| `DoomBar` | New | Doom clock progress bar at top |
| `NarrativeFeed` | New (replaces EventLog) | TickEvent display with color-coding |
| `RivalPanel` | New | Rival god status in sidebar |
| `HarvestScreen` | New | Cycle-end overlay with echo display |
| `GameView` | Rewritten | Uses GameState + orchestrator |

**Estimated test count:** ~14 new UI component tests + all existing engine tests

**After Phase 5B:** The vertical slice is functionally complete. You can generate a world, pick a divinity, watch agents act, see doom tick, experience twilight + harvest, and begin a new cycle. Not pretty, but playable.

**Future iterations:**
- MandateTracker component (when mandate UI is designed)
- Divine Toolkit (player intervention)
- Polish, animations, responsive layout
- Sound system
