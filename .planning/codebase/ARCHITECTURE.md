# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** State machine-driven tick loop orchestrator with a flat, immutable game state.

**Key Characteristics:**
- Single source of truth: `GameState` interface containing all world state in one flat structure
- Pure functions for each tick phase: take state pieces in, return partial updates out
- World graph (nodes + edges) as the central data structure for all entity relationships
- React hooks for UI state management, using game state from simulation hook
- Three.js rendering for hex map (HexMapV2) without React wrappers

## Layers

**Game State & Graph:**
- Purpose: Define and manage the complete game state and world graph structure
- Location: `src/types/gameState.ts`, `src/types/graph.ts`, `src/engine/graph.ts`
- Contains: Flat state interface, node/edge types, graph query functions
- Depends on: Type definitions across `src/types/`
- Used by: Orchestrator, all engine phases, UI hooks

**Orchestrator (Tick Loop):**
- Purpose: Coordinate the execution of all tick phases in sequence, merge phase updates
- Location: `src/engine/orchestrator.ts`
- Contains: `runTick()` function, phase sequencing, decision cache management
- Depends on: All phase functions, encounter cache, distance matrix
- Used by: `useSimulation` hook, headless CLI

**Engine Phases (202 modules):**
- Purpose: Pure functions implementing discrete game logic: agent decisions, encounters, economy, dome, etc.
- Location: `src/engine/*.ts` (one file per phase or system)
- Contains: Phase functions (`phase*`, or domain functions like `resolveEncounter`)
- Depends on: Graph, game state, constants from `src/data/`
- Used by: Orchestrator during tick execution

**Data & Constants:**
- Purpose: Content, configurations, tunable numbers, and lookup tables
- Location: `src/data/` (50+ files)
- Contains: Encounter templates, action templates, narrative content, archetype data, constants
- Depends on: Type definitions
- Used by: Engine phases, UI components, initialization

**UI Components:**
- Purpose: React components rendering game state, handling user input
- Location: `src/components/` (organized by feature: Game/, HexMapV2/, CMS/, etc.)
- Contains: Functional components with hooks, modals, panels, debug views
- Depends on: Game state from hooks, engine functions, d3/Three.js for rendering
- Used by: App.tsx, GameView.tsx

**UI Hooks:**
- Purpose: Encapsulate game state synchronization, event handling, local UI state
- Location: `src/components/Game/hooks/`, `src/components/HexMapV2/hooks/`
- Contains: `useSimulation`, `useAvatarData`, `useViewNavigation`, etc.
- Depends on: Game state, engine functions
- Used by: UI components

**Rendering (HexMapV2):**
- Purpose: Three.js-based hex grid visualization with scene layers
- Location: `src/components/HexMapV2/` (15-layer architecture: terrain, water, locations, agents, etc.)
- Contains: Scene management, camera, interaction, signifier meshes, palette
- Depends on: Three.js, d3-zoom, hex math utilities
- Used by: GameView

**Utilities & Libraries:**
- Purpose: Shared math, PRNG, coordinate systems, hex utilities
- Location: `src/lib/` (8 files)
- Contains: Hex math, seeded PRNG, path finding, noise generation
- Used by: Engine, UI, rendering

## Data Flow

**Initialization → Playing:**

1. `App.tsx` parses URL params (`?view=game`, `?size=medium`, etc.)
2. User clicks "Shape Your Divinity" → `GamePhase` transitions to `selection`
3. User selects ascendant archetype → phase transitions to `playing`
4. `GameView` is mounted, calls `useSimulation`
5. `useSimulation` calls `initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS)`
6. Initial game state is created with graph, tiles, agents, locations, clock

**Playing (Each Tick):**

1. User clicks sim controls (play/pause) or `doTick()` is called by interval
2. `useSimulation.doTick()` calls `runTick(gameState, scryTargetHexes)`
3. Orchestrator runs ~40 phases in sequence (each phase is pure):
   - Phase 1: Advance doom clock (phaseDoom.ts)
   - Phase 2: Encounter progression (phaseEncounterProgressionV2)
   - Phase 3: Agent movement (phaseMovement)
   - ... (37 more phases)
   - Last: Collect events, update tick counter
4. `runTick` returns new `GameState` with updated graph, events, hex mutations, etc.
5. `setGameState(newState)` re-renders `GameView` with new state
6. Components re-render (memoized where possible), new events appear in UI
7. HexMapV2 scene updates via `setSceneData()` from `useAvatarData`, `useAgentInteraction`

**Intervention (Player Action):**

1. User clicks intervention card in ActionDrawer
2. `handleConfirmIntervention()` in `GameView` is called
3. Intervention effect is applied to graph (e.g., add essence, modify agent state)
4. `setGameState()` is called with updated state
5. Next `doTick()` sees the modified state and continues normally

**State Management:**
- Game state is lifted to `GameView` component level (central authority)
- UI hooks pull state and callbacks from `GameView` via props
- Events from each tick are accumulated in `gameState.recentEvents` (rolling buffer, max 100)
- Pending vignettes, notifications, sphere pressures, hex mutations are queued in `GameState` and consumed by phases

## Key Abstractions

**WorldGraph:**
- Purpose: Represents all entities (actors, locations, traits, artifacts, etc.) and relationships
- Examples: `src/engine/graph.ts`, `src/engine/graphQueries.ts`, `src/engine/graphOpExecutor.ts`
- Pattern: Node + Edge graph with typed query methods (`getOutgoingEdges`, `getNode`, etc.)
- Usage: All phases query the graph to find agents, locations, traits; mutations modify graph

**GameState:**
- Purpose: Flat immutable state container holding graph, clock, events, essence, etc.
- Examples: `src/types/gameState.ts` (175+ lines)
- Pattern: Single interface with no methods; phases return `Partial<GameState>` updates
- Usage: Passed through entire orchestrator, re-rendered by UI

**Phase Functions:**
- Purpose: Pure functions implementing one discrete system (encounters, movement, economy, etc.)
- Examples: `phaseMovement(state) → Partial<GameState>`, `phaseAgentDecision(state) → Partial<GameState>`
- Pattern: Input state, output partial updates; orchestrator merges updates
- Usage: Orchestrator calls ~40 phases per tick in sequence

**Tick Events:**
- Purpose: Immutable records of what happened (for UI chronicle, debug, narrative)
- Examples: `src/types/gameState.ts` TickEvent interface (67+ event types)
- Pattern: Events are created by phases, accumulated in state, consumed by UI
- Usage: UI displays events in NarrativeLog, EncounterLog, WorldPulse

**Unified Actions:**
- Purpose: Generalized action system replacing separate encounter/action progress types
- Examples: `src/types/unifiedAction.ts`, `src/engine/unifiedActionResolution.ts`
- Pattern: Template-based actions with steps, resolution, rewards
- Usage: Encounters, quests, crafting all use same resolution pipeline

## Entry Points

**Web (Browser):**
- Location: `src/main.tsx`
- Triggers: Browser loads localhost:5173
- Responsibilities: Mount React app, attach debug bridge, load CSS

**App.tsx:**
- Location: `src/App.tsx`
- Triggers: React mounts
- Responsibilities: Route between start screen, worldgen, selection, and playing views

**GameView.tsx:**
- Location: `src/components/Game/GameView.tsx`
- Triggers: User selects ascendant and enters playing phase
- Responsibilities: Render full game UI (hex map, panels, modals), manage game state, handle all player actions

**useSimulation Hook:**
- Location: `src/components/Game/hooks/useSimulation.ts`
- Triggers: GameView mounts
- Responsibilities: Initialize game state, run ticks, manage play/pause, handle cycle transitions

**Orchestrator.runTick():**
- Location: `src/engine/orchestrator.ts`
- Triggers: Called by `useSimulation.doTick()` each frame
- Responsibilities: Execute all ~40 phases in order, merge updates, validate output

**Headless CLI:**
- Location: `scripts/cli.ts`, invoked via `npm run cli`
- Triggers: User types REPL commands (`tick`, `run`, `agents`, etc.)
- Responsibilities: Initialize game state, run ticks headlessly, inspect state without browser

## Error Handling

**Strategy:** Fail-soft. The tick loop must never crash. Missing data → graceful fallback.

**Patterns:**
- Phases catch and log errors but do not throw (see `tickHealthMonitor.ts`)
- Graph queries return empty arrays/undefined if nodes don't exist, never throw
- Agent/location lookups use optional chaining and fallback to '?' or 0
- Traces are emitted for all failures (for debug inspection)
- `validateTickOutput()` runs post-tick to check for invalid state

## Cross-Cutting Concerns

**Logging:**
- Engine: Traces emitted via `emitTrace()` to in-memory buffer (exported to .tsv for analysis)
- UI: Console.log for debug, never throw errors in event handlers
- Pattern: Every phase with side effects emits a trace record

**Validation:**
- Types: TypeScript strict mode, all types imported from `src/types/`
- Graph: `validateGraphIntegrity()` checks for dangling edges, missing nodes
- Tick output: `validateTickOutput()` checks for NaN, invalid enums, missing required fields

**Authentication:**
- Not applicable (single-player game)

**Determinism:**
- PRNG: Every phase that needs randomness gets a seeded mulberry32 PRNG instance
- Pattern: `const rng = mulberry32(state.seed + state.tick * N + hashString(uniqueKey))`
- Result: Same seed + inputs = same outputs (used for tests, replays, headless testing)

## Performance Notes

- **Hex map rendering:** HexMapV2 uses Three.js InstancedMesh (single draw call for 9.6K hexes)
- **Decision caching:** Agent decisions computed lazily, cached in EncounterCacheManager
- **Distance matrix:** Precomputed once per game, used for encounter awareness, spatial queries
- **Tick time:** Target ~16ms per tick (60 FPS) at normal speed, configurable via speed slider

