# Project Status
> Updated 2026-04-27.
## Current Focus
**THR-277 complete — pull-work Step 4.5 worktree isolation.** Breaks dirty-worktree doom loop (impediments #87/#88/#89). Pickup now isolates into a fresh git worktree on origin/main when home is dirty. Synced to .agents/ via skill-sync. Merged PR #52.

**THR-281 complete — test suite triage.** Suite is empirically green (0 failures, 10,709 tests pass). 4 child issues filed: THR-283 (schema drift: hostile_to + contains), THR-284 (constructed_by direction), THR-285 (BUFFER_SIZE 500→2000), THR-286 (delete orphan todo test files). Phase 2 fix work ready to pick up.

## Repo Health Sprint v2 (Now)
- **THR-280** (parent): Test Suite Stabilization Sprint v2
- ✅ **THR-281:** Survey complete — suite is green, triage report at `Docs/audits/2026-04-27-test-suite-triage.md`
- **THR-283** (Ready for Codex, haiku): Register `hostile_to` + fix `contains` sublocation target
- ✅ **THR-284:** Fix `constructed_by` EDGE_SCHEMA semantic direction — Option B chosen (sublocation→actor). Fixed worldSeed.ts source/target swap. PR #54.
- **THR-285** (Ready for Codex, haiku): Raise BUFFER_SIZE 500→2000
- **THR-286** (Ready for Codex, haiku): Delete orphan todo-only test placeholder files

## Recent Completions (2026-04-24) — THR-211 first playtest run + THR-243 exemplars index
**THR-211:** First `playtest-interface` run. 27 PASS, 2 FAIL, 10 SURPRISE, 10 SKIP. RUBRIC.md annotated with `getActiveUIState()` 9-field contract, `getOpenModals()` caveats, `gotoAgent()` exact-ID requirement, `setFog()` 200ms delay, `?debug.openModal` 5s init timing. EXPECTED-FINDINGS.md seeded with 9 baseline entries. THR-275 filed (HexSidebar exploration path bug). Report: `.playtest-runs/2026-04-24-1215.md`.

## Milestone Status 27 PASS / 2 FAIL / 10 SURPRISE / 10 SKIP. RUBRIC.md and EXPECTED-FINDINGS.md populated with baseline findings. THR-275 filed (HexSidebar exploration path). Next: address FAILs and re-run to validate fixes.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). ✅ Phase 6 RB (THR-97). ✅ Phase 7 LC (THR-96). ✅ Phase 8 HOD (THR-95). ✅ Phase 9 TS (THR-99). ✅ Phase 3 Tavern (THR-101, 10 templates). THR-134 closed — Phase 2 unblocked.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). ✅ THR-88 shipped (backstory strata 2-4 deepening). ✅ THR-239 shipped (authoring brief — compiled content-pipeline preamble).
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254 dual-voice Chronicle phased events. ✅ THR-253 Chain Weakens prose polish (PR #25). THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** ✅ THR-26 hex map rarity signifiers shipped. Two deferred Phase D items remaining.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-24) — THR-211 first playtest run + THR-243 exemplars index
- **THR-211:** First `playtest-interface` run. 27 PASS, 2 FAIL, 10 SURPRISE, 10 SKIP. RUBRIC.md annotated with `getActiveUIState()` 9-field contract, `getOpenModals()` caveats, `gotoAgent()` exact-ID requirement, `setFog()` 200ms delay, `?debug.openModal` 5s init timing. EXPECTED-FINDINGS.md seeded with 9 baseline entries. THR-275 filed (HexSidebar exploration path bug). Report: `.playtest-runs/2026-04-24-1215.md`.
- **THR-243:** `Docs/exemplars.md` — single source of truth for quality exemplars. Two encounter exemplars documented; placeholder rows for prose and attachment. PR #34 merged.

## Recent Completions (2026-04-24) — THR-272 grill-me skill
- **THR-272:** Shipped `.claude/skills/grill-me/SKILL.md` + `.agents/skills/grill-me/` mirror. 4 invocation triggers (explicit, effort >1 day, multi-pillar, high-ambiguity), conversational default, async-batch mode (generates `Docs/plans/*-grill-me.md`), "I don't know" parking + grey-zone handling, synthesis artifact with 7 required sections. CLAUDE.md design governance checklist gains step 0. First-wave 2/4. PR #32.

## Recent Completions (2026-04-25) — THR-271 UL v1 + THR-274 retro cadence sync
- **THR-271:** Shipped Ubiquitous Language v1. 7 sharded markdown files (`Docs/ubiquitous-language/`) with 73 canonical terms across Cosmology, Agents, Encounters, Prose, Graph, Coordination, Process. Always-load README index. `ubiquitous-language` skill with propose-new-term (UL-proposal Linear issues) + retirement flows. CLAUDE.md wired: UL orientation step + "UL wins on terminology disagreements" rule. First-wave 1/4. PR #44.
- **THR-274:** Retro × drift-scan cadence sync. `retrospective` skill wired to read this week's `drift-scan`-labeled Linear issues as Step 0. New cross-signal synthesis step, Tuning Recommendations section, failure-handling for 3 consecutive empty scan weeks. CLAUDE.md documents Friday cadence. PR #41 pending merge (CI blocked by billing — impediment #91). First-wave 4/4.

## Recent Completions (2026-04-25) — THR-258 phase predicate edge-exists
- **THR-258:** Shipped runtime phase-predicate support for `edge-exists` in `phaseComposition`, including phase-side FilterQuery evaluation for `and`/`or`/`not`/`prop-equals`/`has-edge`, fail-soft warnings for unsupported `has-tag`/`has-any-tag`/`node-class` and unknown filter ops, and 15 new edge-exists unit cases in `phaseComposition.worldPredicates.test.ts`.

## Archived to project-history.md
- THR-284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` (one-liners) + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
