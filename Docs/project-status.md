# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**UI Design Audit** — systematic visual audit and design system consolidation.

**Recent completions:**
- ✅ River Completion (2026-03-20) — depression filling, coastal routing, lake outflow, delta forking, proximity merging. Rivers no longer dead-end on inland terrain.
- ✅ fix: encounter resolution bugs (social encounter stuck, missing cooldown) (2026-03-20)
- ✅ Location & Sublocation Concept Art (2026-03-20) — themed placeholder concept art for 17 parent location types and 11 sublocation types. Unique gradients, glyphs, and accent colors across all location views.
- ✅ Readability Audit (2026-03-20) — WCAG AA contrast fixes across 8 files: raised --text-muted, lightened ambition colors, fixed mandate purple, eliminated sub-12px fonts, raised 40+ ghost-opacity modifiers. 102/105 elements pass.
- ✅ Fog-of-War Debug Toggle (2026-03-20) — topbar button disables fog of war for development. Reveals all hexes, unlocks hex click navigation, shows all notifications.
- ✅ Unified Bezier Movement System (2026-03-20) — shared getSegmentBezier() for both AgentDots and MovementTrails. rAF-driven 800ms bezier hop animation, 150ms settle tweens, sorted-ID ring slots (no overlaps at rest), arc-length reparametrization for constant speed.
- ✅ Encounter Vignette Reach Badge (2026-03-20) — color-coded reach domain badge with icon and narrative prose in encounter vignette modal step section.
- ✅ Encounter Abandon Cooldown Fix (2026-03-20) — cooldown now measured from failure tick, not start tick. Prevents agents from re-attempting failed encounters every tick.
- ✅ Social Encounter System Integration (2026-03-18) — wired 14 social encounter templates into tick loop. Agents now pursue agent-to-agent encounters (forge alliance, spy, negotiate, duel, etc.) alongside location encounters. Bond modifier in scoring, trust decay per tick, graph-walked reputation replaces flat score.
- ✅ Encounter Vignette Modal (2026-03-18) — click-to-open narrative vignette from RetinuePanel badges, LocationView agent rows, and EncounterLog cards. Wires vignetteProse engine (scene/lens/stakes/forecast) to UI. Shared StepDots component. Fixed currentStepIndex bug.
- ✅ Retinue Encounter Notifications (2026-03-18) — toast notifications when retinue agents complete/fail encounters, showing encounter name + reward/penalty details.
- ✅ Content Browser CMS (2026-03-18) — browsable content explorer at `?view=cms`. Registry-driven: 48 datasets, ~786 items, 10 categories, 5 viewer types. Lazy-loaded (81KB separate chunk).
- ✅ Sublocation Visibility Fix (2026-03-18) — sublocations now inherit parent hexCol/hexRow so they appear in hex chronicle under their parent LocationCard.
- ✅ Encounter Progression Fix (2026-03-18) — wired phaseEncounterProgressionV2 into tick pipeline. Encounters now resolve and advance through steps instead of getting stuck on step 0.
- ✅ Agent Movement Animation (2026-03-18) — smooth glide transitions (600ms) + arrival flash for agent dots on hex map. Flattened AgentDots rendering for stable DOM keys.
- ✅ Retinue Activity Status (2026-03-18) — activity label under each agent in right sidebar: Idling, Going to \<location\>, or \<encounter\> (step/total).
- ✅ Agent Behavior Constants Centralization (2026-03-18) — 56 tunable constants from 15 engine modules consolidated into `src/data/agent-behavior-constants.ts`. NFP #1 compliance.
- ✅ UI Design Audit Phase 1 (2026-03-18) — centralized color palette, Dark Tapestry theming for worldgen + ascendant selection, RivalPanel accessibility, topbar hierarchy improvements. 17 files, 5,399 tests pass.
- ✅ Agent Behavior Systems Phases 0-6 (2026-03-18) — encounter cache, unified decision pipeline, resolution modifiers, tier promotion, social fabric, divine intervention, visibility tools.

**Up next:**
- UI Design Audit Phase 2 (spacing consolidation, typography enforcement, panel glass consistency)
- UI Design Audit Phase 3 (animation cleanup, empty states, focus management, touch hover)

**Latest implementation:** Location & Sublocation Concept Art (2026-03-20) — themed placeholder concept art for 17 location types and 11 sublocation types with unique gradients, glyphs, and accent colors.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
