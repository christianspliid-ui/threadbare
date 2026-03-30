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

## Load First

Before writing any component code, read:

1. `Docs/design-system/INDEX.md` — understand which files you need
2. The specific files relevant to your task (see table in INDEX.md)

For most component work you will need:
- `Docs/design-system/layout.md` — zones, breakpoints, panel widths
- `Docs/design-system/tokens.md` — all CSS custom properties
- `Docs/design-system/typography.md` — font sizes and families
- `Docs/design-system/interactions.md` — hover/focus/active/disabled states
- `Docs/design-system/components.md` — existing component inventory and scaling notes

For animation work also load:
- `Docs/design-system/motion.md`

For React interaction patterns (overlays, portals, mutual exclusion) also load:
- `Docs/ui-patterns.md`

## UI Primitives — Use These, Don't Reinvent

All shared primitives live in `src/components/shared/`. Spec: `Docs/design-system/primitives.md`.

| Primitive | When to use |
|-----------|-------------|
| `SectionHeading` | Any panel/section label |
| `Button` | All clickable actions (primary, secondary, ghost, danger variants) |
| `IconButton` | 28–32px icon-only buttons (toolbars, close, toggle) |
| `ListRow` | Any interactive list row (with `ListRow.Title`, `.Subtitle`, `.Leading`) |
| `Card` | Panel wrapper with optional `Card.Header`, `.Body`, `.Footer` |
| `Modal` | Overlay dialogs — portals to body, handles escape/backdrop/animation |
| `Dropdown` | Portal-positioned popover menus — trigger + panel with outside-click |

**Do not write one-off button, card, modal, or list implementations.** Use the primitives. If a primitive doesn't fit, extend it — don't bypass it.

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

## Key Files

| Purpose | File |
|---------|------|
| Design system index | `Docs/design-system/INDEX.md` |
| Layout + breakpoints | `Docs/design-system/layout.md` |
| Design tokens | `Docs/design-system/tokens.md` |
| Typography | `Docs/design-system/typography.md` |
| Motion/animation | `Docs/design-system/motion.md` |
| Component inventory | `Docs/design-system/components.md` |
| Interaction states | `Docs/design-system/interactions.md` |
| React patterns | `Docs/ui-patterns.md` |
| Art/image direction | `STYLE.md` |
| UI primitives spec | `Docs/design-system/primitives.md` |
| CSS tokens (source of truth) | `src/index.css` |
| Style tile (visual) | `Design/style-tile.html` |
| UI components | `src/components/` |

## Verification

After implementing, verify at 1920x1080:
```
preview_start('dev')
preview_resize({ width: 1920, height: 1080 })
```
Use `preview_eval` to check element positions, z-indices, and computed styles.
