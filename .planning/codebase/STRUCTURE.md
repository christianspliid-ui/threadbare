# Codebase Structure

**Analysis Date:** 2026-03-30

## Directory Layout

```
TheFantasyWorldSimulator/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component (routing: start, worldgen, selection, playing)
│   ├── index.css                # Global styles, CSS variables, Tailwind
│   ├── debug-bridge.ts          # Dev-only API exposed on window.__DEBUG
│   ├── debug-bridge.d.ts        # Types for debug bridge
│   │
│   ├── types/                   # TypeScript interfaces (50+ files, ~5K LOC)
│   │   ├── index.ts             # Re-exports all type definitions
│   │   ├── gameState.ts         # Game state interface + TickEvent types
│   │   ├── graph.ts             # GraphNode, GraphEdge, EdgeType, NodeType
│   │   ├── agent.ts             # Agent properties and metadata
│   │   ├── encounter.ts         # Encounter template and progress types
│   │   ├── influence.ts         # Ascendant, essence, spheres, threads
│   │   ├── faction.ts           # Faction types and state
│   │   ├── narrative.ts         # Prose, events, narrative context
│   │   ├── disposition.ts       # Relationships, reputation, dilemmas
│   │   ├── movement.ts          # Movement path, hex cost types
│   │   ├── visibility.ts        # FOW, visibility state
│   │   └── [30+ other domain files]
│   │
│   ├── engine/                  # Pure game logic (202 modules, ~15K LOC)
│   │   ├── orchestrator.ts      # Main tick loop coordinator
│   │   ├── graph.ts             # Graph implementation + query methods
│   │   ├── phaseDoom.ts         # Doom clock advancement phase
│   │   ├── phaseMandate.ts      # Mandate tracking phase
│   │   ├── phaseMovement.ts     # Agent movement resolution
│   │   ├── phaseAgentDecision.ts # Agent decision-making + action selection
│   │   ├── encounter.ts         # Encounter resolution core
│   │   ├── encounterVisibility.ts # Encounter awareness computation
│   │   ├── unifiedActionResolution.ts # Action step progression
│   │   ├── factionOutcome.ts    # Faction join/rank outcomes
│   │   ├── armyMovement.ts      # Army troop movement
│   │   ├── battleResolution.ts  # Battle detection + resolution
│   │   ├── journeyEngine.ts     # Character journey vignettes
│   │   ├── lairEscalation.ts    # Lair escalation mechanic
│   │   ├── visibility.ts        # Fog of war computation
│   │   ├── proseComposer.ts     # Narrative prose generation
│   │   ├── retinue.ts           # Player's retinue management
│   │   ├── intervenetion*.ts    # 8 intervention effect modules
│   │   ├── phase*.ts            # 40 phase functions (hex state, unrest, prosperity, etc.)
│   │   │
│   │   ├── worldgen/            # World generation (9 modules)
│   │   │   ├── index.ts         # Main generateWorld() entry point
│   │   │   ├── passes/          # 8 generation passes (climate, vegetation, culture, etc.)
│   │   │   └── [other passes]
│   │   │
│   │   ├── terrainPipeline/     # Terrain rendering pipeline (7 modules)
│   │   │   ├── coastline generation
│   │   │   ├── lake depression filling
│   │   │   └── [other terrain]
│   │   │
│   │   └── __tests__/           # Engine contract tests
│   │       ├── contracts/       # Contract test patterns
│   │       └── [other test files]
│   │
│   ├── data/                    # Content, constants, templates (50+ files, ~3K LOC)
│   │   ├── encounter-content.ts         # All encounter templates
│   │   ├── unified-action-templates.ts  # Action template library
│   │   ├── mandate-content.ts           # Mandate definitions
│   │   ├── rival-content.ts             # Rival behavior templates
│   │   ├── archetype-content.ts         # Ascendant archetypes
│   │   ├── agent-behavior-constants.ts  # Decision thresholds, weights
│   │   ├── narrative-content.ts         # Prose templates, pools
│   │   ├── portrait-assets.ts           # Agent portrait URL mapping
│   │   ├── ambition-templates.ts        # Ambition definitions
│   │   └── [30+ more domain files]
│   │
│   ├── components/              # React UI components (50+ modules, ~5K LOC)
│   │   ├── App.tsx              # (moved to src/App.tsx, here for reference)
│   │   │
│   │   ├── Game/                # Main game view and panels
│   │   │   ├── GameView.tsx     # Root game component (700+ LOC)
│   │   │   ├── DebugPanel.tsx   # Inspector + trace viewer
│   │   │   ├── ActionDrawer.tsx # Intervention card system
│   │   │   ├── EssencePanel.tsx # Essence display + essence pool
│   │   │   ├── DoomBar.tsx      # Doom clock progress bar
│   │   │   ├── NarrativeLog.tsx # Event log viewer
│   │   │   ├── RetinuePanel.tsx # Companion list
│   │   │   ├── RivalPanel.tsx   # Rivals overview
│   │   │   ├── AgentInfoCard.tsx # Agent detail card
│   │   │   ├── HexBreadcrumb.tsx # Location navigation
│   │   │   ├── HexSidebar.tsx   # Hex sidebar (locations, POIs)
│   │   │   ├── LocationView.tsx # Single location detail view
│   │   │   ├── MeetingEncounterModal.tsx # Meeting encounter flow
│   │   │   ├── TieredEncounterModal.tsx # Courtly encounter flow
│   │   │   ├── JourneyVignetteModal.tsx # Journey vignette display
│   │   │   ├── InterventionConfirm.tsx # Confirm intervention modal
│   │   │   ├── ScryOverlay.tsx  # Scrying visualization
│   │   │   ├── EventPopup.tsx   # Event notification popup
│   │   │   ├── ToastStack.tsx   # Toast notification system
│   │   │   ├── AlertBar.tsx     # Top alert bar (events, states)
│   │   │   ├── AvatarHUD.tsx    # Avatar health, status, position
│   │   │   │
│   │   │   ├── hooks/           # Game-specific hooks
│   │   │   │   ├── useSimulation.ts   # Tick loop, play/pause, state init
│   │   │   │   ├── useAvatarData.ts   # Avatar position, visibility, render data
│   │   │   │   ├── useViewNavigation.ts # Hex/location selection, zoom
│   │   │   │   ├── useAgentInteraction.ts # Agent selection, actions
│   │   │   │   ├── useScry.ts         # Scrying state management
│   │   │   │   ├── useNotifications.ts # Event notifications
│   │   │   │   └── [other hooks]
│   │   │   │
│   │   │   ├── chronicle/       # Chronicle card components
│   │   │   │   ├── AgentEntry.tsx
│   │   │   │   ├── LocationCard.tsx
│   │   │   │   └── [other cards]
│   │   │   │
│   │   │   ├── debug/           # Debug visualization components
│   │   │   │   ├── RelationshipGraph.tsx # Bond visualization
│   │   │   │   ├── DecisionBreakdown.tsx # Agent decision trace
│   │   │   │   └── [other debug]
│   │   │   │
│   │   │   ├── contexts/        # React context providers
│   │   │   │   └── ScryContext.tsx     # Scrying state context
│   │   │   │
│   │   │   └── __tests__/       # GameView and component tests
│   │   │
│   │   ├── HexMapV2/            # Three.js hex map renderer (280 LOC)
│   │   │   ├── HexMapV2.tsx     # Root renderer component
│   │   │   ├── HexV2View.tsx    # Full-screen hex view (dev mode)
│   │   │   │
│   │   │   ├── scene/           # Three.js scene layers
│   │   │   │   ├── HexFillMesh.ts      # Terrain hex fill (layer 1)
│   │   │   │   ├── CoastlineMesh.ts    # Coastline overlay (layer 2)
│   │   │   │   ├── LocationIconMesh.ts # Location icons (layer 4)
│   │   │   │   ├── AgentSpriteMesh.ts  # Agent sprites (layer 5)
│   │   │   │   ├── MovementTrailMesh.ts # Movement prediction (layer 6)
│   │   │   │   ├── FogOfWarMesh.ts     # FOW overlay (layer 7)
│   │   │   │   ├── SignifierMesh.ts    # Encounter/threat signifiers (layer 8)
│   │   │   │   ├── ArmySpriteMesh.ts   # Army indicators (layer 9)
│   │   │   │   ├── BattleIndicatorMesh.ts # Battle markers (layer 10)
│   │   │   │   └── [3+ more layers]
│   │   │   │
│   │   │   ├── camera/          # Camera control + zoom
│   │   │   │   └── d3ZoomAdapter.ts
│   │   │   │
│   │   │   ├── interaction/     # Mouse/click handling
│   │   │   │   └── [interaction modules]
│   │   │   │
│   │   │   ├── agents/          # Agent rendering data builders
│   │   │   │   └── agentSpriteTypes.ts
│   │   │   │
│   │   │   ├── signifiers/      # Encounter signifier layers
│   │   │   │   └── [signifier types]
│   │   │   │
│   │   │   ├── palette/         # Color + texture palette
│   │   │   │   ├── textureAtlas.ts
│   │   │   │   └── [palette modules]
│   │   │   │
│   │   │   ├── diagnostics/     # Perf monitoring
│   │   │   │
│   │   │   └── __tests__/       # HexMapV2 tests
│   │   │
│   │   ├── StartPage/           # Game introduction screen
│   │   │   └── StartPage.tsx
│   │   │
│   │   ├── Ascendant/           # Ascendant selection
│   │   │   ├── AscendantSelection.tsx # Archetype picker
│   │   │   └── ArchetypeCard.tsx
│   │   │
│   │   ├── Cosmology/           # World generation cosmology panel
│   │   │   ├── CosmologyPanel.tsx
│   │   │   └── SphereSlider.tsx
│   │   │
│   │   ├── CMS/                 # Content browser
│   │   │   ├── ContentBrowser.tsx
│   │   │   ├── CMSMainPanel.tsx
│   │   │   ├── viewers/         # Specialized viewers (record, tree, prose, etc.)
│   │   │   └── [other CMS]
│   │   │
│   │   ├── UI/                  # Shared UI primitives
│   │   │   ├── Modal.tsx        # Modal dialog wrapper
│   │   │   ├── InfoPanel.tsx    # Tile/entity info display
│   │   │   ├── MagicGlowTiles.tsx # Glow tile preview (dev)
│   │   │   └── [other primitives]
│   │   │
│   │   ├── shared/              # Shared components
│   │   │   ├── GameErrorBoundary.tsx # Error handling wrapper
│   │   │   ├── IconButton.tsx
│   │   │   ├── AnimateMount.tsx # Framer Motion wrapper
│   │   │   └── [other shared]
│   │   │
│   │   └── TaxonomyViewer/      # Taxonomy browser (unused in game)
│   │
│   ├── lib/                     # Utility functions (8 modules)
│   │   ├── hexMath.ts           # Hex coordinate math (hex to pixel, distance, etc.)
│   │   ├── hexKey.ts            # Hex key generation for maps
│   │   ├── prng.ts              # Seeded mulberry32 PRNG
│   │   ├── simplexNoise.ts      # 2D noise generation
│   │   ├── movementPath.ts      # Pathfinding and movement
│   │   ├── worldPosition.ts     # World position utilities
│   │   ├── hexGrouping.ts       # Hex region grouping
│   │   ├── polygonLayout.ts     # Polygon grid layout
│   │   └── __tests__/           # Utility tests
│   │
│   ├── services/                # Domain-specific services (narration)
│   │   └── narration/           # Prose/narrative services
│   │       └── [narration modules]
│   │
│   ├── audio/                   # Audio playback
│   │   └── themeAudio.ts        # Background music control
│   │
│   ├── assets/                  # Static assets (images, etc.)
│   │
│   └── __tests__/               # App-level tests
│       ├── App.test.tsx
│       └── engine/              # Engine contract tests
│
├── scripts/                     # Build and utility scripts
│   ├── cli.ts                   # Headless REPL for game testing
│   ├── generate-vault.ts        # Obsidian vault generation from world-model.json
│   ├── validate-world-model.ts  # World model validation
│   ├── generate-hex-tile.py     # Hex tile image generation (Python)
│   └── [other scripts]
│
├── Docs/                        # Implementation documentation
│   ├── plans/                   # Design docs per phase
│   │   ├── YYYY-MM-DD-*.md      # Phase design documents
│   │   └── wiring-checklist.md  # Integration verification checklist
│   ├── design-system/           # UI/styling documentation
│   ├── impediments.md           # Blockers and workarounds
│   ├── changelog.md             # Historical changes
│   └── [other docs]
│
├── .planning/                   # Coordination files (Cowork)
│   ├── BACKLOG.md               # Current sprint backlog
│   ├── BACKLOG_HISTORY.md       # Completed items
│   ├── ROADMAP.md               # Milestone roadmap
│   ├── HANDOVER.md              # Handoff notes
│   └── codebase/                # GSD codebase analysis (this file)
│
├── .claude/                     # Claude agent configuration
│   ├── skills/                  # Domain-specific skills
│   ├── agents/                  # Agent definitions
│   └── settings.local.json      # Local settings
│
├── vite.config.ts              # Vite configuration (TypeScript)
├── tsconfig.json               # TypeScript configuration (strict mode)
├── tailwind.config.js          # Tailwind CSS configuration
├── eslint.config.js            # ESLint configuration
├── vitest.config.ts            # Vitest test runner config
├── CLAUDE.md                   # Project instructions (this file)
├── index.html                  # HTML entry point
├── package.json                # Dependencies, scripts, metadata
├── package-lock.json           # Lockfile
└── world-model.json            # Game content model (Obsidian vault source)
```

## Directory Purposes

**src/types/:**
- Purpose: All TypeScript interfaces, types, and enums
- Contains: 50+ files covering game state, entities, events, constants
- Key files: `gameState.ts`, `graph.ts`, `index.ts` (re-export)

**src/engine/:**
- Purpose: Pure game logic and simulation
- Contains: Orchestrator, 202 phase/domain functions, graph implementation
- Pattern: One concern per file (encounters, movement, economy, etc.)
- Key files: `orchestrator.ts`, `graph.ts`, `phaseMovement.ts`, `phaseAgentDecision.ts`

**src/data/:**
- Purpose: Game content, templates, constants
- Contains: 50+ files with encounter/action/mandate/rival/narrative definitions
- Pattern: One domain per file (encounters, agents, archetypes, etc.)
- Key files: `encounter-content.ts`, `unified-action-templates.ts`, `narrative-content.ts`

**src/components/Game/:**
- Purpose: Main gameplay UI
- Contains: GameView, panels, modals, hooks, debug components
- Pattern: Components are feature-scoped (EssencePanel, RetinuePanel, etc.)
- Key files: `GameView.tsx`, `hooks/useSimulation.ts`, `DebugPanel.tsx`

**src/components/HexMapV2/:**
- Purpose: Three.js hex map rendering
- Contains: 15-layer scene architecture, camera, interaction
- Pattern: One mesh/layer per file (HexFillMesh, AgentSpriteMesh, etc.)
- Key files: `HexMapV2.tsx`, `scene/HexFillMesh.ts`, `camera/d3ZoomAdapter.ts`

**src/lib/:**
- Purpose: Reusable utilities
- Contains: Hex math, PRNG, pathfinding, coordinate systems
- Key files: `hexMath.ts`, `prng.ts`, `movementPath.ts`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app mount
- `src/App.tsx`: Routing and phase selection
- `src/components/Game/GameView.tsx`: Main game view
- `scripts/cli.ts`: Headless CLI entry

**Configuration:**
- `vite.config.ts`: Build configuration
- `tsconfig.json`: TypeScript settings (strict mode enabled)
- `tailwind.config.js`: CSS utility framework
- `eslint.config.js`: Linting rules
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/engine/orchestrator.ts`: Tick loop coordinator
- `src/engine/graph.ts`: Graph implementation and queries
- `src/types/gameState.ts`: Game state interface
- `src/components/Game/hooks/useSimulation.ts`: Simulation hook

**Testing:**
- `src/__tests__/engine/`: Engine contract tests
- `src/components/**/__tests__/`: Component tests
- `vitest.config.ts`: Test runner configuration

## Naming Conventions

**Files:**
- Engine modules: `camelCase.ts` (one concern per file)
  - Phases: `phase*.ts` (e.g., `phaseMovement.ts`, `phaseDoom.ts`)
  - Domains: `*Engine.ts`, `*Resolution.ts`, `*Mechanics.ts`
  - Data queries: `graphQueries.ts`, `visibility.ts`
- Components: `PascalCase.tsx` (one component per file, usually)
  - Hooks: `use*.ts` (e.g., `useSimulation.ts`, `useAvatarData.ts`)
  - Containers: `*View.tsx`, `*Panel.tsx`, `*Modal.tsx`
- Data: `kebab-case.ts` with `-content` or `-constants` suffix
  - Content: `encounter-content.ts`, `narrative-content.ts`
  - Constants: `agent-behavior-constants.ts`
- Tests: `*.test.ts`, `*.test.tsx` (colocated with source)

**Directories:**
- Domain feature areas: kebab-case (e.g., `HexMapV2/`, `Game/`, `StartPage/`)
- Utility collections: lowercase (e.g., `lib/`, `types/`, `data/`, `components/`)
- Functional groupings: kebab-case (e.g., `__tests__/`, `hooks/`, `chronicle/`, `debug/`)

**Types & Interfaces:**
- Entities: `XyzNode`, `XyzState`, `XyzDefinition` (e.g., `AgentNode`, `EncounterState`)
- Events: `XyzEvent` (e.g., `TickEvent`, `NarrativeEvent`)
- Results: `XyzResult`, `XyzOutcome` (e.g., `EncounterOutcome`)
- Utility: lowercase/camelCase for simple types (e.g., `HexCoord`, `SphereName`)

**Constants:**
- SCREAMING_SNAKE_CASE in `data/` files (e.g., `MAX_ESSENCE`, `STEALTH_DECAY_PER_TICK`)
- Defined at module level, never magic numbers
- Grouped by concern in one place per file

## Where to Add New Code

**New Engine Feature:**
1. Define types in `src/types/` (e.g., `myFeature.ts`)
2. Create engine phase(s) in `src/engine/` (e.g., `phaseMyFeature.ts`)
3. Add to orchestrator sequence in `src/engine/orchestrator.ts`
4. Add content templates in `src/data/` if needed
5. Write contract tests in `src/__tests__/engine/contracts/`
6. Update wiring checklist in `Docs/plans/wiring-checklist.md`

**New UI Component:**
1. Create component in `src/components/Game/` or domain folder (e.g., `MyPanel.tsx`)
2. Create hooks in `src/components/Game/hooks/` if needed (e.g., `useMyPanel.ts`)
3. Add to GameView.tsx (render and pass state/callbacks)
4. Write tests colocated: `src/components/Game/__tests__/MyPanel.test.tsx`
5. Update `Docs/plans/wiring-checklist.md` if adding new GameState field

**New Data/Content:**
1. Create file in `src/data/` (e.g., `my-content.ts`)
2. Export templates/constants
3. Import and use in engine phases or initialization
4. Add validation if schema is complex

**Utilities:**
1. Simple: Add to nearest existing utility file in `src/lib/` (e.g., `hexMath.ts`)
2. Complex: Create new file in `src/lib/` (e.g., `myUtil.ts`)
3. Tests: Colocate in `src/lib/__tests__/myUtil.test.ts`

## Special Directories

**src/__tests__/engine/contracts/:**
- Purpose: Contract tests for engine phases (cross-phase integration verification)
- Generated: No (hand-written)
- Committed: Yes (source of truth for engine behavior)
- Pattern: One test per phase or cross-phase interaction

**src/components/Game/debug/:**
- Purpose: Debug-only visualization components
- Generated: No
- Committed: Yes (always available, hidden by default)
- Pattern: Components that expose internal state (RelationshipGraph, DecisionBreakdown, etc.)

**Docs/plans/:**
- Purpose: Phase design documents
- Generated: No (hand-written, one per phase)
- Committed: Yes (full design + NFP compliance per phase)
- Pattern: YYYY-MM-DD-topic.md with sections for design, NFP compliance, wiring, constants

**.planning/codebase/:**
- Purpose: GSD codebase analysis (this file)
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes (consumed by `/gsd:plan-phase` and `/gsd:execute-phase`)
- Pattern: ARCHITECTURE.md, STRUCTURE.md (this file), CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**world-model.json:**
- Purpose: Game content model (source of truth for Obsidian vault)
- Generated: No (hand-edited)
- Committed: Yes (part of repo)
- Pattern: JSON structure mirroring Obsidian Index structure

