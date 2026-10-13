/**
 * THR-1750 — the Dominion hex projection (plan § E1, § Done when):
 * the assignment where the radius and the tie rule decide; water carries no band;
 * frontier edges skip water and the rim; terrain fallback past the radius;
 * determinism (two builds equal); the drop badge diff.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import type { SphereName, HexTile, TerrainType } from '../../types';
import {
  buildDominionHexAssignment,
  buildDominionHexProjection,
  frontierEdges,
  countHexBands,
  diffDominionDrops,
} from '../dominionProjection';
import { dominionOf } from '../dominion';
import { hexKey } from '../../lib/hexKey';
import { DOMINION_HEX_FILL_RADIUS, DOMINION_DROP_BADGE_TICKS } from '../../data/dominion-ui-content';
import { createSimulationRuntime, ensureDominionProjection, updateDominionDrops } from '../simulationRuntime';

const GOD = 'asc.witness';

function bag(scores: Partial<Record<SphereName, number>>) {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

const LOVED = bag({ mind: 5, spirit: 5 });   // Sovereign / Held for a mind+spirit god
const HATED = bag({ force: 5, energy: 5 });  // the opposite poles → Hostile

function tile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return { coord: { col, row }, terrain } as HexTile;
}

/** A 12 × 3 strip of land with a sea column at col 11. */
function strip(): HexTile[] {
  const out: HexTile[] = [];
  for (let col = 0; col < 12; col++) for (let row = 0; row < 3; row++) out.push(tile(col, row, col === 11 ? 'ocean' : 'grassland'));
  return out;
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: GOD, type: 'actor', name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      spherePoints: { mind: 3, spirit: 2 },
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  // Home at col 1, Foe at col 5: col 3 is equidistant (2 from each).
  graph.addNode({ id: 'loc.b_home', type: 'location', name: 'Home', properties: { hexCol: 1, hexRow: 1, sphereAffinity: LOVED } });
  graph.addNode({ id: 'loc.a_foe', type: 'location', name: 'Foe', properties: { hexCol: 5, hexRow: 1, sphereAffinity: HATED } });
  // A sublocation on Home's hex must never lend a band of its own.
  graph.addNode({ id: 'loc.b_home.inn', type: 'location', name: 'Inn', properties: { parentLocationId: 'loc.b_home', hexCol: 9, hexRow: 1, sphereAffinity: HATED } });
  return graph;
}

describe('dominionProjection (THR-1750)', () => {
  it('reads the fixture bands the test relies on', () => {
    const g = makeGraph();
    expect(dominionOf(g, GOD, 'loc.b_home').band).not.toBe('foreign');
    expect(dominionOf(g, GOD, 'loc.a_foe').band).toBe('hostile');
  });

  it('assigns each land hex to the nearest top-level place within the radius', () => {
    const g = makeGraph();
    const a = buildDominionHexAssignment(g, strip());
    expect(a.candidates.get(hexKey(1, 1))).toEqual(['loc.b_home']);
    expect(a.candidates.get(hexKey(6, 1))).toEqual(['loc.a_foe']);
    // equidistant: both, sorted by id
    expect(a.candidates.get(hexKey(3, 1))).toEqual(['loc.a_foe', 'loc.b_home']);
    // the sublocation never seeds (getLocationNodes, never the bare type read)
    expect(a.placeIds).not.toContain('loc.b_home.inn');
    // past the radius: no place in reach
    expect(DOMINION_HEX_FILL_RADIUS).toBe(2);
    expect(a.candidates.get(hexKey(9, 1))).toEqual([]);
  });

  it('water carries no band', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    expect(p.hexBand.has(hexKey(11, 1))).toBe(false);
    expect(p.hexPlaceId.has(hexKey(11, 1))).toBe(false);
  });

  it('equidistant places: the tie priority decides (Hostile before Held/Touched)', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    const homeBand = p.placeBand.get('loc.b_home')!;
    // Sovereign beats Hostile in the priority; anything else loses to Hostile.
    const expected = homeBand === 'sovereign' ? 'loc.b_home' : 'loc.a_foe';
    expect(p.hexPlaceId.get(hexKey(3, 1))).toBe(expected);
    expect(p.hexBand.get(hexKey(3, 1))).toBe(p.placeBand.get(expected));
  });

  it('falls back to the terrain read past the radius', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    expect(p.hexPlaceId.get(hexKey(9, 1))).toBeNull();
    expect(p.hexBand.get(hexKey(9, 1))).toBeDefined();
    expect(p.terrainFallbackHexes).toBeGreaterThan(0);
  });

  it('frontier edges join turf to non-turf land, never water or the rim', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    const edges = frontierEdges(p);
    expect(edges.length).toBeGreaterThan(0);
    for (const e of edges) {
      expect(['touched', 'held', 'sovereign']).toContain(p.hexBand.get(e.a));
      const b = p.hexBand.get(e.b);
      expect(b).toBeDefined(); // a land hex on the map
      expect(['touched', 'held', 'sovereign']).not.toContain(b);
      expect(e.meetsHostile).toBe(b === 'hostile');
    }
  });

  it('is deterministic: two builds are equal', () => {
    const g = makeGraph();
    const p1 = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    const p2 = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    expect([...p1.hexBand]).toEqual([...p2.hexBand]);
    expect([...p1.hexPlaceId]).toEqual([...p2.hexPlaceId]);
    expect(frontierEdges(p1)).toEqual(frontierEdges(p2));
    expect(countHexBands(p1)).toEqual(countHexBands(p2));
  });

  it('a hex agrees with its place: band on the place hex = dominionOf(place)', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, strip()));
    expect(p.hexBand.get(hexKey(1, 1))).toBe(dominionOf(g, GOD, 'loc.b_home').band);
    expect(p.hexBand.get(hexKey(5, 1))).toBe(dominionOf(g, GOD, 'loc.a_foe').band);
  });

  it('a place with no hex is skipped, not thrown on', () => {
    const g = makeGraph();
    g.addNode({ id: 'loc.c_nowhere', type: 'location', name: 'Nowhere', properties: { sphereAffinity: LOVED } });
    expect(() => buildDominionHexAssignment(g, strip())).not.toThrow();
    expect(buildDominionHexAssignment(g, strip()).placeIds).not.toContain('loc.c_nowhere');
  });

  it('no god → every land hex Foreign, no frontier', () => {
    const g = makeGraph();
    const p = buildDominionHexProjection(g, 'asc.missing', buildDominionHexAssignment(g, strip()));
    expect(new Set(p.hexBand.values())).toEqual(new Set(['foreign']));
    expect(frontierEdges(p)).toEqual([]);
  });
});

describe('ensureDominionProjection (THR-1750 § E2)', () => {
  it('builds on first call, reuses within the cadence, rebuilds on a structure bump', () => {
    const g = makeGraph();
    const rt = createSimulationRuntime();
    const p1 = ensureDominionProjection(rt, g, strip(), GOD, 10, true);
    expect(p1.hexBand.size).toBeGreaterThan(0);
    expect(ensureDominionProjection(rt, g, strip(), GOD, 11)).toBe(p1);
    rt.structuralCacheVersion++;
    expect(ensureDominionProjection(rt, g, strip(), GOD, 12)).not.toBe(p1);
  });
});

describe('band-drop badges (THR-1750 § Decided 6)', () => {
  it('a drop from Touched-or-better badges the place for DOMINION_DROP_BADGE_TICKS with the chronicle line', () => {
    const g = makeGraph();
    const drops = diffDominionDrops(g, { 'loc.b_home': 'held' }, { bands: { 'loc.b_home': 'touched' }, dayDrops: [] }, 100, []);
    expect(drops).toHaveLength(1);
    expect(drops[0]).toMatchObject({ placeId: 'loc.b_home', hexKey: hexKey(1, 1), untilTick: 100 + DOMINION_DROP_BADGE_TICKS });
    expect(drops[0].line).toBe('Home has slipped from Held to Touched. No one tends it.');
  });

  it('no badge for a rise, a Foreign→Hostile drop, or a place gone from the map; badges expire', () => {
    const g = makeGraph();
    expect(diffDominionDrops(g, { 'loc.b_home': 'touched' }, { bands: { 'loc.b_home': 'held' }, dayDrops: [] }, 1, [])).toEqual([]);
    expect(diffDominionDrops(g, { 'loc.a_foe': 'foreign' }, { bands: { 'loc.a_foe': 'hostile' }, dayDrops: [] }, 1, [])).toEqual([]);
    expect(diffDominionDrops(g, { 'loc.gone': 'held' }, { bands: { 'loc.gone': 'touched' }, dayDrops: [] }, 1, [])).toEqual([]);
    const live = diffDominionDrops(g, { 'loc.b_home': 'held' }, { bands: { 'loc.b_home': 'touched' }, dayDrops: [] }, 1, []);
    expect(diffDominionDrops(g, { 'loc.b_home': 'touched' }, { bands: { 'loc.b_home': 'touched' }, dayDrops: [] }, 1 + DOMINION_DROP_BADGE_TICKS, live)).toEqual([]);
  });

  it('updateDominionDrops reads once per tick and keeps the previous bands', () => {
    const g = makeGraph();
    const rt = createSimulationRuntime();
    expect(updateDominionDrops(rt, g, GOD, 1)).toEqual([]);
    expect(rt.dominionDropsReadAt).toBe(1);
    expect(rt.dominionPrevBands).toEqual({});
  });
});
