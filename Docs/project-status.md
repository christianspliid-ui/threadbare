# Project Status
> Updated 2026-04-19.
## Current Focus
**Encounter Format Migration — Phase 4 Builders Fellowship complete, remaining guilds next.** 115 legacy EncounterTemplates migrating to UnifiedActionTemplate. Phase 0 engine prerequisites shipped (THR-110–118). Phase 1 TG (THR-89) + Phase 2 AC (THR-91) + Phase 3 CG (THR-92) + Phase 4 BF (THR-93) complete. Reputation polarity tagging complete (THR-33). Design doc: `Docs/plans/2026-04-16-encounter-template-migration.md`.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). THR-88 next.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. THR-173 Thread Panel next.
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-19) — THR-152
- **THR-152 — Delve encounter variant + 5-beat arc (Ruins Layer PR 4):** Three new tick phases (6.656-6.658): `phaseDelveAdmission` (scans for located clues at elder_ruin hexes, enforces scale caps saga=1/major=2/minor=3, queues blocked entries with expiry), `phaseDelveProgression` (seeded RNG capability roll vs difficulty threshold, dual-voice chronicle entry per beat, stalled outcome doubles next-beat delay), `phaseDelveEmergence` (rolls consequence, sets `pendingEmergenceDecision` for PR-5, auto-fires 'let' on timeout). New: `delveTypes.ts`, `delveVariant.ts`, `ruins-delve-content.ts` (45 prose vignettes 3 archetypes × 5 beats × 3 outcomes), `DelveProgressPanel.tsx`, 21 integration tests.

## Recent Completions (2026-04-19) — THR-167
- **THR-167 — Close dead-tally loophole (faction_reputation_gain effect + tally key validation):** Added `faction_reputation_gain` to `EncounterAftermathReactionEffect` — content authors can now grow faction rank as an encounter aftermath without off-axis tally hacks. Added `encounter_aftermath` cause to `FactionReputationTrace`. Tally key validation at `encounterAftermath.ts` write time: off-axis keys emit `aftermath_invalid_tally_key` trace with `suggestedReplacement` hint (rate-limited 50/tick) and are silently dropped. Migrated 4 tests using off-axis keys to valid reach-polarity keys. 5 new tests in `aftermathFactionReputation.test.ts`.

## Recent Completions (2026-04-19) — THR-126
- **THR-126 — Agent activity halo rings in HexMapV2:** `activityCategory?: ActivityCategory` added to `AgentRenderData`. `buildActivityHaloTexture()` builds a thin colored ring (8% ring width, thinner than avatar ring). `AgentSpriteMesh` creates `activityHaloSprite` behind the portrait sprite, hidden by default, shown only at hero-local zoom via `updateZoomVisibility`. Animation target moves halo with main sprite. `GameView` builds `agentActivityCategoryMap` (familiarityScore ≥ 0.2, non-idle gate) and `agentRenderDataWithActivity` enrichment memo. 7 new tests.

## Recent Completions (2026-04-19) — THR-122
- **THR-122 — THR-21 deferrals (death-site spirit pressure, returnEngine doom prose, trust-decay amplifier):** `phaseProsperity` emits `SpherePressureEvent{sphere:'spirit'}` for death-site locations when `IdentityLocationPressure.deathSiteSpiritPressure` is set (Reckoning matrix, `RECKONING_DEATH_SITE_SPIRIT_PRESSURE=2`). `returnEngine.ts` threads `DoomIdentityMatrix` into `getReturnProse`/`applyRippleConsequences` so `{doom_verb}/{doom_adj}/{doom_atmosphere}` placeholders resolve in return prose. `complicationEffects.ts` amplifies `trust_decay` magnitude by `IDENTITY_TRUST_DECAY_MODIFIER` (1.2×) when doom identity active. 6 new tests.

## Recent Completions (2026-04-19) — THR-121
- **THR-121 — Add agentAwareness to RivalState + wire rival_awareness complication effect:** Added `agentAwareness?: Partial<Record<string, number>>` to `RivalState`. Added `RIVAL_AWARENESS_HOSTILITY_WEIGHT = 0.2` to `sphereAffinity.ts`. Moved `rival_awareness` handling to actor-independent section of `applyEffect` (removes silent no-op cast). `phaseRivalActions` computes max agentAwareness and adds it × weight to effective hostility for action selection. 3 new tests.

## Recent Completions (2026-04-19) — THR-120
- **THR-120 — Add spherePressures to WorldSoulState and wire sphere_pressure complication effect:** Added `spherePressures?: Partial<Record<string, number>>` to `WorldSoulState`. Moved `sphere_pressure` case before `actorNode` guard in `applyEffect` (it doesn't need the actor). Added `SPHERE_PRESSURE_OMEN_BIAS_WEIGHT = 1.0` constant and modified `getSphereDominance()` in `phaseOmenAgenda.ts` to blend sphere pressures into apparent sphere dominance, biasing sphere-surge omen selection toward pressured spheres. 6 new tests.

## Recent Completions (2026-04-19) — THR-119
- **THR-119 — Wire partial_progress complication to advance step progress:** Removed stale `_complicationPartialProgress` actor-node property write in `complicationEffects.ts`. Added consumer in `executeStepResult` that reads `fraction` directly from `ComplicationResult.effects` and applies `floor(fraction * stepDuration)` ticks as head-start on the next step's `stepProgress` (capped at `stepDuration - 1`). Emits `complication_partial_progress` trace. 1 regression test.

## Recent Completions (2026-04-19) — THR-81
- **THR-81 — Wire omenEncounterBias into scoring traces:** The bias was already computed and passed to `scoreAndSelect()`. Added `identityBiasBonus: number` to `ScoredCandidate` and `ScoringTrace.topCandidates` so the per-candidate omen+doom bias contribution is inspectable in traces (NFP #2). 3 tests asserting bias shifts `finalScore` by the correct additive delta.

## Archived to project-history.md
- THR-172/183/170/181/156/18/155/151/29/154/166/150 (2026-04-18/19) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
