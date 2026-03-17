import { describe, it, expect } from 'vitest';
import type { ProseLayer, ProseCategory, ProseMode } from '../prose';
import {
  MAX_LAYERS_PER_CATEGORY,
  SUMMARY_MAX_CHARS,
  FULL_MAX_PARAGRAPHS,
  PROSE_CATEGORIES,
} from '../prose';

describe('Prose types', () => {
  it('exports tunable constants', () => {
    expect(MAX_LAYERS_PER_CATEGORY).toBe(2);
    expect(SUMMARY_MAX_CHARS).toBe(200);
    expect(FULL_MAX_PARAGRAPHS).toBe(6);
  });

  it('defines all prose categories', () => {
    expect(PROSE_CATEGORIES).toContain('origin');
    expect(PROSE_CATEGORIES).toContain('atmosphere');
    expect(PROSE_CATEGORIES).toContain('character');
    expect(PROSE_CATEGORIES).toContain('economic');
    expect(PROSE_CATEGORIES).toContain('tension');
    expect(PROSE_CATEGORIES).toContain('history');
    expect(PROSE_CATEGORIES.length).toBe(6);
  });

  it('ProseLayer shape is usable', () => {
    const layer: ProseLayer = {
      text: 'A quiet town on the edge of the world.',
      priority: 100,
      category: 'origin',
      source: 'subtypeResolver',
    };
    expect(layer.text).toBeTruthy();
    expect(layer.priority).toBeGreaterThan(0);
  });
});
