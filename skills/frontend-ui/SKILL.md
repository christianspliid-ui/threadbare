---
name: frontend-ui
description: >
  Use when building UI components, styling, accessibility work, debug panel features,
  or any code that lives in src/ui/ or src/components/. Triggers on "component",
  "UI", "frontend", "panel", "layout", "accessibility", "style tile", "CSS",
  "responsive", "interaction", or when the task involves visual presentation.
---

# Frontend & UI — Domain Context

This skill provides frontend-specific context. Load this before building or modifying any UI component.

## Visual Style: Threadbare

The game's visual identity is called **Threadbare** — dark world, hidden magic, threads that break through.

Two coupled source-of-truth files:
- **`STYLE.md`** — authoritative for all visual style decisions: colors, sphere form language, art direction, lighting rules, prompt construction, exclusions.
- **`Design/style-tile.html`** — HTML visualization of STYLE.md. Quick visual reference for colors, swatches, gradients, UI chrome. **Also the master registry of all hex tile assets** — terrain tiles, clear fills, overlay icons, size tiers, active/reserve status.

**Critical coupling rule:** The style tile must always reflect STYLE.md. Whenever STYLE.md is modified, update the style tile in the same session. Never leave them diverged.

**Asset rule:** If an asset isn't in the style tile's "Hex Asset Legend" section, it's not in the game.

## UI Patterns

Before building any new component, read `Docs/ui-patterns.md`. It contains:
- Established interaction conventions
- Component patterns and prop shapes
- Accessibility rules
- Styling norms

**After building a new component pattern**, add it to `Docs/ui-patterns.md` in the same session. The pattern doc grows with the codebase.

## Debug Panel

The debug panel (toggle with backtick key) is the primary inspectability tool:
- Shows trace entries from the engine
- Must display all decision-relevant data
- New trace categories should be verified in the panel before feature completion
- Panel UX should support filtering and drill-down

## Frontend Principles

These are the non-functional priorities as they apply to the frontend:

- **Tunability:** UI constants (animation durations, breakpoints, color tokens) are named, not inline magic values.
- **Inspectability:** The debug panel is first-class UI, not an afterthought.
- **Fail-soft:** Missing data renders placeholder states, never crashes the render tree.
- **Performance:** Profile before optimizing. Use React best practices (memoization, virtualization for lists).
- **Accessibility:** Follow the rules in `Docs/ui-patterns.md`. Semantic HTML, ARIA where needed, keyboard navigation.

## Key Source Paths

- `src/ui/` or `src/components/` — UI components
- `STYLE.md` — visual style source of truth
- `Design/style-tile.html` — visual reference + hex asset registry
- `Docs/ui-patterns.md` — interaction conventions
