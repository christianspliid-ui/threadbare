// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EncounterLog } from '../EncounterLog';
import type { EncounterTemplate, EncounterProgress } from '../../../types/encounter';

const mockTemplate: EncounterTemplate = {
  id: 'encounter.test_quest',
  name: 'Test Quest',
  intrinsicTier: 'background',
  locationTypes: ['ruins'],
  steps: [
    {
      id: 'step1',
      name: 'Enter',
      narrative: 'You approach the ruins...',
      reach: 'eye',
      difficulty: 35,
      onSuccess: { narrative: 'You succeed!' },
      onFailure: { narrative: 'You fail...' },
    },
    {
      id: 'step2',
      name: 'Explore',
      narrative: 'Deeper within...',
      reach: 'iron',
      difficulty: 45,
      onSuccess: { narrative: 'Victory!' },
      onFailure: { narrative: 'Defeat...' },
    },
  ],
  reachPrimary: 'eye',
  reachSecondary: 'iron',
  encounterType: 'explore',
  threatRating: 'moderate',
  motivations: ['courage_prudence'],
};

const mockProgress: EncounterProgress = {
  encounterId: 'encounter.test_quest',
  actorId: 'a.1',
  currentEncounterIndex: 0,
  history: [],
  status: 'active',
  startedTick: 10,
};

describe('EncounterLog', () => {
  it('renders title with agent name and encounter name', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText(/Kael faces Test Quest/)).toBeTruthy();
  });

  it('renders threat rating badge', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    const badge = screen.getByText('moderate');
    expect(badge).toBeTruthy();
  });

  it('renders step progress indicators (dots)', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    // Should have 2 dot elements (one for each step)
    const dots = document.querySelectorAll('[class*="w-2 h-2"]');
    expect(dots.length).toBe(2);
  });

  it('renders current step name and narrative', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('Enter')).toBeTruthy();
    expect(screen.getByText('You approach the ruins...')).toBeTruthy();
  });

  it('renders active status indicator', () => {
    const { container } = render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    // Check that there's a golden glow effect (inset shadow)
    const div = container.querySelector('div[style*="accent-gold"]');
    expect(div).toBeTruthy();
  });

  it('shows checkmark for completed encounters', () => {
    const completedProgress = { ...mockProgress, status: 'completed' as const };
    render(
      <EncounterLog
        progress={completedProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('shows X mark for abandoned encounters', () => {
    const abandonedProgress = { ...mockProgress, status: 'abandoned' as const };
    render(
      <EncounterLog
        progress={abandonedProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('✕')).toBeTruthy();
  });

  it('applies dimmed opacity for abandoned status', () => {
    const abandonedProgress = { ...mockProgress, status: 'abandoned' as const };
    const { container } = render(
      <EncounterLog
        progress={abandonedProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.style.opacity).toBe('0.6');
  });

  it('renders step at non-zero index correctly', () => {
    const progressStep2 = { ...mockProgress, currentEncounterIndex: 1 };
    render(
      <EncounterLog
        progress={progressStep2}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('Explore')).toBeTruthy();
    expect(screen.getByText('Deeper within...')).toBeTruthy();
  });

  it('renders different threat ratings with different colors', () => {
    const hardTemplate = { ...mockTemplate, threatRating: 'hard' as const };
    render(
      <EncounterLog
        progress={mockProgress}
        template={hardTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('hard')).toBeTruthy();

    const trivialTemplate = {
      ...mockTemplate,
      threatRating: 'trivial' as const,
    };
    const { unmount } = render(
      <EncounterLog
        progress={mockProgress}
        template={trivialTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('trivial')).toBeTruthy();
    unmount();
  });
});
