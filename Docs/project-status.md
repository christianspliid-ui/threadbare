# Project Status
> Updated 2026-05-06.
## Current Focus
**THR-313 complete — Canon Phase 2b: hex-map page + 3 hex-map skills wired (Continuous Improvement).** Added `Docs/canon/hex-map.md` (144 lines, ≤200 cap) as the Step-0 hex-map entrypoint covering HexMapV2 architecture, three-tier position model, coordinate/Y-flip conventions, 13 render layers, d3-zoom ownership, stencil coastline clipping, color pipeline constraints, rejected approaches, and open questions. Wired Canon-first Step 0 pre-read into `hexmap-core`, `hexmap-layers`, and `hexmap-renderer` skill files (auto-mirrored to `.agents/` by skill-sync hook; 35 shared skills in sync). Updated `CLAUDE.md` Canon Pages table and `Docs/canon/README.md` index. Verification gates green (`npm run check:skill-sync`, `npm test` 10,709 tests, `npx tsc --noEmit`, `npx vite build`).

**THR-312 complete — Canon Phase 2b: prose page + 3 prose skills wired (Continuous Improvement).** Added `Docs/canon/prose.md` (110 lines, ≤200 cap) — single Step-0 entrypoint partitioning prose work across the three prose skills (`prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`), naming the four pipelines (graph-walking resolvers, narrative engine, vignette prose, prose enrichment), pointing to UL/wiring/cosmology/encounters canon, and asserting Threadbare voice rules and player-as-god framing as hard rules. Wired Step-0 Canon-First Pre-Read into all three prose skills; mirrored to `.agents/` via `check:skill-sync:sync` (35 shared skills in sync). Updated `CLAUDE.md` Canon Pages table and `Docs/canon/README.md` index. Verification gates green (`npm test` 10,709 tests, `npx tsc --noEmit`, `npx vite build`, `npm run check:skill-sync`).

**THR-316 complete — Canon Phase 2b: process page (Continuous Improvement).** Added `Docs/canon/process.md` (92 lines, ≤200 cap) — meta-canon pointer page for every Cowork session covering NFPs (in priority order), three-pillar rule, definition of done, design governance 8-step, coordination protocol (queue separation, claim-before-read, WIP=1, merge-gated Done, coordination block), drift-scan signals, retrospective cadence, UL-proposal flow, and plan-doc lifecycle. Linked to CLAUDE.md sections + `UL/Process` and `UL/Coordination` shards rather than duplicating definitions. Updated `CLAUDE.md` Canon Pages table and `Docs/canon/README.md` index. Verification gates green (`npm test` 10,709 tests, `npx tsc --noEmit`, `npx vite build`).

**THR-336 complete — Encounter UI Phase D3 TTS discovery + 5-line integration spec (Encounter Experience).** Added `Docs/plans/2026-05-05-tts-encounter-ui-spec.md` with verified dual-mode narration surface mapping (`useNarration`/`NarrationService`), Kokomoro voice key (`bm_george`), cancellation contract, optional encounter context metadata, and fail-soft error semantics for post-v1 H3 wiring.

**THR-322 complete — Encounter UI Phase A3 animation keyframe promotion (Encounter Experience).** Added the required shared animation primitives directly to `src/index.css`: `thread-draw`, `thread-pulse`, `mote-drift`, `pull-taut`, `hold-glow`, `card-flip-in`, and `mark-pulse`, with a source-reference comment to `Docs/plans/v7-design-pass/index.html`. Existing keyframes were left intact. Verification gates: `npm test`, `npx tsc --noEmit`, `npx vite build` all green.

**THR-321 complete — Encounter UI Phase A2 foundation scaffolding (Encounter Experience).** Added `src/data/encounter-experience-constants.ts` with the full tunables table from the design plan, added `src/types/traces/encounter-traces.ts` and trace-category registration in `src/engine/traceBuffer.ts`, and scaffolded `GameState`/init fields (`archetypeDrift`, `regionDetection`, `spotlightedAgent`) with wiring-checklist updates. Verification gates: `npm test`, `npx tsc --noEmit`, `npx vite build` all green.

**THR-320 complete — Encounter UI Phase A1 contract foundation (Encounter Experience).** Added `src/types/encounter-contract.ts` as the canonical TS schema for design-plan §4.1, shipped `src/data/encounter-contract-validators.ts` with Zod + cross-field reach↔moral-axis validation, and added `src/engine/encounter-contract-adapter.ts` for bidirectional EncounterContract↔UnifiedActionTemplate mapping with four worked-example round-trip checks. Verification gates green (`npm test`, `npx tsc --noEmit`, `npx vite build`).

**THR-311 complete — Canon Phase 2b: attachment canon page + skill wiring (Continuous Improvement).** Added `Docs/canon/attachments.md` (110 lines) as the canonical attachment-system entrypoint (categories, slot caps, primitive vocabulary, effect-walker seams, active plans, rejected approaches, open questions), then updated attachment-pipeline skill mirrors so Step 0 always reads the canon page before existing pre-reads (`Docs/authoring-brief.md` and systemic fallbacks). Verification gates green (`npm test`, `npx tsc --noEmit`, `npx vite build`).

**THR-315 complete — Canon Phase 2b: engine canon page (Continuous Improvement).** Created `Docs/canon/engine.md` (122 lines) — Step-0 navigation page for engine work covering tick entry, WorldGraph mutated-in-place, SimulationRuntime caches, resolution service (sigmoid + doubles crit), seeded PRNG, traceBuffer, three-tier position model, NFP order, load-bearing decisions, rejected approaches, open questions. Wired `engine-architecture` skill (both `.claude/` and `.agents/` mirrors) to load the canon page as Step 0 above the existing `state-of-game-design` prerequisite. Added engine row to `Docs/canon/README.md` index. Skill-sync clean; tsc, vite build, and 10,709 tests all green.

**THR-309 complete — UL proposal closeout for canon terminology (Continuous Improvement).** Added `Domain Canon Page` to `Docs/ubiquitous-language/Process.md` as the canonical Step 0 authoring entrypoint term for `Docs/canon/<domain>.md`. Rewrote `Quintessence` in `Docs/ubiquitous-language/Cosmology.md` to the user-verdicted integrity-of-self / centrality-to-story framing (explicitly not a Reach, Flesh remains deprecated). Ran `npm run mirror-ul` with explicit `OBSIDIAN_VAULT_PATH` override to mirror shard updates into Obsidian.

**THR-307 complete — Canon Phase 5a: Cosmological canon doc propagation (Obsidian vault, Continuous Improvement).** Created `Cosmology/The Cosmological Pattern.md` and `Cosmology/Reaches.md` as canonical vault destinations (repairing 14+ broken wikilinks). Updated 8 existing vault pages and bulk-fixed 30 [[Flesh]] wikilinks per migration table (healing→Gold, athletics→Iron, body-mod→Stone, survival→Star). Closes the drift loop that misled the 2026-05-04 vision audit.

**THR-301 In Design — Encounter experience long-form design plan on main.** PR #122 merged. THR-301 stays In Design awaiting user verdict on §17 (three open points). Next action: user verdict triggers child issue breakdown per phase.

**Board — Canonical documentation strategy (Continuous Improvement project).**
- **THR-303** (Medium / plan-pending-commit) — WORKFLOW.md handoff-comment schema. Plan doc pending flush.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete.
- **Continuous Improvement (Now):** THR-305/306/307/311/312/313/315/316 ✅. THR-314 (Canon Phase 2b agents sibling) Ready for Dev. THR-303 (plan pending flush) queued.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-313, THR-316, THR-312

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
