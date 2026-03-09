// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { emitTrace, enableTracing, clearTraces } from '../../../engine/traceBuffer';

describe('DebugPanel — modifier_resolution renderer', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('renders modifier_resolution traces in feed', () => {
    emitTrace({
      tick: 3,
      category: 'modifier_resolution',
      summary: 'Resolved los_range for actor.kael',
      nodeId: 'actor.kael',
      attribute: 'los_range',
      baseValue: 2,
      modifiers: [
        { edgeId: 'edge.1', edgeType: 'has_trait', sourceName: 'Eagle-Eyed', delta: 1 },
      ],
      finalValue: 3,
    });

    render(<DebugPanel currentTick={3} onClose={() => {}} />);
    expect(screen.getByText(/Resolved los_range/)).toBeDefined();
    expect(screen.getAllByText('modifier_resolution')).toBeDefined();
  });

  it('shows the attribute name when expanded', () => {
    emitTrace({
      tick: 5,
      category: 'modifier_resolution',
      summary: 'Resolved domain_capability for actor.mira',
      nodeId: 'actor.mira',
      attribute: 'domain_capability',
      baseValue: 4,
      modifiers: [
        { edgeId: 'edge.2', edgeType: 'has_trait', sourceName: 'Warrior Training', delta: 2 },
      ],
      finalValue: 6,
    });

    render(<DebugPanel currentTick={5} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    expect(screen.getByText('domain_capability')).toBeDefined();
    expect(screen.getByText('actor.mira')).toBeDefined();
  });

  it('shows each modifier source with delta coloring', () => {
    emitTrace({
      tick: 7,
      category: 'modifier_resolution',
      summary: 'Resolved action_cost for actor.aldric',
      nodeId: 'actor.aldric',
      attribute: 'action_cost',
      baseValue: 5,
      modifiers: [
        { edgeId: 'edge.3', edgeType: 'has_trait', sourceName: 'Frugal', delta: -1 },
        { edgeId: 'edge.4', edgeType: 'belongs_to', sourceName: 'Guild of Merchants', delta: -0.5 },
        { edgeId: 'edge.5', edgeType: 'has_trait', sourceName: 'Divine Blessing', delta: 2 },
      ],
      finalValue: 5.5,
    });

    render(<DebugPanel currentTick={7} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Verify all modifier sources appear
    expect(screen.getByText('Frugal')).toBeDefined();
    expect(screen.getByText('Guild of Merchants')).toBeDefined();
    expect(screen.getByText('Divine Blessing')).toBeDefined();

    // Verify edge types appear
    expect(screen.getAllByText(/has_trait/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/belongs_to/)).toBeDefined();

    // Verify deltas are rendered (negative and positive)
    expect(screen.getByText('-1.00')).toBeDefined();
    expect(screen.getByText('-0.50')).toBeDefined();
    expect(screen.getByText('+2.00')).toBeDefined();
  });

  it('shows the final value in bold', () => {
    emitTrace({
      tick: 10,
      category: 'modifier_resolution',
      summary: 'Resolved los_range for actor.nox',
      nodeId: 'actor.nox',
      attribute: 'los_range',
      baseValue: 2,
      modifiers: [],
      finalValue: 2,
    });

    render(<DebugPanel currentTick={10} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Base value and final value should both be 2.00
    const valueElements = screen.getAllByText('2.00');
    expect(valueElements.length).toBe(2); // base + final

    // Final value label should be present
    expect(screen.getByText('Final Value')).toBeDefined();
  });

  it('handles empty modifiers array gracefully', () => {
    emitTrace({
      tick: 1,
      category: 'modifier_resolution',
      summary: 'Resolved los_range for actor.solo',
      nodeId: 'actor.solo',
      attribute: 'los_range',
      baseValue: 3,
      modifiers: [],
      finalValue: 3,
    });

    render(<DebugPanel currentTick={1} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Should render without crashing, show base and final
    expect(screen.getByText('los_range')).toBeDefined();
    expect(screen.getByText('Base Value')).toBeDefined();
    expect(screen.getByText('Final Value')).toBeDefined();

    // "Modifiers" label should not appear when array is empty
    expect(screen.queryByText('Modifiers')).toBeNull();
  });
});
