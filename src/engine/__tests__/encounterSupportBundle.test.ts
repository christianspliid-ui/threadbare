import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { prepareEncounterSupportBundle } from '../encounterSupportBundle';
import {
  DEFAULT_BUNDLE_MAX_SPECS,
  DEFAULT_FAMILY_SUPPORT_BUNDLES,
  DEFAULT_SETTING_SUPPORT_BUNDLES,
  primarySettingClass,
  withDefaultSupportBundle,
} from '../../data/default-support-bundles';
import { LOCATION_ROLE_ROSTERS, NPC_ROLES } from '../../types/npc';
import { SETTING_CLASS_MAP } from '../../data/settingClasses';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 12,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: null,
    essencePool: { [Symbol.iterator]: function* () { yield ['default', 0]; } },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    pendingQuintessenceEvents: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

function addIndividual(
  graph: WorldGraph,
  id: string,
  name: string,
  npcRole: string,
  locationId: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      npcRole,
      importance: 0,
      sphereAffinity: null,
    },
  });
  graph.addEdge({
    id: `${id}_located_at_${locationId}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function makeGateDutyGraph(withWitnessMerchant = false): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'loc_town',
    type: 'location',
    name: 'Mock Town',
    properties: { locationSubtype: 'town' },
  });
  graph.addNode({
    id: 'loc_gatehouse',
    type: 'location',
    name: 'North Gatehouse',
    properties: {
      locationSubtype: 'encounter_support',
      sublocationTypeId: 'sublocation-type.gatehouse',
      parentLocationId: 'loc_town',
    },
  });
  graph.addEdge({
    id: 'loc_town_contains_gatehouse',
    source: 'loc_town',
    target: 'loc_gatehouse',
    type: 'contains',
    properties: {},
  });

  graph.addNode({
    id: 'culture_1',
    type: 'actor',
    name: 'Town Culture',
    properties: { actorType: 'culture' },
  });
  graph.addEdge({
    id: 'loc_town_belongs_to_culture_1',
    source: 'loc_town',
    target: 'culture_1',
    type: 'belongs_to',
    properties: { cultureLayer: 'current', culturalStrength: 1.0 },
  });

  graph.addNode({
    id: 'faction_cg',
    type: 'actor',
    name: 'Civic Guard',
    properties: { actorType: 'faction', factionDefId: 'civic_guard' },
  });

  addIndividual(graph, 'guard_1', 'Town Guard', 'guard', 'loc_gatehouse');
  addIndividual(graph, 'captain_1', 'Gate Captain', 'guard_captain', 'loc_gatehouse');

  graph.addEdge({
    id: 'guard_1_member_of_faction_cg',
    source: 'guard_1',
    target: 'faction_cg',
    type: 'member_of',
    properties: { role: 'guard', rank: 0.2, joinedTick: 0 },
  });
  graph.addEdge({
    id: 'captain_1_member_of_faction_cg',
    source: 'captain_1',
    target: 'faction_cg',
    type: 'member_of',
    properties: { role: 'guard_captain', rank: 0.4, joinedTick: 0 },
  });

  if (withWitnessMerchant) {
    addIndividual(graph, 'merchant_1', 'Line Merchant', 'merchant', 'loc_gatehouse');
  }

  return graph;
}

describe('prepareEncounterSupportBundle', () => {
  it('reuses seeded gate support and materializes persistent missing cast for Gate Duty', () => {
    const graph = makeGateDutyGraph(false);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    expect(template).toBeDefined();
    const bindings = prepareEncounterSupportBundle(state, template!, 'loc_town');

    expect(bindings.map(binding => binding.key)).toEqual([
      'gatehouse',
      'gate_guard',
      'gate_captain',
      'suspect_courier',
      'checkpoint_witness',
    ]);

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(bindings.find(binding => binding.key === 'suspect_courier')?.reused).toBe(false);
    expect(bindings.find(binding => binding.key === 'checkpoint_witness')?.reused).toBe(false);

    const courier = graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier');
    const witness = graph.getNode('enc_support_cg.quest.gate_duty_loc_town_checkpoint_witness');
    expect(courier?.properties.encounterSupportRole).toBe('checkpoint_courier');
    expect(witness?.properties.encounterSupportRole).toBe('checkpoint_witness');

    expect(graph.getOutgoingEdges(courier!.id, 'located_at')[0]?.target).toBe('loc_gatehouse');
    expect(graph.getOutgoingEdges(witness!.id, 'located_at')[0]?.target).toBe('loc_gatehouse');
    expect(graph.getOutgoingEdges(courier!.id, 'belongs_to')[0]?.target).toBe('culture_1');
  });

  it('is reuse-first and idempotent when suitable support already exists', () => {
    const graph = makeGateDutyGraph(true);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const firstBindings = prepareEncounterSupportBundle(state, template!, 'loc_town');
    const secondBindings = prepareEncounterSupportBundle(state, template!, 'loc_town');

    expect(firstBindings.find(binding => binding.key === 'checkpoint_witness')?.nodeId).toBe('merchant_1');
    expect(firstBindings.find(binding => binding.key === 'checkpoint_witness')?.reused).toBe(true);
    expect(secondBindings.find(binding => binding.key === 'suspect_courier')?.nodeId)
      .toBe('enc_support_cg.quest.gate_duty_loc_town_suspect_courier');
    expect(secondBindings.find(binding => binding.key === 'suspect_courier')?.reused).toBe(true);

    const checkpointCouriers = graph.getNodesByType('actor')
      .filter(node => node.properties.encounterSupportRole === 'checkpoint_courier');
    expect(checkpointCouriers).toHaveLength(1);
  });

  it('anchors support to the parent settlement when triggered from an actor target', () => {
    const graph = makeGateDutyGraph(true);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const bindings = prepareEncounterSupportBundle(state, template!, 'guard_1');

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
    expect(graph.getNode('enc_support_cg.quest.gate_duty_guard_1_suspect_courier')).toBeUndefined();
  });

  it('uses the selected encounter location as a fallback anchor for non-spatial targets like factions', () => {
    const graph = makeGateDutyGraph(false);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const bindings = prepareEncounterSupportBundle(state, template!, 'faction_cg', 'loc_town');

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
    expect(graph.getNode('enc_support_cg.quest.gate_duty_faction_cg_suspect_courier')).toBeUndefined();
  });
});

describe('default family support bundles (THR-698)', () => {
  function makeSettlementGraph(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_village',
      type: 'location',
      name: 'Mock Village',
      properties: { locationSubtype: 'village' },
    });
    return graph;
  }

  it('every default bundle respects the spec cap, uses real NPC roles, and is bind-only', () => {
    const validRoles = new Set<string>(NPC_ROLES);
    const allBundles = {
      ...DEFAULT_FAMILY_SUPPORT_BUNDLES,
      // THR-1044: the setting-keyed table obeys the same invariants as the
      // id-prefix table, so it is swept by the same assertion rather than a
      // parallel copy that could drift out of step with it.
      ...Object.fromEntries(
        Object.entries(DEFAULT_SETTING_SUPPORT_BUNDLES).map(([cls, b]) => [`setting:${cls}`, b]),
      ),
    };
    for (const [family, bundle] of Object.entries(allBundles)) {
      expect(bundle.length, `${family} bundle exceeds cap`).toBeLessThanOrEqual(DEFAULT_BUNDLE_MAX_SPECS);
      const seenRoles = new Set<string>();
      for (const spec of bundle) {
        expect(spec.delivery, `${family}/${spec.key} must be pre-seeded (bind-only)`).toBe('pre-seeded');
        expect(spec.kind).toBe('actor');
        if (spec.kind !== 'actor') continue;
        for (const role of spec.reuseNpcRoles ?? []) {
          expect(validRoles.has(role), `${family}/${spec.key} reuse role '${role}' is not a real NpcRole`).toBe(true);
          expect(seenRoles.has(role), `${family} reuses role '${role}' in two specs`).toBe(false);
          seenRoles.add(role);
        }
        expect(validRoles.has(spec.spawnNpcRole), `${family}/${spec.key} spawnNpcRole invalid`).toBe(true);
        expect(spec.spawnName, `${family}/${spec.key} needs a spawnName prose fallback`).toBeTruthy();
      }
    }
  });

  it('registry templates without an authored bundle carry their family default', () => {
    const tavern = getUnifiedTemplateById('tavern.brawl');
    expect(tavern?.supportBundle?.map(s => s.key)).toEqual(['keeper', 'performer', 'regular']);

    const wallPatrol = getUnifiedTemplateById('cg.quest.wall_patrol');
    expect(wallPatrol?.supportBundle?.map(s => s.key)).toEqual(['officer', 'watch_guard']);
  });

  it('a template-declared bundle wins outright over the family default', () => {
    const gateDuty = getUnifiedTemplateById('cg.quest.gate_duty');
    const keys = gateDuty?.supportBundle?.map(s => s.key) ?? [];
    expect(keys).toContain('gate_captain');
    expect(keys).not.toContain('officer');
  });

  it('withDefaultSupportBundle returns the same object for unknown families', () => {
    const template = { id: 'zzz.no_such_family', supportBundle: undefined } as never;
    expect(withDefaultSupportBundle(template)).toBe(template);
  });

  it('binds an existing settlement NPC to the default cast without materializing', () => {
    const graph = makeSettlementGraph();
    addIndividual(graph, 'keeper_1', 'Marla', 'innkeeper', 'loc_village');
    const state = makeState(graph);
    const template = getUnifiedTemplateById('tavern.brawl');
    const nodeCountBefore = graph.getNodesByType('actor').length;

    const bindings = prepareEncounterSupportBundle(state, template!, 'loc_village');

    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({ key: 'keeper', nodeId: 'keeper_1', reused: true });
    expect(graph.getNodesByType('actor')).toHaveLength(nodeCountBefore);
  });

  it('leaves default specs unresolved at a location with no matching NPCs — zero spawns', () => {
    const graph = makeSettlementGraph();
    const state = makeState(graph);
    const template = getUnifiedTemplateById('tavern.brawl');
    const nodesBefore = graph.getNodesByType('actor').length + graph.getNodesByType('location').length;

    const bindings = prepareEncounterSupportBundle(state, template!, 'loc_village');

    expect(bindings).toHaveLength(0);
    const nodesAfter = graph.getNodesByType('actor').length + graph.getNodesByType('location').length;
    expect(nodesAfter).toBe(nodesBefore);
  });
});

describe('setting-keyed default support bundles — the encounter.* family (THR-1044)', () => {
  /** A wayside location holding one of the roles worldgen seeds in the wilderness. */
  function makeWaysideGraph(npcRole: string): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_camp',
      type: 'location',
      name: 'Roadside Camp',
      properties: { locationSubtype: 'camp' },
    });
    addIndividual(graph, 'wayside_npc', 'Sena', npcRole, 'loc_camp');
    return graph;
  }

  // The Done-when's five: the slice's parent encounters, all `settings: ['wayside']`.
  const SLICE_PARENTS = [
    SLICE_TEMPLATE_IDS.bridge,
    SLICE_TEMPLATE_IDS.pass,
    SLICE_TEMPLATE_IDS.caravan,
    SLICE_TEMPLATE_IDS.crossroads,
    SLICE_TEMPLATE_IDS.family,
  ] as const;

  it.each(SLICE_PARENTS)('%s binds at least one real scene actor at a wayside location', (id) => {
    const graph = makeWaysideGraph('hermit');
    const state = makeState(graph);
    const template = getUnifiedTemplateById(id);

    // Falsification anchor: before THR-1044 this was `undefined` for every one of
    // the five — `withDefaultSupportBundle` keyed on the `encounter` prefix, which
    // had no entry, so the templates reached the stage carrying no cast at all.
    expect(template?.supportBundle?.length ?? 0).toBeGreaterThan(0);

    const bindings = prepareEncounterSupportBundle(state, template!, 'loc_camp');

    expect(bindings.length).toBeGreaterThanOrEqual(1);
    expect(bindings[0]).toMatchObject({ key: 'keeper', nodeId: 'wayside_npc', reused: true });
  });

  it('binds bind-only: a wayside default adds no node to the world', () => {
    const graph = makeWaysideGraph('ranger');
    const state = makeState(graph);
    const before = graph.getNodesByType('actor').length;

    const bindings = prepareEncounterSupportBundle(
      state,
      getUnifiedTemplateById(SLICE_TEMPLATE_IDS.bridge)!,
      'loc_camp',
    );

    // The ranger satisfies `outrider`, not `keeper` — a partial bind, no spawn.
    expect(bindings.map(b => b.key)).toEqual(['outrider']);
    expect(graph.getNodesByType('actor')).toHaveLength(before);
  });

  it('resolves the declared envelope, not the declaration order', () => {
    // `grateful_kin` declares ['rural', 'urban']; canonical vocabulary order wins.
    expect(primarySettingClass(getUnifiedTemplateById(SLICE_TEMPLATE_IDS.gratefulKin)!)).toBe('rural');
    expect(getUnifiedTemplateById(SLICE_TEMPLATE_IDS.gratefulKin)?.supportBundle?.map(s => s.key))
      .toEqual(['elder', 'neighbor', 'bystander']);
    // `swindler_found` declares ['urban'] — a different class, a different cast.
    expect(getUnifiedTemplateById(SLICE_TEMPLATE_IDS.swindlerFound)?.supportBundle?.map(s => s.key))
      .toEqual(['clerk', 'trader', 'watch']);
  });

  it('leaves a template spanning several setting classes without a default', () => {
    const spread = {
      id: 'encounter.everywhere',
      locationSubtypes: ['hamlet', 'temple', 'battleground'],
    } as never as Parameters<typeof withDefaultSupportBundle>[0];
    expect(primarySettingClass(spread)).toBeUndefined();
    expect(withDefaultSupportBundle(spread)).toBe(spread);
  });

  it('falls back to the subtype-derived class when one class covers every subtype', () => {
    const single = {
      id: 'encounter.only_at_shrines',
      locationSubtypes: ['shrine', 'temple'],
    } as never as Parameters<typeof withDefaultSupportBundle>[0];
    expect(primarySettingClass(single)).toBe('sacred');
    expect(withDefaultSupportBundle(single).supportBundle?.map(s => s.key))
      .toEqual(['celebrant', 'attendant', 'supplicant']);
  });

  it('covers exactly the encounter.* templates whose setting is unambiguous', () => {
    // A predicate, not a snapshot count (THR-688 rule A): the registry grows, and a
    // pinned number would rot into a chore. What must hold is the biconditional —
    // an unambiguous setting class is necessary AND sufficient for a default cast.
    const encounters = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.'));
    expect(encounters.length).toBeGreaterThan(0);
    for (const t of encounters) {
      const expected = primarySettingClass(t) !== undefined;
      expect(
        (t.supportBundle?.length ?? 0) > 0,
        `${t.id} setting=${primarySettingClass(t) ?? 'ambiguous'}`,
      ).toBe(expected);
    }
    // And the slice roster — the Done-when's population — is inside the covered set.
    for (const id of Object.values(SLICE_TEMPLATE_IDS)) {
      expect(getUnifiedTemplateById(id)?.supportBundle?.length ?? 0, id).toBeGreaterThan(0);
    }
  });

  it('every reuse role is one worldgen actually seeds somewhere in that setting class', () => {
    // A reuse list naming roles no roster ever places is a spec that can never
    // bind — the dead-vocabulary failure. Classes whose subtypes carry no roster
    // at all (arcane/ruin/battlefield) are exempt: they have nothing to check
    // against, and their specs stay unresolved rather than spawning.
    for (const [cls, bundle] of Object.entries(DEFAULT_SETTING_SUPPORT_BUNDLES)) {
      const seeded = new Set<string>();
      for (const subtype of SETTING_CLASS_MAP[cls as keyof typeof SETTING_CLASS_MAP]) {
        for (const entry of LOCATION_ROLE_ROSTERS[subtype] ?? []) seeded.add(entry.role);
      }
      if (seeded.size === 0) continue;
      for (const spec of bundle) {
        if (spec.kind !== 'actor') continue;
        const reachable = (spec.reuseNpcRoles ?? []).some(r => seeded.has(r));
        expect(reachable, `${cls}/${spec.key} names no role seeded at any ${cls} subtype`).toBe(true);
      }
    }
  });
});
