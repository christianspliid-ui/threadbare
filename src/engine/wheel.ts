/**
 * AgentWheel — Data layer for radial action menu.
 *
 * Defines the wheel slot structure and builds the data layer that determines
 * which slots are available for a given agent based on the player's influence
 * tier and essence reserves.
 */

import type { SphereName } from '../types/index';
import type { EssencePool, InfluenceTier } from '../types/influence';
import type { InterventionType } from '../types/dream';
import { INTERVENTION_DEFINITIONS } from '../types/dream';
import { canAfford } from './influence';
import type { HexPosition } from './delivery';
import { isInRange, getDeliveryInfo, hexDistance } from './delivery';

// ─── Wheel Slot Interface ─────────────────────────────────────────────────

/**
 * A single slot in the agent wheel (radial menu).
 * Represents an action or observation option available to the player.
 */
export interface WheelSlot {
  /** Unique identifier for the slot */
  id: string;
  /** Display label (e.g., "Dream", "Scry") */
  label: string;
  /** Type of slot: observation (non-interventionist), intervention (costs essence), or info (center) */
  type: 'observation' | 'intervention' | 'info';
  /** Clock position (0 = 12 o'clock, clockwise). -1 for center. */
  angleDeg: number;
  /** Whether this slot is currently available */
  available: boolean;
  /** Reason why locked (e.g., "Requires tier 2"), or null if available */
  lockedReason: string | null;
  /** Essence cost to use this action */
  essenceCost: number;
  /** Risk of detection (0.0–1.0) */
  detectionRisk: number;
  /** Sphere type for this action (used for essence cost), or null for scry/center */
  sphere: SphereName | null;
  /** Intervention type (dream, persuade, etc.), or null for non-interventions */
  interventionType: InterventionType | null;
  /** Range status: in_range, out_of_range, unlimited, or unknown (no position data) */
  rangeStatus: 'in_range' | 'out_of_range' | 'unlimited' | 'unknown';
  /** Hex distance from avatar to target (null if no position data) */
  hexDistance: number | null;
  /** Brief description of what this action does */
  description: string;
}

// ─── Wheel Layout ─────────────────────────────────────────────────────────

/** Static definition of wheel slot layout: position, tier requirements, etc. */
interface SlotDefinition {
  id: string;
  label: string;
  type: 'observation' | 'intervention' | 'info';
  angleDeg: number;
  interventionType: InterventionType | null;
  minTier: InfluenceTier;
}

const WHEEL_LAYOUT: SlotDefinition[] = [
  {
    id: 'scry',
    label: 'Scry',
    type: 'observation',
    angleDeg: 0,
    interventionType: null,
    minTier: 1,
  },
  {
    id: 'dream',
    label: 'Dream',
    type: 'intervention',
    angleDeg: 45,
    interventionType: 'dream',
    minTier: 1,
  },
  {
    id: 'persuade',
    label: 'Persuade',
    type: 'intervention',
    angleDeg: 75,
    interventionType: 'persuade',
    minTier: 1,
  },
  {
    id: 'deceive',
    label: 'Deceive',
    type: 'intervention',
    angleDeg: 105,
    interventionType: 'deceive',
    minTier: 2,
  },
  {
    id: 'intimidate',
    label: 'Intimidate',
    type: 'intervention',
    angleDeg: 150,
    interventionType: 'intimidate',
    minTier: 2,
  },
  {
    id: 'inspire',
    label: 'Inspire',
    type: 'intervention',
    angleDeg: 180,
    interventionType: 'inspire_intervention',
    minTier: 1,
  },
  {
    id: 'coincidence',
    label: 'Coincidence',
    type: 'intervention',
    angleDeg: 225,
    interventionType: 'coincidence',
    minTier: 3,
  },
  {
    id: 'omen',
    label: 'Omen',
    type: 'intervention',
    angleDeg: 255,
    interventionType: 'omen',
    minTier: 2,
  },
  {
    id: 'afflict_bless',
    label: 'Afflict/Bless',
    type: 'intervention',
    angleDeg: 300,
    interventionType: 'afflict_bless',
    minTier: 2,
  },
  {
    id: 'center',
    label: '',
    type: 'info',
    angleDeg: -1,
    interventionType: null,
    minTier: 0,
  },
];

// ─── Main Function ───────────────────────────────────────────────────────

/**
 * Get the list of wheel slots available to the player for a given agent.
 *
 * Availability is determined by:
 * 1. Center is always available
 * 2. Scry is available if tier >= 1 (free, no essence cost)
 * 3. Interventions check: (1) tier >= minTier, AND (2) canAfford(pool, sphere, baseCost)
 * 4. Sphere selection: use primarySphere if in intervention's sphereAffinities,
 *    otherwise use first affinity
 * 5. BaseCost and detectionRisk come from INTERVENTION_DEFINITIONS
 * 6. Range status computed from avatarPos and targetPos if provided
 *
 * @param params - { tier, pool, primarySphere, avatarPos?, targetPos? }
 * @returns Array of 10 WheelSlot objects (9 actions + 1 center)
 */
export function getAgentWheelSlots(params: {
  tier: InfluenceTier;
  pool: EssencePool;
  primarySphere: SphereName;
  avatarPos?: HexPosition;
  targetPos?: HexPosition;
}): WheelSlot[] {
  const { tier, pool, primarySphere, avatarPos, targetPos } = params;
  const hasPositions = avatarPos != null && targetPos != null;

  return WHEEL_LAYOUT.map((slotDef) => {
    // Center is always available
    if (slotDef.id === 'center') {
      return {
        id: slotDef.id,
        label: slotDef.label,
        type: slotDef.type,
        angleDeg: slotDef.angleDeg,
        available: true,
        lockedReason: null,
        essenceCost: 0,
        detectionRisk: 0,
        sphere: null,
        interventionType: null,
        rangeStatus: 'unknown',
        hexDistance: null,
        description: '',
      };
    }

    // Scry is available if tier >= 1, always free
    if (slotDef.id === 'scry') {
      const available = tier >= slotDef.minTier;
      return {
        id: slotDef.id,
        label: slotDef.label,
        type: slotDef.type,
        angleDeg: slotDef.angleDeg,
        available,
        lockedReason: available ? null : `Requires tier ${slotDef.minTier}`,
        essenceCost: 0,
        detectionRisk: 0,
        sphere: null,
        interventionType: null,
        rangeStatus: 'unknown',
        hexDistance: null,
        description: 'Observe agent psyche and situation',
      };
    }

    // For interventions, check tier and essence
    const interventionType = slotDef.interventionType!;
    const interventionDef = INTERVENTION_DEFINITIONS[interventionType];

    // Compute range status
    let rangeStatus: 'in_range' | 'out_of_range' | 'unlimited' | 'unknown' = 'unknown';
    let hexDist: number | null = null;

    if (hasPositions) {
      const deliveryInfo = getDeliveryInfo(interventionType);
      if (deliveryInfo.mode === 'astral' || deliveryInfo.mode === 'remote') {
        rangeStatus = 'unlimited';
      } else {
        const inRange = isInRange(avatarPos!, targetPos!, interventionType);
        hexDist = hexDistance(avatarPos!, targetPos!);
        rangeStatus = inRange ? 'in_range' : 'out_of_range';
      }
    }

    // Check if tier is high enough
    if (tier < interventionDef.minTier) {
      return {
        id: slotDef.id,
        label: slotDef.label,
        type: slotDef.type,
        angleDeg: slotDef.angleDeg,
        available: false,
        lockedReason: `Requires tier ${interventionDef.minTier}`,
        essenceCost: interventionDef.baseCost,
        detectionRisk: interventionDef.detectionRisk,
        sphere: selectSphere(primarySphere, interventionDef.sphereAffinities),
        interventionType,
        rangeStatus,
        hexDistance: hexDist,
        description: interventionDef.description,
      };
    }

    // Select which sphere to use
    const chosenSphere = selectSphere(primarySphere, interventionDef.sphereAffinities);

    // Check if we can afford this intervention
    const canAffordIntervention = canAfford(pool, chosenSphere, interventionDef.baseCost);

    let slot: WheelSlot = {
      id: slotDef.id,
      label: slotDef.label,
      type: slotDef.type,
      angleDeg: slotDef.angleDeg,
      available: canAffordIntervention,
      lockedReason: canAffordIntervention ? null : `Not enough ${chosenSphere} essence`,
      essenceCost: interventionDef.baseCost,
      detectionRisk: interventionDef.detectionRisk,
      sphere: chosenSphere,
      interventionType,
      rangeStatus,
      hexDistance: hexDist,
      description: interventionDef.description,
    };

    // Apply range gating
    if (rangeStatus === 'out_of_range' && slot.available) {
      slot.available = false;
      slot.lockedReason = `Target out of range (${hexDist} hexes)`;
    }

    return slot;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Select which sphere to use for an intervention.
 * Prefers primarySphere if it's in the intervention's sphereAffinities,
 * otherwise returns the first affinity.
 */
function selectSphere(primarySphere: SphereName, affinities: SphereName[]): SphereName {
  if (affinities.includes(primarySphere)) {
    return primarySphere;
  }
  return affinities[0];
}
