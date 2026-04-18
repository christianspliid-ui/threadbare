# Project Status
> Updated 2026-04-18.
## Current Focus
**Encounter Format Migration — all factions complete (THR-31).** All 10 factions now in UnifiedActionTemplate with Threadbare-voiced prose, enrichment placeholders, conditional blocks, and aftermathConfig. Voice lint test enforces structural quality on 550 tests across all unified factions.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). THR-88 next.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. THR-173 Thread Panel next.
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-18) — THR-31 + THR-173
- **THR-31 — Faction content migration to UnifiedActionTemplate (Phase 2):** All 10 factions now in unified format. Phase 2 pass migrated Underking Court, Rangers Brotherhood, Merchant Consortium, Mercenary Company, Lorekeepers Covenant, Temple of Spheres. Fixed lifecycle template shapes (rarityTier, duration, failBehavior) for mc/lk/ts join+promotion. Updated factionQuestGeneration.ts to use unifiedToEncounterTemplate() fallback. Voice lint test enforces 550 tests.
- **THR-173 — ThreadsPanel visual rewrite:** ThreadPortrait SVG sub-component, 3px sphere-colored left border, AutoToggle replacing attention mode button, SphereIcon + ActivityIcon integration. All 12 data surfaces preserved. All 16 tests pass.

## Recent Completions (2026-04-19) — THR-127
- **THR-127 — Living World summary bar (top-3 active locations):** New `LiveLocationBar.tsx` component (absolute bottom-left of map area, z=20). Reads from `locationActivitySummaries` (already computed), sorts non-quiet locations by pulse severity (volatile > tense > busy > stirring), shows up to 3 per page. Rotates through a pool of 9 via `Math.floor(tick / ROTATE_EVERY_TICKS) % numPages`. Pulse glyph (◉/◎/●/·) + location name + first murmur line. Click → `hexMapRef.centerOn` zoom. Dismiss × button collapses bar. Wired into GameView `viewLevel === 'world'` block after AvatarHUD. 10 new tests.

## Recent Completions (2026-04-19) — THR-128
- **THR-128 — Omen vocabulary injection into murmur prose:** `getOmenTemplateById` imported into `deriveLocationActivities.ts`. In `selectMurmurs`, after picking the murmur, the active omen's template vocabulary is resolved; two deterministic rng() calls pre-pick an adjective and atmosphere phrase. Replaces `{omen_adj}` / `{omen_atmosphere}` placeholders in the murmur string (forward-compat for future templates), and at `OMEN_VOCAB_INJECT_PROBABILITY=0.4` appends the atmosphere phrase as a second murmur line. Fail-soft: unknown templateId → no injection, no crash. 6 new tests.

## Recent Completions (2026-04-19) — THR-80
- **THR-80 — Doom-echo omen templates for 4 new archetypes:** 16 new `OmenTrackTemplate` entries (4 per archetype, stages 0–3): `changing` (chaos/flux), `sundering` (force/severing), `failing` (time/entropy), `ascension` (spirit/transcendence). Each template has prose beats with `{location}` placeholder, `vocabulary{adjectives,verbs,nouns,atmosphere}`, `doomStageRange`, `durationRange`. Spread into `OMEN_TEMPLATES` registry. 13 new acceptance tests in `omen-templates-content.test.ts`.

## Recent Completions (2026-04-19) — THR-125
- **THR-125 — Hex pulse ambient glow layer for tense/volatile hexes:** New `HexPulseMesh.ts` InstancedMesh sublayer (RENDER_ORDER.HEX_PULSE=7.5, LAYER_Z.HEX_PULSE=0.060) renders radial gradient quads at hexes where LocationActivitySummary.pulse is `tense` (amber) or `volatile` (red). AdditiveBlending keeps it atmospheric. `tickHexPulse` breathes material opacity at 0.6 Hz. Visible at hero-local + regional only. `updateHexPulseMesh` keyed from `locationActivityMap` prop via dedicated useEffect. 14 new tests.

## Recent Completions (2026-04-19) — THR-34
- **THR-34 — Social bond shift from reputation reactions:** `computeReputationBondShift()` in `socialEncounterGeneration.ts` walks the target's `has_trait` edges and aggregates signed reaction contributions (`REPUTATION_REACTION_VALENCES`). Plugged into `computeBondModifier` for stranger and weak-bond cases; strong/hostile trust paths unchanged. 3 new constants (`REPUTATION_REACTION_MAX_LEVEL`, `REPUTATION_BOND_SHIFT_SCALE`, `REPUTATION_BOND_SHIFT_MAX`). 15 new tests.

## Recent Completions (2026-04-19) — THR-152
- **THR-152 — Delve encounter variant + 5-beat arc (Ruins Layer PR 4):** Three new tick phases (6.656-6.658): `phaseDelveAdmission` (scans for located clues at elder_ruin hexes, enforces scale caps saga=1/major=2/minor=3, queues blocked entries with expiry), `phaseDelveProgression` (seeded RNG capability roll vs difficulty threshold, dual-voice chronicle entry per beat, stalled outcome doubles next-beat delay), `phaseDelveEmergence` (rolls consequence, sets `pendingEmergenceDecision` for PR-5, auto-fires 'let' on timeout). New: `delveTypes.ts`, `delveVariant.ts`, `ruins-delve-content.ts` (45 prose vignettes 3 archetypes × 5 beats × 3 outcomes), `DelveProgressPanel.tsx`, 21 integration tests.

## Recent Completions (2026-04-19) — THR-167
- **THR-167 — Close dead-tally loophole (faction_reputation_gain effect + tally key validation):** Added `faction_reputation_gain` to `EncounterAftermathReactionEffect` — content authors can now grow faction rank as an encounter aftermath without off-axis tally hacks. Added `encounter_aftermath` cause to `FactionReputationTrace`. Tally key validation at `encounterAftermath.ts` write time: off-axis keys emit `aftermath_invalid_tally_key` trace with `suggestedReplacement` hint (rate-limited 50/tick) and are silently dropped. Migrated 4 tests using off-axis keys to valid reach-polarity keys. 5 new tests in `aftermathFactionReputation.test.ts`.

## Recent Completions (2026-04-19) — THR-126
- **THR-126 — Agent activity halo rings in HexMapV2:** `activityCategory?: ActivityCategory` added to `AgentRenderData`. `buildActivityHaloTexture()` builds a thin colored ring (8% ring width, thinner than avatar ring). `AgentSpriteMesh` creates `activityHaloSprite` behind the portrait sprite, hidden by default, shown only at hero-local zoom via `updateZoomVisibility`. Animation target moves halo with main sprite. `GameView` builds `agentActivityCategoryMap` (familiarityScore ≥ 0.2, non-idle gate) and `agentRenderDataWithActivity` enrichment memo. 7 new tests.

## Recent Completions (2026-04-19) — THR-122
- **THR-122 — THR-21 deferrals (death-site spirit pressure, returnEngine doom prose, trust-decay amplifier):** `phaseProsperity` emits `SpherePressureEvent{sphere:'spirit'}` for death-site locations when `IdentityLocationPressure.deathSiteSpiritPressure` is set (Reckoning matrix, `RECKONING_DEATH_SITE_SPIRIT_PRESSURE=2`). `returnEngine.ts` threads `DoomIdentityMatrix` into `getReturnProse`/`applyRippleConsequences` so `{doom_verb}/{doom_adj}/{doom_atmosphere}` placeholders resolve in return prose. `complicationEffects.ts` amplifies `trust_decay` magnitude by `IDENTITY_TRUST_DECAY_MODIFIER` (1.2×) when doom identity active. 6 new tests.

## Archived to project-history.md
- THR-81/172/183/170/181/156/18/155/151/29/154/166/150 (2026-04-18/19) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
