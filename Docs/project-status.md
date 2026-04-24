# Project Status
> Updated 2026-04-24.
## Current Focus
**THR-101 shipped — Phase 3 tavern encounters migration.** 10 tavern templates rewritten to UnifiedActionTemplate with Threadbare place-bound prose (every opening beat at {location} carries ≥1 sensory channel) and full systemic payload (3+ intel grants, 6 encounter seeds, 7 hidden marks, 4 {?has_faction} branches, 2 ActionStepBranch forks). THR-254 also shipped (dual-voice Chronicle).

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). ✅ Phase 6 RB (THR-97). ✅ Phase 7 LC (THR-96). ✅ Phase 8 HOD (THR-95). ✅ Phase 9 TS (THR-99). ✅ Phase 3 Tavern (THR-101, 10 templates). THR-134 closed — Phase 2 unblocked.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). ✅ THR-88 shipped (backstory strata 2-4 deepening). ✅ THR-239 shipped (authoring brief — compiled content-pipeline preamble).
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254 dual-voice Chronicle phased events (PR #13). THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-24) — THR-101 tavern encounters Phase 3
- **THR-101:** 10 tavern templates (`tavern.brawl`, `overheard_rumor`, `drinking_contest`, `bardic_performance`, `shady_deal`, `recruiting_drive`, `the_challenge`, `confession_over_drinks`, `merchants_pitch`, `the_warning`) migrated to UnifiedActionTemplate. Threadbare place-bound voice, systemic wiring (intel/seeds/marks/faction-branches/ActionStepBranch), legacy `appliesWound` converted to `condition_attachment` on failure. Engine: slot priority faction → unified tavern → extra → unified social → legacy. Central registration in `unified-action-templates.ts`. 10659 tests pass.

## Recent Completions (2026-04-24) — CI workflow fixes
- **claude-review.yml:** Removed `persist-credentials:false` from checkout (was blocking `git fetch origin main`). Replaced grep-based Rule 8 check with exit-code check (branch protection error messages weren't matching old patterns). Impediment #80 resolved.

## Recent Completions (2026-04-23/24) — THR-257 + THR-259 + THR-36
- **THR-257:** CLI aftermath hook — shared context resolver, CLI `aftermath list/pick` + `run --auto-aftermath`, debug bridge `listAftermathReactions/pickAftermathReaction`, unified GameView modal path. Unattended aftermath verification now possible.
- **THR-259:** Hex Tooltip Murmurs CMS. `MURMUR_TEMPLATES` exported; `hex-murmurs` entry (Narrative & Prose, ProseViewer). All pulse × activity-category rows at `?view=cms`.
- **THR-36:** Reputation Traits CMS. 17 traits browsable at `?view=cms`.

## Archived to project-history.md
- THR-101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` (one-liners) + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
