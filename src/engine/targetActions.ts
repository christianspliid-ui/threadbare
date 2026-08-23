/**
 * Generalized action targeting — filter UnifiedActionTemplates for any target node.
 *
 * getTargetActionSlots() is the core function. It accepts a TargetContext describing
 * any focused graph node and returns WheelSlot[] for the ActionDrawer.
 *
 * Filtering cascade (in order):
 *   1.  Node-type gate       — template.targetCategories includes target.nodeType
 *   2.  Subtype gate         — template.targetSubtypes includes target.subtype (if specified)
 *   3.  Trait gate           — all template.requiredTargetTraits present in target.traitIds
 *   3b. Node-property gate   — all template.requiredNodeProperties match target.properties
 *   3c. Reputation gate      — viewer's reputation with the target reaches template.requiredReputationWith
 *   4.  Sphere gate          — template.sphereAffinity is null OR in accessibleSpheres
 *   5.  Essence gate         — player can afford template.essenceCost
 *   6.  Range gate           — target in range from avatar (if positions available)
 *   7.  Revelation gate      — template.narrativeLayer revealed on target hex (if applicable)
 */

import type { TargetContext, TargetCategory } from '../types/targetContext';
import type { WheelSlot } from './wheel';
import type { UnifiedActionTemplate, HexRevelation } from '../types/unifiedAction';
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { HexPosition } from './delivery';
import { hexDistance } from './delivery';
import { hexKey } from '../lib/hexKey';
import type { WorldGraph } from './graph';
import { meetsReputationWithRequirement } from './reputation';
import { isActionRevealed } from './actionUnlock';
import { REACH_GATE_MIN_AFFINITY } from '../data/influence-content';
import { effectSourceFor } from '../data/actionEffectSource';
import { actionEffectsProse } from '../data/actionEffectsProse';
import { emitTrace } from './traceBuffer';
import { isActionStepBranch } from '../types/unifiedAction';
import { effectiveCastDifficulty } from './playerCastReadout';
import { tierScaledEssenceCost, tierScaledDifficulty } from './targetTierScaling';

/**
 * The hardest step a template can present, with the reach it is rolled in
 * (THR-728; reach added THR-998).
 *
 * Player casts roll against this difficulty, so the focused card states the risk
 * before the cast rather than leaving it to be discovered in the receipt. Branch
 * steps are skipped: only branching encounters use them, and none is player-castable
 * — fail-soft, a template made entirely of branches simply reads as guaranteed.
 *
 * The reach matters because capability is per-reach and the floor cap is
 * `capability - MIN_PROBABILITY_BY_SCALE[scale]` — so how much of the authored price
 * survives depends on which reach the *hardest* step is rolled in, not on the
 * template's headline reach. Falls back to the template reach when no priced step
 * exists, which keeps the return total for a guaranteed casting.
 */
function hardestStep(
  template: UnifiedActionTemplate,
  targetProperties?: Readonly<Record<string, unknown>>,
): { difficulty: number; reach: ReachDomain } {
  let max = 0;
  let reach = template.reach;
  for (const step of template.steps) {
    if (isActionStepBranch(step)) continue;
    // THR-1073: a tier-scaled step's authored `difficulty` is only its tier-1
    // entry, so reading it raw would state a risk the roll will not use. Resolved
    // against the same table the resolver reads; a step without the marker
    // returns its authored difficulty unchanged.
    const difficulty = tierScaledDifficulty(step, targetProperties) ?? 0;
    if (Number.isFinite(difficulty) && difficulty > max) {
      max = difficulty;
      reach = step.reach ?? template.reach;
    }
  }
  return { difficulty: max, reach };
}

/**
 * The three difficulty-shaped fields a slot carries for the focused card (THR-998).
 *
 * `effectiveStepDifficulty` is omitted — not zeroed — when no capability map was
 * supplied, so the card can tell "the floor capped this away" (0) apart from "nobody
 * told me" (absent) and stay conservative in the second case.
 */
function castDifficultyFields(
  template: UnifiedActionTemplate,
  capabilities: Partial<Record<ReachDomain, number>> | undefined,
  targetProperties?: Readonly<Record<string, unknown>>,
): Pick<WheelSlot, 'maxStepDifficulty' | 'effectiveStepDifficulty' | 'scale'> {
  const { difficulty, reach } = hardestStep(template, targetProperties);
  const fields: Pick<WheelSlot, 'maxStepDifficulty' | 'effectiveStepDifficulty' | 'scale'> = {
    maxStepDifficulty: difficulty,
    scale: template.scale ?? null,
  };
  if (capabilities) {
    fields.effectiveStepDifficulty = effectiveCastDifficulty(
      difficulty,
      capabilities[reach],
      template.scale,
    );
  }
  return fields;
}

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
  /** Per-hex layer revelation state. Key: hexKey(col,row). Omit to skip revelation gating. */
  hexRevelation?: Readonly<Record<string, HexRevelation>>;
  /**
   * Tier of any existing thread from the ascendant to this target (1 = normal, 2 = strong),
   * or null if no thread exists. Used to suppress bind_thread_* actions when already threaded.
   */
  existingThreadTier?: number | null;
  /** Explicitly unlocked action IDs for the current run/account. */
  unlockedActionIds?: readonly string[];
  /**
   * The ascendant's fixed reach affinities (THR-503). Drives the reach gate:
   * templates declaring `requiresReach` are hidden unless the ascendant's affinity
   * in that reach is ≥ REACH_GATE_MIN_AFFINITY. Omit to disable reach gating
   * (fail-open — contexts without an ascendant, e.g. tests, see all reach cards).
   */
  ascendantDomainAffinities?: Partial<Record<ReachDomain, number>>;
  /**
   * The ascendant's cast capability per reach (THR-998), from
   * `castCapabilityByReach(graph, ascendantId)`.
   *
   * Drives `effectiveStepDifficulty` — how much of a template's authored price
   * survives the per-scale probability floor and actually reaches the roll — which
   * is the only number the focused card may differentiate its risk line on.
   *
   * Omit to skip the computation (tests, and any surface with no ascendant in
   * scope). Fail-soft and deliberately conservative: a slot built without this
   * carries no `effectiveStepDifficulty`, and the card then names the template's
   * scale rather than asserting a risk it cannot substantiate. Never falls back to
   * the authored difficulty — that fallback is the defect THR-998 removed.
   */
  ascendantCastCapabilities?: Partial<Record<ReachDomain, number>>;
  /**
   * World graph and the agent whose standing the reputation gate reads (THR-1206).
   *
   * Both are required together and both are optional: a surface with no graph or no
   * viewer in scope (tests, the codex, any listing that is not "what can *this* agent
   * do here") skips gate 3c entirely rather than hiding every gated template. Same
   * fail-open contract as `ascendantDomainAffinities` above, and for the same reason
   * — a gate that silently empties a catalog is worse than one that does not run.
   */
  graph?: WorldGraph;
  /** The agent whose reputation with the target is checked. See {@link graph}. */
  viewerAgentId?: string;
}

// ─── Filter result (for trace) ──────────────────────────────────────────────

interface FilterCounts {
  considered: number;
  byNodeType: number;
  bySubtype: number;
  byTraits: number;
  byNodeProperties: number;
  bySphere: number;
  byEssence: number;
  byRange: number;
  byRevelation: number;
  byUnlock: number;
  byReach: number;
  byReputation: number;
}

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * Generate WheelSlot[] for any target node.
 *
 * Returns an empty array (never throws) when no templates pass all filters.
 * Caps output at TARGET_ACTION_CONSTANTS.MAX_SLOTS.
 */
export function getTargetActionSlots(params: TargetActionParams): WheelSlot[] {
  const {
    target,
    templates,
    pool,
    primarySphere,
    avatarPos,
    accessibleSpheres,
    hexRevelation,
    existingThreadTier,
    unlockedActionIds,
    ascendantDomainAffinities,
    ascendantCastCapabilities,
    graph,
    viewerAgentId,
  } = params;

  const counts: FilterCounts = {
    considered: 0,
    byNodeType: 0,
    bySubtype: 0,
    byTraits: 0,
    byNodeProperties: 0,
    bySphere: 0,
    byEssence: 0,
    byRange: 0,
    byRevelation: 0,
    byUnlock: 0,
    byReach: 0,
    byReputation: 0,
  };

  const slots: WheelSlot[] = [];

  for (const template of templates) {
    if (slots.length >= TARGET_ACTION_CONSTANTS.MAX_SLOTS) break;

    counts.considered++;

    // 1. Node-type gate
    const categories = template.targetCategories?.length
      ? template.targetCategories
      : TARGET_ACTION_CONSTANTS.DEFAULT_TARGET_CATEGORIES;

    // Hex targets are built by buildHexTargetContext which always sets properties.terrain.
    // Location targets (specific locations) never set properties.terrain.
    const isHexTarget = target.nodeType === 'location' && !!target.properties.terrain;
    // THR-400 — faction targets are actor nodes with `actorType: 'faction'`,
    // surfaced via buildActorTargetContext. Templates declare `'faction'` in
    // `targetCategories` (with a structural cast — `TargetCategory` does not
    // yet enumerate `'faction'`). Accept when target.subtype === 'faction'.
    const isFactionTarget = target.nodeType === 'actor' && target.subtype === 'faction';
    const nodeTypeMatches = (categories as readonly string[]).includes(target.nodeType)
      || (target.nodeType === 'location' && (categories as readonly string[]).includes('sublocation') && target.subtype === 'sublocation')
      || (isHexTarget && (categories as readonly string[]).includes('hex'))
      || (isFactionTarget && (categories as readonly string[]).includes('faction'));

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

    // 2b. Thread-dedup gate — hide bind_thread_* templates when a thread already exists.
    // An ascendant may only hold one thread to any given target. Once threaded,
    // bind_thread_* create actions are suppressed entirely (upgrade/downgrade is separate).
    if (template.id.startsWith('bind_thread_') && existingThreadTier != null) {
      continue;
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

    // 3b. Node-property gate (AND logic — all required properties must match)
    if (template.requiredNodeProperties) {
      const entries = Object.entries(template.requiredNodeProperties);
      if (entries.length > 0) {
        const allMatch = entries.every(([key, val]) =>
          val === undefined ? target.properties[key] != null : target.properties[key] === val,
        );
        if (!allMatch) {
          counts.byNodeProperties++;
          continue;
        }
      }
    }

    // 3c. Reputation gate (THR-1206) — the viewer's standing WITH this target must
    //     reach the authored band. The sibling of the faction-rank gate in the
    //     encounter filter pipeline: rank asks about standing inside a group you
    //     belong to, this asks about standing with anyone or anywhere.
    //
    //     Fail-open when the caller supplied no graph/viewer (see TargetActionParams).
    if (template.requiredReputationWith && graph && viewerAgentId) {
      const clears = meetsReputationWithRequirement(
        graph, viewerAgentId, target.nodeId, template.requiredReputationWith.atLeast,
      );
      if (!clears) {
        counts.byReputation++;
        continue;
      }
    }

    // 7. Revelation gate — must come before sphere/essence/range so unrevealed
    //    templates are fully hidden (not shown as locked)
    //    Design: "Change, Control, and Destroy only appear if layer is revealed"
    //    Create and Read (Find) actions are exempt — they bypass the gate.
    if (template.narrativeLayer && !template.bypassRevelationGate) {
      const isGatedCrudType = template.crudType !== 'create' && template.crudType !== 'read';
      if (isGatedCrudType) {
        if (hexRevelation && target.position) {
          const key = hexKey(target.position.col, target.position.row);
          const revelation = hexRevelation[key];
          const layerRevealed = revelation?.[template.narrativeLayer] ?? false;
          if (!layerRevealed) {
            counts.byRevelation++;
            continue;
          }
        } else if (!hexRevelation) {
          // Fail-soft: missing hexRevelation map → treat all layers as unrevealed
          // This means non-Create layer-gated templates are hidden until revelation is initialized
          counts.byRevelation++;
          continue;
        }
        // If target has no position, skip revelation gating (non-hex targets)
      }
    }

    // 8. Unlock gate — hide non-starter, non-unlocked templates.
    if (!isActionRevealed(template, unlockedActionIds)) {
      counts.byUnlock++;
      continue;
    }

    // 9. Reach gate (THR-503) — permanent two-domain membership filter.
    //    Every ascendant holds a fixed primary + secondary reach for the whole
    //    run, so a card requiring a reach outside that set is hidden entirely
    //    (like the unlock gate), never surfaced as aspiration. Skipped when no
    //    affinities are supplied (e.g. tests) → fail-open for visibility.
    if (template.requiresReach && ascendantDomainAffinities) {
      const reachIsKnown = (REACH_DOMAINS as readonly string[]).includes(template.requiresReach);
      if (!reachIsKnown) {
        // Fail-soft (NFP #4): unknown reach → treat as ungated rather than hiding.
        console.warn(`[targetActions] template ${template.id} declares unknown requiresReach "${template.requiresReach}" — ungating.`);
      } else {
        const affinity = ascendantDomainAffinities[template.requiresReach] ?? 0;
        if (affinity < REACH_GATE_MIN_AFFINITY) {
          counts.byReach++;
          continue;
        }
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
    // THR-1073: templates marked `essenceCostContext: 'target_tier_scaled'` price
    // themselves from the focused target's attachment tier. Resolved here as well
    // as at the charge (`preparePlayerCast`) so the card never advertises a price
    // the pool will not be charged — a card reading 4 while the cast takes 14
    // would be a worse defect than the flat price it replaces. Every other
    // template gets its authored `essenceCost` back unchanged.
    const essenceCost = tierScaledEssenceCost(template, target.properties);
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

    // Build per-tick cost label for sustained actions (TB-044)
    let perTickCostLabel: string | undefined;
    if (template.durationMode === 'sustained' && template.controlSpec) {
      const parts: string[] = [];
      for (const [sphere, cost] of Object.entries(template.controlSpec.perTickCost)) {
        if (cost && cost > 0) parts.push(`${cost} ${sphere}`);
      }
      if (parts.length > 0) perTickCostLabel = `${parts.join(' + ')}/tick`;
    }

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
      durationMode: template.durationMode,
      perTickCostLabel,
      spellName: template.spellName,
      technicalDescription: template.description,
      technicalEffect: template.technicalEffect,
      effectsLine: actionEffectsProse(template),
      effectSource: effectSourceFor(template),
      narrativeLayer: template.narrativeLayer as WheelSlot['narrativeLayer'],
      rarityTier: template.rarityTier,
      ...castDifficultyFields(template, ascendantCastCapabilities, target.properties),
    });
  }

  if (counts.byUnlock > 0 || counts.byReach > 0) {
    emitTrace({
      category: 'target_action_filter',
      summary: 'action.gate.unlock_filter',
      tick: 0,
      targetNodeId: target.nodeId,
      targetNodeType: target.nodeType,
      targetSubtype: target.subtype ?? null,
      templatesConsidered: counts.considered,
      filteredByNodeType: counts.byNodeType,
      filteredBySubtype: counts.bySubtype,
      filteredByTraits: counts.byTraits,
      filteredBySphere: counts.bySphere,
      filteredByEssence: counts.byEssence,
      filteredByRange: counts.byRange,
      filteredByReach: counts.byReach,
      slotsGenerated: slots.length,
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
