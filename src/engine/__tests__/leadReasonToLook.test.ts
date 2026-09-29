/**
 * A lead is a reason to look (THR-1663, seeded things stay alive S2).
 *
 *   - A held lead's ruin joins the holder's `cell.observe.location` targets ahead of
 *     the proximity cap, and that survey carries the lead pull the board folds in.
 *   - A deciding mortal walks the survey cell for a lead's ruin even under an
 *     ambition that does not list the cell (the lead pass) — an ambient one does not.
 *   - A survey of a site the surveyor already holds a lead on sharpens the lead
 *     instead of refusing `clue_already_held`.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateStrategicCandidates,
  heldLeadRuinIds,
  LEAD_SURVEY_CELL_ID,
} from '../strategicActionCandidates';
import { sharpenClue, spawnClue } from '../strategicGraphOps';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import { CLUE_LEAD_SURVEY_CANDIDATES_MAX, CLUE_LEAD_SURVEY_PULL_MULT } from '../ruins/constants';
import { STRATEGIC_TARGET_SCAN_CAPS } from '../../data/strategic-action-constants';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';

const ACTOR = 'actor_holder';
const RUIN = 'ruin_far';

/** A merchant at home, more towns nearby than the object scan keeps, and one far ruin. */
function world(spotlightTier: 'spotlight' | 'ambient' = 'spotlight'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR, name: 'Holder', type: 'actor',
    properties: {
      actorType: 'individual', spotlightTier,
      domainCapabilities: { gold: 24, eye: 24, heart: 12, shadow: 8, iron: 8, stone: 8, star: 8, veil: 8 },
    },
  });
  graph.addNode({ id: 'loc_home', name: 'Home', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
  graph.addEdge({ id: 'at_home', source: ACTOR, target: 'loc_home', type: 'located_at', properties: {} });
  const nearby = STRATEGIC_TARGET_SCAN_CAPS.object + 4;
  for (let i = 0; i < nearby; i++) {
    graph.addNode({
      id: `loc_near_${i}`, name: `Near ${i}`, type: 'location',
      properties: { locationSubtype: 'town', hexCol: 5 + (i % 3), hexRow: 5 + Math.floor(i / 3) },
    });
  }
  graph.addNode({
    id: RUIN, name: 'The Sunken Vault', type: 'location',
    properties: { locationSubtype: 'elder_ruin', locationType: 'elder_ruin', hexCol: 30, hexRow: 30, ruinMagnitude: 0.5 },
  });
  graph.addNode({ id: 'amb', name: 'Dominate Regional Trade', type: 'ambition', properties: { templateId: 'ambition_dominate_trade' } });
  graph.addEdge({ id: 'pursues', source: ACTOR, target: 'amb', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });
  return graph;
}

function holdLead(graph: WorldGraph, ruinId = RUIN, tick = 10, precision: 'vague' | 'narrowed' = 'vague'): void {
  graph.addEdge({
    id: `lead_${ruinId}_${tick}`, source: ACTOR, target: ruinId, type: 'knows_clue_of',
    properties: { magnitude: 0.3, precision, source: 'tavern_rumor', discoveredTick: tick, consumed: false },
  });
}

function surveysOf(graph: WorldGraph, model: 'cells' | 'templates' = 'cells') {
  const { candidates } = generateStrategicCandidates(
    graph, ACTOR, ['ambition_dominate_trade'], undefined, 20, mulberry32(7), undefined, model,
  );
  return candidates.filter(c => c.templateId === LEAD_SURVEY_CELL_ID);
}

describe('a held lead joins the survey targets ahead of the proximity cap', () => {
  it('without a lead the far ruin is cut by the cap', () => {
    const graph = world();
    expect(surveysOf(graph).some(c => c.targetNodeId === RUIN)).toBe(false);
  });

  it('with a lead the ruin is surveyed, and the survey carries the lead pull', () => {
    const graph = world();
    holdLead(graph);
    const survey = surveysOf(graph).find(c => c.targetNodeId === RUIN);
    expect(survey).toBeDefined();
    expect(survey!.leadPull).toBe(CLUE_LEAD_SURVEY_PULL_MULT);
    // Only the lead's ruin is pulled — a nearby town survey carries no pull.
    expect(surveysOf(graph).filter(c => c.targetNodeId !== RUIN).every(c => c.leadPull === undefined)).toBe(true);
  });

  it('a spent lead is no reason to look', () => {
    const graph = world();
    holdLead(graph);
    graph.getEdge(`lead_${RUIN}_10`)!.properties.consumed = true;
    expect(surveysOf(graph).some(c => c.targetNodeId === RUIN)).toBe(false);
  });
});

describe('the lead pass — a lead is a reason outside any ambition\'s cell list', () => {
  // Under the `templates` model the ambition's cell list is ignored, so the survey
  // cell is not on the walk at all: only the lead pass can put it on the board.
  it('a deciding mortal walks the survey cell for the lead\'s ruin alone', () => {
    const graph = world('spotlight');
    holdLead(graph);
    const surveys = surveysOf(graph, 'templates');
    expect(surveys.map(c => c.targetNodeId)).toEqual([RUIN]);
    expect(surveys[0].leadPull).toBe(CLUE_LEAD_SURVEY_PULL_MULT);
  });

  it('an ambient mortal holding the same lead does not', () => {
    const graph = world('ambient');
    holdLead(graph);
    expect(surveysOf(graph, 'templates')).toHaveLength(0);
  });
});

describe('heldLeadRuinIds — freshest first, capped', () => {
  it('orders by discovery tick, newest first, and keeps at most the cap', () => {
    const graph = world();
    for (let i = 0; i < CLUE_LEAD_SURVEY_CANDIDATES_MAX + 1; i++) {
      graph.addNode({
        id: `ruin_${i}`, name: `Ruin ${i}`, type: 'location',
        properties: { locationSubtype: 'elder_ruin', hexCol: 20 + i, hexRow: 20 },
      });
      holdLead(graph, `ruin_${i}`, 10 + i);
    }
    const ids = heldLeadRuinIds(graph, ACTOR);
    expect(ids).toHaveLength(CLUE_LEAD_SURVEY_CANDIDATES_MAX);
    expect(ids[0]).toBe(`ruin_${CLUE_LEAD_SURVEY_CANDIDATES_MAX}`);
  });
});

describe('a survey sharpens a held lead instead of refusing', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('sharpenClue raises precision to the better of the two and freshens the lead', () => {
    const graph = world();
    holdLead(graph, RUIN, 10, 'vague');
    const r = sharpenClue(graph, ACTOR, RUIN, 50, 0.5, 'narrowed');
    expect(r.success).toBe(true);
    expect([r.from, r.to]).toEqual(['vague', 'narrowed']);
    const edge = graph.getEdge(r.createdId!)!;
    expect(edge.properties.precision).toBe('narrowed');
    expect(edge.properties.discoveredTick).toBe(50);

    // Never down: a lesser band leaves a narrowed lead narrowed (but fresh).
    const again = sharpenClue(graph, ACTOR, RUIN, 60, 0.5, 'vague');
    expect(again.to).toBe('narrowed');
    expect(graph.getEdge(again.createdId!)!.properties.discoveredTick).toBe(60);
  });

  it('refuses with no_lead when there is nothing to sharpen, leaving spawnClue to mint', () => {
    const graph = world();
    expect(sharpenClue(graph, ACTOR, RUIN, 50, 0.5, 'narrowed').error).toBe('no_lead');
    expect(spawnClue(graph, ACTOR, RUIN, 50, 0.5, 'narrowed').success).toBe(true);
  });

  it('the observe × Location reader sharpens a rumour to narrowed and traces it', () => {
    const graph = world();
    holdLead(graph, RUIN, 10, 'vague');
    const type = getUndertakingObjectType('location')!;
    const observe = type.verbs.observe as (ctx: unknown) => { success: boolean };
    observe({
      state: { graph, tick: 40 } as unknown as GameState,
      graph, actorId: ACTOR, handle: { kind: 'node', nodeId: RUIN }, tick: 40, outcome: 'success',
    });

    const leads = graph.getOutgoingEdges(ACTOR, 'knows_clue_of').filter(e => e.target === RUIN);
    expect(leads).toHaveLength(1); // sharpened in place, not stacked
    expect(leads[0].properties.precision).toBe('narrowed');

    const traces = getTraces() as ReadonlyArray<Record<string, unknown>>;
    const sharpened = traces.find(t => t.category === 'ruins.clue_sharpened');
    expect(sharpened).toMatchObject({ from: 'vague', to: 'narrowed', via: 'survey', band: 'success' });
    const reader = traces.find(t => t.category === 'undertaking_reader' && t.reader === 'clue');
    expect(reader?.refused).toBeUndefined();
    expect(reader?.productId).toBe(leads[0].id);
  });
});
