---
status: current
title: Encounter UI Implementation Phasing
date: 2026-05-05
linear: THR-317
parent_plan: 2026-05-04-encounter-experience-design-plan.md
canonical_ui_spec: 2026-05-04-encounter-ui-canonical.md
---

# Encounter UI — Implementation Phasing (2026-05-05)

**Status:** Implementation phasing for THR-301 (encounter UI long-form plan). Output of THR-317. Splits the long-form plan into executable child tickets with coordination blocks. Companion to the canonical UI spec (`2026-05-04-encounter-ui-canonical.md`) and the design plan (`2026-05-04-encounter-experience-design-plan.md`).

**Audience:** CC and Codex executors picking up child tickets in the Encounter Experience project. Cowork future sessions referencing the phasing model. Future audit of why these phase boundaries exist.

**Inputs:**
- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — the long-form plan; engine/content/UI pillars
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` — the canonical UI spec; component inventory, motion + sound briefs, aftermath sequencing, detail page pattern
- `Docs/plans/v7-design-pass/` — the design pass deliverable (JSX components, design tokens, fonts)
- `Docs/plans/2026-05-04-encounter-experience-v7.html` — visual reference
- THR-302 closeout (`Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md`) — Phase 0 cleanup outcomes

---

## 1. Goal and scope

THR-301's §11 deferred phasing on purpose: *"After this plan is approved at design level, we run a separate exploration on implementation phasing."* This is that exploration.

**Output of this exploration:**
1. Implementation phasing plan doc (this file).
2. Resolutions for the six v1-blocking items the long-form plan left as TBD.
3. Child Linear tickets in the Encounter Experience project, with coordination blocks per the protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.
4. New sibling design ticket THR-319 (detail page data model) — split out because it's too large for this plan to absorb as a single verdict line.

**Out of scope:**
- Implementation work itself (executors do the work).
- Phase 0 architectural cleanup — already shipped (THR-302).
- Content authoring epic (existing-encounter migration, character art, watch-only path content, detail-page content fill) — that's THR-318, parallel to this phasing.
- Polish items (accessibility audit, save/load mid-encounter, perf profiling, Storybook, hot reload) — deferred to post-v1.

---

## 2. The six v1-blocking decisions (resolved)

User verdicts 2026-05-05 confirmed all six recommendations.

### 2.1 TS schema for the encounter authoring contract

**Decision.** First Codex child ticket — *not* in this plan doc.

The YAML in design plan §4.1 is detailed enough that a Codex executor produces the TS shape mechanically in one PR. Settling it as the first ticket creates the contract every subsequent UI/engine ticket references. Output: `src/types/encounter-contract.ts` (the `EncounterContract` interface), `src/data/encounter-contract-validators.ts` (Zod schema), `src/engine/encounter-contract-adapter.ts` (UnifiedActionTemplate ↔ EncounterContract bidirectional adapter).

### 2.2 Sound asset production

**Decision.** Defer to a post-v1 polish epic. Build motion components with `onResolveBeat` / `onEffectLand` audio-cue callbacks ready, but ship silent.

Rationale: solo dev shipping the encounter UI itself is already large; sound design is a different craft. The motion is load-bearing. Locking in audio-cue contract from day one means post-v1 sound work doesn't require touching component logic. Filed as separate post-v1 ticket so the work doesn't get lost.

### 2.3 TTS integration point (Kokomoro voice)

**Decision.** Codex discovery ticket → spec → implementation. Three-step:
1. Discovery: find existing TTS infrastructure in the repo, document API, identify cancellation contract.
2. Spec: 5-line interface for encounter UI integration (function signature, voice param shape, cancellation flow).
3. Implementation: wire encounter prose + detail page prose to call the spec.

Rationale: writing a TTS spec without ground truth invents complexity. The discovery ticket de-risks. Implementation lands in a later phase.

### 2.4 Initial constants tuning

**Decision.** Defer to post-v1 tuning ticket. Ship NFP-#1-compliant placeholders (every constant is named, lives in `src/data/encounter-experience-constants.ts`, default per design plan §7).

Rationale: actual feel can't be predicted without play data — drift thresholds especially. The constants table satisfies tunability from day one. The tuning playtest needs to run on the actual shipped UI with real encounters; pre-implementation guesses are noise. Filed as separate post-v1 ticket.

### 2.5 Detail page data model — separate design ticket

**Decision.** Split out to **THR-319 — Detail page data model design** (sibling of THR-317/318 in Encounter Experience project). Phase E (detail page implementation children) blocks on THR-319 landing.

Direction settled in this exploration (Cowork verdict 2026-05-05): **hybrid pattern with componentized sections.**
- Detail pages are stacks of typed `Section` blocks. Each `Section` has its own resolver.
- Default resolver: graph-walking, extending `proseResolvers.ts` (existing prose-resolver architecture).
- Authored override: `node.showcase: true` flag triggers an authored prose lookup for that node's primary sections.
- Some sections are always graph-derived (RecentEncounters from event log, FactionAllegiances from `member_of` edges); others may have authored prose (Backstory, DispositionTowardHer).
- Prose tier mapping per section type (Routine / Notable / Chronicle, per Narrative Engine canon).
- Fallback templates exist for un-authored long-tail entities.

THR-319's job: spec the section schema, resolver registry contract, showcase-flag pattern, per-type detail page templates (Actor / Item / Faction / Place / Event), prose tier mapping, and integration with existing `proseResolvers.ts`. Output: a plan doc that the Phase E implementation tickets can execute against.

### 2.6 Callback eligibility computation ("moments that could echo")

**Decision.** Hybrid (author-pinned + graph-derived), mirroring the Ascendant hand filter pattern from design plan decision 2.6.

- Encounter author lists `callback_candidates: [event_id]` in the beat schema (already in §4.1).
- Engine treats those as author-pinned.
- If author lists none, engine traverses agent's history and scores by:
  - Recency: `last_invoked_tick` decay
  - Relevance: tag overlap with current beat (cast members, place type, faction, sphere)
  - Emotional weight: events tagged as structural (oaths, betrayals, deaths) outweigh incidental
- Top 1–3 surface in the "moments that could echo" strip.

New module: `src/engine/callbackEligibility.ts`. Codex-suitable spec.

---

## 3. Phase map

Seven implementation phases A–G + a post-v1 epic. Phases A–B–C are mostly parallel after A lands; D depends on C (animations need their host components); E depends on THR-319 + C; F is integration; G is polish gates.

```
THR-302 (Phase 0)  ─┐
                    ├─►  Phase A — Contract + Foundation  ────┬─►  Phase B — Engine modules
                    │                                         │
                    │                                         └─►  Phase C — UI components
                    │
                    │                                                      │
                    │                                                      ▼
THR-319 (parallel design)  ─────────────────────────────►  Phase E — Detail pages
                                                                           │
                                                                           ▼
                                                Phase D — Motion + animations
                                                                           │
                                                                           ▼
                                                           Phase F — Integration + wiring
                                                                           │
                                                                           ▼
                                                           Phase G — Test + lint
                                                                           │
                                                                           ▼
                                                                       v1 ship
                                                                           │
                                                                           ▼
                                                Post-v1 follow-ups (sound, tuning, TTS impl)
```

### Phase A — Contract + foundation (unblocks everything)

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **A1** | TS encounter contract schema + Zod validators + UnifiedActionTemplate adapter | `model:sonnet` | Codex |
| **A2** | Constants file + trace types + GameState field scaffolding (drift, detection, spotlight) | `model:sonnet` | Codex |
| **A3** | Animation keyframes promoted from `Docs/plans/v7-design-pass/` into `src/index.css` | `model:haiku` | Codex |

### Phase B — Engine modules (depends on A1, A2)

Parallel-safe with each other. Mostly Codex; a couple are CC for judgment-heavy math/feel.

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **B1** | Choice resolution module + drift accumulator + threshold detection | `model:opus-4-6` | CC |
| **B2** | Outcome forecast band computation | `model:sonnet` | Codex |
| **B3** | Hand filter cascade (target × cost × sphere × bond × place gating) | `model:sonnet` | Codex |
| **B4** | Detection escalation (regional pressure, decay, threshold crossings) | `model:sonnet` | Codex |
| **B5** | Encounter template graph node + relationship node + traversal | `model:opus-4-6` | CC |
| **B6** | Aftermath effect kinds — extend existing 8 with `archetype_drift_register` | `model:haiku` | Codex |
| **B7** | Callback eligibility computation (author-pinned + graph-derived) | `model:sonnet` | Codex |

### Phase C — UI components (depends on A1, A2, A3)

Parallel-safe with each other and with Phase B. Mostly CC because they're the primary surface where craft + design judgment lands.

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **C1** | Encounter screen layout shell + EiraHeroPanel | `model:opus-4-6` | CC |
| **C2** | EncounterChoiceCard + OutcomeForecastBand | `model:opus-4-6` | CC |
| **C3** | AscendantHand (extends ActionDrawer) + CastTile | `model:opus-4-6` | CC |
| **C4** | SceneStatePanel + scene-state indicators (drift, detection threads, factions) | `model:sonnet` | CC |

### Phase D — Motion + animations (depends on C, A3)

CC-heavy. Animations are the part most likely to feel wrong if delegated to mechanical executors.

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **D1** | ThreadOverlay — Moment 1 tension reveal sequence (1.6s, 5 beats) | `model:opus-4-6` | CC |
| **D2** | EffectRegistration components — Moment 2 aftermath landing animations (9 effect kinds) | `model:opus-4-6` | CC |
| **D3** | TTS integration discovery + 5-line spec for encounter UI | `model:sonnet` | Codex |

### Phase E — Detail pages (depends on THR-319 + C)

Blocks on THR-319 (detail page data model design). Cannot start until that plan doc lands.

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **E1** | DetailModal shell + breadcrumb stacking (extends `shared/Modal`) | `model:opus-4-6` | CC |
| **E2** | Five typed detail page instances (Actor / Item / Faction / Place / Event) | `model:opus-4-6` | CC |

### Phase F — Integration + wiring (depends on B, C, D)

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **F1** | Orchestrator phases (`phaseChoiceResolution`, `phaseAscendantHandFilter`, `phaseDriftDecay`, `phaseDetectionPressure`) + DebugPanel inspectors + wiring checklist updates | `model:sonnet` | Codex |
| **F2** | World view → encounter handoff (hex pulse + retinue priority pip + transition) | `model:sonnet` | CC |
| **F3** | Canonical doc updates (Domain Word Scales 8-reach, Fate Forecast supersession, Action Narrative System AgendaPicker note, taste-profile §"Three intervention verbs" revision, new `Systems/Encounter UI.md`) | `model:sonnet` | Codex |
| **F4** | CMS metadata-filter contract — finalize the work deferred from THR-302 (Option C inheritance) | `model:sonnet` | Codex |

### Phase G — Test + lint + polish (gates ship)

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **G1** | Engine unit + integration tests for B-phase modules | `model:sonnet` | Codex |
| **G2** | UI snapshot tests at 1920×1080 (and 2560×1440 sample) | `model:haiku` | Codex |
| **G3** | Content lint tests (tooltip graph entity references, `moral_axis_pole` validity, no numbers in forecast factor strings, prose quality heuristic) | `model:sonnet` | Codex |

### Post-v1 follow-ups (separate epic)

These are filed now so the work doesn't get lost; they don't block v1 ship.

| Ticket | Subject | Model | Audience |
|---|---|---|---|
| **H1** | Encounter sound design pass (cello drone, sphere-tinted resolve notes, registration cues) | `model:opus-4-6` | CC |
| **H2** | Encounter constants tuning playtest (drift thresholds, detection pressure, choice tilts) | `model:opus-4-6` | CC |
| **H3** | TTS implementation — wire Kokomoro voice to encounter prose + detail pages, consume D3 spec | `model:sonnet` | Codex |

---

## 4. Dependencies between phases

| Phase | Blocks on |
|---|---|
| A | THR-302 (already done) |
| B | A1, A2 |
| C | A1, A2, A3 |
| D | C (D1–D2); A3 (D3 independent) |
| E | THR-319 (detail page data model design) + C |
| F | B + C + D |
| G | F |
| H | v1 ship |

Within Phase B, B1 produces drift accumulator state that B6 reads; otherwise Phase B is parallel-safe. Within Phase C, all four are parallel-safe. Within Phase D, D1 and D2 are parallel-safe (different SVG/component surfaces); D3 is fully independent.

---

## 5. CC vs Codex audience rationale

**CC for:** component design where layout decisions and craft judgment matter (C1–C4); animation work where motion timing and feel cannot be specced ahead (D1, D2); novel graph schema work that may surface integration tensions (B1, B5); detail page implementation where component craft + prose surface intersect (E1, E2).

**Codex for:** mechanical schema scaffolding (A1, A2, A3, B6); pure compute modules where the algorithm is fully specced (B2, B3, B4, B7); orchestrator wiring and doc updates (F1, F3, F4); test boilerplate (G1, G2, G3); discovery work where the answer is data-extraction not judgment (D3).

This split respects `Docs/plans/2026-04-13-linear-coordination-protocol.md` § "Choosing the executor" and keeps CC's WIP=1 working on the ticket where its judgment matters most at any moment.

---

## 6. Coordination block template

Every child ticket created from this phasing plan carries this block (per the protocol). Example for Phase A1:

```
**Plan doc:** Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase A1
**Suggested model:** sonnet
**Parallel-safe with:** A2, A3, THR-319 (parallel-track design)
**Mutex with:** none in Phase A; B-phase tickets blocked on this landing
**Codex review:** yes (foundational schema; second-pair-of-eyes pass valuable)

### Files to touch
- src/types/encounter-contract.ts (new)
- src/data/encounter-contract-validators.ts (new)
- src/engine/encounter-contract-adapter.ts (new)
- src/types/encounter.ts (light cross-reference notes)

### Done when
- [ ] EncounterContract TS interface matches design plan §4.1 YAML
- [ ] Zod validator covers required fields + cosmological pattern (moral_axis_pole valid for reach)
- [ ] UnifiedActionTemplate ↔ EncounterContract adapter passes round-trip tests
- [ ] No callers wired yet (foundation only — B and C tickets consume this)
- [ ] npm test + tsc clean + vite build all green
```

Subsequent tickets follow the same shape with phase-appropriate file lists and done-when checklists. The full coordination block lives on each Linear issue, not duplicated here.

---

## 7. Inheritances and follow-ups from earlier work

### 7.1 CMS metadata-filter contract (from THR-302 Option C)

THR-302 chose Option C (retain authored encounter-package taxonomy in CMS, defer metadata-filter contract work to THR-301 follow-up). This phasing plan honors that defer by filing F4 — *CMS metadata-filter contract finalize* — as a Phase F ticket.

F4 resolved 2026-05-07 (THR-342): **Option C made permanent.** Authored encounter-package imports remain the CMS taxonomy source; no metadata-filter contract is migrated. Resolution doc: `Docs/plans/2026-05-07-thr-F4-cms-metadata-filter-spec.md`. Reversal triggers documented there.

### 7.2 Vault-side `Systems/Encounter System.md` update (from THR-302 impediment #113)

THR-302's vault-side doc update was blocked by Obsidian access (impediment #113). This plan rolls that work into F3 (canonical doc updates), so it lands as part of the encounter UI canonical doc sweep — not as orphan follow-up work.

---

## 8. THR-319 — sibling design ticket

**Filed alongside this plan.** Encounter Experience project, parallel to THR-317/318. Cowork session.

**Goal:** Spec the detail page data model so Phase E implementation tickets can execute against a settled contract.

**Output:**
- Plan doc at `Docs/plans/YYYY-MM-DD-detail-page-data-model.md`
- Section schema (typed `Section` blocks; ALLCAPS Cinzel labels; gold = primary)
- Resolver registry contract — how each Section type registers a resolver function
- Showcase-flag pattern — `node.showcase: true` triggers authored prose lookup
- Per-type detail page templates — Actor / Item / Faction / Place / Event Section sets
- Prose tier mapping (Routine / Notable / Chronicle per Narrative Engine canon)
- Fallback templates for long-tail entities
- Integration with existing `proseResolvers.ts`
- Three-pillar coverage (Engine: resolver registry + showcase flag plumbing. Content: authoring contract for showcase prose. UI: Section component + DetailModal consumption.)

**Why split.** The detail page question is too large to land as a verdict line in this phasing plan. Direction is settled (hybrid graph-walking with showcase-flag overrides, componentized sections), but the contract — section schema, resolver registry, prose tier per section, fallback shape — needs its own design pass.

**Phase E blocks on THR-319.** All other phases proceed independently.

---

## 9. NFP compliance summary

This is a process plan, not a feature plan. Most NFPs don't apply directly — they apply to the work this plan dispatches. For completeness:

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | Phase A2 establishes the constants file from day one; H2 schedules the tuning playtest |
| 2. Inspectability | ✅ PASS | Phase A2 establishes trace types; F1 wires DebugPanel inspectors |
| 3. Determinism | ✅ PASS | Drift accumulator and detection pressure are seeded-PRNG-driven; B1 + B4 specs include PRNG callouts |
| 4. Fail-soft | ✅ PASS | Each Phase B ticket inherits the fail-soft table from design plan §9 as part of its done-when |
| 5. Narrative over mechanical perfection | ✅ PASS | The phase order (B1 + B5 are CC, not Codex) honors that drift mechanics + graph schema need feel/judgment, not just compute |
| 6. Additive over destructive | ✅ PASS | A1's adapter keeps UAT path valid; encounter template + relationship nodes are additive (decisions 2.1/2.2) |
| 7. Performance budget | ✅ PASS with note | D1 (ThreadOverlay) is the worst-case animation surface; G2's snapshot tests include perf budget verification |

---

## 10. Done when (this plan's exit criteria)

- [x] Implementation phasing plan doc written
- [x] Six v1-blocking item decisions captured (§2)
- [ ] `plan-pending-commit` label applied to THR-317
- [ ] Child Linear tickets created for the encounter UI implementation (Phases A–G + post-v1 follow-ups)
- [ ] THR-319 (detail page data model design) created as sibling design ticket
- [ ] THR-317 moved to *Implementation Planning* (children filed; design exit complete)
- [ ] THR-301 moved to *Implementation Planning* (children filed; reverify it's not still in Done — closeout 2026-05-05 14:05)

THR-317 closes when its done-when is satisfied. THR-301's children execute the design.

---

## 11. Vision audit

This plan is process-level — it dispatches work that THR-301 already Vision-audited. No new Vision premise is contradicted or updated by the act of phasing the work. Vision premises that ride along with the implementation are inherited from the long-form design plan §10 (canonical doc updates) and `2026-05-04-encounter-toolkit-vision-audit.md` (resolutions §10).

---

## 12. References

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — long-form design plan; the source of truth for §3 (Engine), §4 (Content), §5 (UI), §7 (Constants), §8 (Traces), §9 (Fail-soft), §10 (Canonical doc updates).
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` — canonical UI spec; the source of truth for component inventory, motion + sound briefs, aftermath sequencing, detail page pattern.
- `Docs/plans/v7-design-pass/` — design pass deliverable; reference JSX components and motion/sound briefs.
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — coordination block template, queue protocol, three-pillar rule.
- `Docs/plans/2026-05-05-thr302-encounter-format-cleanup-impl-plan.md` — Phase 0 cleanup; closed; CMS metadata-filter Option C inheritance.
- `Docs/impediments.md` #113 — vault-side Systems/Encounter System.md update pending; rolls into F3.
