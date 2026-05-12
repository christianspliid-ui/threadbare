/**
 * Contract test: reputation-gated encounters (THR-32 first tranche + THR-146 middle tranche).
 *
 * Tests two mechanisms:
 * 1. filterByReputationGates (Stage 3a) — agent pipeline, reads trait encounterGates
 * 2. getTargetActionSlots trait gate (Filter 3) — ActionDrawer, reads requiredTargetTraits
 *
 * Covers all five gate patterns: required-positive, blocked-by-negative, required+blocked,
 * multi-trait AND, tier-sensitive. All ten templates from both tranches are in the TRANCHE fixture.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { filterByReputationGates } from '../encounterFilterPipeline';
import { getTargetActionSlots } from '../targetActions';
import {
  WARLORDS_TRIBUTE_TEMPLATE,
} from '../../data/encounters/warlords-tribute';
import {
  SHADOW_COURT_AUDIENCE_TEMPLATE,
} from '../../data/encounters/shadow-court-audience';
import {
  PILGRIMS_OFFERING_TEMPLATE,
} from '../../data/encounters/pilgrims-offering';
import {
  VEILED_CONSULTATION_TEMPLATE as THE_VEILED_CONSULTATION_TEMPLATE,
} from '../../data/encounters/the-veiled-consultation';
import {
  THE_STONES_JUDGEMENT_TEMPLATE,
} from '../../data/encounters/the-stones-judgement';
import {
  THE_MERCHANTS_FAVOR_TEMPLATE,
} from '../../data/encounters/the-merchants-favor';
import {
  THE_ORACLE_CONSULTED_TEMPLATE,
} from '../../data/encounters/the-oracle-consulted';
import {
  THE_STAR_PILGRIM_TEMPLATE,
} from '../../data/encounters/the-star-pilgrim';
import {
  THE_INFILTRATORS_APPROACH_TEMPLATE,
} from '../../data/encounters/the-infiltrators-approach';
import {
  THE_RENOWNED_DUEL_TEMPLATE,
} from '../../data/encounters/the-renowned-duel';
import {
  THE_EXECUTIONERS_COMMISSION_TEMPLATE,
} from '../../data/encounters/the-executioners-commission';
import {
  THE_UNMARKED_CROSSING_TEMPLATE,
} from '../../data/encounters/the-unmarked-crossing';
import {
  THE_SILENT_CHAMBER_TEMPLATE,
} from '../../data/encounters/the-silent-chamber';
import {
  THE_JURY_OF_THE_RUINED_TEMPLATE,
} from '../../data/encounters/the-jury-of-the-ruined';
import {
  THE_BLINDED_ORACLE_TEMPLATE,
} from '../../data/encounters/the-blinded-oracle';
import { REPUTATION_TRAIT_DEFINITIONS } from '../../data/reputation-trait-content';
import type { EncounterCacheEntry } from '../encounterCache';
import type { TargetContext } from '../../types/targetContext';
import type { EssencePool } from '../../types/influence';
import type { ReachDomain } from '../../types/traits';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Fixtures ─────────────────────────────────────────────────────

const BASE_POOL: EssencePool = {
  mind: 10, spirit: 10, force: 10, life: 10,
  order: 10, chaos: 10, time: 10, void: 10,
};

/**
 * THR-419 Gate 8 (unlock): these reputation-trait tests exercise the trait
 * gate (Filter 3), not the unlock gate. Pre-unlock every template referenced
 * here so Gate 8 is a no-op and the trait assertions remain authoritative.
 */
const ALL_REPUTATION_TEMPLATE_IDS: readonly string[] = [
  WARLORDS_TRIBUTE_TEMPLATE.id,
  SHADOW_COURT_AUDIENCE_TEMPLATE.id,
  PILGRIMS_OFFERING_TEMPLATE.id,
  THE_VEILED_CONSULTATION_TEMPLATE.id,
  THE_STONES_JUDGEMENT_TEMPLATE.id,
  THE_MERCHANTS_FAVOR_TEMPLATE.id,
  THE_ORACLE_CONSULTED_TEMPLATE.id,
  THE_STAR_PILGRIM_TEMPLATE.id,
  THE_INFILTRATORS_APPROACH_TEMPLATE.id,
  THE_RENOWNED_DUEL_TEMPLATE.id,
  THE_EXECUTIONERS_COMMISSION_TEMPLATE.id,
  THE_UNMARKED_CROSSING_TEMPLATE.id,
  THE_SILENT_CHAMBER_TEMPLATE.id,
  THE_JURY_OF_THE_RUINED_TEMPLATE.id,
  THE_BLINDED_ORACLE_TEMPLATE.id,
];

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

function addReputationTrait(
  graph: WorldGraph,
  traitId: string,
  level = 1,
): void {
  const def = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === traitId);
  if (!def) throw new Error(`Unknown reputation trait: ${traitId}`);
  graph.addNode({
    id: traitId,
    type: 'trait',
    name: def.name,
    properties: def.properties,
  });
  (graph as WorldGraph).addNode; // silence unused warning
}

function assignTrait(
  graph: WorldGraph,
  agentId: string,
  traitId: string,
  level = 1,
): void {
  addReputationTrait(graph, traitId, level);
  graph.addEdge({
    id: `edge-trait-${agentId}-${traitId}`,
    source: agentId,
    target: traitId,
    type: 'has_trait',
    properties: { level },
  });
}

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl-default',
    locationId: 'loc-1',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'heart' as ReachDomain,
    threatRating: 'moderate',
    encounterType: 'explore',
    motivations: [],
    requiresPresence: false,
    remotePenalty: 0,
    questPriority: 1.0,
    totalTickCost: 3,
    successRewardEstimate: 1.0,
    stepCount: 1,
    stepDifficulties: [40],
    stepReaches: ['iron' as ReachDomain],
    ...overrides,
  };
}

function actorTarget(overrides?: Partial<TargetContext>): TargetContext {
  return {
    nodeId: 'actor-test',
    nodeType: 'actor',
    displayName: 'Test Actor',
    displayLabel: '',
    subtype: 'individual',
    traitIds: [],
    sphereAffinity: null,
    position: null,
    influenceTier: 1,
    properties: {},
    ...overrides,
  };
}

// ─── Pattern 1: Required-positive (warlords-tribute) ──────────────

describe('Pattern 1 — required-positive: warlords_tribute (Iron)', () => {
  it('template declares requiredTargetTraits: [trait.reputation.iron.positive]', () => {
    expect(WARLORDS_TRIBUTE_TEMPLATE.requiredTargetTraits).toEqual(['trait.reputation.iron.positive']);
  });

  it('template is NOT in encounterGates.blocks of any trait', () => {
    const blockedBy = REPUTATION_TRAIT_DEFINITIONS.filter(t =>
      t.properties.reputationEffects?.encounterGates?.blocks.includes(WARLORDS_TRIBUTE_TEMPLATE.id)
    );
    expect(blockedBy).toHaveLength(0);
  });

  it('iron.positive trait declares warlords_tribute in encounterGates.unlocks', () => {
    const ironPositive = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.iron.positive');
    expect(ironPositive?.properties.reputationEffects?.encounterGates.unlocks).toContain(WARLORDS_TRIBUTE_TEMPLATE.id);
  });

  it('ActionDrawer shows template only when target has iron.positive trait', () => {
    const withTrait = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.iron.positive'] }),
      templates: [WARLORDS_TRIBUTE_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(withTrait).toHaveLength(1);

    const withoutTrait = getTargetActionSlots({
      target: actorTarget({ traitIds: [] }),
      templates: [WARLORDS_TRIBUTE_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(withoutTrait).toHaveLength(0);
  });
});

// ─── Pattern 2: Blocked-by-negative (shadow-court-audience) ──────

describe('Pattern 2 — blocked-by-negative: shadow_court_audience (Shadow)', () => {
  it('template has no requiredTargetTraits (available by default)', () => {
    expect(SHADOW_COURT_AUDIENCE_TEMPLATE.requiredTargetTraits ?? []).toHaveLength(0);
  });

  it('shadow.negative trait declares shadow_court_audience in encounterGates.blocks', () => {
    const shadowNeg = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.shadow.negative');
    expect(shadowNeg?.properties.reputationEffects?.encounterGates.blocks).toContain(SHADOW_COURT_AUDIENCE_TEMPLATE.id);
  });

  it('filterByReputationGates passes entry when agent has NO shadow.negative', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-1');
    const entries = [makeEntry({ templateId: SHADOW_COURT_AUDIENCE_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-1', graph);
    expect(result.some(e => e.templateId === SHADOW_COURT_AUDIENCE_TEMPLATE.id)).toBe(true);
  });

  it('filterByReputationGates blocks entry when agent has shadow.negative', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-1');
    assignTrait(graph, 'agent-1', 'trait.reputation.shadow.negative');
    const entries = [makeEntry({ templateId: SHADOW_COURT_AUDIENCE_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-1', graph);
    expect(result.some(e => e.templateId === SHADOW_COURT_AUDIENCE_TEMPLATE.id)).toBe(false);
  });
});

// ─── Pattern 3: Required + Blocked (pilgrims-offering) ────────────

describe('Pattern 3 — required+blocked: pilgrims_offering (Heart)', () => {
  it('template declares requiredTargetTraits: [trait.reputation.heart.positive]', () => {
    expect(PILGRIMS_OFFERING_TEMPLATE.requiredTargetTraits).toEqual(['trait.reputation.heart.positive']);
  });

  it('heart.positive trait declares pilgrims_offering in encounterGates.unlocks', () => {
    const heartPos = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.heart.positive');
    expect(heartPos?.properties.reputationEffects?.encounterGates.unlocks).toContain(PILGRIMS_OFFERING_TEMPLATE.id);
  });

  it('heart.negative trait declares pilgrims_offering in encounterGates.blocks', () => {
    const heartNeg = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.heart.negative');
    expect(heartNeg?.properties.reputationEffects?.encounterGates.blocks).toContain(PILGRIMS_OFFERING_TEMPLATE.id);
  });

  it('filterByReputationGates blocks entry when agent has heart.negative (block wins)', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-1');
    assignTrait(graph, 'agent-1', 'trait.reputation.heart.negative');
    const entries = [makeEntry({ templateId: PILGRIMS_OFFERING_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-1', graph);
    expect(result.some(e => e.templateId === PILGRIMS_OFFERING_TEMPLATE.id)).toBe(false);
  });

  it('filterByReputationGates passes entry when agent has heart.positive and NOT heart.negative', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-1');
    assignTrait(graph, 'agent-1', 'trait.reputation.heart.positive');
    const entries = [makeEntry({ templateId: PILGRIMS_OFFERING_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-1', graph);
    // Unlock rescues from any block — and here no block is present
    expect(result.some(e => e.templateId === PILGRIMS_OFFERING_TEMPLATE.id)).toBe(true);
  });

  it('ActionDrawer hides template when target lacks heart.positive', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: [] }),
      templates: [PILGRIMS_OFFERING_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(0);
  });

  it('ActionDrawer shows template when target has heart.positive', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.heart.positive'] }),
      templates: [PILGRIMS_OFFERING_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(1);
  });
});

// ─── Pattern 4: Multi-trait AND (the-veiled-consultation) ─────────

describe('Pattern 4 — multi-trait AND: the_veiled_consultation (Veil + Eye)', () => {
  it('template declares requiredTargetTraits with both veil.positive and eye.positive', () => {
    expect(PILGRIMS_OFFERING_TEMPLATE.requiredTargetTraits).toBeDefined();
    expect(THE_VEILED_CONSULTATION_TEMPLATE.requiredTargetTraits).toContain('trait.reputation.veil.positive');
    expect(THE_VEILED_CONSULTATION_TEMPLATE.requiredTargetTraits).toContain('trait.reputation.eye.positive');
    expect(THE_VEILED_CONSULTATION_TEMPLATE.requiredTargetTraits).toHaveLength(2);
  });

  it('veil.positive trait declares the_veiled_consultation in encounterGates.unlocks', () => {
    const veilPos = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.veil.positive');
    expect(veilPos?.properties.reputationEffects?.encounterGates.unlocks).toContain(THE_VEILED_CONSULTATION_TEMPLATE.id);
  });

  it('eye.positive trait also declares the_veiled_consultation in encounterGates.unlocks', () => {
    const eyePos = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.eye.positive');
    expect(eyePos?.properties.reputationEffects?.encounterGates.unlocks).toContain(THE_VEILED_CONSULTATION_TEMPLATE.id);
  });

  it('ActionDrawer hides template when only veil.positive is present (AND logic)', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.veil.positive'] }),
      templates: [THE_VEILED_CONSULTATION_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(0);
  });

  it('ActionDrawer hides template when only eye.positive is present (AND logic)', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.eye.positive'] }),
      templates: [THE_VEILED_CONSULTATION_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(0);
  });

  it('ActionDrawer shows template when both veil.positive AND eye.positive are present', () => {
    const result = getTargetActionSlots({
      target: actorTarget({
        traitIds: ['trait.reputation.veil.positive', 'trait.reputation.eye.positive'],
      }),
      templates: [THE_VEILED_CONSULTATION_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(1);
  });
});

// ─── Pattern 5: Tier-sensitive (the-stones-judgement) ─────────────

describe('Pattern 5 — tier-sensitive: the_stones_judgement (Stone L3)', () => {
  it('template declares requiredTargetTraits: [trait.reputation.stone.positive]', () => {
    expect(THE_STONES_JUDGEMENT_TEMPLATE.requiredTargetTraits).toEqual(['trait.reputation.stone.positive']);
  });

  it('stone.positive trait declares the_stones_judgement in encounterGates.unlocks', () => {
    const stonePos = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.stone.positive');
    expect(stonePos?.properties.reputationEffects?.encounterGates.unlocks).toContain(THE_STONES_JUDGEMENT_TEMPLATE.id);
  });

  it('rarityTier is 3, reflecting legendary rarity', () => {
    expect(THE_STONES_JUDGEMENT_TEMPLATE.rarityTier).toBe(3);
  });

  it('ActionDrawer hides template when target lacks stone.positive', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: [] }),
      templates: [THE_STONES_JUDGEMENT_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(0);
  });

  it('ActionDrawer shows template when target has stone.positive (any level)', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.stone.positive'] }),
      templates: [THE_STONES_JUDGEMENT_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(1);
  });
});

// ─── Pattern 6: Mixed-polarity (the-blinded-oracle) ───────────────

describe('Pattern 6 — mixed-polarity: the_blinded_oracle (Eye- required, Iron+ blocks)', () => {
  it('template declares requiredTargetTraits: [trait.reputation.eye.negative]', () => {
    expect(THE_BLINDED_ORACLE_TEMPLATE.requiredTargetTraits).toEqual(['trait.reputation.eye.negative']);
  });

  it('eye.negative trait declares the_blinded_oracle in encounterGates.unlocks', () => {
    const eyeNeg = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.eye.negative');
    expect(eyeNeg?.properties.reputationEffects?.encounterGates.unlocks).toContain(THE_BLINDED_ORACLE_TEMPLATE.id);
  });

  it('iron.positive trait declares the_blinded_oracle in encounterGates.blocks', () => {
    const ironPos = REPUTATION_TRAIT_DEFINITIONS.find(t => t.id === 'trait.reputation.iron.positive');
    expect(ironPos?.properties.reputationEffects?.encounterGates.blocks).toContain(THE_BLINDED_ORACLE_TEMPLATE.id);
  });

  it('filterByReputationGates blocks entry when agent has eye.negative AND iron.positive', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-mixed');
    assignTrait(graph, 'agent-mixed', 'trait.reputation.eye.negative');
    assignTrait(graph, 'agent-mixed', 'trait.reputation.iron.positive');
    const entries = [makeEntry({ templateId: THE_BLINDED_ORACLE_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-mixed', graph);
    expect(result.some(e => e.templateId === THE_BLINDED_ORACLE_TEMPLATE.id)).toBe(false);
  });

  it('filterByReputationGates passes entry when agent has eye.negative but NOT iron.positive', () => {
    const graph = makeGraph();
    addAgent(graph, 'agent-eye-only');
    assignTrait(graph, 'agent-eye-only', 'trait.reputation.eye.negative');
    const entries = [makeEntry({ templateId: THE_BLINDED_ORACLE_TEMPLATE.id })];

    const result = filterByReputationGates(entries, 'agent-eye-only', graph);
    expect(result.some(e => e.templateId === THE_BLINDED_ORACLE_TEMPLATE.id)).toBe(true);
  });

  it('ActionDrawer hides template when target lacks eye.negative', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: [] }),
      templates: [THE_BLINDED_ORACLE_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(0);
  });

  it('ActionDrawer shows template when target has eye.negative (iron.positive block not checked at ActionDrawer level)', () => {
    const result = getTargetActionSlots({
      target: actorTarget({ traitIds: ['trait.reputation.eye.negative'] }),
      templates: [THE_BLINDED_ORACLE_TEMPLATE] as unknown as UnifiedActionTemplate[],
      pool: BASE_POOL,
      unlockedActionIds: ALL_REPUTATION_TEMPLATE_IDS,
    });
    expect(result).toHaveLength(1);
  });
});

// ─── Whole-tranche structural checks ──────────────────────────────

describe('All five templates — structural invariants', () => {
  const TRANCHE = [
    WARLORDS_TRIBUTE_TEMPLATE,
    SHADOW_COURT_AUDIENCE_TEMPLATE,
    PILGRIMS_OFFERING_TEMPLATE,
    THE_VEILED_CONSULTATION_TEMPLATE,
    THE_STONES_JUDGEMENT_TEMPLATE,
    // Middle tranche — THR-146
    THE_MERCHANTS_FAVOR_TEMPLATE,
    THE_ORACLE_CONSULTED_TEMPLATE,
    THE_STAR_PILGRIM_TEMPLATE,
    THE_INFILTRATORS_APPROACH_TEMPLATE,
    THE_RENOWNED_DUEL_TEMPLATE,
    // Final tranche — THR-147
    THE_EXECUTIONERS_COMMISSION_TEMPLATE,
    THE_UNMARKED_CROSSING_TEMPLATE,
    THE_SILENT_CHAMBER_TEMPLATE,
    THE_JURY_OF_THE_RUINED_TEMPLATE,
    THE_BLINDED_ORACLE_TEMPLATE,
  ];

  it('every template has at least one gate declared (requiredTargetTraits or encounterGates.blocks)', () => {
    for (const t of TRANCHE) {
      const hasRequired = (t.requiredTargetTraits?.length ?? 0) > 0;
      const hasBlocked = REPUTATION_TRAIT_DEFINITIONS.some(def =>
        def.properties.reputationEffects?.encounterGates.blocks.includes(t.id)
      );
      expect(
        hasRequired || hasBlocked,
        `${t.id} has no gate declared`,
      ).toBe(true);
    }
  });

  it('every template has illustrationUrl and illustrationAlt', () => {
    for (const t of TRANCHE) {
      expect(t.illustrationUrl, `${t.id} missing illustrationUrl`).toBeTruthy();
      expect(t.illustrationAlt, `${t.id} missing illustrationAlt`).toBeTruthy();
    }
  });

  it('every template has at least one aftermath reaction that emits reputation_tally', () => {
    for (const t of TRANCHE) {
      const config = t.aftermathConfig;
      if (!config) {
        throw new Error(`${t.id} has no aftermathConfig`);
      }
      const allReactions = [
        ...Object.values(config.variants ?? {}).flatMap((v: any) => v.reactions ?? []),
        ...(config.fallback?.reactions ?? []),
      ];
      const hasTally = allReactions.some((r: any) =>
        r.effects?.some((e: any) => e.kind === 'reputation_tally')
      );
      expect(hasTally, `${t.id} has no reputation_tally in aftermath`).toBe(true);
    }
  });

  it('every template uses {title} at least once in its prose', () => {
    for (const t of TRANCHE) {
      const allProse = JSON.stringify(t);
      expect(allProse, `${t.id} missing {title} enrichment`).toContain('{title}');
    }
  });
});
