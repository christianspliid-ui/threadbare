/**
 * Ascendant Action Primitives — reusable resolvers (THR-509).
 *
 * Four general-purpose building blocks the early expression cards (THR-508:
 * imbue / consecrate / bestow / anoint) and many future ascendant actions sit
 * on, built *before* the cards so they are cheap to author:
 *
 *   1. relic_upkeep_substitute  — `getUpkeepStatus` (consumed by phaseControlEffects)
 *   2. co_located_thread_aura   — `applyCoLocatedThreadAura`
 *   3. chosen_status_grant      — `applyChosenStatusGrant` + `CHOSEN_POWER_TABLE`
 *   4. sphere_flavored_effect   — `pickSphereFlavoredEffect` + `SPHERE_EFFECT_TABLE`
 *
 * All four are pure (graph mutation aside) and unit-tested in isolation.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP compliance:
 *   #1 Tunability: every magnitude/value is a named constant below.
 *   #2 Inspectability: each resolver emits a structured trace.
 *   #3 Determinism: only `pickSphereFlavoredEffect` randomizes, via an injected
 *      seeded PRNG (`() => number`); the rest are arithmetic.
 *   #4 Fail-soft: unknown node / sphere / artifact → no-op + warn, never throw.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge, NodeType } from '../types/graph';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { AttachmentEffect } from '../types/effects';
import type { ControlEffect } from '../types/controlEffect';
import type { CoLocatedThreadAuraSpec } from '../types/ascendantPrimitives';
import { CO_LOCATED_AURA_DEFAULT_FIELD, CONSECRATE_DEVOTION_PER_TICK } from '../types/ascendantPrimitives';
import { emitTrace } from './traceBuffer';

// Re-export the shared spec + tuning constants so consumers (cards, tests,
// phaseControlEffects) have a single import site for the primitive toolkit.
export type { CoLocatedThreadAuraSpec };
export { CO_LOCATED_AURA_DEFAULT_FIELD, CONSECRATE_DEVOTION_PER_TICK };

// ─── Constants (NFP #1) ───────────────────────────────────────────────────────

/** Trace category shared by all four primitives. */
export const ASCENDANT_PRIMITIVE_TRACE_CATEGORY = 'ascendant_primitive' as const;

/** Default reach-bonus magnitude granted by a sphere-flavored passive effect. */
export const SPHERE_FLAVOR_PASSIVE_VALUE = 2;

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 1: relic_upkeep_substitute
// A sustained control effect whose per-tick cost is waived while a designated
// artifact exists. The minting action (a consumer) creates the permanent
// artifact and sets `upkeepArtifactId`; this helper is what phaseControlEffects
// consults each tick. Kept here (not inline in the phase) so it is testable in
// isolation.
// ═══════════════════════════════════════════════════════════════════════════

export type UpkeepStatus =
  /** No sustaining relic designated — pay `perTickCost` as normal. */
  | 'no_relic'
  /** Relic exists — `perTickCost` is waived this tick. */
  | 'waived'
  /** Relic was designated but no longer exists — the effect must lapse. */
  | 'relic_lost';

/**
 * Classify a control effect's upkeep against its sustaining relic.
 * Fail-soft: a missing `upkeepArtifactId` simply means `no_relic`.
 */
export function getUpkeepStatus(effect: ControlEffect, graph: WorldGraph): UpkeepStatus {
  if (!effect.upkeepArtifactId) return 'no_relic';
  return graph.getNode(effect.upkeepArtifactId) ? 'waived' : 'relic_lost';
}

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 2: co_located_thread_aura
// A location-scoped per-tick effect that iterates every threaded agent
// co-located with a target location and applies a small mutation to its thread
// edge. First consumer: consecrate's faith-spread (+devotion toward tier
// promotion). Carried on ControlEffect.perTickThreadAuras and applied by
// phaseControlEffects.
// ═══════════════════════════════════════════════════════════════════════════

export interface CoLocatedThreadAuraResult {
  /** Threaded agents whose thread edge was mutated this application. */
  readonly touchedAgentIds: readonly string[];
  /** Thread-edge field that was advanced. */
  readonly threadField: string;
  /** Amount applied per agent. */
  readonly magnitude: number;
}

/**
 * Apply a co-located thread aura: for every agent standing on `locationId`
 * (and, by default, on its contained sublocations) who holds a `thread` edge
 * from `ascendantId`, add `spec.magnitude` to the chosen thread field.
 *
 * Determinism: arithmetic only. Fail-soft: missing location → no-op + warn;
 * an unknown thread field is treated as 0 before the add.
 */
export function applyCoLocatedThreadAura(
  graph: WorldGraph,
  locationId: string,
  ascendantId: string,
  spec: CoLocatedThreadAuraSpec,
  tick: number,
): CoLocatedThreadAuraResult {
  const threadField = spec.threadField ?? CO_LOCATED_AURA_DEFAULT_FIELD;
  const includeSublocations = spec.includeSublocations ?? true;
  const empty: CoLocatedThreadAuraResult = { touchedAgentIds: [], threadField, magnitude: spec.magnitude };

  const location = graph.getNode(locationId);
  if (!location) {
    emitTrace({
      tick,
      category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
      type: 'co_located_thread_aura',
      summary: `co_located_thread_aura no-op: location ${locationId} not found`,
      locationId,
      ascendantId,
      touchedCount: 0,
      failSoft: 'missing_location',
    } as never);
    return empty;
  }

  // Collect the location + its contained sublocations (three-tier model).
  const locationIds: string[] = [locationId];
  if (includeSublocations) {
    for (const edge of graph.getOutgoingEdges(locationId, 'contains')) {
      locationIds.push(edge.target);
    }
  }

  // Agents standing at any of those nodes.
  const agentIds = new Set<string>();
  for (const lid of locationIds) {
    for (const edge of graph.getIncomingEdges(lid, 'located_at')) {
      agentIds.add(edge.source);
    }
  }

  // Index this ascendant's threads by mortal id.
  const threadByMortal = new Map<string, GraphEdge>();
  for (const edge of graph.getOutgoingEdges(ascendantId, 'thread')) {
    threadByMortal.set(edge.target, edge);
  }

  const touchedAgentIds: string[] = [];
  for (const agentId of agentIds) {
    const edge = threadByMortal.get(agentId);
    if (!edge) continue;
    const current = (edge.properties[threadField] as number) ?? 0;
    graph.updateEdge(edge.id, {
      properties: { ...edge.properties, [threadField]: current + spec.magnitude },
    });
    touchedAgentIds.push(agentId);
  }

  emitTrace({
    tick,
    category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
    type: 'co_located_thread_aura',
    summary: `co_located_thread_aura: +${spec.magnitude} ${threadField} to ${touchedAgentIds.length} thread(s) at ${locationId}`,
    locationId,
    ascendantId,
    threadField,
    magnitude: spec.magnitude,
    touchedCount: touchedAgentIds.length,
  } as never);

  return { touchedAgentIds, threadField, magnitude: spec.magnitude };
}

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 3: chosen_status_grant
// Set a typed `chosen` status flag on a node and record a power payload picked
// from a (nodeType × ascendant domain) lookup table. First consumer: anoint
// (faction — faction nodes are `actor` type with actorType 'faction').
// ═══════════════════════════════════════════════════════════════════════════

/** A scaffolded "chosen" power descriptor. The full mechanical payload is the
 *  consuming card's concern; this primitive selects and records it. */
export interface ChosenPower {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
}

/** Status stored on `node.properties.chosen` once granted. */
export interface ChosenStatus {
  readonly byAscendantId: string;
  readonly domain: ReachDomain;
  readonly grantedTick: number;
  /** Selected power, or null when the lookup had no (nodeType × domain) entry. */
  readonly power: ChosenPower | null;
}

/**
 * (nodeType × ascendant domain) → power scaffold.
 *
 * Factions are `actor` nodes; the first consumer (anoint) reads the `actor`
 * row. Reaches without an entry resolve to a null power (fail-soft) — the node
 * is still flagged chosen. Extend this table as cards are authored (THR-508).
 */
export const CHOSEN_POWER_TABLE: Partial<Record<NodeType, Partial<Record<ReachDomain, ChosenPower>>>> = {
  actor: {
    iron: {
      id: 'chosen.iron.leadership_aura',
      label: 'Banner of the Chosen',
      summary: 'A martial faction rallies under a chosen banner — a leadership aura over its members.',
    },
    heart: {
      id: 'chosen.heart.faith_spread',
      label: 'Hallowed Devotion',
      summary: 'A devotional faction radiates faith — its presence spreads the ascendant’s creed.',
    },
    gold: {
      id: 'chosen.gold.reputation',
      label: 'Favoured Charter',
      summary: 'A mercantile faction trades under divine favour — standing and reputation accrue faster.',
    },
    shadow: {
      id: 'chosen.shadow.veiled_reach',
      label: 'Veiled Mandate',
      summary: 'A clandestine faction operates under cover of the chosen — its reach goes unseen.',
    },
  },
};

export interface ChosenStatusGrantResult {
  readonly granted: boolean;
  readonly nodeId: string;
  /** The power selected from the table (null when none matched). */
  readonly power: ChosenPower | null;
  /** True when the node already carried a chosen status before this grant. */
  readonly alreadyChosen: boolean;
}

/**
 * Flag `nodeId` as chosen by `ascendantId` and record the (nodeType × domain)
 * power. Re-granting overwrites the prior status (the latest patron wins) and
 * reports `alreadyChosen`. Fail-soft: missing node → no-op + warn.
 */
export function applyChosenStatusGrant(
  graph: WorldGraph,
  nodeId: string,
  domain: ReachDomain,
  byAscendantId: string,
  tick: number,
): ChosenStatusGrantResult {
  const node = graph.getNode(nodeId);
  if (!node) {
    emitTrace({
      tick,
      category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
      type: 'chosen_status_grant',
      summary: `chosen_status_grant no-op: node ${nodeId} not found`,
      nodeId,
      domain,
      byAscendantId,
      failSoft: 'missing_node',
    } as never);
    return { granted: false, nodeId, power: null, alreadyChosen: false };
  }

  const alreadyChosen = node.properties.chosen != null;
  const power = CHOSEN_POWER_TABLE[node.type]?.[domain] ?? null;
  const status: ChosenStatus = { byAscendantId, domain, grantedTick: tick, power };

  graph.updateNode(nodeId, { properties: { ...node.properties, chosen: status } });

  emitTrace({
    tick,
    category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
    type: 'chosen_status_grant',
    summary: `chosen_status_grant: ${nodeId} chosen (${node.type}×${domain}) → ${power?.id ?? 'no-power'}`,
    nodeId,
    nodeType: node.type,
    domain,
    byAscendantId,
    powerId: power?.id ?? null,
    alreadyChosen,
    failSoft: power ? undefined : 'no_power_for_type_domain',
  } as never);

  return { granted: true, nodeId, power, alreadyChosen };
}

// ═══════════════════════════════════════════════════════════════════════════
// Primitive 4: sphere_flavored_effect
// Given a sphere, pick a concrete effect from a sphere→effect table so one verb
// (e.g. imbue) yields domain-appropriate magic. Pure helper used at action
// resolution.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * sphere → candidate effects scaffold. One verb (imbue) reads the row for the
 * ascendant's sphere and picks via seeded PRNG. Spheres without an entry return
 * null (fail-soft) — extend as cards are authored.
 */
export const SPHERE_EFFECT_TABLE: Partial<Record<SphereName, readonly AttachmentEffect[]>> = {
  force: [{ type: 'passive', reach: 'iron', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  matter: [{ type: 'passive', reach: 'stone', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  energy: [{ type: 'passive', reach: 'eye', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  life: [{ type: 'passive', reach: 'heart', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  mind: [{ type: 'passive', reach: 'veil', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  spirit: [{ type: 'passive', reach: 'star', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  light: [{ type: 'passive', reach: 'gold', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
  darkness: [{ type: 'passive', reach: 'shadow', value: SPHERE_FLAVOR_PASSIVE_VALUE }],
};

/**
 * Pick a sphere-flavored effect for `sphere` using the injected seeded PRNG.
 * `rng()` must return a float in [0, 1) (e.g. `mulberry32(seed)` from
 * src/lib/prng.ts). Fail-soft: unknown / empty sphere → null + warn.
 */
export function pickSphereFlavoredEffect(
  sphere: SphereName,
  rng: () => number,
  tick = 0,
): AttachmentEffect | null {
  const pool = SPHERE_EFFECT_TABLE[sphere];
  if (!pool || pool.length === 0) {
    emitTrace({
      tick,
      category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
      type: 'sphere_flavored_effect',
      summary: `sphere_flavored_effect no-op: no effects for sphere ${sphere}`,
      sphere,
      failSoft: 'no_effects_for_sphere',
    } as never);
    return null;
  }

  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  const picked = pool[index];

  emitTrace({
    tick,
    category: ASCENDANT_PRIMITIVE_TRACE_CATEGORY,
    type: 'sphere_flavored_effect',
    summary: `sphere_flavored_effect: ${sphere} → ${picked.type} (${index + 1}/${pool.length})`,
    sphere,
    effectType: picked.type,
    index,
    poolSize: pool.length,
  } as never);

  return picked;
}
