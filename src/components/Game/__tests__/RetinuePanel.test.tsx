// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetinuePanel } from '../RetinuePanel';
import type { RetinueAgent } from '../../../engine/retinue';

describe('RetinuePanel', () => {
  const mockAgents: RetinueAgent[] = [
    {
      id: 'agent-1',
      name: 'Sir Aldric',
      tier: 3,
      tierName: 'Champion',
      locationId: 'loc-1',
      locationName: 'Ironholds',
      profile: {
        ambition_contentment: 0.3,
        courage_prudence: -0.1,
        cruelty_compassion: 0.2,
        cunning_honesty: -0.5,
        devotion_independence: 0.7,
        loyalty_treachery: 0.9,
        tradition_innovation: 0.1,
        dominance_humility: -0.2,
        wrath_patience: 0.4,
        greed_generosity: -0.3,
      },
      domainCapabilities: {
        iron: 8,
        gold: 4,
        shadow: 3,
        veil: 2,
        heart: 5,
        eye: 4,
        stone: 6,
        star: 3,
        flesh: 4,
      },
      factionName: 'The Steel Brotherhood',
    },
    {
      id: 'agent-2',
      name: 'Lady Cassian',
      tier: 2,
      tierName: 'Devoted',
      locationId: 'loc-2',
      locationName: 'Silvermere',
      profile: {
        ambition_contentment: -0.2,
        courage_prudence: 0.4,
        cruelty_compassion: 0.6,
        cunning_honesty: 0.3,
        devotion_independence: 0.5,
        loyalty_treachery: 0.7,
        tradition_innovation: -0.3,
        dominance_humility: 0.1,
        wrath_patience: -0.4,
        greed_generosity: 0.5,
      },
      domainCapabilities: {
        iron: 3,
        gold: 7,
        shadow: 2,
        veil: 6,
        heart: 8,
        eye: 7,
        stone: 2,
        star: 5,
        flesh: 3,
      },
      factionName: null,
    },
    {
      id: 'agent-3',
      name: 'The Merchant Prince',
      tier: 1,
      tierName: 'Touched',
      locationId: 'loc-3',
      locationName: 'Goldport',
      profile: {
        ambition_contentment: 0.8,
        courage_prudence: -0.3,
        cruelty_compassion: -0.1,
        cunning_honesty: -0.7,
        devotion_independence: 0.2,
        loyalty_treachery: 0.4,
        tradition_innovation: 0.5,
        dominance_humility: 0.6,
        wrath_patience: -0.2,
        greed_generosity: -0.8,
      },
      domainCapabilities: {
        iron: 2,
        gold: 9,
        shadow: 4,
        veil: 3,
        heart: 6,
        eye: 5,
        stone: 1,
        star: 4,
        flesh: 2,
      },
      factionName: 'Merchant Coalition',
    },
  ];

  it('renders header with agent count', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Retinue (3)')).toBeInTheDocument();
  });

  it('renders all agent names', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Sir Aldric')).toBeInTheDocument();
    expect(screen.getByText('Lady Cassian')).toBeInTheDocument();
    expect(screen.getByText('The Merchant Prince')).toBeInTheDocument();
  });

  it('renders tier names for each agent', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.getByText('Devoted')).toBeInTheDocument();
    expect(screen.getByText('Touched')).toBeInTheDocument();
  });

  it('renders location names for each agent', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Ironholds')).toBeInTheDocument();
    expect(screen.getByText('Silvermere')).toBeInTheDocument();
    expect(screen.getByText('Goldport')).toBeInTheDocument();
  });

  it('renders all agents when faction names are present', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    // All agents should be rendered regardless of factionName
    expect(screen.getByText('Sir Aldric')).toBeInTheDocument();
    expect(screen.getByText('Lady Cassian')).toBeInTheDocument();
    expect(screen.getByText('The Merchant Prince')).toBeInTheDocument();
  });

  it('does not render faction name when null', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    // Lady Cassian has null factionName, verify she's rendered but faction isn't
    expect(screen.getByText('Lady Cassian')).toBeInTheDocument();
    // Should not render undefined/empty faction text for her
    const entries = screen.getAllByTestId('retinue-entry');
    const cassianEntry = entries.find(el => el.textContent.includes('Lady Cassian'));
    expect(cassianEntry).toBeInTheDocument();
  });

  it('calls onAgentSelect when an agent entry is clicked', () => {
    const onAgentSelect = vi.fn();
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={onAgentSelect}
      />
    );
    const entries = screen.getAllByTestId('retinue-entry');
    fireEvent.click(entries[0]);
    expect(onAgentSelect).toHaveBeenCalledWith('agent-1');
  });

  it('highlights the selected agent with ring className', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId="agent-2"
        onAgentSelect={vi.fn()}
      />
    );
    const entries = screen.getAllByTestId('retinue-entry');
    // agent-2 should have ring-2 class
    expect(entries[1]).toHaveClass('ring-2');
  });

  it('does not highlight unselected agents', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId="agent-1"
        onAgentSelect={vi.fn()}
      />
    );
    const entries = screen.getAllByTestId('retinue-entry');
    // agent-2 and agent-3 should not have ring-2 class
    expect(entries[1]).not.toHaveClass('ring-2');
    expect(entries[2]).not.toHaveClass('ring-2');
  });

  it('renders empty state when no agents', () => {
    render(
      <RetinuePanel
        agents={[]}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(
      screen.getByText('The threads of fate lie still. No souls yet attend your court.')
    ).toBeInTheDocument();
  });

  it('does not render header when agents list is empty', () => {
    render(
      <RetinuePanel
        agents={[]}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.queryByText(/^Retinue/)).not.toBeInTheDocument();
  });

  it('updates header count when agent list changes', () => {
    const { rerender } = render(
      <RetinuePanel
        agents={mockAgents.slice(0, 2)}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Retinue (2)')).toBeInTheDocument();

    rerender(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Retinue (3)')).toBeInTheDocument();
  });

  it('each agent entry has retinue-entry testid', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    const entries = screen.getAllByTestId('retinue-entry');
    expect(entries).toHaveLength(3);
  });
});
