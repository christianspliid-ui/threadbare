// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgendaPicker } from '../AgendaPicker';
import type { AgendaTemplate } from '../../../data/agenda-content';

const mockAgendas: AgendaTemplate[] = [
  {
    id: 'test_1',
    name: 'Whisper Ambition',
    valuePair: 'loyalty_ambition',
    valueDirection: 'left',
    narrativeHook: 'golden visions of conquest',
    behaviorTag: 'glory-seeking',
    reachBoost: { reach: 'iron', bonus: 0.25 },
    archetypeAffinities: ['conqueror'],
  },
  {
    id: 'test_2',
    name: 'Stir Compassion',
    valuePair: 'mercy_ruthlessness',
    valueDirection: 'right',
    narrativeHook: 'the suffering of the innocent',
    behaviorTag: 'mercy-seeking',
    reachBoost: { reach: 'heart', bonus: 0.25 },
    archetypeAffinities: ['healer'],
  },
];

describe('AgendaPicker', () => {
  it('renders agenda cards', () => {
    render(
      <AgendaPicker
        agendas={mockAgendas}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        sphere="force"
      />
    );
    expect(screen.getByText('Whisper Ambition')).toBeDefined();
    expect(screen.getByText('Stir Compassion')).toBeDefined();
  });

  it('shows narrative hook flavor text', () => {
    render(
      <AgendaPicker
        agendas={mockAgendas}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
        sphere="force"
      />
    );
    expect(screen.getByText(/golden visions/)).toBeDefined();
    expect(screen.getByText(/suffering of the innocent/)).toBeDefined();
  });

  it('calls onSelect with chosen agenda', () => {
    const onSelect = vi.fn();
    render(
      <AgendaPicker
        agendas={mockAgendas}
        onSelect={onSelect}
        onCancel={vi.fn()}
        sphere="force"
      />
    );
    fireEvent.click(screen.getByText('Whisper Ambition'));
    expect(onSelect).toHaveBeenCalledWith(mockAgendas[0]);
  });

  it('calls onCancel on Escape', () => {
    const onCancel = vi.fn();
    render(
      <AgendaPicker
        agendas={mockAgendas}
        onSelect={vi.fn()}
        onCancel={onCancel}
        sphere="force"
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel on backdrop click', () => {
    const onCancel = vi.fn();
    render(
      <AgendaPicker
        agendas={mockAgendas}
        onSelect={vi.fn()}
        onCancel={onCancel}
        sphere="force"
      />
    );
    const backdrop = screen.getByTestId('agenda-picker-backdrop');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });
});
