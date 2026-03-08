# GameView Decomposition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract 6 custom hooks from the 791-line GameView.tsx to reduce it to ~250 lines of JSX layout.

**Architecture:** Move logically grouped useState/useMemo/useCallback/useEffect clusters into custom hooks in `src/components/Game/hooks/`. GameView calls hooks and passes return values to child components. No new context, no changed render tree, no changed props.

**Tech Stack:** React hooks, TypeScript, vitest

---

### Task 1: Baseline — verify all tests pass and create hooks directory

**Files:**
- Create: `src/components/Game/hooks/` (directory)

**Step 1: Run type-check to verify clean baseline**

Run: `npx tsc --noEmit`
Expected: clean (0 errors)

**Step 2: Run GameView-related tests to verify baseline**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 3: Create hooks directory**

```bash
mkdir -p src/components/Game/hooks
```

**Step 4: Commit**

```bash
git add src/components/Game/hooks
git commit -m "chore: create hooks directory for GameView decomposition" --allow-empty
```

---

### Task 2: Extract useSimulation hook

**Files:**
- Create: `src/components/Game/hooks/useSimulation.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** This hook owns the core simulation loop: gameState, running, speed, tick execution, auto-play interval, twilight transition, harvest result, and cycle transitions. It's the "root" hook that other hooks depend on.

**Step 1: Create useSimulation.ts**

Extract from GameView.tsx lines 100-189 (the `initial` useMemo through `maxEssence`):

```typescript
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { HexTile } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';
import type { GameState } from '../../../types/gameState';
import { initializeGameState } from '../../../engine/gameInit';
import { runTick, resetEventCounter } from '../../../engine/orchestrator';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
} from '../../../engine/cycleEnd';
import type { HarvestResult } from '../../../engine/cycleEnd';
import { computeMaxEssence } from '../../../engine/influence';

const COLS = 20;
const ROWS = 15;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

interface UseSimulationParams {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

export function useSimulation({ archetype, avatarName, cosmology, seed }: UseSimulationParams) {
  const initial = useMemo(
    () => initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS),
    [archetype, avatarName, cosmology, seed]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTick = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'playing') {
        return runTick(prev);
      }
      if (prev.phase === 'twilight') {
        const result = runTwilightTick(prev);
        if (result.complete) {
          const harvest = computeHarvest(result.state);
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

  // Watch for phase transition to twilight
  useEffect(() => {
    if (gameState.phase === 'twilight' && !harvestResult) {
      setGameState(prev => startTwilight(prev));
    }
  }, [gameState.phase, harvestResult]);

  // Auto-play interval
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

  const handleBeginNextCycle = useCallback(() => {
    if (!harvestResult) return;
    const cosmicEchoes = harvestResult.cosmicEchoCandidates.map(c => c.echoDefinition);
    setGameState(prev => {
      const nextState = transitionToNewCycle(prev, cosmicEchoes, [], harvestResult.chronicleSummary);
      return { ...nextState, phase: 'playing' };
    });
    setHarvestResult(null);
    resetEventCounter();
  }, [harvestResult]);

  const handleToggleRunning = useCallback(() => {
    setRunning(prev => !prev);
  }, []);

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  const year = Math.floor(gameState.tick / 120) + 1;
  const maxEssence = computeMaxEssence(gameState.graph, gameState.ascendantId);

  return {
    gameState,
    setGameState,
    tiles,
    running,
    speed,
    harvestResult,
    doTick,
    handleBeginNextCycle,
    handleToggleRunning,
    setSpeed,
    seasonName,
    year,
    maxEssence,
    COLS,
    ROWS,
  };
}
```

**Step 2: Update GameView.tsx to use useSimulation**

Replace the extracted state/effects/handlers with:
```typescript
import { useSimulation } from './hooks/useSimulation';

// Inside GameView function, replace lines 100-189 with:
const {
  gameState, setGameState, tiles, running, speed,
  harvestResult, doTick, handleBeginNextCycle, handleToggleRunning,
  setSpeed, seasonName, year, maxEssence, COLS, ROWS,
} = useSimulation({ archetype, avatarName, cosmology, seed });
```

Remove from GameView.tsx:
- The `COLS`, `ROWS` constants (now in useSimulation)
- The `SEASONS` constant
- All imports only used by the extracted code (initializeGameState, runTick, resetEventCounter, cycleEnd imports, computeMaxEssence)
- The `intervalRef` useRef
- Keep `hexMapRef` (used by other code)

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useSimulation.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useSimulation hook from GameView"
```

---

### Task 3: Extract useHexZoomData hook

**Files:**
- Create: `src/components/Game/hooks/useHexZoomData.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** This hook encapsulates the 8 useMemo computations for hex zoom level data. It's a pure data-derivation hook with no state or handlers — just memoized queries against the graph.

**Step 1: Create useHexZoomData.ts**

Extract from GameView.tsx the hex zoom useMemo block (lines 213-252):

```typescript
import { useMemo } from 'react';
import type { WorldGraph } from '../../../types/graph';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../../../engine/hexZoom';

interface UseHexZoomDataParams {
  graph: WorldGraph;
  ascendantId: string;
  focusedHex: { col: number; row: number } | null;
  focusedLocationId: string | null;
}

export function useHexZoomData({ graph, ascendantId, focusedHex, focusedLocationId }: UseHexZoomDataParams) {
  const hexLocations = useMemo(() => {
    if (!focusedHex) return [];
    return getLocationsInHex(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const hexAgentsByLocation = useMemo(() => {
    const map: Record<string, ReturnType<typeof getAgentsAtLocation>> = {};
    for (const loc of hexLocations) {
      map[loc.id] = getAgentsAtLocation(graph, loc.id);
    }
    return map;
  }, [graph, hexLocations]);

  const hexConnections = useMemo(() => {
    return getLocationConnections(graph, hexLocations.map(l => l.id));
  }, [graph, hexLocations]);

  const hexSphereInfluence = useMemo(() => {
    if (!focusedHex) return null;
    return getHexSphereInfluence(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const hexLineOfSight = useMemo(() => {
    if (!focusedHex) return 'none' as const;
    return getLineOfSight(graph, ascendantId, focusedHex);
  }, [graph, ascendantId, focusedHex]);

  const hexTotalAgents = useMemo(() => {
    return Object.values(hexAgentsByLocation).reduce((sum, agents) => sum + agents.length, 0);
  }, [hexAgentsByLocation]);

  const focusedLocation = useMemo(() => {
    if (!focusedLocationId) return null;
    return graph.getNode(focusedLocationId) ?? null;
  }, [graph, focusedLocationId]);

  const focusedLocationAgents = useMemo(() => {
    if (!focusedLocationId) return [];
    return getAgentsAtLocation(graph, focusedLocationId);
  }, [graph, focusedLocationId]);

  return {
    hexLocations,
    hexAgentsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    focusedLocation,
    focusedLocationAgents,
  };
}
```

**Step 2: Update GameView.tsx**

Replace the 8 useMemo blocks with:
```typescript
import { useHexZoomData } from './hooks/useHexZoomData';

const {
  hexLocations, hexAgentsByLocation, hexConnections,
  hexSphereInfluence, hexLineOfSight, hexTotalAgents,
  focusedLocation, focusedLocationAgents,
} = useHexZoomData({
  graph: gameState.graph,
  ascendantId: gameState.ascendantId,
  focusedHex,
  focusedLocationId,
});
```

Remove hexZoom engine imports from GameView that are no longer directly used.

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useHexZoomData.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useHexZoomData hook from GameView"
```

---

### Task 4: Extract useAvatarData hook

**Files:**
- Create: `src/components/Game/hooks/useAvatarData.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** Pure memoization hook for avatar position, sphere color, location overlays, and avatar pixel position. Also owns debugPanelOpen state and its toggle since these are simple and don't fit cleanly elsewhere.

**Step 1: Create useAvatarData.ts**

Extract from GameView.tsx lines 255-295 plus debugPanelOpen state:

```typescript
import { useState, useMemo, useCallback } from 'react';
import type { WorldGraph } from '../../../types/graph';
import type { AscendantArchetype } from '../../../types/influence';
import type { LocationSubtype } from '../../../types';
import { getAvatarHexPosition } from '../../../engine/visibility';
import { hexToPixel } from '../../../lib/hexMath';
import { enableTracing, disableTracing } from '../../../engine/traceBuffer';

const SETTLEMENT_PRIORITY: Partial<Record<LocationSubtype, number>> = {
  capital: 10, city: 8, town: 6, hamlet: 4,
  fort: 3, castle: 3, temple: 3, tower: 2, shrine: 2,
  mining: 2, camp: 1, farmland: 1, ruins: 1,
  battleground: 1, oasis: 1, unexplored_poi: 0,
};

function settlementPriority(subtype: LocationSubtype): number {
  return SETTLEMENT_PRIORITY[subtype] ?? 0;
}

interface UseAvatarDataParams {
  graph: WorldGraph;
  ascendantId: string;
  archetype: AscendantArchetype;
}

export function useAvatarData({ graph, ascendantId, archetype }: UseAvatarDataParams) {
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  const avatarPos = useMemo(
    () => getAvatarHexPosition(graph, ascendantId),
    [graph, ascendantId]
  );

  const sphereColor = useMemo(() => {
    const primarySphere = archetype.sphereAlignment.primary;
    const sphereColorMap: Record<string, string> = {
      chaos: '#ff6633',
      order: '#3366ff',
      light: '#ffdd44',
      darkness: '#9933cc',
    };
    return sphereColorMap[primarySphere] ?? '#ff6633';
  }, [archetype.sphereAlignment.primary]);

  const locationOverlays = useMemo(() => {
    const overlayMap = new Map<string, LocationSubtype>();
    const nodes = graph.getNodesByType('location');
    for (const node of nodes) {
      const props = node.properties;
      if (props.hexCol !== undefined && props.hexRow !== undefined && props.locationSubtype) {
        const key = `${props.hexCol},${props.hexRow}`;
        const existing = overlayMap.get(key);
        if (!existing || settlementPriority(props.locationSubtype as LocationSubtype) > settlementPriority(existing)) {
          overlayMap.set(key, props.locationSubtype as LocationSubtype);
        }
      }
    }
    return overlayMap;
  }, [graph]);

  const avatarPixelPos = useMemo(() => {
    if (!avatarPos) return null;
    const HEX_SIZE = 30;
    return hexToPixel(avatarPos, HEX_SIZE);
  }, [avatarPos]);

  const handleToggleDebug = useCallback(() => {
    setDebugPanelOpen(prev => {
      if (!prev) enableTracing();
      else disableTracing();
      return !prev;
    });
  }, []);

  return {
    avatarPos,
    sphereColor,
    locationOverlays,
    avatarPixelPos,
    debugPanelOpen,
    handleToggleDebug,
  };
}
```

**Step 2: Update GameView.tsx**

Replace extracted code with:
```typescript
import { useAvatarData } from './hooks/useAvatarData';

const {
  avatarPos, sphereColor, locationOverlays, avatarPixelPos,
  debugPanelOpen, handleToggleDebug,
} = useAvatarData({
  graph: gameState.graph,
  ascendantId: gameState.ascendantId,
  archetype,
});
```

Remove: SETTLEMENT_PRIORITY, settlementPriority function, related imports now only used by the hook.

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useAvatarData.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useAvatarData hook from GameView"
```

---

### Task 5: Extract useAgentInteraction hook

**Files:**
- Create: `src/components/Game/hooks/useAgentInteraction.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** This is the largest extraction — all agent selection, wheel interaction, intervention flow, strand viewing, and retinue querying. It needs setGameState from useSimulation to apply intervention effects.

**Step 1: Create useAgentInteraction.ts**

Extract agent-related state (lines 112-118, 125), handlers (lines 298-410, 459-501), and computed values (retinueAgents, agentDetail, wheelSlots):

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { InterventionType, LocalEncounterMode } from '../../../types/dream';
import { INTERVENTION_DEFINITIONS } from '../../../types/dream';
import { getRetinueAgents } from '../../../engine/retinue';
import { getAgentDetail } from '../../../engine/agentDetail';
import { getAgentWheelSlots } from '../../../engine/wheel';
import { getDeliveryInfo } from '../../../engine/delivery';
import { executeIntervention } from '../../../engine/dream';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../../../engine/strands';
import { recalcVisibility, collectLOSSources } from '../../../engine/visibility';

interface UseAgentInteractionParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  archetype: AscendantArchetype;
}

export function useAgentInteraction({ gameState, setGameState, archetype }: UseAgentInteractionParams) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelFeedback, setWheelFeedback] = useState<string | null>(null);
  const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
  const [pendingIntervention, setPendingIntervention] = useState<{
    slotId: string;
    interventionType: InterventionType;
  } | null>(null);

  const retinueAgents = useMemo(
    () => getRetinueAgents(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId]
  );

  const agentDetail = useMemo(() => {
    if (!selectedAgentId) return null;
    return getAgentDetail(gameState.graph, selectedAgentId, gameState.ascendantId);
  }, [selectedAgentId, gameState.graph, gameState.ascendantId]);

  const wheelSlots = useMemo(() => {
    if (!selectedAgentId || !wheelVisible) return null;
    const agent = retinueAgents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return getAgentWheelSlots({
      tier: agent.tier,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
    });
  }, [selectedAgentId, wheelVisible, gameState.essencePool, retinueAgents, archetype]);

  // Copy all handler callbacks from GameView.tsx:
  // handleAgentSelect, handleWheelSlotClick, handleInterventionConfirm,
  // handleInterventionCancel, handleWheelDismiss, handleStrandClose,
  // handleOpenWheel, handleViewPsyche, handleBackFromAgentDetail,
  // handleAvatarWheelClick
  // (exact code from GameView lines 298-501, preserving all logic)

  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setWheelVisible(false);
    setPendingIntervention(null);
  }, []);

  const handleWheelSlotClick = useCallback((slotId: string) => {
    // ... exact copy from GameView
    if (slotId === 'scry') {
      // Will be handled by scry hook
      return;
    }
    const interventionType = slotId as InterventionType;
    if (INTERVENTION_DEFINITIONS[interventionType]) {
      setPendingIntervention({ slotId, interventionType });
    }
  }, []);

  const handleInterventionConfirm = useCallback((encounterMode?: LocalEncounterMode) => {
    if (!pendingIntervention || !selectedAgentId) return;
    const { interventionType } = pendingIntervention;
    const def = INTERVENTION_DEFINITIONS[interventionType];
    if (!def) return;

    setGameState(prev => {
      const deliveryInfo = getDeliveryInfo(prev.graph, prev.ascendantId, selectedAgentId, def.deliveryMode);
      const result = executeIntervention(prev, selectedAgentId, interventionType, {
        encounterMode,
        deliveryRange: deliveryInfo,
      });
      if (!result.success) return prev;
      let next = result.state;
      const losSources = collectLOSSources(next.graph, next.ascendantId);
      const visibilityMap = recalcVisibility(losSources, next.visibilityMap);
      next = { ...next, visibilityMap };
      return next;
    });

    setWheelVisible(false);
    setPendingIntervention(null);
  }, [pendingIntervention, selectedAgentId, setGameState]);

  const handleInterventionCancel = useCallback(() => {
    setPendingIntervention(null);
  }, []);

  const handleWheelDismiss = useCallback(() => {
    setWheelVisible(false);
    setPendingIntervention(null);
  }, []);

  const handleStrandClose = useCallback(() => {
    setStrandViewAgent(null);
  }, []);

  const handleBackFromAgentDetail = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const handleViewPsyche = useCallback(() => {
    if (selectedAgentId) setStrandViewAgent(selectedAgentId);
  }, [selectedAgentId]);

  const handleOpenWheel = useCallback(() => {
    if (selectedAgentId) {
      const agent = retinueAgents.find(a => a.id === selectedAgentId);
      if (agent) {
        setWheelVisible(true);
      } else {
        setWheelFeedback('No agent selected or agent not in retinue');
        setTimeout(() => setWheelFeedback(null), 2000);
      }
    }
  }, [selectedAgentId, retinueAgents]);

  const handleAvatarWheelClick = useCallback(() => {
    if (retinueAgents.length === 0) {
      setWheelFeedback('No agents in your retinue yet. Influence agents first.');
      setTimeout(() => setWheelFeedback(null), 3000);
      return;
    }
    const agentId = selectedAgentId ?? retinueAgents[0]?.id;
    if (agentId) {
      setSelectedAgentId(agentId);
      setWheelVisible(true);
    }
  }, [retinueAgents, selectedAgentId]);

  // Strand data (for StrandView overlay)
  const strandData = useMemo(() => {
    if (!strandViewAgent) return null;
    return {
      agentName: gameState.graph.getNode(strandViewAgent)?.name ?? 'Unknown',
      strands: {
        presence: getPresenceStrand(gameState.graph, strandViewAgent),
        desires: getDesiresStrand(gameState.graph, strandViewAgent),
        bonds: getBondsStrand(gameState.graph, strandViewAgent),
        ambitions: getAmbitionsStrand(gameState.graph, strandViewAgent),
        beliefs: getBeliefsStrand(gameState.graph, strandViewAgent),
        fears: getFearsStrand(gameState.graph, strandViewAgent),
      },
    };
  }, [strandViewAgent, gameState.graph]);

  return {
    selectedAgentId,
    wheelVisible,
    wheelFeedback,
    strandViewAgent,
    pendingIntervention,
    retinueAgents,
    agentDetail,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleWheelDismiss,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenWheel,
    handleAvatarWheelClick,
  };
}
```

**Important:** The actual implementation must copy the EXACT handler logic from GameView.tsx — the above shows the structure but some handlers (especially handleInterventionConfirm and handleAvatarWheelClick) have nuanced logic. Copy verbatim.

**Step 2: Update GameView.tsx**

Replace all agent interaction code with the hook call. Remove strand engine imports, retinue/agentDetail/wheel imports now only used by the hook.

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useAgentInteraction.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useAgentInteraction hook from GameView"
```

---

### Task 6: Extract useScry hook

**Files:**
- Create: `src/components/Game/hooks/useScry.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** Scry state and handlers. Depends on retinueAgents from useAgentInteraction and gameState from useSimulation.

**Step 1: Create useScry.ts**

Extract scryState, scryVisible, and all scry handlers:

```typescript
import { useState, useCallback } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { ScryState, Title } from '../../../types/scry';
import {
  createScryState,
  initializeCourt,
  assignAgentToPosition,
  demoteAgent,
} from '../../../engine/scry';

interface UseScryParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  archetype: AscendantArchetype;
  retinueAgents: Array<{ id: string; name: string; tier: number; tierName: string }>;
}

export function useScry({ gameState, setGameState, archetype, retinueAgents }: UseScryParams) {
  const [scryState, setScryState] = useState<ScryState>(createScryState());
  const [scryVisible, setScryVisible] = useState(false);

  // Copy exact handler logic from GameView for:
  // handleOpenScry, handleScryAssign, handleScryDemote, handleCloseScry, handleAvatarScryClick

  const handleOpenScry = useCallback(() => {
    setScryState(prev => {
      if (prev.positions.length === 0) {
        return initializeCourt(prev, retinueAgents, gameState.tick, gameState.seed + gameState.tick);
      }
      return prev;
    });
    setScryVisible(true);
  }, [retinueAgents, gameState.tick, gameState.seed]);

  const handleScryAssign = useCallback((positionId: string, agentId: string, title: Title, cost: number) => {
    setScryState(prev => assignAgentToPosition(prev, positionId, agentId, title));
    setGameState(prev => {
      const pool = { ...prev.essencePool };
      const sphere = archetype.sphereAlignment.primary;
      pool[sphere] = Math.max(0, (pool[sphere] ?? 0) - cost);
      return { ...prev, essencePool: pool };
    });
  }, [archetype, setGameState]);

  const handleScryDemote = useCallback((positionId: string) => {
    setScryState(prev => demoteAgent(prev, positionId));
  }, []);

  const handleCloseScry = useCallback(() => {
    setScryVisible(false);
  }, []);

  const handleAvatarScryClick = useCallback(() => {
    handleOpenScry();
  }, [handleOpenScry]);

  return {
    scryState,
    scryVisible,
    handleOpenScry,
    handleScryAssign,
    handleScryDemote,
    handleCloseScry,
    handleAvatarScryClick,
  };
}
```

**Step 2: Update GameView.tsx**

Replace scry code with hook call. Remove scry engine imports.

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useScry.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useScry hook from GameView"
```

---

### Task 7: Extract useViewNavigation hook

**Files:**
- Create: `src/components/Game/hooks/useViewNavigation.ts`
- Modify: `src/components/Game/GameView.tsx`

**Context:** View level state machine, hex/location focus, move mode, hex click handling. Depends on gameState for moveAvatarToHex and hexMapRef for centering.

**Step 1: Create useViewNavigation.ts**

Extract viewLevel, focusedHex, focusedLocationId, moveMode, hoveredHex, selectedHex and all navigation handlers:

```typescript
import { useState, useCallback } from 'react';
import type { GameState } from '../../../types/gameState';
import type { ViewLevel } from '../GameView';
import type { HexMapHandle } from '../../HexMap/HexMap';
import { moveAvatarToHex } from '../../../engine/avatarMove';
import { recalcVisibility, collectLOSSources } from '../../../engine/visibility';

interface UseViewNavigationParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  hexMapRef: React.RefObject<HexMapHandle>;
  avatarPos: { col: number; row: number } | null;
  sphereColor: string;
}

export function useViewNavigation({
  gameState, setGameState, hexMapRef, avatarPos, sphereColor,
}: UseViewNavigationParams) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);

  // Copy exact handlers from GameView:
  // handleHexClick, handleLocationDoubleClick, handleBackToWorld,
  // handleBackToHex, handleLocationClick, handleAvatarMoveClick,
  // handleCenterOnAvatar, handleHexClickMove

  const handleHexClick = useCallback((coord: { col: number; row: number }) => {
    setSelectedHex(coord);
    setFocusedHex(coord);
    setViewLevel('hex-zoom');
  }, []);

  const handleLocationDoubleClick = useCallback((locationId: string) => {
    setFocusedLocationId(locationId);
    setViewLevel('location');
  }, []);

  const handleBackToWorld = useCallback(() => {
    setViewLevel('world');
    setFocusedHex(null);
    setFocusedLocationId(null);
  }, []);

  const handleBackToHex = useCallback(() => {
    setViewLevel('hex-zoom');
    setFocusedLocationId(null);
  }, []);

  const handleLocationClick = useCallback((_locationId: string) => {
    // Currently no-op for single click
  }, []);

  const handleAvatarMoveClick = useCallback(() => {
    setMoveMode(prev => !prev);
  }, []);

  const handleCenterOnAvatar = useCallback(() => {
    if (avatarPos && hexMapRef.current) {
      hexMapRef.current.centerOn(avatarPos.col, avatarPos.row);
    }
  }, [avatarPos, hexMapRef]);

  const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
    if (moveMode) {
      setGameState(prev => {
        const result = moveAvatarToHex(prev, coord.col, coord.row);
        const losSources = collectLOSSources(result.graph, result.ascendantId);
        const visibilityMap = recalcVisibility(losSources, result.visibilityMap);
        return { ...result, visibilityMap };
      });
      setMoveMode(false);
    } else {
      handleHexClick(coord);
    }
  }, [moveMode, setGameState, handleHexClick]);

  return {
    viewLevel,
    focusedHex,
    focusedLocationId,
    moveMode,
    hoveredHex,
    selectedHex,
    setHoveredHex,
    handleHexClick,
    handleLocationDoubleClick,
    handleBackToWorld,
    handleBackToHex,
    handleLocationClick,
    handleAvatarMoveClick,
    handleCenterOnAvatar,
    handleHexClickMove,
  };
}
```

**Step 2: Update GameView.tsx**

Replace navigation code with hook call. Remove moveAvatarToHex import.

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Run GameView tests**

Run: `npx vitest run src/components/Game/__tests__/GameView --reporter=verbose 2>&1 | tail -20`
Expected: all tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useViewNavigation.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract useViewNavigation hook from GameView"
```

---

### Task 8: Final cleanup and line count verification

**Files:**
- Modify: `src/components/Game/GameView.tsx` (cleanup unused imports)

**Step 1: Clean up any remaining unused imports in GameView.tsx**

After all extractions, remove any imports that are no longer directly used by the remaining JSX.

**Step 2: Run type-check**

Run: `npx tsc --noEmit`
Expected: clean

**Step 3: Run full test suite (targeted)**

Run: `npx vitest run src/components/Game/ src/engine/ --reporter=verbose 2>&1 | tail -30`
Expected: all tests PASS

**Step 4: Verify line count**

Run: `wc -l src/components/Game/GameView.tsx`
Expected: ≤ 300 lines

Run: `wc -l src/components/Game/hooks/*.ts`
Expected: 6 files, total ~500 lines

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "refactor: final cleanup — GameView decomposition complete"
```
