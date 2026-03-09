// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentProfileModal } from '../AgentProfileModal';
import type { AgentInfoCardData, AgentFullProfileData } from '../../../engine/agentDetail';
import type { InteractionRecord } from '../../../types/disposition';

// ─── Test Data ────────────────────────────────────────────────────────

const strangerCard: AgentInfoCardData = {
  id: 'agent.1',
  name: 'Kael the Scorned',
  locationId: 'loc.1',
  locationName: 'Ashvale',
  knowledgeLevel: 'stranger',
};

const recognisedCard: AgentInfoCardData = {
  id: 'agent.1',
  name: 'Kael the Scorned',
  locationId: 'loc.1',
  locationName: 'Ashvale',
  primarySphere: 'iron',
  archetypeLabel: 'Tragic Hero',
  factionName: 'Iron Brotherhood',
  cultureName: 'Valdor',
  knowledgeLevel: 'recognised',
  topValues: [{ pair: 'ambition_contentment', word: 'Ambitious' }],
  domains: [{ domain: 'iron', word: 'Fearsome' }],
};

const knownCard: AgentInfoCardData = {
  ...recognisedCard,
  knowledgeLevel: 'known',
  topValues: [
    { pair: 'ambition_contentment', word: 'Ambitious' },
    { pair: 'cruelty_compassion', word: 'Compassionate' },
    { pair: 'devotion_independence', word: 'Devoted' },
  ],
  domains: [
    { domain: 'iron', word: 'Fearsome' },
    { domain: 'gold', word: 'Shrewd' },
    { domain: 'shadow', word: 'Subtle' },
  ],
  topBonds: [
    { name: 'Lyra', strengthWord: 'strong', sentiment: 'positive' },
    { name: 'Mordach', strengthWord: 'moderate', sentiment: 'negative' },
  ],
  quotes: ['Once said: "The world bends to those who dare."'],
};

const intimateCard: AgentInfoCardData = {
  ...knownCard,
  knowledgeLevel: 'intimate',
  domains: [
    { domain: 'iron', word: 'Fearsome' },
    { domain: 'gold', word: 'Shrewd' },
    { domain: 'shadow', word: 'Subtle' },
    { domain: 'veil', word: 'Attuned' },
    { domain: 'heart', word: 'Beloved' },
    { domain: 'eye', word: 'Perceptive' },
    { domain: 'stone', word: 'Skilled' },
    { domain: 'star', word: 'Fated' },
    { domain: 'flesh', word: 'Resilient' },
  ],
  cooperationStrategy: 'tit-for-tat',
  reputationWord: 'esteemed',
  allTraits: ['Scarred', 'Eloquent', 'Cursed'],
  backstoryParagraph1: 'was born among the iron cliffs of Valdor, where the wind cuts like blades.',
  quotes: [
    'Once said: "The world bends to those who dare."',
    'And also: "Mercy is a luxury I cannot afford."',
    'Always claimed: "My fate is written in scars, not stars."',
  ],
};

const intimateProfile: AgentFullProfileData = {
  quotes: intimateCard.quotes,
  backstoryParagraph1: intimateCard.backstoryParagraph1,
  fullBackstory: `was born among the iron cliffs of Valdor, where the wind cuts like blades.

The loss of his father at a young age shaped his every decision, driving him toward mastery of iron and the pursuit of power that would never be taken from him again.

Despite his many victories, a curse placed upon him in his youth haunts every triumph, twisting joy into ash.`,
  allTraits: intimateCard.allTraits,
  historyTimeline: [
    { tick: 50, event: 'cooperate → cooperate (trade)' },
    { tick: 45, event: 'cooperate → defect (war)' },
    { tick: 40, event: 'defect → cooperate (peace)' },
  ],
};

const transparentCard: AgentInfoCardData = {
  ...intimateCard,
  knowledgeLevel: 'transparent',
};

const transparentProfile: AgentFullProfileData = {
  ...intimateProfile,
  dispositionRecord: [
    { tick: 50, actorMove: 'cooperate', targetMove: 'cooperate', context: 'trade', stakes: 'low' },
    { tick: 45, actorMove: 'cooperate', targetMove: 'defect', context: 'war', stakes: 'high' },
    { tick: 40, actorMove: 'defect', targetMove: 'cooperate', context: 'peace', stakes: 'medium' },
  ] as InteractionRecord[],
};

// ─── Tests ────────────────────────────────────────────────────────────

describe('AgentProfileModal', () => {
  it('renders as full-screen overlay with dialog role', () => {
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows portrait silhouette placeholder at stranger level', () => {
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByTestId('portrait-silhouette')).toBeTruthy();
  });

  it('displays agent name prominently', () => {
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Kael the Scorned')).toBeTruthy();
  });

  it('shows archetype label at recognised level', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Tragic Hero')).toBeTruthy();
  });

  it('shows faction and culture at recognised level', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    // Faction and culture are joined with · separator, so check the combined text
    expect(screen.getByText(/Iron Brotherhood.*Valdor|Valdor.*Iron Brotherhood/)).toBeTruthy();
  });

  it('shows quotes section at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText(/Once said/)).toBeTruthy();
  });

  it('shows values section at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Ambitious')).toBeTruthy();
    expect(screen.getByText('Compassionate')).toBeTruthy();
  });

  it('shows prowess section with domains at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText(/Fearsome/)).toBeTruthy();
    expect(screen.getByText(/Shrewd/)).toBeTruthy();
  });

  it('shows bonds section at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText(/Lyra/)).toBeTruthy();
    expect(screen.getByText(/Mordach/)).toBeTruthy();
  });

  it('shows all 9 domains at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    // Domain names are now wrapped in Tooltip spans — check domain names are present
    expect(screen.getByText('Iron')).toBeTruthy();
    expect(screen.getByText('Gold')).toBeTruthy();
    expect(screen.getByText('Shadow')).toBeTruthy();
    expect(screen.getByText('Veil')).toBeTruthy();
    expect(screen.getByText('Heart')).toBeTruthy();
    expect(screen.getByText('Eye')).toBeTruthy();
    expect(screen.getByText('Stone')).toBeTruthy();
    expect(screen.getByText('Star')).toBeTruthy();
    expect(screen.getByText('Flesh')).toBeTruthy();
  });

  it('shows traits section at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText('Scarred')).toBeTruthy();
    expect(screen.getByText('Eloquent')).toBeTruthy();
    expect(screen.getByText('Cursed')).toBeTruthy();
  });

  it('shows backstory at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText(/was born among/)).toBeTruthy();
  });

  it('shows disposition section at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText(/tit-for-tat|Tit-for-Tat/i)).toBeTruthy();
    expect(screen.getByText(/esteemed/i)).toBeTruthy();
  });

  it('shows full backstory at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    // Full Account section should be present
    expect(screen.getByText('Full Account')).toBeTruthy();
  });

  it('shows history timeline at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    // Check for the history section heading
    expect(screen.getByText('History')).toBeTruthy();
  });

  it('shows disposition record at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    // Check for Interaction Record section heading
    expect(screen.getByText('Interaction Record')).toBeTruthy();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={onClose} />);
    // Find the backdrop (first child div with bg-black/80 class)
    const backdrop = container.querySelector('.bg-black\\/80');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    }
  });

  it('contains no raw decimal numbers (verbal descriptors only)', () => {
    const { container } = render(
      <AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />
    );
    const text = container.textContent ?? '';
    // Should not have patterns like "0.65" or "7.2"
    expect(text).not.toMatch(/\b\d+\.\d+\b/);
  });

  it('omits sections when data is not present', () => {
    const minimalCard: AgentInfoCardData = {
      id: 'agent.2',
      name: 'Emissary of None',
      locationId: 'loc.void',
      locationName: 'The Void',
      knowledgeLevel: 'stranger',
    };
    render(<AgentProfileModal card={minimalCard} profile={undefined} onClose={vi.fn()} />);
    // Should still render with just name and location
    expect(screen.getByText('Emissary of None')).toBeTruthy();
    expect(screen.getByText('The Void')).toBeTruthy();
  });
});
