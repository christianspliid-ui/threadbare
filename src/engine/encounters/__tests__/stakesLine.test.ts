/**
 * Stakes line + result line — THR-1727.
 *
 * Every lead source, every band, every fail-soft row of the plan's table, the
 * fork-arm overrides, and the tick-path stamp. The line builders are pure, so
 * these assert on exact strings.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { EncounterStakes, StakesContext } from '../../../types/encounterStakes';
import type { ActionStep, ActionStepBranch, UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { GameState } from '../../../types/gameState';
import {
  STAKES_LINE_MAX_CHARS,
  STAKES_RESULT_FORMS,
  type StakesResultBand,
} from '../../../data/nudge-stage-content';
import {
  STAKES_ACTOR_FALLBACK,
  buildResultLine,
  buildStakesContext,
  buildStakesLine,
  rememberedStakesLine,
  resolveStakesArmKey,
  stampStakesContext,
  stampStakesContexts,
  stakesLineForAction,
} from '../stakesLine';

const BRIDGE: EncounterStakes = {
  goal: 'cross the rotten toll bridge',
  risk: 'go into the river with the pack',
  won: 'crossed the rotten toll bridge',
  lost: 'turned back to the long ford and lost the day',
  lostBadly: 'went into the river with the pack',
};

const CHANCE: StakesContext = { motiveSource: 'chance', locationId: 'loc.grove', locationName: 'Sacred Grove' };

describe('buildStakesLine — one lead per motive source', () => {
  it('chance names the place', () => {
    expect(buildStakesLine(BRIDGE, 'Vara', CHANCE, 'ua_1')).toEqual({
      text: 'Passing through Sacred Grove, Vara must cross the rotten toll bridge — or go into the river with the pack.',
      leadSource: 'chance',
      fallback: null,
    });
  });

  it('mission names the errand, in Christian\'s phrasing', () => {
    const line = buildStakesLine(BRIDGE, 'Kael', { motiveSource: 'mission', missionName: 'Raise the Old Banner' }, 'ua_1');
    expect(line.text).toBe('As part of Raise the Old Banner, Kael must cross the rotten toll bridge — or go into the river with the pack.');
    expect(line.leadSource).toBe('mission');
  });

  it('divine addresses the god; choice names the road', () => {
    expect(buildStakesLine(BRIDGE, 'Vara', { motiveSource: 'divine' }, 'ua_1').text)
      .toMatch(/^Led here by your hand, Vara must /);
    expect(buildStakesLine(BRIDGE, 'Vara', { motiveSource: 'choice' }, 'ua_1').text)
      .toMatch(/^Choosing this road, Vara must /);
  });

  it('no motive source → no lead, no fallback reason', () => {
    expect(buildStakesLine(BRIDGE, 'Vara', { motiveSource: null }, 'ua_1')).toEqual({
      text: 'Vara must cross the rotten toll bridge — or go into the river with the pack.',
      leadSource: 'none',
      fallback: null,
    });
  });

  it('is deterministic per action id', () => {
    const a = buildStakesLine(BRIDGE, 'Vara', CHANCE, 'ua_42');
    const b = buildStakesLine(BRIDGE, 'Vara', CHANCE, 'ua_42');
    expect(a).toEqual(b);
  });
});

describe('buildStakesLine — fail-soft rows', () => {
  it('mission with no resolvable name drops the lead (never "{mission}")', () => {
    const line = buildStakesLine(BRIDGE, 'Kael', { motiveSource: 'mission' }, 'ua_1');
    expect(line.text).toBe('Kael must cross the rotten toll bridge — or go into the river with the pack.');
    expect(line.fallback).toBe('no_mission_name');
    expect(line.text).not.toMatch(/\{\w+\}/);
  });

  it('chance with no location drops the lead', () => {
    const line = buildStakesLine(BRIDGE, 'Kael', { motiveSource: 'chance' }, 'ua_1');
    expect(line.fallback).toBe('no_location');
    expect(line.text.startsWith('Kael must')).toBe(true);
  });

  it('over the length cap drops the lead, never cutting a word', () => {
    const longName = 'A'.repeat(STAKES_LINE_MAX_CHARS);
    const line = buildStakesLine(BRIDGE, 'Kael', { ...CHANCE, locationName: longName }, 'ua_1');
    expect(line.fallback).toBe('over_length_lead_dropped');
    expect(line.text).toBe('Kael must cross the rotten toll bridge — or go into the river with the pack.');
  });

  it('a nameless actor reads as the mortal', () => {
    expect(buildStakesLine(BRIDGE, undefined, { motiveSource: null }, 'ua_1').text)
      .toBe(`${STAKES_ACTOR_FALLBACK} must cross the rotten toll bridge — or go into the river with the pack.`);
  });
});

describe('buildResultLine — one form per band', () => {
  const cases: Array<[StakesResultBand, string]> = [
    ['critical_success', 'Vara crossed the rotten toll bridge.'],
    ['success', 'Vara crossed the rotten toll bridge.'],
    ['contested_won', 'Vara crossed the rotten toll bridge.'],
    ['success_at_cost', 'Vara crossed the rotten toll bridge, at a cost.'],
    ['near_miss', 'Vara nearly crossed the rotten toll bridge, but turned back to the long ford and lost the day.'],
    ['failure', 'Vara turned back to the long ford and lost the day.'],
    ['contested_lost', 'Vara turned back to the long ford and lost the day.'],
    ['critical_failure', 'Vara went into the river with the pack.'],
  ];
  it.each(cases)('%s', (band, expected) => {
    expect(buildResultLine(BRIDGE, 'Vara', band)).toBe(expected);
  });

  it('covers every band the forms table names', () => {
    expect(new Set(cases.map(([b]) => b))).toEqual(new Set(Object.keys(STAKES_RESULT_FORMS)));
  });

  it('critical_failure falls back to lost when lostBadly is unauthored', () => {
    const { lostBadly: _omit, ...plain } = BRIDGE;
    expect(buildResultLine(plain, 'Vara', 'critical_failure')).toBe('Vara turned back to the long ford and lost the day.');
  });

  it('a departed mortal still gets a sentence', () => {
    expect(buildResultLine(BRIDGE, 'a departed mortal', 'success')).toBe('A departed mortal crossed the rotten toll bridge.');
  });
});

// ─── Fork arms ────────────────────────────────────────────────────

const STEP = (prose: string): ActionStep => ({
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: prose,
});
const REFUSE = STEP('refuse');
const ACCEPT = STEP('accept');
const FORK: ActionStepBranch = {
  branchOnStep: 0,
  variants: { positive: REFUSE, negative: ACCEPT },
  fallback: REFUSE,
};
const FORKED: EncounterStakes = {
  goal: 'answer the bargain',
  risk: 'lose something of theirs',
  won: 'refused the bargain',
  lost: 'refused it clumsily',
  arms: { negative: { won: 'struck the bargain', lost: 'struck it with a hedge' } },
};

describe('fork arms', () => {
  it('resolves the arm from the recorded choice, and the fallback to its variant key', () => {
    const template = { steps: [STEP('measure'), FORK] };
    expect(resolveStakesArmKey(template, [{ stepIndex: 0, choiceId: 'negative' } as never])).toBe('negative');
    expect(resolveStakesArmKey(template, undefined)).toBe('positive');
    expect(resolveStakesArmKey({ steps: [STEP('plain')] }, undefined)).toBeUndefined();
  });

  it('credits the mortal with the arm they took', () => {
    expect(buildResultLine(FORKED, 'Ilsa', 'success', 'negative')).toBe('Ilsa struck the bargain.');
    expect(buildResultLine(FORKED, 'Ilsa', 'failure', 'negative')).toBe('Ilsa struck it with a hedge.');
    expect(buildResultLine(FORKED, 'Ilsa', 'success', 'positive')).toBe('Ilsa refused the bargain.');
    // An arm without lostBadly uses its own lost, not the other arm's.
    expect(buildResultLine(FORKED, 'Ilsa', 'critical_failure', 'negative')).toBe('Ilsa struck it with a hedge.');
  });
});

// ─── Context + stamp (tick path) ──────────────────────────────────

function world(receipt?: Record<string, unknown>): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc.town', type: 'location', name: 'Thornwick', properties: {} });
  graph.addNode({ id: 'loc.inn', type: 'location', name: 'The Low Inn', properties: { parentLocationId: 'loc.town' } });
  graph.addNode({
    id: 'agent.vara',
    type: 'actor',
    name: 'Vara',
    properties: { actorType: 'individual', ...(receipt ? { motiveReceipt: receipt } : {}) },
  });
  graph.addNode({ id: 'ambition.banner', type: 'ambition', name: 'Raise the Old Banner', properties: {} });
  graph.addEdge({ id: 'e.at', source: 'agent.vara', target: 'loc.inn', type: 'located_at', properties: {} });
  return graph;
}

function action(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_7',
    actorId: 'agent.vara',
    templateId: 'encounter.slice.unsafe_bridge',
    targetId: 'agent.vara',
    scale: 'local',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    ...over,
  };
}

const TEMPLATE = { id: 'encounter.slice.unsafe_bridge', stakes: BRIDGE, steps: [STEP('cross')], description: 'old summary' } as unknown as UnifiedActionTemplate;

describe('stakes context', () => {
  it('chance: lifts the place to the location tier', () => {
    expect(buildStakesContext(action(), world())).toEqual({
      motiveSource: 'chance', locationId: 'loc.town', locationName: 'Thornwick',
    });
  });

  it('mission: names the heaviest errand', () => {
    const graph = world({ contributions: [{ kind: 'ambition', weight: 0.9, provenance: { nodeId: 'ambition.banner' } }] });
    expect(buildStakesContext(action(), graph).missionName).toBe('Raise the Old Banner');
  });

  it('player-sourced actions are the god\'s hand', () => {
    expect(buildStakesContext(action({ source: 'player' }), world()).motiveSource).toBe('divine');
  });

  it('stamps once and freezes the lead against a later receipt change', () => {
    const graph = world();
    const stamped = stampStakesContext(action(), graph, 5, TEMPLATE);
    expect(stamped.stakesContext?.motiveSource).toBe('chance');
    expect(stampStakesContext(stamped, graph, 6, TEMPLATE)).toBe(stamped);

    // The receipt now says mission; the stamped line still opens on chance.
    graph.getNode('agent.vara')!.properties.motiveReceipt = {
      contributions: [{ kind: 'ambition', weight: 0.9, provenance: { nodeId: 'ambition.banner' } }],
    };
    expect(stakesLineForAction(stamped, TEMPLATE, graph)?.text).toMatch(/^Passing through Thornwick, Vara must/);
    // An unstamped (old-save) action reads the live receipt — fail-open.
    expect(stakesLineForAction(action(), TEMPLATE, graph)?.text).toMatch(/^As part of Raise the Old Banner, Vara must/);
  });

  it('leaves resolved actions alone', () => {
    const resolved = action({ resolved: true, outcome: 'success' });
    expect(stampStakesContext(resolved, world(), 5, TEMPLATE)).toBe(resolved);
  });

  it('stampStakesContexts keeps array identity when nothing needs stamping', () => {
    const graph = world();
    const stamped = stampStakesContext(action(), graph, 5, TEMPLATE);
    const state = { graph, tick: 6, unifiedActions: [stamped] } as unknown as GameState;
    expect(stampStakesContexts(state, () => TEMPLATE)).toEqual({});
    const fresh = { graph, tick: 6, unifiedActions: [action()] } as unknown as GameState;
    const out = stampStakesContexts(fresh, () => TEMPLATE);
    expect(out.unifiedActions?.[0].stakesContext?.motiveSource).toBe('chance');
  });
});

describe('rememberedStakesLine', () => {
  it('the result line once resolved, the opening line while live, null without stakes', () => {
    const graph = world();
    expect(rememberedStakesLine(action({ resolved: true, outcome: 'failure' }), TEMPLATE, graph))
      .toBe('Vara turned back to the long ford and lost the day.');
    expect(rememberedStakesLine(action(), TEMPLATE, graph)).toMatch(/must cross the rotten toll bridge/);
    expect(rememberedStakesLine(action(), { ...TEMPLATE, stakes: undefined } as UnifiedActionTemplate, graph)).toBeNull();
  });
});
