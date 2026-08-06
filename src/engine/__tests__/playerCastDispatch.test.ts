/**
 * Player-cast dispatch contract (THR-739)
 *
 * The two drawers used to hand-roll this sequence separately and drifted apart
 * — the non-agent drawer never wrote the ACTION_START timeline event the agent
 * drawer wrote on every cast. These tests pin the shape both surfaces now share,
 * so a future edit to one cannot silently diverge from the other.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { getTimeline, clearTimelines } from '../encounterTimeline';
import {
  preparePlayerCast,
  commitPlayerCast,
  PLAYER_CAST_EVENT_SIGNIFICANCE,
} from '../playerCastDispatch';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ASCENDANT_ID = 'ascendant-test';
const TARGET_ID = 'agent-target';

function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'action.iron.create',
    name: 'Forge the Line',
    scale: 'personal',
    reach: 'iron',
    essenceCost: 6,
    rarityTier: 1,
    sphereAffinity: 'force',
    steps: [
      { id: 'step-1', label: 'Begin', duration: [2, 2], difficulty: 'fair' },
    ],
    narrativeTemplates: { initiation: 'sets the anvil ringing' },
    ...overrides,
  } as unknown as UnifiedActionTemplate;
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'ascendant',
    name: 'The Witness',
    properties: {},
  } as never);
  graph.addNode({
    id: TARGET_ID,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual' },
  } as never);
  return graph;
}

// The fixture is a hand-built slice, not a real GameState — these helpers only
// read essencePool / unifiedActions / recentEvents / tick.
function makeState(overrides: Record<string, unknown> = {}): GameState {
  return {
    tick: 12,
    seed: 42,
    essencePool: { force: 10, matter: 4 },
    unifiedActions: [],
    recentEvents: [],
    ...overrides,
  } as unknown as GameState;
}

describe('preparePlayerCast', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    clearTimelines();
  });

  it('mints a player-sourced action carrying the template scale and cost', () => {
    const template = makeTemplate();
    const cast = preparePlayerCast({
      graph: makeGraph(),
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 12,
      seed: 42,
      sphere: 'force',
    });

    expect(cast.action.source).toBe('player');
    expect(cast.action.actorId).toBe(ASCENDANT_ID);
    expect(cast.action.targetId).toBe(TARGET_ID);
    expect(cast.action.scale).toBe('personal');
    expect(cast.action.startTick).toBe(12);
    expect(cast.essenceCost).toBe(6);
    expect(cast.buffsConsumed).toBe(false);
    expect(cast.buffParenthetical).toBe('');
  });

  it('writes an ACTION_START timeline event — the gap the non-agent drawer had', () => {
    const template = makeTemplate();
    preparePlayerCast({
      graph: makeGraph(),
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 12,
      seed: 42,
      sphere: 'force',
    });

    const timeline = getTimeline(ASCENDANT_ID);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({
      phase: 'ACTION_START',
      tick: 12,
      template: 'Forge the Line',
      target: 'Kael Thornweaver',
      reach: 'iron',
      scale: 'personal',
      source: 'player',
    });
  });

  it('honours an explicit scale override without touching the template', () => {
    const template = makeTemplate();
    const cast = preparePlayerCast({
      graph: makeGraph(),
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 3,
      seed: 42,
      sphere: 'force',
      scale: 'cosmic',
    });

    expect(cast.action.scale).toBe('cosmic');
    expect(template.scale).toBe('personal');
  });

  it('applies the Recede discount and reports it in the shared parenthetical', () => {
    const graph = makeGraph();
    graph.updateNode(ASCENDANT_ID, { properties: { nextActionDiscount: 0.5 } } as never);

    const template = makeTemplate();
    const cast = preparePlayerCast({
      graph,
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 12,
      seed: 42,
      sphere: 'force',
    });

    expect(cast.essenceCost).toBe(3);
    expect(cast.buffsConsumed).toBe(true);
    expect(cast.buffParenthetical).toBe(' (after Recede)');
  });

  it('skips the buff pass and keeps the buff intact when applyBuffs is false', () => {
    const graph = makeGraph();
    graph.updateNode(ASCENDANT_ID, { properties: { nextActionDiscount: 0.5 } } as never);

    const template = makeTemplate();
    const cast = preparePlayerCast({
      graph,
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 12,
      seed: 42,
      sphere: 'force',
      applyBuffs: false,
      essencePaid: 6,
    });

    expect(cast.essenceCost).toBe(6);
    expect(cast.buffsConsumed).toBe(false);
    // The one-shot buff is still on the node — a debug/intervention cast must
    // not spend a discount it never received.
    expect(graph.getNode(ASCENDANT_ID)?.properties.nextActionDiscount).toBe(0.5);
  });
});

describe('commitPlayerCast', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    clearTimelines();
  });

  function prepare(sphere: 'force' | null = 'force') {
    const template = makeTemplate();
    return preparePlayerCast({
      graph: makeGraph(),
      ascendantId: ASCENDANT_ID,
      template,
      templateId: template.id,
      targetId: TARGET_ID,
      tick: 12,
      seed: 42,
      sphere,
    });
  }

  it('deducts the cost from the cast sphere and appends the action', () => {
    const next = commitPlayerCast(makeState(), {
      cast: prepare(),
      event: { idPrefix: 'evt_action', message: 'The Ascendant acts.', isInterventionBeat: true },
    });

    expect(next.essencePool.force).toBe(4);
    expect(next.essencePool.matter).toBe(4);
    expect(next.unifiedActions).toHaveLength(1);
  });

  it('clamps the pool at zero rather than going negative', () => {
    const next = commitPlayerCast(makeState({ essencePool: { force: 2 } }), {
      cast: prepare(),
    });
    expect(next.essencePool.force).toBe(0);
  });

  it('charges nothing when the cast has no sphere', () => {
    const before = makeState();
    const next = commitPlayerCast(before, { cast: prepare(null) });
    expect(next.essencePool).toEqual(before.essencePool);
    expect(next.unifiedActions).toHaveLength(1);
  });

  it('pushes a narrative recentEvents entry carrying the caller prefix and copy', () => {
    const next = commitPlayerCast(makeState(), {
      cast: prepare(),
      event: {
        idPrefix: 'evt_target_action',
        message: 'The Ascendant sets the anvil ringing.',
        isInterventionBeat: false,
      },
    });

    expect(next.recentEvents).toHaveLength(1);
    const entry = next.recentEvents[0];
    expect(entry.id.startsWith('evt_target_action_12_')).toBe(true);
    expect(entry.type).toBe('narrative');
    expect(entry.message).toBe('The Ascendant sets the anvil ringing.');
    expect(entry.significance).toBe(PLAYER_CAST_EVENT_SIGNIFICANCE);
    expect(entry.sphere).toBe('force');
    expect(entry.isInterventionBeat).toBe(false);
  });

  it('honours a caller significance override (detected interventions read louder)', () => {
    const next = commitPlayerCast(makeState(), {
      cast: prepare(),
      event: {
        idPrefix: 'evt_intervention',
        message: 'detected!',
        isInterventionBeat: true,
        significance: 0.8,
      },
    });
    expect(next.recentEvents[0].significance).toBe(0.8);
  });

  it('appends the action without a narrative line when no event is supplied', () => {
    const next = commitPlayerCast(makeState(), { cast: prepare() });
    expect(next.unifiedActions).toHaveLength(1);
    expect(next.recentEvents).toHaveLength(0);
  });

  it('does not mutate the prior state', () => {
    const before = makeState();
    commitPlayerCast(before, { cast: prepare() });
    expect(before.unifiedActions).toHaveLength(0);
    expect(before.essencePool.force).toBe(10);
  });
});
