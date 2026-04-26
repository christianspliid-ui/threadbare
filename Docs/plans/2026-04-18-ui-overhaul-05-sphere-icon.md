# Issue 5 — SphereIcon Component

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 5 of 7 (depends on 1; parallel-safe with 4)
**Suggested model:** `haiku`
**Parallel-safe with:** Issue 4 (different file)
**Mutex with:** Issue 6 (Thread panel consumes it)
**Codex review:** not required — isolated new file

---

## Goal

Ship `src/components/shared/SphereIcon.tsx` — a tinted primitive glyph bound to a sphere name (any of the 12: 8 foundation + 4 creation). Used on thread rows, action chips, and anywhere sphere ownership is surfaced.

Use the **primitive** version (cheap to render at scale), not the ink-on-vellum alternative in `Design/Claudedesignhandooffs/new-hexmap-sidebars/` (which exists as a design exploration).

## Authoritative source

The primitive-style SphereIcon exists in `Design/Claudedesignhandooffs/threadbearer-design-system/project/ui_kits/threadbearer-game/` — check filenames there. If the exact file isn't present, infer from how `Threads.jsx` calls `<SphereIcon sphere={agent.sphere} size={16}/>` and from the 12 sphere tokens in `colors_and_type.css`.

## What to do

### Create `src/components/shared/SphereIcon.tsx`

Signature:

```ts
export type SphereName =
  | 'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy'  // foundation
  | 'chaos' | 'order' | 'light' | 'darkness';                                         // creation

export interface SphereIconProps {
  sphere: SphereName | string;   // accept string for fail-soft; unknown → null
  size?: number;                 // default 16
  variant?: 'base' | 'bright';   // which token to use
}

export function SphereIcon({ sphere, size = 16, variant = 'base' }: SphereIconProps): JSX.Element | null;
```

### Visual

- A small disc (circle) filled with `var(--sphere-<sphere>)` or `var(--sphere-<sphere>-bright)`.
- Optional inner glyph — if the primitive-style file in the design system uses inner geometry (e.g. a small rune or radial motif), copy it. If not, a simple filled disc with a thin darker outline is acceptable.
- No per-sphere unique glyph shapes in v1 — color is the differentiator.
- `size × size` viewBox, inline SVG.

### Reach-to-sphere mapping helper

Add to the same file (or a sibling `spheres.ts`):

```ts
export const REACH_TO_SPHERE: Record<string, SphereName> = {
  iron:   'force',
  stone:  'matter',
  eye:    'energy',
  gold:   'life',
  veil:   'mind',
  heart:  'spirit',
  star:   'time',
  shadow: 'entropy',
};

export function sphereFromReach(reach: string | null | undefined): SphereName | null {
  if (!reach) return null;
  return REACH_TO_SPHERE[reach] ?? null;
}
```

This is the programmatic companion to the CSS `[data-reach="..."]` mapping from issue 1 — used when code needs the sphere name (e.g., to pass to `SphereIcon`).

### Add to `?view=styleguide`

A grid showing all 12 spheres at size 16 (base) and size 24 (bright).

## What NOT to do

- Don't animate on hover in v1.
- Don't add a per-sphere unique shape (runes, glyphs) — color is the signifier. If the user wants per-sphere glyphs later, that's a separate issue.
- Don't throw on unknown sphere name — return null.

## Acceptance criteria

- [ ] `SphereIcon` exported from `src/components/shared/`.
- [ ] All 12 spheres render with correct token colors at `?view=styleguide`.
- [ ] `variant="bright"` uses the `-bright` tokens.
- [ ] `sphereFromReach` helper exported.
- [ ] Unknown sphere → returns null, no crash.
- [ ] Build/test/typecheck green.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None.
- **Content:** None.
- **UI:** Entire scope.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — colors via tokens, sizes via prop. |
| Inspectability | PASS — styleguide surface. |
| Determinism | PASS (pure render). |
| Fail-soft | PASS — unknown sphere returns null; `sphereFromReach` returns null for unknown reach. |
| Narrative over mechanical | PASS — visual sphere ownership, no numeric alignment values. |
| Additive | PASS — new file + helper. |
| Performance | PASS — one SVG + one rgba fill per instance; ~50/panel is trivial. |

## Wiring

- Export from `src/components/shared/index.ts`.
- Consumer binding in issue 6.
