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
import { render, screen } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { HexSidebar } from '../HexSidebar';
import { WorldGraph } from '../../../engine/graph';
import { getHexCultures } from '../../../engine/hexZoom';
import { CULTURE_FRINGE_STRENGTH, formatHexCultureName } from '../../../data/world-scenario';

function factionGraph(properties: Record<string, unknown>): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'faction_c0',
    type: 'actor',
    name: 'The Varn Congregation of the Spheres',
    properties: { actorType: 'faction', factionDefId: 'temple_of_spheres', ...properties },
  } as never);
  return graph;
}

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

describe('FactionSheet — a congregation names its sphere (THR-1659)', () => {
  it('renders "Venerates Light." under the kind for a congregation', () => {
    render(
      <FactionSheet
        factionId="faction_c0"
        name="The Varn Congregation of the Spheres"
        graph={factionGraph({ factionType: 'religious', veneratedSphere: 'light' })}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId('faction-venerates-line').textContent).toBe('Venerates Light.');
  });

  it('shows no line for a faction that venerates nothing, or a sphereless congregation', () => {
    const { unmount } = render(
      <FactionSheet
        factionId="faction_c0"
        name="A guild"
        graph={factionGraph({ factionType: 'guild' })}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('faction-venerates-line')).toBeNull();
    unmount();
    render(
      <FactionSheet
        factionId="faction_c0"
        name="The Varn Congregation of the Spheres"
        graph={factionGraph({ factionType: 'religious', veneratedSphere: null })}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('faction-venerates-line')).toBeNull();
  });

  it("reads a town guild's kind as Guild", () => {
    render(
      <FactionSheet
        factionId="faction_c0"
        name="The Tallow Guild"
        graph={factionGraph({ factionType: 'guild', factionClass: 'guild' })}
        onClose={() => {}}
      />,
    );
    const chip = screen.getByTestId('faction-type-chip');
    expect(chip.textContent).toBe('guild');
    expect(chip.style.textTransform).toBe('capitalize');
  });
});

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

  it('renders "Varn fringe" in the sidebar with no strength number (Law 13)', () => {
    const cultures = getHexCultures(hexGraph([true, true]), 2, 3);
    render(
      <HexSidebar
        terrain="grassland"
        hexCol={2}
        hexRow={3}
        sphereInfluence={null}
        regionData={null}
        locations={[]}
        agentsByLocation={{}}
        lineOfSight="full"
        cultures={cultures}
        factions={[]}
      />,
    );
    const line = screen.getByTestId('hex-sidebar-culture');
    expect(line.textContent).toBe('Varn fringe');
    expect(line.parentElement?.textContent ?? '').not.toMatch(/\d/);
  });
});
