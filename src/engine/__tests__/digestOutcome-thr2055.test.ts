/**
 * THR-2055 — a chapter played without the god was recorded as a win by "Unknown".
 *
 * Covers the three engine faults behind it: the missed-tug entry read only
 * `properties.name` (agents carry it on `node.name`), hardcoded `success: true`
 * before the chapter had resolved, and the story digest picked its line from
 * `success` alone rather than the outcome band the aftermath tells.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAttention, resetTugCounter } from '../phaseAttention';
import {
  digestAgentName,
  digestEntryWon,
  digestOutcomeLabel,
  oneEntryPerAgent,
  settleDigestOutcome,
  DIGEST_UNNAMED_AGENT,
} from '../digestBuffer';
import { composeThreadStory, selectBeats } from '../threadDigest';
import { BEAT_TEMPLATES } from '../../data/thread-digest-content';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { DigestEntry, ThreadTug } from '../../types/attention';

const ASCENDANT_ID = 'ascendant_1';

function makeEntry(overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId: 'elara',
    agentName: 'Elara',
    encounterId: 'ua_1',
    encounterName: 'The Tribute Exchange',
    encounterType: 'explore',
    reachPrimary: 'gold',
    tick: 10,
    success: true,
    significantOutcomes: [],
    capabilityChanges: {},
    attachmentsGained: [],
    attachmentsLost: [],
    quintessenceDelta: 0,
    isNotable: false,
    wasCuratedOut: false,
    isDormantAgent: false,
    sourceType: 'agent',
    ...overrides,
  };
}

function makeState(action: UnifiedAction, tug: ThreadTug): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'Ascendant',
    properties: { actorType: 'ascendant', attentionPool: 10, attentionCapacity: 10, attentionRegen: 1 },
  });
  // The name lives on node.name only — the shape every generated agent has.
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  return {
    tick: 20,
    graph,
    ascendantId: ASCENDANT_ID,
    unifiedActions: [action],
    activeThreadTugs: [tug],
    digestBuffer: [],
    storyBeatQueue: [],
    encounterProgress: [],
  } as unknown as GameState;
}

const TEMPLATE = {
  id: 'tribute_exchange',
  name: 'The Tribute Exchange',
  reach: 'gold',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  steps: [],
} as unknown as UnifiedActionTemplate;

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'elara',
    templateId: 'tribute_exchange',
    source: 'mortal',
    resolved: false,
    effectiveTier: 'shaping',
    ...overrides,
  } as unknown as UnifiedAction;
}

const LAPSED_TUG: ThreadTug = {
  id: 'tug_1',
  agentId: 'elara',
  encounterId: 'ua_1',
  actionId: 'ua_1',
  reachPrimary: 'gold',
  threatLevel: 'moderate',
  courtPosition: 'the_first',
  createdTick: 15,
  expiresTick: 18,
  attended: false,
} as ThreadTug;

beforeEach(() => resetTugCounter());

describe('THR-2055 — the missed-chapter digest entry', () => {
  it('names the mortal from node.name and the chapter from its template', () => {
    const state = makeState(makeAction(), LAPSED_TUG);
    const out = phaseAttention(state, [TEMPLATE], () => 0.5);
    const entry = out.digestBuffer!.find(e => e.encounterId === 'ua_1')!;
    expect(entry.agentName).toBe('Elara');
    expect(entry.encounterName).toBe('The Tribute Exchange');
  });

  it('files an unresolved chapter as unresolved, never as a success', () => {
    const state = makeState(makeAction(), LAPSED_TUG);
    const entry = phaseAttention(state, [TEMPLATE], () => 0.5).digestBuffer!.find(e => e.encounterId === 'ua_1')!;
    expect(entry.unresolved).toBe(true);
    expect(entry.success).toBe(false);
    expect(digestOutcomeLabel(entry)).toBe('Still unfolding');
  });

  it('carries the band when the chapter already resolved badly', () => {
    const state = makeState(makeAction({ resolved: true, outcome: 'failure' } as Partial<UnifiedAction>), LAPSED_TUG);
    const entry = phaseAttention(state, [TEMPLATE], () => 0.5).digestBuffer!.find(e => e.encounterId === 'ua_1')!;
    expect(entry.unresolved).toBeUndefined();
    expect(entry.outcomeBand).toBe('failure');
    expect(entry.success).toBe(false);
    expect(digestOutcomeLabel(entry)).toBe('It faltered');
  });
});

describe('THR-2055 — name fallback', () => {
  it('prefers properties.name, then node.name, then a neutral word — never "Unknown"', () => {
    expect(digestAgentName({ name: 'Elara', properties: { name: 'Elara the Bold' } })).toBe('Elara the Bold');
    expect(digestAgentName({ name: 'Elara', properties: {} })).toBe('Elara');
    expect(digestAgentName(undefined)).toBe(DIGEST_UNNAMED_AGENT);
    expect(DIGEST_UNNAMED_AGENT).not.toBe('Unknown');
  });
});

describe('THR-2055 — settling on resolution', () => {
  it('fills in the band on every unresolved entry for that action, and only those', () => {
    const buffer = [
      makeEntry({ unresolved: true, success: false }),
      makeEntry({ encounterId: 'ua_other', unresolved: true, success: false }),
      makeEntry({ encounterId: 'ua_1', tick: 5 }), // already settled — untouched
    ];
    const original = buffer[0];
    expect(settleDigestOutcome(buffer, 'ua_1', 'critical_failure')).toBe(1);
    expect(buffer[0]).toMatchObject({ unresolved: false, outcomeBand: 'critical_failure', success: false });
    expect(original.unresolved).toBe(true); // replaced, not mutated
    expect(buffer[1].unresolved).toBe(true);
    expect(buffer[2].outcomeBand).toBeUndefined();
  });

  it('reads an at-cost win as won, the way the aftermath tells it', () => {
    const buffer = [makeEntry({ unresolved: true, success: false })];
    settleDigestOutcome(buffer, 'ua_1', 'success_at_cost');
    expect(buffer[0].success).toBe(true);
    expect(digestOutcomeLabel(buffer[0])).toBe('Won, at a price');
  });
});

describe('THR-2055 — the band-keyed digest line', () => {
  it('the band wins over a stale success flag', () => {
    expect(digestEntryWon({ success: true, outcomeBand: 'failure' })).toBe(false);
    expect(digestEntryWon({ success: true, outcomeBand: 'contested_lost' })).toBe(false);
    expect(digestEntryWon({ success: false, outcomeBand: 'contested_won' })).toBe(true);
    expect(digestEntryWon({ success: true })).toBe(true);
  });

  it('a lost gold chapter is never told with a gold success line', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
    const successLines = Object.entries(BEAT_TEMPLATES)
      .filter(([key]) => key.endsWith('_gold_success'))
      .flatMap(([, pool]) => pool as readonly string[])
      .map(t => t.replace(/\{name\}/g, 'Elara'));
    for (let tick = 0; tick < 40; tick++) {
      const buffer = [
        makeEntry({ tick: 100 + tick, encounterId: 'a', success: true, outcomeBand: 'failure' }),
        makeEntry({ tick: 105 + tick, encounterId: 'b', success: true, outcomeBand: 'critical_failure' }),
      ];
      const story = composeThreadStory(graph, 'elara', buffer, 110 + tick);
      expect(story.isEmpty).toBe(false);
      for (const line of story.beatLines) {
        for (const success of successLines) expect(line).not.toContain(success);
      }
    }
  });

  it('an unresolved entry is not a beat', () => {
    const beats = selectBeats('elara', [makeEntry({ unresolved: true, success: false })], 20);
    expect(beats).toHaveLength(0);
  });
});

describe('THR-2055 — the dormant court names each mortal once', () => {
  it('keeps one entry per agent, the newest', () => {
    const list = oneEntryPerAgent([
      makeEntry({ agentId: 'a', agentName: 'Ana', tick: 1 }),
      makeEntry({ agentId: 'b', agentName: 'Bo', tick: 2 }),
      makeEntry({ agentId: 'a', agentName: 'Ana', tick: 3 }),
    ]);
    expect(list.map(e => e.agentName)).toEqual(['Ana', 'Bo']);
    expect(list[0].tick).toBe(3);
  });
});
