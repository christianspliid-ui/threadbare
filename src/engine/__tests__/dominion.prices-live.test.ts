/**
 * THR-1748 — Dominion prices and odds with `DOMINION_PRICES_LIVE` ON (module mock;
 * the shipped default is off — THR-1750 flips it with the card chip).
 *
 * Done-when (plan § Done when): over ≥ 300 seeded streams the same card costs less on
 * a Sovereign place than on a Hostile one, and lands more often there by the
 * `DOMINION_SPHERE_FACTOR` spread; a mortal's step at the same place rolls at exactly
 * its pre-change odds whatever the band; the preview cost equals the charged cost.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../data/dominion-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/dominion-content')>();
  return { ...actual, DOMINION_PRICES_LIVE: true };
});

import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import { WorldGraph } from '../graph';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { getTargetActionSlots } from '../targetActions';
import { preparePlayerCast } from '../playerCastDispatch';
import { dominionOf } from '../dominion';
import { DOMINION_SPHERE_FACTOR, DOMINION_PRICES_LIVE } from '../../data/dominion-content';

const GOD = 'asc.witness';
const MORTAL = 'm.walker';

function bag(scores: Partial<Record<SphereName, number>>) {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

function makeTemplate(): UnifiedActionTemplate {
  return {
    id: 'loc.test_working',
    rarityTier: 2,
    intrinsicTier: 'background',
    name: 'Test Working',
    reach: 'stone',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: 0.3,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 8,
    actorAffinities: ['ascendant'],
    targetCategories: ['location'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  };
}

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: GOD, type: 'actor', name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      domainAffinities: { stone: 4 },
      spherePoints: { mind: 3, spirit: 2 },
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  graph.addNode({ id: 'loc.home', type: 'location', name: 'Home', properties: { sphereAffinity: bag({ mind: 5, spirit: 5 }) } });
  graph.addNode({ id: 'loc.foe', type: 'location', name: 'Foe', properties: { sphereAffinity: bag({ force: 5, energy: 5 }) } });
  graph.addNode({ id: MORTAL, type: 'actor', name: 'Walker', properties: { actorType: 'individual', sphereAffinity: bag({}) } });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: GOD, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
    pendingQuintessenceEvents: [],
  } as unknown as GameState;
}

function cast(actorId: string, targetId: string, source: 'player' | 'agent', template: UnifiedActionTemplate) {
  return createUnifiedAction({
    actorId, templateId: template.id, targetId, scale: 'local', source, tick: 10,
    template, rng: () => 0.5, essencePaid: {} as never,
  });
}

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREAMS = 300;
const CLEAN = new Set(['success', 'critical_success']);

beforeEach(() => resetUnifiedActionCounter());

describe('THR-1748 Dominion with DOMINION_PRICES_LIVE on', () => {
  it('runs with the flag mocked on', () => {
    expect(DOMINION_PRICES_LIVE).toBe(true);
  });

  it('the bands under test are Sovereign and Hostile', () => {
    const s = makeState();
    expect(dominionOf(s.graph, GOD, 'loc.home').band).toBe('sovereign');
    expect(dominionOf(s.graph, GOD, 'loc.foe').band).toBe('hostile');
  });

  it(`a card on Sovereign ground lands more often than on Hostile ground, over ${STREAMS} streams`, () => {
    const template = makeTemplate();
    let homeClean = 0;
    let foeClean = 0;
    let homeP = 0;
    let foeP = 0;
    for (let seed = 1; seed <= STREAMS; seed++) {
      const home = resolveUncontestedStep(cast(GOD, 'loc.home', 'player', template), template, makeState(), seededRng(seed));
      const foe = resolveUncontestedStep(cast(GOD, 'loc.foe', 'player', template), template, makeState(), seededRng(seed));
      if (CLEAN.has(home.outcome)) homeClean++;
      if (CLEAN.has(foe.outcome)) foeClean++;
      homeP = home.probability;
      foeP = foe.probability;
    }
    const spread = DOMINION_SPHERE_FACTOR.sovereign - DOMINION_SPHERE_FACTOR.hostile; // 0.20
    // The roll's own probability moves by the spread (neither end clamped here)…
    expect(homeP - foeP).toBeCloseTo(spread, 6);
    // …and the clean-landing rate follows it within sampling error (σ ≈ 0.04 at n=300).
    const observed = (homeClean - foeClean) / STREAMS;
    expect(observed).toBeGreaterThan(spread - 0.1);
    expect(observed).toBeLessThan(spread + 0.1);
  });

  it('a mortal\'s step at the same place rolls at exactly its pre-change odds, whatever the band', () => {
    const template = { ...makeTemplate(), actorAffinities: ['individual'] } as UnifiedActionTemplate;
    for (let seed = 1; seed <= 20; seed++) {
      const home = resolveUncontestedStep(cast(MORTAL, 'loc.home', 'agent', template), template, makeState(), seededRng(seed));
      const foe = resolveUncontestedStep(cast(MORTAL, 'loc.foe', 'agent', template), template, makeState(), seededRng(seed));
      expect(home.probability).toBe(foe.probability);
      expect(home.outcome).toBe(foe.outcome);
    }
  });

  it('the preview cost equals the charged cost on every band, and Sovereign costs less than Hostile', () => {
    const template = makeTemplate();
    const prices: Record<string, number> = {};
    for (const targetId of ['loc.home', 'loc.foe']) {
      const s = makeState();
      const slots = getTargetActionSlots({
        target: {
          nodeId: targetId, nodeType: 'location', displayName: targetId, displayLabel: '',
          subtype: null, traitIds: [], sphereAffinity: null, position: null,
          properties: s.graph.getNode(targetId)!.properties,
        },
        templates: [template],
        pool: { mind: 99, spirit: 99 } as never,
        primarySphere: 'mind',
        accessibleSpheres: ['mind', 'spirit'] as never,
        unlockedActionIds: [template.id],
        graph: s.graph,
        controlOwnerId: GOD,
      });
      const preview = slots.find(sl => sl.id.endsWith(template.id))!;
      expect(preview).toBeDefined();
      expect(preview.dominionBand).toBe(dominionOf(s.graph, GOD, targetId).band);
      const charged = preparePlayerCast({
        graph: s.graph, ascendantId: GOD, template, templateId: template.id, targetId,
        tick: 10, seed: 42, sphere: 'mind', applyBuffs: false,
      } as never);
      expect(preview.essenceCost).toBe(charged.action.essencePaid);
      prices[targetId] = preview.essenceCost;
    }
    expect(prices['loc.home']).toBeLessThan(prices['loc.foe']);
  });
});
