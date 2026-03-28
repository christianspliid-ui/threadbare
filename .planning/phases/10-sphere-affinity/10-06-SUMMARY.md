---
phase: 10-sphere-affinity
plan: 06
subsystem: ui
tags: [react, typescript, sphere-affinity, prose, IPK, tooltips, debug-panel]

# Dependency graph
requires:
  - phase: 10-sphere-affinity plan 02
    provides: phaseSphereAggregation — SphereAggregate computed each tick
  - phase: 10-sphere-affinity plan 04
    provides: sphere pressure, SphereAffinity on all entity nodes

provides:
  - ProseKeyword (IPK) component — bold/underlined/sphere-colored keyword with narrative tooltip
  - renderProseWithIPK utility — parses **SphereName** markers in prose strings
  - SPHERE_TOOLTIPS registry — narrative concept descriptions for all 8 creation spheres
  - FOUNDATION_TOOLTIPS registry — narrative descriptions for chaos/order/light/darkness
  - WORLD_SOUL_PROSE registry — 32 entries (8 spheres x 4 intensities)
  - WorldSoulIndicator component — prose status line in GameView top bar
  - SOUL_PROSE registry — per-hex dominant sphere at 4 intensity levels (8 spheres)
  - SOUL_SECONDARY_PROSE registry — secondary sphere addendum (8 spheres)
  - SOUL_THREAT_PROSE registry — opposing sphere pressure (8 spheres x 2 severity)
  - HexChronicle Soul IPK paragraph — sphere names rendered as interactive keywords
  - ActionDrawer sphere consequence preview — prose on card hover
  - DebugPanel Sphere State tab — raw numbers, colored bars, foundation balance

affects: [11-character-sheet, HexChronicle, ActionDrawer, DebugPanel, GameView]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IPK (Interactive Prose Keyword): ProseKeyword component with sphere color, tooltip, keyboard accessible"
    - "renderProseWithIPK: parses **SphereName** markers in prose strings, wraps in ProseKeyword"
    - "Prose registries keyed by SphereName x intensity/level — all sphere info player-facing is prose, never numbers"
    - "DebugPanel tab for sphere state — raw numbers only visible in dev panel"

key-files:
  created:
    - src/components/ProseKeyword.tsx
    - src/components/WorldSoulIndicator.tsx
    - src/data/sphereTooltips.ts
    - src/data/worldSoulProse.ts
    - src/data/hexSoulProse.ts
  modified:
    - src/components/Game/GameView.tsx
    - src/components/Game/HexChronicle.tsx
    - src/components/Game/ActionDrawer.tsx
    - src/components/Game/DebugPanel.tsx

key-decisions:
  - "ProseKeyword uses position:relative + position:absolute tooltip (not a portal) — simpler, no z-index issues within prose context"
  - "WorldSoulIndicator intensity thresholds: whisper<2, murmur<4, pulse<6, storm>=6 (avgScore per entity)"
  - "HexChronicle reuses existing sphereInfluence (0-1 normalized) for SOUL_PROSE level mapping rather than adding new SphereAffinity prop — avoids threading new data through hook chain"
  - "ActionDrawer sphere preview: hoveredSlotId state + SPHERE_ACTION_PROSE registry per sphere — no targetHexAffinity needed (consequence is sphere-level, not context-specific)"
  - "DebugPanel Sphere State tab: raw numbers only (avgScore, total) — player-facing UI never shows numbers, only prose"

patterns-established:
  - "IPK pattern: all sphere names in player-facing prose wrapped in ProseKeyword for hover tooltip"
  - "**SphereName** double-asterisk marker convention in prose string constants for IPK rendering"
  - "Prose data registries pattern: keyed Record<SphereName, Record<Level, string>>"

requirements-completed: [SPHR-17, SPHR-18, SPHR-19, SPHR-20, SPHR-21, SPHR-22]

# Metrics
duration: 7min
completed: 2026-03-28
---

# Phase 10 Plan 06: Sphere Affinity UI Summary

**ProseKeyword IPK component with sphere-colored tooltips, WorldSoulIndicator in GameView top bar, HexChronicle Soul IPK paragraph, ActionDrawer sphere consequence preview, and DebugPanel Sphere State tab with raw numbers and colored bars**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-28T19:13:18Z
- **Completed:** 2026-03-28T19:20:26Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- ProseKeyword (IPK) renders sphere names as bold/underlined/sphere-colored text with narrative-only tooltips; keyboard accessible (role=term, tabIndex=0, Escape dismiss)
- renderProseWithIPK utility parses `**SphereName**` markers in prose strings and wraps recognized sphere names in ProseKeyword, leaving others as plain bold text
- WorldSoulIndicator reads `state.worldSoul.aggregate`, computes intensity from avgScore/entityCount, renders an italicised prose line in the GameView top bar
- HexChronicle Soul section now renders an IPK paragraph (via SOUL_PROSE + SOUL_SECONDARY_PROSE) with clickable sphere keywords
- ActionDrawer shows sphere consequence prose below the card hand when a card is hovered; all 8 spheres covered
- DebugPanel gains a "Sphere State" tab showing total/avg per sphere with sphere-colored bars and foundation balance — raw numbers only, for developers

## Task Commits

1. **Task 1: ProseKeyword + sphereTooltips + worldSoulProse + WorldSoulIndicator + GameView wiring** - `408c71e` (feat)
2. **Task 2: HexChronicle Soul layer + ActionDrawer sphere preview + DebugPanel Sphere State tab** - `f217af8` (feat)

## Files Created/Modified

- `src/components/ProseKeyword.tsx` — IPK component + renderProseWithIPK utility
- `src/components/WorldSoulIndicator.tsx` — prose status line reading state.worldSoul.aggregate
- `src/data/sphereTooltips.ts` — SPHERE_TOOLTIPS (8 creation spheres) + FOUNDATION_TOOLTIPS
- `src/data/worldSoulProse.ts` — WORLD_SOUL_PROSE: 32 entries (8 spheres x 4 intensities)
- `src/data/hexSoulProse.ts` — SOUL_PROSE + SOUL_SECONDARY_PROSE + SOUL_THREAT_PROSE
- `src/components/Game/GameView.tsx` — imports + renders WorldSoulIndicator in top bar
- `src/components/Game/HexChronicle.tsx` — imports SOUL_PROSE + renderProseWithIPK; adds IPK soul paragraph
- `src/components/Game/ActionDrawer.tsx` — SPHERE_ACTION_PROSE + hoveredSlotId + sphere consequence prose
- `src/components/Game/DebugPanel.tsx` — SphereStateTabContent component + 'spheres' ViewMode + sphereAggregate prop

## Decisions Made

- ProseKeyword uses `position: relative` + `position: absolute` tooltip inside the span — simpler than a portal for inline prose contexts.
- WorldSoulIndicator shows `white-space: nowrap` with a `title` fallback showing the full text when clipped in the top bar.
- HexChronicle reuses the existing `sphereInfluence` (0-1 normalized) as the source for SOUL_PROSE level mapping rather than adding a new `SphereAffinity` integer-score prop, avoiding hook chain threading.
- ActionDrawer sphere consequence prose is sphere-level (not context-aware per target) — the plan's `actionSpherePreview` with `targetHexAffinity` would require threading target affinity data through many layers. A per-sphere prose registry delivers the same narrative value with zero new prop threading.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Scope simplification] ActionDrawer sphere preview uses sphere-level prose registry instead of targetHexAffinity**
- **Found during:** Task 2 (ActionDrawer)
- **Issue:** Plan's `actionSpherePreview` signature required `targetHexAffinity?: SphereAffinity` threaded through multiple components; ActionDrawer only has `WheelSlot[]` — no direct access to target hex affinity
- **Fix:** `SPHERE_ACTION_PROSE` registry keyed by sphere name; hover-tracked `hoveredSlotId` state; same narrative consequence communicated without data threading
- **Files modified:** src/components/Game/ActionDrawer.tsx
- **Verification:** `npx tsc --noEmit` and `npx vite build` pass; sphere preview renders on card hover

---

**Total deviations:** 1 (scope simplification)
**Impact on plan:** No scope reduction — player gets sphere consequence prose on hover. Implementation is simpler and more maintainable.

## Issues Encountered

None — all acceptance criteria met, TypeScript clean, build succeeds, no regressions in changed files.

## Next Phase Readiness

- Sphere affinity UI complete — IPK, WorldSoulIndicator, HexChronicle Soul layer, ActionDrawer preview, debug tab all wired
- Phase 10 Plan 07 (integration + polish) can build on this foundation
- renderProseWithIPK is available as a shared utility for any future prose rendering that needs IPK keywords

---
*Phase: 10-sphere-affinity*
*Completed: 2026-03-28*
