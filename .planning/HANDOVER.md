# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.

---

---

## 2026-03-25: Stream 1 — Intent Visibility (character sheet)

**Context:** Agents already pursue ambitions via `pursues` edges with priority/status/milestones, but none of this is visible to the player. This feature surfaces active agent intent through three UI touchpoints: full Intent section in AgentProfileModal and AgentDetailPanel, single-line summary in AgentInfoCard. Seven ambition categories map to existing domain colors. Knowledge gating is structured for future use but prototyped as always-visible.

**What Cowork already did:** Design doc exists and is implementation-ready with 12 steps, file list, type definitions, and component specs.

**Action for Claude Code:**
- [ ] Load `state-of-game-design` skill, then read design doc: `Docs/plans/2026-03-17-intent-visibility.md`
- [ ] Step 1: Add `ActiveIntent` type and `AmbitionCategory` union to types (check `src/types/agentDetail.ts` or equivalent). Extend `AgentDetail` with `intents?: ActiveIntent[]` and `AgentInfoCardData` with `primaryIntentSummary`
- [ ] Step 2: Extend `getAgentFullProfile()` and `getAgentInfoCard()` in `src/engine/agentDetail.ts` — query `pursues` edges where `status === 'active'`, resolve ambition templates, build `ActiveIntent` objects sorted primary-first. Skip knowledge gating (add `// TODO: gate by familiarity tier`)
- [ ] Step 3: Create `src/components/Game/IntentSection.tsx` — section header matching existing modal pattern, ambition cards with category color border, milestone pips, affinity dots, reactive trigger tag, empty state "No discernible intent"
- [ ] Step 4: Integrate IntentSection into `AgentProfileModal.tsx` between Nature and Prowess sections
- [ ] Step 5: Integrate IntentSection into `AgentDetailPanel.tsx` between Character and Domain Grid
- [ ] Step 6: Add primary intent single-line to `AgentInfoCard.tsx` — `{categoryGlyph} {displayName}` below archetype/faction
- [ ] Step 7: Create category glyph + color constant map (prefer unicode/SVG over emoji, match Threadbare aesthetic)
- [ ] Step 8: Unit tests — ActiveIntent construction from pursues edges, primary-before-secondary sort, empty state, reactive trigger, milestone count accuracy, render tests for IntentSection with 0/1/2 intents
- [ ] Step 9: Add `actorId` to ambition tick events in `ambitionTick.ts`, add optional `actorId?: string` to `TickEvent` interface
- [ ] Step 10: Wire notification tap-through — toasts/alerts with `actorId` become clickable, call `onSelectAgent(actorId)`
- [ ] Step 11: Intent-change pulse animation on IntentSection (amber flash ~600ms on card change, `useEffect` + `usePrevious`)
- [ ] Visual verification at `?view=game`: intent section visible in character sheet, milestone pips render, empty state works for ambition-less agents

**Design doc:** `Docs/plans/2026-03-17-intent-visibility.md`
**Files changed:** `.planning/HANDOVER.md` (this entry)

---

## 2026-03-25: Stream 2 — Attachment Tier Advancement

**Context:** The attachment system design defines a 4-tier rarity system (Mundane → Storied → Mythic → Legendary) that applies universally across all six attachment categories (possessions, conditions, blessings/curses, bestowed powers, agreements, retainers). Tier colors, on-use triggers, tag vocabulary, and acquisition flow are fully designed. Player promotes tiers via Enchant/Empower action templates. Dependencies met (Attachment Action Templates complete).

**What Cowork already did:** Full design doc exists covering the unified attachment model, tier system, possession taxonomy, on-use triggers, encounter-driven acquisition, and UI detail cards.

**Action for Claude Code:**
- [ ] Load `state-of-game-design` skill, then read design doc: `Docs/plans/2026-03-10-attachment-system-design.md` (full read — it's comprehensive)
- [ ] Verify existing graph infrastructure: confirm `artifact`, `possesses`, `bonded_to`, `has_trait` (category: `condition`), `relates_to` edge types exist in `src/types/graph.ts` and `world-model.json`
- [ ] Add `tier` property (1–4) to attachment-bearing nodes/edges if not present. Add `TIER_COLORS` and `TIER_NAMES` constants (Mundane/silver, Storied/copper, Mythic/violet, Legendary/gold-ember)
- [ ] Add `tags: string[]` to artifact node properties and agreement edge properties (traits already have it). Create `getByTag()` helper (~15-line pure function) for tag-based resolution
- [ ] Add `onUseTriggers` array to attachment properties — trigger condition, probability, effect, narrative template, tags. Integrate into resolution engine: check tag overlap, roll PRNG against probability, apply effects additively alongside encounter outcomes
- [ ] Create attachment detail card UI component with tier-colored border, subcategory icon, flavor text, mechanical summary, tags, source, duration. Render in agent profile panels
- [ ] Implement Enchant/Empower action templates for tier promotion — player spends essence to advance an attachment's tier. Prerequisites: attachment must be equipped by an agent the player has influence over
- [ ] Unit tests: tier assignment on acquisition, tier color rendering, tag-based queries, on-use trigger probability, Enchant/Empower prerequisites, detail card with each attachment category
- [ ] Visual verification at `?view=game`: tier colors visible on attachment items in character sheet, detail card renders for possessions/conditions/agreements

**Design doc:** `Docs/plans/2026-03-10-attachment-system-design.md`
**Files changed:** `.planning/HANDOVER.md` (this entry)

---

## 2026-03-25: Stream 3 — Agreement Creation + HexChronicle bug fix

**Context (Agreement Creation):** Diplomacy as a direct player verb. Agreements are enriched `relates_to` edges with fulfillment conditions and tick timers. Social encounters enter the agent decision pipeline via the same CRUD framework as location encounters. Bond strength modifies encounter scoring. All dependencies met (Generalized Action Targeting complete).

**Context (HexChronicle bug):** When clicking a hex with visible hamlet icons, the location list sometimes shows empty. Suspected: `hexCol`/`hexRow` stored as strings in some worldgen paths, compared with `===` against numbers in `getLocationsInHex()`. Icons render because `GameView.tsx` uses loose `!=` for null checks.

**What Cowork already did:** Social fabric design doc exists with full CRUD mapping, bond scoring formulas, colocation/remote constraints, and target availability rules. Bug documented in backlog.

**Action for Claude Code — HexChronicle bug (do first, quick win):**
- [ ] Investigate type mismatch: add `console.assert(typeof props.hexCol === 'number')` in `getLocationsInHex()` (`src/engine/hexZoom.ts:28-31`) and run. Check `worldSeed.ts` location creation paths for string vs number writes
- [ ] Fix: coerce to `Number()` in `getLocationsInHex()` filter, or fix at source in worldgen. Add a type guard or assertion
- [ ] Also verify: are ring-positioned location icons visually overlapping into adjacent hexes? If so, note as a separate cosmetic issue
- [ ] Unit test: `getLocationsInHex` returns locations regardless of string/number storage

**Action for Claude Code — Agreement Creation:**
- [ ] Load `state-of-game-design` skill, then read design doc: `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`
- [ ] Add social encounter templates to `ENCOUNTER_TEMPLATES` with `targetCategories: ['agent']` — Create (form bond, recruit), Find (investigate, spy), Change (persuade, negotiate, threaten), Destroy (duel, sabotage), Control (patronage, mentorship). Use reach primaries from the CRUD mapping table in the design doc
- [ ] Extend agent decision phase to generate social encounter candidates for each visible agent — pull bond data (trust, sentiment, interaction history) into candidates
- [ ] Implement `bondModifier` scoring: strong positive bonds boost cooperative encounters, strong negative bonds boost destructive, strangers get base penalty unless agent's Heart axis > `STRANGER_CURIOSITY_THRESHOLD` or Eye > `STRANGER_PERCEPTION_THRESHOLD`
- [ ] Implement agreement node creation on successful social encounter resolution — `relates_to` edge with `agreement` property block containing type (pact/debt/favour/oath/treaty/bargain), `fulfillmentCondition`, `ticksRemaining`
- [ ] Handle colocation vs remote constraints per encounter type (duel/recruit require colocation, negotiate/persuade/spy support remote with penalty)
- [ ] Add all new constants (thresholds, multipliers, modifiers) as named constants in appropriate content file
- [ ] Unit tests: social encounter template filtering, bond modifier calculation, agreement edge creation, colocation/remote gating, scoring with various bond states
- [ ] Visual verification at `?view=game`: social encounters appear in action drawer when agents are colocated, agreement creation produces visible bond in agent profile

**Design docs:** `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`, bug in `.planning/BACKLOG.md` (lines 95-101)
**Files changed:** `.planning/HANDOVER.md` (this entry)

---

## 2026-03-23: Implement start page (main menu)

**Context:** The game currently drops players straight into cosmology setup with no introduction. Designed a full start page with title, lore fragment, main menu (New World / Continue / Settings / Credits), and theme music system. Narrative-mysterious tone — text over the existing title-screen.png art with a darkening gradient. Dark ambient drone plays on first interaction, fades out on "New World". Full design doc with layout mockup, audio system spec, token usage, constants table, NFP compliance, accessibility notes, and implementation file list.

**What Cowork already did:** Wrote complete design doc at `Docs/plans/2026-03-23-start-page-design.md`.

**Action for Claude Code:**
- [ ] Create `StartPage.tsx` component per design doc layout and token spec
- [ ] Create `startPageConstants.ts` with tunable constants from the design (includes audio constants)
- [ ] Create `useThemeMusic.ts` hook — HTMLAudioElement, fade-in on first interaction, fade-out on "New World", mute toggle with localStorage persistence, graceful failure on blocked play()
- [ ] Create stub `SettingsModal.tsx` (master volume slider wired to theme music, fog toggle, version)
- [ ] Create `CreditsModal.tsx` (scrollable credits list)
- [ ] Add mute/unmute toggle icon (Lucide Volume2/VolumeX) in bottom-left corner
- [ ] Create placeholder silent MP3 at `public/audio/theme-drone.mp3` (user will replace with real file)
- [ ] Modify `App.tsx`: add `start` phase as default, "New World" transitions to `worldgen`, dev view params (`?view=game`, `?view=hexv2`, etc.) skip start page
- [ ] Write unit tests: renders title/lore/menu, "Continue" hidden without save, "New World" triggers phase change, dev views bypass start page, audio hook fade/mute/failure
- [ ] Visual verification at 1920×1080: text legible over gradient, menu items respond to hover/focus, image fallback works, mute icon visible

**Files changed:** `Docs/plans/2026-03-23-start-page-design.md` (new + updated with audio), `.planning/HANDOVER.md` (this entry)

---

---

## Completed

### 2026-03-25: Road-Aware Agent Movement (completed 2026-03-25)

All action items done:
- Road-aware Dijkstra in `pathfinding.ts` — road edges (both outgoing and incoming) compete with discount multipliers (major 0.4×, trail 0.7×), `RoadSegmentInfo` returned on `PathResult`
- `MovementState` extended with `currentHexPosition`, `roadHexQueue`, `roadHexCost`, `currentRoadType`, `roadSegments`
- Road hex traversal branch in `tickMovement` — hex-by-hex advancement, `located_at` only updates on arrival at location nodes
- `initMovementState` populates road fields from `RoadSegmentInfo`, handles hexPath direction reversal
- Gated re-evaluation in `phaseAgentDecision` — 5-guard system (tick gating, target invalidation, score comparison with 1.5× threshold, action-type guard, reroute trace)
- Animation road mode — `startRoadHopAnimation` (300ms major / 500ms trail), reduced wobble (0.3×), hop chaining without settle bounce until final hex
- `RoadHexTransitionTrace` and `AgentRerouteTrace` trace types added
- Constants: `ROAD_MAJOR_COST_MULTIPLIER`, `ROAD_TRAIL_COST_MULTIPLIER`, `MIN_ROAD_HEX_COST`, `REROUTE_SCORE_MULTIPLIER`, `ROAD_MAJOR_HOP_MS`, `ROAD_TRAIL_HOP_MS`, `ROAD_WOBBLE_FACTOR`

### 2026-03-25: Cross-Boundary Testing Infrastructure (completed 2026-03-25)

All action items done:
- Committed CLAUDE.md testing section, `testing-patterns` skill, BACKLOG.md updates
- Created `src/engine/__tests__/contracts/` directory
- Wrote `MovementTrailMesh.test.ts` (24 tests — trail creation, fade timing, segments, opacity, faction colors, fail-soft)
- Wrote `pathfinding-to-movement.contract.test.ts` (8 tests — no-roads baseline, road produces roadHexQueue, hex-by-hex ticking, mixed road+adjacent, incoming road edges, corrupt road fallback)
- Added 2 movement integration tests to `orchestrator.test.ts`
- Rewrote `movement-integration.test.ts` from `describe.skip` to 6 active tests (queue execution, history accumulation, history capping, tick events, road hex-by-hex, deterministic movement)

### 2026-03-25: HexMapV2 quick wins — consistency & type safety (completed 2026-03-25)

All action items done:
- Added `LAYER_Z` constant block in `RenderLayers.ts` (monotonic with RENDER_ORDER)
- Updated 8 mesh files to import Z positions from `LAYER_Z` instead of local constants
- Added `LAYER_NAMES` const array and `LayerName` type to `ZoomVisibilityMatrix.ts`; typed the matrix as `Record<LayerName, ...>`
- Moved `0.002` (wheel delta) and `0.85` (fit padding) into `CAMERA_CONSTANTS` in `D3ZoomCamera.ts`
- Deleted unused `WATER_TYPES` constant from `ElevationTicks.ts`
- Updated RoadMesh test (Z_OFFSET value changed 0.025→0.030 for monotonic ordering)
- `npx tsc --noEmit` clean, all tests pass (1 pre-existing unrelated failure in AgentDots)

### 2026-03-25: Fixed-slot hex layout (completed 2026-03-25)

All action items done:
- Added `BALANCED_SLOT_INDICES` lookup table and `getFixedSlotOffset()` to `movementPath.ts`
- Added `SLOT_RING_RADIUS`, `VERTEX_ANGLES_DEG`, `EDGE_MID_ANGLES_DEG` to `agent-visual-content.ts`; deprecated `LOCATION_RING_ROTATION_DEG`
- Updated `AgentSpriteMesh.ts`: `getFixedSlotOffset` with `EDGE_MID_ANGLES_DEG` (both create and update functions)
- Updated `LocationIconMesh.ts`: `getFixedSlotOffset` with `VERTEX_ANGLES_DEG`; removed rotation offset logic
- Updated `HexMapV2.tsx`: animation bezier endpoints and trail location offsets use `getFixedSlotOffset`
- 14 unit tests for `getFixedSlotOffset` (angles, balanced distribution 1-6, edge cases, determinism, no agent/location overlap)
- Visual verification pending (user must run `npm run dev` and check `?view=game`)

### 2026-03-23: Kokoro TTS narration prototype (completed 2026-03-23)

All action items done:
- Installed kokoro-js (v1.2.1) — 82M param model, Apache 2.0, client-side WASM
- Created `src/services/narration/` with 4 files: narrationConstants.ts, NarrationWorker.ts, NarrationService.ts, useNarration.ts
- NarrationWorker runs kokoro-js inference in Web Worker (off main thread)
- NarrationService wraps worker with AudioContext playback, singleton pattern
- useNarration React hook with useSyncExternalStore for zero-re-render subscriptions
- HexChronicle: narrate button in hero section with icon states (Volume2 → Loader2 spinner → Square stop)
- Auto-stops narration on hex change
- Feature flag off by default (NARRATION_ENABLED = false)
- All 5798 tests pass, build succeeds, type-check clean

### 2026-03-23: Rename game title from "Threadbare" to "Threadbearer" (completed 2026-03-23)

All action items done:
- Changed START_PAGE_TITLE, CreditsModal heading, MagicGlowTiles h1, STYLE.md heading + text rules, index.html title
- Updated localStorage keys (threadbare_muted → threadbearer_muted, threadbare_fog_default → threadbearer_fog_default) and test todo text
- Internal aesthetic references ("Threadbare aesthetic") left unchanged per design intent
- Visual verification: letter-spacing looks great at 1920×1080

### 2026-03-23: Complete stencil coastline wiring (completed 2026-03-23)

All action items done:
- Wired stencil test on land mesh material (EqualStencilFunc, ref=1)
- Rewrote CoastlineMesh: stencil write pass from land contour loops (colorWrite: false)
- Disabled shallow band overlays (they covered land area with light blue — root cause of the all-blue map)
- Updated CoastlineMesh tests for stencil behavior
- Visual verification: per-hex terrain colors visible on both `?view=hexv2` and `http://localhost:5173/`
- Remaining TODO: re-add shallow band with stencil test (only render where stencil=0)

### 2026-03-22: Documentation cleanup + Notion migration (completed 2026-03-22)

All action items done:
- Committed all Cowork documentation changes
- Verified and cleaned Notion backlog URLs from GDD outline, gamedocumenter evals
- Updated gamedocumenter eval cases (removed Notion, now reference BACKLOG.md)
- Deleted stale `state-of-game-design-SKILL.md` from repo root
- Removed stale `.skills/` and `skills/` directories (canonical skills in `.claude/skills/`)
- Removed `CLAUDE.md.proposed` and `CLAUDE.md.backup`
- Pruned stale git worktrees and removed local worktree directories

### 2026-03-22: Skill improvements for Claude Code (completed 2026-03-22)

Done:
- Merged `frontend-ui` loose file into folder-based SKILL.md (design-system loading, primitives, verification)
- Created `hexmap-renderer` skill from Hex Map V2 Phases 1-4 decisions

Deferred (when time permits):
- Write evals for `state-of-game-design` and `engine-architecture` skills
