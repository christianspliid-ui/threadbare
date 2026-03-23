// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('useThemeMusic', () => {
  it.todo('returns play, fadeOut, muted, toggleMute'); // SC-4
  it.todo('play() calls audio.play()');                // SC-4
  it.todo('fadeOut() returns a Promise');               // SC-4
  it.todo('toggleMute persists to localStorage');      // SC-4
  it.todo('reads initial mute state from localStorage'); // SC-4
  it.todo('setVolume clamps between 0 and 1');         // SC-4
});
