# Research Summary: v1.1 Optimization Stack

**Domain:** React + Vite + TypeScript game engine optimization

**Researched:** 2026-03-30

**Overall confidence:** HIGH

---

## Executive Summary

The v1.0 codebase (1,055 files, 85K LOC) is performant but has three structural inefficiencies targeting v1.1:

1. **700KB synchronous content payload** — All data files (encounter, action templates, culture) bundle and parse at app startup, blocking initial render. Scaling to 1000+ encounters adds 5-10MB.

2. **Non-deterministic engine phases** — Multiple Math.random() calls in core engine (resolution, meeting generation, ID creation) break determinism. Same seed produces different sequences. Codebase already has seeded PRNG (mulberry32) for worldgen but doesn't inject it into tick phases.

3. **Cache-miss on every prose access** — Agent descriptions regenerate on every detail panel open (~100ms × agent count). Encounter cache rebuild threshold unknown, may trigger unnecessarily. No explicit content-hash invalidation.

4. **Monolithic 1,774-line component** — DebugPanel has 48 useState hooks, fragile nested rendering, no sub-component tests. Impediment #10 flags this as a safety risk.

**Stack solution is incremental:** No new major dependencies. Vite 6+ native dynamic imports, keep existing mulberry32 PRNG, custom content-hash cache (leveraging JSON.stringify), and idiomatic React custom hooks for component extraction.

---

## Key Findings

### Stack Dimension

**Technology stack is well-chosen for optimization. No major replacements needed.**

| Requirement | Current | Recommended | Rationale |
|-------------|---------|-------------|-----------|
| **Code splitting** | None (all bundled) | Vite dynamic imports + manualChunks | Native, Vite 6+ stable, no new deps |
| **Seeded PRNG** | mulberry32 (worldgen only) | mulberry32 (inject into all phases) | Already shipping, proven, fast |
| **Cache invalidation** | None (recompute on access) | Content-hash cache (manual, not React.cache) | React.cache is Server Components only; game state is client-side mutable |
| **Component extraction** | None (DebugPanel monolithic) | Custom hooks + view components | React 19 standard, preserves hook ordering |

**Why not alternatives:**

- **seedrandom npm:** Larger, less suitable for tight game loop; mulberry32 already proven
- **Redux/TanStack Query:** Over-engineered for local game state; custom cache is sufficient
- **React.cache():** Server Component API only; game engine runs on client
- **React Three Fiber:** Codebase explicitly rejects R3F; direct Three.js required for InstancedMesh control

### Features

**What to build in v1.1 (derived from CONCERNS.md priorities):**

| Phase | Feature | Effort | Why v1.1 |
|-------|---------|--------|----------|
| **18** | Code split encounter content | 8h | Unblocks 1000+ encounter scaling; easy win with manualChunks |
| **18** | Determinism: PRNG injection | 12h | Blocks testing; v1.0 shipped with nondeterministic engine |
| **19** | Prose caching | 4h | Quick UX improvement; addresses known delay |
| **20** | DebugPanel extraction | 8h | Risk mitigation; fragile area per CONCERNS |
| **20** | Encounter cache tuning | 4h | Profiling after metrics added to DebugPanel |

**Deferred (post-v1.1):**

- Lodash audit (nice-to-have, not blocking)
- Three.js version drift (monitor quarterly, not urgent)
- Accessibility keyboard nav (important but separate milestone)

### Architecture

**Code splitting** creates discrete lazy-load boundaries:

```
App init:
  ├─ vendor chunk (~200KB, cached)
  ├─ app logic chunk (~150KB, cached)
  └─ placeholder until needed
      ├─ encounters chunk (load on game start)
      ├─ actions chunk (load on ActionDrawer mount)
      └─ culture chunk (load on AgentDetail mount)
```

**PRNG injection** threads seeded generator through tick loop:

```
GameState { rng: GameRNG }
  ↓
  Tick loop
  ├─ phaseResolution(state, rng) → d100 roll
  ├─ phaseMeeting(state, rng) → ID gen
  └─ phaseEssence(state, rng) → ?

Same seed ⟹ same RNG ⟹ same sequence ⟹ deterministic
```

**Content-hash cache** invalidates on state change, not time:

```
Agent state changes
  ↓
  Hash differs
  ↓
  Prose regenerated (cache miss)
  ↓
  New hash stored
  ↓
  Agent unchanged
  ↓
  Same hash (cache hit)
  ↓
  Prose served from cache
```

**Component extraction** preserves React hook invariants:

```
DebugPanel (1,774 → ~100 lines, composition only)
  ├─ hook: useDebugEncounterCache()
  │   └─ view: <EncounterCacheView/>
  ├─ hook: useDebugDecisionBreakdown()
  │   └─ view: <DecisionBreakdownView/>
  └─ hook: useDebugEncounterTimeline()
      └─ view: <EncounterTimelineView/>

All hooks called unconditionally → no hook ordering violations
```

### Pitfalls to Avoid

1. **Circular imports on code split** — `unified-action-templates.ts` imports `encounter-content.ts`. Add `validateTemplateRegistry()` at game start after both load.

2. **Hash cache scope too broad** — Don't cache across game resets. Create new cache instance in `initializeGameState()`.

3. **PRNG not threaded everywhere** — Must inject into all phases, not just resolution. Leave `Math.random()` only in UI flavor code (avatar names, particle colors).

4. **Component extraction with conditional hooks** — Extract hooks to custom hooks first, then split rendering. Don't extract rendering before logic.

5. **Encounter cache false negatives** — Rebuild threshold applies to location changes. If threshold is too high (e.g., 100), stale encounters appear. Empirically profile first.

---

## Implications for Roadmap

### Phase Ordering

**Phases 18-20 must be sequential** due to dependencies:

| Phase | Work | Blocker | Unblocks |
|-------|------|---------|----------|
| **18** | Code split + PRNG inject | None | Phase 20 metrics |
| **19** | Prose cache + encounter tune | Phase 18 (RNG) | None (independent) |
| **20** | DebugPanel extract + validate | Phase 18 (metrics) | Phase 21+ work |

**Rationale:**

- Phase 18 fixes determinism (required for Phase 20 testing)
- Phase 19 can run parallel to Phase 20 (independent concerns)
- Phase 20 depends on Phase 18 metrics (DebugPanel must display cache stats)

### Research Flags

| Phase | Topic | Flag | Reason |
|-------|-------|------|--------|
| **18** | Dynamic import loading | RESEARCH | Unclear optimal load point for each content category; requires phase-specific design |
| **18** | PRNG injection scope | RESEARCH | Many Math.random() calls; must catalog all before injecting to avoid missing any |
| **19** | Cache invalidation strategy | VALIDATE | Content-hash approach untested at scale; profile with 100+ agents before committing |
| **20** | Component extraction order | VALIDATE | Must verify no hook ordering violations in extracted code; test with React Strict Mode |
| **20** | Encounter cache threshold | PROFILE | Current threshold unknown; must measure location-change rate and rebuild cost |

**Mitigation:** Add to phase DESIGN sections:

- Phase 18 design: Specify load point for each content category (encounter at game start? per location? on demand?)
- Phase 18 design: Catalog all Math.random() calls; create replacement table
- Phase 19 design: Profile with 10, 100, 1000 agent scenarios; measure prose cache hit rate
- Phase 20 design: Extract EncounterCacheView first (most fragile); add tests before other views
- Phase 20 design: Add metrics collection; run 100+ tick simulation to measure rebuild frequency

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Code splitting (Vite)** | HIGH | Vite 6+ official docs, tested pattern, low risk |
| **PRNG replacement** | HIGH | Mulberry32 already implemented, proven in worldgen |
| **Cache invalidation** | MEDIUM | Content-hash pattern sound, but untested at scale; needs profiling phase |
| **Component extraction** | HIGH | React 19 standard pattern, multiple sources validate hook preservation |
| **Encounter cache tuning** | LOW | Current threshold opaque; phase-specific profiling required |

**Overall stack confidence:** HIGH (patterns are sound; implementation is incremental)

---

## Gaps to Address

### Before Committing to v1.1 Phases

1. **Profiling baseline:** Add tick-loop health monitor metrics (tick duration, phase costs, event throughput) before Phase 18. Measure prose resolution time before and after cache.

2. **Catalog all Math.random():** Grep codebase for all unseeded random; create table with replacement strategy (engine phase vs. UI flavor).

3. **Content load point design:** Decide per-category: is encounter content loaded once at game start, or lazily per location? Does ActionDrawer lazy-load actions on first open, or at game start?

4. **Encounter cache validation:** Add integration test that runs 100+ tick simulation with location creation/deletion and verifies cache stays consistent (currently missing per CONCERNS.md line 238).

### Phase 20+ (After v1.1)

5. **Three.js version compatibility:** Quarterly audit of Three.js release notes. Verify InstancedMesh, custom shader patterns still supported.

6. **D3-zoom update strategy:** Test d3-zoom upgrades with custom wheel handler before merging.

7. **Accessibility keyboard nav:** Separate milestone; ensure modals, ActionDrawer, DebugPanel support keyboard-only interaction.

---

## Recommended Approach

**Start v1.1 with Phase 18 (code splitting + PRNG). Parallelize Phase 19 + 20.**

**Estimated effort:**

- Phase 18: 20 hours (code split design + PRNG injection + determinism test)
- Phase 19: 4 hours (prose cache + encounter tuning)
- Phase 20: 12 hours (DebugPanel extraction + validation)
- **Total: 36 hours (~1 week at 6h/day)**

**Success criteria:**

- [ ] Bundle size reduced by 30% on initial load (move large data files to lazy chunks)
- [ ] Determinism test passes (same seed produces identical 100-tick sequence)
- [ ] Prose resolution latency <50ms (down from 100ms+)
- [ ] DebugPanel spans 5 files, each <400 lines, all tested
- [ ] No hook ordering violations (React Strict Mode passes)

---

## Sources

- [Vite Documentation: Features & Build Options](https://vite.dev/guide/features)
- [Vite Dynamic Imports Best Practices](https://github.com/vitejs/vite/discussions/17730)
- [Rollup manualChunks Strategy](https://soledadpenades.com/posts/2025/use-manual-chunks-with-vite-to-facilitate-dependency-caching/)
- [React 19 Custom Hooks Guide](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a-461d30f8ce4)
- [React Component Extraction & Hook Ordering](https://codescene.com/blog/refactoring-components-in-react-with-custom-hooks)
- [Cache Invalidation Strategies (2026)](https://lukasniessen.medium.com/caching-in-2026-fundamentals-invalidation-and-why-it-matters-more-than-ever-867fee46e98b)
- [Game Engine Determinism Patterns](https://gamedev.stackexchange.com/questions/108151/seeded-random-number-generator)

---

*Research complete. Ready for roadmap phase design.*
