/**
 * Resolution Modifier Pipeline — contextual modifiers for encounter resolution.
 *
 * Replaces hardcoded sphere/difficulty factors with a real pipeline:
 * sphere alignment + equipment + terrain + traits + divine intervention (stub).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                      | Default | Purpose                                          |
 * |---------------------------|---------|--------------------------------------------------|
 * | SPHERE_ALIGNMENT_BONUS    | 0.10    | Bonus when agent sphere matches encounter sphere |
 * | SPHERE_OPPOSITION_PENALTY | -0.10   | Penalty when agent sphere opposes encounter       |
 * | EQUIPMENT_MODIFIER_CAP    | 0.15    | Max total equipment modifier                     |
 * | EQUIPMENT_PER_ITEM_CAP    | 0.08    | Max modifier from a single equipment item        |
 * | TERRAIN_MODIFIER_CAP      | 0.10    | Max total terrain modifier                       |
 * | FACTION_CONTROL_BONUS     | 0.05    | Bonus for acting in friendly-controlled territory|
 * | HOSTILE_TERRITORY_PENALTY | -0.05   | Penalty for acting in hostile-controlled territory|
 * | TRAIT_BONUS_CAP           | 0.10    | Max total trait resolution bonus                 |
 * | TRAIT_PER_BONUS_CAP       | 0.05    | Max modifier from a single trait                 |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Returns ModifierBreakdown for inclusion in EncounterResolutionTrace.
 * No standalone trace emission — caller (encounter.ts) emits the trace.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                          | Fallback                  |
 * |---------------------------------------|---------------------------|
 * | No agent node                         | 0 for all modifiers       |
 * | No sphere data on agent or ascendant  | sphereAlignmentBonus = 0  |
 * | No encounter sphere                   | sphereAlignmentBonus = 0  |
 * | Missing reachBonus on attachment      | Skip attachment           |
 * | Missing terrain data on location      | terrainModifier = 0       |
 * | Missing resolutionBonus on trait      | Skip trait                |
 * | No location node                      | terrainModifier = 0       |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all modifiers are deterministic graph walks.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { EffectModifierResult, EffectRuntimeState } from '../types/effects';
import { SPHERE_OPPOSITIONS } from './cosmology';
import { getDivineAttention } from './divineAttention';
import { resolveEffectModifiers, buildPredicateContext, hasEffectsFormat } from './effectResolver';
import { getActiveRuleOverride } from './effects/effectQueries';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  SPHERE_ALIGNMENT_BONUS,
  SPHERE_OPPOSITION_PENALTY,
  EQUIPMENT_MODIFIER_CAP,
  EQUIPMENT_PER_ITEM_CAP,
  TERRAIN_MODIFIER_CAP,
  FACTION_CONTROL_BONUS,
  HOSTILE_TERRITORY_PENALTY,
  TRAIT_BONUS_CAP,
  TRAIT_PER_BONUS_CAP,
  TERRAIN_RESOLUTION_MODIFIERS,
} from '../data/agent-behavior-constants';

import {
  SPHERE_ALIGNMENT_BONUS,
  SPHERE_OPPOSITION_PENALTY,
  EQUIPMENT_MODIFIER_CAP,
  EQUIPMENT_PER_ITEM_CAP,
  TERRAIN_MODIFIER_CAP,
  FACTION_CONTROL_BONUS,
  HOSTILE_TERRITORY_PENALTY,
  TRAIT_BONUS_CAP,
  TRAIT_PER_BONUS_CAP,
  TERRAIN_RESOLUTION_MODIFIERS,
} from '../data/agent-behavior-constants';

// ─── Types ───────────────────────────────────────────────────────

export interface ModifierBreakdown {
  sphereAlignmentBonus: number;
  equipmentModifier: number;
  terrainModifier: number;
  traitBonus: number;
  divineInterventionModifier: number;
  /** Modifier from generic effect system (replaces equipment+trait when effects[] present) */
  effectModifier: number;
  /** Detailed breakdown from effect resolver (for tracing) */
  effectResult?: EffectModifierResult;
  /** Tactical resolution shapers surfaced by the effect system for this step */
  testShapers?: EffectModifierResult['testShapers'];
  /** Modifier from modify_rules encounter_difficulty_modifier on the agent */
  ruleModifier: number;
  totalModifier: number;
}

// ─── Sub-functions ───────────────────────────────────────────────

/**
 * Compute sphere alignment bonus/penalty.
 *
 * 1. Get agent's sphere alignment: check agent node's properties.sphereAlignment,
 *    or walk thread edges to ascendant and read ascendant's sphereAlignment.primary.
 * 2. If agent sphere === encounter sphere → +SPHERE_ALIGNMENT_BONUS.
 * 3. If agent sphere is opposite of encounter sphere → +SPHERE_OPPOSITION_PENALTY.
 * 4. Otherwise → 0.
 */
export function computeSphereAlignmentBonus(
  graph: WorldGraph,
  agentId: string,
  encounterSphere: SphereName | undefined,
): number {
  if (!encounterSphere) return 0;

  // Try to resolve agent's sphere alignment
  let agentSphere: SphereName | undefined;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return 0;

  // Check agent's own sphereAlignment property
  const sphereAlignment = agentNode.properties.sphereAlignment as
    | { primary?: SphereName } | SphereName | undefined;
  if (sphereAlignment) {
    if (typeof sphereAlignment === 'string') {
      agentSphere = sphereAlignment;
    } else if (typeof sphereAlignment === 'object' && sphereAlignment.primary) {
      agentSphere = sphereAlignment.primary;
    }
  }

  // If no direct sphere, walk thread edges to ascendant
  if (!agentSphere) {
    const threadEdges = graph.getIncomingEdges(agentId, 'thread');
    for (const edge of threadEdges) {
      const ascendantNode = graph.getNode(edge.source);
      if (!ascendantNode) continue;
      const ascSphereAlignment = ascendantNode.properties.sphereAlignment as
        | { primary?: SphereName } | SphereName | undefined;
      if (ascSphereAlignment) {
        if (typeof ascSphereAlignment === 'string') {
          agentSphere = ascSphereAlignment;
        } else if (typeof ascSphereAlignment === 'object' && ascSphereAlignment.primary) {
          agentSphere = ascSphereAlignment.primary;
        }
      }
      if (agentSphere) break;
    }
  }

  if (!agentSphere) return 0;

  // Match check
  if (agentSphere === encounterSphere) return SPHERE_ALIGNMENT_BONUS;

  // Opposition check
  if (SPHERE_OPPOSITIONS[agentSphere] === encounterSphere) return SPHERE_OPPOSITION_PENALTY;

  return 0;
}

/**
 * Compute equipment modifier by walking attachment edges.
 *
 * Walk possesses and bonded_to edges, read reachBonus[stepReach],
 * cap each at EQUIPMENT_PER_ITEM_CAP, cap total at EQUIPMENT_MODIFIER_CAP.
 */
export function computeEquipmentModifier(
  graph: WorldGraph,
  agentId: string,
  stepReach: ReachDomain,
): number {
  let total = 0;

  for (const edgeType of ['possesses', 'bonded_to'] as const) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      const artifactNode = graph.getNode(edge.target);
      if (!artifactNode) continue;

      const reachBonus = artifactNode.properties.reachBonus as
        | Partial<Record<ReachDomain, number>> | undefined;
      if (!reachBonus) continue;

      const bonus = reachBonus[stepReach] ?? 0;
      if (bonus === 0) continue;

      // Cap each individual item's contribution
      total += Math.min(bonus, EQUIPMENT_PER_ITEM_CAP);
    }
  }

  // Cap total equipment modifier
  return Math.min(total, EQUIPMENT_MODIFIER_CAP);
}

/**
 * Compute terrain modifier for a location.
 *
 * 1. Look up terrain type on location node.
 * 2. Apply TERRAIN_RESOLUTION_MODIFIERS.
 * 3. Check faction control: if agent's faction controls → +FACTION_CONTROL_BONUS.
 * 4. If hostile faction controls → +HOSTILE_TERRITORY_PENALTY.
 * 5. Cap total at TERRAIN_MODIFIER_CAP (absolute value).
 */
export function computeTerrainModifier(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
): number {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return 0;

  // Get terrain type
  const terrainType = (locationNode.properties.terrainType ?? locationNode.properties.terrain) as string | undefined;
  const baseModifier = terrainType ? (TERRAIN_RESOLUTION_MODIFIERS[terrainType] ?? 0) : 0;

  // Check faction control
  let factionModifier = 0;
  const controlEdges = graph.getIncomingEdges(locationId, 'controls');
  if (controlEdges.length > 0) {
    // Get agent's faction membership
    const agentMemberEdges = graph.getOutgoingEdges(agentId, 'member_of');
    const agentFactionIds = new Set(agentMemberEdges.map(e => e.target));

    for (const controlEdge of controlEdges) {
      const controllingFactionId = controlEdge.source;

      if (agentFactionIds.has(controllingFactionId)) {
        // Agent's faction controls this location
        factionModifier = FACTION_CONTROL_BONUS;
        break;
      } else {
        // Check if agent has negative sentiment toward controlling faction
        const relEdges = graph.getOutgoingEdges(agentId, 'relates_to');
        for (const relEdge of relEdges) {
          if (relEdge.target === controllingFactionId) {
            const sentiment = (relEdge.properties.sentiment as number) ?? 0;
            if (sentiment < 0) {
              factionModifier = HOSTILE_TERRITORY_PENALTY;
              break;
            }
          }
        }
        if (factionModifier !== 0) break;
      }
    }
  }

  const total = baseModifier + factionModifier;

  // Cap total terrain modifier (clamp between -CAP and +CAP)
  return Math.max(-TERRAIN_MODIFIER_CAP, Math.min(TERRAIN_MODIFIER_CAP, total));
}

/**
 * Compute trait bonus by walking has_trait edges.
 *
 * For each trait node, read resolutionBonus[stepReach],
 * cap each at TRAIT_PER_BONUS_CAP, cap total at TRAIT_BONUS_CAP.
 */
export function computeTraitBonus(
  graph: WorldGraph,
  agentId: string,
  stepReach: ReachDomain,
): number {
  let total = 0;

  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const resolutionBonus = traitNode.properties.resolutionBonus as
      | Partial<Record<ReachDomain, number>> | undefined;
    if (!resolutionBonus) continue;

    const bonus = resolutionBonus[stepReach] ?? 0;
    if (bonus === 0) continue;

    total += Math.min(bonus, TRAIT_PER_BONUS_CAP);
  }

  return Math.min(total, TRAIT_BONUS_CAP);
}

/**
 * Compute divine intervention modifier by reading active intervention bonus
 * from the agent's divine attention state and intervention history.
 *
 * The modifier is the effectiveBonus from the most recent intervention
 * on this agent (stored as `activeInterventionBonus` on the agent node).
 * This property is set by the UI/action layer when the player commits essence.
 *
 * Fail-soft: returns 0 if no active intervention or agent not found.
 */
export function computeDivineInterventionModifier(
  graph: WorldGraph,
  agentId: string,
): number {
  const node = graph.getNode(agentId);
  if (!node) return 0;

  // Check for active intervention bonus (set by player action)
  const activeBonus = node.properties.activeInterventionBonus as number | undefined;
  if (activeBonus && typeof activeBonus === 'number' && activeBonus > 0) {
    return activeBonus;
  }

  // Check divine attention for passive bonus
  const attention = getDivineAttention(graph, agentId);
  if (attention.level === 'focused') {
    // Focused agents get a small passive bonus
    return 0.02;
  }

  return 0;
}

// ─── Main Pipeline ───────────────────────────────────────────────

/**
 * Compute all resolution modifiers for an encounter step.
 * Returns a breakdown of each modifier source and the total.
 */
export function computeResolutionModifiers(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
  stepReach: ReachDomain,
  encounterSphereAffinity: SphereName | undefined,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): ModifierBreakdown {
  const sphereAlignmentBonus = computeSphereAlignmentBonus(graph, agentId, encounterSphereAffinity);
  const terrainModifier = computeTerrainModifier(graph, agentId, locationId);
  const divineInterventionModifier = computeDivineInterventionModifier(graph, agentId);

  // Check if agent has any attachments using the new effects[] format.
  // If so, use the generic effect resolver for equipment+trait modifiers.
  // If not, fall back to legacy reachBonus/resolutionBonus path.
  let equipmentModifier = 0;
  let traitBonus = 0;
  let effectModifier = 0;
  let effectResult: EffectModifierResult | undefined;

  if (hasEffectsFormat(graph, agentId)) {
    // New path: resolve all effects via the generic effect system
    const ctx = buildPredicateContext(graph, agentId, stepReach);
    effectResult = resolveEffectModifiers(graph, agentId, stepReach, ctx, effectStates);
    effectModifier = effectResult.reachModifiers[stepReach] ?? 0;
    // Legacy modifiers still contribute for attachments without effects[]
    equipmentModifier = computeEquipmentModifier(graph, agentId, stepReach);
    traitBonus = computeTraitBonus(graph, agentId, stepReach);
  } else {
    // Legacy path: no effects[], use reachBonus/resolutionBonus
    equipmentModifier = computeEquipmentModifier(graph, agentId, stepReach);
    traitBonus = computeTraitBonus(graph, agentId, stepReach);
  }

  // Rule override: modify_rules encounter_difficulty_modifier shifts the agent's effective difficulty
  const ruleModifier = getActiveRuleOverride(graph, agentId, 'encounter_difficulty_modifier', effectStates);

  const totalModifier =
    sphereAlignmentBonus +
    equipmentModifier +
    terrainModifier +
    traitBonus +
    divineInterventionModifier +
    effectModifier +
    ruleModifier;

  return {
    sphereAlignmentBonus,
    equipmentModifier,
    terrainModifier,
    traitBonus,
    divineInterventionModifier,
    effectModifier,
    effectResult,
    testShapers: effectResult?.testShapers ?? [],
    ruleModifier,
    totalModifier,
  };
}
