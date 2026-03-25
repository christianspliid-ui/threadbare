# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.
>
> **IMPORTANT:** When you complete a handover entry, you MUST also update the item's state in `.planning/BACKLOG.md` to `✅`. BACKLOG.md is the single source of truth — see `Docs/cowork-ways-of-working.md` → "Unified Kanban".

---

### 2026-03-25: HexMapV2 Medium-Term Improvements (TB-016)

**Context:** Architectural review identified three medium-effort refactors with high payoff. Design doc has full interface specs, shader code, and fail-soft tables. Quick wins (typed layer keys, Z centralization, D3ZoomCamera constants) already completed in prior session.

**Prerequisite:** TB-030 (Agent Sprite Scale Bug + Zoom Threshold Unification) should land before item 3 — it rewrites `updateZoomVisibility` and stores `baseScale` in `userData`.

**Implementation order:** Ship each independently. Do them in this order:

**Item 1 — Extract custom hooks from HexMapV2.tsx:**
1. Create `src/components/HexMapV2/hooks/useAgentAnimations.ts` — move lines 980–1123 (the `agents` useEffect) into a hook. Interface spec in design doc.
2. Create `src/components/HexMapV2/hooks/useFogCulling.ts` — move lines 871–951 (the fog update useEffect). Interface spec in design doc.
3. Create `src/components/HexMapV2/hooks/useZoomLayerVisibility.ts` — extract the zoom tier change handler from scene init. Make `zoomTier` a React state variable updated by d3 zoom handler; hook runs useEffect on tier changes.
4. Update HexMapV2.tsx to call the three hooks, passing refs. Target: ~600–700 lines post-extraction.
5. Tests: unit test per hook (mock refs, verify effect runs), contract test for animation output → `updateAgentPositions` input.
6. Visual verification at `?view=game` across all zoom tiers.

**Item 2 — Single agent sprite with material swap (after TB-030):**
1. Rewrite `AgentSpriteGroup` interface — one `sprite` per agent instead of `portrait + dot + continental`. Pre-build all three materials and scale values, store in `spriteMap` entry.
2. Rewrite `updateZoomVisibility` — on tier change, swap `sprite.material` and `sprite.scale.setScalar()` based on `ZOOM_VISIBILITY_MATRIX`. Instant swap, no cross-fade.
3. Update `sprite.userData.baseScale` on zoom swap so settle bounce uses correct multiplier.
4. Update `loadAgentPortraits` — update `materials.portrait` and `materials.dot` objects (shared by reference).
5. Update `updateAgentPositions` — single sprite positioning instead of three.
6. Update animation wiring in HexMapV2.tsx (or `useAgentAnimations` if item 1 landed first).
7. Tests: unit (one sprite per agent), contract (zoom swap → correct material/scale), integration (hop + settle + zoom out).
8. Visual verification at `?view=game` with agents in motion across zoom tiers.

**Item 3 — Signifier sprites → InstancedMesh with texture atlas:**
1. Create `buildSignifierAtlas()` — builds one texture atlas per terrain type from the signifier registry. Layout: variants side by side, 2px padding.
2. Create custom `ShaderMaterial` — vertex shader reads per-instance UV rect attribute (`aUvRect` vec4), fragment shader samples atlas with transparency discard.
3. Add per-instance `aFogAlpha` float attribute for fog culling (1.0 visible, 0.0 hidden, 0.45 explored).
4. Rewrite `createSignifierMesh` internals — same signature, but creates one `InstancedMesh` per terrain type instead of N sprites. Jitter + rotation encoded in instance matrix.
5. Update `useFogCulling` (or the fog effect) to write `aFogAlpha` buffer instead of toggling sprite visibility.
6. Tests: unit (correct instanceCount per terrain type, instance positions match hexToWorld + jitter), performance (draw call count comparison).
7. Visual verification at `?view=game` at regional zoom — signifiers should look identical to current sprites.

**Design doc:** `Docs/plans/2026-03-25-hexmapv2-medium-term-improvements.md`

---

### 2026-03-25: Agent Spawn Integrity Fixes (TB-030)

**Context:** Assessment + follow-up code audit found six defects in agent creation and tick-loop handling. One is critical: **births are completely broken** due to a wrong edge-type query.

**Action items (in execution order):**
1. **CRITICAL — Fix birth edge-type bug:** `agentLifecycle.ts` line 135 queries `getIncomingEdges(locId, 'contains')` but `contains` edges are region→location, not location→agent. Replace with `getIncomingEdges(locId, 'located_at')`. Births never trigger without this fix.
2. **Fix born agent axiological profiles:** Replace `axiologicalProfile: {}` (line 170) with `generateAxiologicalProfile(rng, cosmology)`. Get cosmology from `state.cosmology` or World-Soul node.
3. **Verify strategy call:** After #2, ensure `assignCooperationStrategy` (line 162) receives the real profile, not `{} as any`.
4. **Create `src/engine/agentValidation.ts`** with `validateAgentIntegrity()` — checks node integrity, all 10 axiological pairs, all 9 reaches, location binding, identity properties, edge targets, movement state. Call after world seed and after birth events.
5. **Add try-catch per-agent wrapping in `phaseMovement.ts`** matching `phaseAgentDecision`'s pattern.
6. **Null-guard sublocation lookup in `phaseMovement.ts`** — `getNode(sublocationId)` can return null if sublocation dissolved mid-movement.
7. **Add location consistency check to validator** — warn when `properties.locationId` and `located_at` edge disagree.
8. **Fix variant edge types:** Replace `'located_in'` → `'located_at'` in `phaseEconomicChronicle.ts` (2 occurrences), `'relationship'` → `'relates_to'` in `agentDetail.ts`. Add `// RESERVED` comments to unused edge types in `graph.ts`. Check `encounter_at` in `movementCandidates.ts`/`threatRating.ts`.
9. **Tests:** birth triggers with 3+ colocated agents, born agent has full profile, malformed agent doesn't crash movement, validator catches each defect type. Grep for `'located_in'` and `'relationship'` — zero hits in `src/`.

**Plan:** `Docs/plans/2026-03-25-agent-spawn-integrity-fixes.md`

---

### 2026-03-25: Graph Schema Enforcement (TB-033)

**Context:** Recurring bugs from variant/redundant edge types (`contains` vs `located_at`, `relationship` vs `relates_to`, `located_in` vs `located_at`). Root cause: graph has no schema enforcement — edge types are unguarded strings, no canonical query functions, no direction documentation. Full audit found 4 variant types in production, 4 dead types, and 26 total edge strings (vs 22 defined).

**CLAUDE.md already updated** with: edge type governance rule (load-bearing decisions), graph query rule, graph change checklist (pre-commit), graph changes section required in design docs.

**Action items (in execution order):**
1. **Create `src/engine/graphQueries.ts`** — canonical query functions for the 8 most-read edge types (getAgentsAtLocation, getAgentLocation, getFactionMembers, getAgentCultures, getAgentBonds, getAgentTraits, getAgentAmbitions, getAgentWorships, getAvatarsOf, etc.). Unit tests per function.
2. **Create `src/types/edgeSchema.ts`** — `EDGE_SCHEMA` registry: one entry per `EdgeType` with sourceNodeType, targetNodeType, direction, cardinality, requiredProperties, description.
3. **Wire schema into `validateAgentIntegrity()`** (from TB-030) — extend validation to check edge source/target type constraints.
4. **Migrate high-traffic callers** — replace raw edge queries in `agentLifecycle.ts`, `phaseAgentDecision.ts`, `phaseMovement.ts`, `agentDetail.ts`, `phaseEconomicChronicle.ts` with query functions. File-by-file, not big-bang.
5. **Add dev-mode validation to `addEdge`** in `src/engine/graph.ts` — warn on unknown edge types, wrong source/target, missing required properties. Dev-only, warn-not-throw.

**Design doc:** `Docs/plans/2026-03-25-graph-schema-enforcement-design.md`

---

### 2026-03-25: Agent Sprite Scale Bug + Zoom Threshold Unification

**Context:** Agent sprites shrink to ~1 world unit after their first hop animation because the settle bounce in `agentAnimationState.ts` sets absolute scale (1.05→1.0) instead of a multiplier relative to each sprite's base size (9.0 for portraits, 3.0 for dots, 5.0 for continental). Additionally, `AGENT_ZOOM_THRESHOLDS` defines hero-local as k≥5 while `ZOOM_TIER_THRESHOLDS` defines it as k≥15, causing the wrong sprite tier to display. The continental group (retinue dots) is never made visible.

**Action items:**
1. Store base scale in `sprite.userData.baseScale` at creation time in `createAgentSpriteMesh`
2. Rewrite settle phase in `tickAgentAnimations` to use `baseScale * bounceMultiplier` instead of absolute scale
3. Delete `AGENT_ZOOM_THRESHOLDS` from `agentSpriteTypes.ts`
4. Rewrite `updateZoomVisibility` to accept a `ZoomTier` and use `ZOOM_VISIBILITY_MATRIX` entries directly
5. Update call site in `HexMapV2.tsx` line 610 to pass the already-computed tier
6. Add contract test: sprite group structure → animation expectations (baseScale present)
7. Add unit test: full hop + settle cycle preserves sprite base scale
8. Visual verification at `?view=game` across all three zoom tiers after agents move

**Plan:** `Docs/plans/2026-03-25-agent-sprite-scale-and-zoom-fix.md`

---

## Completed

### 2026-03-25: Rendering Module Resilience Refactor (completed 2026-03-25)

Implemented by Claude Code. Shared primitives (hexKey, worldPosition, hexGrouping) extracted to src/lib/, AgentAnimationTarget sprite abstraction layer, isLayerVisible zoom convenience. 31 files, 50+ inline patterns replaced. 3/6 hooks already extracted (TB-016); remaining 3 deferred (tightly coupled with scene init lifecycle).

### 2026-03-25: Attachment Tier Advancement (completed 2026-03-25)

Implemented by Claude Code. 4-tier rarity system, Enchant/Empower action templates, on-use triggers, tag system, detail card UI.

### 2026-03-25: Agreement Creation + HexChronicle bug fix (completed 2026-03-25)

Implemented by Claude Code. Social encounter CRUD templates, bond scoring, agreement node creation, colocation/remote constraints. HexChronicle bug fixed (hexCol/hexRow type coercion).

### 2026-03-23: Start page (completed 2026-03-23)

Implemented by Claude Code. StartPage.tsx, useThemeMusic hook, SettingsModal, CreditsModal, App.tsx phase integration.

### 2026-03-25: Intent Visibility — character sheet (completed 2026-03-25)

Implemented by Claude Code. Agent ambitions surfaced in AgentProfileModal, AgentDetailPanel (IntentSection with category colors, milestone pips, affinity dots), and AgentInfoCard (single-line summary). Knowledge gating structured for future use, prototyped as always-visible. Notification tap-through and pulse animation included.

### 2026-03-25: Road-Aware Agent Movement (completed 2026-03-25)

All action items done:
- Road-aware Dijkstra in `pathfinding.ts` — road edges (both outgoing and incoming) compete with discount multipliers (major 0.4×, trail 0.7×), `RoadSegmentInfo` returned on `PathResult`
- `MovementState` extended with `currentHexPosition`, `roadHexQueue`, `roadHexCost`, `currentRoadType`, `roadSegments`
- Road hex traversal branch in `tickMovement` — hex-by-hex advancement, `located_at` only updates on arrival at location nodes
- `initMovementState` populates road fields from `RoadSegmentInfo`, handles hexPath direction reversal
- Gated re-evaluation in `phaseAgentDecision` — 5-guard system (tick gating, target invalidation, score comparison with 1.5× threshold, action-type guard, reroute trace)
- Animation road mode — `startRoadHopAnimation` (300ms major / 500ms trail), reduced wobble (0.3×), hop chaining without settle bounce until final hex
- `RoadHexTransitionTrace` and `AgentRerouteTrace` trace types added
- Constants: `ROAD_MAJOR_COST_MULTIPLIER`, `ROAD_TRAIL_COST_MULTIPLIER`, `MIN_ROAD_HEX_COST`, `REROUTE_SCORE_MULTIPLIER`, `ROAD_MAJOR_HOP_MS`, `ROAD_TRAIL_HOP_MS`, `ROAD_WOBBLE_FACTOR`

### 2026-03-25: Cross-Boundary Testing Infrastructure (completed 2026-03-25)

All action items done:
- Committed CLAUDE.md testing section, `testing-patterns` skill, BACKLOG.md updates
- Created `src/engine/__tests__/contracts/` directory
- Wrote `MovementTrailMesh.test.ts` (24 tests — trail creation, fade timing, segments, opacity, faction colors, fail-soft)
- Wrote `pathfinding-to-movement.contract.test.ts` (8 tests — no-roads baseline, road produces roadHexQueue, hex-by-hex ticking, mixed road+adjacent, incoming road edges, corrupt road fallback)
- Added 2 movement integration tests to `orchestrator.test.ts`
- Rewrote `movement-integration.test.ts` from `describe.skip` to 6 active tests (queue execution, history accumulation, history capping, tick events, road hex-by-hex, deterministic movement)

### 2026-03-25: HexMapV2 quick wins — consistency & type safety (completed 2026-03-25)

All action items done:
- Added `LAYER_Z` constant block in `RenderLayers.ts` (monotonic with RENDER_ORDER)
- Updated 8 mesh files to import Z positions from `LAYER_Z` instead of local constants
- Added `LAYER_NAMES` const array and `LayerName` type to `ZoomVisibilityMatrix.ts`; typed the matrix as `Record<LayerName, ...>`
- Moved `0.002` (wheel delta) and `0.85` (fit padding) into `CAMERA_CONSTANTS` in `D3ZoomCamera.ts`
- Deleted unused `WATER_TYPES` constant from `ElevationTicks.ts`
- Updated RoadMesh test (Z_OFFSET value changed 0.025→0.030 for monotonic ordering)
- `npx tsc --noEmit` clean, all tests pass (1 pre-existing unrelated failure in AgentDots)

### 2026-03-25: Fixed-slot hex layout (completed 2026-03-25)

All action items done:
- Added `BALANCED_SLOT_INDICES` lookup table and `getFixedSlotOffset()` to `movementPath.ts`
- Added `SLOT_RING_RADIUS`, `VERTEX_ANGLES_DEG`, `EDGE_MID_ANGLES_DEG` to `agent-visual-content.ts`; deprecated `LOCATION_RING_ROTATION_DEG`
- Updated `AgentSpriteMesh.ts`: `getFixedSlotOffset` with `EDGE_MID_ANGLES_DEG` (both create and update functions)
- Updated `LocationIconMesh.ts`: `getFixedSlotOffset` with `VERTEX_ANGLES_DEG`; removed rotation offset logic
- Updated `HexMapV2.tsx`: animation bezier endpoints and trail location offsets use `getFixedSlotOffset`
- 14 unit tests for `getFixedSlotOffset` (angles, balanced distribution 1-6, edge cases, determinism, no agent/location overlap)
- Visual verification pending (user must run `npm run dev` and check `?view=game`)

### 2026-03-23: Kokoro TTS narration prototype (completed 2026-03-23)

All action items done:
- Installed kokoro-js (v1.2.1) — 82M param model, Apache 2.0, client-side WASM
- Created `src/services/narration/` with 4 files: narrationConstants.ts, NarrationWorker.ts, NarrationService.ts, useNarration.ts
- NarrationWorker runs kokoro-js inference in Web Worker (off main thread)
- NarrationService wraps worker with AudioContext playback, singleton pattern
- useNarration React hook with useSyncExternalStore for zero-re-render subscriptions
- HexChronicle: narrate button in hero section with icon states (Volume2 → Loader2 spinner → Square stop)
- Auto-stops narration on hex change
- Feature flag off by default (NARRATION_ENABLED = false)
- All 5798 tests pass, build succeeds, type-check clean

### 2026-03-23: Rename game title from "Threadbare" to "Threadbearer" (completed 2026-03-23)

All action items done:
- Changed START_PAGE_TITLE, CreditsModal heading, MagicGlowTiles h1, STYLE.md heading + text rules, index.html title
- Updated localStorage keys (threadbare_muted → threadbearer_muted, threadbare_fog_default → threadbearer_fog_default) and test todo text
- Internal aesthetic references ("Threadbare aesthetic") left unchanged per design intent
- Visual verification: letter-spacing looks great at 1920×1080

### 2026-03-23: Complete stencil coastline wiring (completed 2026-03-23)

All action items done:
- Wired stencil test on land mesh material (EqualStencilFunc, ref=1)
- Rewrote CoastlineMesh: stencil write pass from land contour loops (colorWrite: false)
- Disabled shallow band overlays (they covered land area with light blue — root cause of the all-blue map)
- Updated CoastlineMesh tests for stencil behavior
- Visual verification: per-hex terrain colors visible on both `?view=hexv2` and `http://localhost:5173/`
- Remaining TODO: re-add shallow band with stencil test (only render where stencil=0)

### 2026-03-22: Documentation cleanup + Notion migration (completed 2026-03-22)

All action items done:
- Committed all Cowork documentation changes
- Verified and cleaned Notion backlog URLs from GDD outline, gamedocumenter evals
- Updated gamedocumenter eval cases (removed Notion, now reference BACKLOG.md)
- Deleted stale `state-of-game-design-SKILL.md` from repo root
- Removed stale `.skills/` and `skills/` directories (canonical skills in `.claude/skills/`)
- Removed `CLAUDE.md.proposed` and `CLAUDE.md.backup`
- Pruned stale git worktrees and removed local worktree directories

### 2026-03-22: Skill improvements for Claude Code (completed 2026-03-22)

Done:
- Merged `frontend-ui` loose file into folder-based SKILL.md (design-system loading, primitives, verification)
- Created `hexmap-renderer` skill from Hex Map V2 Phases 1-4 decisions

Deferred (when time permits):
- Write evals for `state-of-game-design` and `engine-architecture` skills
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         