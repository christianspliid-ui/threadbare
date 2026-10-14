/**
 * THR-1854 — the First's journey choices land, and never repeat.
 *
 * 1. `applyBeatChoiceEffects` moves the First's axiological values and raw reaches by the
 *    declared amounts and writes a `journey.choice_applied` trace.
 * 2. `selectTemplate` given the beats already played never offers the same moment twice
 *    in a phase, and still returns a beat when every template has been played.
 * 3. The journey content names only canonical value pairs (the old keys moved nothing).
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { applyBeatChoiceEffects, selectTemplate } from '../journeyEngine';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';
import { VALUE_PAIRS } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';
import {
  JOURNEY_REACH_CHANGE_RAW_SCALE,
  PHASE_BOUNDARIES,
  type BeatOutcome,
  type JourneyVignetteData,
  type StateSnapshot,
} from '../../types/journeyEngine';
import type { CampbellianPhase } from '../../types/influence';

function makeSnapshot(): StateSnapshot {
  return {
    power: { primaryReachLevel: 20, totalTraits: 3, tierLevel: 1 },
    influence: { factionsLed: 0, locationsControlled: 0, agreementsForged: 0, enemiesMade: 0 },
    relationship: { threadTier: 1, interventionRatio: 0, attentionMode: 'pause' },
    ambition: { activeAmbitions: 1, completedMilestones: 0, failedAttempts: 0 },
  };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'first',
    type: 'actor',
    name: 'Kael',
    properties: {
      actorType: 'individual',
      axiologicalProfile: { mercy_ruthlessness: 0.2, courage_prudence: 0.95 },
      domainCapabilities: { heart: 20, iron: 15 },
    },
  });
  return graph;
}

function makeVignette(): JourneyVignetteData {
  return {
    agentId: 'first',
    agentName: 'Kael',
    phase: 'road_of_trials',
    doomClockPercent: 0.25,
    beatIndex: 0,
    templateId: 'trials_rival',
    variantKey: 'rival_v',
    setupProse: '',
    tensionProse: '',
    choices: [
      {
        id: 'mercy',
        text: 'Extend a hand',
        effects: {
          interventionType: 'supportive',
          axiologicalShifts: { mercy_ruthlessness: 0.1, courage_prudence: 0.1 },
          reachChanges: { heart: 0.05 },
          consequenceProse: 'The First extends a hand.',
        },
      },
      { id: 'away', text: 'Step back', effects: { interventionType: 'withdrawn' } },
    ],
    stateSnapshot: makeSnapshot(),
    isOrdeal: false,
    tick: 40,
  };
}

describe('applyBeatChoiceEffects (THR-1854)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  test('moves the First\'s values and reaches by the declared amounts, and traces it', () => {
    const graph = makeGraph();
    const result = applyBeatChoiceEffects(graph, makeVignette(), 'mercy', 40);

    const props = graph.getNode('first')!.properties;
    const profile = props.axiologicalProfile as Record<string, number>;
    const caps = props.domainCapabilities as Record<string, number>;
    expect(profile.mercy_ruthlessness).toBeCloseTo(0.3);
    // Clamped at the pole: 0.95 + 0.1 lands at 1, and the result reports what landed.
    expect(profile.courage_prudence).toBe(1);
    expect(caps.heart).toBeCloseTo(20 + 0.05 * JOURNEY_REACH_CHANGE_RAW_SCALE);
    expect(caps.iron).toBe(15);

    expect(result!.axiological.mercy_ruthlessness).toBeCloseTo(0.1);
    expect(result!.axiological.courage_prudence).toBeCloseTo(0.05);
    expect(result!.reaches.heart).toBeCloseTo(5);
    expect(result!.consequenceProse).toBe('The First extends a hand.');

    const traces = getTraces().filter(t => t.category === 'journey.choice_applied');
    expect(traces).toHaveLength(1);
    const trace = traces[0] as unknown as { agentId: string; choiceId: string; reaches: Record<string, number> };
    expect(trace.agentId).toBe('first');
    expect(trace.choiceId).toBe('mercy');
    expect(trace.reaches.heart).toBeCloseTo(5);
  });

  test('a choice that declares nothing moves nothing, and the trace says so', () => {
    const graph = makeGraph();
    const result = applyBeatChoiceEffects(graph, makeVignette(), 'away', 40);
    expect(result!.axiological).toEqual({});
    expect(result!.reaches).toEqual({});
    expect((graph.getNode('first')!.properties.domainCapabilities as Record<string, number>).heart).toBe(20);
    expect(getTraces().filter(t => t.category === 'journey.choice_applied')[0].summary)
      .toContain('moved nothing');
  });

  test('fail-soft: an unknown choice or a missing First changes nothing', () => {
    const graph = makeGraph();
    expect(applyBeatChoiceEffects(graph, makeVignette(), 'nope', 40)).toBeNull();
    expect(applyBeatChoiceEffects(graph, { ...makeVignette(), agentId: 'gone' }, 'mercy', 40)).toBeNull();
    expect((graph.getNode('first')!.properties.axiologicalProfile as Record<string, number>).mercy_ruthlessness).toBe(0.2);
  });
});

describe('selectTemplate never repeats a lived moment (THR-1854)', () => {
  const phases: CampbellianPhase[] = ['call', 'road_of_trials', 'crisis'];

  function playPhase(phase: CampbellianPhase, seed: number, beats: number): string[] {
    const played: BeatOutcome[] = [];
    const picked: string[] = [];
    for (let i = 0; i < beats; i++) {
      const sel = selectTemplate(JOURNEY_BEAT_TEMPLATES, phase, makeSnapshot(), seed + i * 7919, played);
      expect(sel).not.toBeNull();
      picked.push(`${sel!.template.id}::${sel!.variant.key}`);
      played.push({
        phase, tick: i, templateId: sel!.template.id, variantKey: sel!.variant.key,
        playerChoiceId: 'x', stateSnapshot: makeSnapshot(),
      });
    }
    return picked;
  }

  test('a phase\'s beats are all different moments, across 200 seeds', () => {
    for (const phase of phases) {
      const beats = Math.max(2, PHASE_BOUNDARIES.find(b => b.phase === phase)!.beatCount);
      for (let seed = 0; seed < 200; seed++) {
        const picked = playPhase(phase, seed, beats);
        expect(new Set(picked).size).toBe(picked.length);
      }
    }
  });

  test('the Road of Trials never serves the same template twice in its four beats', () => {
    const beats = PHASE_BOUNDARIES.find(b => b.phase === 'road_of_trials')!.beatCount;
    for (let seed = 0; seed < 200; seed++) {
      const templates = playPhase('road_of_trials', seed, beats).map(k => k.split('::')[0]);
      expect(new Set(templates).size).toBe(templates.length);
    }
  });

  test('fail-soft: with every moment played, a beat is still offered', () => {
    const played: BeatOutcome[] = JOURNEY_BEAT_TEMPLATES
      .filter(t => t.validPhases.includes('ordeal'))
      .flatMap(t => t.variants.map(v => ({
        phase: 'ordeal' as const, tick: 0, templateId: t.id, variantKey: v.key,
        playerChoiceId: 'x', stateSnapshot: makeSnapshot(),
      })));
    expect(selectTemplate(JOURNEY_BEAT_TEMPLATES, 'ordeal', makeSnapshot(), 1, played)).not.toBeNull();
  });
});

describe('journey content declares only effects the engine applies (THR-1854)', () => {
  test('every axiological shift names a canonical value pair, every reach change a reach', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        for (const choice of variant.choices) {
          for (const pair of Object.keys(choice.effects.axiologicalShifts ?? {})) {
            expect(VALUE_PAIRS, `${template.id}/${variant.key}/${choice.id}`).toContain(pair);
          }
          for (const reach of Object.keys(choice.effects.reachChanges ?? {})) {
            expect(REACH_DOMAINS, `${template.id}/${variant.key}/${choice.id}`).toContain(reach);
          }
        }
      }
    }
  });
});
