# UI Primitive Migration Plan

> Draft 2026-03-18. Migrates remaining one-off button/card/modal/list implementations to the 7 shared primitives in `src/components/shared/`.

## Context

The UI Primitives library (7 components, 73 tests) was built 2026-03-17. A first adoption sweep replaced 17+ section headings and 1 close button, netting -143 lines. This plan covers the **remaining ~50 migration points across 18 files**.

### Primitives Available

| Primitive | API | Spec |
|-----------|-----|------|
| `SectionHeading` | `children, count?, as?` | Section labels |
| `Button` | `variant: primary/secondary/ghost/danger`, `size: sm/md/lg`, `icon?, loading?, fullWidth?` | All interactive buttons |
| `IconButton` | `icon, badge?, active?, size: sm/md, variant: default/close` | 32×32 icon-only tap targets |
| `ListRow` | `accentColor?, selected?, onClick?, trailing?` + `.Title/.Subtitle/.Leading` | Interactive list rows |
| `Card` | `variant: surface/raised/glass` + `.Header/.Body/.Footer` | Panel/card wrappers |
| `Modal` | `open, onClose, maxWidth?, animation?` + `.Header/.Body/.Footer` | Portal overlay dialogs |
| `Dropdown` | `trigger, open, onOpenChange, align?` + `.Item` | Portal-positioned menus |

Full spec: `Docs/design-system/primitives.md`

---

## Guiding Principles

1. **Pure refactor** — visual and functional parity. No behavior changes during adoption.
2. **One primitive category per phase** — keeps diffs reviewable and regressions isolated.
3. **Test every migration** — run component tests after each swap; add basic render tests where none exist.
4. **No inline styles on primitives** — if a variant is missing, extend the primitive rather than inlining.

---

## Phase 1 — Modal Migration (highest dedup value)

Four components independently implement portal + backdrop + escape + click-outside logic. The shared `Modal` handles all of this.

| Component | File | Current Pattern | Migration |
|-----------|------|----------------|-----------|
| `AgentProfileModal` | `AgentProfileModal.tsx` | Manual `createPortal`, fixed backdrop div, custom header with close button, scrollable body | `Modal` + `Modal.Header` + `Modal.Body`. Keep internal sections unchanged. |
| `EventPopup` | `EventPopup.tsx` | Manual portal + backdrop, custom header/body/footer | `Modal` + compound children. Map "dismiss" to `onClose`. |
| `InterventionConfirm` | `InterventionConfirm.tsx` | Absolute overlay (`inset-0`, `z-50`), custom backdrop | `Modal` (may need `position` prop or wrapper for in-panel overlay vs. full-screen). Review whether this should be a true portal modal or stay panel-relative. |
| `AgendaPicker` | `AgendaPicker.tsx` | Absolute overlay with `inset-0` backdrop | `Modal` with appropriate `maxWidth`. |

**Estimated impact:** ~200 lines removed (duplicate portal/backdrop/escape logic).

**Risks:**
- `AgentProfileModal` is the most complex modal in the app — migrate carefully, test scroll behavior and nested interactions.
- `InterventionConfirm` is positioned relative to its parent panel, not viewport-centered. May need to keep as absolute-positioned overlay rather than portal modal. Evaluate during implementation.

---

## Phase 2 — Button Migration (highest count)

~30 raw `<button>` elements across 10 files with inline styles and manual hover handlers.

### Priority A — Critical game UI

| Component | File | Buttons | Migration |
|-----------|------|---------|-----------|
| `InterventionConfirm` | `InterventionConfirm.tsx` | Cancel, Go to Them, Summon, Confirm (4 buttons with inline styles + hover handlers) | `Button variant="secondary"` for Cancel/Go to Them, `Button variant="primary"` for Confirm, `Button variant="ghost"` for Summon |
| `AvatarHUD` | `AvatarHUD.tsx` | Move, Ascend, End Turn (3 buttons) | `Button variant="secondary"` or `"ghost"` depending on visual weight |
| `HarvestScreen` | `HarvestScreen.tsx` | "Begin Next Cycle" (1 button) | `Button variant="primary" size="lg"` |

### Priority B — Workflow UI

| Component | File | Buttons | Migration |
|-----------|------|---------|-----------|
| `SimulationControls` | `SimulationControls.tsx` | Play/Pause, speed arrows, expanded variants (~6 buttons) | `IconButton` for arrows, `Button variant="secondary"` for Play/Pause |
| `ActionDrawer` | `ActionDrawer.tsx` | Locked actions toggle (1 button) | `Button variant="secondary" size="sm"` |
| `AgendaPicker` | `AgendaPicker.tsx` | Agenda selection buttons (~3-5) | `Button` or `Card` with `onClick` depending on card-like visual |

### Priority C — Minor UI

| Component | File | Buttons | Migration |
|-----------|------|---------|-----------|
| `HexSidebar` | `HexSidebar.tsx` | Expand/collapse toggle, location link buttons | `IconButton` for toggle, `Button variant="ghost"` for links |
| `RetinuePanel` | `RetinuePanel.tsx` | Zoom eye button | `IconButton size="sm"` |
| `GameView` | `GameView.tsx` | Debug toggle | `IconButton` |
| `AgentDetailPanel` | `AgentDetailPanel.tsx` | Location link button | `Button variant="ghost"` |

**Estimated impact:** ~150 lines removed (inline styles, manual hover state management).

---

## Phase 3 — Card Migration

Custom div-based cards with manual border/radius/shadow styling.

| Component | File | Current Pattern | Migration |
|-----------|------|----------------|-----------|
| `ActionCard` | `ActionCard.tsx` | Div with inline backgroundColor, border, borderRadius. Internal header (glyph + name), content, footer. | `Card variant="surface"` + `Card.Header` + `Card.Body`. May need custom header layout for glyph+name. |
| `LocationView` (SublocationCard) | `LocationView.tsx` | Div styled as card with border and hover | `Card variant="surface"` with `onClick` |
| `HarvestScreen` (EchoCard) | `HarvestScreen.tsx` | Div card with border styling | `Card variant="surface"` or `"raised"` |

**Estimated impact:** ~80 lines removed.

**Risks:**
- `ActionCard` has complex visual states (locked, affordable, sphere-tinted) that may require extending `Card` or keeping a wrapper. Evaluate whether `Card` should gain an `accentColor` prop or if ActionCard composes `Card` internally.

---

## Phase 4 — ListRow Migration

Custom row divs that match the ListRow pattern.

| Component | File | Current Pattern | Migration |
|-----------|------|----------------|-----------|
| `RetinuePanel` | `RetinuePanel.tsx` | Custom divs as agent rows with hover/click | `ListRow` + `.Title/.Subtitle/.Leading` + trailing `IconButton` |
| `HexPoiPanel` | `HexPoiPanel.tsx` | Custom divs for location and agent rows with hover + keyboard | `ListRow` with accent colors |
| `AttachmentRow` | `AttachmentRow.tsx` | Custom div as interactive row with tier-colored border | `ListRow` with `accentColor` set to tier color. May need custom leading for glyph. |

**Estimated impact:** ~100 lines removed.

---

## Phase 5 — EntityCard Internal Adoption

`EntityCard.tsx` is noted in the primitives spec as a future candidate to adopt `Card` internally.

| Component | File | Migration |
|-----------|------|-----------|
| `EntityCard` | `EntityCard.tsx` | Refactor internals to compose `Card` + `Card.Header` + `Card.Body`. Keep EntityCard's public API unchanged. |

**Estimated impact:** ~30 lines removed, better consistency.

---

## Out of Scope

- **Tooltip** — already shared, 30+ consumers, no changes needed.
- **ProgressBar** — already shared, working well.
- **SphereIcon** — already shared.
- **SectionHeading** — already adopted in sweep 1 (no remaining candidates found).
- **Dropdown** — already adopted by RivalsButton; no other dropdown candidates identified.

---

## Migration Order Summary

| Phase | Category | Files | Est. Lines Removed | Priority |
|-------|----------|-------|-------------------|----------|
| 1 | Modal | 4 | ~200 | Highest (most duplicated logic) |
| 2 | Button | 10 | ~150 | High (most instances) |
| 3 | Card | 3 | ~80 | Medium |
| 4 | ListRow | 3 | ~100 | Medium |
| 5 | EntityCard internal | 1 | ~30 | Low (internal refactor) |
| **Total** | | **~18 files** | **~560 lines** | |

---

## Verification Strategy

Per the Adoption Protocol in `primitives.md`:

1. **Before:** Screenshot/snapshot the component's current appearance
2. **Swap:** Replace implementation with primitive
3. **After:** Verify visual parity (preview_snapshot + preview_screenshot)
4. **Test:** Run `npm test -- --run <ComponentName>` after each file
5. **Add tests:** If no test file exists, add a basic render test
6. **Full suite:** Run `npm test` at end of each phase

Each phase is one atomic commit. If a phase reveals that a primitive needs extending (new variant, new prop), that extension is part of the same phase commit.
