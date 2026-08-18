/**
 * THR-1175 — a town cannot owe a social favour.
 *
 * `edgeSchema.ts` has declared `owes_favor` and `knows_secret_of` as
 * `actor → actor` since they shipped, but the schema layer only *warns* in dev
 * mode, so the declaration was decoration. `createFavorEdge` would edge from any
 * node id it was handed, and `favor_creation` handed it `action.targetId`
 * unconditionally — which is a person only when the encounter happens to target
 * one. The Grateful Kin targets a location, so a *town* became the debtor of a
 * social favour, and the consequence chip reported it truthfully.
 *
 * The reason that is a defect and not merely an off-schema write is what these
 * tests are really about: **every consumer of `owes_favor` is person-shaped.**
 * Social leverage reads a favour only when the creditor targets the debtor in a
 * deep social scene; tension drift moves sentiment on the debtor's `relates_to`
 * edge; call-in and break fire from person-to-person interactions. A place is in
 * none of those code paths, so the only thing that would ever touch the edge
 * again was the expiry sweep that deletes it ~80 ticks later. Well-formed,
 * anchored, gate-passing, and inert.
 *
 * Each pair below asserts **both** polarities. A refusal that never permits is
 * not enforcement, it is breakage — and the person-debtor arms are what would
 * catch a guard written so strictly it kills the working case.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { createFavorEdge, createSecretEdge } from '../secretGeneration';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GeneratedSecret } from '../secretGeneration';

const TICK = 10;

const SECRET: GeneratedSecret = {
  secretType: 'hidden_weakness',
  magnitude: 0.5,
  detail: 'They cannot swim, and have never said so.',
};

/**
 * One world holding every endpoint shape the guard has to tell apart: two
 * individuals, a faction, a god, and a place.
 */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Kael',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-innkeeper', type: 'actor', name: 'The Innkeeper',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'faction-temple', type: 'actor', name: 'The Temple of the Spheres',
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    id: 'loc-grove', type: 'location', name: 'Sacred Grove',
    properties: { locationSubtype: 'settlement', hexCol: 2, hexRow: 3 },
  });
  return graph;
}

function refusalTraces(): ReturnType<typeof getTraces> {
  return getTraces().filter(t =>
    typeof (t as { failReason?: unknown }).failReason === 'string'
    && ((t as { failReason: string }).failReason).startsWith('endpoint_refused_'));
}

describe('THR-1175 — social-leverage edge endpoints are enforced, not merely declared', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  describe('owes_favor — the debtor must be an individual', () => {
    it('refuses a location debtor, writes no edge, and says why', () => {
      const graph = buildGraph();

      // The exact call the Grateful Kin used to make: debtor = the action target,
      // which for that encounter is the settlement it is staged in.
      const created = createFavorEdge('loc-grove', 'actor-hero', 0.5, 'the fen-road kindness', TICK, graph);

      expect(created).toBe(false);
      expect(graph.getOutgoingEdges('loc-grove', 'owes_favor')).toHaveLength(0);

      // NFP #2 — a refusal nobody can see is the same silence in a different
      // place. The trace has to name the role and what the node actually was,
      // because "refused" alone does not tell an author how to fix the content.
      const refusals = refusalTraces();
      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toMatchObject({
        failReason: 'endpoint_refused_not_an_actor',
        edgeType: 'owes_favor',
        refusedRole: 'debtor',
        refusedNodeId: 'loc-grove',
        foundNodeType: 'location',
      });
      expect(refusals[0].summary).toContain('loc-grove');
      expect(refusals[0].summary).toContain('individual actors');
    });

    it('refuses a faction debtor — an actor, but not one any favour consumer reads', () => {
      const graph = buildGraph();

      const created = createFavorEdge('faction-temple', 'actor-hero', 0.5, 'a debt of arms', TICK, graph);

      expect(created).toBe(false);
      expect(graph.getOutgoingEdges('faction-temple', 'owes_favor')).toHaveLength(0);
      expect(refusalTraces()[0]).toMatchObject({
        failReason: 'endpoint_refused_not_an_individual',
        refusedRole: 'debtor',
        foundNodeType: 'actor',
        foundActorType: 'faction',
      });
    });

    it('refuses a debtor that is not in the graph at all', () => {
      const graph = buildGraph();

      expect(createFavorEdge('actor-ghost', 'actor-hero', 0.5, 'nothing', TICK, graph)).toBe(false);
      expect(refusalTraces()[0]).toMatchObject({
        failReason: 'endpoint_refused_node_missing',
        refusedRole: 'debtor',
      });
    });

    it('permits an individual debtor — the working case still works', () => {
      const graph = buildGraph();

      const created = createFavorEdge('actor-innkeeper', 'actor-hero', 0.5, 'the fen-road kindness', TICK, graph);

      expect(created).toBe(true);
      const edges = graph.getOutgoingEdges('actor-innkeeper', 'owes_favor');
      expect(edges).toHaveLength(1);
      expect(edges[0].target).toBe('actor-hero');
      expect(refusalTraces()).toHaveLength(0);
    });

    it('permits an actor whose subtype is absent — unknown is not known-wrong', () => {
      // The line between "this is the wrong kind of thing" and "I cannot tell".
      // Every real producer sets `actorType` (it is required on
      // `ActorNodeProperties`), so faction/culture/god/ascendant debtors are all
      // caught by what they declare. An actor node missing the field is malformed
      // data, a different defect from the one this guard exists to find — and
      // refusing it broke a `secretsFavors` fixture that builds `properties: {}`
      // while testing the cap, which is precisely the collateral damage a
      // strict-on-unknown rule causes.
      const graph = buildGraph();
      graph.addNode({ id: 'actor-untyped', type: 'actor', name: 'Untyped', properties: {} });

      expect(createFavorEdge('actor-untyped', 'actor-hero', 0.5, 'x', TICK, graph)).toBe(true);
      expect(refusalTraces()).toHaveLength(0);
    });

    it('refuses a location *creditor* too — an edge is only as live as both ends', () => {
      const graph = buildGraph();

      expect(createFavorEdge('actor-innkeeper', 'loc-grove', 0.5, 'owed to a place', TICK, graph)).toBe(false);
      expect(refusalTraces()[0]).toMatchObject({
        refusedRole: 'creditor',
        foundNodeType: 'location',
      });
    });
  });

  describe('knows_secret_of — both endpoints must be actors', () => {
    it('refuses a location subject', () => {
      const graph = buildGraph();

      const created = createSecretEdge('actor-hero', 'loc-grove', SECRET, 'observation', TICK, graph);

      expect(created).toBeUndefined();
      expect(graph.getOutgoingEdges('actor-hero', 'knows_secret_of')).toHaveLength(0);
      expect(refusalTraces()[0]).toMatchObject({
        edgeType: 'knows_secret_of',
        refusedRole: 'subject',
        foundNodeType: 'location',
      });
    });

    it('permits a faction subject — actor-to-actor is what the schema declares', () => {
      // Deliberately *not* narrowed to individuals, unlike the favour debtor. The
      // THR-1176 audit measured a shipped `individual→faction` secret that is only
      // partly inert (the leverage reader misses it, others do not), so refusing it
      // here would delete live content to fix a different family's problem. The
      // schema says actor→actor; this enforces exactly that.
      const graph = buildGraph();

      const created = createSecretEdge('actor-hero', 'faction-temple', SECRET, 'spy_debrief', TICK, graph);

      expect(created).toBeDefined();
      expect(graph.getOutgoingEdges('actor-hero', 'knows_secret_of')).toHaveLength(1);
      expect(refusalTraces()).toHaveLength(0);
    });

    it('permits an individual subject', () => {
      const graph = buildGraph();

      expect(
        createSecretEdge('actor-hero', 'actor-innkeeper', SECRET, 'confession', TICK, graph),
      ).toBeDefined();
      expect(refusalTraces()).toHaveLength(0);
    });
  });

  it('never throws on a bad endpoint — the tick loop is not allowed to care (NFP #4)', () => {
    const graph = buildGraph();
    expect(() => createFavorEdge('loc-grove', 'actor-hero', 0.5, 'x', TICK, graph)).not.toThrow();
    expect(() => createFavorEdge('', '', 0.5, 'x', TICK, graph)).not.toThrow();
    expect(() => createSecretEdge('loc-grove', 'loc-grove', SECRET, 'observation', TICK, graph)).not.toThrow();
  });
});
