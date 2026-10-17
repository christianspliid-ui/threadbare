/**
 * The land naming rule (THR-1827 call 18; THR-1876 § D7.3).
 *
 * One function names a hex everywhere a land is named — the land page, a neighbour's
 * *Around it* row and the god rail's Covenants row — so the three read word for word
 * the same:
 *
 * 1. a Location on the hex → "The plateau at Oreblack Deep" (terrain word + its name);
 * 2. else the hex's Area → its name ("The Bone Coast");
 * 3. else "Open plateau".
 *
 * The Location is `hexPlaceName`'s pick (an undiscovered place is never named).
 */
import type { GameState } from '../../../types/gameState';
import type { WorldGraph } from '../../graph';
import { getLocationNodes } from '../../sublocationShape';
import { INSPECTOR_WORDS } from '../../../data/view-content';

/** A terrain key as a lower-case word: `ice_sheet` → "ice sheet". */
export function terrainWord(terrain: string | undefined | null): string {
  return (terrain || 'wilds').replace(/_/g, ' ').toLowerCase();
}

/** The hex's named Location (alphabetical, discovered only), or null. */
export function namedLocationOnHex(graph: WorldGraph, col: number, row: number): { id: string; name: string } | null {
  const onHex = getLocationNodes(graph)
    .filter(n => n.properties.hexCol === col && n.properties.hexRow === row && n.name && n.properties.discovered !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  return onHex.length > 0 ? { id: onHex[0].id, name: onHex[0].name } : null;
}

/** The land's name by the naming rule. Fail-soft: no tile → "Open wilds". */
export function landNameFor(state: Pick<GameState, 'graph' | 'tiles'>, col: number, row: number): string {
  const tile = state.tiles?.find(t => t.coord.col === col && t.coord.row === row);
  const terrain = terrainWord(tile?.terrain);
  const place = namedLocationOnHex(state.graph, col, row);
  if (place) return INSPECTOR_WORDS.landNameAt.replace('{terrain}', terrain).replace('{place}', place.name);
  const area = tile?.regionId ? state.graph.getNode(tile.regionId) : undefined;
  if (area?.name) return area.name;
  return INSPECTOR_WORDS.landNameOpen.replace('{terrain}', terrain);
}
