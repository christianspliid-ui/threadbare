// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';

// Mock HexMapV2 to avoid canvas initialization in jsdom
vi.mock('../../HexMapV2/HexMapV2', () => ({
  default: vi.fn().mockReturnValue(null),
}));

// Mock audio modules to avoid HTMLAudioElement issues in jsdom
vi.mock('../../../audio/MusicChannel', () => ({
  resumeMusic: vi.fn(),
  fadeOutMusic: vi.fn().mockResolvedValue(undefined),
  playMusic: vi.fn(),
  setMuted: vi.fn(),
  isMuted: vi.fn().mockReturnValue(false),
  getMusicVolume: vi.fn().mockReturnValue(0.4),
  setMusicVolume: vi.fn(),
  isMusicMuted: vi.fn().mockReturnValue(false),
  toggleMusicMute: vi.fn(),
  swapMusicTrack: vi.fn(),
  restoreMusicDefault: vi.fn(),
}));
vi.mock('../../../audio/BackgroundChannel', () => ({
  pushAmbient: vi.fn(),
  popAmbient: vi.fn(),
  getBackgroundVolume: vi.fn().mockReturnValue(0.35),
  setBackgroundVolume: vi.fn(),
  isBackgroundMuted: vi.fn().mockReturnValue(false),
  muteBackground: vi.fn(),
  unmuteBackground: vi.fn(),
}));
vi.mock('../../../audio/UiChannel', () => ({
  playUi: vi.fn(),
  getUiVolume: vi.fn().mockReturnValue(0.6),
  setUiVolume: vi.fn(),
  isUiMuted: vi.fn().mockReturnValue(false),
  muteUi: vi.fn(),
  unmuteUi: vi.fn(),
}));
vi.mock('../../../audio/AudioMaster', () => ({
  muteAll: vi.fn(),
  unmuteAll: vi.fn(),
  isAllMuted: vi.fn().mockReturnValue(false),
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
    // ThreadsPanel replaced RetinuePanel in Phase 16-01
    expect(rightSidebar?.textContent).toMatch(/Threads|No agents|Agents/);
  });

  it('verifies right sidebar does not show agent profile modal initially', () => {
    render(<GameView {...props} />);
    // AgentProfileModal should not be in the DOM initially
    const profileModal = screen.queryByRole('dialog');
    expect(profileModal).toBeNull();
  });
});
