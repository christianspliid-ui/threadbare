/**
 * One word for how far a work has come — THR-1962.
 *
 * The property under test: the thread row, the sheet's Designs line, the Journey
 * tab and the moment card read the same word for one work at every step, from
 * barely begun to nearly done and through a halt. Each surface is read through the
 * read-model it renders from, so a surface that picked its own table would fail.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import type { GameState } from '../../../types/gameState';
import type { StrategicProjectRuntime, UndertakingMomentRecord } from '../../../types/strategicAction';
import { getAgentStrategicSummary } from '../../../engine/strategicPresentation';
import { summarizeActiveUndertakings } from '../../../engine/agentDetail';
import { describeWorkProgress } from '../../../engine/workProgress';
import { UNDERTAKING_PROGRESS_WORDS, UNDERTAKING_TROUBLE_WORDS } from '../../../data/domain-words';
import { UNDERTAKING_HALT_RATCHET_N } from '../../../data/strategic-action-constants';
import { buildMomentCardModel } from '../momentCardModel';

const REQUIRED = 20;

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ascendant', name: 'The God', type: 'actor', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'actor_1', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  return graph;
}

function buildProject(progress: number, halts = 0, escalated = false): StrategicProjectRuntime {
  return {
    projectId: 'proj_1',
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    ambitionId: 'ambition_dominate_trade',
    verb: 'create',
    behaviorFamily: 'merchant-expansion',
    progress,
    progressRequired: REQUIRED,
    startedTick: 0,
    lastProgressTick: 10,
    status: 'active',
    halts,
    escalated,
  };
}

function buildState(graph: WorldGraph, project: StrategicProjectRuntime): GameState {
  return {
    tick: 10, graph, ascendantId: 'ascendant',
    essencePool: { spirit: 100, entropy: 100 },
    clock: { currentTick: 10 },
    strategicState: { projects: [project], controls: [], history: [] },
  } as unknown as GameState;
}

const record: UndertakingMomentRecord = {
  id: 'undertaking_at_cost_proj_1_10',
  projectId: 'proj_1',
  actorId: 'actor_1',
  templateId: 'strategic_build_warehouse',
  momentClass: 'at_cost',
  presentation: 'interrupt',
  tick: 10,
  label: 'Kael presses on with Build Warehouse, but it costs them',
  undertakingName: 'Build Warehouse',
  band: 'success_at_cost',
  effect: 'advance_at_cost',
  acknowledged: false,
};

/** Every surface's word for one project, read through its own read-model. */
function wordsOnEverySurface(project: StrategicProjectRuntime) {
  const graph = buildGraph();
  const state = buildState(graph, project);
  const summary = getAgentStrategicSummary(state.strategicState, 'actor_1', graph, 10);
  const journey = summarizeActiveUndertakings(state.strategicState, 'actor_1');
  const moment = buildMomentCardModel(state, record);
  return {
    // The row renders `phrase` then `word`; the doing-line carries the same word.
    row: summary?.activeProject?.word,
    rowLine: summary?.activeProject?.doingLine,
    // The sheet's Designs line and the agent card render `activeProject.word`.
    panel: summary?.activeProject?.word,
    journey: journey?.[0]?.progressWord,
    moment: moment.progressWord,
  };
}

describe('one progress word across every surface (THR-1962)', () => {
  it('reads the same word on the row, the panel, the Journey tab and the moment card from 0 to 100%', () => {
    const seen = new Set<string>();
    for (let progress = 0; progress <= REQUIRED; progress++) {
      const words = wordsOnEverySurface(buildProject(progress));
      const expected = describeWorkProgress(buildProject(progress)).word;
      expect(words.row).toBe(expected);
      expect(words.panel).toBe(expected);
      expect(words.journey).toBe(expected);
      expect(words.moment).toBe(expected);
      expect(words.rowLine?.endsWith(`— ${expected}`)).toBe(true);
      seen.add(expected);
    }
    // The walk crosses all five steps of the one scale, lower-cased.
    expect([...seen]).toEqual(UNDERTAKING_PROGRESS_WORDS.map(w => w.toLowerCase()));
  });

  it('shows the trouble word on every surface once the work has halted', () => {
    const cases: Array<[number, boolean, string]> = [
      [1, false, UNDERTAKING_TROUBLE_WORDS.faltering],
      [UNDERTAKING_HALT_RATCHET_N - 1, false, UNDERTAKING_TROUBLE_WORDS.goingBadly],
      [0, true, UNDERTAKING_TROUBLE_WORDS.allOrNothing],
    ];
    for (const [halts, escalated, trouble] of cases) {
      const words = wordsOnEverySurface(buildProject(REQUIRED / 2, halts, escalated));
      expect(words.row).toBe(trouble);
      expect(words.panel).toBe(trouble);
      expect(words.journey).toBe(trouble);
      expect(words.moment).toBe(trouble);
    }
  });

  it('gives a finished work no progress word on the moment card', () => {
    const graph = buildGraph();
    const done = { ...buildProject(REQUIRED), status: 'completed' as const };
    expect(buildMomentCardModel(buildState(graph, done), record).progressWord).toBeNull();
  });
});
