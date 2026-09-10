/**
 * AgentWheel — Data layer for radial action menu.
 *
 * Defines the wheel slot structure and builds the data layer that determines
 * which slots are available for a given agent based on the player's influence
 * tier and essence reserves.
 */

import type { SphereName } from '../types/index';
import type { EssencePool, InfluenceTier } from '../types/influence';
import type { RarityTier } from '../types/rarity';
import type { ActionScale } from '../types/unifiedAction';
import type { EffectSource } from '../data/actionEffectSource';
import type { ForecastTier } from '../types/resolution';
import type { ReachDomain } from '../types/traits';
import type { ActionCrudType, UpkeepWord } from '../data/action-card-display';
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
  /** Type of slot: observation (non-interventionist), intervention (costs essence), info (center), or target_action (player-sourced UnifiedAction) */
  type: 'observation' | 'intervention' | 'info' | 'target_action';
  /** Clock position (0 = 12 o'clock, clockwise). -1 for center. */
  angleDeg: number;
  /** Whether this slot is currently available */
  available: boolean;
  /** Reason why locked (e.g., "Requires tier 2"), or null if available */
  lockedReason: string | null;
  /** Essence cost to use this action */
  essenceCost: number;
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
  /** Duration mode: 'instant' (default) or 'sustained' (spawns ControlEffect on success) */
  durationMode?: 'instant' | 'sustained';
  /** Per-tick essence cost summary string for sustained actions (e.g. "0.5 force/tick") */
  perTickCostLabel?: string;
  /** Evocative spell name — displayed in card name zone (focused).
   * Falls back to label if absent. */
  spellName?: string;
  /** Technical description from template.description.
   * The description field (narrativeTemplates.initiation) serves as flavor text.
   * This field carries the new mechanical description. */
  technicalDescription?: string;
  /** Wiki-facing statement of what state this action changes (THR-604 `technicalEffect`).
   * Surfaced as the focused card's "Effect" block (THR-610). Absent → block hidden. */
  technicalEffect?: string;
  /** Plain-prose effects line (THR-639) — one player-facing sentence stating what the
   * action does, what it touches, and what it costs. Rendered on the focused ActionCard
   * face (shared by the Action Drawer and the Ascendant Beat unlock modal). Sourced from
   * `actionEffectsProse(template)`. Distinct from `technicalEffect` (mechanical/wiki-facing);
   * this is atmospheric-but-instructional player prose. Absent → line hidden. */
  effectsLine?: string;
  /** Where this action's mechanical effect is wired (THR-604 derivation). Drives the
   * wiring badge next to the Effect block. Only meaningful when technicalEffect is set. */
  effectSource?: EffectSource;
  /** Narrative layer this action belongs to (land, soul, people, ruins).
   * Used by ActionDrawer to group hex-targeting cards into layer tabs. */
  narrativeLayer?: 'land' | 'soul' | 'people' | 'ruins';
  /** Narrative significance tier (1–4). Drives RarityBadge display in ActionCard.
   * Badge only shown for tier >= 2 (Storied and above).
   * NOTE: Slots built via getAgentWheelSlots (legacy radial wheel) do not populate rarityTier.
   * If that path is still active, add rarityTier pass-through matching targetActions.ts:263. */
  rarityTier?: RarityTier;
  /** Highest step difficulty in the template (THR-728). 0 or absent → a guaranteed
   * casting, no hint shown. NOTE (THR-998): this is the *authored* price and is no
   * longer what picks the risk word — the floor caps it away for 85% of the slot
   * list. It survives as the "was this priced at all?" bit. Use
   * `effectiveStepDifficulty` for anything that claims something about the odds. */
  maxStepDifficulty?: number;
  /** The difficulty that actually reaches the roll for this ascendant, at this
   * template's scale (THR-998) — `effectiveCastDifficulty` in playerCastReadout.ts.
   * 0 means the per-scale floor capped the authored price away, so the card names
   * the scale instead of claiming a risk. Absent when the slot was built without a
   * capability map (fail-soft: the card then names the scale rather than guessing). */
  effectiveStepDifficulty?: number;
  /** Template scale, carried for the focused card's honest-line fallback (THR-998). */
  scale?: ActionScale | null;
  /**
   * The forecast tier word the card prints in its odds zone (THR-1002) —
   * `classifyForecastTier(castForecastProbability(...))`.
   *
   * **Omitted, never guessed**, when the slot was built without a capability map:
   * a card with no odds zone is honest about not knowing, and a card showing
   * `uncertain` by default would be a claim nobody made. This is the cast's
   * counterpart to the nudge card's `OddsPips` — a word rather than pips, because
   * a cast *rolls* the odds where a nudge *moves* them (Law 10).
   */
  forecastTier?: ForecastTier;
  /** The scale as the player reads it, from `ACTION_SCALE_WORDS` (THR-1002). */
  scaleWord?: string;
  /**
   * Upkeep band for a sustained action (THR-1002) — *light / steady / heavy*, from
   * `upkeepWord(perTickCost)`. Absent on an instant action, and on a sustained one
   * whose per-tick cost does not resolve. `perTickCostLabel` keeps the numeral for
   * the designer view.
   */
  upkeepWord?: UpkeepWord;
  /**
   * The template id this slot was built from (THR-1002), unprefixed.
   *
   * The card's name links to the codex entry, and the codex keys its action
   * entries on the bare template id — so the link needs the id the slot was made
   * from rather than `slot.id`, which carries the `target_action_` prefix on one
   * of the two builders and not the other. Carrying it explicitly is what stops a
   * third consumer re-deriving it by string surgery, which is how the retired
   * type line came to exist.
   */
  templateId?: string;
  /**
   * The CRUD axis the card prints as its verb chip (THR-1002).
   *
   * This is the field that killed `parseTypeLine`: the verb used to be recovered
   * by splitting the slot id on dots and upper-casing the third segment, so a
   * template whose id did not happen to end in its CRUD type printed the wrong
   * word — or an empty chip — and a raw schema key reached the face either way
   * (Law 14). The template declares it; the slot carries it.
   */
  crudType?: ActionCrudType;
  /**
   * The reach the card's mark shows — the reach of the template's *hardest* step,
   * not the template's headline reach (THR-1002).
   *
   * The hardest step is the one whose difficulty the forecast tier was computed
   * against, so this is the reach the player's odds actually leaned on. Showing
   * the headline reach beside a tier word derived from a different one would be
   * two readings of the same cast that disagree.
   */
  reach?: ReachDomain;
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
 * @deprecated THR-501 — the tier-based intervention wheel is retired. The agent action
 * hand no longer calls this; its interventions come from the unified `divine.*` templates
 * (`AGENT_INTERVENTION_TEMPLATES`) via `getTargetActionSlots`, which is unlock-gated and
 * context-filtered like every other action surface. This radial wheel had no unlock concept
 * and is on the rejected-approaches list ("AgentWheel replaced by ActionDrawer"). Retained
 * only for `wheel.test.ts`; remove once the test is migrated. Do not wire this into new UI.
 *
 * Availability is determined by:
 * 1. Center is always available
 * 2. Scry is available if tier >= 1 (free, no essence cost)
 * 3. Interventions check: (1) tier >= minTier, AND (2) canAfford(pool, sphere, baseCost)
 * 4. Sphere selection: use primarySphere if in intervention's sphereAffinities,
 *    otherwise use first affinity
 * 5. BaseCost comes from INTERVENTION_DEFINITIONS
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
