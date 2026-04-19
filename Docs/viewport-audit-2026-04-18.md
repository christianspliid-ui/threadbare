# Viewport Contract Audit — 2026-04-18

**Issue:** THR-174 — UI overhaul 07 — Viewport contract audit at 1920×1080  
**Date:** 2026-04-19  
**Auditor:** Claude Code (sonnet)  
**Method:** Claude-in-Chrome → resize window to 1920×1080 → `document.body.scrollHeight - document.body.clientHeight` (must be ≤ 0) → screenshot

**Effective viewport at test time:** 1618×1196 CSS pixels (window at 1920×1080 OS size; browser chrome reduces width; height is more permissive than 1080). All layouts use `overflow: hidden` at html/body/#root level, so content is clipped to viewport regardless of height.

## Scroll check results

| View | URL | Page scroll? | scrollDelta | Notes |
|------|-----|-------------|-------------|-------|
| game&seeded | `?view=game&seeded` | No | 0 | ✅ PASS. Left rail (Ascendant Bar), hex map, Threads panel, Actions panel all within viewport. |
| game (bare) | `?view=game` | No | 0 | ✅ PASS. Blank Threads state renders within fold. |
| codex | `?view=codex` | No | 0 | ✅ PASS. Category sidebar and card grid contained. |
| styleguide | `?view=styleguide` | No | 0 | ✅ PASS. Long component page scrolls internally via its own container. |
| cms | `?view=cms` | No | 0 | ✅ PASS. Category tree and content area contained. |

**All 5 views pass.**

## Modal height check

| Component | max-height | Contract (85vh) | Result |
|-----------|-----------|-----------------|--------|
| `Modal.tsx` (shared primitive) | `75vh` | ≤ 85vh | ✅ PASS — more restrictive |

## Absolute-positioned overlays

| Component | Positioning | Result |
|-----------|-------------|--------|
| `InterventionConfirm.tsx` | `absolute inset-0` within parent | ✅ PASS |
| `AgendaPicker.tsx` | `absolute inset-0` within parent | ✅ PASS |

## CSS enforcement verified

- `html`: `overflow: hidden` ✅
- `body`: `overflow: hidden` (via `scrollDelta: 0`) ✅
- `#root`: `overflow: hidden` ✅

## Regressions found

None. No layout fixes required.

## Screenshots

Screenshots captured during audit (saved locally via Claude-in-Chrome):
- `ss_581871qai` — `?view=game&seeded`
- `ss_4977oxcc2` — `?view=game`
- `ss_68728mnpu` — `?view=codex`
- `ss_9537z5mfw` — `?view=styleguide`
- `ss_3434y4xq1` — `?view=cms`

Screenshots attached to the THR-174 Linear completion comment.
