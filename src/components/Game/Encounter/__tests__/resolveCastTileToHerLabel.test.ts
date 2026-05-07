import { describe, it, expect } from 'vitest';
import { resolveCastTileToHerLabel } from '../resolveCastTileToHerLabel';
import type { RelationshipResult } from '../../../../engine/encounters/relationshipResolver';
import type { RelationshipNodeProperties } from '../../../../types/graph';

describe('resolveCastTileToHerLabel', () => {
  it('uses tension_axis when relationship comes from a relationship node', () => {
    const data: RelationshipNodeProperties = {
      participants: ['eira', 'veiren'],
      arc: 'fraying',
      tension_axis: 'a debt and a winter ago',
      tension_drift: -0.4,
      history: [],
      last_invoked_tick: 12,
    };
    const relationship: RelationshipResult = { source: 'node', data };
    expect(resolveCastTileToHerLabel(relationship)).toBe('a debt and a winter ago');
  });

  it('maps each edge_sentiment arc to a distinct phrase', () => {
    const arcs: ('improving' | 'stable' | 'fraying' | 'severed')[] = [
      'improving',
      'stable',
      'fraying',
      'severed',
    ];
    const labels = arcs.map((arc) =>
      resolveCastTileToHerLabel({ source: 'edge_sentiment', arc, sentiment: 0 }),
    );
    expect(new Set(labels).size).toBe(arcs.length);
    expect(labels.every((label) => typeof label === 'string' && label.length > 0)).toBe(true);
  });

  it('returns the authored fallback phrase when relationship is none', () => {
    const result = resolveCastTileToHerLabel(
      { source: 'none' },
      'a face she has seen at council',
    );
    expect(result).toBe('a face she has seen at council');
  });

  it('returns null when relationship is none and no fallback is provided', () => {
    expect(resolveCastTileToHerLabel({ source: 'none' })).toBeNull();
    expect(resolveCastTileToHerLabel(null)).toBeNull();
    expect(resolveCastTileToHerLabel(undefined, '')).toBeNull();
  });

  it('prefers relationship data over fallback when both are present', () => {
    const data: RelationshipNodeProperties = {
      participants: ['eira', 'veiren'],
      arc: 'stable',
      tension_axis: 'authored tension',
      tension_drift: 0,
      history: [],
      last_invoked_tick: 0,
    };
    const result = resolveCastTileToHerLabel(
      { source: 'node', data },
      'fallback',
    );
    expect(result).toBe('authored tension');
  });
});
