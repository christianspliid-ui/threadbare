// @vitest-environment jsdom
/**
 * The faction sheet renders a Realm (THR-1155 slice 2).
 *
 * A Realm is a Faction, so the sheet already rendered one — its members, its halls,
 * what it controls, its agenda. Two things it got wrong, both because a Realm's
 * identity lives in places the sheet was not looking:
 *
 * 1. **The type chip read `Political`.** It renders `factionType` title-cased, and a
 *    Realm's stored value is the enum `'political'` — a raw key on a player surface
 *    (Law 14), and the wrong word besides: the headword is **Realm** (THR-1453).
 * 2. **The court had no seat.** A Realm's seat is `role: 'seat'` on one `controls`
 *    edge — the same stamp conquest re-writes and the projection draws a capital
 *    marker from — and the sheet named it nowhere, so the one town on the map with a
 *    dot had nothing saying why.
 *
 * The guild arm is the half that makes the Realm arm mean something: the discriminator
 * is `factionClass` on the node, so a guild whose definition happens to say `political`
 * is still a guild, and a sheet that special-cased on the type would have said Realm.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { WorldGraph } from '../../../engine/graph';
import { REALM_FACTION_CLASS, REALM_HEADWORD } from '../../../data/realm-content';

/** A Realm holding two towns, seated in one of them. */
function realmGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'faction_0',
    type: 'actor',
    name: 'hold of Witness Skyfield',
    properties: {
      actorType: 'faction',
      factionClass: REALM_FACTION_CLASS,
      factionType: 'political',
      factionDefId: 'realm.culture_0',
      cultureId: 'culture_0',
    },
  } as never);
  for (const [id, name] of [['loc_0', 'Ardenmor'], ['loc_1', 'Cindermere']] as const) {
    graph.addNode({
      id, type: 'location', name,
      properties: { locationSubtype: 'capital', hexCol: 3, hexRow: 4 },
    } as never);
  }
  graph.addEdge({
    id: 'e_controls_0', source: 'faction_0', target: 'loc_0', type: 'controls',
    properties: { influence: 0.9, role: 'seat' },
  } as never);
  graph.addEdge({
    id: 'e_controls_1', source: 'faction_0', target: 'loc_1', type: 'controls',
    properties: { influence: 0.7 },
  } as never);
  return graph;
}

/** The same shape with `factionClass: 'guild'` — the control for the chip. */
function guildGraph(): WorldGraph {
  const graph = realmGraph();
  const node = graph.getNode('faction_0');
  graph.updateNode('faction_0', {
    properties: { ...node!.properties, factionClass: 'guild' },
  } as never);
  return graph;
}

describe('FactionSheet — a Realm reads as a Realm (THR-1155)', () => {
  it('names the kind with the headword, not the stored type key', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={realmGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('faction-type-chip').textContent).toBe(REALM_HEADWORD);
  });

  it('a guild carrying the same factionType still reads as its own kind', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={guildGraph()}
        onClose={() => {}}
      />,
    );

    // `factionClass` is the discriminator, so the chip falls back to the type here —
    // which is the pre-existing behaviour for every non-Realm faction and must stay.
    expect(screen.getByTestId('faction-type-chip').textContent).not.toBe(REALM_HEADWORD);
  });

  it('names the town its court sits in', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={realmGraph()}
        onClose={() => {}}
      />,
    );

    // The seated town, not merely the first one held — the sheet reads the `role`
    // stamp, so a re-seating moves this line the way it moves the capital marker.
    expect(screen.getByTestId('faction-seat-chip').textContent).toBe('Court at Ardenmor');
  });

  it('shows no court chip for a guild, whose halls are already their own section', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={guildGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByTestId('faction-seat-chip')).toBeNull();
  });

  it('shows no court chip for a seatless Realm rather than an empty one', () => {
    // NFP #4 — `stampRealmSeat` returns null for a Realm holding nothing seatable, and
    // a conquest can leave a Realm in exactly that state between two ticks.
    const graph = realmGraph();
    graph.removeEdge('e_controls_0');

    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={graph}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByTestId('faction-seat-chip')).toBeNull();
    expect(screen.getByTestId('faction-type-chip').textContent).toBe(REALM_HEADWORD);
  });

  it('lists the towns the Realm holds under What They Control', () => {
    render(
      <FactionSheet
        factionId="faction_0"
        name="hold of Witness Skyfield"
        graph={realmGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('What They Control')).toBeTruthy();
    expect(screen.getAllByText('Cindermere').length).toBeGreaterThan(0);
  });
});
