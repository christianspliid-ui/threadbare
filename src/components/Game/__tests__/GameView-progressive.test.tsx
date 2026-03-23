// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';

// Mock HexMapV2 to avoid canvas initialization in jsdom
vi.mock('../../HexMapV2/HexMapV2', () => ({
  default: vi.fn().mockReturnValue(null),
}));

// Mock theme audio to avoid HTMLAudioElement issues in jsdom
vi.mock('../../../audio/themeAudio', () => ({
  resumeTheme: vi.fn(),
  fadeOutTheme: vi.fn().mockResolvedValue(undefined),
  playTheme: vi.fn(),
  setMuted: vi.fn(),
  isMuted: vi.fn().mockReturnValue(false),
}));
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
      loyalty_ambition: 0.5,
      courage_prudence: 0.5,
      mercy_ruthlessness: 0.5,
      honesty_cunning: 0.5,
      sacrifice_survival: 0.5,
      loyalty_ambition: 0.5,
      tradition_novelty: 0.5,
      humility_pride: 0.5,
      mercy_ruthlessness: 0.5,
      asceticism_extravagance: 0.5,
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
