/**
 * Tests for Dynamic Prose Enrichment — TB-035 Phase 5.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  gatherNarrativeContext,
  enrichProse,
  generateMeetingCallback,
  ENRICHMENT_ARTIFACT_MIN_TIER,
  ENRICHMENT_ALLY_MIN_TRUST,
  ENRICHMENT_MAX_NAMED_ALLIES,
  CALLBACK_PROSE_PROBABILITY,
  CAST_CONTEXT_MAX_MEMBERS,
  resolveSceneCastContext,
} from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import type { EncounterSupportBinding, EncounterSupportBundle } from '../../types/encounter';
import { WorldGraph } from '../graph';
import { REPUTATION_TRAIT_DEFINITIONS } from '../../data/reputation-trait-content';
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

  // Stranger (no relates_to edge to agent_1) — used for THR-694 target relation tests.
  // Carries a gender + faction so target pronoun/faction resolution can be exercised.
  g.addNode({
    id: 'agent_4', name: 'Dellan', type: 'actor',
    properties: { actorType: 'individual', gender: 'male' },
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
  // agent_4 is a rank-and-file member of the same faction (for {target:faction} tests).
  g.addEdge({
    id: 'edge_faction_4', source: 'agent_4', target: 'faction_1', type: 'member_of',
    properties: { role: 'member', rank: 1 },
  });

  // Reputation trait. `subcategory` is the canonical field on TraitDefinitionProperties —
  // this fixture previously wrote `category`, matching a dead read in gatherNarrativeContext
  // and keeping the title assertions green while no shipped trait ever resolved (THR-787).
  g.addNode({
    id: 'trait_1', name: 'The Unyielding', type: 'trait', category: 'trait',
    properties: { subcategory: 'reputation' },
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

  it('does NOT emit a trace when the template contains no {intel:*} placeholder', () => {
    clearTraces();
    enableTracing();
    try {
      const ctx = ctxWithIntel();
      // The context has records, but the prose has no intel tokens.
      enrichProse('A quiet morning. Nothing stirred in the square.', ctx);
      const traces = getTraces().filter(t => t.category === 'intelligence_referenced');
      expect(traces).toHaveLength(0);
    } finally {
      clearTraces();
      disableTracing();
    }
  });

  it('strips unknown {intel:typo} tokens instead of leaking raw braces', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('weird {intel:not_a_category} thing', ctx)).toBe('weird  thing');
    expect(enrichProse('also {intel:agent_network.bogus} here', ctx)).toBe('also  here');
  });

  // THR-385 — age placeholders
  it('resolves acquiredTicksAgo and acquiredDaysAgo for shrine_location (tick 30 - acquiredTick 10)', () => {
    const ctx = ctxWithIntel();
    // shrine_location acquiredTick=10, ctx.tick=30 → ticksAgo=20, daysAgo=floor(20/12)=1
    expect(enrichProse('{intel:shrine_location.acquiredTicksAgo}', ctx)).toBe('20');
    expect(enrichProse('{intel:shrine_location.acquiredDaysAgo}', ctx)).toBe('1');
  });

  it('resolves acquiredDaysAgo to "0" for trade_route (recently acquired, < 1 day)', () => {
    const ctx = ctxWithIntel();
    // trade_route acquiredTick=20, ctx.tick=30 → ticksAgo=10, daysAgo=floor(10/12)=0 (not empty string)
    expect(enrichProse('{intel:trade_route.acquiredTicksAgo}', ctx)).toBe('10');
    expect(enrichProse('{intel:trade_route.acquiredDaysAgo}', ctx)).toBe('0');
  });

  it('silently strips age placeholders when no matching record exists for the category', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('age: {intel:agent_network.acquiredDaysAgo}', ctx)).toBe('age: ');
    expect(enrichProse('age: {intel:agent_network.acquiredTicksAgo}', ctx)).toBe('age: ');
  });

  it('silently strips age placeholders when ctx.intelligence is undefined or ctx.tick is undefined', () => {
    // No intelligence context at all
    const noIntelCtx = createMinimalContext();
    expect(enrichProse('{intel:shrine_location.acquiredDaysAgo}', noIntelCtx)).toBe('');
    // tick undefined → acquiredTicksAgo clamps to '0' via Math.max(0, (undefined??0) - acquiredTick)
    const noTickCtx = ctxWithIntel({ tick: undefined });
    expect(enrichProse('{intel:shrine_location.acquiredTicksAgo}', noTickCtx)).toBe('0');
  });

  it('emits intelligence_referenced trace for age-only placeholder reference', () => {
    clearTraces();
    enableTracing();
    try {
      const ctx = ctxWithIntel();
      // Only acquiredDaysAgo — no label/detail/reliability token — must still emit the trace
      enrichProse('{intel:shrine_location.acquiredDaysAgo}', ctx);
      const traces = getTraces().filter(
        t => t.category === 'intelligence_referenced' && (t as any).recordId === 'intel_001',
      );
      expect(traces).toHaveLength(1);
      expect((traces[0] as any).referencedBy).toBe('prose_enrichment');
    } finally {
      clearTraces();
      disableTracing();
    }
  });

  it('strips malformed age token acquiredYearsAgo instead of leaking raw braces', () => {
    const ctx = ctxWithIntel();
    expect(enrichProse('old: {intel:shrine_location.acquiredYearsAgo}', ctx)).toBe('old: ');
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

// ─── Scene target (THR-694) ───────────────────────────────────────

describe('gatherNarrativeContext — scene target (THR-694)', () => {
  const gather = (targetId: string) =>
    gatherNarrativeContext(createTestGraph(), 'agent_1', undefined, undefined, undefined, undefined, undefined, { targetId });

  it('populates an agent target with ally relation (sentiment 0.8 ≥ 0.35)', () => {
    const ctx = gather('agent_2'); // Torren
    expect(ctx.target).toBeDefined();
    expect(ctx.target!.id).toBe('agent_2');
    expect(ctx.target!.kind).toBe('agent');
    expect(ctx.target!.name).toBe('Torren');
    expect(ctx.target!.relation).toBe('ally');
  });

  it('classifies a rival relation (sentiment -0.6 ≤ -0.35)', () => {
    expect(gather('agent_3').target!.relation).toBe('rival'); // Vex
  });

  it('classifies a stranger when no relates_to edge exists', () => {
    const ctx = gather('agent_4'); // Dellan — no bond to agent_1
    expect(ctx.target!.relation).toBe('stranger');
    expect(ctx.target!.pronouns).toEqual({ they: 'he', them: 'him', their: 'his', s: 's' });
    expect(ctx.target!.factionName).toBe('The Iron Wardens');
  });

  it('resolves a location-kind target to name only (no pronouns/relation/faction)', () => {
    const ctx = gather('loc_1'); // Ashenmoor
    expect(ctx.target!.kind).toBe('location');
    expect(ctx.target!.name).toBe('Ashenmoor');
    expect(ctx.target!.pronouns).toBeUndefined();
    expect(ctx.target!.relation).toBeUndefined();
    expect(ctx.target!.factionName).toBeUndefined();
  });

  it('omits the block for a self-targeted action (absence must read as absence)', () => {
    expect(gather('agent_1').target).toBeUndefined();
  });

  it('omits the block for a missing/deleted target node', () => {
    expect(gather('ghost_id').target).toBeUndefined();
  });

  it('omits the block when no targetId is passed (all non-encounter callers)', () => {
    const ctx = gatherNarrativeContext(createTestGraph(), 'agent_1');
    expect(ctx.target).toBeUndefined();
  });
});

describe('enrichProse — scene target placeholders (THR-694)', () => {
  const allyTarget: NarrativeContext['target'] = {
    id: 'agent_2', kind: 'agent', name: 'Torren',
    pronouns: { they: 'he', them: 'him', their: 'his', s: 's' },
    factionName: 'The Iron Wardens', relation: 'ally',
  };

  it('resolves {target} to the target name', () => {
    const ctx = createMinimalContext({ target: allyTarget });
    expect(enrichProse('You meet {target}.', ctx)).toBe('You meet Torren.');
  });

  it('falls back to "the other party" when no target block', () => {
    const ctx = createMinimalContext(); // no target
    expect(enrichProse('You meet {target}.', ctx)).toBe('You meet the other party.');
  });

  it('resolves target pronouns (lower + capitalized)', () => {
    const ctx = createMinimalContext({ target: allyTarget });
    expect(enrichProse('{target:They} draw{target:s} {target:their} blade against {target:them}.', ctx))
      .toBe('He draws his blade against him.');
  });

  it('falls back to neutral they/them for target pronouns when absent', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{target:They} raise{target:s} {target:their} hand.', ctx))
      .toBe('They raise their hand.');
  });

  it('resolves {target:faction} and falls back to "their people"', () => {
    expect(enrichProse('{target:faction}', createMinimalContext({ target: allyTarget }))).toBe('The Iron Wardens');
    expect(enrichProse('{target:faction}', createMinimalContext())).toBe('their people');
  });

  it('strips unknown {target:typo} tokens instead of leaking raw braces', () => {
    const ctx = createMinimalContext({ target: allyTarget });
    expect(enrichProse('weird {target:bogus} thing', ctx)).toBe('weird  thing');
  });

  it('resolves {?target_is_ally|rival|stranger} conditionals against relation', () => {
    const ally = createMinimalContext({ target: allyTarget });
    expect(enrichProse('{?target_is_ally}old friend{/target_is_ally}', ally)).toBe('old friend');
    expect(enrichProse('{?target_is_rival}enemy{/target_is_rival}', ally)).toBe('');

    const rival = createMinimalContext({ target: { id: 'x', kind: 'agent', name: 'Vex', relation: 'rival' } });
    expect(enrichProse('{?target_is_rival}enemy{/target_is_rival}', rival)).toBe('enemy');

    const stranger = createMinimalContext({ target: { id: 'y', kind: 'agent', name: 'Dellan', relation: 'stranger' } });
    expect(enrichProse('{?target_is_stranger}unknown{/target_is_stranger}', stranger)).toBe('unknown');
  });

  it('resolves {?has_target}/{?no_target} presence conditionals', () => {
    const withTarget = createMinimalContext({ target: allyTarget });
    expect(enrichProse('{?has_target}someone is here{/has_target}', withTarget)).toBe('someone is here');
    expect(enrichProse('{?no_target}alone{/no_target}', withTarget)).toBe('');

    const noTarget = createMinimalContext();
    expect(enrichProse('{?no_target}alone{/no_target}', noTarget)).toBe('alone');
    expect(enrichProse('{?has_target}someone{/has_target}', noTarget)).toBe('');
  });

  it('treats a location-kind target as present but relation-less', () => {
    const loc = createMinimalContext({ target: { id: 'loc_1', kind: 'location', name: 'Ashenmoor' } });
    // has_target true, but no relation → all relation conditionals fail; {target} names the place
    expect(enrichProse('{?has_target}at {target}{/has_target}', loc)).toBe('at Ashenmoor');
    expect(enrichProse('{?target_is_stranger}x{/target_is_stranger}', loc)).toBe('');
    expect(enrichProse('{target:faction}', loc)).toBe('their people'); // fallback for location
  });
});

// ─── Scene cast (THR-696) ─────────────────────────────────────────

describe('resolveSceneCastContext — scene cast (THR-696)', () => {
  const bundle: EncounterSupportBundle = [
    {
      kind: 'actor', key: 'gate_captain', delivery: 'pre-seeded', persistence: 'must-persist',
      supportRole: 'checkpoint_captain', spawnNpcRole: 'guard_captain', spawnName: 'Gate Captain',
    },
    {
      kind: 'actor', key: 'suspect_courier', delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist', supportRole: 'checkpoint_courier', spawnNpcRole: 'courier',
      spawnName: 'Harried Courier',
    },
    {
      kind: 'location', key: 'gatehouse', delivery: 'pre-seeded', persistence: 'must-persist',
      sublocationTypeId: 'sublocation-type.gatehouse', fallbackName: 'Gatehouse Checkpoint',
    },
  ];

  function castGraph(): WorldGraph {
    const g = createTestGraph();
    // The reuse-first binding target: a real NPC already standing at the gate.
    g.addNode({
      id: 'npc_merrow', name: 'Captain Merrow', type: 'actor',
      properties: { actorType: 'individual', npcRole: 'guard_captain' },
    });
    return g;
  }

  const binding = (key: string, nodeId: string, reused: boolean): EncounterSupportBinding => ({
    key, nodeId, kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused,
  });

  it('names the *bound* entity, not the authored spawnName, for a reused binding', () => {
    const cast = resolveSceneCastContext(castGraph(), bundle, [
      binding('gate_captain', 'npc_merrow', true),
    ]);
    expect(cast!.gate_captain).toEqual({
      name: 'Captain Merrow', role: 'checkpoint_captain', reused: true,
    });
  });

  it('falls back to the spec name for a declared-but-unbound key', () => {
    const cast = resolveSceneCastContext(castGraph(), bundle, []);
    expect(cast!.suspect_courier.name).toBe('Harried Courier');
    expect(cast!.suspect_courier.reused).toBe(false);
    // Location specs fall back to fallbackName and carry the sublocation type as role.
    expect(cast!.gatehouse).toEqual({
      name: 'Gatehouse Checkpoint', role: 'sublocation-type.gatehouse', reused: false,
    });
  });

  it('falls back to the spec name when the bound node has been deleted', () => {
    const cast = resolveSceneCastContext(castGraph(), bundle, [
      binding('gate_captain', 'ghost_id', true),
    ]);
    expect(cast!.gate_captain.name).toBe('Gate Captain');
  });

  it('returns undefined for an absent or empty bundle', () => {
    expect(resolveSceneCastContext(castGraph(), undefined, [])).toBeUndefined();
    expect(resolveSceneCastContext(castGraph(), [], [])).toBeUndefined();
  });

  it('skips blocked-primitive specs (they are never part of the scene)', () => {
    const blocked: EncounterSupportBundle = [{
      kind: 'actor', key: 'absent_lord', delivery: 'blocked-primitive', persistence: 'scene-only',
      supportRole: 'lord', spawnNpcRole: 'noble', spawnName: 'The Absent Lord',
    }];
    expect(resolveSceneCastContext(castGraph(), blocked, [])).toBeUndefined();
  });

  it('caps the cast at CAST_CONTEXT_MAX_MEMBERS', () => {
    const big: EncounterSupportBundle = Array.from({ length: 10 }, (_, i) => ({
      kind: 'actor' as const, key: `k${i}`, delivery: 'pre-seeded' as const,
      persistence: 'must-persist' as const, supportRole: 'r', spawnNpcRole: 'n', spawnName: `N${i}`,
    }));
    const cast = resolveSceneCastContext(castGraph(), big, []);
    expect(Object.keys(cast!)).toHaveLength(CAST_CONTEXT_MAX_MEMBERS);
  });

  it('is wired through gatherNarrativeContext opts', () => {
    const ctx = gatherNarrativeContext(
      castGraph(), 'agent_1', undefined, undefined, undefined, undefined, undefined,
      { supportBundle: bundle, supportBindings: [binding('gate_captain', 'npc_merrow', true)] },
    );
    expect(ctx.cast!.gate_captain.name).toBe('Captain Merrow');
    // Callers that pass nothing keep today's behavior.
    expect(gatherNarrativeContext(castGraph(), 'agent_1').cast).toBeUndefined();
  });
});

describe('enrichProse — scene cast placeholders (THR-696)', () => {
  const cast: NarrativeContext['cast'] = {
    gate_captain: { name: 'Captain Merrow', role: 'checkpoint_captain', reused: true },
    suspect_courier: { name: 'Harried Courier', role: 'checkpoint_courier', reused: false },
  };

  it('resolves {cast:<key>} to the member name', () => {
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('{cast:gate_captain} reads the report.', ctx))
      .toBe('Captain Merrow reads the report.');
  });

  it('resolves several keys in one template', () => {
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('{cast:gate_captain} watches {cast:suspect_courier}.', ctx))
      .toBe('Captain Merrow watches Harried Courier.');
  });

  it('strips an undeclared key and warns — an authoring error, not a runtime state', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('the {cast:nobody} waits', ctx)).toBe('the  waits');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('{cast:nobody}'));
    warn.mockRestore();
  });

  it('strips {cast:*} silently when no cast block is present (caller threaded no bundle)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(enrichProse('the {cast:gate_captain} waits', createMinimalContext())).toBe('the  waits');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('resolves {?has_cast:<key>} / {?no_cast:<key>} for a declared key', () => {
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('{?has_cast:gate_captain}the captain is here{/has_cast:gate_captain}', ctx))
      .toBe('the captain is here');
    expect(enrichProse('{?no_cast:gate_captain}nobody{/no_cast:gate_captain}', ctx)).toBe('');
  });

  it('treats an undeclared key as absent in both conditional directions', () => {
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('{?has_cast:nobody}present{/has_cast:nobody}', ctx)).toBe('');
    expect(enrichProse('{?no_cast:nobody}absent{/no_cast:nobody}', ctx)).toBe('absent');
  });

  it('treats every key as absent when there is no cast block at all', () => {
    const ctx = createMinimalContext();
    expect(enrichProse('{?has_cast:gate_captain}x{/has_cast:gate_captain}', ctx)).toBe('');
    expect(enrichProse('{?no_cast:gate_captain}alone{/no_cast:gate_captain}', ctx)).toBe('alone');
  });

  it('leaves the pre-existing {?has_ally} conditionals untouched', () => {
    const ctx = createMinimalContext({ cast });
    expect(enrichProse('{?has_ally}{ally:strongest} nods{/has_ally}', ctx)).toBe('Torren nods');
  });
});

describe('{group} placeholder — bound introduction subject (THR-522)', () => {
  it('resolves {group} to the bound group name when present', () => {
    const ctx = createMinimalContext({ boundGroupName: 'the Vaerin Hold' });
    expect(enrichProse('{group} lifts its first prayer toward you', ctx)).toBe(
      'the Vaerin Hold lifts its first prayer toward you',
    );
  });

  it('falls back to neutral phrasing when no group is bound (never leaks a raw token)', () => {
    const ctx = createMinimalContext(); // boundGroupName undefined
    const out = enrichProse('{group} lifts its first prayer toward you', ctx);
    expect(out).not.toContain('{group}');
    expect(out).toBe('a people you have not yet named lifts its first prayer toward you');
  });

  it('is distinct from {culture}/{faction} (anchor agent vs. bound group)', () => {
    const ctx = createMinimalContext({ boundGroupName: 'the Salt Choir' });
    const out = enrichProse('{culture} hears that {group} now stirs', ctx);
    expect(out).toBe('The Aurelians hears that the Salt Choir now stirs');
  });
});

// ─── Reputation titles against SHIPPED definitions (THR-787) ──────
//
// The pre-existing title tests used a hand-written trait node whose properties
// carried `category: 'reputation'` — the same wrong field the production filter
// read. Test and code agreed, so the suite stayed green while no *shipped*
// reputation trait ever produced a title. These tests anchor on real entries from
// REPUTATION_TRAIT_DEFINITIONS instead, so the assertion cannot go vacuous through
// fixture drift: renaming the canonical field breaks them.

describe('reputation titles resolve from shipped trait definitions (THR-787)', () => {
  /** A real shipped reputation definition — not a hand-made fixture. */
  const shippedReputation = REPUTATION_TRAIT_DEFINITIONS[0];

  function graphWithTraitNode(traitNode: { id: string; type: string; name: string; properties: object }): WorldGraph {
    const g = new WorldGraph();
    g.addNode({
      id: 'agent_r', name: 'Sera', type: 'actor',
      properties: { actorType: 'individual' },
    });
    g.addNode(traitNode as Parameters<WorldGraph['addNode']>[0]);
    g.addEdge({
      id: 'edge_trait_r', source: 'agent_r', target: traitNode.id, type: 'has_trait',
      properties: { level: 1 },
    });
    return g;
  }

  it('every shipped reputation definition stores its category under `subcategory`', () => {
    // Guards the drift this ticket fixed: a definition that reverts to `category`
    // would silently drop out of the title filter again.
    expect(REPUTATION_TRAIT_DEFINITIONS.length).toBeGreaterThan(0);
    for (const def of REPUTATION_TRAIT_DEFINITIONS) {
      expect(def.properties.subcategory).toBe('reputation');
      expect((def.properties as unknown as Record<string, unknown>).category).toBeUndefined();
    }
  });

  it('gatherNarrativeContext collects the title from a shipped reputation trait', () => {
    const g = graphWithTraitNode(shippedReputation);
    const ctx = gatherNarrativeContext(g, 'agent_r');

    expect(ctx.titles).toContain(shippedReputation.name);
  });

  it('{title} renders the shipped reputation name, not the agent-name fallback', () => {
    const g = graphWithTraitNode(shippedReputation);
    const ctx = gatherNarrativeContext(g, 'agent_r');

    const out = enrichProse('They call {them} {title}.', ctx);
    expect(out).toBe(`They call them ${shippedReputation.name}.`);
    expect(out).not.toContain('Sera');
  });

  it('{?has_title} fires for a bearer of a shipped reputation trait', () => {
    const g = graphWithTraitNode(shippedReputation);
    const ctx = gatherNarrativeContext(g, 'agent_r');

    expect(enrichProse('{?has_title}known{/has_title}', ctx)).toBe('known');
    expect(enrichProse('{?no_title}nameless{/no_title}', ctx)).toBe('');
  });

  it('a non-reputation shipped trait yields no title (filter is not a pass-through)', () => {
    const mastery = {
      id: 'trait.mastery.test-smithing',
      type: 'trait',
      name: 'Master Smith',
      properties: { subcategory: 'mastery' },
    };
    const g = graphWithTraitNode(mastery);
    const ctx = gatherNarrativeContext(g, 'agent_r');

    expect(ctx.titles).toHaveLength(0);
    expect(enrichProse('{title}', ctx)).toBe('Sera');
    expect(enrichProse('{?no_title}nameless{/no_title}', ctx)).toBe('nameless');
  });
});
