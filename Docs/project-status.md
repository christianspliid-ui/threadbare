# Project Status

> Updated 2026-04-06.

## Current Focus

**Three-Tier Attention Model — Engine Foundation Shipped.** Background/shaping/story_beat encounter classification with full pipeline: tier resolution at encounter creation, effectiveTier-driven notification routing, digest buffer for background encounters, curator scoring (7 weighted factors), pacing governor for story beats, attention pool (regen/spend/visual states), dormant court position, 5 CLI debug commands, 42 tunable constants. ~500 templates classified. Code review fixes applied (phase ordering, notification routing, pacing wiring). **Next:** Phase 6 UI (thread tug visuals, story beat modal, Read the Threads panel, ambient activity icons, agent character sheet).

Design: `Docs/plans/2026-04-05-attention-tier-model-design.md`. Plan: `Docs/plans/2026-04-05-attention-tier-implementation-plan.md`.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ corrected (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems

## Recent Completions (2026-04-06)

- **Settlement Genome Pipeline:** Five-pass composition system (infrastructure → culture → spheres → reaches → archetype recognition) gives settlements emergent identity from hex environment, cultural heritage, and economic activity. Replaces `ensureSublocations` for settlement types. Phase 6.636 reassessment on tier changes. Vitality drift model. Culture trait nodes with `has_trait` edges. Archetype displayed in HexChronicle and HexSidebar. `genome` CLI command. 4 trace categories, 8 archetypes, 17 tunable constants, 108+ new tests across 8 test files. Design: `Docs/plans/2026-04-06-settlement-genome-design.md`.

- **Ambient Sound System:** 3-channel audio (Music/Background/UI). BackgroundChannel 4-priority stack driven by terrain/location/encounter context via `useAmbientContext`. MusicChannel replaces themeAudio.ts with encounter track swap. Volume sliders + master mute in SettingsPanel. `onCameraCenterHex` prop added to HexMapV2.

- **Game Codex:** Browsable content catalog at `?view=codex`. 5 categories (Divine Actions, Mortal Actions, Possessions, Conditions, Agreements), 171 entries. Sidebar tree with subcategory filtering, responsive card grid, detail panel with prose and mechanics. Lazy-loaded, no game state dependency.

- **Attachment Slot System:** Per-slot caps (13 possession + 5 condition slots), SlotBonusEffect (type 39) slot expansion, edge-backed agreement effects on `relates_to` edges, fixed-point cascade deactivation, disposal timeout, condition overflow checks (wound/disease/curse/blessing/bestowed), grouped slot-aware AttachmentsTab UI. 6 new engine modules, 1 data file, 47 new tests. Design: `Docs/plans/2026-04-06-attachment-slot-system-design.md`.

- **Dual-Mode TTS:** Browser-side kokoro-js Web Worker backend alongside Python GPU server. Auto-fallback on deployed origins; explicit ~92MB model download opt-in. COOP/COEP headers for WASM threading. 19 new tests. Design: `Docs/plans/2026-04-06-dual-mode-tts-design.md`.

- **Three-Tier Attention Model — Engine Foundation:** 8 new engine modules, ~500 templates classified, attention pool + curator scoring + pacing governor + digest buffer + dormant handling, 93+ tests. Design: `Docs/plans/2026-04-05-attention-tier-model-design.md`.

- **Ascendant Remembrance Flow V1:** Stirring/Origin/Drive/Transformation/Reveal narrative creation, filtering funnel, dual naming, 6 components, 18 tests. Old cosmology-slider flow preserved as "Advanced World Setup".

## Previous Completions (see project-history.md)

Effect Primitive Architecture Phase 5, Coat of Arms & Icon System, TB-104 Content Primitives, Agent Success Redesign Phases 2-4, Balance-Eval Phase 1.

## Earlier (see project-history.md)

TB-104 Content Primitives, Agent Success Redesign Phases 2-4, Balance-Eval Phase 1, Coat of Arms system, Effect Primitives — all in `Docs/project-history.md`.

## Active Backlog Ideas

- **TB-105–108 Thematic Pressure & Living World Pass** (new design cluster: omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence into phases)
- TB-071 Economy Second Pass (brainstormed, needs design)
- TB-069 Location NPCs (idea)
- TB-051 Monster Encounters residual scope (roaming, threat scaling — core delivered in M2.5)
- TB-037 Onboarding (idea)
- TB-032 Agent Seeding — Pre-Existing Relationships (preliminary design exists)
- TB-017 Chain Reactions (idea)
- TB-018 Cosmological Manipulation (idea)

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: `Docs/project-history.md`
