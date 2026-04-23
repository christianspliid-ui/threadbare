# Project Status
> Updated 2026-04-23.
## Current Focus
**THR-134 verification run complete — Phase 2 migration unblocked.** No U-pillar blocker found (U4 code-verified). Phase 2 merges can proceed. THR-255/256/257 filed as follow-ups. THR-183 pending GitHub Pro.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). ✅ Phase 6 RB (THR-97). ✅ Phase 7 LC (THR-96). ✅ Phase 8 HOD (THR-95). ✅ Phase 9 TS (THR-99). THR-134 closed — Phase 2 unblocked.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). ✅ THR-88 shipped (backstory strata 2-4 deepening). ✅ THR-239 shipped (authoring brief — compiled content-pipeline preamble).
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-23) — THR-259 + THR-36
- **THR-259 — Hex Tooltip Murmurs in CMS Registry:** Exported `MURMUR_TEMPLATES` from `deriveLocationActivities.ts` + added `hex-murmurs` registry entry (Narrative & Prose, ProseViewer). All pulse × activity-category rows browsable at `?view=cms`.
- **THR-36 — Reputation Traits in CMS Registry:** Added `reputation-trait-definitions` entry (Traits, TableViewer, 8 columns). All 17 reputation traits browsable at `?view=cms`. Also landed staged `effect-constants.ts` additions that were blocking the build.

## Recent Completions (2026-04-23) — THR-134
- **THR-134 — Pilot-phase UI + CLI verification (THR-129 deferral):** All remaining UNABLE checks closed. U1–U3 PASS; U4 CONDITIONAL PASS (code-verified: `hidden_mark`/`intelligence`/`encounter_seed` confirmed writing to `nextTickEvents`); U5 CONDITIONAL PASS (WebGL agent portraits confirmed via Claude-in-Chrome); X6 PASS (103 events / 17 agents / valid TSV). No U-pillar blocker. Phase 2 migration unblocked. Follow-ups: THR-255 (E1 snapshot), THR-256 (trace hygiene), THR-257 (CLI aftermath hook).

## Recent Completions (2026-04-19) — THR-100
- **THR-100 Phase 3 — Migrate 14 social encounter templates:** All 14 templates in `social-encounter-content.ts` converted from `EncounterTemplate[]` to `UnifiedActionTemplate[]`. Prose: Threadbare relational/pressure-tempered register; `{name}/{they}` in every field; `{?has_faction}` in 11/14; `{ally:strongest}/{rival:strongest}` in 6/14. Systemic wiring: 9 encounter seeds, 8 hidden marks, 4 ActionStepBranch leverage forks. Consumer updates: `encounterCache.ts` (new Unified helpers + RARITY_TO_THREAT/CRUD_TO_ENCOUNTER_TYPE maps), `socialEncounterGeneration.ts` (split slot priority: faction→tavern→unified→legacy), `socialOutcome.ts` (falls back to getUnifiedTemplateById for cooperative/destructive classification), CMS registry columns updated. GameView activity icon fallback added for migrated social templates. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-182
- **THR-182 — CC review replacement (heartbeat wrapper + PR-gated Action):** `scripts/review/wrapper.ts` — TypeScript process supervisor with 60s heartbeat watchdog, 600s wall-clock kill (SIGTERM→SIGKILL), structured `ReviewWrapperTrace` output written to `.cowork/review-traces/`. `scripts/review/review-client.ts` — Claude API review subprocess that emits heartbeat JSON + findings JSON. Test subprocesses (`test/clean-exit.ts`, `test/stall.ts`) for infrastructure verification. `.github/workflows/claude-review.yml` — advisory PR review Action; reads `review:required`/`review:sample` labels, defaults risky surfaces to required, posts findings comment + named check run. `review:required` and `review:sample` labels in both Linear and GitHub. Coordination protocol updated: commit trailer vocabulary (`review:ok`, `review:major-findings`, `review:skipped:<reason>`) + new labels row + Rule 8 "See also" pointer. CLAUDE.md Rule 8 section + Known Sandbox Limitations both back-point to `Docs/plans/2026-04-19-cc-review-replacement.md`. Wiring checklist updated with `ReviewWrapperTrace` + `ReviewActionTrace` entries. Wrapper exercised: clean path (3 heartbeats → review:ok) + stall path (wall-clock-timeout → review:skipped:wall-clock-timeout). tsc clean, vite build green, pre-existing test flake unrelated to this change.

## Recent Completions (2026-04-23) — THR-252
- **THR-252 — Phase-runner WorldPredicate ops (world-flag, has-faction/agent-of-archetype):** Extended `evaluatePhasePredicateV1` in `phaseComposition.ts` with three new predicate ops. `world-flag` reads `state.worldFlags` and compares against expected value. `has-faction-of-archetype` counts faction actors by `factionDefId`. `has-agent-of-archetype` counts individual actors by `archetypeId` (ascendants excluded in v1, documented narrowing). Added `countActorsByArchetype` + `satisfiesCountBounds` private helpers; count bounds semantics: no bounds = presence (≥1), `lte:0` = absence. Unknown-op fallthrough preserved. Chain Weakens recipe gains `phase-5-reckoning` (three-term `and`: doom-clock + world-flag + has-faction-of-archetype). Story-beat stub `chain-weakens-reckoning` added (prose polish deferred → THR-253). DebugPanel CompositionView gains predicate-summary lines for world-flag, has-faction/agent-of-archetype, and `and` predicates. Deferral #1: `edge-exists` predicate filed as new Linear issue. 39 new tests (22 unit + 17 integration). tsc clean, build green, 10646 tests passed.

## Recent Completions (2026-04-23) — THR-225
- **THR-225 — Event recipe phased activation (doom-clock tiers):** Phase DSL added to Composition schema (`phases?: Phase[]`), `ActiveComposition` in GameState. New `phaseComposition.ts` tick runner evaluates doom-clock + composition-fired predicates per tick; activates phases, applies effects (set-world-flag, mark-composition-fired), enqueues story beats via existing pacingGovernor path, emits Chronicle entries. Three new trace types (`composition.phase_activated`, `composition.failed`, `composition.phase_eval_failed`). Chain Weakens reference recipe (4 phases over tiers 1-4) + Winnowing of Luck retrofit (3 phases). CompositionView debug tab wired through DebugPanel → GameView. `window.__DEBUG.getActiveCompositions()` exposed. Placeholder story-beat prose for all four Chain Weakens phases. 12 unit tests. Four deferral issues: THR-251 (GC), THR-252 (non-doom predicates), THR-253 (prose polish), THR-254 (dual-voice Chronicle). tsc clean, build green, 10619 tests passed.

## Recent Completions (2026-04-23) — THR-164
- **THR-164 — Linear workflow hardening research:** Plan doc committed (`Docs/plans/2026-04-23-linear-workflow-hardening.md`). Evaluates 5 candidate structural enforcement mechanisms: In Review auto-close repoint (SHIP), default team filter (SKIP), Reopened label automation (SHIP), stale-claim cron (SHIP), pull-work atomic claim wrapper (SHIP). Four follow-up issues filed (THR-247/248/249/250). Implementation order: wrapper → automation → auto-close → stale-claim cron.

## Recent Completions (2026-04-23) — THR-99
- **THR-99 — Temple of Spheres encounter migration:** 15 templates fully migrated from invalid legacy format (wrong `failBehavior: 'block'`, flat `aftermathConfig.reactions`) to valid `UnifiedActionTemplate` shape with Threadbare prose (cosmological-that-weighs voice). All 15 fire on 2+ sphere-aligned axes; 11 hidden marks; 9 encounter seeds; 5 `{?has_artifact}` branches; 1 intelligence grant. Fixed `factionDefId`→`factionId`. PR open; merge held pending THR-134 U4. tsc clean, build green, 10581 tests passed.

## Recent Completions (2026-04-23) — THR-10
- **THR-10 — Procedural Hex Vignettes Phase 2 (chunked filler layer):** Replaced clone-per-tree rendering in the terrain lab with chunked InstancedMesh filler via a custom unlit GLSL shader. New `vignette/` module tree: FillerProfiles (per-terrain density/scale/model-weight profiles for temperate_forest, light_forest, swamp), VignetteResolver (pure scatter resolver emitting ResolvedHexFiller[]), VignetteInstanceMaterial (ShaderMaterial with instanceMatrix + per-instance visibility/hover), ChunkedFillerLayer (groups by modelUrl, GLB cache, fresh submesh clone per build, fail-soft), VignetteDebugOverlay (density presets + chunk bounds toggle). Removed filler autoPlacements from vignettePrototype. 8 new tests. tsc clean, build green, 10581 tests passed.

## Recent Completions (2026-04-23) — THR-246
- **THR-246 — Linear MCP rate-limit relief:** Cowork session-start collapsed from 5 per-state `list_issues` calls to one board scan with in-memory bucketing. pull-work skill adds Step 0 (rate-limit guard on 429) and rewrites Steps 1+2 to derive all slices from one scan. Codex automation prompt updated with same board-scan pattern + `:30` cadence offset. THR-234 label-split plan backfill audit updated (5 calls → 1). Weekly hygiene skill draft updated. CLAUDE.md Cowork bullet now points to coordination protocol §. Impediment #79 logged. tsc clean, build green, 671 tests passed.

## Recent Completions (2026-04-23) — THR-95
- **THR-95 — Holy Order of Dawn encounter audit+uplift:** 15 templates reviewed against quality bar and systemic wiring targets. 5 templates uplifted: `inquisition` success got intelligence grant (agent_network, cult hierarchy); `escort_pilgrims` failure got soul_diminishment hidden mark + encounter_seed → slay_abomination; `deliver_judgment` success got reputation_note hidden mark + encounter_seed → cleanse_corruption; `lead_crusade` got success (mark + rep tally) and failure (mark + rep tally + seed → holy_war) variants; `holy_war` got success (mark + rep tally +3) and failure (mark + seed → holy_war retry) variants. Merge held pending THR-134 U4.

## Archived to project-history.md
- THR-233/182/188/153/187/96/95/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 (2026-04-20/19/18) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` (one-liners) + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
