/**
 * THR-1916 — the plateau and the lair have art of their own, every terrain resolves to an
 * image that exists, and the land page's hero picks the lair before the terrain.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pickConceptArt, CONCEPT_ART_REGISTRY } from '../concept-art-assets';
import { getLocationConceptArtUrl, getOwnLocationConceptArtUrl } from '../location-concept-art';
import { landHeroArt } from '../../engine/views/subjects/subjectPage';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const PUBLIC = join(__dirname, '..', '..', '..', 'public');

function stateWith(nodes: Record<string, Partial<GraphNode>>): GameState {
  return { graph: { getNode: (id: string) => nodes[id] } } as unknown as GameState;
}

describe('THR-1916 land hero art', () => {
  it('the plateau has its own landscape, no longer the green hills', () => {
    expect(pickConceptArt('plateau', [], null)).toBe('/concept-art/plateau.png');
    expect(pickConceptArt('hills', [], null)).toBe('/concept-art/hills.png');
  });

  it('a lair has its own art, no longer the camp', () => {
    expect(getLocationConceptArtUrl('lair')).toBe('/concept-art/locations/lair.png');
    expect(getOwnLocationConceptArtUrl('lair')).toBe('/concept-art/locations/lair.png');
    expect(getOwnLocationConceptArtUrl('no_such_subtype')).toBeNull();
    expect(getLocationConceptArtUrl('no_such_subtype')).toBe('/concept-art/locations/camp.png');
  });

  it('every registry image and the lair image exist on disk', () => {
    for (const e of CONCEPT_ART_REGISTRY) {
      expect(existsSync(join(PUBLIC, 'concept-art', e.image)), e.image).toBe(true);
    }
    expect(existsSync(join(PUBLIC, 'concept-art', 'locations', 'lair.png'))).toBe(true);
  });

  it('the land page hero: a lair first, else the terrain, else the fallback tile', () => {
    const state = stateWith({
      lair_1: { id: 'lair_1', properties: { locationSubtype: 'lair' } },
      town_1: { id: 'town_1', properties: { locationSubtype: 'town' } },
    });
    expect(landHeroArt(state, 'plateau', ['lair_1'], ['lair_1', 'town_1'])).toBe('/concept-art/locations/lair.png');
    expect(landHeroArt(state, 'plateau', [], ['town_1'])).toBe('/concept-art/plateau.png');
    expect(landHeroArt(state, undefined, [], [])).toBeNull();
  });
});
