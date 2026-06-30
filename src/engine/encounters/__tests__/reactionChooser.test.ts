import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { ArchetypeDrift } from '../../../types/gameState';
import type { EncounterAftermathReaction } from '../../../types/unifiedAction';
import {
  computeAxisLeans,
  inferReactionLean,
  scoreReaction,
  chooseAlignedReaction,
} from '../reactionChooser';

const WEIGHT = 2.0;

function agent(profile: Record<string, number>): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'a1',
    type: 'actor',
    name: 'Test',
    properties: { actorType: 'individual', axiologicalProfile: profile },
  });
  return g;
}

const heartVice: EncounterAftermathReaction = {
  id: 'heart-vice',
  label: 'Betray the oath',
  effects: [{ kind: 'reputation_tally', key: 'heart.negative', delta: 1 }],
};
const heartVirtue: EncounterAftermathReaction = {
  id: 'heart-virtue',
  label: 'Keep the oath',
  effects: [{ kind: 'reputation_tally', key: 'heart.positive', delta: 1 }],
};
const noSignal: EncounterAftermathReaction = {
  id: 'flavor',
  label: 'Say nothing',
  effects: [{ kind: 'recent_event', message: 'A quiet moment.' }],
};
const offAxis: EncounterAftermathReaction = {
  id: 'off-axis',
  label: 'Log it',
  effects: [{ kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 }],
};

describe('computeAxisLeans', () => {
  it('returns null when the agent has no profile', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'a1', type: 'actor', name: 'X', properties: { actorType: 'individual' } });
    expect(computeAxisLeans(g, [], 'a1')).toBeNull();
  });

  it('reads the standing profile as the ±1 live position when no drift', () => {
    const leans = computeAxisLeans(agent({ loyalty_ambition: 0.8 }), [], 'a1');
    expect(leans?.heart).toBeCloseTo(0.8);
  });

  it('adds temporary drift to the baseline', () => {
    const drift: ArchetypeDrift[] = [
      { agentId: 'a1', axisId: 'heart', fromPosition: 0, toPosition: 0.1, lastUpdatedTick: 1 },
    ];
    const leans = computeAxisLeans(agent({ loyalty_ambition: 0.7 }), drift, 'a1');
    expect(leans?.heart).toBeCloseTo(0.8);
  });
});

describe('inferReactionLean', () => {
  it('maps reach-polarity tally keys to signed votes', () => {
    expect(inferReactionLean(heartVirtue, undefined)).toEqual({ heart: 1 });
    expect(inferReactionLean(heartVice, undefined)).toEqual({ heart: -1 });
  });

  it('ignores off-axis tally keys and flavor effects', () => {
    expect(inferReactionLean(offAxis, undefined)).toEqual({});
    expect(inferReactionLean(noSignal, undefined)).toEqual({});
  });

  it('maps an actor-self reputation_score delta to the encounter primary reach', () => {
    const r: EncounterAftermathReaction = {
      id: 'r',
      label: 'l',
      effects: [{ kind: 'reputation_score', delta: 0.05 }],
    };
    expect(inferReactionLean(r, 'iron')).toEqual({ iron: 1 });
    expect(inferReactionLean(r, undefined)).toEqual({}); // no reach → no signal
  });

  it('ignores faction- or other-agent-targeted effects (not the actor’s lean)', () => {
    const r: EncounterAftermathReaction = {
      id: 'r',
      label: 'l',
      effects: [
        { kind: 'reputation_tally', key: 'heart.positive', delta: 1, targetFactionId: 'faction.x' },
        { kind: 'reputation_score', delta: 0.1, targetAgentId: 'other' },
      ],
    };
    expect(inferReactionLean(r, 'heart')).toEqual({});
  });
});

describe('scoreReaction', () => {
  it('rewards agreement and penalizes disagreement', () => {
    const leans = { heart: 0.8 };
    expect(scoreReaction({ heart: 1 }, leans, WEIGHT)).toBeCloseTo(1.6);
    expect(scoreReaction({ heart: -1 }, leans, WEIGHT)).toBeCloseTo(-1.6);
    expect(scoreReaction({}, leans, WEIGHT)).toBe(0);
  });
});

describe('chooseAlignedReaction', () => {
  it('picks the in-character reaction even when it is not index 0', () => {
    const choice = chooseAlignedReaction([heartVice, heartVirtue], { heart: 0.8 }, undefined, WEIGHT);
    expect(choice.aligned).toBe(true);
    expect(choice.chosenIndex).toBe(1);
    expect(choice.reaction.id).toBe('heart-virtue');
    expect(choice.dominant).toEqual({ reach: 'heart', pole: 'virtue' });
  });

  it('a vice-leaning agent prefers the vice reaction', () => {
    const choice = chooseAlignedReaction([heartVirtue, heartVice], { heart: -0.8 }, undefined, WEIGHT);
    expect(choice.aligned).toBe(true);
    expect(choice.chosenIndex).toBe(1);
    expect(choice.dominant).toEqual({ reach: 'heart', pole: 'vice' });
  });

  it('falls back to reactions[0] for a morally-neutral agent', () => {
    const choice = chooseAlignedReaction([heartVice, heartVirtue], { heart: 0 }, undefined, WEIGHT);
    expect(choice.aligned).toBe(false);
    expect(choice.chosenIndex).toBe(0);
  });

  it('falls back to reactions[0] when no reaction carries a moral signal', () => {
    const choice = chooseAlignedReaction([noSignal, offAxis], { heart: 0.8 }, undefined, WEIGHT);
    expect(choice.aligned).toBe(false);
    expect(choice.chosenIndex).toBe(0);
  });

  it('weight 0 collapses all scores and falls back (kill-criteria lever)', () => {
    const choice = chooseAlignedReaction([heartVice, heartVirtue], { heart: 0.8 }, undefined, 0);
    expect(choice.aligned).toBe(false);
    expect(choice.chosenIndex).toBe(0);
  });

  it('breaks ties toward the lowest index (deterministic)', () => {
    // Two reactions with identical virtue signal → equal scores → pick index 0.
    const choice = chooseAlignedReaction([heartVirtue, { ...heartVirtue, id: 'dup' }], { heart: 0.8 }, undefined, WEIGHT);
    expect(choice.chosenIndex).toBe(0);
    expect(choice.aligned).toBe(true);
  });

  it('is deterministic across repeated calls', () => {
    const reactions = [heartVice, heartVirtue, noSignal];
    const a = chooseAlignedReaction(reactions, { heart: 0.6 }, undefined, WEIGHT);
    const b = chooseAlignedReaction(reactions, { heart: 0.6 }, undefined, WEIGHT);
    expect(a).toEqual(b);
    expect(a.scores).toEqual(b.scores);
  });
});
