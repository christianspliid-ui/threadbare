# Design System — Index

**Dark Tapestry** — the UI/UX design system for The Fantasy World Simulator.

This folder is the single source of truth for all UI decisions. It is structured for **agent-first use**: each file covers one domain, has a clear "when to read" header, and is written as directives + tables rather than prose.

---

## When to Read Which File

| Task | Read |
|------|------|
| Building any new component | `layout.md` + `tokens.md` + `interactions.md` |
| Positioning/sizing panels or sidebars | `layout.md` |
| **Choosing which component to use** | `component-selection.md` |
| **Placing a new UI element (zone, z-index)** | `layout-zones.md` |
| Choosing colors, borders, shadows | `tokens.md` |
| Choosing font sizes or font families | `typography.md` |
| Adding animations or transitions | `motion.md` |
| Checking what a component should look like | `components.md` |
| Implementing hover/focus/active/disabled states | `interactions.md` |
| QA-ing the UI at a specific viewport | `layout.md` §Breakpoints + `components.md` §Scaling |
| Art direction for images or hex tiles | `STYLE.md` (repo root) |
| React interaction patterns (overlays, portals, etc.) | `Docs/ui-patterns.md` |

---

## Core Constraints

- **Primary target:** 1920×1080 — all layout decisions optimized here
- **Expand to:** 3440×1440 (ultrawide) — layout reflows, not just stretches
- **Minimum support:** 1280×720 — must not break, may use scroll
- **Theme:** Always dark. No light mode. Background never brighter than `--bg-surface`.
- **Ground truth tokens:** `src/index.css` `:root` block — these files document intent, CSS is authoritative

---

## File Map

| File | Scope |
|------|-------|
| `component-selection.md` | **Which component to use for what** — decision tree, composition patterns, anti-patterns |
| `layout-zones.md` | **Where new UI lives** — viewport zones, z-index stacking, insertion points, responsive scaling |
| `layout.md` | Breakpoints, layout zones, top bar, sidebar, panel rules |
| `tokens.md` | All CSS custom properties with semantic meaning and usage rules |
| `typography.md` | Type scale, font families, text hierarchy, usage per context |
| `motion.md` | Animation principles, keyframe inventory, timing rules |
| `components.md` | Component inventory, sizing per breakpoint, scaling notes |
| `interactions.md` | Hover, focus, active, disabled states; cursor rules; keyboard patterns |
| `primitives.md` | Shared primitive component specs (Button, Card, Modal, etc.) |

---

## Living Style Tile

`Design/style-tile.html` — open in a browser for a visual reference of colors, type, and components. When tokens change, update the style tile in the same session.

---

## Change Protocol

When any design decision changes:
1. Update the relevant file in this folder
2. Update `src/index.css` if it's a token change
3. Update `Design/style-tile.html` if it's visible in the tile
4. Add a row to `Docs/changelog.md`
