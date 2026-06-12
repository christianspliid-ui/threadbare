# Project Status
> Updated 2026-06-12.

## Current Focus
**Encounter Experience — active:** Phases A1–A3, B1–B7, C1–C4, D1–D3, E1–E2, F1–F2, G1–G3 ✅. Remaining is F-phase integration (mount EffectRegistration components into hero panel / cast tile / scene state surfaces) and Phase H post-v1 polish.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete. THR-178 Deferral shipped 2026-05-08.
- **Continuous Improvement (Now):** THR-303/305/306/307/309/311/312/313/314/315/316/354/355/356/357/358/359/266/396/404 ✅. THR-304 Phase 5 series complete (5a vault THR-356 ✅, 5b repo THR-359 ✅). THR-360 (Category B code residue) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

- ✅ 2026-06-12: THR-449 shipped — Compiled `Docs/design-brief.md` (≤2-page orientation: logline, core fantasy, three-beat loop, 5 verbs + Reach×Sphere model, Doom/Mandate clocks, six principles, pointer matrix). Wired into `state-of-game-design` router as Always (first read). Closes THR-376 partial-ship gap. PR #324.
- ✅ 2026-06-12: THR-456 shipped — Event feed hygiene: Phase 2.361 same-hex same-tick aggregation (`eventAggregation.ts`, `event-aggregation-content.ts`, 19 phrases). Phonetic name constraints (syllable cap, consonant cluster, vowel run) reject unpronounceable outputs. `synthesizeFallbackName` replaces `Wanderer-N` last resort. Elite naming via `pickCulturalName`. `pickWithRepetitionGuard` + `DilemmaProseEntry` type for same-tick dilemma prose dedup; 2→12 entries/sub-pool. Casing bug fixed. 37 new tests. PR #323.
- ✅ 2026-06-12: THR-455 shipped — Story-so-far digest for threaded agents. `threadDigest.ts` (selectBeats, resolveCurrentTension, composeThreadStory, seededPickFromPool). `thread-digest-content.ts` (192 beat templates, 18 tension, 16 transition, 3 empty-state). `StorySoFarPanel.tsx` + `useThreadStorySoFar` hook. Feature-flagged `STORY_SO_FAR_DIGEST_ENABLED=true`. 38 new tests. PR #322.
- ✅ 2026-06-12: THR-453 shipped — Template novelty pressure: recency penalty + category quotas in `encounterScoring.ts`. `EncounterNoveltyRecord` in GameState. `computeGlobalNoveltyPenalty`, `computeAgentNoveltyPenalty`, `computeNoveltyMultiplier`. `noveltyChangedSelection`/`preNoveltyWinnerId` in ScoringTrace. 15 new tests. PR #320.
- ✅ 2026-06-12: THR-451 shipped — Outcome Economy Retune: eliminate failure-dominant world. Two-tier probability floor in `resolutionScaleAdjust.ts` (personal 0.70, local 0.65). `ResolutionInputTrace` + `resolution-stats` CLI command. Reduces overall failure from 96% → 34.6% avg across 3 seeds. Critical failure at personal/local gated to 0%. Critical success preserved. PR #319.
- ✅ 2026-06-11: THR-452 shipped — Branching encounter reachability. Curator bias (1.75× for under-selected branching templates), outgrowth exemption (`BRANCHING_QUEST_SKIP_OUTGROWTH`), cap preservation (`BRANCHING_CAP_RESERVE=1`). 27 of 28 branching templates were never firing; now reachable. 24 files, `branchingCurator.ts` + `branchingConstants.ts` (new), `BranchingCuratorNudgeTrace`.
- ✅ 2026-06-11: THR-457 shipped — Gameplay observability KPI harness. `src/engine/kpi/` (gameplayKpi.ts + kpiConstants.ts), `EligibilityFunnelCounters` on SimulationRuntime, filter pipeline + scoring hooks, CLI `kpi` command, `window.__DEBUG.getKpiReport()`, DebugPanel KPI tab, `scripts/gameplay-report.ts` + `npm run gameplay-report`. 17 KPI tests. Confirmed: 96% failure + 0 branching fires at seed 42 tick 120.
- ✅ 2026-06-11: THR-450 shipped — retrospective path reconciliation. `Design/retros/` is now the canonical output/archive location for live retros; active skills, scripts, CLAUDE/AGENTS/process docs, and the 2026-05-04 finalized retro were updated accordingly. Verification: skill-sync + retro-draft + test/typecheck/build all green.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-329, THR-339, THR-340, THR-341, THR-349, THR-350, THR-354, THR-355, THR-356, THR-357, THR-358, THR-359
- 2026-05-08 batch: THR-139, THR-176, THR-177, THR-178, THR-179, THR-215, THR-265, THR-266, THR-267, THR-289, THR-292, THR-326, THR-330, THR-331, THR-332, THR-333, THR-334, THR-335, THR-338, THR-343, THR-344, THR-345, THR-352, THR-353, THR-360, THR-361, THR-362, THR-363, THR-365, THR-368, THR-374, THR-387, THR-388
- 2026-05-09 batch: THR-268, THR-389, THR-391
- 2026-05-10 batch: THR-394
- 2026-05-11 batch: THR-393, THR-403, THR-408, THR-411
- 2026-05-12 batch: THR-413, THR-404, THR-397, THR-398, THR-399, THR-405, THR-416, THR-409
- 2026-05-16 batch: THR-416 (via THR-409 worktree cleanup closeout), THR-249, THR-248, THR-377, THR-447
- 2026-06-11 batch: THR-406

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
