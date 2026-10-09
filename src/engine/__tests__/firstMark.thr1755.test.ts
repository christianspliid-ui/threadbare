/**
 * THR-1755 (THR-1644 S3, D5) — The First's mark.
 *
 * At the bond The First gains one `bestowed` trait, the `GOD_GIVEN_TRAITS` entry
 * for their spark's reach (the meeting) or primary reach (the card route), worth
 * `FIRST_MARK_REACH_CONTRIBUTION` raw capability in that reach. Later threads get
 * none, and a First never carries two.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { resetEventCounter } from '../orchestrator';
import { computeRawScore } from '../domainCapability';
import { graphContentCatalogs } from '../contentQuery';
import { drainThreadingRites } from '../threadingRiteQueue';
import { applyThreadingRite } from '../threadingRite';
import {
  FIRST_MARK_TAG,
  FIRST_MARK_TRAIT_DEFINITIONS,
  getFirstMarkDisplay,
  grantFirstMark,
  heldMarkId,
  markIdFor,
  seedFirstMarkTraits,
} from '../firstMark';
import {
  bindSparkVisionsToCandidate,
  buildNarrativeResult,
  createAgentFromMeeting,
  generateNarrativeCandidates,
  generateSparkVisions,
  resetMeetingCounter,
} from '../meetingEncounter';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { GOD_GIVEN_TRAITS } from '../../data/meeting-content';
import { FIRST_MARK_REACH_CONTRIBUTION } from '../../data/threading-rite-constants';
import { THREAD_CREATION_TEMPLATES } from '../../data/unified-action-templates';
import { REACH_DOMAINS } from '../../types/traits';
import type { ReachDomain } from '../../types/traits';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ASC = 'asc';

function makeGraph(primaryReach: ReachDomain = 'stone'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  for (const id of ['wren', 'hadrel']) {
    g.addNode({
      id,
      type: 'actor',
      name: id,
      properties: {
        actorType: 'individual',
        primaryReach,
        secondaryReach: 'heart',
        axiologicalProfile: {},
        domainCapabilities: { [primaryReach]: 40, heart: 20 },
        quintessence: 0.9,
      },
    });
  }
  return g;
}

function makeState(graph: WorldGraph, tick = 5): GameState {
  return { tick, seed: 42, graph, ascendantId: ASC, tickEvents: [], recentEvents: [] } as unknown as GameState;
}

function threadWithCard(graph: WorldGraph, target: string, tick: number): void {
  const template = THREAD_CREATION_TEMPLATES.find(t => t.id === 'bind_thread_agent')!;
  const step = template.steps[0];
  if (isActionStepBranch(step)) throw new Error('branch');
  const result = executeGraphOps(graph, [...step.onSuccess], { actorId: ASC, targetId: target, locationId: target, tick });
  expect(result.allSucceeded).toBe(true);
}

function markEdges(graph: WorldGraph, agentId: string) {
  return graph.getOutgoingEdges(agentId, 'has_trait').filter(e => e.target.startsWith('trait.god.'));
}

beforeEach(() => {
  resetOpCounter();
  resetEventCounter();
  clearTraces();
  enableTracing();
});
afterEach(() => disableTracing());

describe('THR-1755 — the eight mark definitions', () => {
  it('one per reach, keeping the GOD_GIVEN_TRAITS ids, each worth the constant in its own reach', () => {
    expect(FIRST_MARK_TRAIT_DEFINITIONS.map(n => n.id)).toEqual(GOD_GIVEN_TRAITS.map(t => t.id));
    for (const reach of REACH_DOMAINS) {
      const id = markIdFor(reach);
      expect(id, reach).toBeDefined();
      const def = FIRST_MARK_TRAIT_DEFINITIONS.find(n => n.id === id)!;
      expect(def.properties.subcategory).toBe('destiny');
      expect(def.properties.visibility).toBe('public');
      expect(def.properties.tags).toContain(FIRST_MARK_TAG);
      expect(def.properties.domainContributions).toEqual({ [reach]: FIRST_MARK_REACH_CONTRIBUTION });
    }
  });

  it('every entry carries a mark line and plain reach words', () => {
    for (const t of GOD_GIVEN_TRAITS) {
      expect(t.markLine, t.id).toMatch(/\.$/);
      expect(t.reachWork, t.id).toBeTruthy();
    }
  });

  it('seeding is idempotent and per-node', () => {
    const g = new WorldGraph();
    expect(seedFirstMarkTraits(g)).toBe(8);
    expect(seedFirstMarkTraits(g)).toBe(0);
  });
});

describe('THR-1755 — the mark is never loot', () => {
  it('a seeded world offers no mark as a Power candidate', () => {
    const g = new WorldGraph();
    seedFirstMarkTraits(g);
    const powers = graphContentCatalogs(g).candidates('power_template').map(c => c.id);
    for (const t of GOD_GIVEN_TRAITS) expect(powers, t.id).not.toContain(t.id);
  });

  it('a tag-only copy of a mark neither blocks the grant nor counts as held', () => {
    const g = makeGraph('heart');
    g.addNode({ id: 'copy.stone', type: 'trait', name: 'Stone Blood', properties: { subcategory: 'bestowed', tags: [FIRST_MARK_TAG], domainContributions: {} } });
    g.addEdge({ id: 'e.copy', source: 'wren', target: 'copy.stone', type: 'has_trait', properties: { level: 1 } });
    expect(heldMarkId(g, 'wren')).toBeUndefined();
    expect(grantFirstMark(g, 'wren', 'heart', 5).markId).toBe('trait.god.heartfire');
  });
});

describe('THR-1755 — computeRawScore', () => {
  it('the mark raises its reach by exactly FIRST_MARK_REACH_CONTRIBUTION, and no other reach', () => {
    const g = makeGraph('iron');
    const before = Object.fromEntries(REACH_DOMAINS.map(r => [r, computeRawScore(g, 'wren', r)]));
    const grant = grantFirstMark(g, 'wren', 'iron', 5);
    expect(grant.markId).toBe('trait.god.iron_will');
    for (const r of REACH_DOMAINS) {
      const delta = computeRawScore(g, 'wren', r) - before[r];
      expect(delta, r).toBe(r === 'iron' ? FIRST_MARK_REACH_CONTRIBUTION : 0);
    }
  });
});

describe('THR-1755 — grantFirstMark', () => {
  it('mints the definition lazily on an unseeded world — never throws', () => {
    const g = makeGraph('veil');
    expect(g.getNode('trait.god.veil_sight')).toBeUndefined();
    expect(grantFirstMark(g, 'wren', 'veil', 5).markId).toBe('trait.god.veil_sight');
    expect(g.getNode('trait.god.veil_sight')?.properties.subcategory).toBe('destiny');
  });

  it('a First carries exactly one mark — a second grant keeps the first', () => {
    const g = makeGraph('iron');
    grantFirstMark(g, 'wren', 'iron', 5);
    expect(grantFirstMark(g, 'wren', 'gold', 9).markId).toBe('trait.god.iron_will');
    expect(markEdges(g, 'wren')).toHaveLength(1);
  });

  it('an unknown reach grants nothing', () => {
    const g = makeGraph('iron');
    expect(grantFirstMark(g, 'wren', undefined, 5)).toEqual({ skipped: 'unknown_reach' });
    expect(heldMarkId(g, 'wren')).toBeUndefined();
  });
});

describe('THR-1755 — the card route', () => {
  it('a card-route First carries the mark of its primary reach; the second thread carries none', () => {
    const g = makeGraph('stone');
    threadWithCard(g, 'wren', 5);
    threadWithCard(g, 'hadrel', 5);
    drainThreadingRites(makeState(g), false);

    expect(markEdges(g, 'wren').map(e => e.target)).toEqual(['trait.god.stone_blood']);
    expect(markEdges(g, 'hadrel')).toEqual([]);

    const applied = getTraces().filter(t => t.category === 'rite.applied');
    const first = applied.find(t => t.agentId === 'wren');
    if (first?.category !== 'rite.applied') throw new Error('no rite.applied');
    expect(first.markTraitId).toBe('trait.god.stone_blood');
  });

  it('a First with no primaryReach takes its highest reach', () => {
    const g = makeGraph('gold');
    delete g.getNode('wren')!.properties.primaryReach;
    threadWithCard(g, 'wren', 5);
    drainThreadingRites(makeState(g), false);
    expect(heldMarkId(g, 'wren')).toBe('trait.god.golden_tongue');
  });

  it('the sheet reads the mark from the edge', () => {
    const g = makeGraph('stone');
    expect(getFirstMarkDisplay(g, 'wren')).toBeUndefined();
    threadWithCard(g, 'wren', 5);
    drainThreadingRites(makeState(g), false);
    expect(getFirstMarkDisplay(g, 'wren')).toMatchObject({
      traitId: 'trait.god.stone_blood',
      name: 'Stone Blood',
      reach: 'stone',
    });
  });

  it('a non-First rite writes no mark even when called directly', () => {
    const g = makeGraph('iron');
    g.addEdge({ id: 'e.t', source: ASC, target: 'wren', type: 'thread', properties: { courtPosition: 'watched' } });
    const r = applyThreadingRite(g, { agentId: 'wren', ascendantId: ASC, tick: 5, shape: 'short', viaMeeting: false, handPlayed: false });
    expect(r.markTraitId).toBeUndefined();
    expect(heldMarkId(g, 'wren')).toBeUndefined();
  });
});

describe('THR-1755 — the meeting route', () => {
  it.each([42, 99, 2])('seed %i: the meeting First carries exactly the mark of its spark reach', seed => {
    const candidates = generateNarrativeCandidates('hunger.golden', 'culture.golden', seed, undefined, 'life');
    const candidate = candidates[seed % candidates.length];
    const visions = bindSparkVisionsToCandidate(generateSparkVisions(candidate.primaryReach, 'life', seed), candidate);
    // Pick a vision whose reach differs from the primary when one exists, so the
    // test tells the spark reach from the primary-reach fallback.
    const vision = visions.find(v => v.reachInvestment !== candidate.primaryReach) ?? visions[0];
    const result = buildNarrativeResult({
      candidate, vision, dilemmaChoices: [], editedName: undefined,
      locationId: 'loc_village', ascendantSphere: 'life', tick: 10,
    });
    const g = new WorldGraph();
    g.addNode({ id: ASC, type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'loc_village', type: 'location', name: 'Ashenmoor', properties: {} });
    resetMeetingCounter();
    const agentId = createAgentFromMeeting(g, result, ASC, 10);

    const marks = markEdges(g, agentId);
    expect(marks).toHaveLength(1);
    expect(marks[0].target).toBe(markIdFor(vision.reachInvestment));
  });
});
