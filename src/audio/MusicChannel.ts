/**
 * Module-level music channel singleton.
 * Replaces themeAudio.ts — same fade/mute/play/pause API plus track swapping for encounters.
 * Lives outside React so it survives component mounts/unmounts.
 *
 * Playlist mode: when MUSIC_TRACKS has entries, shuffles through them
 * instead of looping a single track. Encounter overrides temporarily
 * replace the playlist; restoreMusicDefault resumes it.
 */
import {
  MUSIC_VOLUME_DEFAULT, MUSIC_FADE_IN_MS, MUSIC_FADE_OUT_MS,
  MUSIC_MUTE_KEY, LEGACY_MUSIC_MUTE_KEY, MUSIC_SRC_DEFAULT, MUSIC_TRACKS,
} from './audioConstants';

let audio: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let currentSrc = MUSIC_SRC_DEFAULT;

/** Shuffled playlist order. Rebuilt when exhausted. */
let playlist: string[] = [];
let playlistIndex = 0;
/** True when an encounter override is active — playlist advancing is paused. */
let overrideActive = false;

function shufflePlaylist(): void {
  playlist = [...MUSIC_TRACKS];
  // Fisher-Yates shuffle
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  playlistIndex = 0;
}

function nextPlaylistTrack(): string {
  if (playlist.length === 0 || playlistIndex >= playlist.length) {
    shufflePlaylist();
  }
  return playlist[playlistIndex++];
}

function usePlaylist(): boolean {
  return MUSIC_TRACKS.length > 1;
}

function onTrackEnded(): void {
  if (overrideActive || !usePlaylist() || !audio) return;
  const nextSrc = nextPlaylistTrack();
  currentSrc = nextSrc;
  audio.src = nextSrc;
  audio.play().catch(() => {});
}

function clearFade(): void {
  if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    if (usePlaylist()) {
      currentSrc = nextPlaylistTrack();
    }
    audio = new Audio(currentSrc);
    audio.loop = !usePlaylist();
    audio.volume = 0;
    audio.muted = isMusicMuted();
    audio.addEventListener('ended', onTrackEnded);
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
  overrideActive = true;
  currentSrc = src;
  if (!audio) return;
  const wasPlaying = !audio.paused;
  const vol = audio.volume;
  audio.removeEventListener('ended', onTrackEnded);
  audio.pause();
  audio = new Audio(src);
  audio.loop = true;
  audio.volume = vol;
  audio.muted = isMusicMuted();
  if (wasPlaying) audio.play().catch(() => {});
}

export function restoreMusicDefault(): void {
  overrideActive = false;
  if (!audio) return;
  const wasPlaying = !audio.paused;
  const vol = audio.volume;
  audio.removeEventListener('ended', onTrackEnded);
  audio.pause();

  if (usePlaylist()) {
    currentSrc = nextPlaylistTrack();
  } else {
    currentSrc = MUSIC_SRC_DEFAULT;
  }

  audio = new Audio(currentSrc);
  audio.loop = !usePlaylist();
  audio.volume = vol;
  audio.muted = isMusicMuted();
  audio.addEventListener('ended', onTrackEnded);
  if (wasPlaying) audio.play().catch(() => {});
}
