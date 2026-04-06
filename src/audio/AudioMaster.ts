/**
 * Global mute/unmute across all three audio channels.
 * Used by the settings panel master mute toggle.
 */
import { toggleMusicMute, isMusicMuted } from './MusicChannel';
import { muteBackground, unmuteBackground, isBackgroundMuted } from './BackgroundChannel';
import { muteUi, unmuteUi, isUiMuted } from './UiChannel';

export function muteAll(): void {
  if (!isMusicMuted()) toggleMusicMute();
  muteBackground();
  muteUi();
}

export function unmuteAll(): void {
  if (isMusicMuted()) toggleMusicMute();
  unmuteBackground();
  unmuteUi();
}

export function isAllMuted(): boolean {
  return isMusicMuted() && isBackgroundMuted() && isUiMuted();
}
