# Avatar Tick-Based Movement

**Date:** 2026-03-16
**Status:** Approved

## Problem

The avatar uses instant teleportation (`moveAvatarToHex()`) while agents use a tick-based movement system with terrain costs, speed modifiers, and path execution. This creates an inconsistency: the player bypasses the movement economy that governs every other entity in the world.

## Decision

Unify avatar movement with the agent movement system. The avatar becomes "just another agent" in the movement pipeline — same costs, same pathfinding, same tick-by-tick execution.

## Movement Flow

1. **Player clicks Move button** — move mode activates (button highlights in sphere color, as now)
2. **Player clicks a hex** — pathfinding computes shortest path using existing movement cost system (terrain tax, location tax, speed modifiers)
3. **Route appears on the map** — combined visualization (Option D):
   - Pulsing solid ring on current hex (existing)
   - Marching-dot path through intermediate hexes
   - Dashed ring + subtle translucent fill on target hex
4. **Move mode deactivates** — intent is locked in. To change destination, player must click Move again
5. **Ticks advance** — avatar moves hex-by-hex via `movementExecution`, same as agents. Pulsing ring follows avatar. Dotted path shortens as hexes are traversed
6. **Avatar arrives** — route visualization clears, movement state resets

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Movement timing | Tick-based (B), not instant | Game is paused when no ticks run; plan shown on GUI, movement happens on tick advance |
| Mid-journey redirection | Re-activate move mode (B) | Prevents accidental misclicks; adds one intentional step to redirect |
| Target hex indicator | Combined: dashed ring + dotted route (D) | Maximum clarity — shows where, how far, and the path between |
| Cost display on route | Deferred (C) | Get core movement working first, polish later |

## What Changes

- **`moveAvatarToHex()`** — stops doing instant teleport. Sets up a `MovementState` on the avatar node (destination, path queue, tick accumulator) like agents
- **Tick loop** — avatar's movement processed by `movementExecution` system. No special-casing
- **HexMap rendering** — two new visual layers: target hex indicator (dashed ring + fill) and route path (dotted polyline through hex centers)
- **AvatarHUD** — move mode turns off after selecting a destination. Button re-enables for redirection

## What Stays the Same

- Pulsing sphere-color ring on current hex
- Move button in AvatarHUD
- All movement cost constants and terrain/location taxes
- Pathfinding algorithm (already exists for agents)

## Visual Reference

See `Design/movement-indicator-mockups.html` for animated mockups of the four indicator options considered.
