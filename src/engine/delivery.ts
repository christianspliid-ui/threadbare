/**
 * Delivery mechanics — range checking and delivery mode queries.
 */

import type { InterventionType, DeliveryMode } from '../types/dream';
import { INTERVENTION_DEFINITIONS, DELIVERY_RANGE } from '../types/dream';

// ─── Hex Distance ─────────────────────────────────────────────────────

export interface HexPosition {
  col: number;
  row: number;
}

/**
 * Compute the distance between two hexes on an offset hex grid.
 * Uses cube coordinate conversion for accurate hex distance.
 */
export function hexDistance(a: HexPosition, b: HexPosition): number {
  // Convert offset coordinates to cube coordinates
  const ax = a.col - Math.floor(a.row / 2);
  const az = a.row;
  const ay = -ax - az;

  const bx = b.col - Math.floor(b.row / 2);
  const bz = b.row;
  const by = -bx - bz;

  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

// ─── Range Checking ───────────────────────────────────────────────────

/**
 * Check if an intervention can reach from avatar's position to target's position.
 *
 * - astral/remote: always in range (unlimited)
 * - regional: hex distance ≤ DELIVERY_RANGE[type]
 * - local: must be same hex (distance 0)
 */
export function isInRange(
  avatarPos: HexPosition,
  targetPos: HexPosition,
  interventionType: InterventionType,
): boolean {
  const def = INTERVENTION_DEFINITIONS[interventionType];

  switch (def.deliveryMode) {
    case 'astral':
    case 'remote':
      return true;
    case 'local':
      return hexDistance(avatarPos, targetPos) === 0;
    case 'regional': {
      const rangeKey = interventionType === 'inspire_intervention' ? 'inspire' : interventionType;
      const maxRange = (DELIVERY_RANGE as Record<string, number>)[rangeKey] ?? 0;
      return hexDistance(avatarPos, targetPos) <= maxRange;
    }
  }
}

// ─── Delivery Info ────────────────────────────────────────────────────

export interface DeliveryInfo {
  mode: DeliveryMode;
  /** Max hex range, or null for unlimited (astral/remote) */
  range: number | null;
}

/**
 * Get delivery mode and range for an intervention type.
 */
export function getDeliveryInfo(interventionType: InterventionType): DeliveryInfo {
  const def = INTERVENTION_DEFINITIONS[interventionType];

  switch (def.deliveryMode) {
    case 'astral':
    case 'remote':
      return { mode: def.deliveryMode, range: null };
    case 'local':
      return { mode: 'local', range: 0 };
    case 'regional': {
      const rangeKey = interventionType === 'inspire_intervention' ? 'inspire' : interventionType;
      const maxRange = (DELIVERY_RANGE as Record<string, number>)[rangeKey] ?? 0;
      return { mode: 'regional', range: maxRange };
    }
  }
}
