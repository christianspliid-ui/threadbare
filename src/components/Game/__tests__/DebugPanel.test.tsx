// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { enableTracing, disableTracing, emitTrace, clearTraces } from '../../../engine/traceBuffer';

describe('DebugPanel', () => {
  beforeEach(() => {
    disableTracing();
    clearTraces();
    enableTracing();
  });

  it('renders as a right-side drawer with Feed mode by default', () => {
    render(<DebugPanel currentTick={5} />);
    const panel = screen.getByTestId('debug-panel');
    expect(panel).toBeTruthy();
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.getByText('Agent')).toBeTruthy();
    expect(screen.getByText('Tick')).toBeTruthy();
  });

  it('displays trace entries with human-readable summaries', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'Tick 1: 3 events, doom stage 2, essence 50',
      phaseEventCounts: { agent_actions: 2, doom_escalation: 1 },
      agentsProcessed: 3,
      doomStage: 2,
      essenceTotal: 50,
      mandateProgress: 0.4,
    } as any);
    render(<DebugPanel currentTick={1} />);
    expect(screen.getByText(/Tick 1: 3 events/)).toBeTruthy();
  });

  it('shows category badge with correct color', () => {
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Kael chose RAID',
      agentId: 'a1',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);
    render(<DebugPanel currentTick={1} />);
    const entry = screen.getByTestId('trace-entry');
    expect(entry.textContent).toContain('action_selection');
    expect(entry.textContent).toContain('Kael chose RAID');
  });

  it('filters by category when checkbox toggled', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'Summary trace',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Action trace',
      agentId: 'a1',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);

    render(<DebugPanel currentTick={1} />);
    expect(screen.getByText(/Summary trace/)).toBeTruthy();
    expect(screen.getByText(/Action trace/)).toBeTruthy();

    // Find the tick_summary filter checkbox and click it
    const checkbox = screen.getByLabelText(/tick_summary/i);
    fireEvent.click(checkbox);
    expect(screen.queryByText(/Summary trace/)).toBeNull();
    expect(screen.getByText(/Action trace/)).toBeTruthy();
  });

  it('switches to Agent Follow mode and filters by agent', () => {
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Kael chose RAID',
      agentId: 'agent-a',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Mira chose TRADE',
      agentId: 'agent-b',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'TRADE',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);

    render(<DebugPanel currentTick={1} followAgentId="agent-a" />);
    fireEvent.click(screen.getByText('Agent'));

    expect(screen.getByText(/Kael chose RAID/)).toBeTruthy();
    expect(screen.queryByText(/Mira chose TRADE/)).toBeNull();
  });

  it('switches to Tick Inspector mode and groups by tick', () => {
    emitTrace({
      tick: 47,
      category: 'action_selection',
      summary: 'Kael chose RAID',
      agentId: 'a1',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);
    emitTrace({
      tick: 47,
      category: 'tick_summary',
      summary: 'Tick 47: 3 events',
      phaseEventCounts: {},
      agentsProcessed: 3,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    emitTrace({
      tick: 48,
      category: 'tick_summary',
      summary: 'Tick 48: 1 event',
      phaseEventCounts: {},
      agentsProcessed: 1,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);

    render(<DebugPanel currentTick={48} />);
    fireEvent.click(screen.getByText('Tick'));
    // Select a specific tick to see its traces
    const select = screen.getByDisplayValue(/Tick 48/);
    fireEvent.change(select, { target: { value: '47' } });
    expect(screen.getByText(/Kael chose RAID/)).toBeTruthy();
    expect(screen.getByText(/Tick 47: 3 events/)).toBeTruthy();
  });

  it('expands trace to show structured detail (not raw JSON)', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'Tick 1: 3 events',
      phaseEventCounts: { agent_actions: 2, doom_escalation: 1 },
      agentsProcessed: 3,
      doomStage: 1,
      essenceTotal: 75,
      mandateProgress: 0.4,
    } as any);

    render(<DebugPanel currentTick={1} />);
    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);
    // Check within the entry to avoid matching in summary
    const detailInEntry = within(entry);
    expect(detailInEntry.getByText(/Agents Processed/i)).toBeTruthy();
    expect(detailInEntry.getByText(/Doom Stage/i)).toBeTruthy();
  });

  it('renders empty state when no traces', () => {
    render(<DebugPanel currentTick={0} />);
    expect(screen.getByText(/no traces/i)).toBeTruthy();
  });

  it('shows reverse-chronological order (newest first)', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'First trace',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    emitTrace({
      tick: 2,
      category: 'tick_summary',
      summary: 'Second trace',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);

    render(<DebugPanel currentTick={2} />);
    const items = screen.getAllByTestId('trace-entry');
    expect(items[0].textContent).toContain('Second trace');
    expect(items[1].textContent).toContain('First trace');
  });

  it('auto-switches to Agent Follow mode when followAgentId prop changes', () => {
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Kael chose RAID',
      agentId: 'agent-a',
      stages: [],
      finalPick: {
        actionId: 'r1',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.4,
        roll: 0.3,
      },
    } as any);

    const { rerender } = render(<DebugPanel currentTick={1} />);
    expect(screen.getByText(/Feed/)).toBeTruthy();

    rerender(<DebugPanel currentTick={1} followAgentId="agent-a" />);
    // Should auto-switch to Agent Follow mode
    expect(screen.getByText(/Agent/)).toBeTruthy();
  });

  it('renders action_selection detail with pipeline stages', () => {
    emitTrace({
      tick: 1,
      category: 'action_selection',
      summary: 'Kael chose RAID',
      agentId: 'a1',
      stages: [
        {
          stageName: 'Survival',
          candidateIds: ['feed', 'rest'],
          scores: [0.5, 0.3],
        },
        {
          stageName: 'Safety',
          candidateIds: ['raid'],
          scores: [0.8],
        },
      ],
      finalPick: {
        actionId: 'raid',
        actionName: 'RAID',
        score: 0.8,
        probability: 0.6,
        roll: 0.5,
      },
    } as any);

    render(<DebugPanel currentTick={1} />);
    const summary = screen.getByText(/Kael chose RAID/);
    fireEvent.click(summary);
    expect(screen.getByText(/Survival/)).toBeTruthy();
    expect(screen.getByText(/Safety/)).toBeTruthy();
  });

  it('renders narrative_generation detail with prose', () => {
    emitTrace({
      tick: 1,
      category: 'narrative_generation',
      summary: 'Notable narrative generated',
      tier: 'notable',
      templateId: 'conquest',
      sphereWords: ['iron', 'gold'],
      personalityClause: 'with cunning grace',
      finalProse: 'The warlord seized the harbor with cunning grace.',
    } as any);

    render(<DebugPanel currentTick={1} />);
    const summary = screen.getByText(/Notable narrative generated/);
    fireEvent.click(summary);
    expect(screen.getByText(/Notable/)).toBeTruthy();
    expect(screen.getByText(/The warlord seized/)).toBeTruthy();
  });

  it('renders context_harvest detail with harvested objects', () => {
    emitTrace({
      tick: 1,
      category: 'context_harvest',
      summary: 'Context gathered',
      harvestedCount: 8,
      rankedTop: [
        { nodeId: 'loc1', name: 'Ashvale', score: 0.95 },
        { nodeId: 'act1', name: 'Kael', score: 0.87 },
      ],
      selectedIds: ['loc1', 'act1'],
      oppositionTension: 0.42,
    } as any);

    render(<DebugPanel currentTick={1} />);
    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);
    // Check within the entry to avoid matching in summary
    const detailInEntry = within(entry);
    expect(detailInEntry.getByText('Harvested')).toBeTruthy();
    expect(screen.getByText(/Ashvale/)).toBeTruthy();
  });

  it('renders dilemma_resolution detail with payoff matrix', () => {
    emitTrace({
      tick: 1,
      category: 'dilemma_resolution',
      summary: 'Dilemma resolved between Kael & Mira',
      targetId: 'agent-b',
      actorStrategy: 'tit-for-tat',
      targetStrategy: 'always-defect',
      actorMove: 'cooperate',
      targetMove: 'defect',
      outcome: 'Mutual distrust deepens',
      stakes: 0.7,
      sentimentDelta: -0.2,
      reputationDeltas: { actor: -0.1, target: 0.05 },
    } as any);

    render(<DebugPanel currentTick={1} />);
    const summary = screen.getByText(/Dilemma resolved/);
    fireEvent.click(summary);
    expect(screen.getByText(/tit-for-tat/i)).toBeTruthy();
    expect(screen.getByText(/Mutual distrust/)).toBeTruthy();
  });
});
