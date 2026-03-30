// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DecisionBreakdown } from '../DecisionBreakdown';
import type { TraceEntry, FilterPipelineTrace, ScoringTrace, EncounterAwarenessTrace } from '../../../../types/trace';

function makeFilterTrace(agentId: string, tick: number, overrides?: Partial<FilterPipelineTrace>): FilterPipelineTrace {
  return {
    id: tick * 100,
    tick,
    timestamp: Date.now(),
    category: 'encounter_filter',
    agentId,
    summary: `Filter pipeline for ${agentId}`,
    cacheSize: 500,
    afterAwareness: 200,
    afterVisibility: 180,
    afterPrerequisites: 150,
    afterThreat: 120,
    afterCap: 40,
    ...overrides,
  };
}

function makeScoringTrace(agentId: string, tick: number, overrides?: Partial<ScoringTrace>): ScoringTrace {
  return {
    id: tick * 100 + 1,
    tick,
    timestamp: Date.now(),
    category: 'encounter_scoring',
    agentId,
    summary: `Scoring for ${agentId}`,
    topCandidates: [
      {
        templateId: 'trade_deal',
        locationId: 'market',
        isLocal: true,
        valuePerTick: 0.82,
        desireMultiplier: 1.4,
        finalScore: 0.95,
        travelCost: 0,
        completionProb: 0.8,
      },
      {
        templateId: 'deep_descent',
        locationId: 'ruins',
        isLocal: false,
        valuePerTick: 0.45,
        desireMultiplier: 1.3,
        finalScore: 0.65,
        travelCost: 4,
        completionProb: 0.5,
      },
    ],
    selectedTemplateId: 'trade_deal',
    selectedLocationId: 'market',
    action: 'start_local',
    ...overrides,
  };
}

function makeAwarenessTrace(agentId: string, tick: number): EncounterAwarenessTrace {
  return {
    id: tick * 100 + 2,
    tick,
    timestamp: Date.now(),
    category: 'encounter_awareness',
    agentId,
    summary: `Awareness for ${agentId}`,
    reach: 'Gold',
    capability: 0.7,
    hopsGranted: 3,
    encountersVisible: 45,
  };
}

describe('DecisionBreakdown', () => {
  it('renders empty state when no traces exist for the agent', () => {
    render(<DecisionBreakdown agentId="agent-1" traces={[]} />);
    expect(screen.getByTestId('decision-breakdown').textContent).toContain('No decision traces');
  });

  it('shows decision state from latest scoring trace', () => {
    const traces: TraceEntry[] = [
      makeScoringTrace('agent-1', 5),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    expect(screen.getByTestId('decision-state').textContent).toBe('start_local');
  });

  it('renders filter pipeline with bar visualizations', () => {
    const traces: TraceEntry[] = [
      makeFilterTrace('agent-1', 5),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    const breakdown = screen.getByTestId('decision-breakdown');
    expect(breakdown.textContent).toContain('Filter Pipeline');
    expect(breakdown.textContent).toContain('500');
    expect(breakdown.textContent).toContain('200');
    expect(breakdown.textContent).toContain('40');
  });

  it('shows top candidates from scoring trace', () => {
    const traces: TraceEntry[] = [
      makeScoringTrace('agent-1', 5),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    const breakdown = screen.getByTestId('decision-breakdown');
    expect(breakdown.textContent).toContain('trade_deal');
    expect(breakdown.textContent).toContain('deep_descent');
    expect(breakdown.textContent).toContain('0.95');
  });

  it('renders awareness range per reach', () => {
    const traces: TraceEntry[] = [
      makeAwarenessTrace('agent-1', 5),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    const breakdown = screen.getByTestId('decision-breakdown');
    expect(breakdown.textContent).toContain('Gold');
    expect(breakdown.textContent).toContain('3 hops');
    expect(breakdown.textContent).toContain('45 visible');
  });

  it('ignores traces for other agents', () => {
    const traces: TraceEntry[] = [
      makeScoringTrace('agent-2', 5),
      makeFilterTrace('agent-2', 5),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    expect(screen.getByTestId('decision-breakdown').textContent).toContain('No decision traces');
  });

  it('uses the latest trace when multiple exist', () => {
    const traces: TraceEntry[] = [
      makeScoringTrace('agent-1', 3, { action: 'idle', selectedTemplateId: null, selectedLocationId: null }),
      makeScoringTrace('agent-1', 5, { action: 'queue_movement', selectedTemplateId: 'explore', selectedLocationId: 'cave' }),
    ];
    render(<DecisionBreakdown agentId="agent-1" traces={traces} />);
    expect(screen.getByTestId('decision-state').textContent).toBe('queue_movement');
  });
});
