import { describe, it, expect } from 'vitest';
import { buildExplorationHooks, MAX_EXPLORATION_DESCRIPTORS } from '../explorationHooks';
import { HISTORICAL_CULTURE_TEMPLATES } from '../../../../data/historical-culture-content';

describe('buildExplorationHooks (THR-1621)', () => {
  it('renders no line when there are no descriptors', () => {
    expect(buildExplorationHooks(undefined)).toEqual([]);
    expect(buildExplorationHooks([])).toEqual([]);
    expect(buildExplorationHooks(['  ', ''])).toEqual([]);
  });

  it('renders one line for a single descriptor', () => {
    expect(buildExplorationHooks(['obsidian pillars'])).toEqual([
      'The obsidian pillars have not been fully explored. What remains within may reward — or punish — the curious.',
    ]);
  });

  it('names several descriptors in one sentence instead of one bullet each', () => {
    const lines = buildExplorationHooks(['white stone walls', 'geometric foundations', 'precise arches', 'dust-filled cisterns']);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      'The white stone walls, geometric foundations and precise arches have not been fully explored. What remains within may reward — or punish — the curious.',
    );
  });

  it('drops duplicate descriptors', () => {
    expect(buildExplorationHooks(['tidal channels', 'tidal channels'])[0]).toMatch(/^The tidal channels have/);
  });

  // The Done-when's predicate: with the descriptor removed, no two rendered
  // lines may share the same text. At most one line per hex satisfies it by
  // construction — asserted over every authored culture, not a fixture.
  it('never renders two lines that differ only by descriptor, for any authored culture', () => {
    const cultures = HISTORICAL_CULTURE_TEMPLATES;
    expect(cultures.length).toBeGreaterThan(0);
    for (const culture of cultures) {
      const lines = buildExplorationHooks(culture.ruinDescriptors);
      expect(lines.length).toBeLessThanOrEqual(1);
      const skeletons = lines.map(line =>
        culture.ruinDescriptors.slice(0, MAX_EXPLORATION_DESCRIPTORS).reduce((acc, d) => acc.replace(d, '{d}'), line),
      );
      expect(new Set(skeletons).size).toBe(skeletons.length);
    }
  });
});
