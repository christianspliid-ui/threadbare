# Project Status
> Updated 2026-05-12.

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

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-329, THR-339, THR-340, THR-341, THR-349, THR-350, THR-354, THR-355, THR-356, THR-357, THR-358, THR-359
- 2026-05-08 batch: THR-139, THR-176, THR-177, THR-178, THR-179, THR-215, THR-265, THR-266, THR-267, THR-289, THR-292, THR-326, THR-330, THR-331, THR-332, THR-333, THR-334, THR-335, THR-338, THR-343, THR-344, THR-345, THR-352, THR-353, THR-360, THR-361, THR-362, THR-363, THR-365, THR-368, THR-374, THR-387, THR-388
- 2026-05-09 batch: THR-268, THR-389, THR-391
- 2026-05-10 batch: THR-394
- 2026-05-11 batch: THR-393, THR-403, THR-408, THR-411
- 2026-05-12 batch: THR-413, THR-404, THR-397, THR-398, THR-399, THR-405, THR-416, THR-409, THR-395

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
- ✅ 2026-05-08: THR-353 shipped (D3) — narration/TTS discovery report + encounter narration adapter contract + contract smoke test.
- ✅ 2026-05-08: THR-292 closed (Encounter Format Migration) — vault encounter architecture pages confirmed unified-only (Systems/Encounter System.md canonical via THR-341; UL Encounters.md describes EncounterTemplate as a conceptual term, not stale TypeScript-class guidance). Closeout entry appended to vault log.md.
- ✅ 2026-05-08: THR-265 shipped — skill freshness metadata + drift-scan S5 (all skill files now carry `last_validated_against`; weekly scan now reports stale/archive/bootstrap-needed skill freshness drift).
- ✅ 2026-05-08: THR-363 shipped — Phase 2b Canon Step-0 wiring for prose/hexmap/template skills (14 SKILL.md files mirrored); Canon-first pre-read now enforced before domain authoring.
- ✅ 2026-05-08: THR-215 shipped — durable weekly-memory-grooming trigger active (`3 16 * * 0`), CLAUDE scheduled-task registry updated, and external weekly-memory-grooming SKILL aligned to current Cowork/CC/Codex memory paths with fail-soft missing-path behavior.
- ✅ 2026-05-08: THR-374 shipped — Encounter UI G2.1b D2 snapshot suite tightened to exact handoff contract (10 EffectRegistration components at 1920×1080 with canonical titles/fixtures); verification trio green and `useEffectSequencing` hook tests confirmed present.
- ✅ 2026-05-08: THR-267 shipped — CLAUDE pre-commit checklist now requires a deterministic 30-tick CLI smoke for engine-touching changes (`tick 30` + `status`) and explicit status-output evidence at closeout.
- ✅ 2026-05-08: THR-387 shipped — hex map now only shows agents with a thread edge from the ascendant (or the avatar); non-threaded notable/spotlight NPCs are filtered in the agentRenderData useMemo in GameView.tsx.
- ✅ 2026-05-08: THR-388 shipped — hexmap tooltip now shows after a 1-second hover delay (was immediate). Debounced `tooltipHex` state in HexMapV2.tsx trails `hoveredHex` with a useEffect+setTimeout; hex highlight and status bar remain instant. `TOOLTIP_HOVER_DELAY_MS: 1000` named constant in INTERACTION_CONSTANTS (HexRaycaster.ts, NFP #1).
- ✅ 2026-05-09: THR-268 shipped — `CLAUDE.md` Design Governance now includes Step 0.5 Codesight pre-flight (required for `src/`-touching design work, with fail-soft grep fallback) and a new Blast Radius section requirement for high-impact files (>=100 importers).
- ✅ 2026-05-09: THR-389 shipped — ThreadDetail encounter pool now includes expandable foreshadowing prose per ranked candidate, backed by authored template variants, runtime cache, and `foreshadowing` traces (`__DEBUG.getForeshadowing` + `listForeshadowingTraces` available for inspection).
- ✅ 2026-05-09: THR-391 shipped — session-precheck now emits `freshness=` in the fingerprint line; CLAUDE.md Session Workflow requires agents to surface stale-branch warnings before design work begins.
- ✅ 2026-05-10: THR-394 shipped — thread detail bar now scrolls correctly (`height:100%` on container so footer stays in viewport); foreshadowing prose now shows as a tooltip on the pending-encounter chip in the ThreadsPanel retinue row.
- ✅ 2026-05-11: THR-393 shipped — WIP=1 gate now enforced in pull-work skill (Step 1.5) and coordination protocol (CC + Codex pickup Step 4 hard-gate wording). Hourly cron now exits cleanly when a PR is in-flight. Impediment #131 logged (cron-interval UI constraint).
- ✅ 2026-05-11: THR-408 shipped — `action-catalog-design` skill landed in both skill trees. Enforces three pre-flight checks (Substrate Honesty, Mortal-Loop Bridge, Surface-Shape Check) before any catalog-expansion design pass. Prevents the catalog-expansion drift pattern surfaced in THR-400 audit.
- ✅ 2026-05-11: THR-411 shipped — `intent-judge` skill landed. Four-way verdict (Allow/Revise/Block/Escalate), 10 judging dimensions, deterministic aggregation rubric, anti-correlation rules. Slots into CLAUDE.md design workflow as Step 8.5 between Three-pillar check and Vision audit. `/intent-judge <path>` for manual runs.
- ✅ 2026-05-11: THR-407 shipped — `classifyTrayTier` bug fix: replaced actor-affinity self-rule with target-structure rule. Added `trayTier?: 'core'|'self'|'rare'` to `UnifiedActionTemplate`. `divine.dream`, `hex.smite`, etc. now correctly classify as `core`. 7 new tests in `ascendantTray.test.ts`. Unblocks THR-396.
- ✅ 2026-05-11: THR-396 shipped — UL drift fix: 6 templates using unsanctioned reach values (`rune`/`time`/`void`) reassigned to canonical values; 4 rune-verbs tagged `trayTier: 'core'`. `grep -rn "reach:'(rune|time|void)'" src/` → 0 results. Unblocks THR-397.
- ✅ 2026-05-11: THR-403 shipped — Rulebook Canon Page Phase 1. New `Docs/canon/rulebook.md` (synthesis layer, 8 sections, `[IMPL]`/`[DESIGN]`/`[OPEN]` flags inline, per-section authority-boundary footers) + `Docs/canon/rulebook-quick-reference.md` (always-loaded board-game card). Wiring updates to `Docs/canon/README.md`, `state-of-game-design` SKILL (mirrored to `.agents/`), and CLAUDE.md (Canon table + Session Workflow load order + Domain Skills row). First architecture-assessment pass written to `Docs/audits/2026-05-11-rulebook-architecture-assessment.md`. Phase 2 (THR-404) and Phase 3 (THR-405) follow-ups already filed (Idea, blocked-by THR-403, will promote on close). Verification: tsc clean, vite build 9.06s, 11072 tests pass. Browser-verify exempt (docs-only).
- ✅ 2026-05-12: THR-404 shipped — drift-scan S6-S10 (rulebook lint signals). Five new weekly signals: rulebook→UL (Definitions: shard files + terms), rulebook→Canon pages (Spec: existence), rulebook IMPL tags (identifier presence in .ts files), rulebook→Vision (Why: files in Obsidian vault), quick-ref vs rulebook (ticks/day, doom stages, reaches, verbs). New `scripts/lint-rulebook.ts` + extended `scripts/drift-scan/index.ts` + OBSIDIAN_VAULT_PATH in drift-scan.yml. PR #250.
- ✅ 2026-05-12: THR-413 shipped — All 6 content authoring skills (encounter-pipeline, attachment-pipeline, prose-content-systems, prose-pipeline, prose-vignettes-and-enrichment, template-encounter-rewrite) now open with a `> **Load before authoring:**` blockquote directing agents to load `Docs/canon/rulebook-quick-reference.md`. Mirrored to `.agents/skills/`. `last_validated_against` bumped to 2026-05-12. PR #248.
- ✅ 2026-05-12: THR-397 shipped — Ascendant action rarity recurve. Re-tagged all 101 ascendant `rarityTier` values in `unified-action-templates.ts` to match spec distribution {1:32, 2:40, 3:25, 4:4}. 40 edits, data-only change. PR #251.
- ✅ 2026-05-12: THR-398 shipped — Collapsed 6 hex-recon verbs to 2. Retired `hex.sense_threads`, `hex.sense_leylines`, `hex.divine_populace`, `hex.scry_factions`. Survey (`hex.survey`) now reveals land+people in a single cast via multi-layer `TEMPLATE_REVELATION_MAP`. `TEMPLATE_REVELATION_MAP` widened to support `NarrativeLayer | readonly NarrativeLayer[]`. `resolveRevelation` emits one `LayerRevealedTrace` per layer. `trayTier: 'core'/'rare'` added to Survey/ReadCurrents. PR #253.
- ✅ 2026-05-12: THR-399 shipped — 4 self-targeting ascendant actions: Stillness (essence regen on primary sphere), Recede (nextActionDiscount buff), Focus (nextActionTierBoost buff), Reveal (push divineInfluences to mortals on avatar hex). 8 named constants in `self-action-constants.ts`, `SelfActionTrace` + `'self_action'` category, post-processor hook in `unifiedActionResolution`. 17 tests. PR #254.
- ✅ 2026-05-12: THR-405 shipped — Rulebook Canon Page Phase 3 (maintenance cadence). `Rulebook impact?` checkbox added to CLAUDE.md Design Governance. `Docs/audits/_rulebook-architecture-assessment-template.md` created. `monthly-rulebook-review` scheduled task registered in CLAUDE.md (task creation deferred to THR-417 — blocked by impediment #133, create_scheduled_task blocked in scheduled sessions). PR #256.
- ✅ 2026-05-12: THR-409 shipped — worktree graveyard cleanup. Removed 35 of 74 registered worktrees (registry now 39); 33 tfws-pickup/resume entries kept per 14-day safety filter; 12 .claude/worktree dirs remain on disk (git-deregistered, locked by active sessions); trusting-vaughan-733101 (THR-394) preserved with 2 unmerged code commits not yet in main.
- ✅ 2026-05-12: THR-419 shipped — Starter 12 always-available action floor (unlock Gate 8 + starter tags), DebugPanel Action Unlocks tab/__DEBUG unlock APIs, and Codex Starter filter chip landed with tests and full verification trio green.
