# Design System — Index

**Dark Tapestry** — the UI/UX design system for Threadbearer.

This folder is the single source of truth for all UI decisions. It is structured for **agent-first use**: each file covers one domain, has a clear "when to read" header, and is written as directives + tables rather than prose.

---

## When to Read Which File

| Task | Read |
|------|------|
| **Any UI work — the binding invariants** | `laws.md` (the numbered UI Laws; Done-whens cite them by reference) |
| Building any new component | `layout.md` + `tokens.md` + `interactions.md` |
| Positioning/sizing panels or sidebars | `layout.md` |
| **Choosing which component to use** | `component-selection.md` |
| **Adding a new action, field, object kind, icon, lens or ask** | `extending.md` (Law 58: one entry in one place) |
| **Placing a new UI element (zone, z-index)** | `layout-zones.md` |
| Choosing colors, borders, shadows | `tokens.md` |
| Choosing font sizes or font families | `typography.md` |
| Adding animations or transitions | `motion.md` |
| Checking what a component should look like | `?view=styleguide` (live samples) + `primitives.md` |
| Implementing hover/focus/active/disabled states | `interactions.md` |
| QA-ing the UI at a specific viewport | `layout.md` §Breakpoints + `layout-zones.md` §Responsive scaling |
| Art direction for images or hex tiles | `STYLE.md` (repo root) |
| React interaction patterns (overlays, portals, etc.) | `Docs/ui-patterns.md` |

---

## Core Constraints

- **Primary screen:** 2560×1440 landscape (Christian, 2026-10-11 — THR-1823; THR-1819)
- **Supported floor:** 1920×1080 — the tightest fit, and the contract screenshot
- **Ultrawide:** 3440 wide and more adds width only (the map and the Stage window take it), no further type step
- **Below 1920:** earlier behaviour; 1280×720 must not break, may use scroll
- **Dialogs:** every dialog caps at 85vh (`--modal-max-h`) — one rule (Law 33)
- **Layout and type tokens:** `src/index.css` `:root` + the 1920 / 2560 / 3440 blocks; breakpoints and the same numbers for JS in `src/components/shared/layoutContract.ts`
- **Theme:** Always dark. No light mode. Background never brighter than `--bg-surface`.
- **Ground truth tokens:** `src/index.css` `:root` block — these files document intent, CSS is authoritative

---

## File Map

| File | Scope |
|------|-------|
| `laws.md` | **The UI Laws** — numbered, binding invariants for every player-facing surface, with provenance and enforcement; the constitution the rest of this folder implements |
| `component-selection.md` | **Which component to use for what** — decision tree, composition patterns, anti-patterns |
| `extending.md` | **Where to add things** — every extension point with its one place, the check that catches a missing entry, and where to see the result (Law 58) |
| `layout-zones.md` | **Where new UI lives** — viewport zones, z-index stacking, insertion points, responsive scaling |
| `layout.md` | Breakpoints, layout zones, top bar, sidebar, panel rules |
| `tokens.md` | All CSS custom properties with semantic meaning and usage rules |
| `typography.md` | Type scale, font families, text hierarchy, usage per context |
| `motion.md` | Animation principles, keyframe inventory, timing rules |
| `interactions.md` | Hover, focus, active, disabled states; cursor rules; keyboard patterns |
| `primitives.md` | Shared primitive component specs (Button, Card, Modal, etc.) |
| `entity-visual-header.md` | **Entity Visual Header pattern** (THR-637) — every detail surface opens with its subject's image via the `EntityVisual` primitive + resolver |
| `artifact-representation.md` | **Artifact Representation pattern** (THR-639) — generalizes the above with an *information* obligation (art + identity + player-relevant prose) |

---

## Living Registries

- **Components:** `?view=styleguide` — every shared primitive rendered with sample data; the living contract (Law 29).
- **Hex assets:** `src/data/hex-tile-assets.ts` — the authoritative code mapping of every hex terrain tile, clear fill, and location overlay icon.

*(The rendered style tile `Design/style-tile.html` was retired 2026-08-29 (THR-1354, Christian's call) — it lived untracked outside git and was lost; these two registries were already doing its jobs.)*

---

## Change Protocol

When any design decision changes:
1. Update the relevant file in this folder
2. Update `src/index.css` if it's a token change
3. If a shared primitive changed visibly, verify its `?view=styleguide` entry still holds (Law 29)
4. Add a row to `Docs/changelog.md`
