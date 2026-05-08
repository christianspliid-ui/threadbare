# Project Status
> Updated 2026-05-08.

## Current Focus
**THR-139 complete (2026-05-08) — Authored `intel_referenced_prose` aftermath reaction variant (Encounter Format Migration).** Closes the intelligence consumption loop's authored "intel paid off" surface, the fourth and most player-visible of the five consumption sites (after THR-113 scoring/prose/resolution and THR-140 difficulty modifier). New `EncounterAftermathReactionEffect` union variant `kind: 'intel_referenced_prose'` (`src/types/unifiedAction.ts`) with `category` + 3-band `prose: { reliable, uncertain?, dubious? }` + optional `significance`/`targetAgentId`/`when`. Engine pillar (`src/engine/encounterAftermath.ts` dispatcher case + helpers `findIntelReferencedProseMatch` / `pickIntelReferencedProseLine` exported from `intelligence.ts`): on match, picks reliability-banded prose and appends a `narrative` `TickEvent` to `recentEvents`/`tickEvents`; emits `intelligence_referenced` with new `referencedBy: 'aftermath_prose'` discriminator (widened in `trace.ts`); fail-soft with 4 skip paths (`no_target_agent` / `no_matching_record` / `skipped_dubious` / `skipped_empty_prose`). Four new tunables in `agent-behavior-constants.ts` (per-band significance defaults 0.6/0.45/0.3 + `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES` master switch). Content pillar: new `src/data/intelligence-referenced-prose.ts` with the 72-line shared pack (6 categories × 3 bands × 4 lines, Threadbare voice 18-32 words/line, dubious band shows the intel betraying the agent); 3 pilot reactions wired in `arcane-circle-encounter-content.ts` (`agent_network`), `builders-fellowship-encounter-content.ts` (`political_secret`), `encounter-anomaly-content.ts` (`cultural_knowledge`). UI pillar N/A by design — the new `TickEvent.type: 'narrative'` flows through the existing chronicle/right-rail renderer (browser-verified: 3 narrative TickEvent toasts rendering on `?view=game&seeded` confirms the shared surface). Tests: 18 assertions across 3 files (`intelligence.referencedProse.test.ts` 9, `encounterAftermath.intelReferencedProse.test.ts` 7, `contracts/intel-aftermath-prose-liveness.contract.test.ts` 2). Wiring docs: `Docs/plans/wiring-checklist.md` consumption-hooks table extended (5 hooks now); `Docs/plans/2026-04-16-systemic-wiring-guide.md` Capability 6 table updated (5 sites) + Aftermath Reaction Effect Types table count bumped 19 → 20. Verification: `npx tsc --noEmit` clean, `npx vite build` 7.23s, `npm test -- --run` 723 files / 11068 tests pass (43.37s).

**Encounter Experience — active:** Phases A1–A3, B1–B7, C1–C4, D1–D3, E1–E2, F1–F2, G1–G3 ✅. Remaining is F-phase integration (mount EffectRegistration components into hero panel / cast tile / scene state surfaces) and Phase H post-v1 polish.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete. THR-178 Deferral shipped 2026-05-08.
- **Continuous Improvement (Now):** THR-303/305/306/307/309/311/312/313/314/315/316/354/355/356/357/358/359/266 ✅. THR-304 Phase 5 series complete (5a vault THR-356 ✅, 5b repo THR-359 ✅). THR-360 (Category B code residue) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-329, THR-339, THR-340, THR-341, THR-349, THR-350, THR-354, THR-355, THR-356, THR-357, THR-358, THR-359
- 2026-05-08 batch: THR-139, THR-176, THR-177, THR-178, THR-179, THR-265, THR-266, THR-289, THR-292, THR-326, THR-330, THR-331, THR-332, THR-333, THR-334, THR-335, THR-338, THR-343, THR-344, THR-345, THR-352, THR-353, THR-360, THR-361, THR-362, THR-363, THR-368

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
