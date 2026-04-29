# Project Status
> Updated 2026-04-29.
## Current Focus
**THR-79 complete — Doom Identity Matrix remaining 4 archetypes upgraded.** CHANGING (Chaos), SUNDERING (Force), FAILING (Time), ASCENSION (Spirit) replaced from stub-quality (5/5/3-entry vocab, neutral biases, terse milestones) to BREACH/CONVERGENCE/RECKONING parity (8 verbs / 8 adjectives / 5 atmospheres each, 5 chronicle titles, 4 milestones with ≥40-char descriptions, archetype-shaped encounter / rival / complication / location-pressure / familiarity bias). Content-only — no engine, type, or UI changes; the `getDoomIdentityMatrix()` consumers (encounter scoring, rival weighting, prosperity pressure, prose enrichment, complication scoring, chronicle theming) pick up upgraded content automatically. 10,692 tests pass; tsc clean; vite build clean.

**THR-109 complete — Phase 6 skills/documentation unified-format closeout.** Updated `template-encounter-rewrite` and `encounter-pipeline` skills to target `UnifiedActionTemplate` only, replaced stale Notion references in encounter draft prompts with Obsidian/vault sources, and updated systemic wiring + wiring checklist docs to mark the unified encounter format baseline.

**THR-108 complete — Phase 5 migration bridge removal + encounter pipeline fix.** Removed `resolveEncounterTemplate` bridge from `unified-action-templates.ts`; all 5 encounter content files now export `UnifiedActionTemplate[]` directly. Fixed critical pipeline throughput bug in `buildEntryUnified`: UAT difficulty is 0–1 but cache must store 0–100 for scoring; missing `* 100` factor caused `filterByOutgrowth` to discard all encounters for agents with capability ≥ 0.55 (nearly all spotlight agents). Deleted `encounter-migration-audit.ts` + 2 parity test files. 10692 tests pass. PR #85.

**THR-104 complete — Phase 4 army migration shipped.** All 6 army-lifecycle templates (`mc.army.raise`, four `army.threshold.*`, `army.aftermath.refugees`) now export as UnifiedActionTemplate with Threadbare-aesthetic prose (sergeants speak, captain offstage, mud-and-rations realism) and authored aftermath: reputation tallies for command performance, hidden marks for witnessed cowardice/heroism, encounter seeds for cascading consequences (supply crisis → desertion → mutiny → disbandment → refugees). Programmatic-spawn signal preserved (`locationSubtypes: []`); threshold IDs in `armyAttrition.ts` still resolve.

**THR-103 complete — Phase 4 monster migration shipped.** All 5 monster templates now export as `UnifiedActionTemplate`, each with authored aftermath reactions (hidden marks for witnessed combat, encounter seeds for territorial returns, intelligence grants for creature lore, emit_omen for horde outcomes). `lair_defense` and `horde_raid` author `update_node` GraphOps for world-mutating prosperity/defense changes.

**THR-106 complete — Phase 4 anomaly migration shipped.** All 10 anomaly templates now export as UnifiedActionTemplate, each with authored aftermath reactions; fallen_star and dreaming_light include authored choice cards, while legacy anomaly lookup remains compatible through getAnyEncounterById.

**Phase 4 Encounter Format Migration progress:** ✅ Anomaly (THR-106) · ✅ Monster (THR-103) · ✅ Army (THR-104) · ✅ Borderland (THR-107). Phase 4 content migration complete.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. ✅ Phase 3 Tavern (THR-101). ✅ THR-102/290 AG unified registry wired. THR-134 closed. All guilds migrated.
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
- THR-109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`

