// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EncounterLog } from '../EncounterLog';
import type { EncounterProgress } from '../../../types/encounter';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

const mockTemplate: UnifiedActionTemplate = {
  id: 'encounter.test_quest',
  name: 'Test Quest',
  intrinsicTier: 'background',
  rarityTier: 2,
  reach: 'eye',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 2 },
      difficulty: 0.35,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    },
    {
      reach: 'iron',
      duration: { min: 1, max: 2 },
      difficulty: 0.45,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    },
  ],
  narrativeTemplates: {
    initiation: 'You approach the ruins...',
    success: 'You succeed!',
    failure: 'You fail...',
  },
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

  it('renders threat rating badge derived from rarityTier', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    // rarityTier 2 → 'moderate' per RARITY_TO_THREAT
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
    const dots = document.querySelectorAll('[class*="w-2 h-2"]');
    expect(dots.length).toBe(2);
  });

  it('renders current step label', () => {
    render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('Step 1')).toBeTruthy();
  });

  it('renders active status indicator', () => {
    const { container } = render(
      <EncounterLog
        progress={mockProgress}
        template={mockTemplate}
        agentName="Kael"
      />
    );
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

  it('renders step label at non-zero index', () => {
    const progressStep2 = { ...mockProgress, currentEncounterIndex: 1 };
    render(
      <EncounterLog
        progress={progressStep2}
        template={mockTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('Step 2')).toBeTruthy();
  });

  it('renders different threat ratings from rarityTier', () => {
    // rarityTier 3 → 'hard'
    const hardTemplate = { ...mockTemplate, rarityTier: 3 as const };
    render(
      <EncounterLog
        progress={mockProgress}
        template={hardTemplate}
        agentName="Kael"
      />
    );
    expect(screen.getByText('hard')).toBeTruthy();

    // rarityTier 1 → 'trivial'
    const trivialTemplate = { ...mockTemplate, rarityTier: 1 as const };
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
