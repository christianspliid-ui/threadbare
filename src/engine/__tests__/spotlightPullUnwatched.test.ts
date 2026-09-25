/**
 * Unwatched builders step back (THR-1523).
 *
 * Every fixture that asserts "never offered" passes `followedAgentIds: []` and
 * `projects: []` explicitly, so a pass cannot come from the omitted-option fail-closed
 * path. The fail-closed path has its own arm.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WorldGraph } from '../graph';
import {
  pullHolderIntoSpotlight,
  rankedDemotionCandidates,
  demotionCandidates,
  countOverflowPulls,
  overflowAllowance,
  readSpotlightLedger,
  lastActiveTick,
  flushSpotlightPullTrace,
  resetSpotlightPullTrace,
  LAST_WITNESSED_TICK_KEY,
  SPOTLIGHT_PULLED_TICK_KEY,
  SPOTLIGHT_PULL_DEMOTED_ID_KEY,
  SPOTLIGHT_UNWATCHED_DEMOTED_TICK_KEY,
  type SpotlightProjectActivity,
} from '../spotlightPull';
import { assignAmbitionToActor, spentSpotlightPull } from '../ambitionAssignment';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import { AMBITION_TEMPLATES, findAmbitionTemplateById } from '../../data/ambition-templates';
import {
  SPOTLIGHT_UNWATCHED_BUILDER_TICKS,
  SPOTLIGHT_UNWATCHED_SWAP_WINDOW_TICKS,
  SPOTLIGHT_UNWATCHED_SWAPS_PER_WINDOW,
  SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE,
} from '../../data/agent-behavior-constants';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { SpotlightPullTrace } from '../../types/trace';
import type { SpotlightTier } from '../../types/npc';

const STRATEGIC = 'ambition_dominate_trade';
const STRATEGIC_2 = AMBITION_TEMPLATES.find(t => t.strategicProfile && t.id !== STRATEGIC)!.id;
// THR-1560: `ambition_avenge_fallen` gained a profile (the hunt); its event-minted sibling is still plain.
const PLAIN = 'ambition_avenge_the_wrong';
const T = SPOTLIGHT_UNWATCHED_BUILDER_TICKS;
const CAPS = { domainCapabilities: { iron: 40 } };
const OPEN = { followedAgentIds: [] as string[], projects: [] as SpotlightProjectActivity[] };
const fixedRng = () => 0.5;

function addMortal(g: WorldGraph, id: string, tier: SpotlightTier, props: Record<string, unknown> = {}): void {
  g.addNode({
    id,
    type: 'actor',
    name: `Mortal ${id}`,
    properties: { actorType: 'individual', spotlightTier: tier, npcRole: 'merchant', ...CAPS, ...props },
  });
}

function pursue(g: WorldGraph, actorId: string, templateId: string, status = 'active'): void {
  const nodeId = `ambition.${templateId}`;
  if (!g.getNode(nodeId)) {
    g.addNode({ id: nodeId, type: 'ambition', name: templateId, properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId } });
  }
  g.addEdge({
    id: `pursues_${actorId}_${nodeId}`,
    source: actorId,
    target: nodeId,
    type: 'pursues',
    properties: { status, priority: 'primary', assignedTick: 0, completedMilestones: [] },
  });
}

/** A spotlight builder: holds a strategic want. */
function addBuilder(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  addMortal(g, id, 'spotlight', props);
  pursue(g, id, STRATEGIC);
}

function tierOf(g: WorldGraph, id: string): SpotlightTier | undefined {
  return g.getNode(id)?.properties.spotlightTier as SpotlightTier | undefined;
}

const ids = (g: WorldGraph, tick: number, opts = {}) =>
  demotionCandidates(g, tick, { ...OPEN, ...opts }).map(n => n.id);

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
  it('two distinct strategic templates and one plain', () => {
    expect(findAmbitionTemplateById(STRATEGIC)?.strategicProfile).toBeDefined();
    expect(findAmbitionTemplateById(STRATEGIC_2)?.strategicProfile).toBeDefined();
    expect(findAmbitionTemplateById(PLAIN)?.strategicProfile).toBeUndefined();
  });
});

describe('the lever', () => {
  it('lever off, no retained dead: the candidate set is THR-1348\'s, whatever builders would qualify', () => {
    const g = new WorldGraph();
    addMortal(g, 'plain', 'spotlight', { [LAST_WITNESSED_TICK_KEY]: 5 });
    addMortal(g, 'never', 'spotlight');
    addBuilder(g, 'idleBuilder');
    addMortal(g, 'pulled', 'spotlight', { [SPOTLIGHT_PULLED_TICK_KEY]: 1, [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: null });
    const tick = 10 * T;
    // THR-1348's order: never witnessed first, then the long-unwatched plain mortal.
    expect(ids(g, tick, { unwatchedBuildersEnabled: false })).toEqual(['never', 'plain']);
    // And the lever-on set only appends the builder — THR-1348's candidates keep their order.
    expect(ids(g, tick)).toEqual(['never', 'plain', 'idleBuilder']);
  });

  it.each([true, false])('the retained dead hold no slot and are never candidates (lever %s)', (lever) => {
    const g = new WorldGraph();
    addMortal(g, 'deadPlain', 'spotlight', { deceased: true });
    addBuilder(g, 'deadBuilder', { deceased: true });
    addMortal(g, 'deadPulled', 'spotlight', {
      deceased: true, [SPOTLIGHT_PULLED_TICK_KEY]: 1, [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: null,
    });
    for (let i = 0; i < 20; i++) addMortal(g, `f${i}`, 'spotlight');
    expect(ids(g, 10 * T, { unwatchedBuildersEnabled: lever })).not.toContain('deadPlain');
    expect(ids(g, 10 * T, { unwatchedBuildersEnabled: lever })).not.toContain('deadBuilder');
    expect(countOverflowPulls(g)).toBe(0);
    // The allowance counts the 20 living deciders, not the 23 nodes.
    expect(overflowAllowance(g)).toBe(Math.min(2, Math.floor(20 * SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE)));
  });
});

describe('the unwatched-builder class', () => {
  it('is offered after every ambition-less candidate, and a fresher builder is not offered', () => {
    const g = new WorldGraph();
    const tick = 3 * T;
    addBuilder(g, 'stale', { [LAST_WITNESSED_TICK_KEY]: 0 });
    addBuilder(g, 'staler'); // never witnessed → floor at 0, the same age as `stale`
    addBuilder(g, 'fresh', { [LAST_WITNESSED_TICK_KEY]: tick - T + 1 });
    addBuilder(g, 'edge', { [LAST_WITNESSED_TICK_KEY]: tick - T }); // exactly at the threshold
    addMortal(g, 'plain', 'spotlight', { [LAST_WITNESSED_TICK_KEY]: tick - 1 }); // witnessed a tick ago
    const ranked = rankedDemotionCandidates(g, tick, OPEN);
    expect(ranked.map(c => [c.node.id, c.reason])).toEqual([
      ['plain', 'no_strategic_want'],
      ['stale', 'unwatched_builder'], // tie on age → importance 0 → id
      ['staler', 'unwatched_builder'],
      ['edge', 'unwatched_builder'],
    ]);
    expect(ranked[1].unwatchedTicks).toBe(tick);
    expect(ranked[3].unwatchedTicks).toBe(T);
  });

  it('a builder whose undertaking progressed inside the threshold is never offered — including one whose project finished', () => {
    const g = new WorldGraph();
    const tick = 3 * T;
    addBuilder(g, 'worked');
    addBuilder(g, 'finished');
    addBuilder(g, 'idle');
    const projects: SpotlightProjectActivity[] = [
      { actorId: 'worked', lastProgressTick: tick - 1 },
      { actorId: 'finished', lastProgressTick: tick - T + 5 }, // a completed project carried forward
      { actorId: 'idle', lastProgressTick: tick - T - 5 },
    ];
    expect(ids(g, tick, { projects })).toEqual(['idle']);
    expect(lastActiveTick(g.getNode('finished')!, projects)).toBe(tick - T + 5);
  });

  it('the floor: a never-witnessed protagonist is not unwatched before the threshold from tick 0', () => {
    const g = new WorldGraph();
    addBuilder(g, 'protagonist');
    expect(ids(g, 0)).toEqual([]);
    expect(ids(g, T - 1)).toEqual([]);
    expect(ids(g, T)).toEqual(['protagonist']);
  });

  it('protection: a travelling, a followed, a threaded and a malformed-mover builder are never offered', () => {
    const g = new WorldGraph();
    const tick = 5 * T;
    g.addNode({ id: 'god', type: 'actor', name: 'god', properties: { actorType: 'ascendant' } });
    addBuilder(g, 'walker', { movementState: { movementQueue: ['h1', 'h2'] } });
    addBuilder(g, 'stuck', { movementState: { movementQueue: 'garbage' } });
    addBuilder(g, 'arrived', { movementState: { movementQueue: [] } });
    addBuilder(g, 'followed');
    addBuilder(g, 'threaded');
    g.addEdge({ id: 't', source: 'god', target: 'threaded', type: 'thread', properties: { courtPosition: 'inner' } });
    expect(ids(g, tick, { followedAgentIds: ['followed'] })).toEqual(['arrived']);
  });

  it('fails closed: omitting either the follow list or the projects offers no builder', () => {
    const g = new WorldGraph();
    addBuilder(g, 'idle');
    addMortal(g, 'plain', 'spotlight');
    const tick = 5 * T;
    expect(demotionCandidates(g, tick, { projects: [] }).map(n => n.id)).toEqual(['plain']);
    expect(demotionCandidates(g, tick, { followedAgentIds: [] }).map(n => n.id)).toEqual(['plain']);
    expect(demotionCandidates(g, tick, OPEN).map(n => n.id)).toEqual(['plain', 'idle']);
  });

  it('a pulled mortal with no active strategic want sits in neither class', () => {
    const g = new WorldGraph();
    addMortal(g, 'doneBuilder', 'spotlight', { [SPOTLIGHT_PULLED_TICK_KEY]: 0, [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: 'x' });
    pursue(g, 'doneBuilder', STRATEGIC, 'completed');
    expect(ids(g, 10 * T)).toEqual([]);
    // Given a new strategic want, the unwatched rule applies to them again.
    pursue(g, 'doneBuilder', STRATEGIC_2);
    expect(ids(g, 10 * T)).toEqual(['doneBuilder']);
  });
});

describe('the pull', () => {
  it('swaps an unwatched builder when no ambition-less candidate exists, stamps the ledger and traces the reason', () => {
    const g = new WorldGraph();
    const tick = 2 * T;
    addBuilder(g, 'idle');
    addMortal(g, 'h', 'ambient');
    pursue(g, 'h', STRATEGIC);
    const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, tick, { rng: fixedRng, ...OPEN });
    expect(r).toMatchObject({ pulled: true, demotedId: 'idle' });
    expect(tierOf(g, 'idle')).toBe('notable');
    // Nothing deleted: the stepped-back builder keeps their want.
    expect(g.getOutgoingEdges('idle', 'pursues')[0].properties.status).toBe('active');
    expect(g.getNode('idle')!.properties[SPOTLIGHT_UNWATCHED_DEMOTED_TICK_KEY]).toBe(tick);
    expect(readSpotlightLedger(g).unwatchedDemotions).toEqual([{ agentId: 'idle', tick, unwatchedTicks: tick }]);
    flushSpotlightPullTrace();
    const trace = getTraces().find(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace;
    expect(trace.pulled).toEqual([{
      agentId: 'h', templateId: STRATEGIC, fromTier: 'ambient', demotedId: 'idle',
      demotedReason: 'unwatched_builder', demotedUnwatchedTicks: tick,
    }]);
  });

  it('pulled mortals can go unwatched — counted from their pull — and are never pulled again', () => {
    const g = new WorldGraph();
    const pulledAt = 40;
    addBuilder(g, 'kindled', { [SPOTLIGHT_PULLED_TICK_KEY]: pulledAt, [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: 'someone' });
    expect(ids(g, pulledAt + T - 1)).toEqual([]);
    expect(ids(g, pulledAt + T)).toEqual(['kindled']);
    expect(ids(g, pulledAt + T, { followedAgentIds: ['kindled'] })).toEqual([]);

    addMortal(g, 'h', 'notable');
    pursue(g, 'h', STRATEGIC);
    const r = pullHolderIntoSpotlight(g, 'h', STRATEGIC, pulledAt + T, { rng: fixedRng, ...OPEN });
    expect(r).toMatchObject({ pulled: true, demotedId: 'kindled' });
    // Stepped back, still marked: a later want refuses already_pulled rather than cycling.
    pursue(g, 'kindled', STRATEGIC_2);
    expect(pullHolderIntoSpotlight(g, 'kindled', STRATEGIC_2, pulledAt + T + 1, { rng: fixedRng, ...OPEN }))
      .toEqual({ pulled: false, reason: 'already_pulled' });
  });

  it('a mortal kindled through assign_ambition gets the threshold from the pull, and following keeps them', () => {
    const g = new WorldGraph();
    // A world with one ambition-less decider to make room for the kindled mortal.
    addMortal(g, 'room', 'spotlight');
    addMortal(g, 'kindled', 'ambient');
    const at = 100;
    const res = assignAmbitionToActor(g, 'kindled', STRATEGIC, at, { rng: fixedRng, ...OPEN });
    expect(res.pull).toMatchObject({ pulled: true, demotedId: 'room' });
    expect(ids(g, at + T - 1)).toEqual([]);
    expect(ids(g, at + T)).toEqual(['kindled']);
    expect(ids(g, at + T, { followedAgentIds: ['kindled'] })).toEqual([]);
  });

  it('the cap: a second unwatched demotion inside the window falls through to overflow, then the window reopens', () => {
    expect(SPOTLIGHT_UNWATCHED_SWAPS_PER_WINDOW).toBe(1);
    const g = new WorldGraph();
    const tick = 2 * T;
    for (let i = 0; i < 4; i++) addBuilder(g, `b${i}`);
    for (let i = 0; i < 20; i++) addMortal(g, `f${i}`, 'spotlight'); // ambition-less, but…
    const busy = new Set(Array.from({ length: 20 }, (_, i) => `f${i}`)); // …mid-act: never a candidate
    const pull = (id: string, at: number) => {
      addMortal(g, id, 'ambient');
      pursue(g, id, STRATEGIC);
      return pullHolderIntoSpotlight(g, id, STRATEGIC, at, { rng: fixedRng, busyActorIds: busy, ...OPEN });
    };
    expect(pull('h1', tick)).toMatchObject({ pulled: true, demotedId: 'b0' });
    expect(pull('h2', tick + 1)).toMatchObject({ pulled: true, demotedId: null }); // capped → overflow
    expect(pull('h3', tick + SPOTLIGHT_UNWATCHED_SWAP_WINDOW_TICKS)).toMatchObject({ pulled: true, demotedId: 'b1' });
  });
});

describe('one pull per holder per batch', () => {
  it('a newborn with two strategic wants is pulled — or refused — once, not once per want', () => {
    const g = new WorldGraph();
    // No candidate and no overflow room: every pull is refused `budget`.
    addMortal(g, 'h', 'ambient');
    let spent = false;
    const results = [STRATEGIC, STRATEGIC_2].map(templateId => {
      const r = assignAmbitionToActor(g, 'h', templateId, 5, { rng: fixedRng, ...OPEN, skipSpotlightPull: spent });
      if (spentSpotlightPull(r)) spent = true;
      return r;
    });
    expect(results.map(r => r.assigned)).toEqual([true, true]);
    expect(results[0].pull).toEqual({ pulled: false, reason: 'budget' });
    expect(results[1].pull).toEqual({ pulled: false, reason: 'not_applicable' });
    flushSpotlightPullTrace();
    const trace = getTraces().find(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace;
    expect(trace.refused).toHaveLength(1);
  });

  it('a plain want does not spend the pull; the strategic want after it still pulls', () => {
    const g = new WorldGraph();
    addMortal(g, 'room', 'spotlight');
    addMortal(g, 'h', 'ambient');
    const plain = assignAmbitionToActor(g, 'h', PLAIN, 5, { rng: fixedRng, ...OPEN });
    expect(spentSpotlightPull(plain)).toBe(false);
    const strategic = assignAmbitionToActor(g, 'h', STRATEGIC, 5, { rng: fixedRng, ...OPEN, skipSpotlightPull: false });
    expect(strategic.pull).toMatchObject({ pulled: true });
    expect(spentSpotlightPull(strategic)).toBe(true);
  });
});

describe('the callers (§ 7)', () => {
  const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
  /** Every `assignAmbitionToActor(` call's argument text, up to its closing `);`. */
  const calls = (text: string) => {
    const out: string[] = [];
    let i = text.indexOf('assignAmbitionToActor(');
    while (i !== -1) {
      out.push(text.slice(i, text.indexOf(');', i)));
      i = text.indexOf('assignAmbitionToActor(', i + 1);
    }
    return out;
  };

  it.each([
    ['agentLifecycle.ts', 1],
    ['ambitionTick.ts', 2],
    ['encounterAftermath.ts', 1],
  ])('the in-play call sites in %s pass the follow list and the projects', (file, n) => {
    const cs = calls(src(file));
    expect(cs).toHaveLength(n);
    for (const c of cs) {
      expect(c).toMatch(/followedAgentIds/);
      expect(c).toMatch(/projects/);
    }
  });

  it('births and re-evaluation spend one pull per holder per batch', () => {
    for (const c of [...calls(src('agentLifecycle.ts')), ...calls(src('ambitionTick.ts'))]) {
      expect(c).toMatch(/skipSpotlightPull/);
    }
  });

  it('the three exemptions: the binder skips the pull, gameInit and worldSeed assign at tick 0 where the floor empties the class', () => {
    expect(calls(src('binding/mintInhabitant.ts')).every(c => /skipSpotlightPull:\s*true/.test(c))).toBe(true);
    for (const f of ['gameInit.ts', 'worldSeed.ts']) {
      const cs = calls(src(f));
      expect(cs.length).toBeGreaterThan(0);
      for (const c of cs) expect(c).toMatch(/,\s*0,/); // tick 0
    }
    // …and at tick 0 no builder is unwatched, whatever the caller passes.
    const g = new WorldGraph();
    addBuilder(g, 'protagonist');
    expect(ids(g, 0)).toEqual([]);
  });
});
