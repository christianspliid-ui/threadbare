/**
 * THR-1197 — mandate stage transitions narrate from the authored JSON prose.
 *
 * Before this wiring `MANDATE_MILESTONE_PROSE` had zero production importers: a
 * milestone advance emitted sphere pressure and no tick event at all, and the
 * completion event carried a hardcoded `Victory!` line while the authored
 * `completed` string for that same mandate sat unread in the same process.
 *
 * The expectations below are **literal strings copied from the mandate JSON**, not
 * `MANDATE_MILESTONE_PROSE[key]` on both sides — a constant used as its own fixture
 * is a tautology that passes whether or not the wiring exists. Deleting the
 * resolver call in `phaseMandate.ts` turns these red.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import type { DoomClockState } from '../../types/doomClock';

// ─── Literal expectations, transcribed from src/data/mandates/dominion-of-stone.json ───

const DOMINION_SETUP_TO_ESCALATION =
  'Stone answers the call. Two settlements bend their walls toward your will. The architecture shifts—support beams align like prayer.';

const DOMINION_COMPLETED =
  'Five settlements stand as monuments to your reign. The world has been remade in stone and vision. You have shaped the very bones of the earth.';

// ─── Fixtures ──────────────────────────────────────────────────────────

/**
 * A legacy (graph_state) mandate carrying the real `mandate.dominion_of_stone` id.
 * Conditions are left empty deliberately: `evaluateMandate` treats a stage with no
 * conditions as auto-complete, so each `phaseMandate` call advances exactly one
 * stage. That keeps the fixture about the prose wiring, not about condition math.
 */
function makeDominionDefinition(): MandateDefinition {
  return {
    id: 'mandate.dominion_of_stone',
    type: 'graph_state',
    name: 'Dominion of Stone',
    description: 'Bend the settlements of the world toward your will.',
    stages: [
      { stage: 'setup', description: 'Claim the first walls.', conditions: [] },
      { stage: 'escalation', description: 'Four cities answer.', conditions: [] },
      { stage: 'culmination', description: 'The realm is blueprint.', conditions: [] },
    ],
  };
}

/** A generated remembrance mandate id — no authored prose exists for this family. */
function makeRemembranceDefinition(): MandateDefinition {
  return {
    id: 'mandate.remembrance.witness',
    type: 'sphere_dominance',
    name: 'Witness Ascendancy',
    description: 'Raise mind and spirit before the doom clock closes.',
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
    const after = step(makeState(makeDominionDefinition()));

    expect(after.mandateState?.currentStage).toBe('escalation');
    expect(mandateMessages(after)).toContain(DOMINION_SETUP_TO_ESCALATION);
  });

  it('emits the authored completed line instead of the hardcoded Victory! string', () => {
    // setup → escalation → culmination → completed
    let state = makeState(makeDominionDefinition());
    state = step(state);
    state = step(state);
    state = step(state);

    expect(state.mandateState?.completed).toBe(true);

    const messages = mandateMessages(state);
    expect(messages).toContain(DOMINION_COMPLETED);
    expect(messages.some((message) => message.includes('Victory!'))).toBe(false);
  });

  it('falls back to generated text for a mandate with no authored prose, without throwing', () => {
    const after = step(makeState(makeRemembranceDefinition()));

    const messages = mandateMessages(after);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toContain('Witness Ascendancy');
    // The fallback must not borrow another mandate's authored line.
    expect(messages).not.toContain(DOMINION_SETUP_TO_ESCALATION);
  });
});
