import { describe, it, expect } from 'vitest';
import { composeProse, composeSummary } from '../proseComposer';
import type { ProseLayer } from '../../types/prose';

const makeLayers = (): ProseLayer[] => [
  { text: 'A capital built on ancient foundations.', priority: 100, category: 'origin', source: 'subtypeResolver' },
  { text: 'The grasslands stretch endlessly.', priority: 90, category: 'atmosphere', source: 'biomeResolver' },
  { text: 'Order-Light culture shaped every wall.', priority: 80, category: 'character', source: 'cultureResolver' },
  { text: 'Life threads pulse in the soil.', priority: 70, category: 'atmosphere', source: 'sphereResolver' },
  { text: 'The Iron Covenant rules with discipline.', priority: 60, category: 'character', source: 'factionResolver' },
  { text: 'Kael the folk hero holds court.', priority: 50, category: 'character', source: 'populationResolver' },
  { text: 'A great beast was slain here.', priority: 40, category: 'history', source: 'historyResolver' },
];

describe('composeProse (full mode)', () => {
  it('sorts by priority descending', () => {
    const result = composeProse(makeLayers());
    const paragraphs = result.split('\n\n');
    expect(paragraphs[0]).toContain('capital');
    expect(paragraphs[1]).toContain('grasslands');
  });

  it('caps at 2 per category', () => {
    const result = composeProse(makeLayers());
    // 3 character layers → only 2 should survive
    const paragraphs = result.split('\n\n');
    expect(paragraphs.length).toBeLessThanOrEqual(6);
    // The 3rd character layer (populationResolver, priority 50) should be dropped
    expect(result).not.toContain('folk hero');
  });

  it('returns empty string for empty layers', () => {
    expect(composeProse([])).toBe('');
  });

  it('respects MAX_PARAGRAPHS', () => {
    const manyLayers: ProseLayer[] = Array.from({ length: 20 }, (_, i) => ({
      text: `Layer ${i}`,
      priority: 100 - i,
      category: (['origin', 'atmosphere', 'character', 'tension', 'history'] as const)[i % 5],
      source: `resolver_${i}`,
    }));
    const paragraphs = composeProse(manyLayers).split('\n\n');
    expect(paragraphs.length).toBeLessThanOrEqual(6);
  });
});

describe('composeSummary', () => {
  it('returns highest priority layer text', () => {
    const result = composeSummary(makeLayers());
    expect(result).toContain('capital');
  });

  it('truncates at SUMMARY_MAX_CHARS', () => {
    const longLayer: ProseLayer = {
      text: 'A'.repeat(300),
      priority: 100,
      category: 'origin',
      source: 'test',
    };
    const result = composeSummary([longLayer]);
    expect(result.length).toBeLessThanOrEqual(203); // 200 + '...'
  });

  it('returns empty string for empty layers', () => {
    expect(composeSummary([])).toBe('');
  });
});
