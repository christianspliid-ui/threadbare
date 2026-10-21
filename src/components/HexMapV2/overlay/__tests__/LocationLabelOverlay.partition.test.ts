/**
 * THR-1960 — the label pass names only the places the icon pass draws.
 *
 * A hidden elder ruin (UNDRAWN_PLACE_TYPES) gets no label and no ring slot; an
 * undiscovered anomaly keeps its slot (the icon pass gives it one and draws nothing)
 * but shows no name.
 */

import { describe, it, expect } from 'vitest';
import { partitionHexLabels, type LocationLabelData } from '../LocationLabelOverlay';

function place(name: string, locationType: string, extra: Partial<LocationLabelData> = {}): LocationLabelData {
  return { id: `loc-0-0-${name}`, name, hexCol: 0, hexRow: 0, importance: 'small', locationType, ...extra };
}

describe('partitionHexLabels (THR-1960)', () => {
  it('drops an undiscovered elder ruin: no label, no ring slot', () => {
    const withRuin = partitionHexLabels([
      place('Battlefield Ruin', 'elder_ruin'),
      place('Old Shrine', 'shrine'),
      place('Watchtower', 'tower'),
    ]);
    const withoutRuin = partitionHexLabels([place('Old Shrine', 'shrine'), place('Watchtower', 'tower')]);

    const names = [...withRuin.centered, ...withRuin.ring].map(l => l.name);
    expect(names).not.toContain('Battlefield Ruin');
    expect(withRuin.ringSlotCount).toBe(2);
    expect(withRuin).toEqual(withoutRuin);
  });

  it('a centered elder ruin is dropped too, and a town beside it keeps its label', () => {
    const p = partitionHexLabels([place('Temple Ruin', 'elder_ruin'), place('Millbrook', 'town')]);
    expect(p.centered.map(l => l.name)).toEqual(['Millbrook']);
    expect(p.ring).toEqual([]);
  });

  it('a hidden place keeps its ring slot so the other names stay under their icons', () => {
    const p = partitionHexLabels([
      place('Aether Spring', 'shrine', { hidden: true }),
      place('Old Shrine', 'shrine'),
    ]);
    expect(p.ringSlotCount).toBe(2);
    expect(p.ring.map(l => [l.name, !!l.hidden])).toEqual([
      ['Aether Spring', true],
      ['Old Shrine', false],
    ]);
  });

  it('a hidden centered place shows no name', () => {
    const p = partitionHexLabels([place('Hidden Keep', 'castle', { hidden: true }), place('Millbrook', 'town')]);
    expect(p.centered.map(l => l.name)).toEqual(['Millbrook']);
  });
});
