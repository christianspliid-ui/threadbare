// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentIntelligencePanel } from '../AgentIntelligencePanel';
import type { IntelligenceDisplayEntry } from '../../../engine/intelligence';

// ─── Fixtures ─────────────────────────────────────────────────────

function makeEntry(overrides: Partial<IntelligenceDisplayEntry> = {}): IntelligenceDisplayEntry {
  return {
    recordId: 'rec-1',
    category: 'shrine_location',
    categoryLabel: 'Shrine Location',
    label: 'A hidden shrine',
    detail: 'A shrine concealed in the eastern woods.',
    targetDisplayName: null,
    targetKind: 'unknown',
    reliabilityDescriptor: 'reliable',
    reliabilityRank: 0,
    acquiredTick: 10,
    acquiredDaysAgo: 3,
    acquiredLabel: '3 days ago',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('AgentIntelligencePanel', () => {
  it('renders nothing when isStranger is true', () => {
    const { container } = render(
      <AgentIntelligencePanel entries={[makeEntry()]} isStranger={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders empty-state copy when bonded and no entries', () => {
    render(<AgentIntelligencePanel entries={[]} isStranger={false} />);
    expect(screen.getByText('Knows nothing of consequence.')).toBeTruthy();
  });

  it('renders section header', () => {
    render(<AgentIntelligencePanel entries={[makeEntry()]} isStranger={false} />);
    expect(screen.getByText('Intelligence')).toBeTruthy();
  });

  it('renders one row per entry', () => {
    const entries = [
      makeEntry({ recordId: 'r1', label: 'First record' }),
      makeEntry({ recordId: 'r2', label: 'Second record' }),
      makeEntry({ recordId: 'r3', label: 'Third record' }),
    ];
    render(<AgentIntelligencePanel entries={entries} isStranger={false} />);
    expect(screen.getByText('First record')).toBeTruthy();
    expect(screen.getByText('Second record')).toBeTruthy();
    expect(screen.getByText('Third record')).toBeTruthy();
  });

  it('shows the reliability descriptor chip for each entry', () => {
    render(
      <AgentIntelligencePanel
        entries={[makeEntry({ reliabilityDescriptor: 'uncertain' })]}
        isStranger={false}
      />,
    );
    expect(screen.getByText('uncertain')).toBeTruthy();
  });

  it('truncates at maxRecords and shows overflow footer', () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeEntry({ recordId: `r-${i}`, label: `Record ${i}` }),
    );
    render(<AgentIntelligencePanel entries={entries} isStranger={false} maxRecords={24} />);
    // Only first 24 labels rendered
    expect(screen.getByText('Record 0')).toBeTruthy();
    expect(screen.queryByText('Record 24')).toBeNull();
    expect(screen.getByText('+6 more intelligence records')).toBeTruthy();
  });

  it('does not show overflow footer when entries fit within maxRecords', () => {
    const entries = [makeEntry()];
    render(<AgentIntelligencePanel entries={entries} isStranger={false} maxRecords={24} />);
    expect(screen.queryByText(/more intelligence/)).toBeNull();
  });

  it('omits "about:" line when targetDisplayName is null', () => {
    render(
      <AgentIntelligencePanel
        entries={[makeEntry({ targetDisplayName: null })]}
        isStranger={false}
      />,
    );
    expect(screen.queryByText(/about:/)).toBeNull();
  });

  it('shows target line when targetDisplayName is set', () => {
    render(
      <AgentIntelligencePanel
        entries={[makeEntry({ targetDisplayName: 'Thornwall', targetKind: 'location' })]}
        isStranger={false}
      />,
    );
    expect(screen.getByText('about: Thornwall (location)')).toBeTruthy();
  });
});
