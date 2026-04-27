# Issue 7 — Viewport Contract Audit

**Parent project:** [UI Visual Overhaul — Design System v1](./2026-04-18-ui-overhaul-project.md)
**Phase:** 7 of 7 (depends on 6)
**Suggested model:** `sonnet`
**Parallel-safe with:** (none — final gate)
**Mutex with:** (none — last in chain)
**Codex review:** optional — audit pass, test-oriented

---

## Goal

After the visual overhaul lands, verify the 1920×1080 viewport contract still holds on every primary view. The 16px floor means previously tight layouts may now overflow; this issue catches and fixes those regressions.

## The contract

From `CLAUDE.md`:

> **The game fills exactly one viewport. Nothing scrolls. Nothing renders below the fold.**
>
> - `html, body, #root` have `height: 100dvh; overflow: hidden` in `index.css`.
> - Every full-screen layout uses `h-screen flex flex-col overflow-hidden`; child panels use `flex-1 overflow-y-auto` for internal scroll.
> - Modals use `max-height: 85vh`.

## What to do

### Audit views at 1920×1080

For each view, verify:

- The page does not scroll (body never shows a scrollbar).
- No critical content rendered below the fold.
- Internal panel scroll is contained (`flex-1 overflow-y-auto`).
- Modals fit within `85vh`.

Views to audit:

- [ ] `?view=game&seeded` — primary gameplay
- [ ] `?view=game` (bare) — quickstart path
- [ ] `?view=codex` — browsable catalog
- [ ] `?view=styleguide` — component reference (all new primitives)
- [ ] `?view=cms` — content browser

### Method

For each view:

1. Open via Claude-in-Chrome MCP.
2. `browser_resize` to 1920×1080.
3. `browser_take_screenshot` full-page.
4. `browser_evaluate` `document.body.scrollHeight - document.body.clientHeight` — must be ≤ 0.
5. Document the result (screenshot + scroll measurement) in the completion comment.

For WebGL-heavy views (anything with the hex map), use `mcp__Claude_in_Chrome__computer` action `zoom` for pixel inspection where needed.

### Fix regressions

When a view fails:

- **Panel overflow because typography grew:** add `flex-1 overflow-y-auto` to the affected section, not the whole page. Internal panel scroll is expected; page scroll is not.
- **Modal overflow:** confirm modal uses the Modal primitive (or has `max-height: 85vh`). If custom, fix in place.
- **Footer or bottom bar pushed off-screen:** layout container is missing `overflow: hidden` or `h-screen`. Fix the container, not the content.
- **Row heights too tall in dense lists:** do NOT reduce typography back below 16px. Instead: (a) allow the list to scroll internally, (b) collapse a secondary row into a tooltip, or (c) accept fewer visible rows — per `"everything should grow"`. If neither (a) nor (b) is feasible and (c) regresses usability meaningfully, flag for user review rather than silently reducing type.

### Absolute-positioned overlays

Check `InterventionConfirm` and `AgendaPicker` overlays specifically — per CLAUDE.md they use `inset: 0` within their parent. Confirm they still fit after type growth.

### WebGL content (HexMapV2)

- The hex map canvas itself is out of scope; it renders what it renders.
- The chrome on top (labels, overlays, HUD) is in scope. Confirm nothing newly occludes the map viewport.

## Output

Append a short **viewport audit log** to `Docs/` (new file `Docs/viewport-audit-2026-04-18.md`):

```
| View | Page scroll? | Notes |
|------|-------------|-------|
| game&seeded | No | ThreadsPanel scrolls internally as expected. |
| codex | No | Added overflow-y-auto to category list. |
| ... |
```

Link this audit log from the Linear issue's completion comment and from `Docs/plans/wiring-checklist.md`.

## Acceptance criteria

- [ ] All 5 primary views pass the scroll check at 1920×1080.
- [ ] Modals fit within 85vh.
- [ ] `Docs/viewport-audit-2026-04-18.md` exists and documents each view.
- [ ] Any regression fixes committed with the audit.
- [ ] Build/test/typecheck green.
- [ ] Screenshots attached to Linear completion comment.
- [ ] Commit message includes `Fixes THR-XX`.

## Three-pillar

- **Engine:** None.
- **Content:** None.
- **UI:** Entire scope (audit + fixes).

## NFP

| NFP | Status |
|-----|--------|
| Tunability | N/A (audit, not logic) |
| Inspectability | PASS — audit log is the inspection artifact. |
| Determinism | N/A |
| Fail-soft | PASS — fixes prefer "scroll contained section" over "crash or hide content". |
| Narrative over mechanical | PASS — keeps prose-first type growth instead of rolling back. |
| Additive | PASS — new audit doc, localized layout fixes. |
| Performance | PASS — contained internal scroll is standard. |

## Wiring

- Viewport audit doc linked from `Docs/plans/wiring-checklist.md`.
- Any new `overflow-y-auto` added should be close to an existing flex container; don't scatter overflow handling across unrelated ancestors.
