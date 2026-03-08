import { describe, it, expect } from 'vitest';
import { UI_TOOLTIPS, getUITooltip } from '../ui-content';

describe('UI_TOOLTIPS', () => {
  it('has entries for all core HUD elements', () => {
    const requiredKeys = [
      'ui.doom_bar',
      'ui.essence_panel',
      'ui.mandate_tracker',
      'ui.avatar_move',
      'ui.avatar_wheel',
      'ui.avatar_scry',
      'ui.sim_play_pause',
      'ui.sim_speed',
      'ui.rival_panel',
    ];
    for (const key of requiredKeys) {
      expect(UI_TOOLTIPS[key], `Missing tooltip for ${key}`).toBeDefined();
      expect(UI_TOOLTIPS[key].label.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty label', () => {
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      expect(entry.label.length, `${key} has empty label`).toBeGreaterThan(0);
    }
  });

  it('descriptions that contain {{links}} use valid format', () => {
    const linkPattern = /\{\{([a-z_]+\.[a-z0-9_.]+)\}\}/g;
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (entry.desc) {
        const matches = [...entry.desc.matchAll(linkPattern)];
        for (const match of matches) {
          const prefix = match[1].split('.')[0];
          const validPrefixes = ['sphere', 'doom', 'ui', 'archetype', 'reach', 'terrain', 'mandate'];
          expect(validPrefixes, `${key} has link with unknown prefix: ${prefix}`).toContain(prefix);
        }
      }
    }
  });
});

describe('getUITooltip', () => {
  it('returns content for known ID', () => {
    const result = getUITooltip('ui.doom_bar');
    expect(result).not.toBeNull();
    expect(result!.label).toBeTruthy();
  });

  it('returns null for unknown ID', () => {
    expect(getUITooltip('ui.nonexistent')).toBeNull();
  });
});
