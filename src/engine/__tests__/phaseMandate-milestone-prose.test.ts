/**
 * THR-1197 — mandate stage transitions narrate from the authored prose.
 *
 * Before this wiring `MANDATE_MILESTONE_PROSE` had zero production importers: a
 * milestone advance emitted sphere pressure and no tick event at all, and the
 * completion event carried a hardcoded `Victory!` line while the authored
 * `completed` string for that same mandate sat unread in the same process.
 *
 * THR-1198 re-pointed the fixtures. The wiring assertion is unchanged; what moved
 * is which mandate stands for "authored". The run's spine was ruled
 * remembrance-derived, so the template prose was retired and this file's Dominion
 * of Stone fixture had nothing left to resolve — while `remembrance.witness`, its
 * example of a family with *no* authored prose, became one of the authored twelve.
 * Both cases now use ids a live game actually mints.
 *
 * The expectations below are **literal strings transcribed from
 * `src/data/mandate-remembrance-prose.ts`**, not `MANDATE_MILESTONE_PROSE[key]` on
 * both sides — a constant used as its own fixture is a tautology that passes
 * whether or not the wiring exists. Deleting the resolver call in
 * `phaseMandate.ts` turns these red.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import type { DoomClockState } from '../../types/doomClock';

// ─── Literal expectations, transcribed from src/data/mandate-remembrance-prose.ts ───

const WITNESS_SETUP_TO_ESCALATION =
  'The first threads of the network have taken. Somewhere a secret is moving toward you that nobody meant you to hear.';

const WITNESS_COMPLETED =
  'Nothing is hidden from you. Every whisper finds the silk and travels home. The world is transparent, and does not know it.';

// ─── Fixtures ──────────────────────────────────────────────────────────

/**
 * A remembrance mandate carrying the real `mandate.remembrance.witness` id — the
 * shape `generateRememberedMandate` mints on the identity path. Conditions are
 * left empty deliberately: `evaluateMandate` treats a stage with no conditions as
 * auto-complete, so each `phaseMandate` call advances exactly one stage. That
 * keeps the fixture about the prose wiring, not about condition math.
 */
function makeWitnessDefinition(): MandateDefinition {
  return {
    id: 'mandate.remembrance.witness',
    type: 'graph_state',
    name: 'Witness Ascendancy',
    description: 'Raise mind and spirit before the doom clock closes.',
    stages: [
      { stage: 'setup', description: 'Open.', conditions: [] },
      { stage: 'escalation', description: 'Hold.', conditions: [] },
      { stage: 'culmination', description: 'Crest.', conditions: [] },
    ],
  };
}

/**
 * An id belonging to no authored family, and carrying no `primarySphere`, so
 * neither resolution branch can hit. This is the fallback case.
 */
function makeUnauthoredDefinition(): MandateDefinition {
  return {
    id: 'mandate.no_such_family',
    type: 'graph_state',
    name: 'Unwritten Ascendancy',
    description: 'A mandate nobody wrote prose for.',
    stages: [
      { stage: 'setup', description: 'Open.', conditions: [] },
      { stage: 'escalation', description: 'Hold.', conditions: [] },
      { stage: 'culmination', description: 'Crest.', conditions: [] },
    ],
  };
}

function makeDoomClock(): DoomClockState {
  return {
    definitionArchetype: 'breach',
    currentTick: 0,
    totalTicks: 100,
    currentStage: 1,
    progress: 0,
    stageTransitions: [],
    expired: false,
    tickModifier: 1,
    nextEscalationSeverityModifier: 0,
    counterOmens: 0,
    resolvedEvents: [],
  };
}

function makeMandateState(definition: MandateDefinition): MandateState {
  return {
    mandateId: definition.id,
    currentStage: 'setup',
    progress: 0,
    completed: false,
    failed: false,
  };
}

function makeState(definition: MandateDefinition): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor_ascendant',
    type: 'actor',
    name: 'The Ascendant',
    properties: { actorType: 'ascendant' },
  });

  return {
    graph,
    ascendantId: 'actor_ascendant',
    tick: 7,
    tickEvents: [],
    pendingSpherePressures: [],
    doomClock: makeDoomClock(),
    mandateDefinition: definition,
    mandateState: makeMandateState(definition),
  } as unknown as GameState;
}

/** Run phaseMandate once, folding the returned slice back onto the state. */
function step(state: GameState): GameState {
  const patch = phaseMandate(state);
  return { ...state, ...patch } as GameState;
}

function mandateMessages(state: GameState): string[] {
  return state.tickEvents
    .filter((event) => event.type === 'mandate_progress')
    .map((event) => event.message);
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('THR-1197 — mandate milestone prose reaches tick events', () => {
  beforeEach(() => {
    resetMandateCounter();
  });

  it('emits the authored setup_to_escalation line when the first stage advances', () => {
    const after = step(makeState(makeWitnessDefinition()));

    expect(after.mandateState?.currentStage).toBe('escalation');
    expect(mandateMessages(after)).toContain(WITNESS_SETUP_TO_ESCALATION);
  });

  it('emits the authored completed line instead of the hardcoded Victory! string', () => {
    // setup → escalation → culmination → completed
    let state = makeState(makeWitnessDefinition());
    state = step(state);
    state = step(state);
    state = step(state);

    expect(state.mandateState?.completed).toBe(true);

    const messages = mandateMessages(state);
    expect(messages).toContain(WITNESS_COMPLETED);
    expect(messages.some((message) => message.includes('Victory!'))).toBe(false);
  });

  it('falls back to generated text for a mandate with no authored prose, without throwing', () => {
    const after = step(makeState(makeUnauthoredDefinition()));

    const messages = mandateMessages(after);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toContain('Unwritten Ascendancy');
    // The fallback must not borrow another mandate's authored line.
    expect(messages).not.toContain(WITNESS_SETUP_TO_ESCALATION);
  });

  /**
   * THR-1198 — the identity-less path. `generateRememberedMandate` mints
   * `remembrance.{primary}_{secondary}` when there is no remembrance identity,
   * a 132-key space authored per primary sphere. This asserts the sphere branch
   * reaches a tick event, which the exact-key tests above cannot cover.
   */
  it('narrates a pair-form mandate from its primary sphere family', () => {
    const definition: MandateDefinition = {
      id: 'mandate.remembrance.chaos_energy',
      type: 'graph_state',
      name: 'Chaos Ascendancy',
      description: 'Raise chaos and energy before the doom clock closes.',
      primarySphere: 'chaos',
      stages: [
        { stage: 'setup', description: 'Open.', conditions: [] },
        { stage: 'escalation', description: 'Hold.', conditions: [] },
        { stage: 'culmination', description: 'Crest.', conditions: [] },
      ],
    };

    const after = step(makeState(definition));

    // Transcribed from mandate-remembrance-prose.ts, sphere table.
    expect(mandateMessages(after)).toContain(
      'Chaos found its opening. Patterns that held for centuries are slipping, and nobody can say when it started.',
    );
  });
});
