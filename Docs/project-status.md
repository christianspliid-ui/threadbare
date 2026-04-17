# Project Status
> Updated 2026-04-17.
## Current Focus
**Encounter Format Migration — Phase 0 + Phase 1.** 115 legacy EncounterTemplates migrating to UnifiedActionTemplate. Phase 0 (THR-110–118) establishes engine prerequisites. **THR-110 + THR-111 + THR-90 + THR-89 shipped.** THR-112–118 in Implementation Planning. Design doc: `Docs/plans/2026-04-16-encounter-template-migration.md`.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ THR-110/111 shipped. ✅ THR-90 shipped (deprecation + parity/audit tests). ✅ THR-89 shipped (Phase 1 pilot — 15 TG templates). THR-112–118 next.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). THR-86/88 absorbed from archived Prose Content Quality Pass.
- **Attention Tier Model (Now):** UI integration ongoing.
- **Social Systems Expansion (Next):** THR-28/27 shipped. THR-51/29/30/78 gated behind Phase 0 (THR-112/114/115).
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** THR-112–118 (Phase 0 remaining), then Phase 1 continues with next guild faction.

## Recent Completions (2026-04-17)
- **THR-89 Phase 1 — Thieves guild migration:** 15 `EncounterTemplate` objects in `thieves-guild-encounter-content.ts` converted to `UnifiedActionTemplate`. Threadbare prose with `{name}`/pronoun/conditional/`{location}` wiring throughout. Aftermath reactions: encounter seeds, hidden marks, intelligence grants, reputation tallies — tiered by template difficulty. Registry wired via direct spread in `UNIFIED_ACTION_TEMPLATES` (bypasses `migrateEncounterTemplate`); `getFactionEncounterById` updated. Bulk shape test suite (6 assertions × 15 templates). Codex review: no critical/major findings. Commit: `1d1fe194`.
- **THR-90 Phase 0 — EncounterTemplate deprecation + parity/audit tests:** `EncounterTemplate` marked `@deprecated`. `encounterTypeToCrud()` exported with audit JSDoc. 4 test suites. Codex review: 4 medium findings fixed. Commit: `04d3949a`.
- **THR-22 Intent & Activity Visibility (session 1):** `deriveLocationActivities()`, `useLocationActivities`, `HexTooltip` location prose, `HexMapV2` locationActivityMap. 15 unit tests. Deferrals: THR-125/126/127/128.
- **`deathSiteUnrestBonus` wiring:** `agentLifecycle` tracks `deathCount`; `phaseProsperity` applies unrest bonus (Breach +2, Reckoning +3, Sundering +2). Commit: `f7917f13`.

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
