import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';
import {
  resolveEntityVisual,
  ENTITY_VISUAL_MIN_KNOWLEDGE,
} from '../entityVisualResolver';
import {
  ENTITY_GRADIENT_COUNT,
  gradientIndexForId,
  fallbackGlyphFor,
} from '../../../data/entity-visual-fallbacks';
import { SUBLOCATION_CATEGORY_ART } from '../../../data/sublocation-category-art';

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type'>): GraphNode {
  return { name: partial.id, properties: {}, ...partial };
}

function graphWith(...nodes: GraphNode[]): WorldGraph {
  const g = new WorldGraph();
  for (const n of nodes) g.addNode(n);
  return g;
}

describe('resolveEntityVisual — per-kind resolution', () => {
  it('resolves an agent bespoke portrait to the art tier', () => {
    const g = graphWith(
      node({
        id: 'a1',
        type: 'actor',
        name: 'Kael',
        properties: { actorType: 'individual', portraitAssetPath: '/portraits/kael.png' },
      }),
    );
    const d = resolveEntityVisual({ id: 'a1' }, g);
    expect(d.tier).toBe('art');
    expect(d.src).toBe('/portraits/kael.png');
    expect(d.kind).toBe('agent');
    expect(d.alt).toBe('Kael');
  });

  it('falls back to the archetype portrait when no bespoke path is set', () => {
    const g = graphWith(
      node({
        id: 'a2',
        type: 'actor',
        properties: { actorType: 'individual', narrativeArchetype: 'trickster' },
      }),
    );
    const d = resolveEntityVisual({ id: 'a2' }, g);
    expect(d.tier).toBe('art');
    expect(d.src).toBe('/portraits/trickster.png');
  });

  it('resolves a location to a concept-art landscape when terrain is provided', () => {
    const g = graphWith(node({ id: 'loc1', type: 'location', name: 'Deepmarsh' }));
    const d = resolveEntityVisual({ id: 'loc1' }, g, { terrain: 'mountains' });
    expect(d.tier).toBe('art');
    expect(d.src).toBe('/concept-art/mountains.png');
    expect(d.kind).toBe('location');
  });

  it('falls back to the location glyph tile when no terrain hint is available', () => {
    const g = graphWith(node({ id: 'loc2', type: 'location', name: 'Nowhere' }));
    const d = resolveEntityVisual({ id: 'loc2' }, g);
    expect(d.tier).toBe('fallback');
    expect(d.glyph).toBe(fallbackGlyphFor('location', 'Nowhere'));
  });

  it('resolves a parented location node to its sublocation category plate', () => {
    // Repointed in the THR-638 sublocation batch: this asserted the glyph tier
    // back when `sublocation` had no registry. `crypt` is a religious type, so
    // leaving the old assertion green would have been a test guarding a dead
    // contract rather than the live one.
    const g = graphWith(
      node({
        id: 'sub1',
        type: 'location',
        name: 'The Undercroft',
        properties: { parentLocationId: 'loc1', sublocationTypeId: 'crypt' },
      }),
    );
    const d = resolveEntityVisual({ id: 'sub1' }, g);
    expect(d.kind).toBe('sublocation');
    expect(d.tier).toBe('art');
    expect(d.src).toBe(SUBLOCATION_CATEGORY_ART.religious);
  });

  it('falls to the glyph tier for a sublocation whose type has no category', () => {
    const g = graphWith(
      node({
        id: 'sub2',
        type: 'location',
        name: 'Somewhere Odd',
        properties: { parentLocationId: 'loc1', sublocationTypeId: 'not-a-real-type' },
      }),
    );
    const d = resolveEntityVisual({ id: 'sub2' }, g);
    expect(d.kind).toBe('sublocation');
    expect(d.tier).toBe('fallback');
  });

  it('classifies faction and artifact nodes and falls to their glyph tiles', () => {
    const g = graphWith(
      node({ id: 'f1', type: 'actor', name: 'The Covenant', properties: { actorType: 'faction' } }),
      node({ id: 'art1', type: 'artifact', name: 'Sunspear' }),
    );
    expect(resolveEntityVisual({ id: 'f1' }, g).kind).toBe('faction');
    expect(resolveEntityVisual({ id: 'art1' }, g).kind).toBe('artifact');
    expect(resolveEntityVisual({ id: 'f1' }, g).tier).toBe('fallback');
    expect(resolveEntityVisual({ id: 'art1' }, g).tier).toBe('fallback');
  });
});

describe('resolveEntityVisual — knownSrc + graph-free surfaces', () => {
  it('uses caller-provided knownSrc without a graph', () => {
    const d = resolveEntityVisual(
      { id: 'a3', kind: 'agent', name: 'Serafina', knownSrc: '/portraits/serafina.png' },
      null,
    );
    expect(d.tier).toBe('art');
    expect(d.src).toBe('/portraits/serafina.png');
  });

  it('knownSrc wins over a graph-resolved source', () => {
    const g = graphWith(
      node({
        id: 'a4',
        type: 'actor',
        properties: { actorType: 'individual', portraitAssetPath: '/portraits/graph.png' },
      }),
    );
    const d = resolveEntityVisual({ id: 'a4', knownSrc: '/portraits/caller.png' }, g);
    expect(d.src).toBe('/portraits/caller.png');
  });

  it('resolves an encounter illustration via knownSrc', () => {
    const d = resolveEntityVisual(
      { id: 'enc1', kind: 'encounter', name: 'The Bridge', knownSrc: '/concept-art/bridge.png' },
      null,
    );
    expect(d.tier).toBe('art');
    expect(d.src).toBe('/concept-art/bridge.png');
    expect(d.kind).toBe('encounter');
  });

  it('resolves a faction to its procedural heraldry sigil (THR-638)', () => {
    const g = graphWith(
      node({
        id: 'faction_def_thieves_guild',
        type: 'actor',
        name: 'The Thieves Guild',
        properties: { actorType: 'faction', factionDefId: 'thieves_guild' },
      }),
    );
    const d = resolveEntityVisual({ id: 'faction_def_thieves_guild' }, g);
    expect(d.kind).toBe('faction');
    expect(d.tier).toBe('art');
    expect(d.src).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });

  it('prefers a bespoke sigilAssetPath over generated heraldry', () => {
    const g = graphWith(
      node({
        id: 'f2',
        type: 'actor',
        properties: {
          actorType: 'faction',
          factionDefId: 'thieves_guild',
          sigilAssetPath: '/assets/factions/bespoke-banner.jpg',
        },
      }),
    );
    const d = resolveEntityVisual({ id: 'f2' }, g);
    expect(d.src).toBe('/assets/factions/bespoke-banner.jpg');
  });

  it('falls back to the glyph tile for a faction with an unknown definition id', () => {
    const g = graphWith(
      node({
        id: 'f3',
        type: 'actor',
        properties: { actorType: 'faction', factionDefId: 'no_such_faction' },
      }),
    );
    const d = resolveEntityVisual({ id: 'f3' }, g);
    expect(d.kind).toBe('faction');
    expect(d.tier).toBe('fallback');
  });

  it('returns a byte-identical sigil across calls (NFP #3 — stable <img src>)', () => {
    const g = graphWith(
      node({
        id: 'f4',
        type: 'actor',
        properties: { actorType: 'faction', factionDefId: 'civic_guard' },
      }),
    );
    const first = resolveEntityVisual({ id: 'f4' }, g).src;
    const second = resolveEntityVisual({ id: 'f4' }, g).src;
    expect(first).toBe(second);
  });
});

describe('resolveEntityVisual — fallback chain + fail-soft', () => {
  it('returns the glyph tier for a missing node, never throws', () => {
    const g = graphWith();
    const d = resolveEntityVisual({ id: 'ghost', name: 'Ghost' }, g);
    expect(d.tier).toBe('fallback');
    expect(d.kind).toBe('unknown');
    expect(d.glyph).toBeTruthy();
  });

  it('tolerates a null graph with no knownSrc', () => {
    const d = resolveEntityVisual({ id: 'x', kind: 'faction', name: 'Nameless' }, null);
    expect(d.tier).toBe('fallback');
  });

  it('uses the entity id as the alt when no name is available', () => {
    const d = resolveEntityVisual({ id: 'orphan-id' }, null);
    expect(d.alt).toBe('orphan-id');
  });
});

describe('resolveEntityVisual — knowledge gating (person kinds only)', () => {
  const agentGraph = () =>
    graphWith(
      node({
        id: 'p1',
        type: 'actor',
        name: 'Veiled',
        properties: { actorType: 'individual', portraitAssetPath: '/portraits/veiled.png' },
      }),
    );

  it('hides agent art below the min knowledge level', () => {
    const d = resolveEntityVisual({ id: 'p1' }, agentGraph(), { knowledgeLevel: 'stranger' });
    expect(d.tier).toBe('fallback');
  });

  it('shows agent art at or above the min knowledge level', () => {
    const d = resolveEntityVisual({ id: 'p1' }, agentGraph(), {
      knowledgeLevel: ENTITY_VISUAL_MIN_KNOWLEDGE,
    });
    expect(d.tier).toBe('art');
  });

  it('fail-open: omitting knowledgeLevel keeps agent art visible', () => {
    const d = resolveEntityVisual({ id: 'p1' }, agentGraph());
    expect(d.tier).toBe('art');
  });

  it('never gates a location, even at stranger knowledge', () => {
    const g = graphWith(node({ id: 'loc3', type: 'location', name: 'Open Field' }));
    const d = resolveEntityVisual({ id: 'loc3' }, g, {
      terrain: 'grassland',
      knowledgeLevel: 'stranger',
    });
    expect(d.tier).toBe('art');
  });
});

describe('gradient selection — deterministic', () => {
  it('is stable across calls for the same id', () => {
    const a = resolveEntityVisual({ id: 'stable-id' }, null);
    const b = resolveEntityVisual({ id: 'stable-id' }, null);
    expect(a.gradientIndex).toBe(b.gradientIndex);
    expect(a.gradientIndex).toBe(gradientIndexForId('stable-id'));
  });

  it('always yields an index within range', () => {
    for (const id of ['a', 'bb', 'ccc', 'a very long entity id here', '42', '', 'Δ']) {
      const idx = gradientIndexForId(id);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(ENTITY_GRADIENT_COUNT);
    }
  });
});
