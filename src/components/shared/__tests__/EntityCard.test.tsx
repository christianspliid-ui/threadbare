// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityCard } from '../EntityCard';
import type { EntityHeader, EntitySection } from '../../../types/entityDetail';

const mockHeader: EntityHeader = {
  name: 'Test Entity',
  accentColor: '#d4a040',
  subtitle: 'A test subtitle',
  iconSvg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="gold"/></svg>',
};

const mockSections: EntitySection[] = [
  {
    id: 'origins',
    title: 'Origins',
    insightTier: 'stranger',
    proseVoice: 'chronicle',
    prose: 'Long ago, in the time before reckoning...',
  },
  {
    id: 'ways',
    title: 'Ways & Materials',
    insightTier: 'known',
    proseVoice: 'chronicle',
    prose: 'They craft with bone and stone.',
    structuredData: { type: 'keyword_cloud', keywords: ['bone', 'stone', 'iron'], accent: '#d4a040' },
  },
];

describe('EntityCard', () => {
  it('renders header with name', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Test Entity')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('A test subtitle')).toBeTruthy();
  });

  it('renders flag/icon SVG when provided', () => {
    const { container } = render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(container.querySelector('.entity-icon')).toBeTruthy();
  });

  it('renders prose sections', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Long ago, in the time before reckoning...')).toBeTruthy();
  });

  it('renders keyword_cloud structured data', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('bone')).toBeTruthy();
    expect(screen.getByText('stone')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    let called = false;
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => { called = true; }} onViewCodex={() => {}} />
    );
    fireEvent.click(screen.getByLabelText('back'));
    expect(called).toBe(true);
  });

  it('calls onViewCodex when view button clicked', () => {
    let called = false;
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => { called = true; }} />
    );
    fireEvent.click(screen.getByText('View Full Codex'));
    expect(called).toBe(true);
  });

  it('renders member_list structured data', () => {
    const sections: EntitySection[] = [{
      id: 'members',
      title: 'Figures of Note',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Notable members include:',
      structuredData: {
        type: 'member_list',
        members: [{ id: 'm1', name: 'Kael the Inscriber', role: 'elder', tier: 3 }],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Kael the Inscriber')).toBeTruthy();
  });

  it('renders title for each section', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Origins')).toBeTruthy();
    expect(screen.getByText('Ways & Materials')).toBeTruthy();
  });

  it('applies italic styling to oral voice prose', () => {
    const oralSection: EntitySection[] = [{
      id: 'spoken',
      title: 'Spoken Word',
      insightTier: 'known',
      proseVoice: 'oral',
      prose: 'They say the old tales...',
    }];
    const { container } = render(
      <EntityCard header={mockHeader} sections={oralSection} onBack={() => {}} onViewCodex={() => {}} />
    );
    const proseElement = Array.from(container.querySelectorAll('p')).find(p => p.textContent === 'They say the old tales...');
    expect(proseElement).toBeTruthy();
    expect(proseElement?.className).toContain('italic');
  });

  it('renders territory_summary structured data', () => {
    const sections: EntitySection[] = [{
      id: 'lands',
      title: 'Lands',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Our territories include:',
      structuredData: {
        type: 'territory_summary',
        locations: [
          { id: 'loc1', name: 'The Great Tower', biome: 'mountain' },
          { id: 'loc2', name: 'The Silent Forest', biome: 'forest' },
        ],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('The Great Tower')).toBeTruthy();
    expect(screen.getByText('The Silent Forest')).toBeTruthy();
  });

  it('renders trait_grid structured data', () => {
    const sections: EntitySection[] = [{
      id: 'traits',
      title: 'Traits',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Known characteristics:',
      structuredData: {
        type: 'trait_grid',
        traits: [
          { name: 'Resilient', category: 'virtue' },
          { name: 'Stubborn', category: 'flaw' },
        ],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Resilient')).toBeTruthy();
    expect(screen.getByText('Stubborn')).toBeTruthy();
  });

  it('renders bond_list structured data', () => {
    const sections: EntitySection[] = [{
      id: 'bonds',
      title: 'Relationships',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Key relationships:',
      structuredData: {
        type: 'bond_list',
        bonds: [{ name: 'The Warden', sentiment: 'positive', strength: 'strong' }],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('The Warden')).toBeTruthy();
  });

  it('renders domain_grid structured data', () => {
    const sections: EntitySection[] = [{
      id: 'domains',
      title: 'Domains',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Areas of influence:',
      structuredData: {
        type: 'domain_grid',
        domains: [{ domain: 'iron', word: 'Warrior' }],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Warrior')).toBeTruthy();
  });

  it('renders timeline structured data', () => {
    const sections: EntitySection[] = [{
      id: 'timeline',
      title: 'Timeline',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Key events:',
      structuredData: {
        type: 'timeline',
        events: [{ tick: 100, label: 'Founded' }],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Founded')).toBeTruthy();
  });
});
