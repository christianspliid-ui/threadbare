# Issue 1 — Design Tokens Foundation

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 1 of 7 (foundation — must land alone before 2 starts)
**Suggested model:** `sonnet`
**Parallel-safe with:** (none — this is the foundation everyone else depends on)
**Mutex with:** Issues 2, 3, 4, 5 (they consume these tokens)
**Codex review:** optional — pure CSS addition, low risk

---

## Goal

Extend `src/index.css` with the design-system tokens that the rest of the project depends on, and move fonts from Google-Fonts `@import` to local `@font-face`. Nothing visual changes yet — this is pure plumbing that later issues consume.

## Authoritative source

`Design/Claudedesignhandooffs/threadbearer-design-system/project/colors_and_type.css` is the spec. Copy values verbatim. If a value conflicts with what's already in `src/index.css`, prefer the design system — but log any conflict so we can confirm.

## What to do

### Add new tokens to `src/index.css`

1. **12 sphere tokens + `-bright` variants** (8 foundation + 4 creation):
   - foundation: `--sphere-force`, `--sphere-matter`, `--sphere-energy`, `--sphere-life`, `--sphere-mind`, `--sphere-spirit`, `--sphere-time`, `--sphere-entropy`
   - creation (reserved for elder magic content): `--sphere-chaos`, `--sphere-order`, `--sphere-light`, `--sphere-darkness`
   - each has a `-bright` companion (e.g. `--sphere-force-bright`)
2. **Semantic type tokens** (composites of family + weight + size + line-height):
   - `--type-display-xl`, `--type-display-lg`, `--type-display-md`
   - `--type-section-label` (used with `text-transform: uppercase` and `letter-spacing: 0.12em`)
   - `--type-body-prose`, `--type-body`, `--type-body-small`
   - `--type-flavor`
3. **Glow + ring tokens** if missing:
   - `--accent-gold-glow` (rgba for `accent-gold-glow` bg in ListRow selected state)
4. **Reach → sphere mapping utilities** (CSS custom property aliases):
   ```css
   [data-reach="iron"]   { --reach-sphere: var(--sphere-force);   --reach-sphere-bright: var(--sphere-force-bright); }
   [data-reach="stone"]  { --reach-sphere: var(--sphere-matter);  --reach-sphere-bright: var(--sphere-matter-bright); }
   [data-reach="eye"]    { --reach-sphere: var(--sphere-energy);  --reach-sphere-bright: var(--sphere-energy-bright); }
   [data-reach="gold"]   { --reach-sphere: var(--sphere-life);    --reach-sphere-bright: var(--sphere-life-bright); }
   [data-reach="veil"]   { --reach-sphere: var(--sphere-mind);    --reach-sphere-bright: var(--sphere-mind-bright); }
   [data-reach="heart"]  { --reach-sphere: var(--sphere-spirit);  --reach-sphere-bright: var(--sphere-spirit-bright); }
   [data-reach="star"]   { --reach-sphere: var(--sphere-time);    --reach-sphere-bright: var(--sphere-time-bright); }
   [data-reach="shadow"] { --reach-sphere: var(--sphere-entropy); --reach-sphere-bright: var(--sphere-entropy-bright); }
   ```
   This is the load-bearing CSS-layer decision from the master plan: reach-keyed color without a new data field.

### Move fonts to local `@font-face`

1. Copy Cinzel and Alegreya Sans woff2 files from `Design/Claudedesignhandooffs/threadbearer-design-system/project/fonts/` (if present) into `public/fonts/` or `src/assets/fonts/` (pick whichever Vite convention the repo already uses for assets; check `src/assets/` first).
2. Add `@font-face` declarations matching `colors_and_type.css` in `src/index.css` at the top of the file.
3. Use `font-display: swap`.
4. Remove the Google Fonts `@import` line.
5. Verify no `vite build` warnings about missing font files.

### Verify nothing breaks

- Run `?view=styleguide`, `?view=game&seeded`, `?view=codex` — visual output must be identical to pre-change.
- `npx tsc --noEmit` clean.
- `npx vite build` succeeds.
- `npm test` green.

## What NOT to do

- Don't migrate any components to use the new tokens yet — that's issue 2.
- Don't remove or rename any existing tokens. Additive only.
- Don't touch `paletteTheme.ts` (terrain palette) — out of scope.
- Don't add a `--type-*` token that isn't in the design system's `colors_and_type.css`.

## Acceptance criteria

- [ ] All 12 sphere tokens + 12 `-bright` variants defined in `src/index.css`.
- [ ] All 8 semantic `--type-*` tokens defined.
- [ ] `--accent-gold-glow` defined.
- [ ] 8 `[data-reach="..."]` mapping rules defined.
- [ ] Cinzel + Alegreya Sans loaded via local `@font-face`; Google Fonts `@import` removed.
- [ ] No visual regressions at `?view=game&seeded`, `?view=codex`, `?view=styleguide`.
- [ ] Build/test/typecheck green.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None. (Tokens are CSS.)
- **Content:** None.
- **UI:** Entire scope.

## NFP

| NFP | Status |
|-----|--------|
| Tunability | PASS — adds named constants for every color and text style. |
| Inspectability | PASS (no change) |
| Determinism | PASS (no change) |
| Fail-soft | PASS — unknown `[data-reach]` value simply doesn't match the selector; `--reach-sphere` stays unset and CSS falls through to whatever default the consumer specifies. |
| Narrative over mechanical | PASS — enables prose-first type scale. |
| Additive | PASS — nothing removed, only added (Google Fonts `@import` removal is replacement, not deletion of capability). |
| Performance | PASS — local fonts with `font-display: swap` are faster than Google Fonts CDN. |

## Wiring

- `src/index.css` only. No JS/TS changes.
- Add a short comment block above the new tokens naming this plan doc so future grep finds the origin.
