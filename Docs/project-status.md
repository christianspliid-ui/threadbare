# Project Status
> Updated 2026-05-06.
## Current Focus
**THR-311 complete — Canon Phase 2b: attachment canon page + skill wiring (Continuous Improvement).** Added `Docs/canon/attachments.md` (110 lines) as the canonical attachment-system entrypoint (categories, slot caps, primitive vocabulary, effect-walker seams, active plans, rejected approaches, open questions), then updated attachment-pipeline skill mirrors so Step 0 always reads the canon page before existing pre-reads (`Docs/authoring-brief.md` and systemic fallbacks). Verification gates green (`npm test`, `npx tsc --noEmit`, `npx vite build`).

**THR-315 complete — Canon Phase 2b: engine canon page (Continuous Improvement).** Created `Docs/canon/engine.md` (122 lines) — Step-0 navigation page for engine work covering tick entry, WorldGraph mutated-in-place, SimulationRuntime caches, resolution service (sigmoid + doubles crit), seeded PRNG, traceBuffer, three-tier position model, NFP order, load-bearing decisions, rejected approaches, open questions. Wired `engine-architecture` skill (both `.claude/` and `.agents/` mirrors) to load the canon page as Step 0 above the existing `state-of-game-design` prerequisite. Added engine row to `Docs/canon/README.md` index. Skill-sync clean; tsc, vite build, and 10,709 tests all green.

**THR-309 complete — UL proposal closeout for canon terminology (Continuous Improvement).** Added `Domain Canon Page` to `Docs/ubiquitous-language/Process.md` as the canonical Step 0 authoring entrypoint term for `Docs/canon/<domain>.md`. Rewrote `Quintessence` in `Docs/ubiquitous-language/Cosmology.md` to the user-verdicted integrity-of-self / centrality-to-story framing (explicitly not a Reach, Flesh remains deprecated). Ran `npm run mirror-ul` with explicit `OBSIDIAN_VAULT_PATH` override to mirror shard updates into Obsidian.

**THR-307 complete — Canon Phase 5a: Cosmological canon doc propagation (Obsidian vault, Continuous Improvement).** Created `Cosmology/The Cosmological Pattern.md` and `Cosmology/Reaches.md` as canonical vault destinations (repairing 14+ broken wikilinks). Updated 8 existing vault pages and bulk-fixed 30 [[Flesh]] wikilinks per migration table (healing→Gold, athletics→Iron, body-mod→Stone, survival→Star). Closes the drift loop that misled the 2026-05-04 vision audit.

**THR-301 In Design — Encounter experience long-form design plan on main.** PR #122 merged. THR-301 stays In Design awaiting user verdict on §17 (three open points). Next action: user verdict triggers child issue breakdown per phase.

**Board — Canonical documentation strategy (Continuous Improvement project).**
- **THR-303** (Medium / plan-pending-commit) — WORKFLOW.md handoff-comment schema. Plan doc pending flush.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete.
- **Continuous Improvement (Now):** THR-305/306/307/315 ✅. THR-311/312/313/314/316 (Canon Phase 2b siblings) Ready for Dev. THR-303 (plan pending flush) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
