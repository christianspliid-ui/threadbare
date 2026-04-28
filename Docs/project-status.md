# Project Status
> Updated 2026-04-28.
## Current Focus
**THR-102 complete — Adventuring Guild faction migration (Phase 3).** `src/data/faction-encounter-content.ts` now exports 18 unified faction templates with per-template aftermath reactions and authored elite choices for dragon lair/lost city, while keeping legacy EncounterTemplate exports for generation compatibility.

**THR-280 closed — Repo Health Sprint v2 complete.** Empirical verification 2026-04-28: 682/682 files, 10,709 tests pass. 3-day green watch active (day 2 of 3). THR-282 (re-enable branch protection) targets 2026-04-30. Impediments #22/#30/#31/#32/#34/#38/#39/#54/#57 flagged resolved-candidate.

**THR-287 complete — flush-plan-docs skill.** Hourly scheduled task that commits Cowork plan docs from `plan-pending-commit` label. Scheduled task registration requires a regular CC session (impediment #90). Merged PR #57.

**THR-277 complete — pull-work Step 4.5 worktree isolation.** Breaks dirty-worktree doom loop (impediments #87/#88/#89). Merged PR #52.

## Repo Health Sprint v2 (Watch Window)
- ✅ **THR-280:** Sprint wrap-up — empirical green confirmed 2026-04-28. Watch day 2/3. PR #63.
- ✅ **THR-281:** Survey — suite green, triage at `Docs/audits/2026-04-27-test-suite-triage.md`
- ✅ **THR-283:** Register `hostile_to` + fix `contains` sublocation target. PR #59.
- ✅ **THR-284:** Fix `constructed_by` edge direction (sublocation→actor). PR #54.
- ✅ **THR-285:** Raise BUFFER_SIZE 500→2000. PR #61.
- ✅ **THR-286:** Delete orphan todo-only test placeholder files. PR #60.
- **THR-282** (Idea/Backlog): Re-enable branch protection — earliest 2026-04-30.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. ✅ Phase 3 Tavern (THR-101). THR-134 closed.
- **Content Architecture (Now):** ✅ THR-86 shipped. ✅ THR-88 shipped. ✅ THR-239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168/169/170/183/172/173/174. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254 dual-voice Chronicle. ✅ THR-253 prose polish. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127 shipped. THR-87 blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** ✅ THR-26 hex map signifiers. Two deferred Phase D items remaining.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Archived to project-history.md
- THR-280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
