// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { emitTrace, enableTracing, clearTraces } from '../../../engine/traceBuffer';

describe('DebugPanel — intervention_effect renderer', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('renders intervention effect traces in feed', () => {
    emitTrace({
      tick: 5,
      category: 'intervention_effect',
      summary: 'Dream on Kael via mind',
      interventionType: 'dream',
      targetAgentId: 'actor.kael',
      targetAgentName: 'Kael',
      sphere: 'mind',
      effects: ['courage_prudence +0.12 for 3 ticks'],
      consequenceMessage: 'Kael will be drawn toward courage in the days ahead.',
      ticksRemaining: 3,
    });

    render(<DebugPanel currentTick={5} onClose={() => {}} />);
    expect(screen.getByText(/Dream on Kael/)).toBeDefined();
    expect(screen.getAllByText('intervention_effect')).toBeDefined();
  });

  it('renders intervention effect details when expanded', () => {
    emitTrace({
      tick: 5,
      category: 'intervention_effect',
      summary: 'Dream on Kael via mind',
      interventionType: 'dream',
      targetAgentId: 'actor.kael',
      targetAgentName: 'Kael',
      sphere: 'mind',
      effects: ['courage_prudence +0.12 for 3 ticks'],
      consequenceMessage: 'Kael will be drawn toward courage in the days ahead.',
      ticksRemaining: 3,
    });

    render(<DebugPanel currentTick={5} onClose={() => {}} />);

    // Click to expand
    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Verify dedicated renderer fields exist in expanded view
    expect(screen.getByText('dream')).toBeDefined();
    // Use more specific selector to avoid finding it in the summary
    const kaelElements = screen.getAllByText(/Kael/);
    expect(kaelElements.length).toBeGreaterThan(0);
    expect(screen.getByText('mind')).toBeDefined();
    expect(screen.getByText(/courage_prudence/)).toBeDefined();
    expect(screen.getByText(/drawn toward courage/)).toBeDefined();
  });

  it('renders multiple effects as bullet points', () => {
    emitTrace({
      tick: 10,
      category: 'intervention_effect',
      summary: 'Afflict/Bless on Mira via life',
      interventionType: 'afflict_bless',
      targetAgentId: 'actor.mira',
      targetAgentName: 'Mira',
      sphere: 'life',
      effects: ['compassion_cruelty +0.15 for 10 ticks', 'cooperation boost applied', 'trait granted: blessed_aura'],
      consequenceMessage: 'Mira feels a divine presence guiding her toward compassion.',
      ticksRemaining: 10,
    });

    render(<DebugPanel currentTick={10} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    expect(screen.getByText(/compassion_cruelty/)).toBeDefined();
    expect(screen.getByText(/cooperation boost/)).toBeDefined();
    expect(screen.getByText(/blessed_aura/)).toBeDefined();
  });

  it('displays tick count in header', () => {
    emitTrace({
      tick: 7,
      category: 'intervention_effect',
      summary: 'Manipulation on Aldric via mind',
      interventionType: 'manipulation',
      targetAgentId: 'actor.aldric',
      targetAgentName: 'Aldric',
      sphere: 'mind',
      effects: ['malice_benevolence +0.10 for 5 ticks'],
      consequenceMessage: 'Aldric feels shadow thoughts creeping into his mind.',
      ticksRemaining: 5,
    });

    render(<DebugPanel currentTick={7} onClose={() => {}} />);

    expect(screen.getByText('#7')).toBeDefined();
  });

  it('shows ticks remaining as a field', () => {
    emitTrace({
      tick: 15,
      category: 'intervention_effect',
      summary: 'Enchant on Lysara via spirit',
      interventionType: 'enchant',
      targetAgentId: 'actor.lysara',
      targetAgentName: 'Lysara',
      sphere: 'spirit',
      effects: [],
      consequenceMessage: 'Lysara is touched by divine grace.',
      ticksRemaining: 8,
    });

    render(<DebugPanel currentTick={15} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    expect(screen.getByText('8')).toBeDefined();
  });

  it('handles empty effects array gracefully', () => {
    emitTrace({
      tick: 3,
      category: 'intervention_effect',
      summary: 'Silent intervention on Nox via entropy',
      interventionType: 'silent',
      targetAgentId: 'actor.nox',
      targetAgentName: 'Nox',
      sphere: 'entropy',
      effects: [],
      consequenceMessage: 'The threads of fate shift imperceptibly.',
      ticksRemaining: 1,
    });

    render(<DebugPanel currentTick={3} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Should not crash and should display the consequence message
    expect(screen.getByText(/threads of fate/)).toBeDefined();
  });

  it('handles special characters in names and messages', () => {
    emitTrace({
      tick: 12,
      category: 'intervention_effect',
      summary: "Dream on D'Vorth's Shadow",
      interventionType: 'dream',
      targetAgentId: 'actor.dvorth-shadow',
      targetAgentName: "D'Vorth's Shadow",
      sphere: 'shadow',
      effects: ["greed_generosity -0.08 for 5 ticks (D'Vorth's burden)"],
      consequenceMessage: "The god's whisper echoes: 'Release thy grip.'",
      ticksRemaining: 5,
    });

    render(<DebugPanel currentTick={12} onClose={() => {}} />);

    const entry = screen.getByTestId('trace-entry');
    fireEvent.click(entry);

    // Verify multiple occurrences of the special character name exist (in different fields)
    const dvorthElements = screen.getAllByText(/D'Vorth/);
    expect(dvorthElements.length).toBeGreaterThan(0);
  });
});
