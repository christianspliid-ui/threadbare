import { describe, it, expect } from 'vitest';
import {
  TOOLTIP_SHOW_DELAY,
  TOOLTIP_FADE_IN,
  TOOLTIP_FADE_OUT,
  TOOLTIP_RETRIGGER_GRACE,
  TOOLTIP_TOP_THRESHOLD,
  TOOLTIP_SIDE_THRESHOLD,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_OFFSET,
  TOOLTIP_MAX_CHAIN_DEPTH,
  TOOLTIP_LINK_PATTERN,
} from '../tooltip';
import type { TooltipContent, TooltipPlacement } from '../tooltip';

describe('tooltip types', () => {
  it('exports timing constants as positive numbers', () => {
    expect(TOOLTIP_SHOW_DELAY).toBeGreaterThan(0);
    expect(TOOLTIP_FADE_IN).toBeGreaterThan(0);
    expect(TOOLTIP_FADE_OUT).toBeGreaterThan(0);
    expect(TOOLTIP_RETRIGGER_GRACE).toBeGreaterThan(0);
  });

  it('exports positioning constants as positive numbers', () => {
    expect(TOOLTIP_TOP_THRESHOLD).toBeGreaterThan(0);
    expect(TOOLTIP_SIDE_THRESHOLD).toBeGreaterThan(0);
    expect(TOOLTIP_MAX_WIDTH).toBeGreaterThan(0);
    expect(TOOLTIP_OFFSET).toBeGreaterThan(0);
  });

  it('limits chain depth to 2', () => {
    expect(TOOLTIP_MAX_CHAIN_DEPTH).toBe(2);
  });

  it('TOOLTIP_LINK_PATTERN matches {{concept.id}} markers', () => {
    const text = 'Influenced by {{sphere.force}} and {{doom.unmaking}}';
    const matches = [...text.matchAll(TOOLTIP_LINK_PATTERN)];
    expect(matches).toHaveLength(2);
    expect(matches[0][1]).toBe('sphere.force');
    expect(matches[1][1]).toBe('doom.unmaking');
  });

  it('TOOLTIP_LINK_PATTERN does not match malformed markers', () => {
    const text = 'No match: {{ broken }} or {single} or {{CAPS.id}}';
    const matches = [...text.matchAll(TOOLTIP_LINK_PATTERN)];
    expect(matches).toHaveLength(0);
  });

  it('TooltipContent interface allows desc to be optional', () => {
    const withDesc: TooltipContent = { label: 'Force', desc: 'Sharp power' };
    const withoutDesc: TooltipContent = { label: 'Force' };
    expect(withDesc.desc).toBeDefined();
    expect(withoutDesc.desc).toBeUndefined();
  });

  it('TooltipPlacement is above or below', () => {
    const above: TooltipPlacement = 'above';
    const below: TooltipPlacement = 'below';
    expect(above).toBe('above');
    expect(below).toBe('below');
  });
});
