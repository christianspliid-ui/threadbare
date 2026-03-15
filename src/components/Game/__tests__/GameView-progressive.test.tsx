// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';

describe('GameView Progressive Disclosure (AgentInfoCard + AgentProfileModal)', () => {
  const mockArchetype: AscendantArchetype = {
    id: 'seeker',
    name: 'The Seeker',
    title: 'The Seeker',
    description: 'A seeking god',
    sphereAlignment: {
      primary: 'light',
      secondary: 'chaos',
    },
    startingDomainAffinities: {
      iron: 0.5,
      gold: 0.5,
    },
    personalitySeed: {
      ambition_contentment: 0.5,
      courage_prudence: 0.5,
      cruelty_compassion: 0.5,
      cunning_honesty: 0.5,
      devotion_independence: 0.5,
      loyalty_treachery: 0.5,
      tradition_innovation: 0.5,
      dominance_humility: 0.5,
      wrath_patience: 0.5,
      greed_generosity: 0.5,
    },
    flavorText: 'A seeking god',
  };

  const mockCosmology: CosmologyProfile = {
    force: 0.5,
    matter: 0.5,
    energy: 0.5,
    life: 0.5,
    mind: 0.5,
    spirit: 0.5,
    time: 0.5,
    entropy: 0.5,
  };

  const props = {
    archetype: mockArchetype,
    avatarName: 'Test Avatar',
    cosmology: mockCosmology,
    seed: 42,
  };

  it('renders retinue panel by default (no agent selected)', () => {
    const { container } = render(<GameView {...props} />);
    const rightSidebar = container.querySelector('[data-testid="right-sidebar"]');
    expect(rightSidebar).toBeInTheDocument();
    // Should show retinue panel or "No agents" message initially
    expect(rightSidebar?.textContent).toMatch(/Retinue|No agents/);
  });

  it('verifies right sidebar does not show agent profile modal initially', () => {
    render(<GameView {...props} />);
    // AgentProfileModal should not be in the DOM initially
    const profileModal = screen.queryByRole('dialog');
    expect(profileModal).toBeNull();
  });
});
