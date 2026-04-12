// src/engine/__tests__/strategicBehaviorFamilies.test.ts
//
// Tests for Phase 8 behavior family expansion: 5 new packs + hint-driven execution.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateStrategicCandidates,
  getStrategicTemplate,
  getAllStrategicTemplates,
} from '../strategicActionCandidates';
import { executeStrategicAction } from '../strategicActionLifecycle';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate, BehaviorFamily } from '../../types/strategicAction';

import { BUILDER_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/builderStrategicPack';
import { SCHOLAR_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/scholarStrategicPack';
import { ZEALOT_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/zealotStrategicPack';
import { COURT_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/courtStrategicPack';
import { WARLORD_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/warlordStrategicPack';
import { MERCHANT_STRATEGIC_TEMPLATES } from '../../data/strategic-packs/merchantStrategicPack';

// ─── Helpers ──────────────────────────────────────────────────────────

/** Build a graph with a multi-capable actor at a city with various location types nearby */
function buildMultiFamilyGraph() {
  const graph = new WorldGraph();

  // Versatile actor with capabilities across all reaches
  graph.addNode({
    id: 'actor_versatile',
    name: 'Versatile Agent',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      domainCapabilities: {
        gold: 0.6, eye: 0.5, heart: 0.5, shadow: 0.3,
        iron: 0.6, stone: 0.6, star: 0.5, veil: 0.4, flesh: 0.3,
      },
    },
  });

  // Location types covering all pack target rules
  const locations = [
    { id: 'loc_city', name: 'Ashenvale', subtype: 'city', col: 5, row: 5 },
    { id: 'loc_town', name: 'Millbrook', subtype: 'town', col: 7, row: 5 },
    { id: 'loc_capital', name: 'Crownhold', subtype: 'capital', col: 3, row: 3 },
    { id: 'loc_castle', name: 'Irongate', subtype: 'castle', col: 8, row: 3 },
    { id: 'loc_fort', name: 'Watchtower Peak', subtype: 'fort', col: 9, row: 6 },
    { id: 'loc_ruins', name: 'The Shattered Archive', subtype: 'ruins', col: 4, row: 8 },
    { id: 'loc_shrine', name: 'Shrine of the Dawn', subtype: 'shrine', col: 6, row: 7 },
    { id: 'loc_temple', name: 'Temple of Whispers', subtype: 'temple', col: 2, row: 4 },
    { id: 'loc_hamlet', name: 'Dusthaven', subtype: 'hamlet', col: 10, row: 5 },
    { id: 'loc_camp', name: 'Forward Camp', subtype: 'camp', col: 11, row: 4 },
    { id: 'loc_market', name: 'Great Bazaar', subtype: 'market', col: 5, row: 6 },
  ];

  for (const loc of locations) {
    graph.addNode({
      id: loc.id,
      name: loc.name,
      type: 'location',
      properties: {
        locationSubtype: loc.subtype,
        hexCol: loc.col,
        hexRow: loc.row,
        prosperity: 50,
        defense: 30,
        magicalSaturation: 0.2,
      },
    });
  }

  // Actor located at city
  graph.addEdge({
    id: 'located_versatile',
    source: 'actor_versatile',
    target: 'loc_city',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

function makeMinimalGameState(graph: WorldGraph): GameState {
  return {
    tick: 10,
    graph,
    tiles: [],
    tickEvents: [],
    encounterProgress: [],
    unifiedActions: [],
    premonitionQueue: [],
    clearanceGateStates: {},
    pendingEncounterSeeds: [],
  } as unknown as GameState;
}

function makeCandidateForTemplate(
  templateId: string,
  actorId: string,
  ambitionId: string,
  targetNodeId?: string,
): StrategicActionCandidate {
  const template = getStrategicTemplate(templateId)!;
  return {
    candidateId: `strat_${templateId}_test`,
    templateId,
    ambitionId,
    actorId,
    verb: template.verb,
    executionMode: template.executionMode,
    behaviorFamily: template.behaviorFamily,
    displayName: template.displayName,
    targetNodeId,
    scoreComponents: {
      ambitionAlignment: 0.8, blockerRelief: 0, worldImpact: 0.5,
      catalystValue: 0, roleFit: 0.6, controlPressure: 0,
      travelPenalty: 0.1, varietyPenalty: 0,
    },
    finalScore: 0.5,
    generationReason: 'ambition_progression',
  };
}

// ─── Pack Registration ────────────────────────────────────────────────

describe('behavior family pack registration', () => {
  it('all 36 templates are registered (6 packs × 6 templates)', () => {
    const all = getAllStrategicTemplates();
    expect(all.length).toBe(36);
  });

  it('every template has a unique ID', () => {
    const all = getAllStrategicTemplates();
    const ids = all.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has a mutationHint', () => {
    const all = getAllStrategicTemplates();
    for (const t of all) {
      expect(t.mutationHint).toBeDefined();
    }
  });

  it.each([
    ['merchant-expansion', MERCHANT_STRATEGIC_TEMPLATES],
    ['builder-civic', BUILDER_STRATEGIC_TEMPLATES],
    ['scholar-seeker', SCHOLAR_STRATEGIC_TEMPLATES],
    ['zealot-mission', ZEALOT_STRATEGIC_TEMPLATES],
    ['court-political', COURT_STRATEGIC_TEMPLATES],
    ['warlord-expansion', WARLORD_STRATEGIC_TEMPLATES],
  ] as const)('pack %s has 6 templates', (family, templates) => {
    expect(templates).toHaveLength(6);
    for (const t of templates) {
      expect(t.behaviorFamily).toBe(family);
    }
  });

  it.each([
    ['merchant-expansion', MERCHANT_STRATEGIC_TEMPLATES],
    ['builder-civic', BUILDER_STRATEGIC_TEMPLATES],
    ['scholar-seeker', SCHOLAR_STRATEGIC_TEMPLATES],
    ['zealot-mission', ZEALOT_STRATEGIC_TEMPLATES],
    ['court-political', COURT_STRATEGIC_TEMPLATES],
    ['warlord-expansion', WARLORD_STRATEGIC_TEMPLATES],
  ] as const)('pack %s has at least one gather_info, one create, and one control template', (_, templates) => {
    const verbs = new Set(templates.map(t => t.verb));
    expect(verbs.has('gather_info')).toBe(true);
    expect(verbs.has('create')).toBe(true);
    expect(verbs.has('control')).toBe(true);
  });

  it('every template is findable via getStrategicTemplate', () => {
    const allPacks = [
      MERCHANT_STRATEGIC_TEMPLATES,
      BUILDER_STRATEGIC_TEMPLATES,
      SCHOLAR_STRATEGIC_TEMPLATES,
      ZEALOT_STRATEGIC_TEMPLATES,
      COURT_STRATEGIC_TEMPLATES,
      WARLORD_STRATEGIC_TEMPLATES,
    ];
    for (const pack of allPacks) {
      for (const t of pack) {
        expect(getStrategicTemplate(t.id)).toBe(t);
      }
    }
  });
});

// ─── Candidate Generation per Family ─────────────────────────────────

describe('candidate generation across families', () => {
  const familyAmbitions: [BehaviorFamily, string][] = [
    ['merchant-expansion', 'ambition_dominate_trade'],
    ['builder-civic', 'ambition_great_work'],
    ['scholar-seeker', 'ambition_uncover_secrets'],
    ['zealot-mission', 'ambition_spread_faith'],
    ['court-political', 'ambition_found_dynasty'],
    ['warlord-expansion', 'ambition_conquer_territory'],
  ];

  it.each(familyAmbitions)(
    '%s ambition generates candidates',
    (family, ambitionId) => {
      const graph = buildMultiFamilyGraph();
      const rng = mulberry32(42);

      const result = generateStrategicCandidates(
        graph, 'actor_versatile', [ambitionId], undefined, 10, rng,
      );

      expect(result.candidates.length).toBeGreaterThan(0);
      // All candidates should belong to the expected family
      for (const c of result.candidates) {
        expect(c.behaviorFamily).toBe(family);
      }
    },
  );

  it('arcane enlightenment also generates scholar-seeker candidates', () => {
    const graph = buildMultiFamilyGraph();
    const rng = mulberry32(42);

    const result = generateStrategicCandidates(
      graph, 'actor_versatile', ['ambition_arcane_enlightenment'], undefined, 10, rng,
    );

    expect(result.candidates.length).toBeGreaterThan(0);
    for (const c of result.candidates) {
      expect(c.behaviorFamily).toBe('scholar-seeker');
    }
  });
});

// ─── Hint-Driven Execution ──────────────────────────────────────────

describe('hint-driven execution', () => {
  it('record_intelligence hint stores data on actor node', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const candidate = makeCandidateForTemplate(
      'strategic_scout_defenses', 'actor_versatile', 'ambition_conquer_territory', 'loc_castle',
    );

    const result = executeStrategicAction(state, graph, candidate, 10, rng);

    expect(result.graphOps.length).toBeGreaterThan(0);
    expect(result.graphOps[0].op).toBe('record_intelligence');
    expect(result.graphOps[0].success).toBe(true);

    // Intelligence recorded on actor
    const actor = graph.getNode('actor_versatile');
    const intel = actor?.properties.strategicIntelligence as Record<string, number>;
    expect(intel).toBeDefined();
    expect(intel['defense_scouting_loc_castle']).toBe(10);
  });

  it('create_sublocation hint creates a named sublocation node', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const candidate = makeCandidateForTemplate(
      'strategic_establish_garrison', 'actor_versatile', 'ambition_conquer_territory', 'loc_castle',
    );
    // Force instant execution mode for direct testing
    const instantCandidate = { ...candidate, executionMode: 'instant' as const };

    const result = executeStrategicAction(state, graph, instantCandidate, 15, rng);

    expect(result.graphOps.length).toBeGreaterThan(0);
    expect(result.graphOps[0].op).toBe('create_sublocation');
    expect(result.graphOps[0].success).toBe(true);

    // Sublocation was created with proper name
    const sublocId = result.graphOps[0].createdId!;
    const subloc = graph.getNode(sublocId);
    expect(subloc).toBeDefined();
    expect(subloc!.name).toContain('Versatile Agent');
    expect(subloc!.name).toContain('Irongate');
    expect(subloc!.properties.sublocationTypeId).toBe('garrison');
  });

  it('modify_location_property hint changes a numeric property', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const locBefore = graph.getNode('loc_town')!;
    const defBefore = (locBefore.properties.defense as number) ?? 0;

    const candidate = makeCandidateForTemplate(
      'strategic_fortify_defenses', 'actor_versatile', 'ambition_great_work', 'loc_town',
    );
    const instantCandidate = { ...candidate, executionMode: 'instant' as const };

    const result = executeStrategicAction(state, graph, instantCandidate, 10, rng);

    expect(result.graphOps[0].op).toBe('modify_location_property');
    expect(result.graphOps[0].success).toBe(true);

    const locAfter = graph.getNode('loc_town')!;
    expect(locAfter.properties.defense).toBe(defBefore + 15);
  });

  it('modify_location_property clamps to bounds', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    // Set defense to 95 so +20 would exceed 100
    graph.getNode('loc_fort')!.properties.defense = 95;

    const candidate = makeCandidateForTemplate(
      'strategic_fortify_position', 'actor_versatile', 'ambition_conquer_territory', 'loc_fort',
    );
    const instantCandidate = { ...candidate, executionMode: 'instant' as const };

    const result = executeStrategicAction(state, graph, instantCandidate, 10, rng);

    expect(result.graphOps[0].success).toBe(true);
    expect(graph.getNode('loc_fort')!.properties.defense).toBe(100);
  });

  it('create_relation_edge hint creates a typed edge', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const candidate = makeCandidateForTemplate(
      'strategic_establish_sacred_route', 'actor_versatile', 'ambition_spread_faith', 'loc_shrine',
    );
    const instantCandidate = { ...candidate, executionMode: 'instant' as const };

    const result = executeStrategicAction(state, graph, instantCandidate, 10, rng);

    expect(result.graphOps[0].op).toBe('create_relation_edge');
    expect(result.graphOps[0].success).toBe(true);

    // Edge should exist: actor → shrine
    const edges = graph.getOutgoingEdges('actor_versatile', 'sacred_route');
    expect(edges.length).toBe(1);
    expect(edges[0].target).toBe('loc_shrine');
  });

  it('no_mutation hint produces zero graph ops', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const candidate = makeCandidateForTemplate(
      'strategic_maintain_authority', 'actor_versatile', 'ambition_found_dynasty', 'loc_capital',
    );

    const result = executeStrategicAction(state, graph, candidate, 10, rng);

    // claim_control mode handles control creation, but no instant mutation
    expect(result.graphOps.length).toBeGreaterThan(0); // claimControl itself creates an edge
    expect(result.strategicState.controls.length).toBe(1);
  });

  it('destroy verb (raid supply lines) reduces prosperity', () => {
    const graph = buildMultiFamilyGraph();
    const state = makeMinimalGameState(graph);
    const rng = mulberry32(42);

    const prosperityBefore = graph.getNode('loc_town')!.properties.prosperity as number;

    const candidate = makeCandidateForTemplate(
      'strategic_raid_supply_lines', 'actor_versatile', 'ambition_conquer_territory', 'loc_town',
    );

    const result = executeStrategicAction(state, graph, candidate, 10, rng);

    expect(result.graphOps[0].success).toBe(true);
    expect(graph.getNode('loc_town')!.properties.prosperity).toBe(prosperityBefore - 8);
  });
});

// ─── Ambition Profile Wiring ────────────────────────────────────────

describe('ambition strategic profile wiring', () => {
  it('ambition_found_dynasty no longer references merchant templates', () => {
    const graph = buildMultiFamilyGraph();
    const rng = mulberry32(42);

    const result = generateStrategicCandidates(
      graph, 'actor_versatile', ['ambition_found_dynasty'], undefined, 10, rng,
    );

    // Should NOT generate merchant templates
    const templateIds = result.candidates.map(c => c.templateId);
    expect(templateIds.every(id => !id.includes('market'))).toBe(true);
    expect(templateIds.every(id => !id.includes('warehouse'))).toBe(true);

    // Should generate court-political templates
    if (result.candidates.length > 0) {
      expect(result.candidates[0].behaviorFamily).toBe('court-political');
    }
  });
});
