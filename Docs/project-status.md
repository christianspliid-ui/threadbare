# Project Status
> Updated 2026-04-19.
## Current Focus
**THR-165 shipped (structural assertion cleanup).** Replaced brittle `toHaveLength(10)` with per-tier prefix checks (ag.quest.*, ag.senior.*, ag.elite.*) in factionQuestAndReputation.test. Next: THR-95 (Holy Order of Dawn — 42 templates, model:sonnet). THR-183 pending GitHub Pro (flip review Action to blocking).

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). ✅ Phase 6 RB (THR-97). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). ✅ THR-88 shipped (backstory strata 2-4 deepening).
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-19) — THR-182
- **THR-182 — CC review replacement (heartbeat wrapper + PR-gated Action):** `scripts/review/wrapper.ts` — TypeScript process supervisor with 60s heartbeat watchdog, 600s wall-clock kill (SIGTERM→SIGKILL), structured `ReviewWrapperTrace` output written to `.cowork/review-traces/`. `scripts/review/review-client.ts` — Claude API review subprocess that emits heartbeat JSON + findings JSON. Test subprocesses (`test/clean-exit.ts`, `test/stall.ts`) for infrastructure verification. `.github/workflows/claude-review.yml` — advisory PR review Action; reads `review:required`/`review:sample` labels, defaults risky surfaces to required, posts findings comment + named check run. `review:required` and `review:sample` labels in both Linear and GitHub. Coordination protocol updated: commit trailer vocabulary (`review:ok`, `review:major-findings`, `review:skipped:<reason>`) + new labels row + Rule 8 "See also" pointer. CLAUDE.md Rule 8 section + Known Sandbox Limitations both back-point to `Docs/plans/2026-04-19-cc-review-replacement.md`. Wiring checklist updated with `ReviewWrapperTrace` + `ReviewActionTrace` entries. Wrapper exercised: clean path (3 heartbeats → review:ok) + stall path (wall-clock-timeout → review:skipped:wall-clock-timeout). tsc clean, vite build green, pre-existing test flake unrelated to this change.

## Recent Completions (2026-04-19) — THR-188
- **THR-188 — Hex→actor index for phaseFamiliarityGain:** New `src/engine/hexActorIndex.ts` with `buildHexActorIndex`, `getActorsOnHex`, `hexKey` exports. Replaces O(N_all) actor walk + hexDistance guard with O(N_hex) index lookup keyed by `{col},${row}`. Handles sublocation→parent resolution; actors with unresolvable locations counted in `unresolvedCount`. Rate-limited `engine_warning` trace on unresolved actors. `engine_warning` trace category + `EngineWarningTrace` added to trace.ts; `EncounterCacheRebuildTrace` also added to TraceEntry union (pre-existing omission from THR-187). 11 unit tests (7 plan cases + 2 utility + 2 edge cases) + 4 determinism contract tests. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-153
- **THR-153 — PR 5: Ruin transformation + PlaceOfPower/Scar + elderEssenceReward refactor:** New `ruinTransformation.ts` implements the 7-row outcome matrix (consequenceRoll × emergenceChoice → graph mutations). New `placeOfPowerStreams.ts` phase credits holder essence per tick with decay countdown + corrupt siphon. `elderEssenceReward.ts` refactored — `awardElderEssence` core extracted, legacy `computeElderEssenceReward` wrapped. New `holds_place_of_power` edge type + schema. New `place_of_power` HexMapV2 icon (crown+ring). `EmergenceDilemmaModal` with 2×2 choice grid (inviable options greyed). `PlaceOfPowerInspector` extends LocationView with holder/stream/decay readout. 6 transformation vignettes (vault/temple/battlefield × transformed/consumed). `phasePlaceOfPowerStreams` wired into orchestrator at 6.659. 29 new tests: transformation outcome matrix (17), stream phase (8), modal smoke (4). tsc clean, build green, all suite tests pass except pre-existing `traceBuffer-integration` flake.

## Recent Completions (2026-04-19) — THR-88
- **THR-88 — Backstory strata 2-4 deepening:** ~46 new prose templates across 6 content tables bringing all backstory keys to 4-templates-per-key target. Each 4th template follows established embodied/behavioral/sensory image pattern. Voice rubric per stratum: biographer (stratum 2), confessor (stratum 3), oracular (stratum 4). No resolver, type, or UI changes. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-187
- **THR-187 — Encounter cache rebuild frequency (deferral from THR-162):** Added `applyEncounterCacheUpdate()` helper to `simulationRuntime.ts` — applies incremental update, bumps `structuralCacheVersion` + `worldVersion`, syncs `encounterCacheBuiltAt` to skip full rebuild next tick; fail-soft fallback on callback error. Removed 3 `touchStructure(runtime)` callsites from orchestrator; each phase now handles its own incremental update. `phaseSettlementPromotion` calls `cache.onLocationTypeChanged` per promotion/demotion; `phaseSublocations` routes spawn/dissolve through `applyEncounterCacheUpdate`; `phaseInitiativeProgress`→`initiativeOutcomes` calls it for `create_sublocation` only. Added `encounter_cache_rebuild` trace category + `EncounterCacheRebuildTrace`; `encounterCacheRebuildCount` counter; debug bridge `getEncounterCacheRebuildCount()`/`getEncounterCacheRebuildTraces()`. 4 new contract assertions + `encounterCacheIncremental.contract.test.ts`. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-97
- **THR-97 — Rangers Brotherhood encounter migration:** 15 templates rewritten to UnifiedActionTemplate format. Rangers voice: terse, laconic, terrain-as-character; `{location}` in every template; `{?has_ally}`/`{?has_faction}` conditionals; encounter seeds (trail_patrol, hunt_return, ambush, monster_hunt, frontier_defense etc.), intelligence grants (beast territory, frontier ford, raider winter camp, defensible valley), hidden marks (rescue debt, secret_knowledge, land-sworn, tracking_correction). Corrects old format's wrong `failBehavior` values, missing `intrinsicTier`/`motivations`, wrong `faction_reputation_gain` field names. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-186
- **THR-186 — Ambient agent phase caps (deferral from THR-162):** Early-exit predicates in three O(N_all) tick phases. Effect Tick: skip agents with no `possesses`/`bonded_to`/`has_trait` edges before calling `tickEffects` — avoids agentNode/location resolution for ~80% of ambient NPCs. Mastery Decay: skip agents with no `has_trait` edges — ambient NPCs never accumulate mastery traits. Familiarity Gain: `FAMILIARITY_PROXIMITY_HEX_RANGE=0` constant + `hexDistance` guard (same-hex behavior preserved). `TickPhaseProfileTrace` emitted once per phase per tick (totalActors/processedActors/skippedActors). Deferral THR-188 filed for hex→actor index. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-185
- **THR-185 — Lifecycle-born agents default to spotlight tier (deferral from THR-162):** Added `spotlightTier: 'ambient'` to lifecycle-born agent node properties in `agentLifecycle.ts`. Prevents unbounded decision-pool growth (~360-720 extra spotlight agents by tick 72 on large maps). Agents now graduate via phaseNpcGraduation. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-180
- **THR-180 — GuildQuestPanel (deferral from THR-156):** New `GuildQuestPanel.tsx` renders active Adventurer's Guild quest hook postings in settlement LocationView sublocation branch. Collapsible panel, gated on Guild hall sublocation presence. Scans ruin nodes within GUILD_QUEST_RADIUS, filters by QUEST_HOOK_COOLDOWN_TICKS, sorts Saga→Major→Minor then by distance. Row click navigates camera to ruin via handleZoomToLocation. Exported hexDirection from questHooks.ts for prose parity. 10 unit tests. tsc clean, build green.

## Archived to project-history.md
- THR-165/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 (2026-04-19/18) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` (one-liners) + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
