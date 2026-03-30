// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MandateTracker } from '../MandateTracker';
import type { MandateDefinition, MandateState } from '../../../types/mandate';

const baseMandateDefinition: MandateDefinition = {
  id: 'mandate.1',
  type: 'graph_state',
  name: 'Node Dominance',
  description: 'Establish control over the world-graph',
  stages: [
    {
      stage: 'setup',
      description: 'Create foundational nodes',
      conditions: [
        {
          type: 'node_count',
          description: 'Achieve 50 nodes',
          params: { minNodes: 50 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Connect and strengthen',
      conditions: [
        {
          type: 'edge_count',
          description: 'Establish 100 edges',
          params: { minEdges: 100 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Achieve supremacy',
      conditions: [
        {
          type: 'node_count',
          description: 'Control 150 nodes',
          params: { minNodes: 150 },
        },
      ],
    },
  ],
};

const baseMandateState: MandateState = {
  mandateId: 'mandate.1',
  currentStage: 'setup',
  progress: 0.5,
  completed: false,
  failed: false,
};

describe('MandateTracker', () => {
  it('renders mandate name', () => {
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    expect(screen.getByText('Node Dominance')).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders 3 stage pips', () => {
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    const pips = screen.getAllByTestId('stage-pip');
    expect(pips).toHaveLength(3);
  });

  it('toggles expanded popover on click', async () => {
    vi.useFakeTimers();
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    // Initially, popover should not be visible (description should not be in DOM)
    expect(screen.queryByText('Establish control over the world-graph')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Node Dominance'));
    expect(screen.getByText('Establish control over the world-graph')).toBeInTheDocument();

    // Click the mandate name again to collapse
    fireEvent.click(screen.getByText('Node Dominance'));
    // Wait for AnimateMount exit animation to complete (default 200ms)
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText('Establish control over the world-graph')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows "FULFILLED" when completed', () => {
    const completedState: MandateState = {
      ...baseMandateState,
      currentStage: 'culmination',
      progress: 1.0,
      completed: true,
    };
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={completedState}
      />
    );
    expect(screen.getByText('FULFILLED')).toBeInTheDocument();
  });

  it('renders type badge in expanded view', () => {
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    fireEvent.click(screen.getByText('Node Dominance'));
    expect(screen.getByText('GRAPH-STATE')).toBeInTheDocument();
  });

  it('shows current stage conditions in expanded view', () => {
    const stateWithMetCondition: MandateState = {
      ...baseMandateState,
      currentStage: 'setup',
    };
    const defWithMetCondition: MandateDefinition = {
      ...baseMandateDefinition,
      stages: baseMandateDefinition.stages.map(stage =>
        stage.stage === 'setup'
          ? {
              ...stage,
              conditions: stage.conditions.map(cond => ({ ...cond, met: true })),
            }
          : stage
      ),
    };
    render(
      <MandateTracker
        definition={defWithMetCondition}
        state={stateWithMetCondition}
      />
    );
    fireEvent.click(screen.getByText('Node Dominance'));
    expect(screen.getByText('Achieve 50 nodes')).toBeInTheDocument();
    expect(screen.getByText('Achieve 50 nodes').parentElement).toHaveTextContent('✓');
  });

  it('shows unmet conditions with ○ indicator', () => {
    const stateWithUnmetCondition: MandateState = {
      ...baseMandateState,
      currentStage: 'setup',
    };
    const defWithUnmetCondition: MandateDefinition = {
      ...baseMandateDefinition,
      stages: baseMandateDefinition.stages.map(stage =>
        stage.stage === 'setup'
          ? {
              ...stage,
              conditions: stage.conditions.map(cond => ({ ...cond, met: false })),
            }
          : stage
      ),
    };
    render(
      <MandateTracker
        definition={defWithUnmetCondition}
        state={stateWithUnmetCondition}
      />
    );
    fireEvent.click(screen.getByText('Node Dominance'));
    expect(screen.getByText('Achieve 50 nodes')).toBeInTheDocument();
    expect(screen.getByText('Achieve 50 nodes').parentElement).toHaveTextContent('○');
  });

  it('displays stage timeline with checkmarks for completed stages', () => {
    const advancedState: MandateState = {
      ...baseMandateState,
      currentStage: 'escalation',
    };
    render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={advancedState}
      />
    );
    fireEvent.click(screen.getByText('Node Dominance'));
    // Should show all 3 stages in timeline
    expect(screen.getByText(/SETUP|setup/i)).toBeInTheDocument();
    expect(screen.getByText(/ESCALATION|escalation/i)).toBeInTheDocument();
    expect(screen.getByText(/CULMINATION|culmination/i)).toBeInTheDocument();
    // Setup should have a checkmark (it's completed)
    const popover = screen.getByText('Establish control over the world-graph').closest('div');
    expect(popover?.textContent).toMatch('✓');
  });

  it('closes popover when clicking backdrop', async () => {
    vi.useFakeTimers();
    const { container } = render(
      <MandateTracker
        definition={baseMandateDefinition}
        state={baseMandateState}
      />
    );
    fireEvent.click(screen.getByText('Node Dominance'));
    expect(screen.getByText('Establish control over the world-graph')).toBeInTheDocument();

    // Find and click the backdrop
    const backdrop = container.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    // Wait for AnimateMount exit animation to complete (default 200ms)
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText('Establish control over the world-graph')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
