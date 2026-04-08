import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { phaseMandate } from '../phaseMandate';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { phaseDoom } from '../phaseDoom';
import type { SphereAggregate } from '../../types/worldSoul';

function makeAggregate(total = 100): SphereAggregate {
  return {
    totalBySphere: {
      force: total,
      matter: total,
      energy: total,
      life: total,
      mind: total,
      spirit: total,
      time: total,
      entropy: total,
      order: total,
      chaos: total,
      light: total,
      darkness: total,
    },
    dominantSphere: 'mind',
    entityCount: 12,
  };
}

function buildObjectiveGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  for (let i = 1; i <= 6; i++) {
    graph.addNode({
      id: `loc_${i}`,
      type: 'location',
      name: `Town ${i}`,
      properties: {
        locationSubtype: 'town',
        prosperity: 70,
        unrest: 0,
      },
    });
  }
  return graph;
}

describe('remembered objective runtime', () => {
  it('builds remembrance-shaped mandates from identity context', () => {
    const mandate = generateRememberedMandate({
      alignment: { primary: 'mind', secondary: 'spirit' },
      aggregate: makeAggregate(),
      identity: {
        courtType: 'web',
        mandateDirection: 'Establish an information network across the world',
        hungerId: 'hunger.witness',
        hungerName: 'Witness',
      },
    });

    expect(mandate.runtimeKind).toBe('sphere_growth');
    expect(mandate.name).toBe('Witness Ascendancy');
    expect(mandate.checkpoints).toHaveLength(4);
    expect(mandate.secondaryObjective?.type).toBe('web_relationships');
  });

  it('missed checkpoints add severity to the next doom beat', () => {
    const graph = buildObjectiveGraph();
    const baseline = makeAggregate(100);
    const mandateDefinition = generateRememberedMandate({
      alignment: { primary: 'mind', secondary: 'spirit' },
      aggregate: baseline,
    });
    const mandateState = createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    });

    const state = {
      graph,
      ascendantId: 'asc',
      tick: 90,
      mandateDefinition,
      mandateState,
      tickEvents: [],
      pendingSpherePressures: [],
      doomClock: {
        ...createDoomClockState('breach', 200),
        currentTick: 90,
        progress: 0.45,
      },
      worldSoul: {
        aggregate: baseline,
      },
    } as any;

    const result = phaseMandate(state);
    expect(result.mandateState?.checkpointResults?.[0].passed).toBe(false);
    expect(result.doomClock?.nextEscalationSeverityModifier).toBe(1);
  });

  it('strong checkpoint passes bank counter-omens', () => {
    const graph = buildObjectiveGraph();
    const baseline = makeAggregate(100);
    const current = makeAggregate(100);
    current.totalBySphere.mind = 112;
    current.totalBySphere.spirit = 107;

    const mandateDefinition = generateRememberedMandate({
      alignment: { primary: 'mind', secondary: 'spirit' },
      aggregate: baseline,
      identity: {
        courtType: 'web',
        mandateDirection: 'Establish an information network across the world',
        hungerId: 'hunger.witness',
        hungerName: 'Witness',
      },
    });
    const mandateState = createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    });

    const state = {
      graph,
      ascendantId: 'asc',
      tick: 90,
      mandateDefinition,
      mandateState,
      tickEvents: [],
      pendingSpherePressures: [],
      doomClock: {
        ...createDoomClockState('breach', 200),
        currentTick: 90,
        progress: 0.45,
      },
      worldSoul: {
        aggregate: current,
      },
    } as any;

    const result = phaseMandate(state);
    expect(result.mandateState?.checkpointResults?.[0].passed).toBe(true);
    expect(result.mandateState?.checkpointResults?.[0].exceeded).toBe(true);
    expect(result.doomClock?.counterOmens).toBe(1);
    expect(result.mandateState?.currentStage).toBe('escalation');
  });

  it('doom stage transitions resolve authored cards into world effects', () => {
    const graph = buildObjectiveGraph();
    const doomDefinition = generateDoomClock('breach', 100, 42);
    const doomClock = {
      ...createDoomClockState('breach', 100),
      currentTick: 19,
      progress: 0.19,
      currentStage: 1,
      nextEscalationSeverityModifier: 1,
      counterOmens: 0,
    };

    const state = {
      graph,
      ascendantId: 'asc',
      doomDefinition,
      doomClock,
      tick: 20,
      seed: 42,
      tickEvents: [],
      pendingSpherePressures: [],
      pendingHexMutations: [],
      prosperityShocks: [],
      effectStates: new Map(),
      tiles: Array.from({ length: 12 }, (_, index) => ({
        coord: { col: index % 4, row: Math.floor(index / 4) },
        terrain: 'plains',
      })),
    } as any;

    const result = phaseDoom(state);
    expect(result.doomClock?.currentStage).toBe(2);
    expect(result.doomClock?.resolvedEvents).toHaveLength(1);
    expect(result.pendingSpherePressures?.length).toBe(6);
    const unrestValues = graph.getNodesByType('location').map((node) => node.properties.unrest as number);
    expect(unrestValues.some((value) => value > 0)).toBe(true);
  });
});
