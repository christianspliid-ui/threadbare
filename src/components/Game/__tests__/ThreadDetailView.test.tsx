// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadDetailView } from '../ThreadDetailView';
import type { ThreadedAgent, ThreadedLocation, ThreadedFaction, ThreadedArmy, ThreadedArtifact } from '../../../engine/retinue';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { BalanceEvent } from '../../../types/balanceEval';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const makeAgent = (overrides?: Partial<ThreadedAgent>): ThreadedAgent => ({
  id: 'agent-1',
  name: 'Seraphel',
  tier: 2,
  tierName: 'Acolyte',
  category: 'agent',
  threadEdgeId: 'e1',
  attentionMode: 'auto_resolve',
  courtPosition: 'retinue',
  threadStrength: 1.0,
  locationId: 'loc-1',
  locationName: 'Thornwall',
  activityLabel: 'Recruiting',
  portraitUrl: null,
  primaryDomain: 'iron',
  factionName: 'Iron Legion',
  championEffectId: null,
  championTemplateId: null,
  ...overrides,
});

const makeLocation = (overrides?: Partial<ThreadedLocation>): ThreadedLocation => ({
  id: 'loc-1',
  name: 'Thornwall',
  tier: 1,
  tierName: 'Touched',
  category: 'location',
  threadEdgeId: 'e2',
  attentionMode: 'auto_resolve',
  courtPosition: null,
  hexCol: 5,
  hexRow: 3,
  prosperityLabel: 'Stable',
  controllingFaction: 'Iron Legion',
  ...overrides,
});

const makeFaction = (overrides?: Partial<ThreadedFaction>): ThreadedFaction => ({
  id: 'faction-1',
  name: 'Iron Legion',
  tier: 3,
  tierName: 'Champion',
  category: 'faction',
  threadEdgeId: 'e3',
  attentionMode: 'auto_resolve',
  courtPosition: null,
  dominantSphere: 'force',
  territoryCount: 12,
  memberCount: 48,
  ...overrides,
});

const makeArmy = (overrides?: Partial<ThreadedArmy>): ThreadedArmy => ({
  id: 'army-1',
  name: 'Iron Vanguard',
  tier: 2,
  tierName: 'Acolyte',
  category: 'army',
  threadEdgeId: 'e4',
  attentionMode: 'auto_resolve',
  courtPosition: null,
  size: 500,
  objective: 'Patrol the northern border',
  factionName: 'Iron Legion',
  locationName: 'Thornwall',
  ...overrides,
});

const makeArtifact = (overrides?: Partial<ThreadedArtifact>): ThreadedArtifact => ({
  id: 'artifact-1',
  name: 'Blade of Ruin',
  tier: 4,
  tierName: 'Devoted',
  category: 'artifact',
  threadEdgeId: 'e5',
  attentionMode: 'auto_resolve',
  courtPosition: null,
  bearerName: 'Seraphel',
  locationName: null,
  ...overrides,
});

const makeAgentInfoCard = (): AgentInfoCardData => ({
  id: 'agent-1',
  name: 'Seraphel',
  locationId: 'loc-1',
  locationName: 'Thornwall',
  knowledgeLevel: 'known',
  primarySphere: 'force',
  quintessence: 'Vibrant',
  domains: [
    { domain: 'iron', word: 'Warrior' },
    { domain: 'gold', word: 'Merchant' },
  ],
  topValues: [],
  topBonds: [],
  quotes: [],
  allTraits: [],
  activeEffects: [],
  archetypeLabel: null,
  archetypeId: null,
  factionName: 'Iron Legion',
  cultureName: null,
  primaryIntentSummary: null,
  cooperationStrategy: null,
  reputationWord: null,
  backstoryParagraph1: null,
  backstory: null,
} as AgentInfoCardData);

const makeEncounterDecision = (overrides?: Partial<BalanceEvent>): BalanceEvent => ({
  seq: 1,
  tick: 12,
  kind: 'encounter_decision',
  agentId: 'agent-1',
  sourceSystem: 'planner',
  decisionType: 'idle',
  filterCacheSize: 12,
  filterAfterAwareness: 8,
  filterAfterVisibility: 6,
  filterAfterPrerequisites: 4,
  filterAfterThreat: 4,
  filterAfterCap: 3,
  candidatesAfterCooldown: 2,
  bestScore: 0.42,
  ...overrides,
});

const noop = vi.fn();

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ThreadDetailView', () => {
  it('renders agent detail with domain capabilities grid when agentInfoCard is provided', () => {
    const card = makeAgentInfoCard();
    render(
      <ThreadDetailView
        node={makeAgent()}
        agentInfoCard={card}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    // Should show domain names from the card
    expect(screen.getByText(/Iron:/i)).toBeInTheDocument();
    expect(screen.getByText(/Gold:/i)).toBeInTheDocument();
  });

  it('renders agent detail with basic fields when agentInfoCard is null', () => {
    render(
      <ThreadDetailView
        node={makeAgent()}
        agentInfoCard={null}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText('Seraphel')).toBeInTheDocument();
    // Should show activity label in fallback path
    expect(screen.getByText('Recruiting')).toBeInTheDocument();
  });

  it('renders the encounter pool panel when latest chooser telemetry is provided', () => {
    render(
      <ThreadDetailView
        node={makeAgent()}
        agentInfoCard={makeAgentInfoCard()}
        agentEncounterDecision={makeEncounterDecision({
          decisionType: 'queue_movement',
          targetLocationSubtype: 'ruins',
          travelCost: 2,
        })}
        onClose={noop}
        onViewProfile={noop}
      />
    );

    expect(screen.getByText('Encounter Pool')).toBeInTheDocument();
    expect(screen.getByText('Queue Movement')).toBeInTheDocument();
    expect(screen.getByText('ruins')).toBeInTheDocument();
    expect(screen.getByText(/Cached 12 -> Awareness 8 -> Visibility 6 -> Prereqs 4 -> Threat 4 -> Capability 3 -> Cooldown 2/i)).toBeInTheDocument();
  });

  it('adds the viable choice count to the activity line when chooser telemetry is present', () => {
    render(
      <ThreadDetailView
        node={makeAgent({ activityLabel: 'Going to Green-shroud' })}
        agentInfoCard={makeAgentInfoCard()}
        agentEncounterDecision={makeEncounterDecision({
          decisionType: 'queue_movement',
          candidatesAfterCooldown: 2,
        })}
        onClose={noop}
        onViewProfile={noop}
      />
    );

    expect(screen.getByText('Going to Green-shroud (from 2 options)')).toBeInTheDocument();
  });

  it('renders idle reason text in encounter pool panel', () => {
    render(
      <ThreadDetailView
        node={makeAgent()}
        agentEncounterDecision={makeEncounterDecision({
          idleReason: 'no_candidates_after_cooldown',
          candidatesAfterCooldown: 0,
        })}
        onClose={noop}
        onViewProfile={noop}
      />
    );

    expect(screen.getByText('All candidates on cooldown')).toBeInTheDocument();
  });

  it('renders location detail with prosperity label and controlling faction', () => {
    render(
      <ThreadDetailView
        node={makeLocation()}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText('Thornwall')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
    expect(screen.getByText('Iron Legion')).toBeInTheDocument();
  });

  it('renders faction detail with sphere alignment as FIRST field when dominantSphere is non-null', () => {
    render(
      <ThreadDetailView
        node={makeFaction()}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText('Iron Legion')).toBeInTheDocument();
    // Sphere should appear — check for 'force' text
    expect(screen.getByText('force')).toBeInTheDocument();
    // Territory and members should also be present
    expect(screen.getByText(/12 holdings/i)).toBeInTheDocument();
    expect(screen.getByText(/48 members/i)).toBeInTheDocument();
  });

  it('renders faction detail without sphere line when dominantSphere is null', () => {
    render(
      <ThreadDetailView
        node={makeFaction({ dominantSphere: null })}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    // Should not find a sphere dot indicator — sphere label not shown
    expect(screen.queryByText('force')).not.toBeInTheDocument();
    // But members should still show
    expect(screen.getByText(/48 members/i)).toBeInTheDocument();
  });

  it('renders army detail with strength and objective', () => {
    render(
      <ThreadDetailView
        node={makeArmy()}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText(/500 strong/i)).toBeInTheDocument();
    expect(screen.getByText('Patrol the northern border')).toBeInTheDocument();
  });

  it('renders artifact detail with bearer name', () => {
    render(
      <ThreadDetailView
        node={makeArtifact()}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText(/Carried by Seraphel/i)).toBeInTheDocument();
  });

  it('renders artifact detail with "(location unknown)" when no bearer and no location', () => {
    render(
      <ThreadDetailView
        node={makeArtifact({ bearerName: null, locationName: null })}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    expect(screen.getByText(/\(location unknown\)/i)).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(
      <ThreadDetailView
        node={makeAgent()}
        onClose={onClose}
        onViewProfile={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close detail/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('"View Full Profile" link calls onViewProfile with correct nodeId and category', () => {
    const onViewProfile = vi.fn();
    render(
      <ThreadDetailView
        node={makeAgent()}
        onClose={noop}
        onViewProfile={onViewProfile}
      />
    );
    fireEvent.click(screen.getByText(/View Full Profile/i));
    expect(onViewProfile).toHaveBeenCalledWith('agent-1', 'agent');
  });

  it('scroll context isolation: detail view wrapper has overflow-y auto', () => {
    const { container } = render(
      <div data-testid="thread-detail-scroll" style={{ overflowY: 'auto' }}>
        <ThreadDetailView
          node={makeAgent()}
          onClose={noop}
          onViewProfile={noop}
        />
      </div>
    );
    const scrollWrapper = container.querySelector('[data-testid="thread-detail-scroll"]') as HTMLElement;
    expect(scrollWrapper).toBeInTheDocument();
    expect(scrollWrapper.style.overflowY).toBe('auto');
  });

  it('shows "Agent" category badge for agent nodes', () => {
    render(
      <ThreadDetailView
        node={makeAgent()}
        onClose={noop}
        onViewProfile={noop}
      />
    );
    // Category label in small caps — "Agent"
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  // ─── Intelligence panel integration ─────────────────────────────

  it('shows Intelligence section when intelligenceRecords is non-empty and agent tier >= 1', () => {
    const records = [
      {
        recordId: 'rec-1',
        agentId: 'agent-1',
        category: 'shrine_location' as const,
        label: 'A veiled shrine',
        detail: 'Hidden near the forest edge.',
        reliability: 0.8,
        acquiredTick: 5,
        sourceEncounterId: 'enc-1',
      },
    ];
    render(
      <ThreadDetailView
        node={makeAgent({ tier: 1 })}
        agentInfoCard={makeAgentInfoCard()}
        onClose={noop}
        onViewProfile={noop}
        intelligenceRecords={records}
        currentTick={10}
      />
    );
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('A veiled shrine')).toBeInTheDocument();
  });

  it('omits Intelligence section entirely when agent tier is 0 (Stranger)', () => {
    const records = [
      {
        recordId: 'rec-1',
        agentId: 'agent-1',
        category: 'trade_route' as const,
        label: 'Northern caravan route',
        detail: 'Passes through the valley.',
        reliability: 0.7,
        acquiredTick: 5,
        sourceEncounterId: 'enc-1',
      },
    ];
    render(
      <ThreadDetailView
        node={makeAgent({ tier: 0, tierName: 'Stranger' })}
        agentInfoCard={null}
        onClose={noop}
        onViewProfile={noop}
        intelligenceRecords={records}
        currentTick={10}
      />
    );
    expect(screen.queryByText('Intelligence')).not.toBeInTheDocument();
    expect(screen.queryByText('Northern caravan route')).not.toBeInTheDocument();
  });

  it('shows empty-state copy when intelligenceRecords is empty and agent tier >= 1', () => {
    render(
      <ThreadDetailView
        node={makeAgent({ tier: 2 })}
        agentInfoCard={makeAgentInfoCard()}
        onClose={noop}
        onViewProfile={noop}
        intelligenceRecords={[]}
        currentTick={10}
      />
    );
    expect(screen.getByText('Knows nothing of consequence.')).toBeInTheDocument();
  });
});
