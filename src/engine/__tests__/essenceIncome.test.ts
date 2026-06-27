import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { computeEssenceIncome } from '../essenceIncome';
import { setHomeSeat } from '../influence';
import type { SphereAlignment } from '../../types/influence';
import { ESSENCE_PER_SEAT, ESSENCE_PER_PLACE_OF_POWER } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

/**
 * The view-layer income mirror (essenceIncome.ts) must agree with the engine
 * generation path (influence.ts) on the home-seat term — the essence HUD reads
 * this function (THR-502).
 */
describe('computeEssenceIncome — home seat (THR-502)', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';

  const sumIncome = () =>
    SPHERE_NAMES.reduce((sum, s) => sum + computeEssenceIncome(graph, ascendantId)[s], 0);

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Seated One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
      },
    });
  });

  it('raises net income by exactly ESSENCE_PER_SEAT when a seat is set', () => {
    graph.addNode({ id: 'loc.throne', type: 'location', name: 'Throne', properties: { locationType: 'location' } });
    const baseTotal = sumIncome();
    setHomeSeat(graph, ascendantId, 'loc.throne');
    expect(sumIncome()).toBeCloseTo(baseTotal + ESSENCE_PER_SEAT, 5);
  });

  it('does not stack the seat term with the place-of-power bonus', () => {
    graph.addNode({ id: 'loc.throne', type: 'location', name: 'Throne', properties: { locationType: 'location', isPlaceOfPower: true } });
    graph.addEdge({ id: 'edge.controls_throne', source: ascendantId, target: 'loc.throne', type: 'controls', properties: {} });
    const baseTotal = sumIncome(); // includes the place-of-power bonus
    graph.updateNode(ascendantId, {
      properties: { ...graph.getNode(ascendantId)!.properties, homeSeatLocationId: 'loc.throne' },
    });
    expect(sumIncome()).toBeCloseTo(baseTotal + ESSENCE_PER_SEAT - ESSENCE_PER_PLACE_OF_POWER, 5);
  });

  it('fail-soft: a seat pointing at a missing location contributes nothing', () => {
    const baseTotal = sumIncome();
    graph.updateNode(ascendantId, {
      properties: { ...graph.getNode(ascendantId)!.properties, homeSeatLocationId: 'loc.ghost' },
    });
    expect(sumIncome()).toBeCloseTo(baseTotal, 5);
  });
});
