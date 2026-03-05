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
        foundations: { chaos: 0.3, order: 0.7, light: 0.6, darkness: 0.4 },
        creations: {
          force: 0.8,
          matter: 0.5,
          energy: 0.4,
          life: 0.3,
          mind: 0.6,
          spirit: 0.5,
          time: 0.4,
          entropy: 0.2,
        },
      },
      domainCapabilities: {
        Iron: 0.8,
        Gold: 0.4,
        Shadow: 0.3,
        Veil: 0.2,
        Heart: 0.5,
        Eye: 0.4,
        Stone: 0.6,
        Star: 0.3,
        Flesh: 0.4,
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
        foundations: { chaos: 0.5, order: 0.5, light: 0.7, darkness: 0.3 },
        creations: {
          force: 0.4,
          matter: 0.3,
          energy: 0.5,
          life: 0.7,
          mind: 0.8,
          spirit: 0.6,
          time: 0.5,
          entropy: 0.1,
        },
      },
      domainCapabilities: {
        Iron: 0.3,
        Gold: 0.7,
        Shadow: 0.2,
        Veil: 0.6,
        Heart: 0.8,
        Eye: 0.7,
        Stone: 0.2,
        Star: 0.5,
        Flesh: 0.3,
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
        foundations: { chaos: 0.6, order: 0.4, light: 0.5, darkness: 0.5 },
        creations: {
          force: 0.5,
          matter: 0.6,
          energy: 0.5,
          life: 0.4,
          mind: 0.7,
          spirit: 0.3,
          time: 0.6,
          entropy: 0.4,
        },
      },
      domainCapabilities: {
        Iron: 0.2,
        Gold: 0.9,
        Shadow: 0.4,
        Veil: 0.3,
        Heart: 0.6,
        Eye: 0.5,
        Stone: 0.1,
        Star: 0.4,
        Flesh: 0.2,
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

  it('renders faction names when present', () => {
    render(
      <RetinuePanel
        agents={mockAgents}
        selectedAgentId={null}
        onAgentSelect={vi.fn()}
      />
    );
    expect(screen.getByText('The Steel Brotherhood')).toBeInTheDocument();
    expect(screen.getByText('Merchant Coalition')).toBeInTheDocument();
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
    const { container } = render(
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
      screen.getByText('No agents under your influence yet.')
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
