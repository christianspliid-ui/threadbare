/**
 * agentSpriteTypes.test.ts — Unit tests for agent rendering type constants.
 *
 * Verifies that faction colors, retinue border color, and zoom thresholds
 * match the values specified in the Phase 6 UI-SPEC.
 */

import { describe, it, expect } from 'vitest';
import {
  FACTION_HERALDIC_COLORS,
  RETINUE_BORDER_COLOR,
  RETINUE_BORDER_ALT_COLOR,
  AGENT_SPRITE_Z,
  PORTRAIT_TEXTURE_SIZE,
  FACTION_DOT_TEXTURE_SIZE,
} from '../agentSpriteTypes';
import type { AgentRenderData } from '../agentSpriteTypes';

describe('FACTION_HERALDIC_COLORS', () => {
  it('has exactly 6 entries', () => {
    expect(FACTION_HERALDIC_COLORS).toHaveLength(6);
  });

  it('contains the correct faction colors (red, blue, purple, magenta, cyan, orange)', () => {
    expect(FACTION_HERALDIC_COLORS[0]).toBe('#e53e3e'); // red
    expect(FACTION_HERALDIC_COLORS[1]).toBe('#3182ce'); // blue
    expect(FACTION_HERALDIC_COLORS[2]).toBe('#805ad5'); // purple
    expect(FACTION_HERALDIC_COLORS[3]).toBe('#d53f8c'); // magenta
    expect(FACTION_HERALDIC_COLORS[4]).toBe('#00b5d8'); // cyan
    expect(FACTION_HERALDIC_COLORS[5]).toBe('#dd6b20'); // orange
  });
});

describe('RETINUE_BORDER_COLOR', () => {
  it('is gold (#d4a040)', () => {
    expect(RETINUE_BORDER_COLOR).toBe('#d4a040');
  });
});

describe('RETINUE_BORDER_ALT_COLOR', () => {
  it('is a white-ish rgba value', () => {
    expect(RETINUE_BORDER_ALT_COLOR).toBe('rgba(255,255,255,0.9)');
  });
});

describe('AGENT_SPRITE_Z', () => {
  it('is above LOCATION_ICON_Z (0.08)', () => {
    expect(AGENT_SPRITE_Z).toBeGreaterThan(0.08);
  });

  it('is above 3D model geometry (z=6.0)', () => {
    expect(AGENT_SPRITE_Z).toBe(6.0);
  });
});

describe('PORTRAIT_TEXTURE_SIZE', () => {
  it('is 128', () => {
    expect(PORTRAIT_TEXTURE_SIZE).toBe(128);
  });
});

describe('FACTION_DOT_TEXTURE_SIZE', () => {
  it('is 64', () => {
    expect(FACTION_DOT_TEXTURE_SIZE).toBe(64);
  });
});

describe('AgentRenderData type', () => {
  it('can be constructed with required fields', () => {
    const data: AgentRenderData = {
      id: 'agent-1',
      hexCol: 5,
      hexRow: 3,
      factionIndex: 0,
      isRetinue: false,
    };
    expect(data.id).toBe('agent-1');
    expect(data.hexCol).toBe(5);
    expect(data.hexRow).toBe(3);
    expect(data.factionIndex).toBe(0);
    expect(data.isRetinue).toBe(false);
  });

  it('can be constructed with all optional fields', () => {
    const data: AgentRenderData = {
      id: 'agent-2',
      hexCol: 1,
      hexRow: 2,
      portraitUrl: '/portraits/hero.png',
      factionIndex: 2,
      isRetinue: true,
      activityIcon: 'boot',
      name: 'Sir Aldric',
    };
    expect(data.portraitUrl).toBe('/portraits/hero.png');
    expect(data.activityIcon).toBe('boot');
    expect(data.name).toBe('Sir Aldric');
  });
});
