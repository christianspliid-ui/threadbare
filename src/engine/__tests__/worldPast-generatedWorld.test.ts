// @vitest-lane heavy — builds a small world and drives it 200 ticks, watching the seeded dead every tick (THR-1631), and two medium worlds for the past's ambitions (THR-1657)
/**
 * THR-1631 S1 — the seeded dead stay dead, through the real tick loop.
 *
 * The past pass writes up to ten deceased actors at t0 in the run-time `retain`
 * shape. Every sweep that walks individuals must respect `deceased`; this proves it
 * over 200 ticks on a world worldgen actually mints, not a fixture. The kill line
 * (plan § Kill criteria): if a seeded dead actor is ever a decider, an actor in a
 * unified action, or counted as a resident, fix the reader — never remove the dead.
 *
 * Not asserted here: the THR-1654 notable pick, which does not exist yet. That
 * ticket's census covers this writer (the plan's mutex, recorded on THR-1631).
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { _resetNpcCounter } from '../npcSeeding';
import { isAutonomousDecisionActor } from '../decisionTier';
import { getAgentsAtLocation } from '../graphQueries';
import { buildHexActorIndex } from '../hexActorIndex';
import { isSeededDead, readWorldPast } from '../worldPast';
import { PAST_REVENGE_TEMPLATE_ID, PAST_WONDER_TEMPLATE_ID } from '../worldPastAmbitions';
import { WORLD_PAST_DEFAULTS } from '../../data/world-past-constants';
import { getFactionLeaderId } from '../factionNetwork';
import { isAgentGone } from '../groups/groupQueries';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const TICKS = 200;
const TIMEOUT_MS = 240_000;

describe('worldPast — the seeded dead stay dead over 200 ticks (THR-1631 S1)', () => {
  it('no seeded dead is ever alive, a decider, an action’s actor, or a counted resident', { timeout: TIMEOUT_MS }, () => {
    _resetNpcCounter();
    resetEventCounter();
    resetReputationTraitInit();
    const preset = MAP_SIZE_PRESETS.small;
    let state: GameState = initializeGameState(
      generateArchetypes(4, SEED)[0], 'T', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    ).state;
    const runtime = createSimulationRuntime();

    const deadIds = state.graph.getNodesByType('actor').filter(isSeededDead).map(n => n.id);
    // Not vacuous: the pass must have written dead for this to prove anything.
    expect(deadIds.length).toBeGreaterThanOrEqual(5);
    const restsAt = new Map(deadIds.map(id => [id, state.graph.getOutgoingEdges(id, 'located_at')[0]?.target]));

    const leaks: string[] = [];
    for (let i = 0; i < TICKS; i++) {
      state = runTick(state, [], runtime);
      const g = state.graph;
      const dead = new Set(deadIds);
      for (const id of deadIds) {
        const node = g.getNode(id);
        if (!node) { leaks.push(`t${state.tick} ${id} removed`); continue; }
        if (node.properties.deceased !== true) leaks.push(`t${state.tick} ${id} alive`);
        if (isAutonomousDecisionActor(node)) leaks.push(`t${state.tick} ${id} decider`);
        const at = restsAt.get(id);
        if (at && getAgentsAtLocation(g, at).some(n => n.id === id)) leaks.push(`t${state.tick} ${id} resident`);
      }
      for (const action of state.unifiedActions ?? []) {
        if (dead.has(action.actorId)) leaks.push(`t${state.tick} ${action.actorId} acts ${action.templateId}`);
      }
      if (i % 50 === 49) {
        const index = buildHexActorIndex(g);
        for (const ids of index.byHex.values()) {
          for (const id of ids) if (dead.has(id)) leaks.push(`t${state.tick} ${id} in hex index`);
        }
      }
    }
    expect(leaks.slice(0, 10)).toEqual([]);
  });
});

describe('worldPast — the past feeds ambitions (THR-1657 S3)', () => {
  function buildWorld(enabled: boolean): GameState {
    WORLD_PAST_DEFAULTS.enabled = enabled;
    try {
      _resetNpcCounter();
      resetEventCounter();
      resetReputationTraitInit();
      const preset = MAP_SIZE_PRESETS.medium;
      return initializeGameState(
        generateArchetypes(4, SEED)[0], 'T', createBalancedCosmology(), SEED, preset.cols, preset.rows,
      ).state;
    } finally {
      WORLD_PAST_DEFAULTS.enabled = true;
    }
  }

  it('a revenge heir is kin of the dead commander and holds a grievance against a living culprit; no ambient mortal is given the past; the t0 decider headcount is unchanged', { timeout: TIMEOUT_MS }, () => {
    const on = buildWorld(true);
    const g = on.graph;
    const past = g.getAllEdges().filter(e => e.type === 'pursues' && e.properties.pastOrigin === 'worldgen');
    const revenge = past.filter(e => e.target === `ambition.${PAST_REVENGE_TEMPLATE_ID}`);
    const wonder = past.filter(e => e.target === `ambition.${PAST_WONDER_TEMPLATE_ID}`);
    // Not vacuous: seed 42 medium has two wars in living memory with a fallen commander each.
    expect(revenge.length).toBeGreaterThanOrEqual(1);
    expect(revenge.length).toBeLessThanOrEqual(WORLD_PAST_DEFAULTS.revengeAmbitionsMax);
    expect(wonder.length).toBeLessThanOrEqual(WORLD_PAST_DEFAULTS.wonderAmbitionsMax);

    const view = readWorldPast(g);
    for (const edge of revenge) {
      const war = view.livingMemory.find(w => w.eventId === edge.properties.mintedByEventId);
      expect(war).toBeDefined();
      const commanderId = war!.fallenIds[0];
      expect(isSeededDead(g.getNode(commanderId))).toBe(true);
      // Kin, both directions, in the worldgen tie shape.
      for (const [a, b] of [[edge.source, commanderId], [commanderId, edge.source]]) {
        const tie = g.getOutgoingEdges(a, 'relates_to').find(e => e.target === b);
        expect(tie?.properties.basis).toBe('kin');
        expect(tie?.properties.origin).toBe('worldgen');
      }
      // A grievance against the winning Realm's current, living leader.
      expect(edge.properties.grievance).toBe(true);
      const culprit = edge.properties.culpritAgentId as string;
      expect(culprit).toBe(getFactionLeaderId(g, war!.winnerId));
      expect(isAgentGone(g.getNode(culprit))).toBe(false);
      // The heir stood with the losing Realm.
      expect(g.getOutgoingEdges(edge.source, 'member_of').some(e => e.target === war!.loserId)).toBe(true);
    }

    // Holders are only protagonists — living deciders, never ambient, never the dead.
    for (const edge of past) {
      const holder = g.getNode(edge.source)!;
      expect(isAutonomousDecisionActor(holder)).toBe(true);
      expect(isAgentGone(holder)).toBe(false);
    }
    // One past ambition per holder.
    expect(new Set(past.map(e => e.source)).size).toBe(past.length);

    // No history pulls anyone into the deciding tier.
    const deciders = (s: GameState) => s.graph.getNodesByType('actor')
      .filter(n => isAutonomousDecisionActor(n) && !isAgentGone(n)).map(n => n.id).sort();
    expect(deciders(on)).toEqual(deciders(buildWorld(false)));
  });
});
