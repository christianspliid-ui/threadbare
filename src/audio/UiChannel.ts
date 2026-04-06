/**
 * Fire-and-forget UI sound effects channel.
 * Maintains a small pool of HTMLAudioElement instances per key.
 * play(key) fires immediately and returns — no await needed.
 */
import { UI_VOLUME_DEFAULT, UI_MUTE_KEY } from './audioConstants';

const SRC_MAP: Record<string, string> = {
  click:   '/audio/ui/click.mp3',
  confirm: '/audio/ui/confirm.mp3',
  cancel:  '/audio/ui/cancel.mp3',
};

const pools = new Map<string, HTMLAudioElement[]>();
let _volume: number = UI_VOLUME_DEFAULT;
let _muted: boolean | null = null;

function getMuted(): boolean {
  if (_muted === null) _muted = localStorage.getItem(UI_MUTE_KEY) === 'true';
  return _muted;
}

function getOrCreate(key: string): HTMLAudioElement | null {
  const src = SRC_MAP[key];
  if (!src) return null;
  const pool = pools.get(key) ?? [];
  const free = pool.find(a => a.ended || a.paused);
  if (free) { free.currentTime = 0; return free; }
  const el = new Audio(src);
  el.volume = getMuted() ? 0 : _volume;
  pool.push(el);
  pools.set(key, pool);
  return el;
}

export function playUi(key: string): void {
  const el = getOrCreate(key);
  if (!el) return;
  el.volume = getMuted() ? 0 : _volume;
  el.play().catch(() => {});
}

export function setUiVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  for (const pool of pools.values())
    for (const el of pool) if (!getMuted()) el.volume = _volume;
}

export function getUiVolume(): number { return _volume; }

export function muteUi(): void {
  _muted = true;
  localStorage.setItem(UI_MUTE_KEY, 'true');
  for (const pool of pools.values())
    for (const el of pool) el.volume = 0;
}

export function unmuteUi(): void {
  _muted = false;
  localStorage.setItem(UI_MUTE_KEY, 'false');
  for (const pool of pools.values())
    for (const el of pool) el.volume = _volume;
}

export function isUiMuted(): boolean { return getMuted(); }

/** Reset all pool state — only used in tests. */
export function __resetUiChannel(): void {
  pools.clear();
  _muted = null;
}
