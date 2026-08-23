/**
 * Backstory Resolvers Tests — TDD for tiered backstory generation.
 *
 * Tests all 10 backstory resolvers. Each test verifies:
 * - Correct BackstoryLayer shape (priority, category, source, stratum)
 * - Placeholder replacement
 * - Fail-soft on missing data
 * - Determinism (same seed → same output)
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import {
  surfaceOriginResolver,
  surfaceSphereResolver,
  bondHistoryResolver,
  traitOriginResolver,
  turningPointResolver,
  contradictionResolver,
  fearResolver,
  hiddenMotiveResolver,
  storyArcResolver,
  divineTransformationResolver,
} from '../backstoryResolvers';
import type { BackstoryLayer } from '../../types/prose';
import { FEAR_PROSE } from '../../data/backstory-content';
import { FEAR_DESCRIPTIONS, VALUE_LABELS } from '../../data/strand-content';

// ─── Graph builders ──────────────────────────────────────────────────────────

function makeAgent(overrides: Record<string, unknown> = {}): GraphNode {
  return {
    id: 'agent_0',
    type: 'actor',
    name: 'Mira',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'tragic_hero',
      primarySphere: 'force',
      cooperationStrategy: 'tit-for-tat',
      axiologicalProfile: {
        loyalty_ambition: 0.7,     // strong positive → fear from positive pole
        courage_prudence: 0.1,         // near-zero → contradiction candidate
        mercy_ruthlessness: -0.5,
        honesty_cunning: 0.05,         // near-zero → contradiction candidate
        sacrifice_survival: -0.2,
        loyalty_ambition: 0.4,
        tradition_novelty: -0.1,
        preservation_transformation: 0.0,
        mercy_ruthlessness: 0.3,
        asceticism_extravagance: -0.6,
      },
      ...overrides,
    },
  };
}

function makeCulture(): GraphNode {
  return {
    id: 'culture_0',
    type: 'actor',
    name: 'The Ironborn',
    properties: {
      actorType: 'culture',
      cultureIdentity: { foundationPair: 'order_light' },
    },
  };
}

function makeTargetAgent(): GraphNode {
  return {
    id: 'agent_bond',
    type: 'actor',
    name: 'Davan',
    properties: { actorType: 'individual' },
  };
}

function makeTraitNode(): GraphNode {
  return {
    id: 'trait_0',
    type: 'trait',
    name: 'Iron Will',
    properties: { subcategory: 'innate' },
  };
}

function makeAscendant(): GraphNode {
  return {
    id: 'asc_0',
    type: 'actor',
    name: 'The Flame Watcher',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'force', secondary: 'matter' },
    },
  };
}

function buildBaseGraph(): { graph: WorldGraph; agentId: string } {
  const graph = new WorldGraph();
  graph.addNode(makeAgent());
  graph.addNode(makeCulture());
  graph.addEdge({
    id: 'edge_belongs',
    source: 'agent_0',
    target: 'culture_0',
    type: 'belongs_to',
    properties: {},
  } as GraphEdge);
  return { graph, agentId: 'agent_0' };
}

function buildGraphWithBond(
  sentiment = 0.8,
  strength = 0.7,
  basis = 'loyalty',
): { graph: WorldGraph; agentId: string } {
  const { graph, agentId } = buildBaseGraph();
  graph.addNode(makeTargetAgent());
  graph.addEdge({
    id: 'edge_bond',
    source: 'agent_0',
    target: 'agent_bond',
    type: 'relates_to',
    properties: { sentiment, strength, basis },
  } as GraphEdge);
  return { graph, agentId };
}

function buildGraphWithTrait(): { graph: WorldGraph; agentId: string } {
  const { graph, agentId } = buildBaseGraph();
  graph.addNode(makeTraitNode());
  graph.addEdge({
    id: 'edge_trait',
    source: 'agent_0',
    target: 'trait_0',
    type: 'has_trait',
    properties: { level: 2 },
  } as GraphEdge);
  return { graph, agentId };
}

function buildGraphWithThread(
  totalEssenceSpent = 30,
  ticksAtCurrentTier = 50,
): { graph: WorldGraph; agentId: string } {
  const { graph, agentId } = buildBaseGraph();
  graph.addNode(makeAscendant());
  graph.addEdge({
    id: 'edge_thread',
    source: 'asc_0',
    target: 'agent_0',
    type: 'thread',
    properties: {
      tier: 2,
      totalEssenceSpent,
      ticksAtCurrentTier,
      establishedTick: 10,
      maintenanceCurrent: true,
    },
  } as GraphEdge);
  return { graph, agentId };
}

// ─── Layer shape helper ───────────────────────────────────────────────────────

function assertBackstoryLayer(
  layer: BackstoryLayer,
  opts: {
    stratum: 1 | 2 | 3 | 4;
    priority: number;
    category: string;
    source: string;
  },
) {
  expect(layer.stratum).toBe(opts.stratum);
  expect(layer.priority).toBe(opts.priority);
  expect(layer.category).toBe(opts.category);
  expect(layer.source).toBe(opts.source);
  expect(typeof layer.text).toBe('string');
  expect(layer.text.length).toBeGreaterThan(0);
}

// ─── surfaceOriginResolver ────────────────────────────────────────────────────

describe('surfaceOriginResolver', () => {
  it('returns BackstoryLayer with stratum 1, priority 100, category origin', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = surfaceOriginResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 1,
      priority: 100,
      category: 'origin',
      source: 'surfaceOriginResolver',
    });
  });

  it('replaces {name} with agent name', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = surfaceOriginResolver(agentId, graph, 42);
    expect(layers[0].text).toContain('Mira');
    expect(layers[0].text).not.toContain('{name}');
  });

  it('replaces {culture} with culture name', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = surfaceOriginResolver(agentId, graph, 42);
    // Culture name injected into text (may be in template or not — at least one template has it)
    expect(layers[0].text).not.toContain('{culture}');
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(surfaceOriginResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('returns [] when narrativeArchetype missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(surfaceOriginResolver('a', graph, 42)).toEqual([]);
  });

  it('is deterministic (same seed → same result)', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = surfaceOriginResolver(agentId, graph, 99);
    const b = surfaceOriginResolver(agentId, graph, 99);
    expect(a[0].text).toBe(b[0].text);
  });

  it('varies with different seeds', () => {
    const { graph, agentId } = buildBaseGraph();
    const texts = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const layers = surfaceOriginResolver(agentId, graph, seed);
      if (layers.length > 0) texts.add(layers[0].text);
    }
    // With 2+ templates per key, at least 2 distinct outputs over 20 seeds
    expect(texts.size).toBeGreaterThanOrEqual(2);
  });
});

// ─── surfaceSphereResolver ────────────────────────────────────────────────────

describe('surfaceSphereResolver', () => {
  it('returns BackstoryLayer with stratum 1, priority 80, category atmosphere', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = surfaceSphereResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 1,
      priority: 80,
      category: 'atmosphere',
      source: 'surfaceSphereResolver',
    });
  });

  it('replaces {name} and {sphere} placeholders', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = surfaceSphereResolver(agentId, graph, 42);
    expect(layers[0].text).toContain('Mira');
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{sphere}');
  });

  it('returns [] when primarySphere missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(surfaceSphereResolver('a', graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(surfaceSphereResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = surfaceSphereResolver(agentId, graph, 7);
    const b = surfaceSphereResolver(agentId, graph, 7);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── bondHistoryResolver ──────────────────────────────────────────────────────

describe('bondHistoryResolver', () => {
  it('returns BackstoryLayer with stratum 2, priority 100, category character', () => {
    const { graph, agentId } = buildGraphWithBond();
    const layers = bondHistoryResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 2,
      priority: 100,
      category: 'character',
      source: 'bondHistoryResolver',
    });
  });

  it('replaces {name} and {bond} placeholders', () => {
    const { graph, agentId } = buildGraphWithBond();
    const layers = bondHistoryResolver(agentId, graph, 42);
    expect(layers[0].text).toContain('Mira');
    expect(layers[0].text).toContain('Davan');
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{bond}');
  });

  it('uses positive table for positive sentiment', () => {
    const { graph, agentId } = buildGraphWithBond(0.8, 0.7, 'loyalty');
    const layers = bondHistoryResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
    // Positive bond should use BOND_HISTORY_PROSE
    expect(layers[0].source).toBe('bondHistoryResolver');
  });

  it('uses negative table for negative sentiment', () => {
    const { graph, agentId } = buildGraphWithBond(-0.6, 0.7, 'rivalry');
    const layers = bondHistoryResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].source).toBe('bondHistoryResolver');
  });

  it('returns [] when no relates_to edges', () => {
    const { graph, agentId } = buildBaseGraph();
    expect(bondHistoryResolver(agentId, graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(bondHistoryResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildGraphWithBond();
    const a = bondHistoryResolver(agentId, graph, 5);
    const b = bondHistoryResolver(agentId, graph, 5);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── traitOriginResolver ──────────────────────────────────────────────────────

describe('traitOriginResolver', () => {
  it('returns BackstoryLayer with stratum 2, priority 80, category history', () => {
    const { graph, agentId } = buildGraphWithTrait();
    const layers = traitOriginResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 2,
      priority: 80,
      category: 'history',
      source: 'traitOriginResolver',
    });
  });

  it('replaces {name} and {trait} placeholders', () => {
    const { graph, agentId } = buildGraphWithTrait();
    const layers = traitOriginResolver(agentId, graph, 42);
    expect(layers[0].text).toContain('Mira');
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{trait}');
  });

  it('returns [] when no has_trait edges', () => {
    const { graph, agentId } = buildBaseGraph();
    expect(traitOriginResolver(agentId, graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(traitOriginResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildGraphWithTrait();
    const a = traitOriginResolver(agentId, graph, 12);
    const b = traitOriginResolver(agentId, graph, 12);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── turningPointResolver ─────────────────────────────────────────────────────

describe('turningPointResolver', () => {
  it('returns BackstoryLayer with stratum 2, priority 60, category tension', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = turningPointResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 2,
      priority: 60,
      category: 'tension',
      source: 'turningPointResolver',
    });
  });

  it('replaces {name} placeholder', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = turningPointResolver(agentId, graph, 42);
    // Name should appear in some templates (not all require it)
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{value}');
  });

  it('uses the value pair with highest absolute magnitude', () => {
    // asceticism_extravagance = -0.6 is highest abs in default agent
    const { graph, agentId } = buildBaseGraph();
    const layers = turningPointResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('returns [] when axiologicalProfile missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(turningPointResolver('a', graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(turningPointResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = turningPointResolver(agentId, graph, 3);
    const b = turningPointResolver(agentId, graph, 3);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── contradictionResolver ────────────────────────────────────────────────────

describe('contradictionResolver', () => {
  it('returns BackstoryLayer with stratum 3, priority 100, category tension', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = contradictionResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 3,
      priority: 100,
      category: 'tension',
      source: 'contradictionResolver',
    });
  });

  it('uses CONTRADICTION_PROSE for pairs near zero (|value| < 0.15)', () => {
    // honesty_cunning = 0.05 is near zero → contradiction
    const { graph, agentId } = buildBaseGraph();
    const layers = contradictionResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('falls back to DECISIVE_NATURE_PROSE when no contradictions found', () => {
    // All values far from zero → decisive
    const graph = new WorldGraph();
    graph.addNode(makeAgent({
      axiologicalProfile: {
        loyalty_ambition: 0.9,
        courage_prudence: 0.8,
        mercy_ruthlessness: -0.7,
        honesty_cunning: 0.6,
        sacrifice_survival: -0.8,
        loyalty_ambition: 0.7,
        tradition_novelty: -0.6,
        preservation_transformation: 0.5,
        mercy_ruthlessness: 0.9,
        asceticism_extravagance: -0.8,
      },
    }));
    const layers = contradictionResolver('agent_0', graph, 42);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].source).toBe('contradictionResolver');
  });

  it('replaces {name} placeholder', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = contradictionResolver(agentId, graph, 42);
    expect(layers[0].text).not.toContain('{name}');
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(contradictionResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = contradictionResolver(agentId, graph, 7);
    const b = contradictionResolver(agentId, graph, 7);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── fearResolver ─────────────────────────────────────────────────────────────

describe('fearResolver', () => {
  it('returns BackstoryLayer with stratum 3, priority 80, category character', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = fearResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 3,
      priority: 80,
      category: 'character',
      source: 'fearResolver',
    });
  });

  it('derives fear from the strongest value pair', () => {
    // asceticism_extravagance = -0.6 is strongest in default agent (negative pole → _negative key)
    const { graph, agentId } = buildBaseGraph();
    const layers = fearResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].text).not.toContain('{fear}');
    expect(layers[0].text).not.toContain('{value}');
  });

  it('replaces {name} placeholder', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = fearResolver(agentId, graph, 42);
    expect(layers[0].text).not.toContain('{name}');
  });

  it('returns [] when axiologicalProfile missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(fearResolver('a', graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(fearResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = fearResolver(agentId, graph, 11);
    const b = fearResolver(agentId, graph, 11);
    expect(a[0].text).toBe(b[0].text);
  });

  // THR-1187 — the rendered join, which is where the defect was actually visible.
  //
  // fearResolver reads two sources that have to agree: VALUE_LABELS for {value} and the
  // FEAR_PROSE body keyed by the same sign. Only the composed line shows whether they agree
  // with each other, and only running BOTH poles shows it — on the shipped arrangement the
  // two bodies fit each other's keys, so a one-pole check passes on the inversion.
  //
  // THR-1199 note: this used to be THREE sources — FEAR_DESCRIPTIONS supplied {fear}. It no
  // longer does (the bodies want a bare noun, not the whole phrase), so the fear each pole
  // renders is no longer visible in this line and is asserted against the table directly
  // below instead. The pole→description alignment itself stays pinned by the literal table
  // in src/data/__tests__/strand-content.test.ts.
  it('renders honesty_cunning with each pole on its own body, label and fear', () => {
    function renderPole(pairValue: number): string[] {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'a',
        type: 'actor',
        name: 'Mira',
        properties: { axiologicalProfile: { honesty_cunning: pairValue } },
      });
      // Sweep seeds so the assertion sees the whole variant pool, not one draw.
      return [1, 7, 13, 42, 99, 123, 256, 777].map((s) => fearResolver('a', graph, s)[0]?.text ?? '');
    }

    const honest = renderPole(0.8);
    const cunning = renderPole(-0.8);

    expect(honest.every((t) => t.includes('Mira'))).toBe(true);
    expect(cunning.every((t) => t.includes('Mira'))).toBe(true);

    // The label each pole renders.
    expect(honest.every((t) => t.includes('Honest') && !t.includes('Cunning'))).toBe(true);
    expect(cunning.every((t) => t.includes('Cunning') && !t.includes('Honest'))).toBe(true);

    // The fear each pole is committed to, read off the table the resolver no longer joins.
    // Each pole fears the undoing of what that pole is committed to: Honest fears having to
    // deceive, Cunning fears being outwitted.
    expect(FEAR_DESCRIPTIONS.honesty_cunning).toEqual([
      'Fears having to deceive',
      'Fears being outwitted',
    ]);
    // The bodies still name the fear themselves, so the pole-specific content is in the line.
    expect(cunning.some((t) => t.includes('the fear of being outwitted'))).toBe(true);
    expect(honest.some((t) => t.includes('the fear of being outwitted'))).toBe(false);

    // The body each pole draws from. "watches the cunning prosper" is an outsider looking at
    // cunning people, so it belongs to the honest agent; "keeps no journal, writes no
    // letters" is tradecraft, so it belongs to the cunning one. These sat on the opposite
    // keys before this ticket.
    expect(honest.some((t) => t.includes('watches the cunning prosper'))).toBe(true);
    expect(cunning.some((t) => t.includes('keeps no journal, writes no letters'))).toBe(true);
    expect(honest.some((t) => t.includes('keeps no journal, writes no letters'))).toBe(false);
    expect(cunning.some((t) => t.includes('watches the cunning prosper'))).toBe(false);
  });

  // ─── THR-1199 — assertions that read the COMPOSED sentence ──────────────────
  //
  // The defect this pins shipped past two green checks: backstory-content.test.ts asserts
  // each key HAS a template containing {fear}, and the test above asserts the rendered text
  // no longer CONTAINS the literal '{fear}'. Substituting a grammatically wrong value
  // satisfies both. {fear} was the whole FEAR_DESCRIPTIONS phrase while every body puts the
  // placeholder in bare-noun position, so all 18 keys rendered lines like "the being
  // outwitted of being outwitted" and "the the loss of the old ways of loss".
  //
  // So these assertions read the sentence the player sees, not the placeholder.
  describe('composed sentence (THR-1199)', () => {
    /** Render one pole of one pair through the real resolver, sweeping seeds. */
    function renderKey(pair: string, pole: 'positive' | 'negative'): string[] {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'a',
        type: 'actor',
        name: 'Mira',
        properties: { axiologicalProfile: { [pair]: pole === 'positive' ? 0.8 : -0.8 } },
      } as GraphNode);
      const seeds = Array.from({ length: 200 }, (_, i) => i);
      return seeds.map((s) => fearResolver('a', graph, s)[0]?.text ?? '');
    }

    const keys = Object.keys(FEAR_PROSE).map((key) => {
      const match = key.match(/^(.*)_(positive|negative)$/);
      return { key, pair: match![1], pole: match![2] as 'positive' | 'negative' };
    });

    // Guards the sweep against the vacuous-probe shape: an empty or partial population
    // would pass every assertion below without reading a single defective sentence.
    it('sweeps every FEAR_PROSE key and every body within it', () => {
      expect(keys.length).toBe(18);
      for (const { key, pair, pole } of keys) {
        const rendered = new Set(renderKey(pair, pole));
        expect(rendered.has('')).toBe(false);
        expect(rendered.size).toBe(FEAR_PROSE[key].length);
      }
    });

    it.each(keys)('renders $key as grammatical prose on every body', ({ pair, pole }) => {
      for (const text of new Set(renderKey(pair, pole))) {
        // No placeholder survives substitution.
        expect(text).not.toMatch(/\{[a-z]+\}/i);
        // "the the loss of the old ways" — the phrase arriving in a slot that already has
        // its own article.
        expect(text).not.toMatch(/\b(the|a|an) (the|a|an)\b/i);
        // "of of", "in in" — the phrase carrying a preposition the body also supplies.
        expect(text).not.toMatch(/\b(of|in|at|to|for|with|beneath|behind) \1\b/i);
        // "the being outwitted of being outwitted" — the fear slot filled with a phrase,
        // leaving the body's own trailing preposition stranded on a repeat of it.
        expect(text).not.toMatch(/\bfear \w+ of \w+ of\b/i);
      }
    });

    it('substitutes {fear} as a bare singular noun, not a phrase', () => {
      // The contract the 107 placeholder-carrying bodies were authored against. A phrase
      // here is the whole defect: every body puts {fear} after an article or adjective and
      // before a verb or preposition, which only a single noun can occupy.
      const graph = new WorldGraph();
      graph.addNode({
        id: 'a',
        type: 'actor',
        name: 'Mira',
        properties: { axiologicalProfile: { courage_prudence: 0.8 } },
      } as GraphNode);
      const text = fearResolver('a', graph, 3)[0].text;
      const substituted = FEAR_PROSE.courage_prudence_positive
        .map((body) => {
          const rendered = body.replace(/\{name\}/g, 'Mira').replace(/\{value\}/g, 'Courageous');
          const pattern = new RegExp(
            rendered.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{fear\\\}/g, '(.+?)'),
          );
          return text.match(pattern)?.[1];
        })
        .find((v): v is string => v !== undefined);

      expect(substituted).toBeDefined();
      expect(substituted).toBe('fear');
      expect(substituted).not.toMatch(/\s/);
    });

    // A per-key golden sample. The reviewed composed line for each of the 18 keys, so the
    // sentence a player reads is checked-in text rather than something only assembled at
    // runtime — the surface both THR-1187 and THR-1199 were invisible on.
    it.each(keys)('$key golden render reads correctly', ({ key, pair, pole }) => {
      const first = FEAR_PROSE[key][0];
      const label = VALUE_LABELS[pair as keyof typeof VALUE_LABELS][pole === 'positive' ? 0 : 1];
      const expected = first
        .replace(/\{name\}/g, 'Mira')
        .replace(/\{value\}/g, label)
        .replace(/\{fear\}/g, 'fear');

      expect(new Set(renderKey(pair, pole))).toContain(expected);
      expect(expected).toMatch(/^[A-Z"']/);
      expect(expected.trimEnd()).toMatch(/[.!?]$/);
    });
  });
});

// ─── hiddenMotiveResolver ─────────────────────────────────────────────────────

describe('hiddenMotiveResolver', () => {
  it('returns BackstoryLayer with stratum 3, priority 60, category history', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = hiddenMotiveResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 3,
      priority: 60,
      category: 'history',
      source: 'hiddenMotiveResolver',
    });
  });

  it('replaces {name} and {strategy_description} placeholders', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = hiddenMotiveResolver(agentId, graph, 42);
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{strategy_description}');
  });

  it('returns [] when cooperationStrategy missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(hiddenMotiveResolver('a', graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(hiddenMotiveResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildBaseGraph();
    const a = hiddenMotiveResolver(agentId, graph, 2);
    const b = hiddenMotiveResolver(agentId, graph, 2);
    expect(a[0].text).toBe(b[0].text);
  });
});

// ─── storyArcResolver ────────────────────────────────────────────────────────

describe('storyArcResolver', () => {
  it('returns BackstoryLayer with stratum 4, priority 100, category tension', () => {
    const { graph, agentId } = buildGraphWithThread();
    const layers = storyArcResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 4,
      priority: 100,
      category: 'tension',
      source: 'storyArcResolver',
    });
  });

  it('replaces {name} and {arc_phase} placeholders', () => {
    const { graph, agentId } = buildGraphWithThread();
    const layers = storyArcResolver(agentId, graph, 42);
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{arc_phase}');
  });

  it('returns [] when narrativeArchetype missing', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'X', properties: {} });
    expect(storyArcResolver('a', graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(storyArcResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildGraphWithThread();
    const a = storyArcResolver(agentId, graph, 4);
    const b = storyArcResolver(agentId, graph, 4);
    expect(a[0].text).toBe(b[0].text);
  });

  it('works without a thread edge (falls back to default arc phase)', () => {
    const { graph, agentId } = buildBaseGraph();
    const layers = storyArcResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });
});

// ─── divineTransformationResolver ────────────────────────────────────────────

describe('divineTransformationResolver', () => {
  it('returns BackstoryLayer with stratum 4, priority 80, category character', () => {
    const { graph, agentId } = buildGraphWithThread(30);
    const layers = divineTransformationResolver(agentId, graph, 42);

    expect(layers.length).toBeGreaterThan(0);
    assertBackstoryLayer(layers[0], {
      stratum: 4,
      priority: 80,
      category: 'character',
      source: 'divineTransformationResolver',
    });
  });

  it('replaces {name} and {ascendant_sphere} placeholders', () => {
    const { graph, agentId } = buildGraphWithThread(30);
    const layers = divineTransformationResolver(agentId, graph, 42);
    expect(layers[0].text).not.toContain('{name}');
    expect(layers[0].text).not.toContain('{ascendant_sphere}');
  });

  it('selects "low" bracket when totalEssenceSpent < 20', () => {
    const { graph, agentId } = buildGraphWithThread(10);
    const layers = divineTransformationResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('selects "medium" bracket when totalEssenceSpent is 20-49', () => {
    const { graph, agentId } = buildGraphWithThread(35);
    const layers = divineTransformationResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('selects "high" bracket when totalEssenceSpent is 50-99', () => {
    const { graph, agentId } = buildGraphWithThread(75);
    const layers = divineTransformationResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('selects "massive" bracket when totalEssenceSpent >= 100', () => {
    const { graph, agentId } = buildGraphWithThread(150);
    const layers = divineTransformationResolver(agentId, graph, 42);
    expect(layers.length).toBeGreaterThan(0);
  });

  it('returns [] when no thread edge exists', () => {
    const { graph, agentId } = buildBaseGraph();
    expect(divineTransformationResolver(agentId, graph, 42)).toEqual([]);
  });

  it('returns [] for unknown node', () => {
    const graph = new WorldGraph();
    expect(divineTransformationResolver('nonexistent', graph, 42)).toEqual([]);
  });

  it('is deterministic', () => {
    const { graph, agentId } = buildGraphWithThread(30);
    const a = divineTransformationResolver(agentId, graph, 9);
    const b = divineTransformationResolver(agentId, graph, 9);
    expect(a[0].text).toBe(b[0].text);
  });
});
