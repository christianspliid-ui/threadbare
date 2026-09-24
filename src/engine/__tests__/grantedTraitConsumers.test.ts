/**
 * THR-737 — `trait_grant` consumer wiring.
 *
 * The effect primitive was written by ~20 authored payloads and read by nobody:
 * `hasGrantedTrait` had zero production callers, so an item that said it granted
 * `intimidate` granted nothing any decision could act on. These tests pin the
 * three production gates that now consume the granted set.
 *
 * The intersection under test is a real one, not a fixture: `artifact-templates.ts`
 * grants `master_smith` on The Worldforge Anvil, and `ambition-templates.ts` gates
 * `ambition_forge_legend` on `requiredTraits: ['master_smith']`. If either side is
 * ever re-authored away, the ambition case below fails loudly rather than passing
 * vacuously.
 */
import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import type { AttachmentEffect } from '../../types/effects';
import { collectGrantedTraits, hasGrantedTrait } from '../effects/effectQueries';
import { buildAmbitionAgentSnapshot } from '../ambitionTick';
import { passesEligibility, scoreDesirability } from '../ambitionSelection';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { ARTIFACT_TEMPLATES } from '../../data/artifact-templates';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Agent holding one possession whose `effects[]` are supplied by the caller.
 * `active` on the possesses edge is the walker's suppression seam.
 */
function graphWithItem(
  effects: AttachmentEffect[],
  opts?: { active?: boolean; capabilities?: Partial<Record<ReachDomain, number>> },
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Test Agent',
    properties: { domainCapabilities: opts?.capabilities ?? {} },
  });
  graph.addNode({
    id: 'item-1',
    type: 'artifact',
    name: 'Test Item',
    properties: { effects },
  });
  graph.addEdge({
    id: 'edge-1',
    type: 'possesses',
    source: 'agent-1',
    target: 'item-1',
    properties: opts?.active === false ? { active: false } : {},
  });
  return graph;
}

// ─── The aggregate ──────────────────────────────────────────────

describe('collectGrantedTraits', () => {
  it('collects grantedTrait ids from active trait_grant effects', () => {
    const graph = graphWithItem([
      { type: 'trait_grant', grantedTrait: 'intimidate' },
      { type: 'trait_grant', grantedTrait: 'cavalry_charge' },
      { type: 'permanent', reach: 'iron', value: 0.1 },
    ]);
    expect(collectGrantedTraits(graph, 'agent-1')).toEqual(
      new Set(['intimidate', 'cavalry_charge']),
    );
  });

  it('returns an empty set for an agent with no attachments', () => {
    const graph = graphWithItem([]);
    expect(collectGrantedTraits(graph, 'agent-1').size).toBe(0);
  });

  it('fail-soft: unknown agent yields an empty set, never a throw', () => {
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'intimidate' }]);
    expect(() => collectGrantedTraits(graph, 'no-such-agent')).not.toThrow();
    expect(collectGrantedTraits(graph, 'no-such-agent').size).toBe(0);
  });

  it('skips suppressed attachments (active === false on the edge)', () => {
    const graph = graphWithItem(
      [{ type: 'trait_grant', grantedTrait: 'intimidate' }],
      { active: false },
    );
    expect(collectGrantedTraits(graph, 'agent-1').size).toBe(0);
  });

  it('hasGrantedTrait delegates to the aggregate', () => {
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'intimidate' }]);
    expect(hasGrantedTrait(graph, 'agent-1', 'intimidate')).toBe(true);
    expect(hasGrantedTrait(graph, 'agent-1', 'master_smith')).toBe(false);
  });
});

// ─── Gate 1: ambition eligibility ───────────────────────────────

describe('ambition eligibility consumes granted traits', () => {
  const forgeLegend = AMBITION_TEMPLATES.find(t => t.id === 'ambition_forge_legend')!;
  const anvil = ARTIFACT_TEMPLATES.find(t => t.id === 'worldforge_anvil')!;

  // THR-1348 repointed this pairing from the gate to the boost. `requiredTraits:
  // ['master_smith']` was the pool's only non-empty gate and its sole producer is a
  // tier-4 cursed artifact `seedPossessions` can never deal, so the ambition had zero
  // holders on every seed. The trait still boosts, so the `trait_grant` contract keeps
  // a live consumer here — the contract evidence in `interface-contracts.ts` cites this.
  it('the live intersection still exists on the boosting side (guards against a vacuous test)', () => {
    expect(forgeLegend.requiredTraits).not.toContain('master_smith');
    expect(forgeLegend.boostingTraits).toContain('master_smith');
    expect(anvil.effects).toContainEqual({ type: 'trait_grant', grantedTrait: 'master_smith' });
  });

  it('an agent holding the anvil carries master_smith into the snapshot and scores the ambition higher', () => {
    const withAnvil = buildAmbitionAgentSnapshot(
      graphWithItem(anvil.effects as AttachmentEffect[], { capabilities: { iron: 36, veil: 36 } }),
      'agent-1',
    );
    const without = buildAmbitionAgentSnapshot(
      graphWithItem([], { capabilities: { iron: 36, veil: 36 } }),
      'agent-1',
    );

    expect(withAnvil.traits).toContain('master_smith');
    expect(without.traits).not.toContain('master_smith');
    expect(passesEligibility(forgeLegend, withAnvil)).toBe(true);
    // Same fixed stream on both arms so the only difference is the boost.
    const fixed = () => 0.5;
    expect(scoreDesirability(forgeLegend, withAnvil, fixed)).toBeGreaterThan(scoreDesirability(forgeLegend, without, fixed));
  });

  it('the same agent without the anvil is eligible on reach alone — the gate is gone', () => {
    const graph = graphWithItem([], { capabilities: { iron: 36, veil: 36 } });
    const snapshot = buildAmbitionAgentSnapshot(graph, 'agent-1');

    expect(passesEligibility(forgeLegend, snapshot)).toBe(true);
  });
});

// ─── Gate 2: spell prerequisites ────────────────────────────────

describe('spell prerequisites consume granted traits', () => {
  it('a granted trait satisfies a spell requiredTraits prerequisite', async () => {
    const { checkPrerequisites } = await import('../spellActivation');
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'master_smith' }]);

    const spell = {
      id: 'spell-test',
      name: 'Test Spell',
      prerequisites: { requiredTraits: ['master_smith'] },
    };

    expect(checkPrerequisites(graph, 'agent-1', spell as never).met).toBe(true);
  });

  it('an unrelated granted trait does not satisfy it', async () => {
    const { checkPrerequisites } = await import('../spellActivation');
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'intimidate' }]);

    const spell = {
      id: 'spell-test',
      name: 'Test Spell',
      prerequisites: { requiredTraits: ['master_smith'] },
    };

    expect(checkPrerequisites(graph, 'agent-1', spell as never).met).toBe(false);
  });
});

// ─── Gate 3: encounter eligibility ──────────────────────────────

vi.mock('../../data/encounter-content', async importOriginal => {
  const actual = await importOriginal<typeof import('../../data/encounter-content')>();
  return {
    ...actual,
    getAnyEncounterById: (id: string) => {
      if (id === 'tmpl-requires-trait') {
        return { id, requiredTraits: [{ traitId: 'master_smith' }] };
      }
      if (id === 'tmpl-blocked-by-trait') {
        return { id, blockedByTraits: ['master_smith'] };
      }
      return actual.getAnyEncounterById(id);
    },
  };
});

describe('encounter eligibility consumes granted traits', () => {
  /** Minimal cache entry — only templateId is read by the trait gate. */
  const entry = (templateId: string) =>
    ({ templateId, locationId: 'loc-1' }) as never;

  it('a granted trait unlocks a requiredTraits-gated template', async () => {
    const { filterByPrerequisites } = await import('../encounterFilterPipeline');
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'master_smith' }]);

    const result = filterByPrerequisites([entry('tmpl-requires-trait')], 'agent-1', graph);
    expect(result).toHaveLength(1);
  });

  it('without the grant the same template stays filtered out', async () => {
    const { filterByPrerequisites } = await import('../encounterFilterPipeline');
    const graph = graphWithItem([]);

    const result = filterByPrerequisites([entry('tmpl-requires-trait')], 'agent-1', graph);
    expect(result).toHaveLength(0);
  });

  it('a granted trait blocks symmetrically via blockedByTraits', async () => {
    const { filterByPrerequisites } = await import('../encounterFilterPipeline');
    const graph = graphWithItem([{ type: 'trait_grant', grantedTrait: 'master_smith' }]);

    const result = filterByPrerequisites([entry('tmpl-blocked-by-trait')], 'agent-1', graph);
    expect(result).toHaveLength(0);
  });
});
