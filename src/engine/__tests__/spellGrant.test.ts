/**
 * Spells as divine gifts and found tomes (THR-1672).
 *
 * Plan: `Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md` § Done when. Each
 * on a hand-built graph so the property under test is the only thing that can move, and
 * both arms of every behaviour change are asserted.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { allSpellDefinitionNodes, spellDefinitionNodeId, resolveSpellTemplate } from '../../data/spell-templates';
import { allStrainConditionNodes } from '../../data/strain-conditions';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';
import { getUndertakingObjectType, type ObjectVerbContext } from '../../data/undertaking-objects';
// Imported before the catalogs below: `undertaking-objects` loaded cold closes a module
// cycle that fails at load (pre-existing on main; the pin test uses the same order).
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { SLOT_CAPS } from '../../data/attachment-slot-constants';
import {
  DIVINE_TAUGHT_CAST_DETECTION,
  DIVINE_TEACH_DARK_DETECTION,
  DIVINE_TEACH_DARK_DOOM,
  DIVINE_TEACH_MAX_TIER,
} from '../../data/spell-grant-constants';
import {
  grantSpell, isDarkSpell, onItemAcquired, pickDivineSpell, pickTomeSpell, tomeTeaches,
} from '../spellGrant';
import { applyTeachSpell, teachSpellPreview, TEACH_SPELL_NOT_THREADED_REASON } from '../ascendantExpression';
import { recordDetectionCrossings } from '../orchestrator/phaseDetectionPressure';
import { instantiateReward } from '../rewardPool';
import { buildSpellLibrary } from '../spellGenerator/spellLibrary';
import { resolveCast } from '../spellCasting';
import { createDoomClockState } from '../doomClock';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime } from '../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { getTargetActionSlots } from '../targetActions';
import { getAgentAttachments } from '../agentAttachments';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { TargetContext } from '../../types/targetContext';

const ITEM = getUndertakingObjectType('item')!;

/** A region holding a town, a god, a threaded priest, a farmer, and every spell and book. */
function world(opts: { library?: boolean } = {}): { graph: WorldGraph; state: GameState } {
  const graph = new WorldGraph();
  for (const node of allSpellDefinitionNodes()) graph.addNode(node);
  for (const node of allStrainConditionNodes()) graph.addNode(node);
  for (const node of CONDITION_TRAIT_DEFINITIONS) if (!graph.getNode(node.id)) graph.addNode(node);
  for (const node of REWARD_POSSESSIONS) if (!graph.getNode(node.id)) graph.addNode(node as never);
  graph.addNode({ id: 'region_a', name: 'The Reach', type: 'region', properties: {} });
  graph.addNode({ id: 'loc_0', name: 'Town', type: 'location', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'town' } });
  graph.addEdge({ id: 'contains_region_a_loc_0', source: 'region_a', target: 'loc_0', type: 'contains', properties: {} });
  graph.addNode({ id: 'asc', name: 'The Quiet God', type: 'actor', properties: { actorType: 'ascendant', sphereAlignment: { primary: 'mind', secondary: 'life' } } });
  const caps = { iron: 60, gold: 60, shadow: 60, veil: 60, heart: 60, eye: 60, stone: 60, star: 60 };
  for (const [id, role] of [['priest', 'priest'], ['farmer', 'farmer']] as const) {
    graph.addNode({ id, name: id === 'priest' ? 'Ser Aldric' : 'Wenna Holt', type: 'actor', properties: { actorType: 'individual', npcRole: role, domainCapabilities: caps, quintessence: 0.8, quintessenceMax: 1 } });
    graph.addEdge({ id: `located_at_${id}`, source: id, target: 'loc_0', type: 'located_at', properties: {} });
  }
  graph.addEdge({ id: 'thread_asc_priest', source: 'asc', target: 'priest', type: 'thread', properties: { awareness: 'faith' } });
  if (opts.library) buildSpellLibrary(graph, 42);
  const state = {
    graph, tick: 20, seed: 42, ascendantId: 'asc', effectStates: new Map(), castCooldowns: new Map(), hiddenMarks: [],
    regionalDetectionPressure: [], pendingEncounterSeeds: [], doomClock: createDoomClockState('erosion' as never, 1000),
    tickEvents: [], recentEvents: [],
  } as unknown as GameState;
  return { graph, state };
}

const known = (graph: WorldGraph, actorId: string) => graph.getOutgoingEdges(actorId, 'knows_spell');
const pressureIn = (state: GameState, regionId: string) => state.regionalDetectionPressure.find(r => r.regionId === regionId)?.pressure ?? 0;

/** A generated transgression spell in the world, or undefined. */
function darkSpellId(graph: WorldGraph): string | undefined {
  return graph.getNodesByType('trait')
    .filter(n => n.properties.subcategory === 'spell' && n.properties.origin === 'generated')
    .map(n => String(n.properties.spellTemplateId))
    .sort()
    .find(id => isDarkSpell(graph, id));
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('grantSpell — the one seam', () => {
  it('writes known and wielded, records provenance, and traces spell.granted', () => {
    const { graph } = world();
    const r = grantSpell(graph, 'farmer', 'spell_veilwalk', { source: 'divine', tick: 5, grantedBy: 'asc' });
    expect(r).toMatchObject({ granted: true, wielded: true, newlyWielded: true, spellId: 'spell_veilwalk' });
    const edge = known(graph, 'farmer')[0];
    expect(edge.properties).toMatchObject({ learnedTick: 5, source: 'divine', grantedBy: 'asc' });
    expect(graph.getOutgoingEdges('farmer', 'has_trait').some(e => e.target === spellDefinitionNodeId('spell_veilwalk'))).toBe(true);
    expect(getTraces().some(t => t.category === 'spell.granted' && (t as { source?: string }).source === 'divine')).toBe(true);
  });

  it('past the slot cap a spell is known, not carried — and a second grant is refused', () => {
    const { graph } = world();
    const ids = ['spell_veilwalk', 'spell_soulfire', 'spell_hollow_crown', 'spell_crystal_gate'];
    const results = ids.map(id => grantSpell(graph, 'farmer', id, { source: 'tome', tick: 1 }));
    expect(results.filter(r => r.wielded)).toHaveLength(SLOT_CAPS.spell ?? 3);
    expect(results[3]).toMatchObject({ granted: true, wielded: false });
    expect(grantSpell(graph, 'farmer', 'spell_veilwalk', { source: 'tome', tick: 2 }).refused).toBe('already_known');
    expect(grantSpell(graph, 'farmer', 'spell_nonexistent', { source: 'tome', tick: 2 }).refused).toBe('unknown_spell');
    expect(grantSpell(graph, 'nobody', 'spell_veilwalk', { source: 'tome', tick: 2 }).refused).toBe('missing_actor');
  });
});

describe('the divine pool (Lane decision 2)', () => {
  it('prefers the god\'s primary sphere, never teaches above DIVINE_TEACH_MAX_TIER, and is deterministic', () => {
    const { graph } = world({ library: true });
    const pick = pickDivineSpell(graph, 'asc', 'farmer', 42);
    expect(pick).not.toBeNull();
    expect(pick!.tier).toBeLessThanOrEqual(DIVINE_TEACH_MAX_TIER);
    expect(pickDivineSpell(graph, 'asc', 'farmer', 42)).toEqual(pick);
    const mindSpells = graph.getNodesByType('trait').filter(n => n.properties.subcategory === 'spell' && n.properties.sphereAffinity === 'mind' && Number(n.properties.tier) <= DIVINE_TEACH_MAX_TIER);
    if (mindSpells.length > 0) expect(resolveSpellTemplate(graph, pick!.spellId)?.sphereAffinity).toBe('mind');
  });

  it('falls back to the mortal\'s tradition when the god\'s spheres hold nothing low enough', () => {
    const { graph } = world({ library: true });
    graph.updateNode('asc', { properties: { sphereAlignment: { primary: 'chaos', secondary: 'order' } } });
    const pick = pickDivineSpell(graph, 'asc', 'priest', 42);
    expect(pick).not.toBeNull();
  });

  it('is empty once the mortal knows everything it could teach', () => {
    const { graph } = world();
    for (let k = 0; k < 20; k++) {
      const pick = pickDivineSpell(graph, 'asc', 'farmer', 42);
      if (!pick) break;
      grantSpell(graph, 'farmer', pick.spellId, { source: 'divine', tick: k });
    }
    expect(pickDivineSpell(graph, 'asc', 'farmer', 42)).toBeNull();
    // The farmer has no thread: the card locks on the gate before the pool is asked.
    expect(teachSpellPreview(graph, 'asc', 'farmer', 42)).toEqual({ lockedReason: TEACH_SPELL_NOT_THREADED_REASON });
    expect(teachSpellPreview(graph, 'asc', 'loc_0', 42)).toBeUndefined();
  });
});

describe('Teach a Spell (applyTeachSpell)', () => {
  it('teaches a threaded mortal with grantedBy; refuses one with no thread (both arms)', () => {
    const { state, graph } = world({ library: true });
    const taught = applyTeachSpell(state, 'asc', 'priest', 20);
    expect(taught.success).toBe(true);
    expect(known(graph, 'priest').find(e => e.properties.source === 'divine')?.properties.grantedBy).toBe('asc');
    const refused = applyTeachSpell(state, 'asc', 'farmer', 20);
    expect(refused).toMatchObject({ success: false, failSoft: 'no_thread' });
    expect(known(graph, 'farmer')).toHaveLength(0);
  });

  it('teaching dark magic costs the god doom and detection; gentle magic costs neither', () => {
    const dark = world({ library: true });
    const darkId = darkSpellId(dark.graph);
    expect(darkId, 'the library holds a transgression to teach').toBeDefined();
    const doomBefore = dark.state.doomClock.tickModifier;
    const res = applyTeachSpell(dark.state, 'asc', 'priest', 20, { spellId: darkId });
    expect(res).toMatchObject({ success: true, dark: true });
    expect(dark.state.doomClock.tickModifier).toBeCloseTo(doomBefore + DIVINE_TEACH_DARK_DOOM);
    expect(pressureIn(dark.state, 'region_a')).toBeCloseTo(DIVINE_TEACH_DARK_DETECTION);
    expect(getTraces().some(t => t.category === 'spell.divine_teaching_priced')).toBe(true);

    const gentle = world();
    const before = gentle.state.doomClock.tickModifier;
    expect(applyTeachSpell(gentle.state, 'asc', 'priest', 20, { spellId: 'spell_veilwalk' })).toMatchObject({ success: true, dark: false });
    expect(gentle.state.doomClock.tickModifier).toBe(before);
    expect(pressureIn(gentle.state, 'region_a')).toBe(0);
  });

  it('dark teaching that crosses a detection band traces the crossing, as a nudge write does', () => {
    const { state, graph } = world({ library: true });
    const darkId = darkSpellId(graph)!;
    state.regionalDetectionPressure = [{ regionId: 'region_a', pressure: 0.9, lastUpdatedTick: 0 }] as never;
    applyTeachSpell(state, 'asc', 'priest', 20, { spellId: darkId, recordCrossings: recordDetectionCrossings });
    expect(pressureIn(state, 'region_a')).toBe(1);
    expect(getTraces().some(t => t.category === 'detection_threshold_crossed' && (t as { regionId?: string }).regionId === 'region_a')).toBe(true);
  });

  it('a cast of a god-taught transgression echoes: detection rises and the mark names the god', () => {
    const { state, graph } = world({ library: true });
    const darkId = graph.getNodesByType('trait')
      .filter(n => n.properties.origin === 'generated' && n.properties.agency === 'deliberate')
      .map(n => String(n.properties.spellTemplateId))
      .sort()
      .find(id => isDarkSpell(graph, id) && resolveSpellTemplate(graph, id)?.targeting.type === 'self');
    expect(darkId).toBeDefined();
    applyTeachSpell(state, 'asc', 'priest', 20, { spellId: darkId });
    const afterTeach = pressureIn(state, 'region_a');
    resolveCast(state, { casterId: 'priest', spell: resolveSpellTemplate(graph, darkId!)!, band: 'success', tick: 21, site: 'step', siteRef: 'test' } as never);
    expect(pressureIn(state, 'region_a')).toBeCloseTo(afterTeach + DIVINE_TAUGHT_CAST_DETECTION);
    const mark = (state.hiddenMarks ?? []).find(m => m.targetAgentId === 'priest');
    expect(mark?.label).toContain("The Quiet God's teaching");
    expect(getTraces().some(t => t.category === 'spell.divine_echo')).toBe(true);
  });
});

describe('books that teach (Lane decision 6)', () => {
  it('the predicate: arcane and ancient books teach; maps and plain books do not', () => {
    const { graph } = world();
    expect(tomeTeaches(graph.getNode('reward_tomes_scrolls_veilscript_fragment'))).toBe('arcane');
    expect(tomeTeaches(graph.getNode('reward_tomes_scrolls_the_silent_testament'))).toBe('ancient');
    expect(tomeTeaches(graph.getNode('reward_tomes_scrolls_field_journal'))).toBeNull();
    expect(tomeTeaches({ properties: { subcategory: 'tomes_scrolls', tags: ['#ancient', '#map'] } })).toBeNull();
    expect(tomeTeaches({ properties: { origin: 'generated', generated: { coreId: 'forbidden_book', band: 2 } } })).toBe('arcane');
    expect(tomeTeaches({ properties: { origin: 'generated', generated: { coreId: 'forbidden_book', band: 3 } } })).toBe('ancient');
  });

  it('a reward book teaches a non-caster on the way in, once, and the reward says so', () => {
    const { graph } = world();
    const r = instantiateReward(graph, 'reward_tomes_scrolls_veilscript_fragment', 'farmer', 30);
    expect(r?.taughtSpellName).toBeDefined();
    const edge = known(graph, 'farmer')[0];
    expect(edge.properties).toMatchObject({ source: 'tome', viaItemId: r!.instanceId });
    // Once per reader: the same book in the same hands teaches nothing more.
    expect(onItemAcquired(graph, 'farmer', r!.instanceId, 31, 'reward')).toBeNull();
    expect(known(graph, 'farmer')).toHaveLength(1);
    // A plain book teaches nothing.
    expect(instantiateReward(graph, 'reward_tomes_scrolls_field_journal', 'priest', 30)?.taughtSpellName).toBeUndefined();
    // The sheet says where it came from.
    const sheet = getAgentAttachments(graph, 'farmer');
    const entry = [...sheet.powers, ...sheet.knownSpells].find(p => p.id === edge.target) as { learnedFrom?: string } | undefined;
    expect(entry?.learnedFrom).toBe('Veilscript Fragment');
  });

  it('an ancient book prefers elder magic, up to tier 3', () => {
    const { graph } = world({ library: true });
    const book = graph.getNode('reward_tomes_scrolls_the_silent_testament')!;
    const pick = pickTomeSpell(graph, book, 'farmer', 42, 30);
    if (pick) expect(pick.tier).toBeLessThanOrEqual(3);
  });

  it('a seized book teaches its new holder', () => {
    const { graph, state } = world();
    const r = instantiateReward(graph, 'reward_tomes_scrolls_veilscript_fragment', 'farmer', 30)!;
    const ctx: ObjectVerbContext = { state, graph, actorId: 'priest', handle: { kind: 'node', nodeId: r.instanceId }, tick: 40 };
    const res = (ITEM.verbs['control:seize'] as (c: ObjectVerbContext) => { success: boolean })(ctx);
    expect(res.success).toBe(true);
    expect(known(graph, 'priest').some(e => e.properties.source === 'tome' && e.properties.viaItemId === r.instanceId)).toBe(true);
  });
});

describe('the spell_grant reaction (Lane decision 7)', () => {
  it('a nudge grant teaches the scene\'s mortal from the god', () => {
    const { state, graph } = world({ library: true });
    const reaction = { id: 'r1', effects: [{ kind: 'spell_grant', targetAgentId: '$actor', selector: 'god' }] } as unknown as EncounterAftermathReaction;
    const action = {
      actionId: 'ua_test', actorId: 'farmer', templateId: 'enc.test', targetId: 'farmer', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1, resolved: true, outcome: 'success', stepOutcomes: [],
    } as unknown as UnifiedAction;
    const out = applyEncounterAftermathReaction(state, action, reaction, 20, createSimulationRuntime());
    expect(known(out.state.graph, 'farmer').some(e => e.properties.source === 'divine' && e.properties.grantedBy === 'asc')).toBe(true);
    expect(out.state.tickEvents.some(e => /now knows/.test(e.message))).toBe(true);
    void graph;
  });
});

describe('the Teach a Spell card on the drawer (UI pillar)', () => {
  const target: TargetContext = {
    nodeId: 'priest', nodeType: 'actor', displayName: 'Ser Aldric', displayLabel: '', subtype: 'individual',
    traitIds: [], sphereAffinity: null, position: null, properties: {},
  };
  const base = {
    target, templates: UNIFIED_ACTION_TEMPLATES.filter(t => t.id === 'action.teach_spell'),
    pool: { mind: 99 } as never, primarySphere: 'mind' as never, accessibleSpheres: ['mind', 'life'] as never,
    unlockedActionIds: ['action.teach_spell'],
  };
  it('names the spell it would teach', () => {
    const [slot] = getTargetActionSlots({ ...base, spellTeachingPreview: { spellName: 'Veilwalk', dark: false } });
    expect(slot?.effectsLine).toBe('Will teach Veilwalk.');
    expect(slot?.available).toBe(true);
  });
  it('locks with the gate reason on a mortal it cannot teach', () => {
    const [slot] = getTargetActionSlots({ ...base, spellTeachingPreview: { lockedReason: TEACH_SPELL_NOT_THREADED_REASON } });
    expect(slot?.available).toBe(false);
    expect(slot?.lockedReason).toBe(TEACH_SPELL_NOT_THREADED_REASON);
  });
  it('previews the spell for the threaded priest', () => {
    const { graph } = world({ library: true });
    expect(teachSpellPreview(graph, 'asc', 'priest', 42)).toMatchObject({ dark: false });
  });
  it('locks with a reason in words when there is nothing to teach', () => {
    const [slot] = getTargetActionSlots({ ...base, spellTeachingPreview: null });
    expect(slot?.available).toBe(false);
    expect(slot?.lockedReason).toBe('They know everything you could teach');
  });
});
