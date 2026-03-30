# Feature Research

**Domain:** Game engine optimization milestone (v1.1 — React + TypeScript + Vite + Three.js)
**Researched:** 2026-03-30
**Confidence:** HIGH (all findings verified against source files)

---

## Feature Landscape

### Table Stakes (System Degrades Without These)

These are correctness bugs or missing wiring that cause the system to behave incorrectly or inconsistently.
Missing these means the engine makes promises it cannot keep.

| Feature | Why Required | Complexity | Evidence |
|---------|--------------|------------|---------|
| Fix unseeded `Math.random()` in tick loop | Breaks NFP #3 (Determinism). `resolution.ts:39` (d100 roll) and `meetingEncounter.ts:422` (agent ID) call raw `Math.random()` inside tick-path code. Same seed produces different results. | LOW | `src/engine/resolution.ts:39`, `src/engine/meetingEncounter.ts:422` |
| Replace `Date.now()` as game-state ID source | IDs for intervention effects, doom/mandate events, and orchestrator tick events use `Date.now()`. Cross-session ID collision is possible; determinism test skipped because of this. | LOW | `src/engine/interventionEffects.ts:141`, `phaseMandate.ts:32`, `phaseDoom.ts:28`, `phaseControlEffects.ts:53`, `orchestrator.ts:1326` |
| Wire `onFocusHex` in GameView | Notification camera-focus stub is empty (`() => { /* TODO */ }`). Every notification that references a hex silently fails to navigate the player. `centerOn()` on the HexMapV2 handle already exists and works — just needs calling. | LOW | `src/components/Game/GameView.tsx:429`, `HexMapV2.tsx:395` |
| Wire avatar position into `useTargetActions` | `avatarPos: undefined` is hardcoded. Location-relative action availability is incorrect for position-dependent actions. Graph visibility data is available to derive this. | LOW | `src/components/Game/hooks/useTargetActions.ts:36` |
| Extract actor ID from tick events (chronicle) | `orchestrator.ts:764` has TODO comment. Narrative chronicle entries lose specific actor attribution. Actor-linked events appear generic in the chronicle UI. | LOW | `src/engine/orchestrator.ts:764` |

### Differentiators (Measurably Improves Quality)

These are enhancements that improve performance, maintainability, or developer experience but don't break existing behavior.

| Feature | Value Proposition | Complexity | Evidence |
|---------|-------------------|------------|---------|
| Tune encounter cache rebuild threshold | `CACHE_REBUILD_THRESHOLD = 50` in `agent-behavior-constants.ts`. Unknown whether this causes over-rebuilding in practice. Profile: how many location changes occur per 100 ticks vs rebuild cost. | MEDIUM | `src/engine/encounterCache.ts:42-50`, `src/data/agent-behavior-constants.ts:457` |
| Cache prose resolver output | `proseResolvers.ts` (1185 lines, no caching detected) re-computes agent descriptions on every detail panel open. Agent state hashes can serve as cache keys. Saves <100ms per open but compounds across a session. | MEDIUM | `src/engine/proseResolvers.ts` (no cache hit) |
| Extract DebugPanel sub-components | `DebugPanel.tsx` is 1774 lines with nested `useEffect` hooks and conditional rendering trees. Fragility is documented: "Do not add more conditional branches without extracting sub-components." No refactoring risk — extraction is purely additive. | MEDIUM | `src/components/Game/DebugPanel.tsx:1774` |
| Code-split large data files | `encounter-content.ts` (8480 lines), `unified-action-templates.ts` (2906 lines), `culture-content.ts` (2409 lines) load synchronously at bootstrap. Total data payload: ~36K lines across 14 files. Dynamic imports with Vite `import()` reduce initial bundle. | HIGH | `src/data/` directory audit |
| Document and enforce trace buffer rotation limit | `tickHealthMonitor.ts` has a rolling buffer but rotation limit is undocumented. Risk of memory growth in 8-hour sessions. Low implementation cost; high safety value. | LOW | `src/engine/tickHealthMonitor.ts:77` |

### Anti-Features (Deliberately NOT Optimizing Yet)

These are things that appear to be optimization candidates but should be deferred to avoid scope creep or premature work.

| Feature | Why Requested | Why Defer | What to Do Instead |
|---------|---------------|-----------|-------------------|
| Lodash deduplication | CONCERNS.md flags "inconsistent lodash vs lodash-es" as bundle risk | **Already resolved.** `package.json` contains no lodash dependency. Zero files import from lodash. This is a non-issue — remove from backlog. | Close out this concern item |
| Fix `handlePopupChoice` effect dispatch | Missing popup choice effects is documented as a tech debt item | Blocked on game design decision: immediate vs deferred resolution, state vs encounter trigger. Implementing without the design causes a second rewrite. | Keep stub, add design decision to backlog as prerequisite |
| Conditional sublocation dissolution | Sublocations never dissolve based on game state | Requires mini-language design for condition evaluation (property path syntax, graph query). Not scoped for v1.1. | Design-first: define condition language before touching the engine |
| Familiarity tier gates for intent visibility | Agent intents visible regardless of familiarity | `PROTOTYPE_INTENT_VISIBLE` flag exists; this is guarded as prototype behavior. Requires design decision on tier thresholds. | Leave prototype flag in place; implement in a dedicated character-sheet phase |
| InstancedMesh frustum culling | Noted in CONCERNS.md; currently disabled due to impediment #12 (shared geometry bug) | Geometry isolation fix must come first. Attempting culling before fixing shared geometry will reintroduce the original bug. | Fix shared geometry in isolation; frustum culling is a follow-on item |
| Graph mutation phase isolation tests | Phases may mutate same properties non-deterministically | Requires integration test infrastructure for two-phase mutation verification. Current unit tests mock the graph. Higher investment than v1.1 scope. | Add to QA milestone backlog |

---

## Feature Dependencies

```
Fix Math.random() in resolution.ts
    └──enables──> Re-enable determinism integration test (currently skipped)
                      └──enables──> Reliable seeded replay for QA

Fix Date.now() IDs
    └──enables──> Re-enable determinism integration test

Wire actor ID in chronicle
    └──enhances──> Narrative event attribution quality

Wire onFocusHex
    └──requires──> hexMapRef.current?.centerOn() (already available)

Tune encounter cache threshold
    └──requires──> Profiling (measure location changes per 100 ticks)
    └──enhances──> Prose caching (both reduce per-tick overhead)

Extract DebugPanel sub-components
    └──enables──> Adding new debug views without fragility risk

Code-split data files
    └──conflicts──> Sync access patterns in encounter-content imports
                       (unified-action-templates imports encounter-content; dynamic split requires lazy resolution)
```

### Dependency Notes

- **Determinism fixes are independent of each other** — `Math.random()` fix and `Date.now()` fix can be implemented and tested separately. Both must be done before the skipped integration test can be re-enabled.
- **Code splitting conflicts with import chains** — `unified-action-templates.ts` statically imports `encounter-content.ts`. Dynamic splitting requires lazy initialization or a registry pattern. This is the source of HIGH complexity rating.
- **Encounter cache tuning requires profiling first** — do not guess at the threshold value; measure actual location churn rate in a 100-tick simulation with the CLI (`npm run cli -- tick 100`), then set the constant.
- **DebugPanel extraction is independent** — no engine changes needed. Pure UI refactor with zero cross-boundary risk.

---

## Optimization Priority Matrix

| Feature | Correctness Impact | Performance Impact | Implementation Cost | Priority |
|---------|-------------------|-------------------|---------------------|----------|
| Fix `Math.random()` in resolution + meetingEncounter | HIGH (determinism broken) | None | LOW | P1 |
| Fix `Date.now()` IDs (5 files) | HIGH (determinism broken, ID collision risk) | None | LOW | P1 |
| Wire `onFocusHex` | MEDIUM (UX broken for hex-linked notifications) | None | LOW | P1 |
| Wire avatar position in useTargetActions | MEDIUM (action availability incorrect) | None | LOW | P1 |
| Extract actor ID in chronicle | MEDIUM (attribution lost) | None | LOW | P1 |
| Tune encounter cache threshold | LOW (may be fine at 50) | MEDIUM | MEDIUM | P2 |
| Cache prose resolver output | None | MEDIUM | MEDIUM | P2 |
| Document trace buffer rotation | None | LOW (safety) | LOW | P2 |
| Extract DebugPanel sub-components | None (correctness) | LOW (DX) | MEDIUM | P2 |
| Code-split data files | None | HIGH (initial load) | HIGH | P3 |

**Priority key:**
- P1: Fix in v1.1 — correctness bugs or trivial wiring
- P2: Include in v1.1 if scoped — measurable improvement, bounded effort
- P3: Defer — high complexity, requires separate investigation phase

---

## Phase Sequencing Recommendation

Based on dependency analysis and the correctness-first NFP ordering:

**Phase 1 — Determinism Fixes (P1, LOW effort)**
Fix all `Math.random()` calls in tick-path code, replace `Date.now()` ID generators with tick-local sequence numbers, re-enable the skipped determinism integration test.

**Phase 2 — Missing Wiring (P1, LOW effort)**
Wire `onFocusHex` using existing `centerOn()` handle, resolve avatar position from graph visibility data and inject into `useTargetActions`, extract `actorId` from tick events in orchestrator chronicle path.

**Phase 3 — Performance Tuning (P2, MEDIUM effort)**
Profile encounter cache rebuild frequency, tune `CACHE_REBUILD_THRESHOLD`, add prose output cache with agent-state-hash invalidation, document trace buffer rotation limits.

**Phase 4 — Code Hygiene (P2, MEDIUM effort)**
Extract DebugPanel sub-components (EncounterCacheView, DecisionBreakdownView, etc.). Remove lodash concern from backlog (already resolved). Close out false-positive concerns.

**Phase 5 — Bundle Optimization (P3, HIGH effort, deferred)**
Design lazy-loading registry for encounter-content, implement Vite dynamic imports for large data files. Requires architectural decision on initialization order first.

---

## Sources

- `src/engine/resolution.ts:39` — unseeded `Math.random()` d100 roll (verified 2026-03-30)
- `src/engine/meetingEncounter.ts:422` — unseeded `Math.random()` in agent ID (verified 2026-03-30)
- `src/engine/interventionEffects.ts:141`, `phaseMandate.ts:32`, `phaseDoom.ts:28`, `phaseControlEffects.ts:53`, `orchestrator.ts:1326` — `Date.now()` ID sources (verified 2026-03-30)
- `src/components/Game/GameView.tsx:429` — `onFocusHex` stub (verified 2026-03-30)
- `src/components/HexMapV2/HexMapV2.tsx:395` — `centerOn()` handle available (verified 2026-03-30)
- `src/components/Game/hooks/useTargetActions.ts:36` — `avatarPos: undefined` stub (verified 2026-03-30)
- `src/engine/orchestrator.ts:764` — actor ID TODO in chronicle path (verified 2026-03-30)
- `src/data/agent-behavior-constants.ts:457` — `CACHE_REBUILD_THRESHOLD = 50` (verified 2026-03-30)
- `src/engine/proseResolvers.ts` — 1185 lines, no cache detected (verified 2026-03-30)
- `src/components/Game/DebugPanel.tsx` — 1774 lines confirmed (verified 2026-03-30)
- `package.json` — no lodash dependency; lodash concern is a resolved non-issue (verified 2026-03-30)
- `.planning/codebase/CONCERNS.md` — primary concern catalog (2026-03-30 audit)

---
*Feature research for: v1.1 optimization milestone — TheFantasyWorldSimulator*
*Researched: 2026-03-30*
