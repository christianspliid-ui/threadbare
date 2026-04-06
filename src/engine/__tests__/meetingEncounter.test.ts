import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateCandidates,
  selectDilemmas,
  applyDilemmaChoice,
  applyAxiologicalShifts,
  applyReachChanges,
  createAgentFromMeeting,
  createMeetingEncounterState,
  isMeetTheFirstAvailable,
  buildMeetingResult,
  getFilteredIntentOptions,
} from '../meetingEncounter';
import { ARCHETYPE_NAME_MAP, DILEMMA_TEMPLATES, getSparkInvestmentOptions, getGodGivenTraitOptions } from '../../data/meeting-content';
import type { MeetingEncounterState, DilemmaChoiceRecord, MeetingEncounterResult, MeetingChoiceRecord } from '../../types/meetingEncounter';
import { MEETING_CANDIDATE_COUNT, INTENT_OPTIONS } from '../../types/meetingEncounter';
import { VALUE_PAIRS } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';

// ─── Helpers ──────────────────────────────────────────────────────

function buildTestGraph() {
  const graph = new WorldGraph();

  // Ascendant
  graph.addNode({
    id: 'asc',
    type: 'actor',
    name: 'The Verdant One',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'life', secondary: 'spirit' },
      firstSlotCooldownUntil: 0,
    },
  });

  // Location
  graph.addNode({
    id: 'loc_village',
    type: 'location',
    name: 'Ashenmoor',
    properties: {
      locationType: 'settlement',
      locationSubtype: 'village',
      cultureId: 'culture_1',
    },
  });

  // Some existing individuals
  for (let i = 1; i <= 3; i++) {
    graph.addNode({
      id: `ind_${i}`,
      type: 'actor',
      name: `Villager ${i}`,
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: `edge_loc_${i}`,
      source: `ind_${i}`,
      target: 'loc_village',
      type: 'located_at',
      properties: {},
    });
  }

  return graph;
}

// ─── Type Definitions ─────────────────────────────────────────────

describe('Meeting encounter types', () => {
  it('INTENT_OPTIONS covers all 8 reaches', () => {
    const reaches = INTENT_OPTIONS.map(o => o.reach);
    for (const r of REACH_DOMAINS) {
      expect(reaches).toContain(r);
    }
  });

  it('ARCHETYPE_NAME_MAP has 64 entries (8×8)', () => {
    expect(Object.keys(ARCHETYPE_NAME_MAP).length).toBe(64);
  });

  it('ARCHETYPE_NAME_MAP covers all primary×secondary combinations', () => {
    for (const primary of REACH_DOMAINS) {
      for (const secondary of REACH_DOMAINS) {
        const key = `${primary}_${secondary}`;
        expect(ARCHETYPE_NAME_MAP[key]).toBeDefined();
        expect(typeof ARCHETYPE_NAME_MAP[key]).toBe('string');
      }
    }
  });
});

// ─── Candidate Generation ─────────────────────────────────────────

describe('generateCandidates', () => {
  it('generates MEETING_CANDIDATE_COUNT candidates', () => {
    const candidates = generateCandidates('iron', 'heart', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    expect(candidates.length).toBe(MEETING_CANDIDATE_COUNT);
  });

  it('candidates have primary and secondary reach set', () => {
    const candidates = generateCandidates('shadow', 'eye', 'mind', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    for (const c of candidates) {
      expect(c.primaryReach).toBe('shadow');
      expect(c.secondaryReach).toBe('eye');
      expect(c.sphere).toBe('mind');
    }
  });

  it('candidates have boosted primary reach capability', () => {
    const candidates = generateCandidates('iron', 'gold', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    for (const c of candidates) {
      // Primary should be higher than other reaches on average
      expect(c.reachCapabilities.iron).toBeGreaterThan(c.reachCapabilities.shadow);
    }
  });

  it('candidates have full axiological profile', () => {
    const candidates = generateCandidates('heart', 'veil', 'spirit', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    for (const c of candidates) {
      for (const pair of VALUE_PAIRS) {
        expect(c.axiologicalSeed[pair]).toBeDefined();
        expect(c.axiologicalSeed[pair]).toBeGreaterThanOrEqual(-1);
        expect(c.axiologicalSeed[pair]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('candidates have personality hints (2-3)', () => {
    const candidates = generateCandidates('stone', 'star', 'entropy', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    for (const c of candidates) {
      expect(c.personalityHints.length).toBeGreaterThanOrEqual(2);
      expect(c.personalityHints.length).toBeLessThanOrEqual(3);
    }
  });

  it('deterministic with same seed', () => {
    const a = generateCandidates('iron', 'heart', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    const b = generateCandidates('iron', 'heart', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    expect(a[0].name).toBe(b[0].name);
    expect(a[0].axiologicalSeed).toEqual(b[0].axiologicalSeed);
  });

  it('different with different seed', () => {
    const a = generateCandidates('iron', 'heart', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 42);
    const b = generateCandidates('iron', 'heart', 'force', 'culture_1', ARCHETYPE_NAME_MAP, 99);
    // Very unlikely to be identical with different seeds
    expect(a[0].axiologicalSeed).not.toEqual(b[0].axiologicalSeed);
  });
});

// ─── Intent Filtering ─────────────────────────────────────────────

describe('getFilteredIntentOptions', () => {
  it('returns all 8 intent options', () => {
    const options = getFilteredIntentOptions(
      { primary: 'force', secondary: 'mind' },
      { iron: 0.8, heart: 0.2 },
      42,
    );
    expect(options.length).toBe(8);
  });

  it('puts ascendant-aligned options earlier', () => {
    const options = getFilteredIntentOptions(
      { primary: 'force', secondary: 'mind' },
      { iron: 1.0, gold: 0.0, shadow: 0.0, veil: 0.0, heart: 0.0, eye: 0.0, stone: 0.0, star: 0.0 },
      42,
    );
    // Iron should tend toward the front (high affinity)
    const ironIndex = options.findIndex(o => o.reach === 'iron');
    expect(ironIndex).toBeLessThan(5);
  });
});

// ─── Dilemma Selection ────────────────────────────────────────────

describe('selectDilemmas', () => {
  it('selects 2-3 dilemmas', () => {
    const dilemmas = selectDilemmas(
      DILEMMA_TEMPLATES,
      'iron', 'heart', 'force', 'iron_heart', 'village',
      42,
    );
    expect(dilemmas.length).toBeGreaterThanOrEqual(2);
    expect(dilemmas.length).toBeLessThanOrEqual(3);
  });

  it('includes at least one axiological dilemma for primary reach pair', () => {
    // Iron's value pair is mercy_ruthlessness
    const dilemmas = selectDilemmas(
      DILEMMA_TEMPLATES,
      'iron', 'heart', 'force', 'iron_heart', 'village',
      42,
    );
    const hasAxiological = dilemmas.some(d =>
      d.category === 'axiological' && d.templateId.includes('mercy')
    );
    expect(hasAxiological).toBe(true);
  });

  it('all selected dilemmas have choices', () => {
    const dilemmas = selectDilemmas(
      DILEMMA_TEMPLATES,
      'shadow', 'eye', 'mind', 'shadow_eye', 'village',
      42,
    );
    for (const d of dilemmas) {
      expect(d.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('no duplicate dilemmas', () => {
    const dilemmas = selectDilemmas(
      DILEMMA_TEMPLATES,
      'heart', 'gold', 'spirit', 'heart_gold', 'village',
      42,
    );
    const ids = dilemmas.map(d => d.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Axiological Shifts ───────────────────────────────────────────

describe('applyAxiologicalShifts', () => {
  it('applies positive shifts correctly', () => {
    const base = {} as any;
    for (const pair of VALUE_PAIRS) base[pair] = 0;

    const records: DilemmaChoiceRecord[] = [{
      dilemmaId: 'd1',
      category: 'axiological',
      choiceId: 'c1',
      gateTags: [],
      axiologicalShifts: { mercy_ruthlessness: 0.2 },
    }];

    const result = applyAxiologicalShifts(base, records);
    expect(result.mercy_ruthlessness).toBeCloseTo(0.2);
  });

  it('clamps to [-1, 1] range', () => {
    const base = {} as any;
    for (const pair of VALUE_PAIRS) base[pair] = 0.9;

    const records: DilemmaChoiceRecord[] = [{
      dilemmaId: 'd1',
      category: 'axiological',
      choiceId: 'c1',
      gateTags: [],
      axiologicalShifts: { mercy_ruthlessness: 0.3 },
    }];

    const result = applyAxiologicalShifts(base, records);
    expect(result.mercy_ruthlessness).toBe(1);
  });

  it('accumulates multiple records', () => {
    const base = {} as any;
    for (const pair of VALUE_PAIRS) base[pair] = 0;

    const records: DilemmaChoiceRecord[] = [
      { dilemmaId: 'd1', category: 'axiological', choiceId: 'c1', gateTags: [], axiologicalShifts: { mercy_ruthlessness: 0.15 } },
      { dilemmaId: 'd2', category: 'axiological', choiceId: 'c2', gateTags: [], axiologicalShifts: { mercy_ruthlessness: 0.1, courage_prudence: -0.2 } },
    ];

    const result = applyAxiologicalShifts(base, records);
    expect(result.mercy_ruthlessness).toBeCloseTo(0.25);
    expect(result.courage_prudence).toBeCloseTo(-0.2);
  });
});

// ─── Reach Changes ────────────────────────────────────────────────

describe('applyReachChanges', () => {
  it('applies reach changes from dilemma choices', () => {
    const base = {} as any;
    for (const r of REACH_DOMAINS) base[r] = 0.2;

    const records: DilemmaChoiceRecord[] = [{
      dilemmaId: 'd1',
      category: 'reach_specific',
      choiceId: 'c1',
      gateTags: [],
      axiologicalShifts: {},
      reachChanges: { iron: 0.05 },
    }];

    const result = applyReachChanges(base, records);
    expect(result.iron).toBeCloseTo(0.25);
    expect(result.gold).toBeCloseTo(0.2); // unchanged
  });
});

// ─── Meeting State Machine ────────────────────────────────────────

describe('createMeetingEncounterState', () => {
  it('creates initial state', () => {
    const state = createMeetingEncounterState('loc_village', 'asc', 10);
    expect(state.currentStep).toBe('seeking_threads');
    expect(state.status).toBe('active');
    expect(state.locationId).toBe('loc_village');
    expect(state.ascendantId).toBe('asc');
    expect(state.startedTick).toBe(10);
  });
});

// ─── Availability Check ──────────────────────────────────────────

describe('isMeetTheFirstAvailable', () => {
  it('returns true when no active first and no cooldown', () => {
    const graph = buildTestGraph();
    expect(isMeetTheFirstAvailable(graph, 'asc', 10)).toBe(true);
  });

  it('returns false when active first exists', () => {
    const graph = buildTestGraph();
    // Add a thread with the_first court position
    graph.addNode({ id: 'ind_first', type: 'actor', name: 'The First', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'edge_thread_first',
      source: 'asc',
      target: 'ind_first',
      type: 'thread',
      properties: { courtPosition: 'the_first', tier: 1 },
    });
    expect(isMeetTheFirstAvailable(graph, 'asc', 10)).toBe(false);
  });

  it('returns false during cooldown', () => {
    const graph = buildTestGraph();
    const ascNode = graph.getNode('asc')!;
    ascNode.properties.firstSlotCooldownUntil = 20;
    expect(isMeetTheFirstAvailable(graph, 'asc', 10)).toBe(false);
    expect(isMeetTheFirstAvailable(graph, 'asc', 25)).toBe(true);
  });
});

// ─── Agent Creation ──────────────────────────────────────────────

describe('createAgentFromMeeting', () => {
  it('creates agent node with correct properties', () => {
    const graph = buildTestGraph();
    const profile = {} as any;
    for (const pair of VALUE_PAIRS) profile[pair] = 0;
    const caps = {} as any;
    for (const r of REACH_DOMAINS) caps[r] = 0.3;

    const result: MeetingEncounterResult = {
      name: 'Kael',
      archetypeId: 'iron_heart',
      cultureId: 'culture_1',
      axiologicalProfile: profile,
      reachCapabilities: caps,
      primaryReach: 'iron',
      secondaryReach: 'heart',
      sphere: 'force',
      cooperationStrategy: 'tit-for-tat',
      foundingGateTags: ['heroic_origin'],
      traitSeeds: ['fearless'],
      appearanceSeed: 12345,
      meetingChoiceRecord: {
        encounterTick: 10,
        locationId: 'loc_village',
        intentPrimaryReach: 'iron',
        intentSecondaryReach: 'heart',
        intentSphere: 'force',
        candidateIndex: 0,
        archetypeId: 'iron_heart',
        dilemmaChoices: [],
        investmentChoice: 'spark_invest_iron',
        sparkTraitId: 'trait.god.iron_will',
        shapePath: 'surprise',
        ascendantSphere: 'life',
        foundingGateTags: ['heroic_origin'],
      },
      locationId: 'loc_village',
    };

    const agentId = createAgentFromMeeting(graph, result, 'asc', 10);

    // Verify agent node exists
    const agentNode = graph.getNode(agentId);
    expect(agentNode).toBeDefined();
    expect(agentNode!.name).toBe('Kael');
    expect(agentNode!.properties.actorType).toBe('individual');
    expect(agentNode!.properties.narrativeArchetype).toBe('iron_heart');
    expect(agentNode!.properties.cooperationStrategy).toBe('tit-for-tat');
    expect(agentNode!.properties.createdByMeeting).toBe(true);

    // Verify located_at edge
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(locEdges.length).toBe(1);
    expect(locEdges[0].target).toBe('loc_village');

    // Verify thread edge
    const threadEdges = graph.getOutgoingEdges('asc', 'thread');
    const threadToAgent = threadEdges.find(e => e.target === agentId);
    expect(threadToAgent).toBeDefined();
    expect(threadToAgent!.properties.courtPosition).toBe('the_first');
    expect(threadToAgent!.properties.tier).toBe(1);
    expect(threadToAgent!.properties.awareness).toBe('faith');
    expect(threadToAgent!.properties.attentionMode).toBe('pause');
    expect(threadToAgent!.properties.storyPhase).toBe('call');
  });
});

// ─── Build Meeting Result ─────────────────────────────────────────

describe('buildMeetingResult', () => {
  it('builds result from completed state', () => {
    const profile = {} as any;
    for (const pair of VALUE_PAIRS) profile[pair] = 0;
    const caps = {} as any;
    for (const r of REACH_DOMAINS) caps[r] = 0.2;

    const state: MeetingEncounterState = {
      id: 'meeting_10_loc_village',
      currentStep: 'confirmation',
      locationId: 'loc_village',
      ascendantId: 'asc',
      startedTick: 10,
      status: 'active',
      intentPrimaryReach: 'iron',
      intentSecondaryReach: 'heart',
      intentSphere: 'force',
      candidates: [{
        tempId: 'meeting_candidate_0',
        name: 'Kael',
        archetypeId: 'iron_heart',
        cultureId: 'culture_1',
        primaryReach: 'iron',
        secondaryReach: 'heart',
        sphere: 'force',
        vignetteText: 'A warrior stands at the crossroads...',
        personalityHints: ['bold', 'merciful', 'loyal'],
        axiologicalSeed: profile,
        reachCapabilities: caps,
        cooperationStrategy: 'tit-for-tat',
        appearanceSeed: 12345,
      }],
      selectedCandidateIndex: 0,
      dilemmaChoiceRecords: [{
        dilemmaId: 'dilemma.axio.mercy_1',
        category: 'axiological',
        choiceId: 'mercy_1_spare',
        gateTags: ['mercy_shown', 'heroic_origin'],
        axiologicalShifts: { mercy_ruthlessness: 0.2 },
      }],
      sparkTraitId: 'trait.god.iron_will',
      investmentChoiceId: 'spark_invest_iron',
      shapePath: 'surprise',
      accumulatedProfile: {},
      accumulatedGateTags: [],
      accumulatedTraitSeeds: [],
    };

    const result = buildMeetingResult(state, 'life');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Kael');
    expect(result!.primaryReach).toBe('iron');
    expect(result!.secondaryReach).toBe('heart');
    expect(result!.foundingGateTags).toContain('mercy_shown');
    expect(result!.foundingGateTags).toContain('heroic_origin');
    expect(result!.traitSeeds).toContain('trait.god.iron_will');
    expect(result!.axiologicalProfile.mercy_ruthlessness).toBeCloseTo(0.2);
  });

  it('returns null for incomplete state', () => {
    const state = createMeetingEncounterState('loc', 'asc', 0);
    expect(buildMeetingResult(state, 'life')).toBeNull();
  });
});

// ─── Content: Spark Investment ────────────────────────────────────

describe('getSparkInvestmentOptions', () => {
  it('returns 3 options for primary, secondary, and third reach', () => {
    const options = getSparkInvestmentOptions('iron', 'heart', 'eye');
    expect(options.length).toBe(3);
    expect(options[0].reach).toBe('iron');
    expect(options[1].reach).toBe('heart');
    expect(options[2].reach).toBe('eye');
  });
});

// ─── Content: God-Given Traits ────────────────────────────────────

describe('getGodGivenTraitOptions', () => {
  it('returns traits matching primary or secondary reach', () => {
    const options = getGodGivenTraitOptions('iron', 'heart');
    expect(options.length).toBe(2);
    expect(options.some(t => t.reach === 'iron')).toBe(true);
    expect(options.some(t => t.reach === 'heart')).toBe(true);
  });

  it('returns empty for non-matching reaches (impossible with full set)', () => {
    // Since we have one per reach, any combination gives results
    const options = getGodGivenTraitOptions('shadow', 'veil');
    expect(options.length).toBe(2);
  });
});

// ─── Content: Dilemma Templates ──────────────────────────────────

describe('DILEMMA_TEMPLATES', () => {
  it('has at least 10 templates', () => {
    expect(DILEMMA_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('covers all 4 categories', () => {
    const categories = new Set(DILEMMA_TEMPLATES.map(t => t.category));
    expect(categories).toContain('axiological');
    expect(categories).toContain('reach_specific');
    expect(categories).toContain('domain_specific');
    expect(categories).toContain('general');
  });

  it('all templates have valid choices with gate tags', () => {
    for (const t of DILEMMA_TEMPLATES) {
      expect(t.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of t.choices) {
        expect(c.id).toBeTruthy();
        expect(c.text).toBeTruthy();
        expect(c.gateTags).toBeDefined();
        expect(Array.isArray(c.gateTags)).toBe(true);
      }
    }
  });

  it('axiological templates target a value pair', () => {
    const axiological = DILEMMA_TEMPLATES.filter(t => t.category === 'axiological');
    for (const t of axiological) {
      expect(t.targetValuePair).toBeDefined();
    }
  });

  it('reach-specific templates target a reach', () => {
    const reachSpecific = DILEMMA_TEMPLATES.filter(t => t.category === 'reach_specific');
    for (const t of reachSpecific) {
      expect(t.targetReach).toBeDefined();
    }
  });
});
