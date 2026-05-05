# Project Status
> Updated 2026-05-05.
## Current Focus
**THR-302 complete — Encounter format architecture cleanup shipped (Encounter Experience).** Removed deprecated `EncounterTemplate`, retyped encounter engine/UI/test callsites to `UnifiedActionTemplate`, and captured CMS Option C (authored package taxonomy retained; metadata-filter revisit deferred to THR-301). PR #129.

**THR-305 complete — Canon pages bootstrapped (Continuous Improvement).** Created `Docs/canon/` with three files: `README.md` (schema + 4 rules), `encounters.md` (current encounter spec, UnifiedActionTemplate since THR-108, stale-source warnings, reach→archetype table), `cosmology.md` (user-verdicted 8 Reaches + Quintessence as meta-property, explicit stale-source list for Domain Word Scales / state-of-game-design skill / STYLE.md). Updated `CLAUDE.md` (4th documentation surface + Session Workflow Step 0 for authoring) and `Docs/documentation-ownership.md` (Canon Pages row). Plan doc status flipped to `current`. PR #124.

**THR-301 In Design — Encounter experience long-form design plan on main.** PR #122 merged. THR-301 stays In Design awaiting user verdict on §17 (three open points). Next action: user verdict triggers child issue breakdown per phase.

**Board — Canonical documentation strategy (Continuous Improvement project).**
- **THR-307** (Urgent / model:opus-4-6) — Canon Phase 5a: Cosmological canon doc propagation (Obsidian vault). Skipped this session (model mismatch — requires Opus).
- **THR-303** (Medium / plan-pending-commit) — WORKFLOW.md handoff-comment schema. Plan doc pending flush.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete.
- **Continuous Improvement (Now):** THR-305 ✅. THR-307 (Urgent, Opus), THR-303 (plan pending flush) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
