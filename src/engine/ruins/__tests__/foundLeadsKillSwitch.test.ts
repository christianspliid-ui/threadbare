/**
 * THR-1702 kill switch: with `CLUE_SPENT_LEAD_ENDS_CLIMB = false` a located lead on a
 * never-site is pulled and refreshed exactly as before, and decay never settles it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../constants')>()),
  CLUE_SPENT_LEAD_ENDS_CLIMB: false,
}));

import { WorldGraph } from '../../graph';
import { isLeadSpent } from '../leadVisit';
import { phaseClueDecay } from '../clueLifecycle';
import { heldLeadRuinIds } from '../../strategicActionCandidates';
import { getUndertakingObjectType } from '../../../data/undertaking-objects';
import { CLUE_DECAY_CHECK_INTERVAL } from '../constants';
import { clearTraces, enableTracing, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';

const ACTOR = 'actor_holder';
const WONDER = 'site_wonder';

function world(): { graph: WorldGraph; leadId: string } {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, name: 'Holder', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({
    id: WONDER, name: 'Luminous Anvil Bower', type: 'location',
    properties: { locationSubtype: 'glowcap_hollow', hexCol: 10, hexRow: 10 },
  });
  const leadId = 'lead_wonder';
  graph.addEdge({
    id: leadId, source: ACTOR, target: WONDER, type: 'knows_clue_of',
    properties: { magnitude: 0.5, precision: 'located', source: 'tavern_rumor', discoveredTick: 10, consumed: false },
  });
  return { graph, leadId };
}

describe('CLUE_SPENT_LEAD_ENDS_CLIMB = false restores the old climb', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('no lead is spent, and the lead pass still pulls it', () => {
    const { graph, leadId } = world();
    expect(isLeadSpent(graph, graph.getEdge(leadId)!, 50)).toBe(false);
    expect(heldLeadRuinIds(graph, ACTOR, 50)).toEqual([WONDER]);
  });

  it('a survey refreshes the located lead', () => {
    const { graph, leadId } = world();
    const observe = getUndertakingObjectType('location')!.verbs.observe as (ctx: unknown) => unknown;
    observe({
      state: { graph, tick: 40 } as unknown as GameState,
      graph, actorId: ACTOR, handle: { kind: 'node', nodeId: WONDER }, tick: 40, outcome: 'success',
    });
    expect(graph.getEdge(leadId)!.properties.discoveredTick).toBe(40);
    const reader = (getTraces() as unknown as ReadonlyArray<Record<string, unknown>>)
      .find(t => t.category === 'undertaking_reader' && t.reader === 'clue');
    expect(reader?.refused).toBeUndefined();
  });

  it('decay leaves it as a lead (no find)', () => {
    const { graph, leadId } = world();
    phaseClueDecay({ graph, tick: CLUE_DECAY_CHECK_INTERVAL * 5, seed: 42 } as unknown as GameState);
    expect(graph.getEdge(leadId)).toBeDefined();
    expect(graph.getOutgoingEdges(ACTOR, 'knows_of')).toHaveLength(0);
  });
});
