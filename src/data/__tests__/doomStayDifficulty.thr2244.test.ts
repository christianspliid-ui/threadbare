/**
 * THR-2244 — Stay the Unmaking can land clean (plan THR-2202 § Amendments 2026-11-17).
 *
 * Stay rolls in `star` at `cosmic` scale. At `DOOM_STAY_DIFFICULTY` 0.35 a god with
 * no star affinity (most gods, including the `?seeded` Witness) forecast "doomed"
 * and landed clean 0 times in 400, so every hold was crooked (0.9×, not 0.75×).
 * At 0.05 the card promises "uncertain" for that god and "favorable" for a
 * star-primary one, and the live resolver lands clean in roughly that share.
 *
 * Drives the real card template through `resolveUncontestedStep` with the same
 * seeded harness shape as `playerCastBalance.test.ts`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUncontestedStep } from '../../engine/unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../../engine/unifiedActionLifecycle';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { DOOM_STAY_TEMPLATE_ID } from '../doom-stay-content';
import { DOOM_STAY_DIFFICULTY } from '../game-config';
import { castForecastProbability } from '../../engine/playerCastReadout';
import { classifyForecastTier } from '../../engine/encounters/outcomeForecast';
import { WorldGraph } from '../../engine/graph';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const ASCENDANT_ID = 'asc.witness';
const SEEDS = 400;
const AFFINITY_PRIMARY = 5;

function makeState(starAffinity: number | null): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      // The seeded Witness preset: eye/veil/shadow, no star.
      domainAffinities: starAffinity === null ? { eye: 4, veil: 3, shadow: 2 } : { star: starAffinity },
    },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'The Hollow', properties: {} });
  graph.addEdge({ id: 'e1', source: ASCENDANT_ID, target: 'loc-1', type: 'located_at', properties: {} });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASCENDANT_ID, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, pendingQuintessenceEvents: [],
  } as unknown as GameState;
}

/** mulberry32 — one fresh stream per seed, reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stayCasts(starAffinity: number | null) {
  const template = getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID) as UnifiedActionTemplate;
  const state = makeState(starAffinity);
  const counts: Record<string, number> = {};
  let capability = 0;
  let probability = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    resetUnifiedActionCounter();
    const action = createUnifiedAction({
      actorId: ASCENDANT_ID, templateId: template.id, targetId: ASCENDANT_ID,
      scale: template.scale, source: 'player', tick: 10, template,
      rng: () => 0.5, essencePaid: {} as never,
    });
    const result = resolveUncontestedStep(action, template, state, seededRng(seed));
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
    if (seed === 1) {
      capability = result.capability;
      probability = result.probability;
    }
  }
  const clean = (counts.success ?? 0) + (counts.critical_success ?? 0);
  const tier = classifyForecastTier(castForecastProbability(DOOM_STAY_DIFFICULTY, capability, template.scale));
  return { counts, clean, capability, probability, tier };
}

beforeEach(() => resetUnifiedActionCounter());

describe('THR-2244 — Stay the Unmaking promises "uncertain" and lands clean that often', () => {
  it('the card is the one the plan describes: star reach, cosmic scale, difficulty 0.05', () => {
    const t = getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID)!;
    expect(t.reach).toBe('star');
    expect(t.scale).toBe('cosmic');
    expect(DOOM_STAY_DIFFICULTY).toBe(0.05);
    expect((t.steps[0] as { difficulty?: number }).difficulty).toBe(DOOM_STAY_DIFFICULTY);
    // Not 0: an unpriced step resolves as certain and removes the crooked landing (Law 26).
    expect(DOOM_STAY_DIFFICULTY).toBeGreaterThan(0);
  });

  it('an off-star god (0.168) reads "uncertain" and lands clean in about that share of 400 casts', () => {
    const r = stayCasts(null);
    expect(r.capability).toBeCloseTo(0.168, 3);
    expect(r.tier).toBe('uncertain');
    // Measured 141/400 (p ≈ 0.42). Band, not point: a predicate on the promise.
    expect(r.clean).toBeGreaterThanOrEqual(100);
    expect(r.clean).toBeLessThanOrEqual(190);
    // The crooked landing stays (Law 26).
    expect(r.counts.success_at_cost ?? 0).toBeGreaterThan(0);
  });

  it('a star-primary god (0.354) reads "favorable" and lands clean more often', () => {
    const offStar = stayCasts(null);
    const r = stayCasts(AFFINITY_PRIMARY);
    expect(r.capability).toBeCloseTo(0.354, 3);
    expect(r.tier).toBe('favorable');
    expect(r.clean).toBeGreaterThan(offStar.clean);
    expect(r.counts.success_at_cost ?? 0).toBeGreaterThan(0);
  });
});
