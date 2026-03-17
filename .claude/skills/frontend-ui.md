# Skill: Frontend UI

You are building or reviewing UI for **The Fantasy World Simulator** — a dark fantasy god-game targeting 1920×1080 with ultrawide support to 3440×1440.

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

## Ground Rules

- **Target resolution is 1920×1080.** Design at this size. Anything that looks good at 1280px but breaks at 1920px is wrong.
- **All visual properties use CSS tokens.** Never hardcode hex values, pixel sizes for layout, or font sizes in components.
- **`--sidebar-width` is the sidebar width.** Never write `width: '280px'` — write `width: 'var(--sidebar-width)'`.
- **Minimum font size is `--text-xs` (16px).** No `0.65rem` or similar in any UI element.
- **Anything that needs to appear above the top bar (z-30) must use `createPortal(el, document.body)`** with `position: fixed`. Otherwise z-index stacking contexts swallow it.
- **Dark only.** No light backgrounds. Background never brighter than `--bg-surface`.

## Verification

After implementing, verify at 1920×1080:
```
preview_start('dev')
preview_resize({ width: 1920, height: 1080 })
```
Use `preview_eval` to check element positions, z-indices, and computed styles — screenshots may time out at this size.

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
| CSS tokens (source of truth) | `src/index.css` |
| Style tile (visual) | `Design/style-tile.html` |
