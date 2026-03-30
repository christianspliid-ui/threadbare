# Roadmap: The Fantasy World Simulator

## Milestones

- ✅ **v1.0 Foundation** — Phases 1-18 + M2.5 (shipped 2026-03-30) → [Archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Low-Hanging Fruit Optimization** — Phases 19-22 (in progress)

<details>
<summary>✅ v1.0 Foundation (22 phases, 81 plans) — SHIPPED 2026-03-30</summary>

### Hex Map V2 (Phases 1-9)
- [x] Phase 1: Renderer Foundation (2 plans)
- [x] Phase 2: World Generation (3 plans)
- [x] Phase 3: Coastlines, Water & Elevation (3 plans)
- [x] Phase 4: Regions & Borders (3 plans)
- [x] Phase 5: Hex Composition & Landscape Signifiers (4 plans)
- [x] Phase 6: Locations & Agents (4 plans)
- [x] Phase 7: Fog, Zoom & Grid (3 plans)
- [x] Phase 7.1: Stencil Coastline (1 plan)
- [x] Phase 8: Integration (4 plans)
- [x] Phase 9: Start Screen (3 plans)

### Living World M1: Sphere Affinity
- [x] Phase 10: Sphere Affinity — data model, pressure resolution, upstream/downstream wiring, magic, IPK UI (9 plans)

### Character Sheet
- [x] Phase 11: Agent Character Sheet Overhaul — 5-tab layout, knowledge model, revelation actions (6 plans)

### Living World M2: Conflict & Destruction
- [x] Phase 12: Conflict & Destruction — armies, battles, sieges, destruction, aftermath (7 plans)
- [x] Phase 12-flesh: Quintessence Migration (4 plans)
- [x] Phase 12.1: UI Review Fixes — army/battle layers, event colors, Tailwind (2 plans)
- [x] Phase 13: M2 Gap Closure — aftermath, army visuals, deferred tests (4 plans)
- [x] Phase M2.5: Monster Encounters — lairs, escalation, sphere feedback, divine targeting (4 plans)

### QOL & Polish
- [x] Phase 14: Pause on Encounters (1 plan)
- [x] Phase 15: Encounter Pipeline Fixes — scoring, movement, round-robin, content deserts (4 plans)
- [x] Phase 16: Threads Panel — sidebar for all graph-connected nodes (4 plans)
- [x] Phase 17: Action Feedback — MTG cards, spell names, particle bursts (4 plans)
- [x] Phase 18: Mercenary Company Pipeline — seeding, encounters, promotion (2 plans)

</details>

---

## 🚧 v1.1 Low-Hanging Fruit Optimization (In Progress)

**Milestone Goal:** Fix correctness bugs, wire missing connections, tune performance, and improve code hygiene — targeting only small-to-medium effort items with high impact.

### Phases

- [x] **Phase 19: Determinism** — Replace all unseeded Math.random/Date.now with seeded PRNG and verify with integration test (completed 2026-03-30)
- [x] **Phase 20: Wiring** — Connect three stubbed engine→UI paths (hex focus, avatar position, actor attribution) (completed 2026-03-30)
- [ ] **Phase 21: Performance** — Cache prose resolver output, tune encounter cache threshold, code-split large data files
- [ ] **Phase 22: Code Hygiene** — Extract DebugPanel sub-components, audit lodash, extend targetActions filtering

## Phase Details

### Phase 19: Determinism
**Goal**: The engine produces identical output for the same seed — no Math.random or Date.now calls survive in tick-phase code
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: DTRM-01, DTRM-02, DTRM-03
**Success Criteria** (what must be TRUE):
  1. Running the same seed twice produces byte-identical tick sequences for 100 ticks
  2. The previously-skipped determinism integration test passes without modification to its assertions
  3. No Math.random() call exists in resolution.ts, meetingEncounter.ts, orchestrator.ts, phaseMandate.ts, phaseDoom.ts, phaseControlEffects.ts, or interventionEffects.ts
  4. Event IDs are tick-local sequence numbers, not wall-clock timestamps — two runs produce the same IDs
**Plans:** 2/2 plans complete
Plans:
- [x] 19-01-PLAN.md — Replace Math.random() and Date.now() in 15 engine files with seeded PRNG and tick-local IDs (DONE 2026-03-30)
- [ ] 19-02-PLAN.md — Un-skip and extend determinism integration test to verify 100-tick byte-identical output

### Phase 20: Wiring
**Goal**: Three previously stubbed engine→UI connections are live — clicking a notification pans the camera, avatar position feeds action targeting, and actor IDs appear in traces
**Depends on**: Nothing (independent of Phase 19)
**Requirements**: WIRE-01, WIRE-02, WIRE-03
**Success Criteria** (what must be TRUE):
  1. Clicking a notification that references a hex causes the camera to animate to that hex (pan + zoom)
  2. The avatar's current hex position is available in the targetActions context so positional action filtering works
  3. Chronicle and trace entries for tick events include the actor ID of the originating agent
**Plans:** 2/2 plans complete
Plans:
- [ ] 20-01-PLAN.md — Verify WIRE-01 camera animation chain and WIRE-02 avatar position chain
- [ ] 20-02-PLAN.md — Add actorId to engine TickEvents and make NarrativeLog entries clickable

### Phase 21: Performance
**Goal**: Initial bundle load is faster, prose descriptions stop re-computing on every panel open, and the encounter cache rebuild threshold is documented and tuned
**Depends on**: Nothing (independent of Phases 19-20)
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. Opening an agent detail panel a second time (same agent, no state change) is visibly faster — prose is served from cache, not recomputed
  2. The encounter-content, action-templates, and culture-content data files load as separate lazy chunks, not in the initial bundle
  3. The encounter cache rebuild threshold is documented in a named constant with a comment explaining the profiled rationale; a developer can change it in one place
**Plans**: TBD

### Phase 22: Code Hygiene
**Goal**: DebugPanel is split into testable sub-components, lodash is consolidated to a single import path, and action template filtering supports required-property constraints
**Depends on**: Nothing (independent of all other phases)
**Requirements**: HYGN-01, HYGN-02, HYGN-03
**Success Criteria** (what must be TRUE):
  1. DebugPanel.tsx is under 200 lines and delegates all rendering to named sub-components (EncounterCacheView, DecisionBreakdownView, etc.), each in its own file
  2. No duplicate lodash bundles exist in the production build — npm ls shows a single lodash-es installation and zero bare-lodash references
  3. Action templates can declare required node properties and targetActions.ts filters them out when the target lacks those properties
**Plans**: TBD

---

## Progress

**Execution Order:** Phases 19 → 20 → 21 → 22 (all independent; can parallelize 20/21/22 after 19)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-18. Foundation | v1.0 | 81/81 | Complete | 2026-03-30 |
| 19. Determinism | 2/2 | Complete    | 2026-03-30 | - |
| 20. Wiring | 2/2 | Complete    | 2026-03-30 | - |
| 21. Performance | v1.1 | 0/TBD | Not started | - |
| 22. Code Hygiene | v1.1 | 0/TBD | Not started | - |

---

### Future Work

**M3: Dynamic Economy** — encounter→economy feedback, economic context→encounter scoring, wealth spending crossovers, trade route lifecycle, unrest, guild activation, Gold+Stone CRUD actions, resource consumption & scarcity.

**Cross-cutting concerns:** Doom with teeth, rival activation, onboarding, culture seeding, NPC workforce, chain reactions.
