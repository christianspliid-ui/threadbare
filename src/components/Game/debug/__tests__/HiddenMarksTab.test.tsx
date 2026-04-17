// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HiddenMarksTab } from '../HiddenMarksTab';
import type { HiddenMark } from '../../../../types/unifiedAction';
import type { RetinueAgent } from '../../../../engine/retinue';

function makeMark(overrides: Partial<HiddenMark> = {}): HiddenMark {
  return {
    markId: 'mark-abc123',
    category: 'betrayal',
    severity: 0.75,
    label: 'A secret betrayal',
    sourceEncounterId: 'enc-xyz789',
    placedTick: 10,
    targetAgentId: 'agent-001',
    revealFamilies: ['investigation', 'confession'],
    ...overrides,
  };
}

const RETINUE = [
  { id: 'agent-001', name: 'Serafina' },
] as unknown as RetinueAgent[];

describe('HiddenMarksTab', () => {
  it('renders empty state when marks is empty', () => {
    render(<HiddenMarksTab marks={[]} currentTick={100} />);
    expect(screen.getByText('No hidden marks placed yet.')).toBeTruthy();
  });

  it('renders a single mark with all fields', () => {
    const mark = makeMark();
    render(<HiddenMarksTab marks={[mark]} currentTick={50} retinueAgents={RETINUE} />);
    expect(screen.getByText('A secret betrayal')).toBeTruthy();
    expect(screen.getByText('betrayal')).toBeTruthy();
    expect(screen.getByText('investigation')).toBeTruthy();
    expect(screen.getByText('confession')).toBeTruthy();
  });

  it('applies near-decay warning when severity is below threshold', () => {
    const mark = makeMark({ severity: 0.10 }); // below MARK_DECAY_FLOOR * 3 = 0.15
    render(<HiddenMarksTab marks={[mark]} currentTick={50} />);
    expect(screen.getByText('⚠ near decay')).toBeTruthy();
  });

  it('does not show near-decay warning for healthy marks', () => {
    const mark = makeMark({ severity: 0.80 });
    render(<HiddenMarksTab marks={[mark]} currentTick={50} />);
    expect(screen.queryByText('⚠ near decay')).toBeNull();
  });

  it('filters marks to focused agent when focusedAgentId is set', () => {
    const markA = makeMark({ markId: 'mark-a', targetAgentId: 'agent-001', label: 'Mark on Serafina' });
    const markB = makeMark({ markId: 'mark-b', targetAgentId: 'agent-002', label: 'Mark on other agent' });
    render(
      <HiddenMarksTab
        marks={[markA, markB]}
        currentTick={50}
        focusedAgentId="agent-001"
        retinueAgents={RETINUE}
      />,
    );
    expect(screen.getByText('Mark on Serafina')).toBeTruthy();
    // Other agent's mark label should not appear in the focused section
    expect(screen.queryByText('Mark on other agent')).toBeNull();
    // But the "other agents" summary count should mention 1 mark
    expect(screen.getByText(/1 mark on other agent/)).toBeTruthy();
  });

  it('resolves targetAgentId to agent name via retinueAgents', () => {
    const mark = makeMark();
    render(<HiddenMarksTab marks={[mark]} currentTick={50} retinueAgents={RETINUE} />);
    // Section header should show the resolved name "Serafina"
    expect(screen.getByText(/Serafina/)).toBeTruthy();
  });

  it('renders (unresolved) suffix for unknown agent IDs without throwing', () => {
    const mark = makeMark({ targetAgentId: 'unknown-agent-xyz' });
    expect(() =>
      render(<HiddenMarksTab marks={[mark]} currentTick={50} retinueAgents={RETINUE} />),
    ).not.toThrow();
    expect(screen.getByText(/(unresolved)/)).toBeTruthy();
  });
});
