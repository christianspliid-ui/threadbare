// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';
import { disableTracing, clearTraces } from '../../../engine/traceBuffer';

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

  it('shows Debug toggle button in top bar', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByTestId('debug-toggle')).toBeTruthy();
  });

  it('toggles debug panel with backtick keyboard shortcut', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('toggles debug panel with top-bar button click', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('debug-toggle'));
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    fireEvent.click(screen.getByTestId('debug-toggle'));
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('hides right sidebar when debug panel is open', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByTestId('right-sidebar')).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.queryByTestId('right-sidebar')).toBeNull();
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
  });

  it('changes debug button style when panel is active', () => {
    render(<GameView {...defaultProps} />);
    const btn = screen.getByTestId('debug-toggle');
    // Debug button uses gold color when active (now a ⚙ icon, no glowing dot)
    expect(btn).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    const activeBtn = screen.getByTestId('debug-toggle');
    expect(activeBtn).toBeTruthy();
  });
});
