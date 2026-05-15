# Project Status
> Updated 2026-05-15 (THR-383, THR-75, THR-425, THR-380).

## Current Focus
**Encounter Experience — active:** Phases A1–A3, B1–B7, C1–C4, D1–D3, E1–E2, F1–F2, G1–G3 ✅. Remaining is F-phase integration (mount EffectRegistration components into hero panel / cast tile / scene state surfaces) and Phase H post-v1 polish.

**Social Systems Expansion — active:** THR-75 (Mentor/Apprentice Relationship Chains) Phase 1 shipped 2026-05-15 — `mentors` edge, `initiative.train-apprentice`, `phaseMentorship` lifecycle, `resolveMentorship` terminal-arc decision table, 3 branching encounters (the-offer / graduation / the-falling-out), 2 divine actions, AgentDetailPanel block, 6 trace categories. Phase 2 (3 mid-chain milestone encounters + standalone Surpassing template) filed as THR-445 Deferral.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete. THR-178 Deferral shipped 2026-05-08.
- **Continuous Improvement (Now):** THR-303/305/306/307/309/311/312/313/314/315/316/354/355/356/357/358/359/266/396/404 ✅. THR-304 Phase 5 series complete (5a vault THR-356 ✅, 5b repo THR-359 ✅). THR-360 (Category B code residue) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35/75 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-329, THR-339, THR-340, THR-341, THR-349, THR-350, THR-354, THR-355, THR-356, THR-357, THR-358, THR-359
- 2026-05-08 batch: THR-139, THR-176, THR-177, THR-178, THR-179, THR-215, THR-265, THR-266, THR-267, THR-289, THR-292, THR-326, THR-330, THR-331, THR-332, THR-333, THR-334, THR-335, THR-338, THR-343, THR-344, THR-345, THR-352, THR-353, THR-360, THR-361, THR-362, THR-363, THR-365, THR-368, THR-374, THR-387, THR-388, THR-387, THR-388
- 2026-05-09 batch: THR-268, THR-389, THR-391
- 2026-05-10 batch: THR-394
- 2026-05-11 batch: THR-393, THR-403, THR-407, THR-408, THR-411, THR-396
- 2026-05-12 batch: THR-413, THR-404, THR-397, THR-398, THR-399, THR-401, THR-405, THR-416, THR-409, THR-395, THR-412, THR-422, THR-423, THR-418, THR-424, THR-400, THR-11
- 2026-05-14 batch: THR-12, THR-430, THR-432, THR-433, THR-415, THR-410, THR-385
- 2026-05-15 batch: THR-163, THR-386, THR-425, THR-75, THR-380

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
- ✅ 2026-05-15: THR-386 shipped — `intel_referenced_prose` category lint guard (THR-139 deferral). Advisory lint that warns when an effect's category is implausibly wired. Two-rule heuristic: co-traffic (primary) + structural substring (fallback). 10 correctness tests; 0 warnings against current corpus (3 effects, 621 templates). `npm run lint:intel-prose-category`. PR #300.
- ✅ 2026-05-15: THR-425 shipped — Stagger Linear MCP pollers. `CLAUDE.md § Scheduled Tasks` replaced with canonical 12-row quarter-hour slot table + slot-allocation principle. Coordination protocol rate-limit bullet (c) rewritten to point at CLAUDE.md instead of hardcoding :00/:30. Impediments #79 and #108 marked resolved. Out-of-repo cron edits (items 5–7) pending user confirmation in interactive session.
- ✅ 2026-05-15: THR-383 shipped — `intel_referenced_prose` content sweep (THR-139 breadth pass). 29 new `intel_referenced_prose` effects added across 18 files (5 lorekeepers-covenant, 1 each in arcane-circle / builders-fellowship / encounter-anomaly extending the 3 THR-139 pilots, 2 thieves-guild, 2 rangers-brotherhood, 1 army, 1 tavern, 1 social, 1 merchant-consortium, 1 civic-guard, 1 underking-court, 2 temple-of-spheres, 1 borderland, and 7 branching encounters: rival-shrine-betrayal, shadow-court-audience, the-merchants-favor, road-ambush, the-letters-of-introduction, the-oracle-consulted, warlords-tribute). Category roll-up: 7 cultural_knowledge, 7 agent_network, 7 military_position, 5 political_secret, 4 trade_route, 2 shrine_location — 32 effects total (29 new + 3 pilots). Voice contract followed (18–32 words, three reliability bands, dubious-hedges). Browser-verify exempt (content-only sweep, no `src/components/` or `src/views/` changes; `intel_referenced_prose` UI surface verified in THR-139). Verification: 11382 tests pass, tsc clean, vite build 8.20s, CLI smoke green (366 agents init).
- ✅ 2026-05-15: THR-380 shipped — `npm run vision-audit` CLI. New `scripts/vision-audit.ts` (fail-soft advisory tool, `node --experimental-strip-types`): four-section structured report for any plan doc — (1) Vision/*.md path citations, (2) premises named without nearby citation, (3) taste-profile entry touches, (4) untouched Vision files. Updated `game-design-direction` SKILL.md Vision Audit section to call this tool before the five qualitative checks. 41 unit + CLI exit-code tests. No vault → section 1 + exit 0; missing taste-profile → section 3 skipped. PR #304.
