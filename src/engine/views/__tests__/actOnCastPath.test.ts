/**
 * THR-1911 (Inspector plan § D9) — the one cast path's inputs.
 *
 * 1. `TARGET_CONTEXT_BUILDERS` has a builder for every target category, and each builds
 *    the context its category's gate expects.
 * 2. A Place is castable: the sublocation builder's `subtype` is `'sublocation'` (so the
 *    node-type gate matches) and its category still drives the `targetSubtypes` gate.
 * 3. The golden: a person's Act row deals exactly the slot ids the agent drawer dealt,
 *    and a place's and a hex's the slot ids the non-agent drawer dealt.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import type { TargetCategory } from '../../../types/targetContext';
import type { EssencePool } from '../../../types/influence';
import { getTargetActionSlots, templateIdFromSlotId } from '../../targetActions';
import { buildActorTargetContext, buildHexTargetContext, buildLocationTargetContext, buildSublocationTargetContext } from '../../targetContextBuilders';
import { AGENT_INTERVENTION_TEMPLATES, UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { getAscendantDomainAffinities } from '../../ascendant';
import { castCapabilityByReach } from '../../playerCastReadout';
import { teachSpellPreview } from '../../ascendantExpression';
import { getAvatarHexPosition } from '../../visibility';
import { TARGET_CONTEXT_BUILDERS, actOnCounts, actOnRowCards, actOnTargetForRef, buildActOn, categoryFor } from '../subjects/actOn';

const ASC = 'asc';

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shrine', type: 'location', name: 'The Shrine', properties: { parentLocationId: 'quarter', sublocationCategory: 'shrine' } });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'shrine', type: 'located_at', properties: {} });
  graph.addNode({ id: 'cong', type: 'actor', name: 'The Congregation', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'cup', type: 'artifact', name: 'A Cup', properties: {} });
  graph.addNode({ id: 'crown', type: 'artifact_legendary', name: 'The Crown', properties: {} });
  return {
    graph,
    ascendantId: ASC,
    tick: 12,
    seed: 42,
    tiles: [{ coord: { col: 3, row: 4 }, terrain: 'grassland', elevation: 0.5, moisture: 0.5 } as unknown as HexTile],
    essencePool: { spirit: 50, mind: 50, veil: 50 },
    unifiedActions: [],
    controlEffects: [],
    ascendantIdentity: { sphereAlignment: { primary: 'spirit', secondary: 'mind' } },
  } as unknown as GameState;
}

describe('TARGET_CONTEXT_BUILDERS (Law 58: one builder per target category)', () => {
  const CATEGORIES: TargetCategory[] = ['actor', 'location', 'sublocation', 'hex', 'artifact', 'artifact_legendary'];

  it('holds a builder for every category', () => {
    expect(Object.keys(TARGET_CONTEXT_BUILDERS).sort()).toEqual([...CATEGORIES].sort());
  });

  it('each builder returns its category\'s context, and null for a gone subject', () => {
    const state = world();
    expect(TARGET_CONTEXT_BUILDERS.actor(state, 'shutash')?.nodeType).toBe('actor');
    expect(TARGET_CONTEXT_BUILDERS.location(state, 'quarter')?.nodeType).toBe('location');
    expect(TARGET_CONTEXT_BUILDERS.sublocation(state, 'shrine')?.subtype).toBe('sublocation');
    expect(TARGET_CONTEXT_BUILDERS.hex(state, '3,4')?.position).toEqual({ col: 3, row: 4 });
    expect(TARGET_CONTEXT_BUILDERS.artifact(state, 'cup')?.nodeType).toBe('artifact');
    expect(TARGET_CONTEXT_BUILDERS.artifact_legendary(state, 'crown')?.nodeType).toBe('artifact_legendary');
    expect(TARGET_CONTEXT_BUILDERS.actor(state, 'gone')).toBeNull();
    expect(TARGET_CONTEXT_BUILDERS.hex(state, 'not-a-hex')).toBeNull();
  });

  it('a ref maps to its target: a Place is a sublocation, a legendary artifact its own category', () => {
    const state = world();
    expect(actOnTargetForRef(state, { kind: 'location', id: 'shrine' })).toEqual({ kind: 'sublocation', id: 'shrine' });
    expect(actOnTargetForRef(state, { kind: 'location', id: 'quarter' })).toEqual({ kind: 'location', id: 'quarter' });
    expect(actOnTargetForRef(state, { kind: 'faction', id: 'f' })).toEqual({ kind: 'faction', id: 'f' });
    expect(actOnTargetForRef(state, { kind: 'hex', id: '3,4' })).toEqual({ kind: 'hex', col: 3, row: 4 });
    expect(actOnTargetForRef(state, { kind: 'encounter', id: 'e' })).toBeNull();
    expect(categoryFor(state, { kind: 'artifact', id: 'crown' }).category).toBe('artifact_legendary');
  });
});

describe('a Place can be cast on (the sublocation subtype fix)', () => {
  const sanctify = getUnifiedTemplateById('sub.sanctify');

  it('a shrine meets Sanctify: the node-type gate matches and the category drives the subtype gate', () => {
    expect(sanctify).toBeDefined();
    const graph = world().graph;
    const ctx = buildSublocationTargetContext('shrine', graph)!;
    const slots = getTargetActionSlots({ target: ctx, templates: [sanctify!], pool: { spirit: 50 } as unknown as EssencePool, primarySphere: 'spirit', accessibleSpheres: ['spirit'] });
    expect(slots.map(s => templateIdFromSlotId(s.id))).toContain('sub.sanctify');
  });

  it('a tavern does not (its category is not in the card\'s subtypes)', () => {
    const graph = world().graph;
    graph.getNode('shrine')!.properties.sublocationCategory = 'tavern';
    const ctx = buildSublocationTargetContext('shrine', graph)!;
    const slots = getTargetActionSlots({ target: ctx, templates: [sanctify!], pool: { spirit: 50 } as unknown as EssencePool, primarySphere: 'spirit', accessibleSpheres: ['spirit'] });
    expect(slots.map(s => templateIdFromSlotId(s.id))).not.toContain('sub.sanctify');
  });
});

describe('the Act-row golden: the same slot ids the drawers dealt', () => {
  /** The drawers' parameter list (`useAgentInteraction`, `useTargetActions`), written out. */
  function drawerIds(state: GameState, ctx: ReturnType<typeof buildActorTargetContext>, agent: boolean): string[] {
    const g = state.graph;
    const slots = getTargetActionSlots({
      target: ctx!,
      templates: agent ? AGENT_INTERVENTION_TEMPLATES : UNIFIED_ACTION_TEMPLATES,
      pool: state.essencePool,
      primarySphere: 'spirit',
      avatarPos: getAvatarHexPosition(g, ASC) ?? undefined,
      accessibleSpheres: ['spirit', 'mind'],
      hexRevelation: state.hexRevelation,
      ...(agent ? {} : { existingThreadTier: null }),
      unlockedActionIds: state.unlockedActionIds,
      ascendantDomainAffinities: getAscendantDomainAffinities(g, ASC),
      ascendantCastCapabilities: castCapabilityByReach(g, ASC),
      heldControlEffects: state.controlEffects,
      controlOwnerId: ASC,
      pendingActions: state.unifiedActions,
      spellTeachingPreview: teachSpellPreview(g, ASC, ctx!.nodeId, 42),
    });
    return slots.filter(s => s.type === 'target_action' || s.type === 'intervention').map(s => s.id);
  }

  it('a person', () => {
    const state = world();
    const row = buildActOn(state, { kind: 'agent', id: 'shutash' }, 'Shutash');
    expect(row.cards.map(c => c.actionId)).toEqual(drawerIds(state, buildActorTargetContext('shutash', state.graph, 0), true));
    expect(row.cards.length).toBeGreaterThan(0);
  });

  it('a place', () => {
    const state = world();
    const row = buildActOn(state, { kind: 'location', id: 'quarter' }, 'Temple Quarter');
    expect(row.cards.map(c => c.actionId)).toEqual(drawerIds(state, buildLocationTargetContext('quarter', state.graph), false));
  });

  it('a faction (the FactionSheet drawer: the actor context, the non-agent hand)', () => {
    const state = world();
    const row = buildActOn(state, { kind: 'faction', id: 'cong' }, 'The Congregation');
    expect(row.cards.map(c => c.actionId)).toEqual(drawerIds(state, buildActorTargetContext('cong', state.graph), false));
  });

  it('open land', () => {
    const state = world();
    const row = buildActOn(state, { kind: 'hex', col: 3, row: 4 }, 'Open grassland', true);
    expect(row.cards.map(c => c.actionId)).toEqual(drawerIds(state, buildHexTargetContext({ col: 3, row: 4, terrain: 'grassland', graph: state.graph }), false));
  });
});

describe('THR-1913 — row cards and the identity-less run', () => {
  it('a run with no identity reads the god\'s spheres from its node, so the Act row still deals', () => {
    const state = world();
    const withIdentity = buildActOn(state, { kind: 'location', id: 'quarter' }, 'Temple Quarter').cards.map(c => c.actionId);
    const bare = { ...state, ascendantIdentity: null } as unknown as GameState;
    state.graph.getNode(ASC)!.properties.sphereAlignment = { primary: 'spirit', secondary: 'mind' };
    expect(withIdentity.length).toBeGreaterThan(0);
    expect(buildActOn(bare, { kind: 'location', id: 'quarter' }, 'Temple Quarter').cards.map(c => c.actionId)).toEqual(withIdentity);
  });

  it('a row counts only the cards it can cast now, and a ref nothing can be cast on counts 0', () => {
    const state = world();
    const all = buildActOn(state, { kind: 'location', id: 'quarter' }, 'Temple Quarter').cards;
    const counts = actOnCounts(state, [{ kind: 'location', id: 'quarter' } as never, { kind: 'record', id: 'r1' } as never]);
    expect(counts['location:quarter']).toBe(all.filter(c => c.available).length);
    expect(counts['record:r1']).toBe(0);
    expect(actOnRowCards(state, { kind: 'location', id: 'quarter' } as never).every(c => c.available)).toBe(true);
  });
});
