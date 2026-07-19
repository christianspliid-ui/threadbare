/**
 * Ascendant Expression Cards — resolution helpers (THR-508).
 *
 * Generic divine verbs the player-god unlocks early via Ascendant Beats. The
 * verb is universal; the magic it produces is flavored by the ascendant's
 * primary domain + sphere (two-domain lock, THR-503).
 *
 * This module ships `imbue` — the one card from the §4.4 toolkit that composes
 * the already-shipped THR-509 primitives (`pickSphereFlavoredEffect`) and the
 * existing effect-walker (`collectAttachmentEffects` reads `properties.effects`
 * off possessed artifacts) end-to-end, with no new consumer subsystem.
 *
 * `consecrate` / `bestow` / `anoint` are split into their own issues — each
 * needs genuinely-new consumer wiring (location-sustained spawn bridge / agent
 * casting / a `chosen`-status power consumer) that nothing currently provides.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP compliance:
 *   #1 Tunability: magnitudes live in src/data/ascendant-expression-constants.ts
 *      and the THR-509 SPHERE_EFFECT_TABLE.
 *   #2 Inspectability: emits a structured `ascendant_expression` trace.
 *   #3 Determinism: the only randomness is `pickSphereFlavoredEffect`, fed an
 *      injected seeded PRNG by the caller.
 *   #4 Fail-soft: unknown ascendant / artifact / sphere → no-op + warn, never throw.
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';
import type { AttachmentEffect } from '../types/effects';
import type { AscendantProperties } from '../types/influence';
import { pickSphereFlavoredEffect, applyChosenStatusGrant } from './ascendantPrimitives';
import type { ChosenPower } from './ascendantPrimitives';
import { resolveLocationToHex } from './encounterAwareness';
import { getAgentsAtLocation } from './graphQueries';
import {
  BESTOW_REACH_BONUS,
  BESTOW_QUINTESSENCE_REGEN,
  BESTOW_MIN_AWARENESS,
  TRAP_SPRUNG_TEMPLATE_ID,
  TRAP_SEED_PRIORITY,
  TRAP_SEED_DELAY_TICKS,
} from '../data/ascendant-expression-constants';
import { emitTrace } from './traceBuffer';

/**
 * Thread `awareness` tiers in ascending order (the thread-edge field
 * `awareness?: 'unaware' | 'intuition' | 'faith' | 'communion'`). A missing
 * value is treated as `unaware` (rank 0).
 */
const AWARENESS_ORDER = ['unaware', 'intuition', 'faith', 'communion'] as const;
type AwarenessTier = (typeof AWARENESS_ORDER)[number];

function awarenessRank(tier: string | undefined): number {
  const i = AWARENESS_ORDER.indexOf(tier as AwarenessTier);
  return i < 0 ? 0 : i;
}

/** Trace category for expression-card resolution. Registered in TRACE_CATEGORIES. */
export const ASCENDANT_EXPRESSION_TRACE_CATEGORY = 'ascendant_expression' as const;

/**
 * Read the ascendant's primary sphere from its persisted sphere alignment.
 * Fail-soft: returns undefined when the node is missing or carries no alignment.
 */
export function getAscendantPrimarySphere(
  graph: WorldGraph,
  ascendantId: string,
): SphereName | undefined {
  const node = graph.getNode(ascendantId);
  const props = node?.properties as Partial<AscendantProperties> | undefined;
  return props?.sphereAlignment?.primary;
}

export interface ImbueItemResult {
  readonly success: boolean;
  /** The sphere-flavored effect appended to the artifact (null on no-op). */
  readonly effect: AttachmentEffect | null;
  /** Why the action no-opped, when it did. */
  readonly failSoft?: 'missing_artifact' | 'not_artifact' | 'missing_sphere' | 'no_effect_for_sphere';
}

/**
 * Imbue an artifact with a sphere-flavored power.
 *
 * Reads the ascendant's primary sphere, picks a sphere-flavored effect via the
 * THR-509 `pickSphereFlavoredEffect` primitive, and appends it to the target
 * artifact node's `effects` array. The effect is read by `collectAttachmentEffects`
 * for whichever agent holds the artifact (`possesses` edge), so the imbued power
 * actually applies — no new consumer needed.
 *
 * @param graph        World graph (mutated in place).
 * @param ascendantId  The player-god firing the verb (sphere source).
 * @param artifactId   Target artifact node.
 * @param rng          Injected seeded PRNG (`() => number` in [0,1)) for the pick.
 * @param tick         Current tick (for the trace).
 */
export function applyImbueItem(
  graph: WorldGraph,
  ascendantId: string,
  artifactId: string,
  rng: () => number,
  tick: number,
): ImbueItemResult {
  const artifact = graph.getNode(artifactId);
  if (!artifact) {
    emitNoOp(ascendantId, artifactId, 'missing_artifact', tick);
    return { success: false, effect: null, failSoft: 'missing_artifact' };
  }
  if (artifact.type !== 'artifact') {
    emitNoOp(ascendantId, artifactId, 'not_artifact', tick);
    return { success: false, effect: null, failSoft: 'not_artifact' };
  }

  const sphere = getAscendantPrimarySphere(graph, ascendantId);
  if (!sphere) {
    emitNoOp(ascendantId, artifactId, 'missing_sphere', tick);
    return { success: false, effect: null, failSoft: 'missing_sphere' };
  }

  const effect = pickSphereFlavoredEffect(sphere, rng, tick);
  if (!effect) {
    emitNoOp(ascendantId, artifactId, 'no_effect_for_sphere', tick);
    return { success: false, effect: null, failSoft: 'no_effect_for_sphere' };
  }

  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifactId, {
    properties: { ...artifact.properties, effects: [...existing, effect] },
  });

  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'imbue_item',
    summary: `imbue: ${artifact.name ?? artifactId} gains ${sphere}-flavored power (${describeEffect(effect)})`,
    ascendantId,
    artifactId,
    sphere,
    effect,
  } as never);

  return { success: true, effect };
}

function describeEffect(effect: AttachmentEffect): string {
  if (effect.type === 'passive' && 'reach' in effect) {
    return `+${(effect as { value: number }).value} ${(effect as { reach: string }).reach}`;
  }
  return effect.type;
}

function emitNoOp(
  ascendantId: string,
  artifactId: string,
  reason: NonNullable<ImbueItemResult['failSoft']>,
  tick: number,
): void {
  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'imbue_item',
    summary: `imbue no-op: ${reason} (artifact ${artifactId})`,
    ascendantId,
    artifactId,
    failSoft: reason,
  } as never);
}

// ═══════════════════════════════════════════════════════════════════════════
// THR-512: Bestow Power
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Read the ascendant's primary reach (domain) — the highest-affinity entry in
 * the persisted `domainAffinities` (THR-503). Fail-soft: returns undefined when
 * the node is missing or carries no affinities. Ties resolve to the first reach
 * encountered (deterministic over a stable affinities object).
 */
export function getAscendantPrimaryReach(
  graph: WorldGraph,
  ascendantId: string,
): ReachDomain | undefined {
  const node = graph.getNode(ascendantId);
  const props = node?.properties as Partial<AscendantProperties> | undefined;
  const affinities = props?.domainAffinities;
  if (!affinities) return undefined;
  let best: ReachDomain | undefined;
  let bestVal = -Infinity;
  for (const [reach, val] of Object.entries(affinities)) {
    if (typeof val === 'number' && val > bestVal) {
      bestVal = val;
      best = reach as ReachDomain;
    }
  }
  return best;
}

export interface BestowPowerResult {
  readonly success: boolean;
  /** Id of the created "divine gift" artifact (null on no-op). */
  readonly artifactId: string | null;
  /** The effects placed on the gift (empty on no-op). */
  readonly effects: readonly AttachmentEffect[];
  /** Why the action no-opped, when it did. */
  readonly failSoft?:
    | 'missing_agent'
    | 'not_agent'
    | 'no_thread'
    | 'insufficient_awareness'
    | 'missing_reach';
}

/**
 * Bestow divine power on a threaded agent.
 *
 * Resolution path (option (a), plan §4.4 — "cheapest, keeps it wired"): mint a
 * "divine gift" artifact carrying two `AttachmentEffect`s and bind it to the
 * agent with a `possesses` edge. Both effects are read by systems that already
 * ship, so the bestowed power genuinely applies — no new consumer subsystem:
 *   1. a `passive` reach bonus in the ascendant's primary domain — summed by
 *      `collectAttachmentEffects` / `effectResolver` into the holder's reach
 *      modifiers;
 *   2. a per-tick `resource_manipulate` quintessence restore — applied each tick
 *      by `tickResourceManipulate` (effectTick.ts), clamped to `quintessenceMax`.
 *
 * Gated at resolution against the thread edge's `awareness`: the mortal must
 * perceive the connection at least as `BESTOW_MIN_AWARENESS` (faith). Fail-soft:
 * a missing agent / thread / reach, or insufficient awareness, no-ops + warns,
 * never throws.
 *
 * @param graph        World graph (mutated in place).
 * @param ascendantId  The player-god firing the verb (reach + thread source).
 * @param agentId      Target threaded agent node.
 * @param tick         Current tick (artifact id + trace).
 */
export function applyBestowPower(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  tick: number,
): BestowPowerResult {
  const agent = graph.getNode(agentId);
  if (!agent) {
    emitBestowNoOp(ascendantId, agentId, 'missing_agent', tick);
    return { success: false, artifactId: null, effects: [], failSoft: 'missing_agent' };
  }
  if (agent.type !== 'actor') {
    emitBestowNoOp(ascendantId, agentId, 'not_agent', tick);
    return { success: false, artifactId: null, effects: [], failSoft: 'not_agent' };
  }

  // Awareness lives on the thread edge (ascendant → mortal), not a node property.
  const threadEdge = graph
    .getOutgoingEdges(ascendantId, 'thread')
    .find((e) => e.target === agentId);
  if (!threadEdge) {
    emitBestowNoOp(ascendantId, agentId, 'no_thread', tick);
    return { success: false, artifactId: null, effects: [], failSoft: 'no_thread' };
  }
  const awareness = threadEdge.properties.awareness as string | undefined;
  if (awarenessRank(awareness) < awarenessRank(BESTOW_MIN_AWARENESS)) {
    emitBestowNoOp(ascendantId, agentId, 'insufficient_awareness', tick);
    return { success: false, artifactId: null, effects: [], failSoft: 'insufficient_awareness' };
  }

  const reach = getAscendantPrimaryReach(graph, ascendantId);
  if (!reach) {
    emitBestowNoOp(ascendantId, agentId, 'missing_reach', tick);
    return { success: false, artifactId: null, effects: [], failSoft: 'missing_reach' };
  }

  const effects: AttachmentEffect[] = [
    { type: 'passive', reach, value: BESTOW_REACH_BONUS },
    {
      type: 'resource_manipulate',
      resource: 'quintessence',
      target: 'self',
      amount: BESTOW_QUINTESSENCE_REGEN,
      mode: 'per_tick',
    },
  ];

  const artifactId = `bestow_${ascendantId}_${agentId}_${tick}`;
  graph.addNode({
    id: artifactId,
    type: 'artifact',
    name: 'Divine Gift',
    properties: {
      effects,
      source: 'bestow_power',
      bestowedBy: ascendantId,
      acquiredTick: tick,
    },
  });
  graph.addEdge({
    id: `${artifactId}_edge`,
    source: agentId,
    target: artifactId,
    type: 'possesses',
    properties: { modifiers: {}, grants: [], tags: ['divine_gift'] },
  });

  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'bestow_power',
    summary: `bestow: ${agent.name ?? agentId} receives a divine gift (+${BESTOW_REACH_BONUS} ${reach}, +${BESTOW_QUINTESSENCE_REGEN}/tick quintessence)`,
    ascendantId,
    agentId,
    artifactId,
    reach,
  } as never);

  return { success: true, artifactId, effects };
}

function emitBestowNoOp(
  ascendantId: string,
  agentId: string,
  reason: NonNullable<BestowPowerResult['failSoft']>,
  tick: number,
): void {
  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'bestow_power',
    summary: `bestow no-op: ${reason} (agent ${agentId})`,
    ascendantId,
    agentId,
    failSoft: reason,
  } as never);
}

// ═══════════════════════════════════════════════════════════════════════════
// THR-513: Anoint Faction
// ═══════════════════════════════════════════════════════════════════════════

export interface AnointFactionResult {
  readonly success: boolean;
  /** The chosen power recorded on the faction (null when the (actor × domain)
   *  lookup had no entry — the faction is still flagged chosen). */
  readonly power: ChosenPower | null;
  /** True when the faction already carried a chosen status (latest patron wins). */
  readonly alreadyChosen: boolean;
  /** Why the action no-opped, when it did. */
  readonly failSoft?: 'missing_faction' | 'not_faction' | 'missing_reach';
}

/**
 * Anoint a threaded faction as the ascendant's **chosen faction**.
 *
 * Reads the ascendant's primary reach (two-domain lock, THR-503) and stamps a
 * `chosen` status on the faction node via the shipped THR-509 primitive
 * (`applyChosenStatusGrant`), which records the (nodeType × domain) power from
 * `CHOSEN_POWER_TABLE`. The recorded power is no longer dead content: the
 * per-tick consumer `phaseChosenFactionPowers` (chosenFactionPowers.ts) reads
 * `faction.properties.chosen.power` and grants the faction's members a
 * power-keyed reputation gain each tick — so anointing genuinely strengthens the
 * faction through the existing reputation system.
 *
 * Fail-soft: a missing faction, a non-faction target, or a missing ascendant
 * reach no-ops + warns, never throws.
 *
 * @param graph        World graph (mutated in place).
 * @param ascendantId  The player-god firing the verb (reach source + patron).
 * @param factionId    Target faction node (`actor` with `actorType: 'faction'`).
 * @param tick         Current tick (status stamp + trace).
 */
export function applyAnointFaction(
  graph: WorldGraph,
  ascendantId: string,
  factionId: string,
  tick: number,
): AnointFactionResult {
  const faction = graph.getNode(factionId);
  if (!faction) {
    emitAnointNoOp(ascendantId, factionId, 'missing_faction', tick);
    return { success: false, power: null, alreadyChosen: false, failSoft: 'missing_faction' };
  }
  if (faction.type !== 'actor' || faction.properties.actorType !== 'faction') {
    emitAnointNoOp(ascendantId, factionId, 'not_faction', tick);
    return { success: false, power: null, alreadyChosen: false, failSoft: 'not_faction' };
  }

  const reach = getAscendantPrimaryReach(graph, ascendantId);
  if (!reach) {
    emitAnointNoOp(ascendantId, factionId, 'missing_reach', tick);
    return { success: false, power: null, alreadyChosen: false, failSoft: 'missing_reach' };
  }

  const grant = applyChosenStatusGrant(graph, factionId, reach, ascendantId, tick);

  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'anoint_faction',
    summary: `anoint: ${faction.name ?? factionId} becomes a chosen faction (${reach} → ${grant.power?.label ?? 'no-power'})`,
    ascendantId,
    factionId,
    reach,
    powerId: grant.power?.id ?? null,
    alreadyChosen: grant.alreadyChosen,
  } as never);

  return { success: true, power: grant.power, alreadyChosen: grant.alreadyChosen };
}

function emitAnointNoOp(
  ascendantId: string,
  factionId: string,
  reason: NonNullable<AnointFactionResult['failSoft']>,
  tick: number,
): void {
  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'anoint_faction',
    summary: `anoint no-op: ${reason} (faction ${factionId})`,
    ascendantId,
    factionId,
    failSoft: reason,
  } as never);
}

// ═══════════════════════════════════════════════════════════════════════════
// THR-605 Slice 4: Plant Trap
// ═══════════════════════════════════════════════════════════════════════════

export interface PlantTrapResult {
  readonly success: boolean;
  /** The seed planted (null on no-op). */
  readonly seedId: string | null;
  /** The victim the trap was seeded against (null on no-op). */
  readonly victimId: string | null;
  /** Why the plant no-opped, when it did. */
  readonly failSoft?: 'missing_sublocation' | 'no_target_present';
}

/**
 * Pick the intended victim of a trap planted in `sublocationId`, deterministically.
 * Prefers an individual actor located directly at the sublocation; failing that,
 * broadens to any individual actor standing on the sublocation's hex (hex-granular
 * awareness, the load-bearing rule). Excludes the acting ascendant so a god never
 * springs its own snare. Ties resolve by ascending node id — deterministic (NFP #3).
 */
function selectTrapVictim(
  graph: WorldGraph,
  ascendantId: string,
  sublocationId: string,
): GraphNode | undefined {
  const isVictim = (n: GraphNode): boolean =>
    n.id !== ascendantId && n.properties.actorType === 'individual';

  // Tier 1: agents standing directly in the trapped sublocation.
  const direct = getAgentsAtLocation(graph, sublocationId).filter(isVictim);
  if (direct.length > 0) {
    return direct.sort((a, b) => a.id.localeCompare(b.id))[0];
  }

  // Tier 2: broaden to the sublocation's hex.
  const hex = resolveLocationToHex(graph, sublocationId);
  if (!hex) return undefined;
  const onHex: GraphNode[] = [];
  for (const actor of graph.getNodesByType('actor')) {
    if (!isVictim(actor)) continue;
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    if (!locEdges.length) continue;
    const actorHex = resolveLocationToHex(graph, locEdges[0].target);
    if (actorHex && actorHex.col === hex.col && actorHex.row === hex.row) {
      onHex.push(actor);
    }
  }
  if (onHex.length === 0) return undefined;
  return onHex.sort((a, b) => a.id.localeCompare(b.id))[0];
}

/**
 * Plant a concealed snare in a sublocation (THR-605 Slice 4).
 *
 * The encounter-seed substrate has no hex-arrival gate — `evaluateEncounterSeeds`
 * spawns a seed's template for its `targetAgentId` as soon as it is eligible,
 * wherever that agent stands. So rather than the (unreachable) "fires on the next
 * agent to arrive", this seeds the authored `encounter.trap.sprung` beat against
 * the intended victim already present at the sublocation (or its hex) at plant
 * time. That seed is genuinely consumed: `evaluateEncounterSeeds` pulls the victim
 * into a real, failable negative encounter whose harm lands via its `condition`-
 * weighted reward pools — the same seed → spawn path the faction governance verbs
 * use. `state.pendingEncounterSeeds` is mutated in place (mirrors `plantSeed` in
 * factionGovernanceVerbs.ts).
 *
 * Fail-soft (NFP #4): a missing sublocation or an empty room plants nothing and
 * still resolves as success — a god may set a snare where no prey yet walks.
 *
 * @param state         Live GameState (mutated: pendingEncounterSeeds).
 * @param ascendantId   The player-god planting the trap (never the victim).
 * @param sublocationId Target sublocation node.
 * @param tick          Current tick (eligibility base + trace + seed id).
 */
export function applyPlantTrap(
  state: GameState,
  ascendantId: string,
  sublocationId: string,
  tick: number,
): PlantTrapResult {
  const sublocation = state.graph.getNode(sublocationId);
  if (!sublocation) {
    emitPlantTrapNoOp(ascendantId, sublocationId, 'missing_sublocation', tick);
    return { success: false, seedId: null, victimId: null, failSoft: 'missing_sublocation' };
  }

  const victim = selectTrapVictim(state.graph, ascendantId, sublocationId);
  if (!victim) {
    emitPlantTrapNoOp(ascendantId, sublocationId, 'no_target_present', tick);
    return { success: true, seedId: null, victimId: null, failSoft: 'no_target_present' };
  }

  const seedId = `trap_${sublocationId}_${victim.id}_${tick}`;
  const seed: PendingEncounterSeed = {
    seedId,
    sourceEncounterId: `plant_trap_${sublocationId}_${tick}`,
    sourceReactionId: 'plant_trap',
    templateId: TRAP_SPRUNG_TEMPLATE_ID,
    targetAgentId: victim.id,
    eligibleAfterTick: tick + TRAP_SEED_DELAY_TICKS,
    priority: TRAP_SEED_PRIORITY,
    seedLabel: 'a hidden snare',
    plantedTick: tick,
  };
  state.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), seed];

  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'plant_trap',
    summary: `plant_trap: snare set in ${sublocation.name ?? sublocationId} → springs on ${victim.name ?? victim.id}`,
    ascendantId,
    sublocationId,
    victimId: victim.id,
    seedId,
  } as never);

  return { success: true, seedId, victimId: victim.id };
}

function emitPlantTrapNoOp(
  ascendantId: string,
  sublocationId: string,
  reason: NonNullable<PlantTrapResult['failSoft']>,
  tick: number,
): void {
  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'plant_trap',
    summary: `plant_trap no-op: ${reason} (sublocation ${sublocationId})`,
    ascendantId,
    sublocationId,
    failSoft: reason,
  } as never);
}
