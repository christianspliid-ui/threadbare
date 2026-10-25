import { describe, it, expect } from 'vitest';
import { UI_TOOLTIPS, getUITooltip } from '../ui-content';
import { SPINE_BEAT_PRESENTATION } from '../ascendant-beat-content';

describe('UI_TOOLTIPS', () => {
  it('has entries for all core HUD elements', () => {
    const requiredKeys = [
      'ui.doom_bar',
      'ui.essence_panel',
      'ui.mandate_tracker',
      'ui.avatar_move',
      'ui.your_cards',
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

// THR-2004 — mandates neither slow the Doom nor grant essence (a checkpoint kept well
// only softens the next stage's blow). No player text may promise otherwise.
describe('mandate texts promise only what the engine does', () => {
  // "slow slide" (the seat beat's Doom) is the clock's own pace, not a mandate's effect.
  const DOOM_SLOWING = /\bslow(s|ed|ing)? (the|it|its|down)\b|\bhold(s)? (it|the \w+) back|holds back/i;

  it('the mandate tooltips carry no doom-slowing claim', () => {
    for (const key of ['ui.mandate_tracker', 'ui.mandate_stage_culmination']) {
      expect(UI_TOOLTIPS[key].desc, key).not.toMatch(DOOM_SLOWING);
      expect(UI_TOOLTIPS[key].desc, key).not.toMatch(/essence/i);
    }
  });

  it('the essence tooltip does not name mandates as an income', () => {
    const desc = UI_TOOLTIPS['ui.essence_panel'].desc ?? '';
    expect(desc).not.toMatch(/mandate/i);
    expect(desc).toMatch(/threads/);
  });

  it('the seat beat does not say mandates hold the Doom back', () => {
    const text = JSON.stringify(SPINE_BEAT_PRESENTATION['beat.spine.the_seat']);
    expect(text).not.toMatch(DOOM_SLOWING);
    expect(text).toMatch(/blunts its blows/);
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
