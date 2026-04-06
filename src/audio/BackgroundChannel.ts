/**
 * Context-driven ambient channel with priority stack and crossfade.
 * Priority 0 = terrain (always active), 1 = chronicle, 2 = location detail, 3 = encounter.
 * Higher priority wins. When popped, lower priority resumes with crossfade.
 */
import {
  BACKGROUND_VOLUME_DEFAULT, AMBIENT_CROSSFADE_MS,
  BACKGROUND_MUTE_KEY, AMBIENT_TRACKS,
} from './audioConstants';

/** priority → sound key */
const stack = new Map<number, string>();
let currentAudio: HTMLAudioElement | null = null;
let currentKey: string | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let _volume: number = BACKGROUND_VOLUME_DEFAULT;
let _muted: boolean | null = null;

function getMuted(): boolean {
  if (_muted === null) _muted = localStorage.getItem(BACKGROUND_MUTE_KEY) === 'true';
  return _muted;
}

function clearFade(): void {
  if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
}

function pickFile(key: string): string | null {
  const tracks = AMBIENT_TRACKS[key];
  if (!tracks || tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)]!;
}

function startInTrack(key: string, src: string, fadeDurationMs: number): void {
  const stepInterval = 50;
  const inAudio = new Audio(src);
  inAudio.loop = true;
  inAudio.volume = 0;
  inAudio.muted = getMuted();
  inAudio.play().catch(() => {});
  currentAudio = inAudio;
  const steps = fadeDurationMs / stepInterval;
  const increment = steps > 0 ? _volume / steps : _volume;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    if (!inAudio || key !== currentKey) { clearFade(); return; }
    inAudio.volume = Math.min(_volume, increment * step);
    if (step >= steps) { inAudio.volume = _volume; clearFade(); }
  }, stepInterval);
}

function crossfadeTo(key: string): void {
  if (key === currentKey) return;
  const halfMs = AMBIENT_CROSSFADE_MS / 2;
  const stepInterval = 50;
  const src = pickFile(key);
  currentKey = key;

  const outAudio = currentAudio;
  clearFade();

  if (!outAudio || outAudio.paused || outAudio.volume <= 0) {
    if (src) startInTrack(key, src, halfMs);
    else { currentAudio = null; }
    return;
  }

  // Fade out current, then fade in new
  const startVol = outAudio.volume;
  const steps = halfMs / stepInterval;
  const decrement = steps > 0 ? startVol / steps : startVol;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    outAudio.volume = Math.max(0, startVol - decrement * step);
    if (step >= steps) {
      outAudio.pause();
      clearFade();
      if (src && key === currentKey) startInTrack(key, src, halfMs);
      else currentAudio = null;
    }
  }, stepInterval);
}

function resolveTop(): string | null {
  if (stack.size === 0) return null;
  return stack.get(Math.max(...stack.keys())) ?? null;
}

export function pushAmbient(priority: number, key: string): void {
  stack.set(priority, key);
  const top = resolveTop();
  if (top) crossfadeTo(top);
}

export function popAmbient(priority: number): void {
  stack.delete(priority);
  const top = resolveTop();
  if (top) {
    crossfadeTo(top);
    return;
  }
  // No entries left — fade out and stop
  const out = currentAudio;
  currentKey = null;
  clearFade();
  if (!out || out.paused) { currentAudio = null; return; }
  const stepInterval = 50;
  const halfMs = AMBIENT_CROSSFADE_MS / 2;
  const steps = halfMs / stepInterval;
  const startVol = out.volume;
  const decrement = steps > 0 ? startVol / steps : startVol;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    out.volume = Math.max(0, startVol - decrement * step);
    if (step >= steps) { out.pause(); currentAudio = null; clearFade(); }
  }, stepInterval);
}

export function setBackgroundVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  if (currentAudio && !getMuted()) currentAudio.volume = _volume;
}

export function getBackgroundVolume(): number { return _volume; }

export function muteBackground(): void {
  _muted = true;
  localStorage.setItem(BACKGROUND_MUTE_KEY, 'true');
  if (currentAudio) currentAudio.muted = true;
}

export function unmuteBackground(): void {
  _muted = false;
  localStorage.setItem(BACKGROUND_MUTE_KEY, 'false');
  if (currentAudio) currentAudio.muted = false;
}

export function isBackgroundMuted(): boolean { return getMuted(); }
