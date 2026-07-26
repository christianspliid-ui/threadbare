/**
 * THR-786 — unit coverage for the shared trait resolver, the ref index, and the
 * dead-ref content sweep.
 *
 * The cross-site behavior contract lives in
 * `__tests__/contracts/traitPredicate.contract.test.ts`; this file pins the
 * primitives those six sites now share.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import {
  buildTraitRefIndex,
  resolveTraitRefs,
  traitRefsForNode,
  collectBearerTraitRefs,
  bearerMatchesPredicate,
} from '../traitRefIndex';
import { resolveTraitPredicate, assignTrait, reinforceTrait } from '../traits';
import { validateTraitRefs } from '../traitRefValidation';

function traitNode(id: string, name: string, tags: string[]): GraphNode {
  return {
    id,
    type: 'trait',
    name,
    properties: {
      subcategory: 'mastery',
      description: 'd',
      importance: 0.5,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: {},
      tags,
      flavorText: 'f',
    },
  };
}

function graphWith(...traits: GraphNode[]): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'bearer', type: 'actor', name: 'Bearer', properties: {} });
  for (const t of traits) graph.addNode(t);
  return graph;
}

// ─── traitRefsForNode ───────────────────────────────────────────

describe('traitRefsForNode', () => {
  it('emits node id, short id, display name and every tag', () => {
    const refs = traitRefsForNode(traitNode('trait.mastery.smithing', 'Master Smith', ['#craft', '#respected']));
    expect(refs).toEqual(
      expect.arrayContaining(['trait.mastery.smithing', 'mastery.smithing', 'Master Smith', '#craft', '#respected']),
    );
  });

  it('omits the short-id form for a node id without the trait. prefix', () => {
    expect(traitRefsForNode(traitNode('custom-id', 'X', []))).toEqual(['custom-id', 'X']);
  });

  it('includes properties.traitId when present (graphConditions parity)', () => {
    const node = traitNode('trait.a.b', 'A B', []);
    (node.properties as Record<string, unknown>).traitId = 'legacy_key';
    expect(traitRefsForNode(node)).toContain('legacy_key');
  });

  it('tolerates a missing name and non-array tags', () => {
    const node = { id: 'trait.x.y', properties: { tags: 'not-an-array' } };
    expect(() => traitRefsForNode(node)).not.toThrow();
    expect(traitRefsForNode(node)).toEqual(['trait.x.y', 'x.y']);
  });
});

// ─── buildTraitRefIndex ─────────────────────────────────────────

describe('buildTraitRefIndex', () => {
  it('maps each ref to the set of definitions carrying it', () => {
    const index = buildTraitRefIndex(
      graphWith(
        traitNode('trait.mastery.smithing', 'Master Smith', ['#craft']),
        traitNode('trait.mastery.weaving', 'Master Weaver', ['#craft']),
      ),
    );
    expect(resolveTraitRefs(index, 'trait.mastery.smithing')).toEqual(new Set(['trait.mastery.smithing']));
    // The shared tag is the union case the plan's ANY-match rule exists for: it must
    // resolve to BOTH definitions, not tie-break to one.
    expect(resolveTraitRefs(index, '#craft')).toEqual(
      new Set(['trait.mastery.smithing', 'trait.mastery.weaving']),
    );
  });

  it('resolves an unknown ref to the empty set, never undefined', () => {
    const index = buildTraitRefIndex(graphWith());
    expect(resolveTraitRefs(index, 'nope').size).toBe(0);
  });

  it('indexes dynamically minted trait nodes, not just authored tables', () => {
    // Culture traits are minted at worldgen; a table-only index would miss them.
    const index = buildTraitRefIndex(graphWith(traitNode('trait.culture.culture_0', 'Hearthbound', ['#cultural'])));
    expect(resolveTraitRefs(index, 'culture.culture_0')).toEqual(new Set(['trait.culture.culture_0']));
  });
});

// ─── collectBearerTraitRefs / bearerMatchesPredicate ────────────

describe('collectBearerTraitRefs', () => {
  it('records every ref form of a held trait at its assignment level', () => {
    const graph = graphWith(traitNode('trait.mastery.smithing', 'Master Smith', ['#craft']));
    assignTrait(graph, 'bearer', 'trait.mastery.smithing', { tick: 0, source: 't' });
    reinforceTrait(graph, 'bearer', 'trait.mastery.smithing', 1);

    const refs = collectBearerTraitRefs(graph, 'bearer');
    for (const ref of ['trait.mastery.smithing', 'mastery.smithing', 'Master Smith', '#craft']) {
      expect(refs.get(ref)).toBe(2);
    }
  });

  it('takes the MAX level across traits sharing a ref', () => {
    const graph = graphWith(
      traitNode('trait.mastery.smithing', 'Master Smith', ['#craft']),
      traitNode('trait.mastery.weaving', 'Master Weaver', ['#craft']),
    );
    assignTrait(graph, 'bearer', 'trait.mastery.smithing', { tick: 0, source: 't' });
    assignTrait(graph, 'bearer', 'trait.mastery.weaving', { tick: 0, source: 't' });
    reinforceTrait(graph, 'bearer', 'trait.mastery.weaving', 1);
    reinforceTrait(graph, 'bearer', 'trait.mastery.weaving', 2);

    const refs = collectBearerTraitRefs(graph, 'bearer');
    expect(refs.get('#craft')).toBe(3);
    expect(bearerMatchesPredicate(refs, { traitId: '#craft', minLevel: 3 })).toBe(true);
    expect(bearerMatchesPredicate(refs, { traitId: '#craft', minLevel: 4 })).toBe(false);
  });

  it('unions granted keys at the supplied granted level', () => {
    const refs = collectBearerTraitRefs(graphWith(), 'bearer', {
      grantedTraits: new Set(['master_smith']),
      grantedLevel: 1,
    });
    expect(bearerMatchesPredicate(refs, { traitId: 'master_smith' })).toBe(true);
    // A grant carries no level of its own, so it cannot satisfy a higher tier.
    expect(bearerMatchesPredicate(refs, { traitId: 'master_smith', minLevel: 2 })).toBe(false);
  });

  it('fail-soft: an unknown bearer yields an empty map', () => {
    expect(collectBearerTraitRefs(graphWith(), 'no-such-bearer').size).toBe(0);
  });

  it('fail-soft: a dangling has_trait target still contributes its id ref', () => {
    // Reproduces post-removal state via the structural graph view, since
    // WorldGraph.addEdge rejects a dangling target outright.
    const view = {
      getNode: () => undefined,
      getOutgoingEdges: (_id: string, type?: string) =>
        type === 'has_trait'
          ? [{ target: 'trait.gone.away', properties: { level: 2 } }]
          : [],
    };
    const refs = collectBearerTraitRefs(view, 'bearer');
    expect(refs.get('trait.gone.away')).toBe(2);
    expect(refs.has('gone.away')).toBe(false); // no node ⇒ no derived ref forms
  });

  it('defaults a level-less assignment edge to level 1', () => {
    const view = {
      getNode: () => undefined,
      getOutgoingEdges: (_id: string, type?: string) =>
        type === 'has_trait' ? [{ target: 'trait.a.b', properties: {} }] : [],
    };
    expect(collectBearerTraitRefs(view, 'bearer').get('trait.a.b')).toBe(1);
  });
});

// ─── resolveTraitPredicate ──────────────────────────────────────

describe('resolveTraitPredicate', () => {
  it('matches on any ref form, honouring minLevel', () => {
    const graph = graphWith(traitNode('trait.mastery.smithing', 'Master Smith', ['#craft']));
    assignTrait(graph, 'bearer', 'trait.mastery.smithing', { tick: 0, source: 't' });

    expect(resolveTraitPredicate(graph, 'bearer', { traitId: '#craft' })).toBe(true);
    expect(resolveTraitPredicate(graph, 'bearer', { traitId: 'Master Smith' })).toBe(true);
    expect(resolveTraitPredicate(graph, 'bearer', { traitId: '#craft', minLevel: 2 })).toBe(false);
    expect(resolveTraitPredicate(graph, 'bearer', { traitId: '#other' })).toBe(false);
  });

  it('is bearer-type agnostic — a location resolves the same way', () => {
    const graph = graphWith(traitNode('trait.place.haunted', 'Haunted', ['#haunted']));
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Old Mill', properties: {} });
    assignTrait(graph, 'loc-1', 'trait.place.haunted', { tick: 0, source: 't' });

    expect(resolveTraitPredicate(graph, 'loc-1', { traitId: '#haunted' })).toBe(true);
  });
});

// ─── SimulationRuntime ownership ────────────────────────────────

describe('ensureTraitRefIndex (runtime-owned, THR-786)', () => {
  it('builds once and reuses until structuralCacheVersion advances', async () => {
    const { createSimulationRuntime, ensureTraitRefIndex, touchStructure } = await import(
      '../simulationRuntime'
    );
    const runtime = createSimulationRuntime();
    const graph = graphWith(traitNode('trait.mastery.smithing', 'Master Smith', ['#craft']));

    expect(runtime.traitRefIndex).toBeNull();
    const first = ensureTraitRefIndex(runtime, graph);
    expect(first).toBe(ensureTraitRefIndex(runtime, graph)); // cached, same object

    // A newly minted trait node is a structural change; the index must pick it up.
    graph.addNode(traitNode('trait.culture.culture_0', 'Hearthbound', ['#cultural']));
    touchStructure(runtime);
    const rebuilt = ensureTraitRefIndex(runtime, graph);
    expect(rebuilt).not.toBe(first);
    expect(resolveTraitRefs(rebuilt, '#cultural').size).toBe(1);
  });

  it('is cleared by resetRuntimeCaches so a new playthrough cannot inherit it', async () => {
    const { createSimulationRuntime, ensureTraitRefIndex, resetRuntimeCaches } = await import(
      '../simulationRuntime'
    );
    const runtime = createSimulationRuntime();
    ensureTraitRefIndex(runtime, graphWith(traitNode('trait.a.b', 'A B', [])));
    expect(runtime.traitRefIndex).not.toBeNull();

    resetRuntimeCaches(runtime);
    expect(runtime.traitRefIndex).toBeNull();
    expect(runtime.traitRefIndexBuiltAt).toBe(-1);
  });
});

// ─── validateTraitRefs ──────────────────────────────────────────

describe('validateTraitRefs', () => {
  it('reports the four shipped has_trait: choice-set refs as dead', async () => {
    // These four are authored in `choice-set-catalog.ts` and match no trait id, name
    // or tag (verified 2026-07-26). If content later mints them, this expectation
    // fails loudly rather than the sweep silently going quiet.
    const report = await validateTraitRefs(graphWith());
    const deadRefs = report.dead.map(d => d.ref);
    expect(deadRefs).toEqual(
      expect.arrayContaining(['negotiator', 'dauntless', 'leader', 'interrogator']),
    );
    expect(report.perSurface.effect_predicate).toBeGreaterThanOrEqual(4);
  });

  it('sweeps every surface it claims to (none silently reads zero)', async () => {
    const report = await validateTraitRefs(graphWith());
    // item_grant and ambition_traits both have shipped authors; a zero here means the
    // shape matcher stopped recognizing them.
    expect(report.perSurface.item_grant).toBeGreaterThan(0);
    expect(report.perSurface.ambition_traits).toBeGreaterThan(0);
  });

  it('separates phantom grant keys from dead gates', async () => {
    // A `trait_grant` key with no trait definition is NOT dead: the grant returns the
    // bare key and consumers union it in, so a gate naming it still passes. It is a
    // phantom trait — gates fine, but has no name/visibility/contributions to show.
    const report = await validateTraitRefs(graphWith());
    const phantoms = report.phantomGrants.map(p => p.ref);
    expect(phantoms).toContain('master_smith');
    expect(report.dead.map(d => d.ref)).not.toContain('master_smith');
  });

  it('counts a ref as resolved once its definition is in the graph', async () => {
    const withDef = graphWith(traitNode('trait.mastery.smith', 'master_smith', []));
    const report = await validateTraitRefs(withDef);
    expect(report.dead.map(d => d.ref)).not.toContain('master_smith');
    expect(report.traitDefinitions).toBe(1);
  });

  it('records fanout without treating it as an error', async () => {
    const graph = graphWith(
      traitNode('trait.a.one', 'master_smith', []),
      traitNode('trait.a.two', 'master_smith', []),
    );
    const report = await validateTraitRefs(graph);
    const entry = report.highFanout.find(f => f.ref === 'master_smith');
    expect(entry?.ids.sort()).toEqual(['trait.a.one', 'trait.a.two']);
  });
});
