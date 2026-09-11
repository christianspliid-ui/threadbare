// @vitest-environment jsdom
/**
 * HeldByLine — whose writ runs over a place (THR-1155 § UI).
 *
 * The line the location profile and the hex chronicle both render, and the reader
 * behind it. Before this the game had no surface that named a town's holder: the red
 * border said a nation existed and nothing else in the UI agreed, because nothing else
 * read the `controls` edge the border is now projected from.
 *
 * The reader is tested beside the component on purpose — the Done-when is *the line
 * says who holds it*, and a component test with a hand-made holder object would pass
 * over a reader that answers wrong.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeldByLine } from '../HeldByLine';
import { WorldGraph } from '../../../engine/graph';
import { getLocationHolder } from '../../../engine/realmHolder';
import {
  REALM_FACTION_CLASS,
  REALM_HELD_BY_LABEL,
  REALM_SEAT_COPY,
  REALM_UNCLAIMED_COPY,
} from '../../../data/realm-content';

/**
 * A town, a Realm that holds it, and a guild that holds a second town — the shape the
 * guild-hall reconciliation leaves on every generated world.
 */
function buildHeldWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'faction_0', type: 'actor', name: 'hold of Witness Skyfield',
    properties: { actorType: 'faction', factionClass: REALM_FACTION_CLASS, factionDefId: 'realm.c0' },
  });
  graph.addNode({
    id: 'faction_def_arcane_circle', type: 'actor', name: 'The Arcane Circle',
    properties: { actorType: 'faction', factionClass: 'guild', factionDefId: 'arcane_circle' },
  });
  for (const [id, name] of [['loc_0', 'Ashford'], ['loc_1', 'Cindermere'], ['loc_2', 'Thornwaste']] as const) {
    graph.addNode({
      id, type: 'location', name,
      properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 },
    });
  }
  graph.addEdge({
    id: 'e_controls_0', source: 'faction_0', target: 'loc_0', type: 'controls',
    properties: { influence: 0.6, role: 'seat' },
  });
  graph.addEdge({
    id: 'e_controls_1', source: 'faction_def_arcane_circle', target: 'loc_1', type: 'controls',
    properties: { influence: 0.5 },
  });
  // `loc_2` is held by nobody — the unclaimed case.
  return graph;
}

describe('getLocationHolder — the Realm\'s point reader (THR-1155)', () => {
  it('names the Realm that holds a town, and marks its seat', () => {
    const holder = getLocationHolder(buildHeldWorld(), 'loc_0');

    expect(holder).toEqual({
      id: 'faction_0',
      name: 'hold of Witness Skyfield',
      isRealm: true,
      isSeat: true,
      edgeId: 'e_controls_0',
    });
  });

  it('names a guild that holds the town its hall stands in, and does not call it a Realm', () => {
    const holder = getLocationHolder(buildHeldWorld(), 'loc_1');

    expect(holder?.name).toBe('The Arcane Circle');
    // The discriminator is `factionClass`, so the reconciliation's ceded towns report a
    // holder without the political map gaining one.
    expect(holder?.isRealm).toBe(false);
    expect(holder?.isSeat).toBe(false);
  });

  it('returns null for a town nobody holds, and for no town at all', () => {
    const graph = buildHeldWorld();
    expect(getLocationHolder(graph, 'loc_2')).toBeNull();
    expect(getLocationHolder(graph, undefined)).toBeNull();
  });

  it('ignores a mortal\'s strategic hold — a stance is not title (THR-1448)', () => {
    const graph = buildHeldWorld();
    graph.addNode({
      id: 'mortal_1', type: 'actor', name: 'Someone',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'e_stance', source: 'mortal_1', target: 'loc_2', type: 'controls',
      properties: { controlType: 'strategic' },
    });

    // The same filter conquest and the projection use. Without it the sheet would name
    // a person as a town's nation, on an edge THR-1448 has not decided the meaning of.
    expect(getLocationHolder(graph, 'loc_2')).toBeNull();
  });
});

describe('HeldByLine — image, tooltip and link (THR-1155)', () => {
  it('renders the holder\'s name, its visual and the seat marker', () => {
    const graph = buildHeldWorld();
    render(<HeldByLine holder={getLocationHolder(graph, 'loc_0')} graph={graph} onOpenFaction={() => {}} />);

    expect(screen.getByText(REALM_HELD_BY_LABEL)).toBeTruthy();
    expect(screen.getByText('hold of Witness Skyfield')).toBeTruthy();
    expect(screen.getByTestId('held-by-visual')).toBeTruthy();
    expect(screen.getByText(REALM_SEAT_COPY)).toBeTruthy();
  });

  it('opens the holder\'s sheet when the name is clicked', async () => {
    const graph = buildHeldWorld();
    const onOpenFaction = vi.fn();
    render(<HeldByLine holder={getLocationHolder(graph, 'loc_0')} graph={graph} onOpenFaction={onOpenFaction} />);

    fireEvent.click(screen.getByRole('button', { name: /hold of Witness Skyfield/ }));

    expect(onOpenFaction).toHaveBeenCalledWith('faction_0');
  });

  it('renders the name as plain text on a surface that cannot route', () => {
    const graph = buildHeldWorld();
    render(<HeldByLine holder={getLocationHolder(graph, 'loc_0')} graph={graph} />);

    // Law 17 — the affordance goes, the information stays. A caller that forgets the
    // handler must lose the click and never the line.
    expect(screen.getByText('hold of Witness Skyfield')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /hold of Witness Skyfield/ })).toBeNull();
  });

  it('says Unclaimed in words for ground no faction holds', () => {
    const graph = buildHeldWorld();
    render(<HeldByLine holder={getLocationHolder(graph, 'loc_2')} graph={graph} onOpenFaction={() => {}} />);

    // A designed state, not a blank row (Law 4): the label still renders, so the player
    // reads an answer rather than a section that failed to load.
    expect(screen.getByText(REALM_HELD_BY_LABEL)).toBeTruthy();
    expect(screen.getByTestId('held-by-unclaimed').textContent).toBe(REALM_UNCLAIMED_COPY);
    expect(screen.queryByTestId('held-by-visual')).toBeNull();
    expect(screen.queryByText(REALM_SEAT_COPY)).toBeNull();
  });

  it('does not omit the seat marker on a Realm\'s non-seat town', () => {
    // The arm that makes the seat assertion above mean something: the marker tracks the
    // edge's `role`, not merely "this is a Realm".
    const graph = buildHeldWorld();
    graph.addEdge({
      id: 'e_controls_2', source: 'faction_0', target: 'loc_2', type: 'controls',
      properties: { influence: 0.5 },
    });
    render(<HeldByLine holder={getLocationHolder(graph, 'loc_2')} graph={graph} onOpenFaction={() => {}} />);

    expect(screen.getByText('hold of Witness Skyfield')).toBeTruthy();
    expect(screen.queryByText(REALM_SEAT_COPY)).toBeNull();
  });
});
