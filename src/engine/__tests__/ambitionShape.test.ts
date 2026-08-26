/**
 * THR-1285 — the ambition-vocabulary discriminator and its tripwire.
 *
 * Two things are pinned here. First, the predicates: which vocabulary a node belongs
 * to, including the back-compat inference path for worlds saved before the stamp
 * existed. Second, the tripwire: an individual actor pursuing something it cannot
 * evaluate emits a trace instead of skipping in silence.
 *
 * The tripwire tests deliberately construct shapes **no production writer can now
 * emit** — that is what a tripwire is for, and it is why the assertions here drive
 * synthetic edges rather than a seeded world. The complementary claim (a real run
 * emits none of these) is a CLI sweep, recorded on the ticket, not a unit test.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  AMBITION_KIND_FACTION,
  AMBITION_KIND_KEY,
  AMBITION_KIND_TEMPLATE,
  getAmbitionKind,
  getAmbitionTemplateId,
  getFactionAmbitionNodes,
  getTemplateAmbitionNodes,
  isFactionAmbition,
  isTemplateAmbition,
} from '../ambitionShape';
import { phaseAmbitionProgress, MILESTONE_CHECK_INTERVAL, resetAmbitionEventCounter } from '../ambitionTick';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42,
    graph, cosmology: {} as any, tiles: [], clock: {} as any,
    ascendantId: 'asc_1', essencePool: {} as any,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: new Map() as any,
    familiarityMap: new Map() as any, culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
  } as unknown as GameState;
}

function addIndividual(graph: WorldGraph, id: string): void {
  graph.addNode({
    id, type: 'actor', name: 'Test Actor',
    properties: { actorType: 'individual', domainCapabilities: {} },
  });
}

/** Point an individual at an arbitrary ambition node — the shapes below are synthetic. */
function pursue(graph: WorldGraph, actorId: string, ambitionNodeId: string): void {
  graph.addEdge({
    id: `pursues_${actorId}_${ambitionNodeId}`,
    source: actorId, target: ambitionNodeId, type: 'pursues',
    properties: { priority: 'primary', status: 'active', assignedTick: 0, completedMilestones: [] },
  });
}

function skipTraceReasons(): string[] {
  return getTraces()
    .filter(t => (t as unknown as Record<string, unknown>).event === 'skipped')
    .map(t => String((t as unknown as Record<string, unknown>).reason));
}

describe('ambitionShape — vocabulary discriminator (THR-1285)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('classifies a stamped template ambition', () => {
    graph.addNode({
      id: 'ambition.trade_empire', type: 'ambition', name: 'Trade Empire',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: 'trade_empire' },
    });
    const node = graph.getNode('ambition.trade_empire');

    expect(getAmbitionKind(node)).toBe(AMBITION_KIND_TEMPLATE);
    expect(isTemplateAmbition(node)).toBe(true);
    expect(isFactionAmbition(node)).toBe(false);
    expect(getAmbitionTemplateId(node)).toBe('trade_empire');
  });

  it('classifies a stamped faction ambition, and reports no templateId for it', () => {
    graph.addNode({
      id: 'amb_faction_def_civic_guard_5', type: 'ambition', name: 'Civic Guard — revenge',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION, ambitionType: 'revenge' },
    });
    const node = graph.getNode('amb_faction_def_civic_guard_5');

    expect(getAmbitionKind(node)).toBe(AMBITION_KIND_FACTION);
    expect(isFactionAmbition(node)).toBe(true);
    // Not a defect: faction ambitions have no template, and never should.
    expect(getAmbitionTemplateId(node)).toBeUndefined();
  });

  it('infers the kind for pre-THR-1285 saves that carry no stamp', () => {
    graph.addNode({
      id: 'ambition.legacy', type: 'ambition', name: 'legacy',
      properties: { templateId: 'legacy' },
    });
    graph.addNode({
      id: 'amb_legacy_faction', type: 'ambition', name: 'legacy faction',
      properties: { ambitionType: 'territorial_expansion' },
    });

    expect(getAmbitionKind(graph.getNode('ambition.legacy'))).toBe(AMBITION_KIND_TEMPLATE);
    expect(getAmbitionKind(graph.getNode('amb_legacy_faction'))).toBe(AMBITION_KIND_FACTION);
    // The inference is the back-compat path only — it must still yield a usable id.
    expect(getAmbitionTemplateId(graph.getNode('ambition.legacy'))).toBe('legacy');
  });

  it('returns unknown for malformed, missing, and non-ambition nodes', () => {
    graph.addNode({
      id: 'amb_empty', type: 'ambition', name: 'empty', properties: {},
    });
    addIndividual(graph, 'actor_1');

    expect(getAmbitionKind(graph.getNode('amb_empty'))).toBe('unknown');
    expect(getAmbitionKind(graph.getNode('nope'))).toBe('unknown');
    expect(getAmbitionKind(graph.getNode('actor_1'))).toBe('unknown');
    expect(getAmbitionKind(undefined)).toBe('unknown');
    expect(getAmbitionKind(null)).toBe('unknown');
  });

  it('an empty-string templateId does not pass as a template ambition', () => {
    graph.addNode({
      id: 'amb_blank', type: 'ambition', name: 'blank',
      properties: { templateId: '' },
    });
    expect(getAmbitionKind(graph.getNode('amb_blank'))).toBe('unknown');
    expect(getAmbitionTemplateId(graph.getNode('amb_blank'))).toBeUndefined();
  });

  it('partitions the graph — the collectors are complements, not overlaps', () => {
    graph.addNode({
      id: 'ambition.a', type: 'ambition', name: 'a',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: 'a' },
    });
    graph.addNode({
      id: 'amb_f_1', type: 'ambition', name: 'f',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION, ambitionType: 'revenge' },
    });
    graph.addNode({ id: 'amb_junk', type: 'ambition', name: 'junk', properties: {} });

    const template = getTemplateAmbitionNodes(graph).map(n => n.id);
    const faction = getFactionAmbitionNodes(graph).map(n => n.id);

    expect(template).toEqual(['ambition.a']);
    expect(faction).toEqual(['amb_f_1']);
    // The malformed node belongs to neither — it must not be laundered into either set.
    expect([...template, ...faction]).not.toContain('amb_junk');
  });
});

describe('ambitionTick — unevaluable-ambition tripwire (THR-1285)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    resetAmbitionEventCounter();
    clearTraces();
    enableTracing();
    addIndividual(graph, 'actor_1');
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('traces an individual pursuing a faction-vocabulary ambition', () => {
    graph.addNode({
      id: 'amb_faction_def_civic_guard_5', type: 'ambition', name: 'Civic Guard — revenge',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION, ambitionType: 'revenge' },
    });
    pursue(graph, 'actor_1', 'amb_faction_def_civic_guard_5');

    phaseAmbitionProgress(makeState(graph, MILESTONE_CHECK_INTERVAL));

    expect(skipTraceReasons()).toContain('faction_kind_ambition');
  });

  it('traces a template ambition whose id resolves to no template', () => {
    graph.addNode({
      id: 'ambition.ghost', type: 'ambition', name: 'ghost',
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: 'no_such_template' },
    });
    pursue(graph, 'actor_1', 'ambition.ghost');

    phaseAmbitionProgress(makeState(graph, MILESTONE_CHECK_INTERVAL));

    expect(skipTraceReasons()).toContain('template_not_found');
  });

  it('traces an unclassifiable ambition node', () => {
    graph.addNode({ id: 'amb_junk', type: 'ambition', name: 'junk', properties: {} });
    pursue(graph, 'actor_1', 'amb_junk');

    phaseAmbitionProgress(makeState(graph, MILESTONE_CHECK_INTERVAL));

    expect(skipTraceReasons()).toContain('unclassifiable_ambition');
  });

  it('cannot build a dangling pursues edge — why there is no node_missing tripwire', () => {
    // Pins the invariant the omitted branch rests on. If a future change relaxes
    // referential integrity at write time, this test fails and the reader's untraced
    // fail-soft skip becomes reachable — which is the moment to add the tripwire back.
    expect(() => pursue(graph, 'actor_1', 'amb_vanished')).toThrow(/Target node not found/);
  });

  it('stays silent for a healthy template ambition — the tripwire must not cry wolf', () => {
    const template = AMBITION_TEMPLATES[0];
    graph.addNode({
      id: `ambition.${template.id}`, type: 'ambition', name: template.displayName,
      properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: template.id },
    });
    pursue(graph, 'actor_1', `ambition.${template.id}`);

    phaseAmbitionProgress(makeState(graph, MILESTONE_CHECK_INTERVAL));

    expect(skipTraceReasons()).toEqual([]);
  });
});
