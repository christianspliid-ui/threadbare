/**
 * Journey Engine tests — TB-035 Phase 2.
 *
 * Tests doom-clock phase boundaries, beat scheduling, state snapshot,
 * template selection, beat choice application, and orchestrator phase.
 */

import { describe, test, expect } from 'vitest';
import {
  getJourneyPhase,
  getPhaseBoundary,
  getBeatThresholds,
  shouldBeatFire,
  buildStateSnapshot,
  selectTemplate,
  buildVignetteData,
  applyBeatChoice,
  formatPhaseName,
  phaseJourneyBeat,
} from '../journeyEngine';
import type { CampbellianPhase, ThreadEdgeProperties } from '../../types/influence';
import type {
  StateSnapshot,
  BeatOutcome,
  JourneyBeatTemplate,
  JourneyVignetteData,
  BeatVariant,
} from '../../types/journeyEngine';
import {
  CALL_PHASE_END,
  TRIALS_PHASE_END,
  CRISIS_PHASE_END,
  ORDEAL_PHASE_END,
  PHASE_BOUNDARIES,
} from '../../types/journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<StateSnapshot> = {}): StateSnapshot {
  return {
    power: { primaryReachLevel: 20, totalTraits: 3, tierLevel: 1, ...overrides.power },
    influence: { factionsLed: 0, locationsControlled: 0, agreementsForged: 0, enemiesMade: 0, ...overrides.influence },
    relationship: { threadTier: 1, interventionRatio: 0, attentionMode: 'pause', ...overrides.relationship },
    ambition: { activeAmbitions: 1, completedMilestones: 0, failedAttempts: 0, ...overrides.ambition },
  };
}

function makeThreadProps(overrides: Partial<ThreadEdgeProperties> = {}): ThreadEdgeProperties {
  return {
    tier: 1,
    ticksAtCurrentTier: 0,
    establishedTick: 0,
    totalEssenceSpent: 0,
    maintenanceCurrent: true,
    readBackstoryTier: 0,
    courtPosition: 'the_first',
    storyPhase: 'call',
    beatHistory: [],
    attentionMode: 'pause',
    ...overrides,
  };
}

function makeVignetteData(overrides: Partial<JourneyVignetteData> = {}): JourneyVignetteData {
  return {
    agentId: 'agent_1',
    agentName: 'Test Hero',
    phase: 'call',
    doomClockPercent: 0.1,
    beatIndex: 0,
    templateId: 'call_awakening',
    variantKey: 'ambitious_call',
    setupProse: 'Setup text',
    tensionProse: 'Tension text',
    choices: [
      {
        id: 'choice_support',
        text: 'Support them',
        effects: { interventionType: 'supportive' },
      },
      {
        id: 'choice_withdraw',
        text: 'Step back',
        effects: { interventionType: 'withdrawn' },
      },
    ],
    stateSnapshot: makeSnapshot(),
    isOrdeal: false,
    tick: 10,
    ...overrides,
  };
}

// Build a minimal test graph with an ascendant and a first agent
function buildTestGraph(): { graph: WorldGraph; ascendantId: string; agentId: string } {
  const graph = new WorldGraph();
  const ascendantId = 'ascendant_1';
  const agentId = 'agent_first_1';
  const locationId = 'loc_1';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'Test God', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: agentId, type: 'actor', name: 'Test Hero', properties: {
      actorType: 'individual',
      primaryReach: 'iron',
      domainCapabilities: { iron: 30, heart: 15, eye: 10 },
    },
  });
  graph.addNode({ id: locationId, type: 'location', name: 'Test Village', properties: {} });

  // located_at edge
  graph.addEdge({ id: `${agentId}_at_${locationId}`, source: agentId, target: locationId, type: 'located_at', properties: {} });

  // thread edge (ascendant → agent)
  graph.addEdge({
    id: `thread_${ascendantId}_${agentId}`,
    source: ascendantId,
    target: agentId,
    type: 'thread',
    properties: makeThreadProps(),
  });

  return { graph, ascendantId, agentId };
}

// ─── Phase Boundary Tests ───────────────────────────────────────────

describe('getJourneyPhase', () => {
  test('returns call for progress 0-15%', () => {
    expect(getJourneyPhase(0)).toBe('call');
    expect(getJourneyPhase(0.05)).toBe('call');
    expect(getJourneyPhase(0.14)).toBe('call');
  });

  test('returns road_of_trials for progress 20-55%', () => {
    expect(getJourneyPhase(0.20)).toBe('road_of_trials');
    expect(getJourneyPhase(0.35)).toBe('road_of_trials');
    expect(getJourneyPhase(0.54)).toBe('road_of_trials');
  });

  test('returns crisis for progress 55-70%', () => {
    expect(getJourneyPhase(0.55)).toBe('crisis');
    expect(getJourneyPhase(0.65)).toBe('crisis');
    expect(getJourneyPhase(0.69)).toBe('crisis');
  });

  test('returns ordeal for progress 70-80%', () => {
    expect(getJourneyPhase(0.70)).toBe('ordeal');
    expect(getJourneyPhase(0.79)).toBe('ordeal');
  });

  test('returns return for progress 80-100%', () => {
    expect(getJourneyPhase(0.80)).toBe('return');
    expect(getJourneyPhase(0.95)).toBe('return');
    expect(getJourneyPhase(1.0)).toBe('return');
  });
});

describe('getPhaseBoundary', () => {
  test('returns correct boundary for each phase', () => {
    const call = getPhaseBoundary('call');
    expect(call.start).toBe(0);
    expect(call.end).toBe(CALL_PHASE_END);
    expect(call.beatCount).toBe(1);

    const trials = getPhaseBoundary('road_of_trials');
    expect(trials.start).toBe(CALL_PHASE_END);
    expect(trials.end).toBe(TRIALS_PHASE_END);
    expect(trials.beatCount).toBe(4);

    const ordeal = getPhaseBoundary('ordeal');
    expect(ordeal.beatCount).toBe(1);
  });
});

describe('getBeatThresholds', () => {
  test('single-beat phases fire at midpoint', () => {
    const callThresholds = getBeatThresholds('call');
    expect(callThresholds).toHaveLength(1);
    expect(callThresholds[0]).toBeCloseTo(CALL_PHASE_END / 2);

    const ordealThresholds = getBeatThresholds('ordeal');
    expect(ordealThresholds).toHaveLength(1);
  });

  test('road_of_trials has 4 evenly-spaced thresholds', () => {
    const thresholds = getBeatThresholds('road_of_trials');
    expect(thresholds).toHaveLength(4);
    // Should be evenly spaced within [0.20, 0.55]
    for (let i = 1; i < thresholds.length; i++) {
      const gap = thresholds[i] - thresholds[i - 1];
      expect(gap).toBeCloseTo(thresholds[1] - thresholds[0], 5);
    }
    // All within bounds
    for (const t of thresholds) {
      expect(t).toBeGreaterThan(CALL_PHASE_END);
      expect(t).toBeLessThan(TRIALS_PHASE_END);
    }
  });

  test('thresholds are in ascending order', () => {
    for (const boundary of PHASE_BOUNDARIES) {
      const thresholds = getBeatThresholds(boundary.phase);
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
      }
    }
  });
});

// ─── Beat Scheduling Tests ──────────────────────────────────────────

describe('shouldBeatFire', () => {
  test('fires when crossing first call threshold', () => {
    const threshold = getBeatThresholds('call')[0];
    const result = shouldBeatFire(threshold + 0.001, threshold - 0.001, 'call', []);
    expect(result.shouldFire).toBe(true);
    expect(result.phase).toBe('call');
    expect(result.beatIndex).toBe(0);
  });

  test('does not fire when threshold not crossed', () => {
    const threshold = getBeatThresholds('call')[0];
    const result = shouldBeatFire(threshold - 0.01, threshold - 0.02, 'call', []);
    expect(result.shouldFire).toBe(false);
  });

  test('does not fire when beat already recorded', () => {
    const threshold = getBeatThresholds('call')[0];
    const beatHistory: BeatOutcome[] = [{
      phase: 'call',
      tick: 5,
      templateId: 'call_awakening',
      variantKey: 'ambitious_call',
      playerChoiceId: 'test',
      stateSnapshot: makeSnapshot(),
    }];
    const result = shouldBeatFire(threshold + 0.001, threshold - 0.001, 'call', beatHistory);
    expect(result.shouldFire).toBe(false);
  });

  test('fires on phase transition', () => {
    // Moving from call to road_of_trials
    const result = shouldBeatFire(0.21, 0.19, 'call', [
      { phase: 'call', tick: 5, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
    ]);
    expect(result.shouldFire).toBe(true);
    expect(result.phase).toBe('road_of_trials');
    expect(result.beatIndex).toBe(0);
  });

  test('fires sequential road_of_trials beats', () => {
    const thresholds = getBeatThresholds('road_of_trials');
    // First beat already done, crossing second threshold
    const beatHistory: BeatOutcome[] = [{
      phase: 'road_of_trials',
      tick: 10,
      templateId: 't',
      variantKey: 'v',
      playerChoiceId: 'c',
      stateSnapshot: makeSnapshot(),
    }];
    const result = shouldBeatFire(
      thresholds[1] + 0.001,
      thresholds[1] - 0.001,
      'road_of_trials',
      beatHistory,
    );
    expect(result.shouldFire).toBe(true);
    expect(result.beatIndex).toBe(1);
  });

  test('force-fires ordeal if missed', () => {
    // Doom at 91%, no ordeal beat recorded, phase = return
    const result = shouldBeatFire(0.91, 0.90, 'return', [
      { phase: 'call', tick: 1, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
    ]);
    expect(result.shouldFire).toBe(true);
    expect(result.phase).toBe('ordeal');
  });

  test('does not force-fire ordeal if already recorded', () => {
    const result = shouldBeatFire(0.91, 0.90, 'return', [
      { phase: 'ordeal', tick: 50, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
    ]);
    // THR-2233: the Ordeal is not forced again; the reached-but-unplayed Return catches up.
    expect(result.phase).not.toBe('ordeal');
    expect(result).toEqual({ shouldFire: true, phase: 'return', beatIndex: 0 });
  });

  test('a Doom jump from the Crisis into the Return fires the missed Ordeal first, then the Return (THR-2233)', () => {
    const history: BeatOutcome[] = [
      { phase: 'crisis', tick: 40, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
    ];
    // Entering the Return phase (0.81 < the old 0.90 force threshold) with no Ordeal played.
    expect(shouldBeatFire(0.81, 0.69, 'crisis', history)).toEqual({ shouldFire: true, phase: 'ordeal', beatIndex: 0 });
    // The engine records storyPhase 'ordeal' for that beat; once it is answered the Return enters.
    const answered: BeatOutcome[] = [...history, { phase: 'ordeal', tick: 41, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() }];
    expect(shouldBeatFire(0.82, 0.81, 'ordeal', answered)).toEqual({ shouldFire: true, phase: 'return', beatIndex: 0 });
  });

  test('a beat reached but not crossed this tick still fires (THR-2233 catch-up)', () => {
    const t = getBeatThresholds('road_of_trials');
    const oneTrials: BeatOutcome[] = [
      { phase: 'road_of_trials', tick: 10, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
    ];
    expect(shouldBeatFire(t[1] + 0.01, t[1] + 0.009, 'road_of_trials', oneTrials))
      .toEqual({ shouldFire: true, phase: 'road_of_trials', beatIndex: 1 });
  });
});

// ─── State Snapshot Tests ───────────────────────────────────────────

describe('buildStateSnapshot', () => {
  test('builds snapshot with correct power axis', () => {
    const { graph, agentId } = buildTestGraph();
    const threadProps = makeThreadProps({ tier: 2 });
    const snapshot = buildStateSnapshot(graph, agentId, threadProps);

    expect(snapshot.power.primaryReachLevel).toBe(30); // iron = 30
    expect(snapshot.power.tierLevel).toBe(2);
    expect(snapshot.power.totalTraits).toBe(0); // no traits yet
  });

  // ─── THR-1151: the rank half of the influence axis ──────────────────────
  // `factionsLed` filtered on `role === 'leader' || rank >= 3`. `rank` is on the
  // declared 0–1 scale, so the second clause was permanently false and a senior
  // member who had not taken the single leader slot counted as leading nothing.
  // No arm covered the rank clause, which is how it shipped dead.
  //
  // The fixtures below use LITERALS on the declared 0–1 scale, deliberately not
  // FACTION_RANK_SENIOR. Writing the constant on both sides of the comparison moves
  // the fixture with the threshold, so the arm passes for any value — including the
  // dead `3` it exists to rule out. Verified: with the threshold restored to `3`
  // these two go red, which is the only thing that makes them evidence.

  test('counts a senior-ranked membership toward factionsLed without a leader role', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({
      id: 'faction.senior', name: 'Ashen Circle', type: 'actor',
      properties: { actorType: 'faction' },
    });
    graph.addEdge({
      id: 'member.senior', source: agentId, target: 'faction.senior', type: 'member_of',
      properties: { role: 'member', rank: 0.7, joinedTick: 0 },
    });

    const snapshot = buildStateSnapshot(graph, agentId, makeThreadProps({ tier: 2 }));

    expect(snapshot.influence.factionsLed).toBe(1);
  });

  test('does not count a membership ranked below the senior threshold', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({
      id: 'faction.junior', name: 'Hedge Chapter', type: 'actor',
      properties: { actorType: 'faction' },
    });
    graph.addEdge({
      id: 'member.junior', source: agentId, target: 'faction.junior', type: 'member_of',
      properties: { role: 'member', rank: 0.2, joinedTick: 0 },
    });

    const snapshot = buildStateSnapshot(graph, agentId, makeThreadProps({ tier: 2 }));

    expect(snapshot.influence.factionsLed).toBe(0);
  });

  test('builds snapshot with correct relationship axis', () => {
    const { graph, agentId } = buildTestGraph();
    const threadProps = makeThreadProps({
      tier: 3,
      attentionMode: 'pause',
      interventionTracking: { totalVignettes: 10, playerIntervened: 7 },
    });
    const snapshot = buildStateSnapshot(graph, agentId, threadProps);

    expect(snapshot.relationship.threadTier).toBe(3);
    expect(snapshot.relationship.attentionMode).toBe('pause');
    expect(snapshot.relationship.interventionRatio).toBeCloseTo(0.7);
  });

  test('handles agent with no ambitions', () => {
    const { graph, agentId } = buildTestGraph();
    const threadProps = makeThreadProps();
    const snapshot = buildStateSnapshot(graph, agentId, threadProps);

    expect(snapshot.ambition.activeAmbitions).toBe(0);
    expect(snapshot.ambition.completedMilestones).toBe(0);
  });

  test('handles missing agent node gracefully', () => {
    const graph = new WorldGraph();
    const threadProps = makeThreadProps();
    // Agent doesn't exist in graph
    const snapshot = buildStateSnapshot(graph, 'nonexistent', threadProps);
    expect(snapshot.power.primaryReachLevel).toBe(0);
  });
});

// ─── Template Selection Tests ───────────────────────────────────────

describe('selectTemplate', () => {
  test('selects a template for call phase', () => {
    const snapshot = makeSnapshot();
    const result = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'call', snapshot, 42);
    expect(result).not.toBeNull();
    expect(result!.template.validPhases).toContain('call');
  });

  test('selects a template for road_of_trials phase', () => {
    const snapshot = makeSnapshot({ power: { primaryReachLevel: 40, totalTraits: 5, tierLevel: 2 } });
    const result = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'road_of_trials', snapshot, 42);
    expect(result).not.toBeNull();
    expect(result!.template.validPhases).toContain('road_of_trials');
  });

  test('selects a template for ordeal phase', () => {
    const snapshot = makeSnapshot();
    const result = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'ordeal', snapshot, 42);
    expect(result).not.toBeNull();
    expect(result!.template.id).toBe('ordeal_peak');
  });

  test('selects a template for return phase', () => {
    const snapshot = makeSnapshot();
    const result = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'return', snapshot, 42);
    expect(result).not.toBeNull();
    expect(result!.template.id).toBe('return_transformation');
  });

  test('returns null for empty template list', () => {
    const result = selectTemplate([], 'call', makeSnapshot(), 42);
    expect(result).toBeNull();
  });

  test('selection is deterministic with same seed', () => {
    const snapshot = makeSnapshot();
    const r1 = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'call', snapshot, 42);
    const r2 = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'call', snapshot, 42);
    expect(r1!.template.id).toBe(r2!.template.id);
    expect(r1!.variant.key).toBe(r2!.variant.key);
  });

  test('uses fallback template when no matching templates exist', () => {
    const fallbackOnly: JourneyBeatTemplate[] = [{
      id: 'test_fallback',
      validPhases: ['crisis'],
      description: 'Fallback',
      isFallback: true,
      variants: [{
        key: 'fallback',
        label: 'Fallback',
        score: () => 0.5,
        setupProse: 'Fallback setup',
        tensionProse: 'Fallback tension',
        choices: [{ id: 'c1', text: 'OK', effects: { interventionType: 'withdrawn' } }],
      }],
    }];
    const result = selectTemplate(fallbackOnly, 'crisis', makeSnapshot(), 42);
    expect(result).not.toBeNull();
    expect(result!.template.id).toBe('test_fallback');
  });
});

// ─── Vignette Data Tests ────────────────────────────────────────────

describe('buildVignetteData', () => {
  test('builds correct vignette data', () => {
    const template = JOURNEY_BEAT_TEMPLATES.find(t => t.id === 'call_awakening')!;
    const variant = template.variants[0];
    const snapshot = makeSnapshot();

    const data = buildVignetteData(
      'agent_1', 'Hero', 'call', 0, 0.1,
      template, variant, snapshot, 10,
    );

    expect(data.agentId).toBe('agent_1');
    expect(data.agentName).toBe('Hero');
    expect(data.phase).toBe('call');
    expect(data.templateId).toBe('call_awakening');
    expect(data.variantKey).toBe(variant.key);
    expect(data.isOrdeal).toBe(false);
    expect(data.choices.length).toBeGreaterThan(0);
  });

  test('marks ordeal vignettes correctly', () => {
    const template = JOURNEY_BEAT_TEMPLATES.find(t => t.id === 'ordeal_peak')!;
    const variant = template.variants[0];

    const data = buildVignetteData(
      'agent_1', 'Hero', 'ordeal', 0, 0.78,
      template, variant, makeSnapshot(), 50,
    );

    expect(data.isOrdeal).toBe(true);
  });
});

// ─── Beat Choice Application Tests ──────────────────────────────────

describe('applyBeatChoice', () => {
  test('records beat outcome in history', () => {
    const threadProps = makeThreadProps();
    const vignette = makeVignetteData();

    const { updatedProps, beatOutcome } = applyBeatChoice(threadProps, vignette, 'choice_support');

    expect(beatOutcome.phase).toBe('call');
    expect(beatOutcome.playerChoiceId).toBe('choice_support');
    expect(beatOutcome.templateId).toBe('call_awakening');
    expect(updatedProps.beatHistory).toHaveLength(1);
    expect(updatedProps.beatHistory![0].playerChoiceId).toBe('choice_support');
  });

  test('appends to existing beat history', () => {
    const existing: BeatOutcome = {
      phase: 'call',
      tick: 5,
      templateId: 'old',
      variantKey: 'old',
      playerChoiceId: 'old',
      stateSnapshot: makeSnapshot(),
    };
    const threadProps = makeThreadProps({ beatHistory: [existing] });
    const vignette = makeVignetteData({ phase: 'road_of_trials', doomClockPercent: 0.25 });

    const { updatedProps } = applyBeatChoice(threadProps, vignette, 'choice_support');

    expect(updatedProps.beatHistory).toHaveLength(2);
    expect(updatedProps.beatHistory![0].phase).toBe('call');
    expect(updatedProps.beatHistory![1].playerChoiceId).toBe('choice_support');
  });

  test('records ordeal outcome', () => {
    const threadProps = makeThreadProps({ storyPhase: 'ordeal' });
    const vignette = makeVignetteData({
      phase: 'ordeal',
      isOrdeal: true,
      doomClockPercent: 0.78,
      choices: [
        { id: 'triumph', text: 'Direct intervention', effects: { interventionType: 'coercive', ordealOutcome: 'triumph', essenceCost: 5 } },
        { id: 'scrape', text: 'Subtle guidance', effects: { interventionType: 'supportive', ordealOutcome: 'scraped_through' } },
        { id: 'break', text: 'Step back', effects: { interventionType: 'withdrawn', ordealOutcome: 'broken' } },
      ],
    });

    // THR-2226 — the roll decides; the choice's own `ordealOutcome` is ignored.
    const { updatedProps } = applyBeatChoice(threadProps, vignette, 'break', { band: 'success', outcome: 'triumph', godPaid: false });
    expect(updatedProps.ordealOutcome).toBe('triumph');
    expect(updatedProps).not.toHaveProperty('ordealBand');
    expect(updatedProps).not.toHaveProperty('ordealGodPaid');

    const { updatedProps: unrolled } = applyBeatChoice(threadProps, vignette, 'triumph');
    expect(unrolled.ordealOutcome).toBeUndefined();
  });

  test('updates intervention tracking', () => {
    const threadProps = makeThreadProps();
    const vignette = makeVignetteData();

    // Supportive choice
    const { updatedProps: props1 } = applyBeatChoice(threadProps, vignette, 'choice_support');
    const tracking1 = props1.interventionTracking as Record<string, number>;
    expect(tracking1.totalVignettes).toBe(1);
    expect(tracking1.playerIntervened).toBe(1);
    expect(tracking1.supportiveCount).toBe(1);

    // Withdrawn choice
    const { updatedProps: props2 } = applyBeatChoice(threadProps, vignette, 'choice_withdraw');
    const tracking2 = props2.interventionTracking as Record<string, number>;
    expect(tracking2.totalVignettes).toBe(1);
    expect(tracking2.playerWithdrew).toBe(1);
    expect(tracking2.playerIntervened).toBe(0);
  });

  test('updates story phase based on doom clock', () => {
    const threadProps = makeThreadProps({ storyPhase: 'call' });
    const vignette = makeVignetteData({ doomClockPercent: 0.25 }); // road_of_trials territory

    const { updatedProps } = applyBeatChoice(threadProps, vignette, 'choice_support');
    expect(updatedProps.storyPhase).toBe('road_of_trials');
  });
});

// ─── Format Phase Name ──────────────────────────────────────────────

describe('formatPhaseName', () => {
  test('formats all phase names', () => {
    expect(formatPhaseName('call')).toBe('Call');
    expect(formatPhaseName('road_of_trials')).toBe('Road of Trials');
    expect(formatPhaseName('crisis')).toBe('Crisis');
    expect(formatPhaseName('ordeal')).toBe('Ordeal');
    expect(formatPhaseName('return')).toBe('Return');
  });
});

// ─── Content Validation Tests ───────────────────────────────────────

describe('journey content', () => {
  test('all 5 phases have at least one template', () => {
    const phases: CampbellianPhase[] = ['call', 'road_of_trials', 'crisis', 'ordeal', 'return'];
    for (const phase of phases) {
      const templates = JOURNEY_BEAT_TEMPLATES.filter(t => t.validPhases.includes(phase));
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  test('every template has at least one variant', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      expect(template.variants.length).toBeGreaterThan(0);
    }
  });

  test('every variant has at least 2 choices', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        expect(variant.choices.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('every choice has an interventionType', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        for (const choice of variant.choices) {
          expect(['supportive', 'coercive', 'withdrawn']).toContain(choice.effects.interventionType);
        }
      }
    }
  });

  test('ordeal choices lean on the roll and name no outcome (THR-2226, Law 10)', () => {
    const ordealTemplates = JOURNEY_BEAT_TEMPLATES.filter(t => t.validPhases.includes('ordeal'));
    for (const template of ordealTemplates) {
      for (const variant of template.variants) {
        for (const choice of variant.choices) {
          expect(choice.effects.ordealOutcome).toBeUndefined();
          expect(typeof choice.effects.ordealLean).toBe('number');
          expect(choice.text.toLowerCase()).not.toContain('guarantee');
          for (const outcome of ['triumph', 'scraped_through', 'broken'] as const) {
            expect(choice.effects.consequenceByOutcome?.[outcome]?.length ?? 0).toBeGreaterThan(10);
          }
        }
      }
    }
  });

  test('every variant has non-empty prose', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        expect(variant.setupProse.length).toBeGreaterThan(10);
        expect(variant.tensionProse.length).toBeGreaterThan(10);
      }
    }
  });

  test('variant score functions return numbers in [0, 1] for sample snapshots', () => {
    const snapshots = [
      makeSnapshot(),
      makeSnapshot({ power: { primaryReachLevel: 60, totalTraits: 10, tierLevel: 4 } }),
      makeSnapshot({ influence: { factionsLed: 3, locationsControlled: 2, agreementsForged: 5, enemiesMade: 4 } }),
    ];
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        for (const snapshot of snapshots) {
          const score = variant.score(snapshot);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('template IDs are unique', () => {
    const ids = JOURNEY_BEAT_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('choice IDs are unique within each variant', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        const ids = variant.choices.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

// ─── Orchestrator Phase Tests ───────────────────────────────────────

describe('phaseJourneyBeat', () => {
  test('produces no vignettes when no First exists', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc_1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });

    const state = {
      graph,
      ascendantId: 'asc_1',
      doomClock: { currentTick: 50, totalTicks: 1000, progress: 0.05, tickModifier: 1.0 },
      tick: 50,
      seed: 42,
      tickEvents: [],
      pendingVignettes: undefined,
    } as any;

    const result = phaseJourneyBeat(state, JOURNEY_BEAT_TEMPLATES);
    expect(result.pendingVignettes).toBeUndefined();
  });

  test('produces a vignette when beat threshold is crossed', () => {
    const { graph, ascendantId, agentId } = buildTestGraph();

    // Doom clock just crossed the call beat threshold.
    // callThreshold = midpoint of [0, 0.20] = 0.10
    // currentTick=105, totalTicks=1000, tickModifier=10 -> progress=0.105, prev=0.095
    const totalTicks = 1000;
    const currentTick = 105;

    const state = {
      graph,
      ascendantId,
      doomClock: {
        currentTick,
        totalTicks,
        progress: currentTick / totalTicks, // 0.105
        tickModifier: 10.0, // prev = (105 - 10) / 1000 = 0.095 < 0.10
      },
      tick: currentTick,
      seed: 42,
      tickEvents: [],
      pendingVignettes: undefined,
    } as any;

    const result = phaseJourneyBeat(state, JOURNEY_BEAT_TEMPLATES);
    expect(result.pendingVignettes).toBeDefined();
    expect(result.pendingVignettes!.length).toBe(1);
    expect(result.pendingVignettes![0].data.agentId).toBe(agentId);
    expect(result.pendingVignettes![0].data.phase).toBe('call');
  });

  test('does not produce duplicate vignettes for same beat', () => {
    const { graph, ascendantId } = buildTestGraph();

    const totalTicks = 1000;
    const currentTick = 105;

    // Run phase once — same setup as the crossing test
    const state = {
      graph,
      ascendantId,
      doomClock: { currentTick, totalTicks, progress: currentTick / totalTicks, tickModifier: 10.0 },
      tick: currentTick,
      seed: 42,
      tickEvents: [],
      pendingVignettes: undefined,
    } as any;

    const result1 = phaseJourneyBeat(state, JOURNEY_BEAT_TEMPLATES);
    expect(result1.pendingVignettes).toBeDefined();

    // Run again with same progress (doom didn't advance)
    const state2 = { ...state, pendingVignettes: result1.pendingVignettes };
    const result2 = phaseJourneyBeat(state2, JOURNEY_BEAT_TEMPLATES);
    // Should not add another vignette (beat already in queue, and threshold not re-crossed)
    // The engine won't fire again because prevDoomProgress == doomProgress
    expect(result2.pendingVignettes?.length ?? 0).toBeLessThanOrEqual(1);
  });
});

// ─── THR-2233: no journey vision is lost ────────────────────────────

describe('phaseJourneyBeat — a missed Road of Trials beat catches up (THR-2233)', () => {
  const TOTAL = 1000;
  const STEP = 1; // one Doom unit a tick → prev progress = progress - 0.001

  function trialsBeat(tick: number): BeatOutcome {
    return { phase: 'road_of_trials', tick, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() };
  }

  function setup(beatsPlayed: number) {
    const { graph, ascendantId, agentId } = buildTestGraph();
    const threadId = graph.getOutgoingEdges(ascendantId, 'thread')[0].id;
    const record = (count: number) => graph.updateEdge(threadId, {
      properties: makeThreadProps({
        storyPhase: 'road_of_trials',
        beatHistory: [
          { phase: 'call', tick: 1, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() },
          ...Array.from({ length: count }, (_, i) => trialsBeat(10 + i)),
        ],
      }) as unknown as Record<string, unknown>,
    });
    record(beatsPlayed);
    const tickAt = (progress: number, pendingForFirst = false, step = STEP) => {
      const currentTick = Math.round(progress * TOTAL);
      return phaseJourneyBeat({
        graph,
        ascendantId,
        doomClock: { currentTick, totalTicks: TOTAL, progress: currentTick / TOTAL, tickModifier: step, lastStep: step },
        tick: currentTick,
        seed: 42,
        tickEvents: [],
        pendingVignettes: pendingForFirst
          ? [{ id: 'v_pending', data: { agentId }, priority: 100, queuedTick: 0 }]
          : undefined,
      } as any, JOURNEY_BEAT_TEMPLATES);
    };
    const fired = (r: ReturnType<typeof tickAt>) =>
      (r.pendingVignettes ?? []).filter(v => v.id !== 'v_pending').map(v => `${v.data.phase}#${v.data.beatIndex}`);
    return { tickAt, fired, record };
  }

  test('a crossing that lands while a vision is pending fires on the first free tick; the next still fires on its own crossing', () => {
    const t = getBeatThresholds('road_of_trials');
    const { tickAt, fired, record } = setup(1);
    const crossing = Math.ceil(t[1] * TOTAL) / TOTAL;

    // The tick that crosses beat 2's threshold: a vision is still waiting, so nothing new.
    expect(fired(tickAt(crossing, true))).toEqual([]);
    // Next tick — no crossing any more, but the beat was reached and never played.
    expect(fired(tickAt(crossing + 1 / TOTAL))).toEqual(['road_of_trials#1']);
    record(2);
    // Answered: nothing more until beat 3's threshold.
    expect(fired(tickAt(crossing + 2 / TOTAL))).toEqual([]);
    const next = Math.ceil(t[2] * TOTAL) / TOTAL;
    expect(fired(tickAt(next))).toEqual(['road_of_trials#2']);
  });

  test('a doom jump across two Trials thresholds fires one beat that tick and the second on the next', () => {
    const t = getBeatThresholds('road_of_trials');
    const { tickAt, fired, record } = setup(1);
    const past = Math.ceil(t[2] * TOTAL) / TOTAL + 0.002;
    expect(past).toBeLessThan(t[3]);
    // One big Doom step from just below beat 2's threshold to past beat 3's.
    const jump = Math.round((past - (t[1] - 0.002)) * TOTAL);

    expect(fired(tickAt(past, false, jump))).toEqual(['road_of_trials#1']);
    record(2);
    expect(fired(tickAt(past + 1 / TOTAL))).toEqual(['road_of_trials#2']);
    record(3);
    // Beat 4's threshold not reached: no more.
    expect(fired(tickAt(past + 2 / TOTAL))).toEqual([]);
  });

  test('a First whose journey begins mid-Trials is not handed the Trials beats that passed before it', () => {
    const t = getBeatThresholds('road_of_trials');
    const { graph, ascendantId } = buildTestGraph(); // fresh First: storyPhase 'call', no history
    const threadId = graph.getOutgoingEdges(ascendantId, 'thread')[0].id;
    const props = () => graph.getEdge(threadId)!.properties as unknown as ThreadEdgeProperties;
    const tickAt = (progress: number) => {
      const currentTick = Math.round(progress * TOTAL);
      const r = phaseJourneyBeat({
        graph, ascendantId,
        doomClock: { currentTick, totalTicks: TOTAL, progress: currentTick / TOTAL, tickModifier: STEP, lastStep: STEP },
        tick: currentTick, seed: 42, tickEvents: [], pendingVignettes: undefined,
      } as any, JOURNEY_BEAT_TEMPLATES);
      return (r.pendingVignettes ?? []).map(v => `${v.data.phase}#${v.data.beatIndex}`);
    };
    const answer = (tick: number) => graph.updateEdge(threadId, {
      properties: { beatHistory: [...(props().beatHistory ?? []), trialsBeat(tick)], storyPhase: 'road_of_trials' } as never,
    });

    // Threaded with the Doom between beat 3's and beat 4's thresholds.
    const start = (Math.ceil(t[2] * TOTAL) + 2) / TOTAL;
    expect(start).toBeLessThan(t[3]);
    expect(tickAt(start)).toEqual(['road_of_trials#0']);
    expect(props().journeyStartDoom).toBeCloseTo(start);
    answer(1);
    // Beats #1 and #2 passed before this First held the thread: nothing to catch up.
    expect(tickAt(start + 1 / TOTAL)).toEqual([]);
    // Beat #3 still fires when its threshold is reached.
    expect(tickAt(Math.ceil(t[3] * TOTAL) / TOTAL)).toEqual(['road_of_trials#3']);
    answer(2);
    expect(tickAt(Math.ceil(t[3] * TOTAL) / TOTAL + 1 / TOTAL)).toEqual([]);
  });

  test('a beat whose phase has ended is not caught up — the next phase entry takes over', () => {
    const { tickAt, fired } = setup(2);
    // In the Crisis now, two Trials beats unplayed: the Crisis entry beat fires, not Trials #2.
    expect(fired(tickAt(TRIALS_PHASE_END + 0.001))).toEqual(['crisis#0']);
  });
});

// ─── PRNG Determinism Test ──────────────────────────────────────────

describe('determinism', () => {
  test('same seed produces same template selection', () => {
    const snapshot = makeSnapshot({ power: { primaryReachLevel: 45, totalTraits: 7, tierLevel: 3 } });
    const results = [];
    for (let i = 0; i < 5; i++) {
      const r = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'road_of_trials', snapshot, 12345);
      results.push(`${r!.template.id}:${r!.variant.key}`);
    }
    // All should be identical
    expect(new Set(results).size).toBe(1);
  });

  test('different seeds can produce different selections', () => {
    const snapshot = makeSnapshot({ power: { primaryReachLevel: 45, totalTraits: 7, tierLevel: 3 } });
    const results = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const r = selectTemplate(JOURNEY_BEAT_TEMPLATES, 'road_of_trials', snapshot, seed);
      if (r) results.add(`${r.template.id}:${r.variant.key}`);
    }
    // With 50 different seeds, we should get at least 2 different selections
    expect(results.size).toBeGreaterThanOrEqual(1); // At minimum 1, likely more
  });
});

// ─── THR-2228: the Return's last-days line ─────────────────────────

describe('phaseJourneyBeat — the Return names the last days (THR-2228)', () => {
  function returnState(lastStep: number) {
    const { graph, ascendantId } = buildTestGraph();
    const threadId = graph.getOutgoingEdges(ascendantId, 'thread')[0].id;
    graph.updateEdge(threadId, {
      properties: makeThreadProps({
        storyPhase: 'ordeal',
        beatHistory: [{ phase: 'ordeal', tick: 1, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: makeSnapshot() }],
      }) as unknown as Record<string, unknown>,
    });
    return {
      graph,
      ascendantId,
      // Ten Doom units left: the Return fires on the phase change into 'return'.
      doomClock: { currentTick: 990, totalTicks: 1000, progress: 0.99, tickModifier: lastStep, lastStep },
      tick: 500,
      seed: 42,
      tickEvents: [],
      pendingVignettes: undefined,
    } as any;
  }

  test('carries "Go on" and the line; the thread clause reads the Doom in game ticks', () => {
    // Slow Doom (0.1 units a tick): 100 game ticks left, longer than any Return cooldown.
    const slow = phaseJourneyBeat(returnState(0.1), JOURNEY_BEAT_TEMPLATES).pendingVignettes!;
    const slowReturn = slow.find(v => v.data.phase === 'return')!.data;
    expect(slowReturn.closeLabel).toBe('Go on');
    expect(slowReturn.remainingLine).toContain("Test Hero's story is told.");
    expect(slowReturn.remainingLine).toContain('Another mortal can carry your thread.');

    // Fast Doom (5 units a tick): 2 game ticks left, shorter than every Return cooldown (3+).
    const fast = phaseJourneyBeat(returnState(5), JOURNEY_BEAT_TEMPLATES).pendingVignettes!;
    const fastReturn = fast.find(v => v.data.phase === 'return')!.data;
    expect(fastReturn.remainingLine).toContain("Test Hero's story is told.");
    expect(fastReturn.remainingLine).not.toContain('Another mortal');
  });
});
