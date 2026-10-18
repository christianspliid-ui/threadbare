/**
 * The shared lens fixture world (THR-1878): a god, three threaded mortals at the three
 * court positions (one moving), one dormant thread, and one mortal on unexplored land.
 */
import { WorldGraph } from '../../../graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import type { VisibilityMap } from '../../../../types/visibility';

export function lensTile(col: number, row: number, terrain = 'grassland'): HexTile {
  return { coord: { col, row }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain } as HexTile;
}

export interface LensFixtureOptions {
  /** Hexes ("col,row") the player has explored; omitted = fog off (every hex known). */
  explored?: string[];
  /** Leave out every thread edge (before the bond). */
  noThreads?: boolean;
  /** Leave out the Trouble and Trade state (THR-1898) — a quiet world with no road. */
  quiet?: boolean;
}

/**
 * The Trouble and Trade state on the fixture (THR-1898): Farhold is Lawless at unrest
 * 55; Millbrook's people are agitated (unrest 70); a siege at Hesk Crossing; Wolf Hollow,
 * a great lair, at 2,3; a local omen of Entropy at 3,3 (radius 1); the rival Salt Spire
 * drains a source at Farhold; two roads — Millbrook–Hesk Crossing (healthy, grain and
 * salt) and Millbrook–Farhold (threatened). Hesk Crossing is short of iron.
 */
function addTroubleAndTrade(graph: WorldGraph): void {
  graph.addNode({ id: 'trait.condition.location.lawless', type: 'trait', name: 'Lawless', properties: {} });
  const far = graph.getNode('loc_far')!;
  far.properties.unrest = 55;
  far.properties.prosperity = 40;
  far.properties.essenceSource = { contestedBy: 'rival_salt' };
  graph.addEdge({ id: 'far_lawless', source: 'loc_far', target: 'trait.condition.location.lawless', type: 'has_trait', properties: {} });
  const mill = graph.getNode('loc_mill')!;
  mill.properties.unrest = 70;
  mill.properties.prosperity = 62;
  const hesk = graph.getNode('loc_hesk')!;
  hesk.properties.prosperity = 22;
  hesk.properties.resources = { iron: { quantity: 5, renewable: false, renewalRate: 0, stockTier: 'scarce' }, grain: { quantity: 50, renewable: true, renewalRate: 0.1, stockTier: 'adequate' } };

  graph.addNode({ id: 'lair_wolf', type: 'location', name: 'Wolf Hollow', properties: { locationType: 'lair', locationSubtype: 'lair', lairTier: 'major', hexCol: 2, hexRow: 3 } });

  graph.addNode({ id: 'siege_1', type: 'actor', name: 'Siege of Hesk Crossing', properties: { actorType: 'battle', battleState: { battleType: 'siege' } } });
  graph.addEdge({ id: 'siege_1_at', source: 'siege_1', target: 'loc_hesk', type: 'located_at', properties: {} });

  graph.addEdge({ id: 'route_mill_hesk', source: 'loc_mill', target: 'loc_hesk', type: 'trades_with', properties: { volume: 2, lastTraded: 7, manifest: { goods: ['grain', 'salt'], carriesStaple: true, richness: 1 } } });
  graph.addEdge({ id: 'route_mill_far', source: 'loc_mill', target: 'loc_far', type: 'trades_with', properties: { volume: 1, lastTraded: 7, threatened: true } });
}

export function lensFixture(opts: LensFixtureOptions = {}): { state: GameState; tiles: HexTile[] } {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'loc_mill', type: 'location', name: 'Millbrook', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'loc_hesk', type: 'location', name: 'Hesk Crossing', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 4, hexRow: 1 } });
  graph.addNode({ id: 'loc_far', type: 'location', name: 'Farhold', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 6, hexRow: 3 } });
  graph.addNode({ id: 'sub_inn', type: 'location', name: 'The Drowned Lamb', properties: { locationType: 'tavern', parentLocationId: 'loc_hesk', hexCol: 4, hexRow: 1 } });

  const mortal = (id: string, name: string, gender: string | undefined, at: string, extra: Record<string, unknown> = {}) => {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', ...(gender ? { gender } : {}), ...extra } });
    graph.addEdge({ id: `${id}_at`, source: id, target: at, type: 'located_at', properties: {} });
  };
  mortal('maren', 'Maren Ashfold', 'female', 'loc_mill', {
    movementState: { destinationId: 'sub_inn', movementQueue: ['loc_hesk'], currentPathIndex: 0 },
  });
  mortal('oswin', 'Oswin Hale', 'male', 'loc_hesk');
  mortal('nameless', '', undefined, 'loc_hesk');
  mortal('sleeper', 'Bram Sleeper', 'male', 'loc_mill');
  mortal('farwalker', 'Ilse Far', 'female', 'loc_far');

  if (!opts.noThreads) {
    const thread = (target: string, courtPosition: string) =>
      graph.addEdge({ id: `t_${target}`, source: 'asc', target, type: 'thread', properties: { courtPosition } });
    thread('maren', 'the_first');
    thread('oswin', 'retinue');
    thread('nameless', 'watched');
    thread('sleeper', 'dormant');
    thread('farwalker', 'watched');
  }

  if (!opts.quiet) addTroubleAndTrade(graph);

  const tiles: HexTile[] = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 5; r++) tiles.push(lensTile(c, r, c === 7 ? 'ocean' : 'grassland'));

  let visibilityMap: VisibilityMap = new Map();
  if (opts.explored) {
    visibilityMap = new Map();
    for (const t of tiles) {
      const key = `${t.coord.col},${t.coord.row}`;
      visibilityMap.set(key, { state: opts.explored.includes(key) ? 'visible' : 'unexplored' });
    }
  }

  const state = {
    graph, ascendantId: 'asc', tick: 7, visibilityMap, unifiedActions: [], encounterProgress: [],
    familiarityMap: new Map(),
    rivalDefinitions: opts.quiet ? [] : [{ id: 'rival_salt', name: 'The Salt Spire', primarySphere: 'entropy' }],
    emittedOmens: opts.quiet ? [] : [{
      omenId: 'omen_1', sourceEncounterId: 'enc', sourceReactionId: 'r', category: 'warning', intensity: 0.5,
      scope: { kind: 'local', hexCol: 3, hexRow: 3, radius: 1 }, narrativeHook: '', sphereAlignment: 'entropy',
      emittedTick: 1, expiresTick: 50,
    }],
    doomDefinition: { archetype: 'breach', stages: [{ stage: 1, name: 'Signs' }, { stage: 2, name: 'Stirrings' }] },
    doomClock: { currentStage: 1 },
  } as unknown as GameState;
  return { state, tiles };
}
