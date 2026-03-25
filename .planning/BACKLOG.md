# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Move completed items to `Docs/project-history.md` periodically.
>
> **Statuses:** 🏗️ In progress · 🔲 Ready to build · 💡 Needs design · 🧊 Ice box (parked idea)

---

## 🏗️ Hex Map V2

8-phase milestone. Tracked in `.planning/ROADMAP.md`.

**Progress:** Phase 3 of 8 in progress (Coastlines, Water & Elevation). Phases 1–2 complete.

---

## ✅ HexMapV2 Quick Wins — Consistency & Type Safety (completed 2026-03-25)

---

## 💡 HexMapV2 Medium-Term Improvements

From architectural review. Three items with real architectural payoff:
1. Extract custom hooks from HexMapV2.tsx God component (useAgentAnimations, useFogCulling, useZoomLayerVisibility)
2. Convert signifier sprites to InstancedMesh with texture atlas (~4K draw calls → ~20)
3. Single sprite per agent with material swap on zoom change (memory halving)

**Needs design:** Yes — hook extraction needs interface design; instancing needs texture atlas pipeline
**Review:** Obsidian → `Systems/HexMapV2 Architectural Review.md`

---

## 🔲 Intent Visibility — Agent Model & Character Sheet

Surface agent ambitions and priorities in the character sheet so players can empathize with what agents are pursuing. IntentSection component for AgentProfileModal/AgentDetailPanel, single-line summary in AgentInfoCard, knowledge-gated reveal structure.

**Design doc:** `Docs/plans/2026-03-17-intent-visibility.md`
**Depends on:** Nothing (ready to build)

---

## 🔲 Attachment Tier Advancement

Player actions promote item tiers (Mundane → Storied → Mythic → Legendary). Tier-transition logic in attachment lifecycle, player action template for Enchant/Empower.

**Depends on:** Attachment Action Templates (✅ complete)

---

## 🔲 Agreement Creation as Player Action

Player forges agreements between agents — diplomacy as a direct manipulation verb. Creates agreement nodes (pact, debt, favour, oath, treaty, bargain). fulfillmentCondition and ticksRemaining fields already exist.

**Depends on:** Generalized Action Targeting (✅ complete)

---

## 🔲 Cross-Boundary Contract Tests (Testing Infrastructure)

The movement/HexMapV2 area has strong unit tests but zero contract tests between systems. Changes break downstream modules silently. This item creates the foundational contract test infrastructure.

**Priority items (in order):**
1. Write `MovementTrailMesh.test.ts` — currently 0% coverage, rendering-critical
2. Create `src/engine/__tests__/contracts/` directory with initial contract tests: pathfinding→movement, decision→movement, road-network→pathfinding
3. Create `src/components/HexMapV2/__tests__/contracts/` with: movement-state→trail, movement-state→agent-sprite
4. Add movement phases to `orchestrator.test.ts` — agent advances, arrives, enters decision
5. Rewrite or delete `movement-integration.test.ts` (`describe.skip` — 10 dead tests)
6. Seed PRNG in all movement/decision test files that don't currently seed it

**Design doc:** See `testing-patterns` skill (`.claude/skills/testing-patterns/SKILL.md`) for patterns, dependency map, and anti-patterns.
**Depends on:** Nothing (ready to build)

---

## 💡 Chain Reactions / Trigger System

Lightweight trigger system: "when cursed edge added at this location, also add unrest +10." Player actions cascade through world in visible, traceable ways. Must stay deterministic and traceable per NFPs.

**Depends on:** Location State Fields, Attachment Action Templates
**Needs design:** Yes — tracing and fail-soft need careful thought

---

## 💡 Cosmological Manipulation

Player targets foundation axes (chaos↔order, light↔darkness) directly. Globally modifies action difficulty, terrain stability, agent behavior. Very expensive essence cost, dramatic narrative payoff.

**Depends on:** Generalized Action Targeting (✅), Hex Terrain State
**Needs design:** Yes

---

## 🔲 Investigate: HexChronicle location list may miss locations due to type mismatch

When clicking a hex with a visible hamlet icon, the HexChronicle places list sometimes shows no locations. Suspected cause: `hexCol`/`hexRow` stored as strings in some worldgen paths but compared with `===` against numbers in `getLocationsInHex()` (`hexZoom.ts:28-31`). The location icons render because `GameView.tsx:229` uses `!=` (loose) for the null check but the downstream hex zoom query uses strict equality.

**Investigate:** Add a runtime assertion or type coercion in `getLocationsInHex()` to confirm. Also verify the user isn't clicking an adjacent hex (small ring-positioned icons can visually overlap into neighbors).

**Files:** `src/engine/hexZoom.ts`, `src/engine/worldSeed.ts` (location node creation), `src/components/Game/GameView.tsx` (locationNodes adapter)

---

## Implementation Prerequisites (from 2026-03-18 design session)

Several of these may already be done — verify before starting.

- [ ] Step tick duration backfill — Add `duration` to all 64 encounter template steps
- [ ] Attachment reachBonus backfill — Add `reachBonus` to existing attachments
- [ ] Trait resolutionBonus backfill — Add `resolutionBonus` to existing traits
- [ ] Promotion trait names — 45 entries (5 per reach × 9 reaches) for tier signifiers

*Items completed during March 18 sessions:* axiological vocabulary alignment ✅, sphere opposition table ✅, 14 social encounter templates ✅, shortest-path graph utility ✅, deprecated reputationScore migration ✅

---

## Deferred Items

### From Hex Chronicle Redesign (2026-03-15)

- **Exploration Hook Generation** — Design a system that generates hooks from ruin locations, unexplored POIs, encounter seeds, sphere anomalies, historical artifacts
- **Soul Layer Prose Enrichment** — Cross-sphere prose templates for how spheres interact in the same hex

### From Slack (#threadbare, 2026-03-13)

- **Agent Ambition Stat** — Agents need a visible ambition stat (if paid for). Overlaps with Intent Visibility above.

### Content Backlog

- SVG resource icons to replace emoji placeholders (🪵🪨⛏️💧🐟🌾🌽🟤)
- Additional encounter templates per reach as needed

### Frontend Polish

- Responsive layout (currently viewport-locked to 1920×1080)
- Onboarding / first-minute clarity pass

### Developer Tools

- Content authoring UI (CMS at `?view=cms` exists but read-only)
- Constants tuning panel with live editing

---

## 🧊 Ice Box

Ideas that need significant design work or aren't urgent.

- OCEAN personality model for agents
- Bonds/leverage system between agents
- Resources system v2 (production chains, scarcity)
- Ascendant Creation Experience redesign
