# Project Status
> Updated 2026-04-19.
## Current Focus
**Encounter Format Migration — Phase 4 Builders Fellowship complete, remaining guilds next.** 115 legacy EncounterTemplates migrating to UnifiedActionTemplate. Phase 0 engine prerequisites shipped (THR-110–118). Phase 1 TG (THR-89) + Phase 2 AC (THR-91) + Phase 3 CG (THR-92) + Phase 4 BF (THR-93) complete. Reputation polarity tagging complete (THR-33). Design doc: `Docs/plans/2026-04-16-encounter-template-migration.md`.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). THR-88 next.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. THR-172 SphereIcon next.
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-19) — THR-183
- **THR-183 — Vara seed for ascendant bar:** `devSeedAscendantTestPackage()` populates `?seeded` path with Vara/Witness test content: quintessence 0.45 (Rooted), mandate 0.67 (Kindling), 12-sphere essence pool (2 active / 4 faintly-active / 6 inactive), 4 conditions (Veiled/Thornmarked/Unforgotten/Cold of Eye), 3 clue traits, 4 agreements (Pact/Oath/Debt/Bound). `DEV_ASCENDANT_IDENTITY` updated to Vara with Sun-Oath mandate direction.

## Recent Completions (2026-04-19) — THR-170
- **THR-170 — Primitives library:** `ProgressBand.tsx` (label + value bar + prose slot with glow transition), `Divider.tsx` (subtle/gold 1px rule), `index.ts` barrel export for all shared components. `Card.tsx`: padding prop, raised boxShadow, glass rgba+backdropFilter inline. `Button.tsx`: md/lg padding aligned to spec (14px/18px). StyleGuide sections added for ProgressBand + Divider.

## Recent Completions (2026-04-18)
- **THR-181 — Codex is read-only bright-line:** Rule 8 added to "Coordination Failure Modes — Hard Rules" section of coordination protocol doc. Matching bright-line paragraph added to CLAUDE.md CC section, Rules 1–7 count updated to 1–8. Optional cross-ref added from Codex review retirement paragraph back to Rule 8.

## Recent Completions (2026-04-19)
- **THR-156 — Ruins Layer PR 8 (Adventurer's Guild quest hook population):** Phase 6.655 `phaseRuinQuestHooks` — Channel 6 of Narrative Gravity; evidenceStrength ≥ `CLUE_QUEST_THRESHOLD` (0.5) + Guild within `GUILD_QUEST_RADIUS` (5 hexes) → stamps ruin node with `questHookPostedTick/questHookTemplateId` + emits toast. `QUEST_HOOK_PRIORITY_BOOST=4.0` for AG members via `factionQuestGeneration.ts`. 5 sphere-archetype vignettes. 2 trace categories. `QUEST_HOOK_COOLDOWN_TICKS=60` duplicate guard. THR-180 deferral (Guild quest panel). 20 tests.
- **THR-18 — Siege Template Attention Tier Classification:** Added `intrinsicTier: AttentionTier` as required field on `SiegeSpotlightTemplate` and `SiegeRegionalTemplate`. All 12 templates classified (4 story_beat spotlights: breach/final_assault/relief_arrives/negotiate_terms; 3 shaping; 1 background spotlight; 3 shaping regionals; 2 background regionals). Regional materialization propagates tier into `EncounterProgress.effectiveTier` via `resolveEffectiveTier`. Spotlight firing emits `DigestEntry` + `QueuedStoryBeat` for story_beat tier. Siege focus court position resolved from bonded actors in siege factions; retinue fallback. 2 new trace categories. 21 tests.
- **THR-155 — Ruins Layer PR 7 (Dual-voice chronicle migration):** `ChronicleEntry` extended with optional `poetProse?: string` and `witnessFacts?: string[]`; migration shim treats legacy `prose` as witness fact. `ChronicleEntryCard` renders Poet (display serif italic) / Witness (body sans bullets) voices. `ChroniclePanel` wraps the list with a Poet/Witness/Both toggle. Wired into GameView right sidebar when `chronicleEntries.length > 0`. Rarity graduation events upgraded to dual-voice; all high-significance event path adds `witnessFacts`. 13 tests (schema roundtrip, render smoke, toggle state). Wiring checklist updated.
- **THR-151 — Ruins Layer PR 3 (Perceive/Relay divine actions):** 5 hex-targeted Perceive and 2 agent-targeted Relay divine action templates. Resolver module `perceiveRelay.ts` with 7 handlers: `cast_attention` (vague ruin clue), `refine_the_hush` (upgrade vague→narrowed), `listen_for_a_name` (narrowed + originCultureId), `read_the_threads` (PoP vague clue, no adjacency gate), `taste_the_wake` (divine_mark trace sweep), `compose_a_clue` (direct `knows_clue_of` + `divine_mark` edge), `whisper_the_direction` (movement override to nearest ruin). Hook wired in `unifiedActionResolution.ts` after the `revelationAction` pattern. 12 cost constants in `ruins/constants.ts`. 20 tests.
- **THR-29 — Social Expansion C: Faction Agency:** 6-action autonomous faction system (commission_quest, declare_rivalry, propose_alliance, excommunicate, hold_conclave, issue_bounty). Phase 6.652 in orchestrator. Leader personality bias via AxiologicalProfile axes. Multi-tick conclave with resolution conditions. 8 faction encounter templates. Divine Edict + Anoint Champion player actions. FactionSheet: Recent Actions section, active conclave display, rival/alliance badges. 10 tests.

- **THR-154 — Ruins Layer PR 6 (worldgen elder_ruin density pass):** `src/content/ruins/archetypes.ts` — vault/temple/battlefield archetype descriptors + weighted random picker. `src/engine/ruins/elderRuinSeeding.ts` — full worldgen seeding pass: historical territory detection via `belongs_to` cultureLayer edges, settlement exclusion, water terrain skip, per-hex cap (1 standard / 3 capital), province-role density/magnitude bias, sphere alignment from culture or terrain affinity, `ruins.density_seeded` trace with byArchetype/byMagnitude/bySphere breakdown. Wired into `gameInit.ts` after `seedMonsterLairs`. Ruins debug tab added to DebugPanel. 7 tests.
- **THR-166 — Register craftsmanship reputation axis for BF (deferral from THR-93):** Renamed all 17 `bf.craft_work`/`bf.construction_work`/`bf.fellowship_work`/`bf.master_craft` tally keys to `stone.positive` in `builders-fellowship-encounter-content.ts`. Delta values preserved. Removed v1-substitution header comment. Added regression test to `phaseReputationTraits.test.ts` asserting BF tallies promote to Steadfast Builder at Level 1.
- **THR-150 — Ruins Layer PR 2 (clue lifecycle + Narrative Gravity):** `src/engine/ruins/clueLifecycle.ts` — `selectClueRecipient` (6-channel Narrative Gravity weighted-random, saga tier floor, score breakdown traces), `produceClueConsequence`, `consumeCluesOnConvergence` (prune → `knows_of` familiarity edges), `spawnClueFromEvent` (aftermath hook), `phaseClueDecay` (Phase 6.654, TTL-based knows_clue_of expiry), `findAnyRuinId` (dynamic `$nearest_ruin` resolution). `spawn_clue` aftermath effect kind added to `unifiedAction.ts` + handled in `encounterAftermath.ts`. Phase 6.654 wired in orchestrator after phaseSecretsFavors. 5 encounter templates seeded with spawn_clue hooks (oracle-consulted, silent-chamber, infiltrators-approach, veiled-consultation, blinded-oracle). CluesDebugTab added to DebugPanel. `knows_clue_of` + `knows_of` registered in edgeSchema. 11 tests including 1000-trial Kael/Mira worked example (193.0:14.0 ≈ 93%:7%).

## Recent Completions (2026-04-18) — archived to project-history.md
- THR-149 (Ruins foundation), THR-161 (CI/CD), THR-160 (test repair), THR-148 (portfolio-pinning), THR-51 (agent initiatives), THR-33 (reputation polarity), THR-92 (CG migration), THR-147/146/30/137/32/133/143/144/15/91/16/118/116/86 — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
