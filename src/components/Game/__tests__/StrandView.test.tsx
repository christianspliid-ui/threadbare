// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrandView } from '../StrandView';
import type {
  PresenceStrandData,
  DesiresStrandData,
  BondsStrandData,
  AmbitionsStrandData,
  BeliefsStrandData,
  FearsStrandData,
} from '../../../engine/strands';

describe('StrandView', () => {
  const mockPresenceStrand: PresenceStrandData = {
    strandName: 'Presence',
    locationName: 'The Grand Hall',
    locationId: 'loc-1',
    topDomains: [
      { domain: 'Iron', score: 0.9 },
      { domain: 'Gold', score: 0.7 },
      { domain: 'Heart', score: 0.5 },
    ],
    companions: [
      { id: 'agent-2', name: 'Lady Astrid' },
      { id: 'agent-3', name: 'Lord Theron' },
    ],
  };

  const mockDesiresStrand: DesiresStrandData = {
    strandName: 'Desires',
    insights: [
      {
        valuePair: 'greed_generosity',
        value: 0.6,
        label: 'Greedy',
        description: 'Notably greedy',
      },
      {
        valuePair: 'cruelty_compassion',
        value: -0.4,
        label: 'Compassionate',
        description: 'Notably compassionate',
      },
    ],
  };

  const mockBondsStrand: BondsStrandData = {
    strandName: 'Bonds',
    relationships: [
      {
        targetId: 'agent-2',
        targetName: 'Lady Astrid',
        sentiment: 0.8,
        strength: 0.9,
        basis: 'friendship',
      },
    ],
    factions: [
      {
        id: 'faction-1',
        name: 'The Iron Guard',
        role: 'Commander',
      },
    ],
    insights: [
      {
        valuePair: 'loyalty_treachery',
        value: 0.7,
        label: 'Loyal',
        description: 'Deeply loyal',
      },
    ],
  };

  const mockAmbitionsStrand: AmbitionsStrandData = {
    strandName: 'Ambitions',
    insights: [
      {
        valuePair: 'ambition_contentment',
        value: 0.8,
        label: 'Ambitious',
        description: 'Deeply ambitious',
      },
    ],
  };

  const mockBeliefsStrand: BeliefsStrandData = {
    strandName: 'Beliefs',
    insights: [
      {
        valuePair: 'tradition_innovation',
        value: -0.5,
        label: 'Innovative',
        description: 'Notably innovative',
      },
    ],
  };

  const mockFearsStrand: FearsStrandData = {
    strandName: 'Fears',
    insights: [
      {
        valuePair: 'ambition_contentment',
        value: 0.8,
        label: 'Fear',
        description: 'Fears irrelevance and failure',
      },
    ],
  };

  const mockStrands = {
    presence: mockPresenceStrand,
    desires: mockDesiresStrand,
    bonds: mockBondsStrand,
    ambitions: mockAmbitionsStrand,
    beliefs: mockBeliefsStrand,
    fears: mockFearsStrand,
  };

  it('renders agent name in header', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );
    expect(screen.getByText('Lord Kael')).toBeInTheDocument();
  });

  it('shows all 6 strand tab labels', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );
    expect(screen.getByText('Presence')).toBeInTheDocument();
    expect(screen.getByText('Desires')).toBeInTheDocument();
    expect(screen.getByText('Bonds')).toBeInTheDocument();
    expect(screen.getByText('Ambitions')).toBeInTheDocument();
    expect(screen.getByText('Beliefs')).toBeInTheDocument();
    expect(screen.getByText('Fears')).toBeInTheDocument();
  });

  it('defaults to Presence strand', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );
    // Presence shows location name
    expect(screen.getByText('The Grand Hall')).toBeInTheDocument();
  });

  it('switches strands when tab clicked', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    // Initially on Presence, so location is visible
    expect(screen.getByText('The Grand Hall')).toBeInTheDocument();

    // Click on Bonds tab
    const bondsTab = screen.getByRole('button', { name: /Bonds/ });
    fireEvent.click(bondsTab);

    // Should now show bonds content (relationship name)
    expect(screen.getByText('Lady Astrid')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close Psyche Strands' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows presence location name on Presence tab', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    expect(screen.getByText('The Grand Hall')).toBeInTheDocument();
  });

  it('shows domain capabilities on Presence tab', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Iron/)).toBeInTheDocument();
    expect(screen.getByText(/Gold/)).toBeInTheDocument();
    expect(screen.getByText(/Heart/)).toBeInTheDocument();
  });

  it('shows companions on Presence tab', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Lady Astrid')).toBeInTheDocument();
    expect(screen.getByText('Lord Theron')).toBeInTheDocument();
  });

  it('shows fear descriptions in Fears tab', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    const fearsTab = screen.getByRole('button', { name: /Fears/ });
    fireEvent.click(fearsTab);

    expect(
      screen.getByText('Fears irrelevance and failure')
    ).toBeInTheDocument();
  });

  it('closes overlay when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    const backdrop = container.querySelector('[data-testid="backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('shows insights on Desires tab', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    const desiresTab = screen.getByRole('button', { name: /Desires/ });
    fireEvent.click(desiresTab);

    expect(screen.getByText('Greedy')).toBeInTheDocument();
    expect(screen.getByText('Compassionate')).toBeInTheDocument();
  });

  it('shows relationships and factions on Bonds tab', () => {
    const onClose = vi.fn();
    const { container } = render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    const bondsTab = screen.getByRole('button', { name: /Bonds/ });
    fireEvent.click(bondsTab);

    expect(screen.getByText('The Iron Guard')).toBeInTheDocument();
    // Commander appears in a separate span, so check the parent container
    expect(container.textContent).toContain('Commander');
  });

  it('shows subtitle text', () => {
    const onClose = vi.fn();
    render(
      <StrandView
        agentName="Lord Kael"
        strands={mockStrands}
        onClose={onClose}
      />
    );

    expect(
      screen.getByText('You peer into their soul and see...')
    ).toBeInTheDocument();
  });

  it('shows empty state for insights when none present', () => {
    const onClose = vi.fn();

    const emptyStrand: AmbitionsStrandData = {
      strandName: 'Ambitions',
      insights: [],
    };

    const straits = {
      ...mockStrands,
      ambitions: emptyStrand,
    };

    render(
      <StrandView
        agentName="Lord Kael"
        strands={straits}
        onClose={onClose}
      />
    );

    const ambitionsTab = screen.getByRole('button', { name: /Ambitions/ });
    fireEvent.click(ambitionsTab);

    expect(
      screen.getByText('No strong tendencies observed.')
    ).toBeInTheDocument();
  });
});
