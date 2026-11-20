// @vitest-environment jsdom
/**
 * THR-2265 — browser-verify substitution (jsdom-render): the Mandate rail row and
 * the card's "Counts toward your Mandate." line, on the real hook and the real
 * card shell.
 *
 * - `useOpeningReveal`: on the render where The First's chapter first credits the
 *   Mandate, `show.mandate` turns on and the "New beside the map: Mandates." toast
 *   fires once — and no other row arrives with it.
 * - `NudgePhaseShell`: the card renders no Mandate line while the Mandate is unnamed,
 *   and renders it once the Seat (or a credit) has named it.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup, renderHook } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { SPHERE_NAMES } from '../../../../types/index';
import { useOpeningReveal } from '../openingReveal';
import { buildNudgePhaseModel } from '../../encounter-stage/adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../../encounter-stage/shells/NudgePhaseShell';
import { MANDATE_CARD_HINT } from '../../../../data/ascendant-bar-content';

const ENCOUNTER_ID = 'encounter.deep_descent';
const BOND_TICK = 10;
const CREDIT = { entityId: 'loc.x', sphere: 'mind', points: 1, cause: 'god', sources: [], source: 'deed' };

function staged(o: { tick: number; beats?: string[]; credited?: boolean; chapters?: number[] }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual', gender: 'female' } });
  graph.addEdge({ id: 'e1', type: 'thread', source: 'asc', target: 'elara', properties: { courtPosition: 'the_first' } });
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 30;
  return {
    graph,
    ascendantId: 'asc',
    tick: o.tick,
    openingRevealStaged: true,
    doomClock: { wokeAtTick: BOND_TICK },
    ascendantBeats: {
      spineCursor: 1, pending: null, lastBeatTurn: 0,
      history: (o.beats ?? ['beat.spine.opening']).map(beatId => ({
        beatId, kind: 'spine', resolvedTurn: 1, outcome: 'success', grantedActionIds: [], seededNodeIds: [],
      })),
    },
    unifiedActions: o.credited
      ? [{ actionId: 'act-c', templateId: ENCOUNTER_ID, actorId: 'elara', resolved: true, currentStep: 0, mandateDeedCredits: [CREDIT] }]
      : [],
    chapterArchive: (o.chapters ?? []).map((t, i) => ({
      actionId: `act-${i}`, templateId: ENCOUNTER_ID, templateName: 'x', actorId: 'elara', actorName: 'Elara',
      targetId: 'elara', targetName: 'Elara', scale: 'personal', startTick: 0,
      resolvedTick: t, resolved: true, threaded: true, participants: [], openingProse: '', steps: [],
    })),
    mandateState: null,
    rivalStates: [],
    essencePool: pool,
    unlockedActionIds: [],
    ascendantIdentity: { sphereAlignment: { primary: 'mind', secondary: 'spirit' }, hungerId: 'hunger.witness' },
    mandateDefinition: { id: 'm', runtimeKind: 'sphere_growth', primarySphere: 'mind', secondarySphere: 'spirit' },
  } as unknown as GameState;
}

afterEach(cleanup);

describe('THR-2265 · the rail row arrives with the first credited Aftermath (useOpeningReveal)', () => {
  it('shows the Mandate and toasts it once, on the credited render, with nothing else arriving', () => {
    const toasts: string[] = [];
    const beats = ['beat.spine.opening', 'beat.spine.the_first_word'];
    const { result, rerender } = renderHook(
      ({ s, v }) => useOpeningReveal(s, v, (m) => toasts.push(m)),
      { initialProps: { s: staged({ tick: 15, chapters: [14] }), v: 1 } },
    );
    expect(result.current.show.mandate).toBe(false);

    // The First Word lands; one closed chapter since — Notables arrives normally.
    rerender({ s: staged({ tick: 17, beats, chapters: [14, 16] }), v: 2 });
    expect(result.current.show.notables).toBe(true);
    expect(result.current.show.mandate).toBe(false);
    toasts.length = 0;

    // The next chapter credits the Mandate: it arrives now, alone.
    rerender({ s: staged({ tick: 20, beats, chapters: [14, 16, 19], credited: true }), v: 3 });
    expect(result.current.show.mandate).toBe(true);
    expect(result.current.reveal.rows.mandate).toEqual({ revealed: true, reason: 'queued', readyReason: 'mandate_named' });
    expect(result.current.show.doom).toBe(false);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].startsWith('New beside the map: Mandates.')).toBe(true);
  });
});

// ─── the card line ────────────────────────────────────────────────

const MIND: StepNudge = { id: 'count_the_cost', name: 'Count What It Costs', sphere: 'mind', essenceCost: 3, forecastDelta: 0.05, effectLine: 'She reckons it.' };
const STEP = {
  reach: 'shadow', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [],
  failBehavior: 'continue_weakened', narrativeTemplate: 'The ledger is open.', purposeLine: 'Balance the ledger',
  nudges: [MIND],
} as unknown as ActionStep;
const TEMPLATE = {
  id: 'test.mandate_named', rarityTier: 1, intrinsicTier: 'background', name: 'The Ledger', reach: 'shadow',
  crudType: 'read', scale: 'local', steps: [STEP], apCost: 1, actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'The ledger is open.', success: 'It balances.', failure: 'It does not.' },
} as unknown as UnifiedActionTemplate;
const ACTION = {
  actionId: 'ua_m', actorId: 'elara', templateId: 'test.mandate_named', targetId: 'elara',
  scale: 'local', source: 'agent', startTick: 3, currentStep: 0, stepProgress: 0, stepDuration: 2,
  resolved: false, stepOutcomes: [],
} as unknown as UnifiedAction;

function renderCard(state: GameState): void {
  const phase = buildNudgePhaseModel({ template: TEMPLATE, activeAction: ACTION, step: STEP, graph: state.graph, gameState: state })!;
  render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
}

describe('THR-2265 · the card says "Counts toward your Mandate." only once the row can be on screen', () => {
  it('renders no Mandate line before the Mandate is named', () => {
    renderCard(staged({ tick: 15 }));
    expect(screen.queryByText(MANDATE_CARD_HINT)).toBeNull();
  });

  it('renders the line once the Seat has named it', () => {
    renderCard(staged({ tick: 15, beats: ['beat.spine.opening', 'beat.spine.the_seat'] }));
    expect(screen.getByText(MANDATE_CARD_HINT)).toBeTruthy();
  });
});
