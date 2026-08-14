import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldGraph } from '../graph';
import {
  mintCompanion,
  removeCompanion,
  getCompanions,
  expireCompanions,
  isAtCompanionCap,
  isUniqueAlreadyInstanced,
} from '../companions';
import { computeRawScore, getTopContributors } from '../domainCapability';
import { COMPANION_MAX, COMPANION_TEMPLATES } from '../../data/companion-templates';
import { mulberry32 } from '../../lib/prng';

const BEARER = 'actor.bearer';
const OTHER = 'actor.other';

/** A profession template with no contract, used wherever duration is irrelevant. */
const PERMANENT_TEMPLATE = 'companion.wayfarer';
/** The one contracted template — expiry tests key on it. */
const HIRED_TEMPLATE = 'companion.sellsword-band';
const UNIQUE_TEMPLATE = 'companion.veiled-cartographer';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  for (const id of [BEARER, OTHER]) {
    graph.addNode({
      id,
      type: 'actor',
      name: id === BEARER ? 'Bearer' : 'Other',
      properties: { actorType: 'individual' },
    });
  }
  return graph;
}

function mint(graph: WorldGraph, templateId: string, bearerId = BEARER, tick = 1, seed = 7) {
  return mintCompanion(graph, templateId, bearerId, tick, mulberry32(seed), {
    source: 'test.encounter',
  });
}

describe('companions — minting', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  it('mints an instance node joined to its bearer by an accompanies edge', () => {
    const result = mint(graph, PERMANENT_TEMPLATE);

    expect(result).not.toBeNull();
    const node = graph.getNode(result!.companionId);
    expect(node?.type).toBe('companion');
    expect(node?.properties.templateId).toBe(PERMANENT_TEMPLATE);

    const edge = graph.getEdge(result!.edgeId);
    expect(edge?.type).toBe('accompanies');
    expect(edge?.source).toBe(BEARER);
    expect(edge?.target).toBe(result!.companionId);
  });

  it('gives the instance a personal name, not the profession', () => {
    const result = mint(graph, PERMANENT_TEMPLATE);
    expect(result!.name).toBeTruthy();
    expect(result!.name).not.toBe('Wayfarer');
  });

  it('is deterministic — the same seed mints the same name', () => {
    const a = mintCompanion(makeGraph(), PERMANENT_TEMPLATE, BEARER, 1, mulberry32(42), {
      source: 's',
    });
    const b = mintCompanion(makeGraph(), PERMANENT_TEMPLATE, BEARER, 1, mulberry32(42), {
      source: 's',
    });
    expect(a!.name).toBe(b!.name);
  });

  it('holds the single-bearer invariant — one incoming accompanies edge per companion', () => {
    const result = mint(graph, PERMANENT_TEMPLATE);
    const incoming = graph.getIncomingEdges(result!.companionId, 'accompanies');
    expect(incoming).toHaveLength(1);
    expect(incoming[0].source).toBe(BEARER);
  });

  it('records the source on the edge so every companion has a why', () => {
    const result = mint(graph, PERMANENT_TEMPLATE);
    expect(graph.getEdge(result!.edgeId)?.properties.source).toBe('test.encounter');
  });

  it('substitutes the instance name into the join and depart sentences', () => {
    const result = mint(graph, PERMANENT_TEMPLATE);
    const props = graph.getNode(result!.companionId)!.properties;
    expect(props.joinSentence).toContain(result!.name);
    expect(props.departSentence).toContain(result!.name);
    expect(props.joinSentence).not.toContain('{name}');
  });
});

describe('companions — fail-soft', () => {
  let graph: WorldGraph;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    graph = makeGraph();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('grants nothing for an unknown template, and does not throw', () => {
    expect(() => mint(graph, 'companion.does-not-exist')).not.toThrow();
    expect(mint(graph, 'companion.does-not-exist')).toBeNull();
    expect(getCompanions(graph, BEARER)).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it('grants nothing when the bearer is missing', () => {
    expect(mint(graph, PERMANENT_TEMPLATE, 'actor.ghost')).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('never mints a second instance of a unique template', () => {
    expect(mint(graph, UNIQUE_TEMPLATE, BEARER)).not.toBeNull();
    expect(isUniqueAlreadyInstanced(graph, UNIQUE_TEMPLATE)).toBe(true);
    // Even for a different bearer — uniqueness is world-scoped, not bearer-scoped.
    expect(mint(graph, UNIQUE_TEMPLATE, OTHER)).toBeNull();
    expect(getCompanions(graph, OTHER)).toHaveLength(0);
  });
});

describe('companions — the cap', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  it('reports the cap once the bearer reaches COMPANION_MAX', () => {
    const professions = COMPANION_TEMPLATES.filter(t => !t.unique).slice(0, COMPANION_MAX);
    professions.forEach((t, i) => mint(graph, t.id, BEARER, i + 1, i + 1));

    expect(getCompanions(graph, BEARER)).toHaveLength(COMPANION_MAX);
    expect(isAtCompanionCap(graph, BEARER)).toBe(true);
  });

  it('refuses a capped grant when respectCap is set (the reward-pool path)', () => {
    const professions = COMPANION_TEMPLATES.filter(t => !t.unique).slice(0, COMPANION_MAX + 1);
    professions.slice(0, COMPANION_MAX).forEach((t, i) => mint(graph, t.id, BEARER, i + 1, i + 1));

    const overflow = mintCompanion(
      graph,
      professions[COMPANION_MAX].id,
      BEARER,
      99,
      mulberry32(3),
      { source: 'pool', respectCap: true },
    );
    expect(overflow).toBeNull();
    expect(getCompanions(graph, BEARER)).toHaveLength(COMPANION_MAX);
  });

  it('lets an authored grant exceed the cap — authored intent wins', () => {
    const professions = COMPANION_TEMPLATES.filter(t => !t.unique).slice(0, COMPANION_MAX + 1);
    professions.slice(0, COMPANION_MAX).forEach((t, i) => mint(graph, t.id, BEARER, i + 1, i + 1));

    const authored = mintCompanion(
      graph,
      professions[COMPANION_MAX].id,
      BEARER,
      99,
      mulberry32(3),
      { source: 'encounter.authored', respectCap: false },
    );
    expect(authored).not.toBeNull();
    expect(getCompanions(graph, BEARER)).toHaveLength(COMPANION_MAX + 1);
  });
});

describe('companions — departure', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  it('removes the node and the edge, and returns the departure sentence', () => {
    const minted = mint(graph, PERMANENT_TEMPLATE)!;
    const gone = removeCompanion(graph, minted.companionId, 'story', 5);

    expect(gone).not.toBeNull();
    expect(gone!.departSentence).toContain(minted.name);
    expect(gone!.reason).toBe('story');
    expect(graph.getNode(minted.companionId)).toBeUndefined();
    expect(graph.getEdge(minted.edgeId)).toBeUndefined();
    expect(getCompanions(graph, BEARER)).toHaveLength(0);
  });

  it('returns null for an id that is not a companion', () => {
    expect(removeCompanion(graph, BEARER, 'story', 1)).toBeNull();
  });
});

describe('companions — expiry', () => {
  it('leaves a permanent companion alone however many ticks pass', () => {
    const graph = makeGraph();
    mint(graph, PERMANENT_TEMPLATE);

    for (let t = 2; t < 40; t++) expireCompanions(graph, t);

    expect(getCompanions(graph, BEARER)).toHaveLength(1);
  });

  it('counts a contracted companion down and removes them at zero', () => {
    const graph = makeGraph();
    const minted = mint(graph, HIRED_TEMPLATE)!;
    const total = getCompanions(graph, BEARER)[0].totalTicks!;
    expect(total).toBeGreaterThan(0);

    let departed: ReturnType<typeof expireCompanions> = [];
    for (let t = 2; t <= total + 2; t++) {
      departed = expireCompanions(graph, t);
      if (departed.length > 0) break;
    }

    expect(departed).toHaveLength(1);
    expect(departed[0].reason).toBe('contract_ended');
    expect(departed[0].companionId).toBe(minted.companionId);
    expect(getCompanions(graph, BEARER)).toHaveLength(0);
  });

  it('collects a companion whose bearer has gone missing', () => {
    const graph = makeGraph();
    mint(graph, PERMANENT_TEMPLATE);
    graph.removeNode(BEARER);

    const departed = expireCompanions(graph, 4);
    expect(departed).toHaveLength(1);
    expect(departed[0].reason).toBe('bearer_missing');
    expect(graph.getNodesByType('companion')).toHaveLength(0);
  });
});

describe('companions — the capability walk', () => {
  it('adds the companion contribution to the bearer raw score', () => {
    const graph = makeGraph();
    const before = computeRawScore(graph, BEARER, 'stone');

    mint(graph, PERMANENT_TEMPLATE); // Wayfarer: stone 2, eye 1
    const after = computeRawScore(graph, BEARER, 'stone');

    expect(after).toBe(before + 2);
  });

  it('does not leak the bonus to a different agent', () => {
    const graph = makeGraph();
    mint(graph, PERMANENT_TEMPLATE, BEARER);
    expect(computeRawScore(graph, OTHER, 'stone')).toBe(0);
  });

  it('earns a factor line under the companion own name', () => {
    const graph = makeGraph();
    const minted = mint(graph, PERMANENT_TEMPLATE)!;

    const contributors = getTopContributors(graph, BEARER, 'stone', 5);
    expect(contributors.map(c => c.name)).toContain(minted.name);
    expect(contributors.find(c => c.name === minted.name)?.contribution).toBe(2);
  });

  it('stops contributing once the companion leaves', () => {
    const graph = makeGraph();
    const minted = mint(graph, PERMANENT_TEMPLATE)!;
    expect(computeRawScore(graph, BEARER, 'stone')).toBe(2);

    removeCompanion(graph, minted.companionId, 'story', 3);
    expect(computeRawScore(graph, BEARER, 'stone')).toBe(0);
  });
});
