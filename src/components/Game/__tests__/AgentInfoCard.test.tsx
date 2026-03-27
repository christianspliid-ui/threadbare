// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentInfoCard } from '../AgentInfoCard';
import type { AgentInfoCardData } from '../../../engine/agentDetail';

// ─── Mock data for different knowledge levels ───

const strangerCard: AgentInfoCardData = {
  id: 'agent.1',
  name: 'Kael',
  locationId: 'loc.1',
  locationName: 'Ashvale',
  primarySphere: 'shadow',
  knowledgeLevel: 'stranger',
};

const recognisedCard: AgentInfoCardData = {
  id: 'agent.2',
  name: 'Lyra',
  locationId: 'loc.2',
  locationName: 'Ironhearth',
  primarySphere: 'heart',
  archetypeLabel: 'Sage',
  factionName: 'The Circle',
  topValues: [
    { pair: 'honesty_cunning', word: 'Cunning' },
  ],
  domains: [
    { domain: 'eye', word: 'Perceptive' },
  ],
  knowledgeLevel: 'recognised',
};

const knownCard: AgentInfoCardData = {
  id: 'agent.3',
  name: 'Mordach',
  locationId: 'loc.3',
  locationName: 'The Warrens',
  primarySphere: 'iron',
  archetypeLabel: 'Warlord',
  factionName: 'Iron Brotherhood',
  cultureName: 'The Forgeborn',
  topValues: [
    { pair: 'loyalty_ambition', word: 'Deeply Ambitious' },
    { pair: 'courage_prudence', word: 'Courageous' },
    { pair: 'mercy_ruthlessness', word: 'Cruel' },
  ],
  domains: [
    { domain: 'iron', word: 'Fearsome' },
    { domain: 'gold', word: 'Shrewd' },
    { domain: 'shadow', word: 'Cunning' },
  ],
  topBonds: [
    { name: 'Kira', strengthWord: 'Strong', sentiment: 'positive' },
    { name: 'Theron', strengthWord: 'Moderate', sentiment: 'negative' },
  ],
  quotes: ['I did not ask for this crown, but I shall not relinquish it.'],
  knowledgeLevel: 'known',
};

const intimateCard: AgentInfoCardData = {
  id: 'agent.4',
  name: 'Sera',
  locationId: 'loc.4',
  locationName: 'The Sanctum',
  primarySphere: 'veil',
  archetypeLabel: 'Oracle',
  factionName: 'The Seekers',
  cultureName: 'The Starborn',
  topValues: [
    { pair: 'loyalty_ambition', word: 'Deeply Ambitious' },
    { pair: 'courage_prudence', word: 'Prudent' },
    { pair: 'mercy_ruthlessness', word: 'Compassionate' },
  ],
  domains: [
    { domain: 'veil', word: 'Mystical' },
    { domain: 'eye', word: 'Perceptive' },
    { domain: 'heart', word: 'Empathetic' },
    { domain: 'iron', word: 'Resolute' },
    { domain: 'gold', word: 'Shrewd' },
    { domain: 'shadow', word: 'Subtle' },
    { domain: 'stone', word: 'Grounded' },
    { domain: 'star', word: 'Visionary' },
    { domain: 'flesh', word: 'Vigorous' },
  ],
  topBonds: [
    { name: 'Kael', strengthWord: 'Profound', sentiment: 'positive' },
    { name: 'Lyra', strengthWord: 'Strong', sentiment: 'positive' },
    { name: 'Mordach', strengthWord: 'Moderate', sentiment: 'negative' },
  ],
  quotes: [
    'The threads are clear, but the weaver\'s hand trembles.',
    'Some fates cannot be changed, only endured.',
  ],
  cooperationStrategy: 'tit-for-tat',
  reputationWord: 'Respected',
  allTraits: ['Visionary', 'Mysterious', 'Wounded'],
  backstoryParagraph1: 'Sera was born under a falling star, marked by the veil itself...',
  knowledgeLevel: 'intimate',
};

describe('AgentInfoCard', () => {
  // ─── Basic rendering ───

  it('renders agent name at all knowledge levels', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Kael')).toBeInTheDocument();
  });

  it('renders location name', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('In The Warrens')).toBeInTheDocument();
  });

  // ─── Stranger level (minimal info) ───

  it('hides domains at stranger level', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Fearsome')).not.toBeInTheDocument();
  });

  it('hides archetype at stranger level', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Sage')).not.toBeInTheDocument();
  });

  it('hides faction at stranger level', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('The Circle')).not.toBeInTheDocument();
  });

  // ─── Recognised level ───

  it('shows archetype label at recognised level', () => {
    render(<AgentInfoCard card={recognisedCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Sage')).toBeInTheDocument();
  });

  it('shows faction at recognised level', () => {
    render(<AgentInfoCard card={recognisedCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('The Circle')).toBeInTheDocument();
  });

  it('shows one domain at recognised level', () => {
    render(<AgentInfoCard card={recognisedCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Domain name wrapped in Tooltip span
    expect(screen.getByText('Eye')).toBeInTheDocument();
  });

  it('shows one value at recognised level', () => {
    render(<AgentInfoCard card={recognisedCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Cunning')).toBeInTheDocument();
  });

  // ─── Known level ───

  it('shows domain words in "word in domain" format at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Domain names wrapped in Tooltip spans — check domain names are present
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Shadow')).toBeInTheDocument();
  });

  it('shows all top values at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Deeply Ambitious')).toBeInTheDocument();
    expect(screen.getByText('Courageous')).toBeInTheDocument();
    expect(screen.getByText('Cruel')).toBeInTheDocument();
  });

  it('shows bonds with strength word at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Bonds use "— " separator format
    expect(screen.getByText(/Kira/)).toBeInTheDocument();
    expect(screen.getByText(/Strong/)).toBeInTheDocument();
  });

  it('shows one quote at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/I did not ask for this crown/)).toBeInTheDocument();
  });

  it('shows culture name at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('The Forgeborn')).toBeInTheDocument();
  });

  // ─── Intimate level ───

  it('shows all 9 domains at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Domain names are now wrapped in Tooltip spans, so test for domain name separately
    expect(screen.getByText('Veil')).toBeInTheDocument();
    expect(screen.getByText('Flesh')).toBeInTheDocument();
  });

  it('shows cooperation strategy at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('tit-for-tat')).toBeInTheDocument();
  });

  it('shows reputation word at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Respected')).toBeInTheDocument();
  });

  it('shows all traits at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Visionary')).toBeInTheDocument();
    expect(screen.getByText('Mysterious')).toBeInTheDocument();
    expect(screen.getByText('Wounded')).toBeInTheDocument();
  });

  it('shows backstory paragraph at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/Sera was born under a falling star/)).toBeInTheDocument();
  });

  it('shows all bonds at intimate level', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Bonds section should show all three bond names
    expect(screen.getByText(/Kael/)).toBeInTheDocument();
    expect(screen.getByText(/Lyra/)).toBeInTheDocument();
    expect(screen.getByText(/Mordach/)).toBeInTheDocument();
  });

  // ─── Control buttons ───

  it('shows View Profile button', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /view full character sheet/i })).toBeInTheDocument();
  });

  it('calls onViewProfile when View Profile button clicked', () => {
    const onViewProfile = vi.fn();
    render(<AgentInfoCard card={knownCard} onViewProfile={onViewProfile} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /view full character sheet/i }));
    expect(onViewProfile).toHaveBeenCalledOnce();
  });

  it('shows back button', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /close|✕/ })).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={onBack} />);
    const backButton = screen.getByRole('button', { name: /close|✕/ });
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledOnce();
  });

  // ─── Knowledge level indicator ───

  it('shows knowledge level indicator', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Known')).toBeInTheDocument();
  });

  it('shows correct knowledge level label for different levels', () => {
    const { rerender } = render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Stranger')).toBeInTheDocument();

    rerender(<AgentInfoCard card={recognisedCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Recognised')).toBeInTheDocument();

    rerender(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Known')).toBeInTheDocument();

    rerender(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Intimate')).toBeInTheDocument();
  });

  // ─── Edge cases ───

  it('handles missing optional fields gracefully', () => {
    const minimalCard: AgentInfoCardData = {
      id: 'agent.5',
      name: 'Ghost',
      locationId: 'loc.5',
      locationName: 'Unknown',
      knowledgeLevel: 'stranger',
    };
    render(<AgentInfoCard card={minimalCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });

  it('displays sentiment color indicators for bonds when present', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Should render both bonds with sentiment formatting
    expect(screen.getByText(/Kira/)).toBeInTheDocument();
    expect(screen.getByText(/Theron/)).toBeInTheDocument();
  });

  it('shows multiple values formatted correctly', () => {
    render(<AgentInfoCard card={intimateCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    // Intimate shows all 3 top values
    expect(screen.getByText('Deeply Ambitious')).toBeInTheDocument();
    expect(screen.getByText('Prudent')).toBeInTheDocument();
    expect(screen.getByText('Compassionate')).toBeInTheDocument();
  });
});
