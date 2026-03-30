# Research Index: v1.1 Optimization Domain

**Overall Confidence:** MEDIUM-HIGH  
**Researched:** 2026-03-30  
**For Roadmap:** v1.1 Low-hanging fruit optimization (Phases 18-20)

## File Guide

### SUMMARY.md (245 lines)
**Executive overview of the optimization domain.**

The v1.0 codebase (1,055 files, 85K LOC) is performant but has three structural inefficiencies:
1. 700KB synchronous content payload
2. Non-deterministic engine phases
3. Cache-miss on every prose access

Recommended stack: Vite dynamic imports + existing mulberry32 PRNG + content-hash cache.

**When to read:** Start here. Gives overall approach and phase ordering.

---

### PITFALLS.md (484 lines, 41KB)
**Critical mistakes to avoid when retrofitting optimizations.**

7 pitfalls identified:
1. Unseeded Math.random() in running tick loop
2. Cache invalidation race conditions
3. Synchronous data file imports blocking load
4. Mutable state cache rebuild threshold (unmeasured)
5. Graph node mutation order ambiguity across phases
6. PRNG state leakage between calls
7. Prose cache built on stale agent state

Each pitfall includes:
- What goes wrong (failure mode)
- Why it happens (root cause)
- How to avoid (prevention strategy)
- Warning signs (early detection)
- Phase to address (roadmap mapping)

Plus: Technical debt table, integration gotchas, performance traps, security mistakes, UX pitfalls, recovery strategies, phase-to-pitfall mapping.

**When to read:** Before designing phases 18-20. Use tables to inform success criteria.

---

### STACK.md (822 lines, 25KB)
**Technology recommendations for v1.1 optimization.**

Covers:
- Code splitting (Vite dynamic imports)
- Seeded PRNG (mulberry32 injection)
- Cache invalidation (content-hash strategy)
- Component extraction (custom hooks pattern)
- Installation & alternatives

**When to read:** When implementing technical decisions. Reference for dependency choices.

---

### ARCHITECTURE.md (388 lines, 23KB)
**Recommended architecture patterns for v1.1.**

Covers:
- Code splitting boundaries (chunks for encounters, actions, prose)
- PRNG injection flow (GameState → Tick → Phases)
- Content-hash cache invalidation (state hash-based)
- Component extraction hierarchy (hooks → views)

Includes scalability considerations and patterns to follow.

**When to read:** During phase design. Visual reference for data flow + component structure.

---

### FEATURES.md (148 lines, 12KB)
**What to build in v1.1 (derived from CONCERNS.md).**

Feature landscape:
- Table stakes: Code splitting, PRNG injection, determinism test
- Differentiators: Prose cache, DebugPanel extraction
- Anti-features: (none — all features are value-add)

MVP recommendation: Phases 18-20 cover all priorities.

**When to read:** To understand scope + feature dependencies.

---

## Quick Reference Tables

### Phase Ordering (from PITFALLS.md)

| Phase | Prevention | Why Order Matters |
|-------|-----------|------------------|
| 2-3 | PRNG audit + injection | Unblocks determinism test |
| 3 | Cache measurement + validation | Requires benchmarking before threshold |
| 4-5 | Phase ownership docs | Enforces single-writer rule |
| 6 | Code splitting | Must precede v1.2 content expansion |
| 7-8 | Prose cache + staleness | Lower priority, can come later |

### Codebase Pitfalls Already Exhibiting

| Pitfall | Evidence | Risk |
|---------|----------|------|
| Unseeded PRNG | determinism test `.skip()` | HIGH — blocks multiplayer |
| Cache invalidation | no validation check | HIGH — late-game stale cache |
| Untuned rebuild threshold | value unknown | MEDIUM — becomes critical at scale |
| Data file imports | 700KB bundle | MEDIUM — blocks at v1.2 (2-3MB) |
| Prose cache staleness | no state hashing | MEDIUM — visible to player |

### Recovery Costs (If Prevention Skipped)

| Pitfall | Recovery Time | Effort |
|---------|---------------|--------|
| Unseeded PRNG retrofit | 100+ hours | Audit all sites + re-test |
| Cache stale entries | 20-40 hours | Clear + revalidate |
| Code splitting waterfall | 20-30 hours | Re-architect bundle |
| Prose cache stale | 5-10 hours | Add state hash |
| Phase mutation races | 30-50 hours | Document ownership + reorder |

---

## How to Use This Research

### For Phase Design (Phases 18-20)

1. **Phase 18 design doc** → Include prevention strategies from PITFALLS.md Pitfalls 1, 3, 6
2. **Phase 19 design doc** → Include prevention strategies from Pitfall 7
3. **Phase 20 design doc** → Include prevention strategies from Pitfalls 2, 4, 5

Add success criteria from "How to avoid" sections.

### For Regression Testing

Copy the "Warning signs" tables into test specs. Each pitfall becomes a test:

- Determinism test: Same seed, 100 ticks, compare encounter sequence
- Cache consistency test: 50 ticks + location creation/deletion, verify no stale entries
- Bundle size test: `npx vite build`, main.js must be <300KB
- PRNG trace audit: Every call logged with tick/phase/roll
- Prose staleness: Agent state changes, verify prose differs

### For Ongoing Monitoring

Schedule these tasks in quarterly planning:

- Re-measure cache rebuild threshold (location spawn rate changes)
- Three.js version compatibility check
- Bundle size regression report
- Prose cache hit % review

---

## Confidence Notes

| Area | Confidence | Validation Needed |
|------|------------|------------------|
| PRNG pitfalls | HIGH | Already exhibit; confirmed by code review |
| Cache invalidation | HIGH | CONCERNS.md documents; validated by distributed systems research |
| Code splitting | MEDIUM-HIGH | Bundle measured; load time impact inferred |
| Prose cache staleness | MEDIUM | Pattern documented; needs scale testing |
| Phase ordering | MEDIUM | Logic sound; needs validation during execution |

---

## Gaps & Open Questions

Before committing to v1.1 phases, verify:

1. **CI setup** — How to add bundle size regression test?
2. **PRNG library** — Is seedrandom.js already a dependency? Or keep mulberry32?
3. **Prose cache memory** — Will 500-entry LRU fit? Profile actual prose size.
4. **Phase ownership automation** — How to enforce single-writer rule at runtime?
5. **Threshold re-tuning schedule** — When in roadmap should this happen?

---

*Research archive for v1.1 optimization. Use PITFALLS.md + STACK.md as primary design input for Phases 18-20.*
