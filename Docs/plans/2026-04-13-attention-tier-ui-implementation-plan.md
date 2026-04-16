# Attention Tier Model — Phase 6 UI Implementation Plan

**Date:** 2026-04-13
**Linear issue:** THR-8
**Design doc:** `Docs/plans/2026-04-05-attention-tier-model-design.md` (Sections 3, 5, 6, 7)
**Status:** Implementation Planning → Ready for Dev

## Overview

The engine foundation for the three-tier attention model is shipped. This plan covers making it visible to the player. The design doc is comprehensive — this plan maps it to implementation slices.

## Dependencies

- Attention Tier Engine Foundation: ✅ shipped
- `effectiveTier` on encounter records: ✅ shipped
- `resolveEffectiveTier()`: ✅ shipped
- Mid-encounter promotion: ✅ shipped (THR-17 adds `woundApplied` precision — can land in parallel)

## Implementation Slices (ordered)

### Slice 1: Constants & Data Layer (foundation for everything else)

**What:** Create `src/data/attention-constants.ts` with all Section 8 constants. Register in CMS `tunableConstants.ts`.

**Files:**
- NEW: `src/data/attention-constants.ts` — all constants from design doc Section 8
- EDIT: `src/components/CMS/tunableConstants.ts` — register new "Attention & Notification Tiers" group

**Deliverables:**
- All ~35 constants from design doc Section 8 as named exports
- CMS registry entry so constants are live-tweakable in `?view=cms`
- Unit test: constants file exports expected names and default values

**Success:** `?view=cms` shows the new constants group. All downstream slices import from this file.

---

### Slice 2: Digest Buffer

**What:** Silent accumulator for background encounter outcomes. The data backbone for Read the Threads and agent character sheet.

**Engine:**
- Add `DigestEntry` interface (design doc Section 5 has the full type)
- Add `digestBuffer: DigestEntry[]` to `GameState`
- Write `appendDigestEntry()` — called from encounter resolution when `effectiveTier === 'background'`
- Add `DIGEST_BUFFER_RETENTION` tick-based eviction in orchestrator (or a new `phaseDigestEviction` micro-phase)
- Flag entries as `isNotable` per notable threshold constants

**Files:**
- EDIT: `src/types/gameState.ts` — add `digestBuffer`
- NEW: `src/engine/digestBuffer.ts` — append, evict, query helpers
- EDIT: encounter resolution pipeline — call `appendDigestEntry()` on background outcomes
- EDIT: orchestrator — eviction per tick

**Deliverables:**
- Digest entries accumulate during simulation
- CLI `eval state.digestBuffer.length` shows growing buffer
- Eviction removes entries older than 48 ticks
- Notable flagging works per threshold constants

**Success:** Run `tick 30` in CLI, `eval state.digestBuffer` shows populated entries with correct fields.

---

### Slice 3: Attention Pool & Cost System

**What:** The flow-model attention pool that drains when the player attends to events and refills over time.

**Engine:**
- Add `AscendantAttentionState` to `GameState.ascendant` (pool, capacity, regen)
- Add `phaseAttentionRegen` micro-phase: pool += regen per tick, capped at capacity
- Add `spendAttention(cost: number)` and `canAffordAttention(cost: number)` helpers
- Cost calculation: `baseCost * courtPositionMultiplier` per design doc Section 3

**UI (minimal — debug only for now):**
- Add attention pool to DebugPanel health report
- CLI: `eval state.ascendant.attentionPool`

**Files:**
- EDIT: `src/types/gameState.ts` — extend ascendant state
- NEW: `src/engine/attentionPool.ts` — regen, spend, query
- EDIT: orchestrator — add `phaseAttentionRegen`

**Success:** Pool starts at capacity, regens per tick, can be spent via debug eval.

---

### Slice 4: Thread Tug System (core player interaction)

**What:** When a shaping encounter begins, the agent's thread vibrates on the hex map. Player clicks to attend (spend attention, see full notification) or ignores (auto-resolve).

**Engine:**
- Add `ThreadTug` interface: `{ agentId, encounterId, reachDomain, threatLevel, createdTick, expiresAtTick, attended }`
- Add `activeTugs: ThreadTug[]` to `GameState`
- Tug creation: when encounter reaches shaping tier via curator, create tug
- Tug expiry: `THREAD_TUG_LINGER` ticks, then auto-resolve
- Tug attendance: player clicks → spend attention → resolve to full notification
- Concurrent tug cap: `MAX_CONCURRENT_TUGS`, queue overflow
- Attend cooldown: `ATTEND_COOLDOWN` between attendances
- Curator pre-filter: if raw candidates exceed target, score by curation factors (design doc Section 3), keep top N, rest silent auto-resolve

**UI (HexMapV2):**
- Thread line vibration shader/animation for active tugs (reach-coloured pulse)
- Click handler on vibrating thread or agent dot → attend tug
- Tug fade animation over linger window
- Missed tug: final quick flicker

**UI (GameView):**
- On attend: show shaping notification panel with situation prose, stakes, intervention choices

**Files:**
- NEW: `src/engine/threadTugs.ts` — tug lifecycle, curator scoring
- NEW: `src/data/attention-constants.ts` (already from Slice 1)
- EDIT: `src/types/gameState.ts` — `activeTugs`
- EDIT: `src/components/HexMapV2/` — thread vibration visual layer
- NEW: `src/components/Game/ShapingNotification.tsx` — attend result UI

**Success:** In `?view=game&seeded`, shaping encounters produce visible thread vibrations. Clicking resolves to notification with intervention choices. Ignoring auto-resolves after linger window.

---

### Slice 5: Ambient Activity Icons (HexMap Layer)

**What:** Per-reach micro-icons near agent dots showing current encounter activity. Design doc Section 6.

**UI (HexMapV2):**
- New instanced layer: small icons (6-8px) positioned offset from agent dots
- Icon per reach domain with colour from design doc table
- Opacity scales with encounter tier (0.4 background, 0.6 shaping, 0.8 story beat)
- Gentle pulse animation (1.75s period)
- Zoom behaviour: full at close, dots at medium, hidden at far
- Clustering: up to 4 cardinal positions, 5+ collapses to count badge

**Data flow:** Per visible agent, check `state.unifiedActions` for active action → read `reachPrimary`. Fallback to `state.encounterProgress`. Neither = idle, no icon.

**Files:**
- NEW: `src/components/HexMapV2/scene/ActivityIconLayer.ts` (or similar)
- EDIT: HexMapV2 render loop — add layer
- Asset: reach icon sprites or instanced geometry per icon type

**Success:** `?view=game&seeded&nofog`, agents in encounters show small coloured activity icons. Icons pulse gently, disappear at far zoom.

---

### Slice 6: Attention Overload Visuals

**What:** Thread network aesthetic degrades as attention pool drops. Design doc Section 3 overload curve.

**UI (HexMapV2):**
- Thread rendering reads `attentionPool / attentionCapacity` ratio
- Focused (>60%): threads glow steadily, clear colours
- Busy (30-60%): slight buzz
- Strained (10-30%): threads blur, tug colours muddy
- Overwhelmed (<10%): agitation, overlapping tugs, unreliable colours

**Implementation:** Shader uniform or opacity/blur multiplier on thread line material, driven by pool ratio.

**Files:**
- EDIT: thread line rendering in HexMapV2
- Read pool ratio from game state

**Success:** Spending attention rapidly causes visible thread degradation. Recovering over quiet ticks restores clarity.

---

### Slice 7: Read the Threads Panel

**What:** Active divine ability that reads the digest buffer. Design doc Section 5.

**Engine:**
- Register "Read the Threads" as unified action template (divine, personal, self-targeting)
- On activation: query digest buffer by lookback window, apply fidelity degradation
- Essence cost scales with lookback depth
- Cooldown: `READ_THREADS_COOLDOWN`

**UI:**
- New panel/modal: grouped by reach domain, then by agent
- Notable section callout
- "Missed opportunities" for curated-out encounters
- Location thread section (vaguer)
- Dormant court section (vaguest)
- Lookback selector (half-day / full day / 2 days / 3 days) with essence cost shown

**Files:**
- NEW: `src/components/Game/ReadTheThreadsPanel.tsx`
- EDIT: unified action templates — add Read the Threads template
- EDIT: `src/engine/digestBuffer.ts` — query with fidelity tiers

**Success:** Player can invoke Read the Threads via action drawer. Panel shows grouped digest with fidelity degradation by lookback depth.

---

### Slice 8: Agent Character Sheet Enhancements

**What:** Background activity visible when inspecting agents. Design doc Section 7.

**UI:**
- **Recent Activity Log** in AgentDetailPanel: last 5-8 digest entries for this agent, compact format (tick, reach dot, one-line summary)
- **"New" indicators:** per-agent `lastViewedTick` tracking. Items/capabilities acquired since last view get badge
- **Capability growth glow:** up-arrow or glow segment on capability bars for background growth
- **Condition alerts:** wounds/diseases from background encounters get alert indicator
- **Background Record** in AgentProfileModal Chronicle tab: all digest entries grouped by reach

**Files:**
- EDIT: `src/components/Game/AgentDetailPanel.tsx` — add Recent Activity section
- EDIT: `src/components/Game/AgentProfileModal.tsx` — add Background Record to Chronicle
- NEW: `src/hooks/useLastViewedTick.ts` — per-agent view tracking (React state, not game state)

**Success:** After running 20+ ticks, clicking an agent shows recent background activity. "New" badges appear on items/capabilities gained since last view.

---

### Slice 9: Dormant & Reactivate Divine Actions

**What:** Design doc Section 4. Dormant thread state + divine actions to toggle.

**Engine:**
- Ensure `dormant` court position works in tier resolution (should already — verify)
- Add "Dormant Thread" and "Reactivate Thread" unified action templates
- `DORMANT_REACTIVATION_COOLDOWN` enforcement
- LOS removal/restoration on dormant toggle

**UI:**
- Thread visual: dormant threads render as faint grey
- Action drawer: dormant/reactivate actions available when targeting threaded agents
- Read the Threads: dormant section with vague prose

**Files:**
- EDIT: unified action templates — add dormant/reactivate templates
- EDIT: LOS calculation — respect dormant state
- EDIT: thread rendering — dormant visual treatment

**Success:** Player can dormant a thread via action drawer. Thread goes grey, LOS lost. Reactivation restores. Read the Threads shows dormant section.

---

### Slice 10: Story Beat Modal & Pacing Governor

**What:** Full-screen dramatic modal for story-beat-tier encounters. Pacing governor for sequential serialization.

**Engine:**
- Pacing governor: queue management, priority ordering, cooldown enforcement
- `STORY_BEAT_QUEUE_MAX`, overflow demotion to shaping
- "Gathering storm" state for queued beats

**UI:**
- Story beat modal: rich prose, concept art placeholder, multi-phase choices
- Simulation pauses during active story beat
- "Gathering storm" hex visual for queued beats (building glow/swirl)
- Queue demotion: 4th beat becomes rich toast with choices

**Files:**
- NEW: `src/engine/pacingGovernor.ts`
- NEW: `src/components/Game/StoryBeatModal.tsx`
- EDIT: HexMapV2 — gathering storm visual
- EDIT: simulation pause logic — respect active story beat

**Success:** Story-beat encounters pause simulation, show dramatic modal with choices. Queue shows gathering storm visuals.

---

## Recommended Execution Order

Slices 1-3 are foundation (data, digest, pool). Do these first.
Slice 4 (thread tugs) is the core interaction — highest player-facing impact.
Slices 5-6 (ambient icons, overload) are visual polish.
Slices 7-8 (Read the Threads, character sheet) are information access.
Slice 9 (dormant) is thread management.
Slice 10 (story beat modal) is the climactic feature — needs all prior slices working.

**Minimum viable sequence:** 1 → 2 → 3 → 4 → 7 → 8 (gives the player the core tug + digest + character sheet loop without visual polish)

**Full sequence:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

## NFP Compliance

Per design doc Section 10 — all PASS. Key points:
- **Tunability:** All constants in `attention-constants.ts`, CMS-registered
- **Inspectability:** `effectiveTier` stored, promotion traces, curator decisions logged, pool in debug
- **Determinism:** All pure functions, seeded PRNG for curator tiebreaking
- **Fail-soft:** Tier failure → background, curator failure → surface all, governor failure → fire immediately

## Three-Pillar Check

- **Engine:** ✅ Digest buffer, attention pool, tug lifecycle, curator, pacing governor, dormant actions
- **Content:** ✅ Read the Threads action template, dormant/reactivate templates, tug prose
- **UI:** ✅ Thread tug visuals, ambient icons, overload curve, Read the Threads panel, character sheet enhancements, story beat modal, gathering storm
