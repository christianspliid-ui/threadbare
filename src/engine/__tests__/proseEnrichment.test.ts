/**
 * Tests for Dynamic Prose Enrichment — TB-035 Phase 5.
 */

import { describe, it, expect } from 'vitest';
import {
  gatherNarrativeContext,
  enrichProse,
  generateMeetingCallback,
  ENRICHMENT_ARTIFACT_MIN_TIER,
  ENRICHMENT_ALLY_MIN_TRUST,
  ENRICHMENT_MAX_NAMED_ALLIES,
  CALLBACK_PROSE_PROBABILITY,
} from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import { WorldGraph } from '../graph';
import type { MeetingChoiceRecord } from '../../types/meetingEncounter';
import type { BeatOutcome } from '../../types/journeyEngine';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';

// ─── Test Helpers ─────────────────────────────────────────────────

function createTestGraph(): WorldGraph {
  const g = new WorldGraph();

  // Agent
  g.addNode({
    id: 'agent_1', name: 'Kira', type: 'actor', category: 'individual',
    properties: { actorType: 'individual', gender: 'female', primaryReach: 'iron', archetypeId: 'rebel' },
  });

  // Culture
  g.addNode({
    id: 'culture_1', name: 'The Aurelians', type: 'actor', category: 'culture',
    properties: { actorType: 'culture' },
  });
  g.addEdge({
    id: 'edge_culture', source: 'agent_1', target: 'culture_1', type: 'belongs_to',
    properties: {},
  });

  // Location
  g.addNode({
    id: 'loc_1', name: 'Ashenmoor', type: 'location', category: 'settlement',
    properties: {},
  });
  g.addEdge({
    id: 'edge_loc', source: 'agent_1', target: 'loc_1', type: 'located_at',
    properties: {},
  });

  // Artifact (storied tier)
  g.addNode({
    id: 'artifact_1', name: 'Frostbane', type: 'artifact', category: 'artifact',
    properties: { tier: 'storied', reach: 'iron' },
  });
  g.addEdge({
    id: 'edge_art', source: 'agent_1', target: 'artifact_1', type: 'possesses',
    properties: {},
  });

  // Common artifact (should be filtered out)
  g.addNode({
    id: 'artifact_2', name: 'Rusty Dagger', type: 'artifact', category: 'artifact',
    properties: { tier: 'common' },
  });
  g.addEdge({
    id: 'edge_art2', source: 'agent_1', target: 'artifact_2', type: 'possesses',
    properties: {},
  });

  // Ally (high trust)
  g.addNode({
    id: 'agent_2', name: 'Torren', type: 'actor', category: 'individual',
    properties: { actorType: 'individual' },
  });
  g.addEdge({
    id: 'edge_bond_1', source: 'agent_1', target: 'agent_2', type: 'relates_to',
    properties: { sentiment: 0.8, basis: 'combat' },
  });

  // Rival (negative trust)
  g.addNode({
    id: 'agent_3', name: 'Vex', type: 'actor', category: 'individual',
    properties: { actorType: 'individual' },
  });
  g.addEdge({
    id: 'edge_bond_2', source: 'agent_1', target: 'agent_3', type: 'relates_to',
    properties: { sentiment: -0.6, basis: 'rivalry' },
  });

  // Faction membership (leader)
  g.addNode({
    id: 'faction_1', name: 'The Iron Wardens', type: 'actor', category: 'faction',
    properties: { actorType: 'faction' },
  });
  g.addEdge({
    id: 'edge_faction', source: 'agent_1', target: 'faction_1', type: 'member_of',
    properties: { role: 'leader', rank: 4 },
  });

  // Reputation trait
  g.addNode({
    id: 'trait_1', name: 'The Unyielding', type: 'trait', category: 'trait',
    properties: { category: 'reputation' },
  });
  g.addEdge({
    id: 'edge_trait', source: 'agent_1', target: 'trait_1', type: 'has_trait',
    properties: { level: 2 },
  });

  return g;
}

function createMinimalContext(overrides?: Partial<NarrativeContext>): NarrativeContext {
  return {
    agentName: 'Kira',
    agentId: 'agent_1',
    archetypeId: 'rebel',
    cultureName: 'The Aurelians',
    primaryReach: 'iron',
    titles: ['The Unyielding'],
    notableArtifacts: [{ name: 'Frostbane', tier: 'storied', reach: 'iron' }],
    strongAllies: [{ name: 'Torren', trust: 0.8 }],
    rivals: [{ name: 'Vex', trust: -0.6 }],
    currentLocationName: 'Ashenmoor',
    completedPhases: ['call', 'road_of_trials'],
    beatHistory: [],
    pronouns: { they: 'she', them: 'her', their: 'her', s: 's' },
    factionRank: { factionName: 'The Iron Wardens', rank: 'leader' },
    ...overrides,
  };
}

// ─── Constants ────────────────────────────────────────────────────

describe('Enrichment constants', () => {
  it('has sensible defaults', () => {
    expect(ENRICHMENT_ARTIFACT_MIN_TIER).toBe('storied');
    expect(ENRICHMENT_ALLY_MIN_TRUST).toBe(0.5);
    expect(ENRICHMENT_MAX_NAMED_ALLIES).toBe(2);
    expect(CALLBACK_PROSE_PROBABILITY).toBeGreaterThan(0);
    expect(CALLBACK_PROSE_PROBABILITY).toBeLessThanOrEqual(1);
  });
});

// ─── gatherNarrativeContext ───────────────────────────────────────

describe('gatherNarrativeContext', () => {
  it('gathers full context from graph', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.agentName).toBe('Kira');
    expect(ctx.agentId).toBe('agent_1');
    expect(ctx.cultureName).toBe('The Aurelians');
    expect(ctx.currentLocationName).toBe('Ashenmoor');
    expect(ctx.primaryReach).toBe('iron');
  });

  it('includes storied+ artifacts, filters common', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.notableArtifacts.length).toBe(1);
    expect(ctx.notableArtifacts[0].name).toBe('Frostbane');
  });

  it('includes strong allies above trust threshold', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.strongAllies.length).toBe(1);
    expect(ctx.strongAllies[0].name).toBe('Torren');
  });

  it('includes rivals with negative sentiment', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.rivals.length).toBe(1);
    expect(ctx.rivals[0].name).toBe('Vex');
  });

  it('includes faction rank for leaders', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.factionRank).toBeDefined();
    expect(ctx.factionRank!.factionName).toBe('The Iron Wardens');
    expect(ctx.factionRank!.rank).toBe('leader');
  });

  it('includes reputation titles', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.titles).toContain('The Unyielding');
  });

  it('resolves female pronouns', () => {
    const g = createTestGraph();
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.pronouns.they).toBe('she');
    expect(ctx.pronouns.them).toBe('her');
    expect(ctx.pronouns.their).toBe('her');
    expect(ctx.pronouns.s).toBe('s');
  });

  it('defaults to they/them for unknown gender', () => {
    const g = createTestGraph();
    // Override gender to empty
    g.updateNode('agent_1', { properties: { actorType: 'individual', gender: '' } });
    const ctx = gatherNarrativeContext(g, 'agent_1');

    expect(ctx.pronouns.they).toBe('they');
    expect(ctx.pronouns.them).toBe('them');
  });

  it('gracefully handles missing agent', () => {
    const g = new WorldGraph();
    const ctx = gatherNarrativeContext(g, 'nonexistent');

    expect(ctx.agentName).toBe('the mortal');
    expect(ctx.cultureName).toBe('unknown culture');
    expect(ctx.currentLocationName).toBe('the wilderness');
    expect(ctx.notableArtifacts).toEqual([]);
    expect(ctx.strongAllies).toEqual([]);
  });

  it('passes through meeting record and beat history', () => {
    const g = createTestGraph();
    const record: MeetingChoiceRecord = {
      chosenCandidateId: 'agent_1',
      dilemmaChosen: 'test_dilemma',
      dilemmaOutcome: 'cooperate',
      intentPrimaryReach: 'iron',
      archetypeId: 'rebel',
      foundingGateTags: ['showed_mercy'],
    };
    const beats: BeatOutcome[] = [{ phase: 'call', beatId: 'b1', choiceId: 'c1', outcomeType: 'positive' }];

    const ctx = gatherNarrativeContext(g, 'agent_1', record, beats);
    expect(ctx.meetingChoiceRecord).toBe(record);
    expect(ctx.beatHistory).toBe(beats);
    expect(ctx.completedPhases).toContain('call');
  });
});

// ─── enrichProse ──────────────────────────────────────────────────

describe('enrichProse', () => {
  it('replaces {name}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{name} walks forward.', ctx)).toBe('Kira walks forward.');
  });

  it('replaces {location}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('at {location}', ctx)).toBe('at Ashenmoor');
  });

  it('replaces {culture}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('of the {culture}', ctx)).toBe('of the The Aurelians');
  });

  it('replaces gendered pronouns', () => {
    const ctx = createMinimalContext();
    const result = enrichProse('{They} picked up {their} sword and held it close to {them}.', ctx);
    expect(result).toBe('She picked up her sword and held it close to her.');
  });

  it('replaces {artifact:weapon} with iron-reach artifact', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{artifact:weapon}', ctx)).toBe('Frostbane');
  });

  it('falls back for missing artifact', () => {
    const ctx = createMinimalContext({ notableArtifacts: [] });
    expect(enrichProse('{artifact:weapon}', ctx)).toBe('their weapon');
  });

  it('replaces {ally:strongest}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{ally:strongest}', ctx)).toBe('Torren');
  });

  it('falls back for missing ally', () => {
    const ctx = createMinimalContext({ strongAllies: [] });
    expect(enrichProse('{ally:strongest}', ctx)).toBe('a trusted companion');
  });

  it('replaces {rival:strongest}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{rival:strongest}', ctx)).toBe('Vex');
  });

  it('replaces {faction}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{faction}', ctx)).toBe('The Iron Wardens');
  });

  it('replaces {title}', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{title}', ctx)).toBe('The Unyielding');
  });

  it('resolves {?has_artifact}...{/has_artifact} conditional (true)', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{?has_artifact}wielding a weapon{/has_artifact}', ctx)).toBe('wielding a weapon');
  });

  it('removes {?has_artifact}...{/has_artifact} conditional (false)', () => {
    const ctx = createMinimalContext({ notableArtifacts: [] });
    expect(enrichProse('{?has_artifact}wielding a weapon{/has_artifact}', ctx)).toBe('');
  });

  it('resolves {?no_ally}...{/no_ally} inverse conditional', () => {
    const ctx = createMinimalContext({ strongAllies: [] });
    expect(enrichProse('{?no_ally}alone{/no_ally}', ctx)).toBe('alone');
  });

  it('removes {?no_ally} when allies exist', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{?no_ally}alone{/no_ally}', ctx)).toBe('');
  });

  it('handles multiple placeholders in one template', () => {
    const ctx = createMinimalContext();
    const template = '{name} of {culture}, wielding {artifact:weapon}, stands at {location}.';
    const result = enrichProse(template, ctx);
    expect(result).toBe('Kira of The Aurelians, wielding Frostbane, stands at Ashenmoor.');
  });

  it('handles {s} for verb conjugation', () => {
    const ctx = createMinimalContext(); // female → s = 's'
    expect(enrichProse('{name} walk{s} forward.', ctx)).toBe('Kira walks forward.');
  });

  it('handles they/them {s} as empty', () => {
    const ctx = createMinimalContext({
      pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
    });
    expect(enrichProse('{name} walk{s} forward.', ctx)).toBe('Kira walk forward.');
  });
});

// ─── Intelligence placeholders (THR-113) ──────────────────────────

describe('enrichProse — intelligence placeholders', () => {
  function ctxWithIntel(overrides?: Partial<NarrativeContext>): NarrativeContext {
    return createMinimalContext({
      agentId: 'agent_1',
      intelligence: {
        byCategory: {
          shrine_location: {
            recordId: 'intel_001',
            agentId: 'agent_1',
            category: 'shrine_location',
            label: 'The Pale Court shrine',
            detail: 'Hidden behind the falls; guardians change at dusk.',
            reliability: 0.85,
            acquiredTick: 10,
            sourceEncounterId: 'encounter.quest',
            targetRegion: 'vessen_uplands',
          },
          trade_route: {
            recordId: 'intel_002',
            agentId: 'agent_1',
            category: 'trade_route',
            label: 'Salt route schedule',
            detail: 'Caravans depart at dawn from the northern gate.',
            reliability: 0.5,
            acquiredTick: 20,
            sourceEncounterId: 'encounter.merchant',
          },
        },
        flags: { shrine_location: true, trade_route: true },
        all: [],
      },
      tick: 30,
      ...overrides,
    });
  }

  it('resolves {intel:<category>} to the record label', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('knowledge of {intel:shrine_location}', ctx)).toBe(
      'knowledge of The Pale Court shrine',
    );
  });

  it('resolves {intel:<category>.detail} to the record detail', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('{intel:shrine_location.detail}', ctx)).toBe(
      'Hidden behind the falls; guardians change at dusk.',
    );
  });

  it('resolves {intel:<category>.reliability} to the descriptor', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('intel is {intel:shrine_location.reliability}', ctx)).toBe(
      'intel is reliable',
    );
    expect(enrichProse('intel is {intel:trade_route.reliability}', ctx)).toBe(
      'intel is uncertain',
    );
  });

  it('silently strips {intel:*} when no matching record', () => {
    const ctx = ctxWithIntel();
    // agent_network has no record — placeholder falls through to empty string
    expect(enrichProse('contacts: {intel:agent_network}', ctx)).toBe('contacts: ');
  });

  it('silently strips {intel:*} when ctx.intelligence is undefined', () => {
    const ctx = createMinimalContext(); // no intelligence field
    expect(enrichProse('contacts: {intel:agent_network}', ctx)).toBe('contacts: ');
    expect(enrichProse('detail: {intel:shrine_location.detail}', ctx)).toBe('detail: ');
  });

  it('evaluates {?knows_<category>} conditionals against the flags', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('{?knows_shrine_location}she remembers{/knows_shrine_location}', ctx))
      .toBe('she remembers');
    expect(enrichProse('{?knows_agent_network}contacts pulled{/knows_agent_network}', ctx))
      .toBe('');
  });

  it('evaluates {?no_<category>} conditionals inversely', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('{?no_agent_network}she has no contacts{/no_agent_network}', ctx))
      .toBe('she has no contacts');
    expect(enrichProse('{?no_shrine_location}unknown shrines{/no_shrine_location}', ctx))
      .toBe('');
  });

  it('emits one intelligence_referenced trace per unique recordId per call', () => {
    clearTraces();
    enableTracing();
    try {
      const ctx = ctxWithIntel();
      // Template references the same record via 3 placeholders
      enrichProse(
        '{intel:shrine_location} / {intel:shrine_location.detail} / {intel:shrine_location.reliability}',
        ctx,
      );
      const traces = getTraces().filter(
        t => t.category === 'intelligence_referenced' && (t as any).recordId === 'intel_001',
      );
      expect(traces).toHaveLength(1);
      expect((traces[0] as any).referencedBy).toBe('prose_enrichment');
      expect((traces[0] as any).agentId).toBe('agent_1');
    } finally {
      clearTraces();
      disableTracing();
    }
  });
});

// ─── generateMeetingCallback ──────────────────────────────────────

describe('generateMeetingCallback', () => {
  it('returns null without meeting record', () => {
    const ctx = createMinimalContext({ meetingChoiceRecord: undefined });
    expect(generateMeetingCallback(ctx, () => 0.5)).toBeNull();
  });

  it('returns null when rng exceeds probability', () => {
    const record: MeetingChoiceRecord = {
      chosenCandidateId: 'agent_1',
      dilemmaChosen: 'test',
      dilemmaOutcome: 'cooperate',
      intentPrimaryReach: 'iron',
      archetypeId: 'rebel',
      foundingGateTags: [],
    };
    const ctx = createMinimalContext({ meetingChoiceRecord: record });
    // rng returns > CALLBACK_PROSE_PROBABILITY
    expect(generateMeetingCallback(ctx, () => 0.99)).toBeNull();
  });

  it('returns iron callback prose with {name} resolved', () => {
    const record: MeetingChoiceRecord = {
      chosenCandidateId: 'agent_1',
      dilemmaChosen: 'test',
      dilemmaOutcome: 'cooperate',
      intentPrimaryReach: 'iron',
      archetypeId: 'rebel',
      foundingGateTags: [],
    };
    const ctx = createMinimalContext({ meetingChoiceRecord: record });
    // rng returns 0.1 (below CALLBACK_PROSE_PROBABILITY)
    const result = generateMeetingCallback(ctx, () => 0.1);
    expect(result).not.toBeNull();
    expect(result).toContain('Kira');
  });

  it('returns callback for each reach domain', () => {
    const reaches = ['iron', 'heart', 'eye', 'shadow', 'veil', 'stone', 'star', 'gold', 'gold'] as const;

    for (const reach of reaches) {
      const record: MeetingChoiceRecord = {
        chosenCandidateId: 'agent_1',
        dilemmaChosen: 'test',
        dilemmaOutcome: 'cooperate',
        intentPrimaryReach: reach,
        archetypeId: 'rebel',
        foundingGateTags: [],
      };
      const ctx = createMinimalContext({ meetingChoiceRecord: record });
      const result = generateMeetingCallback(ctx, () => 0.1);
      expect(result, `callback should exist for reach: ${reach}`).not.toBeNull();
    }
  });
});
