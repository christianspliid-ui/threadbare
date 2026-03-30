import { useState, useCallback } from 'react';
import {
  playTheme,
  fadeOutTheme,
  isThemeMuted,
  toggleThemeMute,
  setThemeVolume,
} from '../../audio/themeAudio';

/**
 * useThemeMusic — React wrapper around the module-level theme audio singleton.
 *
 * The audio element lives in themeAudio.ts (outside React) so it survives
 * component unmounts when transitioning from StartPage → Game.
 */
export function useThemeMusic(): {
  play: () => void;
  fadeOut: () => Promise<void>;
  muted: boolean;
  toggleMute: () => void;
  setVolume: (v: number) => void;
} {
  const [muted, setMuted] = useState<boolean>(isThemeMuted);

  const toggleMute = useCallback(() => {
    const next = toggleThemeMute();
    setMuted(next);
  }, []);

  return {
    play: playTheme,
    fadeOut: fadeOutTheme,
    muted,
    toggleMute,
    setVolume: setThemeVolume,
  };
}
