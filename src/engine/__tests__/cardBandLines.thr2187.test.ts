/**
 * THR-2187 — your cards say how they landed. Each card the god played on a step
 * adds its own band line to how the step went, frozen on the step record at the
 * roll, with the nearest band when the card has no line for the exact one.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { cardBandLines, formatCardLine } from '../encounters/nudges';
import {
  CARD_BAND_FALLBACK,
  CARD_LINES_ENABLED,
  MAX_CARD_LINES_PER_STEP,
} from '../../data/nudge-constants';
import { BAND_FRAGMENTS, NUDGE_CARD_LIBRARY, PLAY_PROFILES } from '../../data/nudge-card-library';
import { mintDealtNudge } from '../encounters/dealHand';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { createSimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { buildChapterRecord } from '../chapterArchive';
import { DROWNED_MANS_TESTIMONY_TEMPLATE } from '../../data/encounters/drowned-mans-testimony';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { StepProseRecord } from '../../types/stepProseRecord';
import type { ActionStep, StepNudge, StepOutcome, UnifiedActionTemplate } from '../../types/unifiedAction';

const ALL_BANDS: readonly StepOutcome[] = [
  'critical_success', 'success', 'success_at_cost', 'near_miss', 'failure', 'critical_failure',
];

function card(id: string, name: string, bandProse: Partial<Record<StepOutcome, string>>): StepNudge {
  return {
    id, name, essenceCost: 1, forecastDelta: 0.1, fiction: '', effectLine: 'Widens the odds.', bandProse,
  } as StepNudge;
}

const FULL = card('n.full', 'Press The Odds', {
  critical_success: 'full crit success',
  success: 'full success',
  success_at_cost: 'full at cost',
  near_miss: 'full near miss',
  failure: 'full failure',
  critical_failure: 'full crit failure',
});
const PLAIN = card('n.plain', 'Loosen Their Footing', { success: 'plain success', failure: 'plain failure' });
const NONE = card('n.none', 'Silent Card', {});
const THIRD = card('n.third', 'Third Card', { success: 'third success', failure: 'third failure' });

const step: Pick<ActionStep, 'nudges'> = { nudges: [FULL, PLAIN, NONE, THIRD] };

describe('THR-2187 — cardBandLines', () => {
  it('the constants hold the plan defaults', () => {
    expect(CARD_LINES_ENABLED).toBe(true);
    expect(MAX_CARD_LINES_PER_STEP).toBe(2);
    expect(CARD_BAND_FALLBACK).toEqual({
      critical_success: 'success',
      success_at_cost: 'success',
      near_miss: 'failure',
      critical_failure: 'failure',
    });
  });

  it('a card with a line for every band uses the exact band, at all six', () => {
    for (const band of ALL_BANDS) {
      expect(cardBandLines(step, ['n.full'], band)).toEqual([
        { name: 'Press The Odds', line: FULL.bandProse![band] },
      ]);
    }
  });

  it('each extreme band falls back to the nearest band on its side', () => {
    expect(cardBandLines(step, ['n.plain'], 'critical_success')[0].line).toBe('plain success');
    expect(cardBandLines(step, ['n.plain'], 'success_at_cost')[0].line).toBe('plain success');
    expect(cardBandLines(step, ['n.plain'], 'near_miss')[0].line).toBe('plain failure');
    expect(cardBandLines(step, ['n.plain'], 'critical_failure')[0].line).toBe('plain failure');
    expect(cardBandLines(step, ['n.plain'], 'success')[0].line).toBe('plain success');
    expect(cardBandLines(step, ['n.plain'], 'failure')[0].line).toBe('plain failure');
  });

  it('caps at two, in commit order, skipping cards with no line', () => {
    const lines = cardBandLines(step, ['n.third', 'n.none', 'n.plain', 'n.full'], 'failure');
    expect(lines.map(l => l.name)).toEqual(['Third Card', 'Loosen Their Footing']);
  });

  it('a retired id is skipped, and no hand means no lines', () => {
    expect(cardBandLines(step, ['n.retired', 'n.plain'], 'failure')).toEqual([
      { name: 'Loosen Their Footing', line: 'plain failure' },
    ]);
    expect(cardBandLines(step, [], 'failure')).toEqual([]);
    expect(cardBandLines(step, undefined, 'failure')).toEqual([]);
    expect(cardBandLines({}, ['n.plain'], 'failure')).toEqual([]);
  });

  it('the kill switch off returns nothing', () => {
    expect(cardBandLines(step, ['n.full'], 'success', false)).toEqual([]);
  });

  it('formats as "<card name> — <line>"', () => {
    expect(formatCardLine('Press The Odds', 'The odds had been quietly widened.'))
      .toBe('Press The Odds — The odds had been quietly widened.');
  });

  it('every dealable library card has a line at every band through the fallback', () => {
    const dealable = NUDGE_CARD_LIBRARY.filter(
      m => PLAY_PROFILES[m.id] !== undefined && Object.keys(BAND_FRAGMENTS[m.id] ?? {}).length > 0,
    );
    expect(dealable.length).toBeGreaterThan(0);
    for (const member of dealable) {
      const dealt = mintDealtNudge(member, PLAY_PROFILES[member.id]);
      for (const band of ALL_BANDS) {
        const lines = cardBandLines({ nudges: [dealt] }, [dealt.id], band);
        expect(lines, `${member.id} at ${band}`).toHaveLength(1);
        expect(lines[0].name).toBe(dealt.name);
      }
    }
  });
});

// ─── The resolution freezes the lines ────────────────────────────

function makeTemplate(nudges: StepNudge[]): UnifiedActionTemplate {
  return {
    id: 'action.iron.thr2187_probe',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Card Probe',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [0, 1].map(() => ({
      reach: 'iron' as const,
      duration: { min: 1, max: 1 },
      difficulty: 0.3,
      narrativeTemplate: 'The probe leans in.',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue' as const,
      nudges,
    })),
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as UnifiedActionTemplate;
}

function archiveState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent-1', type: 'actor', name: 'Kael', properties: {} });
  return { tick: 9, graph, unifiedActions: [] } as unknown as GameState;
}

/** A resolved one-step chapter on a registered encounter, carrying the given prose records. */
function archiveAction(records: readonly StepProseRecord[] | undefined): UnifiedAction {
  return {
    actionId: 'thr2187-archive',
    actorId: 'agent-1',
    templateId: DROWNED_MANS_TESTIMONY_TEMPLATE.id,
    targetId: 'agent-1',
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 1,
    stepProgress: 0,
    stepDuration: 1,
    resolved: true,
    outcome: 'failure',
    stepOutcomes: ['failure'],
    ...(records ? { stepProseHistory: records.map(r => ({ ...r, index: 0 })) } : {}),
  } as unknown as UnifiedAction;
}

describe('THR-2187 — executeStepResult freezes cardLines', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
  });

  function resolveWith(activeNudges: string[] | undefined, outcome: StepOutcome) {
    const runtime = createSimulationRuntime();
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Kael', properties: {} });
    const state = { tick: 5, graph, unifiedActions: [] } as unknown as GameState;
    const template = makeTemplate([
      card('n.press', 'Press The Odds', { success: 'The odds had been widened, and {actor} walked through.', failure: 'Nothing gave.' }),
    ]);
    const rng = () => 0.5;
    const created = createUnifiedAction({
      actorId: 'agent-1', templateId: template.id, targetId: 'agent-1',
      scale: template.scale, source: 'agent', template, tick: state.tick, rng,
    });
    const action = activeNudges ? { ...created, activeNudges } : created;
    const { updatedAction } = executeStepResult(
      action, template, outcome, [], state, rng, state.tick,
      { capability: 60, probability: 0.5, roll: 40 }, runtime,
    );
    return { updatedAction, template };
  }

  it('a played card freezes its enriched line, with the fallback on a critical failure', () => {
    const { updatedAction } = resolveWith(['n.press'], 'critical_failure');
    const records = (updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    expect(records[0].cardLines).toEqual(['Press The Odds — Nothing gave.']);
  });

  it('placeholders in the line resolve', () => {
    const { updatedAction } = resolveWith(['n.press'], 'success');
    const line = ((updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[])[0].cardLines?.[0];
    expect(line).toMatch(/^Press The Odds — The odds had been widened, and .+ walked through\.$/);
    expect(line).not.toContain('{');
  });

  it('no hand freezes no cardLines (today\'s output)', () => {
    const { updatedAction } = resolveWith(undefined, 'success');
    const records = (updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    expect(records[0]).not.toHaveProperty('cardLines');
  });

  it('the chapter archive copies the frozen lines word for word', () => {
    const { updatedAction } = resolveWith(['n.press'], 'failure');
    const frozen = ((updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[])[0].cardLines;
    expect(frozen).toEqual(['Press The Odds — Nothing gave.']);
    const rec = buildChapterRecord(archiveAction(updatedAction.stepProseHistory as readonly StepProseRecord[]), archiveState());
    expect(rec?.steps[0].cardLines).toEqual(frozen);
  });

  it('a chapter with no frozen lines archives none', () => {
    const rec = buildChapterRecord(archiveAction(undefined), archiveState());
    expect(rec?.steps[0]).toBeDefined();
    expect(rec?.steps[0]).not.toHaveProperty('cardLines');
  });
});
