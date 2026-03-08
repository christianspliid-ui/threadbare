# GameView.tsx Decomposition — Design Document

> Extracts 6 custom hooks from the 791-line GameView component to reduce complexity while preserving behavior.

## Problem Statement

GameView.tsx is a monolithic component with 68 React hooks (22 useState, 17 useMemo, 25 useCallback, 3 useEffect, 2 useRef). It manages simulation state, UI navigation, agent interaction, hex zoom, avatar, intervention flow, scry, debug panel, and layout — all in one file. Adding features requires touching this file, and the cognitive load of understanding all the interleaved concerns is high.

## Decision: Custom Hooks Extraction

**Chosen approach:** Extract 6 custom hooks that encapsulate logically grouped state + handlers. GameView keeps its JSX layout but delegates all state management to hooks.

**Why this over alternatives:**
- **vs. Layout sub-components:** Splitting JSX into `<LeftSidebar>` etc. still requires passing 40+ props. The state complexity is the real problem, not the JSX structure.
- **vs. Context/Provider:** Overkill for a single-consumer component. Adds indirection without benefit. We can always add context later if we get multiple consumers.
- **Risk profile:** No new components, no changed props flow, no changed render tree. Purely moving code behind hook boundaries. Every test should pass unchanged.

## Hook Boundaries

### 1. `useSimulation` (~80 lines)
**State:** gameState, tiles, running, speed, harvestResult
**Handlers:** doTick, handleBeginNextCycle, handleToggleRunning, setSpeed
**Effects:** auto-play interval, twilight phase transition
**Refs:** intervalRef
**Exports:** All of the above + seasonName, year, maxEssence

### 2. `useViewNavigation` (~60 lines)
**State:** viewLevel, focusedHex, focusedLocationId, moveMode, hoveredHex, selectedHex
**Handlers:** handleHexClick, handleLocationDoubleClick, handleBackToWorld, handleBackToHex, handleLocationClick, handleHexClickMove, handleAvatarMoveClick
**Dependencies:** needs gameState (for moveAvatarToHex), hexMapRef

### 3. `useAgentInteraction` (~120 lines)
**State:** selectedAgentId, wheelVisible, wheelFeedback, strandViewAgent, pendingIntervention
**Handlers:** handleAgentSelect, handleWheelSlotClick, handleInterventionConfirm, handleInterventionCancel, handleWheelDismiss, handleStrandClose, handleOpenWheel, handleViewPsyche, handleBackFromAgentDetail, handleAvatarWheelClick
**Computed:** agentDetail, wheelSlots, retinueAgents
**Dependencies:** needs gameState, archetype, setGameState (for intervention execution)

### 4. `useScry` (~50 lines)
**State:** scryState, scryVisible
**Handlers:** handleOpenScry, handleScryAssign, handleScryDemote, handleCloseScry, handleAvatarScryClick
**Dependencies:** needs gameState, archetype, retinueAgents

### 5. `useHexZoomData` (~50 lines)
**Computed (all useMemo):** hexLocations, hexAgentsByLocation, hexConnections, hexSphereInfluence, hexLineOfSight, hexTotalAgents, focusedLocation, focusedLocationAgents
**Dependencies:** needs gameState.graph, gameState.ascendantId, focusedHex, focusedLocationId

### 6. `useAvatarData` (~40 lines)
**Computed (all useMemo):** avatarPos, sphereColor, locationOverlays, avatarPixelPos
**Dependencies:** needs gameState.graph, gameState.ascendantId, archetype
**Also:** debugPanelOpen state, handleToggleDebug, handleCenterOnAvatar (uses hexMapRef)

### After extraction: GameView (~250 lines)
Just hook calls, derived values, and JSX layout. The file becomes a readable "what renders where" with all "how it works" delegated to hooks.

## Hook Interdependencies

```
useSimulation ← (standalone, provides gameState)
     ↓
useAvatarData ← gameState.graph, archetype
useHexZoomData ← gameState.graph, focusedHex/LocationId (from useViewNavigation)
useViewNavigation ← gameState, hexMapRef
useAgentInteraction ← gameState, archetype, setGameState
useScry ← gameState, archetype, retinueAgents (from useAgentInteraction)
```

The dependency graph is a DAG with useSimulation at the root. Hooks communicate through their return values — no shared mutable state.

## File Structure

All hooks go in `src/components/Game/hooks/`:
```
hooks/
  useSimulation.ts
  useViewNavigation.ts
  useAgentInteraction.ts
  useScry.ts
  useHexZoomData.ts
  useAvatarData.ts
```

## Testing Strategy

- **Existing GameView tests should pass unchanged** — the render tree and user-facing behavior don't change.
- **New hook tests** using `renderHook` from `@testing-library/react` — test each hook in isolation with mock gameState.
- **No snapshot tests** — behavioral tests only.

## Success Criteria

1. GameView.tsx ≤ 300 lines
2. All existing GameView tests pass unchanged
3. Each hook is in its own file with clear input/output types
4. No new React context or providers introduced
5. Type-check passes clean
