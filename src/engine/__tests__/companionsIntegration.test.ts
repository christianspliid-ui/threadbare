/**
 * THR-1096 — companions against the real pipeline, not a hand-built fixture.
 *
 * The unit tests in `companions.test.ts` assert the module's behaviour on a
 * `WorldGraph` built by hand. This one runs `initializeGameState` → `runTick`,
 * mints companions onto a real generated agent, and asserts that the capability
 * walk, the expiry phase, and the tick loop all agree — the wiring the unit
 * tests cannot see.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { mintCompanion, getCompanions, expireCompanions } from '../companions';
import { computeRawScore, getTopContributors } from '../domainCapability';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const WARMUP_TICKS = 3;

let state: GameState;
let bearerId: string;

beforeAll(() => {
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS.small ?? MAP_SIZE_PRESETS.medium;
  const { state: initState } = initializeGameState(
    archetype, 'SmokeBot', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );

  state = initState;
  for (let t = 0; t < WARMUP_TICKS; t++) state = runTick(state, [], runtime);

  bearerId = state.graph
    .getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual')[0].id;
});

describe('companions — against a live world', () => {
  it('mints onto a generated agent and raises their raw score by the template amount', () => {
    const before = computeRawScore(state.graph, bearerId, 'stone');

    const minted = mintCompanion(
      state.graph, 'companion.wayfarer', bearerId, state.tick, mulberry32(11),
      { source: 'integration.test' },
    );

    expect(minted).not.toBeNull();
    // Wayfarer contributes stone 2.
    expect(computeRawScore(state.graph, bearerId, 'stone')).toBe(before + 2);
    expect(getTopContributors(state.graph, bearerId, 'stone', 5).map(c => c.name))
      .toContain(minted!.name);
  });

  it('gives the hired band a real Iron bonus — the THR-1096 behaviour correction', () => {
    // Before this ticket `hire-mercenaries` minted an off-schema `attachment`
    // node carrying `ironCapability: 30` that no reader consumed, so the bonus
    // did not exist. It does now, at companion scale.
    const before = computeRawScore(state.graph, bearerId, 'iron');

    const merc = mintCompanion(
      state.graph, 'companion.sellsword-band', bearerId, state.tick, mulberry32(29),
      { source: 'action.gold.hire-mercenaries' },
    );

    expect(merc).not.toBeNull();
    expect(computeRawScore(state.graph, bearerId, 'iron')).toBeGreaterThan(before);
  });

  it('reports both companions through the accessor the CLI and agent sheet read', () => {
    const companions = getCompanions(state.graph, bearerId);
    expect(companions.map(c => c.profession).sort()).toEqual(['Sellsword Band', 'Wayfarer']);
    // The contracted one carries a countdown; the permanent one does not.
    expect(companions.find(c => c.profession === 'Wayfarer')?.ticksRemaining).toBeNull();
    expect(companions.find(c => c.profession === 'Sellsword Band')?.ticksRemaining)
      .toBeGreaterThan(0);
  });

  it('expires only the contracted companion, with a departure sentence', () => {
    let departed: ReturnType<typeof expireCompanions> = [];
    for (let t = state.tick + 1; t < state.tick + 40; t++) {
      departed = expireCompanions(state.graph, t);
      if (departed.length > 0) break;
    }

    expect(departed).toHaveLength(1);
    expect(departed[0].reason).toBe('contract_ended');
    expect(departed[0].departSentence.length).toBeGreaterThan(0);
    expect(getCompanions(state.graph, bearerId).map(c => c.profession)).toEqual(['Wayfarer']);
  });

  it('keeps ticking with companions in the graph', () => {
    const runtime = createSimulationRuntime();
    const before = state.tick;

    expect(() => {
      for (let i = 0; i < 5; i++) state = runTick(state, [], runtime);
    }).not.toThrow();

    expect(state.tick).toBeGreaterThan(before);
    // The permanent companion survives the tick loop's expiry phase.
    expect(getCompanions(state.graph, bearerId)).toHaveLength(1);
  });
});
