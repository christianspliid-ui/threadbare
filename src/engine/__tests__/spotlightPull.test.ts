/**
 * Spotlight pull — attention follows ambition (THR-1348).
 *
 * Fixtures that falsify: each arm asserts a state the pull writes and a state it
 * must leave alone, so removing a rule from `demotionCandidates` or reordering the
 * comparator reds a named test rather than shifting a count.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  pullHolderIntoSpotlight,
  demotionCandidates,
  compareDemotionCandidates,
  countOverflowPulls,
  overflowAllowance,
  readSpotlightLedger,
  markWitnessed,
  collectBusyActorIds,
  hasCapabilityPath,
  flushSpotlightPullTrace,
  resetSpotlightPullTrace,
  LAST_WITNESSED_TICK_KEY,
  SPOTLIGHT_PULLED_TICK_KEY,
  SPOTLIGHT_PULL_DEMOTED_ID_KEY,
} from '../spotlightPull';
import { demoteToTier } from '../npcGraduation';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import { findAmbitionTemplateById } from '../../data/ambition-templates';
import {
  SPOTLIGHT_AMBITION_PULL_MAX,
  SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE,
  SPOTLIGHT_WITNESS_WINDOW_TICKS,
  SPOTLIGHT_PULL_EVENT_SIGNIFICANCE,
} from '../../data/agent-behavior-constants';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { SpotlightPullTrace } from '../../types/trace';
import { shouldRenderIndividualOnHexMap } from '../../components/Game/hexMapAgentVisibility';
import type { SpotlightTier } from '../../types/npc';

// A strategic-profiled ambition and a plain one, both live content — asserted below
// so a content edit that flips either fails here by name rather than vacuously.
const STRATEGIC = 'ambition_dominate_trade';
// THR-1560: `ambition_avenge_fallen` gained a profile (the hunt); its event-minted sibling is still plain.
const PLAIN = 'ambition_avenge_the_wrong';

function addMortal(
  g: WorldGraph,
  id: string,
  tier: SpotlightTier | undefined,
  props: Record<string, unknown> = {},
): void {
  g.addNode({
    id,
    type: 'actor',
    name: `Mortal ${id}`,
    properties: {
      actorType: 'individual',
      ...(tier ? { spotlightTier: tier } : {}),
      npcRole: 'merchant',
      ...props,
    },
  });
}

function pursue(g: WorldGraph, actorId: string, templateId: string, status = 'active'): void {
  const nodeId = `ambition.${templateId}`;
  if (!g.getNode(nodeId)) {
    g.addNode({
      id: nodeId,
      type: 'ambition',
      name: templateId,
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId },
    });
  }
  g.addEdge({
    id: `pursues_${actorId}_${nodeId}`,
    source: actorId,
    target: nodeId,
    type: 'pursues',
    properties: { status, priority: 'primary', assignedTick: 0, completedMilestones: [] },
  });
}

function tierOf(g: WorldGraph, id: string): SpotlightTier | undefined {
  return g.getNode(id)?.properties.spotlightTier as SpotlightTier | undefined;
}

const fixedRng = () => 0.5;

beforeEach(() => {
  resetSpotlightPullTrace();
  clearTraces();
  enableTracing();
});
afterEach(() => {
  flushSpotlightPullTrace();
  disableTracing();
  clearTraces();
});

describe('fixture guards', () => {
  it('the two templates are what the fixtures assume', () => {
    expect(findAmbitionTemplateById(STRATEGIC)?.strategicProfile).toBeDefined();
    expect(findAmbitionTemplateById(PLAIN)?.strategicProfile).toBeUndefined();
  });
});

describe('pullHolderIntoSpotlight — the swap', () => {
  it('promotes an ambient holder through hydrateToTier and demotes exactly one candidate, least recently witnessed first', () => {
    const g = new WorldGraph();
    const tick = 200; // every witness below is outside SPOTLIGHT_WITNESS_WINDOW_TICKS
    addMortal(g, 'h', 'ambient');
    pursue(g, 'h', STRATEGIC);
    addMortal(g, 's1', 'spotlight', { [LAST_WITNESSED_TICK_KEY]: 10, importance: 0, domainCapabilities: { iron: 40 } });
    addMortal(g, 's2', 'spotlight', { [LAST_WITNESSED_TICK_KEY]: 50, importance: 0, domainCapabilities: { iron: 40 } });
    addMortal(g, 's3', 'spotlight', { importance: 99, domainCapabilities: { iron: 40 }, axiologicalProfile: { a: 1 } }); // never witnessed

    const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, tick, { rng: fixedRng });
    expect(r.pulled).toBe(true);
    if (!r.pulled) return;

    // The holder: promoted, hydrated, marked.
    expect(tierOf(g, 'h')).toBe('spotlight');
    expect(hasCapabilityPath(g.getNode('h'))).toBe(true);
    expect(g.getNode('h')!.properties[SPOTLIGHT_PULLED_TICK_KEY]).toBe(tick);
    expect(g.getNode('h')!.properties[SPOTLIGHT_PULL_DEMOTED_ID_KEY]).toBe('s3');
    expect(r.fromTier).toBe('ambient');
    expect(r.demotedId).toBe('s3');

    // Exactly one demotion — never witnessed sorts before witnessed long ago, and
    // importance 99 does not save s3: the order is witness first, never importance alone.
    expect(tierOf(g, 's3')).toBe('notable');
    expect(tierOf(g, 's1')).toBe('spotlight');
    expect(tierOf(g, 's2')).toBe('spotlight');

    // Demotion strips nothing hydration minted.
    expect(g.getNode('s3')!.properties.domainCapabilities).toEqual({ iron: 40 });
    expect(g.getNode('s3')!.properties.axiologicalProfile).toEqual({ a: 1 });

    // The one chronicle line.
    expect(r.event.type).toBe('narrative');
    expect(r.event.actorId).toBe('h');
    expect(r.event.significance).toBe(SPOTLIGHT_PULL_EVENT_SIGNIFICANCE);
    expect(r.event.message).toContain('Mortal h sets their mind to');

    // The deciding population is flat by construction: 3 before (s1, s2, s3), 3 after (h, s1, s2).
    const deciding = g.getNodesByType('actor').filter(isAutonomousDecisionActor).map(n => n.id).sort();
    expect(deciding).toEqual(['h', 's1', 's2']);

    // One aggregate trace carrying `autonomousAfter`.
    flushSpotlightPullTrace();
    const traces = getTraces().filter(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].pulled).toEqual([{ agentId: 'h', templateId: STRATEGIC, fromTier: 'ambient', demotedId: 's3', demotedReason: 'no_strategic_want' }]);
    expect(traces[0].refused).toEqual([]);
    expect(traces[0].autonomousAfter).toBe(3);
  });

  it('the pulled mortal is admitted by the hex-map tier filter, and the demoted one stays on the map as notable', () => {
    const g = new WorldGraph();
    addMortal(g, 'h', 'ambient');
    pursue(g, 'h', STRATEGIC);
    addMortal(g, 's1', 'spotlight', { domainCapabilities: { iron: 40 } });
    expect(shouldRenderIndividualOnHexMap(tierOf(g, 'h'), 0)).toBe(false);

    const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, 5, { rng: fixedRng });
    expect(r.pulled).toBe(true);
    expect(shouldRenderIndividualOnHexMap(tierOf(g, 'h'), 0)).toBe(true);
    expect(tierOf(g, 's1')).toBe('notable');
    expect(shouldRenderIndividualOnHexMap(tierOf(g, 's1'), 0)).toBe(true);
  });

  it('is deterministic under a different insertion order — the demotion order is a total order, not graph order', () => {
    const build = (order: string[]): string | null => {
      const g = new WorldGraph();
      addMortal(g, 'h', 'notable');
      pursue(g, 'h', STRATEGIC);
      for (const id of order) addMortal(g, id, 'spotlight', { importance: 3, domainCapabilities: { iron: 40 } });
      const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, 1, { rng: fixedRng });
      return r.pulled ? r.demotedId : null;
    };
    expect(build(['b', 'a', 'c'])).toBe('a');
    expect(build(['c', 'b', 'a'])).toBe('a');
  });

  it('a second assignment to a pulled mortal is refused already_pulled, and the refusal is on the node and in the trace', () => {
    const g = new WorldGraph();
    addMortal(g, 'h', 'ambient');
    pursue(g, 'h', STRATEGIC);
    addMortal(g, 's1', 'spotlight', { domainCapabilities: { iron: 40 } });
    addMortal(g, 's2', 'spotlight', { domainCapabilities: { iron: 40 } });
    expect(pullHolderIntoSpotlight(g, 'h', STRATEGIC, 1, { rng: fixedRng }).pulled).toBe(true);

    // Simulate the churn the re-eval loop would drive: demote h by hand, assign again.
    demoteToTier(g, 'h', 'notable');
    const again = pullHolderIntoSpotlight(g, 'h', 'ambition_great_work', 2, { rng: fixedRng });
    expect(again).toEqual({ pulled: false, reason: 'already_pulled' });
    expect(tierOf(g, 'h')).toBe('notable'); // nothing re-promoted, nobody else demoted
    expect(tierOf(g, 's2')).toBe('spotlight');

    const ledger = readSpotlightLedger(g);
    expect(ledger.refused).toEqual([{ id: 'h', reason: 'already_pulled', tick: 2 }]);
    flushSpotlightPullTrace();
    // Two aggregates: tick 1 (the pull) and tick 2 (the refusal) — one per tick, never per pull.
    const traces = getTraces().filter(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace[];
    expect(traces.map(t => t.tick)).toEqual([1, 2]);
    expect(traces[1].refused).toEqual([{ agentId: 'h', templateId: 'ambition_great_work', reason: 'already_pulled' }]);
    expect(traces[1].pulled).toEqual([]);
  });

  /** A deciding population no swap can reach — every mortal threaded — sized to a given allowance. */
  function addProtectedDeciders(g: WorldGraph, count: number): void {
    if (!g.getNode('god')) g.addNode({ id: 'god', type: 'actor', name: 'god', properties: { actorType: 'ascendant' } });
    for (let i = 0; i < count; i++) {
      addMortal(g, `followed${i}`, 'spotlight', { domainCapabilities: { iron: 40 } });
      g.addEdge({ id: `t${i}`, source: 'god', target: `followed${i}`, type: 'thread', properties: { courtPosition: 'retinue' } });
    }
  }

  it('overflow runs net-additive when no candidate exists and stops at the world\'s allowance with reason budget', () => {
    const g = new WorldGraph();
    // Enough deciders that the share reaches the ceiling: the allowance is MAX.
    const deciders = Math.ceil(SPOTLIGHT_AMBITION_PULL_MAX / SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE) + 1;
    addProtectedDeciders(g, deciders);
    expect(overflowAllowance(g)).toBe(SPOTLIGHT_AMBITION_PULL_MAX);

    const holders = Array.from({ length: SPOTLIGHT_AMBITION_PULL_MAX + 1 }, (_, i) => `h${i}`);
    for (const h of holders) {
      addMortal(g, h, 'ambient');
      pursue(g, h, STRATEGIC);
    }

    const results = holders.map((h, i) => pullHolderIntoSpotlight(g, h, STRATEGIC, 10 + i, { rng: fixedRng }));
    for (let i = 0; i < SPOTLIGHT_AMBITION_PULL_MAX; i++) {
      expect(results[i]).toMatchObject({ pulled: true, demotedId: null });
    }
    expect(results[SPOTLIGHT_AMBITION_PULL_MAX]).toEqual({ pulled: false, reason: 'budget' });
    expect(tierOf(g, holders[SPOTLIGHT_AMBITION_PULL_MAX])).toBe('ambient');
    expect(tierOf(g, 'followed0')).toBe('spotlight');
    expect(countOverflowPulls(g)).toBe(SPOTLIGHT_AMBITION_PULL_MAX);

    const ledger = readSpotlightLedger(g);
    expect(ledger.overflow).toBe(SPOTLIGHT_AMBITION_PULL_MAX);
    expect(ledger.overflowAllowance).toBe(SPOTLIGHT_AMBITION_PULL_MAX);
    expect(ledger.pulled.map(p => p.id)).toEqual(holders.slice(0, SPOTLIGHT_AMBITION_PULL_MAX));
    expect(ledger.refused).toEqual([{ id: holders[SPOTLIGHT_AMBITION_PULL_MAX], reason: 'budget', tick: 10 + SPOTLIGHT_AMBITION_PULL_MAX }]);
  });

  it('the allowance scales with the deciding population: a small world gets fewer net-additive pulls than the ceiling, an empty one none', () => {
    // The share is read off the population *less* the overflow already standing, so a
    // pull does not grow the allowance that admitted it.
    const small = new WorldGraph();
    const smallCount = Math.ceil(1 / SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE) + 1; // e.g. 11 at 0.1 → allowance 1
    addProtectedDeciders(small, smallCount);
    expect(overflowAllowance(small)).toBe(Math.min(SPOTLIGHT_AMBITION_PULL_MAX, Math.floor(smallCount * SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE)));
    expect(overflowAllowance(small)).toBeLessThan(SPOTLIGHT_AMBITION_PULL_MAX);
    addMortal(small, 'h0', 'ambient'); pursue(small, 'h0', STRATEGIC);
    addMortal(small, 'h1', 'ambient'); pursue(small, 'h1', STRATEGIC);
    expect(pullHolderIntoSpotlight(small, 'h0', STRATEGIC, 1, { rng: fixedRng })).toMatchObject({ pulled: true, demotedId: null });
    expect(overflowAllowance(small)).toBe(1); // unchanged by the pull it admitted
    expect(pullHolderIntoSpotlight(small, 'h1', STRATEGIC, 2, { rng: fixedRng })).toEqual({ pulled: false, reason: 'budget' });

    const empty = new WorldGraph();
    addMortal(empty, 'h', 'ambient'); pursue(empty, 'h', STRATEGIC);
    expect(overflowAllowance(empty)).toBe(0);
    expect(pullHolderIntoSpotlight(empty, 'h', STRATEGIC, 1, { rng: fixedRng })).toEqual({ pulled: false, reason: 'budget' });
  });

  it('a pulled mortal already in the spotlight no longer counts as overflow once they are demoted by a later pull', () => {
    // Overflow is *outstanding* net-additive pulls: a pulled mortal who later
    // steps back frees the budget. Falsifies a count that reads the mark alone.
    const g = new WorldGraph();
    addProtectedDeciders(g, Math.ceil(1 / SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE) + 1);
    addMortal(g, 'h', 'ambient');
    pursue(g, 'h', STRATEGIC);
    expect(pullHolderIntoSpotlight(g, 'h', STRATEGIC, 1, { rng: fixedRng })).toMatchObject({ pulled: true, demotedId: null });
    expect(countOverflowPulls(g)).toBe(1);
    demoteToTier(g, 'h', 'notable');
    expect(countOverflowPulls(g)).toBe(0);
  });

  it('does nothing, marks nothing and traces nothing for a plain template, a spotlight holder, or a missing actor', () => {
    const g = new WorldGraph();
    addMortal(g, 'h', 'ambient');
    addMortal(g, 's', 'spotlight');
    addMortal(g, 'legacy', undefined); // unset tier reads as spotlight — the pinned default
    addMortal(g, 'cand', 'spotlight', { domainCapabilities: { iron: 40 } });

    expect(pullHolderIntoSpotlight(g, 'h', PLAIN, 1, { rng: fixedRng })).toEqual({ pulled: false, reason: 'not_applicable' });
    expect(pullHolderIntoSpotlight(g, 's', STRATEGIC, 1, { rng: fixedRng })).toEqual({ pulled: false, reason: 'not_applicable' });
    expect(pullHolderIntoSpotlight(g, 'legacy', STRATEGIC, 1, { rng: fixedRng })).toEqual({ pulled: false, reason: 'not_applicable' });
    expect(pullHolderIntoSpotlight(g, 'ghost', STRATEGIC, 1, { rng: fixedRng })).toEqual({ pulled: false, reason: 'not_applicable' });

    expect(tierOf(g, 'h')).toBe('ambient');
    expect(tierOf(g, 'cand')).toBe('spotlight');
    expect(g.getNode('h')!.properties[SPOTLIGHT_PULLED_TICK_KEY]).toBeUndefined();
    expect(readSpotlightLedger(g)).toMatchObject({ pulled: [], overflow: 0, refused: [] });
    flushSpotlightPullTrace();
    expect(getTraces().filter(t => t.category === 'spotlight_pull')).toHaveLength(0);
  });

  it('derives a reproducible stream when no rng is supplied', () => {
    const run = () => {
      const g = new WorldGraph();
      addMortal(g, 'h', 'ambient');
      pursue(g, 'h', STRATEGIC);
      pullHolderIntoSpotlight(g, 'h', STRATEGIC, 7, { seed: 42 });
      return g.getNode('h')!.properties;
    };
    const a = run();
    const b = run();
    expect(a.domainCapabilities).toEqual(b.domainCapabilities);
    expect(a.axiologicalProfile).toEqual(b.axiologicalProfile);
  });
});

describe('demotionCandidates — who may never step back', () => {
  it('excludes the avatar, a followed or retinue mortal, a strategic holder, a busy mortal, a pulled mortal and non-deciders; admits a dormant thread', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'god', type: 'actor', name: 'god', properties: { actorType: 'ascendant' } });
    addMortal(g, 'avatar', 'spotlight');
    g.addEdge({ id: 'av', source: 'avatar', target: 'god', type: 'avatar_of', properties: {} });
    addMortal(g, 'followed', 'spotlight');
    g.addEdge({ id: 't1', source: 'god', target: 'followed', type: 'thread', properties: { courtPosition: 'retinue' } });
    addMortal(g, 'dormant', 'spotlight');
    g.addEdge({ id: 't2', source: 'god', target: 'dormant', type: 'thread', properties: { courtPosition: 'dormant' } });
    addMortal(g, 'builder', 'spotlight');
    pursue(g, 'builder', STRATEGIC);
    addMortal(g, 'exBuilder', 'spotlight');
    pursue(g, 'exBuilder', STRATEGIC, 'abandoned'); // an abandoned strategic want does not protect
    addMortal(g, 'busy', 'spotlight');
    addMortal(g, 'pulled', 'spotlight', { [SPOTLIGHT_PULLED_TICK_KEY]: 3, [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: null });
    addMortal(g, 'notable', 'notable');
    addMortal(g, 'plainWant', 'spotlight');
    pursue(g, 'plainWant', PLAIN);
    g.addNode({ id: 'company', type: 'actor', name: 'company', properties: { actorType: 'group', spotlightTier: 'spotlight' } });
    // An army commander (incoming `commanded_by`) — a decider on purpose (THR-1437),
    // with no ambition of their own, which is exactly the shape the swap reached for
    // first on every seed before this rule.
    addMortal(g, 'commander', 'spotlight');
    g.addNode({ id: 'army', type: 'actor', name: 'army', properties: { actorType: 'group', armyState: {} } });
    g.addEdge({ id: 'cmd', source: 'army', target: 'commander', type: 'commanded_by', properties: {} });
    // A seated commander whose host has since disbanded (no `commanded_by` left) and a
    // seated faction leader — the seat protects, not the army. A rank-and-file member
    // is not seated and stays a candidate.
    g.addNode({ id: 'faction', type: 'actor', name: 'faction', properties: { actorType: 'faction' } });
    addMortal(g, 'captain', 'spotlight');
    g.addEdge({ id: 'm1', source: 'captain', target: 'faction', type: 'member_of', properties: { role: 'commander', rank: 0.8 } });
    addMortal(g, 'leader', 'spotlight');
    g.addEdge({ id: 'l1', source: 'leader', target: 'faction', type: 'leads', properties: {} });
    addMortal(g, 'rankAndFile', 'spotlight');
    g.addEdge({ id: 'm2', source: 'rankAndFile', target: 'faction', type: 'member_of', properties: { role: 'member', rank: 0.2 } });
    addMortal(g, 'seatedLeader', 'spotlight');
    g.addEdge({ id: 'm3', source: 'seatedLeader', target: 'faction', type: 'member_of', properties: { role: 'leader', rank: 1 } });

    const ids = demotionCandidates(g, 100, { busyActorIds: new Set(['busy']) }).map(n => n.id).sort();
    expect(ids).toEqual(['dormant', 'exBuilder', 'plainWant', 'rankAndFile']);
  });

  it('never demotes a threaded mortal even when it is the only candidate — the pull goes net-additive instead', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'god', type: 'actor', name: 'god', properties: { actorType: 'ascendant' } });
    // Enough threaded deciders for an allowance of one; every one of them is protected.
    for (let i = 0; i < Math.ceil(1 / SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE) + 1; i++) {
      addMortal(g, `followed${i}`, 'spotlight', { domainCapabilities: { iron: 40 } });
      g.addEdge({ id: `t${i}`, source: 'god', target: `followed${i}`, type: 'thread', properties: { courtPosition: 'inner' } });
    }
    addMortal(g, 'h', 'notable');
    pursue(g, 'h', STRATEGIC);

    const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, 1, { rng: fixedRng });
    expect(r).toMatchObject({ pulled: true, demotedId: null });
    for (let i = 0; i < Math.ceil(1 / SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE) + 1; i++) expect(tierOf(g, `followed${i}`)).toBe('spotlight');
  });
});

describe('compareDemotionCandidates — the ruling\'s order', () => {
  const node = (id: string, props: Record<string, unknown>) =>
    ({ id, type: 'actor' as const, name: id, properties: { actorType: 'individual', ...props } });

  it('orders three distinct witness ticks outside the window least recent first, whatever importance says', () => {
    const tick = 300;
    const a = node('a', { [LAST_WITNESSED_TICK_KEY]: 10, importance: 90 });
    const b = node('b', { [LAST_WITNESSED_TICK_KEY]: 50, importance: 0 });
    const c = node('c', { [LAST_WITNESSED_TICK_KEY]: 100, importance: 0 });
    const sorted = [c, b, a].sort((x, y) => compareDemotionCandidates(x, y, tick)).map(n => n.id);
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('never-witnessed sorts before every witnessed mortal', () => {
    const tick = 300;
    const never = node('n', { importance: 100 });
    const old = node('o', { [LAST_WITNESSED_TICK_KEY]: 1, importance: 0 });
    expect(compareDemotionCandidates(never, old, tick)).toBeLessThan(0);
  });

  it('ties inside the witness window fall to importance, then id', () => {
    const tick = 100;
    const inside = tick - Math.floor(SPOTLIGHT_WITNESS_WINDOW_TICKS / 2);
    const a = node('a', { [LAST_WITNESSED_TICK_KEY]: inside - 3, importance: 5 });
    const b = node('b', { [LAST_WITNESSED_TICK_KEY]: inside, importance: 2 });
    const c = node('c', { [LAST_WITNESSED_TICK_KEY]: inside - 1, importance: 2 });
    const sorted = [a, b, c].sort((x, y) => compareDemotionCandidates(x, y, tick)).map(n => n.id);
    expect(sorted).toEqual(['b', 'c', 'a']);
  });

  it('a mortal outside the window sorts before one inside it', () => {
    const tick = 100;
    const outside = node('out', { [LAST_WITNESSED_TICK_KEY]: tick - SPOTLIGHT_WITNESS_WINDOW_TICKS - 1, importance: 50 });
    const inside = node('in', { [LAST_WITNESSED_TICK_KEY]: tick - 1, importance: 0 });
    expect(compareDemotionCandidates(outside, inside, tick)).toBeLessThan(0);
  });
});

describe('markWitnessed and collectBusyActorIds', () => {
  it('stamps lastWitnessedTick on actors only, once per id', () => {
    const g = new WorldGraph();
    addMortal(g, 'a', 'spotlight');
    addMortal(g, 'b', 'notable');
    g.addNode({ id: 'town', type: 'location', name: 'town', properties: {} });
    expect(markWitnessed(g, 42, ['a', 'a', 'b', 'town', 'ghost'])).toBe(2);
    expect(g.getNode('a')!.properties[LAST_WITNESSED_TICK_KEY]).toBe(42);
    expect(g.getNode('b')!.properties[LAST_WITNESSED_TICK_KEY]).toBe(42);
    expect(g.getNode('town')!.properties[LAST_WITNESSED_TICK_KEY]).toBeUndefined();
  });

  it('reads unresolved unified actions and active undertakings, nothing else', () => {
    const busy = collectBusyActorIds({
      unifiedActions: [
        { actorId: 'mid', resolved: false },
        { actorId: 'done', resolved: true },
      ] as never,
      strategicState: {
        projects: [
          { actorId: 'building', status: 'active' },
          { actorId: 'built', status: 'completed' },
        ],
      } as never,
    });
    expect([...busy].sort()).toEqual(['building', 'mid']);
  });
});

describe('demoteToTier', () => {
  it('writes spotlightTier only, refuses a non-individual and a mortal already at or below the target', () => {
    const g = new WorldGraph();
    addMortal(g, 's', 'spotlight', { domainCapabilities: { iron: 1 }, wealth: 5 });
    addMortal(g, 'n', 'notable');
    g.addNode({ id: 'company', type: 'actor', name: 'c', properties: { actorType: 'group', spotlightTier: 'spotlight' } });

    expect(demoteToTier(g, 's', 'notable')).toBe(true);
    expect(g.getNode('s')!.properties).toMatchObject({ spotlightTier: 'notable', domainCapabilities: { iron: 1 }, wealth: 5 });
    expect(demoteToTier(g, 'n', 'notable')).toBe(false);
    expect(demoteToTier(g, 'company', 'notable')).toBe(false);
    expect(demoteToTier(g, 'ghost', 'notable')).toBe(false);
  });
});
