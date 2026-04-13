# Visual Component Reference Page

> **Issue:** THR-47 · **Project:** UI/UX Design Infrastructure
> **Created:** 2026-04-13

---

## Goal

Add a `?view=styleguide` dev URL that renders all shared primitives and high-use domain components with sample data, so agents (and humans) can see what components look like without guessing from prop signatures.

---

## Engine Pillar

N/A — no engine changes.

## Content Pillar

N/A — uses hardcoded sample data only (no game state dependency).

## UI Pillar

### Architecture

A new top-level component `StyleGuide.tsx` in `src/components/StyleGuide/`, lazy-loaded in `App.tsx` behind `?view=styleguide`. Follows the same pattern as `Codex.tsx` (`?view=codex`).

### Routing (App.tsx)

Add after the existing `viewParam === 'codex'` line:

```tsx
if (viewParam === 'styleguide') return <Suspense fallback={...}><StyleGuide /></Suspense>;
```

Update the comment at line 59 to include `styleguide`.

### Component structure

```
StyleGuide.tsx
  ├── StyleGuideNav (left sidebar — section anchors)
  └── StyleGuideContent (scrollable main area)
        ├── § Tokens — color swatches, text hierarchy, gold accent
        ├── § Buttons — Button (4 variants × 3 sizes) + IconButton
        ├── § Cards — Card (surface/raised/glass), Card.Header/Body/Footer
        ├── § EntityCard — with sample block sections
        ├── § RarityBorderBox + RarityBadge — all tiers
        ├── § ListRow — title/subtitle/leading variants
        ├── § Modal — trigger button that opens a sample modal
        ├── § Tooltip — hover targets at various positions
        ├── § Dropdown — trigger button that opens a sample menu
        ├── § ProgressBar — 0%, 25%, 50%, 75%, 100%
        ├── § StepDots — 3-step, 5-step, various active positions
        ├── § SphereIcon — all spheres
        ├── § RivalIcon — sample rival configurations
        ├── § DomainCard — sample reach tier
        ├── § SectionHeading — with/without count, with/without rules
        ├── § AnimateMount — toggle demo
        └── § GameErrorBoundary — deliberate error demo
```

### Layout

- Full viewport, dark background (`--bg-abyss`)
- Left nav: fixed 200px, section links with scroll-into-view
- Main content: scrollable, max-width 1200px centered
- Each section: `SectionHeading` + component variations in a grid/flex layout
- Each variation: labeled with props used

### Sample data

All hardcoded in `StyleGuide.tsx` — no game state dependency. Use realistic-looking placeholder text matching the Threadbare aesthetic (e.g., agent names like "Kael Thornweaver", sphere names, rarity tiers).

---

## Wiring

| Surface | What |
|---------|------|
| App.tsx | Add `viewParam === 'styleguide'` route |
| CLAUDE.md | Add `?view=styleguide` to dev URL table |
| Imports | Lazy-load `StyleGuide` component |

No orchestrator phases, no GameState fields, no traces — this is a standalone dev view.

---

## Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| Nav width | `200px` | Left sidebar navigation |
| Content max-width | `1200px` | Readable component display width |
| Section gap | `3rem` | Vertical spacing between sections |

---

## Tracing

N/A — dev view only, no trace emission.

---

## Fail-soft

| Failure | Fallback |
|---------|----------|
| Component render error | `GameErrorBoundary` wraps each section independently — one broken section doesn't kill the page |
| Missing import | Lazy-loaded — shows fallback while loading |

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — constants named |
| 2 | Inspectability | N/A — dev tool itself |
| 3 | Determinism | N/A — no PRNG |
| 4 | Fail-soft | PASS — per-section error boundaries |
| 5 | Narrative over mechanical | N/A |
| 6 | Additive | PASS — new file, no modifications to existing components |
| 7 | Performance | PASS — lazy-loaded, only renders when explicitly navigated to |
