# Project Status
> Updated 2026-04-19.
## Current Focus
**GuildQuestPanel shipped (THR-180).** Settlement LocationView now shows a "Guild Postings" panel (collapsible, default expanded) when an Adventurer's Guild hall sublocation is present. Reads active quest hooks stamped by phaseRuinQuestHooks (THR-156); click-through navigates to ruin hex. Next: THR-153 (PR 5 — Ruin transformation + PlaceOfPower, model:opus).

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). THR-88 next.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-19) — THR-180
- **THR-180 — GuildQuestPanel (deferral from THR-156):** New `GuildQuestPanel.tsx` renders active Adventurer's Guild quest hook postings in settlement LocationView sublocation branch. Collapsible panel, gated on Guild hall sublocation presence. Scans ruin nodes within GUILD_QUEST_RADIUS, filters by QUEST_HOOK_COOLDOWN_TICKS, sorts Saga→Major→Minor then by distance. Row click navigates camera to ruin via handleZoomToLocation. Exported hexDirection from questHooks.ts for prose parity. 10 unit tests. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-162
- **THR-162 — Tick loop scaling investigation:** Confirmed root cause of ?seeded vs --seed 42 divergence: DEV_ASCENDANT_IDENTITY uses hunger.witness → large map (48×36=1728 hexes) vs CLI medium (32×24=768 hexes). Fix: App.tsx now respects ?size= URL override in the seeded path (?view=game&seeded&size=medium for safe testing). Stall diagnosed as unbounded spotlight pool growth from lifecycle-born agents lacking explicit spotlightTier. Filed 3 follow-ups: THR-185 (spotlight default), THR-186 (O(N) ambient iterations), THR-187 (cache rebuild frequency). CLAUDE.md stale MAX_DISTANCE_MATRIX_SIZE corrected.

## Recent Completions (2026-04-19) — THR-174
- **THR-174 — Viewport contract audit at 1920×1080:** All 5 primary views pass scroll check (scrollDelta=0, overflow:hidden at html/body/#root). Modal at 75vh < 85vh contract. InterventionConfirm + AgendaPicker use `absolute inset-0` correctly. No regressions after 16px typography floor. Audit doc: `Docs/viewport-audit-2026-04-18.md`. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-94
- **THR-94 — Merchant Consortium encounter content upgrade:** All 15 MC templates rewritten from broken legacy shape to canonical UnifiedActionTemplate. Fields corrected (reach/intrinsicTier/crudType/scale/motivations/failBehavior, successMetadata/failureMetadata). BranchAwareAftermathConfig with typed effects: 5 intelligence grants (trade_route/political_secret/cultural_knowledge), 7 encounter seeds (renegotiation, summit→deal, resistance coalition, tasting→contract, factor→commission), 2 hidden marks (predatory pricing secret_knowledge, summit private concession debt), 1 spawn_artifact (Consortium Warehouse). Threadbare prose with MC voice lexicon (terms, split, margin, book price, street price, handshake, ledger, quiet). Pronouns + `{?has_faction}`/`{?no_faction}`/`{?has_ally}`/`{?has_artifact}` conditionals throughout. Zero tsc errors. All 2227 src/data tests pass. 550 faction voice lint tests pass.

## Recent Completions (2026-04-19) — THR-184
- **THR-184 — Ascendant Bar:** Persistent 360px left rail for hexmap screen. Five sections: identity + quintessence (IdentityStrip with band-responsive halo: bloom/breathe/warn/flicker), essence rows (fill bars + trend arrows), action tray (core/self/rare tiers, spent/gated states), mandate (flavor line + progress fill + trend word), hooks (conditions/clues/vows chips from graph has_attachment edges with 600ms hover tooltip). QuintessenceBand type (6-level: transcendent/healthy/strained/weakened/critical/dissolving) added to quintessence.ts. Tray classifier in engine/ascendantTray.ts. All prose/content in data/ascendant-bar-content.ts. Debug bridge: setQuintessence/setBand helpers. Supersedes IdentityChip, AvatarHUD, EssencePanel, MandateTracker. All animations gated under prefers-reduced-motion.

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

## Archived to project-history.md
- THR-152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 (2026-04-18/19) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
