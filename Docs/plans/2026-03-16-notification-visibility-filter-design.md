# Notification Visibility Filter Design

**Goal:** Filter spatially-located notifications by the player's line of sight so only events in `visible` hexes reach the notification UI.

**Architecture:** Add optional hex coordinates to `TickEvent`, then filter events before they reach the notification router. Pure function, no UI changes.

---

## Rules

1. **Global events always pass through.** Doom escalation, mandate progress, phase changes — anything without `hexCoords` is unfiltered.
2. **Spatial events require `visible` hex.** Agent actions, movement, encounters, births, deaths — only shown if the event's hex is currently `visible` in the player's `VisibilityMap`.
3. **`remembered` and `unexplored` hexes are filtered out.** The player doesn't learn about things happening in places they can't currently see.
4. **Rival actions stay global for now.** They're a meta-awareness channel. Content curation (making them rarer/more meaningful) is a separate pass.
5. **NarrativeLog is unfiltered.** The full event log stays complete for debug/history. Only the notification UI (toasts, alerts, popups) is gated.

## Data Changes

### TickEvent Extension

```typescript
export interface TickEvent {
  // ... existing fields ...
  hexCoords?: { col: number; row: number };  // stamped at creation for spatial events
}
```

Events without `hexCoords` are treated as global. This is backward-compatible — existing events that lack the field pass through the filter unchanged.

## Filter Function

```typescript
export function filterEventsByVisibility(
  events: TickEvent[],
  visibilityMap: VisibilityMap,
): TickEvent[] {
  return events.filter(event => {
    if (!event.hexCoords) return true;  // global event
    const key = `${event.hexCoords.col},${event.hexCoords.row}`;
    const hex = visibilityMap.get(key);
    return hex?.state === 'visible';
  });
}
```

## Integration Point

Called in `useNotifications` hook, between receiving `tickEvents` and calling `routeNotifications`:

```typescript
const filtered = filterEventsByVisibility(tickEvents, visibilityMap);
setState(prev => routeNotifications(filtered, prev, now));
```

## Event Generation Sites to Stamp

| File | Event Type | Hex Source |
|------|-----------|------------|
| `phaseMovement.ts` | `agent_movement` | destination location's `hexCol`/`hexRow` |
| `phaseColocationDetection.ts` | `agent_encounter` | encounter location's `hexCol`/`hexRow` |
| `orchestrator.ts` | `agent_action` / `agent_action_resolved` | actor's current location's `hexCol`/`hexRow` |
| `agentLifecycle.ts` | agent birth/death toasts | actor's location's `hexCol`/`hexRow` |

All hex coordinates are read from location node properties via the graph at event creation time.

## What Doesn't Change

- `NotificationDirective`, notification router, UI components — untouched
- `NarrativeLog` / `recentEvents` — unfiltered
- Doom, mandate, phase events — no `hexCoords`, always pass through
- Rival action events — currently global, content curation deferred

## Future Extension Points

- **Remembered hex notifications:** Could be re-enabled via cosmic echoes or court position effects
- **Rival visibility gating:** Could filter rival toasts by visibility once content is curated
- **Familiarity-based filtering:** Could use `familiarityMap` to gate agent-specific notifications
