/**
 * Phase: Army Supply (THR-626) — Flow Web P2.
 *
 * Each scan, every army's larder moves toward what its supply line delivers. A
 * line is a *derived path* over the conduits the trade web already maintains, so
 * severing a trade route — or letting bandits sit on it — is felt at the front
 * within a game day. That is the whole design intent: an economic act with a
 * military consequence, a Shadow/Gold answer to an Iron problem.
 *
 * Anomalies are the content; equilibrium is silence. A `supplied` army produces
 * nothing at all. A `strained` one may forage (which pushes the hunger outward
 * onto the countryside); a `starving` one may mutiny; a `starving` besieger may
 * see its siege lifted. Each materializes as a `PendingEncounterSeed` through the
 * shipped seed system — the web proposes, the curator disposes — exactly as
 * `routeEvents.ts` does. Nothing interrupts the player directly.
 *
 * Runs in `post-economy` after `route_events`, so it reads the tick's fresh
 * stock tiers, manifests, and `threatened` flags rather than last tick's.
 *
 * NFP compliance:
 * - Tunability: every threshold, chance, decay and cap in `army-supply-config.ts`.
 * - Inspectability: one aggregate `army_supply_scan` per scan tick carrying each
 *   army's resolved line, plus one `army_supply_seeded` per planted seed.
 * - Determinism: seeded `mulberry32(seed + tick * 71)`; armies walked in stable
 *   id order; the BFS breaks ties on ascending node id.
 * - Fail-soft: a malformed army, a missing location, or an unresolvable line
 *   skips that army — never throws, never blocks the tick.
 */

import type { GameState } from '../../types/gameState';
import type { ArmyState } from '../../types/army';
import type { PendingEncounterSeed } from '../../types/unifiedAction';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import type { TraceEntry, ArmySupplyScanTrace, ArmySupplySeededTrace } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';
import {
  resolveSupplyLine,
  deriveSupplyTier,
  nextSupplyLevel,
  supplyConsumptionFor,
  readArmySupply,
  readArmySupplyMax,
} from '../armySupply';
import { pickTargetAgent } from './routeEvents';
import {
  ARMY_SUPPLY_SCAN_INTERVAL_TICKS,
  ARMY_FORAGE_CHANCE,
  ARMY_MUTINY_CHANCE,
  ARMY_SIEGE_LIFTED_CHANCE,
  ARMY_SUPPLY_SEED_DELAY_TICKS,
  ARMY_SUPPLY_SEED_PRIORITY,
  ARMY_SUPPLY_MAX_SEEDS_PER_SCAN,
  ARMY_FORAGE_TEMPLATE_ID,
  ARMY_MUTINY_TEMPLATE_ID,
  ARMY_SIEGE_LIFTED_TEMPLATE_ID,
} from '../../data/army-supply-config';

type SupplyAnomaly = 'forage' | 'mutiny' | 'siege_lifted';

/** emitTrace's Omit collapses the union — per-member helper, one cast (house pattern). */
function emitSupplyTrace(
  trace:
    | Omit<ArmySupplyScanTrace, 'id' | 'timestamp'>
    | Omit<ArmySupplySeededTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(trace as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
}

/**
 * True when this army is the attacker in an active siege.
 *
 * Read through the shipped relationship rather than a new flag: `siegeResolution`
 * links attacker → siege node with a `participates_in` edge carrying
 * `role: 'attacker'`, and the siege node is the one whose `battleState.battleType`
 * is `'siege'`. Both halves are checked — a `participates_in` edge alone also
 * covers field battles, where a starving army is a mutiny, not a lifted siege.
 */
function isBesieging(state: GameState, armyId: string): boolean {
  return state.graph.getOutgoingEdges(armyId, 'participates_in').some((e) => {
    if (e.properties.role !== 'attacker') return false;
    const node = state.graph.getNode(e.target);
    const battleState = node?.properties.battleState as { battleType?: string } | undefined;
    return battleState?.battleType === 'siege';
  });
}

export function phaseArmySupply(state: GameState, _ctx: PhaseContext): PhaseResult {
  const graph = state.graph;
  const tick = state.tick;

  if (tick === 0 || tick % ARMY_SUPPLY_SCAN_INTERVAL_TICKS !== 0) return {};

  const armies = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.armyState != null)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (armies.length === 0) return {};

  const rng = mulberry32(state.seed + tick * 71);
  const pending = state.pendingEncounterSeeds ?? [];
  const newSeeds: PendingEncounterSeed[] = [];
  const supplyLines: ArmySupplyScanTrace['supplyLines'][number][] = [];
  let cutOff = 0;
  let strained = 0;
  let starving = 0;

  for (const armyNode of armies) {
    try {
      const armyState = armyNode.properties.armyState as ArmyState;
      if (!armyState) continue;

      const locationId = graph.getOutgoingEdges(armyNode.id, 'located_at')[0]?.target;
      const factionId = graph.getOutgoingEdges(armyNode.id, 'member_of')[0]?.target;

      const line = resolveSupplyLine(state, locationId, factionId);
      const supplyMax = readArmySupplyMax(armyState);
      const supplyBefore = readArmySupply(armyState);
      const supplyAfter = nextSupplyLevel(
        supplyBefore,
        line.throughput,
        supplyConsumptionFor(armyState.size),
        supplyMax,
      );
      const tier = deriveSupplyTier(supplyAfter, supplyMax);

      graph.updateNode(armyNode.id, {
        properties: {
          ...armyNode.properties,
          armyState: {
            ...armyState,
            supply: supplyAfter,
            supplyMax,
            supplyTier: tier,
            supplyHostId: line.hostId,
            supplyHops: Number.isFinite(line.hops) ? line.hops : null,
          } satisfies ArmyState,
        },
      });

      if (line.hostId === null) cutOff++;
      if (tier === 'strained') strained++;
      if (tier === 'starving') starving++;

      supplyLines.push({
        armyId: armyNode.id,
        hostId: line.hostId,
        hops: Number.isFinite(line.hops) ? line.hops : null,
        threatened: line.threatened,
        throughput: line.throughput,
        supplyBefore,
        supplyAfter,
        tier,
      });

      // ── Anomaly materialization ──────────────────────────────────────────
      if (tier === 'supplied') continue;
      if (newSeeds.length >= ARMY_SUPPLY_MAX_SEEDS_PER_SCAN) continue;

      // One live supply seed per army at a time — a starving army is one story,
      // not a stream of them.
      //
      // `seedId` is read defensively because the live seed pool genuinely holds
      // entries with an undefined id (4 of 7 at tick 132, seed 42, medium map).
      // A bare `s.seedId.startsWith(...)` throws a TypeError on those, and this
      // loop's fail-soft `catch` would swallow it — silently disabling anomaly
      // materialization for every army whenever such a seed is in the pool,
      // while the scan trace still reported a healthy `0 seeded`. That is the
      // worst shape a fail-soft can take, so the guard is here rather than a
      // wider `try`. `routeEvents.ts` carries the same unguarded read and throws
      // outright where a trade web exists — tracked as THR-992.
      const seedPrefix = `army_supply_${armyNode.id}_`;
      const hasLiveSeed = (s: PendingEncounterSeed): boolean =>
        typeof s.seedId === 'string' && s.seedId.startsWith(seedPrefix);
      if (pending.some(hasLiveSeed) || newSeeds.some(hasLiveSeed)) continue;

      const besieging = isBesieging(state, armyNode.id);
      const anomaly: SupplyAnomaly =
        tier === 'starving' ? (besieging ? 'siege_lifted' : 'mutiny') : 'forage';
      const chance =
        anomaly === 'siege_lifted'
          ? ARMY_SIEGE_LIFTED_CHANCE
          : anomaly === 'mutiny'
            ? ARMY_MUTINY_CHANCE
            : ARMY_FORAGE_CHANCE;
      if (rng() >= chance) continue;

      // The story lands on the commander when there is one — they are the actor
      // the player can actually reach — else on whoever stands at the army's hex.
      const commanderId = graph.getOutgoingEdges(armyNode.id, 'commanded_by')[0]?.target;
      const targetAgentId =
        commanderId ?? (locationId ? pickTargetAgent(state, [locationId]) : undefined);
      if (!targetAgentId) continue;

      const templateId =
        anomaly === 'siege_lifted'
          ? ARMY_SIEGE_LIFTED_TEMPLATE_ID
          : anomaly === 'mutiny'
            ? ARMY_MUTINY_TEMPLATE_ID
            : ARMY_FORAGE_TEMPLATE_ID;

      const label =
        anomaly === 'siege_lifted'
          ? `The besiegers outside ${armyNode.name} are starving before the walls are`
          : anomaly === 'mutiny'
            ? `${armyNode.name} has eaten its last ration`
            : `${armyNode.name} sends out foraging parties`;

      newSeeds.push({
        seedId: `army_supply_${armyNode.id}_${tick}`,
        sourceEncounterId: 'army_supply_phase',
        sourceReactionId: anomaly,
        templateId,
        targetAgentId,
        eligibleAfterTick: tick + ARMY_SUPPLY_SEED_DELAY_TICKS,
        priority: ARMY_SUPPLY_SEED_PRIORITY,
        seedLabel: label,
        plantedTick: tick,
      });

      emitSupplyTrace({
        category: 'army_supply_seeded' as const,
        tick,
        summary: label,
        armyId: armyNode.id,
        anomaly,
        templateId,
        targetAgentId,
        supplyTier: tier,
      });
    } catch {
      // Fail-soft: one malformed army never costs the tick (NFP #4).
      continue;
    }
  }

  emitSupplyTrace({
    category: 'army_supply_scan' as const,
    tick,
    summary:
      `army-supply scan: ${armies.length} armies, ${cutOff} cut off, ` +
      `${strained} strained, ${starving} starving, ${newSeeds.length} seeded`,
    armiesScanned: armies.length,
    cutOff,
    strained,
    starving,
    seedsPlanted: newSeeds.length,
    supplyLines,
  });

  if (newSeeds.length === 0) return {};
  return { pendingEncounterSeeds: [...pending, ...newSeeds] };
}

export const armySupplyPhase: EnginePhase = {
  id: 'army_supply',
  slot: 'post-economy',
  // After route events so the tick's fresh `threatened` flags are what the
  // supply lines read — banditry planted this tick strangles the line this tick.
  afterPhase: ['route_events'],
  label: 'Army Supply',
  run: (state, ctx) => phaseArmySupply(state, ctx),
};
