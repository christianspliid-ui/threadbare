# Issue 3 — Primitives Library

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 3 of 7 (depends on 1, 2)
**Suggested model:** `sonnet`
**Parallel-safe with:** Issues 4, 5 (different files, no token fights)
**Mutex with:** Issue 6 (Thread panel will consume these)
**Codex review:** recommended — new shared components that many downstream panels will adopt

---

## Goal

Ship 5 new shared primitive React components — `SectionHeading`, `Card`, `ListRow`, `ProgressBand`, `Divider` — matching the spec in `Design/Claudedesignhandooffs/threadbearer-design-system/project/ui_kits/threadbearer-game/Primitives.jsx`. Refine the existing `src/components/shared/Button.tsx` so it matches the design-system `Button.jsx` exactly.

Each primitive must render in `?view=styleguide` with sample data.

## Authoritative sources

- `Design/Claudedesignhandooffs/threadbearer-design-system/project/ui_kits/threadbearer-game/Primitives.jsx` (spec, 80 lines)
- `Design/Claudedesignhandooffs/threadbearer-design-system/project/ui_kits/threadbearer-game/Button.jsx` (spec, 40 lines)
- `src/components/shared/Button.tsx` (existing, ~134 lines — already maps closely)

## What to do

### Create `src/components/shared/SectionHeading.tsx`

- Props: `{ children: ReactNode; count?: number; ornamental?: boolean }`
- Uses `var(--type-section-label)` with `text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-tertiary);`
- If `count !== undefined`, append ` (count)` to children inline.
- If `ornamental`, wrap in a flex row with gold-gradient rules on both sides (gradient uses `var(--accent-gold-dim)`).

### Create `src/components/shared/Card.tsx`

- Props: `{ variant?: 'surface' | 'raised' | 'glass'; padding?: number; style?: CSSProperties; children: ReactNode }`
- Variants per spec (surface = bg-surface + border-subtle; raised = bg-raised + border-medium + shadow; glass = rgba + backdrop-filter).
- `border-radius: var(--panel-radius)`.

### Create `src/components/shared/ListRow.tsx`

- Props: `{ title: ReactNode; subtitle?: ReactNode; accentColor?: string; selected?: boolean; onClick?: () => void; leading?: ReactNode; trailing?: ReactNode }`
- Hover and selected states per spec.
- `accentColor` sets a 3px left border — accepts any CSS color including `var(--sphere-...)`.
- Selected state uses `var(--accent-gold-glow)` bg and `var(--accent-gold)` title color.
- Trailing slot stops click propagation (per spec — trailing controls shouldn't re-trigger row selection).

### Create `src/components/shared/ProgressBand.tsx`

- Props: `{ label: ReactNode; value: number (0-100); prose?: ReactNode; color?: string }`
- Uses `SectionHeading` for label.
- Optional italic `prose` text pushed right with `marginLeft: auto`, truncated with ellipsis.
- 6px height bar with `box-shadow: 0 0 8px ${color}66` glow.
- Width transition `0.4s ease-out`.

### Create `src/components/shared/Divider.tsx`

- Props: `{ gold?: boolean }`
- 1px height, `var(--border-subtle)` or `var(--border-accent)` when `gold`.

### Refine `src/components/shared/Button.tsx`

- Keep existing forwardRef + loading state + fullWidth. Those are production features absent from the spec.
- Add `transform: scale(0.98)` on mouse-down (active state) via React state or CSS `:active`.
- Double-check variant color values against `Button.jsx`:
  - primary: `background: var(--accent-gold)`, `color: var(--bg-abyss)`, hover `#c49038`
  - secondary: `background: var(--bg-raised)`, `color: var(--text-primary)`
  - ghost: transparent → `var(--bg-hover)` on hover
  - danger: red tints per spec
- Ensure `size` variants use the exact heights `{ sm: 28, md: 36, lg: 44 }`.

### Export from `src/components/shared/index.ts`

```ts
export { SectionHeading } from './SectionHeading';
export { Card } from './Card';
export { ListRow } from './ListRow';
export { ProgressBand } from './ProgressBand';
export { Divider } from './Divider';
export { Button } from './Button';
// existing exports preserved
```

### Add to `?view=styleguide`

Find the styleguide view (`src/components/Styleguide*.tsx`) and add a section for each new primitive rendering with sample data:

- SectionHeading (plain, with count, ornamental)
- Card (surface, raised, glass)
- ListRow (basic, selected, with accent color, with leading/trailing)
- ProgressBand (low/mid/high values, with and without prose, different colors via sphere tokens)
- Divider (subtle and gold)
- Button (all variants × all sizes, with loading state)

## What NOT to do

- Don't use `window` globals like the Design JSX does (`Object.assign(window, ...)`). That's kit-sketch style; production uses ES module exports.
- Don't copy the design JSX inline styles verbatim if any existing repo convention conflicts — but the design system styles ARE the spec, so only deviate with a comment explaining why.
- Don't add new props beyond the spec without a clear reason; note any additions in the issue's completion comment.
- Don't migrate any existing component to use these primitives in this issue. That will happen opportunistically as each panel gets its own redesign. The only mandated consumer for this project is the Thread panel (issue 6).

## Acceptance criteria

- [ ] 5 new primitive components exist in `src/components/shared/`.
- [ ] Button refined to match spec exactly (scale 0.98 on active, correct hover colors).
- [ ] All primitives exported from `src/components/shared/index.ts`.
- [ ] All primitives render at `?view=styleguide` with labeled sample data.
- [ ] `npx tsc --noEmit` clean — all props typed.
- [ ] `npx vite build` succeeds.
- [ ] `npm test` green.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None.
- **Content:** None.
- **UI:** Entire scope.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — all spacing, radius, colors via tokens. |
| Inspectability | PASS — all primitives appear in `?view=styleguide`. |
| Determinism | PASS (no change) |
| Fail-soft | PASS — missing optional props render sensibly (e.g., ListRow without `onClick` is non-interactive). |
| Narrative over mechanical | PASS — ProgressBand prose slot replaces numeric labels; SectionHeading conveys hierarchy without shouting. |
| Additive | PASS — new files, Button refinement is in-place but preserves all existing consumers. |
| Performance | PASS — pure React, no complex effects. |

## Wiring

- Update `Docs/plans/wiring-checklist.md` with new shared primitives.
- Update `?view=styleguide` rendering.
