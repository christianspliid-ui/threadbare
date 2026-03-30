# Deprecation Notice: Intervention Wheel + Fixed Action Count

**Date:** 2026-03-17
**Author:** Cowork session (design pass)
**Action required:** Claude Code should apply these changes to the repo.

## What's Deprecated

### 1. The Intervention Wheel (AgentWheel)

The radial SVG context menu ("wheel") that appeared when clicking an agent on the map — with fixed slots for Scry, Deceive, Intimidate, Inspire, Persuade, Afflict/Bless, Coincidence, Omen, Dream — is **deprecated and removed from the game**.

**Superseded by:** Generalized Action Targeting (`2026-03-17-generalized-action-targeting-design.md`). Actions now appear in the ActionDrawer as context-filtered cards when the player enters any detail view. The system is open-ended, data-driven, and not limited to a fixed number of slots.

### 2. Fixed Action Count / "16 Actions Only"

Any reference to a fixed or capped number of player actions (16, or "4 layers × 4 verbs") is deprecated. The action system is designed to support **many context-dependent actions** filtered by target category, subtype, traits, sphere, essence, and range. There is no hard cap on action variety.

## CLAUDE.md — Add to Rejected Approaches

Add these two entries to the `## Rejected Approaches (do not reintroduce)` section:

```
- ❌ Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting
- ❌ Fixed action count / capped action slots — replaced by open-ended, data-driven template pool filtered per target context
```

## Docs Needing Deprecation Headers

The following design docs describe the wheel as the current system. Add a deprecation notice at the top of each:

```markdown
> **⚠️ DEPRECATED (2026-03-17):** The intervention wheel has been replaced by the Generalized Action Targeting system. See `2026-03-17-generalized-action-targeting-design.md`. This document is retained for historical reference only.
```

### Primary docs (describe the wheel as the system):

1. `Docs/plans/2026-03-06-layer2-divine-toolkit-ui.md` — The wheel implementation plan
2. `Docs/plans/2026-03-05-layer1-core-interaction.md` — AgentWheel + RetinuePanel (RetinuePanel is still valid; only the wheel portion is deprecated)
3. `Docs/plans/2026-03-05-intervention-delivery-mechanics.md` — Delivery mechanics for the wheel
4. `Docs/plans/2026-03-06-ascendant-scry-design.md` — References wheel-triggered scry (scry itself still exists but is now an action card, not a wheel slot)

### Secondary docs (mention the wheel in passing — lower priority):

5. `Docs/plans/2026-03-08-action-card-redesign-design.md`
6. `Docs/plans/2026-03-08-action-card-redesign-implementation.md`
7. `Docs/plans/2026-03-08-gameview-decomposition-design.md`
8. `Docs/plans/2026-03-08-progressive-disclosure-design.md`
9. `Docs/plans/2026-03-08-tooltip-system-design.md`
10. `Docs/ui-patterns.md` (section on wheel interaction)

### Source files to check (wheel components may still exist as dead code):

- `src/components/Game/AgentWheel.tsx` — delete if still present
- `src/engine/wheel.ts` — the `WheelSlot` interface is still used by the ActionDrawer/targeting system, but the `WHEEL_LAYOUT` and `getAgentWheelSlots()` may be dead code
- `src/components/Game/AvatarHUD.tsx` — `onWheelClick` handler reference

## Changelog Entry

```
| 2026-03-17 | Docs | Deprecated intervention wheel and fixed-action-count design | Superseded by Generalized Action Targeting; action count is now open-ended and context-dependent |
```
