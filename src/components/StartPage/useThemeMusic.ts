import { useState, useRef, useEffect } from 'react';
import {
  THEME_VOLUME_DEFAULT,
  THEME_FADE_IN_MS,
  THEME_FADE_OUT_MS,
  THEME_MUTE_STORAGE_KEY,
} from './startPageConstants';

/**
 * useThemeMusic — manages HTMLAudioElement lifecycle for the start screen.
 *
 * - play() must be called from a user interaction handler (not on mount) due to browser autoplay policy
 * - fadeOut() returns Promise<void> that resolves when volume reaches 0 — survives unmount
 * - muted state persists to localStorage under THEME_MUTE_STORAGE_KEY
 */
export function useThemeMusic(src: string): {
  play: () => void;
  fadeOut: () => Promise<void>;
  muted: boolean;
  toggleMute: () => void;
  setVolume: (v: number) => void;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize muted state from localStorage before first render
  const [muted, setMuted] = useState<boolean>(
    () => localStorage.getItem(THEME_MUTE_STORAGE_KEY) === 'true',
  );

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0; // will fade in when play() is called
    audio.muted = localStorage.getItem(THEME_MUTE_STORAGE_KEY) === 'true';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src]);

  function play(): void {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().catch(() => {
      // Swallow autoplay rejection — user interaction may not have fired yet
    });

    // Fade in from 0 to THEME_VOLUME_DEFAULT over THEME_FADE_IN_MS
    const stepInterval = 50;
    const steps = THEME_FADE_IN_MS / stepInterval;
    const increment = THEME_VOLUME_DEFAULT / steps;
    const intervalId = setInterval(() => {
      const a = audioRef.current;
      if (!a) {
        clearInterval(intervalId);
        return;
      }
      if (a.volume >= THEME_VOLUME_DEFAULT - increment) {
        a.volume = THEME_VOLUME_DEFAULT;
        clearInterval(intervalId);
      } else {
        a.volume = Math.min(a.volume + increment, THEME_VOLUME_DEFAULT);
      }
    }, stepInterval);
  }

  function fadeOut(): Promise<void> {
    const audio = audioRef.current;
    if (!audio || audio.paused) {
      return Promise.resolve();
    }

    const startVolume = audio.volume;
    // If already at 0, resolve immediately
    if (startVolume <= 0) {
      audio.pause();
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const stepInterval = 50;
      const steps = THEME_FADE_OUT_MS / stepInterval;
      const decrement = startVolume / steps;

      // NOTE: interval stored in plain closure variable (not ref) so it survives unmount
      const intervalId = setInterval(() => {
        const a = audioRef.current;
        if (!a) {
          clearInterval(intervalId);
          resolve();
          return;
        }
        if (a.volume <= decrement + 0.01) {
          a.volume = 0;
          a.pause();
          clearInterval(intervalId);
          resolve();
        } else {
          a.volume = Math.max(0, a.volume - decrement);
        }
      }, stepInterval);
    });
  }

  function toggleMute(): void {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(THEME_MUTE_STORAGE_KEY, String(next));
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  }

  function setVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current && !audioRef.current.muted) {
      audioRef.current.volume = clamped;
    }
  }

  return { play, fadeOut, muted, toggleMute, setVolume };
}
