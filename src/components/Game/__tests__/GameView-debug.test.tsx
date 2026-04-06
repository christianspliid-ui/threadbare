// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';
import { disableTracing, clearTraces } from '../../../engine/traceBuffer';

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

describe('GameView debug panel integration', () => {
  const defaultProps = {
    archetype: {
      id: 'seeker',
      name: 'The Seeker',
      title: 'The Seeker',
      description: 'A seeking god',
      sphereAlignment: {
        primary: 'light' as const,
        secondary: 'chaos' as const,
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
    } as any,
    avatarName: 'Tester',
    cosmology: {
      force: 0.5,
      matter: 0.5,
      energy: 0.5,
      life: 0.5,
      mind: 0.5,
      spirit: 0.5,
      time: 0.5,
      entropy: 0.5,
    } as any,
    seed: 42,
  };

  beforeEach(() => {
    disableTracing();
    clearTraces();
  });

  it('does not show debug panel by default', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('shows Settings toggle button in top bar', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByTestId('settings-toggle')).toBeTruthy();
  });

  it('toggles debug panel with backtick keyboard shortcut', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('opens settings panel on gear icon click', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('settings-toggle'));
    expect(screen.getByRole('menu', { name: 'Settings' })).toBeTruthy();
  });

  it('hides right sidebar when debug panel is open', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByTestId('right-sidebar')).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.queryByTestId('right-sidebar')).toBeNull();
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
  });

  it('settings panel contains Display and Debug sections', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('settings-toggle'));
    expect(screen.getByText('Display')).toBeTruthy();
    expect(screen.getByText('Debug')).toBeTruthy();
    expect(screen.getByText('Fog of War')).toBeTruthy();
    expect(screen.getByText('Debug Trace Panel')).toBeTruthy();
    expect(screen.getByText('Organic Shore')).toBeTruthy();
  });
});
