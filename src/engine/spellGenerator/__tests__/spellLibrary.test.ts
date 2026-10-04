/**
 * The seeded spell generator wired into the world (THR-1572) — the library build, seeded
 * knowing from it, learning from it, casting a generated spell through `use × Power`, and
 * the switch that restores THR-1571's seeding exactly.
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Done when. Each on a
 * hand-built graph so the property under test is the only thing that can move.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { SpellTemplate } from '../../../types/effects';
import { allSpellDefinitionNodes, resolveSpellTemplate, spellDefinitionNodeId } from '../../../data/spell-templates';
import { allStrainConditionNodes } from '../../../data/strain-conditions';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { getUndertakingObjectType, type ObjectVerbContext } from '../../../data/undertaking-objects';
import { seedSpellKnowing } from '../../seedAttachments';
import { buildSpellLibrary, getTraditionLibrary, measureSoulDrainShare } from '../spellLibrary';
import { casterTraditionOf, traditionWeightsFor } from '../casterTradition';
import { placeSpellNotice, placeSeededCarriedNotices, spellNoticeMarkId } from '../notice';
import { SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET } from '../../../data/spell-generator-tables';

const POWER = getUndertakingObjectType('power')!;
const ROLES = ['priest', 'priest', 'priest', 'healer', 'healer', 'warmage', 'scholar', 'oracle', 'herald', 'enchanter', 'alchemist', 'monk', 'chaplain', 'acolyte'];

/** A town of casters across every caster role, plus spell and condition definitions. */
function town(n = 42): { graph: WorldGraph; state: GameState; casters: string[] } {
  const graph = new WorldGraph();
  for (const node of allSpellDefinitionNodes()) graph.addNode(node);
  for (const node of allStrainConditionNodes()) graph.addNode(node);
  for (const node of CONDITION_TRAIT_DEFINITIONS) if (!graph.getNode(node.id)) graph.addNode(node);
  graph.addNode({ id: 'loc_0', name: 'Town', type: 'location', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'town' } });
  graph.addNode({ id: 'loc_1', name: 'Next Town', type: 'location', properties: { hexCol: 1, hexRow: 0, locationSubtype: 'town' } });
  const casters: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = `caster_${String(i).padStart(3, '0')}`;
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual', npcRole: ROLES[i % ROLES.length], domainCapabilities: { iron: 60, gold: 60, shadow: 60, veil: 60, heart: 60, eye: 60, stone: 60, star: 60 }, quintessence: 0.8, quintessenceMax: 1 } });
    graph.addEdge({ id: `located_at_${id}`, source: id, target: 'loc_0', type: 'located_at', properties: {} });
    casters.push(id);
  }
  const state = { graph, tick: 10, seed: 42, effectStates: new Map(), castCooldowns: new Map(), hiddenMarks: [] } as unknown as GameState;
  return { graph, state, casters };
}

describe('casterTraditionOf — role and faction, never sphere (Lane decision 1)', () => {
  it('a priest is taught by a tradition that teaches what priests practise', () => {
    const { graph } = town(1);
    const w = traditionWeightsFor(graph, 'caster_000');
    expect(w['magic.holy']).toBeGreaterThan(w['magic.necromancy']);
    expect(casterTraditionOf(graph, 'caster_000', 42)).toBe(casterTraditionOf(graph, 'caster_000', 42));
  });
  it('a mortal with no role and no faction still gets a tradition (uniform, hashed)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'drifter', name: 'drifter', type: 'actor', properties: { actorType: 'individual' } });
    expect(casterTraditionOf(graph, 'drifter', 7)).toMatch(/^magic\./);
  });
});

describe('the library and seeded knowing', () => {
  it('builds one library per tradition in use, minted as shared definition nodes with their template', () => {
    const { graph } = town();
    const built = buildSpellLibrary(graph, 42);
    expect(built.report.emptySlots).toBe(0);
    expect(built.report.traditions).toBe(built.index.byTradition.size);
    for (const [traditionId, ids] of built.index.byTradition) {
      expect(getTraditionLibrary(graph, traditionId).map(t => t.id)).toEqual(ids);
      for (const id of ids) expect(resolveSpellTemplate(graph, id)?.id).toBe(id);
    }
  });

  it('seeds every caster from their tradition library, spreads the spells, and records the tradition', () => {
    const { graph } = town();
    const built = buildSpellLibrary(graph, 42);
    const report = seedSpellKnowing(graph, { index: built.index, worldSeed: 42 });
    expect(report.seeded).toBe(42);
    expect(report.fromLibrary).toBe(42);
    expect(report.fallbackCantrip).toBe(0);
    // Today: one spell held by every caster. With libraries, no spell is the world's only spell.
    const top = Math.max(...Object.values(report.bySpell));
    expect(top).toBeLessThan(42);
    const edge = graph.getOutgoingEdges('caster_000', 'knows_spell')[0];
    expect(edge.properties.tradition).toBe(built.index.traditionOf.get('caster_000'));
    expect(measureSoulDrainShare(graph)).toBeLessThanOrEqual(SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET);
  });

  it('without a library, seeding is THR-1571\'s path exactly (the switch-off regression)', () => {
    const a = town();
    const b = town();
    buildSpellLibrary(b.graph, 42); // minted but not handed to seeding
    const ra = seedSpellKnowing(a.graph);
    const rb = seedSpellKnowing(b.graph);
    expect(rb).toEqual(ra);
    expect(ra.fromLibrary).toBe(0);
    expect(Object.keys(ra.bySpell)).toEqual(['spell_height_anchor']);
  });
});

describe('learning prefers the tradition library', () => {
  it('create × Power offers the next unknown spell of the caster\'s own tradition', () => {
    const { graph, state } = town();
    const built = buildSpellLibrary(graph, 42);
    seedSpellKnowing(graph, { index: built.index, worldSeed: 42 });
    const tradition = built.index.traditionOf.get('caster_000')!;
    const library = built.index.byTradition.get(tradition)!;
    const ctx: ObjectVerbContext = { state, graph, actorId: 'caster_000', handle: { kind: 'node', nodeId: 'caster_000' }, tick: 11 };
    const result = (POWER.verbs.create as (c: ObjectVerbContext) => { success: boolean })(ctx);
    expect(result.success).toBe(true);
    const known = graph.getOutgoingEdges('caster_000', 'knows_spell').map(e => e.target);
    expect(known).toHaveLength(2);
    expect(library.map(spellDefinitionNodeId)).toContain(known[1]);
  });
});

describe('a generated deliberate spell casts through use × Power', () => {
  it('lands on success and writes nothing on failure (both arms)', () => {
    for (const outcome of ['success', 'failure'] as const) {
      const { graph, state } = town();
      buildSpellLibrary(graph, 42);
      const spell = graph.getNodesByType('trait')
        .map(n => n.properties.template as SpellTemplate | undefined)
        .find(t => t?.agency === 'deliberate' && t.effects[0]?.type === 'inflict_condition' && t.targeting.type === 'self');
      expect(spell).toBeDefined();
      const defId = spellDefinitionNodeId(spell!.id);
      graph.addEdge({ id: `has_trait_caster_000_${defId}`, source: 'caster_000', target: defId, type: 'has_trait', properties: { level: 1 } });
      graph.addEdge({ id: `knows_spell_caster_000_${defId}`, source: 'caster_000', target: defId, type: 'knows_spell', properties: { learnedTick: 0 } });
      const ctx: ObjectVerbContext = { state, graph, actorId: 'caster_000', handle: { kind: 'node', nodeId: defId }, tick: 10, projectId: `proj_${outcome}`, outcome };
      const res = (POWER.verbs.use as (c: ObjectVerbContext) => { success: boolean; error?: string })(ctx);
      expect(res.success, res.error).toBe(true);
      const condition = (spell!.effects[0] as { conditionTraitId: string }).conditionTraitId;
      const has = graph.getOutgoingEdges('caster_000', 'has_trait').some(e => e.target === condition);
      expect(has, outcome).toBe(outcome === 'success');
    }
  });
});

describe('notice (Lane decision 5)', () => {
  it('a transgression places exactly one forbidden_contact mark per caster per spell', () => {
    const { graph, state } = town();
    const g = graph;
    g.addNode({
      id: spellDefinitionNodeId('spell_gen_test_4_5'), name: 'Grey Refusal', type: 'trait',
      properties: { subcategory: 'spell', origin: 'generated', generated: { traditionId: 'magic.necromancy', priceLayer: 'transgression', notice: { severity: 0.7, revealFamilies: ['investigation'] } } },
    });
    expect(placeSpellNotice(state, 'caster_000', { id: 'spell_gen_test_4_5', name: 'Grey Refusal' }, 10, 'cast')?.category).toBe('forbidden_contact');
    expect(placeSpellNotice(state, 'caster_000', { id: 'spell_gen_test_4_5', name: 'Grey Refusal' }, 20, 'cast')).toBeNull();
    expect(state.hiddenMarks!.filter(m => m.markId === spellNoticeMarkId('caster_000', 'spell_gen_test_4_5'))).toHaveLength(1);
  });

  it('a spell with no notice places nothing, and a normal world seeds no carried notice', () => {
    const { graph, state } = town();
    const built = buildSpellLibrary(graph, 42);
    seedSpellKnowing(graph, { index: built.index, worldSeed: 42 });
    expect(placeSeededCarriedNotices(state)).toBe(0);
    expect(placeSpellNotice(state, 'caster_000', { id: 'spell_veilwalk', name: 'Veilwalk' }, 10, 'cast')).toBeNull();
  });
});
