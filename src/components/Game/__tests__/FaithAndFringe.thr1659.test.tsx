// @vitest-environment jsdom
/**
 * The player sees faith and fringe (THR-1659, slice S2 of THR-1632).
 *
 * S1 wrote three things at worldgen that no player surface read: a congregation's
 * `veneratedSphere`, the `fringe: true` flag on a fringe settlement's culture link, and
 * `factionType: 'guild'` on a town guild. This slice reads them:
 *
 * 1. The faction page names the sphere a congregation venerates — "Venerates Light."
 * 2. The hex culture panel reads a fringe settlement's culture as "Varn fringe", never
 *    as full membership and never as the 0.5 strength behind it (Law 13).
 * 3. A town guild's kind chip reads its stored type, `guild`.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import { getHexCultures } from '../../../engine/hexZoom';
import { CULTURE_FRINGE_STRENGTH, formatHexCultureName } from '../../../data/world-scenario';

/** One hex holding two settlements, each linked to the same culture. */
function hexGraph(fringeFlags: [boolean, boolean]): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'culture_0', type: 'actor', name: 'Varn', properties: { actorType: 'culture' } } as never);
  fringeFlags.forEach((fringe, i) => {
    graph.addNode({
      id: `loc_${i}`, type: 'location', name: `Town ${i}`,
      properties: { locationSubtype: 'town', hexCol: 2, hexRow: 3 },
    } as never);
    graph.addEdge({
      id: `e_belongs_${i}`, source: `loc_${i}`, target: 'culture_0', type: 'belongs_to',
      properties: fringe
        ? { cultureLayer: 'current', culturalStrength: CULTURE_FRINGE_STRENGTH, fringe: true }
        : { cultureLayer: 'current', culturalStrength: 1.0 },
    } as never);
  });
  return graph;
}

describe('hex culture panel — a fringe settlement reads as fringe (THR-1659)', () => {
  it('flags a culture fringe only when every link to it in the hex is fringe', () => {
    expect(getHexCultures(hexGraph([true, true]), 2, 3)[0].fringe).toBe(true);
    expect(getHexCultures(hexGraph([true, false]), 2, 3)[0].fringe).toBe(false);
    expect(getHexCultures(hexGraph([false, false]), 2, 3)[0].fringe).toBe(false);
  });

  it('formats the label as "Varn fringe", and a heartland culture by its name', () => {
    expect(formatHexCultureName({ cultureName: 'Varn', fringe: true })).toBe('Varn fringe');
    expect(formatHexCultureName({ cultureName: 'Varn', fringe: false })).toBe('Varn');
    expect(formatHexCultureName({ cultureName: 'Varn' })).toBe('Varn');
  });

});
