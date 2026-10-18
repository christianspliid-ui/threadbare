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
}

export function lensFixture(opts: LensFixtureOptions = {}): { state: GameState; tiles: HexTile[] } {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'loc_mill', type: 'location', name: 'Millbrook', properties: { locationType: 'town', hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'loc_hesk', type: 'location', name: 'Hesk Crossing', properties: { locationType: 'town', hexCol: 4, hexRow: 1 } });
  graph.addNode({ id: 'loc_far', type: 'location', name: 'Farhold', properties: { locationType: 'town', hexCol: 6, hexRow: 3 } });
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
  } as unknown as GameState;
  return { state, tiles };
}
