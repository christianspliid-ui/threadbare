import type { TickEvent } from '../types/gameState';
import type { VisibilityMap } from '../types/visibility';
import { hexKeyFromCoord } from '../lib/hexKey';

/**
 * Filter tick events by the player's line of sight.
 * Events without hexCoords (global events like doom/mandate/phase) always pass through.
 * Spatial events only pass if their hex is currently 'visible'.
 */
export function filterEventsByVisibility(
  events: TickEvent[],
  visibilityMap: VisibilityMap,
): TickEvent[] {
  return events.filter(event => {
    if (!event.hexCoords) return true;
    const key = hexKeyFromCoord(event.hexCoords);
    return visibilityMap.get(key)?.state === 'visible';
  });
}
