// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentDetailPanel } from '../AgentDetailPanel';
import type { AgentDetail } from '../../../engine/agentDetail';

const mockDetail: AgentDetail = {
  id: 'agent.1',
  name: 'Kael the Scorned',
  tier: 3 as any,
  tierName: 'Devoted',
  locationId: 'loc.1',
  locationName: 'Ashvale',
  factionName: 'Iron Brotherhood',
  archetype: {
    id: 'tragic_hero',
    name: 'Tragic Hero',
    storyShape: 'Rise, hubris, fall',
    proseTone: 'Grand, foreboding, inevitable',
    reachAffinities: ['iron', 'veil', 'heart'],
  },
  profile: {
    loyalty_ambition: 0.8, courage_prudence: 0.3, mercy_ruthlessness: -0.6,
    honesty_cunning: 0.1, sacrifice_survival: 0.5, loyalty_ambition: -0.2,
    tradition_novelty: 0.0, humility_pride: 0.4, mercy_ruthlessness: -0.3, asceticism_extravagance: 0.1,
  },
  domainCapabilities: {
    iron: 7, gold: 2, shadow: 5, veil: 3, heart: 4, eye: 1, stone: 3, star: 2, flesh: 1,
  },
  topValues: [
    { pair: 'loyalty_ambition', value: 0.8, label: 'Deeply Ambitious' },
    { pair: 'mercy_ruthlessness', value: -0.6, label: 'Compassionate' },
    { pair: 'sacrifice_survival', value: 0.5, label: 'Devoted' },
  ],
  topBonds: [
    { targetId: 'agent.2', targetName: 'Lyra', sentiment: 0.7, strength: 0.8, basis: 'friendship' },
    { targetId: 'agent.3', targetName: 'Mordach', sentiment: -0.5, strength: 0.6, basis: 'rivalry' },
  ],
  cooperationStrategy: 'tit-for-tat',
  reputationScore: 0.65,
  recentInteractions: [
    { tick: 10, actorMove: 'cooperate', targetMove: 'cooperate', context: 'trade', stakes: 'low' },
    { tick: 7, actorMove: 'cooperate', targetMove: 'defect', context: 'war', stakes: 'high' },
  ],
  portraitUrl: null,
};

describe('AgentDetailPanel', () => {
  it('renders agent name and tier', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Kael the Scorned')).toBeTruthy();
    // Tier name appears in header (check for it being displayed)
    const devotedElements = screen.getAllByText('Devoted');
    expect(devotedElements.length).toBeGreaterThan(0);
  });

  it('renders archetype banner', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Tragic Hero')).toBeTruthy();
    expect(screen.getByText('Rise, hubris, fall')).toBeTruthy();
  });

  it('renders faction name', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Iron Brotherhood')).toBeTruthy();
  });

  it('renders domain capabilities grid', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Iron')).toBeTruthy();
    expect(screen.getByText('Shadow')).toBeTruthy();
  });

  it('renders top values', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Deeply Ambitious')).toBeTruthy();
    expect(screen.getByText('Compassionate')).toBeTruthy();
  });

  it('renders bonds list', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Lyra')).toBeTruthy();
    expect(screen.getByText('Mordach')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<AgentDetailPanel detail={mockDetail} onBack={onBack} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onViewPsyche when View Psyche button clicked', () => {
    const onViewPsyche = vi.fn();
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={onViewPsyche} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    fireEvent.click(screen.getByText('View Psyche'));
    expect(onViewPsyche).toHaveBeenCalledOnce();
  });

  it('calls onIntervene when Intervene button clicked', () => {
    const onIntervene = vi.fn();
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={onIntervene} onLocationClick={vi.fn()} />);
    fireEvent.click(screen.getByText('Intervene'));
    expect(onIntervene).toHaveBeenCalledOnce();
  });

  it('calls onLocationClick when location breadcrumb clicked', () => {
    const onLocationClick = vi.fn();
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={onLocationClick} />);
    fireEvent.click(screen.getByText('Ashvale'));
    expect(onLocationClick).toHaveBeenCalledWith('loc.1');
  });

  it('handles missing archetype gracefully', () => {
    const noArchDetail = { ...mockDetail, archetype: null };
    render(<AgentDetailPanel detail={noArchDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Kael the Scorned')).toBeTruthy();
  });

  it('handles empty bonds list', () => {
    const noBondsDetail = { ...mockDetail, topBonds: [] };
    render(<AgentDetailPanel detail={noBondsDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText(/no known bonds/i)).toBeTruthy();
  });

  it('renders strategy section with strategy name and reputation', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Disposition')).toBeTruthy();
    expect(screen.getByText('Tit for Tat')).toBeTruthy();
    expect(screen.getByText('0.65')).toBeTruthy();
  });

  it('shows "No known strategy" when cooperationStrategy is null', () => {
    const noStrategyDetail = { ...mockDetail, cooperationStrategy: null as any };
    render(<AgentDetailPanel detail={noStrategyDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText(/no known strategy/i)).toBeTruthy();
  });

  it('renders recent interaction history icons', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    // Should show tick numbers for the 2 interactions
    expect(screen.getByText('t10')).toBeTruthy();
    expect(screen.getByText('t7')).toBeTruthy();
  });

  it('renders possessions section when possessions exist', () => {
    const withPossessions = {
      ...mockDetail,
      possessions: [
        { id: 'item.1', name: "Ashenmane's Fang", subcategory: 'arms', tier: 2 as const, mechanicalSummary: '+Iron' },
      ],
    };
    render(<AgentDetailPanel detail={withPossessions} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Possessions')).toBeTruthy();
    expect(screen.getByText("Ashenmane's Fang")).toBeTruthy();
  });

  it('renders conditions section when conditions exist', () => {
    const withConditions = {
      ...mockDetail,
      conditions: [
        { id: 'cond.1', name: 'Bruised Ribs', subcategory: 'wound', tier: 1 as const, mechanicalSummary: '-Iron (minor)', ticksRemaining: 8, totalTicks: 20 },
      ],
    };
    render(<AgentDetailPanel detail={withConditions} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Conditions')).toBeTruthy();
    expect(screen.getByText('Bruised Ribs')).toBeTruthy();
  });

  it('renders powers & agreements section', () => {
    const withPowers = {
      ...mockDetail,
      powersAndAgreements: [
        { id: 'power.1', name: 'Turn Undead', subcategory: 'bestowed_power', tier: 2 as const, mechanicalSummary: '+Star' },
      ],
    };
    render(<AgentDetailPanel detail={withPowers} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText('Powers & Agreements')).toBeTruthy();
    expect(screen.getByText('Turn Undead')).toBeTruthy();
  });

  it('shows overflow text when more than 5 possessions', () => {
    const manyPossessions = {
      ...mockDetail,
      possessions: Array.from({ length: 7 }, (_, i) => ({
        id: `item.${i}`, name: `Item ${i}`, subcategory: 'arms', tier: 1 as const, mechanicalSummary: 'test',
      })),
    };
    render(<AgentDetailPanel detail={manyPossessions} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.getByText(/and 2 more/)).toBeTruthy();
  });

  it('calls onAttachmentClick when attachment row clicked', () => {
    const onAttachmentClick = vi.fn();
    const withPossessions = {
      ...mockDetail,
      possessions: [
        { id: 'item.1', name: "Ashenmane's Fang", subcategory: 'arms', tier: 2 as const, mechanicalSummary: '+Iron' },
      ],
    };
    render(<AgentDetailPanel detail={withPossessions} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} onAttachmentClick={onAttachmentClick} />);
    fireEvent.click(screen.getByText("Ashenmane's Fang"));
    expect(onAttachmentClick).toHaveBeenCalledWith('item.1');
  });

  it('does not render attachment sections when no attachments', () => {
    render(<AgentDetailPanel detail={mockDetail} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    expect(screen.queryByText('Possessions')).toBeNull();
    expect(screen.queryByText('Conditions')).toBeNull();
    expect(screen.queryByText('Powers & Agreements')).toBeNull();
  });

  // ─── Portrait Tests ─────────────────────────────────────────────────

  it('renders portrait thumbnail in header when portraitUrl present', () => {
    const detailWithPortrait = { ...mockDetail, portraitUrl: '/portraits/tragic-hero.png' };
    const { container } = render(<AgentDetailPanel detail={detailWithPortrait} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    const img = container.querySelector('img[src="/portraits/tragic-hero.png"]');
    expect(img).toBeTruthy();
  });

  it('does not render portrait thumbnail when portraitUrl is null', () => {
    const detailNoPortrait = { ...mockDetail, portraitUrl: null };
    const { container } = render(<AgentDetailPanel detail={detailNoPortrait} onBack={vi.fn()} onViewPsyche={vi.fn()} onIntervene={vi.fn()} onLocationClick={vi.fn()} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(0);
  });
});
