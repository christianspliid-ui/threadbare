# Issue 4 — ActivityIcon Component

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 4 of 7 (depends on 1; parallel-safe with 5)
**Suggested model:** `haiku`
**Parallel-safe with:** Issue 5 (different file, no overlap)
**Mutex with:** Issue 6 (Thread panel consumes it)
**Codex review:** not required — isolated new file, trivial SVG

---

## Goal

Ship `src/components/shared/ActivityIcon.tsx` — a single inline-SVG component that renders one of six activity glyphs (boot, swords, coin, hammer, bandage, hourglass). Used on thread rows to signal an agent's current activity type.

## Authoritative source

`Design/Claudedesignhandooffs/new-hexmap-sidebars/project/src/ActivityIcon.jsx` (58 lines).

## What to do

### Create `src/components/shared/ActivityIcon.tsx`

Signature:

```ts
export type ActivityKind = 'boot' | 'swords' | 'coin' | 'hammer' | 'bandage' | 'hourglass';

export interface ActivityIconProps {
  kind: ActivityKind;
  size?: number;       // default 18
  color?: string;      // default 'var(--text-secondary)'
}

export function ActivityIcon({ kind, size = 18, color = 'var(--text-secondary)' }: ActivityIconProps): JSX.Element | null;
```

- 22×22 viewBox (per spec).
- `fill={color}` on paths.
- Return `null` if `kind` is unrecognized (fail-soft); in dev, log once per unknown kind.
- Export from `src/components/shared/index.ts`.

### Six glyph paths

Copy the inline SVG path data verbatim from `ActivityIcon.jsx`:

- **boot** — L-shape silhouette
- **swords** — crossed diagonals + crossguard + pommel
- **coin** — circle with `$` cutout (cutout uses `bg-deep` token — pass through as `fill="var(--bg-deep)"` on the inner `$` shape)
- **hammer** — head rect + rotated handle rect
- **bandage** — rotated rect + 3 circle cutouts
- **hourglass** — bowtie with triangle cutout

### Add to `?view=styleguide`

A row labeled "Activity icons" showing all six at 18px with default color, plus a second row at 24px with `var(--accent-gold)` to demonstrate color prop.

### Mapping helper (optional, small)

If the engine emits activity states under specific names (e.g. `'travel' | 'combat' | 'trade' | 'craft' | 'recover' | 'idle'`), add a helper:

```ts
export function activityKindFor(activity: string | null | undefined): ActivityKind | null;
```

Check `src/types/` for existing activity type unions first. If no existing vocabulary matches 1:1, defer the helper to issue 6 (Thread panel) where the consumer will decide — and note the deferral in a `// TODO(THR-XX): ...` comment.

## What NOT to do

- Don't add SVG animation, gradients, or drop-shadows. These are flat glyphs.
- Don't add accessibility labels unless the consumer passes an `aria-label` prop — that's the caller's responsibility.
- Don't emit console errors in prod for unknown kinds. Dev-only `console.warn`, once per kind, guarded by `import.meta.env.DEV` or equivalent.
- Don't invent new kinds. If a consumer needs one, they file a new issue.

## Acceptance criteria

- [ ] `ActivityIcon` exported from `src/components/shared/`.
- [ ] All 6 kinds render correctly at `?view=styleguide`.
- [ ] Unknown `kind` renders nothing and doesn't throw.
- [ ] `size` and `color` props work.
- [ ] `npx tsc --noEmit` clean.
- [ ] Build/test green.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None.
- **Content:** None.
- **UI:** Entire scope.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — size and color are props. |
| Inspectability | PASS — lives in styleguide. |
| Determinism | PASS (pure render). |
| Fail-soft | PASS — unknown kind returns null. |
| Narrative over mechanical | PASS — visual signifiers replace numeric "activity ID" badges. |
| Additive | PASS — new file. |
| Performance | PASS — inline SVG, no images, no network. |

## Wiring

- Export from `src/components/shared/index.ts`.
- Add to `?view=styleguide`.
- Consumer binding happens in issue 6.
