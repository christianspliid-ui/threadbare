# Issue 2 — Typography Migration (16px Floor)

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 2 of 7 (depends on 1)
**Suggested model:** `sonnet`
**Parallel-safe with:** (none while in progress — touches many files)
**Mutex with:** Issue 3 (primitives will re-use these tokens)
**Codex review:** recommended — broad file surface, easy to miss a spot

---

## Goal

Replace every hard-coded `fontSize`, `font-family`, and ad-hoc text style across `src/components/**/*.tsx` (and `.css` if any) with the semantic `--type-*` tokens or `--text-*` size tokens. Enforce a **16px floor** — nothing renders below `--text-xs` (1rem).

This is the "everything should grow" directive made concrete. Density regression is accepted and expected.

## Authoritative sources

- Tokens defined by issue 1 in `src/index.css`.
- Spec lives in `Design/Claudedesignhandooffs/threadbearer-design-system/project/colors_and_type.css`.

## What to do

### Audit pass

1. Grep `src/components/**/*.{tsx,ts,css}` for:
   - `fontSize:` / `font-size:` — any numeric value
   - `fontFamily:` / `font-family:` — any literal string not `var(...)`
   - Tailwind text sizing classes (`text-xs`, `text-sm`, etc.) if present
2. Produce a short audit note (commit-comment or a tmp file) listing every file with offending sites — helps Codex review confirm coverage.

### Migration rules

Replace per this table:

| Found | Replace with |
|-------|-------------|
| Display headings (names, big labels) | `font: var(--type-display-md)` etc. |
| `SectionHeading`-style labels | `font: var(--type-section-label)` + `text-transform: uppercase; letter-spacing: 0.12em;` |
| Body prose (encounter text, descriptions) | `font: var(--type-body-prose)` |
| General UI body | `font: var(--type-body)` |
| Small meta text (counts, timestamps) | `font: var(--type-body-small)` (was: 11–13px) → **now ≥ 15px**, accept the growth |
| Italic flavor lines | `font: var(--type-flavor)` |
| Any `fontSize: '10px'`, `'11px'`, `'12px'`, `'13px'` | promoted to `var(--text-xs)` (1rem / 16px) — floor applied |
| Any `fontSize: '14px'` | promoted to `var(--text-sm)` (1.0625rem) at minimum |
| Any `fontFamily: 'Cinzel'` inline | `font-family: var(--font-display)` or prefer semantic `--type-*` |
| Any `fontFamily: 'Alegreya Sans'` inline | `font-family: var(--font-body)` or prefer semantic `--type-*` |

### Key components likely to have the most hits

(Rough inventory — not exhaustive. Grep first, don't trust this list.)

- `src/components/Game/ThreadsPanel.tsx` — will be rewritten in issue 6 anyway, but apply the floor here so the intermediate build is sane
- `src/components/Game/AgentDetail*.tsx` — big panel, lots of labels
- `src/components/Game/TopBar*.tsx`
- `src/components/Game/RightRail*.tsx`
- `src/components/Game/InterventionModal*.tsx`
- `src/components/shared/*.tsx`
- `src/components/Codex/*.tsx`
- `src/components/Styleguide*.tsx`

### Verify

- `?view=game&seeded` — every label legible, no text rendered at <16px.
- `?view=codex` — same.
- `?view=styleguide` — same.
- Viewport contract still holds at 1920×1080 — some panels may now need `overflow-y: auto` where they didn't before; that's acceptable as long as the page itself doesn't scroll.
- `npx tsc --noEmit`, `npx vite build`, `npm test` green.

## What NOT to do

- Don't redesign any layout. This is type-only migration.
- Don't touch the hex map terrain shaders or any WebGL code — font-size doesn't apply there.
- Don't introduce new `--type-*` tokens. If something doesn't map cleanly, ask rather than invent.
- Don't "preserve the old feel" by keeping 12px anywhere. The floor is absolute.

## Acceptance criteria

- [ ] Grep for `fontSize: ['"]?(?:8|9|10|11|12|13|14|15)px` returns zero hits in `src/components/**`.
- [ ] Grep for `font-size: ['"]?(?:8|9|10|11|12|13|14|15)px` returns zero hits in repo CSS.
- [ ] Grep for inline `fontFamily: ['"]Cinzel['"]` / `['"]Alegreya` shows only usages inside `src/index.css` or the semantic type tokens — no bare inline family strings.
- [ ] All primary views render cleanly at 1920×1080.
- [ ] Build/test/typecheck green.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None.
- **Content:** None.
- **UI:** Entire scope.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — all type now token-driven. |
| Inspectability | PASS (no change) |
| Determinism | PASS (no change) |
| Fail-soft | PASS — browser falls through font stack if a token is unset. |
| Narrative over mechanical | PASS — 16px floor is the prose-first UI directive (feedback_prose_first_ui.md). |
| Additive | N/A — this is intentional replacement. Not destructive in the bad sense — no data loss, just visual migration. |
| Performance | PASS with note — larger text means more vertical space; monitor for panels that now break the viewport contract. Issue 7 catches this. |

## Wiring

- Update `Docs/plans/wiring-checklist.md` with a note that typography tokens are in use across all of `src/components/`.
- No new modules, no new exports.
