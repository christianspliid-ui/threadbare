import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { generateEntityProse } from '../proseGenerator';
import type { CosmologyProfile, HexTile } from '../../types/index';

describe('proseGenerator UI Integration Requirements', () => {
  const tiles: HexTile[] = [
    { coord: { col: 0, row: 0 }, terrain: 'grassland' },
    { coord: { col: 1, row: 0 }, terrain: 'mountains' },
    { coord: { col: 2, row: 0 }, terrain: 'desert' },
  ] as HexTile[];

  const cosmo: CosmologyProfile = {
    force: 0.3,
    matter: 0.2,
    energy: 0.15,
    life: 0.5,
    mind: 0.25,
    spirit: 0.3,
    time: 0.1,
    entropy: 0.15,
  };

  it('location full prose has no undefined or null strings', () => {
    const { graph, locationIds } = seedWorld(cosmo, tiles, 42);
    for (const id of locationIds) {
      const prose = generateEntityProse(id, graph, 42, 'full');
      expect(prose).not.toContain('undefined');
      expect(prose).not.toContain('null');
      expect(prose).not.toContain('{name}');
      expect(prose).not.toContain('{faction}');
      expect(prose).not.toContain('{agent}');
    }
  });

  it('location summary prose has no unresolved placeholders', () => {
    const { graph, locationIds } = seedWorld(cosmo, tiles, 42);
    for (const id of locationIds) {
      const prose = generateEntityProse(id, graph, 42, 'summary');
      expect(prose).not.toContain('{');
      expect(prose).not.toContain('}');
    }
  });

  it('agent full prose has no unresolved placeholders', () => {
    const { graph, individualIds } = seedWorld(cosmo, tiles, 42);
    for (const id of individualIds) {
      const prose = generateEntityProse(id, graph, 42, 'full');
      expect(prose).not.toContain('{');
      expect(prose).not.toContain('}');
    }
  });

  it('agent summary prose has no unresolved placeholders', () => {
    const { graph, individualIds } = seedWorld(cosmo, tiles, 42);
    for (const id of individualIds) {
      const prose = generateEntityProse(id, graph, 42, 'summary');
      expect(prose).not.toContain('{');
      expect(prose).not.toContain('}');
    }
  });

  it('prose split by double newline creates valid paragraph array', () => {
    const { graph, locationIds } = seedWorld(cosmo, tiles, 42);
    const id = locationIds[0];
    if (!id) return;

    const prose = generateEntityProse(id, graph, 42, 'full');
    const paragraphs = prose.split('\n\n').filter(p => p.trim().length > 0);
    expect(paragraphs.length).toBeGreaterThan(0);
    paragraphs.forEach(para => {
      expect(para).not.toContain('{');
      expect(para).not.toContain('}');
    });
  });
});
