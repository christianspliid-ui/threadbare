/**
 * Generalized action targeting — filter UnifiedActionTemplates for any target node.
 *
 * getTargetActionSlots() is the core function. It accepts a TargetContext describing
 * any focused graph node and returns WheelSlot[] for the ActionDrawer.
 *
 * Filtering cascade (in order):
 *   1. Node-type gate  — template.targetCategories includes target.nodeType
 *   2. Subtype gate    — template.targetSubtypes includes target.subtype (if specified)
 *   3. Trait gate      — all template.requiredTargetTraits present in target.traitIds
 *   4. Sphere gate     — template.sphereAffinity is null OR in accessibleSpheres
 *   5. Essence gate    — player can afford template.essenceCost
 *   6. Range gate      — target in range from avatar (if positions available)
 */

import type { TargetContext, TargetCategory } from '../types/targetContext';
import type { WheelSlot } from './wheel';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type { HexPosition } from './delivery';
import { hexDistance } from './delivery';

// ─── Constants ──────────────────────────────────────────────────────────────

export const TARGET_ACTION_CONSTANTS = {
  /** Default target categories when template omits the field — backward compat */
  DEFAULT_TARGET_CATEGORIES: ['actor'] as readonly TargetCategory[],
  /** Maximum slots returned (prevents UI overflow) */
  MAX_SLOTS: 20,
  /** Slot ID prefix for non-intervention target actions */
  SLOT_ID_PREFIX: 'target_action_',
  /** Default angle step for laying out target_action slots */
  ANGLE_STEP_DEG: 36,
  /** Max range in hexes for local-range target actions (when no delivery info) */
  DEFAULT_LOCAL_RANGE: 3,
} as const;

// ─── Params ─────────────────────────────────────────────────────────────────

export interface TargetActionParams {
  /** The focused target */
  target: TargetContext;
  /** All available templates */
  templates: readonly UnifiedActionTemplate[];
  /** Player's essence pool */
  pool: EssencePool;
  /** Player's primary sphere */
  primarySphere: SphereName;
  /** Avatar position (for range gating) — omit to skip range gating */
  avatarPos?: HexPosition;
  /** Player's accessible spheres (for sphere gating) */
  accessibleSpheres: readonly SphereName[];
}

// ─── Filter result (for trace) ──────────────────────────────────────────────

interface FilterCounts {
  considered: number;
  byNodeType: number;
  bySubtype: number;
  byTraits: number;
  bySphere: number;
  byEssence: number;
  byRange: number;
}

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * Generate WheelSlot[] for any target node.
 *
 * Returns an empty array (never throws) when no templates pass all filters.
 * Caps output at TARGET_ACTION_CONSTANTS.MAX_SLOTS.
 */
export function getTargetActionSlots(params: TargetActionParams): WheelSlot[] {
  const { target, templates, pool, primarySphere, avatarPos, accessibleSpheres } = params;

  const counts: FilterCounts = {
    considered: 0,
    byNodeType: 0,
    bySubtype: 0,
    byTraits: 0,
    bySphere: 0,
    byEssence: 0,
    byRange: 0,
  };

  const slots: WheelSlot[] = [];

  for (const template of templates) {
    if (slots.length >= TARGET_ACTION_CONSTANTS.MAX_SLOTS) break;

    counts.considered++;

    // 1. Node-type gate
    const categories = template.targetCategories?.length
      ? template.targetCategories
      : TARGET_ACTION_CONSTANTS.DEFAULT_TARGET_CATEGORIES;

    const nodeTypeMatches = (categories as readonly string[]).includes(target.nodeType)
      || (target.nodeType === 'location' && (categories as readonly string[]).includes('sublocation') && target.subtype === 'sublocation')
      || (target.nodeType === 'location' && (categories as readonly string[]).includes('hex') && target.subtype === 'hex');

    if (!nodeTypeMatches) {
      counts.byNodeType++;
      continue;
    }

    // 2. Subtype gate
    if (template.targetSubtypes && template.targetSubtypes.length > 0) {
      if (!target.subtype || !(template.targetSubtypes as readonly string[]).includes(target.subtype)) {
        counts.bySubtype++;
        continue;
      }
    }

    // 3. Trait gate (AND logic — all required traits must be present)
    if (template.requiredTargetTraits && template.requiredTargetTraits.length > 0) {
      const allPresent = template.requiredTargetTraits.every(traitId =>
        target.traitIds.includes(traitId)
      );
      if (!allPresent) {
        counts.byTraits++;
        continue;
      }
    }

    // 4. Sphere gate
    if (template.sphereAffinity) {
      const sphereAllowed = (accessibleSpheres as readonly string[]).includes(template.sphereAffinity);
      if (!sphereAllowed) {
        counts.bySphere++;
        // Still show as locked slot rather than hiding entirely
      }
    }

    // 5. Essence gate
    const essenceCost = template.essenceCost ?? 0;
    const sphere = template.sphereAffinity ?? primarySphere;
    const currentEssence = (pool as Record<string, number>)[sphere] ?? 0;
    const canAffordEssence = essenceCost === 0 || currentEssence >= essenceCost;

    // 6. Range gate (only if positions provided)
    let rangeStatus: WheelSlot['rangeStatus'] = 'unlimited';
    let hexDist: number | null = null;

    if (avatarPos && target.position) {
      hexDist = hexDistance(avatarPos, target.position);
      const inRange = hexDist <= TARGET_ACTION_CONSTANTS.DEFAULT_LOCAL_RANGE;
      rangeStatus = inRange ? 'in_range' : 'out_of_range';
    } else if (!avatarPos || !target.position) {
      rangeStatus = 'unlimited';
    }

    // Determine availability
    let available = canAffordEssence && rangeStatus !== 'out_of_range';
    let lockedReason: string | null = null;

    if (!canAffordEssence) {
      counts.byEssence++;
      available = false;
      lockedReason = `Not enough ${sphere} essence`;
    } else if (rangeStatus === 'out_of_range') {
      counts.byRange++;
      available = false;
      lockedReason = hexDist !== null ? `Out of range (${hexDist} hexes)` : 'Out of range';
    }

    const slotId = `${TARGET_ACTION_CONSTANTS.SLOT_ID_PREFIX}${template.id}`;
    const angleDeg = (slots.length * TARGET_ACTION_CONSTANTS.ANGLE_STEP_DEG) % 360;

    slots.push({
      id: slotId,
      label: template.name,
      type: 'target_action',
      angleDeg,
      available,
      lockedReason,
      essenceCost,
      detectionRisk: 0,
      sphere: template.sphereAffinity ?? null,
      interventionType: null,
      rangeStatus,
      hexDistance: hexDist,
      description: template.narrativeTemplates.initiation,
    });
  }

  return slots;
}

/**
 * Map a target_action slot ID back to its template ID.
 * Returns undefined if the slot ID is not a target_action slot.
 */
export function templateIdFromSlotId(slotId: string): string | undefined {
  if (!slotId.startsWith(TARGET_ACTION_CONSTANTS.SLOT_ID_PREFIX)) return undefined;
  return slotId.slice(TARGET_ACTION_CONSTANTS.SLOT_ID_PREFIX.length);
}
