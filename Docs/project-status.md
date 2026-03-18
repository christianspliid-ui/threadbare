# Project Status

> Updated 2026-03-18. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**UI Design Audit** — systematic visual audit and design system consolidation.

**Recent completions:**
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

**Latest implementation:** UI Design Audit Phase 1 (2026-03-18) — Centralized 6 scattered color records into uiColorPalette.ts. Restyled worldgen screen from bright amber to Dark Tapestry. Migrated ascendant selection to CSS variables. Added role/aria-label/meter to RivalPanel. Improved topbar visual hierarchy (identity chip prominence, integer essence values, right-group background).

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
