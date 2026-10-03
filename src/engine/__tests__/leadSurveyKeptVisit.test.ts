/**
 * The lead survey and the kept visit (THR-1686, seeded things stay alive, re-plan
 * after S3).
 *
 *   1. A survey of a held lead's ruin is an instant cell with no dice, so the board
 *      takes it as certain: advance probability 1, fit 1, zone `'certain'`. Every
 *      other instant survey still faces the forecast window.
 *   2. A mortal `waiting` at an appointment's place drops a far candidate that would
 *      overrun the due tick, and keeps local work.
 *   3. `leaning`'s overrun discount reaches the board as `appointmentDiscount`.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates, LEAD_SURVEY_CELL_ID } from '../strategicActionCandidates';
import { scoreUnifiedBoard } from '../decisionBoard';
import { rerankForAppointmentRegime, waitingTripOverruns } from '../appointments';
import { CLUE_LEAD_SURVEY_PULL_MULT, CLUE_LEAD_SURVEY_SKIPS_WINDOW } from '../ruins/constants';
import {
  APPOINTMENT_HEX_TICKS_PER_HEX,
  APPOINTMENT_DISCOUNT_ON_BOARD,
  APPOINTMENT_OVERRUN_DISCOUNT,
  APPOINTMENT_WAITING_HOLD_ENABLED,
} from '../../data/movement-content';
import { mulberry32 } from '../../lib/prng';
import type { ScoredStrategicCandidate } from '../strategicActionScoring';

const ACTOR = 'actor_holder';
const RUIN = 'ruin_far';

/**
 * A merchant too weak in every reach for the window to admit a survey, one nearby
 * town, and one ruin it holds a lead on.
 */
function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR, name: 'Holder', type: 'actor',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      domainCapabilities: { gold: 1, eye: 1, heart: 1, shadow: 1, iron: 1, stone: 1, star: 1, veil: 1 },
    },
  });
  graph.addNode({ id: 'loc_home', name: 'Home', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
  graph.addEdge({ id: 'at_home', source: ACTOR, target: 'loc_home', type: 'located_at', properties: {} });
  graph.addNode({ id: 'loc_near', name: 'Near', type: 'location', properties: { locationSubtype: 'town', hexCol: 6, hexRow: 5 } });
  graph.addNode({
    id: RUIN, name: 'The Sunken Vault', type: 'location',
    properties: { locationSubtype: 'elder_ruin', locationType: 'elder_ruin', hexCol: 9, hexRow: 9, ruinMagnitude: 0.5 },
  });
  graph.addNode({ id: 'amb', name: 'Dominate Regional Trade', type: 'ambition', properties: { templateId: 'ambition_dominate_trade' } });
  graph.addEdge({ id: 'pursues', source: ACTOR, target: 'amb', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });
  graph.addEdge({
    id: 'lead', source: ACTOR, target: RUIN, type: 'knows_clue_of',
    properties: { magnitude: 0.3, precision: 'vague', source: 'tavern_rumor', discoveredTick: 10, consumed: false },
  });
  return graph;
}

function boardFor(graph: WorldGraph) {
  const { candidates } = generateStrategicCandidates(
    graph, ACTOR, ['ambition_dominate_trade'], undefined, 20, mulberry32(7), undefined, 'cells',
  );
  const surveys = candidates.filter(c => c.templateId === LEAD_SURVEY_CELL_ID) as ScoredStrategicCandidate[];
  const board = scoreUnifiedBoard({
    graph, agentId: ACTOR, tick: 20, encounterCandidates: [], strategicCandidates: surveys,
  });
  return { surveys, board };
}

describe('part 1 — a survey of a held lead skips the forecast window', () => {
  it('the kill switch ships on', () => {
    expect(CLUE_LEAD_SURVEY_SKIPS_WINDOW).toBe(true);
  });

  it('a lead survey for a holder the window refuses takes forecast 1, fit 1 and zone certain', () => {
    const { surveys, board } = boardFor(world());
    const leadIndex = surveys.findIndex(c => c.targetNodeId === RUIN);
    expect(leadIndex).toBeGreaterThanOrEqual(0);
    expect(surveys[leadIndex].executionMode).toBe('instant');
    expect(surveys[leadIndex].leadPull).toBe(CLUE_LEAD_SURVEY_PULL_MULT);

    const entry = board.entries.find(e => e.candidateIndex === leadIndex)!;
    expect(entry.forecastZone).toBe('certain');
    expect(entry.forecastFit).toBe(1);
    expect(entry.forecast).toBe(1);
    expect(entry.advanceProbability).toBe(1);
    expect(entry.score).toBeGreaterThan(0);
    expect(entry.leadPull).toBe(CLUE_LEAD_SURVEY_PULL_MULT);
  });

  it('a survey with no lead behind it still goes through the window — the same holder is refused', () => {
    // The same instant survey cell, on the same ruin, with the lead taken away:
    // only `leadPull` separates the two, so only the lead can explain the exemption.
    const graph = world();
    const { surveys } = boardFor(graph);
    const { leadPull: _dropped, ...plain } = surveys.find(c => c.targetNodeId === RUIN)!;
    expect(plain.executionMode).toBe('instant');
    const board = scoreUnifiedBoard({
      graph, agentId: ACTOR, tick: 20, encounterCandidates: [], strategicCandidates: [plain],
    });

    const entry = board.entries[0];
    expect(entry.forecastZone).not.toBe('certain');
    expect(entry.forecastZone).toBe('refused');
    expect(entry.forecastFit).toBe(0);
    expect(entry.advanceProbability).toBeLessThan(1);
  });
});

describe('part 2 — a waiting mortal stays for its appointment', () => {
  const mk = (id: string, hexDistanceToEntry: number, finalScore = 1) => ({ id, hexDistanceToEntry, finalScore });
  const overrunning = new Set(['far_overrun', 'local_overrun', 'unknown_overrun']);
  const overruns = (c: { id: string }) => overrunning.has(c.id);

  it('the kill switch ships on', () => {
    expect(APPOINTMENT_WAITING_HOLD_ENABLED).toBe(true);
  });

  it('drops a far overrunning candidate and keeps local work and a returnable trip', () => {
    const list = [
      mk('far_overrun', 5),
      mk('local_overrun', 0),
      mk('far_returnable', 2),
      mk('unknown_overrun', Number.NaN),
    ];
    const kept = rerankForAppointmentRegime(list, 'waiting', overruns).map(c => c.id);
    expect(kept).toEqual(['local_overrun', 'far_returnable']);
  });

  it('prices a waiting trip there and back at the hex-priced rate, plus its own work', () => {
    const H = APPOINTMENT_HEX_TICKS_PER_HEX;
    // Seed 2: one hex out, a 3-tick encounter, 7 ticks left — 3 + 2H > 7 at H = 3.
    expect(waitingTripOverruns(3, 1, 3 + 2 * H - 1)).toBe(true);
    expect(waitingTripOverruns(3, 1, 3 + 2 * H)).toBe(false);
    expect(waitingTripOverruns(50, 0, 1)).toBe(false); // local work stays, whatever it costs
    expect(waitingTripOverruns(0, Number.NaN, 1000)).toBe(true); // unknown distance is not local
  });

  it('departing still drops every overrunning candidate, local ones included', () => {
    const list = [mk('far_overrun', 5), mk('local_overrun', 0), mk('far_returnable', 2)];
    expect(rerankForAppointmentRegime(list, 'departing', overruns).map(c => c.id)).toEqual(['far_returnable']);
  });
});

describe('part 3 — leaning\'s discount reaches the board', () => {
  it('the kill switch ships on', () => {
    expect(APPOINTMENT_DISCOUNT_ON_BOARD).toBe(true);
  });

  it('the leaning rerank stamps the discount on an overrunning candidate only', () => {
    const list: Array<{ id: string; hexDistanceToEntry: number; finalScore: number; appointmentDiscount?: number }> = [
      { id: 'far_overrun', hexDistanceToEntry: 5, finalScore: 1 },
      { id: 'near', hexDistanceToEntry: 1, finalScore: 0.5 },
    ];
    const out = rerankForAppointmentRegime(list, 'leaning', c => c.id === 'far_overrun');
    const far = out.find(c => c.id === 'far_overrun')!;
    expect(far.appointmentDiscount).toBe(APPOINTMENT_OVERRUN_DISCOUNT);
    expect(far.finalScore).toBeCloseTo(APPOINTMENT_OVERRUN_DISCOUNT, 10);
    expect(out.find(c => c.id === 'near')!.appointmentDiscount).toBeUndefined();
    expect(out[0].id).toBe('near');
  });

  it('a leaning overrun candidate\'s board score carries the discount', () => {
    const emptyGraph = { getNode: () => null, getOutgoingEdges: () => [] } as never;
    const mk = (id: string, vpt: number, appointmentDiscount?: number) => ({
      entry: { templateId: id, locationId: 'loc' },
      valuePerTick: vpt,
      desireMultiplier: 1,
      ...(appointmentDiscount !== undefined ? { appointmentDiscount } : {}),
    }) as never;
    const board = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 1,
      encounterCandidates: [mk('far', 1, APPOINTMENT_OVERRUN_DISCOUNT), mk('near', 0.5)],
      strategicCandidates: [],
    });
    const far = board.entries.find(e => e.id === 'far')!;
    expect(far.score).toBeCloseTo(APPOINTMENT_OVERRUN_DISCOUNT, 10);
    expect(far.appointmentDiscount).toBe(APPOINTMENT_OVERRUN_DISCOUNT);
    expect(board.entries.find(e => e.id === 'near')!.appointmentDiscount).toBeUndefined();
    expect(board.winner?.id).toBe('near');
  });
});
