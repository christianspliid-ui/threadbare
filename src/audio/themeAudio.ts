/**
 * Module-level audio singleton for theme music.
 *
 * Lives outside React so it survives component mounts/unmounts.
 * StartPage calls play(), GameView inherits the playing audio.
 * Mute state persists to localStorage.
 */
import {
  THEME_MUSIC_SRC,
  THEME_VOLUME_DEFAULT,
  THEME_FADE_IN_MS,
  THEME_FADE_OUT_MS,
  THEME_MUTE_STORAGE_KEY,
} from '../components/StartPage/startPageConstants';

let audio: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(THEME_MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0;
    audio.muted = localStorage.getItem(THEME_MUTE_STORAGE_KEY) === 'true';
  }
  return audio;
}

/** Clear any running fade interval. */
function clearFade(): void {
  if (fadeInterval !== null) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

/** Start playback with fade-in. Must be called from a user interaction handler. */
export function playTheme(): void {
  const a = getAudio();
  if (!a.paused) return; // already playing

  a.volume = 0;
  a.play().catch(() => {
    // Swallow autoplay rejection — user interaction may not have fired yet
  });

  clearFade();
  const stepInterval = 50;
  const steps = THEME_FADE_IN_MS / stepInterval;
  const increment = THEME_VOLUME_DEFAULT / steps;
  fadeInterval = setInterval(() => {
    if (!audio) {
      clearFade();
      return;
    }
    if (audio.volume >= THEME_VOLUME_DEFAULT - increment) {
      audio.volume = THEME_VOLUME_DEFAULT;
      clearFade();
    } else {
      audio.volume = Math.min(audio.volume + increment, THEME_VOLUME_DEFAULT);
    }
  }, stepInterval);
}

/** Resume playback if paused (e.g., after navigating to game view). No fade-in if already at volume. */
export function resumeTheme(): void {
  const a = getAudio();
  if (!a.paused) return; // already playing

  // Resume at the current volume (or default if it was faded to 0)
  if (a.volume <= 0.01) {
    a.volume = THEME_VOLUME_DEFAULT;
  }
  a.play().catch(() => {
    // Swallow autoplay rejection
  });
}

/** Fade out and pause. Returns a promise that resolves when done. */
export function fadeOutTheme(): Promise<void> {
  const a = audio;
  if (!a || a.paused) return Promise.resolve();

  const startVolume = a.volume;
  if (startVolume <= 0) {
    a.pause();
    return Promise.resolve();
  }

  clearFade();
  return new Promise<void>((resolve) => {
    const stepInterval = 50;
    const steps = THEME_FADE_OUT_MS / stepInterval;
    const decrement = startVolume / steps;

    fadeInterval = setInterval(() => {
      if (!audio) {
        clearFade();
        resolve();
        return;
      }
      if (audio.volume <= decrement + 0.01) {
        audio.volume = 0;
        audio.pause();
        clearFade();
        resolve();
      } else {
        audio.volume = Math.max(0, audio.volume - decrement);
      }
    }, stepInterval);
  });
}

/** Check if theme is currently playing. */
export function isThemePlaying(): boolean {
  return audio !== null && !audio.paused;
}

/** Get current muted state. */
export function isThemeMuted(): boolean {
  return localStorage.getItem(THEME_MUTE_STORAGE_KEY) === 'true';
}

/** Toggle mute and persist to localStorage. Returns new muted state. */
export function toggleThemeMute(): boolean {
  const next = !isThemeMuted();
  localStorage.setItem(THEME_MUTE_STORAGE_KEY, String(next));
  if (audio) {
    audio.muted = next;
  }
  return next;
}

/** Set volume (0–1). */
export function setThemeVolume(v: number): void {
  const clamped = Math.max(0, Math.min(1, v));
  if (audio && !audio.muted) {
    audio.volume = clamped;
  }
}
