/**
 * THR-1672 G1 — pin the edges the three hand-written spell writers produce, before
 * they are repointed at `grantSpell`.
 *
 * Plan: `Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md` § Systems design
 * ("Pure refactor first") and Kill criteria ("The grant seam changes a seeded world").
 * The snapshots were written against the pre-seam writers; after the repoint they must
 * pass unchanged. A diff here is the kill criterion, not a snapshot to update.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { allSpellDefinitionNodes } from '../../data/spell-templates';
import { allStrainConditionNodes } from '../../data/strain-conditions';
import { getUndertakingObjectType, type ObjectVerbContext } from '../../data/undertaking-objects';
import { seedSpellKnowing } from '../seedAttachments';
import { buildSpellLibrary } from '../spellGenerator/spellLibrary';
import { applySpellStamp } from '../debugEncounterTools';

const POWER = getUndertakingObjectType('power')!;
const ROLES = ['priest', 'healer', 'warmage', 'scholar', 'oracle', 'herald', 'enchanter', 'alchemist', 'monk', 'acolyte'];

function town(n = 10): { graph: WorldGraph; state: GameState; casters: string[] } {
  const graph = new WorldGraph();
  for (const node of allSpellDefinitionNodes()) graph.addNode(node);
  for (const node of allStrainConditionNodes()) graph.addNode(node);
  graph.addNode({ id: 'loc_0', name: 'Town', type: 'location', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'town' } });
  const casters: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = `caster_${String(i).padStart(3, '0')}`;
    graph.addNode({
      id, name: `Caster ${i}`, type: 'actor',
      properties: {
        actorType: 'individual', npcRole: ROLES[i % ROLES.length],
        sphereAlignment: i % 2 === 0 ? { primary: 'mind', secondary: 'life' } : undefined,
        domainCapabilities: { iron: 60, gold: 60, shadow: 60, veil: 60, heart: 60, eye: 60, stone: 60, star: 60 },
      },
    });
    graph.addEdge({ id: `located_at_${id}`, source: id, target: 'loc_0', type: 'located_at', properties: {} });
    casters.push(id);
  }
  const state = { graph, tick: 10, seed: 42, effectStates: new Map(), castCooldowns: new Map(), hiddenMarks: [] } as unknown as GameState;
  return { graph, state, casters };
}

/** Every spell edge in the world, sorted, property-for-property. */
function spellEdges(graph: WorldGraph): unknown[] {
  const out: unknown[] = [];
  for (const actor of graph.getNodesByType('actor')) {
    for (const e of graph.getOutgoingEdges(actor.id, 'knows_spell')) out.push({ id: e.id, source: e.source, target: e.target, type: e.type, properties: e.properties });
    for (const e of graph.getOutgoingEdges(actor.id, 'has_trait')) {
      if (graph.getNode(e.target)?.properties.subcategory !== 'spell') continue;
      out.push({ id: e.id, source: e.source, target: e.target, type: e.type, properties: e.properties });
    }
  }
  return out.sort((a, b) => String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)));
}

describe('THR-1672 pin — the three spell writers write the same edges through grantSpell', () => {
  it('seedSpellKnowing, THR-1571 path (no library)', () => {
    const { graph } = town();
    const report = seedSpellKnowing(graph);
    expect(report).toMatchSnapshot('report');
    expect(spellEdges(graph)).toMatchSnapshot('edges');
  });

  it('seedSpellKnowing, THR-1572 library path', () => {
    const { graph } = town();
    const built = buildSpellLibrary(graph, 42);
    const report = seedSpellKnowing(graph, { index: built.index, worldSeed: 42 });
    expect(report).toMatchSnapshot('report');
    expect(spellEdges(graph)).toMatchSnapshot('edges');
  });

  it('create × Power (learn_spell), library and sphere shelves, through the slot cap', () => {
    const { graph, state, casters } = town();
    const built = buildSpellLibrary(graph, 42);
    seedSpellKnowing(graph, { index: built.index, worldSeed: 42 });
    const results: unknown[] = [];
    for (const actorId of casters.slice(0, 4)) {
      for (let k = 0; k < 4; k++) {
        const ctx: ObjectVerbContext = { state, graph, actorId, handle: { kind: 'node', nodeId: actorId }, tick: 11 + k };
        results.push((POWER.verbs.create as (c: ObjectVerbContext) => unknown)(ctx));
      }
    }
    expect(results).toMatchSnapshot('results');
    expect(spellEdges(graph)).toMatchSnapshot('edges');
    expect(state.hiddenMarks).toMatchSnapshot('marks');
  });

  it('applySpellStamp (debug), including the full-slot eviction and an idempotent re-stamp', () => {
    const { graph, state } = town(1);
    const results = ['veilwalk', 'height_anchor', 'hollow_crown', 'spell_soulfire', 'veilwalk', 'nonexistent']
      .map(q => applySpellStamp(state, 'caster_000', q));
    expect(results).toMatchSnapshot('results');
    expect(spellEdges(graph)).toMatchSnapshot('edges');
  });
});
