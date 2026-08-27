/**
 * The remote-anchor rule — THR-1296 §6, slice 5.
 *
 * Three properties here are the kind that pass vacuously if asserted from one side,
 * so each carries a deliberate negative arm:
 *
 * - **The edge direction.** `commanded_by` runs army → commander. A test that only
 *   asserts "the agent's army is found" passes just as well against a helper reading
 *   *outgoing* edges on a fixture that happens to wire both ways. So the direction
 *   test builds the edge the WRONG way round and asserts nothing is found.
 * - **The range gate.** An anchor test with one army in range proves nothing about a
 *   filter — a helper returning everything passes it. Both arms differ only in the
 *   army's hex, and the assertion is that the verdict FLIPS.
 * - **The local case.** `{ allowed: true }` with no `anchorNodeId` is the shape a
 *   caller could misread as a refusal, so it is asserted explicitly rather than left
 *   to a truthiness check on the id.
 *
 * The `kind: 'army'` assertion is a guard, not decoration: there is no `'army'`
 * NodeType (impediment #834's shape, second sighting), so the plausible spelling
 * `node.type === 'army'` classifies every anchor as degenerate *while compiling
 * cleanly*. This test fails if anyone reintroduces it.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  getCommandedEntities,
  findRemoteAnchors,
  requiresRemoteAnchor,
  evaluateRemoteAnchorGate,
  ANCHOR_CAST_KEY,
} from '../remoteAnchor';
import {
  BINDER_REMOTE_RANGE_HEXES,
  BINDER_REMOTE_ANCHOR_RANGE_HEXES,
} from '../../../data/binder-constants';

const HERO = 'actor-hero';
const HOME = 'loc-home';
const SITE = 'loc-site';

/** A world with the agent at `HOME` (0,0) and a far site at `siteHex`. */
function world(siteHex: { col: number; row: number } = { col: 9, row: 0 }): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HOME, type: 'location', name: 'Home', properties: { hexCol: 0, hexRow: 0 },
  });
  graph.addNode({
    id: SITE, type: 'location', name: 'The Site',
    properties: { hexCol: siteHex.col, hexRow: siteHex.row },
  });
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero', properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-hero-at', source: HERO, target: HOME, type: 'located_at', properties: {},
  });
  return graph;
}

/** Place a hex-bearing location the army can stand on, then the army, then command it. */
function addArmy(
  graph: WorldGraph,
  id: string,
  hex: { col: number; row: number },
  opts: { readonly commander?: string; readonly reversed?: boolean; readonly asCompany?: boolean } = {},
): void {
  const camp = `loc-camp-${id}`;
  graph.addNode({
    id: camp, type: 'location', name: camp,
    properties: { hexCol: hex.col, hexRow: hex.row },
  });
  graph.addNode({
    id, type: 'actor', name: id,
    properties: opts.asCompany
      ? { actorType: 'group' }
      : { actorType: 'group', armyState: { size: 'warband', headcount: 40 } },
  });
  graph.addEdge({
    id: `e-${id}-at`, source: id, target: camp, type: 'located_at', properties: {},
  });

  const commander = opts.commander ?? HERO;
  // commanded_by runs army → commander. `reversed` deliberately builds the edge the
  // wrong way round, which is the only way to prove the helper reads direction.
  graph.addEdge({
    id: `e-${id}-cmd`,
    source: opts.reversed ? commander : id,
    target: opts.reversed ? id : commander,
    type: 'commanded_by',
    properties: {},
  });
}

const siteHex = { col: 9, row: 0 };

describe('getCommandedEntities', () => {
  it('finds an army that names the agent as its commander', () => {
    const graph = world();
    addArmy(graph, 'army-1', { col: 9, row: 0 });
    expect(getCommandedEntities(graph, HERO).map(n => n.id)).toEqual(['army-1']);
  });

  it('finds NOTHING when the commanded_by edge runs the other way — the direction guard', () => {
    const graph = world();
    addArmy(graph, 'army-1', { col: 9, row: 0 }, { reversed: true });
    // The army exists, is positioned, and carries a commanded_by edge touching the
    // hero. Only the direction differs, and only the direction may decide this.
    expect(graph.getNode('army-1')).toBeDefined();
    expect(getCommandedEntities(graph, HERO)).toEqual([]);
  });

  it('returns [] for an agent who commands nothing', () => {
    expect(getCommandedEntities(world(), HERO)).toEqual([]);
  });

  it('does not return another commander\'s army', () => {
    const graph = world();
    graph.addNode({
      id: 'actor-rival', type: 'actor', name: 'Rival', properties: { actorType: 'individual' },
    });
    addArmy(graph, 'army-1', { col: 9, row: 0 }, { commander: 'actor-rival' });
    expect(getCommandedEntities(graph, HERO)).toEqual([]);
  });
});

describe('requiresRemoteAnchor', () => {
  it('is false at the range boundary and true one hex past it', () => {
    // Two arms differing by one hex across the constant. A predicate that always
    // answered the same way passes neither this pair nor the pair below.
    expect(requiresRemoteAnchor(true, BINDER_REMOTE_RANGE_HEXES)).toBe(false);
    expect(requiresRemoteAnchor(true, BINDER_REMOTE_RANGE_HEXES + 1)).toBe(true);
  });

  it('is false for a target the agent is standing on', () => {
    expect(requiresRemoteAnchor(true, 0)).toBe(false);
  });
});

describe('findRemoteAnchors', () => {
  it('finds an army standing at the site', () => {
    const graph = world();
    addArmy(graph, 'army-1', siteHex);
    const anchors = findRemoteAnchors(graph, HERO, siteHex);
    expect(anchors.map(a => a.nodeId)).toEqual(['army-1']);
    expect(anchors[0].distanceToSite).toBe(0);
  });

  it('classifies an armyState-bearing node as an army, not degenerate', () => {
    // The #834 guard: `node.type === 'army'` compiles and is always false, which would
    // silently make every anchor 'degenerate'. This is the assertion that catches it.
    const graph = world();
    addArmy(graph, 'army-1', siteHex);
    expect(findRemoteAnchors(graph, HERO, siteHex)[0].kind).toBe('army');
  });

  it('classifies a company (no armyState) as degenerate', () => {
    const graph = world();
    addArmy(graph, 'company-1', siteHex, { asCompany: true });
    expect(findRemoteAnchors(graph, HERO, siteHex)[0].kind).toBe('degenerate');
  });

  it('the range filter FLIPS on distance alone — in range vs one hex past it', () => {
    const inRange = world();
    addArmy(inRange, 'army-1', { col: siteHex.col - BINDER_REMOTE_ANCHOR_RANGE_HEXES, row: 0 });
    expect(findRemoteAnchors(inRange, HERO, siteHex)).toHaveLength(1);

    const outOfRange = world();
    addArmy(outOfRange, 'army-1', {
      col: siteHex.col - BINDER_REMOTE_ANCHOR_RANGE_HEXES - 1, row: 0,
    });
    expect(findRemoteAnchors(outOfRange, HERO, siteHex)).toHaveLength(0);
  });

  it('sorts nearest-first, and breaks ties by node id for a replayable seed', () => {
    const graph = world();
    // `army-far` is inserted FIRST so insertion order cannot be what produces the
    // expected ordering — only the sort can.
    addArmy(graph, 'army-far', { col: siteHex.col - 2, row: 0 });
    addArmy(graph, 'army-b-near', siteHex);
    addArmy(graph, 'army-a-near', siteHex);
    expect(findRemoteAnchors(graph, HERO, siteHex).map(a => a.nodeId))
      .toEqual(['army-a-near', 'army-b-near', 'army-far']);
  });

  it('skips a commanded entity with no resolvable position rather than throwing', () => {
    const graph = world();
    graph.addNode({
      id: 'army-lost', type: 'actor', name: 'Lost',
      properties: { actorType: 'group', armyState: {} },
    });
    graph.addEdge({
      id: 'e-lost-cmd', source: 'army-lost', target: HERO,
      type: 'commanded_by', properties: {},
    });
    expect(() => findRemoteAnchors(graph, HERO, siteHex)).not.toThrow();
    expect(findRemoteAnchors(graph, HERO, siteHex)).toEqual([]);
  });

  it('returns [] for an unresolvable site instead of throwing', () => {
    const graph = world();
    addArmy(graph, 'army-1', siteHex);
    expect(findRemoteAnchors(graph, HERO, null)).toEqual([]);
  });
});

describe('evaluateRemoteAnchorGate', () => {
  it('allows a LOCAL target with no anchor — permitted, not refused', () => {
    const graph = world();
    const verdict = evaluateRemoteAnchorGate(graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES, true);
    expect(verdict.allowed).toBe(true);
    // The shape a caller must not misread: allowed, carrying no anchor.
    expect(verdict.allowed && verdict.anchorNodeId).toBeUndefined();
  });

  it('refuses a remote target with nothing commanded near it', () => {
    const graph = world();
    const verdict = evaluateRemoteAnchorGate(graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES + 1, true);
    expect(verdict.allowed).toBe(false);
    expect(verdict.allowed === false && verdict.reason).toBe('no_remote_anchor');
  });

  it('allows the SAME remote target once an army stands at the site — the flip', () => {
    const graph = world();
    const before = evaluateRemoteAnchorGate(graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES + 1, true);
    expect(before.allowed).toBe(false);

    addArmy(graph, 'army-1', siteHex);
    const after = evaluateRemoteAnchorGate(graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES + 1, true);
    expect(after.allowed).toBe(true);
    expect(after.allowed && after.anchorNodeId).toBe('army-1');
  });

  it('refuses when the commanded army is too far from the site', () => {
    const graph = world();
    addArmy(graph, 'army-1', { col: 0, row: 0 }); // at home, not at the site
    const verdict = evaluateRemoteAnchorGate(graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES + 1, true);
    expect(verdict.allowed).toBe(false);
  });
});

describe('ANCHOR_CAST_KEY', () => {
  it('is the reserved `$anchor` key the ledger documents', () => {
    expect(ANCHOR_CAST_KEY).toBe('$anchor');
  });
});

describe('requiresRemoteAnchor — the scope half (THR-1296 §6 deviation, impediment #842)', () => {
  // §6 as written gated on distance alone. Shipped that way it did not make remote
  // undertakings rare, it made almost all undertakings impossible: `trades_with` edges
  // in the 120-tick seeded smoke went to ZERO and seven unrelated doom-identity
  // milestone tests fell over with them. Remoteness is a property of the verb, not of
  // how far the agent is standing, so it is declared.
  //
  // Both arms are asserted at the SAME distance. Only the declaration differs, which
  // is the only way to prove the scope half is load-bearing rather than decorative.

  it('does NOT fire for a non-remote verb, however far the target is', () => {
    expect(requiresRemoteAnchor(false, BINDER_REMOTE_RANGE_HEXES + 1)).toBe(false);
    expect(requiresRemoteAnchor(false, 500)).toBe(false);
  });

  it('fires for a remote verb at the very same distance — the flip', () => {
    const far = BINDER_REMOTE_RANGE_HEXES + 1;
    expect(requiresRemoteAnchor(false, far)).toBe(false);
    expect(requiresRemoteAnchor(true, far)).toBe(true);
  });

  it('a non-remote verb is allowed by the gate with no anchor, even far away', () => {
    const graph = world();
    const verdict = evaluateRemoteAnchorGate(
      graph, HERO, siteHex, BINDER_REMOTE_RANGE_HEXES + 10, false,
    );
    expect(verdict.allowed).toBe(true);
    expect(verdict.allowed && verdict.anchorNodeId).toBeUndefined();
  });
});
