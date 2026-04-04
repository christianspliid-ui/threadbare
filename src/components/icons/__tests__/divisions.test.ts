import { describe, it, expect } from 'vitest';
import { SHIELD_VIEWBOX, SHIELD_PATH, renderShieldBase, renderShieldOutline } from '../heraldry/shields';
import { renderDivision } from '../heraldry/divisions';
import type { DivisionType } from '../constants';

const ALL_DIVISIONS: DivisionType[] = [
  'per_pale', 'per_fess', 'per_chevron', 'quarterly', 'per_bend_sinister', 'plain',
];

describe('shield constants', () => {
  it('SHIELD_VIEWBOX is 120x150', () => {
    expect(SHIELD_VIEWBOX.width).toBe(120);
    expect(SHIELD_VIEWBOX.height).toBe(150);
  });

  it('SHIELD_PATH contains M and Q bezier curves', () => {
    expect(SHIELD_PATH).toContain('M');
    expect(SHIELD_PATH).toContain('Q');
  });
});

describe('renderShieldBase', () => {
  it('returns SVG string with clipPath defs and path', () => {
    const svg = renderShieldBase('#ff0000', '#000000', 2, 'clip1');
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<clipPath');
    expect(svg).toContain('clip1');
    expect(svg).toContain('<path');
    expect(svg).toContain('#ff0000');
  });
});

describe('renderShieldOutline', () => {
  it('returns SVG path string with stroke color', () => {
    const svg = renderShieldOutline('#333333', 3);
    expect(svg).toContain('<path');
    expect(svg).toContain('#333333');
  });
});

describe('renderDivision', () => {
  const colors = { primary: '#ff0000', secondary: '#0000ff' };

  it('all 6 division types render without error', () => {
    for (const type of ALL_DIVISIONS) {
      expect(() => renderDivision(type, colors, 'testClip')).not.toThrow();
    }
  });

  it('all divisions include both colors (except plain)', () => {
    for (const type of ALL_DIVISIONS) {
      const svg = renderDivision(type, colors, 'testClip');
      if (type === 'plain') {
        expect(svg).toContain('#ff0000');
      } else {
        expect(svg, `${type} should contain primary`).toContain('#ff0000');
        expect(svg, `${type} should contain secondary`).toContain('#0000ff');
      }
    }
  });

  it('plain division only uses primary color, not secondary', () => {
    const svg = renderDivision('plain', colors, 'testClip');
    expect(svg).toContain('#ff0000');
    expect(svg).not.toContain('#0000ff');
  });

  it('uses clipPath reference', () => {
    const svg = renderDivision('per_pale', colors, 'myClip');
    expect(svg).toContain('myClip');
  });

  it('per_pale renders two vertical rects', () => {
    const svg = renderDivision('per_pale', colors, 'clip');
    // Should have two rect elements
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(2);
  });

  it('per_fess renders two horizontal rects', () => {
    const svg = renderDivision('per_fess', colors, 'clip');
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(2);
  });

  it('quarterly renders four rects', () => {
    const svg = renderDivision('quarterly', colors, 'clip');
    const rectCount = (svg.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(4);
  });
});
