/**
 * THR-2226 (plan THR-2204 slice 1) — the Ordeal is rolled, and journey visions read the scene.
 *
 * 1. `fitDifficultyToForecast` lands the bare chance on the target, through the core's own curve.
 * 2. An Ordeal vision's per-choice forecast is the tier of the chance its roll uses (Law 18),
 *    and stepping back rolls within 0.03 of `CLIMAX_BARE_FORECAST`.
 * 3. The roll deals from the First's marble bag, writes the band to the thread edge, never
 *    reads the choice's old `ordealOutcome`, honours nothing but its own keyed stream, and
 *    traces `journey.ordeal_roll`.
 * 4. A vision reads the scene: every undertaking verb and place kind maps to an activity; a
 *    `worship` scene never picks a `conflict`-only variant when a fitting one exists; the
 *    setup opens with the activity's clause; pronoun slots fill from the mortal.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  attachOrdealRoll,
  buildOrdealRollSpec,
  composeJourneyVignette,
  openWithScene,
  ordealChance,
  ordealConsequence,
  readOrdealResult,
  readVisionScene,
  recordJourneyChoice,
  rollOrdeal,
  selectTemplate,
} from '../journeyEngine';
import { fitDifficultyToForecast, scaledStepProbability } from '../scaledForecast';
import { classifyForecast } from '../resolutionService';
import { readLuckState } from '../luck';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { CLIMAX_BARE_FORECAST, FIT_ITERATIONS } from '../../data/nudge-constants';
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';
import { LOCATION_SUBTYPES } from '../../data/world-objects';
import {
  VISION_ACTIVITY_BY_PLACE_KIND,
  VISION_ACTIVITY_BY_UNDERTAKING_VERB,
} from '../../data/vision-scene-content';
import {
  ORDEAL_BAND_TO_OUTCOME,
  ORDEAL_LEAN_POUR,
  SCENE_ACTIVITIES,
  type JourneyBeatTemplate,
  type JourneyVignetteData,
  type StateSnapshot,
} from '../../types/journeyEngine';
import type { StepOutcome } from '../../types/unifiedAction';

const ASC = 'asc';
const FIRST = 'first';

function snapshot(): StateSnapshot {
  return {
    power: { primaryReachLevel: 20, totalTraits: 3, tierLevel: 2 },
    influence: { factionsLed: 0, locationsControlled: 0, agreementsForged: 0, enemiesMade: 0 },
    relationship: { threadTier: 2, interventionRatio: 0.5, attentionMode: 'pause' },
    ambition: { activeAmbitions: 1, completedMilestones: 0, failedAttempts: 0 },
  };
}

function world(opts: { star?: number; placeKind?: string; gender?: string } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: FIRST, type: 'actor', name: 'Kael Thornweaver', properties: {
      actorType: 'individual',
      gender: opts.gender ?? 'male',
      domainCapabilities: { star: opts.star ?? 22, heart: 15 },
    },
  });
  graph.addNode({
    id: 'mill', type: 'location', name: 'Millbrook',
    properties: { locationType: opts.placeKind ?? 'shrine', locationSubtype: opts.placeKind ?? 'shrine' },
  });
  graph.addEdge({ id: 'at', source: FIRST, target: 'mill', type: 'located_at', properties: {} });
  graph.addEdge({
    id: 'thread', source: ASC, target: FIRST, type: 'thread',
    properties: { tier: 3, courtPosition: 'the_first', storyPhase: 'ordeal', beatHistory: [] },
  });
  return graph;
}

function ordealVision(graph: WorldGraph, variantKey = 'ordeal_mighty'): JourneyVignetteData {
  const template = JOURNEY_BEAT_TEMPLATES.find(t => t.variants.some(v => v.key === variantKey))!;
  const variant = template.variants.find(v => v.key === variantKey)!;
  const scene = readVisionScene(graph, FIRST);
  return composeJourneyVignette(graph, FIRST, 'ordeal', 0, 0.78, template, variant, snapshot(), 500, scene);
}

describe('fitDifficultyToForecast', () => {
  test('lands the bare chance on the target across capabilities, on the core curve', () => {
    for (const capability of [0.2, 0.45, 0.7, 0.95]) {
      const fit = fitDifficultyToForecast(capability, CLIMAX_BARE_FORECAST, {
        scale: 'regional', fallbackDifficulty: 0.5, iterations: FIT_ITERATIONS,
      });
      expect(fit.fitted).toBe(true);
      expect(Math.abs(fit.bareChance - CLIMAX_BARE_FORECAST)).toBeLessThan(0.01);
      // The number reported is the core's own probability at that difficulty.
      expect(fit.bareChance).toBeCloseTo(scaledStepProbability({
        actorId: '', domain: 'star', capability, difficulty: fit.difficulty, sphereFactor: 0, actionModifiers: 0, testShapers: [],
      }, 'regional'), 10);
    }
  });

  test('falls back when the target cannot be bracketed', () => {
    const fit = fitDifficultyToForecast(0, CLIMAX_BARE_FORECAST, {
      scale: 'regional', fallbackDifficulty: 0.5, iterations: FIT_ITERATIONS,
    });
    expect(fit.fitted).toBe(false);
    expect(fit.difficulty).toBe(0.5);
  });
});

describe('the Ordeal vision (Law 17, Law 18)', () => {
  test('each choice shows the forecast tier of the chance its roll uses', () => {
    const graph = world();
    const vision = ordealVision(graph);
    expect(vision.ordealRoll?.fitted).toBe(true);
    for (const choice of vision.choices) {
      const chance = ordealChance(vision.ordealRoll!, choice.effects.ordealLean ?? 0);
      expect(vision.forecastByChoice?.[choice.id]).toBe(classifyForecast(chance));
    }
    const back = vision.choices.find(c => c.effects.interventionType === 'withdrawn')!;
    expect(Math.abs(ordealChance(vision.ordealRoll!, back.effects.ordealLean ?? 0) - CLIMAX_BARE_FORECAST)).toBeLessThan(0.03);
    expect(vision.forecastByChoice?.[back.id]).toBe('uncertain');
    const pour = vision.choices.find(c => c.effects.ordealLean === ORDEAL_LEAN_POUR)!;
    expect(vision.forecastByChoice?.[pour.id]).toBe('favorable');
  });

  test('carries the weight and stakes lines in the mortal\'s own words', () => {
    const vision = ordealVision(world());
    expect(vision.ordealLines?.weight).toBe("This decides how Kael Thornweaver's story ends.");
    expect(vision.ordealLines?.stakes).toMatch(/^It tests his Star reach\. A (gentle|fair|steep|severe) trial\.$/);
    expect(vision.choices.map(c => c.text)).toContain('Step back: this must be his');
  });

  test('a non-Ordeal vision carries no roll', () => {
    const graph = world();
    const template = JOURNEY_BEAT_TEMPLATES.find(t => t.validPhases.includes('call'))!;
    const vision = composeJourneyVignette(graph, FIRST, 'call', 0, 0.05, template, template.variants[0], snapshot(), 10);
    expect(vision.ordealRoll).toBeUndefined();
    expect(attachOrdealRoll(graph, vision)).toBe(vision);
  });
});

describe('rolling the Ordeal', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  test('deals from the bag, writes the band to the thread edge and traces the roll', () => {
    const graph = world();
    const vision = ordealVision(graph);
    // An old save's choice still naming an outcome is ignored: the roll decides.
    const legacy: JourneyVignetteData = {
      ...vision,
      choices: vision.choices.map(c => ({ ...c, effects: { ...c.effects, ordealOutcome: 'triumph' as const } })),
    };
    const back = legacy.choices.find(c => c.effects.interventionType === 'withdrawn')!;
    expect(readLuckState(graph.getNode(FIRST)).bagDraws).toBe(0);

    expect(recordJourneyChoice(graph, null, ASC, legacy, back.id, 500, 42)).toBe(true);

    expect(readLuckState(graph.getNode(FIRST)).bagDraws).toBe(1);
    const result = readOrdealResult(graph, ASC, FIRST)!;
    expect(result.band).toBeDefined();
    expect(result.outcome).toBe(ORDEAL_BAND_TO_OUTCOME[result.band as StepOutcome]);
    const edge = graph.getOutgoingEdges(ASC, 'thread')[0];
    expect(edge.properties).not.toHaveProperty('ordealGodPaid');

    const traces = getTraces().filter(t => t.category === 'journey.ordeal_roll') as unknown as Array<Record<string, unknown>>;
    expect(traces).toHaveLength(1);
    expect(traces[0].band).toBe(result.band);
    expect(traces[0].luckDrawIndex).toBe(0);
    expect(Math.abs((traces[0].chance as number) - CLIMAX_BARE_FORECAST)).toBeLessThan(0.03);
  });

  test('is deterministic in seed, First and bag position', () => {
    const a = world();
    const b = world();
    const ra = rollOrdeal(a, 7, ASC, ordealVision(a), 'ordeal_guide', 500);
    const rb = rollOrdeal(b, 7, ASC, ordealVision(b), 'ordeal_guide', 500);
    expect(ra).toEqual(rb);
    expect(ra?.godPaid).toBe(true);
  });

  test('the lean moves the odds, never the band directly', () => {
    let pourWins = 0;
    let backWins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g1 = world();
      const g2 = world();
      if (rollOrdeal(g1, seed, ASC, ordealVision(g1), 'ordeal_direct', 500)?.outcome === 'triumph') pourWins++;
      if (rollOrdeal(g2, seed, ASC, ordealVision(g2), 'ordeal_withdraw', 500)?.outcome === 'triumph') backWins++;
    }
    expect(pourWins).toBeGreaterThan(backWins);
    // Even a full lean is not a guarantee (Law 10).
    expect(pourWins).toBeLessThan(200);
  });

  test('the reply line follows the rolled outcome, with the old line as fallback', () => {
    const vision = ordealVision(world());
    const pour = vision.choices.find(c => c.id === 'ordeal_direct')!;
    expect(ordealConsequence(pour, 'broken')).toBe('You poured yourself into the thread, and still he broke.');
    const bare = { ...pour, effects: { ...pour.effects, consequenceByOutcome: undefined } };
    expect(ordealConsequence(bare, 'broken')).toBe(pour.effects.consequenceProse);
  });
});

describe('the vision reads the scene', () => {
  test('every undertaking verb and every place kind maps to an activity', () => {
    for (const verb of ['create', 'change', 'use', 'control', 'destroy', 'observe'] as const) {
      expect(SCENE_ACTIVITIES).toContain(VISION_ACTIVITY_BY_UNDERTAKING_VERB[verb]);
    }
    const unmapped = LOCATION_SUBTYPES.filter(kind => !VISION_ACTIVITY_BY_PLACE_KIND[kind]);
    expect(unmapped).toEqual([]);
  });

  test('reads the place and its kind, and falls back to rest with no position', () => {
    expect(readVisionScene(world({ placeKind: 'shrine' }), FIRST)).toMatchObject({ activity: 'worship', placeName: 'Millbrook' });
    expect(readVisionScene(world({ placeKind: 'battleground' }), FIRST).activity).toBe('conflict');
    const lost = new WorldGraph();
    lost.addNode({ id: FIRST, type: 'actor', name: 'Kael', properties: {} });
    expect(readVisionScene(lost, FIRST)).toEqual({ placeId: undefined, placeName: undefined, placeKind: undefined, activity: 'rest' });
  });

  test('an active undertaking\'s verb wins over the place', () => {
    const scene = readVisionScene(world({ placeKind: 'shrine' }), FIRST, {
      projects: [{ actorId: FIRST, status: 'active', templateId: 'no-such-template' }],
    } as never);
    // Unknown template ⇒ no verb ⇒ the place decides.
    expect(scene.activity).toBe('worship');
  });

  test('a worship scene never picks a conflict-only variant when a fitting one exists', () => {
    const base = { label: '', setupProse: 'x x x x x x', tensionProse: 'x x x x x x', choices: [] };
    const templates: JourneyBeatTemplate[] = [{
      id: 'pair', validPhases: ['road_of_trials'], description: '',
      variants: [
        { ...base, key: 'battle', scenes: ['conflict'], score: () => 1 },
        { ...base, key: 'altar', scenes: ['worship'], score: () => 0 },
      ],
    }];
    for (let seed = 0; seed < 200; seed++) {
      const picked = selectTemplate(templates, 'road_of_trials', snapshot(), seed, [], { activity: 'worship' });
      expect(picked?.variant.key).toBe('altar');
    }
    // With no fitting variant the tagged one still plays (fail-soft: never skip a beat).
    const onlyBattle: JourneyBeatTemplate[] = [{ ...templates[0], variants: [templates[0].variants[0]] }];
    expect(selectTemplate(onlyBattle, 'road_of_trials', snapshot(), 1, [], { activity: 'worship' })?.variant.key).toBe('battle');
  });

  test('the setup opens with the activity\'s clause, and the slots fill or drop', () => {
    expect(openWithScene('Something has changed.', { activity: 'worship', placeName: 'Millbrook Shrine' }))
      .toBe('At prayer in Millbrook Shrine, something has changed.');
    expect(openWithScene('The First stands at the threshold.', { activity: 'rest' }))
      .toBe('In a quiet hour, The First stands at the threshold.');
    const graph = world({ placeKind: 'farmland', gender: 'female' });
    const vision = ordealVision(graph, 'ordeal_humble');
    expect(vision.setupProse.startsWith('At her work in Millbrook, the ordeal comes')).toBe(true);
    expect(vision.scene?.activity).toBe('labour');
  });
});

describe('Ordeal content (Law 10)', () => {
  test('no Ordeal choice promises a result', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES.filter(t => t.validPhases.includes('ordeal'))) {
      for (const variant of template.variants) {
        for (const choice of variant.choices) {
          expect(choice.text.toLowerCase()).not.toMatch(/guarantee|save them|triumph/);
        }
      }
    }
  });

  test('a spec is fitted once and stored: the roll reads the stored value', () => {
    const graph = world();
    const vision = ordealVision(graph);
    const stored = vision.ordealRoll!;
    // The First grows between the vision and the click; the roll still uses the stored fit.
    graph.getNode(FIRST)!.properties.domainCapabilities = { star: 60 };
    expect(buildOrdealRollSpec(graph, FIRST).capability).not.toBe(stored.capability);
    clearTraces(); enableTracing();
    rollOrdeal(graph, 3, ASC, vision, 'ordeal_withdraw', 500);
    const trace = getTraces().find(t => t.category === 'journey.ordeal_roll') as unknown as { difficulty: number; bareChance: number };
    disableTracing();
    expect(trace.difficulty).toBe(stored.difficulty);
    expect(trace.bareChance).toBe(stored.bareChance);
  });
});
