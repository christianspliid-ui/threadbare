/**
 * THR-1275 part 2 — `membership_change` enrols you in the chapter you are standing in.
 *
 * `resolveFactionNodeId` matched a `factionDefId` world-wide and, with no existing
 * membership to read, returned `matches.sort()[0]`. Chapters share a `factionDefId`
 * and a `join` has no membership by definition, so "the settlement takes them in"
 * enrolled the agent in whichever chapter sorted first — reliably the wrong one, and
 * silently, because the write succeeds and the chip renders a real faction sheet.
 * Found by the full-line-proof run (2026-08-26).
 *
 * ## Falsification
 *
 * Every locality arm here is written so the **pre-fix** implementation fails it, and
 * the fixtures are built to make that unambiguous rather than lucky: in each one the
 * correct chapter is `_c` or `_b` while `_a` exists and sorts first, so
 * `matches.sort()[0]` returns a *specific wrong answer* rather than accidentally
 * coinciding with the right one. Reverting `localChapterNodeId` turns each of those
 * arms red with `_a`.
 *
 * The three arms that assert the **fallback** are the other half, and they are not
 * padding: a locality rule that guesses when it cannot rank is worse than one that
 * admits it, because a wrong pick reads as intentional. An unplaced agent, a hexless
 * location with no chapter on it, and a candidate set with no placeable seat must all
 * still land on the deterministic sort (NFP #3) — those arms stay green before and
 * after the fix, and they are what stops the fix from becoming a different bug.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveFactionNodeId, joinFaction, findMembershipEdge } from '../factionMembership';

/**
 * Three chapters of one order, three settlements, one hero.
 *
 * Chapter seats are deliberately *not* in id order relative to the map: `_a` sorts
 * first and sits far east, `_c` sorts last and sits at the origin. So any test that
 * expects `_c` is expecting the sort to have been overruled.
 */
function buildWorld(): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });

  graph.addNode({
    id: 'loc-origin', type: 'location', name: 'Hollowmere',
    properties: { hexCol: 0, hexRow: 0 },
  });
  graph.addNode({
    id: 'loc-mid', type: 'location', name: 'Ashford',
    properties: { hexCol: 4, hexRow: 0 },
  });
  graph.addNode({
    id: 'loc-far', type: 'location', name: 'Stonewatch',
    properties: { hexCol: 20, hexRow: 0 },
  });

  // `_a` sorts first and is the farthest away; `_c` sorts last and is at the origin.
  const seats: Record<string, string> = {
    _a: 'loc-far',
    _b: 'loc-mid',
    _c: 'loc-origin',
  };
  for (const [suffix, seatId] of Object.entries(seats)) {
    const factionId = `faction_def_masons${suffix}`;
    graph.addNode({
      id: factionId, type: 'actor', name: `Masons ${suffix}`,
      properties: { actorType: 'faction', factionDefId: 'masons', homeLocationId: seatId },
    });
    graph.addEdge({
      id: `edge_fdef_at_${factionId}`,
      source: factionId, target: seatId, type: 'located_at',
      properties: { role: 'guild_hall' },
    });
  }

  return graph;
}

/** Stand the hero somewhere. One `located_at` — the three-tier position model. */
function placeHero(graph: WorldGraph, nodeId: string): void {
  graph.addEdge({
    id: `located_at_actor-hero_${nodeId}`,
    source: 'actor-hero', target: nodeId, type: 'located_at',
    properties: {},
  });
}

describe('THR-1275 — chapter resolution follows the agent, not the sort', () => {
  it('picks the chapter whose hall is on the location the agent is standing on', () => {
    const graph = buildWorld();
    placeHero(graph, 'loc-origin');

    // Pre-fix this returned 'faction_def_masons_a' — a chapter twenty hexes east of
    // the settlement whose door the agent just walked through.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_c');
  });

  it('resolves up from a sublocation to the location that hosts the chapter', () => {
    const graph = buildWorld();
    graph.addNode({
      id: 'subloc-taproom', type: 'location', name: 'The Taproom',
      properties: { parentLocationId: 'loc-mid', sublocationTypeId: 'sublocation-type.tavern' },
    });
    placeHero(graph, 'subloc-taproom');

    // An agent in a tavern is in the settlement. Reading the `located_at` target
    // without resolving the tier would find no chapter there and fall to the sort.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_b');
  });

  it('falls to the nearest chapter by hex when none sits on this location', () => {
    const graph = buildWorld();
    graph.addNode({
      id: 'loc-crossroads', type: 'location', name: 'The Crossroads',
      properties: { hexCol: 5, hexRow: 0 },
    });
    placeHero(graph, 'loc-crossroads');

    // Distances from col 5: _c at 0 → 5, _b at 4 → 1, _a at 20 → 15.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_b');
  });

  it('lets an existing membership beat locality — an expulsion abroad is from your own chapter', () => {
    const graph = buildWorld();
    placeHero(graph, 'loc-origin');
    graph.addEdge({
      id: 'member_actor-hero_faction_def_masons_b',
      source: 'actor-hero', target: 'faction_def_masons_b', type: 'member_of',
      properties: { role: 'member', rank: 0.2, joinedTick: 0 },
    });

    // The hero is standing in _c's hall, but they belong to _b. A promotion or
    // expulsion is about the branch they are actually in.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_b');
  });

  it('falls back to the deterministic sort for an agent who is nowhere', () => {
    const graph = buildWorld();
    // No `located_at` at all. Locality cannot rank them, so the honest answer is the
    // stable one — not a guess that would read as intentional.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_a');
  });

  it('falls back to the sort when the agent stands on a location with no hex', () => {
    const graph = buildWorld();
    graph.addNode({
      id: 'loc-unplaced', type: 'location', name: 'The Between',
      properties: {},
    });
    placeHero(graph, 'loc-unplaced');

    // A `?? 0` default here would put this location at the map origin and hand the
    // pick to `_c`, which is exactly the wrong-chapter bug wearing a different hat.
    expect(resolveFactionNodeId(graph, 'masons', 'actor-hero')).toBe('faction_def_masons_a');
  });

  it('falls back to the sort when no candidate chapter has a placeable seat', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-hero', type: 'actor', name: 'Maret',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'loc-origin', type: 'location', name: 'Hollowmere',
      properties: { hexCol: 0, hexRow: 0 },
    });
    for (const suffix of ['_a', '_b']) {
      graph.addNode({
        id: `faction_def_drifters${suffix}`, type: 'actor', name: `Drifters ${suffix}`,
        properties: { actorType: 'faction', factionDefId: 'drifters' },
      });
    }
    placeHero(graph, 'loc-origin');

    expect(resolveFactionNodeId(graph, 'drifters', 'actor-hero'))
      .toBe('faction_def_drifters_a');
  });

  it('writes the membership edge into the local chapter, end to end', () => {
    const graph = buildWorld();
    placeHero(graph, 'loc-origin');

    // The whole point: not just that resolution answers `_c`, but that the edge the
    // player's sheet reads lands there.
    const result = joinFaction(graph, 'actor-hero', 'masons', 7);
    expect(result.changed).toBe(true);
    expect(result.factionNodeId).toBe('faction_def_masons_c');
    expect(findMembershipEdge(graph, 'actor-hero', 'faction_def_masons_c')).toBeDefined();
    expect(findMembershipEdge(graph, 'actor-hero', 'faction_def_masons_a')).toBeUndefined();
  });

  it('is unchanged in a single-chapter world', () => {
    const graph = buildWorld();
    placeHero(graph, 'loc-far');
    graph.addNode({
      id: 'faction_def_lone', type: 'actor', name: 'The Lone Hall',
      properties: { actorType: 'faction', factionDefId: 'lone', homeLocationId: 'loc-origin' },
    });

    // One candidate short-circuits before any locality work, so a chapter on the
    // far side of the map is still the answer — there is no other.
    expect(resolveFactionNodeId(graph, 'lone', 'actor-hero')).toBe('faction_def_lone');
  });
});
