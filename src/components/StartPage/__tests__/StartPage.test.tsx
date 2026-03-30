// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('StartPage', () => {
  it.todo('renders title text THREADBEARER');          // SC-1
  it.todo('renders lore fragment');                    // SC-1
  it.todo('renders menu items: New World, Settings, Credits'); // SC-1
  it.todo('does not render Continue menu item');       // SC-1
  it.todo('renders mute toggle button');               // SC-1
  it.todo('renders version stamp');                    // SC-1
  it.todo('calls onNewWorld when New World is clicked'); // SC-2
  it.todo('degrades gracefully when bg image fails');  // SC-6
});

describe('SettingsModal', () => {
  it.todo('renders volume slider');                    // SC-5
  it.todo('renders fog default toggle');               // SC-5
  it.todo('renders version display');                  // SC-5
  it.todo('volume slider calls onVolumeChange');       // SC-5
});

describe('CreditsModal', () => {
  it.todo('renders game title');                       // SC-5
  it.todo('renders technology credits');               // SC-5
  it.todo('renders closing lore line');                // SC-5
});
