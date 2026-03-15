import { describe, it, expect } from 'vitest';
import {
  ZOOM_TOKEN_THRESHOLD,
  MAX_RING_AGENTS,
  DOMAIN_COLORS,
  DEFAULT_AGENT_COLOR,
  AGENT_DOT_RADIUS,
  AGENT_TOKEN_RADIUS,
} from '../../../data/agent-visual-content';

describe('agent-visual-content constants', () => {
  it('ZOOM_TOKEN_THRESHOLD is 2.5', () => {
    expect(ZOOM_TOKEN_THRESHOLD).toBe(2.5);
  });

  it('MAX_RING_AGENTS is 6', () => {
    expect(MAX_RING_AGENTS).toBe(6);
  });

  it('DOMAIN_COLORS has all 9 reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const reach of reaches) {
      expect(DOMAIN_COLORS[reach]).toBeDefined();
    }
  });

  it('DEFAULT_AGENT_COLOR is defined', () => {
    expect(DEFAULT_AGENT_COLOR).toBeTruthy();
  });

  it('AGENT_DOT_RADIUS and AGENT_TOKEN_RADIUS are positive', () => {
    expect(AGENT_DOT_RADIUS).toBeGreaterThan(0);
    expect(AGENT_TOKEN_RADIUS).toBeGreaterThan(AGENT_DOT_RADIUS);
  });

  it('DOMAIN_COLORS values are valid hex color codes', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const [domain, color] of Object.entries(DOMAIN_COLORS)) {
      expect(color).toMatch(hexColorRegex);
    }
  });

  it('DEFAULT_AGENT_COLOR is a valid hex color code', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    expect(DEFAULT_AGENT_COLOR).toMatch(hexColorRegex);
  });
});
