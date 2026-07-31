/**
 * Meeting trait-seed landing — THR-872.
 *
 * `MeetingEncounterResult.traitSeeds` had four authoring sources and no consumer:
 * `createAgentFromMeeting` never read the field, so every descriptor the meeting
 * authored was discarded at the graph boundary. These tests pin the repaired
 * channel end to end — authored → landed on the node → read by a production
 * surface.
 *
 * ── Why the population is enumerated from the real catalogs ────────────────────
 *
 * The Done-when asks for granted-vs-required enumeration, and the trap it guards
 * is the vacuous probe: a test that maps over an empty population passes while
 * asserting nothing. So every source is asserted non-empty *individually* before
 * the landing assertion runs — if a catalog is renamed, restructured, or emptied,
 * these fail loudly rather than going quietly green.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createAgentFromMeeting } from '../meetingEncounter';
import { generateBackstory, humanizeDescriptor } from '../profileGenerator';
import { getAgentInfoCard } from '../agentDetail';
import { DILEMMA_TEMPLATES } from '../../data/meeting-content';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { SPARK_VISION_CATALOG } from '../../data/spark-vision-catalog';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import type { MeetingEncounterResult } from '../../types/meetingEncounter';
import { VALUE_PAIRS } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';

// ─── The authored seed population ─────────────────────────────────

/** Legacy dilemma choices (`meeting-content.ts`). */
const LEGACY_DILEMMA_SEEDS: readonly string[] = DILEMMA_TEMPLATES
  .flatMap(t => t.choices)
  .flatMap(c => c.traitSeeds ?? []);

/** Enriched dilemma choices (`meeting-dilemma-library.ts`) — the bulk of the vocabulary. */
const ENRICHED_DILEMMA_SEEDS: readonly string[] = ENRICHED_DILEMMA_LIBRARY
  .flatMap(t => t.choices)
  .flatMap(c => c.traitSeeds ?? []);

/** Spark vision grants (`spark-vision-catalog.ts`). */
const SPARK_SEEDS: readonly string[] = SPARK_VISION_CATALOG
  .flatMap(v => v.traitGrants ?? []);

/** Bond reception seeds (`meeting-bond-test.ts`, THR-868). */
const BOND_RECEPTION_SEEDS: readonly string[] = Object.values(MEETING_BOND_TEST.receptions)
  .map(r => r.traitSeed)
  .filter((s): s is string => typeof s === 'string');

/** Every distinct descriptor any meeting path can author. */
const ALL_AUTHORED_SEEDS: readonly string[] = [
  ...new Set([
    ...LEGACY_DILEMMA_SEEDS,
    ...ENRICHED_DILEMMA_SEEDS,
    ...SPARK_SEEDS,
    ...BOND_RECEPTION_SEEDS,
  ]),
];

// ─── Helpers ──────────────────────────────────────────────────────

function buildTestGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc',
    type: 'actor',
    name: 'The Verdant One',
    properties: { actorType: 'ascendant', sphereAlignment: { primary: 'life', secondary: 'spirit' } },
  });
  graph.addNode({
    id: 'loc_village',
    type: 'location',
    name: 'Ashenmoor',
    properties: { locationType: 'settlement', locationSubtype: 'village', hexCol: 3, hexRow: 4 },
  });
  return graph;
}

function buildResult(traitSeeds: string[]): MeetingEncounterResult {
  const axiologicalProfile = {} as MeetingEncounterResult['axiologicalProfile'];
  for (const pair of VALUE_PAIRS) axiologicalProfile[pair] = 0;
  const reachCapabilities = {} as MeetingEncounterResult['reachCapabilities'];
  for (const r of REACH_DOMAINS) reachCapabilities[r] = 0.3;

  return {
    name: 'Kael',
    archetypeId: 'iron_heart',
    cultureId: 'culture_1',
    axiologicalProfile,
    reachCapabilities,
    primaryReach: 'iron',
    secondaryReach: 'heart',
    sphere: 'force',
    cooperationStrategy: 'tit-for-tat',
    foundingGateTags: [],
    traitSeeds,
    appearanceSeed: 12345,
    locationId: 'loc_village',
    meetingChoiceRecord: {
      encounterTick: 10,
      locationId: 'loc_village',
      candidateIndex: 0,
      archetypeId: 'iron_heart',
      dilemmaChoices: [],
      sparkVisionId: 'spark_iron_will',
      ascendantSphere: 'life',
      foundingGateTags: [],
    },
  };
}

function landedDescriptors(graph: WorldGraph, agentId: string): string[] {
  const raw = graph.getNode(agentId)?.properties.narrativeDescriptors;
  return Array.isArray(raw) ? (raw as string[]) : [];
}

// ─── Population is real (anti-vacuity guard) ──────────────────────

describe('authored seed population', () => {
  it('every producer contributes seeds — no source is silently empty', () => {
    // Each asserted separately: a single combined non-empty check would pass with
    // three of the four sources dead, which is exactly the drift worth catching.
    expect(LEGACY_DILEMMA_SEEDS.length).toBeGreaterThan(0);
    expect(ENRICHED_DILEMMA_SEEDS.length).toBeGreaterThan(0);
    expect(SPARK_SEEDS.length).toBeGreaterThan(0);
    expect(BOND_RECEPTION_SEEDS.length).toBeGreaterThan(0);
  });

  it('the bond reception covers all five receptions (THR-868)', () => {
    expect([...BOND_RECEPTION_SEEDS].sort()).toEqual([
      'bound_against_their_word',
      'gave_the_answer_first',
      'named_their_own_terms',
      'struck_by_the_first_sight',
      'waiting_to_be_fooled',
    ]);
  });
});

// ─── Granted → landed ─────────────────────────────────────────────

describe('createAgentFromMeeting lands narrative descriptors', () => {
  it('lands every authored descriptor — no granted value is dropped', () => {
    const graph = buildTestGraph();
    const agentId = createAgentFromMeeting(graph, buildResult([...ALL_AUTHORED_SEEDS]), 'asc', 10);

    const landed = new Set(landedDescriptors(graph, agentId));
    const unconsumed = ALL_AUTHORED_SEEDS.filter(s => !landed.has(s));

    expect(unconsumed).toEqual([]);
    expect(landed.size).toBe(ALL_AUTHORED_SEEDS.length);
  });

  it('dedupes repeated descriptors while preserving authored order', () => {
    const graph = buildTestGraph();
    const agentId = createAgentFromMeeting(
      graph,
      buildResult(['cold_clarity', 'market_eye', 'cold_clarity', '  ', 'oath-keeper']),
      'asc',
      10,
    );

    expect(landedDescriptors(graph, agentId)).toEqual(['cold_clarity', 'market_eye', 'oath-keeper']);
  });

  it('writes no property at all when the meeting seeded nothing', () => {
    const graph = buildTestGraph();
    const agentId = createAgentFromMeeting(graph, buildResult([]), 'asc', 10);

    // Absent, not empty-array: an unseeded First's node shape is unchanged, the
    // same additive discipline the THR-868 `quintessence` landing follows.
    expect(graph.getNode(agentId)!.properties.narrativeDescriptors).toBeUndefined();
  });
});

// ─── Landed → read by production ──────────────────────────────────

describe('narrative descriptors reach a production reader', () => {
  it('surfaces on the character sheet trait list at intimate knowledge', () => {
    const graph = buildTestGraph();
    const agentId = createAgentFromMeeting(
      graph,
      buildResult(['cold_clarity', 'oath-keeper']),
      'asc',
      10,
    );

    const card = getAgentInfoCard(graph, agentId, 'asc', 'intimate');

    expect(card).not.toBeNull();
    expect(card!.allTraits).toContain('cold clarity');
    expect(card!.allTraits).toContain('oath-keeper');
  });

  it('fills the backstory trait slot instead of the hardcoded fallback', () => {
    // A freshly-created First holds no `has_trait` edges, so before THR-872 this
    // slot rendered 'resolute' over the top of every authored descriptor.
    const withDescriptor = generateBackstory(
      {
        archetypeId: 'sage',
        cultureName: 'The Ashen',
        traitNames: [],
        narrativeDescriptors: ['cold_clarity'],
        bondNames: ['Maren'],
        name: 'Kael',
        primarySphere: 'iron',
      },
      () => 0,
    );

    expect(withDescriptor).toContain('cold clarity');
    expect(withDescriptor).not.toContain('resolute');
  });

  it('prefers an earned trait over a meeting descriptor when both exist', () => {
    const backstory = generateBackstory(
      {
        archetypeId: 'sage',
        cultureName: 'The Ashen',
        traitNames: ['Unyielding'],
        narrativeDescriptors: ['cold_clarity'],
        bondNames: ['Maren'],
        name: 'Kael',
        primarySphere: 'iron',
      },
      () => 0,
    );

    expect(backstory).toContain('unyielding');
    expect(backstory).not.toContain('cold clarity');
  });
});

// ─── Display rendering ────────────────────────────────────────────

describe('humanizeDescriptor', () => {
  it('renders underscores as spaces and leaves meaningful hyphens intact', () => {
    expect(humanizeDescriptor('cold_clarity')).toBe('cold clarity');
    expect(humanizeDescriptor('silver-tongued')).toBe('silver-tongued');
    expect(humanizeDescriptor('struck_by_the_first_sight')).toBe('struck by the first sight');
  });

  it('leaves no authored descriptor rendering as a raw id', () => {
    // Christian's standing note: a raw `key_value` token on a player-facing
    // surface reads as unfinished UX.
    const stillRaw = ALL_AUTHORED_SEEDS.filter(s => humanizeDescriptor(s).includes('_'));
    expect(stillRaw).toEqual([]);
  });
});
