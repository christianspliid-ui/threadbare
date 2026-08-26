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
 * | AURA_STACKING_CAP         | 3       | Max distinct nearby aura emitters aggregated     |
 * | AURA_MAX_RADIUS           | 2       | Hex radius an aura can reach (existing constant) |
 * | EFFECT_MODIFIER_CAP       | 0.30    | Clamp on the aggregated aura total               |
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
 * | Agent position unresolvable to a hex  | auraModifier = 0          |
 * | Aura emitter with no resolvable hex   | emitter excluded, continue|
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
import { readReachOverride, type RuleOverrideContext } from './effects/ruleOverrideConsumers';
import {
  collectAuraEffectsNear,
  resolveAuraModifiers,
  resolveAgentPosition,
  selectAuraEmitters,
} from './effectAura';
import { AURA_STACKING_CAP, EFFECT_MODIFIER_CAP } from '../data/effect-constants';

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

/**
 * Where a single modifier came from, by name (THR-892).
 *
 * The numeric totals below say *how much* the world tilted the step; these say
 * *what did the tilting*, so a surface can name the cause in a sentence instead
 * of printing a labelled number. Produced by the same walks that compute the
 * totals — never a second pass — so a contribution list and its total can not
 * disagree.
 */
export type ModifierSourceKind =
  | 'equipment'
  | 'trait'
  | 'terrain'
  | 'faction'
  | 'sphere'
  | 'divine'
  | 'rule'
  | 'effect'
  /** A nearby agent's aura (THR-1243) — the one modifier sourced from someone else. */
  | 'aura';

export interface NamedModifierContribution {
  readonly kind: ModifierSourceKind;
  /** Node id where resolvable; otherwise a stable synthetic key (e.g. a terrain type). */
  readonly sourceId: string;
  /** Human-readable name for prose — an artifact's name, a terrain word, a faction. */
  readonly sourceName: string;
  /** Signed contribution, already capped exactly as the total capped it. */
  readonly value: number;
}

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
  /**
   * Modifier from nearby agents' `aura` effects (THR-1243). Aggregated lazily at
   * resolution over at most {@link AURA_STACKING_CAP} emitters, then clamped by
   * `EFFECT_MODIFIER_CAP` like any other effect-system total.
   */
  auraModifier: number;
  totalModifier: number;
  /**
   * THR-892 — the named causes behind the totals above, for surfaces that must
   * say *why* rather than *how much*. Always present; empty when nothing tilted
   * the step. Adding a contribution never changes `totalModifier`.
   */
  contributions: NamedModifierContribution[];
}

// ─── Contribution helpers (THR-892) ──────────────────────────────

/** Sum of a contribution list — the single number the legacy callers consumed. */
export function sumContributions(list: readonly NamedModifierContribution[]): number {
  return list.reduce((total, c) => total + c.value, 0);
}

/**
 * Apply a one-sided total cap by trimming the overflowing tail.
 *
 * Reproduces `Math.min(sum, cap)` on the total exactly, which is what the
 * pre-THR-892 code did — so this refactor is behavior-preserving for resolution
 * while making the surviving contributions nameable. Entries past the cap are
 * dropped (or partially trimmed) rather than scaled, because a scaled item would
 * name a real artifact beside a number that artifact never contributed.
 */
function capContributions(
  list: readonly NamedModifierContribution[],
  cap: number,
): NamedModifierContribution[] {
  const total = sumContributions(list);
  if (total <= cap) return [...list];

  const kept: NamedModifierContribution[] = [];
  let running = 0;
  for (const entry of list) {
    const remaining = cap - running;
    if (remaining <= 0) break;
    const value = Math.min(entry.value, remaining);
    kept.push(value === entry.value ? entry : { ...entry, value });
    running += value;
  }
  return kept;
}

/**
 * Apply a two-sided total clamp by trimming the tail, mirroring
 * `Math.max(-cap, Math.min(cap, sum))` on the total exactly.
 */
function clampContributions(
  list: readonly NamedModifierContribution[],
  cap: number,
): NamedModifierContribution[] {
  const total = sumContributions(list);
  const clamped = Math.max(-cap, Math.min(cap, total));
  if (clamped === total) return [...list];

  const kept: NamedModifierContribution[] = [];
  let running = 0;
  for (const entry of list) {
    const remaining = clamped - running;
    // Once the budget is spent (or would reverse sign), stop rather than emit a
    // part whose printed value contradicts its own direction.
    if (remaining === 0) break;
    const value =
      remaining > 0 ? Math.min(entry.value, remaining) : Math.max(entry.value, remaining);
    if (value === 0) continue;
    kept.push(value === entry.value ? entry : { ...entry, value });
    running += value;
  }
  return kept;
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
  return sumContributions(collectEquipmentContributions(graph, agentId, stepReach));
}

/**
 * The named items behind {@link computeEquipmentModifier} (THR-892).
 *
 * The per-item cap is applied to each entry, and the total cap is applied by
 * trimming the *last* entries that overflow it — so the emitted values always sum
 * to exactly what `computeEquipmentModifier` returns. That is the invariant a
 * caller relies on when it prints one line per contribution.
 */
export function collectEquipmentContributions(
  graph: WorldGraph,
  agentId: string,
  stepReach: ReachDomain,
): NamedModifierContribution[] {
  const raw: NamedModifierContribution[] = [];

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
      raw.push({
        kind: 'equipment',
        sourceId: artifactNode.id,
        sourceName: artifactNode.name ?? artifactNode.id,
        value: Math.min(bonus, EQUIPMENT_PER_ITEM_CAP),
      });
    }
  }

  return capContributions(raw, EQUIPMENT_MODIFIER_CAP);
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
  return sumContributions(collectTerrainContributions(graph, agentId, locationId));
}

/**
 * The named place-and-politics parts behind {@link computeTerrainModifier} (THR-892).
 *
 * The two-sided total clamp is applied by trimming the larger-magnitude entry, so
 * the emitted values sum to exactly the clamped total. Both parts are nameable:
 * the terrain word, and the faction whose control tilts the ground.
 */
export function collectTerrainContributions(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
): NamedModifierContribution[] {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  // Get terrain type
  const terrainType = (locationNode.properties.terrainType ?? locationNode.properties.terrain) as string | undefined;
  const baseModifier = terrainType ? (TERRAIN_RESOLUTION_MODIFIERS[terrainType] ?? 0) : 0;

  // Check faction control
  let factionModifier = 0;
  let factionId: string | undefined;
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
        factionId = controllingFactionId;
        break;
      } else {
        // Check if agent has negative sentiment toward controlling faction
        const relEdges = graph.getOutgoingEdges(agentId, 'relates_to');
        for (const relEdge of relEdges) {
          if (relEdge.target === controllingFactionId) {
            const sentiment = (relEdge.properties.sentiment as number) ?? 0;
            if (sentiment < 0) {
              factionModifier = HOSTILE_TERRITORY_PENALTY;
              factionId = controllingFactionId;
              break;
            }
          }
        }
        if (factionModifier !== 0) break;
      }
    }
  }

  const parts: NamedModifierContribution[] = [];
  if (baseModifier !== 0 && terrainType) {
    parts.push({
      kind: 'terrain',
      sourceId: terrainType,
      sourceName: terrainType,
      value: baseModifier,
    });
  }
  if (factionModifier !== 0 && factionId) {
    parts.push({
      kind: 'faction',
      sourceId: factionId,
      sourceName: graph.getNode(factionId)?.name ?? factionId,
      value: factionModifier,
    });
  }

  // Cap total terrain modifier (clamp between -CAP and +CAP), preserving the
  // pre-THR-892 total exactly by trimming the overflow off the last part.
  return clampContributions(parts, TERRAIN_MODIFIER_CAP);
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
  return sumContributions(collectTraitContributions(graph, agentId, stepReach));
}

/** The named traits behind {@link computeTraitBonus} (THR-892). Same walk, same caps. */
export function collectTraitContributions(
  graph: WorldGraph,
  agentId: string,
  stepReach: ReachDomain,
): NamedModifierContribution[] {
  const raw: NamedModifierContribution[] = [];

  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const resolutionBonus = traitNode.properties.resolutionBonus as
      | Partial<Record<ReachDomain, number>> | undefined;
    if (!resolutionBonus) continue;

    const bonus = resolutionBonus[stepReach] ?? 0;
    if (bonus === 0) continue;

    raw.push({
      kind: 'trait',
      sourceId: traitNode.id,
      sourceName: traitNode.name ?? traitNode.id,
      value: Math.min(bonus, TRAIT_PER_BONUS_CAP),
    });
  }

  return capContributions(raw, TRAIT_BONUS_CAP);
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

/**
 * The named nearby presences tilting this step — THR-1243.
 *
 * ## Why this is computed here, and only here
 *
 * An aura is the only resolution modifier whose source is an agent *other than*
 * the one being resolved, which is exactly why it was never wired: `effectAura.ts`
 * shipped complete, with tests, and zero production callers, because there was no
 * obvious per-agent walk to hang it on. Hanging it on the tick loop would have
 * meant a proximity scan over every agent pair every tick — O(agents²) for a
 * number almost none of those agents will consult before it goes stale. So it is
 * resolved *lazily, for one agent, at the moment a step is actually being
 * resolved*, which is the only moment the number is read.
 *
 * ## Two bounds, doing different jobs
 *
 * {@link AURA_STACKING_CAP} bounds how many emitters may speak; `EFFECT_MODIFIER_CAP`
 * bounds how loud the answer may be. Both are needed: the cap alone would let
 * three enormous auras run away, and the clamp alone would let a crowded hex
 * decide a step through sheer attendance.
 *
 * ## Fail-soft (NFP #4)
 *
 * An agent whose position will not resolve — no `located_at`, a location with no
 * hex, a sublocation whose parent is missing — contributes no auras and no error.
 * Standing nowhere the map can name is not a resolution failure; it just means
 * proximity is undefined, so nothing is near.
 */
export function collectAuraContributions(
  graph: WorldGraph,
  agentId: string,
  stepReach: ReachDomain,
): NamedModifierContribution[] {
  const targetPos = resolveAgentPosition(graph, agentId);
  if (!targetPos) return [];

  const nearby = collectAuraEffectsNear(graph, targetPos);
  if (nearby.length === 0) return [];

  const emitters = selectAuraEmitters(
    graph, nearby, agentId, targetPos, stepReach, AURA_STACKING_CAP,
  );

  const raw: NamedModifierContribution[] = [];
  for (const [emitterId, entries] of emitters) {
    // Summed through `resolveAuraModifiers` rather than by adding the entries
    // here, so the per-emitter line and any whole-list total are produced by the
    // same aggregator and cannot drift apart.
    const value = resolveAuraModifiers(graph, entries, agentId, targetPos)[stepReach] ?? 0;
    if (value === 0) continue;

    raw.push({
      kind: 'aura',
      sourceId: emitterId,
      sourceName: graph.getNode(emitterId)?.name ?? emitterId,
      value,
    });
  }

  return clampContributions(raw, EFFECT_MODIFIER_CAP);
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
  overrideCtx?: RuleOverrideContext,
): ModifierBreakdown {
  // THR-1241: `encounter_reach_override` owns this site. A step names the reach
  // it tests; a swap says "when this step would test X, test Y instead" — an
  // amulet that lets you talk your way past what you would have had to fight.
  //
  // Applied here rather than at the step, because this is where the reach stops
  // being a label and starts selecting which capability answers. Every modifier
  // below then resolves against the substituted reach, which is the point: a
  // swap that changed the test but not what your gear counted toward would read
  // as a bug in every direction.
  const swap = overrideCtx !== undefined
    ? readReachOverride(overrideCtx, agentId, 'resolutionModifiers')
    : null;
  if (swap && swap.from === stepReach) stepReach = swap.to;

  const sphereAlignmentBonus = computeSphereAlignmentBonus(graph, agentId, encounterSphereAffinity);
  const terrainContributions = collectTerrainContributions(graph, agentId, locationId);
  const terrainModifier = sumContributions(terrainContributions);
  const divineInterventionModifier = computeDivineInterventionModifier(graph, agentId);

  // Check if agent has any attachments using the new effects[] format.
  // If so, use the generic effect resolver for equipment+trait modifiers.
  // If not, fall back to legacy reachBonus/resolutionBonus path.
  let effectModifier = 0;
  let effectResult: EffectModifierResult | undefined;

  if (hasEffectsFormat(graph, agentId)) {
    // New path: resolve all effects via the generic effect system
    const ctx = buildPredicateContext(graph, agentId, stepReach);
    effectResult = resolveEffectModifiers(graph, agentId, stepReach, ctx, effectStates);
    effectModifier = effectResult.reachModifiers[stepReach] ?? 0;
  }
  // Legacy modifiers contribute on both paths — attachments without effects[]
  // still carry reachBonus/resolutionBonus.
  const equipmentContributions = collectEquipmentContributions(graph, agentId, stepReach);
  const traitContributions = collectTraitContributions(graph, agentId, stepReach);
  const equipmentModifier = sumContributions(equipmentContributions);
  const traitBonus = sumContributions(traitContributions);

  // Rule override: modify_rules encounter_difficulty_modifier shifts the agent's effective difficulty
  const ruleModifier = getActiveRuleOverride(graph, agentId, 'encounter_difficulty_modifier', effectStates);

  // Aura: nearby agents' proximity effects, resolved lazily here (THR-1243)
  const auraContributions = collectAuraContributions(graph, agentId, stepReach);
  const auraModifier = sumContributions(auraContributions);

  const totalModifier =
    sphereAlignmentBonus +
    equipmentModifier +
    terrainModifier +
    traitBonus +
    divineInterventionModifier +
    effectModifier +
    ruleModifier +
    auraModifier;

  // THR-892 — the named causes, in the same order the totals are summed above.
  // `effectResult.contributions` is already named and already reach-filtered, so
  // it is projected rather than recomputed; inactive entries are dropped because
  // they contributed nothing to `effectModifier`.
  const contributions: NamedModifierContribution[] = [
    ...(sphereAlignmentBonus !== 0 && encounterSphereAffinity
      ? [{
          kind: 'sphere' as const,
          sourceId: encounterSphereAffinity,
          sourceName: encounterSphereAffinity,
          value: sphereAlignmentBonus,
        }]
      : []),
    ...equipmentContributions,
    ...terrainContributions,
    ...traitContributions,
    ...auraContributions,
    ...(effectResult?.contributions ?? [])
      .filter((c) => c.active && c.reach === stepReach && c.value !== 0)
      .map((c) => ({
        kind: 'effect' as const,
        sourceId: c.attachmentId,
        sourceName: c.attachmentName,
        value: c.value,
      })),
    ...(divineInterventionModifier !== 0
      ? [{
          kind: 'divine' as const,
          sourceId: 'divine_attention',
          sourceName: 'divine attention',
          value: divineInterventionModifier,
        }]
      : []),
    ...(ruleModifier !== 0
      ? [{
          kind: 'rule' as const,
          sourceId: 'encounter_difficulty_modifier',
          sourceName: 'an altered rule',
          value: ruleModifier,
        }]
      : []),
  ];

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
    auraModifier,
    totalModifier,
    contributions,
  };
}
