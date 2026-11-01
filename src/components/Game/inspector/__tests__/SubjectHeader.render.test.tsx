// @vitest-environment jsdom
/**
 * THR-1990 — the avatar's Inspector page keeps the retired sheet's framing (THR-1609):
 * "{name} — your mortal shape" with the god's title line under it. An ordinary
 * mortal's page shows neither.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { SubjectHeaderVM } from '../../../../engine/views/subjects/subjectTypes';
import { SubjectHeader } from '../SubjectHeader';

function person(name: string, mortalShape: SubjectHeaderVM['mortalShape']): SubjectHeaderVM {
  return {
    ref: { kind: 'agent', id: name.toLowerCase() },
    name,
    kindLabel: 'Smith',
    epithet: null,
    mortalShape,
    whereLine: [],
    visual: { kind: 'agent', id: name.toLowerCase(), portraitGate: 'shown' },
    standing: [],
    doingLine: null,
    lede: null,
    mapLocated: false,
    hexKey: null,
    opensWide: false,
    follow: true,
  };
}

describe('SubjectHeader — the avatar as the player\'s mortal shape (THR-1990)', () => {
  it('the avatar\'s page reads "{name} — your mortal shape" and the god\'s title line', () => {
    const { container } = render(<SubjectHeader header={person('Kael', { godTitleLine: 'You are Vara, the Witness' })} compact={false} />);
    expect(container.querySelector('[data-inspector-heading]')?.textContent).toBe('Kael — your mortal shape');
    expect(container.querySelector('[data-inspector-god-title]')?.textContent).toBe('You are Vara, the Witness');
  });

  it('THR-2098: a town with its terrain leads with its landscape; without one, the glyph tile', () => {
    const town = (terrain?: 'grassland'): SubjectHeaderVM => ({
      ...person('Ashford', null),
      ref: { kind: 'location', id: 'town' },
      kindLabel: 'Town',
      visual: { kind: 'location', id: 'town', portraitGate: 'shown', ...(terrain ? { terrain } : {}) },
    });
    const wide = render(<SubjectHeader header={town('grassland')} compact={false} />).container;
    expect(wide.querySelector('[data-header-lead]')?.getAttribute('data-header-lead')).toBe('hero');
    expect(wide.querySelector('[data-entity-visual-tier]')?.getAttribute('data-entity-visual-tier')).toBe('art');
    const bare = render(<SubjectHeader header={town()} compact={false} />).container;
    expect(bare.querySelector('[data-entity-visual-tier]')?.getAttribute('data-entity-visual-tier')).not.toBe('art');
    // Docked keeps the thumbnail beside the name.
    const docked = render(<SubjectHeader header={town('grassland')} compact />).container;
    expect(docked.querySelector('[data-header-lead]')).toBeNull();
  });

  it('an ordinary mortal\'s page shows neither', () => {
    const { container } = render(<SubjectHeader header={person('Bren', null)} compact={false} />);
    expect(container.querySelector('[data-inspector-heading]')?.textContent).toBe('Bren');
    expect(container.querySelector('[data-inspector-mortal-shape]')).toBeNull();
    expect(container.querySelector('[data-inspector-god-title]')).toBeNull();
    expect(container.textContent).not.toContain('mortal shape');
  });
});
