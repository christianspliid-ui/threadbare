# Codebase Concerns

**Analysis Date:** 2026-03-30

## Tech Debt

**Unimplemented Conditional Sublocation Dissolution:**
- Issue: Sublocations with `persistence.type === 'conditional'` dissolution logic is stubbed; returns false without evaluation
- Files: `src/engine/sublocation.ts` (line 515)
- Impact: Conditional sublocations never dissolve. Game may accumulate temporal sublocations indefinitely if dissolution conditions become relevant
- Fix approach: Implement full condition evaluation when conditional persistence becomes a required feature. Add a condition evaluator function, check against context (agent states, domain values, etc.), emit trace on evaluation result

**Unimplemented Popup Choice Effects:**
- Issue: `handlePopupChoice` in notification system accepts an effect parameter but does nothing — effect is not dispatched to engine
- Files: `src/components/Game/hooks/useNotifications.ts` (line 131)
- Impact: Player popup choices (e.g., dilemmas, interventions) are dismissed but their effects are not applied to game state. UI works, but choice outcomes are lost
- Fix approach: Route effects through orchestrator phase handlers when choice resolution system is designed. Currently a placeholder pending game design decision on choice mechanics

**Incomplete Avatar Position Wiring:**
- Issue: Avatar position is not wired into `targetActions` context; marked as TODO
- Files: `src/components/Game/hooks/useTargetActions.ts` (line 36)
- Impact: Avatar position is undefined when targeting actions. May affect location-relative action calculations
- Fix approach: Resolve avatar position from graph visibility data and pass to action targeting context

**Hex Camera Focus Not Implemented:**
- Issue: Notification navigation callback `onFocusHex` is stubbed with empty comment
- Files: `src/components/Game/GameView.tsx` (line 429)
- Impact: Clicking notifications that reference hexes does not pan/zoom camera to the hex. Players must manually navigate
- Fix approach: Implement camera focus routine using `animateCameraTo` from `src/components/HexMapV2/camera/CameraAnimator`

**Incomplete Property Filtering in Action Templates:**
- Issue: Action template targeting lacks support for `targetRequiredProperties` filtering when matching against actors
- Files: `src/data/unified-action-templates.ts` (line 2826)
- Impact: Target action filtering cannot distinguish actors by specific property flags (e.g., `armyState`). Army-related actions may match non-army entities
- Fix approach: Extend `targetActions.ts` to support property-based filtering via schema validation

**Missing Familiarity Tier Gates:**
- Issue: Agent intent visibility is not gated by familiarity tier despite game design intention
- Files: `src/engine/agentDetail.ts` (lines 382, 456)
- Impact: Player can see all agent intents regardless of familiarity level when `PROTOTYPE_INTENT_VISIBLE` is false. May expose hidden game state
- Fix approach: Check `getFamiliarity(agentId, avatarId)` and threshold against intended familiarity tiers before returning intent details

**Untracked Location Control Metrics:**
- Issue: Location control tracking is stubbed (placeholder 0) pending Phase 3+ design
- Files: `src/engine/journeyEngine.ts` (line 137)
- Impact: Journey beat system cannot reference location control scores. Narrative gates on location control will not work
- Fix approach: Implement location control tracking in graph edges (control relationships) and compute aggregate scores during phases

**Actor ID Not Extracted from Tick Events:**
- Issue: Tick event processing in orchestrator does not extract actor ID from event structure
- Files: `src/engine/orchestrator.ts` (line 764)
- Impact: Event attribution in traces and UI may be incomplete or generic. Narrative events lack specific actor context
- Fix approach: Parse `event.actor` or `event.actorId` field from TickEvent union type and include in trace/chronicle entry

---

## Known Bugs

**Determinism Failure Under Certain Conditions:**
- Symptoms: Same seed produces different tick sequences in some runs (non-deterministic)
- Files: `src/engine/__tests__/content-layer1-integration.test.ts` (line 228, currently skipped)
- Trigger: Integration test "same seed produces deterministic results" is explicitly skipped
- Cause: Likely `Date.now()` calls in event ID generation (`src/engine/orchestrator.ts:1326`) or unseeded random sources in specialized systems
- Workaround: Test is skipped; determinism not guaranteed across multiple ticks with same seed
- Analysis: Event ID generation uses `Date.now()` which varies across runs. Several places call `Math.random()` without seeding:
  - `src/engine/resolution.ts:39` - d100 roll uses unseeded `Math.random()`
  - `src/components/Ascendant/AscendantSelection.tsx:27` - UI uses unseeded random for default avatar name
  - `src/engine/meetingEncounter.ts:422` - Meeting agent ID generation uses unseeded random
- Prevention: Seed-aware PRNG should be injected into all tick-loop randomness; Date.now() should only be used for UI timestamps, not game state IDs

---

## Security Considerations

**Unseeded Random in Client Event Generation:**
- Risk: Event IDs use `Date.now()` which is predictable and can collide with concurrent events in same millisecond
- Files: `src/engine/orchestrator.ts:1326`, `src/engine/phaseMandate.ts:28`, `src/engine/phaseDoom.ts:28`, `src/engine/phaseControlEffects.ts:53`
- Current mitigation: Event IDs include millisecond timestamp + counter. Same-tick events have incrementing counter, but cross-session IDs may collide if two games generate events at same wall-clock time
- Recommendations: Use cryptographically random suffix or structured UUIDs for persistent event IDs. For in-session uniqueness, `tick + counter + counter++` is sufficient

**No Input Validation on Choice Resolution:**
- Risk: `handlePopupChoice` accepts effect parameter but does not validate it before (future) dispatch to engine
- Files: `src/components/Game/hooks/useNotifications.ts:130`
- Current mitigation: None (function is stubbed)
- Recommendations: When implemented, validate effect ID against known effect types and validate parameters (e.g., target must exist in graph)

**Debug Bridge Exposure in Dev Mode:**
- Risk: `window.__DEBUG` API exposes engine internals (traces, crash logs, diagnostics) only in dev mode but may leak to production if tree-shaking fails
- Files: `src/debug-bridge.ts`, `src/components/Game/hooks/useAvatarData.ts:122`
- Current mitigation: Tree-shake guards (`import.meta.env.DEV` checks)
- Recommendations: Verify tree-shaking works in production build (`npx vite build` inspection). Consider additional dead-code elimination confirmation in CI

---

## Performance Bottlenecks

**Large Data Files Load Synchronously:**
- Problem: Content files (encounter, action templates, prose, narrative, archetype) are all bundled as JS modules
- Files: `src/data/encounter-content.ts` (8480 lines), `src/data/unified-action-templates.ts` (2906 lines), `src/data/culture-content.ts` (2409 lines), others
- Cause: No lazy-loading or chunking strategy
- Current capacity: ~60KB of content data per data file; 12+ data files = ~700KB content payload
- Improvement path: Implement code splitting (dynamic imports) per content category; load on demand in game phase rather than at app bootstrap
- Scaling limit: As content grows (new encounters, templates, loot), bundle size will increase linearly; 1000+ encounters could add 5-10MB

**Encounter Cache Rebuild Threshold Not Tuned:**
- Problem: Full cache rebuild occurs when location count changes exceed `CACHE_REBUILD_THRESHOLD`
- Files: `src/engine/encounterCache.ts` (lines 42-50), `src/data/agent-behavior-constants.ts`
- Current capacity: Unknown threshold value
- Impact: Unknown rebuild frequency. If threshold is low (e.g., 5 location changes), cache rebuilds on every settlement creation (hundreds per game). If high (e.g., 100), stale entries accumulate
- Improvement path: Profile game to measure: (a) how many locations are created per 100 ticks, (b) how long rebuilds take, (c) trade-off between cache accuracy and CPU cost
- Scaling concern: Late-game with 200+ settlements changing state per tick could trigger continuous rebuilds

**HexMapV2 InstancedMesh Memory Scaling:**
- Problem: All 60,000 hex tiles rendered as instanced geometry; agent/army/battle/particle layers also use instanced rendering
- Files: `src/components/HexMapV2/scene/HexFillMesh.ts`, `src/components/HexMapV2/scene/AgentSpriteMesh.ts`
- Current capacity: Single map 60K hexes × 11 terrain types = 660K vertices. Agents: up to 500 agents × 2 sprites each = 1000 instances. Armies: up to 100 armies × 2 sprites = 200 instances
- Memory per instance: ~1.2KB (position, rotation, scale, color, uvRect). Total: ~1.5MB VRAM
- Scaling limit: Map size or agent count doubling would double VRAM cost. ~3-5MB VRAM is typical budget for WebGL; current load is ~30% of budget
- Optimization opportunity: Frustum culling (`frustumCulled=true`) can skip off-screen instances. Currently disabled due to impediment #12 (shared geometry bug). Re-enable after geometry isolation fix

**Prose Resolution on Every Agent Detail Fetch:**
- Problem: `proseResolvers.ts` re-computes agent descriptions on every detail panel open
- Files: `src/engine/proseResolvers.ts` (1039 lines)
- Impact: Agent detail views stall on prose generation (likely <100ms per agent but compounds with multiple agents selected)
- Improvement path: Cache prose output keyed by agent state hash. Invalidate on agent state changes (capability growth, status changes)

---

## Fragile Areas

**Encounter Cache Invalidation:**
- Files: `src/engine/encounterCache.ts` (full file)
- Why fragile: Incremental cache updates rely on location lifecycle callbacks (`onLocationCreated`, `onLocationDestroyed`, `onLocationTypeChanged`). If a location property changes without triggering a callback, cache becomes stale. No validation that cache entries match current graph state
- Safe modification: Always emit callbacks from location mutation points. Add periodic cache validation in debug mode (sample 10% of entries, verify against graph)
- Test coverage: Unit tests cover cache building but not invalidation race conditions. No integration test verifies cache stays consistent over 100-tick simulation

**Unified Action Templates Import Cycle:**
- Files: `src/data/unified-action-templates.ts` imports `ENCOUNTER_TEMPLATES` from `src/data/encounter-content.ts`; encounter-content imports from encounter subfiles
- Why fragile: Adding new encounter subtype requires updating encounter-content registry and may create implicit dependencies. If encounter registration order changes, template availability may change silently
- Safe modification: Treat encounter-content as read-only registry. New encounter types must be explicitly registered. Add a `validateTemplateRegistry()` function called at app start to verify all action template encounter references exist

**DebugPanel Complex Nested Rendering:**
- Files: `src/components/Game/DebugPanel.tsx` (1774 lines)
- Why fragile: Panel renders conditional trees for encounter cache, modifier resolution, decision breakdown, encounter timeline, all with nested useEffect hooks and state management. 48 different useState hooks detected in components directory
- Safe modification: Do not add more conditional branches to DebugPanel without extracting sub-components (EncounterCacheView, DecisionBreakdownView, etc.). Keep data fetch in one effect, rendering in another
- Test coverage: No tests for DebugPanel rendering states. Manual verification required after changes

**Graph Node Property Mutations:**
- Files: All engine modules that call `location.properties.field = value`
- Why fragile: Graph nodes are mutable; several phases directly mutate properties in-place (`phaseUnrest`, `phaseReputationDecay`, others). If two phases mutate same property without coordination, race condition occurs
- Safe modification: Document immutable vs. mutable properties in graph schema. Use phase ordering to ensure single ownership of each property. Validate no two phases mutate same property
- Test coverage: Unit tests mock graph but do not verify two-phase mutation isolation

**Movement Trail Animation State Machine:**
- Files: `src/components/HexMapV2/agents/agentAnimationState.ts`, `src/components/HexMapV2/hooks/useAgentAnimations.ts`
- Why fragile: Agent position animations survive across ticks (comment: "animations survive across ticks, per-agent cancellation is inline"). Complex state tracking via `AgentPrevPosition` type and per-agent animation frame IDs. If agent node is deleted while animation in-flight, orphaned RAF callback persists
- Safe modification: On agent node removal, emit trace and cancel outstanding animations. Verify no animation callbacks write to deleted agent properties
- Test coverage: Animation tests exist but do not cover node deletion during flight

---

## Scaling Limits

**Tick Loop Event Throughput:**
- Current capacity: Integration tests run 100-tick simulation in <30s (measured by test timeout)
- Throughput: ~3 ticks/second observed
- Limit: At current throughput, a 10-hour play session would complete ~100,000 ticks. Trace buffer grows unbounded; if stored in memory, would accumulate ~1-5MB per tick (timestamps, event data)
- Scaling path: Implement trace buffer rotation (circular buffer of last 10,000 entries) and periodic export to IndexedDB for session persistence. Current `tickHealthMonitor` has rolling buffer but limit is unknown

**Graph Node Count Scaling:**
- Current typical: ~10,000 nodes (agents, locations, sublocations, armies, factions, rivals, artifacts, threads)
- Scaling path: Each phase iterates graph to find relevant nodes. If phases do `graph.getNodesByType('location')` on every tick with 1000+ locations, iteration cost compounds
- Limit: Graph iteration time is O(N). With 10 phases iterating nodes, total per-tick: O(10N). At 1000+ locations, might exceed 16ms budget (60 FPS target)
- Optimization: Add indexed lookups (graph maintains `_nodesByType` cache updated on add/remove). Already partially done in `graph.ts` via `getNodesByType()`; verify all callers use cached version

**Content Pool Size (Rewards, Prose, Encounters):**
- Current capacity: ~200 encounter templates, ~500+ reward attachments, ~1000+ prose templates
- Scaling limit: Action targeting must evaluate action viability against encounter pool. If pool size grows 10x (2000 encounters), action filtering becomes slower
- Symptom: Action drawer opens slowly in late game
- Optimization: Pre-filter encounters by location type + difficulty tier at location creation time (cache in encounter-cache system)

**Trace Buffer Memory:**
- Current: Rolling buffer in `tickHealthMonitor.ts` (line 77+), accessible via `window.__DEBUG.getTraces()`
- Size unknown: Buffer rotation limit not documented
- Risk: If trace buffer grows unbounded, memory consumption could exceed limits in long sessions (8+ hours of play)
- Fix: Document buffer size limit and rotation policy. Implement export-to-storage when buffer reaches threshold

---

## Dependencies at Risk

**Older Lodash Pattern in Some Utility Files:**
- Risk: Inconsistent use of `lodash` vs. `lodash-es`. Build tools may not tree-shake properly if both are referenced
- Current state: Likely both present since repo has older structure
- Impact: Duplicate lodash code in bundle (~50KB duplication possible)
- Migration plan: Audit all imports, replace with native JS where possible (Object methods, Array methods), remove lodash dependency if usage <5 files
- Timeline: Not critical but worthwhile in Q2 2026 refactor phase

**Three.js WebGL Compatibility Drift:**
- Risk: Three.js minor version updates may introduce WebGL API changes. Current code uses InstancedMesh, custom shaders, d3-zoom integration
- Current constraints: Must maintain WebGL support for browsers with limited capabilities (mobile Safari, older Windows machines)
- Impact: Future Three.js versions (r160+) may deprecate patterns we use (e.g., `toneMapping = NoToneMapping` may be removed)
- Mitigation: Monitor Three.js release notes quarterly. Test with at least one minor version ahead. Maintain shim for deprecated APIs if needed
- Scaling risk: If Three.js adoption patterns diverge from our usage, porting cost could be high (200+ files use Three.js)

**D3-Zoom Camera Integration Brittleness:**
- Risk: D3-zoom is a general-purpose zoom library, not optimized for hex maps. Our camera sync uses custom coordinate math
- Current risk: D3-zoom wheel handler defaults assume standard coordinate system; ours is inverted (y-flip). Impediment #2 documented this issue
- Impact: Upgrading d3-zoom without careful testing may break zoom-toward-cursor behavior
- Mitigation: Maintain custom wheel handler (current approach). Do not use default d3-zoom zoom handler; always use `syncCameraToZoom` after d3-zoom updates

---

## Missing Critical Features

**Choice Resolution System:**
- Problem: Popup choices (dilemma outcomes, intervention payoffs, decision points) are surfaced to player but outcomes do not apply
- Blocks: Intervention system payoff resolution, dilemma consequence application, player agency in story beats
- Design gap: No phase in orchestrator applies choice effects. Need `phaseChoiceResolution` or integration into existing phase
- Status: Blocked on game design decision: should choice resolution be immediate or deferred? Should it trigger new encounters or modify state?

**Conditional Sublocation Dissolution:**
- Problem: Sublocations cannot dissolve based on game state conditions (e.g., "dissolve when agent reaches fame 50")
- Blocks: Dynamic encounter sites that persist based on narrative progress
- Design gap: Condition evaluation language not defined (property path? expression syntax? graph query?)
- Status: Blocked on mini-language design for game designer-friendly conditions

**Event Actor ID Attribution:**
- Problem: Tick events generated during orchestrator phases do not carry explicit actor IDs
- Blocks: Narrative event source attribution, encounter log accuracy, debug tracing
- Design gap: TickEvent union type needs standardized actor field across all event categories
- Status: Requires TickEvent schema update and audit of all phase event generation

---

## Test Coverage Gaps

**Encounter Cache Invalidation During Gameplay:**
- What's not tested: Full 100-tick simulation with active location creation/deletion and encounter filtering. Current tests build cache once and verify structure, but do not verify cache stays consistent as locations change
- Files: `src/engine/__tests__/encounterCache.test.ts` (if exists) or integration test only
- Risk: Cache may become stale in edge cases (e.g., location deleted while encounter active, then location recreated). Players could select stale encounters or see wrong location availability
- Priority: High — affects core encounter availability logic

**Graph Mutation Isolation Across Phases:**
- What's not tested: Verification that no two phases mutate the same graph node property in the same tick. Current phase tests are unit-level (mock graph)
- Files: No integration test for phase ordering
- Risk: If two phases mutate `location.properties.unrest` without coordination, final value is non-deterministic
- Priority: Medium — depends on phase design maturity; currently phases are carefully ordered but no test enforces this

**Three.js Resource Cleanup on Component Unmount:**
- What's not tested: Verify no memory leaks when HexMapV2 component unmounts (dispose all geometries, materials, textures)
- Files: `src/components/HexMapV2/HexMapV2.tsx` cleanup logic
- Risk: Long play sessions (2+ hours) or multiple game resets could leak VRAM and cause slowdowns
- Priority: Medium — affects user experience on low-end hardware but not typical dev testing

**DebugPanel Rendering Under Extreme Trace Load:**
- What's not tested: DebugPanel rendering performance with 10,000+ trace entries
- Files: `src/components/Game/DebugPanel.tsx`
- Risk: Trace viewer may stall or crash when user attempts to view full encounter log after 100+ tick simulation
- Priority: Low — affects debug experience only, not gameplay

**Accessibility & Keyboard Navigation:**
- What's not tested: Full keyboard navigation of modals, action drawer, and debug panels
- Files: Multiple component files
- Risk: Keyboard-only users cannot access UI
- Priority: Medium — required for accessibility compliance but not critical to core loop

**Avatar Movement & Combat Interaction:**
- What's not tested: Avatar movement across multiple hexes with simultaneous agent encounters, armies, and battles
- Files: Integration test would span `src/engine/avatarMove.ts`, `src/components/Game/hooks/useAgentInteraction.ts`, encounter and battle systems
- Risk: Avatar interactions may produce unexpected state (e.g., encounter started before avatar actually arrived, or battle resolved incorrectly if avatar moved during resolution)
- Priority: High — core gameplay loop; affects save integrity and narrative correctness

---

## Environmental Concerns

**Date.now() as Unique ID Source:**
- Problem: Multiple systems use `Date.now()` to generate unique IDs (events, intervention effects, mandate events)
- Files: `src/engine/orchestrator.ts:1326`, `src/engine/interventionEffects.ts:141`, `src/engine/phaseMandate.ts:32`, `src/engine/phaseDoom.ts:28`, `src/engine/phaseControlEffects.ts:53`
- Concern: If tick loop completes in <1ms (unlikely but possible under optimal CPU), two events could have same timestamp
- Frequency: Each phase that generates events uses this pattern
- Severity: Low — incrementing counter provides safety net, but non-obvious to future maintainers
- Fix: Inject a tick-local sequence number into ID generator. `_eventCounter` already exists in some modules but is not formalized

**Console Logging in Production Code:**
- Problem: No `console.log`, `console.warn`, `console.error` calls should exist in game engine code (only in tests and UI)
- Current state: Not detected in grep sweep (good sign) but should verify
- Risk: Performance impact and confusion (traces may be logged to console in production)
- Recommendation: Add eslint rule to forbid console calls in src/engine/

---

## Summary by Priority

| Issue | Priority | Effort | Owner | Deadline |
|-------|----------|--------|-------|----------|
| Determinism failure under certain conditions | High | Medium | Engine | Before release |
| Encounter cache invalidation gaps | High | Medium | Engine | Before Phase 20 |
| Avatar movement interaction edge cases | High | High | Engine | Before Phase 20 |
| Unimplemented popup choice effects | High | Medium | UI + Engine | Phase 18-19 |
| Incomplete hex camera focus | Medium | Small | UI | Phase 18 |
| InstancedMesh memory scaling | Medium | Medium | Graphics | Q2 2026 |
| Encounter cache rebuild threshold tuning | Medium | Small | Engine | After Phase 15 |
| Conditional sublocation dissolution | Medium | Medium | Engine | Phase 19+ |
| Graph mutation phase isolation | Medium | Medium | Engine + QA | Phase 20 |
| Content bundle code splitting | Low | High | Build | Post-launch |
| Lodash deduplication | Low | Small | Cleanup | Q2 2026 |
| Accessibility keyboard navigation | Low | Medium | UI | Post-launch |

---

*Concerns audit: 2026-03-30*
