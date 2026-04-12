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
  factionRank: 'Initiate',
  cultureName: 'Valdor',
  knowledgeLevel: 'recognised',
  topValues: [{ pair: 'loyalty_ambition', word: 'Ambitious' }],
  domains: [{ domain: 'iron', word: 'Fearsome', tier: 3 }],
};

const knownCard: AgentInfoCardData = {
  ...recognisedCard,
  knowledgeLevel: 'known',
  topValues: [
    { pair: 'loyalty_ambition', word: 'Ambitious' },
    { pair: 'mercy_ruthlessness', word: 'Compassionate' },
    { pair: 'sacrifice_survival', word: 'Devoted' },
  ],
  domains: [
    { domain: 'iron', word: 'Fearsome', tier: 3 },
    { domain: 'gold', word: 'Shrewd', tier: 2 },
    { domain: 'shadow', word: 'Subtle', tier: 2 },
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
    { domain: 'iron', word: 'Fearsome', tier: 3 },
    { domain: 'gold', word: 'Shrewd', tier: 2 },
    { domain: 'shadow', word: 'Subtle', tier: 2 },
    { domain: 'veil', word: 'Attuned', tier: 2 },
    { domain: 'heart', word: 'Beloved', tier: 3 },
    { domain: 'eye', word: 'Perceptive', tier: 1 },
    { domain: 'stone', word: 'Skilled', tier: 1 },
    { domain: 'star', word: 'Fated', tier: 1 },
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

// ─── Helper: click a tab ──────────────────────────────────────────────

function clickTab(tabLabel: string) {
  fireEvent.click(screen.getByText(tabLabel));
}

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

  // ─── Tab navigation ────────────────────────────────────────────────

  it('renders 6 tab buttons', () => {
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Prowess')).toBeTruthy();
    expect(screen.getByText('Attachments')).toBeTruthy();
    expect(screen.getByText('Bonds')).toBeTruthy();
    expect(screen.getByText('Journey')).toBeTruthy();
    expect(screen.getByText('Chronicle')).toBeTruthy();
  });

  it('defaults to Overview tab showing identity section', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Identity')).toBeTruthy();
  });

  it('shows archetype label in Overview tab at recognised level', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Tragic Hero')).toBeTruthy();
  });

  it('shows faction and culture in Overview tab at recognised level', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText(/Iron Brotherhood.*Valdor|Valdor.*Iron Brotherhood/)).toBeTruthy();
  });

  it('shows quotes section in Overview tab at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText(/Once said/)).toBeTruthy();
  });

  it('shows values section in Overview tab at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    expect(screen.getByText('Ambitious')).toBeTruthy();
    expect(screen.getByText('Compassionate')).toBeTruthy();
  });

  it('shows backstory in Overview tab at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText(/was born among/)).toBeTruthy();
  });

  it('shows traits in Overview tab at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText('Scarred')).toBeTruthy();
    expect(screen.getByText('Eloquent')).toBeTruthy();
    expect(screen.getByText('Cursed')).toBeTruthy();
  });

  it('clicking Prowess tab shows domain grid', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Prowess');
    expect(screen.getByText('Iron')).toBeTruthy();
    expect(screen.getByText('Gold')).toBeTruthy();
    expect(screen.getByText('Shadow')).toBeTruthy();
    expect(screen.getByText('Veil')).toBeTruthy();
    expect(screen.getByText('Heart')).toBeTruthy();
    expect(screen.getByText('Eye')).toBeTruthy();
    expect(screen.getByText('Stone')).toBeTruthy();
    expect(screen.getByText('Star')).toBeTruthy();
  });

  it('clicking Prowess tab shows prowess section with domain descriptors at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    clickTab('Prowess');
    expect(screen.getByText(/Fearsome/)).toBeTruthy();
    expect(screen.getByText(/Shrewd/)).toBeTruthy();
  });

  it('clicking Bonds tab shows faction section', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    clickTab('Bonds');
    expect(screen.getByTestId('modal-faction')).toBeTruthy();
  });

  it('clicking Bonds tab shows bonds section at known level', () => {
    render(<AgentProfileModal card={knownCard} profile={undefined} onClose={vi.fn()} />);
    clickTab('Bonds');
    expect(screen.getByText(/Lyra/)).toBeTruthy();
    expect(screen.getByText(/Mordach/)).toBeTruthy();
  });

  it('clicking Bonds tab shows disposition section at intimate level', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Bonds');
    expect(screen.getByText(/Repays in kind/i)).toBeTruthy();
    expect(screen.getByText(/esteemed/i)).toBeTruthy();
  });

  it('clicking Chronicle tab shows full backstory at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    clickTab('Chronicle');
    expect(screen.getByText('Full Account')).toBeTruthy();
  });

  it('clicking Chronicle tab shows history timeline at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    clickTab('Chronicle');
    expect(screen.getByText('Timeline')).toBeTruthy();
  });

  it('clicking Chronicle tab shows disposition record at transparent level', () => {
    render(<AgentProfileModal card={transparentCard} profile={transparentProfile} onClose={vi.fn()} />);
    clickTab('Chronicle');
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
    expect(screen.getByText('Emissary of None')).toBeTruthy();
    // Location name may appear in both header and identity tab
    expect(screen.getAllByText('The Void').length).toBeGreaterThan(0);
  });

  it('renders possessions section in Attachments tab at intimate level', () => {
    const cardWithPossessions: AgentInfoCardData = {
      ...intimateCard,
      possessions: [{
        id: 'item.1',
        name: "Ashenmane's Fang",
        subcategory: 'arms',
        tier: 2,
        mechanicalSummary: '+Iron in open terrain',
        flavorText: 'Won in a border raid.',
        tags: ['weapon', 'iron'],
        lossCondition: 'breakable',
      }],
    };
    render(<AgentProfileModal card={cardWithPossessions} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Attachments');
    expect(screen.getByText(/Ashenmane's Fang/)).toBeTruthy();
    expect(screen.getByText('Won in a border raid.')).toBeTruthy();
  });

  it('renders afflictions section in Prowess tab at recognised level', () => {
    const cardWithAfflictions: AgentInfoCardData = {
      ...recognisedCard,
      afflictions: [{
        id: 'cond.1',
        name: 'Bruised Ribs',
        subcategory: 'wound',
        tier: 1,
        mechanicalSummary: '-Iron (minor)',
        tags: ['wound'],
        ticksRemaining: 8,
        totalTicks: 20,
      }],
    };
    render(<AgentProfileModal card={cardWithAfflictions} profile={undefined} onClose={vi.fn()} />);
    clickTab('Prowess');
    expect(screen.getByTestId('modal-afflictions')).toBeTruthy();
    expect(screen.getByText(/Bruised Ribs/)).toBeTruthy();
  });

  it('renders gifts & burdens section in Prowess tab at intimate level', () => {
    const cardWithGifts: AgentInfoCardData = {
      ...intimateCard,
      giftsAndBurdens: [{
        id: 'power.1',
        name: 'Turn Undead',
        subcategory: 'bestowed_power',
        tier: 2,
        mechanicalSummary: '+Star, sense undead',
        tags: ['divine'],
        grantedBy: 'Solhaven',
      }],
    };
    render(<AgentProfileModal card={cardWithGifts} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Prowess');
    expect(screen.getByTestId('modal-gifts-burdens')).toBeTruthy();
    expect(screen.getByText(/Turn Undead/)).toBeTruthy();
    expect(screen.getByText(/Granted by Solhaven/)).toBeTruthy();
  });

  it('opens attachment detail overlay when vignette is clicked in Attachments tab', () => {
    const cardWithPossessions: AgentInfoCardData = {
      ...intimateCard,
      possessions: [{
        id: 'item.1',
        name: "Ashenmane's Fang",
        subcategory: 'arms',
        tier: 2,
        mechanicalSummary: '+Iron in open terrain',
        tags: ['weapon'],
      }],
    };
    render(<AgentProfileModal card={cardWithPossessions} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Attachments');
    // Find the clickable attachment item
    const vignette = screen.getByText(/Ashenmane's Fang/).closest('[role="button"]');
    expect(vignette).toBeTruthy();
    fireEvent.click(vignette!);
    expect(screen.getByTestId('attachment-detail-overlay')).toBeTruthy();
    expect(screen.getByTestId('attachment-detail-view')).toBeTruthy();
  });

  it('shows empty state in Attachments tab when no attachments', () => {
    render(<AgentProfileModal card={intimateCard} profile={intimateProfile} onClose={vi.fn()} />);
    clickTab('Attachments');
    // AttachmentsTab shows empty state message when no items
    expect(screen.getByText(/carries no known/)).toBeTruthy();
  });

  // ─── Portrait Tests ─────────────────────────────────────────────────

  it('renders gradient silhouette with no img for stranger agents', () => {
    render(<AgentProfileModal card={strangerCard} profile={undefined} onClose={vi.fn()} />);
    const portrait = screen.getByTestId('portrait-silhouette');
    expect(portrait.querySelector('img')).toBeNull();
  });

  it('renders portrait image for recognised+ agents with portraitUrl', () => {
    const cardWithPortrait: AgentInfoCardData = {
      ...recognisedCard,
      portraitUrl: '/portraits/tragic-hero.png',
    };
    render(<AgentProfileModal card={cardWithPortrait} profile={undefined} onClose={vi.fn()} />);
    const portrait = screen.getByTestId('portrait-silhouette');
    const img = portrait.querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toBe('/portraits/tragic-hero.png');
    expect(img!.getAttribute('alt')).toBe('Portrait of Kael the Scorned');
  });

  it('renders gradient fallback for recognised+ agents without portraitUrl', () => {
    render(<AgentProfileModal card={recognisedCard} profile={undefined} onClose={vi.fn()} />);
    const portrait = screen.getByTestId('portrait-silhouette');
    expect(portrait.querySelector('img')).toBeNull();
    expect(portrait.style.background).toContain('linear-gradient');
  });

  it('does not render portrait image for stranger even if portraitUrl present', () => {
    const strangerWithPortrait: AgentInfoCardData = {
      ...strangerCard,
      portraitUrl: '/portraits/tragic-hero.png',
      knowledgeLevel: 'stranger',
    };
    render(<AgentProfileModal card={strangerWithPortrait} profile={undefined} onClose={vi.fn()} />);
    const portrait = screen.getByTestId('portrait-silhouette');
    expect(portrait.querySelector('img')).toBeNull();
  });
});
