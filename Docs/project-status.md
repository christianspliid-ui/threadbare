# Project Status
> Updated 2026-04-23.
## Current Focus
**THR-95 shipped (Holy Order of Dawn — 15 templates, audit+uplift pass).** Merge held pending THR-134 U4. THR-183 pending GitHub Pro (flip review Action to blocking).

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). ✅ Phase 6 RB (THR-97). ✅ Phase 7 LC (THR-96). ✅ Phase 8 HOD (THR-95). Merge held on all until THR-134 U4 closes.
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

## Recent Completions (2026-04-23) — THR-246
- **THR-246 — Linear MCP rate-limit relief:** Cowork session-start collapsed from 5 per-state `list_issues` calls to one board scan with in-memory bucketing. pull-work skill adds Step 0 (rate-limit guard on 429) and rewrites Steps 1+2 to derive all slices from one scan. Codex automation prompt updated with same board-scan pattern + `:30` cadence offset. THR-234 label-split plan backfill audit updated (5 calls → 1). Weekly hygiene skill draft updated. CLAUDE.md Cowork bullet now points to coordination protocol §. Impediment #79 logged. tsc clean, build green, 671 tests passed.

## Recent Completions (2026-04-23) — THR-95
- **THR-95 — Holy Order of Dawn encounter audit+uplift:** 15 templates reviewed against quality bar and systemic wiring targets. 5 templates uplifted: `inquisition` success got intelligence grant (agent_network, cult hierarchy); `escort_pilgrims` failure got soul_diminishment hidden mark + encounter_seed → slay_abomination; `deliver_judgment` success got reputation_note hidden mark + encounter_seed → cleanse_corruption; `lead_crusade` got success (mark + rep tally) and failure (mark + rep tally + seed → holy_war) variants; `holy_war` got success (mark + rep tally +3) and failure (mark + seed → holy_war retry) variants. Merge held pending THR-134 U4.

## Recent Completions (2026-04-20) — THR-233
- **THR-233 — Checklist instantiation protocol (trial):** Plan doc committed (`Docs/plans/2026-04-20-checklist-instantiation-protocol.md`). Two trigger points: Cowork instantiates Design Workflow Checklist on In Design pickup; CC instantiates full DoD + action items on claim-verified pickup and posts a Linear comment as the persistence layer. 5-issue trial begins with this issue.

## Recent Completions (2026-04-19) — THR-182
- **THR-182 — CC review replacement (heartbeat wrapper + PR-gated Action):** `scripts/review/wrapper.ts` — TypeScript process supervisor with 60s heartbeat watchdog, 600s wall-clock kill (SIGTERM→SIGKILL), structured `ReviewWrapperTrace` output written to `.cowork/review-traces/`. `scripts/review/review-client.ts` — Claude API review subprocess that emits heartbeat JSON + findings JSON. Test subprocesses (`test/clean-exit.ts`, `test/stall.ts`) for infrastructure verification. `.github/workflows/claude-review.yml` — advisory PR review Action; reads `review:required`/`review:sample` labels, defaults risky surfaces to required, posts findings comment + named check run. `review:required` and `review:sample` labels in both Linear and GitHub. Coordination protocol updated: commit trailer vocabulary (`review:ok`, `review:major-findings`, `review:skipped:<reason>`) + new labels row + Rule 8 "See also" pointer. CLAUDE.md Rule 8 section + Known Sandbox Limitations both back-point to `Docs/plans/2026-04-19-cc-review-replacement.md`. Wiring checklist updated with `ReviewWrapperTrace` + `ReviewActionTrace` entries. Wrapper exercised: clean path (3 heartbeats → review:ok) + stall path (wall-clock-timeout → review:skipped:wall-clock-timeout). tsc clean, vite build green, pre-existing test flake unrelated to this change.

## Recent Completions (2026-04-19) — THR-188
- **THR-188 — Hex→actor index for phaseFamiliarityGain:** New `src/engine/hexActorIndex.ts` with `buildHexActorIndex`, `getActorsOnHex`, `hexKey` exports. Replaces O(N_all) actor walk + hexDistance guard with O(N_hex) index lookup keyed by `{col},${row}`. Handles sublocation→parent resolution; actors with unresolvable locations counted in `unresolvedCount`. Rate-limited `engine_warning` trace on unresolved actors. `engine_warning` trace category + `EngineWarningTrace` added to trace.ts; `EncounterCacheRebuildTrace` also added to TraceEntry union (pre-existing omission from THR-187). 11 unit tests (7 plan cases + 2 utility + 2 edge cases) + 4 determinism contract tests. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-153
- **THR-153 — PR 5: Ruin transformation + PlaceOfPower/Scar + elderEssenceReward refactor:** New `ruinTransformation.ts` implements the 7-row outcome matrix (consequenceRoll × emergenceChoice → graph mutations). New `placeOfPowerStreams.ts` phase credits holder essence per tick with decay countdown + corrupt siphon. `elderEssenceReward.ts` refactored — `awardElderEssence` core extracted, legacy `computeElderEssenceReward` wrapped. New `holds_place_of_power` edge type + schema. New `place_of_power` HexMapV2 icon (crown+ring). `EmergenceDilemmaModal` with 2×2 choice grid (inviable options greyed). `PlaceOfPowerInspector` extends LocationView with holder/stream/decay readout. 6 transformation vignettes (vault/temple/battlefield × transformed/consumed). `phasePlaceOfPowerStreams` wired into orchestrator at 6.659. 29 new tests: transformation outcome matrix (17), stream phase (8), modal smoke (4). tsc clean, build green, all suite tests pass except pre-existing `traceBuffer-integration` flake.


## Recent Completions (2026-04-19) — THR-187
- **THR-187 — Encounter cache rebuild frequency (deferral from THR-162):** Added `applyEncounterCacheUpdate()` helper to `simulationRuntime.ts` — applies incremental update, bumps `structuralCacheVersion` + `worldVersion`, syncs `encounterCacheBuiltAt` to skip full rebuild next tick; fail-soft fallback on callback error. Removed 3 `touchStructure(runtime)` callsites from orchestrator; each phase now handles its own incremental update. `phaseSettlementPromotion` calls `cache.onLocationTypeChanged` per promotion/demotion; `phaseSublocations` routes spawn/dissolve through `applyEncounterCacheUpdate`; `phaseInitiativeProgress`→`initiativeOutcomes` calls it for `create_sublocation` only. Added `encounter_cache_rebuild` trace category + `EncounterCacheRebuildTrace`; `encounterCacheRebuildCount` counter; debug bridge `getEncounterCacheRebuildCount()`/`getEncounterCacheRebuildTraces()`. 4 new contract assertions + `encounterCacheIncremental.contract.test.ts`. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-96
- **THR-96 — Lorekeepers Covenant encounter migration:** 15 templates rewritten to UnifiedActionTemplate format. Lorekeepers voice preserved (record, annal, margin, hand — never story/myth); `{?has_artifact}` conditionals in 10 templates. 13 intelligence grants (cultural_knowledge, political_secret, shrine_location), 6 encounter seeds (research threads, lore-debt follow-ups), 6 hidden marks (secret_knowledge, forbidden_contact, political_secret). Corrects old format's `failBehavior: 'block'`, missing intrinsicTier/motivations, wrong faction_reputation_gain field names. PR open; merge held pending THR-134 U4. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-97
- **THR-97 — Rangers Brotherhood encounter migration:** 15 templates rewritten to UnifiedActionTemplate format. Rangers voice: terse, laconic, terrain-as-character; `{location}` in every template; `{?has_ally}`/`{?has_faction}` conditionals; encounter seeds, intelligence grants, hidden marks. Corrects old format's wrong `failBehavior` values, missing `intrinsicTier`/`motivations`, wrong `faction_reputation_gain` field names. tsc clean, build green.

## Archived to project-history.md
- THR-165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 (2026-04-19/18) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` (one-liners) + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
