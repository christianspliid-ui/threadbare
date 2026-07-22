/**
 * Phase: Economic Power (THR-617) — Mortal Economy P3.
 *
 * Two couplings on a daily cadence:
 *
 * 1. **Monopoly resolution** — the `establish-monopoly` action has written
 *    `monopolyControlledBy` since P0 and the chronicle has carried
 *    `monopoly_established` / `monopoly_broken` prose that nothing ever
 *    fired. This phase finally resolves monopolies systemically: for each
 *    resource id, a faction controlling ≥ `MONOPOLY_CONTROL_FRACTION` of its
 *    bearing locations (via `controls` edges or action-written
 *    `monopolyControlledBy`) holds a Monopoly. Transitions are recorded on
 *    the faction node (`monopolies: string[]` — node-internal data, not a
 *    relationship), narrated through the existing chronicle prose, traced,
 *    and `touchWorld()`ed (monopoly state feeds encounter scoring inputs).
 *
 * 2. **Sphere drift from sustained flows** — every active trade route drifts
 *    local sphere pressure at both endpoints toward its carried goods'
 *    affinity spheres (`ECON_SPHERE_DRIFT_PER_TICK`, accumulated across the
 *    scan window). A grain valley slowly reads Life; a war-iron corridor
 *    reads Matter. Closes the economy→sphere feedback with the existing
 *    pressure pipeline (source: 'environmental').
 *
 * NFP: all tunables in `economic-power-config.ts`; one aggregate scan trace +
 * one `monopoly_transition` per transition; seeded chronicle variant picks;
 * fail-soft skips (no resources, no controller, missing nodes) throughout.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { ChronicleEntry } from '../../types/narrative';
import type { SpherePressureEvent } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import type { TraceEntry, MonopolyTransitionTrace, EconomicPowerScanTrace, ScarcityArcPhaseTrace } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { touchWorld } from '../simulationRuntime';
import { readResources } from '../resourceEconomy';
import { pickTargetAgent } from './routeEvents';
import { readTradeRouteProps } from '../tradeRoute';
import { getResourceClass } from '../../data/resource-classes';
import { resolveEconomicChronicle, chronicleSeed } from '../economicChronicle';
import {
  MONOPOLY_CONTROL_FRACTION,
  MONOPOLY_MIN_LOCATIONS,
  ECON_POWER_SCAN_INTERVAL_TICKS,
  ECON_SPHERE_DRIFT_PER_TICK,
  SCARCITY_ARC_MAX_ACTIVE,
  SCARCITY_ARC_UNREST_DELTA,
  SCARCITY_ARC_FLASHPOINT_UNREST_DELTA,
  SCARCITY_ARC_SEED_DELAY_TICKS,
  SCARCITY_ARC_SEED_PRIORITY,
} from '../../data/economic-power-config';
import type { PendingEncounterSeed } from '../../types/unifiedAction';

function emitEconTrace(
  trace:
    | Omit<MonopolyTransitionTrace, 'id' | 'timestamp'>
    | Omit<EconomicPowerScanTrace, 'id' | 'timestamp'>
    | Omit<ScarcityArcPhaseTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(trace as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
}

/** Read the faction-node monopoly ledger (node-internal data). */
function readMonopolies(props: Record<string, unknown>): string[] {
  const m = props.monopolies;
  return Array.isArray(m) ? m.filter((x): x is string => typeof x === 'string') : [];
}

export function phaseEconomicPower(state: GameState, ctx: PhaseContext): PhaseResult {
  const tick = state.tick;
  if (tick === 0 || tick % ECON_POWER_SCAN_INTERVAL_TICKS !== 0) return {};
  const graph = state.graph;

  // ── 1. Monopoly resolution ────────────────────────────────────────────────
  // resource id → (bearing location count, per-faction control counts, a
  // representative controlled settlement name for the chronicle).
  const bearing = new Map<string, { total: number; byFaction: Map<string, number>; sampleSettlement: Map<string, string> }>();
  for (const loc of graph.getNodesByType('location')) {
    const resources = readResources(loc.properties);
    const resourceIds = Object.keys(resources);
    if (resourceIds.length === 0) continue;
    const controller =
      (graph.getIncomingEdges(loc.id, 'controls')[0]?.source) ??
      (typeof loc.properties.monopolyControlledBy === 'string'
        ? (loc.properties.monopolyControlledBy as string)
        : undefined);
    for (const rid of resourceIds) {
      const entry = bearing.get(rid) ?? { total: 0, byFaction: new Map(), sampleSettlement: new Map() };
      entry.total++;
      if (controller) {
        entry.byFaction.set(controller, (entry.byFaction.get(controller) ?? 0) + 1);
        if (!entry.sampleSettlement.has(controller)) entry.sampleSettlement.set(controller, loc.name);
      }
      bearing.set(rid, entry);
    }
  }

  // Current holder per resource (at most one — fractions above 0.6 are exclusive).
  const holderByResource = new Map<string, { factionId: string; fraction: number; settlement: string }>();
  for (const [rid, entry] of bearing) {
    if (entry.total < MONOPOLY_MIN_LOCATIONS) continue;
    for (const [factionId, count] of entry.byFaction) {
      const fraction = count / entry.total;
      if (fraction >= MONOPOLY_CONTROL_FRACTION) {
        holderByResource.set(rid, {
          factionId,
          fraction,
          settlement: entry.sampleSettlement.get(factionId) ?? 'the region',
        });
        break;
      }
    }
  }

  // Diff against per-faction ledgers → transitions.
  const chronicleEntries: ChronicleEntry[] = [];
  const newEvents: TickEvent[] = [];
  const pushChronicle = (
    result: ReturnType<typeof resolveEconomicChronicle>,
    locationName: string,
  ): void => {
    if (!result) return;
    newEvents.push(result.tickEvent);
    chronicleEntries.push({
      id: result.chronicleChapter.id,
      tier: 'chronicle',
      title: result.chronicleChapter.title,
      prose: result.chronicleChapter.prose,
      promptContext: {
        actors: result.chronicleChapter.actorIds,
        location: locationName,
        sphere: 'matter',
        mood: 'economic',
      },
      tick,
    });
  };
  let established = 0;
  let broken = 0;
  const factions = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'faction')
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const faction of factions) {
    const held = new Set(readMonopolies(faction.properties));
    const now = new Set<string>();
    for (const [rid, holder] of holderByResource) {
      if (holder.factionId === faction.id) now.add(rid);
    }
    if (held.size === 0 && now.size === 0) continue;

    const gained = [...now].filter((r) => !held.has(r)).sort();
    const lost = [...held].filter((r) => !now.has(r)).sort();
    if (gained.length === 0 && lost.length === 0) continue;

    for (const rid of gained) {
      const holder = holderByResource.get(rid)!;
      const result = resolveEconomicChronicle(
        'monopoly_established',
        { actor: faction.name, actorId: faction.id, resource: rid, settlement: holder.settlement },
        tick,
        chronicleSeed(state.seed, `${faction.id}_${rid}_${tick}`),
      );
      pushChronicle(result, holder.settlement);
      established++;
      emitEconTrace({
        category: 'monopoly_transition' as const,
        tick,
        summary: `${faction.name} establishes a ${rid} monopoly (${Math.round(holder.fraction * 100)}% control)`,
        factionId: faction.id,
        resourceId: rid,
        transition: 'established' as const,
        controlFraction: holder.fraction,
      });
    }
    for (const rid of lost) {
      const result = resolveEconomicChronicle(
        'monopoly_broken',
        { actor: faction.name, actorId: faction.id, resource: rid, settlement: 'the region' },
        tick,
        chronicleSeed(state.seed, `${faction.id}_${rid}_${tick}_broken`),
      );
      pushChronicle(result, 'the region');
      broken++;
      emitEconTrace({
        category: 'monopoly_transition' as const,
        tick,
        summary: `${faction.name}'s ${rid} monopoly is broken`,
        factionId: faction.id,
        resourceId: rid,
        transition: 'broken' as const,
        controlFraction: 0,
      });
    }

    faction.properties.monopolies = [...now].sort();
  }
  if (established + broken > 0 && ctx.runtime) {
    touchWorld(ctx.runtime); // monopoly state feeds encounter-scoring inputs
  }

  // ── 2. Sphere drift from sustained flows ─────────────────────────────────
  const spherePressures: SpherePressureEvent[] = [];
  let flowsDrifted = 0;
  for (const route of graph.getEdgesByType('trades_with')) {
    const source = graph.getNode(route.source);
    const target = graph.getNode(route.target);
    if (source?.type !== 'location' || target?.type !== 'location') continue;
    const manifest = readTradeRouteProps(route.properties).manifest;
    if (manifest.goods.length === 0) continue;
    // Accumulated drift for the scan window, split across carried goods.
    const perGood = (ECON_SPHERE_DRIFT_PER_TICK * ECON_POWER_SCAN_INTERVAL_TICKS) / manifest.goods.length;
    for (const good of manifest.goods) {
      const sphere = getResourceClass(good).primarySphere as SphereName | undefined;
      if (!sphere) continue;
      for (const endpointId of [route.source, route.target]) {
        spherePressures.push({
          targetEntityId: endpointId,
          sphere,
          magnitude: perGood,
          source: 'environmental',
          sourceId: route.id,
        });
      }
    }
    flowsDrifted++;
  }

  // ── 3. Scarcity arcs: shortage → hoarding → unrest → flashpoint ──────────
  // Lean arc state lives on the location node (`scarcityArc` property bag);
  // every phase is an intervention point — an encounter seed for a local
  // mortal, never a cutscene. Recovery mid-arc dissolves it; recovery after
  // unrest leaves a cool-failure chronicle scar (half-averted famine).
  const ARC_ORDER = ['shortage', 'hoarding', 'unrest', 'flashpoint'] as const;
  const newSeeds: PendingEncounterSeed[] = [];
  const pendingSeedIds = new Set((state.pendingEncounterSeeds ?? []).map((s2) => s2.seedId));
  let arcsActive = 0;
  let arcTransitions = 0;
  const settlements = graph
    .getNodesByType('location')
    .filter((n) => ['hamlet', 'town', 'city', 'capital'].includes(n.properties.locationSubtype as string))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const loc of settlements) {
    const arc = loc.properties.scarcityArc as
      | { resourceId: string; phase: typeof ARC_ORDER[number]; sinceTick: number }
      | undefined;
    // Is any STAPLE resource scarce here right now? (bag keys are the ids)
    const resources = readResources(loc.properties);
    const scarceStapleId = Object.entries(resources).find(
      ([rid, r]) => r.stockTier === 'scarce' && getResourceClass(rid).category === 'staple',
    )?.[0];

    if (!arc) {
      if (!scarceStapleId) continue;
      if (arcsActive >= SCARCITY_ARC_MAX_ACTIVE) continue;
      loc.properties.scarcityArc = {
        resourceId: scarceStapleId,
        phase: 'shortage',
        sinceTick: tick,
      };
      arcsActive++;
      arcTransitions++;
      emitEconTrace({
        category: 'scarcity_arc_phase' as const,
        tick,
        summary: `Scarcity arc opens at ${loc.name}: ${scarceStapleId} shortage`,
        locationId: loc.id,
        resourceId: scarceStapleId,
        phase: 'shortage' as const,
      });
      continue;
    }

    if (!scarceStapleId) {
      // Recovery. Past unrest → the famine leaves a scar (cool failure).
      const reached = ARC_ORDER.indexOf(arc.phase);
      if (reached >= 2) {
        chronicleEntries.push({
          id: `scarcity_arc_scar_${loc.id}_${tick}`,
          tier: 'chronicle',
          title: `The lean season at ${loc.name} ends`,
          prose:
            `The granaries at ${loc.name} fill again, but the season left its mark — ` +
            `debts called in, trust spent, and a few doors that stay bolted at night now. ` +
            `Half-averted is not the same as averted.`,
          promptContext: { actors: [], location: loc.name, sphere: 'life', mood: 'grim' },
          tick,
        });
      }
      emitEconTrace({
        category: 'scarcity_arc_phase' as const,
        tick,
        summary: `Scarcity arc at ${loc.name} dissolves (${arc.phase} recovered)`,
        locationId: loc.id,
        resourceId: arc.resourceId,
        phase: 'recovered' as const,
      });
      loc.properties.scarcityArc = undefined;
      arcTransitions++;
      continue;
    }

    arcsActive++;
    const idx = ARC_ORDER.indexOf(arc.phase);
    if (idx >= ARC_ORDER.length - 1) continue; // flashpoint holds while scarce
    const nextPhase = ARC_ORDER[idx + 1];
    loc.properties.scarcityArc = { ...arc, phase: nextPhase };
    arcTransitions++;

    // Phase effects + the intervention encounter seed.
    const seedId = `scarcity_arc_${loc.id}_${nextPhase}_${tick}`;
    const targetAgentId = pickTargetAgent(state, [loc.id]);
    const seedBase = targetAgentId && !pendingSeedIds.has(seedId)
      ? {
          seedId,
          sourceEncounterId: 'scarcity_arc',
          sourceReactionId: nextPhase,
          targetAgentId,
          eligibleAfterTick: tick + SCARCITY_ARC_SEED_DELAY_TICKS,
          priority: SCARCITY_ARC_SEED_PRIORITY,
          plantedTick: tick,
        }
      : undefined;
    if (nextPhase === 'hoarding' && seedBase) {
      newSeeds.push({ ...seedBase, encounterFamily: 'mct.quest', seedLabel: `Hoarding takes hold at ${loc.name} — someone is sitting on the ${arc.resourceId}` });
    } else if (nextPhase === 'unrest') {
      const prev = typeof loc.properties.unrest === 'number' ? loc.properties.unrest : 0;
      loc.properties.unrest = Math.min(100, prev + SCARCITY_ARC_UNREST_DELTA);
      if (seedBase) newSeeds.push({ ...seedBase, encounterFamily: 'cg.quest', seedLabel: `Hunger turns to anger at ${loc.name}` });
    } else if (nextPhase === 'flashpoint') {
      const prev = typeof loc.properties.unrest === 'number' ? loc.properties.unrest : 0;
      loc.properties.unrest = Math.min(100, prev + SCARCITY_ARC_FLASHPOINT_UNREST_DELTA);
      if (seedBase) newSeeds.push({ ...seedBase, templateId: 'encounter_route_embargo', seedLabel: `${loc.name} reaches the breaking point over ${arc.resourceId}` });
      chronicleEntries.push({
        id: `scarcity_arc_flashpoint_${loc.id}_${tick}`,
        tier: 'chronicle',
        title: `Flashpoint at ${loc.name}`,
        prose:
          `The ${arc.resourceId} shortage at ${loc.name} stops being an economic fact and becomes a political one. ` +
          `Granaries under guard, queues that end in shoving, and every grievance in town suddenly wearing the same face: hunger.`,
        promptContext: { actors: [], location: loc.name, sphere: 'entropy', mood: 'grim' },
        tick,
      });
    }
    emitEconTrace({
      category: 'scarcity_arc_phase' as const,
      tick,
      summary: `Scarcity arc at ${loc.name}: ${arc.phase} to ${nextPhase}`,
      locationId: loc.id,
      resourceId: arc.resourceId,
      phase: nextPhase,
    });
  }

  emitEconTrace({
    category: 'economic_power_scan' as const,
    tick,
    summary: `economic power scan: ${holderByResource.size} monopolies held, +${established}/-${broken} transitions, ${flowsDrifted} flows drifting spheres, ${arcsActive} scarcity arcs (${arcTransitions} transitions)`,
    monopoliesHeld: holderByResource.size,
    established,
    broken,
    flowsDrifted,
    scarcityArcsActive: arcsActive,
    scarcityArcTransitions: arcTransitions,
  });

  const result: PhaseResult = {};
  if (chronicleEntries.length > 0) {
    result.chronicleEntries = [...(state.chronicleEntries ?? []), ...chronicleEntries];
  }
  if (newEvents.length > 0) {
    result.tickEvents = [...(state.tickEvents ?? []), ...newEvents];
  }
  if (spherePressures.length > 0) {
    result.pendingSpherePressures = [...(state.pendingSpherePressures ?? []), ...spherePressures];
  }
  if (newSeeds.length > 0) {
    result.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), ...newSeeds];
  }
  return result;
}

export const economicPowerPhase: EnginePhase = {
  id: 'economic_power',
  slot: 'post-economy',
  label: 'Economic Power',
  run: (state, ctx) => phaseEconomicPower(state, ctx),
};
