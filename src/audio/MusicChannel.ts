/**
 * Module-level music channel singleton.
 * Replaces themeAudio.ts — same fade/mute/play/pause API plus track swapping for encounters.
 * Lives outside React so it survives component mounts/unmounts.
 */
import {
  MUSIC_VOLUME_DEFAULT, MUSIC_FADE_IN_MS, MUSIC_FADE_OUT_MS,
  MUSIC_MUTE_KEY, LEGACY_MUSIC_MUTE_KEY, MUSIC_SRC_DEFAULT,
} from './audioConstants';

let audio: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let currentSrc = MUSIC_SRC_DEFAULT;

function clearFade(): void {
  if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(currentSrc);
    audio.loop = true;
    audio.volume = 0;
    audio.muted = isMusicMuted();
  }
  return audio;
}

export function playMusic(): void {
  const a = getAudio();
  if (!a.paused) return;
  a.volume = 0;
  a.play().catch(() => {});
  clearFade();
  const stepInterval = 50;
  const steps = MUSIC_FADE_IN_MS / stepInterval;
  const increment = MUSIC_VOLUME_DEFAULT / steps;
  fadeInterval = setInterval(() => {
    if (!audio) { clearFade(); return; }
    if (audio.volume >= MUSIC_VOLUME_DEFAULT - increment) {
      audio.volume = MUSIC_VOLUME_DEFAULT;
      clearFade();
    } else {
      audio.volume = Math.min(audio.volume + increment, MUSIC_VOLUME_DEFAULT);
    }
  }, stepInterval);
}

export function resumeMusic(): void {
  const a = getAudio();
  if (!a.paused) return;
  if (a.volume <= 0.01) a.volume = MUSIC_VOLUME_DEFAULT;
  a.play().catch(() => {});
}

export function fadeOutMusic(): Promise<void> {
  const a = audio;
  if (!a || a.paused) return Promise.resolve();
  const startVolume = a.volume;
  if (startVolume <= 0) { a.pause(); return Promise.resolve(); }
  clearFade();
  return new Promise<void>((resolve) => {
    const stepInterval = 50;
    const steps = MUSIC_FADE_OUT_MS / stepInterval;
    const decrement = startVolume / steps;
    fadeInterval = setInterval(() => {
      if (!audio) { clearFade(); resolve(); return; }
      if (audio.volume <= decrement + 0.01) {
        audio.volume = 0; audio.pause(); clearFade(); resolve();
      } else {
        audio.volume = Math.max(0, audio.volume - decrement);
      }
    }, stepInterval);
  });
}

export function isMusicPlaying(): boolean {
  return audio !== null && !audio.paused;
}

export function isMusicMuted(): boolean {
  const explicit = localStorage.getItem(MUSIC_MUTE_KEY);
  if (explicit !== null) return explicit === 'true';
  return localStorage.getItem(LEGACY_MUSIC_MUTE_KEY) === 'true';
}

export function toggleMusicMute(): boolean {
  const next = !isMusicMuted();
  localStorage.setItem(MUSIC_MUTE_KEY, String(next));
  const a = getAudio();
  a.muted = next;
  if (!next && a.paused) {
    a.volume = MUSIC_VOLUME_DEFAULT;
    a.play().catch(() => {});
  }
  return next;
}

export function setMusicVolume(v: number): void {
  const clamped = Math.max(0, Math.min(1, v));
  if (audio && !audio.muted) audio.volume = clamped;
}

export function getMusicVolume(): number {
  return audio?.volume ?? MUSIC_VOLUME_DEFAULT;
}

export function swapMusicTrack(src: string): void {
  currentSrc = src;
  if (!audio) return;
  const wasPlaying = !audio.paused;
  const vol = audio.volume;
  audio.pause();
  audio = new Audio(src);
  audio.loop = true;
  audio.volume = vol;
  audio.muted = isMusicMuted();
  if (wasPlaying) audio.play().catch(() => {});
}

export function restoreMusicDefault(): void {
  swapMusicTrack(MUSIC_SRC_DEFAULT);
}
