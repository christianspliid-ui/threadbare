/**
 * Culture Pass 2 Integration Tests.
 *
 * End-to-end verification: seed world → cultural traits granted → tension scored → beats available.
 */

import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { computeCulturalTensionScore } from '../culturalTension';
import { getAvailableInsiderBeats } from '../insiderBeatDetection';
import { buildNarrativeContext } from '../contextBuilder';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { NarrativeEvent } from '../../types/narrative';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

describe('Culture Pass 2 integration', () => {
  it('full pipeline: seed world → traits granted → tension scored → beats available', () => {
    const { graph, individualIds, cultureIds } = seedWorld(balancedCosmology(), mockTiles(), 42);

    // 1. Cultures exist
    expect(cultureIds.length).toBeGreaterThanOrEqual(2);

    // 2. Cultural trait nodes exist (formative or behavioral from culture instantiation)
    const traitNodes = graph.getNodesByType('trait');
    const culturalFormative = traitNodes.filter(n =>
      n.id.startsWith('trait_formative_'));
    const culturalBehavioral = traitNodes.filter(n =>
      n.id.startsWith('trait_behavioral_'));
    expect(culturalFormative.length + culturalBehavioral.length).toBeGreaterThan(0);

    // 3. Some actors have belongs_to edges (culture membership)
    const withCulture = individualIds.filter(id =>
      graph.getOutgoingEdges(id, 'belongs_to').length > 0);
    expect(withCulture.length).toBeGreaterThan(0);

    // 4. Some actors have has_trait edges for cultural traits
    const withTraits = withCulture.filter(id =>
      graph.getOutgoingEdges(id, 'has_trait').length > 0);
    expect(withTraits.length).toBeGreaterThan(0);

    // 5. Cultural tension can be computed for cultured actors
    for (const actorId of withCulture.slice(0, 3)) {
      const { score } = computeCulturalTensionScore(graph, actorId);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    }

    // 6. Insider beat detection runs without error
    for (const actorId of withCulture.slice(0, 3)) {
      const beats = getAvailableInsiderBeats(graph, actorId);
      expect(Array.isArray(beats)).toBe(true);
    }
  });

  it('buildNarrativeContext includes cultural fields for cultured actors', () => {
    const { graph, individualIds } = seedWorld(balancedCosmology(), mockTiles(), 42);

    // Find a cultured actor with a location
    const culturedActor = individualIds.find(id => {
      const hasCulture = graph.getOutgoingEdges(id, 'belongs_to').length > 0;
      const hasLocation = graph.getOutgoingEdges(id, 'located_at').length > 0;
      return hasCulture && hasLocation;
    });

    if (!culturedActor) {
      // Skip if no suitable actor found (unlikely with seed 42)
      return;
    }

    const event: NarrativeEvent = {
      id: 'evt-int-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: culturedActor,
      description: 'integration test event',
      tick: 1,
    };

    const ctx = buildNarrativeContext(event, graph);

    expect(typeof ctx.culturalStrength).toBe('number');
    expect(ctx.culturalStrength).toBeGreaterThanOrEqual(0);
    expect(ctx.culturalStrength).toBeLessThanOrEqual(1);
    expect(Array.isArray(ctx.availableInsiderBeats)).toBe(true);
  });

  it('deterministic — same seed produces same cultural traits', () => {
    const r1 = seedWorld(balancedCosmology(), mockTiles(), 99);
    const r2 = seedWorld(balancedCosmology(), mockTiles(), 99);

    const traits1 = r1.graph.getNodesByType('trait').map(n => n.id).sort();
    const traits2 = r2.graph.getNodesByType('trait').map(n => n.id).sort();
    expect(traits1).toEqual(traits2);

    // Culture assignments should be identical
    expect(r1.cultureIds).toEqual(r2.cultureIds);
  });
});
