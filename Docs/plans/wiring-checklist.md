# Integration Wiring Checklist

> **Living document.** Every design plan must include a wiring section that maps new modules to entries on this checklist. Every implementation must verify all listed connections before marking work complete. Maintaining this checklist is part of the Definition of Done for both design and implementation phases.
>
> **Last updated:** 2026-04-08 (faction network visibility/governance wiring)

---

## How to Use This Checklist

**During design (Cowork):** For each new engine module or UI component in your plan, list which integration surfaces it must connect to. Reference the specific checklist items below. If a surface doesn't exist yet, note that the surface itself must be created.

**During implementation (Claude Code):** Before marking a feature complete, verify every connection listed in the plan's wiring section. Use this checklist as the canonical list of integration surfaces. If you discover a new surface, add it here.

**Rule:** An engine module that is only imported by test files is not integrated. A UI component that is imported but not rendered in JSX is not integrated. Both count as incomplete work.

---

## Integration Surfaces

### 1. Orchestrator Tick Loop (`src/engine/orchestrator.ts`)

Every engine module that produces per-tick state changes must be called from a phase in the orchestrator. Current phases in order:

| Phase | Function | What it does |
|-------|----------|-------------|
| 0 | `phaseDoom` | Doom clock escalation |
| 1.5 | `phaseJourneyBeat` | Journey beat progression |
| 2a | `phaseUnifiedActionProgress` | Action execution & resolution |
| 2a.3 | `phaseEncounterProgressionV2` | Encounter step advancement |
| 2a.4 | `tickEffects` (inline orchestrator block) | Generic effect runtime bookkeeping: duration, cooldown, decay, stacking, attachment removal |
| 2a.6 | `phaseEncounterVisibility` | Encounter notifications |
| 2a.85 | `phaseSlotCaps` + `phaseDisposalTimeout` | Attachment slot cap enforcement + disposal timeout |
| 2b | `phaseAgentDecision` | Goal selection & movement initiation |
| 3 | `phaseMovement` | Pathfinding & hex traversal |
| 3.5 | `phaseColocationDetection` | Agent proximity events |
| 4 | `phaseDilemmaDetection` | Moral choice generation |
| 4.5 | `phaseFamiliarityGain` | Proximity-based familiarity |
| 5 | `phaseRivalActions` | Rival behavior |
| 5.5 | `phaseStealth` | Exposure detection |
| 6 | `phaseNarrative` | Vignette & prose generation |
| 7 | `phaseEssence` | Pool regeneration & decay |
| 7.1 | `phaseReputationDecay` | Reputation time-decay |
| 7.2 | `phaseDivineInfluenceDecay` | Divine presence fade |
| 7.5 | `phaseTradeRouteDecay` | Route dissolution |
| 8 | `phaseProsperity` | Settlement economic pulse |
| 8.1 | `phaseEconomicTraits` | Traits from economic activity |
| 8.15 | `phaseReputationTraits` | Reach-polarity reputation tally decay + trait assignment |
| 8.2 | `phaseSettlementPromotion` | Hamlet/town/city tier changes |
| 9 | `phaseHexState` | Corruption/influence decay, terrain mutations |
| 9.1 | `phaseUnrest` | Social stability |
| 9.2 | `phaseMagicalSaturation` | Magical energy decay |
| 10 | `phaseInfluenceTierPromotion` | Backstory unlocks |
| 10.1 | `phaseSublocations` | Sublocation spawn/dissolve |
| 10.5 | `phaseEconomicChronicle` | Economic state records |
| 11 | `phaseAmbitionProgress` | Ambition milestone/completion |
| 12 | `phaseAgentLifecycle` | Birth, death, migration |
| 12.1 | `phaseMandate` | Player mandate progress, checkpoint feedback, doom debt, counter-omens |
| 13 | `phaseDoomExpiry` | Doom conclusion |

| 6.6396 | `phaseQuintessence` | Quintessence event processing, regen, dissolution |

**Phase 2 resolution wiring (2026-04-02):**

| Caller | Uses shared resolver? | Difficulty normalization |
|--------|----------------------|------------------------|
| `unifiedActionResolution.ts` | ✅ `resolveActionShared()` | Already `0..1` — pass through |
| `encounter.ts` | ✅ `resolveActionShared()` | `normalizeLegacyDifficulty()` at boundary |
| `encounterScoring.ts` | ✅ `computeResolutionThreshold()` | `normalizeLegacyDifficulty()` at boundary |
| `contestation.ts` | ⚠️ Still uses `resolution.ts` directly | Legacy — port in future cleanup |

**Phase 2 quintessence telemetry wiring (2026-04-02):**

| Source | Event kind | Threat band? |
|--------|-----------|-------------|
| `phaseQuintessence` (pending events) | `quintessence_changed` / `reason: pending_event` | No |
| `phaseQuintessence` (passive regen) | `quintessence_changed` / `reason: passive_regen` | No |
| `phaseQuintessence` (threshold crossing) | `state_transition` / `threshold_X_to_Y` | No |
| `orchestrator` (encounter failure) | `quintessence_changed` / `reason: encounter_failure_by_band` | ✅ Yes |

**Component-library foundation seams (2026-04-03):**

| Primitive / shell | Runtime seam | Current callers |
|------------------|-------------|-----------------|
| `test_shaper` | `effectResolver.collectTestShapers()` → `ResolutionInput.testShapers` → `resolutionService.resolveAction()` | `encounter.ts`, `unifiedActionResolution.ts` |
| `prevent_loss` (`quintessence`) | `effectResolver.collectPreventLossEffects()` → quintessence delta adjustment before clamp/regen | `phaseQuintessence.ts` |
| `content_grant` | reward-time template grant selection and recursive instantiation | `rewardPool.ts` |
| immediate `service` reward shell | `rewardMode: 'service'` resolves authored effects on acquisition instead of persisting a shell item | `rewardPool.ts`, `orchestrator.ts`, `unifiedActionResolution.ts` |

**Verification:** `grep -c 'phase[A-Z]' src/engine/orchestrator.ts` — count should match this table.

**Ambient sound wiring (2026-04-06):**

| Module | Integration surface | Notes |
|--------|-------------------|-------|
| `BackgroundChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Not orchestrator-driven; driven by React state (camera hex, active encounter, active location) |
| `MusicChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Encounter track swap triggered by encounter notification state |
| `UiChannel` | Fire-and-forget; called at SFX trigger sites | No persistent state; no orchestrator phase |
| `AudioMaster` | `useAmbientContext` — exposes global mute/unmute | Consumed by SettingsPanel master mute toggle |
| `useAmbientContext` | Mounted in `GameView.tsx`; receives `centerHex`, `activeEncounter`, `activeLocation` | Drives all three channel instances |

---

### 2. GameView Modal & Overlay Rendering (`src/components/Game/GameView.tsx`)

Every player-facing modal or overlay must appear in the GameView JSX return block. An import without a `<Component />` element means the feature is invisible.

**Currently rendered:**

| Component | Purpose |
|-----------|---------|
| `NarrativeLog` | Event feed overlay |
| `ToastStack` | Transient notifications |
| `HexMapV2` | Main Three.js hex canvas |
| `AvatarHUD` | Move/action/scry buttons |
| `AgendaPicker` | Action selection overlay |
| `InterventionConfirm` | Intervention confirmation popover |
| `HexBreadcrumb` | Hex zoom breadcrumb |
| `HexSidebar` | Hex detail sidebar |
| `HexChronicle` | Hex event chronicle |
| `LocationView` | Location detail view |
| `FactionSheet` | Faction network, leadership, holdings, and faction-targeted action surface |
| `ActionDrawer` (×2) | Agent & non-agent intervention |
| `DoomClockDetail` | Doom chapter timeline and resolved doom-card fallout |
| `MandateDetail` | Mandate sphere-growth detail and omen checkpoints |
| `DebugPanel` | Debug trace sidebar |

**All modals connected (TB-040, 2026-03-26):**

| Component | Status |
|-----------|--------|
| `MeetingEncounterModal` | ✅ Rendered in JSX (TB-035 Phase 1) |
| `JourneyVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 2) |
| `EncounterVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 4) |

**Verification:** For each modal/overlay in your feature, confirm `<ComponentName` appears in the JSX return block of GameView (not just in the imports).

### 3. GameState Consumption (`src/types/gameState.ts` → UI components)

Engine phases write to GameState fields. UI components must read them. An engine output that no component reads is invisible to the player.

**Fields requiring UI consumers:**

| GameState field | Producing phase | Current UI consumer | Status |
|----------------|----------------|-------------------|--------|
| `recentEvents` | Multiple phases | `NarrativeLog` | ✅ Connected |
| `pendingVignettes` | `phaseJourneyBeat` | `JourneyVignetteModal` | ✅ Connected |
| `encounterNotifications` | `phaseEncounterVisibility` | `useEncounterNotifications` → `ToastStack` | ✅ Connected (TB-040) |
| `doomClock.resolvedEvents` | `phaseDoom` | `DoomClockDetail` | ✅ Connected |
| `doomClock.counterOmens` / `doomClock.nextEscalationSeverityModifier` | `phaseMandate` + `phaseDoom` | `DoomBar`, `DoomClockDetail`, `MandateTracker`, `MandateDetail` | ✅ Connected |
| `mandateState.primaryDelta` / `secondaryDelta` / `checkpointResults` / `secondaryObjectiveCurrent` | `phaseMandate` | `MandateTracker`, `MandateDetail` | ✅ Connected |
| `pendingHexMutations` | `phaseHexState` | Cleared after use (internal) | ✅ Internal |
| `prosperityShocks` | `phaseProsperity` | Cleared after use (internal) | ✅ Internal |
| `effectStates` | Orchestrator Phase 2a.4 (`tickEffects`) | No dedicated player UI; currently engine/runtime only | ⚠️ Debug visibility should improve before shell-heavy effect features land |
| `EncounterTemplate.backgroundTrack` / `.musicTrack` | Authored encounter templates | `useAmbientContext` reads active encounter's track fields to override BackgroundChannel/MusicChannel | ✅ (2026-04-06) |

**Verification:** For each new GameState field in your feature, name the component that reads it and how the data reaches the player.

### 4. Trace Emission & Debug Visibility (`src/types/trace.ts` → `src/engine/traceBuffer.ts` → DebugPanel)

Every system should emit traces for inspectability (NFP #2). A trace category that exists in the type system but is never emitted is dead code.

**Current trace categories (59):** action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary, encounter_resolution, familiarity_change, movement, intervention_effect, action_execution, modifier_resolution, prosperity_tick, wealth_delta, trade_route_volume_change, trade_route_dissolved, settlement_tier_change, target_action_filter, hex_state, unrest_tick, saturation_tick, economic_chronicle, encounter_awareness, faction_awareness, encounter_cache, encounter_filter, idle_decision, encounter_scoring, road_hex_transition, agent_reroute, return_resolution, ripple_consequence, control_effect, doom_card, mandate_checkpoint, revelation, tick_health, tick_crash, agent_revelation, interaction_depth, faction_ambition, reputation_trait, rarity_graduation, rarity_importance, encounter_promotion, curator_decision, attention_pool, story_beat_queue, slot_overflow, slot_disposal, condition_overflow, slot_expansion, meeting_sensing, meeting_testing, meeting_spark, meeting_bond, settlement_genome, settlement_reassessment, culture_generation, culture_sublocation

**All categories emitted (TB-057, 2026-03-26).** `tick_health` and `tick_crash` emitted from `orchestrator.ts` (health check failures and unhandled exceptions respectively). `control_effect` emitted from `phaseControlEffects.ts`. `revelation` emitted from `revelationResolver.ts`.

**Verification:** For each trace category your feature defines, `grep 'category: "your_category"' src/engine/` must have at least one non-test hit.

### 5. DebugPanel Tabs (`src/components/Game/DebugPanel.tsx`)

Current ViewMode values: `feed`, `agent-follow`, `tick-inspector`, `social`, `encounters`, `journey`, `webgl`

Sub-components: `DecisionBreakdown`, `RelationshipGraph`, `EncounterCacheView`, `WebGLDebugTab`

**Verification:** If your feature adds significant inspectable state (journey progress, encounter notifications, prose enrichment context), decide whether it warrants a new DebugPanel tab or extension to an existing one.

### 6. Prose Enrichment Pipeline (`src/engine/proseEnrichment.ts`)

Any system that displays narrative text to the player should call `enrichProse()` with a `NarrativeContext` before rendering. Without enrichment, prose templates display raw placeholders.

**Current callers:** `returnEngine.ts` (Return prose + ripple consequence prose, TB-040).

**Should be called by:** MeetingEncounterModal, JourneyVignetteModal, EncounterVignetteModal, any future vignette/prose display component.

**Verification:** If your feature displays prose from templates with `{placeholders}`, verify `enrichProse` is called in the rendering path.

### 7. Player Controls for Engine Features

Engine capabilities that are player-toggleable need UI controls. An engine function with no UI entry point is inaccessible.

| Engine capability | UI control | Status |
|------------------|-----------|--------|
| Fog of war toggle | URL param `?fog` | ✅ |
| Organic shore toggle | DebugPanel checkbox | ✅ |
| Bond overlay | DebugPanel checkbox | ✅ |
| Decision vector overlay | DebugPanel checkbox | ✅ |
| Attention mode toggle | `toggleAttentionMode()` in encounterVisibility.ts | ✅ RetinuePanel per-agent toggle (TB-040) |
| Faction-targeted ascendant actions | `FactionSheet` "Ascendant Actions" button → non-agent `ActionDrawer` | ✅ (2026-04-08) |
| Meet The First action | `handleStartMeeting()` in GameView | ✅ Rendered in JSX (TB-035 Phase 1) |
| Music volume | SettingsPanel Music slider | ✅ (2026-04-06) |
| Background/ambient volume | SettingsPanel Ambient slider | ✅ (2026-04-06) |
| UI SFX volume | SettingsPanel UI slider | ✅ (2026-04-06) |
| Master mute | SettingsPanel master mute toggle | ✅ (2026-04-06) |

**Verification:** For each player-facing toggle or action in your feature, name the UI element that triggers it.

---

## Checklist for Design Documents

Every design document in `Docs/plans/` must include a **Wiring** section that answers:

1. **Orchestrator:** Which existing phase(s) call this module? Or does it need a new phase? At what position in the loop?
2. **UI rendering:** Which component(s) display this feature's output? Are they already rendered in GameView, or do they need to be added?
3. **GameState flow:** What fields does this feature write to GameState? What component reads each field?
4. **Traces:** What trace categories does this feature emit? From which functions?
5. **Debug visibility:** How does a developer inspect this feature's state? Existing DebugPanel tab or new one?
6. **Prose pipeline:** Does this feature display narrative text? If yes, does it go through `enrichProse()`?
7. **Player controls:** Does the player need to trigger, toggle, or configure anything? What UI element provides that?
8. **Prerequisite health:** What upstream systems must be producing output for this feature to fire? List each dependency and how to verify it's alive (e.g., "encounters must complete → check encounterProgress has status:'completed' entries within 50 ticks"). If the upstream is known to be broken or untested at scale, flag it as a blocker.

### Throughput Gate

Features that depend on upstream pipeline throughput (not just correct wiring) must declare a **throughput expectation** in their design doc:

| What to declare | Example |
|-----------------|---------|
| **Upstream dependency** | "Requires agents to arrive at locations with encounter cache entries" |
| **Expected throughput** | "At least 1 encounter completion per 50 ticks on a seeded world" |
| **Verification method** | "Pipeline liveness integration test (`encounter-liveness.contract.test.ts`)" |

A feature that is correctly wired but receives zero upstream input is functionally dead. The throughput gate catches this before implementation is marked complete.

---

## Checklist for Implementation (Pre-Commit)

Before marking implementation complete, verify:

- [ ] Every new engine module is imported and called from the orchestrator (not just from tests)
- [ ] Every new modal/overlay component has a `<Component />` element in GameView JSX (not just an import)
- [ ] Every new GameState field has at least one UI component that reads and displays it
- [ ] Every new trace category is emitted by at least one non-test function (`grep` verification)
- [ ] Every new player-facing action has a UI trigger (button, menu item, click handler)
- [ ] Every prose display path calls `enrichProse()` if using templates with placeholders
- [ ] DebugPanel can inspect new feature state (existing tab or new tab)
