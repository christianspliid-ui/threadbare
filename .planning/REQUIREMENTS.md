# Requirements: The Fantasy World Simulator v1.1

**Defined:** 2026-03-30
**Core Value:** The world must feel alive — every hex, agent, faction, and location has unique sphere character

## v1.1 Requirements

### Determinism

- [x] **DTRM-01**: All engine Math.random() calls replaced with seeded PRNG (resolution.ts, meetingEncounter.ts, AscendantSelection.tsx) — done 2026-03-30
- [x] **DTRM-02**: All Date.now() event ID generation replaced with tick-local sequence numbers (orchestrator.ts, phaseMandate.ts, phaseDoom.ts, phaseControlEffects.ts, interventionEffects.ts) — done 2026-03-30
- [x] **DTRM-03**: Determinism integration test un-skipped and passing (same seed produces identical 100-tick sequences)

### Wiring

- [x] **WIRE-01**: Notification hex click triggers camera pan/zoom via animateCameraTo (onFocusHex in GameView.tsx)
- [x] **WIRE-02**: Avatar position resolved and passed into targetActions context (useTargetActions.ts TODO)
- [x] **WIRE-03**: Actor ID extracted from TickEvent and included in trace/chronicle entries (orchestrator.ts event processing)

### Performance

- [ ] **PERF-01**: Prose resolver output cached by agent state hash; cache hit skips re-computation (proseResolvers.ts)
- [ ] **PERF-02**: Encounter cache rebuild threshold profiled and tuned with documented rationale (encounterCache.ts)
- [ ] **PERF-03**: Large data files code-split via Vite manualChunks — encounter-content, action-templates, culture-content loaded on demand

### Code Hygiene

- [ ] **HYGN-01**: DebugPanel.tsx (1774 lines) extracted into 4-5 sub-components with dedicated hooks (EncounterCacheView, DecisionBreakdownView, etc.)
- [ ] **HYGN-02**: Lodash imports audited — lodash-es only or replaced with native JS; no duplicate lodash bundles
- [ ] **HYGN-03**: targetActions.ts extended to support targetRequiredProperties filtering for action templates

## Future Requirements

### Deferred to v1.2+

- **DFRD-01**: Conditional sublocation dissolution (needs mini-language design)
- **DFRD-02**: Full choice resolution system (needs game design decision: immediate vs deferred)
- **DFRD-03**: Familiarity tier gates for agent intent visibility
- **DFRD-04**: Location control metric tracking in graph edges
- **DFRD-05**: Three.js resource cleanup verification (memory leak testing)
- **DFRD-06**: Accessibility keyboard navigation audit
- **DFRD-07**: Frustum culling re-enable (blocked by impediment #12 geometry isolation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full encounter cache rewrite | Too large for optimization milestone; incremental tuning sufficient |
| Graph mutation phase isolation enforcement | Needs runtime framework design; document ownership first |
| Trace buffer rotation/IndexedDB export | Not yet at scale limits (10K entries manageable) |
| Three.js version upgrade | No breaking issues; monitor quarterly per research |
| CI bundle size regression test | Good practice but not a code optimization; backlog as tooling |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DTRM-01 | Phase 19 | Complete (2026-03-30) |
| DTRM-02 | Phase 19 | Complete (2026-03-30) |
| DTRM-03 | Phase 19 | Complete |
| WIRE-01 | Phase 20 | Complete |
| WIRE-02 | Phase 20 | Complete |
| WIRE-03 | Phase 20 | Complete |
| PERF-01 | Phase 21 | Pending |
| PERF-02 | Phase 21 | Pending |
| PERF-03 | Phase 21 | Pending |
| HYGN-01 | Phase 22 | Pending |
| HYGN-02 | Phase 22 | Pending |
| HYGN-03 | Phase 22 | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 — traceability populated after roadmap creation*
