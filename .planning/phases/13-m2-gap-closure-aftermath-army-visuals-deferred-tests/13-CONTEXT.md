# Phase 13: M2 Gap Closure — Aftermath, Army Visuals, Deferred Tests - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all M2 implementation gaps from Phase 12 (Conflict & Destruction). Three work streams:
1. **Aftermath engine gaps** — sphere pressure bonus spike + refugee generation trace stub
2. **Deferred test functions** — battleThreadVisibility (7 tests) + siegeRegionalEncounters (6 tests)
3. **HexMapV2 army visual layers** — army sprites, battle indicators, siege indicators

</domain>

<decisions>
## Implementation Decisions

### Aftermath Sphere Pressure
- Apply a small bonus sphere pressure spike to the battle hex after resolution, on top of natural effects (army presence + destruction already shift spheres)
- Multipliers by severity: minor = 1.0, major = 1.5, total = 2.0
- Sphere to pressure: victor faction's dominant sphere (highest score in faction node's sphereAffinity)
- Use existing phaseSpherePressure pipeline — push a SpherePressureEvent to the settlement/hex location node
- Populate trace fields: `spherePressureApplied` with applied values

### Refugee Generation
- Deferred to a later phase — do NOT implement refugee spawning logic
- Log a trace noting "refugees deferred" with count (1 for major, 3 for total) for future implementation
- Populate trace field `refugeeEncountersGenerated: 0` with a comment that this is deferred
- Remove/update the REFUGEE_GENERATION constants to document deferred status

### Battle Thread Visibility (7 tests)
- Fully implement `hasThreadToBattle(ascendantId, battleState)` — check if player's ascendant has thread-of-fate edges to any battle participant
- Fully implement `selectSpotlight(ascendantId, battleState, prng)` — seeded selection of spotlight encounter template from eligible set
- These enable first-person POV narration when the player is connected to a battle participant
- 7 deferred .todo tests in battleThreadVisibility.test.ts define the full contract

### Regional Siege Encounters (6 tests)
- Fully implement `generateRegionalEncounters(state, siegeState, prng)` — scan agents within SIEGE_REGIONAL_ENCOUNTER_RANGE
- Encounter types: call_for_aid (allied agents), smuggle_supplies (Shadow-capable), negotiate_terms (Heart-capable)
- No duplicate encounters per actor per siege; no encounters for actors already in battles
- 6 deferred .todo tests in siegeRegionalEncounters.test.ts define the full contract

### Army Visual Representation
- Faction-colored shield icon using instanced mesh (follow SignifierMesh pattern with InstancedMesh + texture atlas)
- Army size encoded by icon scale: small/medium/large based on army size thresholds
- Distinct from agent dots — armies are shield-shaped, agents are circular
- Register army visual layer in RenderLayers.ts with appropriate Z constant (between agents and signifiers)

### Battle Indicators
- Crossed-swords icon replacing both army icons during active battle
- Pulsing animation (opacity oscillation) to draw attention
- Single visual element per battle (not per army)

### Siege Indicators
- Ring of siege icons around the settlement being sieged
- Faction-colored to match the besieging army
- Settlement hex gets a darkened overlay (reduced opacity filter on terrain)

### Claude's Discretion
- Exact icon artwork/texture atlas layout for army, battle, siege sprites
- Specific animation timing for battle pulse
- Z-ordering values for new render layers
- Internal implementation details for thread visibility graph traversal
- Encounter template IDs and content for regional siege encounters

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/battleAftermath.ts` — applyAftermath function (lines 109-262) where sphere pressure logic goes
- `src/engine/phaseSpherePressure.ts` — sphere pressure resolution pipeline
- `src/engine/phaseControlEffects.ts` — example of pushing sphere pressure events (line ~260)
- `src/engine/__tests__/battleThreadVisibility.test.ts` — 7 .todo tests with full contract
- `src/engine/__tests__/siegeRegionalEncounters.test.ts` — 6 .todo tests with full contract
- `src/components/HexMapV2/scene/AgentSpriteMesh.ts` — sprite rendering pattern (zoom-aware, slot-based positioning)
- `src/components/HexMapV2/scene/SignifierMesh.ts` — instanced mesh + texture atlas pattern
- `src/components/HexMapV2/RenderLayers.ts` — z-ordering and render order management
- `src/components/Game/DebugPanel.tsx` (lines 999-1121) — ArmiesTab already renders army data

### Established Patterns
- InstancedMesh with per-instance UV rect attributes for texture atlas selection (SignifierMesh pattern)
- Zoom-aware visibility toggling (AgentSpriteMesh pattern)
- Graph queries: `graph.getNodesByType('actor').filter(n => n.properties.armyState != null)` for armies
- Battle access: `graph.getNodesByType('actor').filter(n => n.properties.battleState != null)` for battles
- Sphere pressure: collect events then resolve in phaseSpherePressure (existing pipeline)
- PRNG: use seeded random for deterministic encounter selection

### Integration Points
- `applyAftermath()` in battleAftermath.ts — add sphere pressure logic after line 212
- `HexSceneSetup.ts` — register new army/battle/siege meshes in scene initialization
- `RenderLayers.ts` — add ARMY_INDICATOR_Z, BATTLE_INDICATOR_Z, SIEGE_INDICATOR_Z constants
- Encounter templates — may need new templates for regional siege encounters (call_for_aid, smuggle_supplies, negotiate_terms)

</code_context>

<specifics>
## Specific Ideas

- Sphere pressure multipliers should be small (1.0/1.5/2.0) since the natural consequences of winning (army presence + destruction) already shift spheres significantly
- The user specifically noted that armies already push sphere pressure by existing on a hex — the aftermath bonus is just a "cultural shock" spike
- Shield icon for armies should be clearly distinguishable from agent circles at all zoom levels
- Crossed-swords battle indicator should pulse to draw player attention to active conflicts

</specifics>

<deferred>
## Deferred Ideas

- Refugee generation system — full implementation with refugee encounters at neighboring settlements, population effects, sphere contamination. Planned for a future phase.
- Army movement animation (marching along roads)
- Army leader portrait in army sprite
- Siege visual encirclement animation
- M2.5 Monster Encounters (TB-051) — entirely separate phase needed

</deferred>
