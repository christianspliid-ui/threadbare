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
    ambition_contentment: 0.8, courage_prudence: 0.3, cruelty_compassion: -0.6,
    cunning_honesty: 0.1, devotion_independence: 0.5, loyalty_treachery: -0.2,
    tradition_innovation: 0.0, dominance_humility: 0.4, wrath_patience: -0.3, greed_generosity: 0.1,
  },
  domainCapabilities: {
    iron: 7, gold: 2, shadow: 5, veil: 3, heart: 4, eye: 1, stone: 3, star: 2, flesh: 1,
  },
  topValues: [
    { pair: 'ambition_contentment', value: 0.8, label: 'Deeply Ambitious' },
    { pair: 'cruelty_compassion', value: -0.6, label: 'Compassionate' },
    { pair: 'devotion_independence', value: 0.5, label: 'Devoted' },
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
});
