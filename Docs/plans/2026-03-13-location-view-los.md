# Design: Line of Sight Threading to LocationView

**Date:** 2026-03-13
**Status:** Approved
**Scope:** UI — prop threading only, no engine changes

---

## Problem

`LocationView` shows all sublocations, agents, and details regardless of the avatar's proximity to the hex. Every other LOS-aware component in the hex-zoom hierarchy (`HexZoomView`, `HexFlavorPanel`, `HexPoiPanel`, `HexBreadcrumb`) already receives and respects `hexLineOfSight`. LocationView is the only missing piece.

---

## Context

Two LOS systems exist:

| System | Type | Source | States |
|--------|------|--------|--------|
| World fog-of-war | `VisibilityMap` | `visibility.ts` | `unexplored` / `remembered` / `visible` |
| Hex-zoom proximity | `LineOfSight` | `hexZoom.ts` | `'full'` / `'partial'` / `'none'` |

Navigation already prevents entering a hex unless its fog-of-war state is `'visible'`. `hexLineOfSight` is a second, finer check: how close is the avatar to that hex right now?

- `'full'` — avatar is on this hex
- `'partial'` — avatar is on an adjacent hex (distance ≤ 1)
- `'none'` — avatar is 2+ hexes away

`hexLineOfSight` is already computed in `useHexZoomData` and available in `GameView` scope. It is not currently passed to `LocationView`.

---

## Decision: Option A — Hex-level inheritance

Pass `hexLineOfSight` straight from `GameView` → `LocationView`. The location inherits the hex's LOS state. All locations within the same hex share the same modifier — consistent with how the rest of the hierarchy works.

Rejected alternatives:
- **Option B (per-location LOS):** Finer granularity but adds engine surface area. Revisit if per-location gameplay needs emerge.
- **Option C (block navigation):** Loses the "veiled but discoverable" narrative affordance the LOS system is clearly built for.

---

## Behaviour

| `lineOfSight` | LocationView renders |
|---------------|----------------------|
| `'full'` | No change — full content as today |
| `'partial'` | Full content, entire view dimmed (opacity 0.5) — matches HexZoomView partial treatment |
| `'none'` | Early-return "Veiled Location" screen: location name + flavour message, no sublocations or agents shown — mirrors HexFlavorPanel "Unknown Territory" |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Game/GameView.tsx` | Add `lineOfSight={hexLineOfSight}` to the `<LocationView>` render block (line ~462) |
| `src/components/Game/LocationView.tsx` | Add `lineOfSight: LineOfSight` prop; import `LineOfSight` from `../../engine/hexZoom`; add `isHidden` / `isDimmed` guards; add veiled-state early return; wrap main content with dim wrapper when `isDimmed` |

No changes to engine, hooks, types, or tests.

---

## Veiled State Copy

> **[Location name]**
> *"This place lies beyond your sight. Draw closer, or scry to pierce the veil."*

Styled consistent with HexFlavorPanel's Unknown Territory block.

---

## Open Questions

None. Design approved 2026-03-13.
