# Pitfalls Research: Game Engine Optimization Retrofit

**Domain:** React + TypeScript game engine optimization (retrofitting determinism, code splitting, caching into running codebase)
**Researched:** 2026-03-30
**Confidence:** MEDIUM (WebSearch-verified patterns; specific to this codebase confirmed via CONCERNS.md)

## Executive Summary

Retrofitting optimizations into a 85K LOC running codebase introduces systematic risks beyond standard development. This research identifies pitfalls that appear in three categories: **determinism failures** (PRNG + state mutation), **code splitting cascades** (bundle dependency ordering), and **cache invalidation races** (mutable game state). Each pitfall maps to specific phases where prevention is feasible and testable.

Key finding: The codebase already exhibits three critical pitfalls (determinism test skip, unseeded random calls, cache rebuild threshold not tuned). Prevention strategies in the roadmap must address these before scaling encounters or agents beyond current capacity.

---

## Critical Pitfalls

### Pitfall 1: Unseeded Math.random() in Running Tick Loop

**What goes wrong:**
Multiple systems call `Math.random()` without seed injection: d100 rolls in resolution, encounter agent ID generation, UI default names. When refactoring to seeded PRNG, developers replace only some call sites, leaving others unseeded. Result: determinism test fails intermittently—same seed produces different encounter sequences on some runs. Player save-reload fails. Multiplayer sync broken.

**Why it happens:**
- Initial codebase ships with unseeded randomness scattered across 5+ files
- When determinism becomes a requirement, natural instinct is to "add seeding" to problem area only
- PRNG injection is not a simple find-replace—it requires plumbing dependency injection through orchestrator, phases, engine modules
- Under time pressure, developers patch critical path (resolution, encounter gen) but miss secondary systems (UI defaults, meeting agent ID)
- No centralized PRNG service means each file can accidentally revert to Math.random() if import statement is deleted

**How to avoid:**
1. **Before adding any seeded PRNG:** Audit ALL Math.random() and Date.now() calls in game-state-affecting code (src/engine/). Create an issue for each one listing file + line + purpose.
2. **Centralize PRNG provider:** Create `src/engine/seededRandom.ts` that exports single `getGameRandom()` function. This is the ONLY way to call randomness in engine code. Emit trace every time game random is used (to catch leaks).
3. **Inject at orchestrator level:** Pass PRNG instance to `runTick()`, which passes to all phase functions. Do NOT allow phases to import it directly—makes dependency invisible.
4. **Three-phase migration:**
   - Phase 1: Audit + add centralized provider (no behavior change yet)
   - Phase 2: Inject into orchestrator, convert top 3 callers (resolution, encounter gen)
   - Phase 3: Audit determinism test on full sim (100+ ticks), then convert remaining
5. **Test at each phase:** `npm test` must verify determinism. If test shows non-determinism, revert + audit before proceeding.
6. **Flag data-layer randomness separately:** UI code (avatar name picker) can use Math.random(). Engine code cannot. Document this in code comments.

**Warning signs:**
- Determinism test skipped or marked `.skip` (current state: line 228 in content-layer1-integration.test.ts)
- Same-seed runs produce different tick counts before crisis event
- Encounter log export shows different encounter ordering between runs
- PR changes a Math.random() call but doesn't add audit comment
- New file in src/engine/ imports Math without comment explaining why

**Phase to address:**
Phase 2-3 (v1.1 low-hanging fruit). Must be done before Phase 10+ when encounter scaling increases. Blocking: Multiplayer, save-reload, content sharing with community (seeds become sharable worlds).

---

### Pitfall 2: Cache Invalidation Race Conditions During Mutable State Updates

**What goes wrong:**
Encounter cache stores location lists + difficulty tiers. When location is created, callback fires `onLocationCreated()` which updates cache. But if two locations are created in same tick, race condition: first update adds location A, second update builds from partial graph (A present, B missing). Cache becomes stale. Player clicks location B, no encounters available even though B should have lairs.

At scale (100 location changes per tick late-game), cache invalidates are so frequent that "incremental update" becomes faster to just rebuild entire cache. But rebuild takes >50ms. Rebuild starts frame delay (16ms budget). Two rebuilds per frame = game stutters, player notices.

**Why it happens:**
- Encounter cache designed for "incremental updates on location lifecycle events" (create/destroy/type-change)
- Callbacks are emitted from location mutation points, which are scattered across 4 different phases (phaseUnrest, phaseDecay, phaseFaction, phaseEscape)
- If one phase creates location but does NOT emit callback (forgotten), cache becomes invalid
- No validation that cache state matches graph state. No "did cache get stale?" check.
- Threshold for full rebuild (`CACHE_REBUILD_THRESHOLD`) is unknown—developer doesn't know if 10 is too high/low

**How to avoid:**
1. **Define cache invariant:** At start of each phase, cache should match graph state. Document this in code comment + test assertion.
2. **Emit callbacks from single location:** Create `src/engine/location.ts` with `setLocationState()` function. ALL mutations go through this function, which emits callback if something changed. Prevents forgotten callbacks.
3. **Validate cache periodically:** In debug mode, call `validateEncounterCache()` at end of each phase. This samples 10% of cache entries, verifies they match graph. If invalid, throw with trace showing which entry mismatched. Development catches stale cache immediately.
4. **Measure + tune rebuild threshold:** Profile a 50-tick sim, log location creation rate per tick. Calculate: if rate is 5 locations/tick and rebuild cost is 50ms, rebuild is viable up to ~15 location changes/tick. Set `CACHE_REBUILD_THRESHOLD = 10` with comment explaining math.
5. **Version cache entries:** Each cache entry stores `builtAtTick: number`. At phase start, check if any location's `modifiedAtTick > cache.builtAtTick`. If yes, full rebuild. Prevents stale entries lingering.
6. **Test invalidation race:** Add integration test: create 10 locations in one tick, verify cache reflects all 10. Then delete 5, verify cache removes them.

**Warning signs:**
- Encounter log shows "no encounters available" for locations that should have lairs
- Debug panel cache view disagrees with graph node count
- Frame drops every 20-30 ticks (correlates with cache rebuild)
- Unit tests mock graph but integration tests never verify cache consistency over 50+ ticks
- `CACHE_REBUILD_THRESHOLD` value is commented as "unknown"

**Phase to address:**
Phase 1 (before Phase 10 encounter scaling). Measure + tune threshold in Phase 5. Add validation test in Phase 3.

---

### Pitfall 3: Synchronous Data File Imports Blocking Initial Load

**What goes wrong:**
12 data files (encounter-content.ts: 8480 lines, unified-action-templates.ts: 2906 lines, etc.) are imported as JS modules. App bootstrap imports all of them at once. Vite bundles all 12 into main.js (~700KB content). User opens game, browser parses 700KB content before showing first frame. Parse time: 200-400ms on low-end hardware. Player sees blank screen, assumes game is broken.

When adding v1.2 content (1000 encounters instead of 200), bundle grows to 2-3MB. Parse time becomes 1-2 seconds. Now player definitely notices. If deployed to production first, metric alert fires, product team reverts immediately. Optimization gets blamed as "broke the game."

**Why it happens:**
- Initial development focused on content authoring convenience (all content in one JS file = easy to edit)
- Dynamic imports (`import()`) require code splitting config in Vite, which adds complexity
- No early measurement of bundle size impact. Content grows from 200 → 500 → 1000 encounters without checkpoint.
- Developers assume "React lazy + Suspense" will magically fix it. In reality, lazy boundaries must be deliberate—you can't lazy-load content-files that are imported inside game phases.
- Code splitting introduces waterfall: user loads page → loads main chunk → main chunk loads encounter chunk → encounters parse → game starts. Feels like it took forever.

**How to avoid:**
1. **Measure FIRST:** Run `npx vite build` and check dist/assets/. Note size of main.js and any other chunks. Record as baseline. Add to build output.
2. **Profile initial load:** Use Lighthouse or Chrome DevTools Network tab. Measure time-to-interactive. If >2 seconds, code splitting is mandatory.
3. **Split by content category:** Create separate chunks:
   - `encounter-content.chunk.js` (lazy-loaded when entering game)
   - `action-templates.chunk.js` (lazy-loaded when opening action drawer)
   - `prose.chunk.js` (lazy-loaded on first agent detail view)
   - Keep only bootstrap content (menu, UI chrome, basic game state) in main.js
4. **Use dynamic import with Suspense:** At game phase where content is needed, do:
   ```typescript
   const encounterContent = await import('./data/encounter-content.chunk.js');
   // OR use React Suspense boundary
   <Suspense fallback={<Loading />}>
     <EncounterPanel />
   </Suspense>
   ```
5. **Create loading state:** While chunk loads, show "Loading encounters..." message. Player knows something is happening.
6. **Test waterfall:** Load page, wait for main chunk, then time how long until encounters are available. If >1s, investigate.
7. **Limit chunk size:** Set Vite config limit to 100KB per chunk. If chunk exceeds, split further. This prevents surprise 500KB surprises in the bundle.
8. **Avoid cascading dependencies:** Ensure encounter-content.chunk.js does NOT import from action-templates.chunk.js, which would create a waterfall where user must wait for both. Each chunk is independent.

**Warning signs:**
- Lighthouse performance score drops below 70
- Build output shows main.js > 500KB
- User reports blank screen lasting >1 second on first load
- PR adds 200+ new encounter templates without mentioning bundle size impact
- Vite build log shows "chunks exceed 1MB"
- Developer says "we'll optimize later" (you won't; do it now)

**Phase to address:**
Phase 6 (before v1.2 content expansion). Measure baseline in Phase 1. Implement code splitting config + test in Phase 4-5. Convert to dynamic imports in Phase 6-7. Do NOT ship Phase 10+ (1000+ encounters) without this done.

---

### Pitfall 4: Mutable State Cache Invalidation via Unmeasured Rebuild Threshold

**What goes wrong:**
Encounter cache rebuild triggers when location count delta exceeds `CACHE_REBUILD_THRESHOLD`. Currently the threshold value is unknown (not tuned). Result: either cache rebuilds too often (stalls every tick), or never rebuilds (stale cache accumulates).

Developer makes a guess: "100 seems safe." But in actual gameplay, 200 locations spawn, delete, respawn. If threshold is 100, cache rebuilds twice per tick, eating 30% of frame budget. Game stutters every second. Or if threshold is 10, cache rebuilds every few ticks, constantly CPU-bound.

Worse: Developer tunes threshold for early-game (10 locations, 1 change per tick) but late-game has 200 locations with 50+ changes per tick. Threshold that was fine becomes catastrophic. Player gets to late game, everything slows down, blames "late-game performance bug" instead of cache threshold.

**Why it happens:**
- Threshold selected without measurement. "Seems reasonable" is not a tuning method.
- No profile data showing: (a) how many location changes per tick, (b) how long rebuild takes, (c) frame budget (60fps = 16ms per frame)
- Assumption: "incremental update faster than rebuild" is not verified. At low location counts, rebuild might be faster (overhead of incremental is higher).
- No continuous monitoring. Threshold correct for v1.0 but content increases in v1.1+, threshold becomes stale.

**How to avoid:**
1. **Profile before choosing threshold:** Run 50-tick sim, log every location lifecycle event (create, delete, type-change). Calculate average + peak changes per tick.
2. **Measure rebuild cost:** Instrument encounterCache.ts with timer. Log rebuild duration. Example: "rebuilt cache in 8ms, had 147 location changes, threshold is 50"
3. **Calculate safe threshold:** If rebuild costs 5ms and you have 16ms frame budget, max safe rebuild is 2-3 per frame. If you see 20 location changes in peak ticks, set threshold to 10 (rebuild twice per tick is acceptable, 3x is overload).
4. **Document calculation:** In code comment, write the exact math:
   ```typescript
   // Threshold tuning: Peak location changes observed = 50/tick in late game
   // Rebuild cost measured = 8ms. Frame budget = 16ms (60fps)
   // Safe strategy: Rebuild if changes > 20 (allows 2 rebuilds/frame at peak)
   // Current threshold = 20
   const CACHE_REBUILD_THRESHOLD = 20;
   ```
5. **Test at scale:** Create integration test that spawns 200 locations, cycles through 30 ticks, verifies frame time doesn't exceed 16ms + logs cache rebuild count. This becomes a regression test for future content additions.
6. **Re-tune quarterly:** As content grows, re-measure. Schedule a "threshold audit" task in Q2 2026 roadmap.
7. **Make it tunable:** Move threshold to `agent-behavior-constants.ts` so designer can experiment without recompiling. Add to DebugPanel so QA can measure in-game.

**Warning signs:**
- `CACHE_REBUILD_THRESHOLD` is undefined or marked as "TODO"
- No comment explaining how value was chosen
- Late-game FPS drops every few seconds (correlates with cache rebuild)
- Debug panel does not show cache rebuild count or duration
- Developer says "performance seems fine" but has never measured cache rebuild cost
- Test only builds cache once; never verifies invalidation under active location changes

**Phase to address:**
Phase 3 (after CONCERNS audit) to measure baseline. Phase 5 to implement tuning + constant. Phase 10+ must not ship without regression test.

---

### Pitfall 5: Graph Node Mutation Order Ambiguity Across Phases

**What goes wrong:**
Multiple phases mutate the same graph node properties without coordination. Example: `phaseUnrest` sets `location.properties.unrest += 1`. Later, `phaseReputationDecay` sets `location.properties.unrest *= 0.9`. If these phases run in different order between ticks (or if one is skipped), final unrest value differs. Same seed produces different behavior.

More insidious: Developer refactors phaseUnrest and accidentally removes `location.properties.unrest = ...` call. No phase emits an error; unrest property just stays stale. Logic continues, but property is wrong. Takes weeks to notice during late-game balancing.

**Why it happens:**
- Graph nodes are mutable objects. Any phase can mutate any property.
- No centralized registry of "which phase owns which property"
- No validation: "did phase X mutate unrest? then phase Y must not."
- Phases are documented in comments but not in code (no explicit phase dependency graph)
- Test isolation: each phase is tested in isolation with mocked graph. Integration tests never verify two-phase mutation order.

**How to avoid:**
1. **Define ownership matrix:** Create `Docs/phase-property-ownership.md`:
   ```
   Property | Owner Phase | Reads | Comments
   ---------|-------------|-------|----------
   location.properties.unrest | phaseUnrest | phaseReputationDecay, phaseDebugPanel | Incremented by unrest events
   location.properties.control | phaseFaction | phaseAmbition, phaseJourney | No other phase mutates
   ```
   If a property has no owner, it's a bug (who maintains it?).
2. **Enforce single-writer rule:** Add assertion in phase:
   ```typescript
   function phaseReputationDecay() {
     // Only phaseUnrest mutates unrest; verify no other phase did
     assertPhaseOwnershipNotViolated('unrest', ['phaseUnrest']);
   }
   ```
3. **Order phases explicitly:** In orchestrator, order phases by dependency:
   ```typescript
   // Phase order matters: unrest → reputation decay → faction control
   runPhase(phaseUnrest);     // Write unrest
   runPhase(phaseReputationDecay); // Read/modify unrest
   runPhase(phaseFaction);    // Read unrest, write control
   ```
4. **Document order in comment:** In orchestrator.ts, add table showing phase order + dependencies. Make mutation order visible.
5. **Test two-phase interaction:** Add integration test:
   ```typescript
   test('phaseUnrest then phaseReputationDecay produces expected unrest', () => {
     runTick(state, prng); // runs full orchestrator
     expect(location.properties.unrest).toBe(expectedValue);
   });
   // If you reorder phases, test fails and forces you to reconsider
   ```
6. **Immutable properties:** Properties that should never mutate after creation (node ID, node type) are validated at graph level. Immutability is enforced, not just suggested.

**Warning signs:**
- Phase description says "modifies X" but code doesn't actually set X
- Two phases mention same property name with no comments explaining interaction
- Determinism test fails when phases are reordered (even if tick count is same)
- Graph property value seems "off" in debug panel but no phase is obviously wrong
- No documentation of phase ordering beyond comments

**Phase to address:**
Phase 1 (immediate, before Phase 5). Phase ownership audit is low-effort, high-return. Document in Phase 2. Enforce with tests by Phase 4.

---

### Pitfall 6: PRNG State Leakage Between Calls (Seeding Wrong Scope)

**What goes wrong:**
Developer implements seedrandom library. In orchestrator, creates one global PRNG at app startup: `globalRandom = seedrandom(seed)`. Every phase uses `globalRandom.next()`. But there's a subtle bug: if a phase needs to roll 3 d100 rolls in sequence AND ALSO decides not to take an action if first roll is <5, then rolling is conditional.

Result: Same seed produces different sequence of rolls depending on which agents are present. Add one agent, it blocks a roll, downstream rolls shift. Different agent set = different random sequence = different encounters. This breaks "same seed = same world."

Root cause: Seeded PRNG consumed rolls even when results weren't used. Should use "separate PRNG instance per decision" or "always consume roll even if unused."

**Why it happens:**
- Misunderstanding of PRNG semantics: developers think "seed means deterministic" without realizing "deterministic ALSO means roll consumption matters"
- In unseeded code, `Math.random()` is called as needed—if you skip a call, no one notices. With seeded PRNG, skipping a call shifts ALL downstream rolls.
- First-time PRNG user doesn't realize: if you call `rng.next()` then throw away result, you've consumed a roll. That decision is locked into seed forever.
- Testing doesn't catch this because tests use same agent set. Stochastic tests that vary agent count are rare.

**How to avoid:**
1. **Principle: Always consume rolls in order.** If you roll to decide something, use the result. If you roll conditionally (only roll if agent present), document that clearly. Better: have caller responsible for deciding whether to roll, not the function.
2. **Expose roll consumption as trace:** Every PRNG call emits a trace event:
   ```typescript
   const roll = gameRandom.d100(); // trace: { tick, phase, roll, purpose: 'encounter-threat' }
   ```
   Allows debugging: "why did roll sequence change when I added agent X?"
3. **Create separate PRNG for UI.** UI (avatar picker random name) uses Math.random(). Engine uses seeded PRNG. Never mix.
4. **Test with different agent sets:** Integration test:
   ```typescript
   const world1 = initializeGameState(seed, agents=['A', 'B']);
   const world2 = initializeGameState(seed, agents=['A', 'B', 'C']);
   // Should differ in encounters but roll sequence should be deterministic within agent set
   ```
5. **Document PRNG usage pattern:** In code comment at first seeded PRNG call, write:
   ```typescript
   // IMPORTANT: Each d100() call consumes one roll from the PRNG sequence.
   // If you call d100() then ignore the result, you're shifting all downstream rolls.
   // Only call d100() if you will actually USE the result.
   ```
6. **Provide PRNG helper for "conditional rolls":** If you need conditional rolling, be explicit:
   ```typescript
   // BAD: Consumes roll even if not used
   if (agent.isAlive) {
     const threat = gameRandom.d100();
   }

   // GOOD: Clear scope
   const threat = agent.isAlive ? gameRandom.d100() : 0;
   // OR
   const rollIfAlive = (rng) => agent.isAlive ? rng.d100() : null;
   ```

**Warning signs:**
- Same seed produces different encounters when agent count changes
- Developer says "I seeded the PRNG" but didn't add traces
- PRNG calls are scattered across phases without clear "consumption order" docs
- Test skipped or disabled because "determinism is too complex"
- PRNG passed through 4+ levels of function calls (hard to track consumption)

**Phase to address:**
Phase 2 (when implementing seeded PRNG). Test in Phase 3. Design trace emission in Phase 2 to catch leakage early.

---

### Pitfall 7: Prose Cache Built on Stale Agent State Snapshot

**What goes wrong:**
Agent detail panel opens, triggers `agentDetail.getAgentDescription()`, which calls `proseResolvers.resolveAgentProse()`. Prose generator reads agent's capabilities, sphere affinity, encounter history. Generates description and caches it keyed by `agentId`.

Next tick runs. Agent gains a new capability. User opens detail panel again. Same `agentId` key, prose cache HIT. User sees OLD description (before capability gained). Description is stale by one tick.

Even worse: Prose is expensive (100-200ms per agent). Caching "makes it fast" but introduces invisible staleness. Player doesn't know they're seeing old prose. Later, when prose is shown in chronicle, mismatch: chronicle says "gained [capability]" but agent description still shows old capabilities. Feels like a bug.

**Why it happens:**
- Prose caching treats agent state as immutable. "Get prose once, cache forever" breaks when agents change tick-to-tick.
- Cache key is too coarse (`agentId` only). Doesn't account for agent state hash or modification time.
- No validation: "is agent state same as when prose was cached?" Check.
- Prose cache built for performance (true—generation is slow) but staleness not considered.
- No trace showing when prose was cached vs. when agent changed.

**How to avoid:**
1. **Cache key includes state hash:** Instead of keying by agentId only, key by `${agentId}:${hashAgentState(agent)}`. If agent state changes, hash changes, cache miss, prose regenerated. Example:
   ```typescript
   const stateHash = hashObject({
     capabilities: agent.capabilities,
     sphereAffinity: agent.sphereAffinity,
     status: agent.status,
   });
   const cacheKey = `${agent.id}:${stateHash}`;
   const prose = proseCache.get(cacheKey);
   if (!prose) {
     prose = generateProse(agent);
     proseCache.set(cacheKey, prose);
   }
   ```
2. **Limit cache size:** Prose cache grows unbounded (100 agents × 5 state changes each = 500 entries). Implement LRU cache with max 500 entries. When limit hit, evict oldest. Prevents memory bloat.
3. **Invalidate on agent change:** When agent gains capability or status changes, emit trace + clear related cache entries:
   ```typescript
   function setAgentCapability(agent, capability) {
     agent.capabilities.add(capability);
     proseCache.invalidateAgent(agent.id); // Clear all cached prose for this agent
   }
   ```
4. **Add staleness check in debug:** DebugPanel shows: "Prose for agent X cached 5 ticks ago. State hash then: ABC. State hash now: XYZ. STALE?" This makes staleness visible.
5. **Test cache + state:** Integration test:
   ```typescript
   const agent = state.agents['Gregor'];
   const prose1 = getAgentDescription(state, agent.id);
   // Agent gains capability
   agent.capabilities.add('Shadowcraft');
   const prose2 = getAgentDescription(state, agent.id);
   expect(prose2).not.toEqual(prose1); // Must differ if state changed
   ```
6. **Measure cache hit rate:** Add metric "prose cache hit %". If 95%+, cache is working. If <50%, overhead of hashing might exceed generation cost—reconsider caching.

**Warning signs:**
- Player reports agent description "doesn't match what I see in the interface"
- Prose output says "has 3 capabilities" but character sheet shows 4
- Prose cache key is just `agentId` with no state consideration
- Test not included verifying prose updates when agent state changes
- Developer says "prose is cached, so it's fast" without mentioning staleness risk
- Prose cache never cleared, grows unbounded during gameplay

**Phase to address:**
Phase 6-7 (after Prose is being used heavily). Implement state-hashed cache key + staleness check. Add test + debug visibility. Must be done before prose output is used in chronicle/narrative (where staleness is visible to player).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Unseeded Math.random() in new code | Fast to write, no dependency plumbing | Determinism broken, impossible to fix without audit | Never—add seeded PRNG from the start |
| Cache everything (unvalidated) | Code runs faster, simple to implement | Stale data, hard bugs, invisible corruption | Only for truly immutable data (constants, compiled) |
| Skip cache invalidation tests | Move faster in development | Silent bugs in production, hard to diagnose | Never—cache correctness tests are mandatory |
| Global PRNG state | Easy one-liner per phase | State leakage, non-determinism, debugging nightmare | Never—PRNG is a dependency, must be injected |
| Synchronous large data imports | No code splitting config needed, works immediately | 2-3 second load time, player sees blank screen | Only for truly critical bootstrap data (<50KB) |
| Property mutations without phase owner | Fastest to write, minimal refactoring | Race conditions, unpredictable state, hard to debug | Never—document ownership + enforce single-writer |
| Prose cache without state hash | Fast performance, simple cache key | Stale descriptions, player confusion, chronicle mismatch | Only if prose is never accessed during same tick as mutation |
| Rebuild threshold guessed "safely" | Avoids measurement work, "should be fine" | Performance surprises late-game, threshold becomes stale | Never—measurement costs <1 hour, payoff is worth it |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-----------------|
| PRNG with phases | Each phase imports + uses Math.random() independently | Single PRNG instance injected into orchestrator, passed to all phases. Phases consume rolls in deterministic order. |
| Encounter cache with location lifecycle | Cache updated on location mutation but mutation callback forgotten → stale cache | All location mutations go through single `setLocationState()` function that emits callback. Validation check at phase end. |
| Code splitting with dynamic imports | Import placed in React component that renders on every frame → chunk loaded every render | Use React Suspense boundary + load chunk at phase start (in orchestrator, not component). Chunk loads once. |
| Prose cache with agent mutations | Agent capability added but prose cache not invalidated | Cache key includes state hash. When agent changes, hash changes, cache miss, prose regenerated. Traces log all invalidations. |
| WebGL resource cleanup | Remove mesh from scene but forget renderer.dispose() → VRAM leak | Always call dispose() AFTER remove(). Use try-finally to ensure cleanup. Add to component unmount hooks. |
| Seeded random with conditional rolls | Roll to check if action happens, skip downstream rolls if condition false → roll sequence shifts | Clear pattern: caller decides whether to roll, function always consumes roll if called. Conditional rolling is caller's responsibility. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Cache rebuild thrashing** | FPS drops every 5 seconds, no clear cause. Debug: cache rebuilding 20+ times per tick. | Measure location change rate + rebuild cost, set threshold accordingly. Add regression test: 50-tick sim at late-game scale should maintain >55fps. | >100 location changes per tick. Threshold guessed too low. |
| **Unseeded randomness in loop** | Same seed produces different results on different runs. Encounter sequence varies. Non-reproducible bugs. | All randomness seeded + injected. PRNG call traces to audit consumption order. Test with multiple seeds. | 5+ encounters evaluated per tick. Different agent sets shift roll consumption. |
| **Synchronous bundle bloat** | Initial load >2s. Player sees blank screen. Metric alert fires. Product reverts deploy. | Code split by category. Dynamic imports at phase start. Lazy Suspense boundaries. Build size regression test. | >500KB content data. Adding 500+ new encounters without re-measuring. |
| **Stale prose cache** | Prose says "has ability X" but character sheet says "ability X". Mismatch visible to player. | Cache key includes state hash. Invalidate on agent change. Staleness check in debug panel. | Prose accessed after agent mutation in same interaction. Prose shown in multiple UI surfaces with different timing. |
| **Mutable state race conditions** | Encounters available in debug but not in player view. Graph traversal shows 100 locations but encounter pool shows 50. | Single-writer rule per property. Property ownership matrix. Trace emission on mutation. Integration tests verify two-phase interaction. | 5+ locations created/destroyed per phase. Late-game with 200+ locations and high churn. |
| **Graph iteration O(N) scaling** | Early game smooth (1000 nodes). Late game stutters (5000 nodes). Linear slowdown unexpected. | Use indexed lookups (`graph._nodesByType` cache). Phases iterate indexed list, not full graph. Verify all phases use cached version. | >3000 nodes on graph. 10+ phases iterating all nodes per tick. |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Unseeded event IDs using Date.now()** | Event IDs collide if two events generated in same millisecond. Save file corruption if events share ID. | Use tick-local sequence counter: `${tick}_${++counter}`. Or use seedrandom to generate IDs (deterministic, unique). |
| **Unvalidated popup choice effects** | Player selects choice, effect parameter not validated, effect could reference deleted agent. Crashes engine or corrupts state. | Validate effect ID exists in allowed effects. Validate all parameters (agent IDs, location IDs) exist in graph. Emit trace for audit. |
| **Untraced PRNG calls in critical systems** | Developer can't audit where random numbers went. Hard to find determinism bugs. Could hide deliberate cheating if PRNG state exposed. | Emit trace on every PRNG call: tick, phase, roll value, purpose. Traces accessible only in dev mode. Verify tree-shake in prod build. |
| **Debug bridge exposure in production** | `window.__DEBUG` leaks internal traces, crash logs, engine state in production if tree-shake fails. | Verify tree-shake works: `npx vite build`, inspect dist/assets/, confirm __DEBUG not in bundles. CI check: grep for `__DEBUG` in prod build output. |
| **Graph property mutation without ownership** | Two phases mutate same property without coordination. Stale property values. Attacker could exploit ambiguity to corrupt game state. | Document property ownership. Assert single-writer rule. Validate no two phases mutate same property. Test + trace all mutations. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Long initial load (code not split)** | Player opens game, sees blank screen 2-3 seconds. Thinks game is broken. Closes tab. Bounce rate increases. | Code split by feature. Show "Loading..." while chunks load. Target <1s initial load. Lazy Suspense boundaries for non-critical content. |
| **Stale prose in UI** | Prose says agent "has 3 capabilities" but character sheet shows 4. Player feels interface is bugged, loses trust. | State-hashed cache keys. Invalidate on agent change. Validate consistency when prose rendered. |
| **Unintelligible error on encounter failure** | Player clicks location, nothing happens. No feedback. Assumed crash. | Emit trace + user-facing notification. "No encounters available on this location. (Reason: [too high threat / too low fame / etc])" |
| **Save-reload produces different encounters** | Player saves after encountering Gregor on Hex(5,5). Reload. Gregor on different hex. Player assumes save is corrupted. | Seeded PRNG + determinism test verify same seed = same world. Document: saves are reproducible to the tick. |
| **Laggy action drawer on late-game encounter** | Player wants to cast spell, action drawer takes 2+ seconds to open. Action feels unresponsive. | Pre-filter encounters at location creation (cache in encounter cache). Filter at targeting phase (avoid iterating 2000 encounter templates per action). |

---

## "Looks Done But Isn't" Checklist

- [ ] **Seeded PRNG:** Implemented `seedrandom` library, but did you verify ALL Math.random() calls in src/engine/ are replaced? Did you add trace emission for audit? Did you test same-seed determinism with multiple seeds?
- [ ] **Code splitting:** Moved data files to dynamic imports, but did you verify chunks load in correct order? Did you test with slow 3G network? Do chunks hang on load, or is there progress feedback?
- [ ] **Cache implementation:** Built encounter cache with invalidation, but did you measure rebuild threshold on real game data? Did you add validation check (`validateEncounterCache()`) at phase end? Did you test cache consistency over 50+ ticks?
- [ ] **Prose cache:** Added state hashing for prose key, but did you verify prose actually invalidates when agent state changes? Did you trace when cache hits vs. misses? Did you test prose shown in multiple UI surfaces?
- [ ] **Phase ownership:** Documented property mutations in comment, but did you write the ownership matrix in Docs/? Did you add the assertion in code? Did you test two-phase interaction?
- [ ] **Graph mutations:** Added single-writer check for location properties, but did you verify ALL location mutations go through one function? Did you emit callback from every mutation point? Did you test with location creation + deletion in same tick?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Unseeded randomness discovered in prod** | HIGH (100+ hours) | 1. Revert to last known-deterministic version. 2. Implement seeded PRNG on all systems. 3. Re-test determinism for 50+ ticks. 4. Re-audit all Math.random() calls. 5. Player saves from before fix are not recoverable (roll back to old save or discard). |
| **Cache invalidation bug causing stale encounters** | MEDIUM (20-40 hours) | 1. Identify which cache entries are stale (query graph vs. cache). 2. Clear entire cache, force rebuild. 3. Implement validation check + test. 4. Identify mutation points that forgot callback, add callback. 5. Retro-fit validation into all locations. |
| **Code splitting causing waterfall delays** | MEDIUM (20-30 hours) | 1. Profile bundle: identify which chunks are critical path vs. lazy. 2. Move critical chunks to main.js, keep lazy chunks separate. 3. Test load order + waterfall. 4. Add Suspense boundaries + loading UI. 5. Measure time-to-interactive before/after. |
| **Prose cache stale in late-game** | LOW (5-10 hours) | 1. Clear prose cache (simple one-liner). 2. Add state hash to cache key. 3. Add invalidation on agent change. 4. Test prose correctness. 5. No player impact if prose is client-side only. |
| **Phase mutation order ambiguity breaking determinism** | MEDIUM (30-50 hours) | 1. Audit which properties have multi-phase mutation. 2. Declare single owner per property (ownership matrix). 3. Reorder phases to owner-first. 4. Add assertion that non-owner phases don't mutate. 5. Re-test determinism with new order. |
| **PRNG state leakage between phases** | MEDIUM (20-40 hours) | 1. Add trace emission to every PRNG call. 2. Replay same seed, compare roll sequences between old + new. 3. Find where roll consumption changed. 4. Fix conditional rolls (make consumption explicit). 5. Test with multiple seed + agent set combos. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unseeded Math.random() | Phase 2 (PRNG refactor) | `npm test` passes determinism test with 5+ different seeds. `window.__DEBUG.getTraces()` shows all PRNG calls traced with tick/phase/roll. Same seed used 3 times → identical encounter sequence. |
| Cache invalidation races | Phase 1 (measure), Phase 3 (implement validation), Phase 5 (tune threshold) | `npm test encounterCache.test.ts` includes 50-tick integration test. Debug panel shows cache rebuild count per tick. Late-game FPS profile shows <5% CPU for cache. |
| Code splitting bloat | Phase 6 (implement chunks) | `npx vite build` output shows main.js <300KB. Three separate chunks for encounters/actions/prose. Lighthouse score >80. Time-to-interactive <1s on slow 3G. |
| Prose cache staleness | Phase 7 (prose implementation) | Integration test verifies prose differs when agent state changes. Debug panel shows cache hit %, state hash. Prose consistency check: compare character sheet vs. prose description, no mismatches. |
| Phase mutation order | Phase 1 (document), Phase 4 (enforce) | `Docs/phase-property-ownership.md` exists with ownership matrix. Code assertion `assertPhaseOwnershipNotViolated()` called in each phase. Determinism test passes when phases reordered. |
| PRNG state leakage | Phase 2 (PRNG refactor) | Traces show roll sequence identical for same seed + same agent set. Test with agent sets [A,B], [A,B,C], [A,B,C,D]: encounters differ but roll sequence deterministic within set. |
| Mutable state race conditions | Phase 2 (document), Phase 4 (validate), Phase 8+ (monitor) | Single `setLocationState()` function owns all mutations. `validateEncounterCache()` passes at phase end. Late-game with 200+ locations: no stale cache entries detected. |

---

## Sources

- [GitHub - davidbau/seedrandom: seeded random number generator for Javascript](https://github.com/davidbau/seedrandom)
- [Seeding the Random Number Generator in JavaScript: Can You Seed Math.random()? — xjavascript.com](https://www.xjavascript.com/blog/seeding-the-random-number-generator-in-javascript/)
- [How to Reduce Frontend Bundle Size in Large React Apps](https://wirefuture.com/post/how-to-reduce-frontend-bundle-size-in-large-react-apps)
- [Code-Splitting – React](https://legacy.reactjs.org/docs/code-splitting.html)
- [Optimizing Bundle Sizes in React Applications: A Deep Dive into Code Splitting and Lazy Loading](https://www.coditation.com/blog/optimizing-bundle-sizes-in-react-applications-a-deep-dive-into-code-splitting-and-lazy-loading)
- [Caching in 2026: Fundamentals, Invalidation, and Why It Matters More Than Ever — Medium](https://lukasniessen.medium.com/caching-in-2026-fundamentals-invalidation-and-why-it-matters-more-than-ever-867fee46e98b)
- [The Cache Invalidation Nightmare: What You're Likely Doing Wrong — TRIOTECH SYSTEMS](https://triotechsystems.com/the-cache-invalidation-nightmare-what-youre-likely-doing-wrong/)
- [Common Sense Refactoring of a Messy React Component — Alex Kondov](https://alexkondov.com/refactoring-a-messy-react-component/)
- [Shared State Complexity in React – A Complete Handbook for Developers — FreeCodeCamp](https://www.freecodecamp.org/news/shared-state-complexity-in-react-handbook/)
- [An Empirical Study of Refactoring Engine Bugs — ACM Transactions on Software Engineering](https://dl.acm.org/doi/10.1145/3747289)
- [Fixing Performance Drops and Memory Leaks in Three.js Applications — Mindful Chase](https://www.mindfulchase.com/explore/troubleshooting-tips/frameworks-and-libraries/fixing-performance-drops-and-memory-leaks-in-three-js-applications.html)
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

---

*Pitfalls research for: React + TypeScript game engine optimization retrofit*
*Researched: 2026-03-30*
*Applied to: The Fantasy World Simulator v1.1 low-hanging fruit optimization*
