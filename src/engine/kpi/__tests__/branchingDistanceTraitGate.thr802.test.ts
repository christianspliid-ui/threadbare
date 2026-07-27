/**
 * THR-802 — the branching-distance KPI resolves trait refs through the shared
 * THR-786 resolver, not by raw node-id equality against `has_trait` targets.
 *
 * The readout exists to tell content authors whether a gate is too tight. Before this
 * fix it compared `e.target` to `req.traitId` directly — the pre-unification
 * node-id-only vocabulary — so an agent who genuinely satisfies a `#craft` gate by tag,
 * by display name, or via a carried item (THR-737) was counted as blocked with a
 * fabricated `gap`. A wrong answer here actively misleads tuning.
 *
 * Every case below deliberately names the gate by a ref form that is **not** the trait
 * node's id (asserted explicitly, so the test cannot pass vacuously by id-match). The
 * gate is supplied through a mocked `getAnyEncounterById` because zero shipped templates
 * author a trait gate today — authoring is THR-778/WS5, which is exactly the moment this
 * branch stops being latent.
 */
import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { EncounterCacheEntry } from '../../encounterCache';
import type { TraitPredicate } from '../../../types/traits';

// The template registry is the only seam that can carry a trait gate today.
const gateHolder: { requiredTraits?: TraitPredicate[] } = {};
vi.mock('../../../data/encounter-content', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../data/encounter-content')>();
  return { ...actual, getAnyEncounterById: () => gateHolder };
});

const { computeGateDistance } = await import('../branchingDistance');

// ─── Helpers ────────────────────────────────────────────────────

const TEMPLATE_ID = 'test.branching.trait-gated';

/** Not part of any chain, so `isChainStageUnlocked` returns true and the chain branch
 *  never competes with the trait branch under test. */
const entry = { templateId: TEMPLATE_ID } as EncounterCacheEntry;

function addAgent(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', name } });
}

/** A trait definition node plus the assignment edge that gives it to `agentId`. */
function grantTraitNode(
  graph: WorldGraph,
  agentId: string,
  trait: { id: string; name?: string; tags?: string[] },
  level = 1,
): void {
  graph.addNode({
    id: trait.id,
    type: 'trait',
    // `name` is required on GraphNode; falling back to the id keeps the display-name
    // ref form absent for the cases that are not testing it (an id is already a ref).
    name: trait.name ?? trait.id,
    properties: trait.tags ? { tags: trait.tags } : {},
  });
  graph.addEdge({
    id: `has-${agentId}-${trait.id}`,
    type: 'has_trait',
    source: agentId,
    target: trait.id,
    properties: { level },
  });
}

/** An artifact whose `trait_grant` effect confers `grantedTrait` on `agentId`. */
function giveGrantingItem(graph: WorldGraph, agentId: string, grantedTrait: string): void {
  graph.addNode({
    id: `item-${agentId}`,
    type: 'artifact',
    name: 'Granting Item',
    properties: { effects: [{ type: 'trait_grant', grantedTrait }] },
  });
  graph.addEdge({
    id: `owns-${agentId}`,
    type: 'possesses',
    source: agentId,
    target: `item-${agentId}`,
    properties: {},
  });
}

function report(graph: WorldGraph, requiredTraits: TraitPredicate[]) {
  gateHolder.requiredTraits = requiredTraits;
  return computeGateDistance('prerequisites', entry, {} as GameState, graph);
}

/** Names appearing in the blocked-agent samples — the readout an author actually reads. */
const blockedNames = (r: ReturnType<typeof report>) => r.agentSamples.map(s => s.agentName);

// ─── Ref forms that were invisible to the raw id compare ─────────

describe('THR-802 — branchingDistance trait gate resolves every ref form', () => {
  it('does not count an agent who satisfies the gate by tag', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-tag', 'Smith');
    addAgent(graph, 'agent-none', 'Unblessed');
    grantTraitNode(graph, 'agent-tag', { id: 'trait.mastery.smithing', tags: ['#craft'] });

    // Vacuity guard: the gate ref is not the node id, so an id-only compare cannot match.
    expect('#craft').not.toBe('trait.mastery.smithing');

    const r = report(graph, [{ traitId: '#craft' }]);

    expect(blockedNames(r)).toEqual(['Unblessed']);
    expect(r.detail).toContain('50%');
  });

  it('does not count an agent who satisfies the gate by display name', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-name', 'Smith');
    addAgent(graph, 'agent-none', 'Unblessed');
    grantTraitNode(graph, 'agent-name', { id: 'trait.mastery.smithing', name: 'Master Smith' });

    expect('Master Smith').not.toBe('trait.mastery.smithing');

    const r = report(graph, [{ traitId: 'Master Smith' }]);

    expect(blockedNames(r)).toEqual(['Unblessed']);
    expect(r.detail).toContain('50%');
  });

  it('does not count an agent who satisfies the gate via an item grant (THR-737)', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-item', 'Bearer');
    addAgent(graph, 'agent-none', 'Unblessed');
    // No has_trait edge at all — the grant is the only thing satisfying this gate.
    giveGrantingItem(graph, 'agent-item', 'master_smith');

    const r = report(graph, [{ traitId: 'master_smith' }]);

    expect(blockedNames(r)).toEqual(['Unblessed']);
    expect(r.detail).toContain('50%');
  });

  it('still counts an agent holding none of the gate ref forms', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-other', 'Wanderer');
    grantTraitNode(graph, 'agent-other', { id: 'trait.social.charming', tags: ['#social'] });

    const r = report(graph, [{ traitId: '#craft' }]);

    expect(blockedNames(r)).toEqual(['Wanderer']);
    expect(r.detail).toContain('100%');
  });
});

// ─── The gap must reflect the level backing the matched ref ──────

describe('THR-802 — reported gap uses the matched ref level, not a missing-edge default', () => {
  it('reports the real shortfall for a ref held below minLevel under a non-id form', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-tag', 'Apprentice');
    grantTraitNode(graph, 'agent-tag', { id: 'trait.mastery.smithing', tags: ['#craft'] }, 1);

    const r = report(graph, [{ traitId: '#craft', minLevel: 3 }]);

    // Holds the ref at level 1, needs 3 → gap 2. The pre-fix edge lookup keyed on the
    // raw id found nothing and reported the full-height gap of 3.
    expect(r.agentSamples).toHaveLength(1);
    expect(r.agentSamples[0].distanceValue).toBe(2);
    expect(r.agentSamples[0].detail).toContain('gap: +2');
  });

  it('takes the highest level across traits sharing a ref', () => {
    const graph = new WorldGraph();
    addAgent(graph, 'agent-two', 'Journeyman');
    grantTraitNode(graph, 'agent-two', { id: 'trait.mastery.smithing', tags: ['#craft'] }, 1);
    grantTraitNode(graph, 'agent-two', { id: 'trait.mastery.masonry', tags: ['#craft'] }, 3);

    // Satisfied at 3 via the second trait — not blocked at all.
    expect(report(graph, [{ traitId: '#craft', minLevel: 3 }]).agentSamples).toHaveLength(0);

    // And when it does fall short, the gap is measured from the max, not the first edge.
    const r = report(graph, [{ traitId: '#craft', minLevel: 5 }]);
    expect(r.agentSamples[0].distanceValue).toBe(2);
  });
});
