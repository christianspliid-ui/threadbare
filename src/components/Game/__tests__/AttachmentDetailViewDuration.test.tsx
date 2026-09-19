// @vitest-environment jsdom
/**
 * THR-1484 — the Duration section renders for a condition granted by a real writer.
 *
 * The sibling suite (`AttachmentDetailView.test.tsx`) hands the component a
 * literal `{ ticksRemaining: 8, totalTicks: 20 }`. That proves the component
 * renders a Duration row when handed one, which was never in doubt — and it passes
 * identically whether or not any writer in the engine produces that shape. It is
 * the fixture-invents-both-sides shape, and it is why a defect that blanked the
 * Duration row for 13 of 14 live condition edges went unnoticed.
 *
 * These tests own the other half: nothing here is hand-authored. Each drives a
 * **real** grant path into a real graph, reads it back through the **real**
 * `getAgentAttachments`, and hands the result to the real component. Break a writer's
 * field name and the Duration row disappears here exactly as it does in the game.
 *
 * THR-1503: the second arm used to drive `phaseEncounterTraits.processEncounterConditions`
 * through a mocked `getAnyEncounterById` — the only way to reach a path whose
 * `category` gate matched no shipped template and whose sole caller was the empty
 * legacy `encounterProgress` loop. That writer is deleted; the arm now drives the
 * aftermath `apply_condition` effect, which is where an authored consequence
 * actually lands, with no mock in the way.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentDetailView } from '../AttachmentDetailView';
import type { AttachmentDetailData } from '../AttachmentDetailView';
import { WorldGraph } from '../../../engine/graph';
import { getAgentAttachments } from '../../../engine/agentAttachments';
import { instantiateReward } from '../../../engine/rewardPool';
import { applyEncounterAftermathReaction } from '../../../engine/encounterAftermath';
import { createSimulationRuntime } from '../../../engine/simulationRuntime';
import type { GameState } from '../../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../../types/unifiedAction';

const HERO = 'actor-hero';
const TICK = 10;

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero',
    properties: { actorType: 'individual' },
  });
  return graph;
}

/** The minimum state the aftermath applier reads; mirrors `conditionDurationContract.test.ts`. */
function buildState(graph: WorldGraph): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: HERO, templateId: 'enc.test', targetId: HERO,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

/** The real reader's output, shaped as the sheet receives it. Never hand-authored. */
function conditionFromGraph(graph: WorldGraph, traitId: string): AttachmentDetailData {
  const entry = getAgentAttachments(graph, HERO).conditions.find(c => c.id === traitId);
  expect(entry, `expected a granted condition ${traitId}`).toBeDefined();
  return entry as unknown as AttachmentDetailData;
}

describe('THR-1484 — Duration renders for really-granted conditions', () => {
  it('renders Duration for a reward-pool condition (the highest-volume writer)', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'tpl.condition.gale_touched', type: 'trait', name: 'Gale-Touched',
      properties: { subcategory: 'condition', ticksRemaining: 20, tier: 1, tags: ['#condition'] },
    });
    instantiateReward(graph, 'tpl.condition.gale_touched', HERO, TICK);

    const granted = conditionFromGraph(graph, `reward_${HERO}_${TICK}_tpl.condition.gale_touched`);
    render(<AttachmentDetailView attachment={granted} onBack={vi.fn()} />);

    // The section heading is the assertion: before the fix `totalTicks` came back
    // undefined, the `ticksRemaining != null && totalTicks` gate failed, and this
    // heading was absent from the sheet entirely.
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText(/remaining/)).toBeTruthy();
  });

  it('renders Duration for an aftermath apply_condition condition (the authored writer)', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'trait.condition.wounded', type: 'trait', name: 'Wounded',
      properties: { subcategory: 'condition', tags: ['#condition', '#negative'] },
    });
    const reaction: EncounterAftermathReaction = {
      id: 'react-wound', label: 'Take the wound',
      effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', durationTicks: 12 }],
    } as unknown as EncounterAftermathReaction;

    const { state: next } = applyEncounterAftermathReaction(
      buildState(graph), makeAction(), reaction, TICK, createSimulationRuntime(),
    );

    const granted = conditionFromGraph(next.graph, 'trait.condition.wounded');
    render(<AttachmentDetailView attachment={granted} onBack={vi.fn()} />);

    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText(/remaining/)).toBeTruthy();
  });
});
