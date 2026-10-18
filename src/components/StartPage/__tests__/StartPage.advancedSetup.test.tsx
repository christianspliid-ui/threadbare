// @vitest-environment jsdom
/**
 * THR-1978 — the title screen's "Advanced World Setup" link starts a run with no
 * ascendant identity, so Meet The First never opens and the player has no First.
 * It is a dev surface (like the UL entry, THR-1601): a player build never shows it.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../useThemeMusic', () => ({
  useThemeMusic: () => ({
    play: () => {},
    fadeOut: () => Promise.resolve(),
    muted: false,
    toggleMute: () => {},
    setVolume: () => {},
  }),
}));

import { StartPage } from '../StartPage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('THR-1978 — Advanced World Setup is a dev-build surface', () => {
  it('a player build shows New World and no Advanced World Setup link', () => {
    vi.stubEnv('DEV', false);
    render(<StartPage onNewWorld={() => {}} onAdvancedNewWorld={() => {}} />);
    expect(screen.getByText('New World')).toBeTruthy();
    expect(screen.queryByText('Advanced World Setup')).toBeNull();
  });

  it('a dev build keeps the link', () => {
    vi.stubEnv('DEV', true);
    render(<StartPage onNewWorld={() => {}} onAdvancedNewWorld={() => {}} />);
    expect(screen.getByText('Advanced World Setup')).toBeTruthy();
  });
});
