// @vitest-environment jsdom
/**
 * THR-2250 — the ceremony's reckon line: under the ending line, a Mandate ending links the
 * place or mortal that raised it most, and a Doom ending names how far the Mandate came.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AgeTwilightScreen } from '../AgeTwilightScreen';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../../../engine/gameInit';
import { computeHarvest, startTwilight } from '../../../engine/cycleEnd';
import { buildTwilightBeats } from '../../../engine/twilight';
import type { GameState } from '../../../types/gameState';

function world(): GameState {
  const state = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(state);
  return state;
}

function withMandate(state: GameState, mandate: Partial<NonNullable<GameState['mandateState']>>): GameState {
  const def = state.mandateDefinition ?? ({ id: 'mandate.test' } as NonNullable<GameState['mandateDefinition']>);
  const base = state.mandateState ?? ({ mandateId: def.id, currentStage: 'growth', progress: 0, failed: false } as NonNullable<GameState['mandateState']>);
  return {
    ...state,
    mandateDefinition: { ...def, name: 'the Hunger for Order' },
    mandateState: { ...base, ...mandate } as NonNullable<GameState['mandateState']>,
  };
}

function renderFor(state: GameState) {
  const twilight = startTwilight(state);
  const beats = buildTwilightBeats(twilight, computeHarvest(twilight), twilight.cycle);
  render(<AgeTwilightScreen beats={beats} gameState={twilight} primarySphere="order" remembered onContinue={() => undefined} />);
  return beats;
}

describe('THR-2250 — AgeTwilightScreen reckon line', () => {
  it('a Mandate ending links the place that raised it most', () => {
    const base = world();
    const place = base.graph.getNodesByType('location').find(n => n.name?.trim())!;
    const beats = renderFor(withMandate(base, { completed: true, progress: 1, godHeld: { [`${place.id}|order`]: 10 } }));
    const line = screen.getByTestId('age-twilight-reckon');
    expect(line.textContent).toBe(`Most of it was raised at ${place.name}.`);
    expect(line.textContent).toBe(beats.ending.reckon);
    // The name is its own EntityLink element (a plain span without a router mounted).
    expect(within(line).getByText(place.name).textContent).toBe(place.name);
  });

  it('a Doom ending names the Mandate with its tooltip and a word, never a number', () => {
    const base = { ...world(), doomDefinition: { ...world().doomDefinition, archetype: 'breach' as const } };
    renderFor(withMandate(base, { completed: false, progress: 0.8 }));
    const line = screen.getByTestId('age-twilight-reckon');
    expect(line.textContent).toBe('The Hunger for Order stood within reach.');
    expect(screen.getByTestId('age-twilight-reckon-mandate').textContent).toBe('The Hunger for Order');
    expect(screen.getByTestId('age-twilight').textContent).not.toMatch(/\d/);
  });

  it('no reckon, no line', () => {
    const base = world();
    renderFor(withMandate(base, { completed: true, progress: 1, godHeld: {} }));
    expect(screen.queryByTestId('age-twilight-reckon')).toBeNull();
  });
});
