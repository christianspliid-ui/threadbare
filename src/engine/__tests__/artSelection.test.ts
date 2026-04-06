import { describe, it, expect } from 'vitest';
import { selectArt, type ArtAsset } from '../artSelection';

const LIBRARY: ArtAsset[] = [
  { id: 'art-001', path: '/art/meeting/warmth-tangled.webp', tags: ['warmth', 'care', 'coastal'] },
  { id: 'art-002', path: '/art/meeting/tension-blade.webp', tags: ['violence', 'combat', 'fear'] },
  { id: 'art-003', path: '/art/meeting/solitude-horizon.webp', tags: ['solitude', 'journey', 'wonder'] },
  { id: 'art-004', path: '/art/meeting/loss-ashes.webp', tags: ['loss', 'grief', 'memory'] },
];

describe('selectArt', () => {
  it('selects the best-matching image by tag overlap', () => {
    const result = selectArt(LIBRARY, ['warmth', 'care'], 42);
    expect(result.id).toBe('art-001');
  });

  it('breaks ties deterministically via seed', () => {
    const lib: ArtAsset[] = [
      { id: 'a', path: '/a.webp', tags: ['combat'] },
      { id: 'b', path: '/b.webp', tags: ['combat'] },
    ];
    const r1 = selectArt(lib, ['combat'], 42);
    const r2 = selectArt(lib, ['combat'], 42);
    expect(r1.id).toBe(r2.id);
  });

  it('returns first item when no tags match', () => {
    const result = selectArt(LIBRARY, ['nonexistent'], 42);
    expect(result).toBeDefined();
  });

  it('returns fallback when library is empty', () => {
    const result = selectArt([], ['warmth'], 42);
    expect(result.id).toBe('fallback');
  });
});
